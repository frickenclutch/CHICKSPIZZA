#!/usr/bin/env node
/**
 * Chick's Pizza — postal data builder ("the pilgrimage atlas").
 *
 * Scrapes the public GeoNames postal-code dumps (no API, no key), and bakes
 * them into chunked static JSON under public/postal/ so the site can resolve
 * any supported ZIP / postal code entirely from its own origin at runtime.
 *
 *   node tools/build-postal-data.mjs [--full CA,GB] [--force] [--dry-run]
 *
 *   --full CC[,CC]  also download {CC}_full.csv.zip for full-resolution codes
 *                   (e.g. CA gives every "K1A 1A1" instead of just FSAs)
 *   --force         re-download dumps even if cached in tools/.cache
 *   --dry-run       parse + report, but write nothing
 *
 * Data source: https://download.geonames.org/export/zip/  (CC BY 4.0)
 * The site must credit GeoNames — the PilgrimageFinder widget does.
 *
 * Zero npm dependencies: ZIP extraction is done with node:zlib inflateRaw
 * against the archive's central directory.
 */

import { mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const CACHE_DIR = join(__dirname, '.cache');
const OUT_DIR = join(REPO_ROOT, 'public', 'postal');
const BASE_URL = 'https://download.geonames.org/export/zip/';

/** Entries per JSON file before we split into prefix chunks. */
const SPLIT_THRESHOLD = 12000;

/* ------------------------------------------------------------------ */
/* CLI                                                                 */
/* ------------------------------------------------------------------ */

const argv = process.argv.slice(2);
const FLAGS = {
  full: [],
  force: argv.includes('--force'),
  dryRun: argv.includes('--dry-run'),
};
const fullIdx = argv.indexOf('--full');
if (fullIdx !== -1 && argv[fullIdx + 1]) {
  FLAGS.full = argv[fullIdx + 1].split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
}
if (argv.includes('--help') || argv.includes('-h')) {
  console.log('Usage: node tools/build-postal-data.mjs [--full CC,CC] [--force] [--dry-run]');
  process.exit(0);
}

/* ------------------------------------------------------------------ */
/* Minimal ZIP reader (central directory + inflateRaw)                 */
/* ------------------------------------------------------------------ */

function readZipEntries(buf) {
  // Locate End Of Central Directory record (sig 0x06054b50), scanning back
  // past any archive comment (max 65535 bytes).
  const minEocd = 22;
  let eocd = -1;
  const scanFrom = Math.max(0, buf.length - minEocd - 65535);
  for (let i = buf.length - minEocd; i >= scanFrom; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd === -1) throw new Error('Not a ZIP file (no end-of-central-directory record)');

  const count = buf.readUInt16LE(eocd + 10);
  let ptr = buf.readUInt32LE(eocd + 16); // central directory offset

  const entries = [];
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('Corrupt central directory');
    const method = buf.readUInt16LE(ptr + 10);
    const compSize = buf.readUInt32LE(ptr + 20);
    const nameLen = buf.readUInt16LE(ptr + 28);
    const extraLen = buf.readUInt16LE(ptr + 30);
    const commentLen = buf.readUInt16LE(ptr + 32);
    const localOff = buf.readUInt32LE(ptr + 42);
    const name = buf.toString('utf8', ptr + 46, ptr + 46 + nameLen);
    entries.push({ name, method, compSize, localOff });
    ptr += 46 + nameLen + extraLen + commentLen;
  }

  return entries.map((e) => ({
    name: e.name,
    read() {
      if (buf.readUInt32LE(e.localOff) !== 0x04034b50) throw new Error(`Corrupt local header for ${e.name}`);
      const nameLen = buf.readUInt16LE(e.localOff + 26);
      const extraLen = buf.readUInt16LE(e.localOff + 28);
      const start = e.localOff + 30 + nameLen + extraLen;
      const raw = buf.subarray(start, start + e.compSize);
      if (e.method === 0) return Buffer.from(raw);
      if (e.method === 8) return zlib.inflateRawSync(raw);
      throw new Error(`Unsupported compression method ${e.method} for ${e.name}`);
    },
  }));
}

/* ------------------------------------------------------------------ */
/* Download with cache                                                 */
/* ------------------------------------------------------------------ */

