"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Trophy } from "lucide-react";
import { DriverChip, Portrait } from "@/components/driver-chip";
import { ClassificationColumn } from "@/components/race-leaderboard";
import { flagSrc } from "@/lib/flags";
import { getHudSnap, subscribeHud } from "@/lib/lap-store";
import { championships } from "@/lib/champions";
import { racePlace, raceTitle } from "@/lib/names";
import { activeRound, nearestStop } from "@/lib/stops";
import { patternDash, teamById, teamFillStyle } from "@/lib/teams";
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

function RoundLabel({ round, suffix }: { round: SeasonRound; suffix: string }) {
  const flag = flagSrc(round.country);
  return (
    <p className="inline-flex items-center gap-2.5 font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/60">
      {flag ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={flag} alt="" className="race-flag !h-[1.05rem] !w-[1.4rem]" width={22} height={16} />
      ) : null}
      ROUND {round.round} · {suffix}
    </p>
  );
}

export function ChampionBadge({ data }: { data: PaddockData }) {
  const { drivers } = championships(data);
  if (!drivers.clinched) return null;
  const champ = drivers.leader;
  return (
    <span className="inline-flex items-center gap-2 border border-[#F5C542]/45 bg-[#F5C542]/10 px-3 py-1.5 font-mono text-[10px] tracking-[0.24em] text-[#F5C542]">
      <Trophy className="size-3.5" aria-hidden="true" />
      {data.season.year} WORLD CHAMPION · {champ.givenName.split(" ").at(-1)?.toUpperCase()}{" "}
      {champ.familyName.toUpperCase()}
    </span>
  );
}

