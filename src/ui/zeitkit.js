// Werkzeug für die Zeitfenster-Szenen: Papierschnitt-Look auf einer 2D-Leinwand (480 x 300),
// Hilfsformen (Wolken, Bäume, Feuer, Wasser, Fahnen, Säulen, Schafe, Noten …) und die gezeichnete Römer-Figur roman().
import { mulberry32, lerp, clamp, smooth, TAU } from '../engine/util.js';

export const SW = 480, SH = 300;
export { lerp, clamp, smooth, TAU };
const sin = Math.sin, cos = Math.cos, PI = Math.PI, abs = Math.abs, max = Math.max, min = Math.min;
export const rng = (seed) => mulberry32(seed);
export const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
export const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
export const mixh = (a, b, k) => { const m = mixc(hex(a), hex(b), k); return '#' + m.map((v) => Math.round(v).toString(16).padStart(2, '0')).join(''); };

// Papierform: weicher Schlagschatten, heller Schnittrand
export function paper(g, fill, path, o = {}) {
  g.save();
  if (o.shadow !== false) { g.shadowColor = o.shCol || 'rgba(30,12,4,.38)'; g.shadowOffsetX = o.sx ?? 1.5; g.shadowOffsetY = o.sy ?? 2.5; g.shadowBlur = (o.blur ?? 0) >= 4 ? o.blur : 0; }
  g.fillStyle = fill; g.beginPath(); path(g); g.fill();
  g.shadowColor = 'transparent';
  if (o.edge !== false) { g.lineWidth = o.lw ?? 1.1; g.strokeStyle = o.edgeCol || 'rgba(255,245,220,.7)'; g.stroke(); }
  g.restore();
}
export function vgrad(g, stops, y0 = 0, y1 = SH) {
  const gr = g.createLinearGradient(0, y0, 0, y1); for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, y0, SW, y1 - y0);
}
export function circle(g, x, y, r) { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }
export function glow(g, x, y, r, col, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r);
}
// Hügel-/Wellenband von links nach rechts, unten geschlossen
export function ridge(g, base, amp, freq, ph, fill, o = {}) {
  paper(g, fill, (c) => {
    c.moveTo(-10, SH + 10);
    for (let x = -10; x <= SW + 10; x += 8) c.lineTo(x, base + sin(x * freq + ph) * amp + sin(x * freq * 2.3 + ph * 1.7) * amp * 0.4);
    c.lineTo(SW + 10, SH + 10); c.closePath();
  }, o);
}
export function ellipse(g, x, y, rx, ry, rot = 0) { g.moveTo(x + rx * cos(rot), y + rx * sin(rot)); g.ellipse(x, y, rx, ry, rot, 0, TAU); }
export const poly = (c, pts) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
export const rrect = (c, x, y, w, h, r) => { r = min(r, w / 2, h / 2); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); };
// Gliedmaße als dicke Linie mit hellem Rand
export function limb(g, pts, w, col, edge = true) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  const trace = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); };
  if (edge) { trace(); g.lineWidth = w + 2; g.strokeStyle = 'rgba(255,245,220,.55)'; g.stroke(); }
  trace(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); g.restore();
}
export function stars(g, list, t, a = 1) {
  for (let i = 0; i < list.length; i++) { const s = list[i]; g.fillStyle = `rgba(255,248,230,${(0.35 + 0.5 * (0.5 + 0.5 * sin(t * s[3] + s[4]))) * a})`; g.fillRect(s[0], s[1], s[2], s[2]); }
}
export function makeStars(n, seed, ymax = SH) { const r = rng(seed), out = []; for (let i = 0; i < n; i++) out.push([r() * SW, r() * ymax, r() < 0.15 ? 2 : 1, 0.8 + r() * 2, r() * 6]); return out; }

