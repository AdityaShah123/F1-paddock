"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DriverChip } from "@/components/driver-chip";
import { ClassificationColumn } from "@/components/race-leaderboard";
import { getHudSnap, subscribeHud } from "@/lib/lap-store";
import { circuitSwitcherLabel, circuitSwitcherPlace, racePlace, raceTitle } from "@/lib/names";
import { activeRound, nearestStop } from "@/lib/stops";
import { patternDash, teamById } from "@/lib/teams";
import type { Circuit, ContentStop, PaddockData, SeasonRound } from "@/lib/types";

function formatDate(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function upcomingCopy(round: SeasonRound) {
  if (round.circuitId === "interlagos") {
    return "São Paulo is this weekend. No racing line yet — the session has not been run.";
  }
  if (round.circuitId === "vegas") {
    return "The strip is still a ghost pin. No telemetry until the cars roll.";
  }
  if (round.circuitId === "losail") {
    return "Qatar is on the calendar and under review. The pin is unlit on purpose.";
  }
  if (round.circuitId === "yas_marina") {
    return "Abu Dhabi is the last lock. Four rounds still have to happen.";
  }
  return "This round has not been run. The season is live, not archived.";
}

function IntroCard({ circuit, data }: { circuit: Circuit; data: PaddockData }) {
  const round = data.season.rounds.find((item) => item.circuitId === circuit.circuitId);
  return (
    <div className="text-center">
      <p className="font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/55">
        {data.season.year} · {data.season.completedRounds} OF {data.season.totalRounds} RUN
      </p>
      <h2
        className="mt-3 text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.86] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 72', fontWeight: 650 }}
      >
        {round ? raceTitle(round) : circuit.name}
      </h2>
      <p className="mt-3 font-mono text-sm tracking-[0.12em] text-[#F4EFE4]/70">
        {round ? racePlace(round) : circuit.country}
        <span className="mx-3 text-[#F4EFE4]/30">/</span>
        {circuit.lengthMetres.toLocaleString()} m
      </p>
    </div>
  );
}

function RoundCard({ round, data }: { round: SeasonRound; data: PaddockData }) {
  if (round.status !== "completed") {
    return (
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/55">
          ROUND {round.round} · UNRUN
        </p>
        <h2
          className="mt-3 text-[clamp(2.2rem,5.4vw,4.1rem)] leading-[0.86] text-[#F4EFE4]"
          style={{ fontVariationSettings: '"wdth" 72', fontWeight: 620 }}
        >
          {raceTitle(round)}
        </h2>
        <p className="mt-3 font-mono text-xs tracking-[0.12em] text-[#F4EFE4]/60">
          {formatDate(round.date)} · {racePlace(round)}
        </p>
        <p className="mx-auto mt-6 max-w-md text-sm leading-6 text-[#F4EFE4]/75">{upcomingCopy(round)}</p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/55">
        ROUND {round.round} · CHEQUERED
      </p>
      <h2
        className="mt-3 text-[clamp(2.2rem,5.4vw,4.1rem)] leading-[0.86] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 72', fontWeight: 620 }}
      >
        {raceTitle(round)}
      </h2>
      <p className="mt-3 font-mono text-xs tracking-[0.12em] text-[#F4EFE4]/60">
        {formatDate(round.date)} · {racePlace(round)}
      </p>
    </div>
  );
}

function StandingsCard({ data }: { data: PaddockData }) {
  const top = data.standings.drivers.slice(0, 8);
  const maxPoints = Math.max(...data.arc.series.map((series) => series.cumulative.at(-1) ?? 0), 1);
  const width = 420;
  const height = 132;

  return (
    <div className="mx-auto max-w-xl text-center">
      <p className="font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/55">
        THROUGH ROUND {data.standings.throughRound}
      </p>
      <h2
        className="mt-3 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.86] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 70', fontWeight: 650 }}
      >
        Antonelli, then daylight
      </h2>
      <svg
        className="mx-auto mt-6 w-full max-w-[420px]"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Cumulative points through nineteen rounds"
      >
        {data.arc.series.map((series) => {
          const driver = data.standings.drivers.find((item) => item.driverId === series.driverId);
          const team = teamById(data.teams, driver?.constructorId ?? "");
          const highlighted = (driver?.position ?? 99) <= 6;
          const d = series.cumulative
            .map((points, index) => {
              const x = (index / Math.max(series.cumulative.length - 1, 1)) * (width - 8) + 4;
              const y = height - 8 - (points / maxPoints) * (height - 16);
              return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
            })
            .join(" ");
          return (
            <path
              key={series.driverId}
              d={d}
              fill="none"
              stroke={team.colour}
              strokeWidth={highlighted ? 2.2 : 1}
              strokeOpacity={highlighted ? 0.95 : 0.22}
              strokeDasharray={patternDash(team.pattern)}
            />
          );
        })}
      </svg>
      <ol className="mx-auto mt-5 max-w-md space-y-2 text-left">
        {top.map((driver) => (
          <li key={driver.driverId} className="flex items-center justify-between gap-2">
            <DriverChip driver={driver} teams={data.teams} compact />
            <span className="font-mono text-lg tabular-nums text-[#F4EFE4]">{driver.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function DriversCard({ data }: { data: PaddockData }) {
  const ordered = [...data.drivers].sort((a, b) => {
    const pa = data.standings.drivers.find((item) => item.driverId === a.driverId)?.position ?? 99;
    const pb = data.standings.drivers.find((item) => item.driverId === b.driverId)?.position ?? 99;
    return pa - pb;
  });

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/55">THE GRID</p>
      <h2
        className="mt-3 text-[clamp(2.2rem,5vw,3.8rem)] leading-[0.86] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 70', fontWeight: 650 }}
      >
        Helmet, number, face
      </h2>
      <div className="mt-6 grid max-h-[52vh] grid-cols-1 gap-x-8 gap-y-3 overflow-y-auto text-left sm:grid-cols-2">
        {ordered.map((driver) => (
          <DriverChip key={driver.driverId} driver={driver} teams={data.teams} />
        ))}
      </div>
    </div>
  );
}

export function Hud({
  data,
  circuit,
  stops,
  onSelectCircuit,
  circuitLoading,
}: {
  data: PaddockData;
  circuit: Circuit;
  stops: ContentStop[];
  onSelectCircuit: (id: string) => void;
  circuitLoading: boolean;
}) {
  const snap = useSyncExternalStore(subscribeHud, getHudSnap, getHudSnap);
  const { stop, proximity } = nearestStop(stops, snap.t);
  const opacity = 0.42 + proximity * 0.58;
  const travelRound = activeRound(stops, snap.t);
  const race = travelRound ? data.results.rounds[String(travelRound.round)] ?? null : null;
  const rows = (race?.results ?? []).slice(0, 10);
  const left = rows.slice(0, 5);
  const right = rows.slice(5, 10);
  const purpleId = race?.fastestLap?.driverId;
  const showFlanks = stop.kind === "intro" || stop.kind === "round";

  const panel = useMemo(() => {
    if (stop.kind === "intro") return <IntroCard circuit={circuit} data={data} />;
    if (stop.kind === "standings") return <StandingsCard data={data} />;
    if (stop.kind === "drivers") return <DriversCard data={data} />;
    return <RoundCard round={stop.round} data={data} />;
  }, [stop, circuit, data]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      <div className="absolute inset-x-0 top-0 px-4 pt-3 sm:px-6">
        <CircuitTape
          data={data}
          currentId={circuit.circuitId}
          onSelect={onSelectCircuit}
          loading={circuitLoading}
        />
      </div>

      {showFlanks ? (
        <>
          <aside className="absolute top-1/2 left-4 hidden w-[17.5rem] -translate-y-1/2 md:block lg:left-7">
            <ClassificationColumn
              rows={left}
              race={race}
              teams={data.teams}
              purpleId={purpleId}
              align="left"
              label="1–5"
            />
          </aside>
          <aside className="absolute top-1/2 right-4 hidden w-[17.5rem] -translate-y-1/2 md:block lg:right-7">
            <ClassificationColumn
              rows={right}
              race={race}
              teams={data.teams}
              purpleId={purpleId}
              align="right"
              label="6–10"
            />
          </aside>
        </>
      ) : null}

      <div
        className="absolute inset-x-[20%] top-[11%] hidden transition-opacity duration-200 md:block"
        style={{ opacity }}
      >
        {panel}
      </div>
      <div
        className="absolute inset-x-4 top-14 transition-opacity duration-200 md:hidden"
        style={{ opacity }}
      >
        {panel}
      </div>

      {showFlanks ? (
        <div className="absolute inset-x-4 bottom-4 grid grid-cols-2 gap-3 md:hidden">
          <ClassificationColumn rows={left} race={race} teams={data.teams} purpleId={purpleId} align="left" />
          <ClassificationColumn rows={right} race={race} teams={data.teams} purpleId={purpleId} align="right" />
        </div>
      ) : null}

      <p className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 font-mono text-[11px] tracking-[0.28em] text-[#F4EFE4]/40 sm:block">
        LAP {(snap.t * 100).toFixed(0)}
      </p>
    </div>
  );
}

function CircuitTape({
  data,
  currentId,
  onSelect,
  loading,
}: {
  data: PaddockData;
  currentId: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const items = data.index.circuits.map((id) => {
    const round = data.season.rounds.find((item) => item.circuitId === id);
    return {
      id,
      title: circuitSwitcherLabel(id, data.season, id),
      place: circuitSwitcherPlace(id, data.season),
      round,
    };
  });

  return (
    <div className="pointer-events-auto">
      <div className="hidden items-baseline gap-5 overflow-x-auto pb-1 md:flex">
        {items.map((item) => {
          const active = item.id === currentId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="shrink-0 text-left"
              style={{ color: active ? "#F4EFE4" : "rgba(244,239,228,0.38)" }}
            >
              <span
                className="block font-mono text-[10px] tracking-[0.16em]"
                style={{ fontVariationSettings: active ? '"wdth" 110' : '"wdth" 90' }}
              >
                {item.place.toUpperCase()}
              </span>
            </button>
          );
        })}
        {loading ? <p className="font-mono text-[10px] tracking-[0.16em] text-[#F4EFE4]/40">LINE…</p> : null}
      </div>
      <div className="flex justify-end md:hidden">
        <Sheet>
          <SheetTrigger
            nativeButton={false}
            render={
              <Button variant="outline" className="border-[#F4EFE4]/20 bg-transparent text-[#F4EFE4]">
                Circuits
              </Button>
            }
          />
          <SheetContent side="right" className="border-[#F4EFE4]/15 bg-[#1C2636] text-[#F4EFE4]">
            <SheetHeader>
              <SheetTitle className="text-[#F4EFE4]">Circuits with a racing line</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 p-4">
              {items.map((item) => (
                <Button
                  key={item.id}
                  variant={item.id === currentId ? "secondary" : "ghost"}
                  className="h-auto justify-start whitespace-normal py-2 text-left text-[#F4EFE4]"
                  onClick={() => onSelect(item.id)}
                >
                  {item.title}
                  <span className="block font-mono text-[10px] opacity-70">{item.place}</span>
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
