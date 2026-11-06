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
const ASPHALT = new THREE.Color("#2E3544");

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

function buildRibbon(
  circuit: Circuit,
  segments: number,
  width: number,
  thickness: number,
  yLift: number,
  paint: "speed" | "asphalt",
) {
  const { curve } = circuitCurve(circuit);
  const positions: number[] = [];
  const colors: number[] = [];
  const color = new THREE.Color();
  const p = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const side = new THREE.Vector3();
  const roadUp = new THREE.Vector3();
  const lastSide = new THREE.Vector3(1, 0, 0);
  const rings = segments;

  for (let i = 0; i < rings; i += 1) {
    const t = i / rings;
    curve.getPointAt(t, p);
    curve.getTangentAt(t, tan).normalize();
    side.copy(tan).cross(UP);
    if (side.lengthSq() < 1e-6) {
      side.copy(lastSide).cross(tan);
      if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    }
    side.normalize();
    lastSide.copy(side);
    roadUp.copy(side).cross(tan).normalize();
    if (roadUp.dot(UP) < 0) {
      roadUp.negate();
      side.negate();
      lastSide.copy(side);
    }

    if (paint === "speed") {
      speedToColor(sampleChannel(circuit.speed, t), sampleChannel(circuit.brake, t), color);
    } else {
      color.copy(ASPHALT);
    }

    const halfW = width / 2;
    const offsets: [number, number][] = [
      [halfW, thickness + yLift],
      [-halfW, thickness + yLift],
      [halfW, yLift],
      [-halfW, yLift],
    ];
    for (const [sx, uy] of offsets) {
      positions.push(
        p.x + side.x * sx + roadUp.x * uy,
        p.y + side.y * sx + roadUp.y * uy,
        p.z + side.z * sx + roadUp.z * uy,
      );
      colors.push(color.r, color.g, color.b);
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < rings; i += 1) {
    const a = i * 4;
    const b = ((i + 1) % rings) * 4;
    indices.push(a, b, a + 1, a + 1, b, b + 1);
    indices.push(a + 2, a + 3, b + 2, a + 3, b + 3, b + 2);
    indices.push(a, a + 2, b, a + 2, b + 2, b);
    indices.push(a + 1, b + 1, a + 3, a + 3, b + 1, b + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function Road({ circuit, mobile }: { circuit: Circuit; mobile: boolean }) {
  const segments = mobile ? 110 : 220;
  const asphalt = useMemo(
    () => buildRibbon(circuit, segments, mobile ? 2.5 : 3.05, mobile ? 0.26 : 0.38, 0, "asphalt"),
    [circuit, segments, mobile],
  );
  const speed = useMemo(
    () => buildRibbon(circuit, segments, mobile ? 1.45 : 1.78, 0.12, mobile ? 0.28 : 0.4, "speed"),
    [circuit, segments, mobile],
  );
  const line = useMemo(
    () => buildRibbon(circuit, segments, mobile ? 0.18 : 0.22, 0.06, mobile ? 0.42 : 0.56, "speed"),
    [circuit, segments, mobile],
  );

  return (
    <group>
      <mesh geometry={asphalt} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.86} metalness={0.04} color="#5C6574" />
      </mesh>
      <mesh geometry={speed} castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.18}
          metalness={0.42}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>
      <mesh geometry={line}>
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
      <pointLight ref={glow} intensity={18} distance={14} color="#fff3d0" />
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
  return <pointLight ref={light} intensity={48} distance={44} color="#fff4dc" />;
}

function Post({ mobile }: { mobile: boolean }) {
  if (mobile) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.34} luminanceThreshold={0.46} mipmapBlur luminanceSmoothing={0.16} />
      <Vignette darkness={0.22} offset={0.38} />
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
      <color attach="background" args={["#1A2332"]} />
      <fog attach="fog" args={["#1E2A3C", 32, 150]} />
      <hemisphereLight args={["#c9d8ee", "#2a241c", 1.05]} />
      <directionalLight position={[20, 40, 10]} intensity={3.1} color="#fff6e8" castShadow={!mobile} />
      <directionalLight position={[-22, 10, -12]} intensity={1.15} color="#7ea0c8" />
      <ambientLight intensity={0.42} color="#9aa8be" />
      <TrackLight circuit={circuit} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -8, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#121820" roughness={1} />
      </mesh>
      <Road circuit={circuit} mobile={mobile} />
      <CarBead circuit={circuit} />
      <RoundPins circuit={circuit} stops={stops} />
      <CameraRig circuit={circuit} stops={stops} mobile={mobile} />
      <Post mobile={mobile} />
    </>
  );
}
