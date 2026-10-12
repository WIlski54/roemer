// Station 6 (Pompeji): Gebäude und Kulissen-Specs (Laden, Imbiss, Brunnen, Hausinneres, Hauswand, Vesuv) – alles aus Code.
// Maße in Metern (Modellraum), Boden bei y=0. Besitzer: Station 6.
import { poly, blob, limb, panel } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';
import { rectP as rect, roofTiles, plaster, woodGrain, ashlar } from './_arch.js';
import { mixHex } from './_people.js';
import { mulberry32 } from '../../engine/util.js';

export const C = { red: '#b5402b', redD: '#8f2f22', ocher: '#e0a649', ocherD: '#c48a32', cream: '#f2e2b6', black: '#2b2220', terra: '#c8693a', green: '#6f8f4a', stone: '#cfc3a6', wood: '#8a5a34', dark: '#3a2a22' };

// Rechteck malen (innerhalb der Layer-Form, wird dort abgeschnitten)
export function R(c, x0, y0, x1, y1, col, a = 1) {
  const { ctx, tf } = c; const [X0, Y0] = tf(x0, y1), [X1, Y1] = tf(x1, y0);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0); ctx.restore();
}
function E(c, cx, cy, rx, ry, col, a = 1, rot = 0) {
  const { ctx, tf, S } = c; const [X, Y] = tf(cx, cy);
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(X, Y, rx * S, ry * S, rot, 0, 6.2832); ctx.fill(); ctx.restore();
}
function G(c, x0, y0, x1, y1, top, bot) { // Verlauf-Rechteck
  const { ctx, tf } = c; const [X0, Y0] = tf(x0, y1), [X1, Y1] = tf(x1, y0);
  const g = ctx.createLinearGradient(0, Y0, 0, Y1); g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(X0, Y0, X1 - X0, Y1 - Y0); ctx.restore();
}
const ST = 'rgba(50,25,12,.55)';

// ------------------------------------------------------------ Putzwand mit Sockel (Pompejanisch-Rot unten, Ocker/Creme oben)
export function putzwand(c, bb, { dado = 1.2, upper = C.cream, lower = C.red, seed = 3, band = true } = {}) {
  G(c, bb.x0, bb.y0, bb.x1, bb.y1, mixHex(upper, '#ffffff', 0.12), mixHex(upper, '#8a6a3a', 0.12));
  R(c, bb.x0, bb.y0, bb.x1, dado, lower);
  R(c, bb.x0, dado - 0.05, bb.x1, dado + 0.03, C.black, 0.7);
  if (band) R(c, bb.x0, bb.y1 - 0.36, bb.x1, bb.y1 - 0.27, lower, 0.9);
  plaster(c, bb, { color: 'rgba(120,70,40,.16)', n: Math.round(bb.w * bb.h * 30), seed });
  const r = mulberry32(seed + 9);
  for (let i = 0; i < 7; i++) { const x = bb.x0 + r() * bb.w; line(c, [[x, bb.y0 + r() * 0.3], [x + (r() - 0.5) * 0.2, bb.y0 + 0.4 + r() * 0.8]], 'rgba(60,30,12,.18)', 0.02); }
  volume(c, bb, { dark: 'rgba(60,30,10,.20)', light: 'rgba(255,245,215,.16)' });
}

function eave(w, h) { // Dachrand aus Ziegeln, ragt etwas über
  return { shapes: [poly([[-0.2, h], [w + 0.2, h], [w + 0.28, h + 0.12], [w + 0.1, h + 0.3], [-0.1, h + 0.3], [-0.28, h + 0.12]], 1)], fill: { top: '#d9784a', bottom: '#a8472a' },
    deco(c, bb) { roofTiles(c, bb, { h: 0.1, w: 0.2 }); R(c, bb.x0, bb.y0, bb.x1, bb.y0 + 0.05, 'rgba(60,20,10,.4)'); } };
}

// Brotlaib
function laib(c, x, y, s = 1) { E(c, x, y, 0.15 * s, 0.09 * s, '#c98a3a'); E(c, x - 0.02 * s, y + 0.02 * s, 0.1 * s, 0.05 * s, '#e0aa5a', 0.9); for (const d of [-0.07, 0, 0.07]) line(c, [[x + d * s - 0.02, y + 0.07 * s], [x + d * s + 0.03, y - 0.03 * s]], '#8a5520', 0.012 * s); }
function amphore(c, x, y, s = 1, col = '#c9833f') { E(c, x, y + 0.3 * s, 0.14 * s, 0.22 * s, col); R(c, x - 0.04 * s, y + 0.46 * s, x + 0.04 * s, y + 0.62 * s, mixHex(col, '#6a3a18', 0.2)); E(c, x, y + 0.64 * s, 0.07 * s, 0.025 * s, '#8a4a22'); line(c, [[x - 0.14 * s, y + 0.3 * s], [x + 0.14 * s, y + 0.3 * s]], 'rgba(70,30,10,.4)', 0.012 * s); E(c, x - 0.05 * s, y + 0.38 * s, 0.03 * s, 0.07 * s, 'rgba(255,230,180,.35)'); }

