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
function speedToColor(speed: number, brake: number, target: THREE.Color) {
  if (brake > 0.55) {
    target.setRGB(1, 0.38 + (1 - brake) * 0.2, 0.05);
    return;
  }
  const hot = new THREE.Color("#F4F1E8");
  const cold = new THREE.Color("#3AA6C8");
  target.copy(cold).lerp(hot, THREE.MathUtils.clamp(speed, 0, 1));
}

function Ribbon({ circuit, mobile }: { circuit: Circuit; mobile: boolean }) {
  const { geometry, material } = useMemo(() => {
    const { curve } = circuitCurve(circuit);
    const segments = mobile ? 90 : Math.min(200, Math.max(120, Math.floor(circuit.points.length * 0.38)));
    const geometry = new THREE.TubeGeometry(curve, segments, mobile ? 0.38 : 0.46, mobile ? 5 : 8, true);
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
    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.28,
      metalness: 0.18,
      emissive: new THREE.Color("#8a7d62"),
      emissiveIntensity: 0.28,
      toneMapped: false,
    });
    return { geometry, material };
  }, [circuit, mobile]);

  return (
    <mesh geometry={geometry} material={material} />
  );
}

function GhostRibbon({ circuit }: { circuit: Circuit }) {
  const geometry = useMemo(() => {
    const { curve } = circuitCurve(circuit);
    return new THREE.TubeGeometry(curve, 80, 0.18, 4, true);
  }, [circuit]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color="#6d6a63" wireframe transparent opacity={0.18} />
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
              <mesh position={[0, completed ? 1.15 : 0.7, 0]}>
                <cylinderGeometry args={[0.035, 0.035, completed ? 2.3 : 1.4, 6]} />
                <meshBasicMaterial
                  color={completed ? "#E8E2D4" : "#5c5850"}
                  transparent
                  opacity={completed ? 0.9 : 0.45}
                />
              </mesh>
              <mesh position={[0.42, completed ? 2.05 : 1.25, 0]} rotation={[0, 0, 0.15]}>
                <planeGeometry args={completed ? [0.95, 0.62] : [0.7, 0.48]} />
                <meshBasicMaterial
                  color={completed ? "#f2efe6" : "#2a2926"}
                  wireframe={!completed}
                  side={THREE.DoubleSide}
                />
              </mesh>
              {completed ? (
                <mesh position={[0.42, 2.05, 0.01]} rotation={[0, 0, 0.15]}>
                  <planeGeometry args={[0.95, 0.62]} />
                  <meshBasicMaterial color="#111" opacity={0.35} transparent />
                </mesh>
              ) : null}
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
  const fov = useRef(48);

  useFrame((_, delta) => {
    const target = lapRef.t;
    const brake = brakeAmount(stops, target);
    const follow = 1 - Math.exp(-(brake > 0.4 ? 3.2 : 5.6) * delta);
    smoothed.current = THREE.MathUtils.damp(smoothed.current, target, brake > 0.35 ? 2.4 : 5.1, delta);
    const t = ((smoothed.current % 1) + 1) % 1;
    const speed = sampleChannel(circuit.speed, t);
    const scroll = Math.min(1, Math.abs(lapRef.v) / 1.8);
    const intensity = THREE.MathUtils.clamp(speed * 0.75 + scroll * 0.55, 0, 1) * (1 - brake * 0.7);

    curve.getPointAt(t, _pos);
    curve.getTangentAt(t, _tan).normalize();
    const lookT = (t + 0.018 + intensity * 0.012) % 1;
    curve.getPointAt(lookT, _look);
    _side.copy(_tan).cross(UP).normalize();

    const height = (mobile ? 2.6 : 2.15) + intensity * 1.7 + brake * 1.1;
    const back = (mobile ? 7.4 : 5.8) + intensity * 3.4 - brake * 2.2;
    _cam.copy(_pos).addScaledVector(UP, height).addScaledVector(_tan, -back);
    _cam.addScaledVector(_side, Math.sin(t * Math.PI * 2) * 0.15);

    camera.position.lerp(_cam, follow);
    camera.up.lerp(UP, 0.2);
    camera.lookAt(_look.addScaledVector(UP, 0.35 + brake * 0.4));

    const nextFov = 42 + intensity * (mobile ? 16 : 26) - brake * 10;
    fov.current = THREE.MathUtils.damp(fov.current, nextFov, 4, delta);
    const persp = camera as THREE.PerspectiveCamera;
    persp.fov = fov.current;
    persp.near = 0.1;
    persp.far = 240;
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
    light.current.position.copy(_pos).addScaledVector(UP, 1.4);
  });
  return <pointLight ref={light} intensity={18} distance={28} color="#fff4e0" />;
}

function Post({ mobile }: { mobile: boolean }) {
  if (mobile) return null;
  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <Bloom intensity={0.62} luminanceThreshold={0.18} mipmapBlur luminanceSmoothing={0.12} />
      <Vignette darkness={0.62} offset={0.28} />
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
      <color attach="background" args={["#020203"]} />
      <fog attach="fog" args={["#020203", 14, 95]} />
      <hemisphereLight args={["#c9d4e0", "#1a120c", 0.55]} />
      <Headlight circuit={circuit} />
      <GhostRibbon circuit={circuit} />
      <Ribbon circuit={circuit} mobile={mobile} />
      <RoundPins circuit={circuit} stops={stops} />
      <CameraRig circuit={circuit} stops={stops} mobile={mobile} />
      <Post mobile={mobile} />
    </>
  );
}
