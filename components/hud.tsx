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
import { DriverForm, HelmetMark } from "@/components/driver-form";
import { getHudSnap, subscribeHud } from "@/lib/lap-store";
import { circuitLabel } from "@/lib/load-data";
import { nearestStop } from "@/lib/stops";
import { patternDash, teamById } from "@/lib/teams";
import type {
  Circuit,
  ContentStop,
  Driver,
  PaddockData,
  SeasonRound,
} from "@/lib/types";

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

function IntroCard({ circuit, season }: { circuit: Circuit; season: PaddockData["season"] }) {
  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#E8E2D4]/55">
        {season.year} · {season.completedRounds} OF {season.totalRounds} RUN
      </p>
      <h2
        className="mt-3 max-w-[16ch] text-[clamp(2.2rem,7vw,5.4rem)] leading-[0.86] text-[#E8E2D4]"
        style={{ fontVariationSettings: '"wdth" 72', fontWeight: 650 }}
      >
        {circuit.name.replace("Circuit de ", "").replace("International Circuit", "").trim()}
      </h2>
      <p className="mt-4 font-mono text-sm text-[#E8E2D4]/75">
        {circuit.lengthMetres.toLocaleString()} M · REAL LINE · Y UP
      </p>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#E8E2D4]/72">
        Antonelli leads by 119 with four races left. Travel the lap. The season is placed on it.
      </p>
    </div>
  );
}

