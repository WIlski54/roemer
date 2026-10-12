// Station 7: Baustelle und Werkstatt als Papierschnitt-Teile (für ctx.flat / makeFlat): Tretradkran, Last, Mörtelwanne, Ziegelstapel, Glastisch.
// Einheiten: Welt, ws = 1, y nach oben, x lokal um die Mitte.
import { poly, blob, limb } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { rectP, ashlar, brickwork, woodGrain } from './_arch.js';
import { mulberry32, TAU } from '../../engine/util.js';

const WOOD = { top: '#c99a5e', bottom: '#8f6636' };
const WOOD_D = { top: '#a77a44', bottom: '#74502a' };
const ROPE = '#d8c293';
const beam = (x0, y0, x1, y1, w) => limb([[x0, y0, w], [x1, y1, w]], { per: 3 });

// ----------------------------------------------------------------------------- Tretradkran
export const KRAN = {
  mast: { x: 0, top: 4.7 },
  tip: { x: -2.55, y: 4.5 },            // Seilrolle am Ausleger
  apex: { x: 0.02, y: 4.78 },
  wheel: { x: 1.45, y: 1.55, R: 1.18, r: 0.98 },
  halfW: 2.7,
};
export function kranGestell() {
  const { tip, apex, wheel } = KRAN;
  const gr = (c, bb) => { woodGrain(c, bb, { color: 'rgba(60,35,12,.35)', n: 7, seed: 3, vertical: bb.h > bb.w }); volume(c, bb, { dark: 'rgba(40,20,5,.3)', light: 'rgba(255,230,180,.22)' }); };
  return { layers: [
    { shapes: [rectP(-1.55, 0, 2.7, 0.2)], fill: WOOD_D, deco: gr },                                           // Grundbalken
    { shapes: [beam(-1.25, 0.15, -0.1, 3.1, 0.24)], fill: WOOD_D, deco: gr },                                  // Strebe links
    { shapes: [rectP(wheel.x - 0.13, 0.15, wheel.x + 0.13, wheel.y)], fill: WOOD_D, deco: gr },               // Stütze des Rades
    { shapes: [limb([[0, 0.1, 0.36], [0, 2.8, 0.3], [0, KRAN.mast.top, 0.22]], { per: 5 })], fill: WOOD, deco: gr },   // Mast
    { shapes: [rectP(0, wheel.y - 0.09, wheel.x + 0.1, wheel.y + 0.09)], fill: WOOD_D, deco: gr },            // Achsbalken
    { shapes: [beam(-0.05, 2.75, tip.x, tip.y - 0.1, 0.22)], fill: WOOD, deco: gr },                           // Ausleger
    { shapes: [beam(apex.x, apex.y, tip.x, tip.y, 0.1)], fill: { top: ROPE, bottom: '#b49a68' }, stroke: 'rgba(70,50,20,.6)' }, // Spannseil
    { shapes: [beam(0.5, 1.95, 0.05, 3.5, 0.1)], fill: WOOD_D },                                               // kleiner Pfosten
    { shapes: [blob(tip.x, tip.y, 0.19, 0.19, 0, 18), blob(apex.x, apex.y, 0.15, 0.15, 0, 16)], fill: { top: '#8f949a', bottom: '#575c63' }, stroke: 'rgba(30,35,40,.75)',
      deco: (c, bb) => { dot(c, tip.x, tip.y, 0.05, '#2c3036'); dot(c, apex.x, apex.y, 0.04, '#2c3036'); } },    // Rollen
  ] };
}
// Tretrad (um den Mittelpunkt, dreht sich in der Seite)
export function kranRad() {
  const { R, r } = KRAN.wheel, N = 28;
  const ring = [];
  for (let i = 0; i < N; i++) { const a0 = (i / N) * TAU, a1 = ((i + 1.08) / N) * TAU; ring.push([[Math.cos(a0) * r, Math.sin(a0) * r], [Math.cos(a0) * R, Math.sin(a0) * R], [Math.cos(a1) * R, Math.sin(a1) * R], [Math.cos(a1) * r, Math.sin(a1) * r]]); }
  const spokes = []; for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.2; spokes.push(beam(Math.cos(a) * 0.1, Math.sin(a) * 0.1, Math.cos(a) * (r + 0.05), Math.sin(a) * (r + 0.05), 0.1)); }
  return { layers: [
    { shapes: spokes, fill: WOOD_D, stroke: 'rgba(60,35,12,.7)' },
    { shapes: ring, fill: WOOD, stroke: 'rgba(60,35,12,.75)',
      deco: (c, bb) => { for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; line(c, [[Math.cos(a) * (r + 0.01), Math.sin(a) * (r + 0.01)], [Math.cos(a) * (R - 0.02), Math.sin(a) * (R - 0.02)]], 'rgba(60,35,12,.5)', 0.02); } volume(c, bb, { dark: 'rgba(40,20,5,.25)', light: 'rgba(255,230,180,.2)' }); } },
    { shapes: [blob(0, 0, 0.24, 0.24, 0, 22)], fill: { top: '#8f949a', bottom: '#575c63' }, stroke: 'rgba(30,35,40,.75)', deco: (c) => dot(c, 0, 0, 0.07, '#2c3036') },
  ] };
}
// Last: Steinblock im Seilgehänge, Ursprung = Haken (Block hängt darunter)
export const LAST = { w: 0.82, h: 0.6, hook: 0.0 };
export function kranLast() {
  const w = LAST.w / 2, top = -0.42, bot = top - LAST.h;
  return { layers: [
    { shapes: [beam(-w * 0.9, top, 0, 0, 0.05), beam(w * 0.9, top, 0, 0, 0.05)], fill: { top: ROPE, bottom: '#b49a68' }, stroke: 'rgba(70,50,20,.6)' },
    { shapes: [rectP(-w, bot, w, top)], fill: { top: '#dcd5c2', bottom: '#aaa28c' }, deco: (c, bb) => { ashlar(c, bb, { h: 0.3, w: 0.8, seed: 7, line: 'rgba(80,68,50,.4)' }); volume(c, bb, { dark: 'rgba(60,50,35,.3)', light: 'rgba(255,250,225,.3)' }); line(c, [[bb.x0 + 0.05, bb.y1 - 0.06], [bb.x1 - 0.05, bb.y1 - 0.06]], 'rgba(255,255,255,.5)', 0.025); } },
    { shapes: [blob(0, 0.04, 0.09, 0.09, 0, 14)], fill: { top: '#8f949a', bottom: '#575c63' }, stroke: 'rgba(30,35,40,.75)' },
  ] };
}
// Steinhaufen neben dem Kran
export function steinhaufen() {
  const blk = (x, y, w, h, s) => ({ shapes: [rectP(x, y, x + w, y + h)], fill: { top: '#dcd5c2', bottom: '#aaa28c' }, deco: (c, bb) => { ashlar(c, bb, { h: h, w: w * 0.9, seed: s, line: 'rgba(80,68,50,.4)' }); volume(c, bb, { dark: 'rgba(60,50,35,.3)', light: 'rgba(255,250,225,.3)' }); } });
  return { layers: [blk(-0.75, 0, 0.8, 0.5, 2), blk(0.08, 0, 0.7, 0.5, 4), blk(-0.4, 0.5, 0.75, 0.5, 6),
    { shapes: [rectP(-0.95, 0, 1.0, 0.07)], fill: WOOD_D }] };
}