// ------------------------------------------------------------ Laden (Taberna): kind 'baecker' | 'haendler'
export function taberna(o = {}) {
  const kind = o.kind || 'baecker', w = 4.6, h = 3.4;
  const O = { x0: 0.4, x1: 2.7, y1: 2.15, cy: 0.95 }, D = { x0: 3.15, x1: 4.15, y1: 2.3 }, win = { x0: 1.3, x1: 1.9, y0: 2.6, y1: 3.0 };
  const wall = [rect(0, 0, 0.4, h), rect(0.4, 0, 2.7, 0.95), rect(2.7, 0, 3.15, h), rect(3.15, 2.3, 4.15, h), rect(4.15, 0, w, h),
    rect(0.4, 2.15, win.x0, h), rect(win.x1, 2.15, 2.7, h), rect(win.x0, 2.15, win.x1, win.y0), rect(win.x0, win.y1, win.x1, h)];
  const sign = kind === 'baecker';
  const parts = {
    back: { z: 0, layers: [{ shapes: [rect(O.x0, O.cy, O.x1, O.y1), rect(D.x0, 0, D.x1, D.y1), rect(win.x0, win.y0, win.x1, win.y1)], fill: '#3b2b22', stroke: null,
      deco(c, bb) {
        G(c, O.x0, O.cy, O.x1, O.y1, '#4a3428', '#2a1d17');
        G(c, D.x0, 0, D.x1, D.y1, '#3a2a20', '#1f1511'); G(c, win.x0, win.y0, win.x1, win.y1, '#2d221b', '#1a1310');
        for (const y of [1.45, 1.85]) { R(c, O.x0, y, O.x1, y + 0.05, C.wood); R(c, O.x0, y - 0.015, O.x1, y, 'rgba(0,0,0,.35)'); }
        if (kind === 'baecker') {
          for (let i = 0; i < 6; i++) { laib(c, O.x0 + 0.3 + i * 0.38, 1.54, 0.8); if (i < 5) laib(c, O.x0 + 0.5 + i * 0.4, 1.94, 0.75); }
          // Ofen im hinteren Raum
          const ox = (D.x0 + D.x1) / 2; E(c, ox, 0.55, 0.42, 0.5, '#9a4a2a'); R(c, ox - 0.42, 0, ox + 0.42, 0.55, '#9a4a2a'); E(c, ox, 0.34, 0.2, 0.16, '#1a0d08'); E(c, ox, 0.3, 0.12, 0.09, '#ff9a3a', 0.95); E(c, ox, 0.28, 0.06, 0.05, '#ffe08a');
          for (let i = 0; i < 7; i++) line(c, [[ox - 0.4 + i * 0.12, 0.05], [ox - 0.38 + i * 0.12, 0.9]], 'rgba(60,20,10,.25)', 0.012);
        } else {
          for (let i = 0; i < 5; i++) { amphore(c, O.x0 + 0.3 + i * 0.45, 1.45, 0.55, i % 2 ? '#c0703a' : '#b9783f'); }
          for (let i = 0; i < 4; i++) amphore(c, O.x0 + 0.5 + i * 0.5, 1.85, 0.45, '#d29a55');
          // Stoffballen am Haken in der Tür
          const cols = ['#4f78a8', '#c0503a', '#e0b84a', '#6f9a5a']; for (let i = 0; i < 4; i++) { R(c, D.x0 + 0.1 + i * 0.22, 1.1, D.x0 + 0.26 + i * 0.22, 2.0, cols[i]); R(c, D.x0 + 0.1 + i * 0.22, 1.1, D.x0 + 0.26 + i * 0.22, 1.16, 'rgba(255,255,255,.3)'); }
        }
      } }] },
    body: { z: 1, layers: [
      { shapes: wall, fill: C.cream, deco(c, bb) {
        putzwand(c, bb, { dado: 1.15, seed: kind === 'baecker' ? 3 : 7, upper: kind === 'baecker' ? C.cream : '#efd49a' });
        // Gesims über den Öffnungen
        R(c, 0, 2.15, w, 2.2, C.black, 0.55);
        // Schild über dem Laden: Brot bzw. Krug auf rotem Feld
        R(c, 0.52, 2.35, 1.12, 3.05, C.redD, 0.9); R(c, 0.56, 2.39, 1.08, 3.01, C.ocher, 0.9);
        if (sign) { E(c, 0.82, 2.7, 0.2, 0.12, '#c98a3a'); for (const d of [-0.09, 0, 0.09]) line(c, [[0.82 + d - 0.02, 2.77], [0.82 + d + 0.03, 2.64]], '#7a4a18', 0.012); }
        else { E(c, 0.82, 2.66, 0.11, 0.17, '#b9583a'); R(c, 0.78, 2.78, 0.86, 2.92, '#8a3a22'); }
        // Fensterläden-Brett (Holz) neben dem Laden
        R(c, 3.2, 0.0, 3.32, 2.3, C.wood, 0.0);
        // Türrahmen
        R(c, D.x0 - 0.06, 0, D.x0, D.y1 + 0.05, C.wood); R(c, D.x1, 0, D.x1 + 0.06, D.y1 + 0.05, C.wood); R(c, D.x0 - 0.06, D.y1, D.x1 + 0.06, D.y1 + 0.07, C.wood);
        R(c, O.x0 - 0.05, O.y1, O.x1 + 0.05, O.y1 + 0.06, C.wood);
        // Theke: Deckplatte und Steinfugen
        R(c, O.x0 - 0.03, 0.9, O.x1 + 0.03, 0.97, '#d8d0bc'); R(c, O.x0, 0.2, O.x1, 0.85, C.redD, 0.35);
        line(c, [[O.x0 + 1.1, 0.0], [O.x0 + 1.1, 0.9]], 'rgba(60,20,10,.3)', 0.015);
        for (const wx of [0.3, win.x1 + 0.5]) { R(c, wx - 0.0, 0.1, wx + 0.0, 0.1, '#000', 0); }
      } },
      eave(w, h),
    ] },
    items: { z: 2, layers: kind === 'baecker'
      ? [{ shapes: [0, 1, 2, 3, 4].map((i) => blob(0.75 + i * 0.4, 1.06, 0.15, 0.09)), fill: { top: '#e0aa5a', bottom: '#c98a3a' }, stroke: 'rgba(90,50,15,.6)', deco(c) { for (let i = 0; i < 5; i++) for (const d of [-0.07, 0, 0.07]) line(c, [[0.75 + i * 0.4 + d - 0.02, 1.13], [0.75 + i * 0.4 + d + 0.03, 1.03]], '#8a5520', 0.012); } }]
      : [{ shapes: [0, 1, 2].map((i) => blob(0.85 + i * 0.7, 1.04, 0.24, 0.11)), fill: '#b98a4a', stroke: 'rgba(70,45,15,.6)' },
         { shapes: [0, 1, 2].flatMap((i) => [0, 1, 2, 3, 4].map((k) => blob(0.85 + i * 0.7 - 0.16 + k * 0.08, 1.14 + (k % 2) * 0.03, 0.05))), fill: '#d85a3a', stroke: 'rgba(60,20,10,.5)',
           deco(c) { for (let i = 0; i < 3; i++) for (let k = 0; k < 5; k++) dot(c, 0.85 + i * 0.7 - 0.16 + k * 0.08, 1.14 + (k % 2) * 0.03, 0.05, ['#c8452c', '#e0b030', '#6f9a3a'][(k + i) % 3]); } }] },
  };
  return { id: 'laden_' + kind, parts, anchors: { head: [w / 2, h], door: [(D.x0 + D.x1) / 2, 0], counter: [1.55, 1.0] }, meta: { name: kind === 'baecker' ? 'Bäckerei' : 'Laden', lengthM: w, doorX: (D.x0 + D.x1) / 2 } };
}

