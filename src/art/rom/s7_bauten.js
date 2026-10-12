// Station 7 (Straßen, Wasser, Beton): Bauwerke als Papierschnitt-Teile für ctx.flat (Einheiten: Welt, ws = 1; x lokal um die Mitte, y nach oben).
//   aquaeduktPart / aquaeduktHinten  · Aquädukt mit drei Bogenreihen, Rinnenfenster und Wasserspeier
//   becken / bleirohr                · Brunnenbecken am Ende der Leitung, Bleirohr (Pb)
//   thermenPart                      · Badehaus im Schnitt: Ziegelpfeiler (Hypokaustum), Wandkanal, Ofen
//   strassePart                      · Erdreich mit leerem Graben für den Straßenquerschnitt
// Eigene Hilfen (nichts aus gemeinsamen Dateien geändert; archWall/ashlar/brickwork/roofTiles werden nur importiert).
import { poly, blob, limb, panel } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { archWall, rectP, ashlar, brickwork, roofTiles, plaster } from './_arch.js';
import { mulberry32 } from '../../engine/util.js';

// ----------------------------------------------------------------------------- Maße des Aquädukts (lokal, Mitte = 0)
export const AQ = {
  x0: -4.775, x1: 4.775,                                           // 9,55 breit (Seite: Mitte bei x = -6.825)
  rows: [
    { y0: 0, y1: 1.55, n: 5, open: 0.6, crown: 0.84 },             // unten: 5 große Bögen
    { y0: 1.55, y1: 2.7, n: 10, open: 0.56, crown: 0.8 },          // Mitte: 10 Bögen
    { y0: 2.7, y1: 3.35, n: 20, open: 0.5, crown: 0.78 },          // oben: 20 kleine Bögen
  ],
  capY0: 3.35, capY1: 4.35,
  win: { x0: -4.25, x1: 4.85, y0: 3.47, y1: 4.23 },               // Fenster in die Rinne (offen zum Wasserspeier)
  lipX: 5.0, lipY: 3.47,                                           // Spitze des Wasserspeiers
};

const STONE = { top: '#e0dac8', bottom: '#b6af9b' };
const STONE_D = { top: '#a9a493', bottom: '#85806f' };

function stoneDeco({ h = 0.2, w = 0.46, seed = 5, tone = 'rgba(100,85,60,.2)', ln = 'rgba(80,68,50,.38)', dark = 'rgba(60,50,35,.3)', light = 'rgba(255,250,225,.28)' } = {}, after) {
  return (c, bb) => { ashlar(c, bb, { tone, line: ln, h, w, seed }); volume(c, bb, { dark, light }); if (after) after(c, bb); };
}
function moss(c, bb, { h = 0.5, n = 90, seed = 3, color = 'rgba(86,142,58,.5)' } = {}) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) { const t = r(); dot(c, bb.x0 + r() * bb.w, bb.y0 + h * t * t * t, 0.02 + r() * 0.05, color, 0.55); }
}
// Keilsteine rund um jede Bogenöffnung + dunkle Laibung
function archDeco(x0, x1, y0, y1, n, { open, crown }, style = {}) {
  const base = stoneDeco(style);
  return (c, bb) => {
    base(c, bb);
    const bw = (x1 - x0) / n, ow = bw * open, r = ow / 2, yc = y0 + (y1 - y0) * crown, ys = yc - r, vw = Math.min(0.2, r * 0.34);
    for (let i = 0; i < n; i++) {
      const cx = x0 + bw * (i + 0.5), steps = Math.max(6, Math.round(r * 12));
      const arc = []; for (let k = 0; k <= steps; k++) { const a = (k / steps) * Math.PI; arc.push([cx + Math.cos(a) * r, ys + Math.sin(a) * r]); }
      for (let k = 0; k <= steps; k++) { const a = (k / steps) * Math.PI; line(c, [[cx + Math.cos(a) * r, ys + Math.sin(a) * r], [cx + Math.cos(a) * (r + vw), ys + Math.sin(a) * (r + vw)]], 'rgba(70,58,42,.5)', 0.012); }
      line(c, [...arc.map(([x, y]) => [x + (x < cx ? 0.0 : 0), y]), [cx - r, ys - 0.002]], 'rgba(40,32,22,.55)', 0.026);
      line(c, arc.map(([x, y]) => { const a = Math.atan2(y - ys, x - cx); return [cx + Math.cos(a) * (r + vw), ys + Math.sin(a) * (r + vw)]; }), 'rgba(70,58,42,.5)', 0.016);
    }
    if (style.moss) moss(c, bb, style.moss);
  };
}

