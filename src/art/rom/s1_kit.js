// Station 1: kleine Hilfen für die Figuren (Farben mischen, Zufall, Fell-/Strohstriche). Eigene Kopie, nichts Gemeinsames wird verändert.
import { mulberry32, TAU } from '../../engine/util.js';

export const hex2rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const rgb2hex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); };
export const shade = (c, f) => (f >= 0 ? mix(c, '#fff4d6', f) : mix(c, '#2a1a0e', -f));
export const rngOf = (seed = 1, salt = 0) => mulberry32((Math.imul((seed | 0) + 17, 2654435761) ^ Math.imul(salt + 1, 40503)) >>> 0);
export { TAU };

// Striche mit Richtung (Fell, Stroh, Gras): list = [[x, y, winkel, länge], …] in Modellmetern
export function strokes(c, list, color, w, alpha = 1) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * S); ctx.lineCap = 'round';
  for (const [x, y, a, L] of list) { const [X, Y] = tf(x, y), [X2, Y2] = tf(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X2, Y2); ctx.stroke(); }
  ctx.restore();
}
// zufällige Striche in einer Box
export function scatterStrokes(c, bb, n, color, { w = 0.012, len = 0.07, ang = 0.6, jit = 0.5, alpha = 0.5, seed = 3 } = {}) {
  const r = mulberry32(seed), list = [];
  for (let i = 0; i < n; i++) list.push([bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, ang + (r() - 0.5) * jit * 2, len * (0.6 + r() * 0.8)]);
  strokes(c, list, color, w, alpha);
}
// Polygon füllen (Modellmeter)
export function fillPoly(c, pts, color, alpha = 1) {
  const { ctx, tf } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
  pts.forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.restore();
}
// Kurve zeichnen
export function curve(c, pts, color, w, alpha = 1) {
  const { ctx, tf, S } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * S); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  pts.forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore();
}
// Spec skalieren/zentrieren wie finish() der Kulissen: setzt Boden auf y=0, Mitte auf x=0 (nur für Kulissen-Props)
export function bboxOfSpec(spec) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of Object.values(spec.parts)) for (const l of p.layers) for (const sh of l.shapes) for (const [x, y] of sh) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}
