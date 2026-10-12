// Station 2: Menschen aus person() – Senatoren, Konsuln, Liktoren (mit Rutenbündel), Redner, Hannibal.
// Alle nutzen das gemeinsame Kit rom/_people.js (nur gelesen, nicht geändert); Besonderes kommt über `parts`.
import { person, SKIN, mixHex } from './_people.js';
import { blob, limb, poly } from '../dsl.js';
import { line, dot } from '../paint.js';

const GREYS = ['#d8d3ca', '#a7a196', '#7a7268', '#c9c3b8'];
const SK = [SKIN.fair, SKIN.warm, SKIN.fair, SKIN.tan, SKIN.warm, SKIN.fair];

// Senator: weiße Toga mit Purpurrand; v wählt Hautton, Haar und Haltung (0 … 5)
export function senator(o = {}) {
  const v = (o.v ?? 0) % 6;
  const bald = v % 2 === 0;
  return person({
    kind: 'senator', id: 's2_senator', skin: SK[v], mood: v % 3 === 1 ? 'smile' : 'serious', near: v % 3 === 2 ? null : 'scroll',
    hair: bald ? { style: 'bald', color: GREYS[v % 4] } : { style: 'short', color: GREYS[(v + 1) % 4] },
    beard: false, ...o,
  });
}

// Redner auf der Rostra: Mund offen, Arm wird im Page-Code bewegt
export function redner(o = {}) {
  return person({ kind: 'senator', id: 's2_redner', skin: SKIN.warm, mood: 'open', near: null, hair: { style: 'short', color: '#8f887c' }, ...o });
}

// Konsul: Toga mit breitem Purpurrand, dunkles Haar
export function konsul(o = {}) {
  const v = o.v ?? 0;
  return person({
    kind: 'senator', id: 's2_konsul', skin: v ? SKIN.tan : SKIN.warm, mood: 'smile', near: 'scroll',
    toga: { color: '#fbf7ee', border: '#6e2262' }, hair: { style: 'short', color: v ? '#2c1f16' : '#4a3426' },
    tunic: { color: '#fbf7ee', color2: '#6e2262', len: 'ankle', sleeves: true, belt: null }, ...o,
  });
}

// Rutenbündel mit Beil (Fasces) als Zusatzebene am nahen Arm (Modellraum der Person, s = Höhe/1,7)
function fascesLayers(s, dx = 0) {
  const P = (pts, sm = 0) => poly(pts.map(([x, y]) => [(x + dx) * s, y * s]), sm);
  const S = (x) => (x + dx) * s, SY = (y) => y * s;
  const bundle = P([[-0.01, 0.52], [0.17, 0.52], [0.175, 1.78], [0.08, 1.84], [-0.005, 1.78]], 1);
  return [
    { shapes: [bundle], fill: { top: '#d2a867', bottom: '#a8793f' }, stroke: 'rgba(60,35,10,.7)',
      deco(c) { for (let i = 0; i < 4; i++) line(c, [[S(0.015 + i * 0.04), SY(0.55)], [S(0.015 + i * 0.04), SY(1.8)]], 'rgba(90,55,20,.55)', 0.012 * s); } },
    { shapes: [P([[-0.02, 0.8], [0.185, 0.8], [0.185, 0.87], [-0.02, 0.87]]), P([[-0.02, 1.08], [0.185, 1.08], [0.185, 1.15], [-0.02, 1.15]]), P([[-0.02, 1.36], [0.185, 1.36], [0.185, 1.43], [-0.02, 1.43]]), P([[-0.02, 1.62], [0.185, 1.62], [0.185, 1.69], [-0.02, 1.69]])],
      fill: '#5a3a22', stroke: 'rgba(30,15,5,.7)' },
    { shapes: [P([[0.15, 1.44], [0.2, 1.46], [0.36, 1.66], [0.4, 1.34], [0.2, 1.3]], 1)], fill: { top: '#eef0f2', bottom: '#8f959c' }, stroke: 'rgba(50,55,65,.75)',
      deco(c) { line(c, [[S(0.22), SY(1.38)], [S(0.34), SY(1.5)]], 'rgba(255,255,255,.6)', 0.012 * s); } },
  ];
}

