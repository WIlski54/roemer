// Shared page-building helpers.
import { panel, poly, blob, spline, limb } from '../art/dsl.js';
import { PAGE_W as W, PAGE_D as D } from '../engine/scene.js';
import { mulberry32, lerp, TAU } from '../engine/util.js';
import { textCard, printLabel, wavyLine } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';

export { W, D };

// part spec for a wavy-topped paper strip (units: world, ws=1). fill: colour | {top,bottom}
export function panelPart(x0, x1, h, { y0 = 0, fill = '#d9a35a', wave = 0.25, freq = 5, phase = 0, seed = 1, scallop = false, step = 0.12, deco, stroke } = {}) {
  return { layers: [{ shapes: [panel(x0, x1, y0, h, { wave, freq, phase, seed, scallop, step })], fill, deco, stroke }] };
}

// scribbled ground marks (cracks, dry lines) like in the printed reference
export function cracks(m, { x0, x1, z0, z1, n = 60, seed = 5, color = 'rgba(120,70,30,.45)', len = 0.35 }) {
  const { ctx } = m; const r = mulberry32(seed);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 0.02 * m.S); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); let a = r() * TAU;
    ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z));
    const segs = 2 + Math.floor(r() * 3); let px = x, pz = z;
    for (let s = 0; s < segs; s++) { a += (r() - 0.5) * 1.6; const l = len * (0.4 + r() * 0.8); px += Math.cos(a) * l; pz += Math.sin(a) * l * 0.6; ctx.lineTo(m.x(px), m.z(pz)); }
    ctx.stroke();
  }
}

// the left page of every era spread carries the printed text card
export function leftCard(def, i, extra = {}) {
  const d = PAGES_DE[i];
  return (ctx, m) => textCard(m, { x: -11.35, z: 0.62, w: 5.9, h: 3.2, kicker: d.kicker || d.era, title: d.title, body: d.card, size: 0.275, titleSize: 0.4, sub: d.years, ...extra });
}

// ---- deco helpers for scenery strips (use inside layer.deco(c, bb))
import { mulberry32 as _mb } from '../engine/util.js';
export function strata(c, bb, colors, { n = 7, wave = 0.08, seed = 3, alpha = 0.5 } = {}) {
  const { ctx, tf } = c; const r = _mb(seed);
  for (let i = 0; i < n; i++) {
    const y = bb.y0 + (bb.h * (i + 0.5)) / n; const th = (bb.h / n) * (0.4 + r() * 0.5);
    ctx.fillStyle = colors[i % colors.length]; ctx.globalAlpha = alpha;
    ctx.beginPath();
    const steps = 40;
    for (let s = 0; s <= steps; s++) { const x = bb.x0 + (bb.w * s) / steps; const yy = y + Math.sin(s * 0.5 + i * 2.1 + seed) * wave; const [X, Y] = tf(x, yy + th / 2); if (s) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
    for (let s = steps; s >= 0; s--) { const x = bb.x0 + (bb.w * s) / steps; const yy = y + Math.sin(s * 0.5 + i * 2.1 + seed) * wave; const [X, Y] = tf(x, yy - th / 2); ctx.lineTo(X, Y); }
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
export function dither(c, bb, color, { n = 200, seed = 4, size = 0.05, alpha = 0.3 } = {}) {
  const { ctx, tf } = c; const r = _mb(seed); ctx.fillStyle = color; ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) { const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h; const [X, Y] = tf(x, y); ctx.beginPath(); ctx.arc(X, Y, Math.max(0.8, size * c.S * (0.4 + r())), 0, 6.283); ctx.fill(); }
  ctx.globalAlpha = 1;
}
export function softLight(c, bb, { color = 'rgba(255,230,170,.35)', cx = 0.7, cy = 0.8, r = 0.8 } = {}) {
  const { ctx, tf } = c; const [X, Y] = tf(bb.x0 + bb.w * cx, bb.y0 + bb.h * cy);
  const g = ctx.createRadialGradient(X, Y, 0, X, Y, bb.w * r * c.S); g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)'));
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
}
