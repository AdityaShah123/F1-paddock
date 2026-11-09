"use client";

import { HelmetMark, Portrait } from "@/components/driver-chip";
import { teamById } from "@/lib/teams";
import type { RaceResult, RaceResultRow, Team } from "@/lib/types";

const PURPLE = "#C44DFF";

function Row({
  row,
  race,
  teams,
  purpleId,
  align,
}: {
  row: RaceResultRow;
  race: RaceResult;
  teams: Team[];
  purpleId?: string;
  align: "left" | "right";
}) {
  const team = teamById(teams, row.constructorId);
  const isPurple = row.driverId === purpleId;
  const time = isPurple ? race.fastestLap?.time : row.time ?? row.status;
  const mirrored = align === "right";

  return (
    <li
      className={`timing-row flex items-center gap-2.5 py-1.5 ${mirrored ? "flex-row-reverse pr-2 text-right" : "pl-2"}`}
      style={{ ["--team" as string]: team.colour }}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center font-mono text-[13px] tabular-nums ${row.position === 1 ? "bg-[#F4EFE4] text-[#0A0F16]" : "bg-[#F4EFE4]/[0.08] text-[#F4EFE4]"}`}
      >
        {row.position}
      </span>
      <Portrait driverId={row.driverId} alt="" size={46} />
      <span className="hidden md:inline-flex">
        <HelmetMark number={row.permanentNumber} pattern={team.pattern} size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="hidden truncate font-mono text-[10px] tracking-[0.14em] text-[#F4EFE4]/50 md:block">{team.name}</p>
        <p className="truncate font-mono text-[15px] tabular-nums tracking-wide text-[#F4EFE4]">
          {row.permanentNumber} {row.code}
          {isPurple ? <span className="ml-2 text-[10px] tracking-[0.14em]" style={{ color: PURPLE }}>FL</span> : null}
        </p>
        <p
          className="font-mono text-[11px] tabular-nums"
          style={{ color: isPurple ? PURPLE : "rgba(244,239,228,0.55)" }}
        >
          {time}
        </p>
      </div>
    </li>
  );
}

export function ClassificationColumn({
  rows,
  race,
  teams,
  purpleId,
  align,
  label,
}: {
  rows: RaceResultRow[];
  race: RaceResult | null;
  teams: Team[];
  purpleId?: string;
  align: "left" | "right";
  label?: string;
}) {
  return (
    <section aria-label={label ?? (align === "left" ? "Positions 1 to 5" : "Positions 6 to 10")}>
      {label ? (
        <p
          className={`font-mono text-[10px] tracking-[0.28em] text-[#F4EFE4]/45 ${align === "right" ? "text-right" : ""}`}
        >
          {label}
        </p>
      ) : null}
      {!race ? (
        <p className={`mt-3 max-w-[16rem] text-sm leading-5 text-[#F4EFE4]/60 ${align === "right" ? "ml-auto text-right" : ""}`}>
          Classification waits on this round.
        </p>
      ) : (
        <ol className="mt-1">
          {rows.map((row) => (
            <Row
              key={`${race.round}-${row.position}-${row.driverId}`}
              row={row}
              race={race}
              teams={teams}
              purpleId={purpleId}
              align={align}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

export function RaceLeaderboard({
  race,
  teams,
}: {
  race: RaceResult | null;
  teams: Team[];
  emptyLabel: string;
}) {
  const rows = (race?.results ?? []).slice(0, 10);
  const left = rows.slice(0, 5);
  const right = rows.slice(5, 10);
  const purpleId = race?.fastestLap?.driverId;
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <ClassificationColumn rows={left} race={race} teams={teams} purpleId={purpleId} align="left" label="1–5" />
      <ClassificationColumn rows={right} race={race} teams={teams} purpleId={purpleId} align="right" label="6–10" />
    </div>
  );
}
