#!/usr/bin/env node
/**
 * Checks public/data against the data contract. Exits non-zero on any failure.
 * Run with `npm run validate`.
 */

import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data');
const FILE_BUDGET = 400 * 1024;
const TREE_BUDGET = 8 * 1024 * 1024;

let failures = 0;
let checks = 0;
const fail = (msg) => {
  failures++;
  console.error(`  FAIL  ${msg}`);
};
const ok = (msg) => {
  checks++;
  console.log(`  ok    ${msg}`);
};
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

const read = async (rel) => JSON.parse(await readFile(path.join(OUT, rel), 'utf8'));

const isHex = (v) => typeof v === 'string' && /^#[0-9A-F]{6}$/.test(v);
const in01 = (a) => a.every((v) => typeof v === 'number' && v >= 0 && v <= 1);

console.log('\nValidating public/data against the contract\n');

// --- every file parses ------------------------------------------------------
const allFiles = [];
const walk = async (dir) => {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else allFiles.push(p);
  }
};
await walk(OUT);

let parsed = 0;
let treeBytes = 0;
let oversize = 0;
for (const f of allFiles) {
  const size = (await stat(f)).size;
  treeBytes += size;
  if (size > FILE_BUDGET) {
    fail(`${path.relative(OUT, f)} is ${(size / 1024).toFixed(0)} KB, over 400 KB`);
    oversize++;
  }
  if (!f.endsWith('.json')) {
    fail(`unexpected non-JSON file ${path.relative(OUT, f)}`);
    continue;
  }
  try {
    JSON.parse(await readFile(f, 'utf8'));
    parsed++;
  } catch (e) {
    fail(`${path.relative(OUT, f)} does not parse: ${e.message}`);
  }
}
check(parsed === allFiles.length, `all ${allFiles.length} files parse as JSON`);
check(oversize === 0, `no file exceeds the 400 KB budget`);
check(treeBytes <= TREE_BUDGET, `tree is ${(treeBytes / 1024 / 1024).toFixed(2)} MB, within the 8 MB budget`);

// --- season.json ------------------------------------------------------------
console.log('\nseason.json');
const season = await read('season.json');
check(season.year === 2026, 'year is 2026');
check(typeof season.lastUpdated === 'string' && !Number.isNaN(Date.parse(season.lastUpdated)), 'lastUpdated is ISO-8601');
check(season.rounds.length === season.totalRounds, `rounds array length matches totalRounds (${season.totalRounds})`);
const VALID_STATUS = new Set(['completed', 'upcoming', 'cancelled']);
check(season.rounds.every((r) => VALID_STATUS.has(r.status)), 'every round status is completed/upcoming/cancelled');
check(
  season.rounds.filter((r) => r.status === 'completed').length === season.completedRounds,
  `completed rounds count matches completedRounds (${season.completedRounds})`,
);
check(
  season.rounds.every((r) =>
    r.status === 'completed' ? r.winner && r.podium.length === 3 : r.winner === null && r.podium.length === 0,
  ),
  'completed rounds carry a winner and a 3-way podium; others carry null/[]',
);
check(
  season.rounds.every((r) => typeof r.circuitId === 'string' && r.circuitId.length > 0),
  'every round has a circuitId',
);
check(new Set(season.rounds.map((r) => r.circuitId)).size === season.rounds.length, 'circuitIds are unique');
check(
  season.rounds.every((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date)),
  'every round date is YYYY-MM-DD',
);
check(
  season.rounds.every((r, i) => r.round === i + 1),
  'rounds are contiguous and 1-indexed',
);

// --- standings.json ---------------------------------------------------------
console.log('\nstandings.json');
const standings = await read('standings.json');
check(standings.throughRound === season.completedRounds, `throughRound agrees with season.json (${standings.throughRound})`);
check(standings.drivers.length > 0 && standings.constructors.length > 0, `${standings.drivers.length} drivers, ${standings.constructors.length} constructors`);
check(standings.drivers.every((d, i) => d.position === i + 1), 'driver positions are 1..n in order');
check(standings.constructors.every((c, i) => c.position === i + 1), 'constructor positions are 1..n in order');
check(standings.drivers.every((d) => isHex(d.teamColour)), 'every driver teamColour is #RRGGBB');
check(standings.constructors.every((c) => isHex(c.teamColour)), 'every constructor teamColour is #RRGGBB');
check(
  standings.drivers.every((d) => Number.isInteger(d.permanentNumber) && typeof d.code === 'string'),
  'every driver has an integer permanentNumber and a code',
);
check(
  standings.drivers.every((d, i, a) => i === 0 || a[i - 1].points >= d.points),
  'driver points are non-increasing down the table',
);
const winSum = standings.drivers.reduce((s, d) => s + d.wins, 0);
check(winSum === season.completedRounds, `driver wins sum to completed rounds (${winSum})`);

