"use client";

import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import { CircuitScene } from "@/components/scene";
import type { Circuit, ContentStop } from "@/lib/types";

export default function CircuitCanvas({
  circuit,
  stops,
  mobile,
}: {
  circuit: Circuit;
  stops: ContentStop[];
  mobile: boolean;
}) {
  return (
    <Canvas
      className="h-full w-full"
      dpr={mobile ? [1, 1.15] : [1, 1.7]}
      camera={{ fov: 48, near: 0.1, far: 240, position: [0, 8, 16] }}
      gl={{
        antialias: !mobile,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#020203");
      }}
    >
      <AdaptiveDpr pixelated />
      <CircuitScene circuit={circuit} stops={stops} mobile={mobile} />
    </Canvas>
  );
}
