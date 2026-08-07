import React, { useState } from 'react';
import { Navigation, Loader2 } from 'lucide-react';
import { lookupPostal, CHICKS } from './pilgrimage.js';

/**
 * ZIP / postal → miles + drive pitch to 1608 Ford St.
 * Stores last pilgrimage label for share cards (callback).
 */
export default function PilgrimageFinder({ onResult, theme = 'american' }) {
  const [zip, setZip] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const data = await lookupPostal(zip);
      setResult(data);
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

  return (
    <div className={`mt-6 p-4 rounded-2xl border-2 text-left ${box}`}>
      <h3 className="font-black text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
        <Navigation className="w-4 h-4" aria-hidden="true" />
        How far is the pilgrimage?
      </h3>
      <p className={`text-sm mb-3 ${theme === 'italian' ? 'text-slate-300' : 'text-gray-600'}`}>
        Everyone’s got to try Chick’s once. Drop a ZIP — we’ll map the drive to {CHICKS.address.split(',')[0]}.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2">
        <label className="sr-only" htmlFor="pilgrim-zip">
          US ZIP or Canadian postal code
        </label>
        <input
          id="pilgrim-zip"
          name="zip"
          inputMode="text"
          autoComplete="postal-code"
          placeholder="ZIP / postal (e.g. 13676 or K1A)"
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
            {result.miles} mi from {result.label}
          </p>
          <p className="text-sm font-medium">
            Drive: {result.drive} (give or take border / lake nonsense).
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
    </div>
  );
}
