import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const UA = "F1PaddockFanSite/1.0 (unofficial meetup demo; portraits cached locally)";

const WIKI = {
  albon: "Alexander_Albon",
  alonso: "Fernando_Alonso",
  antonelli: "Andrea_Kimi_Antonelli",
  arvid_lindblad: "Arvid_Lindblad",
  bearman: "Oliver_Bearman",
  bortoleto: "Gabriel_Bortoleto",
  bottas: "Valtteri_Bottas",
  colapinto: "Franco_Colapinto",
  gasly: "Pierre_Gasly",
  hadjar: "Isack_Hadjar",
  hamilton: "Lewis_Hamilton",
  hulkenberg: "Nico_Hülkenberg",
  lawson: "Liam_Lawson",
  leclerc: "Charles_Leclerc",
  max_verstappen: "Max_Verstappen",
  norris: "Lando_Norris",
  ocon: "Esteban_Ocon",
  perez: "Sergio_Pérez",
  piastri: "Oscar_Piastri",
  russell: "George_Russell_(racing_driver)",
  ryo_hirakawa: "Ryo_Hirakawa",
  sainz: "Carlos_Sainz_Jr.",
  stroll: "Lance_Stroll",
  tsunoda: "Yuki_Tsunoda",
};

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function bakeResults() {
  const rounds = {};
  for (let round = 1; round <= 19; round += 1) {
    const url = `https://api.jolpi.ca/ergast/f1/2026/${round}/results/?limit=40`;
    const json = await getJson(url);
    const race = json?.MRData?.RaceTable?.Races?.[0];
    if (!race) {
      console.log("skip round", round);
      continue;
    }
    const results = (race.Results ?? []).map((row) => ({
      position: Number(row.position),
      driverId: row.Driver.driverId,
      code: row.Driver.code,
      permanentNumber: Number(row.Driver.permanentNumber ?? row.number ?? 0),
      givenName: row.Driver.givenName,
      familyName: row.Driver.familyName,
      constructorId: row.Constructor.constructorId,
      status: row.status,
      time: row.Time?.time ?? null,
      fastestLap:
        row.FastestLap?.Time?.time != null
          ? {
              rank: Number(row.FastestLap.rank),
              lap: Number(row.FastestLap.lap),
              time: row.FastestLap.Time.time,
            }
          : null,
    }));
    const purple = results.find((row) => row.fastestLap?.rank === 1) ?? null;
    rounds[String(round)] = {
      round,
      raceName: race.raceName,
      circuitId: race.Circuit?.circuitId,
      fastestLap: purple
        ? {
            driverId: purple.driverId,
            code: purple.code,
            time: purple.fastestLap.time,
            lap: purple.fastestLap.lap,
          }
        : null,
      results,
    };
    console.log("results", round, results.length, purple?.code ?? "no FL");
  }
  const out = join(root, "public/data/results.json");
  writeFileSync(out, JSON.stringify({ throughRound: 19, rounds }));
  console.log("wrote", out);
}

async function bakePortraits() {
  const dir = join(root, "public/portraits");
  mkdirSync(dir, { recursive: true });
  const credits = [];
  for (const [id, title] of Object.entries(WIKI)) {
    const dest = join(dir, `${id}.jpg`);
    try {
      const summary = await getJson(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      );
      const src = summary?.originalimage?.source ?? summary?.thumbnail?.source;
      if (!src) {
        console.log("no image", id);
        continue;
      }
      const img = await fetch(src, { headers: { "User-Agent": UA } });
      if (!img.ok) {
        console.log("img fail", id, img.status);
        continue;
      }
      const buf = Buffer.from(await img.arrayBuffer());
      writeFileSync(dest, buf);
      credits.push({
        driverId: id,
        title: summary.title,
        source: src,
        license: "Wikimedia Commons / Wikipedia, typically CC BY-SA. See file page.",
        wikipedia: summary.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${title}`,
      });
      console.log("portrait", id, buf.length);
    } catch (err) {
      console.log("portrait err", id, err instanceof Error ? err.message : err);
    }
  }
  writeFileSync(join(root, "public/portraits/credits.json"), JSON.stringify({ portraits: credits }, null, 2));
}

await bakeResults();
await bakePortraits();
