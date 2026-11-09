"use client";

import { useEffect, useRef, useState } from "react";
import { flagSrc } from "@/lib/flags";
import type { DataIndex, Season } from "@/lib/types";

type Outline = {
  circuitId: string;
  name: string;
  locality: string;
  country: string;
  d: string;
  size: number;
};

const SHORT_PLACE: Record<string, string> = {
  sepang: "Kuala Lumpur",
  red_bull_ring: "Spielberg",
  americas: "Austin",
  rodriguez: "Mexico City",
  yas_marina: "Abu Dhabi",
  interlagos: "São Paulo",
};

let outlineRequest: Promise<Record<string, Outline>> | null = null;
function loadOutlines() {
  outlineRequest ??= fetch("/data/outlines.json")
    .then((res) => (res.ok ? (res.json() as Promise<Record<string, Outline>>) : {}))
    .catch(() => ({}));
  return outlineRequest;
}

export function useOutlines() {
  const [outlines, setOutlines] = useState<Record<string, Outline>>({});
  useEffect(() => {
    let alive = true;
    loadOutlines().then((data) => {
      if (alive) setOutlines(data);
    });
    return () => {
      alive = false;
    };
  }, []);
  return outlines;
}

/**
 * The whole 2026 calendar in race order across the top: circuit outline, flag, round and place.
 * Every round with a racing line is a button; the four unrun rounds sit dimmed at the end.
 */
export function CalendarStrip({
  season,
  index,
  currentId,
  onSelect,
  loading,
}: {
  season: Season;
  index: DataIndex;
  currentId: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const outlines = useOutlines();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const active = scroller.current?.querySelector<HTMLElement>("[aria-current='true']");
    active?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentId]);

  return (
    <nav
      aria-label="2026 calendar"
      className="race-nav relative shrink-0 border-b border-[#F4EFE4]/10 bg-[#0A0F16]"
    >
      <div className="f1-redline" aria-hidden="true" />
      <div className="flex items-stretch">
        <div className="hidden shrink-0 flex-col justify-center border-r border-[#F4EFE4]/10 px-4 lg:flex">
          <p
            className="text-[1.35rem] leading-none tracking-[-0.01em] text-[#F4EFE4]"
            style={{ fontVariationSettings: '"wdth" 70', fontWeight: 760 }}
          >
            PADDOCK
          </p>
          <p className="mt-1 font-mono text-[9px] tracking-[0.3em] text-[#F4EFE4]/50">
            {season.year} · {season.completedRounds}/{season.totalRounds}
            {loading ? <span className="ml-2 text-[#E10600]">●</span> : null}
          </p>
        </div>
        <div
          ref={scroller}
          className="calendar-scroll flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto px-2 py-2"
        >
          {season.rounds.map((round) => {
            const hasLine = index.circuits.includes(round.circuitId);
            const outline = outlines[round.circuitId];
            const active = round.circuitId === currentId;
            const flag = flagSrc(round.country);
            const place = SHORT_PLACE[round.circuitId] ?? round.locality;
            const upcoming = round.status !== "completed";
            return (
              <button
                key={round.round}
                type="button"
                data-circuit={round.circuitId}
                disabled={!hasLine}
                onClick={() => onSelect(round.circuitId)}
                aria-current={active ? "true" : undefined}
                aria-label={`Round ${round.round}, ${round.raceName}${hasLine ? "" : ", not yet run"}`}
                title={round.raceName}
                className={`calendar-tile group ${active ? "is-active" : ""} ${upcoming ? "is-upcoming" : ""}`}
              >
                <span className="flex w-full items-center justify-between gap-1">
                  <span className="font-mono text-[9px] tabular-nums tracking-[0.12em] text-[#F4EFE4]/55">
                    R{String(round.round).padStart(2, "0")}
                  </span>
                  {flag ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={flag} alt="" className="race-flag" width={18} height={13} />
                  ) : null}
                </span>
                <span className="my-1 flex h-9 w-full items-center justify-center">
                  {outline ? (
                    <svg viewBox={`0 0 ${outline.size} ${outline.size}`} className="h-full w-full" aria-hidden="true">
                      <path
                        d={outline.d}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={active ? 2.6 : 1.8}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  ) : (
                    <span className="font-mono text-[8px] tracking-[0.2em] text-[#F4EFE4]/35">
                      {upcoming ? "TO RUN" : "—"}
                    </span>
                  )}
                </span>
                <span className="block w-full truncate text-center font-mono text-[9px] tracking-[0.1em] uppercase">
                  {place}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
