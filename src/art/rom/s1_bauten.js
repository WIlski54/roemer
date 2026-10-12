// Station 1: Hirtenhütte (ovales Strohdach), Pflug (Hakenpflug aus Holz), Feuerstelle, Grotte der Wölfin (Lupercal), Flechtzaun.
// Seitenansicht, Meter, Boden y = 0, Mitte x = 0 (Pflug: Pflugschar-Spitze bei x = 0, schaut nach +x).
import { blob, limb, poly } from '../dsl.js';
import { dot, line, volume } from '../paint.js';
import { mix, strokes, fillPoly, curve, rngOf } from './s1_kit.js';

// ------------------------------------------------------------------------------------------ Hütte
export function huette(o = {}) {
  const rng = rngOf(o.seed ?? 4, 3);
  const W = 1.2;
  const walls = poly([[-W, 0], [W, 0], [W + 0.02, 0.5], [W - 0.04, 0.95], [-W + 0.04, 0.95], [-W - 0.02, 0.5]], 0);
  const roof = [[-1.7, 0.7], [-1.62, 0.78], [-1.3, 1.1], [-0.85, 1.52], [-0.4, 1.9], [-0.12, 2.18], [0.12, 2.18], [0.4, 1.9], [0.85, 1.52], [1.3, 1.1], [1.62, 0.78], [1.7, 0.7]];
  const fringe = []; for (let i = 0; i <= 17; i++) { const x = 1.7 - i * (3.4 / 17); fringe.push([x, 0.7 - (i % 2 ? 0.1 : 0.0) - rng() * 0.03]); }
  const roofPoly = [...roof, ...fringe];
  const parts = {};
  parts.body = { z: 1, layers: [
    // Stützpfosten, Lehm-Flechtwand, Steinsockel
    { shapes: [walls], fill: { top: '#d9c19a', bottom: '#b4956a' }, stroke: 'rgba(70,45,20,.55)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(60,35,15,.25)', light: 'rgba(255,240,205,.18)' });
        for (let x = -W + 0.08; x < W; x += 0.11) line(c, [[x, 0.12], [x + (rng() - 0.5) * 0.02, 0.95]], 'rgba(100,70,35,.45)', 0.014);
        for (let y = 0.25; y < 0.95; y += 0.17) line(c, [[-W, y + (rng() - 0.5) * 0.02], [W, y + (rng() - 0.5) * 0.02]], 'rgba(100,70,35,.28)', 0.012);
        for (let i = 0; i < 14; i++) fillPoly(c, [[-W + rng() * 2.2, 0.2 + rng() * 0.6], [-W + rng() * 2.2 + 0.2, 0.25 + rng() * 0.6], [-W + rng() * 2.2 + 0.1, 0.4 + rng() * 0.5]], 'rgba(235,215,170,.18)');
        // Steinsockel
        for (let x = -W; x < W; x += 0.22) fillPoly(c, [[x, 0], [x + 0.2, 0], [x + 0.19, 0.12 + rng() * 0.03], [x + 0.02, 0.13]], rng() < 0.5 ? '#9a9486' : '#867f72');
      } },
    // Tür: dunkle Öffnung mit Holzrahmen
    { shapes: [poly([[-0.3, 0], [0.3, 0], [0.3, 0.62], [0.24, 0.72], [-0.24, 0.72], [-0.3, 0.62]], 1)], fill: { top: '#2a1c12', bottom: '#4b3320' }, stroke: 'rgba(40,22,8,.8)',
      deco(c) { fillPoly(c, [[-0.2, 0], [0.2, 0], [0.18, 0.2], [-0.18, 0.2]], 'rgba(255,160,70,.2)'); } },
    { shapes: [limb([[-0.33, 0, 0.07], [-0.33, 0.74, 0.07]]), limb([[0.33, 0, 0.07], [0.33, 0.74, 0.07]]), poly([[-0.4, 0.7], [0.4, 0.7], [0.4, 0.8], [-0.4, 0.8]])], fill: { top: '#a8793f', bottom: '#7a5428' }, stroke: 'rgba(40,22,8,.7)' },
  ] };
  parts.roof = { z: 2, layers: [
    { shapes: [roofPoly], fill: { top: '#e6c56a', bottom: '#b88a3a' }, stroke: 'rgba(90,55,15,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(90,50,10,.28)', light: 'rgba(255,240,170,.3)' });
        const L = []; for (let i = 0; i < 380; i++) { const x = -1.7 + rng() * 3.4, y = 0.7 + rng() * 1.5; L.push([x, y, -1.45 + (x > 0 ? 0.28 : -0.28) + (rng() - 0.5) * 0.25, 0.12 + rng() * 0.12]); }
        strokes(c, L.filter((q) => q[1] < 2.2 - Math.abs(q[0]) * 0.7), 'rgba(120,80,20,.38)', 0.014, 1);
        strokes(c, L.slice(0, 160).map(([x, y, a, l]) => [x + 0.02, y + 0.01, a, l * 0.8]).filter((q) => q[1] < 2.2 - Math.abs(q[0]) * 0.7), 'rgba(255,238,170,.4)', 0.012, 1);
        // Bündelbänder
        for (const [y, k] of [[1.02, 0.5], [1.38, 0.28], [1.74, 0.14]]) curve(c, [[-1.8 + k * 0.4, y + 0.1], [0, y - 0.04], [1.8 - k * 0.4, y + 0.1]].map(([x, yy]) => [x * (1 - (y - 0.7) / 2.2), yy]), 'rgba(110,70,20,.45)', 0.02, 1);
      } },
    // gekreuzte Firststangen
    { shapes: [limb([[-0.22, 2.32, 0.05], [0.2, 2.05, 0.05]]), limb([[0.22, 2.32, 0.05], [-0.2, 2.05, 0.05]])], fill: '#8a5f2f', stroke: 'rgba(40,22,8,.7)' },
  ] };
  return { id: 'huette', parts, anchors: { door: [0, 0.3], top: [0, 2.3], smoke: [0, 2.2] }, meta: { name: 'Hirtenhütte', lengthM: 3.4, heightM: 2.35 } };
}

