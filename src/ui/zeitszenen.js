// Zeitfenster-Szenen zum Zeitrad (753 v. Chr. bis 476 n. Chr.): 14 kleine Papierschnitt-Bilder aus Code.
// Jede Szene: start (Jahr, v. Chr. negativ), at (Sprungziel), era (wie in zeit.js), when, title, short, cap, fact und draw(g, t, o) auf 480 x 300.
// t = Sekunden (laufend, beliebiger Startpunkt: alle Bewegungen laufen in Schleifen), o.calm = Ruhiger Modus (langsamer, weniger Flimmern).
// Menschen kommen aus roman() (zeitkit.js). Tabus laut Brief: kein Blut, keine Kämpfe, kein Vesuvausbruch, keine Caesar-Ermordung, Germanen nie „Barbaren“.
import {
  SW, SH, TAU, lerp, clamp, smooth, rng, mixc, css, hex, mixh, paper, vgrad, circle, glow, ridge, ellipse, poly, rrect, limb, stars, makeStars,
  cloud, sun, bird, gull, water, smoke, fire, flag, bunting, note, cypress, pine, bushes, olive, palm, reeds, grassTufts, sheep, column, masonry, tiles, roman,
} from './zeitkit.js';

const sin = Math.sin, cos = Math.cos, PI = Math.PI, abs = Math.abs, max = Math.max, min = Math.min, floor = Math.floor;
const tm = (t, o) => (o && o.calm ? t * 0.45 : t);                      // Ruhiger Modus: alles langsamer
const sm = (a, b, x) => smooth(clamp((x - a) / (b - a)));                // weicher Übergang a..b
const wrap = (v, a, b) => a + ((((v - a) % (b - a)) + (b - a)) % (b - a)); // v in [a, b) zyklisch
const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];
// Flatterndes Band/Wellenkante für Markisen u. Ä.: y-Versatz an Position x
const flut = (x, t, a = 1, f = 0.07, sp = 2.4, ph = 0) => sin(x * f + t * sp + ph) * a;
// Zufällige Verteilung einmal berechnen (feste Seeds, damit nichts zappelt)
const RND = rng(7312);
// Statische Bildteile werden einmal je Bildschirmauflösung in eine zweite Leinwand gemalt und danach nur noch kopiert (spart Zeichenzeit).
// draw(c) malt in die zweite Leinwand und darf weder t noch o benutzen. Es bleiben höchstens 8 Ebenen im Speicher (die ältesten werden verworfen).
const KCACHE = new Map();
function ebene(g, name, draw) {
  const k = Math.round((g.getTransform ? g.getTransform().a : 1) * 100) / 100 || 1, key = name + '@' + k;
  let c = KCACHE.get(key);
  if (c === undefined) {
    c = null;
    try {
      const w = Math.ceil(SW * k), h = Math.ceil(SH * k);
      c = typeof document !== 'undefined' ? document.createElement('canvas') : (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : null);
      if (c) { c.width = w; c.height = h; const cg = c.getContext('2d'); cg.setTransform(k, 0, 0, k, 0, 0); draw(cg); }
    } catch (e) { c = null; }
    KCACHE.set(key, c);
    if (KCACHE.size > 8) { const first = KCACHE.keys().next().value, old = KCACHE.get(first); if (old) { old.width = 1; old.height = 1; } KCACHE.delete(first); }
  } else { KCACHE.delete(key); KCACHE.set(key, c); }
  if (c) g.drawImage(c, 0, 0, SW, SH); else draw(g);
}

// ---------------------------------------------------------------- 1 Hirtenfeuer am Tiber (753 v. Chr.)
const ST1 = makeStars(46, 5, 116);
const FF1 = Array.from({ length: 10 }, () => [40 + RND() * 400, 236 + RND() * 52, RND() * 6, 0.4 + RND() * 0.8]);
function strohhuette(g, x, y, s, t, ph, lit) {
  g.save(); g.translate(x, y); g.scale(s, s);
  paper(g, '#a8794a', (c) => rrect(c, -12, -11, 24, 11, 3));
  paper(g, '#d6ae62', (c) => { c.moveTo(-17, -9); c.quadraticCurveTo(-9, -25, 0, -31); c.quadraticCurveTo(9, -25, 17, -9); c.quadraticCurveTo(0, -13, -17, -9); c.closePath(); });
  g.strokeStyle = 'rgba(120,84,24,.45)'; g.lineWidth = 0.9; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(i * 2.2, -29 + abs(i) * 2); g.lineTo(i * 6.4, -11); } g.stroke();
  g.fillStyle = lit ? `rgba(255,205,110,${0.8 + 0.15 * sin(t * 7 + ph)})` : '#4a2e1c'; g.beginPath(); rrect(g, -3, -9, 6, 9, 2.4); g.fill();
  g.restore();
}
const hillY = (x) => 226 - 80 * Math.exp(-(((x - 392) / 92) ** 2)) - sin(x * 0.07) * 1.2;
const hY1 = (x) => 206 + sin(x * 0.017 + 1.2) * 5, hY2 = (x) => hY1(x) + 21 + sin(x * 0.011 + 0.4) * 5;
function hBg(g) {
  vgrad(g, [[0, '#2b2257'], [0.36, '#6f3d70'], [0.62, '#d4705c'], [0.82, '#f5b574']], 0, 215);
  g.fillStyle = '#f5ecd2'; g.beginPath(); g.arc(405, 50, 11, 0, TAU); g.fill(); glow(g, 405, 50, 36, '255,240,200', 0.25);
  g.fillStyle = 'rgba(200,185,150,.5)'; for (const [dx, dy, r] of [[-3, -2, 2.4], [3, 3, 1.8], [2, -4, 1.3]]) { g.beginPath(); g.arc(405 + dx, 50 + dy, r, 0, TAU); g.fill(); }
  glow(g, 96, 178, 170, '255,170,100', 0.55);
  sun(g, 96, 176, 17, 0, '#ffd9a0', '255,190,110', 0.2);
  ridge(g, 164, 9, 0.013, 0.7, '#5a3d78');
  ridge(g, 182, 6, 0.02, 2.2, '#6f4573');
  paper(g, '#7d5a48', (c) => { c.moveTo(230, 216); for (let x = 230; x <= 492; x += 8) c.lineTo(x, hillY(x)); c.lineTo(492, 216); c.closePath(); });
  g.fillStyle = 'rgba(138,160,78,.4)'; g.beginPath(); for (let x = 230; x <= 492; x += 8) x === 230 ? g.moveTo(x, hillY(x)) : g.lineTo(x, hillY(x)); for (let x = 492; x >= 230; x -= 8) g.lineTo(x, hillY(x) + 11 + sin(x * 0.2) * 2); g.closePath(); g.fill();
  strohhuette(g, 330, 175, 1, 0, 0, true); strohhuette(g, 386, 150, 1.12, 0, 2, true); strohhuette(g, 440, 161, 0.95, 0, 4, false);
  g.save(); g.beginPath(); g.moveTo(-5, hY1(-5)); for (let x = -5; x <= SW + 5; x += 8) g.lineTo(x, hY1(x)); for (let x = SW + 5; x >= -5; x -= 8) g.lineTo(x, hY2(x)); g.closePath(); g.clip();
  vgrad(g, [[0, '#f8c08c'], [0.45, '#d27a8a'], [1, '#6a4a86']], 200, 240);
  g.restore();
  g.strokeStyle = 'rgba(255,240,200,.35)'; g.lineWidth = 1; g.beginPath(); for (let x = -5; x <= SW + 5; x += 8) x < -4 ? g.moveTo(x, hY1(x)) : g.lineTo(x, hY1(x)); g.stroke();
  ridge(g, 234, 4, 0.02, 2.0, '#564a2a');
}
function hirten(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm;
  ebene(g, 'hirten', hBg);
  stars(g, ST1, t, 0.85);
  const ab = 0.6 + 0.4 * sin(t * 1.3); glow(g, 118, 104, 14, '255,250,220', 0.5 * ab); g.fillStyle = '#fffbe8'; g.fillRect(117, 103, 2.2, 2.2);
  for (const [fx, fy] of [[40, 166], [150, 160], [250, 170]]) { glow(g, fx, fy, 7, '255,170,70', 0.5 + 0.3 * sin(t * 5 + fx)); }
  smoke(g, 386, 120, t, { n: 5, rise: 40, drift: 12, r0: 2, r1: 7, a: 0.35, col: '200,170,150', speed: 0.18 });
  g.save(); g.beginPath(); g.moveTo(-5, hY1(-5)); for (let x = -5; x <= SW + 5; x += 8) g.lineTo(x, hY1(x)); for (let x = SW + 5; x >= -5; x -= 8) g.lineTo(x, hY2(x)); g.closePath(); g.clip();
  g.fillStyle = 'rgba(255,224,170,.55)'; for (let i = 0; i < 22; i++) { const x = wrap(i * 41 + t * (5 + (i % 4) * 2), -20, SW + 20), y = 208 + (i * 13) % 26 + sin(t + i) * 0.8; g.fillRect(x, y, 8 + (i % 3) * 5, 1.2); }
  g.restore();
  reeds(g, 18, 238, 7, 22, t); reeds(g, 438, 236, 6, 20, t, '#5f7a40');
  ridge(g, 258, 5, 0.016, 0.6, '#443a22');
  grassTufts(g, 262, 298, 26, 31, t, '#7e8a3a', 9);
  // Schafe
  sheep(g, 322, 250, 0.7, -1, t, 1, 'lie'); sheep(g, 366, 244, 0.62, 1, t, 3, 'graze'); sheep(g, 270, 246, 0.6, -1, t, 5, 'stand');
  sheep(g, 330, 270, 1.0, -1, t, 0, 'lie'); sheep(g, 376, 278, 1.12, 1, t, 2, 'graze'); sheep(g, 424, 266, 0.95, -1, t, 4, 'stand'); sheep(g, 452, 282, 1.1, -1, t, 1, 'lie');
  sheep(g, 54, 286, 1.0, 1, t, 3, 'graze');
  // Feuer, Hirten
  const fl = 0.8 + 0.2 * sin(t * 6) * (calm ? 0.5 : 1);
  roman(g, 98, 258, 1.05, 1, 'stand', t * 1.4, { kind: 'hirte', item: 'crook', hair: '#2e2016', arms: { near: [8, 5] } });
  roman(g, 156, 280, 1.25, 1, 'ground', t * 0.8, { kind: 'hirte', tunic: '#b68a4e', hair: '#3a2a1c', hs: 'curly' });
  fire(g, 205, 272, 1.15, t, calm);
  roman(g, 252, 278, 1.2, -1, 'ground', t * 0.7, { kind: 'hirte', tunic: '#8a6a3e', fur: '#d9cdb0', skin: '#c98e66', hair: '#2a1a10', hs: 'short' });
  roman(g, 178, 294, 1.35, 1, 'ground', t, { kind: 'hirte', h: 0.62, head: 1.3, tunic: '#c9a05a', hs: 'short', hair: '#4a2f1d', shadow: false });
  g.globalCompositeOperation = 'lighter'; glow(g, 205, 262, 100, '255,140,40', 0.12 * fl); g.globalCompositeOperation = 'source-over';
  for (const f of FF1) { const a = max(0, sin(t * f[3] + f[2])) ** 2; if (a < 0.05) continue; const x = f[0] + sin(t * 0.5 + f[2]) * 14, y = f[1] + cos(t * 0.6 + f[2]) * 8; glow(g, x, y, 5, '230,255,150', a * 0.8); g.fillStyle = `rgba(250,255,200,${a})`; g.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); }
  bird(g, 280 + sin(t * 0.3) * 20, 72 + sin(t * 0.8) * 4, 0.7, t, 1); bird(g, 306 + sin(t * 0.3) * 20, 82, 0.55, t, 3);
}

// ---------------------------------------------------------------- 2 Bürger stimmen auf dem Forum ab (um 509 v. Chr.)
const TUN2 = ['#d9c08a', '#c9a05a', '#a8824c', '#b88a62', '#8aa07a', '#c8795a', '#8aa0b8', '#d8b078'];
const SK2 = ['#e2b088', '#cf9a70', '#f0c9a4', '#a8714c', '#e2b088', '#cf9a70'];
function fBg2(g) {
  ridge(g, 156, 6, 0.012, 1.2, '#b9b49e'); ridge(g, 168, 5, 0.018, 3.2, '#aaa58e');
  // Kapitol-Hügel mit Tempel (Terrakotta-Giebel nach etruskischer Art)
  paper(g, '#b59a70', (c) => { c.moveTo(286, 200); c.quadraticCurveTo(296, 128, 330, 124); c.lineTo(470, 124); c.quadraticCurveTo(486, 130, 494, 200); c.closePath(); });
  paper(g, '#e9dcba', (c) => c.rect(326, 66, 138, 46), { sy: 1.5 });
  g.fillStyle = 'rgba(120,90,50,.25)'; g.fillRect(326, 66, 138, 12);
  paper(g, '#d8c8a0', (c) => c.rect(316, 110, 158, 14), { sy: 1.5 });
  paper(g, '#cdbd94', (c) => c.rect(322, 124, 146, 6), { sy: 1.2 });
  for (let i = 0; i < 6; i++) column(g, 336 + i * 24.4, 112, 46, 10.5);
  paper(g, '#f0e6cc', (c) => c.rect(318, 56, 156, 10), { sy: 1.5 });
  paper(g, '#c8693a', (c) => { c.moveTo(314, 58); c.lineTo(396, 24); c.lineTo(478, 58); c.closePath(); });
  g.fillStyle = '#f0d8a8'; g.beginPath(); g.moveTo(330, 55); g.lineTo(396, 30); g.lineTo(462, 55); g.closePath(); g.fill();
  paper(g, '#c8693a', (c) => { c.moveTo(338, 54); c.lineTo(396, 33); c.lineTo(454, 54); c.closePath(); }, { shadow: false });
  g.fillStyle = '#e8c46a'; g.beginPath(); g.arc(396, 46, 5, 0, TAU); g.fill(); g.strokeStyle = '#a8793a'; g.lineWidth = 0.9; g.stroke();
  for (const [ax, ay] of [[396, 22], [316, 54], [476, 54]]) paper(g, '#d6a050', (c) => { c.moveTo(ax - 4, ay); c.lineTo(ax - 3, ay - 8); c.lineTo(ax, ay - 12); c.lineTo(ax + 3, ay - 8); c.lineTo(ax + 4, ay); c.closePath(); }, { sy: 1.2, blur: 1 });
  // Halle links (Bogenreihe)
  paper(g, '#d7b98c', (c) => c.rect(18, 118, 148, 76), { sy: 2 });
  paper(g, '#b86a42', (c) => { c.moveTo(10, 120); c.lineTo(24, 100); c.lineTo(160, 100); c.lineTo(174, 120); c.closePath(); });
  tiles(g, 24, 104, 160, 118, 5);
  g.fillStyle = '#efe0b8'; g.fillRect(16, 118, 152, 5);
  for (let i = 0; i < 4; i++) { const ax = 30 + i * 34; g.fillStyle = '#5a3a24'; g.beginPath(); g.moveTo(ax, 194); g.lineTo(ax, 164); g.arc(ax + 11, 164, 11, PI, 0); g.lineTo(ax + 22, 194); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,190,100,.18)'; g.fillRect(ax + 2, 164, 18, 30); }
  // Plaza
  g.fillStyle = '#dcc79c'; g.fillRect(0, 194, SW, 106);
  vgrad(g, [[0, 'rgba(255,255,255,.18)'], [1, 'rgba(120,80,30,.18)']], 194, 300);
  g.strokeStyle = 'rgba(120,92,52,.28)'; g.lineWidth = 1; g.beginPath(); for (const yy of [204, 218, 236, 260, 292]) { g.moveTo(0, yy); g.lineTo(SW, yy); } for (let i = -6; i <= 14; i++) { g.moveTo(240 + (i - 4) * 12, 194); g.lineTo(240 + (i - 4) * 62, 300); } g.stroke();
  // Rednerbühne
  paper(g, '#a9804e', (c) => c.rect(286, 232, 122, 26), { sy: 3, blur: 3 });
  g.strokeStyle = 'rgba(70,40,15,.4)'; g.lineWidth = 1; g.beginPath(); for (let i = 1; i < 12; i++) { g.moveTo(286 + i * 10.2, 232); g.lineTo(286 + i * 10.2, 258); } g.stroke();
  paper(g, '#d4ac76', (c) => { c.moveTo(280, 232); c.lineTo(414, 232); c.lineTo(408, 224); c.lineTo(286, 224); c.closePath(); });
  for (let i = 0; i < 3; i++) paper(g, i % 2 ? '#c89c66' : '#d8b684', (c) => c.rect(268 + i * 6, 258 - (i + 1) * 8.4, 20 - i * 6, 8.4), { sy: 1.2, blur: 1 });
  for (const px of [292, 402]) { g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(px, 224); g.lineTo(px, 168); g.stroke(); }
}
function forum(g, t0, o) {
  const t = tm(t0, o);
  vgrad(g, [[0, '#76b6e2'], [0.55, '#cfe8f2'], [1, '#fbe6c4']], 0, 196);
  sun(g, 58, 42, 12, t, '#fff2c4', '255,236,170', 0.5, 12);
  cloud(g, wrap(t * 3.5 + 120, -70, 540), 40, 1.0, '#ffffff', 0.92); cloud(g, wrap(t * 2.4 + 330, -70, 540), 74, 0.7, '#ffffff', 0.8); cloud(g, wrap(t * 2.9 + 20, -70, 540), 20, 0.55, '#ffffff', 0.7);
  ebene(g, 'forum', fBg2);
  for (const px of [292, 402]) { g.fillStyle = '#7b2d5b'; g.beginPath(); g.moveTo(px, 172); for (let y = 0; y <= 40; y += 8) g.lineTo(px + 7 + sin(t * 2.2 + y * 0.2 + px) * 1.6, 172 + y); g.lineTo(px, 212); g.closePath(); g.fill(); g.fillStyle = '#e8c46a'; g.fillRect(px + 1, 173, 5, 1.6); }
  // Wimpelkette
  bunting(g, 166, 106, 316, 114, 14, t, ['#a8262a', '#e8c46a', '#2d78a8', '#f1ebdc'], 18);
  // Männer auf der Bühne (Konsuln)
  roman(g, 322, 231, 1.05, -1, 'raise', t * 1.5, { kind: 'senator', up: 0.5 + 0.5 * sin(t * 0.9), hs: 'short', hair: '#5a4630' });
  roman(g, 366, 231, 1.05, -1, 'stand', t * 1.1, { kind: 'senator', hs: 'short', hair: '#3a2a1c' });
  // Menge
  const row = (y, s, xs, seed, front) => xs.forEach((x, i) => {
    const k = i + seed, up = smooth(clamp(sin(t * 1.35 + k * 1.9) * 1.3 + 0.75)), kind = k % 3 === 0 ? 'toga' : 'buerger';
    roman(g, x, y, s, 1, 'raise', t * 1.8 + k, { kind, up, tunic: pick(TUN2, k), toga: k % 3 === 0 ? pick(['#f2ead8', '#ece0c6'], k) : undefined, skin: pick(SK2, k), hair: pick(['#4a2f1d', '#2a1a10', '#6b4a2a', '#8a8070'], k * 3), hs: k % 4 === 0 ? 'bald' : k % 4 === 1 ? 'curly' : 'short', beard: k % 5 === 2, trim: pick(['#b8935a', '#8a6a3a'], k) });
  });
  row(260, 1.02, [30, 80, 134, 188, 240], 0);
  row(290, 1.3, [16, 66, 120, 174, 226], 3);
  roman(g, 438, 284, 1.3, -1, 'stand', t * 1.2, { kind: 'buergerin' }); roman(g, 410, 290, 1.4, -1, 'stand', t, { kind: 'kind', h: 0.62 });
  const dx = wrap(t * 9, -40, 520); roman(g, 520 - dx, 297, 1.45, -1, 'walk', t * 5.2, { kind: 'haendler', item: 'basket' });
  for (let i = 0; i < 3; i++) bird(g, 190 + i * 26 + sin(t * 0.35 + i) * 14, 78 + i * 12 + sin(t * 0.9 + i) * 3, 0.8, t, i, 'rgba(250,248,240,.95)');
}

// ---------------------------------------------------------------- 3 Elefanten am Alpenpass (218 v. Chr.)
function mkPeaks(seed, n, base, h0, h1, vmin = 4, vmax = 22) {
  const r = rng(seed), step = (SW + 120) / n, out = [];
  for (let i = 0; i < n; i++) { const x = -60 + (i + 0.5) * step + (r() - 0.5) * step * 0.35; out.push({ x, y: base - (h0 + r() * (h1 - h0)), vl: [x - step * (0.45 + r() * 0.15), base - vmin - r() * vmax], vr: [x + step * (0.45 + r() * 0.15), base - vmin - r() * vmax] }); }
  return out;
}
function drawPeaks(g, P, base, rock, snow, facet, shadow = true) {
  paper(g, rock, (c) => {
    c.moveTo(-70, SH + 10); c.lineTo(-70, base);
    P.forEach((p, i) => { c.lineTo(p.vl[0], p.vl[1]); c.lineTo(p.x - (p.x - p.vl[0]) * 0.25, lerp(p.y, p.vl[1], 0.3)); c.lineTo(p.x, p.y); c.lineTo(p.x + (p.vr[0] - p.x) * 0.3, lerp(p.y, p.vr[1], 0.4)); c.lineTo(p.vr[0], p.vr[1]); });
    c.lineTo(SW + 70, base); c.lineTo(SW + 70, SH + 10); c.closePath();
  }, { shadow, edge: false });
  for (const p of P) {
    g.fillStyle = facet; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.vr[0], p.vr[1]); g.lineTo(p.x - (p.x - p.vr[0]) * 0.1 + 2, lerp(p.y, p.vr[1], 0.7) + 10); g.lineTo(p.x - 4, p.y + (p.vl[1] - p.y) * 0.55); g.closePath(); g.fill();
    const dl = [lerp(p.x, p.vl[0], 0.46), lerp(p.y, p.vl[1], 0.46)], dr = [lerp(p.x, p.vr[0], 0.46), lerp(p.y, p.vr[1], 0.46)];
    g.fillStyle = snow; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(lerp(p.x, p.vl[0], 0.3), lerp(p.y, p.vl[1], 0.3)); g.lineTo(dl[0], dl[1]);
    g.lineTo(lerp(dl[0], p.x, 0.3), dl[1] + 6); g.lineTo(lerp(dl[0], p.x, 0.55), dl[1] - 2); g.lineTo(lerp(p.x, dr[0], 0.15), dl[1] + 9); g.lineTo(lerp(p.x, dr[0], 0.6), dr[1] + 1); g.lineTo(dr[0], dr[1]); g.lineTo(lerp(p.x, p.vr[0], 0.3), lerp(p.y, p.vr[1], 0.3)); g.closePath(); g.fill();
  }
}
const PK3a = mkPeaks(31, 6, 150, 62, 98), PK3b = mkPeaks(32, 5, 164, 44, 74), PK3c = mkPeaks(33, 4, 176, 28, 50);
const SNOW3 = Array.from({ length: 70 }, () => [RND() * SW, RND() * SH, 0.4 + RND() * 0.9, 1 + RND() * 1.4, RND() * 6]);

