/**
 * "When the Cord Gets Pulled" — Web Audio jukebox.
 * Starts silent. User must flip the jukebox ON.
 * Stops on tab hide / reduced-motion preference.
 */

const NOTES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
};

// Short diner earworm (quarter ≈ 220ms)
const MELODY = [
  ['G4', 2], ['A4', 1], ['B4', 1], ['C5', 2], ['G4', 2],
  ['E4', 2], ['G4', 2], ['A4', 2], ['G4', 4],
  ['E4', 2], ['F4', 1], ['G4', 1], ['A4', 2], ['F4', 2],
  ['D4', 2], ['E4', 2], ['C4', 4],
];

export function createJukebox() {
  let ctx = null;
  let master = null;
  let timer = null;
  let playing = false;
  let reducedMotion = false;

  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion = mq.matches;
    mq.addEventListener?.('change', (e) => {
      reducedMotion = e.matches;
      if (reducedMotion) stop();
    });
  }

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) throw new Error('Web Audio not supported');
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.12;
      master.connect(ctx.destination);
    }
    return ctx;
  }

  function playNote(freq, start, dur) {
    if (!ctx || !master) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    // Warm-ish square→triangle hybrid vibe via triangle
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const now = start;
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.55, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.95);
    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + dur);
  }

  function scheduleLoop() {
    if (!playing || !ctx) return;
    const beat = 0.22;
    let t = ctx.currentTime + 0.05;
    // Play one pass of the melody
    for (const [name, beats] of MELODY) {
      const dur = beats * beat;
      playNote(NOTES[name], t, dur * 0.9);
      t += dur;
    }
    // Soft bass thud / "phone cord" pluck at end
    playNote(NOTES.C4 / 2, t - beat * 0.5, beat * 1.5);

    const loopMs = (MELODY.reduce((s, [, b]) => s + b, 0) * beat + 0.35) * 1000;
    timer = window.setTimeout(scheduleLoop, loopMs);
  }

  async function start() {
    if (playing || reducedMotion) return false;
    ensureCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    playing = true;
    scheduleLoop();
    return true;
  }

  function stop() {
    playing = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (ctx && master) {
      // Soft-mute; keep context for next flip
      const now = ctx.currentTime;
      try {
        master.gain.cancelScheduledValues(now);
        master.gain.setValueAtTime(master.gain.value, now);
        master.gain.linearRampToValueAtTime(0.0001, now + 0.08);
        master.gain.setValueAtTime(0.12, now + 0.1);
      } catch {
        /* ignore */
      }
    }
  }

  async function toggle() {
    if (playing) {
      stop();
      return false;
    }
    return start();
  }

  function isPlaying() {
    return playing;
  }

  function dispose() {
    stop();
    if (ctx) {
      ctx.close().catch(() => {});
      ctx = null;
      master = null;
    }
  }

  return { start, stop, toggle, isPlaying, dispose, prefersQuiet: () => reducedMotion };
}
