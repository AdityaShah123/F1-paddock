"use client";

import { HelmetMark, Portrait } from "@/components/driver-chip";
import { teamById, teamFillStyle } from "@/lib/teams";
import type { Driver, SeasonRound, Team } from "@/lib/types";

const HEIGHT = { 1: 132, 2: 86, 3: 54 };

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
      <div className="flex items-end justify-center gap-4">
        {order.map((place) => {
          const entry = round.podium.find((item) => item.position === place);
          const driver =
            drivers.find((item) => item.driverId === entry?.driverId) ??
            drivers.find((item) => item.driverId === (place === 1 ? round.winner?.driverId : ""));
          if (!driver) return null;
          const team = teamById(teams, driver.constructorId);
          return (
            <div key={place} className="flex w-[6.4rem] flex-col items-center sm:w-[7.2rem]">
              <Portrait driverId={driver.driverId} alt="" size={place === 1 ? 48 : 38} />
              <HelmetMark number={driver.permanentNumber} pattern={team.pattern} size={place === 1 ? 36 : 28} />
              <p className="mt-1 font-mono text-[14px] tabular-nums tracking-[0.08em] text-[#F4EFE4]">
                {driver.permanentNumber} {driver.code}
              </p>
              <p className="max-w-full truncate text-[11px] tracking-wide text-[#F4EFE4]/70">
                {driver.familyName}
              </p>
              <div
                className="mt-2 w-full"
                style={{
                  height: HEIGHT[place],
                  ...teamFillStyle(team),
                  boxShadow: place === 1 ? `0 0 28px ${team.colour}77` : undefined,
                }}
              />
              <p className="mt-1.5 font-mono text-[10px] tracking-[0.2em] text-[#F4EFE4]/50">P{place}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
