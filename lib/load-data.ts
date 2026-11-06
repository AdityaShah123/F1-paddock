import type {
  Circuit,
  DataIndex,
  Driver,
  PaddockData,
  ResultsFile,
  Season,
  SeasonArc,
  Standings,
  TeamsFile,
} from "./types";

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function loadCircuit(circuitId: string): Promise<Circuit> {
  return getJson<Circuit>(`/data/circuits/${circuitId}.json`);
}

export async function loadPaddock(defaultCircuitId = "spa"): Promise<PaddockData> {
  const [index, season, standings, arc, teamsFile, results] = await Promise.all([
    getJson<DataIndex>("/data/index.json"),
    getJson<Season>("/data/season.json"),
    getJson<Standings>("/data/standings.json"),
    getJson<SeasonArc>("/data/season-arc.json"),
    getJson<TeamsFile>("/data/teams.json"),
    getJson<ResultsFile>("/data/results.json"),
  ]);

  const circuitId = index.circuits.includes(defaultCircuitId)
    ? defaultCircuitId
    : index.circuits[0];

  const [circuit, drivers] = await Promise.all([
    loadCircuit(circuitId),
    Promise.all(
      index.drivers.map((driverId) => getJson<Driver>(`/data/drivers/${driverId}.json`)),
    ),
  ]);

  return {
    index,
    season,
    standings,
    arc,
    teams: teamsFile.teams,
    drivers,
    circuit,
    results,
  };
}
