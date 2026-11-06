"use client";

import { DriverChip } from "@/components/driver-chip";
import { PodiumBars } from "@/components/podium";
import { RaceLeaderboard } from "@/components/race-leaderboard";
import { projectCircuitSvg } from "@/lib/curve";
import { circuitSwitcherLabel, circuitSwitcherPlace, racePlace, raceTitle } from "@/lib/names";
import { patternDash, teamById } from "@/lib/teams";
import type { Circuit, PaddockData, SeasonRound } from "@/lib/types";

function RoundBlock({ round, data }: { round: SeasonRound; data: PaddockData }) {
  const race = data.results.rounds[String(round.round)] ?? null;
  return (
    <article className="border-t border-[#F4EFE4]/20 py-8">
      <p className="font-mono text-[11px] tracking-[0.16em] text-[#F4EFE4]/60">
        ROUND {round.round} · {round.status === "completed" ? "CHEQUERED" : "UNRUN"}
      </p>
      <h3
        className="mt-2 text-3xl text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}
      >
        {raceTitle(round)}
      </h3>
      <p className="mt-1 text-sm text-[#F4EFE4]/70">
        {racePlace(round)}, {round.country} · {round.date}
      </p>
      {round.status === "completed" ? (
        <>
          <PodiumBars round={round} drivers={data.drivers} teams={data.teams} />
          {race?.fastestLap ? (
            <p className="mt-3 font-mono text-sm" style={{ color: "#C44DFF" }}>
              Fastest lap {race.fastestLap.time} · {race.fastestLap.code}
            </p>
          ) : null}
          <div className="mt-6">
            <RaceLeaderboard race={race} teams={data.teams} emptyLabel="No classification." />
          </div>
        </>
      ) : (
        <p className="mt-4 border border-dashed border-[#F4EFE4]/30 p-3 text-sm text-[#F4EFE4]/80">
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
  const here = data.season.rounds.find((round) => round.circuitId === circuit.circuitId);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 text-[#F4EFE4]">
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#F4EFE4]/60">
        2026 · {data.season.completedRounds} OF {data.season.totalRounds} RUN
      </p>
      <h1
        className="mt-4 text-[clamp(2.2rem,7vw,4.2rem)] leading-[0.9]"
        style={{ fontVariationSettings: '"wdth" 76', fontWeight: 650 }}
      >
        {here ? raceTitle(here) : circuit.name}
      </h1>
      <p className="mt-2 font-mono text-sm text-[#F4EFE4]/75">
        {here ? racePlace(here) : circuit.country}
      </p>
      <p className="mt-4 max-w-xl text-sm leading-6 text-[#F4EFE4]/80">
        Motion is reduced on this machine, so the lap is a map instead of a camera. Same data. Same unfinished season.
      </p>
      <svg className="mt-8 w-full max-w-sm" viewBox={`0 0 ${svg.size} ${svg.size}`} role="img" aria-label={`${circuit.name} racing line`}>
        <path d={svg.d} fill="none" stroke="#F4EFE4" strokeWidth="2.2" />
      </svg>
      <div className="mt-6 flex flex-wrap gap-2">
        {data.index.circuits.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectCircuit(id)}
            className="border border-[#F4EFE4]/25 px-2 py-1 text-left text-xs"
            style={{
              background: id === circuit.circuitId ? "#F4EFE4" : "transparent",
              color: id === circuit.circuitId ? "#151B26" : "#F4EFE4",
            }}
          >
            <span className="block">{circuitSwitcherLabel(id, data.season, id)}</span>
            <span className="block opacity-70">{circuitSwitcherPlace(id, data.season)}</span>
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
        <ol className="mt-4 space-y-2">
          {data.standings.drivers.slice(0, 10).map((driver) => (
            <li key={driver.driverId} className="flex items-center justify-between gap-2">
              <DriverChip driver={driver} teams={data.teams} compact />
              <span className="font-mono tabular-nums">{driver.points}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-10">
        <h2 className="text-2xl" style={{ fontVariationSettings: '"wdth" 80', fontWeight: 620 }}>
          Drivers
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data.drivers.map((driver) => (
            <DriverChip key={driver.driverId} driver={driver} teams={data.teams} />
          ))}
        </div>
      </section>
    </div>
  );
}
