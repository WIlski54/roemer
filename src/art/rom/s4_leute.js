// Station 4 · Menschen (alle über person() aus _people.js, damit der Stil einheitlich bleibt):
//   s4_caesar (Feldherr, Purpurmantel, ohne Kranz), s4_augustus (Toga, zunächst OHNE Kranz – der kommt per Lasche),
//   s4_senator1 … s4_senator6 (Republik, Streit), s4_kleopatra (Herrscherin Ägyptens, würdevoll), s4_legionaer1 … 3 (Kettenhemd, wie zu Caesars Zeit),
//   s4_aquilifer (Adlerträger), s4_muenzer (Handwerker mit Hammer), s4_senator_kranz (Senator, der den Kranz bringt)
import { blob, limb, poly } from '../dsl.js';
import { line, dot } from '../paint.js';
import { person, SKIN, mixHex } from './_people.js';

const HS = 1.14;                                    // Standard-Kopfmaß der Personen (siehe _people.js)
const sOf = (h) => h / 1.7;
const headOf = (h, hs = HS) => { const s = sOf(h), hr = 0.125 * hs; return { s, hr, hx: 0.03 * s, hy: (1.7 - hr * 1.03) * s, R: hr * s }; };

// ---------------------------------------------------------------------------------------------------- Caesar
export function caesar(o = {}) {
  return person({
    id: 's4_caesar', name: 'Caesar', kind: 'zenturio', height: 1.74, helmet: null, near: null, greaves: false, armor: 'mail', sword: true, mood: 'serious',
    skin: SKIN.fair, hair: { style: 'short', color: '#8a7a68' }, cloak: '#8c1d44',
    tunic: { color: '#e4d6b0', color2: '#a87f3c', len: 'knee', sleeves: false, belt: '#e8bc3c' },
    ...o,
  });
}

// ---------------------------------------------------------------------------------------------------- Augustus (ohne Kranz)
export function augustus(o = {}) {
  return person({
    id: 's4_augustus', name: 'Augustus', kind: 'kaiser', height: 1.7, hat: null, near: null, mood: 'serious',
    hair: { style: 'curly', color: '#b8923e' }, toga: { color: '#f6f1e6', border: '#7b2d5b' },
    ...o,
  });
}

// ---------------------------------------------------------------------------------------------------- Senatoren (Streit in Grüppchen)
const SEN = [
  { height: 1.7, hair: { style: 'bald', color: '#b9b2a6' }, skin: SKIN.fair, mood: 'open', near: null },
  { height: 1.66, hair: { style: 'short', color: '#3b2a20' }, skin: SKIN.tan, mood: 'open', near: 'scroll' },
  { height: 1.74, hair: { style: 'short', color: '#9b948a' }, skin: SKIN.warm, mood: 'serious', near: null },
  { height: 1.62, hair: { style: 'bald', color: '#d6d0c6' }, skin: SKIN.fair, mood: 'serious', near: 'scroll' },
  { height: 1.72, hair: { style: 'curly', color: '#4a3526' }, skin: SKIN.warm, mood: 'open', near: null },
  { height: 1.68, hair: { style: 'short', color: '#6a5a4a' }, skin: SKIN.brown, mood: 'smile', near: 'tablet' },
];
export function senator(i = 0, o = {}) {
  const v = SEN[((i % SEN.length) + SEN.length) % SEN.length];
  return person({ id: 's4_senator' + (i + 1), name: 'Senator', kind: 'senator', toga: { color: i % 2 ? '#efe6d2' : '#f4efe4', border: '#7b2d5b' }, ...v, ...o });
}

// Der Senator, der den Kranz bringt: freundlich, ohne Schriftrolle (die Hand hält später den Kranz)
export function senatorKranz(o = {}) {
  return person({ id: 's4_senator_kranz', name: 'Senator', kind: 'senator', height: 1.72, near: null, mood: 'smile', hair: { style: 'short', color: '#a9a398' }, skin: SKIN.warm, ...o });
}

