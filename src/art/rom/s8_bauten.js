// Station 8: Wachturm, Kastell (Römerzeit / Ruine / heute), Hafen mit Kran, Inschriftenstein, Meilenstein.
//   Alles Papierschnitt-Specs (Meter = Modellmaß, y nach oben, Boden bei y = 0).
import { poly, blob, limb } from '../dsl.js';
import { archWall } from './_arch.js';
import {
  COL, stroke, rectP, mixHex, merlons, gable, fillM, circM, gradM, houseLayers, grassTop,
  brickwork, ashlar, roofTiles, plaster, woodGrain, volume, line, dot,
} from './s8_kit.js';
import { mulberry32 } from '../../engine/util.js';

const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
const shade = (a, t) => mixHex(a, '#1c1410', t);
const lite = (a, t) => mixHex(a, '#ffffff', t);

// ---------------------------------------------------------------- Wachturm (Steinsockel, Holzgeschoss, Galerie, Dach, Signalmast)
export function wachturm(o = {}) {
  const stone = '#cdc8b6', wood = '#8c6a48', roof = '#8a5a3c';
  const base = { z: 1, layers: [] };
  // Steinsockel
  base.layers.push({
    shapes: [rectP(-1.4, 0, 1.4, 3.3), rectP(-1.5, 0, 1.5, 0.22)],
    fill: { top: lite(stone, 0.18), bottom: shade(stone, 0.2) }, stroke,
    deco(c, bb) {
      ashlar(c, bb, { tone: 'rgba(90,70,50,.18)', line: 'rgba(70,58,42,.42)', h: 0.34, w: 0.7, seed: 11 });
      plaster(c, bb, { color: 'rgba(90,110,70,.22)', n: 40, seed: 3 });
      // Tür und Schlitzfenster
      fillM(c, [[-0.3, 0.22], [0.3, 0.22], [0.3, 1.25], [0.12, 1.45], [-0.12, 1.45], [-0.3, 1.25]], '#3b2a1c', 'rgba(30,20,10,.8)', 0.02);
      for (const y of [2.2, 2.8]) fillM(c, rectP(-0.07, y, 0.07, y + 0.42), '#2a2018', null);
      volume(c, bb, { dark: 'rgba(40,40,50,.22)', light: 'rgba(255,255,255,.12)' });
    },
  });
  // Holzgeschoss mit vorkragender Galerie
  base.layers.push({
    shapes: [rectP(-1.62, 3.3, 1.62, 3.52), rectP(-1.35, 3.52, 1.35, 5.2), rectP(-1.85, 5.2, 1.85, 5.42)],
    fill: { top: lite(wood, 0.15), bottom: shade(wood, 0.28) }, stroke,
    deco(c, bb) {
      woodGrain(c, bb, { color: 'rgba(50,28,10,.38)', n: 14, seed: 4, vertical: true });
      // Fenster mit Läden
      for (const x of [-0.62, 0.62]) { fillM(c, rectP(x - 0.2, 4.0, x + 0.2, 4.6), '#2e2218', 'rgba(30,20,10,.85)', 0.02); fillM(c, rectP(x - 0.2, 4.0, x - 0.02, 4.6), shade(wood, 0.2), null); }
      line(c, [[-1.62, 3.41], [1.62, 3.41]], 'rgba(255,230,190,.3)', 0.03);
      volume(c, bb, { dark: 'rgba(30,30,40,.22)', light: 'rgba(255,255,255,.1)' });
    },
  });
  // Geländer (Pfosten) und Dach
  const posts = []; for (let i = 0; i <= 8; i++) posts.push(rectP(-1.85 + i * 0.4625 - 0.04, 5.42, -1.85 + i * 0.4625 + 0.04, 5.9));
  base.layers.push({ shapes: [...posts, rectP(-1.9, 5.88, 1.9, 5.98)], fill: shade(wood, 0.15), stroke });
  base.layers.push({
    shapes: [poly([[-2.1, 6.0], [2.1, 6.0], [0.5, 7.15], [-0.5, 7.15]])], fill: { top: lite(roof, 0.12), bottom: shade(roof, 0.3) }, stroke,
    deco(c, bb) { roofTiles(c, bb, { a: 'rgba(60,30,10,.4)', b: 'rgba(255,220,170,.18)', h: 0.2, w: 0.3 }); },
  });
  // Leiter links
  const rail = (x0, x1) => limb([[x0, 0.04, 0.09], [x1, 3.3, 0.09]], { per: 3, caps: false });
  const rungs = []; for (let i = 0; i < 9; i++) { const t = (i + 0.7) / 9.6; rungs.push(rectP(-2.04 + 0.28 * t - 0.04, 0.04 + 3.26 * t - 0.025, -1.62 + 0.28 * t + 0.04, 0.04 + 3.26 * t + 0.025)); }
  base.layers.push({ shapes: [rail(-2.04, -1.76), rail(-1.62, -1.34), ...rungs], fill: shade(wood, 0.1), stroke });
  // Signalmast rechts mit Feuerkorb (wie auf römischen Reliefs: Mast neben dem Turm)
  const pole = limb([[2.2, 0, 0.2], [2.2, 6.2, 0.15]], { per: 4, caps: false });
  const basket = poly([[1.55, 6.72], [2.85, 6.72], [2.6, 6.1], [1.8, 6.1]]);
  base.layers.push({
    shapes: [pole, basket, rectP(1.5, 6.68, 2.9, 6.78), rectP(1.76, 6.02, 2.64, 6.12), limb([[1.75, 3.5, 0.1], [2.15, 4.2, 0.1]], { per: 2, caps: false }), limb([[2.65, 3.5, 0.1], [2.25, 4.2, 0.1]], { per: 2, caps: false })],
    fill: { top: '#6a5648', bottom: '#2c2420' }, stroke,
    deco(c) { for (let i = 0; i < 6; i++) line(c, [[1.7 + i * 0.2, 6.15], [1.62 + i * 0.25, 6.7]], 'rgba(255,200,120,.3)', 0.03); line(c, [[2.2, 0.2], [2.2, 5.9]], 'rgba(255,255,255,.18)', 0.035); },
  });
  return {
    id: 's8_wachturm', parts: { body: base },
    anchors: { fire: [2.2, 6.85], top: [0, 7.15], door: [0, 0.5] },
    meta: { name: 'Wachturm am Limes', lengthM: 6.2, heightM: 7.3 },
  };
}