// ----------------------------------------------------------------------------- Aquädukt (vorn)
export function aquaeduktPart() {
  const { x0, x1, rows, capY0, capY1, win, lipX, lipY } = AQ;
  const layers = [];
  rows.forEach((rw, k) => {
    layers.push({ shapes: archWall(x0, x1, rw.y0, rw.y1, rw.n, { open: rw.open, crown: rw.crown, seg: k === 0 ? 14 : 9 }), fill: STONE,
      deco: archDeco(x0, x1, rw.y0, rw.y1, rw.n, rw, { h: [0.24, 0.2, 0.15][k], w: [0.62, 0.5, 0.36][k], seed: 5 + k, moss: k === 0 ? { h: 0.55, seed: 4 } : null }) });
  });
  // Gesimse zwischen den Reihen
  for (const y of [rows[0].y1, rows[1].y1, capY0]) {
    layers.push({ shapes: [rectP(x0 - 0.1, y - 0.06, x1 + 0.1, y + 0.07)], fill: { top: '#efe9d7', bottom: '#cfc8b4' }, stroke: 'rgba(70,58,42,.45)',
      deco: (c, bb) => { for (let x = bb.x0 + 0.1; x < bb.x1; x += 0.22) line(c, [[x, bb.y0], [x, bb.y1]], 'rgba(90,75,55,.25)', 0.01); } });
  }
  // Rinnenkasten: Fenster nach rechts offen (Wasserspeier)
  const cap = [
    rectP(x0 - 0.12, capY0 + 0.01, win.x0, capY1),                                   // linker Block
    rectP(x0 - 0.12, capY0 + 0.01, win.x1, win.y0),                                  // Boden
    rectP(x0 - 0.12, win.y1, win.x1, capY1),                                         // Decke
    poly([[win.x1 - 0.2, win.y0 + 0.001], [lipX, lipY], [lipX + 0.02, lipY - 0.07], [win.x1 - 0.2, capY0 + 0.01]]), // Wasserspeier
  ];
  layers.push({ shapes: cap, fill: { top: '#e6e0ce', bottom: '#bcb5a0' }, deco: stoneDeco({ h: 0.22, w: 0.55, seed: 11 }) });
  layers.push({ shapes: [rectP(x0 - 0.18, capY1 - 0.1, win.x1 + 0.02, capY1 + 0.05)], fill: { top: '#f1ecdb', bottom: '#d3ccb7' }, stroke: 'rgba(70,58,42,.45)' }); // Deckgesims
  return { layers };
}
// Rückwand (dunkler, gleiche Bögen): man schaut durch die Öffnungen auf die zweite Mauer
export function aquaeduktHinten() {
  const { x0, x1, rows } = AQ;
  return { layers: rows.map((rw, k) => ({ shapes: archWall(x0, x1, rw.y0, rw.y1, rw.n, { open: rw.open, crown: rw.crown, seg: 8 }), fill: STONE_D,
    deco: stoneDeco({ h: [0.24, 0.2, 0.15][k], w: [0.62, 0.5, 0.36][k], seed: 21 + k, dark: 'rgba(30,25,18,.3)', light: 'rgba(255,250,225,.1)', tone: 'rgba(60,50,35,.2)', ln: 'rgba(40,34,24,.35)' }) })) };
}

