"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { circuitCurve, sampleChannel } from "@/lib/curve";
import { flagSrc } from "@/lib/flags";
import { brakeAmount, FINISH_T } from "@/lib/stops";
import { lapRef } from "@/lib/lap-store";
import type { Circuit, ContentStop } from "@/lib/types";

const UP = new THREE.Vector3(0, 1, 0);
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _look = new THREE.Vector3();
const _cam = new THREE.Vector3();
const _side = new THREE.Vector3();
const BRAKE = new THREE.Color("#FF2A12");
const LOW = new THREE.Color("#3D7CFF");
const MID = new THREE.Color("#FFC43A");
const HOT = new THREE.Color("#FFF3C0");

function speedToColor(speed: number, brake: number, target: THREE.Color) {
  if (brake > 0.38) {
    target.copy(BRAKE).lerp(MID, 1 - brake);
    return;
  }
  if (speed < 0.42) {
    target.copy(LOW).lerp(MID, speed / 0.42);
    return;
  }
  target.copy(MID).lerp(HOT, (speed - 0.42) / 0.58);
}

/**
 * Parallel-transport frames (Bishop) — avoids Frenet flips that tear TubeGeometry at inflection points.
 */
function parallelFrames(curve: THREE.CatmullRomCurve3, segments: number) {
  const tangents: THREE.Vector3[] = [];
  const normals: THREE.Vector3[] = [];
  const binormals: THREE.Vector3[] = [];
  const points: THREE.Vector3[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const u = i / segments;
    points.push(curve.getPointAt(u));
    tangents.push(curve.getTangentAt(u).normalize());
  }

  const n0 = new THREE.Vector3().crossVectors(tangents[0], UP);
  if (n0.lengthSq() < 1e-8) n0.set(1, 0, 0);
  n0.normalize();
  normals.push(n0);
  binormals.push(new THREE.Vector3().crossVectors(tangents[0], n0).normalize());

  for (let i = 1; i <= segments; i += 1) {
    const prevT = tangents[i - 1];
    const t = tangents[i];
    const n = normals[i - 1].clone();
    const axis = new THREE.Vector3().crossVectors(prevT, t);
    if (axis.lengthSq() > 1e-10) {
      const angle = Math.acos(THREE.MathUtils.clamp(prevT.dot(t), -1, 1));
      n.applyAxisAngle(axis.normalize(), angle);
    }
    n.addScaledVector(t, -n.dot(t)).normalize();
    normals.push(n);
    binormals.push(new THREE.Vector3().crossVectors(t, n).normalize());
  }

  return { points, tangents, normals, binormals };
}

