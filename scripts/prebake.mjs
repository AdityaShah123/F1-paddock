#!/usr/bin/env node
/**
 * Prebakes every static file described in the F1 Paddock data contract into public/data/.
 *
 * Run with `npm run prebake`. Re-runnable: HTTP responses are cached under .cache/prebake
 * so a second run costs almost nothing. Delete that directory to force a cold fetch.
 */

import { mkdir, readFile, writeFile, rename, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'public', 'data');
const CACHE = path.join(ROOT, '.cache', 'prebake');

const YEAR = 2026;
const JOLPICA = 'https://api.jolpi.ca/ergast/f1';
const OPENF1 = 'https://api.openf1.org/v1';

const FILE_BUDGET = 400 * 1024;
const TREE_BUDGET = 8 * 1024 * 1024;

/** Resampled points per circuit, clamped to the contract's 400-600 window. */
const MIN_POINTS = 400;
const MAX_POINTS = 600;
const SPEED_TRACE_POINTS = 256;

const warnings = [];
const skipped = [];

const log = (...a) => console.log(...a);
const warn = (msg) => {
  warnings.push(msg);
  console.warn('  ! ' + msg);
};

// ---------------------------------------------------------------------------
// HTTP with disk cache, retry and polite concurrency
// ---------------------------------------------------------------------------

let inFlight = 0;
const queue = [];
const MAX_CONCURRENT = 4;

function withSlot(fn) {
  return new Promise((resolve, reject) => {
    const run = async () => {
      inFlight++;
      try {
        resolve(await fn());
      } catch (e) {
        reject(e);
      } finally {
        inFlight--;
        const next = queue.shift();
        if (next) next();
      }
    };
    if (inFlight < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches JSON, caching the parsed body on disk by URL hash.
 * `allow404` turns OpenF1's "No results found." into null instead of throwing,
 * which is how sessions that have not happened yet present themselves.
 */
async function getJson(url, { allow404 = false, retries = 4 } = {}) {
  const key = createHash('sha1').update(url).digest('hex') + '.json';
  const cacheFile = path.join(CACHE, key);
  if (existsSync(cacheFile)) {
    try {
      const raw = JSON.parse(await readFile(cacheFile, 'utf8'));
      return raw.missing ? null : raw.body;
    } catch {
      /* fall through to refetch on a corrupt cache entry */
    }
  }

  return withSlot(async () => {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) await sleep(Math.min(16000, 1000 * 2 ** attempt));
      try {
        const res = await fetch(url, {
          headers: { 'user-agent': 'f1-paddock-prebake/1.0' },
          signal: AbortSignal.timeout(90_000),
        });
        if (res.status === 404 || res.status === 204) {
          if (!allow404) throw new Error(`HTTP ${res.status}`);
          await writeFile(cacheFile, JSON.stringify({ missing: true }));
          return null;
        }
        if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = await res.json();
        // OpenF1 answers some empty queries with a 200 and a detail object.
        if (body && !Array.isArray(body) && typeof body.detail === 'string') {
          if (!allow404) throw new Error(body.detail);
          await writeFile(cacheFile, JSON.stringify({ missing: true }));
          return null;
        }
        await writeFile(cacheFile, JSON.stringify({ body }));
        return body;
      } catch (e) {
        lastErr = e;
      }
    }
    throw new Error(`fetch failed after ${retries + 1} tries: ${url} (${lastErr?.message})`);
  });
}

/** Writes JSON atomically so a crash can never leave a half-written file behind. */
async function writeJson(relPath, value) {
  const dest = path.join(OUT, relPath);
  await mkdir(path.dirname(dest), { recursive: true });
  const tmp = dest + '.tmp';
  await writeFile(tmp, JSON.stringify(value));
  await rename(tmp, dest);
  const { size } = await stat(dest);
  if (size > FILE_BUDGET) {
    warn(`${relPath} is ${(size / 1024).toFixed(0)} KB, over the 400 KB budget`);
  }
  return size;
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const round = (v, dp) => {
  const f = 10 ** dp;
  return Math.round(v * f) / f;
};
const hex = (c) => (c ? '#' + String(c).replace(/^#/, '').toUpperCase() : null);
const FALLBACK_COLOUR = '#9CA3AF';

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Catmull-Rom interpolation of four control values at parameter t in [0,1]. */
function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

/**
 * Densifies a closed polyline with a Catmull-Rom spline. The spline passes through
 * every input sample, so corners stay sharp - a moving average would round them off
 * and turn a circuit into a blob.
 */
function densifyClosed(pts, subSteps = 8) {
  const n = pts.length;
  const at = (i) => pts[((i % n) + n) % n];
  const out = [];
  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    for (let s = 0; s < subSteps; s++) {
      const t = s / subSteps;
      out.push({
        x: catmull(p0.x, p1.x, p2.x, p3.x, t),
        y: catmull(p0.y, p1.y, p2.y, p3.y, t),
        z: catmull(p0.z, p1.z, p2.z, p3.z, t),
        t: p1.t + (p2.t - p1.t) * t,
      });
    }
  }
  return out;
}

/** Cumulative arc length of a closed polyline; returns n+1 values (last = perimeter). */
function cumulativeArc(pts) {
  const s = [0];
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i % pts.length];
    s.push(s[i - 1] + Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z));
  }
  return s;
}

/** Resamples a closed polyline at `count` evenly arc-spaced positions. */
function resampleClosed(pts, count) {
  const s = cumulativeArc(pts);
  const total = s[s.length - 1];
  const step = total / count;
  const out = [];
  let seg = 0;
  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (seg < pts.length - 1 && s[seg + 1] < target) seg++;
    const a = pts[seg];
    const b = pts[(seg + 1) % pts.length];
    const span = s[seg + 1] - s[seg] || 1;
    const f = Math.min(1, Math.max(0, (target - s[seg]) / span));
    out.push({
      x: a.x + (b.x - a.x) * f,
      y: a.y + (b.y - a.y) * f,
      z: a.z + (b.z - a.z) * f,
      t: a.t + (b.t - a.t) * f,
      s: target,
    });
  }
  return { points: out, total };
}

