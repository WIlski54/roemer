// Station 8: Köln und Xanten als Papierschnitt-Städte im Hintergrund (Fernband, leicht entsättigt wegen Dunst).
import { poly, blob, limb } from '../dsl.js';
import { archWall, columnPoly, pediment } from './_arch.js';
import { stroke as S0, rectP, mixHex, merlons, fillM, circM, gradM, ashlar, roofTiles, plaster, volume, line, dot } from './s8_kit.js';
import { mulberry32 } from '../../engine/util.js';

const stroke = 'rgba(70,75,85,.5)';
const mist = (c, t = 0.18) => mixHex(c, '#cfd8dc', t);
const STONE = { top: mist('#e2d9c2'), bottom: mist('#aaa188', 0.1) };
const STONE2 = { top: mist('#d6cdb4'), bottom: mist('#9c937a', 0.1) };
const ROOF = { top: mist('#c9694a', 0.14), bottom: mist('#8f402c', 0.1) };
const WALL = { top: mist('#ddd3ba', 0.2), bottom: mist('#a29a82', 0.12) };

function house(x0, w, h, rise, seed, wall = '#efe3c8', roof = ROOF) {
  const r = mulberry32(seed);
  return [
    { shapes: [rectP(x0, 0.04, x0 + w, 0.04 + h)], fill: { top: mist(wall, 0.18), bottom: mist(wall, 0.3) }, stroke, deco(c) { const cols = Math.max(1, Math.round(w / 0.32)); for (let f = 0; f < 2; f++) for (let i = 0; i < cols; i++) { const x = x0 + (w * (i + 0.5)) / cols, y = 0.04 + h * (0.28 + f * 0.42); fillM(c, rectP(x - 0.05, y - 0.07, x + 0.05, y + 0.07), r() < 0.3 ? '#f1d489' : '#6f7f8a', 'rgba(40,40,50,.6)', 0.008); } } },
    { shapes: [poly([[x0 - 0.05, 0.04 + h], [x0 + w + 0.05, 0.04 + h], [x0 + w / 2, 0.04 + h + rise]])], fill: roof, stroke, deco(c, bb) { roofTiles(c, bb, { h: 0.08, w: 0.1 }); } },
  ];
}
const turret = (x, w, h) => [rectP(x - w / 2, 0.04, x + w / 2, h), ...merlons(x - w / 2, x + w / 2, h, w / 4.5, w / 8, 0.1)];

// ---------------------------------------------------------------- Köln (Colonia): Stadtmauer, Tor, Kapitolstempel, Häuser
export function koelnRoemisch() {
  const layers = [];
  const hw = 3.3;
  layers.push({ shapes: [rectP(-hw, 0, hw, 0.08)], fill: mist('#8f9f86', 0.2), stroke: null });
  // Mauer mit Türmen
  layers.push({
    shapes: [rectP(-hw, 0.04, hw, 0.72), ...merlons(-hw + 0.05, hw - 0.05, 0.72, 0.15, 0.1, 0.12), ...turret(-3.05, 0.5, 1.25), ...turret(-1.35, 0.5, 1.15), ...turret(1.55, 0.5, 1.2), ...turret(3.0, 0.5, 1.3)],
    fill: WALL, stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,80,70,.12)', line: 'rgba(80,80,90,.32)', h: 0.16, w: 0.34, seed: 3 }); for (const x of [-3.05, -1.35, 1.55, 3.0]) for (const y of [0.9, 1.0]) fillM(c, rectP(x - 0.03, y, x + 0.03, y + 0.1), '#3a3a44', null); volume(c, bb, { dark: 'rgba(40,50,70,.2)', light: 'rgba(255,255,255,.14)' }); },
  });
  // Stadttor (Rundbogen offen)
  layers.push({
    shapes: [rectP(-0.95, 0.04, -0.5, 1.5), rectP(0.5, 0.04, 0.95, 1.5), ...archWall(-0.5, 0.5, 0.04, 1.0, 1, { open: 0.7, crown: 0.82 }), rectP(-0.5, 1.0, 0.5, 1.22), ...merlons(-0.95, -0.5, 1.5, 0.13, 0.08, 0.13), ...merlons(0.5, 0.95, 1.5, 0.13, 0.08, 0.13), ...merlons(-0.48, 0.48, 1.22, 0.12, 0.08, 0.12)],
    fill: STONE, stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,80,70,.14)', line: 'rgba(80,80,90,.34)', h: 0.15, w: 0.28, seed: 8 }); volume(c, bb, { dark: 'rgba(40,50,70,.2)', light: 'rgba(255,255,255,.14)' }); },
  });
  // Kapitolstempel: Treppe, Säulen, Gebälk, Giebel
  const tx = 2.15, tw = 1.1;
  layers.push({
    shapes: [rectP(tx - tw / 2 - 0.1, 0.04, tx + tw / 2 + 0.1, 0.16), rectP(tx - tw / 2 - 0.06, 0.16, tx + tw / 2 + 0.06, 0.24), ...[0, 1, 2, 3].flatMap((i) => columnPoly(tx - tw / 2 + 0.08 + i * (tw - 0.16) / 3, 0.24, 1.0, 0.12)), rectP(tx - tw / 2 - 0.02, 1.24, tx + tw / 2 + 0.02, 1.36), pediment(tx - tw / 2 - 0.08, tx + tw / 2 + 0.08, 1.36, 0.36)],
    fill: STONE, stroke,
    deco(c, bb) { volume(c, bb, { dark: 'rgba(40,50,70,.2)', light: 'rgba(255,255,255,.18)' }); },
  });
  // Häuser mit roten Dächern
  const hs = [house(-2.6, 0.7, 0.7, 0.34, 2), house(-1.8, 0.6, 0.86, 0.36, 3, '#f0dfb8'), house(-0.45, 0.6, 0.62, 0.3, 4, '#e8d9c4'), house(1.0, 0.7, 0.8, 0.34, 5, '#efe3c8'), house(2.8, 0.45, 0.6, 0.28, 6)];
  hs.forEach((h) => layers.push(...h));
  return { id: 's8_koeln_r', parts: { body: { z: 1, layers } }, anchors: { top: [0, 1.8] }, meta: { name: 'Köln (römisch)', lengthM: 6.6, heightM: 1.8 } };
}

