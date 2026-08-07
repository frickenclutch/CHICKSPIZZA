/** Chick's Pizza — 1608 Ford St, Ogdensburg, NY */
export const CHICKS = {
  lat: 44.69423,
  lon: -75.48605,
  address: '1608 Ford St, Ogdensburg, NY 13669',
  phone: '(315) 393-7700',
  phoneTel: '+13153937700',
  site: 'https://chickspizza.com',
  openHour: 16, // 4 PM Eastern
  closeHour: 20, // 8 PM Eastern
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
 * Live "cord window" status in America/New_York.
 * She is open only 4 (unknown) days — we report clock truth for 4–8 PM ET
 * and remind travelers the day roster is legendary / unreliable.
 */
export function getOpenWindow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'long',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    month: 'short',
    day: 'numeric',
  }).formatToParts(now);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const month = get('month');
  const day = get('day');
  const mins = hour * 60 + minute;
  const openMins = CHICKS.openHour * 60;
  const closeMins = CHICKS.closeHour * 60;
  const inClockWindow = mins >= openMins && mins < closeMins;

  let phase = 'outside';
  let headline = 'Outside the 4–8 PM window (Eastern)';
  let detail = `Call ${CHICKS.phone} before you invent a road-trip plan. She's only open 4 days a week.`;

  if (inClockWindow) {
    phase = 'maybe-open';
    headline = 'Within 4–8 PM Eastern — if today is one of her 4 days';
    detail = `Don't Hesitate. Call ${CHICKS.phone} before the cord gets pulled. We deliver, but you gotta tip us well!`;
  } else if (mins < openMins) {
    const remaining = openMins - mins;
    phase = 'before';
    headline = `Opens at 4:00 PM Eastern (in ~${Math.ceil(remaining / 60) > 1 ? Math.ceil(remaining / 60) + 'h' : remaining + 'm'}) — if today's a Chick day`;
    detail = `Lurk accordingly. Open 4 days a week only.`;
  } else {
    phase = 'after';
    headline = 'Past 8:00 PM Eastern — phone may already be unplugged';
    detail = 'Play the game. Plan tomorrow. Tip well if she has dough left next open day.';
  }

  return {
    phase,
    inClockWindow,
    weekday,
    localLabel: `${weekday}, ${month} ${day} · America/New_York`,
    headline,
    detail,
  };
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