/** Linear sample of a time-ordered telemetry series at an arbitrary timestamp. */
function sampleSeries(series, key, t) {
  if (!series.length) return null;
  if (t <= series[0].t) return series[0][key];
  if (t >= series[series.length - 1].t) return series[series.length - 1][key];
  let lo = 0;
  let hi = series.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (series[mid].t <= t) lo = mid;
    else hi = mid;
  }
  const a = series[lo];
  const b = series[hi];
  const span = b.t - a.t || 1;
  const f = (t - a.t) / span;
  return a[key] + (b[key] - a[key]) * f;
}

function normalise01(values) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (!finite.length) return values.map(() => 0);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const span = max - min;
  if (span <= 0) return values.map(() => 0);
  return values.map((v) => (Number.isFinite(v) ? (v - min) / span : 0));
}

/** Downsamples any series to exactly `count` values by linear interpolation. */
function resampleSeries(values, count) {
  if (!values.length) return null;
  if (values.length === 1) return new Array(count).fill(values[0]);
  const out = [];
  for (let i = 0; i < count; i++) {
    const pos = (i / (count - 1)) * (values.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(values.length - 1, lo + 1);
    out.push(values[lo] + (values[hi] - values[lo]) * (pos - lo));
  }
  return out;
}

// ---------------------------------------------------------------------------
// Source loading
// ---------------------------------------------------------------------------

async function loadCalendar() {
  const body = await getJson(`${JOLPICA}/${YEAR}/races/?limit=30`);
  return body.MRData.RaceTable.Races.map((r) => ({
    round: Number(r.round),
    circuitId: r.Circuit.circuitId,
    circuitName: r.Circuit.circuitName,
    raceName: r.raceName,
    country: r.Circuit.Location.country,
    locality: r.Circuit.Location.locality,
    date: r.date,
  }));
}

async function loadRaceSessions() {
  const body = await getJson(`${OPENF1}/sessions?year=${YEAR}&session_name=Race`);
  return body.map((s) => ({
    sessionKey: s.session_key,
    meetingKey: s.meeting_key,
    circuitKey: s.circuit_key,
    circuitShortName: s.circuit_short_name,
    countryName: s.country_name,
    date: String(s.date_start).slice(0, 10),
    cancelled: Boolean(s.is_cancelled),
  }));
}

/**
 * Joins Jolpica rounds to OpenF1 sessions on race date.
 *
 * Round index is unusable: OpenF1 carries two cancelled April rounds that Jolpica
 * omits entirely, so every index after Japan is shifted by two. Date is the one field
 * that identifies the same event in both feeds, and it survives the Bahrain GP being
 * relocated to Sepang (OpenF1 files that event under country "Bahrain" at circuit
 * "Kuala Lumpur"; Jolpica calls it circuit `sepang` in Malaysia).
 */
function joinOnCircuit(calendar, sessions) {
  const live = sessions.filter((s) => !s.cancelled);
  const byDate = new Map(live.map((s) => [s.date, s]));
  const map = new Map();
  for (const race of calendar) {
    const session = byDate.get(race.date);
    if (!session) {
      warn(`no OpenF1 race session matches ${race.circuitId} on ${race.date}`);
      continue;
    }
    map.set(race.circuitId, session);
  }
  for (const s of sessions.filter((x) => x.cancelled)) {
    log(`  - OpenF1 session ${s.sessionKey} (${s.circuitShortName}, ${s.date}) is cancelled, ignored`);
  }
  return map;
}

// ---------------------------------------------------------------------------
// season.json
// ---------------------------------------------------------------------------

async function buildSeason(calendar, sessionByCircuit, resultsByRound, completedRounds) {
  const cancelledDates = new Set();
  const rounds = calendar.map((race) => {
    const results = resultsByRound.get(race.round);
    const session = sessionByCircuit.get(race.circuitId);
    let status;
    if (results && results.length) status = 'completed';
    else if (session && session.cancelled) status = 'cancelled';
    else status = 'upcoming';
    if (status === 'cancelled') cancelledDates.add(race.date);

    const podium = (results || [])
      .filter((r) => Number(r.position) <= 3)
      .sort((a, b) => Number(a.position) - Number(b.position))
      .map((r) => ({ driverId: r.Driver.driverId, position: Number(r.position) }));

    const first = (results || []).find((r) => Number(r.position) === 1);
    return {
      round: race.round,
      circuitId: race.circuitId,
      raceName: race.raceName,
      country: race.country,
      locality: race.locality,
      date: race.date,
      status,
      winner: first
        ? {
            driverId: first.Driver.driverId,
            code: first.Driver.code,
            constructorId: first.Constructor.constructorId,
          }
        : null,
      podium,
    };
  });

  return {
    year: YEAR,
    lastUpdated: new Date().toISOString(),
    completedRounds,
    totalRounds: calendar.length,
    rounds,
  };
}

// ---------------------------------------------------------------------------
// Circuit telemetry
// ---------------------------------------------------------------------------

/** All clean (non pit-out, plausibly timed) laps in a session, fastest first. */
function cleanLaps(laps) {
  return laps
    .filter(
      (l) =>
        Number.isFinite(l.lap_duration) &&
        l.lap_duration > 50 &&
        l.lap_duration < 300 &&
        !l.is_pit_out_lap &&
        l.date_start &&
        Number.isFinite(l.duration_sector_1) &&
        Number.isFinite(l.duration_sector_2) &&
        Number.isFinite(l.duration_sector_3),
    )
    .sort((a, b) => a.lap_duration - b.lap_duration);
}

/** Picks the fastest clean lap in a session. */
function pickHotLap(laps) {
  return cleanLaps(laps)[0] || null;
}

/**
 * Orders candidate laps so the fastest lap of each phase of the race is tried early.
 *
 * Some sessions have a truncated `location` feed: Monaco 2026 publishes positions only
 * up to 14:00 UTC while the race runs past 15:25, so every genuinely fastest lap (which
 * come late, on low fuel) has no position data at all. Interleaving by race phase finds
 * a covered lap within a few attempts instead of burning the whole budget on late laps.
 */
function candidateLaps(laps, limit = 10) {
  const clean = cleanLaps(laps);
  if (!clean.length) return [];
  const maxLap = Math.max(...clean.map((l) => l.lap_number || 1));
  const buckets = 5;
  const picked = [];
  const seen = new Set();
  const take = (l) => {
    const key = `${l.driver_number}:${l.lap_number}`;
    if (l && !seen.has(key)) {
      seen.add(key);
      picked.push(l);
    }
  };
  take(clean[0]);
  for (let b = 0; b < buckets; b++) {
    const hi = ((b + 1) / buckets) * maxLap;
    take(clean.find((l) => (l.lap_number || 1) <= hi));
  }
  for (const l of clean) {
    if (picked.length >= limit) break;
    take(l);
  }
  return picked.slice(0, limit);
}

/**
 * Recovers a hot lap from the position feed alone, ignoring the `laps` endpoint's clock.
 *
 * Needed where the two feeds disagree about when the race happened. Monaco 2026 publishes
 * positions only for roughly 12:20-13:10 UTC while `laps` timestamps run 13:03-15:25, so
 * every lap window derived from `laps` misses the position data entirely. Detecting
 * start/finish crossings geometrically sidesteps the disagreement.
 */
async function deriveLapFromLocation(session, driverNumber, reference) {
  const raw = await getJson(
    `${OPENF1}/location?session_key=${session.sessionKey}&driver_number=${driverNumber}`,
    { allow404: true },
  );
  if (!raw || !raw.length) throw new Error('no location telemetry for driver');

  const pts = raw
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y) && !(p.x === 0 && p.y === 0))
    .map((p) => ({ x: p.x / 10, y: p.y / 10, t: Date.parse(p.date) }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
  if (pts.length < 500) throw new Error('too few position samples to derive a lap');

  // Anchor on a point from the middle of the feed, where the car is certainly circulating.
  const ref = pts[Math.floor(pts.length / 2)];
  const steps = pts.slice(1).map((p, i) => Math.hypot(p.x - pts[i].x, p.y - pts[i].y));
  const median = [...steps].sort((a, b) => a - b)[steps.length >> 1] || 10;
  const threshold = Math.max(40, median * 4);

  // Each contiguous pass through the anchor's neighbourhood yields one crossing.
  const crossings = [];
  let inZone = false;
  let bestI = -1;
  let bestD = Infinity;
  for (let i = 0; i < pts.length; i++) {
    const d = Math.hypot(pts[i].x - ref.x, pts[i].y - ref.y);
    if (d < threshold) {
      if (!inZone) {
        inZone = true;
        bestD = Infinity;
      }
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    } else if (inZone) {
      inZone = false;
      crossings.push(bestI);
    }
  }
  if (inZone && bestI >= 0) crossings.push(bestI);

  const laps = [];
  for (let i = 1; i < crossings.length; i++) {
    const a = crossings[i - 1];
    const b = crossings[i];
    const duration = (pts[b].t - pts[a].t) / 1000;
    const samples = b - a;
    // Keep laps near the session's known best; anything much slower is a safety-car lap.
    if (duration > reference * 0.9 && duration < reference * 1.35 && samples >= 150) {
      laps.push({ a, b, duration, samples });
    }
  }
  if (!laps.length) throw new Error('no closed lap found in position feed');
  laps.sort((x, y) => x.duration - y.duration);
  const best = laps[0];
  return {
    driver_number: driverNumber,
    lap_number: null,
    date_start: new Date(pts[best.a].t).toISOString(),
    lap_duration: best.duration,
    derived: true,
  };
}

async function buildCircuit(race, session, laps) {
  const candidates = candidateLaps(laps);
  if (!candidates.length) throw new Error('no clean timed lap in session');
  const failures = [];
  for (const lap of candidates) {
    try {
      return await buildCircuitFromLap(race, session, lap);
    } catch (e) {
      failures.push(`drv#${lap.driver_number} lap${lap.lap_number}: ${e.message}`);
    }
  }

  // Sector split ratios stay valid even when the absolute timestamps do not, so carry
  // them over from the fastest timed lap onto whatever lap the position feed yields.
  const fastest = candidates[0];
  const sectorRatios = [
    fastest.duration_sector_1,
    fastest.duration_sector_2,
    fastest.duration_sector_3,
  ].map((d) => d / fastest.lap_duration);

  const drivers = [...new Set(candidates.map((l) => l.driver_number))].slice(0, 3);
  for (const driverNumber of drivers) {
    try {
      const derived = await deriveLapFromLocation(session, driverNumber, fastest.lap_duration);
      derived.duration_sector_1 = sectorRatios[0] * derived.lap_duration;
      derived.duration_sector_2 = sectorRatios[1] * derived.lap_duration;
      derived.duration_sector_3 = sectorRatios[2] * derived.lap_duration;
      const circuit = await buildCircuitFromLap(race, session, derived);
      warn(`${race.circuitId}: lap timings and positions disagree, lap recovered from the position feed`);
      return circuit;
    } catch (e) {
      failures.push(`derived drv#${driverNumber}: ${e.message}`);
    }
  }
  throw new Error(`${failures.length} attempts failed (${failures[0]}; ${failures[failures.length - 1]})`);
}

async function buildCircuitFromLap(race, session, lap) {
  const t0 = Date.parse(lap.date_start);
  const t1 = t0 + lap.lap_duration * 1000;
  // Pad the query a little either side so interpolation at the lap boundary has data.
  const from = new Date(t0 - 2000).toISOString().replace('Z', '');
  const to = new Date(t1 + 2000).toISOString().replace('Z', '');
  const drv = lap.driver_number;

  const [locRaw, carRaw] = await Promise.all([
    getJson(
      `${OPENF1}/location?session_key=${session.sessionKey}&driver_number=${drv}` +
        `&date%3E${from}&date%3C${to}`,
      { allow404: true },
    ),
    getJson(
      `${OPENF1}/car_data?session_key=${session.sessionKey}&driver_number=${drv}` +
        `&date%3E${from}&date%3C${to}`,
      { allow404: true },
    ),
  ]);

  if (!locRaw || !locRaw.length) throw new Error('no location telemetry');

  // Keep only in-lap samples; OpenF1 emits (0,0,0) rows when the transponder drops out.
  let pts = locRaw
    .filter(
      (p) =>
        Number.isFinite(p.x) &&
        Number.isFinite(p.y) &&
        Number.isFinite(p.z) &&
        !(p.x === 0 && p.y === 0 && p.z === 0),
    )
    .map((p) => ({ x: p.x / 10, y: p.y / 10, z: p.z / 10, t: Date.parse(p.date) }))
    .filter((p) => Number.isFinite(p.t) && p.t >= t0 && p.t < t1)
    .sort((a, b) => a.t - b.t);

  // Collapse duplicate timestamps/positions.
  pts = pts.filter((p, i) => i === 0 || Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) > 0.01);

  // A feed can carry a full-rate sample count yet only a handful of distinct fixes when
  // the transponder sticks; such a lap cannot produce real geometry at any point count.
  if (pts.length < 120) {
    throw new Error(`only ${pts.length} distinct position fixes in the lap (feed is quantised or truncated)`);
  }

  // Drop transponder spikes by implied speed, not by raw distance. The sample interval
  // is uneven (0.24 s typically, but gaps over 1 s are common), so a plain distance
  // threshold rejects legitimate samples on fast sections - and because each survivor is
  // measured against the last *kept* point, one wrong rejection cascades and eats the
  // rest of the lap. Scaling the threshold by dt cannot cascade.
  const MAX_SPEED_MS = 130; // ~470 km/h; beyond any F1 car, so this is a glitch
  const cleaned = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const dt = (pts[i].t - prev.t) / 1000;
    const dist = Math.hypot(pts[i].x - prev.x, pts[i].y - prev.y);
    if (dt > 0 && dist / dt > MAX_SPEED_MS) continue;
    cleaned.push(pts[i]);
  }
  pts = cleaned;

  // The closing segment is the one gap we cannot measure; reject a lap whose ends are far
  // apart relative to its own length, which means samples are missing rather than merely sparse.
  const rawLength = pts
    .slice(1)
    .reduce((sum, p, i) => sum + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);
  const closureGap = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
  if (closureGap > Math.max(150, rawLength * 0.03)) {
    throw new Error(`lap does not close, ${closureGap.toFixed(0)} m gap on a ${rawLength.toFixed(0)} m lap`);
  }

  // The window is one full lap, so the last sample sits just before the line and the
  // first just after: treating the polyline as closed completes the circuit exactly once.
  const dense = densifyClosed(pts, 8);
  const lengthMetres = cumulativeArc(dense).pop();
  const count = Math.min(MAX_POINTS, Math.max(MIN_POINTS, Math.round(lengthMetres / 12)));
  const { points: sampled } = resampleClosed(dense, count);

  // Telemetry, sampled at each resampled point's interpolated timestamp.
  const car = (carRaw || [])
    .filter((c) => Number.isFinite(c.speed))
    .map((c) => ({
      t: Date.parse(c.date),
      speed: c.speed,
      throttle: Number.isFinite(c.throttle) ? c.throttle : 0,
      brake: Number.isFinite(c.brake) ? c.brake : 0,
    }))
    .filter((c) => Number.isFinite(c.t))
    .sort((a, b) => a.t - b.t);

  let speed;
  let throttle;
  let brake;
  if (car.length >= 50) {
    const rawSpeed = sampled.map((p) => sampleSeries(car, 'speed', p.t));
    speed = normalise01(rawSpeed);
    throttle = sampled.map((p) => Math.min(1, Math.max(0, (sampleSeries(car, 'throttle', p.t) ?? 0) / 100)));
    brake = sampled.map((p) => Math.min(1, Math.max(0, (sampleSeries(car, 'brake', p.t) ?? 0) / 100)));
  } else {
    // Fall back to speed derived from position so the arrays are never absent or ragged.
    warn(`${race.circuitId}: car_data unavailable, deriving speed from position deltas`);
    const derived = sampled.map((p, i) => {
      const n = sampled[(i + 1) % sampled.length];
      const dt = Math.max(1, (n.t - p.t + (i === sampled.length - 1 ? lap.lap_duration * 1000 : 0)) / 1000);
      return Math.hypot(n.x - p.x, n.y - p.y) / dt;
    });
    speed = normalise01(derived);
    throttle = speed.map((v) => Math.min(1, v * 1.1));
    brake = speed.map((_, i) => {
      const prev = speed[(i - 1 + speed.length) % speed.length];
      return Math.max(0, Math.min(1, (prev - speed[i]) * 6));
    });
  }

  // Sector starts: sector 1 opens the lap, the others at the cumulative sector times.
  const sectorTimes = [t0, t0 + lap.duration_sector_1 * 1000, t0 + (lap.duration_sector_1 + lap.duration_sector_2) * 1000];
  const sectors = sectorTimes.map((st) => {
    let best = 0;
    let bestD = Infinity;
    sampled.forEach((p, i) => {
      const d = Math.abs(p.t - st);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  });
  sectors[0] = 0;

  // Centre on the bounding-box centre, then scale uniformly so the longest axis is
  // exactly 100 units. Uniform scale keeps the circuit's real proportions; every
  // circuit lands in the same volume with no per-circuit tuning in the renderer.
  // Output axis order is [x, elevation, y] so index 1 is up (Y-up renderers).
  const ax = sampled.map((p) => p.x);
  const ay = sampled.map((p) => p.z); // OpenF1 z is elevation
  const az = sampled.map((p) => p.y);
  const centre = (a) => (Math.min(...a) + Math.max(...a)) / 2;
  const extent = (a) => Math.max(...a) - Math.min(...a);
  const cx = centre(ax);
  const cy = centre(ay);
  const cz = centre(az);
  const longest = Math.max(extent(ax), extent(ay), extent(az));
  const scale = 100 / longest;

  const points = sampled.map((p, i) => [
    round((ax[i] - cx) * scale, 3),
    round((ay[i] - cy) * scale, 3),
    round((az[i] - cz) * scale, 3),
  ]);

  return {
    circuitId: race.circuitId,
    name: race.circuitName,
    country: race.country,
    sourceDriver: drv,
    sessionKey: session.sessionKey,
    lengthMetres: Math.round(lengthMetres),
    points,
    speed: speed.map((v) => round(v, 4)),
    throttle: throttle.map((v) => round(v, 4)),
    brake: brake.map((v) => round(v, 4)),
    sectors,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  await mkdir(CACHE, { recursive: true });
  await mkdir(OUT, { recursive: true });

  log(`\nF1 Paddock prebake - ${YEAR}\n`);

  log('Calendar and sessions...');
  const [calendar, sessions] = await Promise.all([loadCalendar(), loadRaceSessions()]);
  log(`  Jolpica rounds: ${calendar.length}   OpenF1 race sessions: ${sessions.length}`);
  const sessionByCircuit = joinOnCircuit(calendar, sessions);
  log(`  joined ${sessionByCircuit.size} circuits`);

  log('\nStandings...');
  const [dsBody, csBody] = await Promise.all([
    getJson(`${JOLPICA}/${YEAR}/driverstandings/`),
    getJson(`${JOLPICA}/${YEAR}/constructorstandings/`),
  ]);
  const dsList = dsBody.MRData.StandingsTable.StandingsLists[0];
  const csList = csBody.MRData.StandingsTable.StandingsLists[0];
  const completedRounds = Number(dsList.round);
  log(`  through round ${completedRounds}`);

  log('\nRace results...');
  const resultsByRound = new Map();
  for (let r = 1; r <= completedRounds; r++) {
    const body = await getJson(`${JOLPICA}/${YEAR}/${r}/results/?limit=100`, { allow404: true });
    const race = body?.MRData?.RaceTable?.Races?.[0];
    if (race?.Results?.length) resultsByRound.set(r, race.Results);
    else warn(`round ${r} has no results`);
  }
  log(`  ${resultsByRound.size} rounds with results`);

  // team_colour lives on OpenF1's per-session driver list. Walk sessions newest-first
  // so each driver gets the colour of the team they most recently raced for, and
  // drivers who were replaced mid-season still resolve from an earlier session.
  log('\nTeam colours...');
  const completedSessions = calendar
    .filter((r) => resultsByRound.has(r.round))
    .map((r) => sessionByCircuit.get(r.circuitId))
    .filter(Boolean);
  const colourByNumber = new Map();
  const colourByAcronym = new Map();
  for (const session of [...completedSessions].reverse()) {
    const list = await getJson(`${OPENF1}/drivers?session_key=${session.sessionKey}`, { allow404: true });
    for (const d of list || []) {
      if (!d.team_colour) continue;
      if (!colourByNumber.has(d.driver_number)) colourByNumber.set(d.driver_number, hex(d.team_colour));
      if (d.name_acronym && !colourByAcronym.has(d.name_acronym)) {
        colourByAcronym.set(d.name_acronym, hex(d.team_colour));
      }
    }
  }
  log(`  ${colourByNumber.size} driver numbers carry a team colour`);

  const driverColour = (d) => {
    const byNum = colourByNumber.get(Number(d.permanentNumber));
    const byCode = colourByAcronym.get(d.code);
    const c = byNum || byCode;
    if (!c) warn(`no team colour for ${d.driverId} (#${d.permanentNumber}/${d.code}), using fallback`);
    return c || FALLBACK_COLOUR;
  };

  // ---- standings.json -----------------------------------------------------
  const driverStandings = dsList.DriverStandings.map((s) => ({
    position: Number(s.position),
    driverId: s.Driver.driverId,
    code: s.Driver.code,
    permanentNumber: num(s.Driver.permanentNumber),
    givenName: s.Driver.givenName,
    familyName: s.Driver.familyName,
    constructorId: s.Constructors[s.Constructors.length - 1].constructorId,
    teamColour: driverColour(s.Driver),
    points: Number(s.points),
    wins: Number(s.wins),
  }));

  // A constructor's colour is whatever its own drivers carry: avoids matching
  // Jolpica constructor ids against OpenF1 team names.
  const colourByConstructor = new Map();
  for (const d of driverStandings) {
    if (d.teamColour !== FALLBACK_COLOUR && !colourByConstructor.has(d.constructorId)) {
      colourByConstructor.set(d.constructorId, d.teamColour);
    }
  }
  const constructorStandings = csList.ConstructorStandings.map((s) => ({
    position: Number(s.position),
    constructorId: s.Constructor.constructorId,
    name: s.Constructor.name,
    teamColour: colourByConstructor.get(s.Constructor.constructorId) || FALLBACK_COLOUR,
    points: Number(s.points),
    wins: Number(s.wins),
  }));

  await writeJson('standings.json', {
    throughRound: completedRounds,
    drivers: driverStandings,
    constructors: constructorStandings,
  });
  log(`\nstandings.json  ${driverStandings.length} drivers, ${constructorStandings.length} constructors`);

  // ---- season.json --------------------------------------------------------
  const sessionByCircuitWithCancel = new Map(sessionByCircuit);
  const season = await buildSeason(calendar, sessionByCircuitWithCancel, resultsByRound, completedRounds);
  await writeJson('season.json', season);
  const counts = season.rounds.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  log(`season.json     ${season.rounds.length} rounds (${Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(', ')})`);

  // ---- season-arc.json ----------------------------------------------------
  const perRound = new Map();
  for (let r = 1; r <= completedRounds; r++) {
    const body = await getJson(`${JOLPICA}/${YEAR}/${r}/driverstandings/?limit=100`, { allow404: true });
    const list = body?.MRData?.StandingsTable?.StandingsLists?.[0];
    if (list?.DriverStandings?.length) perRound.set(r, list.DriverStandings);
    else warn(`round ${r} has no cumulative standings`);
  }
  const arcRounds = [...perRound.keys()].sort((a, b) => a - b);
  const arcSeries = driverStandings.map((d) => {
    const cumulative = [];
    const positions = [];
    let lastPoints = 0;
    let lastPos = driverStandings.length;
    for (const r of arcRounds) {
      const row = perRound.get(r).find((s) => s.Driver.driverId === d.driverId);
      // Before a driver's debut Jolpica omits them; carry the previous value so every
      // series is exactly rounds.length long.
      if (row) {
        lastPoints = Number(row.points);
        lastPos = Number(row.position);
      }
      cumulative.push(lastPoints);
      positions.push(lastPos);
    }
    return { driverId: d.driverId, code: d.code, teamColour: d.teamColour, cumulative, positions };
  });
  await writeJson('season-arc.json', { throughRound: completedRounds, rounds: arcRounds, series: arcSeries });
  log(`season-arc.json ${arcSeries.length} series over ${arcRounds.length} rounds`);

  // ---- circuits -----------------------------------------------------------
  log('\nCircuits...');
  // Priority order: get visually distinctive layouts on disk first so a partial run
  // still produces a usable set.
  const PRIORITY = ['monaco', 'spa', 'monza', 'suzuka', 'silverstone', 'marina_bay'];
  const racedCircuits = calendar.filter((r) => resultsByRound.has(r.round) && sessionByCircuit.has(r.circuitId));
  racedCircuits.sort((a, b) => {
    const ia = PRIORITY.indexOf(a.circuitId);
    const ib = PRIORITY.indexOf(b.circuitId);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.round - b.round;
  });

  const lapsBySession = new Map();
  const builtCircuits = [];
  for (const race of racedCircuits) {
    const session = sessionByCircuit.get(race.circuitId);
    try {
      const laps = await getJson(`${OPENF1}/laps?session_key=${session.sessionKey}`, { allow404: true });
      if (!laps || !laps.length) throw new Error('no lap data');
      lapsBySession.set(session.sessionKey, laps);
      const circuit = await buildCircuit(race, session, laps);
      const size = await writeJson(`circuits/${race.circuitId}.json`, circuit);
      builtCircuits.push(race.circuitId);
      log(
        `  ok   ${race.circuitId.padEnd(16)} ${String(circuit.points.length).padStart(3)} pts  ` +
          `${String(circuit.lengthMetres).padStart(5)} m  drv #${circuit.sourceDriver}  ${(size / 1024).toFixed(0)} KB`,
      );
    } catch (e) {
      skipped.push({ kind: 'circuit', id: race.circuitId, reason: e.message });
      console.warn(`  skip ${race.circuitId.padEnd(16)} ${e.message}`);
    }
  }

  // ---- drivers ------------------------------------------------------------
  log('\nDrivers...');
  // Season aggregates from the Jolpica result rows.
  const DNF_OK = /^(Finished|\+\d+ Lap|Lapped)/;
  const agg = new Map();
  for (const [, results] of resultsByRound) {
    for (const r of results) {
      const id = r.Driver.driverId;
      if (!agg.has(id)) agg.set(id, { finishes: [], podiums: 0, poles: 0, dnfs: 0, starts: 0 });
      const a = agg.get(id);
      const pos = Number(r.position);
      a.starts++;
      a.finishes.push(pos);
      if (pos <= 3) a.podiums++;
      if (Number(r.grid) === 1) a.poles++;
      if (!DNF_OK.test(r.status)) a.dnfs++;
    }
  }

  const sessionsNewestFirst = [...completedSessions].reverse();
  const builtDrivers = [];
  for (const d of driverStandings) {
    try {
      const a = agg.get(d.driverId) || { finishes: [], podiums: 0, poles: 0, dnfs: 0, starts: 0 };

      // Speed trace: the driver's fastest lap in the most recent session they ran.
      let trace = null;
      for (const session of sessionsNewestFirst) {
        let laps = lapsBySession.get(session.sessionKey);
        if (!laps) {
          laps = await getJson(`${OPENF1}/laps?session_key=${session.sessionKey}`, { allow404: true });
          if (laps) lapsBySession.set(session.sessionKey, laps);
        }
        const mine = (laps || []).filter((l) => l.driver_number === Number(d.permanentNumber));
        const lap = pickHotLap(mine);
        if (!lap) continue;
        const t0 = Date.parse(lap.date_start);
        const t1 = t0 + lap.lap_duration * 1000;
        const car = await getJson(
          `${OPENF1}/car_data?session_key=${session.sessionKey}&driver_number=${d.permanentNumber}` +
            `&date%3E${new Date(t0).toISOString().replace('Z', '')}` +
            `&date%3C${new Date(t1).toISOString().replace('Z', '')}`,
          { allow404: true },
        );
        const speeds = (car || [])
          .filter((c) => Number.isFinite(c.speed))
          .sort((x, y) => Date.parse(x.date) - Date.parse(y.date))
          .map((c) => c.speed);
        if (speeds.length < 30) continue;
        trace = resampleSeries(normalise01(speeds), SPEED_TRACE_POINTS).map((v) =>
          round(Math.min(1, Math.max(0, v)), 4),
        );
        break;
      }
      if (!trace) throw new Error('no usable speed telemetry in any session');

      await writeJson(`drivers/${d.driverId}.json`, {
        driverId: d.driverId,
        code: d.code,
        permanentNumber: d.permanentNumber,
        givenName: d.givenName,
        familyName: d.familyName,
        nationality: dsList.DriverStandings.find((s) => s.Driver.driverId === d.driverId).Driver.nationality,
        constructorId: d.constructorId,
        teamColour: d.teamColour,
        speedTrace: trace,
        season: {
          points: d.points,
          wins: d.wins,
          podiums: a.podiums,
          poles: a.poles,
          dnfs: a.dnfs,
          bestFinish: a.finishes.length ? Math.min(...a.finishes) : null,
          avgFinish: a.finishes.length
            ? round(a.finishes.reduce((x, y) => x + y, 0) / a.finishes.length, 2)
            : null,
        },
      });
      builtDrivers.push(d.driverId);
      log(`  ok   ${d.driverId.padEnd(16)} ${d.code}  ${d.points} pts`);
    } catch (e) {
      skipped.push({ kind: 'driver', id: d.driverId, reason: e.message });
      console.warn(`  skip ${d.driverId.padEnd(16)} ${e.message}`);
    }
  }

  // ---- index.json ---------------------------------------------------------
  // Built from what is actually on disk, never from what we intended to write.
  const onDisk = async (dir) => {
    const p = path.join(OUT, dir);
    if (!existsSync(p)) return [];
    return (await readdir(p)).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, '')).sort();
  };
  const index = { circuits: await onDisk('circuits'), drivers: await onDisk('drivers') };
  await writeJson('index.json', index);

  // ---- summary ------------------------------------------------------------
  let total = 0;
  const walk = async (dir) => {
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else total += (await stat(p)).size;
    }
  };
  await walk(OUT);

  log(`\nindex.json      ${index.circuits.length} circuits, ${index.drivers.length} drivers`);
  log(`tree size       ${(total / 1024 / 1024).toFixed(2)} MB of 8 MB budget`);
  if (skipped.length) {
    log(`\nSkipped ${skipped.length}:`);
    for (const s of skipped) log(`  ${s.kind} ${s.id}: ${s.reason}`);
  }
  if (warnings.length) log(`\n${warnings.length} warning(s) logged above.`);
  if (total > TREE_BUDGET) throw new Error('tree exceeds 8 MB budget');
  log('\nDone.\n');
}

main().catch((e) => {
  console.error('\nprebake failed:', e);
  process.exit(1);
});
