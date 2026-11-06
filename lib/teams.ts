import type { CSSProperties } from "react";
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

export function teamFillStyle(team: Team): CSSProperties {
  if (team.pattern === "stripe") {
    return {
      backgroundImage: `repeating-linear-gradient(135deg, ${team.colour} 0 7px, ${team.accent} 7px 11px)`,
    };
  }
  if (team.pattern === "dot") {
    return {
      backgroundColor: team.colour,
      backgroundImage: `radial-gradient(${team.accent} 1.2px, transparent 1.4px)`,
      backgroundSize: "7px 7px",
    };
  }
  if (team.pattern === "outline") {
    return {
      backgroundColor: "transparent",
      boxShadow: `inset 0 0 0 2px ${team.colour}`,
    };
  }
  return { backgroundColor: team.colour };
}