async function download(fileName) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cached = join(CACHE_DIR, fileName);
  if (!FLAGS.force && existsSync(cached)) {
    const s = await stat(cached);
    console.log(`  cached  ${fileName}  (${mb(s.size)})`);
    return readFile(cached);
  }
  const url = BASE_URL + fileName;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`  fetch   ${url}${attempt > 1 ? `  (attempt ${attempt})` : ''}`);
      const res = await fetch(url, {
        headers: { 'User-Agent': 'chickspizza.com postal-data builder (GeoNames CC-BY attribution on site)' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(cached, buf);
      console.log(`  saved   ${fileName}  (${mb(buf.length)})`);
      return buf;
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((r) => setTimeout(r, attempt * 2000));
    }
  }
}

/* ------------------------------------------------------------------ */
/* GeoNames TSV parsing                                                */
/* ------------------------------------------------------------------ */

// Columns: 0 country, 1 postal, 2 place, 3 admin1 name, 4 admin1 code,
//          5 admin2 name, 6 admin2 code, 7 admin3 name, 8 admin3 code,
//          9 lat, 10 lon, 11 accuracy
function parseRows(text, onRow) {
  let start = 0;
  let rows = 0;
  const len = text.length;
  while (start < len) {
    let end = text.indexOf('\n', start);
    if (end === -1) end = len;
    const line = text.slice(start, end);
    start = end + 1;
    if (!line) continue;
    const f = line.split('\t');
    if (f.length < 11) continue;
    const lat = parseFloat(f[9]);
    const lon = parseFloat(f[10]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    onRow(f[0], f[1], f[2], f[3], f[4], lat, lon);
    rows++;
  }
  return rows;
}

/** Same normalization the site applies to user input. Keep in sync with src/pilgrimage.js. */
const normalize = (code) => code.toUpperCase().replace(/[^A-Z0-9]/g, '');

function pickRegion(admin1Name, admin1Code) {
  if (/^[A-Z]{2,3}$/.test(admin1Code)) return admin1Code; // NY, ON, ENG …
  return admin1Name || '';
}

/* ------------------------------------------------------------------ */
/* Aggregation                                                         */
/* ------------------------------------------------------------------ */

// countries: Map<cc, Map<key, [latSum, lonSum, n, place, region]>>
const countries = new Map();

function addRow(cc, postal, place, admin1Name, admin1Code, lat, lon) {
  const key = normalize(postal);
  if (!key || key.length > 10) return;
  let codes = countries.get(cc);
  if (!codes) countries.set(cc, (codes = new Map()));
  const cur = codes.get(key);
  if (cur) {
    cur[0] += lat;
    cur[1] += lon;
    cur[2] += 1;
  } else {
    codes.set(key, [lat, lon, 1, place || '', pickRegion(admin1Name, admin1Code)]);
  }
}

/* ------------------------------------------------------------------ */
/* Country display names (ISO 3166-1 alpha-2, GeoNames coverage)       */
/* ------------------------------------------------------------------ */

const COUNTRY_NAMES = {
  AD: 'Andorra', AE: 'United Arab Emirates', AI: 'Anguilla', AL: 'Albania',
  CC: 'Cocos (Keeling) Islands', CN: 'China', CX: 'Christmas Island', EC: 'Ecuador',
  FK: 'Falkland Islands', GI: 'Gibraltar', GS: 'South Georgia', HK: 'Hong Kong',
  HM: 'Heard and McDonald Islands', HN: 'Honduras', ID: 'Indonesia', IO: 'British Indian Ocean Territory',
  KE: 'Kenya', MA: 'Morocco', MO: 'Macau', NF: 'Norfolk Island', NR: 'Nauru', NU: 'Niue',
  PA: 'Panama', PF: 'French Polynesia', PN: 'Pitcairn Islands', TC: 'Turks and Caicos Islands',
  WS: 'Samoa',
  AR: 'Argentina', AS: 'American Samoa', AT: 'Austria', AU: 'Australia',
  AX: 'Åland Islands', AZ: 'Azerbaijan', BD: 'Bangladesh', BE: 'Belgium', BG: 'Bulgaria',
  BM: 'Bermuda', BR: 'Brazil', BY: 'Belarus', CA: 'Canada', CH: 'Switzerland',
  CL: 'Chile', CO: 'Colombia', CR: 'Costa Rica', CY: 'Cyprus', CZ: 'Czechia',
  DE: 'Germany', DK: 'Denmark', DO: 'Dominican Republic', DZ: 'Algeria', EE: 'Estonia',
  ES: 'Spain', FI: 'Finland', FM: 'Micronesia', FO: 'Faroe Islands', FR: 'France',
  GB: 'United Kingdom', GF: 'French Guiana', GG: 'Guernsey', GL: 'Greenland',
  GP: 'Guadeloupe', GT: 'Guatemala', GU: 'Guam', HR: 'Croatia', HT: 'Haiti',
  HU: 'Hungary', IE: 'Ireland', IM: 'Isle of Man', IN: 'India', IS: 'Iceland',
  IT: 'Italy', JE: 'Jersey', JP: 'Japan', KR: 'South Korea', LI: 'Liechtenstein',
  LK: 'Sri Lanka', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MC: 'Monaco',
  MD: 'Moldova', MH: 'Marshall Islands', MK: 'North Macedonia', MP: 'Northern Mariana Islands',
  MQ: 'Martinique', MT: 'Malta', MW: 'Malawi', MX: 'Mexico', MY: 'Malaysia',
  NC: 'New Caledonia', NL: 'Netherlands', NO: 'Norway', NZ: 'New Zealand',
  PE: 'Peru', PH: 'Philippines', PK: 'Pakistan', PL: 'Poland', PM: 'Saint Pierre and Miquelon',
  PR: 'Puerto Rico', PT: 'Portugal', PW: 'Palau', RE: 'Réunion', RO: 'Romania',
  RS: 'Serbia', RU: 'Russia', SE: 'Sweden', SG: 'Singapore', SI: 'Slovenia',
  SJ: 'Svalbard and Jan Mayen', SK: 'Slovakia', SM: 'San Marino', TH: 'Thailand',
  TR: 'Türkiye', UA: 'Ukraine', US: 'United States', UY: 'Uruguay', VA: 'Vatican City',
  VI: 'U.S. Virgin Islands', WF: 'Wallis and Futuna', YT: 'Mayotte', ZA: 'South Africa',
};

/* ------------------------------------------------------------------ */
/* Emit chunked JSON                                                   */
/* ------------------------------------------------------------------ */

const round3 = (x) => Math.round(x * 1000) / 1000;

function finalizeCountry(codes) {
  const out = {};
  for (const [key, [latSum, lonSum, n, place, region]] of codes) {
    out[key] = [round3(latSum / n), round3(lonSum / n), place, region];
  }
  return out;
}

function chunkPlan(keys) {
  if (keys.length <= SPLIT_THRESHOLD) return 0;
  for (const prefixLen of [1, 2]) {
    const sizes = new Map();
    for (const k of keys) {
      const p = k.slice(0, prefixLen);
      sizes.set(p, (sizes.get(p) || 0) + 1);
    }
    if (Math.max(...sizes.values()) <= SPLIT_THRESHOLD) return prefixLen;
  }
  return 3;
}

async function emit() {
  if (!FLAGS.dryRun) {
    await rm(OUT_DIR, { recursive: true, force: true });
    await mkdir(OUT_DIR, { recursive: true });
  }

  const manifest = { source: 'GeoNames postal code dump (download.geonames.org/export/zip)', license: 'CC BY 4.0', countries: {} };
  let fileCount = 0;
  let totalBytes = 0;
  let totalEntries = 0;
  const perCountry = [];

  for (const cc of [...countries.keys()].sort()) {
    if (!/^[A-Z]{2}$/.test(cc)) continue;
    const entries = finalizeCountry(countries.get(cc));
    const keys = Object.keys(entries).sort();
    if (keys.length === 0) continue;
    const split = chunkPlan(keys);
    const sample = keys[Math.floor(keys.length / 2)];

    if (split === 0) {
      const json = JSON.stringify(entries);
      totalBytes += json.length;
      fileCount += 1;
      if (!FLAGS.dryRun) await writeFile(join(OUT_DIR, `${cc}.json`), json);
    } else {
      const chunks = new Map();
      for (const k of keys) {
        const p = k.slice(0, split);
        if (!chunks.has(p)) chunks.set(p, {});
        chunks.get(p)[k] = entries[k];
      }
      if (!FLAGS.dryRun) await mkdir(join(OUT_DIR, cc), { recursive: true });
      for (const [p, obj] of chunks) {
        const json = JSON.stringify(obj);
        totalBytes += json.length;
        fileCount += 1;
        if (!FLAGS.dryRun) await writeFile(join(OUT_DIR, cc, `${p}.json`), json);
      }
    }

    manifest.countries[cc] = { name: COUNTRY_NAMES[cc] || cc, count: keys.length, split, sample };
    totalEntries += keys.length;
    perCountry.push([cc, keys.length]);
  }

  const manifestJson = JSON.stringify(manifest);
  totalBytes += manifestJson.length;
  fileCount += 1;
  if (!FLAGS.dryRun) await writeFile(join(OUT_DIR, 'manifest.json'), manifestJson);

  return { fileCount, totalBytes, totalEntries, perCountry, manifest };
}

/* ------------------------------------------------------------------ */
/* Self-check probes                                                   */
/* ------------------------------------------------------------------ */

const PROBES = [
  ['US', '13669', 'Ogdensburg NY'],
  ['CA', 'K1A1A1', 'Ottawa (full code, needs --full CA)'],
  ['CA', 'K0E', 'Eastern Ontario FSA'],
  ['GB', 'SW1A', 'Westminster outward code'],
  ['FR', '75001', 'Paris'],
  ['DE', '80331', 'Munich'],
  ['JP', '1000001', 'Tokyo Chiyoda'],
  ['AU', '2000', 'Sydney'],
  ['IN', '110001', 'New Delhi'],
  ['MX', '06000', 'Mexico City'],
  ['BR', '01310100', 'São Paulo (full CEP)'],
  ['NL', '1012', 'Amsterdam'],
];

function runProbes() {
  console.log('\nProbe lookups:');
  for (const [cc, key, label] of PROBES) {
    const hit = countries.get(cc)?.get(key);
    if (hit) {
      const [latSum, lonSum, n, place, region] = hit;
      console.log(`  ok      ${cc} ${key}  -> ${place}${region ? ', ' + region : ''}  (${round3(latSum / n)}, ${round3(lonSum / n)})`);
    } else {
      console.log(`  MISS    ${cc} ${key}  (${label})`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  const t0 = Date.now();
  console.log('Chick\'s Pizza postal atlas builder');
  console.log(`Full-resolution countries: ${FLAGS.full.length ? FLAGS.full.join(', ') : '(none)'}\n`);

  console.log('Downloading GeoNames dumps:');
  const allZip = await download('allCountries.zip');

  console.log('\nParsing allCountries…');
  const allEntries = readZipEntries(allZip);
  const dataEntry = allEntries.find((e) => e.name === 'allCountries.txt');
  if (!dataEntry) throw new Error(`allCountries.txt not found in zip (has: ${allEntries.map((e) => e.name).join(', ')})`);
  const rowCount = parseRows(dataEntry.read().toString('utf8'), addRow);
  console.log(`  ${rowCount.toLocaleString()} rows, ${countries.size} countries`);

  for (const cc of FLAGS.full) {
    const fileName = `${cc}_full.csv.zip`;
    console.log(`\nDownloading + merging full-resolution ${cc}:`);
    const zip = await download(fileName);
    const entries = readZipEntries(zip);
    const entry = entries.find((e) => /\.(csv|txt)$/i.test(e.name) && !/readme/i.test(e.name));
    if (!entry) throw new Error(`No data file in ${fileName}`);
    const text = entry.read().toString('utf8');
    if (!text.slice(0, 2000).includes('\t')) throw new Error(`${fileName} is not tab-delimited — format changed?`);
    const n = parseRows(text, addRow);
    console.log(`  ${n.toLocaleString()} rows merged into ${cc}`);
  }

  console.log('\nWriting chunks…');
  const { fileCount, totalBytes, totalEntries, perCountry } = await emit();

  perCountry.sort((a, b) => b[1] - a[1]);
  console.log('\nLargest countries:');
  for (const [cc, n] of perCountry.slice(0, 12)) {
    console.log(`  ${cc}  ${n.toLocaleString().padStart(9)}  ${COUNTRY_NAMES[cc] || ''}`);
  }

  console.log(`\nTotals: ${totalEntries.toLocaleString()} codes, ${perCountry.length} countries, ${fileCount.toLocaleString()} files, ${mb(totalBytes)}${FLAGS.dryRun ? '  (dry run — nothing written)' : ''}`);
  if (fileCount > 5000) {
    console.warn('WARNING: file count is getting large. Cloudflare Pages allows max 20,000 files per deployment.');
  }

  runProbes();
  console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s. Output: ${FLAGS.dryRun ? '(dry run)' : OUT_DIR}`);
}

main().catch((err) => {
  console.error('\nFAILED:', err.message);
  process.exit(1);
});