// ----------------------------------------------------------------------------- Brunnenbecken am Ende der Leitung
export const BECKEN = { w: 1.7, h: 0.82 };
export function beckenPart() {
  const w = BECKEN.w / 2, h = BECKEN.h;
  return { layers: [
    { shapes: [rectP(-w, 0, w, h - 0.05)], fill: STONE, deco: stoneDeco({ h: 0.17, w: 0.4, seed: 8 }, (c, bb) => moss(c, bb, { h: 0.3, n: 40, seed: 9 })) },
    { shapes: [poly([[-w - 0.08, h - 0.08], [w + 0.08, h - 0.08], [w + 0.14, h + 0.05], [w - 0.08, h + 0.2], [-w + 0.08, h + 0.2], [-w - 0.14, h + 0.05]], 1)], fill: { top: '#f1ecdb', bottom: '#cfc8b4' }, stroke: 'rgba(70,58,42,.5)' },
    { shapes: [poly([[-w + 0.1, h + 0.0], [w - 0.1, h + 0.0], [w - 0.2, h + 0.15], [-w + 0.2, h + 0.15]], 1)], fill: { top: '#7fc3e0', bottom: '#4a96c4' }, stroke: 'rgba(30,70,110,.45)',
      deco: (c, bb) => { for (let i = 0; i < 4; i++) line(c, [[bb.x0 + 0.1 + i * 0.34, bb.y0 + 0.05 + (i % 2) * 0.04], [bb.x0 + 0.34 + i * 0.34, bb.y0 + 0.05 + (i % 2) * 0.04]], 'rgba(255,255,255,.65)', 0.02); } },
  ] };
}

// ----------------------------------------------------------------------------- Bleirohr (liegt auf Stützen)
export const ROHR = { w: 2.5, h: 0.62 };
export function bleirohrPart() {
  const w = ROHR.w / 2;
  const tube = (y, r) => limb([[-w + 0.2, y, r * 2], [w - 0.35, y, r * 2]], { per: 4 });
  return { layers: [
    { shapes: [rectP(-w + 0.45, 0, -w + 0.75, 0.2), rectP(w - 0.95, 0, w - 0.65, 0.2)], fill: { top: '#b58a62', bottom: '#8a6040' }, deco: (c, bb) => brickwork(c, bb, { h: 0.06, w: 0.12 }) },
    { shapes: [tube(0.32, 0.12), poly([[w - 0.5, 0.2], [w - 0.2, 0.2], [w - 0.18, 0.5], [w - 0.52, 0.5]], 1)], fill: { top: '#b4bfcb', bottom: '#6f7d8c' }, stroke: 'rgba(40,52,66,.7)',
      deco: (c, bb) => { line(c, [[bb.x0 + 0.1, 0.37], [bb.x1 - 0.5, 0.37]], 'rgba(255,255,255,.55)', 0.03); for (const t of [0.32, 0.64]) line(c, [[bb.x0 + (bb.w - 0.5) * t, 0.2], [bb.x0 + (bb.w - 0.5) * t, 0.44]], 'rgba(40,52,66,.55)', 0.035); } },
    { shapes: [rectP(-w + 0.12, 0.2, -w + 0.26, 0.44), rectP(w - 0.62, 0.2, w - 0.46, 0.44)], fill: { top: '#8c97a3', bottom: '#5d6a78' }, stroke: 'rgba(40,52,66,.7)' },   // Bund
  ] };
}