// --- season-arc.json --------------------------------------------------------
console.log('\nseason-arc.json');
const arc = await read('season-arc.json');
check(arc.throughRound === season.completedRounds, `throughRound agrees with season.json (${arc.throughRound})`);
check(arc.rounds.length === season.completedRounds, `rounds array has ${arc.rounds.length} entries`);
check(
  arc.series.every((s) => s.cumulative.length === arc.rounds.length),
  `every cumulative array is exactly rounds.length (${arc.rounds.length})`,
);
check(
  arc.series.every((s) => s.positions.length === arc.rounds.length),
  'every positions array is exactly rounds.length',
);
check(
  arc.series.every((s) => s.cumulative.every((v, i) => i === 0 || v >= s.cumulative[i - 1])),
  'cumulative points never decrease',
);
check(arc.series.every((s) => isHex(s.teamColour)), 'every series carries a #RRGGBB teamColour');
const arcIds = new Set(arc.series.map((s) => s.driverId));
check(
  standings.drivers.every((d) => arcIds.has(d.driverId)),
  'every driver in standings has an arc series',
);
const finalArc = arc.series.every((s) => {
  const d = standings.drivers.find((x) => x.driverId === s.driverId);
  return d && s.cumulative[s.cumulative.length - 1] === d.points;
});
check(finalArc, 'each series ends on the driver total from standings.json');

// --- index.json -------------------------------------------------------------
console.log('\nindex.json');
const index = await read('index.json');
const circuitFiles = existsSync(path.join(OUT, 'circuits'))
  ? (await readdir(path.join(OUT, 'circuits'))).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  : [];
const driverFiles = existsSync(path.join(OUT, 'drivers'))
  ? (await readdir(path.join(OUT, 'drivers'))).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5))
  : [];
check(
  index.circuits.every((c) => circuitFiles.includes(c)),
  `all ${index.circuits.length} indexed circuits exist on disk`,
);
check(
  index.drivers.every((d) => driverFiles.includes(d)),
  `all ${index.drivers.length} indexed drivers exist on disk`,
);
check(circuitFiles.every((c) => index.circuits.includes(c)), 'no circuit file is missing from the index');
check(driverFiles.every((d) => index.drivers.includes(d)), 'no driver file is missing from the index');
check(
  index.circuits.every((c) => season.rounds.some((r) => r.circuitId === c)),
  'every indexed circuit is a circuitId in season.json',
);
check(
  index.drivers.every((d) => standings.drivers.some((s) => s.driverId === d)),
  'every indexed driver appears in standings.json',
);