// ------------------------------------------------------------ Imbiss (Thermopolium)
export function imbiss() {
  const w = 5.2, h = 3.2, O = { x0: 0.35, x1: 3.9, y1: 2.2, cy: 1.05 }, D = { x0: 4.35, x1: 4.95, y1: 2.2 };
  const wall = [rect(0, 0, 0.35, h), rect(0.35, 0, 3.9, 1.05), rect(3.9, 0, 4.35, h), rect(4.35, 2.2, 4.95, h), rect(4.95, 0, w, h), rect(0.35, 2.2, 3.9, h)];
  const parts = {
    back: { z: 0, layers: [{ shapes: [rect(O.x0, O.cy, O.x1, O.y1), rect(D.x0, 0, D.x1, D.y1)], fill: '#3b2b22', stroke: null, deco(c) {
      G(c, O.x0, O.cy, O.x1, O.y1, '#5a3c2c', '#2a1d17'); G(c, D.x0, 0, D.x1, D.y1, '#3a2a20', '#1f1511');
      R(c, O.x0, 1.6, O.x1, 1.66, C.wood); R(c, O.x0, 1.95, O.x1, 2.0, C.wood);
      for (let i = 0; i < 9; i++) { const x = O.x0 + 0.3 + i * 0.38; E(c, x, 1.72, 0.07, 0.065, i % 2 ? '#b9783f' : '#d0a05a'); R(c, x - 0.07, 1.66, x + 0.07, 1.7, 'rgba(0,0,0,.2)'); }
      for (let i = 0; i < 4; i++) amphore(c, O.x0 + 0.4 + i * 0.85, 1.98, 0.34, '#c9833f');
      // Schinken an Schnüren
      for (let i = 0; i < 3; i++) { const x = O.x0 + 1.0 + i * 0.9; line(c, [[x, O.y1], [x, 2.0]], '#c8b080', 0.012); E(c, x, 1.9, 0.09, 0.14, '#b96a5a'); }
    } }] },
    body: { z: 1, layers: [
      { shapes: wall, fill: C.cream, deco(c, bb) {
        putzwand(c, bb, { dado: 1.0, seed: 11, upper: '#f0d9a2' });
        R(c, 0, 2.2, w, 2.26, C.black, 0.55);
        // Speiseplan: rote Tafel mit Bildchen über der Theke
        R(c, 0.55, 2.4, 3.7, 3.0, C.redD, 0.95); R(c, 0.6, 2.45, 3.65, 2.95, '#f1dfae');
        for (let i = 0; i < 5; i++) { const x = 0.95 + i * 0.62; if (i % 2 === 0) { E(c, x, 2.62, 0.13, 0.1, '#8aa6a8'); E(c, x + 0.09, 2.7, 0.05, 0.05, '#8aa6a8'); R(c, x + 0.13, 2.69, x + 0.2, 2.72, '#e08a2a'); } else { E(c, x, 2.7, 0.1, 0.13, '#b9583a'); R(c, x - 0.05, 2.8, x + 0.05, 2.9, '#8a3a22'); } line(c, [[x - 0.2, 2.52], [x + 0.2, 2.52]], 'rgba(60,30,12,.5)', 0.014); }
        // Türrahmen
        R(c, D.x0 - 0.06, 0, D.x0, D.y1 + 0.05, C.wood); R(c, D.x1, 0, D.x1 + 0.06, D.y1 + 0.05, C.wood); R(c, D.x0 - 0.06, D.y1, D.x1 + 0.06, D.y1 + 0.07, C.wood);
        R(c, O.x0 - 0.05, O.y1, O.x1 + 0.05, O.y1 + 0.06, C.wood);
        // Theke: Deckplatte, bemalte Front (Nereide auf Seepferd, Enten)
        R(c, O.x0 - 0.03, 1.0, O.x1 + 0.03, 1.08, '#d8d0bc');
        R(c, 0.5, 0.14, 3.75, 0.92, C.redD); R(c, 0.56, 0.2, 3.69, 0.86, '#f1e0b2');
        E(c, 2.1, 0.5, 0.5, 0.26, '#7fb3b0', 0.0);
        // Seepferd
        line(c, [[1.9, 0.28], [1.95, 0.5], [2.1, 0.66], [2.28, 0.7]], '#2f8a86', 0.1); E(c, 2.34, 0.72, 0.075, 0.05, '#2f8a86'); line(c, [[2.38, 0.72], [2.5, 0.7]], '#2f8a86', 0.03);
        line(c, [[1.9, 0.28], [1.78, 0.22], [1.72, 0.32], [1.8, 0.36]], '#2f8a86', 0.045); for (let i = 0; i < 4; i++) line(c, [[2.0 + i * 0.07, 0.62 - i * 0.02], [2.02 + i * 0.07, 0.72 - i * 0.02]], '#e8d070', 0.014);
        // Nereide
        E(c, 2.14, 0.77, 0.08, 0.1, '#f0c9a4'); E(c, 2.12, 0.86, 0.04, 0.03, '#3a2417'); line(c, [[2.14, 0.7], [2.12, 0.58]], '#f0c9a4', 0.09); line(c, [[2.1, 0.62], [2.0, 0.82]], '#f0c9a4', 0.035); R(c, 2.0, 0.55, 2.3, 0.62, '#e8d9c0', 0.9);
        // Enten
        for (const [dx, f] of [[0.95, 1], [3.3, -1]]) { E(c, dx, 0.42, 0.22, 0.12, '#8a7a5a'); E(c, dx + f * 0.18, 0.56, 0.08, 0.075, '#2f7a6a'); R(c, dx + f * 0.24 - 0.04, 0.54, dx + f * 0.3, 0.57, '#e08a2a'); E(c, dx + f * 0.2, 0.585, 0.012, 0.012, '#111'); }
        line(c, [[0.7, 0.28], [1.2, 0.28]], 'rgba(50,100,120,.5)', 0.02); line(c, [[3.05, 0.28], [3.5, 0.28]], 'rgba(50,100,120,.5)', 0.02);
        for (const x of [1.0, 1.6, 2.6, 3.2]) { }
      } },
      eave(w, h),
    ] },
    items: { z: 2, layers: [{ shapes: [0.95, 1.9, 2.85].map((x) => blob(x, 1.09, 0.3, 0.09)).concat([blob(3.55, 1.13, 0.07, 0.07)]), fill: { top: '#8a6a48', bottom: '#5b4030' }, stroke: 'rgba(40,25,15,.6)',
      deco(c) { for (const x of [0.95, 1.9, 2.85]) { E(c, x, 1.11, 0.24, 0.05, '#a07c54'); dot(c, x, 1.15, 0.03, '#3a281c'); } } }] },
  };
  return { id: 'imbiss', parts, anchors: { head: [w / 2, h], counter: [2.0, 1.1] }, meta: { name: 'Imbiss (Thermopolium)', lengthM: w, doorX: (D.x0 + D.x1) / 2 } };
}

