export type RoundStatus = "completed" | "upcoming" | "cancelled";

export type SeasonRound = {
  round: number;
  circuitId: string;
  raceName: string;
  country: string;
  locality: string;
  date: string;
  status: RoundStatus;
  winner: { driverId: string; code: string; constructorId: string } | null;
  podium: { driverId: string; position: number }[];
};

export type Season = {
  year: number;
  lastUpdated: string;
  completedRounds: number;
  totalRounds: number;
  rounds: SeasonRound[];
};

export type StandingDriver = {
  position: number;
  driverId: string;
  code: string;
  permanentNumber: number;
  givenName: string;
  familyName: string;
  constructorId: string;
  teamColour: string;
  points: number;
  wins: number;
};

export type StandingConstructor = {
  position: number;
  constructorId: string;
  name: string;
  teamColour: string;
  points: number;
  wins: number;
};

export type Standings = {
  throughRound: number;
  drivers: StandingDriver[];
  constructors: StandingConstructor[];
};

export type SeasonArcSeries = {
  driverId: string;
  code: string;
  teamColour: string;
  cumulative: number[];
  positions: number[];
};

export type SeasonArc = {
  throughRound: number;
  rounds: number[];
  series: SeasonArcSeries[];
};

export type TeamPattern = "solid" | "stripe" | "outline" | "dot";

export type Team = {
  constructorId: string;
  name: string;
  colour: string;
  accent: string;
  pattern: TeamPattern;
  collidesWith: string[];
};

export type TeamsFile = { teams: Team[] };

export type DataIndex = {
  circuits: string[];
  drivers: string[];
};

export type CircuitCorner = {
  number: number;
  index: number;
  angle: number;
  lengthMetres: number;
};

export type Circuit = {
  circuitId: string;
  name: string;
  country: string;
  outlineSource?: string;
  sourceDriver?: number;
  sessionKey?: number;
  lengthMetres: number;
  points: [number, number, number][];
  speed: number[];
  throttle: number[];
  brake: number[];
  sectors: number[];
  corners?: CircuitCorner[];
};

export type DriverSeason = {
  points: number;
  wins: number;
  podiums: number;
  poles: number;
  dnfs: number;
  bestFinish: number;
  avgFinish: number;
};

export type Driver = {
  driverId: string;
  code: string;
  permanentNumber: number;
  givenName: string;
  familyName: string;
  nationality: string;
  constructorId: string;
  teamColour: string;
  speedTrace: number[];
  season: DriverSeason;
};

export type RaceResultRow = {
  position: number;
  driverId: string;
  code: string;
  permanentNumber: number;
  givenName: string;
  familyName: string;
  constructorId: string;
  status: string;
  time: string | null;
  fastestLap: { rank: number; lap: number; time: string } | null;
};

export type RaceResult = {
  round: number;
  raceName: string;
  circuitId: string;
  fastestLap: { driverId: string; code: string; time: string; lap: number } | null;
  results: RaceResultRow[];
};

export type ResultsFile = {
  throughRound: number;
  rounds: Record<string, RaceResult>;
};

export type PaddockData = {
  index: DataIndex;
  season: Season;
  standings: Standings;
  arc: SeasonArc;
  teams: Team[];
  drivers: Driver[];
  circuit: Circuit;
  results: ResultsFile;
};

export type StopKind = "intro" | "round" | "standings" | "drivers";

export type ContentStop =
  | { kind: "intro"; t: number }
  | { kind: "round"; t: number; round: SeasonRound }
  | { kind: "standings"; t: number }
  | { kind: "drivers"; t: number };