// ---------------------------------------------------------------- Xanten: Lagermauer mit Tor und Kasernendächern, daneben Amphitheater der Stadt
export function xantenRoemisch() {
  const layers = [];
  const hw = 2.7;
  layers.push({ shapes: [rectP(-hw, 0, hw, 0.08)], fill: mist('#8f9f86', 0.2), stroke: null });
  // Lagerhügel (Papierhügel) rechts mit Lager darauf
  layers.push({
    shapes: [poly([[0.3, 0.04], [0.9, 0.4], [2.0, 0.55], [2.7, 0.3], [2.7, 0.04]], 2)], fill: { top: mist('#8fae78', 0.2), bottom: mist('#6a8a58', 0.2) }, stroke: 'rgba(40,70,50,.4)',
    deco(c, bb) { const r = mulberry32(5); for (let i = 0; i < 24; i++) line(c, [[bb.x0 + r() * bb.w, bb.y0 + r() * bb.h * 0.5], [bb.x0 + r() * bb.w, bb.y0 + r() * bb.h * 0.5 + 0.06]], 'rgba(40,80,40,.4)', 0.014); },
  });
  // Lager: Palisade/Mauer mit Tor, Türme, Kasernen
  layers.push({
    shapes: [rectP(0.95, 0.4, 2.55, 0.95), ...merlons(0.95, 2.55, 0.95, 0.13, 0.09, 0.11), ...turret(1.0, 0.36, 1.35), ...turret(2.5, 0.36, 1.35)], fill: WALL, stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,80,70,.12)', line: 'rgba(80,80,90,.3)', h: 0.14, w: 0.3, seed: 11 }); volume(c, bb, { dark: 'rgba(40,50,70,.2)', light: 'rgba(255,255,255,.14)' }); },
  });
  layers.push({
    shapes: [rectP(1.45, 0.4, 2.05, 1.2), ...archWall(1.45, 2.05, 0.4, 1.0, 1, { open: 0.6, crown: 0.8 }).slice(0, 0), ...merlons(1.45, 2.05, 1.2, 0.12, 0.08, 0.11)], fill: STONE, stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,80,70,.14)', line: 'rgba(80,80,90,.32)', h: 0.15, w: 0.26, seed: 12 }); fillM(c, [[1.65, 0.4], [1.85, 0.4], [1.85, 0.7], [1.75, 0.8], [1.65, 0.7]], '#3a3a44', null); volume(c, bb, { dark: 'rgba(40,50,70,.2)', light: 'rgba(255,255,255,.14)' }); },
  });
  layers.push({ shapes: [poly([[1.1, 0.95], [1.4, 0.95], [1.34, 1.2], [1.16, 1.2]]), poly([[2.1, 0.95], [2.4, 0.95], [2.34, 1.2], [2.16, 1.2]])], fill: ROOF, stroke, deco(c, bb) { roofTiles(c, bb, { h: 0.07, w: 0.1 }); } });
  // Fahne
  layers.push({ shapes: [limb([[1.75, 1.25, 0.03], [1.75, 1.85, 0.03]], { per: 2, caps: false }), poly([[1.77, 1.82], [2.15, 1.82], [2.15, 1.56], [1.77, 1.56]])], fill: { top: mist('#b3352a', 0.1), bottom: mist('#7d2118', 0.1) }, stroke });
  // Amphitheater der Stadt (Bogenreihen, abgeflachte Ellipse)
  layers.push({
    shapes: [...archWall(-2.55, -0.55, 0.04, 0.5, 8, { open: 0.5, crown: 0.78 }), ...archWall(-2.45, -0.65, 0.5, 0.92, 8, { open: 0.5, crown: 0.78 }), rectP(-2.5, 0.92, -0.6, 1.04)],
    fill: STONE2, stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,80,70,.12)', line: 'rgba(80,80,90,.3)', h: 0.12, w: 0.24, seed: 4 }); volume(c, bb, { dark: 'rgba(40,50,70,.2)', light: 'rgba(255,255,255,.14)' }); },
  });
  // ein paar Häuser dazwischen
  [[-0.5, 0.45, 0.5, 0.26, 7], [0.0, 0.4, 0.62, 0.3, 8]].forEach(([x, w, h, rise, s]) => layers.push(...house(x, w, h, rise, s)));
  return { id: 's8_xanten_r', parts: { body: { z: 1, layers } }, anchors: { top: [1.75, 1.9] }, meta: { name: 'Xanten (römisch)', lengthM: 5.4, heightM: 1.9 } };
}