// ------------------------------------------------------------ Straßenbrunnen
export function brunnen() {
  const parts = {
    basin: { z: 1, layers: [{ shapes: [poly([[0, 0], [1.9, 0], [1.9, 0.62], [0, 0.62]], 0)], fill: '#a39a86', deco(c, bb) {
      G(c, bb.x0, bb.y0, bb.x1, bb.y1, '#b3aa95', '#8a826f'); ashlar(c, bb, { h: 0.22, w: 0.5, seed: 4 });
      R(c, bb.x0, bb.y1 - 0.13, bb.x1, bb.y1, '#cfc7b3'); R(c, bb.x0 + 0.1, bb.y1 - 0.2, bb.x1 - 0.1, bb.y1 - 0.13, '#5b9cc4', 0.85); // Wasser im Trog
      dot(c, bb.x0 + 0.4, bb.y0 + 0.12, 0.09, '#6f8f4a', 0.6); dot(c, bb.x1 - 0.5, bb.y0 + 0.1, 0.07, '#6f8f4a', 0.55);
    } }] },
    pillar: { z: 0, layers: [{ shapes: [poly([[0.55, 0.5], [1.35, 0.5], [1.3, 1.5], [0.6, 1.5]], 0), poly([[0.5, 1.5], [1.4, 1.5], [1.4, 1.62], [0.5, 1.62]])], fill: '#a39a86', deco(c, bb) {
      G(c, bb.x0, bb.y0, bb.x1, bb.y1, '#b8af9a', '#8f8774'); ashlar(c, bb, { h: 0.2, w: 0.4, seed: 8 });
      // Relief-Gesicht (Brunnenmaske)
      E(c, 0.95, 1.05, 0.2, 0.22, '#c4baa2'); E(c, 0.88, 1.1, 0.03, 0.025, '#4a4234'); E(c, 1.02, 1.1, 0.03, 0.025, '#4a4234'); line(c, [[0.88, 0.97], [0.95, 0.94], [1.02, 0.97]], '#4a4234', 0.015);
    } }] },
    spout: { z: 2, layers: [{ shapes: [limb([[0.95, 0.9, 0.09], [1.12, 0.84, 0.08], [1.3, 0.74, 0.07]], { per: 6 })], fill: '#8a6a3a' },
      { shapes: [limb([[1.3, 0.72, 0.05], [1.31, 0.45, 0.045], [1.3, 0.2, 0.05]], { per: 6 })], fill: { top: '#a8d8ef', bottom: '#6fb0d8' }, stroke: 'rgba(60,120,160,.4)' }] },
  };
  return { id: 's6_brunnen', parts, anchors: { head: [0.95, 1.6], spout: [1.3, 0.72] }, meta: { name: 'Straßenbrunnen', lengthM: 1.9 } };
}

