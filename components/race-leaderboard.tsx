"use client";

import { useState } from "react";
import { HelmetMark, Portrait } from "@/components/driver-chip";
import { teamById, teamFillStyle } from "@/lib/teams";
import type { RaceResult, Team } from "@/lib/types";
import { Button } from "@/components/ui/button";

const PURPLE = "#C44DFF";

export function RaceLeaderboard({
  race,
  teams,
  emptyLabel,
}: {
  race: RaceResult | null;
  teams: Team[];
  emptyLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const rows = race?.results ?? [];
  const visible = expanded ? rows : rows.slice(0, 10);
  const purpleId = race?.fastestLap?.driverId;

  return (
    <section
      className="pointer-events-auto w-[min(100%,22.5rem)] border border-[#F4EFE4]/15 bg-[#1C2433]/92 p-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md"
      aria-label="This race classification"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-mono text-[11px] tracking-[0.16em] text-[#F4EFE4]">THIS RACE</h3>
        {race?.fastestLap ? (
          <p className="font-mono text-[11px] tabular-nums" style={{ color: PURPLE }}>
            FL {race.fastestLap.code} {race.fastestLap.time}
          </p>
        ) : null}
      </div>
      {!race ? (
        <p className="mt-3 text-sm text-[#F4EFE4]/75">{emptyLabel}</p>
      ) : (
        <>
          <ol className="mt-2 space-y-0.5">
            {visible.map((row) => {
              const team = teamById(teams, row.constructorId);
              const isPurple = row.driverId === purpleId;
              return (
                <li
                  key={`${race.round}-${row.position}-${row.driverId}`}
                  className="grid grid-cols-[1.6rem_1.6rem_1.8rem_2.4rem_minmax(0,1fr)_auto] items-center gap-1 py-0.5 text-[13px]"
                >
                  <span className="font-mono tabular-nums text-[#F4EFE4]/70">{row.position}</span>
                  <Portrait driverId={row.driverId} colour={team.colour} alt="" size={22} />
                  <HelmetMark
                    number={row.permanentNumber}
                    colour={team.colour}
                    accent={team.accent}
                    pattern={team.pattern}
                    size={22}
                  />
                  <span className="font-mono tabular-nums text-[#F4EFE4]">{row.permanentNumber}</span>
                  <span className="flex min-w-0 items-center gap-1">
                    <span className="size-2 shrink-0" style={teamFillStyle(team)} aria-hidden />
                    <span className="truncate font-mono tracking-[0.08em] text-[#F4EFE4]">
                      {row.code}
                    </span>
                    {isPurple ? (
                      <span className="font-mono text-[10px]" style={{ color: PURPLE }}>
                        FL
                      </span>
                    ) : null}
                  </span>
                  <span
                    className="font-mono tabular-nums text-[11px]"
                    style={{ color: isPurple ? PURPLE : "rgba(244,239,228,0.65)" }}
                  >
                    {isPurple ? race.fastestLap?.time : row.time ?? row.status}
                  </span>
                </li>
              );
            })}
          </ol>
          {rows.length > 10 ? (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 h-7 text-[#F4EFE4]"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show top 10" : `Show all ${rows.length}`}
            </Button>
          ) : null}
        </>
      )}
    </section>
  );
}
