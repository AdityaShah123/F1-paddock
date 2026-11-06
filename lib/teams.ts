import type { Team, TeamPattern } from "./types";

const FALLBACK: Team = {
  constructorId: "unknown",
  name: "Unknown",
  colour: "#C8CCCE",
  accent: "#FFFFFF",
  pattern: "outline",
  collidesWith: [],
};

export function teamById(teams: Team[], constructorId: string): Team {
  return teams.find((team) => team.constructorId === constructorId) ?? FALLBACK;
}

export function patternDash(pattern: TeamPattern): string | undefined {
  if (pattern === "stripe") return "7 5";
  if (pattern === "dot") return "1.6 5.5";
  if (pattern === "outline") return undefined;
  return undefined;
}

export function patternFillOpacity(pattern: TeamPattern): number {
  if (pattern === "solid") return 0.88;
  if (pattern === "stripe") return 0.28;
  if (pattern === "dot") return 0.2;
  return 0;
}