// ------------------------------------------------------------ Haus: Innenwand des Atriums (Fresken) – mit drei Durchgängen und Blick in den Garten
export function hausInnen() {
  const w = 8.2, h = 3.6, D = [{ x0: 0.9, x1: 1.9 }, { x0: 3.3, x1: 4.9 }, { x0: 6.3, x1: 7.3 }], dh = [2.2, 2.6, 2.2];
  const wall = [rect(0, 0, D[0].x0, h), rect(D[0].x1, 0, D[1].x0, h), rect(D[1].x1, 0, D[2].x0, h), rect(D[2].x1, 0, w, h), ...D.map((d, i) => rect(d.x0, dh[i], d.x1, h))];
  const parts = {
    back: { z: 0, layers: [{ shapes: D.map((d, i) => rect(d.x0, 0, d.x1, dh[i])), fill: '#3a2c24', stroke: null, deco(c) {
      D.forEach((d, i) => { G(c, d.x0, 0, d.x1, dh[i], i === 1 ? '#bfe0e8' : '#4a352b', i === 1 ? '#8fb86a' : '#2a1f19'); });
      const d = D[1]; // Garten: Himmel, Büsche, Säulchen
      R(c, d.x0, 0, d.x1, 0.55, '#7ea65a'); for (let k = 0; k < 7; k++) E(c, d.x0 + 0.15 + k * 0.24, 0.6 + (k % 2) * 0.12, 0.18, 0.2, k % 2 ? '#5f8f48' : '#78a850');
      for (const x of [d.x0 + 0.35, d.x1 - 0.35]) { R(c, x - 0.07, 0.4, x + 0.07, 1.8, '#efe3c6'); R(c, x - 0.11, 1.8, x + 0.11, 1.88, '#efe3c6'); }
      dot(c, 4.1, 0.55, 0.06, '#e8c24a'); dot(c, 3.7, 0.7, 0.05, '#d8603a'); dot(c, 4.5, 0.65, 0.05, '#e8e0f0');
    } }] },
    body: { z: 1, layers: [{ shapes: wall, fill: C.red, deco(c, bb) {
      G(c, 0, 0, w, h, '#b94a30', '#9a3626'); plaster(c, bb, { color: 'rgba(60,20,10,.18)', n: 260, seed: 21 });
      R(c, 0, 0, w, 0.5, C.black, 0.85); R(c, 0, 0.5, w, 0.56, C.ocher, 0.9);   // Sockel schwarz
      R(c, 0, h - 0.55, w, h, C.cream, 0.95); R(c, 0, h - 0.6, w, h - 0.55, C.black, 0.9); // Fries
      // Felder mit Schwarz und Ocker, Mittelbilder
      const fields = [[0.15, 0.9], [1.95, 3.25], [4.95, 6.25], [7.35, 8.05]];
      for (const [a, b] of fields) { R(c, a, 0.7, b, h - 0.8, C.black, 0.0); R(c, a, 0.7, a + 0.04, h - 0.8, C.ocher, 0.9); R(c, b - 0.04, 0.7, b, h - 0.8, C.ocher, 0.9); R(c, a, 0.7, b, 0.74, C.ocher, 0.9); R(c, a, h - 0.84, b, h - 0.8, C.ocher, 0.9);
        const mx = (a + b) / 2; if (b - a > 0.9) { R(c, mx - 0.22, 1.55, mx + 0.22, 2.1, '#f1dfae'); R(c, mx - 0.2, 1.57, mx + 0.2, 2.08, '#8aa6a8'); E(c, mx, 1.83, 0.1, 0.11, '#f0c9a4'); R(c, mx - 0.09, 1.58, mx + 0.09, 1.76, '#c0503a'); } }
      for (const x of [0.0, 2.6 - 0.65, 5.6 - 0.35, w - 0.2]) { }
      // Pilaster-Streifen (schwarz) neben dem großen Durchgang
      R(c, 3.2, 0.5, 3.3, h - 0.6, C.black, 0.85); R(c, 4.9, 0.5, 5.0, h - 0.6, C.black, 0.85);
      // Türrahmen in Ocker
      D.forEach((d, i) => { R(c, d.x0 - 0.05, 0, d.x0, dh[i] + 0.06, C.ocher); R(c, d.x1, 0, d.x1 + 0.05, dh[i] + 0.06, C.ocher); R(c, d.x0 - 0.05, dh[i], d.x1 + 0.05, dh[i] + 0.06, C.ocher); });
      volume(c, bb, { dark: 'rgba(40,15,10,.25)', light: 'rgba(255,230,190,.12)' });
    } }] },
  };
  return { id: 's6_haus_innen', parts, anchors: { head: [w / 2, h] }, meta: { name: 'Hausinneres', lengthM: w } };
}

