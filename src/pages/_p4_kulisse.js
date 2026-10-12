// Station 4 · gemalte Kulissen: Dämmerungshimmel (links), Morgenhimmel mit Sonne (rechts), Fernbänder mit Stadtsilhouette, Nahbänder (Mauer / Hecke)
// und Bodenmalerei (Pflaster, Lichtflecken). Alle deco-Funktionen haben die Form deco(c, bb) für panelPart-Layer (Maße in Welteinheiten).
import { dot, line } from '../art/paint.js';
import { mulberry32, TAU } from '../engine/util.js';
import { softLight, dither } from './common.js';

export const DUSK = [[0, '#383377'], [0.3, '#7a5a9f'], [0.62, '#d9788a'], [1, '#f8b874']];
export const DAWN = [[0, '#79b0dc'], [0.34, '#b4d4e8'], [0.7, '#fbe6b8'], [1, '#ffd58e']];

// ---------------------------------------------------------------- Himmel
export function duskSky(c, bb) {
  const r = mulberry32(11);
  softLight(c, bb, { color: 'rgba(255,160,100,.5)', cx: 0.82, cy: 0.12, r: 0.8 });
  for (let i = 0; i < 70; i++) { const y = bb.y0 + bb.h * (0.5 + r() * 0.5); dot(c, bb.x0 + r() * bb.w, y, 0.012 + r() * 0.016, '#fff6d8', 0.35 + r() * 0.6); }
  dot(c, bb.x0 + bb.w * 0.2, bb.y0 + bb.h * 0.8, 0.075, '#fffbe6', 1); dot(c, bb.x0 + bb.w * 0.2, bb.y0 + bb.h * 0.8, 0.2, '#fff6d8', 0.22);
  // schmale, rosa Abendwolken
  for (let i = 0; i < 5; i++) { const y = bb.y0 + bb.h * (0.42 + r() * 0.2), x = bb.x0 + bb.w * (0.1 + r() * 0.8), w = 1.2 + r() * 1.6; line(c, [[x - w, y], [x + w, y + 0.04]], 'rgba(255,190,170,.32)', 0.1 + r() * 0.06); }
  dither(c, bb, '#fff', { n: 30, alpha: 0.08, size: 0.04, seed: 5 });
}
export function dawnSky(sunX, sunY) {
  return (c, bb) => {
    const r = mulberry32(12);
    softLight(c, bb, { color: 'rgba(255,236,170,.65)', cx: (sunX - bb.x0) / bb.w, cy: (sunY - bb.y0) / bb.h, r: 0.55 });
    dot(c, sunX, sunY, 0.86, '#fff4c4', 1); dot(c, sunX, sunY, 0.62, '#fffbe0', 1);
    for (let i = 0; i < 6; i++) { const y = bb.y0 + bb.h * (0.45 + r() * 0.35), x = bb.x0 + bb.w * (0.08 + r() * 0.84), w = 0.9 + r() * 1.5; line(c, [[x - w, y], [x + w, y + 0.03]], 'rgba(255,250,235,.55)', 0.12 + r() * 0.08); }
    dither(c, bb, '#fff', { n: 30, alpha: 0.1, size: 0.04, seed: 6 });
  };
}

