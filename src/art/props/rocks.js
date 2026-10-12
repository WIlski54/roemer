// Gruppe E – Gestein & Gelände: Tafelberge, Klippe, Felsbrocken, Felsnadel, Vulkan, Nesthügel, Aschehügel, Meeresfelsen.
import { volume } from '../paint.js';
import {
  blob, limb, poly, TAU, rngOf, variantOf, mix, shade, leaf, rock, ribbon, wavy, cluster, beads, clipBelow, spline,
  fillPoly, fillPolys, fillGrad, strokePoly, curve, strokes, bandsH, finish, gradient, centerline, along, strand,
} from './_e_kit.js';

const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);

// zickzackige Risse (dunkle Linie + helle Kante daneben)
function crack(c, x, y, len, dir, rng, w = 0.02) {
  const pts = [[x, y]]; let px = x, py = y;
  const n = 5;
  for (let i = 0; i < n; i++) { px += Math.cos(dir) * len / n + (rng() - 0.5) * len * 0.22; py += Math.sin(dir) * len / n + (rng() - 0.5) * len * 0.12; pts.push([px, py]); }
  curve(c, pts.map(([a, b]) => [a + w * 0.9, b]), 'rgba(255,240,210,.35)', w * 0.7, { alpha: 1 });
  curve(c, pts, 'rgba(40,25,15,.75)', w, { alpha: 1 });
}
// Fels-Facetten: helle obere linke Fläche, dunkle untere rechte Fläche
function facets(c, bb, { light = 'rgba(255,245,220,.30)', dark = 'rgba(30,20,20,.30)', split = 0.55, tilt = 0.25 } = {}) {
  const { x0, x1, y0, y1, w, h } = bb;
  fillPoly(c, [[x0 - 1, y1 + 1], [x0 + w * (split + 0.05), y1 + 1], [x0 + w * (split - 0.2), y0 + h * 0.62], [x0 + w * 0.12, y0 + h * 0.38], [x0 - 1, y0 + h * 0.3]], light);
  fillPoly(c, [[x1 + 1, y0 - 1], [x1 + 1, y0 + h * 0.7], [x0 + w * (split + tilt), y0 + h * 0.46], [x0 + w * (split - 0.25), y0 - 1]], dark);
}

