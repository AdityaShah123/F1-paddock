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
import { PodiumBars } from "@/components/podium";
import { RaceLeaderboard } from "@/components/race-leaderboard";
import { getHudSnap, subscribeHud } from "@/lib/lap-store";
import { circuitSwitcherLabel, circuitSwitcherPlace, racePlace, raceTitle } from "@/lib/names";
import { activeRound, nearestStop } from "@/lib/stops";
import { patternDash, teamById } from "@/lib/teams";
import type { Circuit, ContentStop, PaddockData, SeasonRound } from "@/lib/types";

const PURPLE = "#C44DFF";

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

function FastestLapBadge({
  data,
  round,
}: {
  data: PaddockData;
  round: SeasonRound;
}) {
  const fl = data.results.rounds[String(round.round)]?.fastestLap;
  if (!fl) return null;
  const driver = data.drivers.find((item) => item.driverId === fl.driverId);
  return (
    <p className="mt-3 font-mono text-sm tabular-nums" style={{ color: PURPLE }}>
      Fastest lap {fl.time} · {fl.code}
      {driver ? ` ${driver.permanentNumber}` : ""}
    </p>
  );
}

function IntroCard({ circuit, data }: { circuit: Circuit; data: PaddockData }) {
  const round = data.season.rounds.find((item) => item.circuitId === circuit.circuitId);
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#F4EFE4]/70">
        {data.season.year} · {data.season.completedRounds} OF {data.season.totalRounds} RUN
      </p>
      <h2
        className="mt-2 max-w-[18ch] text-[clamp(1.8rem,5.4vw,3.8rem)] leading-[0.92] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 78', fontWeight: 650 }}
      >
        {round ? raceTitle(round) : circuit.name}
      </h2>
      <p className="mt-2 font-mono text-sm text-[#F4EFE4]/80">
        {round ? racePlace(round) : circuit.country} · {circuit.lengthMetres.toLocaleString()} m
      </p>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#F4EFE4]/85">
        Antonelli leads by 119 with four races left. Travel the lap. The season is placed on it.
      </p>
    </div>
  );
}