// ------------------------------------------------------------------------------------------ Pflug
export function pflug(o = {}) {
  const wood = { top: '#b98a52', bottom: '#80582c' };
  const parts = { body: { z: 2, layers: [
    // Sohle auf dem Boden + Schar (Eisen)
    { shapes: [poly([[-0.55, 0.0], [-0.08, 0.0], [-0.06, 0.1], [-0.55, 0.12]], 1)], fill: wood, stroke: 'rgba(40,22,8,.7)' },
    { shapes: [poly([[-0.2, 0.14], [0.14, 0.0], [-0.2, 0.0]], 0), limb([[-0.2, 0.18, 0.06], [-0.18, 0.04, 0.05]])], fill: { top: '#b9bec4', bottom: '#7d848c' }, stroke: 'rgba(40,45,55,.75)' },
    // Griff (Sterz) und Deichsel (Balken) zum Joch
    { shapes: [limb([[-0.34, 0.1, 0.075], [-0.42, 0.5, 0.065], [-0.55, 0.96, 0.052]])], fill: wood, stroke: 'rgba(40,22,8,.7)' },
    { shapes: [limb([[-0.32, 0.22, 0.08], [0.5, 0.46, 0.068], [1.7, 0.94, 0.06]])], fill: wood, stroke: 'rgba(40,22,8,.7)', deco(c) { line(c, [[-0.2, 0.26], [1.6, 0.94]], 'rgba(255,230,180,.28)', 0.012); } },
    { shapes: [limb([[-0.36, 0.34, 0.05], [-0.1, 0.12, 0.04]])], fill: '#8a5f2f', stroke: 'rgba(40,22,8,.7)' },
    // Strick am Joch
    { shapes: [blob(1.7, 0.94, 0.07, 0.07)], fill: '#c9a25a', stroke: 'rgba(70,45,15,.7)' },
  ] } };
  return { id: 'pflug', parts, anchors: { tip: [0, 0], hand: [-0.55, 0.96], hitch: [1.7, 0.94] }, meta: { name: 'Pflug', lengthM: 2.3, heightM: 1.0 } };
}

