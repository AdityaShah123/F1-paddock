"use client";

import { DriverChip } from "@/components/driver-chip";
import { teamById, teamFillStyle } from "@/lib/teams";
import type { Driver, SeasonRound, Team } from "@/lib/types";

const HEIGHT = { 1: 118, 2: 82, 3: 58 };

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
      <div className="flex items-end justify-start gap-3">
        {order.map((place) => {
          const entry = round.podium.find((item) => item.position === place);
          const driver =
            drivers.find((item) => item.driverId === entry?.driverId) ??
            drivers.find((item) => item.driverId === (place === 1 ? round.winner?.driverId : ""));
          if (!driver) return null;
          const team = teamById(teams, driver.constructorId);
          return (
            <div key={place} className="flex w-[7.2rem] flex-col items-center sm:w-36">
              <DriverChip driver={driver} teams={teams} compact />
              <div
                className="mt-2 w-full"
                style={{
                  height: HEIGHT[place],
                  ...teamFillStyle(team),
                  boxShadow: place === 1 ? `0 0 18px ${team.colour}55` : undefined,
                }}
              />
              <p className="mt-1 font-mono text-[11px] tabular-nums text-[#F4EFE4]/70">P{place}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
