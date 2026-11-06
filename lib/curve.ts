import * as THREE from "three";
import type { Circuit } from "./types";

export function elevationBoost(points: [number, number, number][]) {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minY = Math.min(minY, point[1]);
    maxY = Math.max(maxY, point[1]);
  }
  const range = maxY - minY;
  if (range < 0.35) return 1;
  if (range < 3) return 5.4;
  if (range < 8) return 4.35;
  return 2.4;
}

export function circuitCurve(circuit: Circuit) {
  const boost = elevationBoost(circuit.points);
  const points = circuit.points.map(
    ([x, y, z]) => new THREE.Vector3(x, y * boost, z),
  );
  return {
    curve: new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.12),
    boost,
  };
}

export function sampleChannel(values: number[], t: number) {
  if (!values.length) return 0;
  const wrapped = ((t % 1) + 1) % 1;
  const scaled = wrapped * values.length;
  const i0 = Math.floor(scaled) % values.length;
  const i1 = (i0 + 1) % values.length;
  const mix = scaled - Math.floor(scaled);
  return values[i0] * (1 - mix) + values[i1] * mix;
}

export function projectCircuitSvg(circuit: Circuit, size = 320) {
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  for (const [x, , z] of circuit.points) {
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z);
    maxZ = Math.max(maxZ, z);
  }
  const span = Math.max(maxX - minX, maxZ - minZ) || 1;
  const pad = 18;
  const usable = size - pad * 2;
  const points = circuit.points.map(([x, , z]) => {
    const px = pad + ((x - minX) / span) * usable;
    const py = pad + ((z - minZ) / span) * usable;
    return [px, py] as const;
  });
  return { d: points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ") + " Z", points, size };
}