function RoundCard({
  round,
  drivers,
}: {
  round: SeasonRound;
  drivers: Driver[];
}) {
  const winner = drivers.find((driver) => driver.driverId === round.winner?.driverId);
  if (round.status !== "completed") {
    return (
      <div>
        <p className="font-mono text-[11px] tracking-[0.18em] text-[#E8E2D4]/55">
          ROUND {round.round} · UNRUN
        </p>
        <h2
          className="mt-3 max-w-[14ch] text-[clamp(2rem,6vw,4.4rem)] leading-[0.88] text-[#E8E2D4]/80"
          style={{ fontVariationSettings: '"wdth" 78', fontWeight: 620 }}
        >
          {round.raceName.replace("Grand Prix", "").trim()}
        </h2>
        <p className="mt-3 font-mono text-xs text-[#E8E2D4]/60">{formatDate(round.date)} · {round.locality}</p>
        <p className="mt-4 max-w-md border border-dashed border-[#E8E2D4]/25 bg-[#E8E2D4]/5 p-4 text-sm leading-6 text-[#E8E2D4]/78">
          {upcomingCopy(round)}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#E8E2D4]/55">
        ROUND {round.round} · CHEQUERED
      </p>
      <h2
        className="mt-3 max-w-[14ch] text-[clamp(2rem,6vw,4.4rem)] leading-[0.88] text-[#E8E2D4]"
        style={{ fontVariationSettings: '"wdth" 78', fontWeight: 620 }}
      >
        {round.locality}
      </h2>
      <p className="mt-3 font-mono text-xs text-[#E8E2D4]/60">
        {formatDate(round.date)} · {round.raceName}
      </p>
      <p className="mt-5 text-sm text-[#E8E2D4]/80">
        {winner ? `${winner.givenName} ${winner.familyName}` : round.winner?.code} took it
        {round.winner?.code ? ` · ${round.winner.code}` : ""}.
      </p>
      <ol className="mt-3 space-y-1 font-mono text-xs text-[#E8E2D4]/70">
        {round.podium.map((entry) => {
          const driver = drivers.find((item) => item.driverId === entry.driverId);
          return (
            <li key={entry.driverId}>
              P{entry.position} {driver?.code ?? entry.driverId}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function StandingsCard({ data }: { data: PaddockData }) {
  const top = data.standings.drivers.slice(0, 8);
  const maxPoints = Math.max(...data.arc.series.map((series) => series.cumulative.at(-1) ?? 0), 1);
  const width = 420;
  const height = 148;

  return (
    <div className="max-w-xl">
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#E8E2D4]/55">
        THROUGH ROUND {data.standings.throughRound}
      </p>
      <h2
        className="mt-3 text-[clamp(2rem,5vw,3.6rem)] leading-[0.9] text-[#E8E2D4]"
        style={{ fontVariationSettings: '"wdth" 70', fontWeight: 650 }}
      >
        Antonelli, then daylight
      </h2>
      <svg
        className="mt-5 w-full max-w-[420px]"
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
              strokeWidth={highlighted ? 2.1 : 1}
              strokeOpacity={highlighted ? 0.95 : 0.18}
              strokeDasharray={patternDash(team.pattern)}
            />
          );
        })}
      </svg>
      <ol className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {top.map((driver) => {
          const team = teamById(data.teams, driver.constructorId);
          return (
            <li key={driver.driverId} className="flex items-center gap-2 text-sm">
              <span className="w-4 font-mono text-[11px] text-[#E8E2D4]/50">{driver.position}</span>
              <span
                className="size-2.5 shrink-0"
                style={{
                  background: team.pattern === "outline" ? "transparent" : team.colour,
                  boxShadow: `inset 0 0 0 ${team.pattern === "outline" ? 1.5 : 0}px ${team.colour}`,
                  outline: team.pattern === "dot" ? `1.5px dotted ${team.accent}` : undefined,
                  backgroundImage:
                    team.pattern === "stripe"
                      ? `repeating-linear-gradient(45deg, ${team.colour}, ${team.colour} 4px, ${team.accent} 4px, ${team.accent} 7px)`
                      : undefined,
                }}
                aria-hidden
              />
              <span className="font-mono tracking-[0.12em]">{driver.code}</span>
              <span className="text-[#E8E2D4]/55">{driver.familyName}</span>
              <span className="ml-auto font-mono text-[#E8E2D4]/80">{driver.points}</span>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 max-w-md text-xs leading-5 text-[#E8E2D4]/55">
        Colour is the team, never the driver. Audi and Ferrari are 16 apart in RGB — the dash pattern is the tiebreaker.
      </p>
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
      <p className="font-mono text-[11px] tracking-[0.18em] text-[#E8E2D4]/55">GRID FORMS</p>
      <h2
        className="mt-3 text-[clamp(2rem,5vw,3.6rem)] leading-[0.9] text-[#E8E2D4]"
        style={{ fontVariationSettings: '"wdth" 70', fontWeight: 650 }}
      >
        Speed as a portrait
      </h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-[#E8E2D4]/70">
        Each shape is that driver’s downsampled speed trace, coloured by the team and broken with the team pattern so the two reds never collapse.
      </p>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {ordered.map((driver, index) => (
          <div key={driver.driverId} className="flex flex-col items-center">
            <DriverForm
              driver={driver}
              teams={data.teams}
              size={index === 0 ? 120 : 96}
              featured={index === 0}
            />
            <HelmetMark
              number={driver.permanentNumber}
              colour={teamById(data.teams, driver.constructorId).colour}
              accent={teamById(data.teams, driver.constructorId).accent}
              pattern={teamById(data.teams, driver.constructorId).pattern}
            />
          </div>
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
  const { stop, proximity, arrival } = nearestStop(stops, snap.t);
  const opacity = 0.22 + proximity * 0.78;

  const panel = useMemo(() => {
    if (stop.kind === "intro") return <IntroCard circuit={circuit} season={data.season} />;
    if (stop.kind === "standings") return <StandingsCard data={data} />;
    if (stop.kind === "drivers") return <DriversCard data={data} />;
    return <RoundCard round={stop.round} drivers={data.drivers} />;
  }, [stop, circuit, data]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 pb-16 sm:p-7 sm:pb-16">
      <div className="flex items-start justify-between gap-4">
        <div
          className="pointer-events-auto max-w-[min(100%,42rem)] transition-opacity duration-200"
          style={{ opacity }}
        >
          {panel}
          {arrival ? (
            <p className="mt-3 font-mono text-[10px] tracking-[0.2em] text-[#E8E2D4]/40">ON THE MARK</p>
          ) : null}
        </div>
        <CircuitTape
          data={data}
          currentId={circuit.circuitId}
          onSelect={onSelectCircuit}
          loading={circuitLoading}
        />
      </div>
      <div className="flex items-end justify-between gap-4">
        <p className="font-mono text-[11px] text-[#E8E2D4]/45">
          LAP {(snap.t * 100).toFixed(0)}% · SCROLL THE LINE
        </p>
        <p className="hidden max-w-xs text-right text-[11px] leading-4 text-[#E8E2D4]/40 sm:block">
          Straights open the lens. Brake marks pull you in. Four pins still dark.
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
    return { id, label: circuitLabel(id, data.season, id), round };
  });

  return (
    <div className="pointer-events-auto">
      <div className="hidden max-h-[70vh] w-44 flex-col overflow-y-auto border-l border-[#E8E2D4]/15 pl-3 md:flex">
        <p className="font-mono text-[10px] tracking-[0.18em] text-[#E8E2D4]/40">CIRCUITS</p>
        {items.map((item) => {
          const active = item.id === currentId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className="mt-2 text-left font-[family-name:var(--font-archivo)] text-sm transition-colors"
              style={{
                color: active ? "#E8E2D4" : "rgba(232,226,212,0.48)",
                fontVariationSettings: active ? '"wdth" 118' : '"wdth" 92',
              }}
            >
              {item.label}
              {item.id === "sepang" ? (
                <span className="block font-mono text-[9px] tracking-[0.12em] text-[#E8E2D4]/40">
                  BAHRAIN GP · MALAYSIA
                </span>
              ) : null}
            </button>
          );
        })}
        {loading ? <p className="mt-3 font-mono text-[10px] text-[#E8E2D4]/40">LOADING LINE…</p> : null}
      </div>
      <div className="md:hidden">
        <Sheet>
          <SheetTrigger
            nativeButton={false}
            render={
              <Button variant="outline" className="border-[#E8E2D4]/25 bg-black/40 text-[#E8E2D4]">
                Circuits
              </Button>
            }
          />
          <SheetContent side="right" className="border-[#E8E2D4]/15 bg-[#020203] text-[#E8E2D4]">
            <SheetHeader>
              <SheetTitle className="text-[#E8E2D4]">Circuits with a racing line</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-2 p-4">
              {items.map((item) => (
                <Button
                  key={item.id}
                  variant={item.id === currentId ? "secondary" : "ghost"}
                  className="justify-start text-[#E8E2D4]"
                  onClick={() => onSelect(item.id)}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
