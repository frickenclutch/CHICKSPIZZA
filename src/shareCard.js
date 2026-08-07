import { CHICKS } from './pilgrimage.js';

/**
 * Draw a shareable "I attempted Chick's" card to a canvas, return blob + data URL.
 * kind: 'locked' | 'unplugged' | 'masterpiece'
 */
export async function buildShareCard({
  kind = 'locked',
  headline,
  subline,
  score,
  fromLabel,
}) {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  if (kind === 'unplugged') {
    grad.addColorStop(0, '#111827');
    grad.addColorStop(1, '#7f1d1d');
  } else if (kind === 'masterpiece') {
    grad.addColorStop(0, '#fff7ed');
    grad.addColorStop(1, '#fdba74');
  } else {
    grad.addColorStop(0, '#fef2f2');
    grad.addColorStop(1, '#fecaca');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Top bar
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, W, 28);

  // Pizza mark
  ctx.save();
  ctx.translate(140, 180);
  ctx.strokeStyle = kind === 'unplugged' ? '#fef08a' : '#1f2937';
  ctx.lineWidth = 10;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-50, -40);
  ctx.lineTo(50, -30);
  ctx.lineTo(0, 70);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = '#b91c1c';
  for (const [x, y, r] of [[-10, 0, 12], [15, 15, 10], [-5, 30, 9]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const titleColor = kind === 'unplugged' ? '#fca5a5' : '#b91c1c';
  const bodyColor = kind === 'unplugged' ? '#f3f4f6' : '#1f2937';
  const muteColor = kind === 'unplugged' ? '#d1d5db' : '#4b5563';

  ctx.fillStyle = titleColor;
  ctx.font = '900 72px Impact, Haettenschweiler, Arial Black, sans-serif';
  wrapText(ctx, headline || defaultHeadline(kind), 260, 160, 740, 78);

  ctx.fillStyle = bodyColor;
  ctx.font = '700 40px Segoe UI, system-ui, sans-serif';
  wrapText(ctx, subline || defaultSub(kind), 80, 380, 920, 52);

  if (typeof score === 'number') {
    ctx.fillStyle = kind === 'unplugged' ? '#fde047' : '#b45309';
    ctx.font = '900 96px Impact, Arial Black, sans-serif';
    ctx.fillText(`${score}`, 80, 620);
    ctx.font = '700 36px Segoe UI, system-ui, sans-serif';
    ctx.fillStyle = muteColor;
    ctx.fillText(score === 1 ? 'MASTERPIECE' : 'MASTERPIECES', 80 + String(score).length * 55 + 20, 610);
  }

  if (fromLabel) {
    ctx.fillStyle = muteColor;
    ctx.font = '600 32px Segoe UI, system-ui, sans-serif';
    ctx.fillText(`Pilgrim from ${fromLabel}`, 80, score != null ? 700 : 560);
  }

  // Rules strip
  ctx.fillStyle = kind === 'unplugged' ? '#1f2937' : '#fff';
  roundRect(ctx, 60, 780, 960, 320, 28);
  ctx.fill();
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 6;
  roundRect(ctx, 60, 780, 960, 320, 28);
  ctx.stroke();

  ctx.fillStyle = kind === 'unplugged' ? '#fecaca' : '#991b1b';
  ctx.font = '800 34px Segoe UI, system-ui, sans-serif';
  const lines = [
    'Pizza + wing sauce. NO WINGS.',
    'We deliver, but you gotta tip us well!',
    '4 days a week · 4 PM – 8 PM only',
    `${CHICKS.address}`,
    `${CHICKS.phone} · chickspizza.com`,
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, 100, 850 + i * 48);
  });

  ctx.fillStyle = muteColor;
  ctx.font = '600 28px Segoe UI, system-ui, sans-serif';
  ctx.fillText('Play the best pizza game ever — then settle the score in person.', 80, 1280);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  const dataUrl = canvas.toDataURL('image/png');
  return { blob, dataUrl, canvas };
}

function defaultHeadline(kind) {
  if (kind === 'unplugged') return "PHONE UNPLUGGED";
  if (kind === 'masterpiece') return 'WALLAH!';
  return 'LOCKED OUT!';
}

function defaultSub(kind) {
  if (kind === 'unplugged') return "Chick ran out of dough. I played the best pizza game ever.";
  if (kind === 'masterpiece') return 'I made a square-cut masterpiece at Chick\'s.';
  return "I attempted to enter Chick's. The legend is real.";
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(' ');
  let line = '';
  let cy = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + ' ';
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, cy);
      line = words[n] + ' ';
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function shareCardPayload({ kind, headline, subline, score, fromLabel }) {
  const { blob, dataUrl } = await buildShareCard({ kind, headline, subline, score, fromLabel });
  const file = new File([blob], `chicks-${kind}.png`, { type: 'image/png' });
  const text =
    kind === 'unplugged'
      ? `Phone unplugged at Chick's after ${score ?? 0} pie${score === 1 ? '' : 's'}. Best pizza game ever → ${CHICKS.site} — then come to Ogdensburg. Wing sauce, no wings. Tip well if we deliver!`
      : kind === 'masterpiece'
        ? `WALLAH! I played Chick's pizza game. Square-cut. Wing sauce. No wings. ${CHICKS.site}`
        : `LOCKED OUT of Chick's (for now). Legend status: confirmed. Play → ${CHICKS.site} · GPS: 1608 Ford St, Ogdensburg NY · ${CHICKS.phone}`;

  return { blob, dataUrl, file, text };
}

export async function tryNativeShare({ file, text, title = "Chick's Pizza" }) {
  if (navigator.share) {
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text, title });
        return 'shared';
      }
      await navigator.share({ text, title, url: CHICKS.site });
      return 'shared-text';
    } catch (e) {
      if (e?.name === 'AbortError') return 'aborted';
    }
  }
  return null;
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