// ------------------------------------------------------------ Haus: niedrige Straßenwand mit Tür (Eingangslücke bei gx)
export function hauswand({ w = 8.2, h = 0.8, gx = 4.1, gw = 1.5 } = {}) {
  const wall = [rect(0, 0, gx - gw / 2, h), rect(gx + gw / 2, 0, w, h)];
  const parts = { body: { z: 1, layers: [{ shapes: wall, fill: C.red, deco(c, bb) {
    G(c, bb.x0, bb.y0, bb.x1, bb.y1, '#b94a30', '#8f3322'); plaster(c, bb, { color: 'rgba(60,20,10,.2)', n: 160, seed: 33 });
    R(c, bb.x0, 0, bb.x1, 0.12, C.black, 0.8); R(c, bb.x0, h - 0.06, bb.x1, h, C.ocher, 0.9); // Kappe
    for (const sx of [gx - gw / 2, gx + gw / 2]) { R(c, sx - 0.0, 0, sx + 0.0, h, '#000', 0); }
    volume(c, bb, { dark: 'rgba(40,15,10,.2)', light: 'rgba(255,230,190,.16)' });
  } }] } };
  return { id: 's6_hauswand', parts, anchors: { head: [w / 2, h] }, meta: { name: 'Hauswand', lengthM: w } };
}

