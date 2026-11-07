"use client";

import { useSyncExternalStore } from "react";
import { HelmetMark, Portrait } from "@/components/driver-chip";
import { getHudSnap, subscribeHud } from "@/lib/lap-store";
import { nearestStop } from "@/lib/stops";
import { teamById, teamFillStyle } from "@/lib/teams";
import type { ContentStop, Driver, PaddockData, SeasonRound, Team } from "@/lib/types";

const HEIGHT = { 1: 76, 2: 54, 3: 38 };
const PURPLE = "#C44DFF";

function PodiumColumn({
  place,
  driver,
  team,
}: {
  place: 1 | 2 | 3;
  driver: Driver;
  team: Team;
}) {
  return (
    <div className="flex w-[9.5rem] flex-col items-center sm:w-44">
      <div className="flex items-center gap-2">
        <Portrait driverId={driver.driverId} alt="" size={place === 1 ? 56 : 48} />
        <HelmetMark number={driver.permanentNumber} pattern={team.pattern} size={place === 1 ? 32 : 26} />
      </div>
      <div
        className="relative mt-2 w-full overflow-hidden"
        style={{
          height: HEIGHT[place],
          ...teamFillStyle(team),
        }}
      >
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5">
          <p className="font-mono text-[13px] tabular-nums tracking-[0.08em] text-[#F4EFE4]">
            {driver.permanentNumber} {driver.code}
          </p>
          <p className="truncate text-[11px] leading-4 text-[#F4EFE4]">{driver.familyName}</p>
        </div>
      </div>
      <p className="mt-1 font-mono text-[10px] tracking-[0.22em] text-[#F4EFE4]/50">P{place}</p>
    </div>
  );
}

export function PodiumBars({
  round,
  drivers,
  teams,
}: {
  round: SeasonRound;
  drivers: Driver[];
  teams: Team[];
}) {
  const order: (1 | 2 | 3)[] = [2, 1, 3];
  return (
    <div role="img" aria-label={`Podium for the ${round.raceName}`}>
      <div className="flex items-end justify-center gap-3 sm:gap-5">
        {order.map((place) => {
          const entry = round.podium.find((item) => item.position === place);
          const driver =
            drivers.find((item) => item.driverId === entry?.driverId) ??
            drivers.find((item) => item.driverId === (place === 1 ? round.winner?.driverId : ""));
          if (!driver) return null;
          const team = teamById(teams, driver.constructorId);
          return <PodiumColumn key={place} place={place} driver={driver} team={team} />;
        })}
      </div>
    </div>
  );
}

export function PodiumDock({ data, stops }: { data: PaddockData; stops: ContentStop[] }) {
  const snap = useSyncExternalStore(subscribeHud, getHudSnap, getHudSnap);
  const { stop } = nearestStop(stops, snap.t);
  const round = stop.kind === "round" ? stop.round : null;
  const fl = round ? data.results.rounds[String(round.round)]?.fastestLap : null;

  return (
    <div className="pointer-events-none shrink-0 border-t border-[#F4EFE4]/12 bg-[#0A1018] px-4 py-3 sm:px-8">
      {round && round.status === "completed" ? (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-end sm:justify-center sm:gap-10">
          <p className="font-mono text-[10px] tracking-[0.28em] text-[#F4EFE4]/45 sm:mb-6">PODIUM</p>
          <PodiumBars round={round} drivers={data.drivers} teams={data.teams} />
          {fl ? (
            <p className="font-mono text-[11px] tabular-nums tracking-[0.08em] sm:mb-6" style={{ color: PURPLE }}>
              FL {fl.time} · {fl.code}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="py-6 text-center font-mono text-[11px] tracking-[0.2em] text-[#F4EFE4]/35">
          {round?.status === "upcoming" ? "Podium waits until this round is run." : "Travel the lap for a podium."}
        </p>
      )}
    </div>
  );
}
