// Station 8: Handelsschiff (nach Art der römischen Rheinschiffe, mit Fässern, Segel und vier Rudern) und ein kleines Boot.
//   Blickrichtung +x (Bug rechts). Oberkante der Kimm bei y = 0 (steht im gemalten Wasser).
import { poly, blob, limb } from '../dsl.js';
import { stroke, rectP, mixHex, fillM, circM, gradM, woodGrain, volume, line, dot } from './s8_kit.js';
import { mulberry32 } from '../../engine/util.js';

const shade = (a, t) => mixHex(a, '#1c1410', t);
const lite = (a, t) => mixHex(a, '#ffffff', t);
const TAU = Math.PI * 2;

export const OAR_X = [-1.25, -0.4, 0.45, 1.3], OAR_Y = 0.74;

function oarLayer(x) {
  const shaft = limb([[x + 0.34, 1.0, 0.07], [x, OAR_Y, 0.07], [x - 0.5, 0.2, 0.08]], { per: 4, caps: false });
  const blade = poly([[x - 0.46, 0.3], [x - 0.62, 0.12], [x - 0.7, 0.02], [x - 0.46, 0.0], [x - 0.34, 0.12]], 1);
  return { shapes: [shaft, blade], fill: { top: '#c19a62', bottom: '#8f6a38' }, stroke, deco(c) { line(c, [[x + 0.3, 0.98], [x - 0.45, 0.25]], 'rgba(60,35,15,.3)', 0.015); } };
}