// ------------------------------------------------------------ Hausblende (hängt am Dach; wird in p6 per makeFlat gebaut)
export function blendePart({ w = 8.2, h = 1.95, gx = 4.1, gw = 1.5 } = {}) {
  const wall = [rect(0, 0, gx - gw / 2, h), rect(gx + gw / 2, 0, w, h)];
  return { layers: [{ shapes: wall, fill: C.cream, deco(c, bb) {
    putzwand(c, bb, { dado: 0.0, upper: '#efd9a0', seed: 41, band: false });
    R(c, bb.x0, 0, bb.x1, 0.07, C.black, 0.45); R(c, bb.x0, h - 0.34, bb.x1, h - 0.25, C.red, 0.9); R(c, bb.x0, h - 0.25, bb.x1, h, '#f6ecce', 0.0);
    // kleine hohe Fenster und Pilaster
    for (const x of [1.0, 2.6, 5.7, 7.2]) { R(c, x - 0.22, 0.75, x + 0.22, 1.35, '#3a2c24'); R(c, x - 0.27, 0.72, x + 0.27, 0.76, C.wood); R(c, x - 0.27, 1.35, x + 0.27, 1.4, C.wood); R(c, x - 0.015, 0.76, x + 0.015, 1.35, C.wood); }
    for (const x of [gx - gw / 2 - 0.12, gx + gw / 2 + 0.12]) { R(c, x - 0.1, 0, x + 0.1, h - 0.34, '#e8d6a8'); R(c, x - 0.1, 0, x - 0.07, h - 0.34, 'rgba(120,80,40,.3)'); }
    for (let i = 0; i < 12; i++) E(c, 0.4 + i * 0.7, h - 0.3, 0.1, 0.05, C.ocher, 0.9);
  } }] };
}

// ------------------------------------------------------------ Ferner Vesuv: ruhig, KEIN Rauch
export function vesuv() {
  const prof = [[-7.0, 0], [-6.0, 0.35], [-4.6, 1.0], [-3.4, 1.9], [-3.0, 2.1], [-2.5, 1.95], [-1.9, 1.6], [-1.3, 1.5], [-0.6, 2.0], [0.4, 2.55], [1.0, 2.62], [1.6, 2.35], [2.8, 1.5], [4.4, 0.8], [5.8, 0.35], [7.0, 0]];
  const body = poly(prof.map(([x, y]) => [x, y * 1.5]), 2);
  return { id: 's6_vesuv', parts: { body: { z: 1, layers: [
    { shapes: [body], fill: { top: '#a8a4c4', bottom: '#8a98bc' }, deco(c, bb) {
      volume(c, bb, { dark: 'rgba(60,70,110,.28)', light: 'rgba(255,255,255,.22)' });
      for (const [x0, y0, x1, y1] of [[-3.0, 3.1, -3.4, 2.1], [0.9, 3.9, 0.4, 2.5], [1.0, 3.9, 1.7, 2.4], [-2.4, 2.9, -2.0, 1.8]]) line(c, [[x0, y0], [(x0 + x1) / 2 + 0.1, (y0 + y1) / 2], [x1, y1]], 'rgba(70,70,120,.3)', 0.05);
    } },
    { shapes: [poly([[-7.0, 0], [7.0, 0], [5.8, 0.6], [4.4, 1.25], [2.8, 1.8], [1.6, 1.7], [0.3, 1.5], [-1.0, 1.4], [-2.4, 1.5], [-3.8, 1.4], [-5.0, 1.0], [-6.0, 0.6]], 1)], fill: { top: '#8fb070', bottom: '#6f9a55' }, deco(c, bb) {
      for (let i = 0; i < 40; i++) { const x = bb.x0 + (i + 0.5) * bb.w / 40; line(c, [[x, bb.y0], [x + 0.25, bb.y0 + 0.9]], 'rgba(60,100,40,.35)', 0.05); }
      plaster(c, bb, { color: 'rgba(230,200,120,.3)', n: 100, seed: 5 });
    } },
  ] } }, anchors: { head: [0.7, 2.6] }, meta: { name: 'Vesuv', lengthM: 14 } };
}