function buildSmoothTube(
  curve: THREE.CatmullRomCurve3,
  segments: number,
  radius: number,
  radialSegments: number,
  circuit: Circuit | null,
) {
  const frames = parallelFrames(curve, segments);
  const rings = segments;
  // Soft-close: rotate the last stretch of normals toward the start to hide the join
  const startN = frames.normals[0].clone();
  for (let i = Math.floor(rings * 0.85); i < rings; i += 1) {
    const mix = (i - rings * 0.85) / (rings * 0.15);
    frames.normals[i].lerp(startN, mix * 0.5).normalize();
    frames.binormals[i].crossVectors(frames.tangents[i], frames.normals[i]).normalize();
  }

  const verts: number[] = [];
  const cols: number[] = [];
  const indices: number[] = [];
  const color = new THREE.Color("#3A4454");
  const radial = radialSegments;

  for (let i = 0; i < rings; i += 1) {
    const t = i / rings;
    if (circuit) {
      speedToColor(sampleChannel(circuit.speed, t), sampleChannel(circuit.brake, t), color);
    } else {
      color.set("#2F3848");
    }
    const p = frames.points[i];
    const N = frames.normals[i];
    const B = frames.binormals[i];
    for (let j = 0; j < radial; j += 1) {
      const v = (j / radial) * Math.PI * 2;
      const cx = -Math.cos(v);
      const cy = Math.sin(v);
      verts.push(
        p.x + radius * (cx * N.x + cy * B.x),
        p.y + radius * (cx * N.y + cy * B.y),
        p.z + radius * (cx * N.z + cy * B.z),
      );
      cols.push(color.r, color.g, color.b);
    }
  }

  for (let i = 0; i < rings; i += 1) {
    const i2 = (i + 1) % rings;
    for (let j = 0; j < radial; j += 1) {
      const j2 = (j + 1) % radial;
      const a = i * radial + j;
      const b = i2 * radial + j;
      const c = i2 * radial + j2;
      const d = i * radial + j2;
      indices.push(a, b, d, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/* ---------- Road ---------- */

type RoadFrame = { p: THREE.Vector3; t: THREE.Vector3; side: THREE.Vector3 };

/** Flat road frames: the width axis is always horizontal, so the asphalt never twists into a wall. */
function roadFrames(curve: THREE.CatmullRomCurve3, segments: number): RoadFrame[] {
  const frames: RoadFrame[] = [];
  for (let i = 0; i < segments; i += 1) {
    const u = i / segments;
    const p = curve.getPointAt(u);
    const t = curve.getTangentAt(u).normalize();
    const side = new THREE.Vector3().crossVectors(t, UP);
    if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
    side.normalize();
    frames.push({ p, t, side });
  }
  return frames;
}

/** A closed strip between two lateral offsets from the centreline. */
function buildStrip(frames: RoadFrame[], inner: number, outer: number, lift: number) {
  const verts: number[] = [];
  const indices: number[] = [];
  const n = frames.length;
  for (const { p, side } of frames) {
    verts.push(p.x + side.x * inner, p.y + lift, p.z + side.z * inner);
    verts.push(p.x + side.x * outer, p.y + lift, p.z + side.z * outer);
  }
  for (let i = 0; i < n; i += 1) {
    const a = i * 2;
    const b = ((i + 1) % n) * 2;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

const KERB_RED = new THREE.Color("#E10600");
const KERB_WHITE = new THREE.Color("#F4F1EA");

/** Red/white kerbs on both edges wherever the line actually turns. */
function buildKerbs(frames: RoadFrame[], half: number, width: number) {
  const n = frames.length;
  const verts: number[] = [];
  const cols: number[] = [];
  const turning: boolean[] = [];
  for (let i = 0; i < n; i += 1) {
    const a = frames[(i - 3 + n) % n].t;
    const b = frames[(i + 3) % n].t;
    turning.push(a.angleTo(b) > 0.16);
  }
  // Grow each kerb a little so short corners still read
  const grown = turning.map((_, i) => turning[(i - 2 + n) % n] || turning[i] || turning[(i + 2) % n]);
  for (let i = 0; i < n; i += 1) {
    if (!grown[i]) continue;
    const f0 = frames[i];
    const f1 = frames[(i + 1) % n];
    const colour = Math.floor(i / 2) % 2 === 0 ? KERB_RED : KERB_WHITE;
    for (const dir of [1, -1]) {
      const o0 = dir * half;
      const o1 = dir * (half + width);
      const lift = 0.035;
      const q = [
        [f0.p.x + f0.side.x * o0, f0.p.y + lift, f0.p.z + f0.side.z * o0],
        [f0.p.x + f0.side.x * o1, f0.p.y + lift, f0.p.z + f0.side.z * o1],
        [f1.p.x + f1.side.x * o0, f1.p.y + lift, f1.p.z + f1.side.z * o0],
        [f1.p.x + f1.side.x * o1, f1.p.y + lift, f1.p.z + f1.side.z * o1],
      ];
      for (const k of [0, 2, 1, 1, 2, 3]) {
        verts.push(q[k][0], q[k][1], q[k][2]);
        cols.push(colour.r, colour.g, colour.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(cols, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function Road({ circuit, mobile }: { circuit: Circuit; mobile: boolean }) {
  const segments = mobile ? 480 : 900;
  const half = mobile ? 1.35 : 1.6;
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  const frames = useMemo(() => roadFrames(curve, segments), [curve, segments]);

  const asphalt = useMemo(() => buildStrip(frames, -half, half, 0), [frames, half]);
  const runoff = useMemo(() => buildStrip(frames, -half - 2.6, half + 2.6, -0.06), [frames, half]);
  const edgeL = useMemo(() => buildStrip(frames, -half + 0.08, -half + 0.16, 0.02), [frames, half]);
  const edgeR = useMemo(() => buildStrip(frames, half - 0.16, half - 0.08, 0.02), [frames, half]);
  const kerbs = useMemo(() => buildKerbs(frames, half, 0.42), [frames, half]);
  const racingCurve = useMemo(() => {
    // The racing line rides just above the asphalt
    const pts = curve
      .getSpacedPoints(segments)
      .slice(0, -1)
      .map((p) => p.clone().addScaledVector(UP, 0.16));
    return new THREE.CatmullRomCurve3(pts, true, "catmullrom", 0.35);
  }, [curve, segments]);
  const racing = useMemo(
    () => buildSmoothTube(racingCurve, segments, mobile ? 0.16 : 0.19, 10, circuit),
    [racingCurve, segments, mobile, circuit],
  );
  const core = useMemo(
    () => buildSmoothTube(racingCurve, segments, mobile ? 0.06 : 0.075, 6, circuit),
    [racingCurve, segments, mobile, circuit],
  );

  return (
    <group>
      <mesh geometry={runoff}>
        <meshStandardMaterial color="#151C26" roughness={1} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={asphalt} receiveShadow>
        <meshStandardMaterial color="#363D49" roughness={0.92} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={edgeL}>
        <meshBasicMaterial color="#E9E5DA" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={edgeR}>
        <meshBasicMaterial color="#E9E5DA" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={kerbs}>
        <meshStandardMaterial
          vertexColors
          roughness={0.55}
          emissive="#ffffff"
          emissiveIntensity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={racing}>
        <meshStandardMaterial
          vertexColors
          roughness={0.2}
          metalness={0.45}
          emissive="#ffffff"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh geometry={core}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
    </group>
  );
}

function CarBead({ circuit }: { circuit: Circuit }) {
  const mesh = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.PointLight>(null);
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  useFrame(() => {
    const t = ((lapRef.t % 1) + 1) % 1;
    curve.getPointAt(t, _pos);
    curve.getTangentAt(t, _tan).normalize();
    if (mesh.current) {
      mesh.current.position.copy(_pos).addScaledVector(UP, 0.5);
      mesh.current.lookAt(_pos.clone().add(_tan));
    }
    if (glow.current) glow.current.position.copy(_pos).addScaledVector(UP, 1.1);
  });
  return (
    <group>
      <mesh ref={mesh}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshBasicMaterial color="#FFF6D6" toneMapped={false} />
      </mesh>
      <pointLight ref={glow} intensity={9} distance={10} color="#fff3d0" />
    </group>
  );
}

/* ---------- Flags ---------- */

const flagCache = new Map<string, Promise<THREE.Texture>>();

/** Rasterise a local flag SVG (it has no intrinsic size) onto a canvas texture. */
function loadFlagTexture(src: string) {
  let pending = flagCache.get(src);
  if (!pending) {
    pending = fetch(src)
      .then((res) => res.text())
      .then(
        (svg) =>
          new Promise<THREE.Texture>((resolve, reject) => {
            const sized = svg.replace("<svg", '<svg width="640" height="480" preserveAspectRatio="none"');
            const url = URL.createObjectURL(new Blob([sized], { type: "image/svg+xml" }));
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 384;
              canvas.height = 256;
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                reject(new Error("no 2d context"));
                return;
              }
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              URL.revokeObjectURL(url);
              const texture = new THREE.CanvasTexture(canvas);
              texture.colorSpace = THREE.SRGBColorSpace;
              texture.anisotropy = 4;
              resolve(texture);
            };
            img.onerror = reject;
            img.src = url;
          }),
      );
    flagCache.set(src, pending);
  }
  return pending;
}

function useFlagTexture(src: string | null) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    loadFlagTexture(src)
      .then((tex) => {
        if (alive) setTexture(tex);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [src]);
  return texture;
}

let checkerTexture: THREE.CanvasTexture | null = null;
function getCheckerTexture() {
  if (checkerTexture) return checkerTexture;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const cell = 32;
    for (let y = 0; y < canvas.height / cell; y += 1) {
      for (let x = 0; x < canvas.width / cell; x += 1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? "#F7F5EF" : "#0B0D10";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
  }
  checkerTexture = new THREE.CanvasTexture(canvas);
  checkerTexture.colorSpace = THREE.SRGBColorSpace;
  checkerTexture.wrapS = THREE.RepeatWrapping;
  checkerTexture.wrapT = THREE.RepeatWrapping;
  return checkerTexture;
}

const FLAG_W = 1.9;
const FLAG_H = 1.27;
const FLAG_SEG_X = 18;
const FLAG_SEG_Y = 6;

/** A cloth flag hanging off a pole at local x=0 and waving outward along +x. */
function WavingFlag({
  texture,
  width = FLAG_W,
  height = FLAG_H,
  phase = 0,
  opacity = 1,
  glow = 0.38,
  toneMapped = false,
}: {
  texture: THREE.Texture | null;
  width?: number;
  height?: number;
  phase?: number;
  opacity?: number;
  glow?: number;
  toneMapped?: boolean;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, height, FLAG_SEG_X, FLAG_SEG_Y);
    g.translate(width / 2, -height / 2, 0);
    return g;
  }, [width, height]);
  const base = useMemo(() => Float32Array.from(geometry.attributes.position.array), [geometry]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const mesh = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const cloth = mesh.current?.geometry;
    if (!cloth) return;
    const time = clock.elapsedTime * 3.1 + phase;
    const pos = cloth.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = base[i * 3];
      const y = base[i * 3 + 1];
      const pin = x / width;
      const wave = Math.sin(x * 2.6 - time) * 0.16 + Math.sin(x * 4.4 - time * 1.4 + y * 1.2) * 0.05;
      pos.setZ(i, wave * pin);
      pos.setY(i, y - pin * pin * 0.12 * (1 + Math.sin(time * 0.5) * 0.3));
    }
    pos.needsUpdate = true;
    cloth.computeVertexNormals();
  });

  return (
    <mesh ref={mesh} geometry={geometry}>
      {/* Keyed on the texture: a map arriving after first compile needs a fresh shader */}
      <meshStandardMaterial
        key={texture?.uuid ?? "blank"}
        map={texture ?? undefined}
        emissiveMap={texture ?? undefined}
        emissive={texture ? "#ffffff" : "#000000"}
        emissiveIntensity={glow}
        color={texture ? "#ffffff" : "#6b7280"}
        roughness={0.75}
        side={THREE.DoubleSide}
        transparent={opacity < 1}
        opacity={opacity}
        toneMapped={toneMapped}
      />
    </mesh>
  );
}

/** Place a group beside the road at a lap position, facing back down the track toward the camera. */
function trackside(curve: THREE.CatmullRomCurve3, t: number, offset: number) {
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t).normalize();
  const side = new THREE.Vector3().crossVectors(tan, UP);
  if (side.lengthSq() < 1e-8) side.set(1, 0, 0);
  side.normalize();
  const base = p.clone().addScaledVector(side, offset);
  // local x = outward from the road, y = up, z = toward the oncoming camera
  const outward = side.clone().multiplyScalar(offset < 0 ? -1 : 1);
  const z = new THREE.Vector3().crossVectors(outward, UP).normalize();
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(outward, UP, z),
  );
  return { base, quaternion };
}

function RoundFlag({
  curve,
  t,
  country,
  completed,
  index,
}: {
  curve: THREE.CatmullRomCurve3;
  t: number;
  country: string;
  completed: boolean;
  index: number;
}) {
  const texture = useFlagTexture(flagSrc(country));
  const side = index % 2 === 0 ? 1 : -1;
  const { base, quaternion } = useMemo(() => trackside(curve, t, side * 2.9), [curve, t, side]);
  const poleH = completed ? 3.6 : 2.7;
  const scale = completed ? 1 : 0.8;
  return (
    <group position={base} quaternion={quaternion}>
      <mesh position={[0, poleH / 2, 0]}>
        <cylinderGeometry args={[0.045, 0.06, poleH, 10]} />
        <meshStandardMaterial color="#D9DDE3" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, poleH + 0.07, 0]}>
        <sphereGeometry args={[0.1, 12, 12]} />
        <meshStandardMaterial
          color={completed ? "#F5C542" : "#8A919C"}
          emissive={completed ? "#F5C542" : "#000000"}
          emissiveIntensity={completed ? 0.6 : 0}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      <group position={[0.04, poleH - 0.04, 0]}>
        <WavingFlag
          texture={texture}
          phase={index * 0.9}
          opacity={completed ? 1 : 0.6}
          glow={completed ? 0.42 : 0.15}
          width={FLAG_W * scale}
          height={FLAG_H * scale}
        />
      </group>
    </group>
  );
}

function RoundFlags({ circuit, stops }: { circuit: Circuit; stops: ContentStop[] }) {
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  return (
    <group>
      {stops.map((stop, index) =>
        stop.kind === "round" ? (
          <RoundFlag
            key={`${stop.round.round}-${stop.round.circuitId}`}
            curve={curve}
            t={stop.t}
            country={stop.round.country}
            completed={stop.round.status === "completed"}
            index={index}
          />
        ) : null,
      )}
    </group>
  );
}

/** Start/finish gantry at t=0: the lap, and the season, ends under the chequered flag. */
function FinishGantry({ circuit }: { circuit: Circuit }) {
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  const checker = useMemo(() => getCheckerTexture(), []);
  const lineTexture = useMemo(() => {
    const tex = checker.clone();
    tex.repeat.set(4, 1);
    tex.needsUpdate = true;
    return tex;
  }, [checker]);
  const { base, quaternion } = useMemo(() => trackside(curve, FINISH_T, 0.0001), [curve]);
  const span = 6.4;
  const height = 4.8;
  return (
    <group position={base} quaternion={quaternion}>
      {/* Chequered line painted across the asphalt */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.3, 0.7]} />
        <meshBasicMaterial map={lineTexture} side={THREE.DoubleSide} />
      </mesh>
      {[-span / 2, span / 2].map((x) => (
        <mesh key={x} position={[x, height / 2, 0]}>
          <boxGeometry args={[0.22, height, 0.22]} />
          <meshStandardMaterial color="#1A1F27" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, height, 0]}>
        <boxGeometry args={[span + 0.3, 0.95, 0.24]} />
        <meshStandardMaterial
          map={checker}
          emissiveMap={checker}
          emissive="#ffffff"
          emissiveIntensity={0.35}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, height + 0.62, 0]}>
        <boxGeometry args={[span + 0.3, 0.28, 0.26]} />
        <meshBasicMaterial color="#E10600" toneMapped={false} />
      </mesh>
      {/* Two big chequered flags flying off the gantry */}
      <group position={[span / 2 + 0.1, height + 2.0, 0]}>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.1, 8]} />
          <meshStandardMaterial color="#D9DDE3" metalness={0.85} roughness={0.25} />
        </mesh>
        <WavingFlag texture={checker} width={2.4} height={1.6} phase={0.4} glow={0.12} toneMapped />
      </group>
      <group position={[-span / 2 - 0.1, height + 2.0, 0]} rotation={[0, Math.PI, 0]}>
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 2.1, 8]} />
          <meshStandardMaterial color="#D9DDE3" metalness={0.85} roughness={0.25} />
        </mesh>
        <WavingFlag texture={checker} width={2.4} height={1.6} phase={2.1} glow={0.12} toneMapped />
      </group>
    </group>
  );
}