export function schiff() {
  const hullPts = [[-1.8, 0.05], [-0.6, 0.0], [0.9, 0.0], [1.78, 0.12], [2.2, 0.5], [2.42, 0.98], [2.2, 0.9], [1.6, 0.8], [0.4, 0.7], [-0.8, 0.74], [-1.8, 0.92], [-2.2, 1.45], [-2.32, 1.3], [-2.26, 0.8], [-2.0, 0.3]];
  const hull = poly(hullPts, 1);
  const wood = '#9a6e46';
  const layers = [];
  // Rumpf mit Bordwänden (Klinkerlinien), Teerstreifen unten, Ruderpforten
  layers.push({
    shapes: [hull], fill: { top: lite(wood, 0.12), bottom: shade(wood, 0.35) }, stroke,
    deco(c, bb) {
      const { ctx, tf, S } = c;
      woodGrain(c, bb, { color: 'rgba(50,28,10,.3)', n: 5, seed: 8 });
      const lerpPts = (P, x) => { for (let i = 0; i < P.length - 1; i++) if (x <= P[i + 1][0]) { const t = (x - P[i][0]) / (P[i + 1][0] - P[i][0]); return P[i][1] + (P[i + 1][1] - P[i][1]) * t; } return P[P.length - 1][1]; };
      const SHEER = [[-2.1, 1.3], [-1.8, 0.92], [-0.8, 0.74], [0.4, 0.7], [1.6, 0.8], [2.2, 0.92]], BOT = [[-1.9, 0.12], [-0.6, 0.0], [0.9, 0.0], [1.8, 0.14], [2.2, 0.5]];
      for (const k of [0.3, 0.55, 0.78]) { // Planken folgen der Bordlinie
        const pts = []; for (let i = 0; i <= 26; i++) { const x = -2.05 + (4.25 * i) / 26, sh = lerpPts(SHEER, x), bt = lerpPts(BOT, x); pts.push([x, bt + (sh - bt) * k]); }
        line(c, pts, 'rgba(50,28,10,.42)', 0.022);
      }
      line(c, [[-1.7, 0.12], [-0.6, 0.07], [0.9, 0.07], [1.7, 0.18]], 'rgba(30,22,18,.55)', 0.11);
      for (const x of OAR_X) circM(c, x, OAR_Y - 0.1, 0.045, '#2b1d12', null);
      volume(c, bb, { dark: 'rgba(30,20,10,.28)', light: 'rgba(255,255,255,.12)' });
    },
  });
  // Reling (heller Streifen oben) und Spiegel
  layers.push({
    shapes: [poly([[-2.28, 1.0], [-1.8, 0.95], [-0.8, 0.77], [0.4, 0.73], [1.6, 0.83], [2.2, 0.93], [2.4, 1.0], [2.2, 0.99], [1.6, 0.9], [0.4, 0.8], [-0.8, 0.84], [-1.8, 1.02], [-2.28, 1.08]], 1)], fill: '#c9a46c', stroke,
  });
  // Faesser (zwei Reihen), Amphoren am Heck
  const barrels = []; const r = mulberry32(5);
  for (let i = 0; i < 5; i++) barrels.push(blob(-0.95 + i * 0.5, 0.97, 0.23, 0.27, 0, 22));
  for (let i = 0; i < 3; i++) barrels.push(blob(-0.7 + i * 0.5, 1.45, 0.22, 0.26, 0, 22));
  layers.push({
    shapes: barrels, fill: { top: '#b98253', bottom: '#74482a' }, stroke,
    deco(c, bb) {
      for (let i = 0; i < 5; i++) for (const dy of [-0.14, 0, 0.14]) line(c, [[-0.95 + i * 0.5 - 0.2, 0.97 + dy], [-0.95 + i * 0.5 + 0.2, 0.97 + dy]], 'rgba(40,30,25,.65)', 0.025);
      for (let i = 0; i < 3; i++) for (const dy of [-0.13, 0, 0.13]) line(c, [[-0.7 + i * 0.5 - 0.19, 1.45 + dy], [-0.7 + i * 0.5 + 0.19, 1.45 + dy]], 'rgba(40,30,25,.65)', 0.025);
      volume(c, bb, { dark: 'rgba(30,20,10,.3)', light: 'rgba(255,255,255,.14)' });
    },
  });
  const amph = (x) => [poly([[x - 0.1, 0.8], [x + 0.1, 0.8], [x + 0.16, 1.0], [x + 0.12, 1.3], [x + 0.05, 1.42], [x - 0.05, 1.42], [x - 0.12, 1.3], [x - 0.16, 1.0]], 1), limb([[x - 0.12, 1.22, 0.04], [x - 0.22, 1.28, 0.04], [x - 0.12, 1.4, 0.04]], { per: 3, caps: false })];
  layers.push({ shapes: [...amph(-1.55), ...amph(-1.3)], fill: { top: '#d99a5a', bottom: '#a8683a' }, stroke, deco(c) { line(c, [[-1.62, 1.1], [-1.48, 1.1]], 'rgba(120,50,20,.5)', 0.02); line(c, [[-1.37, 1.1], [-1.23, 1.1]], 'rgba(120,50,20,.5)', 0.02); } });
  // Mast und Segel
  layers.push({
    shapes: [limb([[0.1, 1.5, 0.12], [0.1, 3.75, 0.08]], { per: 3, caps: false }), rectP(-0.55, 3.55, 0.75, 3.63)], fill: shade('#a07a50', 0.1), stroke,
  });
  layers.push({
    shapes: [poly([[-0.52, 3.55], [0.72, 3.55], [0.82, 2.35], [-0.62, 2.35]])], fill: { top: '#f4ecd6', bottom: '#d8c9a2' }, stroke,
    deco(c) {
      line(c, [[-0.57, 2.95], [0.77, 2.95]], '#b3352a', 0.12);
      for (let i = 1; i < 4; i++) line(c, [[-0.5 + i * 0.3, 3.5], [-0.58 + i * 0.3 + 0.02, 2.4]], 'rgba(120,100,70,.22)', 0.012);
      line(c, [[-0.6, 2.38], [0.8, 2.38]], 'rgba(120,100,70,.4)', 0.02);
    },
  });
  // Steuerruder am Heck
  layers.push({ shapes: [limb([[-2.0, 1.4, 0.06], [-2.3, 0.7, 0.07], [-2.6, 0.04, 0.12]], { per: 4, caps: false })], fill: '#b8905a', stroke });
  // Löwenkopf am Bug
  const mane = []; for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU; mane.push(blob(2.46 + Math.cos(a) * 0.13, 1.28 + Math.sin(a) * 0.13, 0.07, 0.07, 0, 8)); }
  layers.push({
    shapes: [limb([[2.2, 0.92, 0.2], [2.4, 1.1, 0.16], [2.46, 1.26, 0.12]], { per: 4 }), ...mane, blob(2.46, 1.28, 0.15, 0.14, 0, 16), poly([[2.5, 1.2], [2.72, 1.22], [2.72, 1.12], [2.52, 1.08]], 1), blob(2.38, 1.43, 0.045, 0.045, 0, 8)],
    fill: { top: '#d9a85a', bottom: '#9a6a30' }, stroke,
    deco(c) { dot(c, 2.52, 1.31, 0.028, '#fff6df'); dot(c, 2.53, 1.31, 0.016, '#1b120c'); dot(c, 2.7, 1.17, 0.018, '#3a2216'); line(c, [[2.52, 1.14], [2.66, 1.17]], 'rgba(60,30,10,.6)', 0.012); },
  });
  const parts = { body: { z: 1, layers } };
  OAR_X.forEach((x, i) => { parts['oar' + (i + 1)] = { z: 2 + i * 0.01, pivot: [x, OAR_Y], layers: [oarLayer(x)] }; });
  return {
    id: 's8_schiff', parts,
    anchors: { helm: [-1.95, 0.95], bow: [2.3, 1.0], mid: [0, 1.0] },
    meta: { name: 'Handelsschiff', lengthM: 5.1, heightM: 3.8, ranges: { oar1: [0, 0.3], oar2: [0, 0.3], oar3: [0, 0.3], oar4: [0, 0.3] } },
  };
}

// ---------------------------------------------------------------- kleines Boot (Einbaum) mit Korb
export function boot() {
  const wood = '#8a6440';
  const hull = poly([[-1.0, 0.18], [-0.5, 0.05], [0.5, 0.05], [1.05, 0.28], [1.12, 0.36], [0.9, 0.33], [0.0, 0.3], [-0.9, 0.34], [-1.05, 0.3]], 1);
  const layers = [{
    shapes: [hull], fill: { top: lite(wood, 0.15), bottom: shade(wood, 0.3) }, stroke,
    deco(c, bb) { woodGrain(c, bb, { color: 'rgba(40,22,8,.4)', n: 4, seed: 4 }); volume(c, bb); },
  }, {
    shapes: [blob(-0.2, 0.4, 0.2, 0.14, 0, 16), blob(0.3, 0.38, 0.16, 0.12, 0, 14)], fill: { top: '#d9b36a', bottom: '#a07a38' }, stroke,
    deco(c) { for (let i = 0; i < 6; i++) line(c, [[-0.38 + i * 0.07, 0.3], [-0.34 + i * 0.07, 0.52]], 'rgba(90,60,20,.45)', 0.012); },
  }];
  return { id: 's8_boot', parts: { body: { z: 1, layers } }, anchors: { top: [0, 0.6] }, meta: { name: 'Boot', lengthM: 2.2, heightM: 0.55 } };
}
