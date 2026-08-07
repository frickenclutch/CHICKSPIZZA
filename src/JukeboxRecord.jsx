import React from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * Chick's Pizza vinyl jukebox control.
 * Record spins only while the theme track is playing; center is play/pause.
 */
export default function JukeboxRecord({ playing, onToggle, trackTitle = 'Sauce on the Side' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={playing ? `Pause ${trackTitle}` : `Play ${trackTitle}`}
      title={playing ? `${trackTitle} — playing (click to unplug)` : `${trackTitle} — click to play`}
      className="group relative flex items-center gap-2 rounded-full p-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-300"
    >
      <span className="sr-only">
        {playing ? 'Jukebox on' : 'Jukebox off'}. {trackTitle}.
      </span>

      {/* Turntable platter shadow */}
      <span
        className="relative block w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.45)] ring-2 ring-black/40 shrink-0"
        aria-hidden="true"
      >
        {/* Spinning vinyl disc */}
        <span
          className={`chicks-vinyl-disc absolute inset-0 rounded-full overflow-hidden ${
            playing ? 'is-spinning' : ''
          }`}
        >
          {/* Vinyl body + grooves */}
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_42%,#3f3f46_0%,#18181b_38%,#09090b_70%,#000_100%)]" />
          <span className="absolute inset-[8%] rounded-full border border-white/10" />
          <span className="absolute inset-[14%] rounded-full border border-white/[0.07]" />
          <span className="absolute inset-[20%] rounded-full border border-white/[0.06]" />
          <span className="absolute inset-[26%] rounded-full border border-white/[0.05]" />
          <span className="absolute inset-[32%] rounded-full border border-white/[0.04]" />
          <span className="absolute inset-[38%] rounded-full border border-white/[0.04]" />

          {/* Specular glint */}
          <span className="absolute inset-0 rounded-full bg-[linear-gradient(125deg,rgba(255,255,255,0.18)_0%,transparent_32%,transparent_68%,rgba(255,255,255,0.06)_100%)]" />

          {/* Outer ring label (reads as Chick's Pizza record) */}
          <span className="absolute inset-[10%] rounded-full border-[3px] border-red-700/90" />

          {/* Inner paper label */}
          <span className="absolute inset-[28%] rounded-full bg-gradient-to-br from-red-700 via-red-800 to-red-950 shadow-inner flex flex-col items-center justify-center text-center px-0.5">
            <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-[0.12em] text-yellow-300 leading-none">
              Chick&apos;s
            </span>
            <span className="text-[4.5px] sm:text-[5.5px] font-black uppercase tracking-wide text-white leading-none mt-0.5">
              Pizza
            </span>
            <span className="text-[3.5px] sm:text-[4px] font-bold text-orange-200/90 leading-none mt-0.5 uppercase">
              Ogdensburg
            </span>
          </span>

          {/* Spinning highlight ring */}
          <span className="absolute inset-[46%] rounded-full border border-yellow-300/30" />
        </span>

        {/* Fixed center hub + play/pause (stays readable while disc spins) */}
        <span
          className={`absolute inset-[38%] rounded-full z-10 flex items-center justify-center shadow-md transition-colors ${
            playing
              ? 'bg-yellow-400 text-red-900 group-hover:bg-yellow-300'
              : 'bg-red-600 text-white group-hover:bg-red-500 ring-2 ring-yellow-300/80'
          }`}
        >
          {playing ? (
            <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" strokeWidth={2} />
          ) : (
            <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 ml-0.5" fill="currentColor" strokeWidth={2} />
          )}
        </span>
      </span>

      <span className="hidden sm:flex flex-col items-start leading-tight pr-1">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
          {playing ? 'Now spinning' : 'Jukebox'}
        </span>
        <span className="text-[11px] font-semibold max-w-[7.5rem] truncate opacity-95">
          {trackTitle}
        </span>
      </span>
    </button>
  );
}