// ----------------------------------------------------------------------------- Badehaus im Schnitt mit Hypokaustum und Ofen
export const TH = {
  x0: -3.1, x1: 2.2,                    // gesamt (Ofen links)
  hx0: -2.0, hx1: 2.0,                  // Haus
  ch: { y0: 0.3, y1: 1.05 },            // Hohlraum unter dem Boden
  floorY: 1.25, wallTop: 3.0, roofTop: 3.6,
  flue: { x0: 1.45, x1: 1.8 },          // Wandkanal rechts
  pilae: [-1.65, -1.2, -0.75, -0.3, 0.15, 0.6, 1.05],
  mouth: { cx: -2.6, y0: 0.0, w: 0.42, h: 0.42 },
};
export function thermenPart() {
  const { hx0, hx1, ch, floorY, wallTop, roofTop, flue, pilae, mouth } = TH;
  const brick = { top: '#c8825a', bottom: '#9a5a3c' };
  const layers = [
    // Sockel und Mauern
    { shapes: [rectP(hx0 - 0.15, 0, hx1 + 0.15, ch.y0), rectP(hx1 - 0.4, 0, hx1 + 0.15, wallTop), rectP(hx0 - 0.15, ch.y1, hx0 + 0.35, wallTop), rectP(hx0 - 0.15, floorY, hx1 + 0.15, wallTop)],
      fill: STONE, deco: stoneDeco({ h: 0.2, w: 0.46, seed: 15 }) },
    // Ofen (Praefurnium) links, Mündung offen zum Hohlraum
    { shapes: [rectP(TH.x0, 0, hx0 - 0.1, 1.2), poly([[TH.x0 - 0.05, 1.2], [hx0 - 0.05, 1.2], [hx0 - 0.15, 1.38], [TH.x0 + 0.15, 1.38]], 1)], fill: { top: '#d9d2bf', bottom: '#aaa28c' }, deco: stoneDeco({ h: 0.17, w: 0.4, seed: 17 }) },
  ];
  // Raum innen (Putz) + Fries
  layers.push({ shapes: [rectP(hx0 + 0.35, floorY, hx1 - 0.4, wallTop - 0.1)], fill: { top: '#f3e6c4', bottom: '#e0c9a0' }, stroke: 'rgba(110,80,50,.4)',
    deco: (c, bb) => { plaster(c, bb, { color: 'rgba(150,100,60,.12)', n: 80, seed: 6 }); line(c, [[bb.x0, bb.y1 - 0.28], [bb.x1, bb.y1 - 0.28]], 'rgba(184,69,58,.7)', 0.07); line(c, [[bb.x0, bb.y0 + 0.5], [bb.x1, bb.y0 + 0.5]], 'rgba(120,150,170,.55)', 0.04); } });
  // Bogenfenster im Raum
  layers.push({ shapes: [poly([[-0.55, 1.95], [0.55, 1.95], [0.55, 2.5], [0.4, 2.7], [0, 2.8], [-0.4, 2.7], [-0.55, 2.5]], 1)], fill: { top: '#9fd2ea', bottom: '#d9efe6' }, stroke: 'rgba(110,80,50,.6)', deco: (c, bb) => { line(c, [[0, bb.y0], [0, bb.y1]], 'rgba(110,80,50,.5)', 0.03); line(c, [[bb.x0, 2.3], [bb.x1, 2.3]], 'rgba(110,80,50,.5)', 0.03); } });
  // Boden (Suspensura) als Ziegelplatten
  layers.push({ shapes: [rectP(hx0 + 0.3, floorY - 0.2, hx1 - 0.35, floorY + 0.02)], fill: brick, stroke: 'rgba(80,40,25,.6)', deco: (c, bb) => { for (let x = bb.x0 + 0.3; x < bb.x1; x += 0.5) line(c, [[x, bb.y0], [x, bb.y1]], 'rgba(60,30,18,.5)', 0.02); } });
  // Hohlraum (dunkel) und Pfeiler
  layers.push({ shapes: [rectP(hx0 - 0.1, ch.y0, hx1 - 0.4, floorY - 0.2)], fill: { top: '#3d2c28', bottom: '#241a18' }, stroke: null });
  layers.push({ shapes: pilae.map((x) => rectP(x - 0.11, ch.y0, x + 0.11, floorY - 0.2)), fill: brick, stroke: 'rgba(80,40,25,.6)', deco: (c, bb) => brickwork(c, bb, { h: 0.1, w: 0.22, brick: 'rgba(90,40,20,.2)', mortar: 'rgba(240,210,170,.4)', seed: 3 }) });
  // Wandkanal (Rauchabzug in der Mauer) innen dunkel
  layers.push({ shapes: [rectP(flue.x0, ch.y0, flue.x1, wallTop - 0.25)], fill: { top: '#3d2c28', bottom: '#241a18' }, stroke: 'rgba(40,25,20,.7)' });
  // Ofenmund: Rundbogen, innen dunkel (Glut kommt als bewegtes Teil davor)
  const m = mouth;
  layers.push({ shapes: [poly([[m.cx - m.w, 0.0], [m.cx + m.w, 0.0], [m.cx + m.w, m.h], ...Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI; return [m.cx + Math.cos(a) * m.w, m.h + Math.sin(a) * m.w]; }), [m.cx - m.w, m.h]])], fill: { top: '#2a1a14', bottom: '#150d0a' }, stroke: 'rgba(40,25,20,.8)' });
  // Dach
  layers.push({ shapes: [poly([[hx0 - 0.55, wallTop - 0.05], [hx1 + 0.45, wallTop - 0.05], [hx1 - 0.35, roofTop], [hx0 + 0.35, roofTop]], 0)], fill: { top: '#d4764a', bottom: '#a8502e' }, stroke: 'rgba(80,35,20,.6)', deco: (c, bb) => roofTiles(c, bb, { h: 0.16, w: 0.2 }) });
  // Schornstein am Ofen
  layers.push({ shapes: [rectP(TH.x0 + 0.25, 1.38, TH.x0 + 0.7, 2.15)], fill: { top: '#d9d2bf', bottom: '#aaa28c' }, deco: stoneDeco({ h: 0.17, w: 0.3, seed: 19 }) });
  return { layers };
}