// ---------------------------------------------------------------- Kastell (drei Zustände mit gleichem Maß)
const KW = 4.6;          // Breite im Modellmaß = Welt (ws = 1)
const groundStrip = (col) => ({ shapes: [rectP(-KW / 2, 0, KW / 2, 0.06)], fill: col, stroke: null });
function stoneFill(t = 0) { return { top: lite('#d8d0b8', 0.12 - t), bottom: shade('#b9ae92', 0.12 + t) }; }

export function kastellRoemer() {
  const hw = KW / 2;
  const layers = [];
  layers.push(groundStrip('#8a9a74'));
  // Gebäude hinter der Mauer: Hauptgebäude mit Giebel und Kasernendächer
  layers.push({
    shapes: [poly([[-0.62, 1.45], [0.62, 1.45], [0, 2.05]]), rectP(-0.52, 1.0, 0.52, 1.46), poly([[-1.95, 0.9], [-1.15, 0.9], [-1.28, 1.42], [-1.82, 1.42]]), poly([[1.15, 0.9], [1.95, 0.9], [1.82, 1.42], [1.28, 1.42]])],
    fill: { top: '#c9694a', bottom: '#8f402c' }, stroke,
    deco(c, bb) { roofTiles(c, bb, { h: 0.1, w: 0.14 }); fillM(c, rectP(-0.48, 1.0, 0.48, 1.45), '#e6dcc2', null); for (let i = -2; i <= 2; i++) line(c, [[i * 0.19, 1.02], [i * 0.19, 1.43]], 'rgba(90,70,50,.4)', 0.03); },
  });
  // Mauer links und rechts, mit Zinnen und Ecktürmen
  const wall = [rectP(-hw, 0.04, -1.0, 0.9), rectP(1.0, 0.04, hw, 0.9), ...merlons(-hw + 0.05, -1.0, 0.9, 0.17, 0.12, 0.15), ...merlons(1.0, hw - 0.05, 0.9, 0.17, 0.12, 0.15)];
  layers.push({
    shapes: wall, fill: stoneFill(), stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,70,50,.16)', line: 'rgba(70,58,42,.42)', h: 0.17, w: 0.36, seed: 6 }); plaster(c, bb, { color: 'rgba(80,100,60,.18)', n: 36, seed: 5 }); volume(c, bb, { dark: 'rgba(40,40,50,.22)', light: 'rgba(255,255,255,.12)' }); },
  });
  // Ecktürme
  const corner = (x0, x1) => [rectP(x0, 0.04, x1, 1.5), ...merlons(x0, x1, 1.5, 0.15, 0.1, 0.16)];
  layers.push({
    shapes: [...corner(-hw - 0.02, -hw + 0.58), ...corner(hw - 0.58, hw + 0.02)], fill: stoneFill(0.03), stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,70,50,.16)', line: 'rgba(70,58,42,.42)', h: 0.17, w: 0.3, seed: 8 }); for (const x of [-hw + 0.27, hw - 0.27]) fillM(c, rectP(x - 0.04, 0.95, x + 0.04, 1.25), '#2a2018', null); volume(c, bb, { dark: 'rgba(40,40,50,.22)', light: 'rgba(255,255,255,.1)' }); },
  });
  // Torturm mit Rundbogen (offene Öffnung), Torbrücke oben, Zinnen
  layers.push({
    shapes: [rectP(-1.0, 0.04, -0.4, 1.78), rectP(0.4, 0.04, 1.0, 1.78), ...archWall(-0.4, 0.4, 0.04, 1.2, 1, { open: 0.7, crown: 0.82 }), rectP(-0.4, 1.2, 0.4, 1.42), ...merlons(-1.0, -0.4, 1.78, 0.15, 0.1, 0.16), ...merlons(0.4, 1.0, 1.78, 0.15, 0.1, 0.16), ...merlons(-0.38, 0.38, 1.42, 0.14, 0.1, 0.14)],
    fill: stoneFill(-0.02), stroke,
    deco(c, bb) {
      ashlar(c, bb, { tone: 'rgba(90,70,50,.16)', line: 'rgba(70,58,42,.42)', h: 0.17, w: 0.3, seed: 9 });
      for (const x of [-0.7, 0.7]) { fillM(c, rectP(x - 0.05, 1.05, x + 0.05, 1.4), '#2a2018', null); }
      volume(c, bb, { dark: 'rgba(40,40,50,.22)', light: 'rgba(255,255,255,.12)' });
    },
  });
  // Fahne (Vexillum) auf dem Torturm
  layers.push({
    shapes: [limb([[0, 1.6, 0.04], [0, 2.75, 0.04]], { per: 2, caps: false }), poly([[0.02, 2.68], [0.62, 2.68], [0.62, 2.28], [0.02, 2.28]])],
    fill: { top: '#b3352a', bottom: '#7d2118' }, stroke,
    deco(c) { line(c, [[0.05, 2.5], [0.6, 2.5]], 'rgba(240,200,110,.9)', 0.04); dot(c, 0.33, 2.38, 0.045, '#e8c46a'); },
  });
  return { id: 's8_kastell_roem', parts: { body: { z: 1, layers } }, anchors: { gate: [0, 0.6], flag: [0.3, 2.7], top: [0, 2.8] }, meta: { name: 'Römisches Kastell', lengthM: KW, heightM: 2.8 } };
}