function IntroCard({ circuit, data }: { circuit: Circuit; data: PaddockData }) {
  const round = data.season.rounds.find((item) => item.circuitId === circuit.circuitId);
  return (
    <div className="text-center">
      <p
        className="text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.82] tracking-[-0.02em] text-[#F4EFE4]"
        style={{ fontVariationSettings: '"wdth" 68', fontWeight: 680 }}
      >
        Paddock
      </p>
      <p className="mt-3 font-mono text-[11px] tracking-[0.32em] text-[#F4EFE4]/55">
        {data.season.year} · {data.season.completedRounds} OF {data.season.totalRounds} RUN
      </p>
      <div className="mt-3">
        <ChampionBadge data={data} />
      </div>
      <h2
        className="mt-2 text-[clamp(1.55rem,3.6vw,2.6rem)] leading-[0.92] text-[#F4EFE4]/92"
        style={{ fontVariationSettings: '"wdth" 78', fontWeight: 560 }}
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
        <RoundLabel round={round} suffix="UNRUN" />
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
      <RoundLabel round={round} suffix="CHEQUERED" />
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
        Antonelli, <span className="champion-gold">World Champion</span>
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

function FinaleCard({ data }: { data: PaddockData }) {
  const { drivers, constructors } = championships(data);
  const champ = drivers.leader;
  const team = teamById(data.teams, constructors.leader.constructorId);
  const champTeam = teamById(data.teams, champ.constructorId);
  const profile = data.drivers.find((item) => item.driverId === champ.driverId);
  const teamDrivers = data.standings.drivers
    .filter((item) => item.constructorId === constructors.leader.constructorId)
    .map((item) => item.code)
    .join(" · ");

  return (
    <div className="champion-in mx-auto max-w-[52rem]">
      <div className="text-center">
        <p className="font-mono text-[11px] tracking-[0.36em] text-[#F4EFE4]/60">
          CHEQUERED FLAG · {data.season.year}
        </p>
        <h2
          className="mt-2 text-[clamp(2rem,4.6vw,3.6rem)] leading-[0.86] text-[#F4EFE4]"
          style={{ fontVariationSettings: '"wdth" 68', fontWeight: 720 }}
        >
          The <span className="champion-gold">Champions</span>
        </h2>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <section className="champion-card overflow-hidden text-left" aria-label="Drivers' championship">
          <div className="checker-band" aria-hidden="true" />
          <div className="flex items-center gap-4 p-4">
            <span className="champion-ring shrink-0">
              <Portrait driverId={champ.driverId} alt={`${champ.givenName} ${champ.familyName}`} size={96} />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.26em] text-[#F5C542]">
                {drivers.clinched ? "DRIVERS’ WORLD CHAMPION" : "DRIVERS’ LEADER"}
              </p>
              <p
                className="mt-1 text-[1.75rem] leading-[0.95] text-[#F4EFE4]"
                style={{ fontVariationSettings: '"wdth" 74', fontWeight: 680 }}
              >
                {champ.givenName}
                <br />
                {champ.familyName}
              </p>
              <p className="mt-1.5 flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-[#F4EFE4]/70">
                <span className="inline-block h-2.5 w-2.5" style={{ backgroundColor: champTeam.colour }} />
                #{champ.permanentNumber} · {champTeam.name}
              </p>
            </div>
          </div>
          <dl className="hidden grid-cols-3 border-t border-[#F4EFE4]/10 font-mono sm:grid">
            <div className="px-4 py-2.5">
              <dt className="text-[9px] tracking-[0.24em] text-[#F4EFE4]/45">POINTS</dt>
              <dd className="text-xl tabular-nums text-[#F4EFE4]">{champ.points}</dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-[9px] tracking-[0.24em] text-[#F4EFE4]/45">WINS</dt>
              <dd className="text-xl tabular-nums text-[#F4EFE4]">{champ.wins}</dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-[9px] tracking-[0.24em] text-[#F4EFE4]/45">PODIUMS</dt>
              <dd className="text-xl tabular-nums text-[#F4EFE4]">{profile?.season.podiums ?? "—"}</dd>
            </div>
          </dl>
          <p className="border-t border-[#F5C542]/25 bg-[#F5C542]/10 px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#F5C542]">
            {drivers.clinched
              ? `CLINCHED WITH ${drivers.roundsLeft} ROUNDS TO SPARE · +${drivers.gap} OVER ${drivers.runnerUp.code}`
              : `LEADS BY ${drivers.gap} · ${drivers.roundsLeft} ROUNDS LEFT`}
          </p>
        </section>

        <section className="champion-card overflow-hidden text-left" aria-label="Constructors' championship">
          <div className="checker-band" aria-hidden="true" />
          <div className="flex items-center gap-4 p-4">
            <span
              className="flex size-[102px] shrink-0 items-center justify-center rounded-full"
              style={{ ...teamFillStyle(team), boxShadow: `0 0 36px ${team.colour}55` }}
            >
              <Trophy className="size-10 text-[#0A0F16]" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] tracking-[0.26em] text-[#F5C542]">
                {constructors.clinched ? "CONSTRUCTORS’ CHAMPION" : "CONSTRUCTORS’ LEADER"}
              </p>
              <p
                className="mt-1 text-[1.75rem] leading-[0.95] text-[#F4EFE4]"
                style={{ fontVariationSettings: '"wdth" 74', fontWeight: 680 }}
              >
                {constructors.leader.name}
              </p>
              <p className="mt-1.5 font-mono text-[11px] tracking-[0.12em] text-[#F4EFE4]/70">{teamDrivers}</p>
            </div>
          </div>
          <dl className="hidden grid-cols-3 border-t border-[#F4EFE4]/10 font-mono sm:grid">
            <div className="px-4 py-2.5">
              <dt className="text-[9px] tracking-[0.24em] text-[#F4EFE4]/45">POINTS</dt>
              <dd className="text-xl tabular-nums text-[#F4EFE4]">{constructors.leader.points}</dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-[9px] tracking-[0.24em] text-[#F4EFE4]/45">WINS</dt>
              <dd className="text-xl tabular-nums text-[#F4EFE4]">{constructors.leader.wins}</dd>
            </div>
            <div className="px-4 py-2.5">
              <dt className="text-[9px] tracking-[0.24em] text-[#F4EFE4]/45">GAP</dt>
              <dd className="text-xl tabular-nums text-[#F4EFE4]">+{constructors.gap}</dd>
            </div>
          </dl>
          <p className="border-t border-[#F4EFE4]/10 bg-[#F4EFE4]/[0.04] px-4 py-2 font-mono text-[10px] tracking-[0.18em] text-[#F4EFE4]/70">
            {constructors.clinched
              ? `CLINCHED · ${constructors.roundsLeft} ROUNDS TO SPARE`
              : `${constructors.gap} CLEAR OF ${constructors.runnerUp.name.toUpperCase()} · ${constructors.roundsLeft} TO RUN`}
          </p>
        </section>
      </div>
    </div>
  );
}

export function Hud({
  data,
  circuit,
  stops,
}: {
  data: PaddockData;
  circuit: Circuit;
  stops: ContentStop[];
}) {
  const snap = useSyncExternalStore(subscribeHud, getHudSnap, getHudSnap);
  const { stop, proximity } = nearestStop(stops, snap.t);
  // Once past the chequered flag the champions stay fully lit for the rest of the lap
  const opacity = stop.kind === "finale" && snap.t >= stop.t ? 1 : 0.42 + proximity * 0.58;
  // At the start of the lap the results follow the GP whose track you are on
  const homeRound = data.season.rounds.find((item) => item.circuitId === circuit.circuitId) ?? null;
  const travelRound = stop.kind === "intro" && homeRound ? homeRound : activeRound(stops, snap.t);
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
    if (stop.kind === "finale") return <FinaleCard data={data} />;
    return <RoundCard round={stop.round} data={data} />;
  }, [stop, circuit, data]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {showFlanks ? (
        <>
          <aside className="absolute top-[9%] left-3 hidden w-[15rem] md:block lg:left-5 xl:w-[16.5rem]">
            <ClassificationColumn
              rows={left}
              race={race}
              teams={data.teams}
              purpleId={purpleId}
              align="left"
              label="1–5"
            />
          </aside>
          <aside className="absolute top-[9%] right-3 hidden w-[15rem] md:block lg:right-5 xl:w-[16.5rem]">
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
        className={`absolute top-[7%] hidden transition-opacity duration-200 md:block ${stop.kind === "finale" ? "inset-x-[6%]" : "inset-x-[20%]"}`}
        style={{ opacity }}
      >
        {panel}
      </div>
      <div
        className="absolute inset-x-4 top-4 transition-opacity duration-200 md:hidden"
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
