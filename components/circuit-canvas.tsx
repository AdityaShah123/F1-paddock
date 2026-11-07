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
      camera={{ fov: 44, near: 0.2, far: 320, position: [0, 9, 20] }}
      gl={{
        antialias: !mobile,
        powerPreference: "high-performance",
        stencil: false,
        depth: true,
      }}
      onCreated={({ gl }) => {
        gl.setClearColor("#0E141C");
      }}
    >
      <AdaptiveDpr pixelated />
      <CircuitScene circuit={circuit} stops={stops} mobile={mobile} />
    </Canvas>
  );
}