// ------------------------------------------------------------------------------------------ Feuerstelle (Flamme = eigener Teil „flame“, wippt)
export function feuer(o = {}) {
  const rng = rngOf(3, 8);
  const stones = []; for (let i = 0; i < 9; i++) { const a = Math.PI * (i / 8); stones.push(blob(-0.34 + i * 0.085, 0.045 + Math.sin(a) * 0.015, 0.06, 0.045, rng() * 2, 10)); }
  const parts = {
    body: { z: 1, layers: [
      { shapes: [limb([[-0.28, 0.1, 0.07], [0.26, 0.2, 0.07]]), limb([[0.28, 0.1, 0.07], [-0.26, 0.2, 0.07]])], fill: { top: '#8a5a30', bottom: '#4a2f18' }, stroke: 'rgba(30,15,5,.8)' },
      { shapes: stones, fill: { top: '#b6b0a2', bottom: '#7f796c' }, stroke: 'rgba(50,45,40,.7)' },
    ] },
    flame: { z: 2, pivot: [0, 0.14], layers: [
      { shapes: [poly([[-0.2, 0.14], [-0.16, 0.45], [-0.06, 0.34], [0.0, 0.7], [0.1, 0.36], [0.2, 0.46], [0.2, 0.14]], 2)], fill: { top: '#ffd24a', bottom: '#f0701a' }, stroke: 'rgba(160,50,0,.55)' },
      { shapes: [poly([[-0.09, 0.14], [-0.06, 0.34], [0.0, 0.44], [0.07, 0.3], [0.09, 0.14]], 2)], fill: { top: '#fff6c0', bottom: '#ffd24a' }, stroke: null },
    ] },
  };
  return { id: 'feuer', parts, anchors: { flame: [0, 0.4], smoke: [0, 0.75] }, meta: { name: 'Feuerstelle', lengthM: 0.8, heightM: 0.75, pivots: { flame: [0, 0.14] }, ranges: { flame: [0, 0.2] } } };
}

