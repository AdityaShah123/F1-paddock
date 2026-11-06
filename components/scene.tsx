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
const BRAKE = new THREE.Color("#FF4A1F");
const LOW = new THREE.Color("#5B8CFF");
const MID = new THREE.Color("#F2D36B");
const HOT = new THREE.Color("#FFF6E0");

function speedToColor(speed: number, brake: number, target: THREE.Color) {
  if (brake > 0.48) {
    target.copy(BRAKE).lerp(MID, 1 - brake);
    return;
  }
  if (speed < 0.45) {
    target.copy(LOW).lerp(MID, speed / 0.45);
    return;
  }
  target.copy(MID).lerp(HOT, (speed - 0.45) / 0.55);
}

function Asphalt({ circuit, mobile }: { circuit: Circuit; mobile: boolean }) {
  const geometry = useMemo(() => {
    const { curve } = circuitCurve(circuit);
    const segments = mobile ? 80 : 160;
    return new THREE.TubeGeometry(curve, segments, mobile ? 0.92 : 1.18, mobile ? 6 : 10, true);
  }, [circuit, mobile]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#3A4454"
        roughness={0.72}
        metalness={0.08}
        emissive="#1a2433"
        emissiveIntensity={0.22}
      />
    </mesh>
  );
}

function SpeedRibbon({ circuit, mobile }: { circuit: Circuit; mobile: boolean }) {
  const geometry = useMemo(() => {
    const { curve } = circuitCurve(circuit);
    const segments = mobile ? 90 : Math.min(220, Math.max(140, Math.floor(circuit.points.length * 0.42)));
    const geometry = new THREE.TubeGeometry(curve, segments, mobile ? 0.38 : 0.52, mobile ? 5 : 8, true);
    const colors = new Float32Array(geometry.attributes.position.count * 3);
    const color = new THREE.Color();
    for (let i = 0; i < geometry.attributes.position.count; i += 1) {
      const t = (i / geometry.attributes.position.count) % 1;
      speedToColor(sampleChannel(circuit.speed, t), sampleChannel(circuit.brake, t), color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  }, [circuit, mobile]);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors toneMapped={false} />
    </mesh>
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
              <mesh position={[0, completed ? 1.4 : 0.85, 0]}>
                <cylinderGeometry args={[0.05, 0.05, completed ? 2.8 : 1.7, 8]} />
                <meshStandardMaterial
                  color={completed ? "#F4EFE4" : "#6d7380"}
                  emissive={completed ? "#d8d0c0" : "#000"}
                  emissiveIntensity={completed ? 0.35 : 0}
                />
              </mesh>
              <mesh position={[0.55, completed ? 2.5 : 1.5, 0]}>
                <boxGeometry args={completed ? [1.15, 0.72, 0.08] : [0.8, 0.5, 0.06]} />
                <meshStandardMaterial
                  color={completed ? "#f7f2e8" : "#2e3340"}
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
  const fov = useRef(46);

  useFrame((_, delta) => {
    const target = lapRef.t;
    const brake = brakeAmount(stops, target);
    smoothed.current = THREE.MathUtils.damp(smoothed.current, target, brake > 0.35 ? 2.1 : 4.6, delta);
    const t = ((smoothed.current % 1) + 1) % 1;
    const speed = sampleChannel(circuit.speed, t);
    const scroll = Math.min(1, Math.abs(lapRef.v) / 1.8);
    const intensity = THREE.MathUtils.clamp(speed * 0.7 + scroll * 0.5, 0, 1) * (1 - brake * 0.65);

    curve.getPointAt(t, _pos);
    curve.getTangentAt(t, _tan).normalize();
    curve.getPointAt((t + 0.028 + intensity * 0.01) % 1, _look);
    _side.copy(_tan).cross(UP).normalize();

    const height = (mobile ? 4.2 : 3.6) + intensity * 1.4 + brake * 0.8;
    const back = (mobile ? 11.2 : 9.6) + intensity * 2.4 - brake * 1.6;
    _cam.copy(_pos).addScaledVector(UP, height).addScaledVector(_tan, -back);
    _cam.addScaledVector(_side, 0.35);

    camera.position.lerp(_cam, 1 - Math.exp(-5.2 * delta));
    camera.up.lerp(UP, 0.25);
    camera.lookAt(_look.addScaledVector(UP, 0.55));

    const nextFov = 44 + intensity * (mobile ? 10 : 16) - brake * 8;
    fov.current = THREE.MathUtils.damp(fov.current, nextFov, 3.6, delta);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = fov.current;
    persp.near = 0.15;
    persp.far = 260;
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
    light.current.position.copy(_pos).addScaledVector(UP, 2.4);
  });
  return <pointLight ref={light} intensity={42} distance={36} color="#fff3d4" />;
}

function Post({ mobile }: { mobile: boolean }) {
  if (mobile) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.28} luminanceThreshold={0.42} mipmapBlur luminanceSmoothing={0.2} />
      <Vignette darkness={0.28} offset={0.35} />
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
      <color attach="background" args={["#151B26"]} />
      <fog attach="fog" args={["#1A2230", 28, 130]} />
      <hemisphereLight args={["#c9d6ea", "#2a2118", 1.15]} />
      <directionalLight
        position={[18, 32, 12]}
        intensity={2.4}
        color="#fff6e8"
        castShadow={!mobile}
      />
      <ambientLight intensity={0.45} color="#9aa8c0" />
      <Headlight circuit={circuit} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -6, 0]} receiveShadow>
        <planeGeometry args={[400, 400]} />
        <meshStandardMaterial color="#10151D" roughness={1} />
      </mesh>
      <Asphalt circuit={circuit} mobile={mobile} />
      <SpeedRibbon circuit={circuit} mobile={mobile} />
      <RoundPins circuit={circuit} stops={stops} />
      <CameraRig circuit={circuit} stops={stops} mobile={mobile} />
      <Post mobile={mobile} />
    </>
  );
}
