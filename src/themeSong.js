/**
 * Chick's jukebox — plays the real theme track (mute-first).
 * Track: Sauce on the Side (public/audio/sauce-on-the-side.mp3)
 * User must flip ON. Stops on tab hide / reduced-motion.
 */

export const THEME_TRACK = {
  src: '/audio/sauce-on-the-side.mp3',
  title: 'Sauce on the Side',
};

export function createJukebox() {
  let audio = null;
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

  function ensureAudio() {
    if (!audio) {
      audio = new Audio(THEME_TRACK.src);
      audio.loop = true;
      audio.preload = 'none'; // don't fetch until they plug in
      audio.volume = 0.55;
    }
    return audio;
  }

  async function start() {
    if (playing || reducedMotion) return false;
    const el = ensureAudio();
    try {
      await el.play();
      playing = true;
      return true;
    } catch (err) {
      playing = false;
      throw err;
    }
  }

  function stop() {
    playing = false;
    if (audio) {
      audio.pause();
      // rewind so next plug-in starts clean
      try {
        audio.currentTime = 0;
      } catch {
        /* ignore seek races */
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
    return playing && audio && !audio.paused;
  }

  function dispose() {
    stop();
    if (audio) {
      audio.src = '';
      audio = null;
    }
  }

  return {
    start,
    stop,
    toggle,
    isPlaying,
    dispose,
    prefersQuiet: () => reducedMotion,
    trackTitle: THEME_TRACK.title,
  };
}
