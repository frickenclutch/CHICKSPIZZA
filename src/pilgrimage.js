/** Chick's Pizza — 1608 Ford St, Ogdensburg, NY */
export const CHICKS = {
  lat: 44.69423,
  lon: -75.48605,
  address: '1608 Ford St, Ogdensburg, NY 13669',
  phone: '(315) 393-7700',
  phoneTel: '+13153937700',
  site: 'https://chickspizza.com',
};

/** Great-circle distance in miles */
export function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Rough drive estimate (rural highway-ish) */
export function driveHoursFromMiles(miles) {
  const hours = miles / 48;
  if (hours < 0.35) return 'under 20 minutes';
  if (hours < 1) return `about ${Math.round(hours * 60)} minutes`;
  if (hours < 1.5) return 'about 1–1.5 hours';
  if (hours <= 26) {
    const rounded = Math.round(hours * 2) / 2;
    return `about ${rounded} hours`;
  }
  return `about ${Math.round((hours / 24) * 10) / 10} days of nonstop driving (a flight is fair)`;
}

/*
 * Offline postal lookup.
 *
 * All data is baked into /postal/ at build time by tools/build-postal-data.mjs
 * (GeoNames dumps, CC BY 4.0) and served from our own origin — no external API.
 * manifest.json lists countries; codes live in CC.json or CC/<prefix>.json
 * chunks mapping normalized code -> [lat, lon, place, region].
 */

const DATA_BASE = '/postal';

/** Must match the tool's normalization: uppercase, strip non-alphanumerics. */
export const normalizePostal = (raw) =>
  String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

let manifestPromise = null;
const chunkCache = new Map();

async function fetchJson(path) {
  const res = await fetch(path);
  if (res.status === 404) return null; // definitive miss — safe to cache
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
  return res.json();
}

/** Load + cache /postal/manifest.json. Resolves to { countries: { CC: {...} } }. */
export function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetchJson(`${DATA_BASE}/manifest.json`).catch((err) => {
      manifestPromise = null; // allow retry on transient failure
      throw err;
    });
  }
  return manifestPromise;
}

function loadChunk(path) {
  if (!chunkCache.has(path)) {
    const p = fetchJson(path).catch((err) => {
      chunkCache.delete(path);
      throw err;
    });
    chunkCache.set(path, p);
  }
  return chunkCache.get(path);
}

/**
 * Some countries need fallback keys: ZIP+4 -> ZIP5, full UK postcode -> outward
 * code, full Canadian code -> FSA, Brazilian 8-digit CEP -> 5-digit prefix.
 */
function keyVariants(cc, key) {
  const variants = [key];
  if (cc === 'US' && key.length > 5) variants.push(key.slice(0, 5));
  if (cc === 'CA' && key.length > 3) variants.push(key.slice(0, 3));
  if (cc === 'GB' && key.length >= 5) variants.push(key.slice(0, -3));
  if (cc === 'BR' && key.length === 8) variants.push(key.slice(0, 5));
  if (cc === 'NL' && key.length === 6) variants.push(key.slice(0, 4));
  return variants;
}

/** Letter-bearing formats are distinctive enough to hop countries on a miss. */
const DETECT = [
  ['CA', /^[A-Z]\d[A-Z](\d[A-Z]\d)?$/],
  ['NL', /^\d{4}[A-Z]{2}$/],
  ['GB', /^[A-Z]{1,2}\d[A-Z\d]?(\d[A-Z]{2})?$/],
];

async function findInCountry(cc, meta, key) {
  for (const variant of keyVariants(cc, key)) {
    if (!variant) continue;
    const path =
      meta.split === 0
        ? `${DATA_BASE}/${cc}.json`
        : `${DATA_BASE}/${cc}/${variant.slice(0, meta.split)}.json`;
    const chunk = await loadChunk(path); // null when the prefix has no chunk
    const hit = chunk?.[variant];
    if (hit) return hit;
  }
  return null;
}

/**
 * Resolve a postal code to distance-from-Chick's, fully offline.
 * @param raw   what the pilgrim typed
 * @param preferredCC  the country selected in the UI (tried first)
 */
export async function lookupPostal(raw, preferredCC = 'US') {
  const key = normalizePostal(raw);
  if (!key) throw new Error('Enter a ZIP or postal code.');

  let manifest;
  try {
    manifest = await loadManifest();
  } catch {
    throw new Error("The atlas didn't load — check your connection and try again.");
  }
  const countries = manifest.countries || {};

  const tryOrder = [];
  if (countries[preferredCC]) tryOrder.push(preferredCC);
  for (const [cc, re] of DETECT) {
    if (cc !== preferredCC && countries[cc] && re.test(key)) tryOrder.push(cc);
  }
  if (tryOrder.length === 0) {
    throw new Error('Pick a country from the list — the oven needs to know where you are.');
  }

  for (const cc of tryOrder) {
    let hit;
    try {
      hit = await findInCountry(cc, countries[cc], key);
    } catch {
      throw new Error('The atlas hiccuped mid-lookup — try again in a second.');
    }
    if (!hit) continue;

    const [lat, lon, place, region] = hit;
    const countryName = countries[cc].name || cc;
    const city = place || countryName;
    const miles = haversineMiles(lat, lon, CHICKS.lat, CHICKS.lon);
    return {
      city,
      region: region || '',
      country: cc,
      countryName,
      lat,
      lon,
      miles: Math.round(miles * 10) / 10,
      drive: driveHoursFromMiles(miles),
      label: region ? `${city}, ${region}` : `${city}, ${countryName}`,
    };
  }

  const where = countries[preferredCC]?.name || 'that country';
  const sample = countries[preferredCC]?.sample;
  throw new Error(
    `That code didn't ring the oven in ${where}${sample ? ` (codes look like ${sample})` : ''}. Double-check it — or switch country.`
  );
}
