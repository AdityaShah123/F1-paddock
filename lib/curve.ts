import * as THREE from "three";
import type { Circuit } from "./types";

/**
 * Exaggerate elevation so hills read on screen, but cap it by slope so flat street
 * circuits (Baku, Miami) never turn into walls.
 */
export function elevationBoost(points: [number, number, number][]) {
  let minY = Infinity;
  let maxY = -Infinity;
  let maxSlope = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    minY = Math.min(minY, a[1]);
    maxY = Math.max(maxY, a[1]);
    const run = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (run > 0.05) maxSlope = Math.max(maxSlope, Math.abs(b[1] - a[1]) / run);
  }
  const range = maxY - minY;
  if (range < 0.35) return 1;
  const byRange = 4.2 / range;
  const bySlope = maxSlope > 0 ? 0.2 / maxSlope : 3;
  return Math.min(3, Math.max(1, Math.min(byRange, bySlope)));
}

export function circuitCurve(circuit: Circuit) {
  const boost = elevationBoost(circuit.points);
  const points = circuit.points.map(
    ([x, y, z]) => new THREE.Vector3(x, y * boost, z),
  );
  return {
    curve: new THREE.CatmullRomCurve3(points, true, "catmullrom", 0.35),
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
