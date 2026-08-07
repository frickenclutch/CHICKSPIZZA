import React from 'react';
import { Play, Pause } from 'lucide-react';

/**
 * Chick's pizza-pan jukebox.
 * Metal saucer spins while the track plays; pie assembles layer by layer as it rotates.
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
        {playing ? 'Jukebox on — pizza spinning and assembling' : 'Jukebox off'}. {trackTitle}.
      </span>

      {/* Pizza pan / saucer */}
      <span
        className="relative block w-14 h-14 sm:w-[3.75rem] sm:h-[3.75rem] shrink-0"
        aria-hidden="true"
      >
        {/* Stationary outer lip shadow (table) */}
        <span className="absolute inset-0 rounded-full bg-black/25 blur-[2px] translate-y-0.5" />

        {/* Spinning pan + pie */}
        <span
          className={`chicks-pizza-pan absolute inset-0 ${playing ? 'is-spinning' : ''}`}
        >
          {/* Metal pan rim */}
          <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#e5e7eb_0%,#9ca3af_35%,#6b7280_62%,#4b5563_85%,#374151_100%)] shadow-[inset_0_1px_2px_rgba(255,255,255,0.55),0_2px_6px_rgba(0,0,0,0.35)]" />
          {/* Inner well of pan */}
          <span className="absolute inset-[7%] rounded-full bg-[radial-gradient(circle_at_40%_35%,#a8a29e_0%,#78716c_55%,#57534e_100%)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.45)]" />
          {/* Dark pan floor (empty oven tray look when idle) */}
          <span className="absolute inset-[12%] rounded-full bg-[#44403c]" />

          {/* --- Assembling pie (layers build while spinning) --- */}
          <span className={`absolute inset-[12%] rounded-full overflow-hidden chicks-pie-stage ${playing ? 'is-assembling' : 'is-idle'}`}>
            {/* Dough / crust */}
            <span className="chicks-pie-crust absolute inset-0 rounded-full bg-[radial-gradient(circle_at_45%_40%,#fde68a_0%,#fbbf24_28%,#d97706_72%,#92400e_100%)]" />
            <span className="chicks-pie-crust absolute inset-[6%] rounded-full border-[3px] border-[#b45309]/70 shadow-[inset_0_0_0_1px_rgba(254,243,199,0.35)]" />

            {/* Sauce */}
            <span className="chicks-pie-sauce absolute inset-[14%] rounded-full bg-[radial-gradient(circle_at_40%_40%,#ef4444_0%,#b91c1c_55%,#7f1d1d_100%)]" />

            {/* Cheese melt */}
            <span className="chicks-pie-cheese absolute inset-[16%] rounded-full bg-[radial-gradient(circle_at_50%_45%,#fef9c3_0%,#fde047_40%,#facc15_100%)] opacity-90" />
            <span className="chicks-pie-cheese absolute inset-[18%] rounded-full opacity-40 bg-[radial-gradient(circle,transparent_30%,rgba(251,191,36,0.5)_100%)]" />

            {/* Pepperoni */}
            <span className="chicks-pie-topping chicks-pep chicks-pep-1 absolute w-[18%] h-[18%] rounded-full bg-[#9f1239] border border-[#7f1d1d]/80 shadow-sm" style={{ top: '22%', left: '28%' }} />
            <span className="chicks-pie-topping chicks-pep chicks-pep-2 absolute w-[16%] h-[16%] rounded-full bg-[#be123c] border border-[#9f1239]/80" style={{ top: '38%', left: '52%' }} />
            <span className="chicks-pie-topping chicks-pep chicks-pep-3 absolute w-[17%] h-[17%] rounded-full bg-[#9f1239] border border-[#7f1d1d]/80" style={{ top: '55%', left: '30%' }} />
            <span className="chicks-pie-topping chicks-pep chicks-pep-4 absolute w-[15%] h-[15%] rounded-full bg-[#e11d48]" style={{ top: '28%', left: '55%' }} />
            <span className="chicks-pie-topping chicks-pep chicks-pep-5 absolute w-[14%] h-[14%] rounded-full bg-[#be123c]" style={{ top: '58%', left: '52%' }} />

            {/* Green pepper ribbons */}
            <span className="chicks-pie-topping chicks-veg absolute w-[22%] h-[7%] rounded-full bg-[#16a34a] rotate-45" style={{ top: '42%', left: '20%' }} />
            <span className="chicks-pie-topping chicks-veg absolute w-[18%] h-[6%] rounded-full bg-[#22c55e] -rotate-30" style={{ top: '48%', left: '55%' }} />

            {/* Olive */}
            <span className="chicks-pie-topping chicks-olive absolute w-[10%] h-[10%] rounded-full bg-[#1c1917] ring-1 ring-[#a3a3a3]/40" style={{ top: '35%', left: '42%' }} />
            <span className="chicks-pie-topping chicks-olive absolute w-[9%] h-[9%] rounded-full bg-[#171717]" style={{ top: '62%', left: '40%' }} />

            {/* Bake shine when fully assembled */}
            <span className="chicks-pie-shine absolute inset-0 rounded-full bg-[linear-gradient(130deg,rgba(255,255,255,0.28)_0%,transparent_38%,transparent_100%)] pointer-events-none" />

            {/* Square cut guide (Chick's way) — appears late */}
            <span className="chicks-pie-cut absolute inset-[18%] border border-white/20 pointer-events-none" style={{ clipPath: 'inset(0)' }} />
            <span className="chicks-pie-cut absolute left-1/2 top-[18%] bottom-[18%] w-px bg-white/25 -translate-x-1/2" />
            <span className="chicks-pie-cut absolute top-1/2 left-[18%] right-[18%] h-px bg-white/25 -translate-y-1/2" />
          </span>
        </span>

        {/* Fixed center play / pause hub */}
        <span
          className={`absolute inset-[34%] rounded-full z-10 flex items-center justify-center shadow-lg transition-colors ring-2 ${
            playing
              ? 'bg-yellow-400 text-red-900 ring-yellow-200/80 group-hover:bg-yellow-300'
              : 'bg-red-600 text-white ring-yellow-300/90 group-hover:bg-red-500'
          }`}
        >
          {playing ? (
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" strokeWidth={2} />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" fill="currentColor" strokeWidth={2} />
          )}
        </span>
      </span>

      <span className="hidden sm:flex flex-col items-start leading-tight pr-1">
        <span className="text-[10px] font-black uppercase tracking-wider opacity-90">
          {playing ? 'Pie spinning' : 'Jukebox'}
        </span>
        <span className="text-[11px] font-semibold max-w-[7.5rem] truncate opacity-95">
          {trackTitle}
        </span>
      </span>
    </button>
  );
}