export function kastellRuine() {
  const hw = KW / 2, r = mulberry32(21);
  const layers = [];
  layers.push(groundStrip('#7d9468'));
  const jag = (x0, x1, yb, ytop, seed) => { // Mauerstück mit zerbrochener Oberkante
    const rr = mulberry32(seed), pts = [[x0, yb]]; const n = Math.max(3, Math.round((x1 - x0) / 0.16));
    for (let i = 0; i <= n; i++) pts.push([x0 + ((x1 - x0) * i) / n, ytop * (0.7 + 0.3 * rr()) - (i % 3 === 1 ? 0.08 + rr() * 0.1 : 0)]);
    pts.push([x1, yb]); return pts;
  };
  const fall = [];
  layers.push({
    shapes: [jag(-hw, -1.55, 0.04, 0.8, 3), jag(-1.15, -0.62, 0.04, 0.5, 5), jag(0.75, 1.5, 0.04, 0.62, 6), jag(1.7, hw, 0.04, 0.55, 7)],
    fill: { top: '#c3baa2', bottom: '#8e866f' }, stroke,
    deco(c, bb) {
      ashlar(c, bb, { tone: 'rgba(90,70,50,.2)', line: 'rgba(70,58,42,.5)', h: 0.17, w: 0.34, seed: 4 });
      plaster(c, bb, { color: 'rgba(70,110,60,.34)', n: 90, seed: 7 });
      for (let i = 0; i < 30; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.015 + r() * 0.025, 'rgba(255,255,255,.2)');
      volume(c, bb, { dark: 'rgba(40,40,50,.24)', light: 'rgba(255,255,255,.08)' });
    },
  });
  // Torturm-Stumpf links mit Teilbogen, rechts nur ein Pfeiler
  layers.push({
    shapes: [poly([[-1.05, 0.04], [-0.42, 0.04], [-0.42, 1.18], [-0.52, 1.3], [-0.6, 1.16], [-0.72, 1.45], [-0.84, 1.2], [-0.95, 1.32], [-1.05, 1.1]]), poly([[0.42, 0.04], [1.0, 0.04], [0.98, 0.9], [0.84, 0.82], [0.74, 1.12], [0.6, 0.92], [0.5, 0.98], [0.42, 0.7]]), poly([[-0.42, 0.7], [-0.42, 0.84], [-0.3, 1.05], [-0.14, 1.12], [-0.08, 1.0], [-0.22, 0.92], [-0.3, 0.7]])],
    fill: { top: '#cbc2aa', bottom: '#8e866f' }, stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,70,50,.2)', line: 'rgba(70,58,42,.5)', h: 0.17, w: 0.3, seed: 12 }); plaster(c, bb, { color: 'rgba(70,110,60,.34)', n: 60, seed: 8 }); volume(c, bb, { dark: 'rgba(40,40,50,.24)', light: 'rgba(255,255,255,.08)' }); },
  });
  // Efeu / Gras auf den Mauerkronen, Büsche, ein Bäumchen
  const ivy = [blob(-0.8, 1.1, 0.24, 0.16, 0.2, 14), blob(-0.66, 0.96, 0.2, 0.2, 0, 12), blob(0.75, 0.9, 0.2, 0.15, 0, 12), blob(-1.9, 0.6, 0.3, 0.14, 0, 14), blob(1.95, 0.5, 0.26, 0.13, 0, 12), blob(0.2, 0.12, 0.34, 0.1, 0, 12)];
  layers.push({ shapes: ivy, fill: { top: '#6f9a58', bottom: '#4d7a3e' }, stroke: 'rgba(30,60,30,.5)', deco(c, bb) { for (let i = 0; i < 46; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.02 + r() * 0.03, r() > 0.5 ? 'rgba(180,220,120,.5)' : 'rgba(30,70,40,.4)'); } });
  const trunk = limb([[1.55, 0.5, 0.1], [1.58, 0.95, 0.07], [1.5, 1.3, 0.05]], { per: 5 });
  layers.push({ shapes: [trunk], fill: '#6a4a30', stroke });
  layers.push({ shapes: [blob(1.5, 1.45, 0.34, 0.26, 0.1, 18), blob(1.28, 1.3, 0.22, 0.17, 0, 14), blob(1.72, 1.32, 0.22, 0.17, 0, 14)], fill: { top: '#78a45e', bottom: '#4d7a3e' }, stroke: 'rgba(30,60,30,.5)', deco(c, bb) { for (let i = 0; i < 30; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.02 + r() * 0.03, r() > 0.5 ? 'rgba(190,230,130,.5)' : 'rgba(30,70,40,.35)'); } });
  // herumliegende Steine (nur angedeutet)
  const stones = [blob(-0.3, 0.1, 0.12, 0.07, 0.1, 10), blob(0.2, 0.09, 0.1, 0.06, -0.2, 10), blob(-1.4, 0.1, 0.1, 0.06, 0, 10), blob(1.25, 0.1, 0.13, 0.07, 0.1, 10), blob(0.05, 0.16, 0.07, 0.05, 0.5, 8)];
  layers.push({ shapes: stones, fill: { top: '#c9c1ab', bottom: '#8e866f' }, stroke });
  return { id: 's8_kastell_ruine', parts: { body: { z: 1, layers } }, anchors: { top: [0, 1.7] }, meta: { name: 'Kastell als Ruine', lengthM: KW, heightM: 1.8 } };
}

