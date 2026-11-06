"use client";

import { HelmetMark, Portrait } from "@/components/driver-chip";
import { teamById, teamFillStyle } from "@/lib/teams";
import type { Driver, SeasonRound, Team } from "@/lib/types";

const HEIGHT = { 1: 148, 2: 96, 3: 62 };

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
    <div className="mt-4" role="img" aria-label={`Podium for the ${round.raceName}`}>
      <div className="flex items-end justify-start gap-2 sm:gap-3">
        {order.map((place) => {
          const entry = round.podium.find((item) => item.position === place);
          const driver =
            drivers.find((item) => item.driverId === entry?.driverId) ??
            drivers.find((item) => item.driverId === (place === 1 ? round.winner?.driverId : ""));
          if (!driver) return null;
          const team = teamById(teams, driver.constructorId);
          return (
            <div key={place} className="flex w-[6.6rem] flex-col items-center sm:w-[7.4rem]">
              <Portrait driverId={driver.driverId} colour={team.colour} alt="" size={place === 1 ? 52 : 42} />
              <HelmetMark
                number={driver.permanentNumber}
                colour={team.colour}
                accent={team.accent}
                pattern={team.pattern}
                size={place === 1 ? 40 : 32}
              />
              <p className="mt-1 font-mono text-[15px] tabular-nums tracking-wide text-[#F4EFE4]">
                {driver.permanentNumber} {driver.code}
              </p>
              <p className="max-w-full truncate text-[11px] leading-4 text-[#F4EFE4]/85">
                {driver.familyName}
              </p>
              <div
                className="mt-2 w-full"
                style={{
                  height: HEIGHT[place],
                  ...teamFillStyle(team),
                  boxShadow: place === 1 ? `0 0 22px ${team.colour}66` : undefined,
                }}
              />
              <p className="mt-1 font-mono text-[11px] tabular-nums text-[#F4EFE4]/75">P{place}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