// ---------------------------------------------------------------- Himmel, Wasser, Wetter
export function cloud(g, x, y, s, col = '#ffffff', a = 0.9) {
  g.save(); g.globalAlpha = a; g.fillStyle = col; g.beginPath();
  circle(g, x, y, 9 * s); circle(g, x + 12 * s, y - 6 * s, 12 * s); circle(g, x + 27 * s, y - 3 * s, 10 * s); circle(g, x + 38 * s, y + 1 * s, 7 * s);
  ellipse(g, x + 19 * s, y + 4 * s, 30 * s, 6 * s); g.fill(); g.restore();
}
export function sun(g, x, y, r, t, core = '#fff4cc', gl = '255,230,160', ga = 0.6, rays = 0) {
  glow(g, x, y, r * 6.5, gl, ga);
  if (rays) { g.save(); g.translate(x, y); g.rotate(t * 0.05); g.fillStyle = `rgba(${gl},.22)`; for (let i = 0; i < rays; i++) { g.rotate(TAU / rays); g.beginPath(); g.moveTo(r * 1.3, -r * 0.18); g.lineTo(r * 3.1, 0); g.lineTo(r * 1.3, r * 0.18); g.closePath(); g.fill(); } g.restore(); }
  g.fillStyle = core; g.beginPath(); g.arc(x, y, r + sin(t * 0.8) * 0.4, 0, TAU); g.fill();
}
export function bird(g, x, y, s, t, ph = 0, col = 'rgba(40,28,24,.8)') {
  const f = sin(t * 7 + ph) * 0.6; g.strokeStyle = col; g.lineWidth = 1.3 * s; g.lineCap = 'round'; g.beginPath();
  g.moveTo(x - 6 * s, y - 3 * s * f); g.quadraticCurveTo(x - 3 * s, y - 4 * s - 2 * s * f, x, y); g.quadraticCurveTo(x + 3 * s, y - 4 * s - 2 * s * f, x + 6 * s, y - 3 * s * f); g.stroke();
}
// Gleitende Möwe (ruhiger Flügelschlag)
export function gull(g, x, y, s, t, ph = 0, col = '#f4f0e6') {
  const f = sin(t * 2.2 + ph); g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = col; g.lineWidth = 2; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath();
  g.moveTo(-9, 2 - 2 * f); g.quadraticCurveTo(-4, -3 - 3 * f, 0, 0); g.quadraticCurveTo(4, -3 - 3 * f, 9, 2 - 2 * f); g.stroke();
  g.fillStyle = col; g.beginPath(); g.ellipse(0, 1, 2.6, 1.6, 0, 0, TAU); g.fill(); g.restore();
}
export function water(g, y0, y1, t, top, bot, o = {}) {
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, top); gr.addColorStop(1, bot);
  const am = o.amp ?? 1.5, sp = o.speed ?? 1.2; g.fillStyle = gr; g.beginPath(); g.moveTo(-5, y1);
  for (let x = -5; x <= SW + 5; x += 6) g.lineTo(x, y0 + sin(x * 0.05 + t * sp) * am + sin(x * 0.13 - t * 1.7) * am * 0.5);
  g.lineTo(SW + 5, y1); g.closePath(); g.fill();
  const n = o.glit ?? 16, r = rng(o.seed ?? 7); g.fillStyle = o.glitCol || '#ffffff';
  for (let i = 0; i < n; i++) {
    const bx = r() * SW, by = y0 + 5 + r() * max(2, y1 - y0 - 8), w = 6 + r() * 16, sp2 = 1 + r() * 1.5, pp = r() * 6;
    g.globalAlpha = (0.25 + 0.75 * max(0, sin(t * sp2 + pp))) * (o.glitA ?? 0.45); g.fillRect(bx - w / 2 + sin(t * 0.6 + i) * 3, by, w, 1.2);
  }
  g.globalAlpha = 1;
}
export function smoke(g, x, y, t, o = {}) {
  const n = o.n ?? 7, rise = o.rise ?? 70, dr = o.drift ?? 18, r0 = o.r0 ?? 3, r1 = o.r1 ?? 11, sp = o.speed ?? 0.25, col = o.col || '150,140,135', a = o.a ?? 0.5, sd = o.seed ?? 0;
  for (let i = 0; i < n; i++) {
    const p = (t * sp + i / n + sd * 0.137) % 1, e = min(1, p * 7);
    g.fillStyle = `rgba(${col},${a * (1 - p) * e})`; g.beginPath(); g.arc(x + dr * p + sin(p * 6 + i + sd) * 3, y - rise * p, lerp(r0, r1, p), 0, TAU); g.fill();
  }
}
// Lagerfeuer: Flammen, Glut, Funken und warmer Schein
export function fire(g, x, y, s, t, calm = false, o = {}) {
  const q = calm ? 0.5 : 1, fl = 0.9 + 0.1 * sin(t * 7.3) * sin(t * 3.1) * q + 0.04 * sin(t * 13) * q;
  if (o.glow !== false) { glow(g, x, y - 12 * s, 120 * s * fl, '255,150,50', 0.5); glow(g, x, y - 8 * s, 52 * s * fl, '255,210,110', 0.65); }
  g.fillStyle = '#3a2214'; g.beginPath(); g.ellipse(x, y + 1, 18 * s, 4 * s, 0, 0, TAU); g.fill();
  g.strokeStyle = '#6a4224'; g.lineWidth = 3.4 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 14 * s, y); g.lineTo(x + 12 * s, y - 5 * s); g.moveTo(x + 14 * s, y); g.lineTo(x - 12 * s, y - 5 * s); g.stroke();
  for (let k = 0; k < 3; k++) {
    const w = (15 - k * 4.4) * s * fl, h = (36 - k * 9.5) * s * (0.92 + 0.18 * sin(t * (7 + k * 2.4) + k * 1.7) * q);
    g.fillStyle = ['#e8501c', '#ff9a2c', '#ffe27a'][k]; g.beginPath(); g.moveTo(x - w, y - 1.5 * s);
    g.quadraticCurveTo(x - w * 0.5 + sin(t * 6 + k) * 2 * s * q, y - h * 0.55, x + sin(t * 5 + k * 2) * 3 * s * q, y - h);
    g.quadraticCurveTo(x + w * 0.5 + sin(t * 6 + k + 1) * 2 * s * q, y - h * 0.55, x + w, y - 1.5 * s); g.closePath(); g.fill();
  }
  const ns = calm ? 5 : 9;
  for (let i = 0; i < ns; i++) { const p = (t * 0.4 + i / ns) % 1; g.fillStyle = `rgba(255,${190 + i * 6},90,${1 - p})`; g.fillRect(x + sin(p * 6 + i * 2.1) * 13 * p + (i - ns / 2) * 1.2, y - 24 * s - p * 70 * s, 1.7, 1.7); }
}
// Fahne an einer Stange; wellt im Wind
export function flag(g, x, y, h, w, t, col, trim = null, o = {}) {
  const ph = o.ph || 0, fh = o.fh ?? h * 0.38, dir = o.dir || 1, am = (o.amp ?? 3.2) * (o.calm ? 0.5 : 1);
  g.strokeStyle = o.pole || '#6a4a2a'; g.lineWidth = 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - h); g.stroke();
  const top = y - h + 2, N = 8, pts = [];
  for (let i = 0; i <= N; i++) { const f = i / N; pts.push([x + dir * f * w, top + sin(t * 3.2 + i * 0.85 + ph) * am * f]); }
  g.fillStyle = col; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i <= N; i++) g.lineTo(pts[i][0], pts[i][1]);
  if (o.swallow) { const e = pts[N]; g.lineTo(e[0] - dir * w * 0.22, e[1] + fh / 2); g.lineTo(e[0], e[1] + fh); } else g.lineTo(pts[N][0], pts[N][1] + fh);
  for (let i = N - (o.swallow ? 1 : 0); i >= 0; i--) g.lineTo(pts[i][0], pts[i][1] + fh);
  g.closePath(); g.fill();
  if (trim) { g.fillStyle = trim; g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i <= N; i++) g.lineTo(pts[i][0], pts[i][1]); for (let i = N; i >= 0; i--) g.lineTo(pts[i][0], pts[i][1] + 2.4); g.closePath(); g.fill(); }
  g.fillStyle = '#e8c46a'; g.beginPath(); g.arc(x, y - h, 2, 0, TAU); g.fill();
}
// Wimpelkette zwischen zwei Punkten
export function bunting(g, x0, y0, x1, y1, n, t, cols, sag = 8, ph = 0) {
  g.strokeStyle = 'rgba(70,40,20,.7)'; g.lineWidth = 0.9; g.beginPath();
  for (let i = 0; i <= 20; i++) { const f = i / 20, px = lerp(x0, x1, f), py = lerp(y0, y1, f) + sin(f * PI) * sag; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
  for (let i = 0; i < n; i++) {
    const f = (i + 0.5) / n, px = lerp(x0, x1, f), py = lerp(y0, y1, f) + sin(f * PI) * sag, w = 4.4, sw = sin(t * 2.6 + i * 1.3 + ph) * 1.4;
    g.fillStyle = cols[i % cols.length]; g.beginPath(); g.moveTo(px - w, py); g.lineTo(px + w, py); g.lineTo(px + sw, py + 9); g.closePath(); g.fill();
  }
}
export function note(g, x, y, s, a, col = '#fff3d0') {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1.3; g.lineCap = 'round';
  g.beginPath(); g.ellipse(0, 0, 3.4, 2.4, -0.4, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(3, -0.7); g.lineTo(3, -11); g.quadraticCurveTo(6.5, -9.5, 6, -5.5); g.stroke(); g.restore();
}

// ---------------------------------------------------------------- Pflanzen, Tiere
export function cypress(g, x, y, h, col = '#3f5a38', t = 0, ph = 0) {
  const sw = sin(t * 0.9 + ph) * 1.2, w = h * 0.2;
  paper(g, col, (c) => { c.moveTo(x - w * 0.5, y); c.quadraticCurveTo(x - w * 1.3, y - h * 0.5, x + sw * 0.6, y - h); c.quadraticCurveTo(x + w * 1.3, y - h * 0.5, x + w * 0.5, y); c.closePath(); });
  g.strokeStyle = 'rgba(255,255,255,.1)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x - w * 0.2, y - 2); g.quadraticCurveTo(x - w * 0.5, y - h * 0.5, x + sw * 0.5, y - h * 0.9); g.stroke();
}
export function pine(g, x, y, h, col = '#3f6a42', t = 0, ph = 0) {
  const sw = sin(t * 0.9 + ph) * 1.0;
  g.fillStyle = '#5a3a20'; g.fillRect(x - 1.5, y - h * 0.22, 3, h * 0.22);
  for (let i = 0; i < 4; i++) { const f = i / 4, yy = y - h * (0.16 + f * 0.62), ww = h * (0.34 - f * 0.07), hh = h * 0.34; paper(g, col, (c) => { c.moveTo(x - ww, yy); c.lineTo(x + sw * f, yy - hh); c.lineTo(x + ww, yy); c.closePath(); }); }
}
export function bushes(g, x, y, r, col = '#5d7a3c') { paper(g, col, (c) => { c.ellipse(x, y - r * 0.5, r, r * 0.62, 0, PI, 0); c.closePath(); }, { sy: 1.5 }); }
export function olive(g, x, y, s, t, ph = 0) {
  g.strokeStyle = '#4a3624'; g.lineWidth = 3.6 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x - 6 * s, y - 14 * s, x + 2 * s, y - 24 * s); g.stroke();
  g.lineWidth = 2 * s; g.beginPath(); g.moveTo(x - 2 * s, y - 14 * s); g.lineTo(x - 12 * s, y - 24 * s); g.moveTo(x + 1 * s, y - 20 * s); g.lineTo(x + 12 * s, y - 28 * s); g.stroke();
  const sw = sin(t + ph) * 1.2 * s;
  for (const [cx, cy, rx] of [[-9, -29, 13], [5, -33, 15], [14, -26, 10], [-1, -24, 11]]) paper(g, '#7f9a62', (c) => { c.ellipse(x + cx * s + sw, y + cy * s, rx * s, rx * 0.55 * s, 0, 0, TAU); }, { sy: 1.5, blur: 1.5 });
}
export function palm(g, x, y, h, t, ph = 0, col = '#4a8a4a') {
  const sw = sin(t * 0.8 + ph) * 2;
  g.strokeStyle = '#7a5a36'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - h * 0.5, x + sw * 0.3, y - h); g.stroke();
  for (let i = 0; i < 7; i++) {
    const a = -PI * 0.96 + i * PI * 0.16, L = h * 0.38 + (i % 2) * 4, ex = x + sw * 0.3 + cos(a) * L, ey = y - h + sin(a) * L * 0.55 + L * 0.5 + sin(t * 1.3 + i + ph) * 1.5;
    g.strokeStyle = col; g.lineWidth = 2.4; g.beginPath(); g.moveTo(x + sw * 0.3, y - h); g.quadraticCurveTo(x + sw * 0.3 + cos(a) * L * 0.6, y - h + sin(a) * L * 0.6 - 3, ex, ey); g.stroke();
  }
}
export function reeds(g, x, y, n, h, t, col = '#6a8a4a') {
  g.strokeStyle = col; g.lineWidth = 1.5; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const hh = h * (0.7 + 0.3 * sin(i * 2.3)), sw = sin(t * 1.4 + i * 0.9 + x * 0.05) * 2.4; g.beginPath(); g.moveTo(x + i * 3.5, y); g.quadraticCurveTo(x + i * 3.5 + sw * 0.4, y - hh * 0.6, x + i * 3.5 + sw, y - hh); g.stroke(); if (i % 3 === 0) { g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(x + i * 3.5 + sw, y - hh, 1.3, 3.4, 0, 0, TAU); g.fill(); } }
}
export function grassTufts(g, y0, y1, n, seed, t, col = '#8a9a3a', hh = 10) {
  const r = rng(seed); g.strokeStyle = col; g.lineWidth = 1.5; g.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = r() * SW, y = y0 + r() * (y1 - y0), h = hh * (0.6 + r() * 0.6); g.beginPath(); g.moveTo(x, y); g.lineTo(x + sin(t * 1.5 + i) * 2.4, y - h); g.moveTo(x + 2, y); g.lineTo(x + 3 + sin(t * 1.5 + i + 1) * 2.4, y - h * 0.8); g.stroke(); }
}
export function sheep(g, x, y, s, dir, t, ph = 0, pose = 'stand') {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  const graze = pose === 'graze' ? 0.5 + 0.5 * sin(t * 1.6 + ph) : 0, lie = pose === 'lie';
  const by = lie ? -6 : -12;
  if (!lie) { g.strokeStyle = '#4d3b30'; g.lineWidth = 2; g.lineCap = 'round'; for (const lx of [-7, -3, 4, 8]) { g.beginPath(); g.moveTo(lx, by + 4); g.lineTo(lx + (lx < 0 ? 0 : 0.5), 0); g.stroke(); } }
  else { g.fillStyle = '#4d3b30'; g.fillRect(4, -2, 8, 2.4); }
  paper(g, '#f1ead6', (c) => { for (const [cx, cy, r] of [[-8, by - 1, 6], [-3, by - 5, 7], [3, by - 5, 7], [9, by - 1, 6], [0, by + 1, 8.5], [-6, by + 3, 5.5], [6, by + 3, 5.5]]) circle(c, cx, cy, r); }, { blur: 1.5, sy: 2 });
  const hx = 12 + graze * 1, hy = by - 4 + graze * 9;
  g.fillStyle = '#4d3b30'; g.beginPath(); g.ellipse(hx, hy, 4.4, 3.6, 0.4 + graze * 0.6, 0, TAU); g.fill();
  g.beginPath(); g.ellipse(hx - 3.6, hy - 2.2, 3, 1.5, 0.8 + sin(t * 3 + ph) * 0.15, 0, TAU); g.fill();
  g.fillStyle = '#f1ead6'; g.beginPath(); g.arc(hx - 1.5, hy - 3.6, 2.6, 0, TAU); g.fill();
  g.fillStyle = '#f6efd8'; g.beginPath(); g.arc(hx + 1.6, hy - 0.8, 0.8, 0, TAU); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- Bauformen
// Marmorsäule (Fuß bei x, yb), Höhe h, Breite w
export function column(g, x, yb, h, w, col = '#f1ebdc', shade = '#cdbfa0') {
  const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); gr.addColorStop(0, shade); gr.addColorStop(0.35, col); gr.addColorStop(0.7, col); gr.addColorStop(1, shade);
  const cap = w * 0.5, base = w * 0.34;
  paper(g, gr, (c) => { c.moveTo(x - w * 0.48, yb - base); c.lineTo(x - w * 0.4, yb - h + cap); c.lineTo(x + w * 0.4, yb - h + cap); c.lineTo(x + w * 0.48, yb - base); c.closePath(); }, { sx: 1.2, sy: 1.5, blur: 1.5 });
  g.strokeStyle = 'rgba(120,100,70,.28)'; g.lineWidth = 0.8; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * w * 0.2, yb - base); g.lineTo(x + i * w * 0.17, yb - h + cap); g.stroke(); }
  paper(g, col, (c) => { c.rect(x - w * 0.62, yb - base, w * 1.24, base); }, { sx: 1, sy: 1, blur: 1 });
  paper(g, col, (c) => { c.rect(x - w * 0.62, yb - h, w * 1.24, cap * 0.55); c.rect(x - w * 0.52, yb - h + cap * 0.55, w * 1.04, cap * 0.45); }, { sx: 1, sy: 1, blur: 1 });
}
// Steinmauerwerk in einem Rechteck (Reihen von Quadern)
export function masonry(g, x, y, w, h, rowH, col, line = 'rgba(60,45,30,.35)', seed = 3) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = col; g.fillRect(x, y, w, h);
  const r = rng(seed); g.strokeStyle = line; g.lineWidth = 0.9; g.beginPath();
  for (let yy = y, k = 0; yy < y + h; yy += rowH, k++) { g.moveTo(x, yy); g.lineTo(x + w, yy); let xx = x + (k % 2 ? rowH * 0.9 : 0); while (xx < x + w) { g.moveTo(xx, yy); g.lineTo(xx, yy + rowH); xx += rowH * (1.6 + r() * 1.1); } }
  g.stroke(); g.restore();
}
// Dachziegel-Reihen (Dreieck oder Rechteck, Linien)
export function tiles(g, x0, y0, x1, y1, n, col = 'rgba(80,30,10,.35)') { g.strokeStyle = col; g.lineWidth = 0.9; g.beginPath(); for (let i = 1; i < n; i++) { const f = i / n; g.moveTo(x0, lerp(y0, y1, f)); g.lineTo(x1, lerp(y0, y1, f)); } g.stroke(); }