// ------------------------------------------------------------------------------------------------
// Rote Tafelberge ~8 x 3 m: waagerechte Schichten in Ocker/Rost/Terrakotta, Erosionsrillen, Geröllfuß
export function mesa_red(opts = {}) {
  const front = [[-4.0, 0], [-3.7, 0.35], [-3.55, 0.62], [-3.5, 1.4], [-3.46, 2.3], [-3.4, 2.55], [-2.6, 2.6], [-1.8, 2.55], [-1.72, 2.35], [-1.7, 1.95], [-1.55, 1.9], [-1.42, 1.2],
    [-1.35, 0.8], [-1.2, 0.55], [-0.9, 0.5], [-0.62, 0.62], [-0.55, 1.3], [-0.5, 2.4], [-0.45, 2.95], [0.4, 3.0], [0.7, 2.9], [1.5, 2.95], [1.62, 2.8], [1.65, 2.2], [1.8, 2.1],
    [1.95, 1.6], [2.05, 0.9], [2.2, 0.6], [2.5, 0.55], [2.7, 0.7], [2.75, 1.4], [2.8, 1.85], [3.5, 1.9], [3.55, 1.5], [3.62, 0.8], [3.8, 0.4], [4.0, 0]];
  const back1 = [[-2.1, 0.3], [-2.0, 1.2], [-1.95, 1.3], [-1.0, 1.35], [-0.9, 1.2], [-0.8, 0.3]];
  const back2 = [[1.75, 0.3], [1.85, 1.5], [1.95, 1.58], [2.9, 1.6], [3.0, 1.45], [3.05, 0.3]];
  const sFront = poly(front, 1);
  const layers = [];
  const bandsDef = [
    [0, 0.4, '#8e4a2c'], [0.4, 0.9, '#c0643c'], [0.9, 1.3, '#dba15a'], [1.3, 1.7, '#a9532f'], [1.7, 2.0, '#e6c48c'], [2.0, 2.5, '#c8683c'], [2.5, 2.75, '#dba15a'], [2.75, 3.6, '#b9582f'],
  ];
  layers.push({
    shapes: [sFront],
    fill: '#c9764a',
    deco(c, bb) {
      const rng = rngOf(opts.seed ?? 1, 111);
      const x0 = bb.x0 - 0.2, x1 = bb.x1 + 0.2;
      bandsDef.forEach(([a, b, col], i) => {
        const top = wavy(x0, x1, b, 0.03, 9 + i, { n: 100, phase: i * 1.7, seed: i }), bot = wavy(x0, x1, a, 0.03, 9 + (i - 1), { n: 100, phase: (i - 1) * 1.7, seed: i - 1 });
        fillPoly(c, ribbon(top, bot), col);
        curve(c, top, 'rgba(60,25,15,.5)', 0.022, { alpha: 1 });
        curve(c, top.map(([x, y]) => [x, y - 0.03]), 'rgba(255,225,170,.3)', 0.018, { alpha: 1 });
        curve(c, wavy(x0, x1, (a + b) / 2, 0.03, 11 + i, { n: 100, phase: i * 2.3, seed: i + 5 }), 'rgba(90,40,20,.18)', 0.012, { alpha: 1 });
      });
      // Erosionsrillen von den Kanten herab
      const ls = [];
      for (let k = 0; k < 90; k++) { const x = x0 + rng() * (x1 - x0), y = 0.55 + rng() * 2.5, l = 0.2 + rng() * 0.8; ls.push([x, y, x + (rng() - 0.5) * 0.04, y - l]); }
      strokes(c, ls, 'rgba(70,30,15,.42)', 0.035, 1);
      strokes(c, ls.map(([a, b, d, e]) => [a + 0.045, b, d + 0.045, e]), 'rgba(255,225,170,.22)', 0.02, 1);
      fillGrad(c, [[bb.x0 - 1, bb.y0 - 1], [bb.x1 + 1, bb.y0 - 1], [bb.x1 + 1, bb.y1 + 1], [bb.x0 - 1, bb.y1 + 1]], bb.x0, 0, bb.x1, 0, [[0, 'rgba(255,235,190,.22)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(60,20,20,.25)']]);
      volume(c, bb, { dark: 'rgba(60,20,10,.25)', light: 'rgba(255,240,200,.1)' });
      // Geröllfuß
      fillPoly(c, ribbon(wavy(x0, x1, 0.22, 0.06, 18, { n: 120, seed: 9, jit: 0.05 }), [[x1, -0.1], [x0, -0.1]].reverse()), 'rgba(110,55,35,.55)');
      for (let k = 0; k < 70; k++) { const x = x0 + rng() * (x1 - x0), y = rng() * 0.3; fillPoly(c, blob(x, y, 0.04 + rng() * 0.05, 0.03 + rng() * 0.03, rng() * 3, 8), rng() < 0.5 ? 'rgba(235,190,140,.7)' : 'rgba(90,40,25,.6)'); }
    },
  });
  return spec('mesa_red', 'Rote Tafelberge', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'terrain' }, { w: opts.w ?? 8, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Klippe aus gestapelten Gesteins-/Holzbändern 3 x 5 m, oben mit Gras
export function cliff_layers(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 121);
  const slabs = [   // [Dicke, Versatz, Breite, Farbe-oben, Farbe-unten]
    [0.72, 0.0, 2.9, '#8a6446', '#6a4a34'], [0.55, -0.14, 2.45, '#b58d5c', '#8f6a42'], [0.5, 0.16, 2.65, '#9c7552', '#76553b'], [0.64, -0.1, 2.3, '#c7a272', '#9d7a50'],
    [0.46, 0.14, 2.6, '#85624a', '#654733'], [0.58, -0.16, 2.4, '#b48a5c', '#8c6841'], [0.44, 0.1, 2.75, '#a07c58', '#7a5a3e'], [0.6, -0.1, 2.35, '#c4a070', '#9a7850'],
    [0.48, 0.14, 2.6, '#8d6a4c', '#6c4d36'], [0.5, -0.06, 2.5, '#b88f5e', '#906b44'],
  ];
  const layers = [];
  let y = 0;
  slabs.forEach(([t, dx, w, c1, c2], i) => {
    const r = rngOf(i + 130, 4);
    const j = (k = 0.12) => (r() - 0.5) * k;
    const L = (yy) => dx - w / 2 + j(0.16), R = (yy) => dx + w / 2 + j(0.16);
    const pts = [[L(), y + j(0.04)], [dx + j(0.3), y - 0.02], [R(), y + j(0.04)], [R() + 0.05, y + t * 0.35], [R() - 0.04, y + t * 0.7], [R(), y + t + j(0.04)], [dx + j(0.4), y + t + 0.02], [L(), y + t + j(0.04)],
      [L() - 0.05, y + t * 0.65], [L() + 0.04, y + t * 0.3]];
    const sh = poly(pts, 2);
    const y0 = y;
    layers.push({
      shapes: [sh], fill: { top: c1, bottom: c2 },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(30,15,5,.38)', light: 'rgba(255,235,190,.3)' });
        const rr = rngOf(i + 200, 5);
        for (let k = 0; k < 3; k++) curve(c, wavy(bb.x0, bb.x1, y0 + t * (0.25 + 0.25 * k), 0.015, 5 + k, { n: 40, phase: rr() * 6 }), 'rgba(50,25,10,.3)', 0.014, { alpha: 1 });
        if (rr() < 0.6) { const cx = bb.x0 + bb.w * (0.2 + rr() * 0.6); fillPoly(c, blob(cx, y0 + t * 0.5, 0.1, 0.05, 0, 14), 'rgba(40,20,8,.5)'); }
        crack(c, bb.x0 + bb.w * (0.15 + rr() * 0.7), y0 + t * 0.9, t * 0.8, -Math.PI / 2, rr, 0.016);
      },
    });
    y += t * 0.9;
  });
  const top = y + 0.05;
  // Erdschicht mit herabhängenden Wurzeln
  const soil = poly([[-1.35, top - 0.15], [-1.2, top + 0.05], [0, top + 0.1], [1.2, top + 0.05], [1.38, top - 0.15], [1.2, top - 0.3], [0.5, top - 0.22], [0, top - 0.32], [-0.6, top - 0.2], [-1.2, top - 0.3]], 2);
  const roots = [];
  for (let k = 0; k < 6; k++) { const x = -1.1 + k * 0.45 + rng() * 0.15; roots.push(limb([[x, top - 0.2, 0.06], [x + (rng() - 0.5) * 0.2, top - 0.5, 0.04], [x + (rng() - 0.5) * 0.3, top - 0.8 - rng() * 0.2, 0.015]], { per: 4 })); }
  layers.push({ shapes: [soil, ...roots], fill: { top: '#6a4a30', bottom: '#4a3222' }, deco(c, bb) { volume(c, bb); } });
  // Grasdecke mit überhängenden Halmen
  const capCtrl = [[-1.35, top + 0.0, 0.3], [-0.7, top + 0.18, 0.36], [0, top + 0.22, 0.38], [0.7, top + 0.18, 0.36], [1.32, top + 0.0, 0.3]];
  const capShapes = beads(capCtrl, { per: 4, rng, jit: 0.08, sy: 0.85 });
  for (const sd of [-1, 1]) for (let k = 0; k < 5; k++) {
    const x = sd * (1.0 + k * 0.1), yy = top + 0.0;
    capShapes.push(leaf(x, yy, -Math.PI / 2 + sd * (0.12 + k * 0.1), 0.45 + rng() * 0.25, 0.1, { fat: 0.3, curve: sd * 0.2 }));
  }
  for (let k = 0; k < 11; k++) { const x = -0.95 + k * 0.19; capShapes.push(leaf(x, top + 0.32, Math.PI / 2 + (rng() - 0.5) * 0.9, 0.3 + rng() * 0.22, 0.07, { fat: 0.3, curve: (rng() - 0.5) * 0.3 })); }
  layers.push({
    shapes: capShapes, fill: { top: '#9ccc58', bottom: '#4f8a34' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(10,50,10,.4)', light: 'rgba(255,255,190,.3)' });
      const rr = rngOf(1, 9);
      strokes(c, Array.from({ length: 40 }, () => { const x = bb.x0 + rr() * bb.w, yy = bb.y0 + rr() * bb.h; return [x, yy, x + (rr() - 0.5) * 0.08, yy + 0.14]; }), 'rgba(30,80,20,.4)', 0.016, 1);
    },
  });
  // Geröll am Fuß
  const rub = [rock(-1.3, 0.22, 0.3, 0.22, { seed: 3 }), rock(1.38, 0.17, 0.26, 0.19, { seed: 5 }), rock(-1.62, 0.09, 0.17, 0.12, { seed: 8 })];
  layers.push({
    shapes: rub, fill: { top: '#a39684', bottom: '#6e6458' },
    deco(c, bb) { volume(c, bb, { dark: 'rgba(30,20,20,.35)', light: 'rgba(255,245,220,.3)' }); },
  });
  return spec('cliff_layers', 'Geschichtete Klippe', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'terrain' }, { h: opts.h ?? 5, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Felsbrocken, 3 Varianten (seed 1/2/3): Einzelfels mit Moos | Doppelfels | flacher Schichtfels mit Grasbüschel
export function boulder(opts = {}) {
  const v = variantOf(opts, 3);
  const seed = opts.seed ?? 1;
  const layers = [];
  const rockLayer = (shapes, top, bot, o = {}) => ({
    shapes, fill: { top, bottom: bot },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(30,20,20,.4)', light: 'rgba(255,245,220,.25)' });
      facets(c, bb, o.facets);
      const rr = rngOf(seed + (o.salt || 0), 6);
      for (let k = 0; k < (o.cracks ?? 2); k++) crack(c, bb.x0 + bb.w * (0.25 + rr() * 0.5), bb.y1 - bb.h * (0.1 + rr() * 0.2), bb.h * 0.5, -Math.PI / 2 + (rr() - 0.5) * 0.9, rr, 0.022);
      // Sprenkel
      for (let k = 0; k < 22; k++) fillPoly(c, blob(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h, 0.012 + rr() * 0.02, 0.01 + rr() * 0.015, 0, 6), rr() < 0.5 ? 'rgba(255,245,220,.35)' : 'rgba(40,30,25,.3)');
      if (o.deco2) o.deco2(c, bb, rr);
    },
  });
  if (v === 0) {
    const r1 = rock(0, 0.5, 0.66, 0.5, { seed: 11 + seed, n: 12, rough: 0.14, smooth: 2 });
    layers.push(rockLayer([r1], '#b3a794', '#6f665a', { cracks: 2, deco2(c, bb, rr) {
      // Moospolster oben
      const mp = [blob(-0.22, 0.88, 0.24, 0.1, 0.2, 18), blob(-0.02, 0.96, 0.2, 0.08, 0, 16), blob(0.3, 0.8, 0.16, 0.07, -0.2, 14)];
      fillPolys(c, mp, '#7fae4e', 0.95); fillPolys(c, mp.map((p) => p.map(([x, y]) => [x, y + 0.03])), '#a7d36c', 0.7);
    } }));
  } else if (v === 1) {
    const r1 = rock(-0.18, 0.52, 0.6, 0.5, { seed: 21 + seed, n: 11, rough: 0.14, smooth: 2 });
    const r2 = rock(0.62, 0.22, 0.34, 0.24, { seed: 31 + seed, n: 9, rough: 0.14, smooth: 2 });
    layers.push(rockLayer([r1], '#a7a6a0', '#625f5e', { cracks: 2, salt: 1 }));
    layers.push(rockLayer([r2], '#b9b5aa', '#706a62', { cracks: 1, salt: 2 }));
  } else {
    // flacher, breiter Schichtfels
    const r1 = rock(0, 0.28, 0.78, 0.3, { seed: 41 + seed, n: 12, rough: 0.12, smooth: 2, flatBottom: true });
    layers.push(rockLayer([r1], '#bba98a', '#7a6a54', { cracks: 1, salt: 3, deco2(c, bb, rr) {
      for (let k = 0; k < 3; k++) curve(c, wavy(bb.x0 - 0.1, bb.x1 + 0.1, bb.y0 + bb.h * (0.28 + 0.2 * k), 0.02, 3 + k, { n: 40, phase: rr() * 6 }), 'rgba(50,35,20,.45)', 0.02, { alpha: 1 });
    } }));
    // Grasbüschel obendrauf
    const gl = [];
    for (let k = 0; k < 7; k++) gl.push(leaf(0.2 + (k - 3) * 0.025, 0.5, Math.PI / 2 + (k - 3) * 0.2, 0.2 + (k % 3) * 0.05, 0.04, { fat: 0.3, curve: (k - 3) * 0.06 }));
    layers.push({ shapes: gl, fill: { top: '#a8cf58', bottom: '#5f8a30' }, deco(c, bb) { volume(c, bb); } });
  }
  return spec('boulder', 'Felsbrocken', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'rock', variant: v + 1, variants: 3 }, { w: opts.w ?? [1.4, 1.5, 1.7][v], floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Felsnadel ~4 m: schlanker, geschichteter Felsturm mit heller und dunkler Seite
export function rock_pillar(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 141);
  const H = 4.2;
  const left = [], right = [];
  const N = 16;
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = H * t;
    let hw = 0.18 + 0.52 * Math.pow(1 - t, 0.75) + (i % 4 === 2 ? 0.1 : 0) - (i % 5 === 3 ? 0.06 : 0);
    if (t > 0.97) hw = 0.12;
    left.push([-hw - (rng() - 0.3) * 0.12 + 0.03 * t, y]);
    right.push([hw + (rng() - 0.3) * 0.12 + 0.03 * t, y]);
  }
  // Fußverbreiterung
  const pts = [[-1.0, 0], [-0.8, 0.25]].concat(left.slice(1), [[0.1, H + 0.12]], right.slice().reverse().slice(0, -1), [[0.82, 0.25], [1.02, 0]]);
  const body = poly(pts, 1);
  const rub = [rock(-0.9, 0.16, 0.3, 0.2, { seed: 4 }), rock(0.95, 0.14, 0.26, 0.17, { seed: 9 }), rock(-0.55, 0.06, 0.2, 0.1, { seed: 12 })];
  const layers = [{
    shapes: [body], fill: { top: '#d0b690', bottom: '#8f7658' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,25,10,.4)', light: 'rgba(255,245,215,.3)' });
      // dunkle rechte Seite: schräge Trennlinie
      fillPoly(c, [[0.02, -1], [0.1, H * 0.3], [0.0, H * 0.62], [0.04, H + 1], [bb.x1 + 1, H + 1], [bb.x1 + 1, -1]], 'rgba(60,35,20,.36)');
      fillPoly(c, [[bb.x0 - 1, H + 1], [-0.12, H + 1], [-0.18, H * 0.6], [-0.1, H * 0.25], [-0.2, -1], [bb.x0 - 1, -1]], 'rgba(255,240,205,.2)');
      // Schichtlinien (leicht schräg)
      const rr = rngOf(3, 7);
      for (let k = 0; k < 11; k++) {
        const y = 0.35 + k * 0.34 + (rr() - 0.5) * 0.08;
        curve(c, [[bb.x0, y - 0.04], [0, y + 0.02], [bb.x1, y - 0.03]], 'rgba(70,45,25,.5)', 0.026, { alpha: 1 });
        curve(c, [[bb.x0, y + 0.03], [0, y + 0.09], [bb.x1, y + 0.04]], 'rgba(255,240,205,.28)', 0.018, { alpha: 1 });
      }
      crack(c, 0.05, H * 0.9, 1.4, -Math.PI / 2, rr, 0.03);
      crack(c, -0.15, H * 0.5, 0.9, -Math.PI / 2 - 0.1, rr, 0.024);
    },
  }, {
    shapes: rub, fill: { top: '#b9a68a', bottom: '#75654f' },
    deco(c, bb) { volume(c, bb, { dark: 'rgba(40,25,10,.4)', light: 'rgba(255,245,215,.3)' }); },
  }];
  return spec('rock_pillar', 'Felsnadel', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'rock' }, { h: opts.h ?? 4.2, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Vulkan: Kegel ~9 m + Kratersee mit Lava, glühende Lavaschlieren, dunkler Rauchansatz (eigener Teil `smoke`). Gedeckter Fernblick-Stil.
export function volcano(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 151);
  const H = 9.0, rimHW = 1.55;
  const hw = (y) => rimHW + 5.4 * Math.pow(1 - y / H, 1.7);
  const L = [], R = [];
  const N = 22;
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = H * Math.pow(t, 0.92) * 0.985;
    const j = 0.1 * Math.sin(i * 1.9) + (rng() - 0.5) * 0.08;
    L.push([-hw(y) - j * (1 - t), y]); R.push([hw(y) + j * 0.8 * (1 - t) + 0.05, y]);
  }
  // Kraterrand: flache Ellipse oben
  const crater = { x: 0.0, y: H - 0.12, rx: 1.5, ry: 0.42 };
  const rim = [];
  for (let i = 1; i < 12; i++) { const a = Math.PI * (i / 12); rim.push([crater.x + Math.cos(a) * crater.rx, crater.y + Math.sin(a) * crater.ry]); }
  const outline = [[-hw(0) - 0.3, 0]].concat(L.slice(1, -1), [[-crater.rx, crater.y]], rim.slice().reverse(), [[crater.rx, crater.y]], R.slice(1, -1).reverse(), [[hw(0) + 0.35, 0]]);
  const cone = poly(outline, 1);
  const layers = [{
    shapes: [cone],
    fill: { top: '#6a5662', bottom: '#9d8a98' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,20,40,.25)', light: 'rgba(255,230,230,.12)' });
      // Rippen/Rinnen den Hang hinunter
      const rr = rngOf(4, 8);
      const ls = [];
      for (let k = 0; k < 34; k++) {
        const f = (rr() - 0.5) * 2, y0 = 1.2 + rr() * 7.6, y1 = y0 - 0.8 - rr() * 1.8;
        ls.push([f * hw(y0) * 0.92, y0, f * hw(y1) * 0.97, y1]);
      }
      strokes(c, ls, 'rgba(40,25,40,.4)', 0.07, 1);
      strokes(c, ls.map(([a, b, d, e]) => [a + 0.1, b, d + 0.1, e]), 'rgba(235,205,210,.22)', 0.04, 1);
      // dunkler Aschemantel oben
      fillGrad(c, [[bb.x0 - 1, 5], [bb.x1 + 1, 5], [bb.x1 + 1, H + 1], [bb.x0 - 1, H + 1]], 0, 5, 0, H, [[0, 'rgba(60,40,50,0)'], [1, 'rgba(50,34,44,.45)']]);
      // Dunst am Fuß (Fernblick)
      fillGrad(c, [[bb.x0 - 1, -1], [bb.x1 + 1, -1], [bb.x1 + 1, 2.8], [bb.x0 - 1, 2.8]], 0, 0, 0, 2.8, [[0, 'rgba(210,190,205,.5)'], [1, 'rgba(210,190,205,0)']]);
      // Lavaströme: breite, leicht schlängelnde, verzweigte Zungen mit Kruste + glühendem Kern
      const flow = (frac, ph, w0, y0, y1) => {
        const pts = [];
        const n = 6;
        for (let i = 0; i <= n; i++) {
          const t = i / n, y = y0 + (y1 - y0) * t;
          pts.push([frac * hw(y) * 0.88 + 0.2 * Math.sin(t * 5 + ph) * (0.3 + t), y, w0 * (1 - 0.5 * t) * (1 + 0.22 * Math.sin(t * 9 + ph))]);
        }
        pts[n][2] = w0 * 0.42;
        return pts;
      };
      const flows = [flow(-0.7, 0.3, 0.62, H - 0.3, 3.4), flow(0.05, 1.7, 0.56, H - 0.25, 1.9), flow(0.62, 3.1, 0.6, H - 0.3, 3.8), flow(-0.32, 2.2, 0.42, H - 0.3, 5.4), flow(0.36, 0.8, 0.42, H - 0.3, 4.8)];
      // Glutschein (Halo)
      const [gx, gy] = c.tf(0, H - 0.4);
      const rg = c.ctx.createRadialGradient(gx, gy, 0, gx, gy, 4.8 * c.S);
      rg.addColorStop(0, 'rgba(255,150,50,.5)'); rg.addColorStop(1, 'rgba(255,120,40,0)');
      c.ctx.save(); c.ctx.fillStyle = rg; c.ctx.fillRect(0, 0, c.W, c.H); c.ctx.restore();
      for (const f of flows) {
        const outer = limb(f.map((p) => [p[0], p[1], p[2] + 0.1]), { per: 5 });
        c.ctx.save(); c.ctx.shadowColor = 'rgba(255,130,40,.9)'; c.ctx.shadowBlur = c.S * 0.32;
        fillPoly(c, outer, '#6e2418', 0.95);                                        // dunkle Kruste (mit Glut-Schein)
        c.ctx.restore();
        const lp2 = limb(f.map((p) => [p[0], p[1], p[2]]), { per: 5 });
        fillGrad(c, lp2, 0, H, 0, 2, [[0, '#ffc23a'], [0.5, '#f07a22'], [1, '#d4501c']], 1);
        const lp3 = limb(f.map((p) => [p[0] - 0.02, p[1], p[2] * 0.4]), { per: 5 });
        fillGrad(c, lp3, 0, H, 0, 3, [[0, '#fff3b0'], [1, '#ffd15a']], 0.9);
      }
      for (let k = 0; k < 12; k++) { const y = 2 + rr() * 7, x = (rr() - 0.5) * hw(y) * 1.5; fillPoly(c, blob(x, y, 0.05 + rr() * 0.05, 0.04, 0, 8), 'rgba(255,170,60,.8)'); }
      // Kraterpfanne: dunkle Innenwand, glühender See
      fillGrad(c, blob(crater.x, crater.y, crater.rx, crater.ry, 0, 36), 0, crater.y + crater.ry, 0, crater.y - crater.ry, [[0, '#4a3238'], [1, '#2a1a20']], 1);
      fillGrad(c, blob(crater.x, crater.y - 0.02, crater.rx * 0.82, crater.ry * 0.7, 0, 36), 0, crater.y + 0.3, 0, crater.y - 0.3, [[0, '#ffd45a'], [0.55, '#f58a28'], [1, '#c8421c']], 1);
      fillPoly(c, blob(crater.x - 0.2, crater.y + 0.03, crater.rx * 0.45, crater.ry * 0.25, 0, 20), '#fff0a0', 0.8);
      curve(c, rim.map(([x, y]) => [x, y + 0.02]), 'rgba(255,225,200,.5)', 0.05, { alpha: 1 });
    },
  }];
  // Rauch: dunkle, wollige Wolkenballen
  const smokeCtrl = [[-0.05, H + 0.2, 0.7], [0.2, H + 0.85, 0.85], [-0.15, H + 1.5, 0.95]];
  const puffs = [];
  smokeCtrl.forEach(([x, y, r], i) => { puffs.push(...cluster(x, y, r, r * 0.85, { bumps: 8, rb: r * 0.5, seed: i + 20, jit: 0.15, inset: 0.85, core: 0.85 })); });
  const smokeTop = Math.max(...puffs.map((p) => Math.max(...p.map((q) => q[1]))));
  const smoke = {
    z: 0,
    pivot: [0, H - 0.05],
    layers: [{
      shapes: puffs, fill: { top: '#7a6e74', bottom: '#3c3238' },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(15,8,12,.35)', light: 'rgba(255,235,235,.22)' });
        // von der Lava von unten angeleuchtet
        fillGrad(c, [[bb.x0 - 1, H - 1], [bb.x1 + 1, H - 1], [bb.x1 + 1, H + 1.9], [bb.x0 - 1, H + 1.9]], 0, H - 0.2, 0, H + 1.9, [[0, 'rgba(255,140,50,.55)'], [1, 'rgba(255,140,50,0)']]);
        const rr = rngOf(2, 3);
        for (let k = 0; k < 6; k++) { const x = (rr() - 0.5) * 1.4, y = H + 0.6 + rr() * 2.4; curve(c, [[x - 0.4, y], [x, y + 0.2], [x + 0.4, y]], 'rgba(230,215,220,.28)', 0.06, { alpha: 1 }); }
      },
    }],
  };
  return spec('volcano', 'Vulkan', { smoke, body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, crater: [0, H - 0.1], smoke: [0, H + 0.6] }, { kind: 'terrain', coneHeightM: opts.h ?? H, ranges: { smoke: [0, 0.12] } }, { h: smokeTop * ((opts.h ?? H) / H), floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Nesthügel ~1,2 m Durchmesser, Seitenansicht: sandiger Wall mit Mulde (Anker `hollow` für Eier)
export function nest_mound(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 161);
  const far = [[-0.62, 0], [-0.58, 0.1], [-0.46, 0.26], [-0.34, 0.4], [-0.15, 0.46], [0.15, 0.46], [0.34, 0.41], [0.47, 0.27], [0.58, 0.1], [0.63, 0]];
  const body = poly(far, 2);
  const layers = [{
    shapes: [body], fill: { top: '#e6cf98', bottom: '#b8955c' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(90,55,20,.35)', light: 'rgba(255,245,210,.3)' });
      const rr = rngOf(6, 5);
      // Mulde: dunklere Innenwand (hinten) + Boden
      const hollow = blob(0, 0.36, 0.36, 0.1, 0, 36);
      fillGrad(c, hollow, 0, 0.46, 0, 0.26, [[0, '#6e4e2c'], [0.5, '#9a7440'], [1, '#c4a066']], 1);
      curve(c, [[-0.36, 0.37], [-0.2, 0.455], [0, 0.465], [0.2, 0.455], [0.36, 0.37]], 'rgba(70,45,20,.6)', 0.02, { alpha: 1 });
      // vordere Randlippe (hell, überdeckt Vorderkante der Mulde)
      curve(c, [[-0.36, 0.34], [-0.2, 0.27], [0, 0.255], [0.2, 0.27], [0.36, 0.34]], 'rgba(255,245,210,.75)', 0.035, { alpha: 1 });
      curve(c, [[-0.36, 0.33], [-0.2, 0.25], [0, 0.235], [0.2, 0.25], [0.36, 0.33]], 'rgba(120,80,40,.4)', 0.02, { alpha: 1 });
      // Sandkörner, Kratzspuren, Steinchen
      for (let k = 0; k < 70; k++) fillPoly(c, blob(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h * 0.7, 0.01 + rr() * 0.012, 0.008 + rr() * 0.008, 0, 6), rr() < 0.5 ? 'rgba(255,245,210,.55)' : 'rgba(100,65,30,.4)');
      for (let k = 0; k < 6; k++) { const x = -0.5 + rr() * 1.0, y = 0.02 + rr() * 0.12; curve(c, [[x, y], [x + 0.1, y + 0.03], [x + 0.2, y + 0.01]], 'rgba(110,75,35,.35)', 0.012, { alpha: 1 }); }
    },
  }];
  const stones = [blob(-0.58, 0.05, 0.07, 0.05, 0.3, 10), blob(0.52, 0.04, 0.06, 0.045, 0, 10), blob(0.64, 0.025, 0.04, 0.03, 0, 8), blob(-0.5, 0.02, 0.04, 0.03, 0, 8)];
  layers.push({ shapes: stones, fill: { top: '#b0a08a', bottom: '#6e6252' }, deco(c, bb) { volume(c, bb); } });
  return spec('nest_mound', 'Nesthügel', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, hollow: [0, 0.34] }, { kind: 'prop' }, { w: opts.w ?? 1.25, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Aschehügel (nach dem Einschlag): grauer, weicher Haufen, verkohlte Äste, ein paar Glutpunkte
export function ash_mound(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 171);
  const body = poly([[-1.15, 0], [-1.05, 0.2], [-0.8, 0.42], [-0.5, 0.55], [-0.3, 0.8], [-0.05, 0.9], [0.2, 0.82], [0.42, 0.66], [0.7, 0.58], [0.95, 0.34], [1.1, 0.14], [1.2, 0]], 2);
  const layers = [{
    shapes: [body], fill: { top: '#c3bdb6', bottom: '#7d7773' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,36,36,.4)', light: 'rgba(255,255,250,.35)' });
      const rr = rngOf(8, 2);
      // Windrippen
      for (let k = 0; k < 6; k++) {
        const y = 0.12 + k * 0.12;
        curve(c, [[-1.2 + k * 0.12, y], [-0.6, y + 0.05], [0, y + 0.07 - k * 0.012], [0.6, y + 0.02], [1.2 - k * 0.12, y]], 'rgba(60,55,55,.3)', 0.018, { alpha: 1 });
        curve(c, [[-1.2 + k * 0.12, y + 0.025], [-0.6, y + 0.075], [0, y + 0.095 - k * 0.012], [0.6, y + 0.045], [1.2 - k * 0.12, y + 0.025]], 'rgba(255,255,250,.3)', 0.014, { alpha: 1 });
      }
      for (let k = 0; k < 60; k++) fillPoly(c, blob(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h * 0.9, 0.012 + rr() * 0.02, 0.01 + rr() * 0.012, 0, 6), rr() < 0.5 ? 'rgba(255,255,250,.45)' : 'rgba(40,36,36,.35)');
    },
  }];
  // verkohlter Ast, der schräg im Aschehaufen liegt, und zwei kurze, abgebrochene Stummel
  const sticks = [limb([[-0.95, 0.16, 0.12], [-0.62, 0.34, 0.11], [-0.3, 0.52, 0.085], [-0.05, 0.62, 0.05]], { per: 6 }), limb([[-0.55, 0.38, 0.05], [-0.42, 0.6, 0.04], [-0.38, 0.72, 0.03]], { per: 4 }),
    limb([[0.4, 0.72, 0.08], [0.46, 0.84, 0.07], [0.44, 0.92, 0.06]], { per: 4 }), limb([[0.7, 0.55, 0.07], [0.82, 0.62, 0.065], [0.9, 0.64, 0.06]], { per: 4 })];
  layers.push({ shapes: sticks, fill: { top: '#3a3230', bottom: '#201a1a' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(0,0,0,.3)', light: 'rgba(255,255,255,.14)' }); } });
  // Glutpunkte
  const embers = [[-0.55, 0.3], [0.2, 0.55], [0.55, 0.28], [-0.1, 0.2]];
  layers.push({
    shapes: embers.map(([x, y]) => blob(x, y, 0.04, 0.028, 0, 10)), fill: '#f5902e', stroke: null,
    deco(c, bb) { for (const [x, y] of embers) fillPoly(c, blob(x, y, 0.02, 0.013, 0, 8), '#ffe27a', 0.95); },
  });
  return spec('ash_mound', 'Aschehügel', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'terrain' }, { w: opts.w ?? 2.4, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Meeresfelsen ~3 m: Felsturm im Wasser mit Grasschopf, Nebenfelsen, dunkler nasser Zone und Schaumkranz
export function island_rock(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 181);
  const main = poly([[-1.5, 0], [-1.35, 0.7], [-1.45, 1.4], [-1.2, 2.1], [-0.95, 2.7], [-0.5, 3.1], [0.1, 3.2], [0.6, 2.95], [0.85, 2.45], [0.95, 1.8], [1.15, 1.45], [1.25, 0.8], [1.35, 0]], 2);
  const side = poly([[1.0, 0], [1.15, 0.7], [1.35, 1.25], [1.7, 1.45], [2.0, 1.2], [2.15, 0.6], [2.3, 0]], 2);
  const layers = [{
    shapes: [main, side], fill: { top: '#9a948c', bottom: '#5c5a62' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(25,25,40,.35)', light: 'rgba(255,245,225,.3)' });
      facets(c, bb, { split: 0.45, tilt: 0.3 });
      const rr = rngOf(5, 6);
      // schräge Schichtung
      for (let k = 0; k < 9; k++) {
        const y = 0.5 + k * 0.32;
        curve(c, [[bb.x0, y], [0, y + 0.18], [bb.x1, y + 0.05]], 'rgba(45,40,50,.4)', 0.025, { alpha: 1 });
        curve(c, [[bb.x0, y + 0.04], [0, y + 0.22], [bb.x1, y + 0.09]], 'rgba(255,245,225,.22)', 0.018, { alpha: 1 });
      }
      crack(c, -0.3, 2.9, 1.2, -Math.PI / 2, rr, 0.03); crack(c, 0.45, 2.5, 0.9, -Math.PI / 2 - 0.1, rr, 0.024); crack(c, 1.75, 1.35, 0.6, -Math.PI / 2, rr, 0.02);
      // nasse dunkle Zone am Wasser
      fillGrad(c, [[bb.x0 - 1, -1], [bb.x1 + 1, -1], [bb.x1 + 1, 0.9], [bb.x0 - 1, 0.9]], 0, 0, 0, 0.9, [[0, 'rgba(25,40,60,.6)'], [1, 'rgba(25,40,60,0)']]);
      for (let k = 0; k < 18; k++) fillPoly(c, blob(bb.x0 + rr() * bb.w, 0.1 + rr() * 0.5, 0.025, 0.015, 0, 6), 'rgba(235,240,235,.55)');
    },
  }];
  // Grasschopf
  const cap = beads([[-0.55, 3.0, 0.2], [-0.1, 3.18, 0.26], [0.4, 3.0, 0.2]], { per: 3, rng, jit: 0.1, sy: 0.7 });
  for (let k = 0; k < 8; k++) cap.push(leaf(-0.4 + k * 0.12, 3.1, Math.PI / 2 + (k - 3.5) * 0.28, 0.36 + (k % 3) * 0.08, 0.06, { fat: 0.3, curve: (k - 3.5) * 0.05 }));
  layers.push({ shapes: cap, fill: { top: '#a8cf58', bottom: '#4f8a34' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(10,50,10,.4)', light: 'rgba(255,255,190,.3)' }); } });
  // Schaumkranz am Fuß (heller Wulst aus Kringeln)
  const foam = [];
  for (let k = 0; k < 17; k++) { const x = -1.7 + k * 0.245; foam.push(blob(x, 0.1 + (k % 2) * 0.05, 0.19, 0.14, 0, 14)); }
  layers.push({
    shapes: foam, fill: { top: '#ffffff', bottom: '#cfe6ee' },
    deco(c, bb) { volume(c, bb, { dark: 'rgba(60,110,140,.3)', light: 'rgba(255,255,255,.2)' }); for (let k = 0; k < 8; k++) curve(c, [[-1.6 + k * 0.47, 0.12], [-1.5 + k * 0.47, 0.2], [-1.4 + k * 0.47, 0.12]], 'rgba(90,150,180,.5)', 0.02, { alpha: 1 }); },
  });
  return spec('island_rock', 'Meeresfelsen', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.4, 1] }, waterline: [0, 0.1] }, { kind: 'terrain' }, { h: opts.h ?? 3.2, floor: 0 });
}
