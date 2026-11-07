"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { circuitCurve, sampleChannel } from "@/lib/curve";
import { brakeAmount } from "@/lib/stops";
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
  // Drop the duplicate end sample; wrap indices for a closed lap
  const rings = segments;
  // Soft-close: rotate the last half of normals toward the start to hide the join
  const startN = frames.normals[0].clone();
  for (let i = Math.floor(rings * 0.85); i < rings; i += 1) {
    const mix = (i - rings * 0.85) / (rings * 0.15);
    frames.normals[i].lerp(startN, mix * 0.5).normalize();
    frames.binormals[i]
      .crossVectors(frames.tangents[i], frames.normals[i])
      .normalize();
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

function buildAsphaltBed(curve: THREE.CatmullRomCurve3, segments: number, width: number) {
  const frames = parallelFrames(curve, segments);
  const rings = segments;
  const startN = frames.normals[0].clone();
  for (let i = Math.floor(rings * 0.85); i < rings; i += 1) {
    const mix = (i - rings * 0.85) / (rings * 0.15);
    frames.normals[i].lerp(startN, mix * 0.5).normalize();
    frames.binormals[i].crossVectors(frames.tangents[i], frames.normals[i]).normalize();
  }

  const half = width / 2;
  const verts: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < rings; i += 1) {
    const p = frames.points[i];
    const N = frames.normals[i];
    const B = frames.binormals[i];
    // Slight lift along binormal so the bed sits under the glowing tube
    const lift = -0.02;
    for (const sx of [half, -half]) {
      verts.push(
        p.x + N.x * sx + B.x * lift,
        p.y + N.y * sx + B.y * lift,
        p.z + N.z * sx + B.z * lift,
      );
    }
  }
  for (let i = 0; i < rings; i += 1) {
    const a = i * 2;
    const b = ((i + 1) % rings) * 2;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Road({ circuit, mobile }: { circuit: Circuit; mobile: boolean }) {
  const segments = mobile ? 320 : 560;
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);

  const asphalt = useMemo(
    () => buildAsphaltBed(curve, segments, mobile ? 2.2 : 2.7),
    [curve, segments, mobile],
  );
  const racing = useMemo(
    () => buildSmoothTube(curve, segments, mobile ? 0.24 : 0.32, 10, circuit),
    [curve, segments, mobile, circuit],
  );
  const core = useMemo(
    () => buildSmoothTube(curve, segments, mobile ? 0.08 : 0.11, 6, circuit),
    [curve, segments, mobile, circuit],
  );

  return (
    <group>
      <mesh geometry={asphalt} receiveShadow>
        <meshStandardMaterial
          color="#2A3342"
          roughness={0.96}
          metalness={0.04}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh geometry={racing}>
        <meshStandardMaterial
          vertexColors
          roughness={0.2}
          metalness={0.45}
          emissive="#ffffff"
          emissiveIntensity={0.32}
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
      mesh.current.position.copy(_pos).addScaledVector(UP, 0.72);
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

function RoundPins({ circuit, stops }: { circuit: Circuit; stops: ContentStop[] }) {
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  return (
    <group>
      {stops
        .filter((stop) => stop.kind === "round")
        .map((stop) => {
          const point = curve.getPointAt(stop.t);
          const completed = stop.round.status === "completed";
          return (
            <group key={`${stop.round.round}-${stop.round.circuitId}`} position={point}>
              <mesh position={[0, completed ? 1.35 : 0.85, 0]}>
                <cylinderGeometry args={[0.045, 0.045, completed ? 2.2 : 1.4, 8]} />
                <meshStandardMaterial
                  color={completed ? "#F4EFE4" : "#7d8594"}
                  emissive={completed ? "#d8d0c0" : "#000"}
                  emissiveIntensity={completed ? 0.32 : 0}
                />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}

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
      <RoundPins circuit={circuit} stops={stops} />
      <CameraRig circuit={circuit} stops={stops} mobile={mobile} />
      <Post mobile={mobile} />
    </>
  );
}
