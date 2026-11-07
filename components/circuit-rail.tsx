"use client";

import { useEffect, useMemo, useState } from "react";
import { circuitSwitcherPlace } from "@/lib/names";
import type { Season } from "@/lib/types";

type Outline = {
  circuitId: string;
  name: string;
  locality: string;
  country: string;
  d: string;
  size: number;
};

export function CircuitRail({
  circuitIds,
  currentId,
  season,
  onSelect,
}: {
  circuitIds: string[];
  currentId: string;
  season: Season;
  onSelect: (id: string) => void;
}) {
  const [outlines, setOutlines] = useState<Record<string, Outline> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/data/outlines.json")
      .then((res) => {
        if (!res.ok) throw new Error("outlines missing");
        return res.json() as Promise<Record<string, Outline>>;
      })
      .then((data) => {
        if (!cancelled) setOutlines(data);
      })
      .catch(() => {
        if (!cancelled) setOutlines({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const orbit = useMemo(() => {
    if (!outlines) return [];
    const others = circuitIds.filter((id) => id !== currentId && outlines[id]);
    const idx = circuitIds.indexOf(currentId);
    // Prefer neighbours around the active circuit, then fill
    const ranked = [...others].sort((a, b) => {
      const da = Math.abs(circuitIds.indexOf(a) - idx);
      const db = Math.abs(circuitIds.indexOf(b) - idx);
      return da - db;
    });
    return ranked.slice(0, 8);
  }, [outlines, circuitIds, currentId]);

  if (!outlines || orbit.length === 0) return null;

  return (
    <aside
      className="pointer-events-auto absolute top-[22%] right-3 hidden w-[5.75rem] flex-col gap-3 lg:flex xl:right-6 xl:w-[6.5rem]"
      aria-label="Other circuits"
    >
      <p className="font-mono text-[9px] tracking-[0.28em] text-[#F4EFE4]/40">ORBIT</p>
      <ul className="flex flex-col gap-2.5">
        {orbit.map((id, index) => {
          const outline = outlines[id];
          if (!outline) return null;
          const place = circuitSwitcherPlace(id, season) || outline.locality;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSelect(id)}
                className="group w-full text-left transition-opacity duration-300"
                style={{
                  opacity: 0.42 + (1 - index / Math.max(orbit.length - 1, 1)) * 0.38,
                  animation: `circuit-rise 520ms ease-out ${index * 40}ms both`,
                }}
                title={outline.name}
              >
                <svg
                  viewBox={`0 0 ${outline.size} ${outline.size}`}
                  className="h-11 w-full text-[#F4EFE4] transition-colors duration-200 group-hover:text-[#FFC43A] xl:h-12"
                  aria-hidden="true"
                >
                  <path
                    d={outline.d}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
                <span className="mt-0.5 block truncate font-mono text-[9px] tracking-[0.14em] text-[#F4EFE4]/55 group-hover:text-[#F4EFE4]/85">
                  {place.toUpperCase()}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
