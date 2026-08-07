import React, { useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { shareCardPayload, tryNativeShare, copyText, downloadBlob } from './shareCard.js';

/**
 * Share actions for locked-out / unplugged / masterpiece moments.
 */
export default function ShareActions({
  kind,
  headline,
  subline,
  score,
  fromLabel,
  dark = false,
}) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState('');

  const run = async (mode) => {
    setBusy(true);
    setStatus('');
    try {
      const payload = await shareCardPayload({ kind, headline, subline, score, fromLabel });
      if (mode === 'share') {
        const result = await tryNativeShare(payload);
        if (result === 'shared' || result === 'shared-text') {
          setStatus('Shared!');
        } else if (result === 'aborted') {
          setStatus('');
        } else {
          downloadBlob(payload.blob, `chicks-${kind}.png`);
          setStatus('Card downloaded — post it wherever.');
        }
      } else if (mode === 'download') {
        downloadBlob(payload.blob, `chicks-${kind}.png`);
        setStatus('Card saved.');
      } else if (mode === 'copy') {
        const ok = await copyText(payload.text);
        setCopied(ok);
        setStatus(ok ? 'Pitch copied.' : 'Could not copy — try download.');
        if (ok) setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      setStatus('Share fizzled. Try download.');
    } finally {
      setBusy(false);
    }
  };

  const btnBase = dark
    ? 'bg-white/10 hover:bg-white/20 text-white border border-white/30'
    : 'bg-red-700 hover:bg-red-600 text-white border border-red-900/20';

  return (
    <div className="w-full mt-6 space-y-3">
      <p className={`text-sm font-bold uppercase tracking-wide ${dark ? 'text-yellow-200' : 'text-red-800'}`}>
        Brag (or wall of shame)
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          disabled={busy}
          onClick={() => run('share')}
          className={`${btnBase} font-bold px-4 py-2.5 rounded-full text-sm flex items-center gap-2 min-h-[44px] disabled:opacity-50`}
        >
          <Share2 className="w-4 h-4" aria-hidden="true" />
          Share card
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run('download')}
          className={`${btnBase} font-bold px-4 py-2.5 rounded-full text-sm flex items-center gap-2 min-h-[44px] disabled:opacity-50`}
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Save PNG
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => run('copy')}
          className={`${btnBase} font-bold px-4 py-2.5 rounded-full text-sm flex items-center gap-2 min-h-[44px] disabled:opacity-50`}
        >
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
          Copy pitch
        </button>
      </div>
      {status && (
        <p className={`text-sm font-medium ${dark ? 'text-gray-300' : 'text-gray-700'}`} role="status">
          {status}
        </p>
      )}
    </div>
  );
}