// ---------------------------------------------------------------------------------------------------- Kleopatra: Herrscherin mit Diadem, Zepter und blauem Mantel
export function kleopatra(o = {}) {
  const height = 1.62, { s, hr, hx, hy, R } = headOf(height);
  const arc = (a0, a1, rad, n = 14) => Array.from({ length: n }, (_, i) => { const a = a0 + (a1 - a0) * (i / (n - 1)); return [hx - 0.02 * s + Math.cos(a) * rad, hy + 0.02 * s + Math.sin(a) * rad, 0.034 * s]; });
  const diadem = { shapes: [limb(arc(2.95, 0.5, R * 1.04), { per: 3 })], fill: { top: '#f7dc7e', bottom: '#c99a2e' }, stroke: 'rgba(90,60,10,.7)', deco() {} };
  const jewel = { shapes: [blob(hx - 0.02 * s + Math.cos(0.55) * R * 1.04, hy + 0.02 * s + Math.sin(0.55) * R * 1.04, 0.032 * s, 0.032 * s, 0, 12)], fill: { top: '#7fd6e0', bottom: '#2a8fb0' }, stroke: 'rgba(20,60,80,.8)' };
  // breiter Halskragen (Gold und Türkis) vorn am Hals
  const collar = { shapes: [poly([[-0.1 * s, 1.4 * s], [0.07 * s, 1.43 * s], [0.2 * s, 1.34 * s], [0.22 * s, 1.2 * s], [0.12 * s, 1.18 * s], [0.0, 1.27 * s], [-0.11 * s, 1.31 * s]], 2)], fill: { top: '#f4d675', bottom: '#b8862d' }, stroke: 'rgba(90,60,10,.7)',
    deco(c) { line(c, [[0.02 * s, 1.36 * s], [0.15 * s, 1.27 * s]], '#2a8fb0', 0.018 * s); line(c, [[0.0, 1.3 * s], [0.13 * s, 1.21 * s]], '#7fd6e0', 0.014 * s); } };
  // Zepter in der nahen Hand (Schaft mit goldener Scheibe und Blattwerk)
  const shaft = { shapes: [limb([[0.04 * s, 0.05 * s, 0.028 * s], [0.04 * s, 1.1 * s, 0.026 * s]], { per: 3 })], fill: { top: '#f4d675', bottom: '#b8862d' }, stroke: 'rgba(90,60,10,.7)' };
  const top = { shapes: [blob(0.04 * s, 1.17 * s, 0.065 * s, 0.065 * s, 0, 18), blob(-0.02 * s, 1.13 * s, 0.05 * s, 0.022 * s, 0.6, 10), blob(0.1 * s, 1.13 * s, 0.05 * s, 0.022 * s, -0.6, 10)], fill: { top: '#fff0b0', bottom: '#e0a82e' }, stroke: 'rgba(90,60,10,.7)' };
  return person({
    id: 's4_kleopatra', name: 'Kleopatra', kind: 'buergerin', height, mood: 'serious', skin: SKIN.warm, hair: { style: 'bun', color: '#2a1a12' },
    tunic: { color: '#f4ead2', color2: '#e0b440', len: 'ankle', sleeves: true, belt: '#e0b440' }, cloak: '#2d6a9f', shoes: 'sandals', near: null,
    parts: { head: [diadem, jewel], body: [collar], armA: [shaft, top] },
    ...o,
  });
}

// ---------------------------------------------------------------------------------------------------- Caesars Truppe (Kettenhemd: Segmentpanzer ist für diese Zeit nicht belegt)
const TUN = { color: '#e6d9b6', color2: '#bfa56c', len: 'knee', sleeves: false, belt: '#4a3020' };
export function legionaer(i = 0, o = {}) {
  const v = [{ skin: SKIN.warm, hair: { style: 'short', color: '#3a2417' } }, { skin: SKIN.tan, hair: { style: 'short', color: '#2f2018' } }, { skin: SKIN.fair, hair: { style: 'short', color: '#7a5a38' } }][i % 3];
  return person({ id: 's4_legionaer' + (i + 1), name: 'Legionär', kind: 'legionaer', armor: 'mail', tunic: TUN, height: 1.72 + (i % 2) * 0.02, ...v, ...o });
}
export function aquilifer(o = {}) {
  return person({ id: 's4_aquilifer', name: 'Adlerträger', kind: 'aquilifer', armor: 'mail', tunic: TUN, cloak: '#6a1f2a', ...o });
}

// ---------------------------------------------------------------------------------------------------- Münzer mit Hammer und Schurz
export function muenzer(o = {}) {
  const height = 1.66, s = sOf(height);
  const S = (pts) => pts.map(([x, y]) => [x * s, y * s]);
  // Hammer: Stiel hängt (Arm unten) schräg nach unten aus der Faust, Kopf quer am Ende (dreht mit dem Arm um die Schulter).
  // Schlagstellung etwa armA = 1,7 (Kopf trifft den Amboss), erhoben etwa armA = 2,9.
  const F0 = -1.9, dx = Math.cos(F0), dy = Math.sin(F0), nx = -dy, ny = dx, HX = 0.03, HY = 0.89;
  const at = (u, w) => [(HX + dx * u + nx * w) * s, (HY + dy * u + ny * w) * s];
  const handle = { shapes: [limb([[...at(0, 0), 0.04 * s], [...at(0.38, 0), 0.04 * s]], { per: 3 })], fill: { top: '#b0824a', bottom: '#74481f' }, stroke: 'rgba(40,20,5,.75)' };
  const head = { shapes: [poly([at(0.3, -0.1), at(0.3, 0.1), at(0.44, 0.1), at(0.44, -0.1)], 1)], fill: { top: '#a3a8b2', bottom: '#4a4f5a' }, stroke: 'rgba(20,25,35,.8)', deco(c) { line(c, [at(0.32, -0.08), at(0.32, 0.08)], 'rgba(255,255,255,.5)', 0.012 * s); } };
  const apron = { shapes: [poly(S([[-0.09, 1.2], [0.16, 1.2], [0.19, 0.66], [-0.1, 0.66]]), 2)], fill: { top: '#9a6a3a', bottom: '#6e431c' }, stroke: 'rgba(40,20,5,.7)', deco(c) { line(c, [[-0.1 * s, 1.1 * s], [0.18 * s, 1.1 * s]], 'rgba(40,20,5,.3)', 0.012 * s); } };
  return person({
    id: 's4_muenzer', name: 'Münzer', kind: 'handwerker', height, near: null, mood: 'smile', hair: { style: 'short', color: '#4a3020' },
    tunic: { color: '#d8c08a', color2: '#a07a40', len: 'knee', sleeves: false, belt: '#6b4a2a' },
    parts: { armA: [handle, head], body: [apron] },
    ...o,
  });
}