// ----------------------------------------------------------------------------- Erdreich mit Graben (Straßenquerschnitt, Lagen kommen als bewegte Platten)
export const STR = { w: 5.0, trench: 3.2, ground: 2.0, soil: 0.25 };      // Graben von y = soil bis y = ground
export function strassePart() {
  const { w, trench, ground, soil } = STR, hw = w / 2, ht = trench / 2;
  const earth = { top: '#a77c52', bottom: '#6e4a2e' };
  const bank = (x0, x1) => ({ shapes: [panel(x0, x1, 0, ground - 0.12, { wave: 0.05, freq: 3, seed: x0 + 4, step: 0.12 })], fill: earth,
    deco: (c, bb) => { plaster(c, bb, { color: 'rgba(60,35,20,.35)', n: 130, seed: 4 }); const r = mulberry32(8); for (let i = 0; i < 12; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h * 0.8, 0.04 + r() * 0.05, 'rgba(190,170,140,.5)', 0.7); volume(c, bb, { dark: 'rgba(40,20,10,.35)', light: 'rgba(255,240,210,.12)' }); } });
  const grass = (x0, x1, s) => ({ shapes: [panel(x0 - 0.03, x1 + 0.03, ground - 0.2, 0.2, { wave: 0.03, freq: 6, seed: s, step: 0.1 })], fill: { top: '#8cc455', bottom: '#5f9a3a' },
    deco: (c, bb) => { const r = mulberry32(s); for (let i = 0; i < 28; i++) { const x = bb.x0 + r() * bb.w; line(c, [[x, bb.y0 + 0.12], [x + (r() - 0.5) * 0.08, bb.y1 + 0.02]], 'rgba(64,122,44,.7)', 0.02); } } });
  return { layers: [
    { shapes: [rectP(-hw, 0, hw, soil)], fill: earth, deco: (c, bb) => { plaster(c, bb, { color: 'rgba(60,35,20,.4)', n: 140, seed: 2 }); volume(c, bb, { dark: 'rgba(30,15,8,.45)', light: 'rgba(255,240,210,.0)' }); } },
    bank(-hw, -ht), bank(ht, hw), grass(-hw, -ht, 3), grass(ht, hw, 4),
  ] };
}