/* ---------- Camera & lighting ---------- */

function CameraRig({
  circuit,
  stops,
  mobile,
}: {
  circuit: Circuit;
  stops: ContentStop[];
  mobile: boolean;
}) {
  const { camera } = useThree();
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  const smoothed = useRef(0);
  const fov = useRef(42);
  const shake = useRef(0);

  useFrame((_, delta) => {
    const target = lapRef.t;
    const brake = brakeAmount(stops, target);
    const leaving = brake < 0.18 && Math.abs(lapRef.v) > 0.35;
    smoothed.current = THREE.MathUtils.damp(
      smoothed.current,
      target,
      brake > 0.4 ? 1.55 : leaving ? 7.2 : 5.1,
      delta,
    );
    const t = ((smoothed.current % 1) + 1) % 1;
    const speed = sampleChannel(circuit.speed, t);
    const scroll = Math.min(1, Math.abs(lapRef.v) / 1.55);
    const launch = THREE.MathUtils.clamp(speed * 0.55 + scroll * 0.7, 0, 1) * (1 - brake * 0.85);
    shake.current = THREE.MathUtils.damp(shake.current, launch * 0.12, 8, delta);

    curve.getPointAt(t, _pos);
    curve.getTangentAt(t, _tan).normalize();
    curve.getPointAt((t + 0.038 + launch * 0.042) % 1, _look);
    _side.copy(_tan).cross(UP);
    if (_side.lengthSq() < 1e-6) _side.set(1, 0, 0);
    else _side.normalize();

    const height = (mobile ? 5.4 : 4.35) + brake * 2.6 - launch * 1.55;
    const back = (mobile ? 13.2 : 11.2) + launch * 7.4 - brake * 4.2;
    _cam.copy(_pos).addScaledVector(UP, height).addScaledVector(_tan, -back);
    _cam.addScaledVector(_side, 0.12 + Math.sin(t * 40) * shake.current);

    camera.position.lerp(_cam, 1 - Math.exp(-(brake > 0.4 ? 3.4 : 6.4) * delta));
    camera.up.lerp(UP, 0.3);
    camera.lookAt(_look.addScaledVector(UP, 0.45 + brake * 0.5));

    const nextFov = 36 + launch * (mobile ? 16 : 26) - brake * 12;
    fov.current = THREE.MathUtils.damp(fov.current, nextFov, brake > 0.4 ? 2.6 : 5.8, delta);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = fov.current;
    persp.near = 0.18;
    persp.far = 320;
    persp.updateProjectionMatrix();
  });

  return null;
}

