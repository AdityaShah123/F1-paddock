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
const BRAKE = new THREE.Color("#FF3B18");
const LOW = new THREE.Color("#6EA0FF");
const MID = new THREE.Color("#F6D56A");
const HOT = new THREE.Color("#FFE4A8");
const ASPHALT = new THREE.Color("#4A5568");

function speedToColor(speed: number, brake: number, target: THREE.Color) {
  if (brake > 0.42) {
    target.copy(BRAKE).lerp(MID, 1 - brake);
    return;
  }
  if (speed < 0.45) {
    target.copy(LOW).lerp(MID, speed / 0.45);
    return;
  }
  target.copy(MID).lerp(HOT, (speed - 0.45) / 0.55);
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
  const segments = mobile ? 110 : 200;
  const asphalt = useMemo(
    () => buildRibbon(circuit, segments, mobile ? 2.35 : 2.85, mobile ? 0.22 : 0.32, 0, "asphalt"),
    [circuit, segments, mobile],
  );
  const speed = useMemo(
    () => buildRibbon(circuit, segments, mobile ? 1.55 : 1.92, 0.1, mobile ? 0.24 : 0.34, "speed"),
    [circuit, segments, mobile],
  );
  const line = useMemo(
    () => buildRibbon(circuit, segments, mobile ? 0.22 : 0.28, 0.05, mobile ? 0.36 : 0.48, "speed"),
    [circuit, segments, mobile],
  );

  return (
    <group>
      <mesh geometry={asphalt} castShadow receiveShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.78}
          metalness={0.06}
          color="#6B7588"
        />
      </mesh>
      <mesh geometry={speed} castShadow>
        <meshStandardMaterial
          vertexColors
          roughness={0.28}
          metalness={0.22}
          emissive="#6f7682"
          emissiveIntensity={0.14}
        />
      </mesh>
      <mesh geometry={line}>
        <meshBasicMaterial vertexColors toneMapped={false} />
      </mesh>
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
              <mesh position={[0, completed ? 1.55 : 0.95, 0]}>
                <cylinderGeometry args={[0.06, 0.06, completed ? 2.6 : 1.6, 8]} />
                <meshStandardMaterial
                  color={completed ? "#F4EFE4" : "#8a92a1"}
                  emissive={completed ? "#d8d0c0" : "#000"}
                  emissiveIntensity={completed ? 0.4 : 0}
                />
              </mesh>
              <mesh position={[0.62, completed ? 2.55 : 1.55, 0]}>
                <boxGeometry args={completed ? [1.05, 0.64, 0.08] : [0.72, 0.44, 0.06]} />
                <meshStandardMaterial
                  color={completed ? "#f7f2e8" : "#3a4250"}
                  wireframe={!completed}
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
  const fov = useRef(44);

  useFrame((_, delta) => {
    const target = lapRef.t;
    const brake = brakeAmount(stops, target);
    smoothed.current = THREE.MathUtils.damp(smoothed.current, target, brake > 0.35 ? 2.2 : 4.4, delta);
    const t = ((smoothed.current % 1) + 1) % 1;
    const speed = sampleChannel(circuit.speed, t);
    const scroll = Math.min(1, Math.abs(lapRef.v) / 1.8);
    const intensity = THREE.MathUtils.clamp(speed * 0.7 + scroll * 0.5, 0, 1) * (1 - brake * 0.65);

    curve.getPointAt(t, _pos);
    curve.getTangentAt(t, _tan).normalize();
    curve.getPointAt((t + 0.055 + intensity * 0.02) % 1, _look);
    _side.copy(_tan).cross(UP);
    if (_side.lengthSq() < 1e-6) _side.set(1, 0, 0);
    else _side.normalize();

    const height = (mobile ? 7.2 : 6.1) + intensity * 2.1 + brake * 1.2;
    const back = (mobile ? 18.4 : 15.6) + intensity * 3.2 - brake * 2.4;
    _cam.copy(_pos).addScaledVector(UP, height).addScaledVector(_tan, -back);
    _cam.addScaledVector(_side, 0.18);

    camera.position.lerp(_cam, 1 - Math.exp(-4.8 * delta));
    camera.up.lerp(UP, 0.28);
    camera.lookAt(_look.addScaledVector(UP, 0.85));

    const nextFov = 40 + intensity * (mobile ? 8 : 12) - brake * 6;
    fov.current = THREE.MathUtils.damp(fov.current, nextFov, 3.4, delta);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = fov.current;
    persp.near = 0.2;
    persp.far = 320;
    persp.updateProjectionMatrix();
  });

  return null;
}

function Headlight({ circuit }: { circuit: Circuit }) {
  const light = useRef<THREE.PointLight>(null);
  const { curve } = useMemo(() => circuitCurve(circuit), [circuit]);
  useFrame(() => {
    if (!light.current) return;
    curve.getPointAt(((lapRef.t % 1) + 1) % 1, _pos);
    light.current.position.copy(_pos).addScaledVector(UP, 3.2);
  });
  return <pointLight ref={light} intensity={28} distance={42} color="#fff6dc" />;
}

function Post({ mobile }: { mobile: boolean }) {
  if (mobile) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.18} luminanceThreshold={0.52} mipmapBlur luminanceSmoothing={0.22} />
      <Vignette darkness={0.14} offset={0.46} />
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
      <color attach="background" args={["#1C2636"]} />
      <fog attach="fog" args={["#243044", 38, 170]} />
      <hemisphereLight args={["#d5e2f4", "#3a3228", 1.35]} />
      <directionalLight
        position={[22, 38, 14]}
        intensity={2.8}
        color="#fff7ea"
        castShadow={!mobile}
      />
      <directionalLight position={[-16, 14, -18]} intensity={0.85} color="#8eabcc" />
      <ambientLight intensity={0.58} color="#a8b6cc" />
      <Headlight circuit={circuit} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.5, 0]} receiveShadow>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#151C28" roughness={1} />
      </mesh>
      <Road circuit={circuit} mobile={mobile} />
      <RoundPins circuit={circuit} stops={stops} />
      <CameraRig circuit={circuit} stops={stops} mobile={mobile} />
      <Post mobile={mobile} />
    </>
  );
}