function elefant(g, x, y, s, dir, t, ph, o = {}) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  const body = '#8f8a88', dark = '#6e6967', light = '#a9a4a0', bob = sin(ph * 2) * 0.7;
  const leg = (lx, p, far) => {
    const sw = sin(p) * 5.4, lift = max(0, cos(p)) * 4;
    g.fillStyle = far ? dark : body; g.beginPath(); g.moveTo(lx - 5, -30); g.lineTo(lx + 5, -30); g.lineTo(lx + 4.6 + sw * 0.7, -lift - 2); g.lineTo(lx + 4.4 + sw * 0.7, -lift); g.lineTo(lx - 4.4 + sw * 0.7, -lift); g.lineTo(lx - 4.6 + sw * 0.7, -lift - 2); g.closePath(); g.fill();
    g.fillStyle = '#d8cfc0'; for (let i = -1; i <= 1; i++) g.fillRect(lx + sw * 0.7 + i * 3 - 1, -lift - 2.4, 2, 2.4);
  };
  leg(-20, ph + PI, true); leg(12, ph, true);
  // Schwanz
  g.strokeStyle = dark; g.lineWidth = 2.2; g.lineCap = 'round'; g.beginPath(); g.moveTo(-30, -42 + bob); g.quadraticCurveTo(-36, -34, -34 + sin(t * 1.5 + ph) * 2, -24); g.stroke(); g.fillStyle = '#4a4442'; g.beginPath(); g.ellipse(-34 + sin(t * 1.5 + ph) * 2, -22, 1.6, 3.2, 0, 0, TAU); g.fill();
  // Rumpf
  paper(g, body, (c) => { c.moveTo(-31, -32 + bob); c.quadraticCurveTo(-34, -56 + bob, -12, -58 + bob); c.quadraticCurveTo(14, -61 + bob, 28, -54 + bob); c.quadraticCurveTo(36, -34 + bob, 26, -26 + bob); c.quadraticCurveTo(0, -19 + bob, -31, -32 + bob); c.closePath(); }, { sy: 2, blur: 2 });
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(-4, -50 + bob, 22, 5, 0.05, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(40,35,35,.25)'; g.lineWidth = 0.9; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(-26 + i * 4, -30 + bob - i); g.quadraticCurveTo(-24 + i * 4, -26 + bob, -26 + i * 4 + 2, -22 + bob); } g.stroke();
  // Decke und Reiter
  paper(g, '#a8262a', (c) => { c.moveTo(-17, -57 + bob); c.quadraticCurveTo(-4, -61 + bob, 11, -57 + bob); c.lineTo(15, -39 + bob); for (let i = 0; i < 6; i++) c.lineTo(12 - i * 5.4, -39 + bob + (i % 2 ? 0 : 3.4)); c.lineTo(-20, -39 + bob); c.closePath(); }, { sy: 1.4, blur: 1.2 });
  g.fillStyle = '#e8c46a'; g.fillRect(-19, -43 + bob, 33, 1.7); g.fillRect(-16, -55 + bob, 28, 1.2);
  if (o.rider !== false) roman(g, 5, -52 + bob, 0.46, 1, 'sit', 0, { kind: 'punsoldat', shadow: false, shield: null, item: null, sword: false, cloak: '#2b6a8a' });
  // Beine vorn (nah)
  leg(-9, ph, false); leg(23, ph + PI, false);
  // Kopf mit Ohr, Rüssel, Stoßzahn
  const fl = 1 + 0.14 * sin(t * 2.3 + ph);
  g.save(); g.translate(25, -50 + bob); g.scale(fl, 1); paper(g, '#807b79', (c) => { c.moveTo(0, -4); c.quadraticCurveTo(-14, -14, -22, -4); c.quadraticCurveTo(-26, 12, -14, 22); c.quadraticCurveTo(-6, 20, 0, 12); c.closePath(); }, { sy: 1.4 }); g.fillStyle = '#b58f8f'; g.beginPath(); g.moveTo(-2, -1); g.quadraticCurveTo(-12, -8, -18, -1); g.quadraticCurveTo(-20, 11, -12, 17); g.quadraticCurveTo(-6, 15, -2, 9); g.closePath(); g.fill(); g.restore();
  paper(g, body, (c) => { c.ellipse(34, -41 + bob, 13, 14, 0.15, 0, TAU); }, { sy: 1.5, blur: 1.5 });
  const sw1 = sin(t * 1.4 + ph) * 3, sw2 = sin(t * 1.4 + ph - 0.7) * 4, sw3 = sin(t * 1.4 + ph - 1.4) * 5, lift = 3 + sin(t * 1.1 + ph) * 3;
  const tr = [[40, -38 + bob], [47 + sw1 * 0.4, -26 + bob], [49 + sw2 * 0.6, -14], [45 + sw3, -4 - lift]];
  limb(g, [tr[0], tr[1]], 10.5, body); limb(g, [tr[1], tr[2]], 8.4, body); limb(g, [tr[2], tr[3]], 6.4, body);
  g.strokeStyle = 'rgba(40,35,35,.22)'; g.lineWidth = 0.8; for (let i = 0; i < 4; i++) { const px = lerp(tr[1][0], tr[2][0], i / 4), py = lerp(tr[1][1], tr[2][1], i / 4); g.beginPath(); g.moveTo(px - 3.5, py); g.lineTo(px + 3.5, py + 1); g.stroke(); }
  g.strokeStyle = '#f2ead6'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(41, -34 + bob); g.quadraticCurveTo(52, -30 + bob, 57, -38 + bob); g.stroke();
  g.fillStyle = '#1e1816'; g.beginPath(); g.arc(38.4, -45 + bob, 1.3, 0, TAU); g.fill();
  g.restore();
}

const pathAt = (u) => [lerp(405, -70, Math.pow(max(0, u), 1.12)), lerp(184, 300, Math.pow(max(0, u), 1.05))];
function aBg3(g) {
  drawPeaks(g, PK3a, 150, '#7f95b8', '#fbfdff', 'rgba(40,60,110,.22)', false);
  drawPeaks(g, PK3b, 166, '#6a7fa4', '#f4f8fd', 'rgba(30,45,95,.25)');
  drawPeaks(g, PK3c, 178, '#556a90', '#eef4fa', 'rgba(25,35,80,.28)');
  // Schneefeld
  paper(g, '#eef3f8', (c) => { c.moveTo(-10, SH + 10); c.lineTo(-10, 188); for (let x = -10; x <= SW + 10; x += 8) c.lineTo(x, 182 + sin(x * 0.02 + 1) * 5 + sin(x * 0.07) * 1.6 + max(0, (x - 360)) * -0.04); c.lineTo(SW + 10, SH + 10); c.closePath(); }, { shCol: 'rgba(40,60,110,.3)' });
  vgrad(g, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(120,150,200,.35)']], 182, SH);
  // Pfad (Schneise), Schneewehen
  const pathAt = (u) => [lerp(405, -70, Math.pow(max(0, u), 1.12)), lerp(184, 300, Math.pow(max(0, u), 1.05))];
  g.fillStyle = '#c5cfdc'; g.beginPath();
  for (let i = 0; i <= 24; i++) { const u = i / 24 * 1.1 - 0.05, [px, py] = pathAt(u), w = 4 + 26 * max(0, u); i ? g.lineTo(px, py - w * 0.28) : g.moveTo(px, py - w * 0.28); }
  for (let i = 24; i >= 0; i--) { const u = i / 24 * 1.1 - 0.05, [px, py] = pathAt(u), w = 4 + 26 * max(0, u); g.lineTo(px, py + w * 0.28); }
  g.closePath(); g.fill();
}
function alpen(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm;
  vgrad(g, [[0, '#86a8d4'], [0.5, '#bdd1e8'], [1, '#eef1f2']], 0, 190);
  glow(g, 392, 52, 70, '255,255,240', 0.55); g.fillStyle = 'rgba(255,255,248,.9)'; g.beginPath(); g.arc(392, 52, 11, 0, TAU); g.fill();
  cloud(g, wrap(t * 2 + 60, -70, 540), 38, 1.1, '#f4f7fb', 0.7); cloud(g, wrap(t * 1.4 + 300, -70, 540), 78, 0.8, '#f4f7fb', 0.6);
  ebene(g, 'alpen', aBg3);
  // Schneefahnen auf den hohen Gipfeln
  for (const p of PK3a.slice(1, 4)) for (let i = 0; i < 4; i++) { const ph = (t * 0.1 + i / 4 + p.x * 0.01) % 1; g.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; g.beginPath(); g.ellipse(p.x + 6 + ph * 40, p.y + 3 + ph * 6, 6 + ph * 14, 2 + ph * 3, 0, 0, TAU); g.fill(); }
  // Karawane (von hinten nach vorn sortiert)
  const L = 1.2, base = [['s', 0.0], ['s', 0.1], ['e', 0.2], ['s', 0.34], ['e', 0.46], ['s', 0.58], ['s', 0.68], ['e', 0.8], ['s', 0.92], ['s', 1.02]];
  const items = base.map(([k, u0], i) => ({ k, i, u: wrap(u0 + t * 0.0125, -0.1, 1.1) })).sort((a, b) => a.u - b.u);
  for (const it of items) {
    const u = it.u, [px, py] = pathAt(u), sc = 0.4 + 0.72 * max(0, u), lat = (it.k === 's' ? (it.i % 2 ? 1 : -1) * 9 : 0) * sc, ph = t * 2.2 + it.i * 1.7;
    g.globalAlpha = sm(0, 0.1, u);
    if (it.k === 'e') elefant(g, px, py + 2 + lat, sc * 1.4, -1, t, ph);
    else roman(g, px, py + 2 + lat, sc * 1.1, -1, 'walk', ph * 1.6, { kind: 'punsoldat', cloak: pick(['#7a3a22', '#2b6a8a', '#8a6a3a'], it.i), tunic: '#d9c9a0', hair: '#2a1a12' });
    g.globalAlpha = 1;
  }
  // Atemwölkchen vor den nächsten Tieren
  for (const it of items) if (it.k === 'e' && it.u > 0.3 && it.u < 1.0) { const [px, py] = pathAt(it.u), sc = 0.4 + 0.72 * it.u, p = (t * 0.5 + it.i * 0.37) % 1; g.fillStyle = `rgba(255,255,255,${0.5 * (1 - p)})`; g.beginPath(); g.arc(px - 56 * sc * 1.4 - p * 8, py - 22 * sc * 1.4 - p * 10, 2 + p * 5, 0, TAU); g.fill(); }
  // Schneefall
  const nS = calm ? 30 : SNOW3.length;
  g.fillStyle = 'rgba(255,255,255,.9)';
  for (let i = 0; i < nS; i++) { const f = SNOW3[i], x = wrap(f[0] - t * 6 * f[2] + sin(t * 0.7 + f[4]) * 8, -4, SW + 4), y = wrap(f[1] + t * 16 * f[2], -4, SH + 4); g.globalAlpha = 0.45 + 0.4 * f[2] / 1.3; g.beginPath(); g.arc(x, y, f[3] * 0.85, 0, TAU); g.fill(); }
  g.globalAlpha = 1;
  gull(g, 120 + sin(t * 0.2) * 40, 58 + sin(t * 0.5) * 6, 1.0, t, 0, '#4a4240');
}

// ---------------------------------------------------------------- 4 Karthagos Hafen liegt still (146 v. Chr.)
const CITY4 = (() => { const r = rng(44), out = []; for (let row = 0; row < 3; row++) for (let i = 0; i < 20; i++) out.push({ row, x: -8 + i * 17 + r() * 8 + row * 5, w: 12 + r() * 9, h: 14 + r() * 24 + (2 - row) * 5, c: ['#f3e6c8', '#e4cfa4', '#d6b98c', '#f6ecd6', '#e9d6b0'][floor(r() * 5)], win: floor(r() * 3), lit: r() }); return out; })();
function schiff(g, x, y, s, dir, t, ph) {
  g.save(); g.translate(x, y + sin(t * 1.1 + ph) * 0.9); g.rotate(sin(t * 0.8 + ph) * 0.012 * dir); g.scale(dir * s, s);
  g.fillStyle = 'rgba(20,20,50,.28)'; g.beginPath(); g.ellipse(2, 3, 36, 3, 0, 0, TAU); g.fill();
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.6; g.lineCap = 'round'; for (let i = 0; i < 8; i++) { const ox = -22 + i * 6, sw = sin(t * 1.6 + i * 0.4 + ph) * 1.6; g.beginPath(); g.moveTo(ox, -4); g.lineTo(ox - 9 + sw, 7); g.stroke(); }
  g.strokeStyle = '#5a3a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -44); g.stroke(); g.lineWidth = 1.7; g.beginPath(); g.moveTo(-15, -38); g.lineTo(15, -38); g.stroke();
  g.fillStyle = '#efe2c0'; g.beginPath(); g.moveTo(-14, -37); g.quadraticCurveTo(0, -31 + sin(t * 1.3 + ph), 14, -37); g.quadraticCurveTo(0, -34, -14, -37); g.fill();
  g.strokeStyle = 'rgba(70,40,20,.6)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(0, -44); g.lineTo(-30, -20); g.moveTo(0, -44); g.lineTo(36, -9); g.stroke();
  paper(g, '#8a5a38', (c) => { c.moveTo(-32, -13); c.quadraticCurveTo(-37, -22, -29, -27); c.quadraticCurveTo(-28, -20, -23, -15); c.lineTo(25, -11); c.quadraticCurveTo(35, -10, 40, -5); c.lineTo(31, 1); c.quadraticCurveTo(0, 7, -26, 2); c.closePath(); }, { sy: 1.5, blur: 1.5 });
  g.fillStyle = '#c8402a'; g.beginPath(); g.moveTo(-26, -11); g.lineTo(26, -9); g.lineTo(30, -5); g.lineTo(-24, -5); g.closePath(); g.fill(); g.fillStyle = '#e8c46a'; g.fillRect(-25, -4.6, 52, 1.4);
  g.fillStyle = '#fff'; g.beginPath(); g.arc(29, -8, 2.3, 0, TAU); g.fill(); g.fillStyle = '#2d78a8'; g.beginPath(); g.arc(29.5, -8, 1.1, 0, TAU); g.fill();
  g.fillStyle = '#c99a2e'; g.beginPath(); g.moveTo(40, -5); g.lineTo(46, -3); g.lineTo(40, -2); g.closePath(); g.fill();
  flag(g, 0, -44, 8, 9, t, '#7b2d5b', null, { fh: 4, ph, amp: 1.4 });
  g.restore();
}
function palme4(g, x, y, h, t, ph) { palm(g, x, y, h, t, ph, '#4b8a52'); }
function kBg4(g) {
  ridge(g, 150, 7, 0.016, 1.1, '#8e5f86');
  // Stadt am Hang
  paper(g, '#c9a078', (c) => { c.moveTo(-10, 190); c.quadraticCurveTo(60, 98, 170, 106); c.quadraticCurveTo(260, 112, 310, 190); c.closePath(); });
  for (let row = 2; row >= 0; row--) {
    const rr = CITY4.filter((b) => b.row === row);
    for (const b of rr) {
      const by = 188 - row * 26 + (row === 0 ? 0 : -2), shade = row === 2 ? 0.18 : row === 1 ? 0.08 : 0;
      if (b.x > 330) continue;
      const topy = by - b.h; if (b.x > 120 && b.x < 200 && row === 2) { }
      paper(g, mixh(b.c, '#6a4a7a', shade), (c) => c.rect(b.x, topy, b.w, b.h), { sy: 1.5, blur: 1.2, sx: 1 });
      g.fillStyle = 'rgba(80,50,40,.35)'; g.fillRect(b.x - 1, topy - 1.5, b.w + 2, 2);
      g.fillStyle = b.lit > 0.45 ? `rgba(255,214,120,0.8)` : 'rgba(70,45,60,.55)';
      for (let k = 0; k <= b.win; k++) g.fillRect(b.x + 3 + k * 5, topy + 5 + (b.h > 28 ? 9 : 0), 2.4, 4);
      if (b.h > 30) { g.fillStyle = 'rgba(70,45,60,.5)'; g.fillRect(b.x + b.w * 0.5 - 2, by - 10, 4, 10); }
    }
  }
  paper(g, '#e8d2a0', (c) => c.rect(150, 78, 26, 28), { sy: 1.5 }); paper(g, '#e8c46a', (c) => { c.moveTo(145, 80); c.lineTo(163, 62); c.lineTo(181, 80); c.closePath(); });
  for (let i = 0; i < 3; i++) { g.fillStyle = '#b8a070'; g.fillRect(154 + i * 8, 86, 3, 18); }
  // Hafenmauer mit Türmen
  paper(g, '#d6b88c', (c) => c.rect(-10, 172, SW + 20, 14), { sy: 2 });
  g.fillStyle = '#c4a478'; for (let x = -4; x < SW + 10; x += 9) g.fillRect(x, 168, 5, 5);
  for (const tx of [48, 142, 238, 330, 424]) { paper(g, '#e0c496', (c) => c.rect(tx - 9, 142, 18, 46), { sy: 2 }); g.fillStyle = '#c4a478'; for (let k = 0; k < 3; k++) g.fillRect(tx - 9 + k * 6.6, 138, 4.6, 5); g.fillStyle = 'rgba(70,45,60,.6)'; g.fillRect(tx - 2, 152, 4, 8); }
  // Rundhafen
  paper(g, '#cfae80', (c) => ellipse(c, 240, 232, 236, 56), { sy: 3, blur: 3 });
}
function kFg4(g) {
  // Vordergrund: Kai
  paper(g, '#8a6a52', (c) => { c.moveTo(-10, 304); c.lineTo(-10, 288); for (let x = -10; x <= SW + 10; x += 8) c.lineTo(x, 286 + sin(x * 0.05) * 1.5); c.lineTo(SW + 10, 304); c.closePath(); }, { sy: -2, shCol: 'rgba(20,10,30,.3)' });
  masonry(g, 0, 292, SW, 8, 4, '#7a5c46', 'rgba(30,20,20,.4)', 4);
  for (const bx of [110, 290, 420]) { g.fillStyle = '#3a2a22'; g.beginPath(); g.ellipse(bx, 289, 4, 5, 0, 0, TAU); g.fill(); g.fillStyle = '#5a463a'; g.fillRect(bx - 3, 283, 6, 5); }
}
function karthago(g, t0, o) {
  const t = tm(t0, o);
  vgrad(g, [[0, '#2f4278'], [0.4, '#8a5f90'], [0.72, '#ef9f7c'], [1, '#fcd49c']], 0, 175);
  stars(g, ST1.slice(0, 18), t, 0.4);
  glow(g, 370, 156, 130, '255,190,110', 0.55); sun(g, 370, 156, 19, t, '#ffe2a8', '255,200,120', 0.25);
  ebene(g, 'karthago-bg', kBg4);
  for (const tx of [48, 142, 238, 330, 424]) { const lit = 0.6 + 0.3 * sin(t * 3 + tx); g.fillStyle = `rgba(255,208,110,${lit})`; g.fillRect(tx - 1.2, 153, 2.4, 5); glow(g, tx, 156, 10, '255,200,100', 0.25 * lit); }
  g.save(); g.beginPath(); ellipse(g, 240, 232, 220, 46); g.clip();
  vgrad(g, [[0, '#f0a47e'], [0.35, '#b8708a'], [1, '#2a3f6a']], 184, 280);
  for (let y = 190; y < 276; y += 3.5) { const k = (y - 190) / 86, w = (6 + k * 34) * (0.55 + 0.45 * sin(y * 1.7 + t * 1.3)), jit = sin(t * 1.5 + y * 0.4) * (2 + k * 5); g.fillStyle = `rgba(255,232,176,${0.7 - k * 0.3})`; g.fillRect(370 - w / 2 + jit, y, w, 1.2); }
  g.fillStyle = 'rgba(255,255,255,.3)'; for (let i = 0; i < 30; i++) { const x = wrap(i * 53 + t * (3 + i % 3), 20, 460), y = 192 + (i * 17) % 82; g.fillRect(x, y, 6 + (i % 3) * 4, 1); }
  // Schiffe im Becken
  schiff(g, 96, 222, 0.8, 1, t, 0); schiff(g, 380, 224, 0.8, -1, t, 2); schiff(g, 158, 256, 1.0, 1, t, 4); schiff(g, 330, 258, 1.0, -1, t, 1);
  // Insel
  paper(g, '#c9a878', (c) => ellipse(c, 240, 238, 42, 10), { sy: 2 });
  paper(g, '#e8d4a6', (c) => c.rect(228, 214, 24, 24), { sy: 1.5 }); paper(g, '#c8693a', (c) => { c.moveTo(223, 216); c.lineTo(240, 198); c.lineTo(257, 216); c.closePath(); });
  g.fillStyle = '#5a3a28'; g.beginPath(); g.moveTo(236, 238); g.lineTo(236, 227); g.arc(240, 227, 4, PI, 0); g.lineTo(244, 238); g.closePath(); g.fill();
  flag(g, 240, 198, 12, 11, t, '#a8262a', '#e8c46a', { fh: 5, ph: 1, amp: 1.5 });
  // kleines Ruderboot
  { const bx = 262 + sin(t * 0.25) * 6, by = 262 + sin(t * 0.9) * 0.8; g.fillStyle = '#6a4a2a'; g.beginPath(); g.moveTo(bx - 14, by - 4); g.quadraticCurveTo(bx, by + 5, bx + 14, by - 4); g.closePath(); g.fill(); roman(g, bx, by - 1, 0.5, 1, 'sit', t * 0.7, { kind: 'punier', cloak: null, hat: 'pilleus', shadow: false }); g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(bx + 4, by - 12); g.lineTo(bx + 18 + sin(t) * 2, by + 5); g.stroke(); }
  g.restore();
  g.strokeStyle = 'rgba(255,240,200,.4)'; g.lineWidth = 1.2; g.beginPath(); ellipse(g, 240, 232, 220, 46); g.stroke();
  // Laternen am Kai
  for (const [lx, ly] of [[40, 214], [92, 196], [388, 196], [440, 214], [250, 184], [170, 186]]) { const f = 0.7 + 0.25 * sin(t * 2.6 + lx); glow(g, lx, ly, 14, '255,200,100', 0.4 * f); g.fillStyle = '#ffe49a'; g.fillRect(lx - 1.2, ly - 1.6, 2.4, 3.2); g.fillStyle = '#5a3a1e'; g.fillRect(lx - 0.5, ly + 1.6, 1, 5); }
  ebene(g, 'karthago-fg', kFg4);
  palme4(g, 20, 252, 70, t, 0); palme4(g, 458, 248, 78, t, 2);
  roman(g, 66, 296, 0.92, 1, 'ground', t * 0.7, { kind: 'punier', cloak: null, hat: 'pilleus' });
  roman(g, 404, 296, 0.92, -1, 'stand', t * 1.1, { kind: 'punier', cloak: '#7a3a22', hs: 'short', tunic: '#d9c9a0' });
  gull(g, wrap(t * 9 + 40, -20, 500), 74 + sin(t * 0.4) * 6, 1, t, 0); gull(g, wrap(t * 7 + 300, -20, 500), 104 + sin(t * 0.5) * 5, 0.8, t, 2); gull(g, wrap(t * 8 + 160, -20, 500), 50 + sin(t * 0.3) * 4, 0.7, t, 4);
}

// ---------------------------------------------------------------- 5 Soldaten am Flussufer: der Rubikon (49 v. Chr.)
const FIELD5 = (() => { const r = rng(55), out = []; for (let i = 0; i < 9; i++) out.push([312 + i * 24 + r() * 8, 192 + r() * 6, ['#c9a64a', '#9aaa52', '#d6b658', '#8a9a48', '#b99a42'][i % 5]]); return out; })();
function wuerfel(g, x, y, s, t) {
  g.save(); g.translate(x, y); g.scale(s, s);
  paper(g, '#f4ecd8', (c) => rrect(c, -4, -8, 8, 8, 1.4), { sy: 1.5, blur: 1.2 }); g.fillStyle = '#7a1c1c';
  for (const [dx, dy] of [[-1.8, -6.2], [1.8, -1.8], [0, -4], [-1.8, -1.8], [1.8, -6.2]]) { g.beginPath(); g.arc(dx, dy, 0.8, 0, TAU); g.fill(); }
  const a = max(0, sin(t * 1.6)) ** 6; if (a > 0.05) { g.strokeStyle = `rgba(255,248,210,${a})`; g.lineWidth = 0.9; g.beginPath(); g.moveTo(5.5, -10); g.lineTo(5.5, -5); g.moveTo(3, -7.5); g.lineTo(8, -7.5); g.stroke(); }
  g.restore();
}
const xl5 = (y) => lerp(292, 180, (y - 190) / 110), xr5 = (y) => lerp(312, 372, (y - 190) / 110);
function rBg5(g) {
  ridge(g, 178, 6, 0.014, 1.1, '#9a7fa2'); ridge(g, 188, 5, 0.02, 3.0, '#8a8a84');
  // rechtes Ufer: Felder, Dorf, Zypressen
  paper(g, '#aab25a', (c) => { c.moveTo(312, 188); c.lineTo(SW + 10, 188); c.lineTo(SW + 10, SH + 10); c.lineTo(370, SH + 10); c.closePath(); });
  for (const [fx, fy, fc] of FIELD5) { const w = 30; g.fillStyle = fc; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + w, fy); g.lineTo(fx + w + 14 + (fy - 188) * 3, fy + 70); g.lineTo(fx + 8, fy + 70); g.closePath(); g.fill(); g.globalAlpha = 0.22; g.strokeStyle = '#4a4a1a'; g.lineWidth = 0.8; g.beginPath(); for (let k = 1; k < 6; k++) { g.moveTo(lerp(fx, fx + 8, k / 6), lerp(fy, fy + 70, k / 6)); g.lineTo(lerp(fx + w, fx + w + 14 + (fy - 188) * 3, k / 6), lerp(fy, fy + 70, k / 6)); } g.stroke(); g.globalAlpha = 1; }
  for (const [hx, hy] of [[400, 182], [418, 184], [440, 181], [462, 183]]) { paper(g, '#efe0c0', (c) => c.rect(hx, hy - 8, 12, 8), { blur: 1, sy: 1.4 }); paper(g, '#b86a42', (c) => { c.moveTo(hx - 2, hy - 8); c.lineTo(hx + 6, hy - 13); c.lineTo(hx + 14, hy - 8); c.closePath(); }, { blur: 1 }); }
  cypress(g, 386, 190, 24, '#3f5a3a', 0, 1); cypress(g, 452, 192, 28, '#3f5a3a', 0, 2); cypress(g, 480, 196, 22, '#4a6240', 0, 3);
  olive(g, 350, 262, 0.9, 0, 1); olive(g, 456, 288, 1.15, 0, 3);
  g.save(); g.beginPath(); g.moveTo(292, 190); g.lineTo(312, 190); g.lineTo(372, 300); g.lineTo(180, 300); g.closePath(); g.clip();
  vgrad(g, [[0, '#f6c88e'], [0.35, '#d89a98'], [1, '#4a6aa0']], 188, 300);
  g.restore();
  g.strokeStyle = 'rgba(255,240,200,.45)'; g.lineWidth = 1; g.beginPath(); g.moveTo(292, 190); g.lineTo(180, 300); g.moveTo(312, 190); g.lineTo(372, 300); g.stroke();
  // linkes Ufer
  paper(g, '#7a8654', (c) => { c.moveTo(-10, 189); c.lineTo(292, 189); c.lineTo(180, 300); c.lineTo(-10, 300); c.closePath(); }, { sx: 2, sy: 2 });
  vgrad(g, [[0, 'rgba(255,230,160,.0)'], [1, 'rgba(40,50,20,.35)']], 190, 300);
  // Lager
  for (const [tx, ty, ts] of [[34, 214, 1.0], [84, 208, 0.9], [138, 212, 0.95]]) {
    paper(g, '#efe3c4', (c) => { c.moveTo(tx - 20 * ts, ty); c.lineTo(tx, ty - 24 * ts); c.lineTo(tx + 20 * ts, ty); c.closePath(); }, { sy: 1.6 });
    g.fillStyle = '#6a4a30'; g.beginPath(); g.moveTo(tx - 4 * ts, ty); g.lineTo(tx, ty - 11 * ts); g.lineTo(tx + 4 * ts, ty); g.closePath(); g.fill();
  }
}
function rubikon(g, t0, o) {
  const t = tm(t0, o);
  vgrad(g, [[0, '#26366a'], [0.4, '#a46a90'], [0.78, '#f5b57c'], [1, '#fdd9a2']], 0, 192);
  stars(g, ST1.slice(0, 14), t, 0.35);
  // Sonnenaufgang
  g.save(); g.translate(318, 178); g.rotate(sin(t * 0.1) * 0.03); g.fillStyle = 'rgba(255,225,160,.07)'; for (let i = 0; i < 9; i++) { g.rotate(PI / 9); g.beginPath(); g.moveTo(0, 0); g.lineTo(-300, -16); g.lineTo(-300, 16); g.closePath(); g.fill(); g.rotate(0); } g.restore();
  glow(g, 318, 178, 120, '255,200,120', 0.6); sun(g, 318, 178, 18, t, '#ffe9b0', '255,210,130', 0.2);
  for (let i = 0; i < 7; i++) bird(g, wrap(t * 13 + 20, -40, 520) - abs(i - 3) * 9, 66 + abs(i - 3) * 7 + sin(t * 0.9 + i) * 1.5, 0.8, t, i * 0.7);
  ebene(g, 'rubikon', rBg5);
  g.save(); g.beginPath(); g.moveTo(292, 190); g.lineTo(312, 190); g.lineTo(372, 300); g.lineTo(180, 300); g.closePath(); g.clip();
  for (let i = 0; i < 40; i++) { const k = ((i * 0.137 + t * 0.045 * (1 + (i % 3) * 0.3)) % 1), y = 192 + k * k * 106, w = 3 + k * 26, x = lerp(xl5(y), xr5(y), ((i * 0.618) % 1)); g.fillStyle = `rgba(255,236,190,${0.2 + 0.45 * k})`; g.fillRect(x - w / 2, y, w, 0.8 + k * 1.2); }
  g.restore();
  for (const [tx, ty, ts] of [[34, 214, 1.0], [84, 208, 0.9], [138, 212, 0.95]]) flag(g, tx, ty - 24 * ts, 8, 8, t, '#a8262a', null, { fh: 4, ph: tx, amp: 1.3 });
  smoke(g, 112, 214, t, { n: 5, rise: 40, drift: 10, r0: 2, r1: 6, a: 0.3, col: '230,215,200', speed: 0.2 });
  grassTufts(g, 214, 296, 30, 56, t, '#5e6e34', 8);
  reeds(g, 226, 262, 6, 20, t, '#6a7a3c'); reeds(g, 200, 288, 5, 18, t, '#6a7a3c'); reeds(g, 340, 226, 5, 14, t, '#8a9a4a');
  // Würfel auf einem Stein
  paper(g, '#8a8478', (c) => ellipse(c, 206, 294, 11, 4.4), { sy: 1.6 }); wuerfel(g, 206, 292, 1.5, t);
  // Soldaten
  const sold = (x, y, s, i, extra = {}) => roman(g, x, y, s, 1, 'stand', t * 1.3 + i * 1.7, { kind: 'soldat', tunic: pick(['#e2d4ae', '#d9c9a0', '#e8dcb8'], i), shieldCol: pick(['#a8262a', '#8a2a2a', '#2d5a8a'], i), item: i % 2 ? 'pilum' : 'pilum', ...extra });
  sold(24, 268, 0.95, 0); sold(60, 270, 0.96, 1); sold(96, 266, 0.94, 2); sold(132, 270, 0.96, 3);
  sold(34, 296, 1.2, 4); sold(74, 298, 1.22, 5);
  roman(g, 112, 290, 1.12, 1, 'stand', t * 1.3, { kind: 'soldat', item: 'aquila', helmet: 'galea', cloak: '#6a1f2a', shield: null, tunic: '#e8dcb8', arms: { near: [6, 4] } });
  roman(g, 168, 298, 1.34, 1, 'point', t * 0.9, { kind: 'feldherr', helmet: 'crest', crest: '#a8262a', cloak: '#a8262a', wind: 0.9, cloakLen: 38, tunic: '#e8dcc0', skin: '#e8b890' });
  // Morgennebel
  for (let i = 0; i < 6; i++) { const x = wrap(i * 94 + t * (3 + i), -80, 560), y = 196 + (i % 3) * 14; g.fillStyle = 'rgba(255,238,224,.16)'; g.beginPath(); g.ellipse(x, y, 70, 9, 0, 0, TAU); g.fill(); }
}