export function kastellHeute() {
  const hw = KW / 2;
  const layers = [];
  layers.push(groundStrip('#8c9e78'));
  // Rest der alten Mauer ganz links (römische Spuren bleiben sichtbar)
  layers.push({
    shapes: [rectP(-hw, 0.04, -1.85, 0.62), ...merlons(-hw + 0.04, -1.89, 0.62, 0.16, 0.12, 0.12)], fill: stoneFill(0.05), stroke,
    deco(c, bb) { ashlar(c, bb, { tone: 'rgba(90,70,50,.16)', line: 'rgba(70,58,42,.42)', h: 0.15, w: 0.32, seed: 14 }); plaster(c, bb, { color: 'rgba(70,110,60,.3)', n: 30, seed: 2 }); volume(c, bb); },
  });
  // Häuserreihe
  const hs = [
    houseLayers({ x0: -1.8, w: 0.76, h: 0.95, y0: 0.04, roof: 'gable', rise: 0.42, wall: '#e8d9b4', roofCol: '#a85a40', floors: 2, seed: 2, lit: 0.2 }),
    houseLayers({ x0: -1.0, w: 0.72, h: 1.2, y0: 0.04, roof: 'gable', rise: 0.5, wall: '#efe3d3', roofCol: '#8f4a38', floors: 3, seed: 5, lit: 0.3, shutters: true }),
    houseLayers({ x0: 1.3, w: 0.82, h: 1.5, y0: 0.04, roof: 'flat', floors: 4, wall: '#d6e1d8', seed: 9, lit: 0.3, shop: { text: 'Café', col: '#3f6f7a' } }),
  ];
  for (const h of hs) layers.push(...h);
  // Kirchturm mit Spitzhelm und Kirchenschiff
  layers.push({
    shapes: [rectP(-0.2, 0.04, 0.4, 1.88), rectP(-0.26, 1.88, 0.46, 1.98), rectP(0.36, 0.04, 1.2, 0.98), poly([[0.32, 0.98], [1.24, 0.98], [0.78, 1.38]])],
    fill: { top: '#cbbfa6', bottom: '#8f8168' }, stroke,
    deco(c, bb) {
      ashlar(c, bb, { tone: 'rgba(90,70,50,.14)', line: 'rgba(70,58,42,.35)', h: 0.2, w: 0.34, seed: 17 });
      fillM(c, [[-0.06, 1.35], [0.26, 1.35], [0.26, 1.78], [0.1, 1.9], [-0.06, 1.78]], '#3a2c22', null);
      circM(c, 0.1, 1.05, 0.1, '#f4efe0', 'rgba(60,50,40,.8)', 0.012);
      line(c, [[0.1, 1.05], [0.1, 1.12]], '#3a2c22', 0.012); line(c, [[0.1, 1.05], [0.15, 1.03]], '#3a2c22', 0.012);
      for (const x of [0.56, 0.8, 1.04]) fillM(c, [[x - 0.06, 0.4], [x + 0.06, 0.4], [x + 0.06, 0.78], [x, 0.86], [x - 0.06, 0.78]], '#4a6a86', 'rgba(40,30,20,.7)', 0.01);
      volume(c, bb, { dark: 'rgba(30,30,40,.2)', light: 'rgba(255,255,255,.12)' });
    },
  });
  layers.push({ shapes: [poly([[-0.26, 1.98], [0.46, 1.98], [0.1, 2.95]]), rectP(0.085, 2.9, 0.115, 3.14), rectP(0.0, 3.04, 0.2, 3.07)], fill: { top: '#6e7f86', bottom: '#46555c' }, stroke });
  // Balkone am Wohnhaus, Dachkante, Antenne
  layers.push({
    shapes: [rectP(1.26, 1.54, 2.16, 1.6), rectP(1.5, 1.6, 1.52, 1.78), rectP(1.9, 1.6, 1.92, 1.78)], fill: '#8a8a92', stroke: 'rgba(40,40,50,.6)',
    deco(c) { for (const y of [0.55, 0.95, 1.3]) { fillM(c, rectP(1.32, y, 1.7, y + 0.04), '#6a6a74', null); for (let i = 0; i < 5; i++) line(c, [[1.35 + i * 0.08, y], [1.35 + i * 0.08, y + 0.1]], '#6a6a74', 0.012); } },
  });
  // Straßenlaterne
  layers.push({ shapes: [limb([[2.22, 0.04, 0.04], [2.22, 0.82, 0.03]], { per: 2, caps: false }), poly([[2.15, 0.82], [2.29, 0.82], [2.27, 0.95], [2.17, 0.95]])], fill: '#4a4a52', stroke, deco(c) { dot(c, 2.22, 0.88, 0.04, '#ffe9a0'); } });
  return { id: 's8_kastell_heute', parts: { body: { z: 1, layers } }, anchors: { top: [0.1, 3.1] }, meta: { name: 'Die Stadt von heute', lengthM: KW, heightM: 3.1 } };
}
