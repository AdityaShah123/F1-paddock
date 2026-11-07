import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");

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

/** Prefer known colourful race-suit Commons originals when Wikipedia lead is muted. */
const PREFERRED = {
  hamilton:
    "https://upload.wikimedia.org/wikipedia/commons/a/a9/2021_United_States_Grand_Prix_23_%28cropped%29.jpg",
  russell:
    "https://upload.wikimedia.org/wikipedia/commons/f/fa/FIA_F1_Austria_2024_Nr._63_Russell.jpg",
  alonso:
    "https://upload.wikimedia.org/wikipedia/commons/f/fd/Alonso_Monaco_2016.jpg",
  ocon: "https://upload.wikimedia.org/wikipedia/commons/2/2e/Esteban_Ocon_2024_Suzuka_%28cropped%29.jpg",
  sainz:
    "https://upload.wikimedia.org/wikipedia/commons/9/91/Carlos_Sainz_Jr._during_Hungarian_Formula_1_Grand_Prix.jpg",
  bottas:
    "https://upload.wikimedia.org/wikipedia/commons/2/20/Valtteri_Bottas_at_the_2026_Adelaide_Motorsport_Festival_%28028A7556%29.jpg",
};

function absUrl(src) {
  if (!src) return null;
  if (src.startsWith("//")) return `https:${src}`;
  return src;
}

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.json();
}

async function fetchBuf(url) {
  const res = await fetch(absUrl(url), { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`img ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function colorScore(buf) {
  const { data, info } = await sharp(buf)
    .resize(180, 180, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let diff = 0;
  let n = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    diff += Math.abs(r - g) + Math.abs(g - b) + Math.abs(r - b);
    n += 1;
  }
  return diff / n;
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

async function candidateUrls(title) {
  const urls = [];
  try {
    const summary = await getJson(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    const lead = absUrl(summary?.originalimage?.source ?? summary?.thumbnail?.source);
    if (lead) urls.push({ src: lead, label: "summary", page: summary.title });
  } catch {
    // continue
  }
  try {
    const media = await getJson(
      `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(title)}`,
    );
    for (const item of media.items ?? []) {
      if (item.type !== "image") continue;
      const src = absUrl(
        item.original?.source ||
          item.srcset?.[item.srcset.length - 1]?.src ||
          item.thumbnail?.source,
      );
      if (!src || !/\.jpe?g/i.test(src.split("?")[0])) continue;
      urls.push({ src, label: item.title ?? "media", page: title });
    }
  } catch {
    // continue
  }
  return urls;
}

async function bakePortraits() {
  const dir = join(root, "public/portraits");
  mkdirSync(dir, { recursive: true });
  const credits = [];
  const MIN_COLOR = 45;

  for (const [id, title] of Object.entries(WIKI)) {
    const dest = join(dir, `${id}.jpg`);
    const preferred = PREFERRED[id];
    const pool = [];
    if (preferred) pool.push({ src: preferred, label: "preferred", page: title });
    pool.push(...(await candidateUrls(title)));

    let best = null;
    for (const cand of pool.slice(0, 14)) {
      try {
        const buf = await fetchBuf(cand.src);
        const score = await colorScore(buf);
        console.log("  cand", id, score.toFixed(1), cand.label?.toString().slice(0, 48));
        if (!best || score > best.score) best = { ...cand, buf, score };
        // Good enough — stop early
        if (score >= 90) break;
      } catch (err) {
        console.log("  cand fail", id, err instanceof Error ? err.message : err);
      }
    }

    if (!best) {
      console.log("no image", id);
      continue;
    }

    // Keep existing file if it is already more colourful than the new pick
    if (existsSync(dest)) {
      try {
        const existing = readFileSync(dest);
        const existingScore = await colorScore(existing);
        if (existingScore >= best.score && existingScore >= MIN_COLOR) {
          console.log("keep existing", id, existingScore.toFixed(1), ">=", best.score.toFixed(1));
          credits.push({
            driverId: id,
            title,
            source: best.src,
            license: "Wikimedia Commons / Wikipedia, typically CC BY-SA. See file page.",
            wikipedia: `https://en.wikipedia.org/wiki/${title}`,
            colorScore: Number(existingScore.toFixed(1)),
            keptExisting: true,
          });
          continue;
        }
      } catch {
        // rewrite
      }
    }

    // Resize to a crisp headshot for the UI — never desaturate
    // North bias keeps heads in frame; never desaturate / greyscale
    const outBuf = await sharp(best.buf)
      .rotate()
      .resize(480, 560, { fit: "cover", position: "north" })
      .jpeg({ quality: 90, mozjpeg: true })
      .toBuffer();
    writeFileSync(dest, outBuf);
    credits.push({
      driverId: id,
      title: best.page ?? title,
      source: best.src,
      license: "Wikimedia Commons / Wikipedia, typically CC BY-SA. See file page.",
      wikipedia: `https://en.wikipedia.org/wiki/${title}`,
      colorScore: Number(best.score.toFixed(1)),
    });
    console.log(
      "portrait",
      id,
      outBuf.length,
      "color",
      best.score.toFixed(1),
      best.score < MIN_COLOR ? "WARN_LOW_COLOR" : "ok",
    );
  }
  writeFileSync(join(root, "public/portraits/credits.json"), JSON.stringify({ portraits: credits }, null, 2));
}

const onlyPortraits = process.argv.includes("--portraits-only");
if (!onlyPortraits) await bakeResults();
await bakePortraits();