// ---------------------------------------------------------------- Römer-Figur
// roman(g, x, y, s, dir, pose, ph, o): Fußpunkt (x,y), Höhe ca. 60 * s * o.h, dir = +1 blickt nach rechts.
// pose: 'stand' | 'walk' (ph = Schrittphase) | 'raise' (o.up 0..1, Hand hoch/winken) | 'point' | 'hold' | 'offer' | 'carry' | 'work' (ph = Schlag)
//       | 'pull' | 'flute' | 'sit' (Hocker) | 'ground' (am Boden) | 'cheer' | 'clap' | 'bow'
// o.kind wählt eine Vorlage (siehe KINDS); alle Felder darunter sind einzeln überschreibbar:
//   skin hair hs ('short'|'bun'|'long'|'curly'|'bald'|'cap')  tunic trim len ('short'|'knee'|'ankle')  belt  toga border  armor ('mail'|'lorica'|'cuirass')
//   helmet ('galea'|'crest'|'bronze')  crest  hat ('laurel'|'petasos'|'pilleus'|'hood'|'diadem')  cloak  bracae  shoes ('sandal'|'caliga'|'shoe'|'bare')
//   shield ('scutum'|'oval'|'round')  item ('pilum'|'staff'|'crook'|'scroll'|'basket'|'amphora'|'hammer'|'stone'|'signum'|'aquila'|'tablet'|'fruit')
//   beard bulla sword fur female wind h (Größenfaktor) head (Kopffaktor) shadow (false) arms {far:[dx,dy],near:[dx,dy]} (eigene Handziele)
export const SKIN = { fair: '#f0c9a4', warm: '#e2b088', tan: '#cf9a70', brown: '#a8714c', dark: '#7a4c32' };
const BASE = { skin: SKIN.warm, hair: '#4a2f1d', hs: 'short', tunic: '#d9c08a', trim: '#b8935a', len: 'knee', belt: '#6b4a2a', shoes: 'sandal', h: 1, head: 1 };
export const KINDS = {
  buerger: {},
  buergerin: { skin: SKIN.fair, hair: '#3a2417', hs: 'bun', tunic: '#c0794f', trim: '#e8c46a', len: 'ankle', belt: '#e8c46a', shoes: 'shoe', h: 0.93, female: true },
  kind: { h: 0.66, head: 1.28, tunic: '#e3cf9a', trim: '#b8453a', belt: '#8a6a3a', bulla: true, hair: '#5a3a22' },
  hirte: { skin: SKIN.tan, hair: '#3a2a1c', hs: 'curly', tunic: '#a8824c', trim: '#7a5a30', len: 'short', belt: '#5a3a1f', shoes: 'bare', fur: '#e4d8b8' },
  senator: { skin: SKIN.fair, hair: '#b9b2a6', hs: 'bald', tunic: '#f4efe4', toga: '#f4efe4', border: '#7b2d5b', len: 'ankle', shoes: 'shoe', trim: '#7b2d5b' },
  toga: { tunic: '#f2ead8', toga: '#f2ead8', border: null, len: 'ankle', shoes: 'shoe', trim: '#cbbf9c' },
  kaiser: { skin: SKIN.fair, hair: '#b88a3e', hs: 'curly', tunic: '#f4efe4', toga: '#f4efe4', border: '#7b2d5b', len: 'ankle', shoes: 'shoe', trim: '#7b2d5b' },
  soldat: { tunic: '#e2d4ae', trim: '#b8935a', len: 'knee', armor: 'mail', helmet: 'galea', shoes: 'caliga', shield: 'scutum', item: 'pilum', sword: true, belt: '#4a3020', hair: '#3a2417' },
  legionaer: { tunic: '#e2d4ae', trim: '#b8935a', len: 'knee', armor: 'lorica', helmet: 'galea', shoes: 'caliga', shield: 'scutum', item: 'pilum', sword: true, belt: '#4a3020', hair: '#3a2417' },
  feldherr: { skin: SKIN.fair, hair: '#6a4a30', tunic: '#f2ead8', trim: '#b8935a', len: 'knee', armor: 'cuirass', helmet: null, shoes: 'caliga', sword: true, belt: '#b8935a', cloak: '#a8262a' },
  haendler: { skin: SKIN.tan, hair: '#6b3d1f', hs: 'cap', tunic: '#6f9a7b', trim: '#3d6b52', belt: '#5a3a1f', beard: true },
  handwerker: { skin: SKIN.tan, hair: '#3a2a1c', tunic: '#c9b080', trim: '#9a7a48', len: 'short', belt: '#6b4a2a' },
  germane: { skin: SKIN.fair, hair: '#c88a3e', hs: 'long', tunic: '#6f7f4a', trim: '#4a5a30', len: 'short', bracae: '#7a6a52', shoes: 'bare', beard: true, cloak: '#8a5a3a', belt: '#6b4a2a' },
  punier: { skin: SKIN.brown, hair: '#2a1a12', hs: 'curly', tunic: '#e9dcc0', trim: '#2b6a8a', len: 'ankle', belt: '#c99a2e', shoes: 'sandal', cloak: '#2b6a8a', hat: 'pilleus' },
  punsoldat: { skin: SKIN.brown, hair: '#2a1a12', hs: 'curly', tunic: '#d9c9a0', trim: '#2b6a8a', len: 'knee', belt: '#5a3a20', shoes: 'sandal', cloak: '#7a3a22', helmet: 'bronze', shield: 'round', item: 'pilum', sword: true },
};
const TH = 13.5, SHN = 13.5, UA = 10.5, FA = 9.5;
const pt = (o, a, l) => [o[0] + sin(a) * l, o[1] + cos(a) * l];
// Zwei-Knochen-IK: Ellbogen, so dass |S-E|=UA, |E-T|=FA; side wählt die Lösung
function arm2(S, T, side) {
  let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy); const m = UA + FA - 0.06;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; } else if (d < 4) { const k = 4 / max(d, 0.01); dx *= k; dy *= k; d = 4; }
  const a = (UA * UA - FA * FA + d * d) / (2 * d), h = Math.sqrt(max(0, UA * UA - a * a)), ux = dx / d, uy = dy / d, mx = S[0] + ux * a, my = S[1] + uy * a;
  const e1 = [mx - uy * h, my + ux * h], e2 = [mx + uy * h, my - ux * h];
  const pick = side === 'back' ? (e1[0] < e2[0] ? e1 : e2) : side === 'fwd' ? (e1[0] > e2[0] ? e1 : e2) : side === 'up' ? (e1[1] < e2[1] ? e1 : e2) : (e1[1] > e2[1] ? e1 : e2);
  return [pick, [S[0] + dx, S[1] + dy]];
}
function poseOf(pose, ph, k) {
  const P = { lean: 0, tilt: 0, bob: 0, legs: [[0.03, 0], [-0.03, 0]], arms: [{ t: [-0.8, 19.4], side: 'back' }, { t: [0.8, 19.4], side: 'back' }], sit: 0, floor: false, itemAng: 0 };
  const br = sin(ph) * 0.35;
  switch (pose) {
    case 'walk': {
      P.lean = 1.3; for (let i = 0; i < 2; i++) { const p = ph + i * PI; P.legs[i] = [sin(p) * 0.52, max(0, cos(p)) * 0.8]; const q = p + PI; P.arms[i] = { t: [sin(q) * 8.5, 17 - max(0, sin(q)) * 3.5], side: 'back' }; }
      break;
    }
    case 'raise': { const up = k.up ?? 1, w = sin(ph * 2.4) * 1.6 * up; P.arms[1] = { t: [lerp(1, 4 + w, up), lerp(18.5, -19.5, up)], side: up > 0.5 ? 'down' : 'back' }; P.arms[0].t[1] += br; break; }
    case 'cheer': { const w = sin(ph * 3) * 1.5; P.arms[0] = { t: [-3 + w, -18], side: 'down' }; P.arms[1] = { t: [5 - w, -18], side: 'down' }; P.legs = [[0.07, 0], [-0.07, 0]]; P.bob = 0; break; }
    case 'clap': { const c = 0.5 + 0.5 * sin(ph * 4); P.arms[0] = { t: [lerp(6, 12, c), lerp(-1, 1, c)], side: 'down' }; P.arms[1] = { t: [lerp(7, 13, c), lerp(-2, 0, c)], side: 'down' }; break; }
    case 'point': P.arms[1] = { t: [19, -3 + br], side: 'down' }; P.lean = 0.8; break;
    case 'hold': P.arms[1] = { t: [12, 4], side: 'down' }; P.arms[0] = { t: [4, 13], side: 'down' }; break;
    case 'offer': P.arms[1] = { t: [14, -2 + br], side: 'down' }; P.arms[0] = { t: [12, -1 + br], side: 'down' }; P.lean = 1; break;
    case 'carry': P.arms[0] = { t: [9, 7], side: 'down' }; P.arms[1] = { t: [11, 8], side: 'down' }; P.lean = -0.6; break;
    case 'work': { const s = sin(ph); P.arms[1] = { t: [8 + 8 * s, -4 - 9 * cos(ph)], side: 'down' }; P.arms[0] = { t: [4, 9], side: 'down' }; P.lean = 1.6 + s; P.itemAng = -0.8 + cos(ph) * 1.3; P.legs = [[0.25, 0.3], [-0.2, 0.2]]; break; }
    case 'pull': { const s = sin(ph); P.arms[0] = { t: [14 + 3 * s, 1 - 2 * s], side: 'down' }; P.arms[1] = { t: [15 - 3 * s, 2 + 2 * s], side: 'down' }; P.lean = -1.8 - s; P.legs = [[0.5, 0.2], [-0.4, 0.1]]; break; }
    case 'flute': { P.arms[0] = { t: [10.5, -7.5], side: 'down' }; P.arms[1] = { t: [12.5, -9.5], side: 'down' }; P.tilt = 0.4; break; }
    case 'sit': { P.sit = 14; P.legs = [[1.45, 1.45], [1.55, 1.55]]; P.arms[1] = { t: [8, 9], side: 'down' }; P.arms[0] = { t: [4, 11], side: 'back' }; P.lean = 0.3; break; }
    case 'ground': { P.floor = true; P.sit = 4; P.legs = [[1.4, 0.15], [2.1, 1.5]]; P.arms[1] = { t: [11, 3], side: 'down' }; P.arms[0] = { t: [2, 15], side: 'back' }; P.lean = 0.2; break; }
    case 'bow': P.lean = 4; P.tilt = 2; P.arms[1] = { t: [8, 12], side: 'down' }; break;
    default: P.legs = [[-0.07, 0], [0.08, 0]]; P.arms[0].t[0] += br; P.arms[1].t[0] -= br * 0.6; break;
  }
  if (k.arms) { if (k.arms.far) P.arms[0] = { t: k.arms.far, side: k.arms.farSide || 'down' }; if (k.arms.near) P.arms[1] = { t: k.arms.near, side: k.arms.nearSide || 'down' }; }
  return P;
}