// ----------------------------------------------------------------------------- Mörtelwanne (Holzzuber mit Eisenreifen)
export const WANNE = { w: 2.0, h: 0.72 };
export function wannePart() {
  const wb = 0.78, wt = 1.0, h = WANNE.h;
  return { layers: [
    { shapes: [poly([[-wb, 0], [wb, 0], [wt, h], [-wt, h]])], fill: WOOD,
      deco: (c, bb) => { for (let i = 1; i < 9; i++) { const t = i / 9; line(c, [[bb.x0 + bb.w * t, bb.y0], [bb.x0 + bb.w * t, bb.y1]], 'rgba(60,35,12,.4)', 0.015); } volume(c, bb, { dark: 'rgba(40,20,5,.35)', light: 'rgba(255,230,180,.2)' });
        for (const y of [0.17, 0.5]) line(c, [[-wb - (wt - wb) * y / h, y], [wb + (wt - wb) * y / h, y]], '#4b5058', 0.07); } },
    { shapes: [blob(0, h, wt + 0.04, 0.2, 0, 36)], fill: { top: '#d9b27a', bottom: '#a97d44' }, stroke: 'rgba(60,35,12,.7)' },
    { shapes: [blob(0, h + 0.015, wt - 0.1, 0.145, 0, 36)], fill: { top: '#5f4228', bottom: '#41291a' }, stroke: 'rgba(30,18,8,.6)' },           // leer: dunkles Holz innen
    { shapes: [blob(-wt - 0.02, h - 0.12, 0.07, 0.1, 0, 12), blob(wt + 0.02, h - 0.12, 0.07, 0.1, 0, 12)], fill: '#4b5058' },
  ] };
}
export const WANNE_SURF = { x: 0, y: WANNE.h + 0.015, rx: 0.9, ry: 0.145 };

