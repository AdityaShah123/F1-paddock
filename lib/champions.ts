import type { PaddockData, StandingConstructor, StandingDriver } from "./types";

// None of the last four 2026 rounds (Brazil, Vegas, Qatar, Abu Dhabi) carry a sprint,
// so the most anyone can still score is a win per round.
const MAX_DRIVER_PER_ROUND = 25;
const MAX_TEAM_PER_ROUND = 25 + 18;

export type TitleState<T> = {
  leader: T;
  runnerUp: T;
  gap: number;
  roundsLeft: number;
  clinched: boolean;
};

export function championships(data: PaddockData) {
  const roundsLeft = data.season.rounds.filter((round) => round.status === "upcoming").length;
  const [d1, d2] = data.standings.drivers;
  const [c1, c2] = data.standings.constructors;
  const driverGap = d1.points - d2.points;
  const teamGap = c1.points - c2.points;

  const drivers: TitleState<StandingDriver> = {
    leader: d1,
    runnerUp: d2,
    gap: driverGap,
    roundsLeft,
    clinched: driverGap > roundsLeft * MAX_DRIVER_PER_ROUND,
  };
  const constructors: TitleState<StandingConstructor> = {
    leader: c1,
    runnerUp: c2,
    gap: teamGap,
    roundsLeft,
    clinched: teamGap > roundsLeft * MAX_TEAM_PER_ROUND,
  };
  return { drivers, constructors };
}
