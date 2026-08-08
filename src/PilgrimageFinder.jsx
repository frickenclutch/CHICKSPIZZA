import React, { useState, useEffect } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { lookupPostal, loadManifest, CHICKS } from './pilgrimage.js';

const CC_STORAGE_KEY = 'chicks-pilgrim-cc';

const flagEmoji = (cc) =>
  String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

/**
 * ZIP / postal → miles + drive pitch to 1608 Ford St.
 * Lookups are fully offline-from-our-origin: the postal atlas is baked into
 * /postal/ at build time (GeoNames, CC BY 4.0 — keep the credit line).
 * Stores last pilgrimage label for share cards (callback).
 */
export default function PilgrimageFinder({ onResult, theme = 'american' }) {
  const [zip, setZip] = useState('');
  const [cc, setCc] = useState('US');
  const [countries, setCountries] = useState(null); // [{cc, name, count, sample}]
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    let alive = true;
    loadManifest()
      .then((m) => {
        if (!alive) return;
        const list = Object.entries(m.countries)
          .map(([code, meta]) => ({ cc: code, ...meta }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setCountries(list);
        const saved = localStorage.getItem(CC_STORAGE_KEY);
        if (saved && m.countries[saved]) setCc(saved);
      })
      .catch(() => {
        if (alive) setError("The atlas didn't load — refresh to map your pilgrimage.");
      });
    return () => {
      alive = false;
    };
  }, []);

  const pickCountry = (next) => {
    setCc(next);
    try {
      localStorage.setItem(CC_STORAGE_KEY, next);
    } catch {
      /* private mode — fine */
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await lookupPostal(zip, cc);
      setResult(data);
      if (data.country !== cc) pickCountry(data.country); // auto-detected hop
      onResult?.(data);
    } catch (err) {
      setResult(null);
      setError(err?.message || 'Could not map that code.');
      onResult?.(null);
    } finally {
      setBusy(false);
    }
  };

  const box =
    theme === 'italian'
      ? 'bg-slate-800 border-green-600 text-slate-100'
      : 'bg-orange-100 border-orange-400 text-gray-900';

  const selected = countries?.find((c) => c.cc === cc);
  const placeholder = selected?.sample
    ? `Postal code (e.g. ${selected.sample})`
    : 'ZIP / postal (e.g. 13676 or K1A)';

  return (
    <div className={`mt-6 p-4 rounded-2xl border-2 text-left ${box}`}>
      <h3 className="font-black text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
        <Navigation className="w-4 h-4" aria-hidden="true" />
        How far is the pilgrimage?
      </h3>
      <p className={`text-sm mb-3 ${theme === 'italian' ? 'text-slate-300' : 'text-gray-600'}`}>
        Everyone’s got to try Chick’s once. Drop a postal code from{' '}
        {countries ? `any of ${countries.length} countries` : 'anywhere'} — we’ll map the
        trek to {CHICKS.address.split(',')[0]}.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor="pilgrim-country">
          Country
        </label>
        <select
          id="pilgrim-country"
          value={cc}
          onChange={(e) => pickCountry(e.target.value)}
          disabled={!countries}
          className="rounded-xl border-2 border-gray-300 px-2 py-2.5 font-semibold text-gray-900 bg-white min-h-[44px] sm:max-w-[11rem] focus:border-red-600 focus:outline-none"
        >
          {countries ? (
            countries.map((c) => (
              <option key={c.cc} value={c.cc}>
                {flagEmoji(c.cc)} {c.name}
              </option>
            ))
          ) : (
            <option value="US">🇺🇸 United States</option>
          )}
        </select>
        <label className="sr-only" htmlFor="pilgrim-zip">
          ZIP or postal code
        </label>
        <input
          id="pilgrim-zip"
          name="zip"
          inputMode="text"
          autoComplete="postal-code"
          placeholder={placeholder}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          className="flex-1 rounded-xl border-2 border-gray-300 px-3 py-2.5 font-semibold text-gray-900 min-h-[44px] focus:border-red-600 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy || !zip.trim()}
          className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white font-black px-5 py-2.5 rounded-xl min-h-[44px] flex items-center justify-center gap-2"
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Mapping…
            </>
          ) : (
            'Map it'
          )}
        </button>
      </form>
      {error && (
        <p className="mt-2 text-sm font-bold text-red-700" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div className="mt-3 space-y-1" role="status">
          <p className="font-black text-lg">
            {result.miles.toLocaleString()} mi from {result.label}{' '}
            {result.country !== 'US' && (
              <span aria-hidden="true">{flagEmoji(result.country)}</span>
            )}
          </p>
          <p className="text-sm font-medium">
            Drive: {result.drive} (give or take border / lake / ocean nonsense).
          </p>
          <p className="text-sm font-bold text-red-800">
            {result.miles < 30
              ? 'Close enough to tip well on delivery — or just show up.'
              : result.miles < 120
                ? 'Day-trip territory. Call before the cord gets pulled.'
                : 'Worth the pilgrimage. Play the game on the drive, eat the pie in person.'}
          </p>
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(CHICKS.address)}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block mt-2 text-sm font-black underline"
          >
            Open directions →
          </a>
        </div>
      )}
      <p className={`mt-3 text-[10px] ${theme === 'italian' ? 'text-slate-400' : 'text-gray-500'}`}>
        Postal data ©{' '}
        <a href="https://www.geonames.org/" target="_blank" rel="noreferrer" className="underline">
          GeoNames
        </a>{' '}
        (CC BY 4.0) — baked into the site, no lookups leave this kitchen.
      </p>
    </div>
  );
}