// ------------------------------------------------------------------------------------------ Grotte (Lupercal): Felshügel mit dunkler Höhle, Moos und Efeu
export function grotte(o = {}) {
  const rng = rngOf(o.seed ?? 5, 9);
  const rockPts = [[-1.9, 0], [-1.85, 0.4], [-1.7, 0.9], [-1.4, 1.35], [-1.0, 1.7], [-0.5, 1.95], [0.1, 2.08], [0.7, 2.0], [1.2, 1.78], [1.6, 1.4], [1.85, 0.95], [1.95, 0.45], [1.98, 0]];
  const rock = poly(rockPts, 2);
  const hole = poly([[-0.85, 0], [-0.88, 0.6], [-0.62, 1.1], [-0.2, 1.38], [0.28, 1.4], [0.7, 1.12], [0.92, 0.62], [0.9, 0]], 2);
  const parts = {};
  parts.body = { z: 1, layers: [
    { shapes: [rock], fill: { top: '#bfae92', bottom: '#8d7b62' }, stroke: 'rgba(60,40,20,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(50,30,15,.28)', light: 'rgba(255,240,205,.22)' });
        // Gesteinsbänder und Risse
        for (let i = 0; i < 6; i++) curve(c, Array.from({ length: 12 }, (_, k) => [-2 + k * 0.36, 0.35 + i * 0.3 + Math.sin(k * 1.3 + i) * 0.05]), 'rgba(80,55,30,.22)', 0.02, 1);
        for (let i = 0; i < 18; i++) { const x = -1.8 + rng() * 3.6, y = 0.2 + rng() * 1.6; curve(c, [[x, y], [x + 0.05, y - 0.1], [x - 0.03, y - 0.22], [x + 0.04, y - 0.34]], 'rgba(60,40,20,.4)', 0.014, 1); }
        for (let i = 0; i < 40; i++) dot(c, -1.8 + rng() * 3.6, 0.15 + rng() * 1.8, 0.015 + rng() * 0.02, rng() < 0.5 ? 'rgba(255,240,210,.25)' : 'rgba(50,30,15,.25)');
        fillPoly(c, [[-1.95, 0], [-1.2, 0], [-1.0, 1.6], [-1.9, 1.0]], 'rgba(255,240,205,.1)');
      } },
    // Moos und Gras obenauf
    { shapes: [poly([[-1.75, 1.0], [-1.45, 1.4], [-1.05, 1.76], [-0.5, 2.0], [0.1, 2.12], [0.7, 2.04], [1.2, 1.82], [1.62, 1.44], [1.8, 1.05], [1.55, 1.2], [1.2, 1.5], [0.75, 1.7], [0.1, 1.82], [-0.5, 1.72], [-1.0, 1.5], [-1.45, 1.15]], 1)], fill: { top: '#8fbf5c', bottom: '#5f9a42' }, stroke: 'rgba(30,70,20,.55)',
      deco(c) { for (let i = 0; i < 50; i++) { const x = -1.7 + rng() * 3.4, y = 1.1 + rng() * 0.9; line(c, [[x, y], [x + (rng() - 0.5) * 0.06, y + 0.1 + rng() * 0.08]], 'rgba(40,90,25,.5)', 0.012); } } },
  ] };
  parts.hohle = { z: 2, layers: [
    { shapes: [hole], fill: { top: '#4a3828', bottom: '#241810' }, stroke: 'rgba(30,15,5,.8)',
      deco(c, bb) { fillPoly(c, [[-0.5, 0], [0.5, 0], [0.4, 0.5], [-0.4, 0.5]], 'rgba(255,200,120,.16)'); fillPoly(c, [[-0.8, 0], [0.8, 0], [0.7, 0.2], [-0.7, 0.2]], 'rgba(0,0,0,.25)'); } },
    // Efeu über dem Eingang
    { shapes: [limb([[-0.9, 1.0, 0.04], [-0.84, 0.7, 0.04], [-0.9, 0.4, 0.03]]), limb([[0.7, 1.15, 0.04], [0.8, 0.85, 0.035], [0.74, 0.55, 0.03]]), limb([[-0.4, 1.4, 0.035], [-0.36, 1.18, 0.03], [-0.42, 1.0, 0.025]]), limb([[0.2, 1.42, 0.035], [0.26, 1.2, 0.03], [0.2, 1.05, 0.025]])], fill: '#4f8a3c', stroke: 'rgba(25,60,15,.6)',
      deco(c) { for (let i = 0; i < 18; i++) dot(c, -0.95 + rng() * 1.9, 0.5 + rng() * 0.9, 0.035, i % 2 ? '#6aa04a' : '#3f7a34', 0.9); } },
  ] };
  return { id: 'grotte', parts, anchors: { mouth: [0, 0.7], top: [0, 2.1] }, meta: { name: 'Grotte der Wölfin', lengthM: 3.9, heightM: 2.1 } };
}

// ------------------------------------------------------------------------------------------ Flechtzaun (Pferch)
export function zaun(o = {}) {
  const rng = rngOf(o.seed ?? 2, 4);
  const W = o.w || 2.2, posts = []; for (let x = -W / 2; x <= W / 2 + 0.01; x += W / 5) posts.push(limb([[x, 0, 0.07], [x + (rng() - 0.5) * 0.02, 0.78, 0.06]]));
  const rails = [0.26, 0.5, 0.72].map((y) => limb([[-W / 2, y, 0.05], [0, y + (rng() - 0.5) * 0.03, 0.05], [W / 2, y, 0.05]]));
  return { id: 'zaun', parts: { body: { z: 1, layers: [
    { shapes: rails, fill: { top: '#b88c58', bottom: '#8a6030' }, stroke: 'rgba(40,22,8,.65)', deco(c) { for (let i = 0; i < 24; i++) { const x = -W / 2 + rng() * W, y = 0.2 + rng() * 0.55; line(c, [[x, y], [x + 0.05, y + 0.04]], 'rgba(255,230,180,.3)', 0.01); } } },
    { shapes: posts, fill: { top: '#a8793f', bottom: '#6e4a24' }, stroke: 'rgba(40,22,8,.7)' },
  ] } }, anchors: {}, meta: { name: 'Zaun', lengthM: W, heightM: 0.8 } };
}
