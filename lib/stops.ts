import type { ContentStop, Season } from "./types";

/**
 * Where the chequered gantry stands. A lap is only ~300 scene units and the camera trails ~11
 * behind, so the gantry must sit well before t=1 or it would block the opening view.
 */
export const FINISH_T = 0.92;

export function buildStops(season: Season): ContentStop[] {
  const completed = season.rounds.filter((round) => round.status === "completed");
  const upcoming = season.rounds.filter((round) => round.status === "upcoming");
  const stops: ContentStop[] = [{ kind: "intro", t: 0.018 }];

  completed.forEach((round, index) => {
    const span = Math.max(completed.length - 1, 1);
    stops.push({
      kind: "round",
      t: 0.06 + (index / span) * 0.53,
      round,
    });
  });

  stops.push({ kind: "standings", t: 0.655 });
  stops.push({ kind: "drivers", t: 0.725 });

  upcoming.forEach((round, index) => {
    const span = Math.max(upcoming.length - 1, 1);
    stops.push({
      kind: "round",
      t: 0.785 + (index / span) * 0.06,
      round,
    });
  });

  // The chequered flag and the champions close the lap; everything after it is the victory lap.
  stops.push({ kind: "finale", t: 0.885 });

  return stops;
}

export function nearestStop(stops: ContentStop[], t: number) {
  let best = stops[0];
  let bestDistance = 1;
  for (const stop of stops) {
    const distance = Math.abs(t - stop.t);
    if (distance < bestDistance) {
      best = stop;
      bestDistance = distance;
    }
  }
  const arrival = bestDistance < 0.016;
  const proximity = Math.max(0, 1 - bestDistance / 0.055);
  return { stop: best, distance: bestDistance, arrival, proximity };
}

export function activeRound(stops: ContentStop[], t: number) {
  const rounds = stops.filter((stop) => stop.kind === "round");
  if (!rounds.length) return null;
  let current = rounds[0];
  for (const stop of rounds) {
    if (stop.kind !== "round") continue;
    if (t + 0.025 >= stop.t) current = stop;
  }
  return current.kind === "round" ? current.round : null;
}

export function brakeAmount(stops: ContentStop[], t: number) {
  let nearest = 1;
  for (const stop of stops) {
    nearest = Math.min(nearest, Math.abs(t - stop.t));
  }
  if (nearest > 0.045) return 0;
  return Math.max(0, 1 - nearest / 0.045);
}