function RoundCard({ round, data }: { round: SeasonRound; data: PaddockData }) {
  if (round.status !== "completed") {
    return (
      <div>
        <p className="font-mono text-[11px] tracking-[0.18em] text-[#F4EFE4]/70">
          ROUND {round.round} · UNRUN
        </p>
        <h2
          className="mt-2 max-w-[18ch] text-[clamp(1.7rem,5vw,3.4rem)] leading-[0.92] text-[#F4EFE4]"
          style={{ fontVariationSettings: '"wdth" 78', fontWeight: 620 }}
        >
          {raceTitle(round)}
        </h2>
        <p className="mt-2 font-mono text-xs text-[#F4EFE4]/75">
          {formatDate(round.date)} · {racePlace(round)}
        </p>
        <p className="mt-4 max-w-md border border-dashed border-[#F4EFE4]/30 bg-[#F4EFE4]/8 p-4 text-sm leading-6 text-[#F4EFE4]/85">
          {upcomingCopy(round)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#F4EFE4]/70">
        ROUND {round.round} · CHEQUERED
      </p>
      <h2
        className="mt-2 max-w-[18ch] text-[clamp(1.7rem,5vw,3.4rem)] leading-[0.92] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 78', fontWeight: 620 }}
      >
        {raceTitle(round)}
      </h2>
      <p className="mt-2 font-mono text-xs text-[#F4EFE4]/75">
        {formatDate(round.date)} · {racePlace(round)}
      </p>
      <PodiumBars round={round} drivers={data.drivers} teams={data.teams} />
      <FastestLapBadge data={data} round={round} />
    </div>
  );
}

function StandingsCard({ data }: { data: PaddockData }) {
  const top = data.standings.drivers.slice(0, 8);
  const maxPoints = Math.max(...data.arc.series.map((series) => series.cumulative.at(-1) ?? 0), 1);
  const width = 420;
  const height = 132;

  return (
    <div className="max-w-xl">
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#F4EFE4]/70">
        THROUGH ROUND {data.standings.throughRound}
      </p>
      <h2
        className="mt-2 text-[clamp(1.8rem,4.5vw,3.2rem)] leading-[0.92] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 74', fontWeight: 650 }}
      >
        Antonelli, then daylight
      </h2>
      <svg
        className="mt-4 w-full max-w-[420px]"
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
      <ol className="mt-3 space-y-1">
        {top.map((driver) => (
          <li key={driver.driverId} className="flex items-center justify-between gap-2">
            <DriverChip driver={driver} teams={data.teams} compact />
            <span className="font-mono tabular-nums text-[#F4EFE4]">{driver.points}</span>
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
    <div className="max-w-3xl">
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#F4EFE4]/70">THE GRID</p>
      <h2
        className="mt-2 text-[clamp(1.8rem,4.5vw,3.2rem)] leading-[0.92] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 74', fontWeight: 650 }}
      >
        Helmet, number, face
      </h2>
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
  const opacity = 0.45 + proximity * 0.55;
  const travelRound = activeRound(stops, snap.t);
  const race = travelRound ? data.results.rounds[String(travelRound.round)] ?? null : null;

  const panel = useMemo(() => {
    if (stop.kind === "intro") return <IntroCard circuit={circuit} data={data} />;
    if (stop.kind === "standings") return <StandingsCard data={data} />;
    if (stop.kind === "drivers") return <DriversCard data={data} />;
    return <RoundCard round={stop.round} data={data} />;
  }, [stop, circuit, data]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pb-16 sm:p-6 sm:pb-16">
      <div className="flex items-start justify-between gap-4">
        <div
          className="pointer-events-auto max-w-[min(100%,40rem)] rounded-sm bg-[#151B26]/55 p-3 backdrop-blur-[2px] transition-opacity duration-200"
          style={{ opacity }}
        >
          {panel}
        </div>
        <CircuitTape
          data={data}
          currentId={circuit.circuitId}
          onSelect={onSelectCircuit}
          loading={circuitLoading}
        />
      </div>
      <div className="flex items-end justify-between gap-4">
        <RaceLeaderboard
          race={race}
          teams={data.teams}
          emptyLabel={
            travelRound?.status === "upcoming"
              ? "Classification waits until lights-out at this round."
              : "Scroll the lap to read a race."
          }
        />
        <p className="hidden font-mono text-[11px] text-[#F4EFE4]/55 sm:block">
          LAP {(snap.t * 100).toFixed(0)}%
        </p>
      </div>
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
      <div className="hidden max-h-[62vh] w-56 flex-col overflow-y-auto border-l border-[#F4EFE4]/20 bg-[#151B26]/70 pl-3 backdrop-blur-sm md:flex">
        <p className="font-mono text-[10px] tracking-[0.18em] text-[#F4EFE4]/55">CIRCUITS</p>
        {items.map((item) => {
          const active = item.id === currentId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="mt-2 text-left text-sm leading-5 transition-colors"
              style={{ color: active ? "#F4EFE4" : "rgba(244,239,228,0.62)" }}
            >
              <span className="block" style={{ fontVariationSettings: active ? '"wdth" 110' : '"wdth" 92' }}>
                {item.title}
              </span>
              <span className="block font-mono text-[10px] tracking-[0.08em] text-[#F4EFE4]/50">
                {item.place}
              </span>
            </button>
          );
        })}
        {loading ? <p className="mt-3 font-mono text-[10px] text-[#F4EFE4]/50">LOADING LINE…</p> : null}
      </div>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            nativeButton={false}
            render={
              <Button variant="outline" className="border-[#F4EFE4]/25 bg-[#151B26]/70 text-[#F4EFE4]">
                Circuits
              </Button>
            }
          />
          <SheetContent side="right" className="border-[#F4EFE4]/15 bg-[#151B26] text-[#F4EFE4]">
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