function TrackLight({ circuit }: { circuit: Circuit }) {
  const light = useRef<THREE.PointLight>(null);
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  useFrame(() => {
    if (!light.current) return;
    const t = ((lapRef.t % 1) + 1) % 1;
    curve.getPointAt(t, _pos);
    curve.getTangentAt(t, _tan).normalize();
    light.current.position.copy(_pos).addScaledVector(_tan, 4.2).addScaledVector(UP, 3.4);
  });
  return <pointLight ref={light} intensity={52} distance={48} color="#fff4dc" />;
}

function Post({ mobile }: { mobile: boolean }) {
  if (mobile) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.28} luminanceThreshold={0.52} mipmapBlur luminanceSmoothing={0.2} />
      <Vignette darkness={0.28} offset={0.34} />
    </EffectComposer>
  );
}

export function CircuitScene({
  circuit,
  stops,
  mobile,
}: {
  circuit: Circuit;
  stops: ContentStop[];
  mobile: boolean;
}) {
  return (
    <>
      <color attach="background" args={["#0E141C"]} />
      <fog attach="fog" args={["#121A24", 28, 140]} />
      <hemisphereLight args={["#b8c8de", "#1a1612", 0.95]} />
      <directionalLight position={[18, 36, 12]} intensity={2.85} color="#fff6e8" castShadow={!mobile} />
      <directionalLight position={[-20, 12, -14]} intensity={1.05} color="#6e90b8" />
      <ambientLight intensity={0.36} color="#8a98ae" />
      <TrackLight circuit={circuit} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#0A0E14" roughness={1} />
      </mesh>
      <Road circuit={circuit} mobile={mobile} />
      <CarBead circuit={circuit} />
      <RoundFlags circuit={circuit} stops={stops} />
      <FinishGantry circuit={circuit} />
      <CameraRig circuit={circuit} stops={stops} mobile={mobile} />
      <Post mobile={mobile} />
    </>
  );
}