// ---------------------------------------------------------------- Fernband: Stadtsilhouette
function skyline(c, bb, { col, win, seed, base = 0.5, hmax = 1.0, roof }) {
  const { ctx, tf } = c; const r = mulberry32(seed); let x = bb.x0 + 0.2;
  ctx.save(); ctx.fillStyle = col;
  while (x < bb.x1 - 0.3) {
    const w = 0.3 + r() * 0.55, h = 0.35 + r() * hmax, y0 = bb.y0 + base, [X, Y] = tf(x, y0 + h), [X2, Y2] = tf(x + w, y0 - 0.4);
    ctx.fillStyle = col; ctx.fillRect(X, Y, X2 - X, Y2 - Y);
    const k = r();
    if (k < 0.3) { const [A, B] = tf(x - 0.04, y0 + h), [C, D] = tf(x + w / 2, y0 + h + 0.2), [E, F] = tf(x + w + 0.04, y0 + h); ctx.fillStyle = roof || col; ctx.beginPath(); ctx.moveTo(A, B); ctx.lineTo(C, D); ctx.lineTo(E, F); ctx.closePath(); ctx.fill(); }
    else if (k < 0.5) { const [A, B] = tf(x + w / 2, y0 + h); ctx.fillStyle = roof || col; ctx.beginPath(); ctx.arc(A, B, (w / 2) * c.S, Math.PI, 0); ctx.fill(); }
    if (win) for (let i = 0; i < 3; i++) if (r() < 0.55) dot(c, x + 0.08 + r() * (w - 0.16), y0 + 0.1 + r() * (h - 0.2), 0.025, win, 0.85);
    x += w + 0.04 + r() * 0.22;
  }
  ctx.restore();
}
function aqueduct(c, x0, x1, yb, h, col) {
  const { ctx, tf, S } = c; ctx.save(); ctx.fillStyle = col;
  const [a, b] = tf(x0, yb + h), [d, e] = tf(x1, yb + h - 0.22); ctx.fillRect(a, b, d - a, e - b);
  const n = Math.round((x1 - x0) / 0.55), w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { const [pa, pb] = tf(x0 + i * w + 0.07, yb), [pc, pd] = tf(x0 + (i + 1) * w - 0.07, yb + h - 0.22); ctx.fillRect(pa, pd, pc - pa, pb - pd); }
  ctx.restore();
}
export function farDusk(c, bb) {
  const { ctx } = c;
  skyline(c, bb, { col: '#5a4a80', win: '#ffd27a', seed: 21, base: 0.6, hmax: 0.9, roof: '#4a3c72' });
  aqueduct(c, bb.x0 + 6.5, bb.x0 + 10.3, bb.y0 + 0.5, 0.95, '#4a3c72');
  softLight(c, bb, { color: 'rgba(255,170,110,.28)', cx: 0.75, cy: 0.9, r: 0.7 });
  ctx.save(); ctx.restore();
}
export function farDawn(c, bb) {
  skyline(c, bb, { col: '#e8d2ae', win: null, seed: 23, base: 0.6, hmax: 0.85, roof: '#d98a5a' });
  const r = mulberry32(31); for (let i = 0; i < 26; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + 0.3 + r() * 0.5, 0.08 + r() * 0.09, i % 2 ? '#8db25a' : '#a4c46a', 0.9);
  softLight(c, bb, { color: 'rgba(255,240,180,.4)', cx: 0.3, cy: 0.85, r: 0.8 });
}

// ---------------------------------------------------------------- Nahband links: niedrige Forumsmauer mit Blendbögen; rechts: blühende Hecke
export function wallDusk(c, bb) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.strokeStyle = 'rgba(60,40,100,.35)'; ctx.lineWidth = Math.max(1, 0.014 * S);
  for (let y = bb.y0 + 0.25; y < bb.y1 - 0.1; y += 0.25) { const [a, b] = tf(bb.x0, y), [d, e] = tf(bb.x1, y); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(d, e); ctx.stroke(); }
  ctx.fillStyle = 'rgba(45,30,80,.55)';
  for (let x = bb.x0 + 0.5; x < bb.x1 - 0.5; x += 1.15) { const [a, b] = tf(x, bb.y0), [d, e] = tf(x + 0.55, bb.y0 + 0.4); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(a, e); ctx.arc((a + d) / 2, e, (d - a) / 2, Math.PI, 0); ctx.lineTo(d, b); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  softLight(c, bb, { color: 'rgba(255,170,110,.22)', cx: 0.5, cy: 0.5, r: 0.9 });
}
export function hedgeDawn(c, bb) {
  const r = mulberry32(41);
  for (let i = 0; i < 160; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h * 0.9, 0.04 + r() * 0.05, r() < 0.5 ? '#b4d27a' : '#5f8e3e', 0.55);
  for (let i = 0; i < 26; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + 0.12 + r() * bb.h * 0.6, 0.03 + r() * 0.015, i % 3 ? '#fff4d8' : '#f0b040', 1);
  softLight(c, bb, { color: 'rgba(255,240,170,.3)', cx: 0.25, cy: 0.9, r: 0.8 });
}

// ---------------------------------------------------------------- Boden (page-base draw)
export function paving(m, { x0, x1, z0, z1, tw = 0.95, th = 0.62, stroke = 'rgba(60,40,90,.3)', a = 'rgba(255,255,255,.05)', b = 'rgba(40,20,70,.07)', seed = 1 }) {
  const { ctx, S } = m; const r = mulberry32(seed); ctx.save(); ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, 0.014 * S);
  for (let z = z0, row = 0; z < z1; z += th, row++) for (let x = x0 + (row % 2) * (tw / 2) - tw; x < x1; x += tw) {
    const xx = Math.max(x, x0), ww = Math.min(x + tw, x1) - xx; if (ww <= 0) continue;
    ctx.fillStyle = r() > 0.5 ? a : b; ctx.fillRect(m.x(xx), m.z(z), ww * S, Math.min(th, z1 - z) * S); ctx.strokeRect(m.x(xx), m.z(z), ww * S, Math.min(th, z1 - z) * S);
  }
  ctx.restore();
}
export function pool(m, x, z, rad, color) {
  const { ctx, S } = m; const g = ctx.createRadialGradient(m.x(x), m.z(z), 0, m.x(x), m.z(z), rad * S);
  g.addColorStop(0, color); g.addColorStop(1, color.replace(/[\d.]+\)$/, '0)')); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), rad * S, rad * S * 0.62, 0, 0, TAU); ctx.fill();
}
