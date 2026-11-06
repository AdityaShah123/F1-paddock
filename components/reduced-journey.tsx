"use client";

import { DriverForm } from "@/components/driver-form";
import { projectCircuitSvg } from "@/lib/curve";
import { circuitLabel } from "@/lib/load-data";
import { patternDash, teamById } from "@/lib/teams";
import type { Circuit, PaddockData, SeasonRound } from "@/lib/types";

function RoundBlock({ round, data }: { round: SeasonRound; data: PaddockData }) {
  const winner = data.drivers.find((driver) => driver.driverId === round.winner?.driverId);
  return (
    <article className="border-t border-[#E8E2D4]/15 py-8">
      <p className="font-mono text-[11px] tracking-[0.16em] text-[#E8E2D4]/50">
        ROUND {round.round} · {round.status === "completed" ? "CHEQUERED" : "UNRUN"}
      </p>
      <h3
        className="mt-2 text-3xl text-[#E8E2D4]"
        style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}
      >
        {round.raceName}
      </h3>
      <p className="mt-1 text-sm text-[#E8E2D4]/60">
        {round.locality}, {round.country} · {round.date}
      </p>
      {round.status === "completed" ? (
        <p className="mt-4 text-sm">
          Winner {winner ? `${winner.givenName} ${winner.familyName}` : round.winner?.code}
        </p>
      ) : (
        <p className="mt-4 border border-dashed border-[#E8E2D4]/25 p-3 text-sm text-[#E8E2D4]/75">
          No race data. The season is still open.
        </p>
      )}
    </article>
  );
}

export function ReducedJourney({
  data,
  circuit,
  onSelectCircuit,
}: {
  data: PaddockData;
  circuit: Circuit;
  onSelectCircuit: (id: string) => void;
}) {
  const svg = projectCircuitSvg(circuit, 340);
  const maxPoints = Math.max(...data.arc.series.map((series) => series.cumulative.at(-1) ?? 0), 1);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 text-[#E8E2D4]">
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#E8E2D4]/50">
        2026 · {data.season.completedRounds} OF {data.season.totalRounds} RUN
      </p>
      <h1
        className="mt-4 text-[clamp(2.4rem,8vw,4.8rem)] leading-[0.88]"
        style={{ fontVariationSettings: '"wdth" 72', fontWeight: 650 }}
      >
        {circuit.name}
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#E8E2D4]/72">
        Motion is reduced on this machine, so the lap is a map instead of a camera. Same data. Same unfinished season.
      </p>
      <svg className="mt-8 w-full max-w-sm" viewBox={`0 0 ${svg.size} ${svg.size}`} role="img" aria-label={`${circuit.name} racing line`}>
        <path d={svg.d} fill="none" stroke="#E8E2D4" strokeWidth="2.2" />
      </svg>
      <div className="mt-6 flex flex-wrap gap-2">
        {data.index.circuits.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectCircuit(id)}
            className="border border-[#E8E2D4]/20 px-2 py-1 text-xs"
            style={{
              background: id === circuit.circuitId ? "#E8E2D4" : "transparent",
              color: id === circuit.circuitId ? "#020203" : "#E8E2D4",
            }}
          >
            {circuitLabel(id, data.season, id)}
          </button>
        ))}
      </div>
      <section className="mt-14">
        <h2 className="text-2xl" style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}>
          Calendar
        </h2>
        {data.season.rounds.map((round) => (
          <RoundBlock key={round.round} round={round} data={data} />
        ))}
      </section>
      <section className="mt-10">
        <h2 className="text-2xl" style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}>
          Standings
        </h2>
        <svg className="mt-6 w-full" viewBox="0 0 420 160" role="img" aria-label="Cumulative championship points">
          {data.arc.series.slice(0, 10).map((series) => {
            const driver = data.standings.drivers.find((item) => item.driverId === series.driverId);
            const team = teamById(data.teams, driver?.constructorId ?? "");
            const d = series.cumulative
              .map((points, index) => {
                const x = (index / Math.max(series.cumulative.length - 1, 1)) * 412 + 4;
                const y = 152 - (points / maxPoints) * 140;
                return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <path
                key={series.driverId}
                d={d}
                fill="none"
                stroke={team.colour}
                strokeWidth={1.6}
                strokeDasharray={patternDash(team.pattern)}
              />
            );
          })}
        </svg>
        <ol className="mt-4 space-y-1">
          {data.standings.drivers.slice(0, 10).map((driver) => {
            const team = teamById(data.teams, driver.constructorId);
            return (
              <li key={driver.driverId} className="flex gap-2 font-mono text-sm">
                <span className="w-6">{driver.position}</span>
                <span style={{ color: team.colour }}>{driver.code}</span>
                <span>{driver.familyName}</span>
                <span className="ml-auto">{driver.points}</span>
              </li>
            );
          })}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl" style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}>
          Drivers
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {data.drivers.map((driver) => (
            <DriverForm key={driver.driverId} driver={driver} teams={data.teams} size={110} />
          ))}
        </div>
      </section>
    </div>
  );
}