// ----------------------------------------------------------------------------- Ziegelstapel mit Dachziegeln (tegulae)
export function ziegelPart() {
  const rows = [];
  const rr = mulberry32(5);
  const brick = (x, y, w, h) => ({ shapes: [rectP(x, y, x + w, y + h)], fill: { top: `hsl(${14 + Math.round(rr() * 8)},58%,56%)`, bottom: `hsl(${12 + Math.round(rr() * 8)},52%,42%)` }, stroke: 'rgba(80,35,20,.6)',
    deco: (c, bb) => { dot(c, bb.x0 + bb.w * 0.3, bb.y0 + bb.h * 0.6, 0.02, 'rgba(255,220,180,.4)'); volume(c, bb, { dark: 'rgba(60,20,10,.25)', light: 'rgba(255,220,180,.2)' }); } });
  for (let r = 0; r < 5; r++) for (let i = 0; i < 4; i++) rows.push(brick(-0.84 + i * 0.42 + (r % 2 ? 0.21 : 0) - (r % 2 ? 0.0 : 0), 0.0 + r * 0.16, 0.4, 0.15));
  // Dachziegel liegen schräg am Stapel (tegula: flach mit hochgezogenen Rändern)
  const tile = (x, y, rot) => {
    const a = [[-0.3, -0.08], [0.3, -0.08], [0.24, 0.1], [-0.24, 0.1]].map(([px, py]) => [x + px * Math.cos(rot) - py * Math.sin(rot), y + px * Math.sin(rot) + py * Math.cos(rot)]);
    return { shapes: [a], fill: { top: '#e3865a', bottom: '#b4562f' }, stroke: 'rgba(80,35,20,.65)', deco: (c, bb) => { line(c, [[bb.x0 + 0.06, bb.y0 + bb.h * 0.5], [bb.x1 - 0.06, bb.y0 + bb.h * 0.5]], 'rgba(90,35,15,.45)', 0.025); } };
  };
  return { layers: [...rows, tile(1.15, 0.2, 1.1), tile(1.05, 0.12, 1.25), tile(0.0, 0.88, 0.0), tile(0.2, 1.0, 0.05)] };
}

// ----------------------------------------------------------------------------- Glastisch mit Gefäßen (Glasbläser steht links davon)
export function glasTisch() {
  const glass = { top: 'rgba(186,236,226,0.95)', bottom: 'rgba(120,196,190,0.95)' };
  const hl = (c, x0, y0, x1, y1) => line(c, [[x0, y0], [x1, y1]], 'rgba(255,255,255,.8)', 0.022);
  return { layers: [
    { shapes: [rectP(-0.7, 0.62, 0.7, 0.72), rectP(-0.6, 0, -0.5, 0.62), rectP(0.5, 0, 0.6, 0.62)], fill: WOOD, deco: (c, bb) => { woodGrain(c, bb, { color: 'rgba(60,35,12,.4)', n: 4, seed: 2 }); } },
    // Flasche
    { shapes: [poly([[-0.5, 0.72], [-0.3, 0.72], [-0.27, 0.95], [-0.36, 1.05], [-0.36, 1.3], [-0.44, 1.3], [-0.44, 1.05], [-0.53, 0.95]], 2)], fill: glass, stroke: 'rgba(40,110,110,.75)', deco: (c) => { hl(c, -0.46, 0.8, -0.46, 0.94); } },
    // Schale
    { shapes: [poly([[-0.1, 0.72], [0.18, 0.72], [0.28, 0.9], [-0.2, 0.9]], 1)], fill: glass, stroke: 'rgba(40,110,110,.75)', deco: (c) => { hl(c, -0.12, 0.76, -0.06, 0.86); } },
    // Becher
    { shapes: [poly([[0.35, 0.72], [0.55, 0.72], [0.58, 1.0], [0.32, 1.0]], 1)], fill: glass, stroke: 'rgba(40,110,110,.75)', deco: (c) => { hl(c, 0.38, 0.78, 0.38, 0.95); } },
  ] };
}