// ---------------------------------------------------------------- 6 Lorbeerkranz für Augustus (27 v. Chr.)
const PET6 = Array.from({ length: 26 }, () => [RND() * SW, RND() * SH, 0.5 + RND() * 0.9, RND() * 6, floor(RND() * 4)]);
function kranz(g, x, y, rx, ry, rot, a) {
  g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(rot);
  for (let i = 0; i < 16; i++) { const an = PI * 0.62 + i * (PI * 1.76 / 15), lx = cos(an) * rx, ly = sin(an) * ry; g.fillStyle = i % 2 ? '#d2aa3a' : '#6f9a46'; g.beginPath(); g.ellipse(lx, ly, rx * 0.2, ry * 0.11, an + PI / 2 + 0.55, 0, TAU); g.fill(); }
  g.fillStyle = '#a8262a'; g.beginPath(); g.moveTo(0, ry); g.lineTo(-4, ry + 7); g.lineTo(-1, ry + 5); g.lineTo(0, ry + 8); g.lineTo(1, ry + 5); g.lineTo(4, ry + 7); g.closePath(); g.fill();
  g.restore();
}
function funkeln(g, x, y, r, a) { g.strokeStyle = `rgba(255,248,210,${a})`; g.lineWidth = 1.1; g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.moveTo(x, y - r); g.lineTo(x, y + r); g.moveTo(x - r * 0.5, y - r * 0.5); g.lineTo(x + r * 0.5, y + r * 0.5); g.moveTo(x + r * 0.5, y - r * 0.5); g.lineTo(x - r * 0.5, y + r * 0.5); g.stroke(); }
function aBg6(g) {
  // Saalwand
  vgrad(g, [[0, '#f3e8cd'], [1, '#e6d6b4']], 0, 224);
  g.fillStyle = '#7b2d5b'; g.fillRect(0, 22, SW, 14); g.fillStyle = '#e8c46a'; g.fillRect(0, 36, SW, 3); g.fillRect(0, 20, SW, 2);
  g.fillStyle = '#e8c46a'; for (let x = 6; x < SW; x += 14) { g.beginPath(); g.moveTo(x, 29); g.lineTo(x + 4, 25); g.lineTo(x + 8, 29); g.lineTo(x + 4, 33); g.closePath(); g.fill(); }
  g.fillStyle = 'rgba(120,90,50,.15)'; for (const px of [112, 160, 320, 368]) { g.fillRect(px - 9, 40, 18, 184); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px - 9, 40, 4, 184); g.fillStyle = 'rgba(120,90,50,.15)'; }
  // goldene Nische
  g.save(); g.beginPath(); g.moveTo(172, 224); g.lineTo(172, 112); g.arc(240, 112, 68, PI, 0); g.lineTo(308, 224); g.closePath(); g.clip();
  const gr = g.createRadialGradient(240, 150, 6, 240, 150, 100); gr.addColorStop(0, '#fff0b8'); gr.addColorStop(0.5, '#e8c46a'); gr.addColorStop(1, '#b8862a'); g.fillStyle = gr; g.fillRect(160, 40, 160, 190);
  g.strokeStyle = 'rgba(160,110,30,.35)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 15; i++) { const a = PI + i * PI / 14; g.moveTo(240, 112); g.lineTo(240 + cos(a) * 80, 112 + sin(a) * 80); } g.stroke();
  g.restore();
  g.strokeStyle = '#f6eed8'; g.lineWidth = 6; g.beginPath(); g.moveTo(172, 224); g.lineTo(172, 112); g.arc(240, 112, 68, PI, 0); g.lineTo(308, 224); g.stroke(); g.strokeStyle = 'rgba(120,90,50,.4)'; g.lineWidth = 1; g.stroke();
  // Boden
  g.fillStyle = '#e9dcc0'; g.fillRect(0, 224, SW, 76); vgrad(g, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(150,100,70,.22)']], 224, 300);
  g.strokeStyle = 'rgba(150,110,80,.35)'; g.lineWidth = 1; g.beginPath(); for (const yy of [230, 240, 256, 278]) { g.moveTo(0, yy); g.lineTo(SW, yy); } for (let i = -8; i <= 8; i++) { g.moveTo(240 + i * 14, 224); g.lineTo(240 + i * 62, 300); } g.stroke();
  // Podest und Teppich
  paper(g, '#f4ecd8', (c) => c.rect(150, 244, 180, 12), { sy: 2.5 }); paper(g, '#efe4cc', (c) => c.rect(168, 232, 144, 12), { sy: 2.5 }); paper(g, '#f8f1de', (c) => c.rect(184, 222, 112, 10), { sy: 2.5 });
  paper(g, '#7b2d5b', (c) => { c.moveTo(226, 224); c.lineTo(254, 224); c.lineTo(290, 300); c.lineTo(190, 300); c.closePath(); }, { edgeCol: '#e8c46a', lw: 1.4, sy: 0, sx: 0, shadow: false });
  // Vordere Säulen
  column(g, 22, 276, 262, 30, '#f6efdc', '#cdbf9c'); column(g, 458, 276, 262, 30, '#f6efdc', '#cdbf9c');
}
function augustus(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm, L = 11.5, T = t % L;
  ebene(g, 'augustus', aBg6);
  for (let i = 0; i < 6; i++) funkeln(g, 190 + (i * 37) % 100, 80 + (i * 29) % 100, 2.4, max(0, sin(t * 1.6 + i * 1.7)) * 0.8);
  // Vorhänge
  for (const sd of [-1, 1]) { const x0 = sd < 0 ? 128 : 352; paper(g, '#7b2d5b', (c) => { c.moveTo(x0, 40); c.lineTo(x0 + 34, 40); for (let i = 0; i <= 8; i++) c.lineTo(x0 + 34 - i * 4.25 + sin(t * 1.3 + i + sd) * 1.5, 150 + i * 8.5 + sin(t * 1.1 + i * 0.7 + sd * 2) * 1.5 * (i / 8)); c.lineTo(x0 + 2, 224); c.lineTo(x0, 200); c.closePath(); }, { sx: sd * 2 }); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 1.2; g.beginPath(); for (let i = 1; i < 5; i++) { g.moveTo(x0 + i * 7, 42); g.lineTo(x0 + i * 6 + 2, 190); } g.stroke(); g.fillStyle = '#e8c46a'; g.fillRect(x0 + (sd < 0 ? 0 : 28), 116, 6, 6); }
  // Banner
  for (const [bx, kind] of [[62, 'spqr'], [418, 'kranz']]) {
    paper(g, '#7b2d5b', (c) => { c.moveTo(bx - 24, 44); c.lineTo(bx + 24, 44); c.lineTo(bx + 24, 124 + flut(bx, t, 1.5, 0.05, 1.8)); c.lineTo(bx, 112 + flut(bx, t, 1, 0.05, 1.8)); c.lineTo(bx - 24, 124 - flut(bx, t, 1.5, 0.05, 1.8)); c.closePath(); });
    g.strokeStyle = '#e8c46a'; g.lineWidth = 1.5; g.strokeRect(bx - 20, 48, 40, 54);
    if (kind === 'spqr') { g.fillStyle = '#f2d27a'; g.font = 'bold 13px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('S', bx, 60); g.fillText('P', bx, 73); g.fillText('Q', bx, 86); g.fillText('R', bx, 99); } else kranz(g, bx, 72, 12, 14, 0, 1);
  }
  // Lichtstrahlen
  g.fillStyle = 'rgba(255,236,170,.07)'; for (let i = 0; i < 3; i++) { const sh = sin(t * 0.3 + i) * 10; g.beginPath(); g.moveTo(210 + i * 30, 56); g.lineTo(230 + i * 30, 56); g.lineTo(190 + i * 70 + sh, 240); g.lineTo(130 + i * 70 + sh, 240); g.closePath(); g.fill(); }
  // Senatoren (Publikum)
  const cr = (x, y, s, dir, i) => roman(g, x, y, s, dir, i % 3 === 0 ? 'cheer' : 'clap', t * 2.1 + i * 1.3, { kind: 'toga', toga: pick(['#f4efe4', '#efe6d0'], i), border: i % 2 ? '#7b2d5b' : null, skin: pick(['#f0c9a4', '#e2b088', '#cf9a70'], i), hair: pick(['#b9b2a6', '#6a5a48', '#3a2a1c', '#8a8070'], i), hs: pick(['bald', 'short', 'short', 'bald'], i), shadow: false });
  cr(74, 268, 1.2, 1, 0); cr(118, 270, 1.2, 1, 1); cr(404, 268, 1.2, -1, 2); cr(362, 270, 1.2, -1, 3);
  cr(56, 296, 1.5, 1, 4); cr(110, 298, 1.5, 1, 5); cr(424, 296, 1.5, -1, 6); cr(370, 298, 1.5, -1, 7);
  // Hauptpersonen
  const worn = T >= 4.8 && T < 9.5;
  roman(g, 262, 224, 1.72, -1, 'stand', t * 1.2, { kind: 'kaiser', hat: worn ? 'laurel' : null, hair: '#b88a3e' });
  roman(g, 212, 226, 1.62, 1, 'offer', t * 1.2, { kind: 'senator', hs: 'bald' });
  // Kranz: Hand -> Kopf, dann Funkeln
  const hand = [238, 148 + sin(t * 2) * 1.2], head = [259, 129];
  if (T < 2.2 || T >= 9.5) { const a = T >= 9.5 ? sm(9.5, 10.6, T) : 1; kranz(g, hand[0], hand[1], 10, 10, -0.25, a); }
  else if (T < 4.8) { const e = smooth((T - 2.2) / 2.6), px = lerp(hand[0], head[0], e), py = lerp(hand[1], head[1] - 18, e) - sin(e * PI) * 24; kranz(g, px, py, lerp(10, 12, e), lerp(10, 12, e), lerp(-0.25, 0, e), 1); }
  if (T >= 4.8 && T < 9.5) { const n = calm ? 3 : 6; for (let i = 0; i < n; i++) { const a = max(0, sin(t * 2.2 + i * 1.9)) * (T < 6 ? 1 : 0.7); funkeln(g, head[0] + cos(i * 2.1 + t * 0.6) * 22, head[1] - 4 + sin(i * 1.7 + t * 0.5) * 16, 2 + (i % 3), a); } }
  if (T >= 9.5 && T < 10.3) for (let i = 0; i < 5; i++) funkeln(g, head[0] + cos(i * 1.3) * 12, head[1] + sin(i * 1.3) * 8, 3, (1 - (T - 9.5) / 0.8) * 0.9);
  // Blütenregen
  const nP = calm ? 12 : PET6.length;
  for (let i = 0; i < nP; i++) { const f = PET6[i], x = wrap(f[0] + sin(t * 0.8 + f[3]) * 14, -6, SW + 6), y = wrap(f[1] + t * (14 + f[2] * 10), -6, SH + 6), c = ['#e8c46a', '#a8262a', '#f4b8c0', '#7aa04a'][f[4]]; g.save(); g.translate(x, y); g.rotate(t * f[2] + f[3]); g.scale(1, 0.55 + 0.45 * sin(t * 1.7 + f[3])); g.fillStyle = c; g.beginPath(); g.ellipse(0, 0, 2.8, 1.5, 0, 0, TAU); g.fill(); g.restore(); }
}

// ---------------------------------------------------------------- 7 Markttag in Köln (um 50 n. Chr.)
function rheinschiff(g, x, y, s, dir, t, ph) {
  g.save(); g.translate(x, y + sin(t * 1.2 + ph) * 0.7); g.scale(dir * s, s);
  g.fillStyle = 'rgba(10,40,60,.25)'; g.beginPath(); g.ellipse(0, 3, 30, 2.4, 0, 0, TAU); g.fill();
  g.strokeStyle = '#5a3a1e'; g.lineWidth = 2; g.beginPath(); g.moveTo(2, -8); g.lineTo(2, -52); g.stroke(); g.lineWidth = 1.6; g.beginPath(); g.moveTo(-14, -47); g.lineTo(18, -47); g.stroke();
  const bl = sin(t * 1.4 + ph) * 1.6; paper(g, '#efe2c4', (c) => { c.moveTo(-13, -46); c.quadraticCurveTo(2 + bl, -34, 17, -46); c.lineTo(15, -22); c.quadraticCurveTo(2 + bl, -17, -11, -22); c.closePath(); }, { sy: 1.4, blur: 1.2 });
  g.fillStyle = '#a8262a'; g.beginPath(); g.moveTo(-12, -37); g.quadraticCurveTo(2 + bl, -30, 16, -37); g.lineTo(16, -33); g.quadraticCurveTo(2 + bl, -26, -12, -33); g.closePath(); g.fill();
  paper(g, '#7a5232', (c) => { c.moveTo(-30, -9); c.lineTo(-26, -15); c.quadraticCurveTo(-24, -9, -22, -9); c.lineTo(24, -9); c.quadraticCurveTo(32, -9, 34, -14); c.lineTo(32, 1); c.quadraticCurveTo(0, 5, -26, 1); c.closePath(); }, { sy: 1.5, blur: 1.5 });
  g.fillStyle = '#c99a2e'; g.fillRect(-26, -7, 56, 1.4);
  g.fillStyle = '#8a5a2a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(-14 + i * 9, -11, 3.6, 3.2, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,20,5,.5)'; g.lineWidth = 0.8; g.stroke(); }
  roman(g, -22, -4, 0.35, 1, 'stand', t, { kind: 'haendler', shadow: false });
  flag(g, 2, -52, 7, 9, t, '#2d78a8', null, { fh: 4, ph, amp: 1.2 });
  g.restore();
}
function markise(g, x, y, w, c1, c2, t, ph) {
  const n = 8, sw = w / n;
  for (let i = 0; i < n; i++) { const x0 = x - w / 2 + i * sw, off0 = flut(x0, t, 1.1, 0.12, 2.2, ph), off1 = flut(x0 + sw, t, 1.1, 0.12, 2.2, ph); g.fillStyle = i % 2 ? c2 : c1; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + sw, y); g.lineTo(x0 + sw + 2.2, y + 17 + off1); g.lineTo(x0 + sw / 2 + 2.2, y + 21 + (off0 + off1) / 2); g.lineTo(x0 + 2.2, y + 17 + off0); g.closePath(); g.fill(); }
  g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(x - w / 2, y, w, 2.4); g.strokeStyle = 'rgba(70,30,10,.4)'; g.lineWidth = 0.8; g.strokeRect(x - w / 2, y, w, 0.1);
}
function stand7(g, x, kind, t, ph, c1, c2) {
  const yb = 262;
  for (const px of [-40, 40]) { g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.6; g.beginPath(); g.moveTo(x + px, yb); g.lineTo(x + px, 212); g.stroke(); }
  g.fillStyle = 'rgba(40,20,5,.2)'; g.fillRect(x - 42, 233, 84, 12);
  roman(g, x - 8, 250, 1.0, 1, (kind === 'toepfe' ? 'stand' : 'stand'), t * 1.4 + ph, { kind: 'haendler', tunic: pick(['#6f9a7b', '#c9a05a', '#8aa0b8', '#b88a62'], ph), trim: '#3d6b52', hair: pick(['#6b3d1f', '#2a1a10', '#8a8070'], ph), shadow: false, arms: { near: [10, 6] } });
  markise(g, x, 212, 96, c1, c2, t, ph);
  paper(g, '#a9794a', (c) => c.rect(x - 41, 247, 82, 20), { sy: 2.2 }); paper(g, '#c9976a', (c) => c.rect(x - 43, 244, 86, 5), { sy: 1.2, blur: 1 });
  g.strokeStyle = 'rgba(70,40,15,.35)'; g.lineWidth = 0.9; g.beginPath(); for (let i = 1; i < 6; i++) { g.moveTo(x - 41 + i * 13.7, 249); g.lineTo(x - 41 + i * 13.7, 267); } g.stroke();
  const ty = 244;
  if (kind === 'obst') { for (let b = 0; b < 3; b++) { const bx = x - 28 + b * 28; g.fillStyle = '#b8863e'; g.beginPath(); g.moveTo(bx - 11, ty - 5); g.lineTo(bx + 11, ty - 5); g.lineTo(bx + 8, ty); g.lineTo(bx - 8, ty); g.closePath(); g.fill(); for (let k = 0; k < 6; k++) { g.fillStyle = [['#c8402a', '#e8a838', '#7aa04a'], ['#e8a838', '#c8402a', '#d6c04a'], ['#7aa04a', '#c8402a', '#e8a838']][b][k % 3]; g.beginPath(); g.arc(bx - 8 + k * 3.2, ty - 6.5 - (k % 2) * 2, 2.9, 0, TAU); g.fill(); } } }
  else if (kind === 'toepfe') { for (const [dx, h, c] of [[-30, 14, '#c0703a'], [-16, 9, '#d8a05a'], [-2, 17, '#c0703a'], [14, 8, '#e0b070'], [28, 12, '#a8562a']]) { g.fillStyle = c; g.strokeStyle = 'rgba(70,30,10,.55)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x + dx - 3, ty - h); g.lineTo(x + dx + 3, ty - h); g.quadraticCurveTo(x + dx + 8, ty - h * 0.5, x + dx + 5, ty); g.lineTo(x + dx - 5, ty); g.quadraticCurveTo(x + dx - 8, ty - h * 0.5, x + dx - 3, ty - h); g.fill(); g.stroke(); } }
  else if (kind === 'kaese') { for (let i = 0; i < 3; i++) { const cx = x - 26 + i * 26; for (let k = 0; k < 2 - (i === 1 ? 0 : 1) + 1; k++) { g.fillStyle = '#f0cf6a'; g.strokeStyle = 'rgba(120,80,10,.5)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(cx, ty - 3 - k * 5, 11, 3, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#e0b84a'; g.fillRect(cx - 11, ty - 3 - k * 5, 22, 4.4); g.strokeRect(cx - 11, ty - 3 - k * 5, 22, 4.4); } } g.fillStyle = '#c99a5a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x + 30 + i * 0, ty - 3 - i * 4, 6, 3, 0, 0, TAU); g.fill(); } }
  else { for (let i = 0; i < 5; i++) { const fx = x - 30 + i * 14, bob = sin(t * 2 + i) * 0.3; g.fillStyle = '#b8c8d8'; g.strokeStyle = 'rgba(40,60,80,.5)'; g.lineWidth = 0.7; g.beginPath(); g.ellipse(fx, ty - 3 + bob, 8, 2.8, -0.15, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#4a6a88'; g.beginPath(); g.moveTo(fx + 7, ty - 3); g.lineTo(fx + 12, ty - 6); g.lineTo(fx + 12, ty); g.closePath(); g.fill(); } }
}
function kBgA7(g) {
  ridge(g, 152, 6, 0.02, 0.4, '#8aa87a'); ridge(g, 162, 4, 0.03, 2.4, '#75986a');
  for (const x of [330, 360, 395, 420, 455, 478]) pine(g, x, 168, 26 + (x % 7), '#4a7a4a', 0, x);
}
function kBgB7(g) {
  // Stadtmauer, Tore, Türme
  paper(g, '#c9b78f', (c) => c.rect(-10, 116, 262, 92), { sy: 2.5 });
  masonry(g, -10, 116, 262, 92, 7, '#c9b78f', 'rgba(80,60,35,.3)', 9);
  g.fillStyle = '#b8a47c'; for (let x = -6; x < 250; x += 12) g.fillRect(x, 110, 7, 7);
  for (const tx of [56, 232]) { paper(g, '#d6c49c', (c) => c.rect(tx - 20, 76, 40, 132), { sy: 2.5 }); masonry(g, tx - 20, 76, 40, 132, 7, '#d6c49c', 'rgba(80,60,35,.3)', tx); paper(g, '#b8573a', (c) => { c.moveTo(tx - 25, 78); c.lineTo(tx, 48); c.lineTo(tx + 25, 78); c.closePath(); }); tiles(g, tx - 22, 70, tx + 22, 78, 3); g.fillStyle = '#3a2a22'; g.beginPath(); g.moveTo(tx - 4, 112); g.lineTo(tx - 4, 100); g.arc(tx, 100, 4, PI, 0); g.lineTo(tx + 4, 112); g.fill(); }
  // Haupttor
  paper(g, '#dccba2', (c) => c.rect(98, 92, 82, 116), { sy: 2.5 }); masonry(g, 98, 92, 82, 116, 7, '#dccba2', 'rgba(80,60,35,.28)', 3);
  g.fillStyle = '#2f2018'; g.beginPath(); g.moveTo(118, 208); g.lineTo(118, 160); g.arc(139, 160, 21, PI, 0); g.lineTo(160, 208); g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,190,100,.37)'; g.beginPath(); g.moveTo(124, 208); g.lineTo(124, 162); g.arc(139, 162, 15, PI, 0); g.lineTo(154, 208); g.closePath(); g.fill();
  paper(g, '#f6efd8', (c) => rrect(c, 112, 98, 54, 16, 2), { sy: 1.5 }); g.fillStyle = '#7a2a2a'; g.font = 'bold 9px Georgia, "Times New Roman", serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('COLONIA', 139, 106.5);
  paper(g, '#b8573a', (c) => { c.moveTo(94, 94); c.lineTo(139, 72); c.lineTo(184, 94); c.closePath(); }); tiles(g, 100, 86, 178, 94, 3);
  // Anleger rechts
  paper(g, '#cdb88c', (c) => c.rect(252, 196, 250, 18), { sy: 2 }); masonry(g, 252, 196, 250, 18, 6, '#cdb88c', 'rgba(80,60,35,.3)', 5);
  // Platz
  g.fillStyle = '#dac398'; g.fillRect(0, 208, SW, 92); vgrad(g, [[0, 'rgba(255,255,255,.15)'], [1, 'rgba(120,80,30,.2)']], 208, 300);
  g.strokeStyle = 'rgba(110,80,40,.25)'; g.lineWidth = 1; g.beginPath(); for (const yy of [218, 232, 270, 288]) { g.moveTo(0, yy); g.lineTo(SW, yy); } g.stroke();
}
function koeln(g, t0, o) {
  const t = tm(t0, o);
  vgrad(g, [[0, '#9ccfe9'], [0.7, '#e6f2e8'], [1, '#f8f0d8']], 0, 160);
  sun(g, 420, 38, 11, t, '#fff6d0', '255,240,190', 0.4);
  cloud(g, wrap(t * 3 + 80, -70, 540), 36, 1.0, '#fff', 0.9); cloud(g, wrap(t * 2.1 + 360, -70, 540), 66, 0.7, '#fff', 0.8);
  ebene(g, 'koeln-a', kBgA7);
  // Rhein
  water(g, 168, 214, t, '#6fb0c0', '#3b7c94', { glit: 18, glitA: 0.5, seed: 12, amp: 1.0 });
  rheinschiff(g, 700 - wrap(t * 8 + 120, 0, 480), 192, 0.9, -1, t, 1);
  ebene(g, 'koeln-b', kBgB7);
  for (const tx of [56, 232]) flag(g, tx, 50, 12, 12, t, '#a8262a', '#e8c46a', { fh: 6, ph: tx, amp: 1.6 });
  smoke(g, 204, 100, t, { n: 6, rise: 44, drift: 12, r0: 2, r1: 8, a: 0.4, col: '200,195,190', speed: 0.2 });
  // Marktstände
  stand7(g, 62, 'obst', t, 1, '#c8693a', '#f1e6c6'); stand7(g, 164, 'toepfe', t, 2, '#2d78a8', '#f1e6c6'); stand7(g, 266, 'kaese', t, 3, '#d9a441', '#8b2a4a'); stand7(g, 368, 'fisch', t, 4, '#4a8a5a', '#f1e6c6');
  bunting(g, 62, 190, 164, 194, 9, t, ['#a8262a', '#e8c46a', '#2d78a8'], 8, 1); bunting(g, 164, 194, 266, 190, 9, t, ['#e8c46a', '#2d78a8', '#a8262a'], 8, 2);
  // Leute
  roman(g, wrap(t * 13 + 60, -40, 520), 287, 1.3, 1, 'walk', t * 5, { kind: 'buergerin', item: 'basket' });
  roman(g, 520 - wrap(t * 9 + 100, 0, 560), 292, 1.3, -1, 'walk', t * 4.6, { kind: 'kind', h: 0.62 });
  roman(g, 322, 280, 1.3, -1, 'stand', t * 1.1, { kind: 'germane', item: 'amphora', hair: '#c88a3e' });
  roman(g, 118, 294, 1.35, 1, 'stand', t * 1.2, { kind: 'buerger', item: 'fruit', tunic: '#8aa0b8' });
  roman(g, 440, 288, 1.3, -1, 'hold', t * 1.2, { kind: 'buergerin', tunic: '#4a8a8a', item: 'tablet' });
  for (let i = 0; i < 3; i++) { const px = 214 + i * 22, pk = max(0, sin(t * 1.5 + i * 2)); g.fillStyle = '#8a8a96'; g.beginPath(); g.ellipse(px, 298 - 3, 4.4, 3, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(px + 4 + 0.5, 298 - 5 + pk * 2.6, 2, 0, TAU); g.fill(); g.fillStyle = '#d6a050'; g.fillRect(px + 6, 298 - 5 + pk * 2.6, 2, 0.8); }
}

// ---------------------------------------------------------------- 8 Ein ruhiger Morgen in Pompeji (79 n. Chr.), Vesuv ruhig, kein Rauch
const VES = [[40, 200], [100, 156], [150, 118], [196, 88], [226, 68], [244, 62], [264, 62], [280, 68], [308, 84], [348, 110], [396, 148], [450, 200]];
function hund(g, x, y, s, dir, t, ph) {
  g.save(); g.translate(x, y); g.scale(dir * s, s);
  const p = t * 9 + ph, bob = abs(sin(p)) * 1.2;
  g.strokeStyle = '#8a5a30'; g.lineWidth = 2; g.lineCap = 'round'; for (const [lx, k] of [[-7, 0], [-4, PI], [5, PI], [8, 0]]) { g.beginPath(); g.moveTo(lx, -7 - bob); g.lineTo(lx + sin(p + k) * 3.2, -max(0, cos(p + k)) * 2.2); g.stroke(); }
  paper(g, '#b07840', (c) => ellipse(c, 0, -9 - bob, 10, 5.4), { blur: 1.2, sy: 1.6 });
  g.strokeStyle = '#b07840'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-9, -11 - bob); g.quadraticCurveTo(-14, -16 + sin(t * 12) * 2, -13, -19); g.stroke();
  paper(g, '#b07840', (c) => ellipse(c, 11, -13 - bob, 4.6, 4), { blur: 1, sy: 1.2 });
  g.fillStyle = '#6a4220'; g.beginPath(); g.ellipse(9, -17 - bob, 2, 3.4, 0.5, 0, TAU); g.fill(); g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(13.4, -13.4 - bob, 1, 0, TAU); g.fill(); g.beginPath(); g.arc(11.8, -14.6 - bob, 0.8, 0, TAU); g.fill();
  g.restore();
}
function haus8(g, x, y, w, h, wall, panel, o = {}) {
  paper(g, wall, (c) => c.rect(x, y, w, h), { sx: o.sx ?? 2, sy: 2 });
  g.fillStyle = panel; g.fillRect(x, y + h * 0.5, w, h * 0.5); g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(x, y + h * 0.5, w, 2);
  g.fillStyle = 'rgba(60,30,20,.18)'; g.fillRect(x + (o.side > 0 ? 0 : w - 6), y, 6, h);
  if (o.roof !== false) paper(g, '#c8693a', (c) => { c.moveTo(x - 4, y + 2); c.lineTo(x + 4, y - 9); c.lineTo(x + w - 4, y - 9); c.lineTo(x + w + 4, y + 2); c.closePath(); }, { sy: 2 });
  if (o.roof !== false) tiles(g, x, y - 7, x + w, y + 1, 3);
}
function pBg1(g) {
  // Vesuv: ruhig, kein Rauch
  g.save(); paper(g, '#7a6fae', (c) => { c.moveTo(VES[0][0], 210); for (const p of VES) c.lineTo(p[0], p[1]); c.lineTo(450, 210); c.closePath(); }, { sy: 2 });
  g.beginPath(); g.moveTo(VES[0][0], 210); for (const p of VES) g.lineTo(p[0], p[1]); g.lineTo(450, 210); g.closePath(); g.clip();
  g.fillStyle = 'rgba(255,214,170,.3)'; g.beginPath(); g.moveTo(244, 62); g.lineTo(196, 88); g.lineTo(150, 118); g.lineTo(100, 156); g.lineTo(40, 200); g.lineTo(150, 200); g.lineTo(226, 100); g.closePath(); g.fill();
  g.fillStyle = 'rgba(50,40,100,.34)'; g.beginPath(); g.moveTo(264, 62); g.lineTo(308, 84); g.lineTo(396, 148); g.lineTo(450, 200); g.lineTo(330, 200); g.lineTo(262, 100); g.closePath(); g.fill();
  const grn = g.createLinearGradient(0, 128, 0, 200); grn.addColorStop(0, 'rgba(120,160,90,0)'); grn.addColorStop(0.35, 'rgba(120,160,90,.85)'); grn.addColorStop(1, '#6f9a54'); g.fillStyle = grn; g.fillRect(30, 128, 430, 82);
  g.strokeStyle = 'rgba(40,80,30,.35)'; g.lineWidth = 1; g.beginPath(); for (let i = 0; i < 16; i++) { g.moveTo(40 + i * 28, 200); g.lineTo(60 + i * 24, 148 + (i % 3) * 6); } g.stroke();
  g.restore();
  for (const [cx, cy, h] of [[70, 202, 22], [96, 204, 18], [420, 204, 20], [444, 202, 24]]) cypress(g, cx, cy, h, '#3f5a38', 0, cx);
  // Straße
  g.fillStyle = '#b9a67f'; g.fillRect(0, 194, SW, 106);
  paper(g, '#cdb994', (c) => { c.moveTo(236, 192); c.lineTo(268, 192); c.lineTo(520, 300); c.lineTo(-40, 300); c.closePath(); }, { shadow: false, edge: false });
  g.save(); g.beginPath(); g.moveTo(236, 192); g.lineTo(268, 192); g.lineTo(520, 300); g.lineTo(-40, 300); g.closePath(); g.clip();
  g.strokeStyle = 'rgba(100,80,50,.3)'; g.lineWidth = 1; g.beginPath(); for (let i = -10; i <= 10; i++) { g.moveTo(252 + i * 3, 192); g.lineTo(252 + i * 54, 300); } for (const yy of [200, 210, 224, 244, 272]) { g.moveTo(0, yy); g.lineTo(SW, yy); } g.stroke();
  vgrad(g, [[0, 'rgba(255,255,255,.2)'], [1, 'rgba(120,80,40,.18)']], 192, 300); g.restore();
  // Häuser links (von hinten nach vorn)
  haus8(g, 196, 150, 40, 56, '#d9b25a', '#b5452e', { side: 1 });
  haus8(g, 98, 108, 100, 98, '#e8d0a0', '#a8402a', { side: 1 });
  // Thermopolium (Imbiss): Theke mit eingelassenen Tontöpfen
  paper(g, '#3a2418', (c) => c.rect(108, 166, 80, 40), { shadow: false, edge: false });
  g.fillStyle = 'rgba(255,190,100,.18)'; g.fillRect(108, 166, 80, 40);
}
function pBg2(g) {
  paper(g, '#c9a36a', (c) => c.rect(100, 198, 94, 24), { sy: 2 }); g.fillStyle = '#d8b680'; g.fillRect(98, 195, 98, 5);
  for (let i = 0; i < 4; i++) { g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(116 + i * 22, 199, 6.4, 2.4, 0, 0, TAU); g.fill(); g.fillStyle = '#6a3a22'; g.beginPath(); g.ellipse(116 + i * 22, 200.4, 6, 1.6, 0, 0, TAU); g.fill(); }
  g.fillStyle = 'rgba(80,50,20,.35)'; g.fillRect(100, 204, 94, 2);
  for (let i = 0; i < 5; i++) { g.fillStyle = pick(['#a8262a', '#2d78a8', '#e8c46a'], i); g.fillRect(100 + i * 19, 168, 19, 3); }
  haus8(g, -14, 28, 108, 280, '#e2b351', '#b5452e', { side: 1 });
  paper(g, '#7b4a2a', (c) => { c.moveTo(34, 300); c.lineTo(34, 224); c.arc(54, 224, 20, PI, 0); c.lineTo(74, 300); c.closePath(); }, { sy: 1.5 }); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(52, 210, 2, 90);
  for (const wx of [14, 66]) { paper(g, '#3a2418', (c) => rrect(c, wx, 74, 18, 26, 3), { blur: 1 }); g.fillStyle = '#e8d0a0'; g.fillRect(wx - 2, 100, 22, 3); }
  g.fillStyle = '#a8402a'; g.fillRect(-4, 118, 100, 6);
  // Wäscheleine
  g.strokeStyle = 'rgba(70,40,20,.7)'; g.lineWidth = 1; g.beginPath(); g.moveTo(198, 128); g.quadraticCurveTo(250, 146, 300, 130); g.stroke();
  // Häuser rechts
  haus8(g, 268, 152, 40, 54, '#e8d0a0', '#b5452e', { side: -1 });
  haus8(g, 300, 104, 100, 102, '#d9b25a', '#a8402a', { side: -1 });
  for (const wx of [316, 366]) { paper(g, '#3a2418', (c) => rrect(c, wx, 140, 16, 24, 3), { blur: 1 }); g.fillStyle = '#b5452e'; g.fillRect(wx - 2, 164, 20, 3); }
  g.fillStyle = '#2f6a4a'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(318 + i * 3.4, 163, 2.3, 0, TAU); g.fill(); }
  haus8(g, 396, 30, 100, 280, '#c0553a', '#e2b351', { side: -1 });
  paper(g, '#7b4a2a', (c) => { c.moveTo(422, 300); c.lineTo(422, 214); c.arc(442, 214, 20, PI, 0); c.lineTo(462, 300); c.closePath(); }, { sy: 1.5 });
  for (const wx of [410, 454]) { paper(g, '#3a2418', (c) => rrect(c, wx, 70, 20, 30, 3), { blur: 1 }); g.fillStyle = '#f0e0c0'; g.fillRect(wx - 2, 100, 24, 3); }
  // Trittsteine
  for (const [sy2, sw2, xs] of [[226, 14, [239, 265]], [274, 28, [214, 290]]]) for (const sxx of xs) { paper(g, '#a8a090', (c) => rrect(c, sxx - sw2 / 2, sy2 - sw2 * 0.5, sw2, sw2 * 0.6, 2), { sy: 2.2 }); g.fillStyle = '#c8c0b0'; g.fillRect(sxx - sw2 / 2 + 1, sy2 - sw2 * 0.5, sw2 - 2, sw2 * 0.24); }
}
function pompeji(g, t0, o) {
  const t = tm(t0, o);
  vgrad(g, [[0, '#86c2ea'], [0.5, '#f5e6c4'], [1, '#fbd4a0']], 0, 200);
  sun(g, 392, 104, 13, t, '#fff0bc', '255,226,150', 0.55, 14);
  cloud(g, wrap(t * 2.6 + 40, -70, 540), 40, 0.9, '#fff', 0.85); cloud(g, wrap(t * 1.8 + 380, -70, 540), 24, 0.6, '#fff', 0.75);
  ebene(g, 'pompeji-1', pBg1);
  roman(g, 138, 206, 0.85, 1, 'stand', t * 1.3, { kind: 'haendler', tunic: '#c9a05a', shadow: false, hat: null, hs: 'short', arms: { near: [10, 4] }, item: 'tablet' });
  ebene(g, 'pompeji-2', pBg2);
  for (const [lx, c] of [[222, '#f4efe4'], [250, '#a8262a'], [276, '#e8c46a']]) { const ly = 134 + sin((lx - 198) / 102 * PI) * 5; g.fillStyle = c; g.beginPath(); g.moveTo(lx - 5, ly); g.lineTo(lx + 5, ly); g.lineTo(lx + 6 + sin(t * 2 + lx) * 1.4, ly + 15); g.lineTo(lx - 6 + sin(t * 2 + lx) * 1.4, ly + 15); g.closePath(); g.fill(); }
  // Brunnen mit Wasserstrahl
  paper(g, '#bdb3a0', (c) => ellipse(c, 354, 276, 30, 9), { sy: 2.5 }); paper(g, '#cfc7b4', (c) => ellipse(c, 354, 272, 26, 7), { sy: 0 });
  g.fillStyle = '#6fb6cc'; g.beginPath(); g.ellipse(354, 272, 23, 5.6, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(354 + sin(t) * 2, 272, 14 + 3 * sin(t * 1.4), 3.2, 0, 0, TAU); g.stroke();
  paper(g, '#a8a090', (c) => c.rect(351, 246, 6, 26), { sy: 1.5, blur: 1 });
  for (let k = 0; k < 14; k++) { const p = (t * 0.8 + k / 14) % 1, dx = (p - 0.5) * 2 * 14; g.fillStyle = `rgba(210,240,250,${0.9 - p * 0.5})`; g.beginPath(); g.arc(354 + dx, 246 + (1 - 4 * (p - 0.5) ** 2) * -14 + p * p * 26 * 0.5 + 14, 1.4, 0, TAU); g.fill(); }
  // Menschen
  roman(g, 322, 282, 1.25, 1, 'stand', t * 1.1, { kind: 'buergerin', item: 'amphora', tunic: '#c8795a' });
  roman(g, 394, 290, 1.3, -1, 'stand', t * 1.3, { kind: 'buergerin', tunic: '#8aa0b8', trim: '#f0e0c0', hs: 'bun' });
  roman(g, 296, 296, 1.35, -1, 'stand', t * 1.0, { kind: 'kind', h: 0.62 });
  roman(g, 176, 292, 1.28, -1, 'stand', t * 1.2, { kind: 'buerger', tunic: '#8aa07a', item: 'tablet' });
  const bx = wrap(t * 10, -30, 520); roman(g, bx, 298, 1.3, 1, 'walk', t * 5.2, { kind: 'haendler', item: 'basket', tunic: '#d8b078', hat: null });
  const dxx = wrap(t * 17 + 200, -40, 520); hund(g, dxx, 297, 1.0, 1, t, 0); roman(g, dxx - 30, 298, 1.1, 1, 'walk', t * 8, { kind: 'kind', h: 0.62, head: 1.3 });
  for (let i = 0; i < 4; i++) bird(g, 230 + cos(t * 0.3 + i * 1.6) * 60, 40 + i * 10 + sin(t * 0.3 + i * 1.6) * 8, 0.8, t, i, 'rgba(255,255,255,.95)');
}

// ---------------------------------------------------------------- 9 Das Kolosseum wird eröffnet (80 n. Chr.): nur Außenansicht, Festmenge
const K9 = (() => { const NB = 13, TH = 74, cx = 272, R = 200, bays = []; const xs = []; for (let j = 0; j <= NB; j++) { const th = (-TH + 2 * TH * j / NB) * PI / 180; xs.push([cx + R * sin(th), th]); } for (let j = 0; j < NB; j++) bays.push({ x0: xs[j][0], x1: xs[j + 1][0], th: (xs[j][1] + xs[j + 1][1]) / 2, j }); return { NB, bays, xs, cx, R }; })();
const CONF9 = Array.from({ length: 34 }, () => [RND() * SW, RND() * SH, 0.5 + RND() * 0.9, RND() * 6, floor(RND() * 5)]);
const topOf = (th) => 58 + (1 - cos(th)) * 9, botOf = (th) => 216 - (1 - cos(th)) * 6;
function kolBg(g) {
  // Baukörper: Rundung durch Verkürzung der Bögen zu den Rändern
  paper(g, '#e2cc9c', (c) => { c.moveTo(K9.xs[0][0], topOf(K9.xs[0][1])); for (const [x, th] of K9.xs) c.lineTo(x, topOf(th)); for (let j = K9.NB; j >= 0; j--) c.lineTo(K9.xs[j][0], botOf(K9.xs[j][1])); c.closePath(); }, { sy: 3, blur: 4 });
  g.save(); g.beginPath(); g.moveTo(K9.xs[0][0], topOf(K9.xs[0][1])); for (const [x, th] of K9.xs) g.lineTo(x, topOf(th)); for (let j = K9.NB; j >= 0; j--) g.lineTo(K9.xs[j][0], botOf(K9.xs[j][1])); g.closePath(); g.clip();
  const tierF = [0, 0.17, 0.4, 0.66, 1];
  for (const b of K9.bays) {
    const top = topOf(b.th), bot = botOf(b.th), H = bot - top, w = b.x1 - b.x0, ty = tierF.map((f) => top + f * H), ct = cos(b.th);
    g.fillStyle = (b.j % 2) ? '#e8d4a6' : '#e2cc9c'; g.fillRect(b.x0, top, w, H);
    for (let tr = 1; tr <= 3; tr++) {
      const y0 = ty[tr], y1 = ty[tr + 1], th = y1 - y0, ax0 = b.x0 + w * 0.17, ax1 = b.x1 - w * 0.17, r = (ax1 - ax0) / 2, ya = y0 + th * 0.2 + r * 0.2;
      const center = b.j === 6 && tr === 3;
      g.beginPath(); g.moveTo(ax0, y1 - (tr === 3 ? 0 : th * 0.07)); g.lineTo(ax0, ya + r); g.arc((ax0 + ax1) / 2, ya + r, r, PI, 0); g.lineTo(ax1, y1 - (tr === 3 ? 0 : th * 0.07)); g.closePath();
      if (center) { const gr = g.createLinearGradient(0, ya, 0, y1); gr.addColorStop(0, '#ffe3a0'); gr.addColorStop(1, '#a8702a'); g.fillStyle = gr; } else g.fillStyle = tr === 1 ? '#8a6a46' : '#5e4630';
      g.fill();
      if (!center && tr < 3 && b.j % 2 === 0) { g.fillStyle = '#f2ecdc'; g.beginPath(); g.ellipse((ax0 + ax1) / 2, y1 - th * 0.3, max(1.2, r * 0.32), th * 0.26, 0, 0, TAU); g.fill(); g.beginPath(); g.arc((ax0 + ax1) / 2, y1 - th * 0.58, max(1, r * 0.2), 0, TAU); g.fill(); }
      if (tr === 3 || true) { g.fillStyle = 'rgba(70,45,25,.3)'; g.fillRect(b.x0, y0 - 1.2, w, 2.4); }
    }
    g.fillStyle = '#4e3b2a'; g.fillRect(b.x0 + w * 0.34, ty[0] + H * 0.045, w * 0.32, H * 0.075);
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(b.x0 + 0.5, top, max(1.6, w * 0.13), H);
  }
  g.fillStyle = 'rgba(70,45,20,.1)'; for (let j = 0; j <= K9.NB; j++) g.fillRect(K9.xs[j][0] - 1, topOf(K9.xs[j][1]), 2, botOf(K9.xs[j][1]) - topOf(K9.xs[j][1]));
  const sh = g.createLinearGradient(K9.xs[0][0], 0, K9.xs[K9.NB][0], 0); sh.addColorStop(0, 'rgba(70,35,15,.34)'); sh.addColorStop(0.4, 'rgba(70,35,15,0)'); sh.addColorStop(0.7, 'rgba(70,35,15,0)'); sh.addColorStop(1, 'rgba(70,35,15,.4)'); g.fillStyle = sh; g.fillRect(0, 40, SW, 190);
  g.restore();
  for (let j = 1; j < K9.NB - 1; j++) { const [x0, th0] = K9.xs[j], [x1, th1] = K9.xs[j + 1], yA = topOf(th0) + (botOf(th0) - topOf(th0)) * 0.66, yB = topOf(th1) + (botOf(th1) - topOf(th1)) * 0.66; g.strokeStyle = '#5f9a4a'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); for (let i = 0; i <= 8; i++) { const f = i / 8; const px = lerp(x0, x1, f), py = lerp(yA, yB, f) + sin(f * PI) * 4; i ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke(); g.fillStyle = '#e8c46a'; for (let i = 1; i < 8; i += 2) { const f = i / 8; g.beginPath(); g.arc(lerp(x0, x1, f), lerp(yA, yB, f) + sin(f * PI) * 4, 1.1, 0, TAU); g.fill(); } }
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 1.4; for (const [x, th] of K9.xs) { g.beginPath(); g.moveTo(x, topOf(th)); g.lineTo(x, topOf(th) - 9); g.stroke(); }
  // Platz
  g.fillStyle = '#d8c9a4'; g.fillRect(0, 216, SW, 84); vgrad(g, [[0, 'rgba(80,50,20,.28)'], [0.2, 'rgba(255,255,255,0)'], [1, 'rgba(120,80,40,.2)']], 216, 300);
  g.strokeStyle = 'rgba(110,80,40,.25)'; g.lineWidth = 1; g.beginPath(); for (const yy of [230, 248, 272]) { g.moveTo(0, yy); g.lineTo(SW, yy); } g.stroke();
  // Riesenstatue (Koloss) links daneben
  { const sx = 30, sy = 238, ss = 2.15; paper(g, '#bfae88', (c) => rrect(c, sx - 24, sy - 12, 52, 14, 2), { sy: 3 }); const hx = sx + 1.9 * ss * 0.97, hy = sy - 12 - 54.7 * ss * 0.97;
    for (let i = 0; i < 9; i++) { const a = -PI + i * PI / 8 - 0.0; g.fillStyle = '#e0b448'; g.beginPath(); g.moveTo(hx + cos(a) * 15, hy + sin(a) * 15); g.lineTo(hx + cos(a + 0.12) * 28, hy + sin(a + 0.12) * 28); g.lineTo(hx + cos(a - 0.12) * 28, hy + sin(a - 0.12) * 28); g.closePath(); g.fill(); }
    roman(g, sx, sy - 12, ss * 0.97, 1, 'stand', 0, { kind: 'toga', toga: '#b98a3a', tunic: '#a67a30', border: null, skin: '#cf9a42', hair: '#8a6a22', hs: 'curly', shoes: 'shoe', shadow: false, item: null, arms: { near: [2, 18.5], far: [-2, 18.5] } });
    g.fillStyle = 'rgba(255,240,170,.25)'; g.beginPath(); g.ellipse(sx - 2, sy - 90, 12, 40, 0.1, 0, TAU); g.fill(); }
}
function kolosseum(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm;
  vgrad(g, [[0, '#72b4e6'], [0.65, '#cfe6f4'], [1, '#f8eed2']], 0, 220);
  sun(g, 430, 34, 12, t, '#fff6cc', '255,240,180', 0.5, 12);
  cloud(g, wrap(t * 3 + 60, -70, 540), 26, 0.9, '#fff', 0.9); cloud(g, wrap(t * 2.2 + 280, -70, 540), 52, 0.65, '#fff', 0.8);
  ebene(g, 'kolosseum', kolBg);
  K9.bays.forEach((b, i) => { if (i % 2 === 1 || i === 0 || i === K9.NB - 1) return; const w = b.x1 - b.x0, top = topOf(b.th), H = botOf(b.th) - top, cxb = (b.x0 + b.x1) / 2, fy = top + H * 0.4 + 2, c = ['#a8262a', '#7b2d5b', '#2d78a8'][(i / 2) % 3 | 0]; g.fillStyle = c; g.beginPath(); g.moveTo(cxb - w * 0.2, fy); g.lineTo(cxb + w * 0.2, fy); g.lineTo(cxb + w * 0.2 + sin(t * 2.2 + i) * 1.2, fy + H * 0.2); g.lineTo(cxb, fy + H * 0.17); g.lineTo(cxb - w * 0.2 + sin(t * 2.2 + i) * 1.2, fy + H * 0.2); g.closePath(); g.fill(); g.fillStyle = '#e8c46a'; g.fillRect(cxb - w * 0.2, fy, w * 0.4, 1.6); });
  // Sonnensegel (Velarium) am oberen Rand angedeutet
  g.fillStyle = 'rgba(250,240,212,.92)'; g.beginPath(); g.moveTo(K9.xs[1][0], topOf(K9.xs[1][1]) - 9); for (let j = 1; j < K9.NB; j++) { const [x, th] = K9.xs[j + 1 <= K9.NB ? j + 1 : j], y = topOf(th) - 9; const [xp, thp] = K9.xs[j]; g.quadraticCurveTo((xp + x) / 2, (topOf(thp) + topOf(th)) / 2 - 17 + sin(t * 1.4 + j) * 1.4, x, y); } for (let j = K9.NB - 1; j >= 1; j--) g.lineTo(K9.xs[j + 1][0] - 0.1, topOf(K9.xs[j + 1][1]) + 2); g.lineTo(K9.xs[1][0], topOf(K9.xs[1][1]) + 2); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(140,100,60,.45)'; g.lineWidth = 0.8; g.beginPath(); for (let j = 1; j < K9.NB; j += 1) { g.moveTo(K9.xs[j][0], topOf(K9.xs[j][1]) - 9); g.lineTo(K9.xs[j][0] + (j < 6 ? 5 : -5), topOf(K9.xs[j][1]) - 15 - sin(j) * 2); } g.stroke();
  for (const [fx, fy, c] of [[K9.xs[3][0], topOf(K9.xs[3][1]) - 9, '#a8262a'], [K9.xs[10][0], topOf(K9.xs[10][1]) - 9, '#a8262a'], [K9.xs[6][0] + 14, topOf(0) - 9, '#e8c46a']]) flag(g, fx, fy, 16, 14, t, c, '#e8c46a', { fh: 7, ph: fx, amp: 2 });
  // Festmenge
  const kinds = ['buerger', 'toga', 'buergerin', 'buerger', 'kind', 'toga', 'buergerin', 'haendler'];
  for (let i = 0; i < 9; i++) {
    const fromLeft = i % 2 === 0, base = (i * 61.3) % 1, u = (t * 0.022 + base) % 1, ex = 272, x = fromLeft ? lerp(-30, ex - 6, u) : lerp(510, ex + 6, u), y = 252 + (i % 3) * 20 + (i % 2) * 4, sc = 0.98 + (y - 252) / 90;
    const a = sm(0, 0.05, u) * (1 - sm(0.8, 0.97, u)), k = kinds[i % kinds.length];
    g.globalAlpha = a; roman(g, x, y, sc, fromLeft ? 1 : -1, (i % 4 === 1) ? 'walk' : 'walk', t * 5 + i * 1.3, { kind: k, tunic: pick(TUN2, i), toga: k === 'toga' ? '#f2ead8' : undefined, skin: pick(SK2, i), hair: pick(['#4a2f1d', '#2a1a10', '#6b4a2a', '#8a8070'], i), item: i === 3 ? 'fruit' : undefined, h: k === 'kind' ? 0.66 : undefined }); g.globalAlpha = 1;
  }
  roman(g, 120, 278, 1.3, 1, 'raise', t * 2.2, { kind: 'buerger', up: 1, tunic: '#c8795a' }); roman(g, 148, 282, 1.05, 1, 'stand', t, { kind: 'kind', h: 0.62 });
  roman(g, 420, 280, 1.3, -1, 'cheer', t * 2.4, { kind: 'buergerin' }); roman(g, 448, 284, 1.2, -1, 'raise', t * 2, { kind: 'toga', up: 1, toga: '#f2ead8' });
  // Tauben und Konfetti
  for (let i = 0; i < 6; i++) { const p = (t * 0.06 + i / 6) % 1; bird(g, lerp(210, 480, p) + sin(i * 3) * 18, lerp(70, 6, p) + sin(t * 0.9 + i) * 5, 0.85, t, i, 'rgba(255,255,255,.96)'); }
  const nC = calm ? 12 : CONF9.length;
  for (let i = 0; i < nC; i++) { const f = CONF9[i], x = wrap(f[0] + sin(t * 0.9 + f[3]) * 12, -6, SW + 6), y = wrap(f[1] + t * (16 + f[2] * 12), -6, SH + 6); g.save(); g.translate(x, y); g.rotate(t * f[2] * 1.4 + f[3]); g.scale(1, 0.4 + 0.6 * abs(sin(t * 1.6 + f[3]))); g.fillStyle = ['#e8c46a', '#a8262a', '#2d78a8', '#f4b8c0', '#7aa04a'][f[4]]; g.fillRect(-2, -1.2, 4, 2.4); g.restore(); }
}

// ---------------------------------------------------------------- Landkarte (für 117 und 395): Papierschnitt-Karte des Mittelmeerraums
// Länge/Breite -> Bild: grob gleichabständig; Meere werden als „ausgeschnittene“ Flächen auf Pergament gemalt.
const MX = (lon) => 40 + (lon + 11) * 6.55, MY = (lat) => 20 + (59 - lat) * 7.7;
const mp = (arr) => arr.map(([lo, la]) => [MX(lo), MY(la)]);
const SEA_MED = mp([[-14, 61], [24, 61], [24, 57.5], [21.2, 57], [21.2, 55.4], [19.8, 54.4], [18.4, 54.8], [16.5, 54.2], [14.2, 53.9], [11.6, 54.2], [10.4, 54.4], [8.9, 54], [8.6, 53.6], [7.2, 53.5], [5.4, 53.3], [4.8, 52.9], [4.4, 52.2], [3.6, 51.5], [2.5, 51.1], [1.6, 50.9], [1.4, 50], [0.1, 49.7], [-1.3, 49.7], [-1.6, 48.7], [-3, 48.8], [-4.7, 48.5], [-4.5, 47.8], [-2.4, 47.3], [-1.2, 46], [-1.2, 44.7], [-1.8, 43.4], [-3.8, 43.5], [-8, 43.7], [-9.3, 43], [-9.2, 41.5], [-8.9, 40.2], [-9.5, 38.8], [-8.9, 37], [-7.4, 37.2], [-6.3, 36.6], [-5.6, 36], [-5.35, 36.1], [-4.4, 36.7], [-2.2, 36.8], [-0.8, 37.6], [0.2, 38.7], [-0.3, 39.5], [0.5, 40.5], [1.2, 41.1], [2.2, 41.4], [3.2, 41.9], [3.1, 43.3], [4.5, 43.4], [6, 43.1], [7.4, 43.7], [8.8, 44.4], [9.8, 44.1], [10.3, 43.6], [11.1, 42.4], [12.2, 41.8], [13.1, 41.2], [14.2, 40.8], [15.6, 40], [15.7, 39.5], [16.1, 38.7], [15.7, 38], [16.5, 38.4], [17.1, 39], [16.6, 39.7], [17.2, 40.4], [18.4, 40.1], [17.9, 40.7], [16.8, 41.1], [16, 41.9], [14.3, 42.3], [13.5, 43.6], [12.3, 44.2], [12.4, 45.2], [13.7, 45.6], [14.5, 45.2], [15.2, 44], [16.5, 43.2], [17.5, 42.8], [18.5, 42.4], [19.4, 41.9], [19.5, 40.5], [20, 39.7], [20.7, 39], [21.1, 38.3], [21.4, 37.4], [21.7, 36.8], [22.4, 36.5], [23.2, 36.4], [22.8, 37.4], [23.2, 37.9], [24, 37.7], [23.6, 38.3], [22.8, 39], [23.2, 39.9], [23.7, 40.5], [24.4, 40.7], [26, 40.8], [26.4, 40.2], [26.2, 39.6], [26.7, 39.2], [27.1, 38.4], [27.3, 37.2], [28.4, 36.7], [29.5, 36.2], [30.6, 36.8], [31.9, 36.3], [33.6, 36.2], [34.7, 36.8], [36.2, 36.8], [36, 35.9], [35.8, 34.6], [35.1, 33.3], [34.9, 32.2], [34.3, 31.3], [32.9, 31.2], [31.8, 31.4], [30, 31.2], [29, 30.9], [27, 31], [25, 31.6], [24, 32.6], [22, 33], [20.2, 32.2], [19.4, 30.8], [18.5, 30.2], [16.5, 31], [15, 32.4], [13.2, 32.9], [11, 33.5], [10.2, 34.2], [10.6, 35.6], [11, 37], [10.2, 37.3], [8.8, 36.9], [6, 36.9], [3, 36.8], [0, 35.9], [-1.4, 35.3], [-2.6, 35.2], [-5.3, 35.9], [-5.9, 35.8], [-6.8, 34], [-8.5, 33.2], [-9.7, 31], [-9.9, 29.5], [-11.5, 28.2], [-14, 27.5], [-14, 22]]);
const SEA_BLACK = mp([[28, 41.9], [28, 43.5], [28.7, 44.2], [29.7, 45.2], [30.6, 46.4], [32.4, 46.2], [33.4, 45.4], [34.4, 44.5], [36.2, 45.1], [37.4, 45.2], [38.2, 44.6], [39.7, 43.4], [41.5, 42], [41.6, 41.5], [40, 40.9], [38, 41], [36.6, 41.3], [35.1, 42], [33.5, 42], [31.5, 41.2], [29.2, 41.2]]);
const SEA_CASP = mp([[53, 47], [49.5, 46.6], [47.7, 45.6], [47.4, 44], [48.3, 42.1], [49.7, 40.3], [49.1, 38.5], [50.6, 37], [53, 36.5]]);
const SEA_GULF = mp([[54, 32], [50, 30.4], [48.7, 30.2], [48, 29.8], [48.5, 29.2], [50.5, 28.6], [54, 27.5]]);
const SEA_RED = mp([[32.35, 30.05], [32.85, 29.85], [33.5, 28.4], [34.4, 27.5], [35.2, 26.8], [36.2, 25.6], [37, 24.6], [38.5, 24], [38.5, 22], [37, 22], [35.6, 24.6], [34.5, 26.3], [33.6, 27.5], [33, 28.8], [32.6, 29.6]]);
const ISL = {
  britannien: mp([[-5.7, 50.1], [-3.5, 50.4], [-1, 50.8], [1.4, 51.1], [1.7, 52.5], [0.3, 53.3], [-0.2, 53.8], [-1.5, 55], [-1.8, 56], [-2, 57.5], [-3.4, 58.6], [-5, 58.6], [-6.2, 57.5], [-5.6, 56.2], [-4.9, 55], [-3.2, 54.8], [-3, 53.5], [-4.6, 53.3], [-4.3, 52.4], [-5.3, 51.7], [-3.2, 51.4], [-4.3, 51], [-5.7, 50.1]]),
  irland: mp([[-10.3, 51.8], [-6.3, 52.2], [-6, 53.5], [-5.8, 54.5], [-7.5, 55.2], [-9.5, 54.2], [-10.3, 52.6]]),
  sizilien: mp([[12.4, 37.9], [13.5, 38.2], [15.6, 38.3], [15.1, 37], [15.2, 36.7], [14.3, 37], [12.6, 37.6]]),
  sardinien: mp([[8.2, 41], [9.6, 41.1], [9.8, 39.2], [9, 38.9], [8.4, 39.5]]),
  korsika: mp([[8.6, 42.5], [9.4, 43], [9.5, 41.4], [8.8, 41.6]]),
  kreta: mp([[23.5, 35.4], [26.3, 35.3], [26.2, 35], [24, 35.1]]),
  zypern: mp([[32.3, 35], [34.6, 35.7], [34, 34.9], [32.5, 34.6]]),
  daenemark: mp([[8.2, 54.9], [8.1, 57], [10.4, 57.7], [10.7, 56.6], [10, 55]]),
  krim: mp([[32.5, 45.4], [33.5, 44.6], [35, 44.8], [36.5, 45.3], [35.4, 45.6], [33.8, 46]]),
};
const EMP117 = mp([[4.2, 52], [6.2, 51.9], [6.9, 51.3], [7.6, 50.4], [8.5, 50.2], [9.3, 49.6], [9.8, 49], [10.9, 48.9], [12.1, 49], [13.5, 48.5], [15, 48.3], [16.9, 48.2], [18.9, 47.8], [19.2, 46.2], [20.8, 45.2], [22.5, 44.8], [22.7, 45.6], [22.3, 46.8], [23.6, 47.7], [25.4, 47.9], [26.8, 47], [27.4, 45.8], [28.5, 45.2], [30, 45.2], [36, 44.2], [40.2, 41.4], [41, 39.6], [39.8, 37.4], [40.5, 35.4], [41, 34.2], [39.6, 32.3], [38.8, 30.6], [38.5, 28.5], [38, 26.5], [37, 25.2], [36, 24.5], [33, 24.5], [31, 26], [28, 28.2], [25, 29.2], [22, 30.2], [19, 30.4], [16, 30.6], [13.2, 30.4], [10.6, 32.2], [9.4, 33.6], [6.5, 33.9], [3.2, 33.4], [0, 32.6], [-2.2, 32.2], [-5, 31.6], [-7.5, 31.4], [-9.6, 30.4], [-12, 35], [-12, 44], [-9, 44], [-6, 48.5], [-3, 50], [0, 51.5], [2, 51.5]]);
const EMP395 = mp([[4.2, 52], [6.2, 51.9], [6.9, 51.3], [7.2, 50.3], [7.9, 49.2], [7.6, 47.6], [9.5, 47.6], [10.1, 48.4], [12.1, 49], [13.5, 48.5], [15, 48.3], [16.9, 48.2], [18.9, 47.8], [19.2, 46.2], [20.8, 45.2], [22.5, 44.8], [25, 43.9], [27.5, 44.1], [29.5, 45.2], [41.5, 42], [42.4, 40.6], [42, 39], [41, 38], [40.5, 37], [40.2, 36.5], [40, 35.5], [40.5, 35.1], [39, 33.5], [38, 32], [37, 30.5], [36, 29.5], [35, 28], [36, 24.5], [33, 24.5], [31, 26], [28, 28.2], [25, 29.2], [22, 30.2], [19, 30.4], [16, 30.6], [13.2, 30.4], [10.6, 32.2], [9.4, 33.6], [6.5, 33.9], [3.2, 33.4], [0, 32.6], [-2.2, 32.2], [-5, 31.6], [-7.5, 31.4], [-9.6, 30.4], [-12, 35], [-12, 44], [-9, 44], [-6, 48.5], [-3, 50], [0, 51.5], [2, 51.5]]);
const WESTHALF = mp([[-20, 66], [20.5, 66], [20.5, 45.5], [19.6, 44.3], [19.2, 43], [19.4, 41.9], [18.8, 38], [18.8, 34], [19, 30.4], [19, 18], [-20, 18]]);
const EASTHALF = mp([[20.5, 66], [80, 66], [80, 18], [19, 18], [19, 30.4], [18.8, 34], [18.8, 38], [19.4, 41.9], [19.2, 43], [19.6, 44.3], [20.5, 45.5]]);
const CUT = mp([[20.5, 45.5], [19.6, 44.3], [19.2, 43], [19.4, 41.9], [18.8, 38], [18.8, 34], [19, 30.4]]);
const RIV = [mp([[8.2, 47.6], [7.6, 48.5], [8.4, 49.9], [6.9, 51.2], [6.2, 51.8], [4.4, 52]]), mp([[8.5, 48], [12, 48.8], [17, 48.1], [19, 47.4], [19.1, 45.3], [22, 44.6], [25, 43.9], [27.5, 44.2], [29.2, 45.2]]), mp([[32.2, 24.5], [31, 26.5], [30.8, 28.5], [31.2, 30.5], [31.6, 31.4]]), mp([[38.5, 36.8], [40, 35.3], [42, 34], [44.2, 32.4], [46, 31], [47.8, 30.2]]), mp([[40.6, 38.2], [43, 36.6], [44.4, 33.3], [45.6, 32.2], [47.8, 30.5]])];
const trace = (c, pts) => { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); };
const ROME = [MX(12.5), MY(41.9)];
const PARCH = (c) => { const x0 = 12, y0 = 8, x1 = 468, y1 = 292; c.moveTo(x0, y0); for (let x = x0; x <= x1; x += 12) c.lineTo(x, y0 + sin(x * 0.31) * 1.2); for (let y = y0; y <= y1; y += 12) c.lineTo(x1 + sin(y * 0.27 + 1) * 1.3, y); for (let x = x1; x >= x0; x -= 12) c.lineTo(x, y1 + sin(x * 0.29 + 2) * 1.2); for (let y = y1; y >= y0; y -= 12) c.lineTo(x0 + sin(y * 0.33 + 3) * 1.3, y); c.closePath(); };
function etikett(g, txt, x, y, sz = 8, col = 'rgba(70,35,20,.85)', spacing = 0, halo = 'rgba(245,232,200,.9)') {
  g.save(); g.font = `italic ${sz}px Georgia, "Times New Roman", serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; if (spacing) g.letterSpacing = spacing + 'px';
  g.lineWidth = 2.6; g.strokeStyle = halo; g.lineJoin = 'round'; g.strokeText(txt, x, y); g.fillStyle = col; g.fillText(txt, x, y); g.restore();
}
function tisch(g, t) {
  vgrad(g, [[0, '#4a2a1a'], [1, '#2e1a10']]);
  g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1; for (let i = 0; i < 16; i++) { g.beginPath(); g.moveTo(0, 8 + i * 19); for (let x = 0; x <= SW; x += 40) g.lineTo(x, 8 + i * 19 + sin(x * 0.02 + i) * 2.5); g.stroke(); }
}
const SEAS = [[SEA_MED, '#3f84b0', '#2a5f8a'], [SEA_BLACK, '#3a7aa8', '#2a5a84'], [SEA_CASP, '#4a86b0', '#336d98'], [SEA_GULF, '#3f84b0', '#2a5f8a'], [SEA_RED, '#3f84b0', '#2a5f8a']];
const GLIT = (() => { const r = rng(3), a = []; for (let i = 0; i < 46; i++) a.push([r() * SW, r() * SH, 6 + r() * 12, r() * 6]); return a; })();
const ROMAN_ISL = ['sizilien', 'sardinien', 'korsika', 'kreta', 'zypern', 'britannien'];
// Karte zeichnen. emp: Umriss des Reiches; grow 0..1: Radius der Ausbreitung um Rom; tint: Füllfarbe; ta: Deckkraft der Reichsfläche
function karte(g, t, opt) {
  const { emp, grow = 1, tint = 'rgba(139,42,74,.62)', edge = '#e8c46a', ta = 1 } = opt;
  ebene(g, 'kA', (c) => { paper(c, '#f0e2bc', PARCH, { sy: 3.5, sx: 2, blur: 6, shCol: 'rgba(0,0,0,.5)', edgeCol: 'rgba(255,240,200,.55)' }); c.save(); c.beginPath(); PARCH(c); c.clip(); vgrad(c, [[0, '#f4e8c6'], [1, '#e8d6a6']], 8, 292); c.restore(); });
  g.save(); g.beginPath(); PARCH(g); g.clip();
  const R = 640 * grow;
  // Reich (Fläche) und Grenzlinie mit laufenden Strichen
  g.save(); g.beginPath(); g.arc(ROME[0], ROME[1], R, 0, TAU); g.clip();
  g.globalAlpha = ta; g.fillStyle = tint; g.beginPath(); trace(g, emp); g.fill();
  g.setLineDash([5, 3]); g.lineDashOffset = -t * 6; g.strokeStyle = edge; g.lineWidth = 1.6; g.beginPath(); trace(g, emp); g.stroke();
  g.restore();
  // Meere: ausgeschnitten, mit innerem Schatten am Rand (Ebene), dazu glitzernde Striche
  ebene(g, 'kB', (c) => {
    c.save(); c.beginPath(); PARCH(c); c.clip();
    for (const [pts, a, b] of SEAS) { c.save(); c.beginPath(); trace(c, pts); c.clip(); const gr = c.createLinearGradient(0, 0, 0, SH); gr.addColorStop(0, a); gr.addColorStop(1, b); c.fillStyle = gr; c.fill(); c.strokeStyle = 'rgba(8,30,60,.5)'; c.lineWidth = 7; c.stroke(); c.strokeStyle = 'rgba(8,30,60,.25)'; c.lineWidth = 3; c.stroke(); c.restore(); }
    c.strokeStyle = 'rgba(240,226,188,.8)'; c.lineWidth = 1; for (const [pts] of SEAS) { c.beginPath(); trace(c, pts); c.stroke(); }
    c.restore();
  });
  g.save(); g.beginPath(); for (const [pts] of SEAS) trace(g, pts); g.clip(); g.fillStyle = 'rgba(255,255,255,.22)';
  for (const [x, y, w, ph] of GLIT) { g.globalAlpha = 0.35 + 0.65 * max(0, sin(t * 1.1 + ph)); g.fillRect(x + sin(t * 0.5 + ph) * 3, y, w, 1); }
  g.restore();
  // Inseln (Papier mit Schatten) und Flüsse (Ebene), dazu die gefärbten Inseln
  ebene(g, 'kC', (c) => {
    c.save(); c.beginPath(); PARCH(c); c.clip();
    for (const pts of Object.values(ISL)) paper(c, '#efe0b8', (p) => trace(p, pts), { sy: 2 });
    c.strokeStyle = '#4a8ab8'; c.lineWidth = 1.2; c.lineJoin = 'round'; for (const r of RIV) { c.beginPath(); c.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) c.lineTo(r[i][0], r[i][1]); c.stroke(); }
    c.restore();
  });
  g.save(); g.beginPath(); g.arc(ROME[0], ROME[1], R, 0, TAU); g.clip(); g.globalAlpha = ta; g.fillStyle = tint;
  for (const k of ROMAN_ISL) { if (k === 'britannien') { g.save(); g.beginPath(); g.rect(0, MY(55.2), SW, SH); g.clip(); } g.beginPath(); trace(g, ISL[k]); g.fill(); if (k === 'britannien') g.restore(); }
  g.restore();
  if (grow > 0 && grow < 0.999) { g.strokeStyle = `rgba(255,230,150,${0.5 * (1 - grow)})`; g.lineWidth = 2; g.beginPath(); g.arc(ROME[0], ROME[1], R, 0, TAU); g.stroke(); }
  g.restore();
}
function karteDeko(g, t, o) {
  // Kompassrose
  g.save(); g.translate(62, 248); g.rotate(sin(t * 0.3) * 0.04); g.fillStyle = 'rgba(245,232,200,.9)'; g.beginPath(); g.arc(0, 0, 17, 0, TAU); g.fill(); g.strokeStyle = '#7a5a2a'; g.lineWidth = 1; g.stroke();
  for (let i = 0; i < 4; i++) { g.rotate(PI / 2); g.fillStyle = i % 2 ? '#a8262a' : '#7a5a2a'; g.beginPath(); g.moveTo(0, -17); g.lineTo(3, -4); g.lineTo(-3, -4); g.closePath(); g.fill(); }
  g.rotate(PI / 4); g.fillStyle = '#c9a050'; for (let i = 0; i < 4; i++) { g.rotate(PI / 2); g.beginPath(); g.moveTo(0, -11); g.lineTo(2, -3); g.lineTo(-2, -3); g.closePath(); g.fill(); } g.restore();
}
function romStern(g, t, x, y) {
  const p = (t * 0.5) % 1; g.strokeStyle = `rgba(255,236,170,${0.7 * (1 - p)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, 3 + p * 12, 0, TAU); g.stroke();
  g.fillStyle = '#e8c46a'; g.strokeStyle = '#7a4a10'; g.lineWidth = 0.9; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -PI / 2 + i * PI / 5, r = i % 2 ? 2.8 : 6; i ? g.lineTo(x + cos(a) * r, y + sin(a) * r) : g.moveTo(x + cos(a) * r, y + sin(a) * r); } g.closePath(); g.fill(); g.stroke();
}
function segelschiff(g, x, y, s, dir, t, ph) {
  g.save(); g.translate(x, y + sin(t * 1.3 + ph) * 0.5); g.scale(dir * s, s);
  g.fillStyle = '#8a5a38'; g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.lineTo(4, 3); g.lineTo(-4, 3); g.closePath(); g.fill();
  g.strokeStyle = '#5a3a1e'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -9); g.stroke(); g.fillStyle = '#f6efd8'; g.beginPath(); g.moveTo(-0.5, -8.5); g.quadraticCurveTo(5, -5, -0.5, -1); g.closePath(); g.fill(); g.restore();
}

// ---------------------------------------------------------------- 10 Das Reich ist am größten (117 n. Chr.)
const SHIPS10 = [[2, 39.3, 8, 38.4, 0], [17.5, 36.6, 22.5, 34.6, 2.4], [24, 33.2, 31, 33.3, 4.1], [11, 40.4, 14.2, 39.3, 5.5], [-3, 36.9, 1, 37.6, 3.3]];
function schiffeAufKarte(g, t, a = 1) {
  for (const [lo1, la1, lo2, la2, ph] of SHIPS10) {
    const L = 14, u = ((t * 1 + ph * 2) % L) / L, e = u < 0.5 ? u * 2 : 2 - u * 2, d = u < 0.5 ? 1 : -1;
    const f = smooth(e), x = lerp(MX(lo1), MX(lo2), f), y = lerp(MY(la1), MY(la2), f);
    g.globalAlpha = a; segelschiff(g, x, y, 1.1, ((MX(lo2) - MX(lo1)) >= 0 ? 1 : -1) * d, t, ph); g.globalAlpha = 1;
  }
}
function trajan(g, t0, o) {
  const t = tm(t0, o), L = 17, T = t % L;
  tisch(g, t);
  const grow = smooth(sm(1.0, 9.5, T)), ta = T > 14.6 ? 1 - sm(14.6, 16.4, T) : 1;
  const wiederA = T < 0.8 ? sm(0, 0.8, T) : 1;
  karte(g, t, { emp: EMP117, grow: max(0.001, grow), tint: 'rgba(139,42,74,.62)', ta: ta * wiederA });
  schiffeAufKarte(g, t, 1);
  // Beschriftung
  const la = sm(5, 9, T) * ta;
  if (la > 0.02) { g.globalAlpha = la;
    etikett(g, 'Britannien', MX(-2.2), MY(53.4), 7.5); etikett(g, 'Gallien', MX(2.2), MY(46.6), 8.5); etikett(g, 'Ägypten', MX(29.5), MY(27), 8.5); etikett(g, 'Euphrat', MX(42.6), MY(36.4), 7.5);
    etikett(g, 'M I T T E L M E E R', MX(16.4), MY(34.9), 7.5, 'rgba(240,236,220,.92)', 1, 'rgba(20,60,100,.55)');
    g.globalAlpha = 1; }
  // Rom: Stern
  romStern(g, t, ROME[0], ROME[1]); etikett(g, 'Rom', ROME[0] + 15, ROME[1] + 1, 8.5, '#5a1a2a');
  karteDeko(g, t, o);
}
// ---------------------------------------------------------------- 11 Soldaten bauen den Grenzwall (122 n. Chr.)
const WY = 226;                                                  // Fuß der Mauer
const WSEG = [[315, 372, 20], [265, 315, 42], [215, 265, 62], [-10, 215, 84]]; // von rechts (niedrig) nach links (fertig)
const ridgeY = (x, base, amp, f, ph) => base + sin(x * f + ph) * amp + sin(x * f * 2.3 + ph * 1.7) * amp * 0.4;
const PUL = [300, 92], PX = [368, 391, 414], PY = 244, PS = 0.9;   // Dreibock-Spitze, Zieher
const SOL = { kind: 'soldat', armor: null, helmet: null, shield: null, item: null, sword: false, shoes: 'caliga', tunic: '#dcc590', trim: '#b8935a', belt: '#4a3020', hs: 'short' };
function waffenstaender(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-26, 0); g.lineTo(-24, -44); g.moveTo(26, 0); g.lineTo(24, -44); g.moveTo(-26, -31); g.lineTo(26, -31); g.stroke();
  for (const [sx, a] of [[-12, -0.12], [0, 0.04], [12, 0.14]]) { g.save(); g.translate(sx, -14); g.rotate(a); paper(g, '#b98a4a', (c) => rrect(c, -6, -17, 12, 30, 4), { sy: 1.6, blur: 1.5 }); g.strokeStyle = '#e8c46a'; g.lineWidth = 1.1; g.beginPath(); rrect(g, -4.6, -15.6, 9.2, 27.2, 3); g.stroke(); g.fillStyle = '#d9b45a'; g.beginPath(); g.arc(0, -2, 2.6, 0, TAU); g.fill(); g.restore(); }
  g.strokeStyle = '#7a5530'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(-31, 0); g.lineTo(-28, -58); g.moveTo(31, 0); g.lineTo(28, -58); g.stroke();
  g.strokeStyle = '#9aa0a4'; g.lineWidth = 1.1; g.beginPath(); g.moveTo(-28, -50); g.lineTo(-27.8, -66); g.moveTo(28, -50); g.lineTo(27.8, -66); g.stroke();
  for (const hx of [-24, 24]) { g.fillStyle = '#b3b9bc'; g.strokeStyle = '#7e868c'; g.lineWidth = 0.9; g.beginPath(); g.arc(hx, -44, 6.4, PI, 0); g.closePath(); g.fill(); g.stroke(); }
  g.restore();
}
function steinblock(g, x, y, w, h, a = 1) { g.save(); g.globalAlpha = a; paper(g, '#c2b698', (c) => c.rect(x - w / 2, y - h / 2, w, h), { sy: 2, blur: 1.5 }); g.strokeStyle = 'rgba(70,55,35,.4)'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - w / 2, y - h * 0.1); g.lineTo(x + w / 2, y - h * 0.1); g.stroke(); g.fillStyle = 'rgba(255,250,230,.4)'; g.fillRect(x - w / 2, y - h / 2, w, 2); g.restore(); }
function bock(g, x, y, w, h) { g.save(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); for (const sd of [-1, 1]) { g.moveTo(x + sd * (w / 2 - 3), y - h + 3); g.lineTo(x + sd * (w / 2 + 3), y); g.moveTo(x + sd * (w / 2 - 3), y - h + 3); g.lineTo(x + sd * (w / 2 - 9), y); } g.stroke(); paper(g, '#8a6a3e', (c) => c.rect(x - w / 2 - 2, y - h, w + 4, 4), { sy: 2, blur: 1.5 }); g.restore(); }
function wallBg(g) {
  ridge(g, 150, 7, 0.012, 1.0, '#a9c0a2');
  ridge(g, 166, 8, 0.018, 2.5, '#8fae7a');
  ridge(g, 192, 8, 0.016, 4, '#74995a');
  // Boden
  vgrad(g, [[0, '#6d9453'], [0.3, '#7ba05a'], [1, '#5c8744']], 206, 300);
  g.fillStyle = 'rgba(176,146,98,.5)'; for (const [ex, ey, rx, ry] of [[210, 276, 80, 14], [372, 252, 74, 10], [110, 270, 52, 10], [300, 246, 60, 10]]) { g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, TAU); g.fill(); }
  // Mauer: Stufen von rechts nach links, Absteckung ganz rechts
  g.strokeStyle = '#6a4a2a'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); for (const px of [392, 424, 456]) { g.moveTo(px, WY + 3); g.lineTo(px, WY - 10); } g.stroke();
  g.strokeStyle = 'rgba(250,240,220,.9)'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(386, WY - 9); g.quadraticCurveTo(405, WY - 6, 424, WY - 9); g.quadraticCurveTo(440, WY - 6, 456, WY - 9); g.lineTo(490, WY - 9); g.stroke();
  paper(g, '#9a8a6a', (c) => c.rect(372, WY - 5, 118, 5), { sy: 1.5, blur: 1.2 });
  WSEG.forEach(([x0, x1, h], k) => {
    const y0 = WY - h; paper(g, '#bdb095', (c) => c.rect(x0, y0, x1 - x0, h), { sy: 2.5, sx: 2, blur: 2.5 });
    masonry(g, x0, y0, x1 - x0, h, 7, '#bfb297', 'rgba(70,55,35,.38)', 5 + k);
    g.fillStyle = 'rgba(255,248,225,.5)'; g.fillRect(x0, y0, x1 - x0, 3);
    vgrad(g, [[0, 'rgba(60,40,20,0)'], [1, 'rgba(60,40,20,.2)']], y0, WY);
  });
  // Turm mit Tor
  paper(g, '#c4b79b', (c) => c.rect(40, 104, 42, 122), { sy: 2.5, sx: 2, blur: 2.5 }); masonry(g, 40, 104, 42, 122, 7, '#c4b79b', 'rgba(70,55,35,.38)', 11);
  paper(g, '#b4623a', (c) => { c.moveTo(34, 106); c.lineTo(61, 80); c.lineTo(88, 106); c.closePath(); }, { sy: 2.5, blur: 2.5 }); tiles(g, 40, 88, 83, 105, 6, 'rgba(70,25,10,.3)');
  g.fillStyle = '#3a2a1c'; g.beginPath(); g.moveTo(52, WY); g.lineTo(52, WY - 22); g.arc(61, WY - 22, 9, PI, 0); g.lineTo(70, WY); g.closePath(); g.fill();
  g.strokeStyle = '#7a5a36'; g.lineWidth = 1; g.beginPath(); g.moveTo(61, WY - 31); g.lineTo(61, WY); g.stroke();
  g.fillStyle = '#3a2a1c'; g.fillRect(58, 122, 6, 12); g.fillRect(58, 150, 6, 12);
  waffenstaender(g, 96, 270, 1);
  for (const [bx, by, n] of [[34, 288, 3], [398, 297, 3]]) for (let i = 0; i < n; i++) steinblock(g, bx + (i % 2) * 3 + i * 0.5, by - i * 11, 24 - i * 2, 11);
}
function wall(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm, L = 9, T = t % L, u = T / L;
  // Himmel
  vgrad(g, [[0, '#b9d6e2'], [0.55, '#e4edda'], [1, '#f8e7bf']], 0, 170);
  sun(g, 404, 66, 9, t, '#fff3c8', '255,226,150', 0.55, 0);
  for (let i = 0; i < 5; i++) cloud(g, wrap(i * 118 + t * (2.2 + i * 0.5), -80, SW + 80), 26 + (i * 37) % 70, 0.9 + (i % 3) * 0.28, '#ffffff', 0.86);
  for (let i = 0; i < 3; i++) bird(g, wrap(40 + i * 160 + t * (9 + i * 2), -20, SW + 20), 52 + i * 18 + sin(t * 0.7 + i) * 4, 0.8, t, i * 1.7);
  // Hügel
  ebene(g, 'wall', wallBg);
  for (const [sxp, sc] of [[336, 0.34], [380, 0.28], [446, 0.32]]) sheep(g, sxp, ridgeY(sxp, 166, 8, 0.018, 2.5) + 3, sc, sxp % 2 ? 1 : -1, t, sxp, sxp % 3 === 0 ? 'graze' : 'stand');
  // Dreibock-Kran: hinteres Bein, Last, vordere Beine
  const ph = (() => { const p = clamp((u - 0.1) / 0.62, 0, 1) * 4; return p; })();
  const P4 = ph, fr = P4 - floor(P4), rise = P4 >= 4 ? 4 : floor(P4) + smooth(clamp(fr * 2, 0, 1));
  const yL = lerp(231, 178, rise / 4), la = u < 0.06 ? sm(0, 0.06, u) : (u > 0.86 ? 1 - sm(0.86, 0.94, u) : 1);
  const bein = (x0, y0, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(PUL[0], PUL[1] - 2); g.stroke(); };
  bein(304, 184, 3.2, '#5a3d22');
  g.save(); g.globalAlpha = la; steinblock(g, 300, yL, 18, 11); g.strokeStyle = '#8a6a3a'; g.lineWidth = 0.9; g.beginPath(); g.moveTo(300, yL - 15); g.lineTo(291, yL - 5.5); g.moveTo(300, yL - 15); g.lineTo(309, yL - 5.5); g.stroke(); g.fillStyle = '#6a6a6a'; g.beginPath(); g.arc(300, yL - 15, 1.8, 0, TAU); g.fill(); g.restore();
  g.strokeStyle = '#a8864a'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(300, yL - 15 * la - (1 - la) * 15); g.lineTo(PUL[0], PUL[1]); g.stroke();
  bein(262, 234, 4, '#7a5530'); bein(342, 236, 4, '#7a5530');
  g.strokeStyle = '#7a5530'; g.lineWidth = 3; g.beginPath(); g.moveTo(272, 196); g.lineTo(329, 196); g.stroke();
  g.fillStyle = '#4a4a4a'; g.beginPath(); g.arc(PUL[0], PUL[1], 4, 0, TAU); g.fill(); g.fillStyle = '#9a9a9a'; g.beginPath(); g.arc(PUL[0], PUL[1], 1.6, 0, TAU); g.fill();
  // Zieher: Seil durch die Hände
  const hands = PX.map((px, i) => { const s = sin(ph * TAU + i * 0.25); return [px - PS * (14.8 - 4 * s), PY - 37.6 * PS / 0.9 + 1.8 * s]; });
  g.strokeStyle = '#a8864a'; g.lineWidth = 1.3; g.lineJoin = 'round'; g.beginPath(); g.moveTo(PUL[0], PUL[1]); g.lineTo(334, 205); g.lineTo(hands[0][0], hands[0][1]);
  for (let i = 1; i < 3; i++) g.lineTo(hands[i][0], hands[i][1]);
  g.quadraticCurveTo(hands[2][0] + 22, hands[2][1] + 4, hands[2][0] + 36, PY + 4); g.stroke();
  PX.forEach((px, i) => roman(g, px, PY, PS, -1, 'pull', (ph * TAU) + i * 0.25, { ...SOL, hair: pick(['#5a3a22', '#2a1a12', '#8a6a3a'], i), skin: pick(['#e2b088', '#cf9a70', '#f0c9a4'], i), tunic: pick(['#c49a52', '#d8c28c', '#9a8a5a'], i) }));
  // Maurer auf den Stufen
  const blk = (x, y) => steinblock(g, x, y, 15, 9);
  blk(255, 164 - 4.5);
  roman(g, 238, 164, 0.72, 1, 'work', t * 2.4, { ...SOL, item: 'hammer', hair: '#3a2a1c', tunic: '#b8894a' });
  roman(g, 285, 184, 0.72, 1, 'hold', t, { ...SOL, hair: '#6a4a30', arms: { near: [11, 25], far: [10, 26] }, tunic: '#d8c28c' });
  // Vordergrund
  roman(g, 150, 276, 1.05, 1, 'carry', t * 1.2, { ...SOL, item: 'stone', hair: '#2a1a12', skin: '#cf9a70', tunic: '#9a8a5a' });
  bock(g, 226, 288, 30, 36); steinblock(g, 226, 252 - 6.5, 22, 13);
  roman(g, 204, 286, 1.05, 1, 'work', t * 2.6, { ...SOL, item: 'hammer', hair: '#8a6a3a', tunic: '#c49a52', skin: '#f0c9a4' });
  roman(g, 452, 284, 1.0, -1, 'point', t * 0.8, { ...SOL, helmet: 'crest', hs: 'short', tunic: '#e4d4a8', belt: '#b8935a' });
  grassTufts(g, 284, 298, 18, 21, t, '#5a863a', 9);
  // Staub und Splitter an der Steinmetz-Stelle
  const nD = calm ? 4 : 9;
  for (let i = 0; i < nD; i++) { const p = ((t * 0.35 + i / nD) % 1); g.fillStyle = `rgba(245,236,214,${0.55 * (1 - p)})`; g.beginPath(); g.arc(226 + sin(i * 2.3) * 12 + p * 6, 250 - p * 14, 1 + (i % 2) * 0.6, 0, TAU); g.fill(); }
}
// ---------------------------------------------------------------- 12 Konstantin und ein neuer Glaube (313 n. Chr.)
function chirho(g, x, y, r, col = '#f2d27a') {
  g.save(); g.translate(x, y); g.strokeStyle = col; g.lineWidth = r * 0.2; g.lineCap = 'round';
  g.beginPath(); g.moveTo(0, -r * 0.9); g.lineTo(0, r * 0.9); g.moveTo(-r * 0.62, -r * 0.62); g.lineTo(r * 0.62, r * 0.62); g.moveTo(r * 0.62, -r * 0.62); g.lineTo(-r * 0.62, r * 0.62); g.stroke();
  g.beginPath(); g.arc(r * 0.28, -r * 0.5, r * 0.34, -PI / 2, PI / 2); g.stroke(); g.restore();
}
function lampe(g, x, y, t, ph) {
  g.fillStyle = '#6a4a2a'; g.fillRect(x - 0.5, y - 14, 1, 10);
  paper(g, '#b8863e', (c) => { c.moveTo(x - 4, y - 4); c.lineTo(x + 4, y - 4); c.lineTo(x + 2.4, y); c.lineTo(x - 2.4, y); c.closePath(); }, { sy: 1.5, blur: 1.2 });
  const f = 1 + sin(t * 2.3 + ph) * 0.1 + sin(t * 3.7 + ph * 2) * 0.06;
  glow(g, x, y - 8, 15, '255,214,130', 0.38 * f); g.fillStyle = '#ffd36a'; g.beginPath(); g.ellipse(x, y - 8, 1.7, 3.2 * f, 0, 0, TAU); g.fill(); g.fillStyle = '#fff3c0'; g.beginPath(); g.ellipse(x, y - 7.4, 0.8, 1.7 * f, 0, 0, TAU); g.fill();
}
function haeuser12(g) {
  // Häuserzeile hinten links
  const H = [[-6, 138, 54, 62, '#e3cfa2'], [50, 152, 46, 48, '#d9b98a'], [98, 130, 52, 70, '#ebdcbc'], [152, 146, 50, 54, '#dcc08e'], [204, 156, 40, 44, '#e6d4ac'], [246, 142, 50, 58, '#d8bd90']];
  for (const [x, y, w, h, c] of H) {
    paper(g, c, (p) => p.rect(x, y, w, h), { sx: 1.5, sy: 2 });
    g.fillStyle = 'rgba(90,60,30,.18)'; g.fillRect(x + w - 5, y, 5, h);
    paper(g, '#c4693c', (p) => { p.moveTo(x - 3, y + 2); p.lineTo(x + 4, y - 8); p.lineTo(x + w - 4, y - 8); p.lineTo(x + w + 3, y + 2); p.closePath(); }, { sy: 2 }); tiles(g, x, y - 6, x + w, y + 1, 3);
    g.fillStyle = '#4a3020'; g.fillRect(x + w * 0.2, y + 14, 7, 11); g.fillRect(x + w * 0.62, y + 14, 7, 11);
  }
}
function kirche12(g, t, o) {
  const cx = 380;
  // Stufen
  paper(g, '#d7c8a4', (c) => c.rect(300, 224, 160, 7), { sy: 2 }); paper(g, '#ddcfae', (c) => c.rect(308, 218, 144, 7), { sy: 2 });
  // Wand
  paper(g, '#ebe0c6', (c) => c.rect(316, 126, 128, 93), { sx: 2, sy: 2.5, blur: 2.5 });
  g.fillStyle = 'rgba(90,60,30,.12)'; g.fillRect(436, 126, 8, 93);
  for (const px of [316, 436]) { g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(px, 126, 8, 93); g.fillStyle = 'rgba(120,90,50,.18)'; g.fillRect(px + 7, 126, 1.2, 93); }
  // Giebel und Dach
  paper(g, '#b4623a', (c) => { c.moveTo(306, 130); c.lineTo(cx, 82); c.lineTo(454, 130); c.closePath(); }, { sy: 3, blur: 3 }); tiles(g, 316, 100, 444, 128, 7, 'rgba(70,25,10,.3)');
  paper(g, '#efe5cc', (c) => { c.moveTo(322, 126); c.lineTo(cx, 96); c.lineTo(438, 126); c.closePath(); }, { sy: 1.5, blur: 1 });
  paper(g, '#5a2a52', (c) => circle(c, cx, 114, 9.5), { sy: 1.2, blur: 1.2, lw: 1.2, edgeCol: '#e8c46a' }); chirho(g, cx, 114, 6.2);
  // Fenster
  for (const wx of [334, 410]) { g.fillStyle = '#8a4a1c'; g.beginPath(); g.moveTo(wx - 7, 176); g.lineTo(wx - 7, 156); g.arc(wx, 156, 7, PI, 0); g.lineTo(wx + 7, 176); g.closePath(); g.fill(); const fl = 0.93; g.fillStyle = `rgba(255,214,130,${0.9 * fl})`; g.beginPath(); g.moveTo(wx - 5, 175); g.lineTo(wx - 5, 157); g.arc(wx, 157, 5, PI, 0); g.lineTo(wx + 5, 175); g.closePath(); g.fill(); }
  // Tür: offen, warmes Licht
  const gr = g.createLinearGradient(0, 158, 0, 220); gr.addColorStop(0, '#ffe4a0'); gr.addColorStop(1, '#e8a850');
  g.fillStyle = '#5a3a1e'; g.beginPath(); g.moveTo(354, 220); g.lineTo(354, 160); g.arc(cx, 160, 26, PI, 0); g.lineTo(406, 220); g.closePath(); g.fill();
  g.fillStyle = gr; g.beginPath(); g.moveTo(358, 220); g.lineTo(358, 160); g.arc(cx, 160, 22, PI, 0); g.lineTo(402, 220); g.closePath(); g.fill();
    for (const sd of [-1, 1]) { g.fillStyle = '#7a5530'; g.beginPath(); g.moveTo(cx + sd * 22, 160); g.lineTo(cx + sd * 30, 164); g.lineTo(cx + sd * 30, 222); g.lineTo(cx + sd * 22, 220); g.closePath(); g.fill(); g.strokeStyle = 'rgba(40,20,5,.4)'; g.lineWidth = 0.8; g.stroke(); }
  // Lichtschein auf den Stufen
  const sh = 0.85; g.save(); g.fillStyle = `rgba(255,222,140,${0.3 * sh})`; g.beginPath(); g.moveTo(358, 220); g.lineTo(402, 220); g.lineTo(440, 262); g.lineTo(320, 262); g.closePath(); g.fill(); g.restore();
}
function kBg12(g) {
  // ferne Hügel
  ridge(g, 150, 6, 0.014, 0.8, '#b9c8a4'); haeuser12(g);
  for (const [cxp, h] of [[8, 54], [250, 46], [292, 58]]) cypress(g, cxp, 206, h, '#46603c', 0, cxp);
  // Platz
  g.fillStyle = '#d9c8a2'; g.fillRect(0, 200, SW, 100);
  vgrad(g, [[0, 'rgba(255,255,255,.22)'], [1, 'rgba(130,90,50,.2)']], 200, 300);
  g.strokeStyle = 'rgba(110,85,55,.3)'; g.lineWidth = 1; g.beginPath(); for (const yy of [208, 218, 232, 252, 280]) { g.moveTo(0, yy); g.lineTo(SW, yy); } for (let x = -40; x < SW + 40; x += 38) { g.moveTo(x, 218); g.lineTo(x - (x - 240) * 0.35, 300); } g.stroke();
  kirche12(g, 0, {});
}
function konstantin(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm;
  vgrad(g, [[0, '#c8e0ee'], [0.55, '#f2e9d0'], [1, '#fbe2b4']], 0, 200);
  sun(g, 92, 96, 11, t, '#fff1c0', '255,224,150', 0.5, 0);
  cloud(g, wrap(t * 2.2 + 210, -70, 540), 36, 0.9, '#fff', 0.85); cloud(g, wrap(t * 1.5 + 380, -70, 540), 62, 0.6, '#fff', 0.7); cloud(g, wrap(t * 1.9 + 20, -70, 540), 22, 0.7, '#fff', 0.8);
  ebene(g, 'konstantin', kBg12);
  lampe(g, 346, 150, t, 0.4); lampe(g, 414, 150, t, 2.1);
  // Tauben vom Dach
  for (let i = 0; i < 4; i++) { const p = (t * 0.05 + i / 4) % 1, ang = p * TAU; bird(g, 400 + cos(ang) * 90 + i * 5, 70 + sin(ang * 2) * 12 + i * 6, 0.85, t, i, 'rgba(255,255,255,.96)'); }
  // Gruppe vor der Kirche (hinten nach vorn)
  const P = (x, y, s, dir, pose, ph, c) => roman(g, x, y, s, dir, pose, ph, c);
  P(268, 248, 1.0, 1, 'stand', t * 1.1, { kind: 'buerger', tunic: '#8a7a5a', hair: '#8a8478', hs: 'bald', item: 'staff' });
  P(228, 252, 1.08, 1, 'stand', t * 1.2, { kind: 'buergerin', tunic: '#7a9a8a', hs: 'bun' });
  P(246, 254, 0.95, 1, 'raise', t * 1.5, { kind: 'kind', up: 0.6, tunic: '#e3cf9a' });
  P(306, 248, 1.0, -1, 'stand', t * 1.0, { kind: 'buerger', tunic: '#b8894a', hair: '#2a1a12', skin: '#cf9a70' });
  // Wanderer zum Tor: gehen, verschwinden an der Tür, kommen links wieder
  const W = [[0, '#c49a52', 'buerger'], [0.34, '#8aa0b8', 'buergerin'], [0.68, '#9a8a5a', 'buerger']];
  for (const [off, col, kind] of W) {
    const p = ((t * 0.045 + off) % 1), x = lerp(196, 372, p), a = p < 0.08 ? p / 0.08 : (p > 0.9 ? (1 - p) / 0.1 : 1), y = lerp(272, 236, smooth(p)) + off * 6, sc = lerp(1.1, 0.88, p);
    g.save(); g.globalAlpha = a; roman(g, x, y, sc, 1, 'walk', x * 0.27, { kind, tunic: col, hair: '#3a2417', skin: '#e2b088' }); g.restore();
  }
  // Kaiser mit Schriftrolle, dahinter ein Schreiber
  P(88, 268, 1.2, 1, 'hold', t * 1.1, { kind: 'buerger', tunic: '#cdb682', item: 'tablet', hair: '#5a3a22', arms: { near: [10, 7], far: [9, 8] } });
  roman(g, 150, 286, 1.55, 1, 'hold', t * 1.0, { kind: 'kaiser', toga: null, tunic: '#7b2d5b', trim: '#e8c46a', stripe: '#e8c46a', border: null, cloak: '#f4efe4', cloakLen: 34, wind: 0.2, belt: '#e8c46a', item: 'scroll', scrollAng: 1.75, scrollS: 1.5, seal: true, hs: 'short', hair: '#4a3220', skin: '#f0c9a4', arms: { near: [13, 2], far: [11, 6] } });
  // Sonnenstaub im Licht
  const nM = calm ? 6 : 14;
  for (let i = 0; i < nM; i++) { const p = (t * 0.07 + i / nM) % 1, x = 60 + (i * 53) % 340 + sin(t * 0.5 + i) * 8, y = 270 - p * 150; g.fillStyle = `rgba(255,244,205,${0.5 * sin(p * PI)})`; g.beginPath(); g.arc(x, y, 1 + (i % 3) * 0.4, 0, TAU); g.fill(); }
}
// ---------------------------------------------------------------- 13 Das Reich wird geteilt (395 n. Chr.)
const KPT = [MX(29), MY(41.0)];
function teilung(g, t0, o) {
  const t = tm(t0, o), L = 17, T = t % L;
  const ein = sm(0.2, 1.8, T), aus = sm(14.2, 16.4, T), va = ein * (1 - aus), zu = 1 - sm(15.6, 16.9, T);
  const glowK = sm(1.8, 3.2, T) * (1 - sm(5.4, 6.4, T)), sepK = smooth(sm(3.4, 6.2, T)) * zu, col = smooth(sm(3.6, 6.0, T)) * zu;
  const dx = 6 * sepK + sin(t * 0.9) * 0.4 * sepK;
  tisch(g, t);
  const tintW = 'rgba(139,42,74,.62)', tintE = `rgba(${lerp(139, 200, col) | 0},${lerp(42, 134, col) | 0},${lerp(74, 40, col) | 0},${lerp(0.62, 0.7, col)})`;
  const inhalt = (west) => {
    schiffeAufKarte(g, t, va);
    g.save(); g.globalAlpha = va;
    if (west) { romStern(g, t, ROME[0], ROME[1]); etikett(g, 'Rom', ROME[0] - 14, ROME[1] + 1, 8.5, '#5a1a2a'); }
    if (!west) { romStern(g, t + 1.3, KPT[0], KPT[1]); etikett(g, 'Konstantinopel', KPT[0] + 4, KPT[1] - 11, 8, '#5a3408'); }
    g.restore();
  };
  if (sepK < 0.002) {
    karte(g, t, { emp: EMP395, grow: 1, tint: tintW, edge: '#e8c46a', ta: va });
    inhalt(true); inhalt(false);
  } else {
    // Risskante: Schatten auf dem Tisch in der Lücke
    g.save(); g.lineJoin = 'round'; for (const sd of [-1, 1]) { g.save(); g.translate(sd * dx, 0); g.strokeStyle = 'rgba(0,0,0,.16)'; g.lineWidth = 9; g.beginPath(); g.moveTo(CUT[0][0], CUT[0][1] - 90); for (const p of CUT) g.lineTo(p[0], p[1]); g.lineTo(CUT[CUT.length - 1][0], CUT[CUT.length - 1][1] + 90); g.stroke(); g.restore(); } g.restore();
    const half = (pts, sd, tint, edge, west) => { g.save(); g.translate(sd * dx, 0); g.beginPath(); trace(g, pts); g.clip(); karte(g, t, { emp: EMP395, grow: 1, tint, edge, ta: va }); inhalt(west); g.restore(); };
    half(WESTHALF, -1, tintW, '#e8c46a', true); half(EASTHALF, 1, tintE, '#fff0c0', false);
  }
  // Schnittlinie leuchtet kurz
  if (glowK > 0.01) { g.save(); g.lineJoin = 'round'; g.lineCap = 'round'; const pul = 0.8 + 0.2 * sin(t * 2.6); for (const [w, a] of [[9, 0.12], [5, 0.22], [2, 0.9]]) { g.strokeStyle = `rgba(255,240,170,${a * glowK * pul})`; g.lineWidth = w; g.beginPath(); g.moveTo(CUT[0][0], CUT[0][1] - 10); for (const p of CUT) g.lineTo(p[0], p[1]); g.lineTo(CUT[CUT.length - 1][0], CUT[CUT.length - 1][1] + 10); g.stroke(); } g.restore(); }
    const la = sm(5, 7.5, T) * (1 - aus);
  if (la > 0.02) {
    g.save(); g.globalAlpha = la;
    etikett(g, 'W E S T E N', MX(-1.5) - dx, MY(46.6), 11, '#5a1a2a', 1, 'rgba(250,236,210,.85)');
    etikett(g, 'O S T E N', MX(35.5) + dx, MY(38.6), 11, '#5a3408', 1, 'rgba(250,236,210,.85)');
    // zwei junge Herrscher
    const fig = (x, y, dir, kind) => roman(g, x, y, 1.2, dir, 'stand', t * 1.1 + x, { kind: 'kaiser', h: 0.8, head: 1.12, hat: 'diadem', hs: 'short', ...kind });
    fig(150 - dx, 270, 1, { toga: '#8b2a4a', border: '#e8c46a', tunic: '#f0e6d0', trim: '#e8c46a', hair: '#6a4a30' });
    fig(MX(40) + dx, 268, -1, { toga: '#c0842a', border: '#7b2d5b', tunic: '#f0e6d0', trim: '#7b2d5b', hair: '#2a1a12' });
    g.restore();
  }
  karteDeko(g, t, o);
}
// ---------------------------------------------------------------- 14 Eine stille Straße (476 n. Chr.)
const RD = (y) => { const u = clamp((y - 168) / 132, 0, 1.4); return { cx: 292 - 66 * Math.pow(u, 1.5), hw: 4 + 118 * Math.pow(u, 1.12) }; };
const ST14 = makeStars(60, 41, 120);
const FF14 = Array.from({ length: 10 }, () => [RND() * 200 + 20, 232 + RND() * 60, RND() * 6, 0.5 + RND()]);
function aquaedukt(g, x0, yb, n, aw, h, col) {
  g.fillStyle = col; g.beginPath(); g.rect(x0, yb - h, n * aw, h * 0.2);
  for (let i = 0; i < n; i++) { const ax = x0 + i * aw + aw * 0.14, w = aw * 0.72; g.moveTo(ax, yb); g.lineTo(ax, yb - h * 0.45); g.arc(ax + w / 2, yb - h * 0.45, w / 2, PI, 0); g.lineTo(ax + w, yb); g.closePath(); }
  g.rect(x0, yb - h * 0.8, n * aw, h * 0.8); g.fill('evenodd');
}
function sBg14(g) {
  // Mond (Sichel)
  g.save(); g.fillStyle = '#fff1c8'; g.beginPath(); g.arc(96, 52, 9, PI * 0.5 + 0.2, PI * 1.5 - 0.2); g.quadraticCurveTo(96 + 5, 52, 96 + 9 * cos(PI * 0.5 + 0.2), 52 + 9 * sin(PI * 0.5 + 0.2)); g.fill(); g.restore(); glow(g, 96, 52, 26, '255,240,200', 0.18);
  // Sonne, halb hinter den Hügeln
  glow(g, 300, 162, 90, '255,190,110', 0.55); g.fillStyle = '#ffe4a4'; g.beginPath(); g.arc(300, 164, 15, 0, TAU); g.fill();
  ridge(g, 156, 7, 0.011, 0.4, '#5a4672'); aquaedukt(g, 24, 164, 11, 15, 22, '#4a3b66');
  ridge(g, 166, 6, 0.019, 2.0, '#463a62');
  // Gehöft in der Ferne mit Rauch und Licht
  paper(g, '#8a6a7a', (c) => c.rect(384, 150, 20, 14), { sy: 1.5, blur: 1.2 }); paper(g, '#6a3a4a', (c) => { c.moveTo(381, 151); c.lineTo(394, 142); c.lineTo(407, 151); c.closePath(); }, { sy: 1.5, blur: 1.2 });
  g.fillStyle = '#ffd27a'; g.fillRect(388, 154, 4, 5); glow(g, 390, 157, 10, '255,210,120', 0.35);
  // Wiese
  vgrad(g, [[0, '#6d6a57'], [0.5, '#555a47'], [1, '#3f4838']], 166, 300);
  // Straße
  const ys = []; for (let y = 168; y <= 300; y += 4) ys.push(y); ys.push(300);
  g.save(); g.beginPath(); ys.forEach((y, i) => { const r = RD(y); i ? g.lineTo(r.cx - r.hw, y) : g.moveTo(r.cx - r.hw, y); }); for (let i = ys.length - 1; i >= 0; i--) { const r = RD(ys[i]); g.lineTo(r.cx + r.hw, ys[i]); } g.closePath();
  g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 5; g.fillStyle = '#8f8070'; g.fill(); g.shadowColor = 'transparent'; g.clip();
  vgrad(g, [[0, 'rgba(255,180,110,.5)'], [0.35, 'rgba(255,160,110,.2)'], [1, 'rgba(40,30,80,.3)']], 166, 300);
  g.strokeStyle = 'rgba(40,28,40,.35)'; g.lineWidth = 1; g.beginPath();
  for (let k = 1; k <= 17; k++) { const y = 168 + 132 * Math.pow(k / 17, 1.8), r = RD(y); g.moveTo(r.cx - r.hw, y); g.lineTo(r.cx + r.hw, y); }
  for (const f of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) { ys.forEach((y, i) => { const r = RD(y); i ? g.lineTo(r.cx + f * r.hw, y) : g.moveTo(r.cx + f * r.hw, y); }); }
  g.stroke();
  g.strokeStyle = 'rgba(255,225,190,.22)'; g.lineWidth = 1; g.beginPath(); for (let k = 3; k <= 17; k += 2) { const y = 169 + 132 * Math.pow(k / 17, 1.8), r = RD(y); g.moveTo(r.cx - r.hw * 0.9, y); g.lineTo(r.cx + r.hw * 0.9, y); } g.stroke();
  g.restore();
  for (const sd of [-1, 1]) { g.fillStyle = '#b6a48a'; g.beginPath(); ys.forEach((y, i) => { const r = RD(y); i ? g.lineTo(r.cx + sd * r.hw, y) : g.moveTo(r.cx + sd * r.hw, y); }); for (let i = ys.length - 1; i >= 0; i--) { const r = RD(ys[i]), u = (ys[i] - 168) / 132; g.lineTo(r.cx + sd * (r.hw + 1.5 + 4 * u), ys[i]); } g.closePath(); g.fill(); }
  // Bäume am Rand (Tiefe)
  for (const [yy, sd, kind] of [[176, 1, 'c'], [186, -1, 'p'], [200, 1, 'p'], [212, -1, 'c'], [232, 1, 'c'], [250, -1, 'p'], [278, 1, 'p']]) {
    const r = RD(yy), u = (yy - 168) / 132, x = r.cx + sd * (r.hw + 12 + 18 * u), h = 22 + 72 * u;
    (kind === 'c' ? cypress : pine)(g, x, yy + 2, h, '#2f4034', 0, yy);
  }
  // Meilenstein und Laterne am linken Rand
  const mx = 52, my = 284;
  g.fillStyle = 'rgba(20,12,30,.3)'; g.beginPath(); g.ellipse(mx + 4, my + 1, 16, 3.4, 0, 0, TAU); g.fill();
  { const gr = g.createLinearGradient(mx - 8, 0, mx + 8, 0); gr.addColorStop(0, '#9c8c72'); gr.addColorStop(0.4, '#cdbb9c'); gr.addColorStop(1, '#8a7a64');
    paper(g, '#a89a80', (c) => c.rect(mx - 13, my - 7, 26, 7), { sy: 1.5, blur: 1.2 });
    paper(g, gr, (c) => { c.moveTo(mx - 8, my - 7); c.lineTo(mx - 7, my - 50); c.lineTo(mx + 7, my - 50); c.lineTo(mx + 8, my - 7); c.closePath(); }, { sy: 2, blur: 2 });
    paper(g, '#c6b596', (c) => { c.ellipse(mx, my - 51, 10, 3.6, 0, 0, TAU); }, { sy: 1.5, blur: 1.2 });
    g.fillStyle = 'rgba(255,190,120,.28)'; g.fillRect(mx + 2, my - 49, 5, 42);
    g.strokeStyle = 'rgba(70,55,40,.4)'; g.lineWidth = 0.9; g.beginPath(); for (let i = 0; i < 5; i++) { g.moveTo(mx - 4.5, my - 40 + i * 6); g.lineTo(mx + 4.5 - (i % 2) * 2.5, my - 40 + i * 6); } g.stroke(); }
  g.strokeStyle = '#4a3220'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(112, 262); g.lineTo(112, 224); g.stroke(); paper(g, '#3a2a1c', (c) => c.rect(105, 218, 14, 6), { sy: 1.2, blur: 1 });
}
function strasse(g, t0, o) {
  const t = tm(t0, o), calm = !!o.calm, L = 14, T = t % L;
  // Abendhimmel
  vgrad(g, [[0, '#2f2c60'], [0.42, '#7b4b7e'], [0.8, '#e38d63'], [1, '#f7c47c']], 0, 172);
  stars(g, ST14, t, 0.9 * (calm ? 0.6 : 1));
  cloud(g, wrap(t * 1.6 + 60, -70, 540), 74, 0.9, '#f4b08a', 0.7); cloud(g, wrap(t * 1.1 + 330, -70, 540), 100, 0.7, '#e49a84', 0.6);
  ebene(g, 'strasse', sBg14);
  lampe(g, 112, 218, t, 1.3);
  smoke(g, 399, 145, t, { col: '190,170,190', a: 0.35, rise: 26, r0: 1.5, r1: 4.5, drift: 8, n: 5, seed: 3 });
  // Schafe und Hirtenjunge mit Flöte
  sheep(g, 392, 282, 0.9, -1, t, 1, 'lie'); sheep(g, 462, 294, 1.0, -1, t, 2, 'stand');
  const playing = T < 10.2;
  roman(g, 424, 292, 1.35, -1, playing ? 'flute' : 'stand', t * 1.2, { kind: 'hirte', hat: 'petasos', tunic: '#a8824c', fur: '#e4d8b8', len: 'knee' });
  // Töne: setzen aus, bis nichts mehr klingt
  for (let j = 0; j < 12; j++) { const ts = j * 0.85, age = T - ts; if (age < 0 || age > 4.2) continue; const amp = T0amp(ts), e = age / 4.2; note(g, 394 - age * 15 + sin(age * 2.2 + j) * 3.5, 216 - age * 7.5 - (age * age) * 0.4, 0.95 + amp * 0.35, sin(e * PI) * amp * 0.95, '#fff0c4'); }
  // Glühwürmchen
  const nF = calm ? 4 : FF14.length;
  for (let i = 0; i < nF; i++) { const f = FF14[i], x = f[0] + sin(t * 0.4 * f[3] + f[2]) * 14, y = f[1] + sin(t * 0.55 + f[2] * 2) * 8, a = 0.2 + 0.6 * max(0, sin(t * 0.8 + f[2])); glow(g, x, y, 5, '255,240,150', 0.55 * a); g.fillStyle = `rgba(255,248,190,${a})`; g.fillRect(x - 0.7, y - 0.7, 1.4, 1.4); }
  // Schwalben auf dem Heimweg
  for (let i = 0; i < 3; i++) bird(g, wrap(t * (11 + i * 2) + i * 120, -20, SW + 20), 92 + i * 14 + sin(t * 0.8 + i) * 5, 0.8, t, i * 1.3, 'rgba(40,28,50,.75)');
  // Abendschatten am Rand
  const vg = g.createLinearGradient(0, 220, 0, 300); vg.addColorStop(0, 'rgba(30,20,50,0)'); vg.addColorStop(1, 'rgba(30,20,50,.22)'); g.fillStyle = vg; g.fillRect(0, 220, SW, 80);
}
const T0amp = (ts) => ts < 4.5 ? 1 : max(0, 1 - (ts - 4.5) / 5.5);
// ---------------------------------------------------------------- Liste
// start = ab welchem Jahr (v. Chr. negativ) die Szene gezeigt wird; at = Sprungziel (Punkte, Pfeile)
export const SCENES = [
  { id: 'hirten', start: -753, at: -753, era: 'Königszeit', when: '753 v. Chr. (Sage)', title: 'Hirtenfeuer am Tiber', short: 'Hirtenfeuer', cap: 'Abends sitzen Hirten am Feuer, und die Schafe ruhen. Auf dem Hügel stehen Strohhütten.', fact: 'Nach der Sage gründete Romulus die Stadt 753 v. Chr. Schon lange davor lebten dort Hirten.', draw: hirten },
  { id: 'forum', start: -509, at: -509, era: 'Republik', when: 'um 509 v. Chr.', title: 'Bürger stimmen auf dem Forum ab', short: 'Forum', cap: 'Auf dem Forum versammeln sich die Bürger. Viele heben die Arme, auf der Bühne stehen zwei Männer.', fact: 'Um 509 v. Chr. jagten die Römer nach der Überlieferung ihren letzten König fort. Danach wählten sie jedes Jahr zwei Konsuln.', draw: forum },
  { id: 'alpen', start: -218, at: -218, era: 'Republik', when: '218 v. Chr.', title: 'Elefanten am Alpenpass', short: 'Alpenpass', cap: 'Hannibal führt sein Heer im Herbst über die verschneiten Alpen. Auch Elefanten stapfen durch den Schnee.', fact: 'Welcher Pass es war, wissen Forscher bis heute nicht sicher. Von den Elefanten kamen nur wenige durch.', draw: alpen },
  { id: 'karthago', start: -146, at: -146, era: 'Republik', when: '146 v. Chr.', title: 'Karthagos Hafen liegt still', short: 'Karthago', cap: 'Die Sonne geht unter, und die Schiffe liegen ruhig im Hafen. Möwen kreisen über dem Wasser.', fact: 'Karthago war eine reiche Handelsstadt in Nordafrika. 146 v. Chr. endete der Krieg mit Rom: Die Römer zerstörten die Stadt, und das Gebiet wurde zur römischen Provinz Africa. Das Bild zeigt den Hafen, wie er davor gewesen sein könnte (erfunden).', draw: karthago },
  { id: 'rubikon', start: -49, at: -49, era: 'Republik', when: '49 v. Chr.', title: 'Soldaten am Flussufer', short: 'Rubikon', cap: 'Soldaten stehen am Rubikon. Ihr Feldherr Caesar zeigt über den kleinen Fluss.', fact: 'Mit seinem Heer überschritt Caesar 49 v. Chr. den Rubikon. Bis heute sagt man „den Rubikon überschreiten“, wenn es kein Zurück mehr gibt.', draw: rubikon },
  { id: 'augustus', start: -27, at: -27, era: 'Kaiserzeit', when: '27 v. Chr.', title: 'Lorbeerkranz für Augustus', short: 'Augustus', cap: 'Ein Senator ehrt Augustus mit einem Lorbeerkranz. Lorbeer ist ein Zeichen für Sieg und Ehre.', fact: '27 v. Chr. bekam Octavian den Ehrennamen „Augustus“. Er nannte sich selbst lieber „Princeps“, das heißt „erster Bürger“.', draw: augustus },
  { id: 'koeln', start: 50, at: 50, era: 'Kaiserzeit', when: 'um 50 n. Chr.', title: 'Markttag in Köln', short: 'Köln', cap: 'Am Rhein ist Markttag mit Obst, Töpfen und Käse. Ein Schiff fährt am Ufer vorbei.', fact: 'Um 50 n. Chr. bekam die Stadt den Namen Colonia Claudia Ara Agrippinensium. Aus „Colonia“ wurde später „Köln“.', draw: koeln },
  { id: 'pompeji', start: 79, at: 79, era: 'Kaiserzeit', when: '79 n. Chr.', title: 'Ein ruhiger Morgen in Pompeji', short: 'Pompeji', cap: 'Ein ganz normaler Morgen: Die Leute holen Brot und Wasser, und der Vesuv steht ruhig am Horizont.', fact: 'Im Jahr 79 n. Chr. brach der Vesuv aus, im Spätsommer oder Herbst. Der genaue Tag ist unter Forschern umstritten.', draw: pompeji },
  { id: 'kolosseum', start: 80, at: 80, era: 'Kaiserzeit', when: '80 n. Chr.', title: 'Das Kolosseum wird eröffnet', short: 'Kolosseum', cap: 'Fahnen flattern, und viele Menschen strömen zum Fest. Neben dem Bau steht eine Riesenstatue.', fact: 'Kaiser Titus weihte es 80 n. Chr. ein. Der Name „Kolosseum“ kommt wohl von einer Riesenstatue (lat. colossus) daneben. Das oberste Stockwerk kam erst unter Domitian dazu; das Bild zeigt den fertigen Bau.', draw: kolosseum },
  { id: 'trajan', start: 117, at: 117, era: 'Kaiserzeit', when: '117 n. Chr.', title: 'Das Reich ist am größten', short: 'Größtes Reich', cap: 'Unter Kaiser Trajan reicht das Reich von Britannien bis zum Euphrat. Das Mittelmeer liegt mittendrin.', fact: 'Es war etwa 5 Millionen Quadratkilometer groß, rund 14-mal so groß wie Deutschland (Schätzung). Mesopotamien gehörte nur von 115 bis 117 dazu.', draw: trajan },
  { id: 'wall', start: 122, at: 122, era: 'Kaiserzeit', when: 'ab 122 n. Chr.', title: 'Soldaten bauen den Grenzwall', short: 'Grenzwall', cap: 'In Britannien legen Soldaten die Waffen beiseite und mauern. Mit Seil und Rolle ziehen sie die Steine hoch.', fact: 'Der Hadrianswall wurde wohl ab 122 n. Chr. gebaut, vor allem von den drei Legionen in Britannien.', draw: wall },
  { id: 'konstantin', start: 313, at: 313, era: 'Spätantike', when: '313 n. Chr.', title: 'Konstantin und ein neuer Glaube', short: 'Konstantin', cap: 'Kaiser Konstantin hält eine Schriftrolle. Christen dürfen jetzt offen ihren Glauben leben. Die Kirche im Bild ist erfunden.', fact: 'Konstantin und Licinius erlaubten den Christen 313, ihren Glauben frei zu leben. Zur Staatsreligion wurde das Christentum erst 380.', draw: konstantin },
  { id: 'teilung', start: 395, at: 395, era: 'Spätantike', when: '395 n. Chr.', title: 'Das Reich wird geteilt', short: 'Reichsteilung', cap: 'Nach dem Tod von Kaiser Theodosius bekommt jeder seiner Söhne eine Hälfte: den Westen und den Osten.', fact: 'Arcadius herrschte im Osten, Honorius im Westen. Danach wurde das Reich nie wieder dauerhaft vereint.', draw: teilung },
  { id: 'strasse', start: 476, at: 476, era: 'Spätantike', when: '476 n. Chr.', title: 'Eine stille Straße', short: 'Stille Straße', cap: 'Es wird Abend, und die Straße ist leer. Eine Flöte spielt leise, bis der Ton verklingt.', fact: 'Odoaker setzte 476 den Kindkaiser Romulus Augustulus ab; Ostrom bestand bis 1453. Wie römische Musik klang, weiß man kaum. Die Flötenmelodie hier ist erfunden.', draw: strasse },
];

// Szene zum Jahr: die letzte, deren Beginn erreicht ist (Jahre v. Chr. negativ)
export function sceneIndexAt(year) { let k = 0; for (let i = 0; i < SCENES.length; i++) if (year >= SCENES[i].start) k = i; return k; }
