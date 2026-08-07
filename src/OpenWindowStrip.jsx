import React, { useEffect, useState } from 'react';
import { getOpenWindow, CHICKS } from './pilgrimage.js';

/** Sticky strip: is the 4–8 PM Eastern cord window open right now? */
export default function OpenWindowStrip({ theme = 'american' }) {
  const [info, setInfo] = useState(() => getOpenWindow());

  useEffect(() => {
    const tick = () => setInfo(getOpenWindow());
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const tones = {
    'maybe-open':
      theme === 'italian'
        ? 'bg-green-900 border-green-500 text-green-50'
        : 'bg-green-800 border-green-600 text-green-50',
    before:
      theme === 'italian'
        ? 'bg-amber-900 border-amber-500 text-amber-50'
        : 'bg-amber-700 border-amber-500 text-amber-50',
    after:
      theme === 'italian'
        ? 'bg-slate-800 border-slate-500 text-slate-100'
        : 'bg-stone-800 border-stone-600 text-stone-100',
    outside:
      theme === 'italian'
        ? 'bg-slate-800 border-slate-500 text-slate-100'
        : 'bg-stone-800 border-stone-600 text-stone-100',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`w-full border-b-4 px-3 py-2 text-center text-sm sm:text-base font-semibold z-20 ${tones[info.phase] || tones.outside}`}
    >
      <p className="font-black tracking-wide uppercase text-xs sm:text-sm opacity-90">
        Cord window · {info.localLabel}
      </p>
      <p className="mt-0.5 leading-snug">{info.headline}</p>
      <p className="mt-0.5 text-xs sm:text-sm font-medium opacity-90 max-w-3xl mx-auto">
        {info.detail}{' '}
        <a
          href={`tel:${CHICKS.phoneTel}`}
          className="underline font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Call
        </a>
        {' · '}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CHICKS.address)}`}
          target="_blank"
          rel="noreferrer"
          className="underline font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          GPS
        </a>
      </p>
    </div>
  );
}