// --- circuits ---------------------------------------------------------------
console.log('\ncircuits/');
let geomBad = 0;
let lenBad = 0;
let volBad = 0;
let sectorBad = 0;
const volumes = [];
for (const id of index.circuits) {
  const c = await read(`circuits/${id}.json`);
  const n = c.points.length;
  if (n < 400 || n > 600) {
    fail(`${id}: ${n} points, outside the 400-600 window`);
    geomBad++;
  }
  if (c.speed.length !== n || c.throttle.length !== n || c.brake.length !== n) {
    fail(`${id}: speed/throttle/brake lengths ${c.speed.length}/${c.throttle.length}/${c.brake.length} != points ${n}`);
    lenBad++;
  }
  if (!in01(c.speed) || !in01(c.throttle) || !in01(c.brake)) {
    fail(`${id}: speed/throttle/brake not all within 0-1`);
    lenBad++;
  }
  if (!c.points.every((p) => Array.isArray(p) && p.length === 3 && p.every(Number.isFinite))) {
    fail(`${id}: points are not all finite [x,y,z] triples`);
    geomBad++;
    continue;
  }
  // Normalisation: longest axis spans exactly 100, centred on the origin.
  const axis = (i) => c.points.map((p) => p[i]);
  const ext = [0, 1, 2].map((i) => Math.max(...axis(i)) - Math.min(...axis(i)));
  const mid = [0, 1, 2].map((i) => (Math.max(...axis(i)) + Math.min(...axis(i))) / 2);
  const longest = Math.max(...ext);
  if (Math.abs(longest - 100) > 0.05) {
    fail(`${id}: longest axis spans ${longest.toFixed(3)}, expected exactly 100`);
    volBad++;
  }
  if (mid.some((m) => Math.abs(m) > 0.05)) {
    fail(`${id}: not centred on the origin, midpoints ${mid.map((m) => m.toFixed(2)).join(',')}`);
    volBad++;
  }
  volumes.push({ id, ext, longest });
  // Closed loop, last point adjacent to the first rather than a duplicate.
  const seg = c.points.map((p, i) => {
    const q = c.points[(i + 1) % n];
    return Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
  });
  const closing = seg[n - 1];
  const mean = seg.reduce((a, b) => a + b, 0) / n;
  if (closing < mean * 0.25 || closing > mean * 4) {
    fail(`${id}: closing segment ${closing.toFixed(2)} vs mean ${mean.toFixed(2)} - loop not evenly closed`);
    geomBad++;
  }
  if (closing < 1e-6) {
    fail(`${id}: last point duplicates the first`);
    geomBad++;
  }
  // Even arc-length spacing: the contract asks for a resampled, evenly spaced loop.
  const spread = Math.max(...seg) / mean;
  if (spread > 1.6) {
    fail(`${id}: point spacing is uneven, max/mean = ${spread.toFixed(2)}`);
    geomBad++;
  }
  if (
    !Array.isArray(c.sectors) ||
    c.sectors.length !== 3 ||
    c.sectors[0] !== 0 ||
    !c.sectors.every((s) => Number.isInteger(s) && s >= 0 && s < n) ||
    c.sectors[1] >= c.sectors[2] ||
    c.sectors[1] === 0
  ) {
    fail(`${id}: sectors ${JSON.stringify(c.sectors)} are not three ascending in-range indices starting at 0`);
    sectorBad++;
  }
  if (!Number.isFinite(c.lengthMetres) || c.lengthMetres < 2000 || c.lengthMetres > 8000) {
    fail(`${id}: implausible lengthMetres ${c.lengthMetres}`);
    geomBad++;
  }
  if (c.circuitId !== id) fail(`${id}: circuitId field says "${c.circuitId}"`);
}
check(geomBad === 0, `${index.circuits.length} circuits have well-formed closed, evenly spaced geometry`);
check(lenBad === 0, 'speed/throttle/brake match points length and sit within 0-1 everywhere');
check(volBad === 0, 'every circuit is centred on the origin with its longest axis spanning exactly 100');
check(sectorBad === 0, 'every circuit has three ascending sector indices starting at 0');

// Same volume across circuits: the renderer must not need per-circuit tuning.
if (volumes.length) {
  const groundSpan = volumes.map((v) => Math.max(v.ext[0], v.ext[2]));
  check(
    groundSpan.every((g) => Math.abs(g - 100) < 0.05),
    'the longest ground axis is exactly 100 for every circuit (identical working volume)',
  );
  const minor = volumes.map((v) => Math.min(v.ext[0], v.ext[2]));
  console.log(
    `        minor ground axis ranges ${Math.min(...minor).toFixed(1)}-${Math.max(...minor).toFixed(1)}, ` +
      `elevation axis ${Math.min(...volumes.map((v) => v.ext[1])).toFixed(1)}-${Math.max(...volumes.map((v) => v.ext[1])).toFixed(1)} ` +
      `(true aspect ratios preserved)`,
  );
}

// --- drivers ----------------------------------------------------------------
console.log('\ndrivers/');
let dBad = 0;
for (const id of index.drivers) {
  const d = await read(`drivers/${id}.json`);
  if (d.speedTrace.length !== 256) {
    fail(`${id}: speedTrace has ${d.speedTrace.length} points, expected exactly 256`);
    dBad++;
  }
  if (!in01(d.speedTrace)) {
    fail(`${id}: speedTrace values outside 0-1`);
    dBad++;
  }
  if (!isHex(d.teamColour)) {
    fail(`${id}: teamColour "${d.teamColour}" is not #RRGGBB`);
    dBad++;
  }
  const s = d.season;
  const ref = standings.drivers.find((x) => x.driverId === id);
  if (!ref || s.points !== ref.points || s.wins !== ref.wins) {
    fail(`${id}: season points/wins disagree with standings.json`);
    dBad++;
  }
  if (s.podiums < s.wins || s.bestFinish < 1 || s.avgFinish < 1) {
    fail(`${id}: incoherent season aggregates ${JSON.stringify(s)}`);
    dBad++;
  }
  if (d.driverId !== id) fail(`${id}: driverId field says "${d.driverId}"`);
}
check(dBad === 0, `${index.drivers.length} drivers have a 256-point normalised speedTrace and coherent season stats`);

// --- summary ----------------------------------------------------------------
console.log(`\n${checks} checks passed, ${failures} failed.\n`);
process.exit(failures ? 1 : 0);
