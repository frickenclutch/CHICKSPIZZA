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
  const rounded = Math.round(hours * 2) / 2;
  return `about ${rounded} hours`;
}

/**
 * Resolve US ZIP (5-digit) or Canadian FSA (A1A) via Zippopotam (no API key).
 */
export async function lookupPostal(raw) {
  const cleaned = String(raw || '').trim().toUpperCase();
  if (!cleaned) throw new Error('Enter a ZIP or postal code.');

  const us = cleaned.match(/^(\d{5})(?:-\d{4})?$/);
  const ca = cleaned.match(/^([A-Z]\d[A-Z])\s*\d?[A-Z]?\d?$/);

  let url;
  if (us) url = `https://api.zippopotam.us/us/${us[1]}`;
  else if (ca) url = `https://api.zippopotam.us/ca/${ca[1]}`;
  else throw new Error('Use a US ZIP (13669) or Canadian FSA (K1A).');

  const res = await fetch(url);
  if (!res.ok) throw new Error("That code didn't ring the oven. Try another.");

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) throw new Error('No place found for that code.');

  const lat = parseFloat(place.latitude);
  const lon = parseFloat(place.longitude);
  const miles = haversineMiles(lat, lon, CHICKS.lat, CHICKS.lon);
  const city = place['place name'];
  const region = place['state abbreviation'] || place['state'] || data['country abbreviation'];

  return {
    city,
    region,
    country: data['country abbreviation'],
    lat,
    lon,
    miles: Math.round(miles * 10) / 10,
    drive: driveHoursFromMiles(miles),
    label: `${city}, ${region}`,
  };
}