// Liktor: Diener des Konsuls, trägt die Fasces; schlichte helle Tunika (keine rote). Der nahe Arm ist schon nach vorn gehoben
// (um den Schulter-Pivot gedreht), damit das Bündel vor dem Gesicht steht; die Fasces selbst sind senkrecht gezeichnet.
export function liktor(o = {}) {
  const h = o.height ?? 1.74, s = h / 1.7, ARM = 0.5;
  const spec = person({
    kind: 'handwerker', id: 's2_liktor', height: h, skin: o.v ? SKIN.tan : SKIN.warm, mood: 'serious', near: null,
    tunic: { color: '#e7dcc0', color2: '#8a6a3a', len: 'knee', sleeves: true, belt: '#5a3a22' }, shoes: 'sandals', hair: { style: 'short', color: o.v ? '#2c1f16' : '#4a3426' }, ...o,
  });
  const pv = [0, 1.36 * s], c = Math.cos(ARM), sn = Math.sin(ARM);
  const rot = (pt) => [(pt[0] - pv[0]) * c - (pt[1] - pv[1]) * sn + pv[0], (pt[0] - pv[0]) * sn + (pt[1] - pv[1]) * c + pv[1]];
  spec.parts.armA.layers = spec.parts.armA.layers.map((l) => ({ ...l, shapes: l.shapes.map((sh) => sh.map(rot)) })).concat(fascesLayers(s, 0.3));
  return spec;
}

// Hannibal: Feldherr aus Karthago – freundlich, mit Purpurumhang, Bronzekappe, Wanderstab (keine Waffe)
export function hannibal(o = {}) {
  const s = (o.height ?? 1.76) / 1.7, hr = 0.125 * 1.14, hx = 0.03, hy = 1.7 - hr * 1.03;
  const S = (v) => v * s;
  const cap = poly([[hx - hr * 1.05, hy + 0.0], [hx - hr * 0.95, hy + hr * 0.75], [hx - 0.02, hy + hr * 1.18], [hx + hr * 0.75, hy + hr * 0.82], [hx + hr * 1.0, hy + hr * 0.3], [hx + hr * 0.95, hy + hr * 0.12], [hx - hr * 0.1, hy + hr * 0.2]].map(([x, y]) => [x * s, y * s]), 2);
  const plume = limb([[hx - 0.02, hy + hr * 1.1, 0.07], [hx - 0.08, hy + hr * 1.6, 0.08], [hx - 0.2, hy + hr * 1.5, 0.05]].map(([x, y, w]) => [x * s, y * s, w * s]), { per: 6 });
  return person({
    kind: 'haendler', id: 's2_hannibal', height: o.height ?? 1.76, skin: SKIN.tan, mood: 'smile', near: 'staff', beard: true, hair: { style: 'curly', color: '#251912' },
    tunic: { color: '#efe3c6', color2: '#7a2c6b', len: 'knee', sleeves: true, belt: '#d7b24a' }, cloak: '#6e2262', shoes: 'sandals',
    parts: { head: [
      { shapes: [cap], fill: { top: '#e2b457', bottom: '#a3752a' }, stroke: 'rgba(80,50,10,.75)', deco(c) { line(c, [[S(hx - hr), S(hy + 0.12)], [S(hx + hr * 0.95), S(hy + 0.12)]], 'rgba(255,240,170,.55)', S(0.012)); } },
      { shapes: [plume], fill: { top: '#f4efe6', bottom: '#cfc3d4' }, stroke: 'rgba(90,60,90,.6)' },
    ] }, ...o,
  });
}