// Zypresse (Papierschnitt-Baum) – eigene Kopie, damit die Station nicht von anderen Kits abhängt
export function zypresse() {
  return { id: 's6_zypresse', parts: { body: { z: 1, layers: [{ shapes: [poly([[0, 0], [0.2, 0], [0.22, 0.4], [0.36, 1.6], [0.2, 3.0], [0.0, 3.4], [-0.2, 3.0], [-0.36, 1.6], [-0.22, 0.4], [-0.2, 0]], 2)], fill: { top: '#4f7a3a', bottom: '#2f5a2a' }, deco(c, bb) {
    volume(c, bb); for (let i = 0; i < 9; i++) line(c, [[-0.2 + (i % 3) * 0.2, bb.y0 + 0.4 + i * 0.3], [-0.05 + (i % 3) * 0.1, bb.y0 + 0.9 + i * 0.3]], 'rgba(20,50,20,.35)', 0.03);
  } }] } }, anchors: { head: [0, 3.4] }, meta: { name: 'Zypresse', lengthM: 0.8, heightM: 3.4 } };
}
export function pinie() { // Schirmpinie
  return { id: 's6_pinie', parts: { trunk: { z: 0, layers: [{ shapes: [limb([[0, 0.13, 0.26], [0.1, 1.4, 0.2], [-0.05, 2.5, 0.16]], { per: 8 })], fill: { top: '#7a4a2a', bottom: '#5a3520' }, deco(c, bb) { woodGrain(c, bb, { vertical: true, n: 6 }); } }] },
    crown: { z: 1, layers: [{ shapes: [blob(-0.1, 2.9, 1.5, 0.5, 0.05), blob(-0.9, 2.7, 0.7, 0.35, 0.2), blob(0.8, 2.75, 0.8, 0.38, -0.2)], fill: { top: '#6b9a46', bottom: '#3f7a35' }, deco(c, bb) { volume(c, bb); for (let i = 0; i < 12; i++) E(c, bb.x0 + 0.3 + i * bb.w / 12, bb.y0 + 0.35 + (i % 3) * 0.12, 0.2, 0.07, 'rgba(30,70,25,.3)'); } }] } },
    anchors: { head: [0, 3.3] }, meta: { name: 'Pinie', lengthM: 3.2, heightM: 3.5 } };
}

// ------------------------------------------------------------ Mauerstück mit Wandkritzelei (harmloser, erfundener Spruch im Stil echter Graffiti)
export function graffitiwand() {
  const w = 1.7, h = 2.5;
  return { id: 's6_graffitiwand', parts: { body: { z: 1, layers: [
    { shapes: [poly([[0, 0], [w, 0], [w, h], [0, h]])], fill: C.cream, deco(c, bb) {
      putzwand(c, bb, { dado: 0.9, upper: '#ecd29a', seed: 52, band: false });
      const { ctx, tf, S } = c; ctx.save(); ctx.fillStyle = 'rgba(95,45,25,.82)'; ctx.font = `bold ${0.2 * S}px Georgia,serif`; ctx.textAlign = 'center';
      const [x1, y1] = tf(w / 2, 1.95), [x2, y2] = tf(w / 2 + 0.03, 1.65), [x3, y3] = tf(w / 2 - 0.02, 1.4);
      ctx.save(); ctx.translate(x1, y1); ctx.rotate(-0.04); ctx.fillText('C. HIC FVIT', 0, 0); ctx.restore();
      ctx.save(); ctx.translate(x2, y2); ctx.rotate(0.03); ctx.fillText('PANIS BONVS', 0, 0); ctx.restore();
      ctx.restore();
      // kleine Strichzeichnung: Herz und Sonne
      line(c, [[0.35, 1.2], [0.28, 1.28], [0.35, 1.34], [0.42, 1.28], [0.35, 1.2]], 'rgba(95,45,25,.8)', 0.02);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; line(c, [[1.3 + Math.cos(a) * 0.1, 1.28 + Math.sin(a) * 0.1], [1.3 + Math.cos(a) * 0.17, 1.28 + Math.sin(a) * 0.17]], 'rgba(95,45,25,.75)', 0.018); }
      E(c, 1.3, 1.28, 0.07, 0.07, 'rgba(95,45,25,.0)'); line(c, [[1.24, 1.28], [1.3, 1.34], [1.36, 1.28], [1.3, 1.22], [1.24, 1.28]], 'rgba(95,45,25,.75)', 0.018);
    } },
    { shapes: [poly([[-0.1, h], [w + 0.1, h], [w + 0.14, h + 0.1], [w + 0.05, h + 0.24], [-0.05, h + 0.24], [-0.14, h + 0.1]], 1)], fill: { top: '#d9784a', bottom: '#a8472a' }, deco(c, bb) { roofTiles(c, bb, { h: 0.09, w: 0.18 }); } },
  ] } }, anchors: { head: [w / 2, h] }, meta: { name: 'Mauer mit Graffiti', lengthM: w } };
}