export function roman(g, x, y, s, dir, pose = 'stand', ph = 0, o = {}) {
  const k = Object.assign({}, BASE, KINDS[o.kind] || {}, o);
  const P = poseOf(pose, ph, k), sc = s * k.h;
  const hip = [0, P.sit ? -P.sit : -27 + P.bob];
  const legs = P.legs.map((l) => { const kn = pt(hip, l[0], TH), ft = pt(kn, l[0] - l[1], SHN); return [hip, kn, ft]; });
  let low = max(legs[0][2][1], legs[1][2][1]); if (P.floor) low = max(low, hip[1] + 3);
  const dy = -low;
  g.save(); g.translate(x, y); g.scale(dir * sc, sc); g.translate(0, dy);
  if (k.shadow !== false) { g.fillStyle = 'rgba(30,14,6,.26)'; g.beginPath(); g.ellipse(2, -dy + 0.4, 10, 2.1, 0, 0, TAU); g.fill(); }
  const sx = hip[0] + 0.8 + P.lean, sy = hip[1] - 19, hr = 6.9 * k.head, hd = [sx + 1.1 + P.tilt, sy - 1.8 - hr];
  const S0 = [sx - 0.7, sy + 0.5], S1 = [sx + 0.8, sy + 0.2];
  const ankle = k.len === 'ankle' || k.toga, bracae = k.bracae;
  const legCol = bracae || k.skin, sleeve = k.armor === 'mail' ? '#b5bbbd' : (k.toga ? k.toga : (k.sleeves === false ? null : k.tunic));
  const hemY = hip[1] + (ankle ? 22 : (k.len === 'short' ? 9 : 14));
  const sway = (legs[1][2][0] - legs[0][2][0]) * 0.12;
  // ---- Teile
  const drawLeg = (L, far) => {
    limb(g, [L[0], L[1], L[2]], 5.1, far ? mixh(legCol, '#2a1408', 0.2) : legCol); const f = L[2];
    const sh = k.shoes === 'caliga' ? '#5a3a22' : k.shoes === 'shoe' ? '#6b4a2a' : k.shoes === 'sandal' ? '#8a5a30' : k.skin;
    g.fillStyle = sh; g.beginPath(); g.moveTo(f[0] - 2, f[1] - 3.2); g.lineTo(f[0] + 3.2, f[1] - 2.4); g.quadraticCurveTo(f[0] + 6.6, f[1] - 1.8, f[0] + 6, f[1] + 0.3); g.lineTo(f[0] - 2.4, f[1] + 0.3); g.closePath(); g.fill();
    if (k.shoes === 'caliga') { g.strokeStyle = 'rgba(255,230,190,.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(f[0] - 1.4, f[1] - 2.2); g.lineTo(f[0] + 2.8, f[1] - 1.6); g.stroke(); limb(g, [[f[0], f[1] - 3.4], [f[0] + 0.4, f[1] - 8.6]], 4.6, '#5a3a22', false); }
  };
  const bx = (f) => hip[0] + (sx - hip[0]) * f; // x entlang der Wirbelsäule (0 = Hüfte, 1 = Schulter)
  const drawBody = () => {
    const wW = k.female ? 4.6 : 5.3, hw = (k.toga ? 9.4 : (ankle ? 8 : 7.2)) + (k.female ? 0.6 : 0);
    const frontTop = [sx + 4.6, sy + 1.2];
    // Umhang hinten
    if (k.cloak && !k.cloakFront) {
      const w = (k.wind ?? 0.5) + 0.35 * sin(ph * 1.3 + 1), cl = k.cloakLen ?? 30;
      g.fillStyle = k.cloak; g.beginPath(); g.moveTo(sx - 1, sy + 1); g.quadraticCurveTo(sx - 5 - w * 4, sy + 9, hip[0] - 7 - w * 8, sy + 8 + cl * 0.9 + sin(ph * 2) * 1.2); g.lineTo(hip[0] - 3 - w * 3, sy + cl * 0.85 + 3); g.lineTo(sx + 2, sy + 12); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,245,220,.35)'; g.lineWidth = 0.9; g.stroke();
    }
    // Rumpf / Gewand
    paper(g, k.toga || k.tunic, (c) => {
      c.moveTo(sx - 4.8, sy + 1.4); c.quadraticCurveTo(hip[0] - wW - 0.8, hip[1] - 9, hip[0] - wW - (ankle ? 0.5 : 0.2), hip[1] - 2);
      c.lineTo(hip[0] - hw - sway, hemY); c.lineTo(hip[0] + hw + sway * 0.6, hemY); c.lineTo(hip[0] + wW + (ankle ? 0.5 : 0.2), hip[1] - 2);
      c.quadraticCurveTo(hip[0] + wW + 1, hip[1] - 9, frontTop[0], frontTop[1]); c.lineTo(sx + 1.8, sy - 1.6); c.lineTo(sx - 2.6, sy - 1.6); c.closePath();
    }, { sx: 1, sy: 1.8, blur: 1.6 });
    if (k.toga) { // Falten und Saum
      g.save(); g.strokeStyle = 'rgba(120,100,70,.4)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(sx - 3.5, sy + 2); g.quadraticCurveTo(bx(0.5) + 3.5, hip[1] - 9, hip[0] + 8, hip[1] + 6); g.stroke();
      g.beginPath(); g.moveTo(hip[0] - 6, hemY - 12); g.quadraticCurveTo(hip[0] - 1, hemY - 8, hip[0] + 2, hemY - 14); g.stroke();
      if (k.border) { g.strokeStyle = k.border; g.lineWidth = 2.1; g.beginPath(); g.moveTo(sx - 3.5, sy + 2); g.quadraticCurveTo(bx(0.5) + 3.5, hip[1] - 9, hip[0] + 8, hip[1] + 6); g.stroke(); g.lineWidth = 1.7; g.beginPath(); g.moveTo(hip[0] + 8, hip[1] + 6); g.lineTo(hip[0] + hw + sway * 0.6 - 0.5, hemY - 0.8); g.stroke(); }
      g.fillStyle = k.trim || '#cbbf9c'; g.globalAlpha = 0.55; g.fillRect(hip[0] - hw - sway, hemY - 1.6, 2 * hw + sway * 1.6, 1.6); g.restore();
    } else {
      g.fillStyle = k.trim; g.fillRect(hip[0] - hw - sway + 0.4, hemY - 2.2, 2 * hw + sway * 1.6 - 0.8, 2.2);
      if (k.stripe) { g.fillStyle = k.stripe; g.fillRect(bx(0.55) + 0.6, sy + 2, 1.7, hemY - sy - 3); }
      if (k.belt && !k.armor) { g.fillStyle = k.belt; g.beginPath(); g.moveTo(bx(0.12) - wW - 0.3, hip[1] - 4.6); g.lineTo(bx(0.12) + wW + 0.3, hip[1] - 4.6); g.lineTo(bx(0.12) + wW + 0.3, hip[1] - 1.8); g.lineTo(bx(0.12) - wW - 0.3, hip[1] - 1.8); g.closePath(); g.fill(); if (k.female) { g.fillStyle = '#fff3c0'; g.fillRect(bx(0.12) + wW - 1, hip[1] - 4.4, 1.6, 2.4); } }
    }
    // Rüstung
    if (k.armor) {
      g.save(); g.beginPath(); g.moveTo(sx - 4.8, sy + 1.4); g.quadraticCurveTo(hip[0] - wW - 0.8, hip[1] - 9, hip[0] - wW, hip[1] - 2); g.lineTo(hip[0] + wW, hip[1] - 2); g.quadraticCurveTo(hip[0] + wW + 1, hip[1] - 9, frontTop[0], frontTop[1]); g.closePath(); g.clip();
      if (k.armor === 'lorica') {
        for (let i = 0; i < 6; i++) { const yy = sy + 1.6 + i * 2.7; g.fillStyle = i % 2 ? '#aab0b4' : '#c4c9cc'; g.fillRect(sx - 8, yy, 16, 2.7); g.fillStyle = 'rgba(60,70,80,.45)'; g.fillRect(sx - 8, yy + 2.1, 16, 0.7); }
        g.fillStyle = '#c4c9cc'; g.strokeStyle = '#7e868c'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(sx - 0.2, sy + 2.4, 5.8, 3, 0, PI, 0); g.fill(); g.stroke();
      } else if (k.armor === 'mail') {
        g.fillStyle = '#b5bbbd'; g.fillRect(sx - 8, sy + 1, 16, hip[1] - sy + 1);
        g.strokeStyle = 'rgba(70,80,90,.4)'; g.lineWidth = 0.8; g.beginPath(); for (let yy = sy + 3; yy < hip[1]; yy += 2.6) { g.moveTo(sx - 8, yy); g.lineTo(sx + 8, yy); } g.stroke();
      } else { // Muskelpanzer
        g.fillStyle = '#c99a2e'; g.fillRect(sx - 8, sy + 1, 16, hip[1] - sy + 1); g.strokeStyle = 'rgba(120,80,10,.5)'; g.lineWidth = 0.8; g.beginPath(); g.arc(sx + 1, sy + 7, 3.2, 0, PI); g.moveTo(sx - 4, sy + 11.5); g.lineTo(sx + 5, sy + 11.5); g.stroke();
      }
      g.fillStyle = k.belt || '#4a3020'; g.fillRect(hip[0] - 8, hip[1] - 4.4, 16, 2.6);
      g.restore();
      if (k.armor !== 'cuirass' || true) { g.fillStyle = '#8a5a30'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(hip[0] + i * 2.1 - 1, hip[1] - 2); g.lineTo(hip[0] + i * 2.1 + 1, hip[1] - 2); g.lineTo(hip[0] + i * 2.1 + 0.8 + sway * 0.3, hip[1] + 4.6); g.lineTo(hip[0] + i * 2.1 - 0.8 + sway * 0.3, hip[1] + 4.6); g.closePath(); g.fill(); } }
    }
    if (k.fur) { paper(g, k.fur, (c) => { c.moveTo(sx - 6, sy + 1); c.lineTo(sx + 5.4, sy + 0.4); c.lineTo(sx + 4.6, sy + 11); c.lineTo(sx + 1, sy + 8.4); c.lineTo(sx - 1, sy + 12.4); c.lineTo(sx - 5, sy + 9); c.closePath(); }, { blur: 1.2, sy: 1.2 }); }
    if (k.bulla) { g.fillStyle = '#e8c46a'; g.beginPath(); g.arc(sx + 4.4, sy + 4, 1.5, 0, TAU); g.fill(); }
    if (k.sword) { g.strokeStyle = '#8a5a30'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(hip[0] - 3, hip[1] - 2); g.lineTo(hip[0] + 4 + sway, hip[1] + 7); g.stroke(); }
  };
  const drawArm = (i, front) => {
    const S = i ? S1 : S0, a = P.arms[i], [E, T] = arm2(S, [S[0] + a.t[0], S[1] + a.t[1]], a.side);
    const far = i === 0, sh = (c) => (far ? mixh(c, '#2a1408', 0.18) : c);
    if (sleeve) limb(g, [S, E], 5.6, sh(sleeve)); else limb(g, [S, E], 4.4, sh(k.skin));
    limb(g, [E, T], 4.1, sh(k.skin)); g.fillStyle = sh(k.skin); g.beginPath(); g.arc(T[0], T[1], 2.3, 0, TAU); g.fill();
    return T;
  };
  const drawHead = () => {
    const [hx, hy] = hd, hs = k.hs;
    // Haare hinten
    g.fillStyle = k.hair;
    if (hs === 'long') { g.beginPath(); g.moveTo(hx - 3, hy - hr * 0.8); g.quadraticCurveTo(hx - hr - 4, hy + 2, hx - hr - 2.5 - sin(ph * 1.4) * 0.8, hy + hr * 1.7); g.lineTo(hx - 1.4, hy + hr * 1.2); g.lineTo(hx + 1, hy - hr * 0.4); g.closePath(); g.fill(); }
    if (hs === 'bun') { g.beginPath(); g.arc(hx - hr * 0.9, hy - 1.4, 3.4, 0, TAU); g.fill(); }
    if (k.hood) { g.fillStyle = k.hood; g.beginPath(); g.arc(hx - 1.2, hy, hr + 1.8, PI * 0.5, PI * 1.9); g.lineTo(hx + 1, hy - hr - 5); g.closePath(); g.fill(); }
    // Gesicht
    g.fillStyle = k.skin; g.strokeStyle = 'rgba(255,245,220,.55)'; g.lineWidth = 1.1; g.beginPath(); g.arc(hx, hy, hr, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(hx + hr * 0.96, hy + hr * 0.12, 1.5 * k.head, 0, TAU); g.fill();
    g.fillStyle = 'rgba(214,110,96,.38)'; g.beginPath(); g.arc(hx + hr * 0.38, hy + hr * 0.4, 1.6 * k.head, 0, TAU); g.fill();
    g.fillStyle = '#1e120a'; g.beginPath(); g.arc(hx + hr * 0.46, hy - hr * 0.14, 0.95 * Math.sqrt(k.head), 0, TAU); g.fill();
    g.strokeStyle = 'rgba(70,30,20,.7)'; g.lineWidth = 0.7; g.beginPath(); g.arc(hx + hr * 0.5, hy + hr * 0.32, hr * 0.26, 0.2, 1.7); g.stroke();
    if (k.beard) { g.fillStyle = k.hair; g.beginPath(); g.moveTo(hx + hr * 0.7, hy + hr * 0.25); g.quadraticCurveTo(hx + hr * 0.6, hy + hr * 1.35, hx - hr * 0.3, hy + hr * 1.1); g.quadraticCurveTo(hx - hr * 0.2, hy + hr * 0.5, hx + hr * 0.2, hy + hr * 0.3); g.closePath(); g.fill(); }
    // Haare vorn
    if (!k.helmet && !k.hood) {
      g.fillStyle = k.hair;
      if (hs === 'short' || hs === 'bun' || hs === 'long' || hs === 'cap') { g.beginPath(); g.arc(hx - 1.4, hy - 1.8, hr + 0.3, PI * 0.93, PI * 2.04); g.fill(); }
      else if (hs === 'curly') { for (let i = 0; i < 7; i++) { const a = PI * 0.95 + i * 0.28; g.beginPath(); g.arc(hx - 0.8 + cos(a) * (hr - 0.4), hy - 1.2 + sin(a) * (hr - 0.4), 2.5, 0, TAU); g.fill(); } }
      else if (hs === 'bald') { g.beginPath(); g.arc(hx - 1.2, hy - 0.4, hr + 0.2, PI * 0.74, PI * 1.12); g.fill(); }
    }
    if (k.helmet) {
      const bronze = k.helmet === 'bronze', col = bronze ? '#b9803a' : '#b8bdc0', rim = bronze ? '#7a4e1c' : '#7e868c';
      if (k.helmet === 'crest') { const cc = k.crest || '#b3352a'; g.fillStyle = cc; g.beginPath(); g.moveTo(hx - 6.2, hy - hr * 0.95); g.quadraticCurveTo(hx - 3, hy - hr - 8.4, hx + 0.4, hy - hr - 8); g.quadraticCurveTo(hx + 4.4, hy - hr - 8.4, hx + 6.4, hy - hr * 0.95); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,245,220,.5)'; g.lineWidth = 0.8; g.stroke(); }
      g.fillStyle = col; g.strokeStyle = rim; g.lineWidth = 0.9; g.beginPath(); g.arc(hx - 0.6, hy - 0.6, hr + 0.9, PI * 1.02, PI * 2.0); g.lineTo(hx + hr + 0.3, hy - 0.2); g.lineTo(hx - hr - 0.3, hy - 0.2); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = col; g.beginPath(); g.moveTo(hx - hr - 0.5, hy - 1); g.lineTo(hx - hr - 2.2, hy + 4.6); g.lineTo(hx - hr * 0.2, hy + 3.4); g.lineTo(hx - hr * 0.5, hy - 0.6); g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.ellipse(hx - 0.4, hy + 1.8, 1.8, 3.2, 0.1, 0, TAU); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.arc(hx - 1, hy - hr * 0.55, 1.5, 0, TAU); g.fill();
      if (k.helmet === 'galea' && k.plume) { g.fillStyle = k.plume; g.beginPath(); g.ellipse(hx - 1, hy - hr - 2, 1.6, 3.5, 0, 0, TAU); g.fill(); }
    }
    if (k.hat === 'laurel') { for (let i = 0; i < 11; i++) { const a = PI * 0.84 + i * (PI * 1.28 / 10); const lx = hx - 0.6 + cos(a) * (hr + 0.4), ly = hy - 1 + sin(a) * (hr + 0.4); g.fillStyle = i % 2 ? '#7aa04a' : '#c9a63a'; g.beginPath(); g.ellipse(lx, ly, 2.6, 1.2, a + PI / 2 + 0.5, 0, TAU); g.fill(); } }
    if (k.hat === 'diadem') { g.strokeStyle = '#e8c46a'; g.lineWidth = 1.7; g.beginPath(); g.arc(hx - 0.6, hy - 1.4, hr + 0.4, PI * 1.02, PI * 1.98); g.stroke(); g.fillStyle = '#fff6dc'; for (let i = 0; i < 5; i++) { const a = PI * 1.12 + i * 0.4; g.beginPath(); g.arc(hx - 0.6 + cos(a) * (hr + 0.4), hy - 1.4 + sin(a) * (hr + 0.4), 0.9, 0, TAU); g.fill(); } }
    if (k.hat === 'petasos') { g.fillStyle = '#c9ad6a'; g.strokeStyle = 'rgba(120,90,40,.6)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(hx, hy - hr * 0.75, hr + 5, 2.2, -0.05, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.ellipse(hx - 0.4, hy - hr * 0.85, hr * 0.7, hr * 0.5, 0, PI, 0); g.fill(); g.stroke(); }
    if (k.hat === 'pilleus') { g.fillStyle = k.cloak || '#7a3a22'; g.strokeStyle = 'rgba(255,245,220,.4)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(hx - hr - 0.3, hy - 1); g.quadraticCurveTo(hx - 1, hy - hr - 5.5, hx + hr * 0.9, hy - hr * 0.5); g.lineTo(hx + hr * 0.85, hy - 1.6); g.closePath(); g.fill(); g.stroke(); }
  };
  const drawShield = () => {
    const kind = k.shield; if (!kind) return;
    g.save(); g.translate(sx + 4.4, sy + 10);
    if (kind === 'scutum') { paper(g, k.shieldCol || '#a8262a', (c) => rrect(c, -4.8, -12, 9.6, 24, 3.4), { blur: 1.5, sy: 1.6 }); g.strokeStyle = '#e8c46a'; g.lineWidth = 1.1; g.beginPath(); rrect(g, -3.6, -10.8, 7.2, 21.6, 2.6); g.stroke(); g.fillStyle = '#e8c46a'; g.beginPath(); g.arc(0, 0, 2.2, 0, TAU); g.fill(); g.fillStyle = '#7a1c1c'; g.fillRect(-0.4, -9, 0.8, 18); }
    else if (kind === 'round') { paper(g, k.shieldCol || '#8a5a2a', (c) => circle(c, 0, 0, 9.4), { blur: 1.5, sy: 1.6 }); g.strokeStyle = '#e8c46a'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, 7.4, 0, TAU); g.stroke(); g.fillStyle = '#e8c46a'; g.beginPath(); g.arc(0, 0, 2.3, 0, TAU); g.fill(); }
    else { paper(g, k.shieldCol || '#7a5a36', (c) => ellipse(c, 0, 0, 6.4, 11, 0), { blur: 1.5, sy: 1.6 }); g.strokeStyle = '#d6c08a'; g.lineWidth = 1; g.beginPath(); g.ellipse(0, 0, 4.6, 8.8, 0, 0, TAU); g.stroke(); g.fillStyle = '#c9ad6a'; g.beginPath(); g.arc(0, 0, 1.9, 0, TAU); g.fill(); }
    g.restore();
  };
  const drawItem = (H) => {
    const it = k.item; if (!it) return; g.save(); g.translate(H[0], H[1]);
    const gy = -(dy + H[1]) + dy; // Bodenhöhe relativ zur Hand (Figur-Koordinaten: Boden = -dy)
    const ground = -dy - H[1];
    g.lineCap = 'round';
    if (it === 'pilum' || it === 'spear') { g.strokeStyle = '#7a5530'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(-1.5, 12); g.lineTo(2.6, -44); g.stroke(); g.strokeStyle = '#9aa0a4'; g.lineWidth = 1; g.beginPath(); g.moveTo(2.4, -34); g.lineTo(2.9, -52); g.stroke(); g.fillStyle = '#9aa0a4'; g.beginPath(); g.moveTo(2.9, -52); g.lineTo(1.6, -47); g.lineTo(4.2, -47); g.closePath(); g.fill(); }
    else if (it === 'staff' || it === 'crook') { const top = it === 'crook' ? -40 : -34; g.strokeStyle = '#7a5530'; g.lineWidth = 2; g.beginPath(); g.moveTo(1.2, ground); g.lineTo(0.6, top); g.stroke(); if (it === 'crook') { g.beginPath(); g.arc(3.2, top - 1.5, 3.4, PI * 1.1, PI * 2.55); g.stroke(); } }
    else if (it === 'scroll') { g.rotate(-0.35 + (k.scrollAng || 0)); if (k.scrollS) g.scale(k.scrollS, k.scrollS); g.fillStyle = '#f4ecd2'; g.strokeStyle = 'rgba(120,90,50,.7)'; g.lineWidth = 0.8; g.beginPath(); rrect(g, -1.8, -9, 3.6, 12, 1.2); g.fill(); g.stroke(); g.fillStyle = '#c99a2e'; g.fillRect(-2.1, -9.6, 4.2, 1.5); g.fillRect(-2.1, 2.2, 4.2, 1.5); if (k.seal) { g.fillStyle = '#a8262a'; g.beginPath(); g.arc(0, -3, 1.4, 0, TAU); g.fill(); } }
    else if (it === 'basket') { g.fillStyle = '#b8863e'; g.strokeStyle = '#7a5a26'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-6, -1); g.lineTo(6, -1); g.lineTo(4.4, 7); g.lineTo(-4.4, 7); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-4.6, 2.4); g.lineTo(4.8, 2.4); g.stroke(); for (let i = 0; i < 4; i++) { g.fillStyle = ['#c8402a', '#e8a838', '#c8402a', '#7aa04a'][i]; g.beginPath(); g.arc(-4 + i * 2.8, -2, 2.4, 0, TAU); g.fill(); } }
    else if (it === 'amphora') { g.fillStyle = '#c0703a'; g.strokeStyle = 'rgba(70,30,10,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-1.4, -9); g.lineTo(1.4, -9); g.quadraticCurveTo(1.8, -5, 4.6, 0); g.quadraticCurveTo(5.6, 6, 0, 10); g.quadraticCurveTo(-5.6, 6, -4.6, 0); g.quadraticCurveTo(-1.8, -5, -1.4, -9); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-1.4, -8); g.quadraticCurveTo(-5, -9, -3.8, -3); g.moveTo(1.4, -8); g.quadraticCurveTo(5, -9, 3.8, -3); g.stroke(); }
    else if (it === 'hammer') { g.rotate(P.itemAng); g.strokeStyle = '#7a5530'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 4); g.lineTo(0, -10); g.stroke(); g.fillStyle = '#7e868c'; g.fillRect(-3.4, -13, 6.8, 4.4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-3.4, -13, 6.8, 1.2); }
    else if (it === 'stone') { g.fillStyle = k.stoneCol || '#b9ae94'; g.strokeStyle = 'rgba(70,55,35,.55)'; g.lineWidth = 0.9; g.beginPath(); g.rect(-5.5, -5, 11, 8); g.fill(); g.stroke(); g.strokeStyle = 'rgba(70,55,35,.3)'; g.beginPath(); g.moveTo(-5.5, -1); g.lineTo(5.5, -1); g.stroke(); }
    else if (it === 'tablet') { g.rotate(-0.2); g.fillStyle = '#9a6a38'; g.strokeStyle = '#5a3a1a'; g.lineWidth = 0.8; g.beginPath(); rrect(g, -4, -6, 8, 11, 1); g.fill(); g.stroke(); g.fillStyle = '#e8d6a2'; g.fillRect(-2.8, -4.8, 5.6, 8.6); }
    else if (it === 'fruit') { for (let i = 0; i < 3; i++) { g.fillStyle = ['#c8402a', '#e8a838', '#7aa04a'][i]; g.beginPath(); g.arc(-3 + i * 3.2, -1 - (i % 2) * 2, 2.5, 0, TAU); g.fill(); } }
    else if (it === 'signum' || it === 'aquila') {
      g.strokeStyle = '#7a5530'; g.lineWidth = 2; g.beginPath(); g.moveTo(1, ground); g.lineTo(1, -42); g.stroke();
      if (it === 'signum') { for (let i = 0; i < 3; i++) { g.fillStyle = ['#e8c46a', '#a8262a', '#e8c46a'][i]; g.strokeStyle = 'rgba(70,40,10,.5)'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(1, -14 - i * 8, 5, 2.6, 0, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#e8c46a'; g.beginPath(); g.moveTo(1, -48); g.lineTo(-3, -40); g.lineTo(5, -40); g.closePath(); g.fill(); }
      else { g.fillStyle = '#e8c46a'; g.strokeStyle = '#a07a1a'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(1, -52); g.quadraticCurveTo(-4, -50, -9, -45); g.quadraticCurveTo(-5, -47.5, -2, -43); g.quadraticCurveTo(1, -41, 4, -43); g.quadraticCurveTo(7, -47.5, 11, -45); g.quadraticCurveTo(6, -50, 1, -52); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.arc(2.6, -52.4, 1.6, 0, TAU); g.fill(); }
    }
    g.restore();
  };
  // ---- Zeichnen in sinnvoller Reihenfolge
  const longGarb = ankle;
  const aFar = P.arms[0], aNear = P.arms[1];
  drawArm(0, false);
  if (longGarb) { drawLeg(legs[0], true); drawLeg(legs[1], false); } else drawLeg(legs[0], true);
  drawBody();
  if (!longGarb) drawLeg(legs[1], false);
  drawShield();
  const T1 = drawArm(1, true);
  if (pose === 'flute') { g.strokeStyle = '#8a5a30'; g.lineWidth = 1.7; g.lineCap = 'round'; g.beginPath(); g.moveTo(hd[0] + hr * 0.9, hd[1] + hr * 0.4); g.lineTo(T1[0] + 4, T1[1] + 3); g.stroke(); g.fillStyle = '#3a2214'; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(lerp(hd[0] + hr * 0.9, T1[0] + 4, 0.35 + i * 0.22), lerp(hd[1] + hr * 0.4, T1[1] + 3, 0.35 + i * 0.22), 0.5, 0, TAU); g.fill(); } }
  drawHead();
  if (k.item && pose !== 'flute') drawItem(T1);
  g.restore();
}
