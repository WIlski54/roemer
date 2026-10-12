// Station 1: die Wölfin der Sage (warm, freundlich, Seitenansicht nach +x). Teile: body (+Beine), neck (Hals+Kopf, nickt), tail (wedelt).
// Länge mit Schwanz ≈ 1,9 m, Schulterhöhe ≈ 0,8 m. Meter, Boden y = 0.
import { blob, limb, poly } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';
import { mix, strokes, fillPoly, curve, rngOf } from './s1_kit.js';

const FUR = { dark: '#7a6347', mid: '#b99b72', light: '#e8dbbc', sock: '#6d5740' };
const TY = 0.1; // Rumpf etwas höher: längere Beine

export function wolfin(o = {}) {
  const rng = rngOf(o.seed ?? 3, 7);
  const body = {
    z: 2,
    layers: [
      // ferne Beine (dunkler, hinter dem Rumpf)
      { shapes: [limb([[0.5, 0.66, 0.15], [0.5, 0.36, 0.105], [0.51, 0.07, 0.085]]), blob(0.55, 0.04, 0.1, 0.048, 0.05), limb([[-0.2, 0.6, 0.15], [-0.16, 0.3, 0.105], [-0.18, 0.07, 0.085]]), blob(-0.11, 0.04, 0.105, 0.048, 0.05)],
        fill: { top: mix(FUR.mid, '#000000', 0.35), bottom: mix(FUR.sock, '#000000', 0.25) }, stroke: 'rgba(50,30,15,.5)' },
      // Rumpf, nahe Beine
      { shapes: [blob(0.0, 0.66 + TY, 0.44, 0.2, -0.03), blob(0.34, 0.64 + TY, 0.2, 0.22), blob(-0.34, 0.66 + TY, 0.18, 0.2),
        limb([[0.33, 0.66, 0.18], [0.34, 0.36, 0.12], [0.345, 0.075, 0.092]]), blob(0.39, 0.045, 0.11, 0.05, 0.04),
        blob(-0.36, 0.58, 0.19, 0.22, -0.3), limb([[-0.36, 0.52, 0.15], [-0.29, 0.29, 0.11], [-0.34, 0.075, 0.09]]), blob(-0.28, 0.045, 0.115, 0.05, 0.04)],
      fill: { stops: [[0, FUR.dark], [0.42, FUR.mid], [0.8, FUR.light], [1, FUR.light]], dir: 'v' }, stroke: 'rgba(50,30,15,.55)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(60,35,15,.18)', light: 'rgba(255,245,215,.22)' });
        // dunkler Sattel auf dem Rücken
        fillPoly(c, [[-0.44, 0.94], [-0.2, 0.98], [0.15, 0.99], [0.38, 0.96], [0.3, 0.9], [0.0, 0.86], [-0.3, 0.87]], 'rgba(70,50,30,.36)');
        const L = []; for (let i = 0; i < 70; i++) { const x = -0.5 + rng() * 1.0, y = 0.45 + rng() * 0.5; L.push([x, y, -0.6 + (rng() - 0.5) * 0.7, 0.045 + rng() * 0.05]); }
        strokes(c, L, 'rgba(60,40,20,.22)', 0.01, 1);
        strokes(c, L.slice(0, 40).map(([x, y, a, l]) => [x + 0.012, y + 0.012, a, l * 0.8]), 'rgba(255,245,215,.2)', 0.008, 1);
        // helle Brust
        fillPoly(c, [[0.46, 0.86], [0.55, 0.72], [0.5, 0.58], [0.4, 0.52], [0.3, 0.58], [0.27, 0.7], [0.33, 0.84]], 'rgba(244,234,208,.75)');
        for (let i = 0; i < 6; i++) line(c, [[0.3 + i * 0.04, 0.68 - (i % 2) * 0.03], [0.31 + i * 0.04, 0.56 + (i % 3) * 0.02]], 'rgba(120,95,60,.28)', 0.008);
        // dunkle „Socken“ an den Pfoten
        for (const x of [0.345, -0.34]) fillPoly(c, [[x - 0.07, 0.0], [x + 0.15, 0.0], [x + 0.1, 0.16], [x - 0.06, 0.19]], 'rgba(80,60,40,.34)');
      } },
    ],
  };
  const tail = {
    z: 1, pivot: [-0.46, 0.78],
    layers: [{ shapes: [limb([[-0.4, 0.8, 0.14], [-0.62, 0.78, 0.18], [-0.8, 0.64, 0.18], [-0.86, 0.44, 0.14], [-0.85, 0.26, 0.05]], { per: 8 })],
      fill: { stops: [[0, FUR.dark], [0.55, FUR.mid], [1, '#efe2c2']], dir: 'v' }, stroke: 'rgba(50,30,15,.55)',
      deco(c, bb) { const L = []; for (let i = 0; i < 40; i++) L.push([bb.x0 + rng() * bb.w, bb.y0 + rng() * bb.h, -1.7 + (rng() - 0.5) * 0.6, 0.06 + rng() * 0.05]); strokes(c, L, 'rgba(60,40,20,.3)', 0.01, 1); } }],
  };
  // Kopf etwas gesenkt: sie schaut liebevoll auf die Zwillinge
  const neck = {
    z: 3, pivot: [0.4, 0.78],
    layers: [
      { shapes: [limb([[0.34, 0.72, 0.3], [0.5, 0.82, 0.24], [0.64, 0.88, 0.2]]), blob(0.72, 0.89, 0.14, 0.125),
        poly([[0.78, 0.96], [0.94, 0.9], [1.05, 0.85], [1.08, 0.8], [1.0, 0.755], [0.86, 0.755], [0.77, 0.79]], 2), poly([[0.66, 0.8], [0.6, 0.69], [0.74, 0.72]], 1)],
      fill: { stops: [[0, FUR.dark], [0.5, '#ab8e68'], [1, '#d9c7a0']], dir: 'v' }, stroke: 'rgba(50,30,15,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(60,35,15,.12)', light: 'rgba(255,245,215,.18)' });
        // helle Schnauze, Wange und Kehle
        fillPoly(c, [[0.82, 0.86], [0.98, 0.83], [1.07, 0.8], [1.02, 0.75], [0.86, 0.75], [0.76, 0.77], [0.74, 0.82]], 'rgba(244,234,208,.75)');
        fillPoly(c, [[0.66, 0.78], [0.58, 0.68], [0.5, 0.7], [0.5, 0.8]], 'rgba(244,234,208,.6)');
        const L = []; for (let i = 0; i < 36; i++) L.push([0.38 + rng() * 0.4, 0.7 + rng() * 0.28, -0.4 + (rng() - 0.5) * 0.6, 0.04 + rng() * 0.04]); strokes(c, L, 'rgba(60,40,20,.25)', 0.01, 1);
        // Auge: groß und freundlich, sanfte Braue
        eye(c, 0.84, 0.925, 0.034, { color: '#4a2e12', white: '#fff6dc', look: 0.3 });
        curve(c, [[0.79, 0.975], [0.85, 0.985], [0.92, 0.96]], 'rgba(60,40,20,.7)', 0.012, 1);
        // Mund: ein leises Lächeln
        curve(c, [[1.05, 0.782], [0.99, 0.768], [0.93, 0.778], [0.89, 0.805]], 'rgba(80,40,30,.85)', 0.012, 1);
        dot(c, 1.075, 0.815, 0.03, '#2b1b15'); dot(c, 1.067, 0.825, 0.008, 'rgba(255,255,255,.6)');
        dot(c, 0.78, 0.84, 0.04, 'rgba(230,130,110,.32)');
      } },
      // Ohren (fernes dunkler, nahes mit rosa Innenseite)
      { shapes: [poly([[0.77, 1.0], [0.82, 1.17], [0.9, 0.98]], 1)], fill: { top: FUR.dark, bottom: FUR.mid }, stroke: 'rgba(50,30,15,.6)' },
      { shapes: [poly([[0.62, 0.98], [0.6, 1.17], [0.74, 1.03]], 1)], fill: { top: FUR.dark, bottom: FUR.mid }, stroke: 'rgba(50,30,15,.6)',
        deco(c) { fillPoly(c, [[0.635, 1.01], [0.625, 1.12], [0.7, 1.04]], 'rgba(232,165,145,.75)'); } },
    ],
  };
  return {
    id: 'wolfin', parts: { tail, body, neck },
    anchors: { head: [0.72, 0.89], mouth: [1.02, 0.78], eye: [0.84, 0.925], foot: [0.3, 0], back: [0.0, 0.96] },
    meta: { name: 'Wölfin', lengthM: 1.9, heightM: 1.17, pivots: { neck: [0.4, 0.78], tail: [-0.46, 0.78] }, ranges: { neck: [0, 0.4], tail: [0, 0.35] }, swing: {} },
  };
}
