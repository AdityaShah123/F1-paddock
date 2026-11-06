import type { Season, SeasonRound } from "./types";

export function raceTitle(round: SeasonRound) {
  return round.raceName;
}

export function racePlace(round: SeasonRound) {
  return `${round.locality}`;
}

export function circuitSwitcherLabel(circuitId: string, season: Season, fallback?: string) {
  const round = season.rounds.find((item) => item.circuitId === circuitId);
  if (!round) return fallback ?? circuitId;
  return round.raceName;
}

export function circuitSwitcherPlace(circuitId: string, season: Season) {
  const round = season.rounds.find((item) => item.circuitId === circuitId);
  if (!round) return "";
  if (circuitId === "sepang") return `${round.locality} · Malaysia`;
  return round.locality;
}
