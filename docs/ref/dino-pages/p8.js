// Station 8 (Finale): Die Stunde der Säugetiere – und ein Spaziergang in der Asche
// Links: „Nach dem Einschlag“ (Farnprärie wird Wald, Regler WACHSE!, Familienalbum, Buch schließen)
// Rechts: „Zeitsprung bis Laetoli“ (stufenloser Regler 66 → 3,7 Mio. Jahre, Zeitlücke, Laetoli mit Fußspuren, LAUF!, Wer war früh dabei?, Rotkehlchen)
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, SERIF, RED, INK, roundRect, blotches, speckles, grassTufts, pebbles, makeMap, wrap } from '../engine/pagepaint.js';
import { grainCanvas } from '../engine/papercut.js';
import { PAGES_DE } from '../data/pages.de.js';
import { ANIMALS_DE } from '../data/animals.de.js';
import { Popup, poseAmt, roundRectShape } from '../engine/popup.js';
import { sunGlow } from '../engine/effects.js';
import { animalPicture } from '../engine/thumbs.js';
import { clamp, lerp, smooth, TAU, mulberry32, easeOutBack } from '../engine/util.js';
import { panelPart, dither, softLight, strata, leftCard } from './common.js';
import { blob, limb } from '../art/dsl.js';

const IDX = 8;
const d8 = PAGES_DE[IDX];

// ====================================================================== Zeitachse (alles aus den Zahlen berechnet)
const EP = [
  { n: 'Paläozän', a: 66, b: 56, col: '#d9a05b' },
  { n: 'Eozän', a: 56, b: 33.9, col: '#e6bf62' },
  { n: 'Oligozän', a: 33.9, b: 23.03, col: '#a6c46c' },
  { n: 'Miozän', a: 23.03, b: 5.33, col: '#6fb083' },
  { n: 'Pliozän', a: 5.33, b: 3.7, col: '#e08d5c' },
];
const maOf = (v) => { const s = clamp(v) * 5, i = Math.min(4, Math.floor(s)); return lerp(EP[i].a, EP[i].b, s - i); };
const epOf = (v) => EP[Math.min(4, Math.floor(clamp(v) * 5))];
const fmtMa = (x) => (x >= 10 ? String(Math.round(x)) : (Math.round(x * 10) / 10).toString().replace('.', ','));
const DINO_MA = 231 - 66, GAP_MA = 66 - 3.2;       // rund 165 und rund 63 Mio. Jahre

// Landschaftsstufen: 0 Regenwald, 1 lichter Wald, 2 Grasland, 3 Savanne (+ Laetoli-Asche als Zusatz)
const KEYS = [0.06, 0.4, 0.68, 0.92];
function stageW(v, out) {
  out[0] = out[1] = out[2] = out[3] = 0;
  if (v <= KEYS[0]) { out[0] = 1; return out; }
  if (v >= KEYS[3]) { out[3] = 1; return out; }
  for (let i = 0; i < 3; i++) if (v < KEYS[i + 1]) { const t = smooth((v - KEYS[i]) / (KEYS[i + 1] - KEYS[i])); out[i] = 1 - t; out[i + 1] = t; return out; }
  return out;
}
const win = (v, a0, a1, b0, b1) => smooth(clamp((v - a0) / (a1 - a0))) * (1 - smooth(clamp((v - b0) / (b1 - b0))));

// ====================================================================== Licht (Mood je Stufe, wird in def.mood eingeblendet)
const MOODS = [
  mood({ key: '#ffd9a0', keyI: 2.3, sky: '#f4e6c0', gnd: '#6f7a40', hemiI: 1.7, pos: [-12, 19, 9], rim: 0.5 }),
  mood({ key: '#ffe3b0', keyI: 2.4, sky: '#f3ecc8', gnd: '#7d8340', hemiI: 1.75, pos: [-13, 20, 9], rim: 0.35 }),
  mood({ key: '#fff0cc', keyI: 2.6, sky: '#eaf0e0', gnd: '#8a8a48', hemiI: 1.8, pos: [-13, 21, 9], rim: 0.2 }),
  mood({ key: '#ffd9a6', keyI: 2.7, sky: '#fbe9c8', gnd: '#a07a46', hemiI: 1.7, pos: [-14, 19, 8], rim: 0.3 }),
  mood({ key: '#f0e0cc', keyI: 1.95, sky: '#e2d8cc', gnd: '#8c7c68', hemiI: 1.75, pos: [-13, 21, 9], rim: 0.0 }),
];
const BASE_MOOD = mood({ key: '#ffd9a0', keyI: 2.3, sky: '#f4e6c0', gnd: '#6f7a40', hemiI: 1.7, pos: [-12, 19, 9], rim: 0.5 });
const BASE_COPY = JSON.parse(JSON.stringify(BASE_MOOD));
const MOTES = { colors: [[1, 0.86, 0.5], [1, 0.93, 0.7], [0.97, 0.78, 0.62]], size: 0.1, alpha: 0.65, dy: 0.1, dx: 0.06, tw: 1.4, density: 1 };
const MOTES_COPY = JSON.parse(JSON.stringify(MOTES));
const mw = [0, 0, 0, 0, 0];
function blendMood(out, W, ash) {
  mw[0] = W[0]; mw[1] = W[1]; mw[2] = W[2]; mw[3] = W[3] * (1 - ash); mw[4] = ash;
  for (let c = 0; c < 3; c++) { out.keyC[c] = 0; out.skyC[c] = 0; out.gndC[c] = 0; }
  for (let c = 0; c < 3; c++) out.pos[c] = 0;
  out.keyI = 0; out.hemiI = 0; out.rimI = 0;
  for (let i = 0; i < 5; i++) {
    const w = mw[i]; if (w <= 0) continue; const M = MOODS[i];
    for (let c = 0; c < 3; c++) { out.keyC[c] += M.keyC[c] * w; out.skyC[c] += M.skyC[c] * w; out.gndC[c] += M.gndC[c] * w; out.pos[c] += M.pos[c] * w; }
    out.keyI += M.keyI * w; out.hemiI += M.hemiI * w; out.rimI += M.rimI * w;
  }
}

// ====================================================================== kleine Zeichen-Helfer
const cv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h)); return c; };
const mkTex = (c, aniso = 4) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; };
const flatMesh = (w, h, map, { y = 0.02, order = 1, opacity = 1, shadow = true, basic = false } = {}) => {
  const mat = basic ? new THREE.MeshBasicMaterial({ map, transparent: true, opacity, depthWrite: false })
    : new THREE.MeshLambertMaterial({ map, transparent: true, opacity, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.renderOrder = order; m.receiveShadow = shadow && !basic;
  return m;
};

// ---- Böden
const GR = {
  forest: { back: '#4f7d45', front: '#62914d' },
  light: { back: '#8aa352', front: '#9db35c' },
  grass: { back: '#a6b75a', front: '#bac764' },
  sav: { back: '#c8a85f', front: '#d8b86c' },
  ash: { back: '#b3a38f', front: '#a39380' },
};
const GROUND_RECT = { x0: 0.02, x1: 11.58, z0: -3.83, z1: 3.83 };
function pond(m) {
  const { ctx, S } = m; const cx = m.x(7.4), cz = m.z(-0.5);
  ctx.save();
  ctx.fillStyle = 'rgba(222,205,150,.78)'; ctx.beginPath(); ctx.ellipse(cx, cz, 2.05 * S, 0.82 * S, 0, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(cx - 0.4 * S, cz - 0.1 * S, 0.1 * S, cx, cz, 1.9 * S); g.addColorStop(0, '#8fd0c0'); g.addColorStop(1, '#4f9a92');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cz, 1.82 * S, 0.64 * S, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 0.025 * S; ctx.lineCap = 'round';
  for (const [dx, dz, r] of [[-0.6, -0.08, 0.5], [0.5, 0.12, 0.38], [0.1, -0.2, 0.25]]) { ctx.beginPath(); ctx.ellipse(cx + dx * S, cz + dz * S, r * S, r * 0.34 * S, 0, 0.3, 2.6); ctx.stroke(); }
  ctx.restore();
}
function paintGround(m, kind) {
  const R = { x0: GROUND_RECT.x0 + 0.4, x1: GROUND_RECT.x1 - 0.2, z0: GROUND_RECT.z0, z1: GROUND_RECT.z1 };
  const seed = { forest: 11, light: 12, grass: 13, sav: 14, ash: 15 }[kind];
  if (kind === 'forest') {
    blotches(m, { ...R, n: 30, rmin: 0.7, rmax: 2.2, colors: ['rgba(20,50,25,.22)', 'rgba(190,230,120,.12)', 'rgba(60,40,15,.12)'], seed });
    speckles(m, { ...R, n: 420, color: 'rgba(60,40,15,.3)', size: 0.022, seed: seed + 1 });
    grassTufts(m, { ...R, n: 34, color: '#2f6a3a', h: 0.3, seed: seed + 2, blades: 4, alpha: 0.7 });
    pond(m);
  } else if (kind === 'light') {
    blotches(m, { ...R, n: 28, rmin: 0.7, rmax: 2.2, colors: ['rgba(60,80,25,.2)', 'rgba(240,235,150,.16)', 'rgba(90,60,20,.1)'], seed });
    speckles(m, { ...R, n: 380, color: 'rgba(80,55,20,.26)', size: 0.022, seed: seed + 1 });
    grassTufts(m, { ...R, n: 46, color: '#5f8a34', h: 0.32, seed: seed + 2, blades: 5, alpha: 0.75 });
    pond(m);
  } else if (kind === 'grass') {
    blotches(m, { ...R, n: 26, rmin: 0.8, rmax: 2.4, colors: ['rgba(255,245,150,.18)', 'rgba(110,130,40,.18)', 'rgba(150,110,40,.1)'], seed });
    grassTufts(m, { ...R, n: 120, color: '#7f9a3a', h: 0.34, seed: seed + 2, blades: 6, alpha: 0.7 });
    grassTufts(m, { ...R, n: 50, color: '#d3c46a', h: 0.3, seed: seed + 3, blades: 5, alpha: 0.7 });
    speckles(m, { ...R, n: 200, color: 'rgba(90,70,25,.2)', size: 0.02, seed: seed + 1 });
  } else if (kind === 'sav') {
    blotches(m, { ...R, n: 28, rmin: 0.8, rmax: 2.6, colors: ['rgba(255,232,160,.2)', 'rgba(150,100,40,.16)', 'rgba(255,255,255,.08)'], seed });
    grassTufts(m, { ...R, n: 70, color: '#b08a3c', h: 0.36, seed: seed + 2, blades: 5, alpha: 0.75 });
    grassTufts(m, { ...R, n: 30, color: '#e6cf86', h: 0.3, seed: seed + 3, blades: 5, alpha: 0.7 });
    pebbles(m, { ...R, n: 26, seed: seed + 4 });
    speckles(m, { ...R, n: 260, color: 'rgba(110,70,25,.22)', size: 0.02, seed: seed + 1 });
  } else { // Laetoli: feine graue Vulkanasche mit weicher Spurzone und Regentropfen-Dellen
    blotches(m, { ...R, n: 34, rmin: 0.8, rmax: 2.6, colors: ['rgba(235,225,208,.2)', 'rgba(80,68,55,.2)', 'rgba(255,255,255,.07)'], seed });
    const { ctx, S } = m; const r = mulberry32(seed + 7);
    for (let i = 0; i < 13; i++) { // helle, glatte Aschedecke entlang der Spur
      const x = 1.2 + i * 0.78, z = 0.35 + (r() - 0.5) * 0.9, rad = (0.9 + r() * 0.5) * S;
      const g = ctx.createRadialGradient(m.x(x), m.z(z), 0, m.x(x), m.z(z), rad); g.addColorStop(0, 'rgba(222,211,191,.62)'); g.addColorStop(1, 'rgba(222,211,191,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), rad * 1.15, rad * 0.62, 0, 0, TAU); ctx.fill();
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 40; i++) { // Windrippel
      const x = R.x0 + r() * (R.x1 - R.x0), z = -2.6 + r() * 5.2, L = (0.5 + r() * 1.0) * S;
      ctx.strokeStyle = r() > 0.5 ? 'rgba(255,248,232,.2)' : 'rgba(70,58,46,.14)'; ctx.lineWidth = 0.03 * S;
      ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.quadraticCurveTo(m.x(x) + L * 0.5, m.z(z) - 0.08 * S, m.x(x) + L, m.z(z)); ctx.stroke();
    }
    ctx.lineWidth = Math.max(1, 0.012 * S);
    for (let i = 0; i < 160; i++) { // Regentropfen-Dellen
      const x = R.x0 + r() * (R.x1 - R.x0), z = R.z0 + r() * (R.z1 - R.z0), rad = (0.02 + r() * 0.03) * S;
      ctx.strokeStyle = 'rgba(255,250,240,.32)'; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), rad, rad * 0.6, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(60,48,36,.22)'; ctx.beginPath(); ctx.ellipse(m.x(x) + 1, m.z(z) + 1, rad, rad * 0.6, 0, 0, TAU); ctx.stroke();
    }
    speckles(m, { ...R, n: 520, color: 'rgba(60,48,36,.2)', size: 0.016, seed: seed + 1 });
  }
}
function makeOverlay(kind) {
  const r = GROUND_RECT, w = r.x1 - r.x0, h = r.z1 - r.z0, S = 72;
  const c = cv(w * S, h * S), ctx = c.getContext('2d');
  const m = makeMap(ctx, r, S);
  ctx.save(); roundRect(ctx, 0, 0, c.width, c.height, 0.12 * S); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, c.height); g.addColorStop(0, GR[kind].back); g.addColorStop(1, GR[kind].front);
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
  paintGround(m, kind);
  // Falz-Schatten wie auf der gedruckten Seite
  const gw = 1.7 * S, gg = ctx.createLinearGradient(m.x(0), 0, m.x(0) + gw, 0);
  gg.addColorStop(0, 'rgba(30,14,4,.5)'); gg.addColorStop(0.35, 'rgba(30,14,4,.18)'); gg.addColorStop(1, 'rgba(30,14,4,0)');
  ctx.fillStyle = gg; ctx.fillRect(m.x(0), 0, gw, c.height);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.45; ctx.fillStyle = ctx.createPattern(grainCanvas(), 'repeat'); ctx.fillRect(0, 0, c.width, c.height);
  ctx.restore();
  return mkTex(c, 4);
}

// ---- Bedienplatte rechts: Zeitlücke-Band + Lineal des Zeitsprung-Reglers
const PLATE = { x0: 0.3, x1: 11.7, z0: 0.9, z1: 3.95 };
const SL = { a: 2.05, b: 8.35, z: 3.8, w: 2.1, h: 0.8 };
const BAND = { x0: 0.55, x1: 9.75, z0: 0.98, z1: 2.78 };
const BAR = { x0: 3.25, B: 1.52, A: 1.95, hh: 0.34, k: 6.0 / DINO_MA };
const PIN_S = (BAR.A - BAR.B + 0.207) / 0.567; // Marke streckt sich mit dem Balkenabstand (Punkt sitzt auf Balken A)
const PIN_Z = BAR.A;
const pinX = (ma) => BAR.x0 + clamp((66 - ma) / GAP_MA, 0, 1) * (GAP_MA * BAR.k);
function paintPlate() {
  const S = 100, w = PLATE.x1 - PLATE.x0, h = PLATE.z1 - PLATE.z0;
  const c = cv(w * S, h * S), ctx = c.getContext('2d');
  const m = makeMap(ctx, { x0: PLATE.x0, x1: PLATE.x1, z0: PLATE.z0, z1: PLATE.z1 }, S);
  const X = (x) => m.x(x), Z = (z) => m.z(z);
  ctx.textBaseline = 'middle';
  // Papierband
  ctx.save();
  ctx.shadowColor = 'rgba(40,20,5,.4)'; ctx.shadowBlur = 0.14 * S; ctx.shadowOffsetY = 0.05 * S; ctx.shadowOffsetX = 0.03 * S;
  ctx.fillStyle = '#f3e6c8'; roundRect(ctx, X(BAND.x0), Z(BAND.z0), (BAND.x1 - BAND.x0) * S, (BAND.z1 - BAND.z0) * S, 0.08 * S); ctx.fill();
  ctx.restore();
  ctx.save(); roundRect(ctx, X(BAND.x0), Z(BAND.z0), (BAND.x1 - BAND.x0) * S, (BAND.z1 - BAND.z0) * S, 0.08 * S); ctx.clip();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.fillStyle = ctx.createPattern(grainCanvas(), 'repeat'); ctx.fillRect(0, 0, c.width, c.height); ctx.restore();
  ctx.strokeStyle = 'rgba(139,30,30,.3)'; ctx.lineWidth = Math.max(1, 0.012 * S);
  roundRect(ctx, X(BAND.x0 + 0.1), Z(BAND.z0 + 0.09), (BAND.x1 - BAND.x0 - 0.2) * S, (BAND.z1 - BAND.z0 - 0.18) * S, 0.05 * S); ctx.stroke();
  // Klebestreifen
  ctx.fillStyle = 'rgba(240,205,110,.72)';
  for (const sx of [BAND.x0 + 0.5, BAND.x1 - 0.5]) { ctx.save(); ctx.translate(X(sx), Z(BAND.z0) + 0.02 * S); ctx.rotate(sx < 5 ? -0.3 : 0.3); ctx.fillRect(-0.35 * S, -0.12 * S, 0.7 * S, 0.24 * S); ctx.restore(); }
  // Titel
  ctx.textAlign = 'left'; ctx.fillStyle = RED; ctx.font = `bold ${0.27 * S}px ${SERIF}`;
  try { ctx.letterSpacing = Math.round(0.03 * S) + 'px'; } catch (e) { /* ok */ }
  ctx.fillText('DIE GROSSE ZEITLÜCKE', X(BAND.x0 + 0.3), Z(1.22));
  try { ctx.letterSpacing = '0px'; } catch (e) { /* ok */ }
  ctx.textAlign = 'right'; ctx.fillStyle = '#7a5b3a'; ctx.font = `italic ${0.2 * S}px ${SERIF}`; ctx.fillText('Balken maßstabsgetreu', X(BAND.x1 - 0.3), Z(1.22));
  // Balken
  const bar = (z, ma, col, label, l0, l1, hatch) => {
    const x0 = BAR.x0, wB = ma * BAR.k;
    ctx.fillStyle = 'rgba(40,20,5,.2)'; roundRect(ctx, X(x0) + 2, Z(z - BAR.hh / 2) + 3, wB * S, BAR.hh * S, 0.07 * S); ctx.fill();
    ctx.fillStyle = col; roundRect(ctx, X(x0), Z(z - BAR.hh / 2), wB * S, BAR.hh * S, 0.07 * S); ctx.fill();
    if (hatch) { ctx.save(); roundRect(ctx, X(x0), Z(z - BAR.hh / 2), wB * S, BAR.hh * S, 0.07 * S); ctx.clip(); ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 0.05 * S; for (let i = -4; i < wB * 4; i++) { ctx.beginPath(); ctx.moveTo(X(x0 + i * 0.25), Z(z + BAR.hh / 2)); ctx.lineTo(X(x0 + i * 0.25 + 0.27), Z(z - BAR.hh / 2)); ctx.stroke(); } ctx.restore(); }
    ctx.strokeStyle = 'rgba(60,35,15,.55)'; ctx.lineWidth = Math.max(1, 0.012 * S); roundRect(ctx, X(x0), Z(z - BAR.hh / 2), wB * S, BAR.hh * S, 0.07 * S); ctx.stroke();
    ctx.textAlign = 'center'; ctx.fillStyle = '#fffaf0'; ctx.shadowColor = 'rgba(40,15,5,.6)'; ctx.shadowBlur = 3;
    let fs = 0.27 * S; ctx.font = `bold ${fs}px ${SERIF}`; const room = wB * S - 0.9 * S; while (ctx.measureText(label).width > room && fs > 8) { fs -= 1; ctx.font = `bold ${fs}px ${SERIF}`; }
    ctx.fillText(label, X(x0 + wB / 2), Z(z) + 1);
    ctx.font = `bold ${0.2 * S}px ${SERIF}`; ctx.textAlign = 'left'; ctx.fillText(l0, X(x0 + 0.1), Z(z) + 1); ctx.textAlign = 'right'; ctx.fillText(l1, X(x0 + wB - 0.1), Z(z) + 1);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  };
  ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = `bold ${0.24 * S}px ${SERIF}`;
  ctx.fillText('Dinosaurier-Zeit', X(BAND.x0 + 0.3), Z(BAR.B));
  ctx.fillText('Einschlag–Lucy', X(BAND.x0 + 0.3), Z(BAR.A));
  bar(BAR.B, DINO_MA, '#b9582f', `rund ${Math.round(DINO_MA)} Mio. Jahre`, '231', '66', false);
  bar(BAR.A, GAP_MA, '#d19a2a', `rund ${Math.round(GAP_MA)} Mio. Jahre`, '66', '3,2', true);
  // Text (kurz und groß: zwei Zeilen)
  ctx.textAlign = 'left'; ctx.fillStyle = INK; ctx.font = `${0.235 * S}px ${SERIF}`;
  ctx.fillText(`Zwischen Einschlag und Lucy liegen rund ${Math.round(GAP_MA)} Mio. Jahre.`, X(BAND.x0 + 0.3), Z(2.36));
  ctx.font = `bold italic ${0.25 * S}px ${SERIF}`; ctx.fillStyle = RED;
  ctx.fillText('Menschen und Dinosaurier sind sich nie begegnet.', X(BAND.x0 + 0.3), Z(2.62));
  // Lineal des Zeitsprung-Reglers
  const L = SL.b - SL.a, bx = (i) => SL.a + (L * i) / 5;
  ctx.textAlign = 'center';
  EP.forEach((e, i) => {
    const rw = (bx(i + 1) - bx(i)) * S - 3;
    ctx.fillStyle = 'rgba(40,20,5,.22)'; roundRect(ctx, X(bx(i)) + 1, Z(2.9) + 2, rw, 0.27 * S, 0.06 * S); ctx.fill();
    ctx.fillStyle = e.col; roundRect(ctx, X(bx(i)), Z(2.9), rw, 0.27 * S, 0.06 * S); ctx.fill();
    ctx.strokeStyle = 'rgba(60,35,15,.5)'; ctx.lineWidth = Math.max(1, 0.01 * S); ctx.stroke();
    ctx.fillStyle = '#3a2210'; ctx.font = `bold ${0.205 * S}px ${SERIF}`; ctx.fillText(e.n, X((bx(i) + bx(i + 1)) / 2), Z(3.035) + 1);
  });
  ctx.font = `italic bold ${0.18 * S}px ${SERIF}`; ctx.fillStyle = '#fff6df'; ctx.shadowColor = 'rgba(25,12,4,.9)'; ctx.shadowBlur = 4;
  [66, 56, 33.9, 23.03, 5.33, 3.7].forEach((ma, i) => ctx.fillText(fmtMa(ma), X(bx(i)), Z(3.27)));
  ctx.textAlign = 'left'; ctx.fillText('Mio. Jahre (Epochen gleich breit)', X(bx(5) + 0.3), Z(3.27));
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  return mkTex(c, 4);
}

// ---- Handle des Zeitsprung-Reglers (zeigt live die Zeit)
function drawHandle(tex, line1, line2, color) {
  const c = tex.image, g = c.getContext('2d'), Wp = c.width, Hp = c.height, S = 160;
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.clearRect(0, 0, Wp, Hp);
  const r = 0.22 * S, m = 0.07 * S;
  g.fillStyle = '#f6edd6'; rr(0, 0, Wp, Hp, r); g.fill();
  const grad = g.createLinearGradient(0, 0, 0, Hp); const col = new THREE.Color(color);
  const sh = (k) => '#' + col.clone().multiplyScalar(k).getHexString();
  grad.addColorStop(0, sh(1.12)); grad.addColorStop(1, sh(0.86));
  g.fillStyle = grad; rr(m, m, Wp - 2 * m, Hp - 2 * m, r * 0.75); g.fill();
  g.strokeStyle = 'rgba(255,240,210,.55)'; g.lineWidth = 2; g.setLineDash([7, 6]); rr(m * 2, m * 2, Wp - 4 * m, Hp - 4 * m, r * 0.55); g.stroke(); g.setLineDash([]);
  g.fillStyle = 'rgba(40,10,5,.28)';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(Wp * 0.1 + i * 0.07 * S, Hp * (0.4 + j * 0.2), 0.022 * S, 0, 7); g.fill(); }
  g.fillStyle = 'rgba(255,246,223,.9)'; const ah = Hp * 0.2;
  const tri = (x, dir) => { g.beginPath(); g.moveTo(x, Hp / 2); g.lineTo(x - dir * ah * 0.9, Hp / 2 - ah); g.lineTo(x - dir * ah * 0.9, Hp / 2 + ah); g.closePath(); g.fill(); };
  tri(Wp - 0.1 * S, 1); tri(0.34 * S, -1);
  g.fillStyle = '#fff6df'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(60,10,5,.5)'; g.shadowBlur = 3; g.shadowOffsetY = 2;
  const cx = Wp * 0.57, maxW = Wp * 0.6;
  let fs = Hp * 0.36; g.font = `bold ${fs}px ${SERIF}`; while (g.measureText(line1).width > maxW && fs > 8) { fs -= 1; g.font = `bold ${fs}px ${SERIF}`; }
  g.fillText(line1, cx, Hp * 0.4);
  fs = Hp * 0.24; g.font = `italic bold ${fs}px ${SERIF}`; while (g.measureText(line2).width > maxW && fs > 6) { fs -= 1; g.font = `italic bold ${fs}px ${SERIF}`; }
  g.fillText(line2, cx, Hp * 0.72);
  g.shadowColor = 'transparent';
  tex.needsUpdate = true;
}

// ---- Fußabdruck (Dellen in der Asche)
function footprintTex() {
  const c = cv(128, 256), g = c.getContext('2d');
  const shape = (ox, oy) => {
    g.beginPath(); g.ellipse(64 + ox, 188 + oy, 25, 36, 0, 0, TAU); g.moveTo(64 + ox, 150 + oy); g.ellipse(60 + ox, 126 + oy, 20, 34, 0.1, 0, TAU);
    g.moveTo(64 + ox, 110 + oy); g.ellipse(68 + ox, 98 + oy, 34, 38, 0, 0, TAU);
    for (const [tx, ty, rx, ry] of [[90, 50, 17, 23], [67, 36, 12, 16], [47, 42, 10, 14], [31, 54, 9, 12], [19, 71, 8, 11]]) { g.moveTo(tx + ox + rx, ty + oy); g.ellipse(tx + ox, ty + oy, rx, ry, 0, 0, TAU); }
  };
  g.fillStyle = 'rgba(250,242,226,.7)'; shape(-3, -3); g.fill();
  g.shadowColor = 'rgba(60,46,34,.9)'; g.shadowBlur = 9; g.fillStyle = 'rgba(86,70,56,.78)'; shape(0, 0); g.fill();
  g.shadowColor = 'transparent'; g.fillStyle = 'rgba(60,46,34,.35)'; shape(3, 3); g.fill();
  return mkTex(c, 4);
}
function pinTex() { // senkrechte Marke mit Punkt unten (liegt auf der Platte)
  const c = cv(60, 204), g = c.getContext('2d');
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(30,10,5,.35)'; g.lineWidth = 11; g.beginPath(); g.moveTo(32, 10); g.lineTo(32, 168); g.stroke();
  g.strokeStyle = '#fff6df'; g.lineWidth = 10; g.beginPath(); g.moveTo(30, 8); g.lineTo(30, 166); g.stroke();
  g.strokeStyle = '#c0322a'; g.lineWidth = 5; g.beginPath(); g.moveTo(30, 8); g.lineTo(30, 166); g.stroke();
  g.fillStyle = '#fff6df'; g.beginPath(); g.arc(30, 170, 19, 0, TAU); g.fill();
  g.fillStyle = '#c0322a'; g.beginPath(); g.arc(30, 170, 13, 0, TAU); g.fill();
  g.fillStyle = '#fff6df'; g.beginPath(); g.arc(30, 170, 4.5, 0, TAU); g.fill();
  return mkTex(c, 4);
}
// ---- Kachel „Wer war früh dabei?“
const TILES = [
  { id: 'sahelanthropus', big: '7', unit: 'Mio. Jahre', name: 'Sahelanthropus', where: 'Tschad', note: 'umstritten', col: '#e3c070' },
  { id: 'orrorin', big: '6', unit: 'Mio. Jahre', name: 'Orrorin', where: 'Kenia', note: '', col: '#e6ad6e' },
  { id: 'ardipithecus', big: '4,4', unit: 'Mio. Jahre', name: 'Ardipithecus', where: 'Äthiopien', note: '„Ardi“', col: '#cdb872' },
  { id: 'australopithecus', big: '4–2', unit: 'Mio. Jahre', name: 'Australopithecus', where: 'Afrika', note: 'Lucy, Laetoli', col: '#d89a6c' },
  { id: 'homo_fruehe', big: 'ab 2,8', unit: 'Mio. Jahre', name: 'erste Homo', where: 'Äthiopien', note: 'noch nicht da', col: '#c4bcaa', ghost: true },
];
function tileTex(t) {
  const c = cv(256, 280), g = c.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = '#f6edd6'; rr(2, 2, 252, 276, 20); g.fill();
  const grad = g.createLinearGradient(0, 0, 0, 280); grad.addColorStop(0, t.col); grad.addColorStop(1, '#f3e4c4');
  g.fillStyle = grad; rr(12, 12, 232, 256, 14); g.fill();
  g.strokeStyle = 'rgba(120,70,30,.45)'; g.lineWidth = 2; g.setLineDash([8, 6]); rr(20, 20, 216, 240, 10); g.stroke(); g.setLineDash([]);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#5a2f14';
  let fs = 84; g.font = `bold ${fs}px ${SERIF}`; while (g.measureText(t.big).width > 190 && fs > 20) { fs -= 3; g.font = `bold ${fs}px ${SERIF}`; }
  g.fillText(t.big, 128, 82);
  g.font = `italic bold 26px ${SERIF}`; g.fillStyle = '#7a4a22'; g.fillText(t.unit, 128, 132);
  g.fillStyle = '#3a2615'; fs = 30; g.font = `bold ${fs}px ${SERIF}`; while (g.measureText(t.name).width > 206 && fs > 12) { fs -= 1; g.font = `bold ${fs}px ${SERIF}`; }
  g.fillText(t.name, 128, 174);
  g.font = `24px ${SERIF}`; g.fillStyle = '#4a3320'; g.fillText(t.where, 128, 207);
  if (t.note) { g.font = `italic 22px ${SERIF}`; g.fillStyle = '#8B1E1E'; g.fillText(t.note, 128, 238); }
  return mkTex(c, 4);
}
function bannerHeadTex() {
  const c = cv(1000, 150), g = c.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = '#f3e6c8'; rr(2, 2, 996, 146, 24); g.fill();
  g.save(); rr(2, 2, 996, 146, 24); g.clip(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5; g.fillStyle = g.createPattern(grainCanvas(), 'repeat'); g.fillRect(0, 0, 1000, 150); g.restore();
  g.strokeStyle = 'rgba(139,30,30,.35)'; g.lineWidth = 3; rr(12, 12, 976, 126, 16); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = RED; g.font = `bold 62px ${SERIF}`; g.fillText('Wer war früh dabei?', 500, 56);
  g.fillStyle = '#6b4a2a'; g.font = `italic 36px ${SERIF}`; g.fillText('frühe Hominiden (Vormenschen) – tippe eine Kachel', 500, 108);
  return mkTex(c, 4);
}
function woodTex() {
  const c = cv(32, 256), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 32, 0); gr.addColorStop(0, '#6b4528'); gr.addColorStop(0.5, '#9a6a3c'); gr.addColorStop(1, '#6b4528');
  g.fillStyle = gr; g.fillRect(0, 0, 32, 256);
  g.strokeStyle = 'rgba(40,20,5,.35)'; g.lineWidth = 1.5; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(6 + i * 4, 0); g.lineTo(8 + i * 4 + (i % 2), 256); g.stroke(); }
  return mkTex(c, 2);
}

// ---- Papierkarten (Album) und Knopf
function albumCardTex(id, found) {
  const c = cv(208, 260), g = c.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = found ? '#fbf3dc' : '#e9ddc0'; rr(2, 2, 204, 256, 14); g.fill();
  g.save(); rr(2, 2, 204, 256, 14); g.clip(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.5; g.fillStyle = g.createPattern(grainCanvas(), 'repeat'); g.fillRect(0, 0, 208, 260); g.restore();
  g.fillStyle = found ? '#e9d7a8' : '#cdbd98'; rr(14, 14, 180, 150, 8); g.fill();
  let pic = null; try { pic = animalPicture(id, 168, 112, { dark: !found }); } catch (e) { /* ignore */ }
  if (pic) g.drawImage(pic, 20, 22, 168, 112 * 1.0 + 0);
  if (!found) { g.fillStyle = 'rgba(250,240,215,.92)'; g.font = `bold 84px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = 'rgba(60,40,20,.5)'; g.shadowBlur = 6; g.fillText('?', 104, 86); g.shadowColor = 'transparent'; }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const nm = found ? (ANIMALS_DE[id].name || id) : 'noch nicht gefunden';
  g.fillStyle = found ? '#3a2615' : '#8a6b3f'; let fs = found ? 25 : 22; g.font = `${found ? 'bold ' : 'italic '}${fs}px ${SERIF}`;
  const words = nm.split(' '); const maxW = 184;
  const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (g.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  lines.push(cur);
  while (lines.some((l) => g.measureText(l).width > maxW) && fs > 12) { fs -= 1; g.font = `${found ? 'bold ' : 'italic '}${fs}px ${SERIF}`; }
  lines.slice(0, 2).forEach((l, i, a) => g.fillText(l, 104, 190 + (i - (a.length - 1) / 2) * (fs + 3) + (a.length === 1 ? 14 : 8)));
  g.strokeStyle = 'rgba(140,90,40,.4)'; g.lineWidth = 2; rr(2, 2, 204, 256, 14); g.stroke();
  return mkTex(c, 4);
}
function buttonTex(w, h) {
  const S = 180, c = cv(w * S, h * S), g = c.getContext('2d');
  const rr = (x, y, ww, hh, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + ww, y, x + ww, y + hh, r); g.arcTo(x + ww, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + ww, y, r); g.closePath(); };
  g.fillStyle = '#f6edd6'; rr(0, 0, c.width, c.height, 0.2 * S); g.fill();
  const gr = g.createLinearGradient(0, 0, 0, c.height); gr.addColorStop(0, '#2f7a5a'); gr.addColorStop(1, '#1f5a41');
  g.fillStyle = gr; rr(0.06 * S, 0.06 * S, c.width - 0.12 * S, c.height - 0.12 * S, 0.16 * S); g.fill();
  g.strokeStyle = 'rgba(243,214,130,.8)'; g.lineWidth = 2; g.setLineDash([8, 6]); rr(0.12 * S, 0.12 * S, c.width - 0.24 * S, c.height - 0.24 * S, 0.12 * S); g.stroke(); g.setLineDash([]);
  // kleines geschlossenes Buch
  const bx = 0.42 * S, by = c.height / 2; g.fillStyle = '#f3d682'; rr(bx - 0.17 * S, by - 0.2 * S, 0.34 * S, 0.4 * S, 0.04 * S); g.fill();
  g.fillStyle = '#1f5a41'; g.fillRect(bx - 0.12 * S, by - 0.2 * S, 0.03 * S, 0.4 * S);
  g.fillStyle = '#fff6df'; g.textAlign = 'center'; g.textBaseline = 'middle'; let fs = 0.27 * S; g.font = `bold ${fs}px ${SERIF}`;
  g.shadowColor = 'rgba(10,30,20,.6)'; g.shadowBlur = 3; g.shadowOffsetY = 2;
  while (g.measureText('Buch schließen').width > c.width * 0.62 && fs > 8) { fs -= 1; g.font = `bold ${fs}px ${SERIF}`; }
  g.fillText('Buch schließen', c.width * 0.6, c.height * 0.52);
  return mkTex(c, 4);
}
function slab(w, h, map, depth = 0.09) {
  const geo = new THREE.ExtrudeGeometry(roundRectShape(w, h, 0.16), { depth, bevelEnabled: false, curveSegments: 6 });
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) + h / 2) / h);
  const m = new THREE.Mesh(geo, [new THREE.MeshLambertMaterial({ map }), new THREE.MeshLambertMaterial({ color: 0xf1e7cf })]);
  m.rotation.x = -Math.PI / 2; m.castShadow = true;
  return m;
}

// ---- Flats ein-/ausblendbar machen (Rand mitblenden)
function fadeable(pop, { shadow = false } = {}) {
  const mesh = pop.cut.mesh, cap = pop.cut.material, edge = mesh.material[1].clone();
  mesh.material = [cap, edge]; mesh.castShadow = shadow;
  const base = cap.color.clone();
  return {
    set(a, tint = 0) {
      const tr = a < 0.999; if (cap.transparent !== tr) { cap.transparent = tr; edge.transparent = tr; }
      cap.opacity = a; edge.opacity = a;
      if (tint !== undefined) { cap.color.setRGB(base.r * lerp(1, 0.8, tint), base.g * lerp(1, 0.76, tint), base.b * lerp(1, 0.74, tint)); }
    },
  };
}
const show = (pop, on) => { pop.group.visible = on && pop.eff > 0.004; };


// ---- Aschedüne (weiche, helle Welle mit Windrippen)
function duneFlatPart(w, h, seed) {
  const pts = [[-w / 2, 0]];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([-w / 2 + w * t, h * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.78)), 1.25) * (0.92 + 0.08 * Math.sin(t * 9 + seed))]);
  }
  pts.push([w / 2, 0]);
  return {
    layers: [{
      shapes: [pts], fill: { top: '#f1e8d7', bottom: '#c6b9a3' },
      deco(c, bb) {
        softLight(c, bb, { color: 'rgba(255,250,236,.45)', cx: 0.22, cy: 0.9, r: 0.7 });
        softLight(c, bb, { color: 'rgba(60,48,36,.3)', cx: 0.86, cy: 0.3, r: 0.6 });
        const { ctx, tf } = c; ctx.lineCap = 'round';
        for (let k = 0; k < 4; k++) {
          ctx.strokeStyle = k % 2 ? 'rgba(255,250,236,.4)' : 'rgba(70,58,44,.22)'; ctx.lineWidth = Math.max(1, 0.016 * c.S);
          ctx.beginPath();
          for (let i = 0; i <= 24; i++) { const t = i / 24, x = bb.x0 + bb.w * (0.04 + 0.92 * t), y = bb.y0 + bb.h * (0.16 + 0.17 * k) + Math.sin(t * 6 + k * 1.7 + seed) * 0.03 * bb.h; const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
          ctx.stroke();
        }
        dither(c, bb, '#fffaf0', { n: 60, alpha: 0.3, size: 0.02 }); dither(c, bb, '#3a2e22', { n: 60, alpha: 0.2, size: 0.02 });
      },
    }],
  };
}

// ---- ein Baum mit Ast für den Baumaffen
function branchTreePart() {
  const trunk = limb([[0.3, 0, 0.62], [0.35, 1.3, 0.46], [0.28, 2.5, 0.36], [0.2, 3.5, 0.28]], { per: 8 });
  const branch = limb([[0.3, 2.15, 0.34], [0.95, 2.34, 0.26], [1.7, 2.3, 0.18], [2.2, 2.36, 0.12]], { per: 8 });
  const twig = limb([[0.22, 3.2, 0.2], [-0.5, 3.7, 0.14], [-1.0, 4.0, 0.1]], { per: 6 });
  return {
    layers: [
      { shapes: [trunk, branch, twig], fill: { top: '#6a4a2a', bottom: '#8a6238' }, deco: (c, bb) => dither(c, bb, '#3a2410', { n: 90, alpha: 0.28, size: 0.03 }), stroke: 'rgba(40,24,10,.5)' },
      { shapes: [blob(0.1, 4.0, 1.5, 0.85, 0.1), blob(-0.9, 3.9, 0.8, 0.5, 0.3), blob(1.0, 4.2, 0.8, 0.55, -0.2), blob(2.0, 2.78, 0.62, 0.34, 0.2), blob(1.2, 2.7, 0.5, 0.26, 0)], fill: { top: '#79b04e', bottom: '#4f8a3c' }, deco: (c, bb) => { dither(c, bb, '#c8ee8a', { n: 90, alpha: 0.3, size: 0.07 }); dither(c, bb, '#2b5a28', { n: 70, alpha: 0.28, size: 0.07 }); } },
    ],
  };
}

// ====================================================================== die Seite
export default {
  id: d8.id,
  mood: BASE_MOOD,
  motes: MOTES,
  atmo: d8.id,
  base() {
    return {
      L: {
        ground: { back: '#dcc886', front: '#c5b36c' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 81,
        draw(ctx, m) {
          blotches(m, { x0: -11.5, x1: -0.4, z0: -3.8, z1: 3.8, n: 18, rmin: 0.9, rmax: 2.4, colors: ['rgba(150,175,120,.18)', 'rgba(240,170,150,.12)', 'rgba(255,240,190,.16)'], seed: 7 });
          grassTufts(m, { x0: -11, x1: -0.8, z0: -3.2, z1: 0.4, n: 30, color: '#7f9a62', h: 0.32, seed: 5, blades: 5, alpha: 0.7 });
          grassTufts(m, { x0: -5.2, x1: -0.8, z0: 2.4, z1: 2.9, n: 6, color: '#8aa468', h: 0.26, seed: 9, blades: 4, alpha: 0.6 });
          // Erdhöhlen (Eingänge)
          for (const [bx, bz] of [[-4.75, 0.38], [-2.2, 0.55]]) {
            ctx.save(); ctx.fillStyle = 'rgba(120,85,45,.55)'; ctx.beginPath(); ctx.ellipse(m.x(bx), m.z(bz), 0.42 * m.S, 0.2 * m.S, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = '#2c1d10'; ctx.beginPath(); ctx.ellipse(m.x(bx), m.z(bz) + 0.015 * m.S, 0.3 * m.S, 0.135 * m.S, 0, 0, TAU); ctx.fill();
            ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(m.x(bx), m.z(bz) - 0.01 * m.S, 0.22 * m.S, 0.07 * m.S, 0, 0, TAU); ctx.fill(); ctx.restore();
          }
          // Familienalbum-Unterlage
          const ax0 = -5.25, ax1 = -0.65, az0 = 0.8, az1 = 2.38;
          ctx.save(); ctx.shadowColor = 'rgba(40,20,5,.35)'; ctx.shadowBlur = 0.12 * m.S; ctx.shadowOffsetY = 0.04 * m.S;
          ctx.fillStyle = '#7b5a3a'; roundRect(ctx, m.x(ax0), m.z(az0), (ax1 - ax0) * m.S, (az1 - az0) * m.S, 0.1 * m.S); ctx.fill(); ctx.restore();
          ctx.strokeStyle = 'rgba(243,214,130,.6)'; ctx.lineWidth = Math.max(1, 0.012 * m.S); ctx.setLineDash([0.1 * m.S, 0.07 * m.S]);
          roundRect(ctx, m.x(ax0 + 0.07), m.z(az0 + 0.07), (ax1 - ax0 - 0.14) * m.S, (az1 - az0 - 0.14) * m.S, 0.07 * m.S); ctx.stroke(); ctx.setLineDash([]);
          ctx.fillStyle = '#f3e6c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${0.21 * m.S}px ${SERIF}`;
          try { ctx.letterSpacing = Math.round(0.03 * m.S) + 'px'; } catch (e) { /* ok */ }
          ctx.fillText('FAMILIENALBUM', m.x((ax0 + ax1) / 2 - 0.9), m.z(az0 + 0.2));
          try { ctx.letterSpacing = '0px'; } catch (e) { /* ok */ }
          ctx.font = `italic ${0.16 * m.S}px ${SERIF}`; ctx.fillStyle = '#e9d7a8';
          ctx.fillText('der versteckten Säugetiere', m.x((ax0 + ax1) / 2 + 1.25), m.z(az0 + 0.21));
          leftCard(null, IDX)(ctx, m);
        },
      },
      R: {
        ground: { back: GR.forest.back, front: GR.forest.front }, margin: 0.3, corner: false, seed: 82,
        draw(ctx, m) { paintGround(m, 'forest'); },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const S = { lastV: -1, lastLabel: '', walk: 0, ash: 0, dwell: 0, robin: 'wait', robinT: 0, found: -1, chime: false, lastPrint: 0, labelSig: '' };
    ctx.spread.p8 = S;
    const EMPTY = [];
    const hit = (a, on) => { if (!a._hm) a._hm = a.hitMeshes; a.hitMeshes = on ? a._hm : EMPTY; };
    const scaleOf = (pop, s) => { pop.group.scale.setScalar(Math.max(0.0001, s)); show(pop, s > 0.012); };

    // ================================================================ linke Seite: Hintergrund
    {
      const x0 = -11.75, x1 = -0.2;
      const sky = ctx.flat(panelPart(x0, x1, 5.0, { fill: { top: '#f3c7a8', bottom: '#fdeabb' }, wave: 0.3, freq: 3.2, phase: 0.5, seed: 2, deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,225,150,.65)', cx: 0.72, cy: 0.5, r: 0.7 }); dither(c, bb, '#fff', { n: 120, alpha: 0.12, size: 0.04 }); } }), { x: -0.001, z: -4.05, lean: -0.05, name: 'skyL', delay: 0, ppu: 70, border: 0.04 });
      sky.cut.mesh.castShadow = false;
      ctx.flat(panelPart(x0, x1, 2.5, { fill: { top: '#9db58a', bottom: '#b4c49a' }, wave: 0.5, freq: 2.6, phase: 1.0, seed: 8, deco: (c, bb) => { strata(c, bb, ['#a9bf94', '#8fa87c', '#b9c9a2'], { n: 6, seed: 4, alpha: 0.3 }); dither(c, bb, '#e8f0c8', { n: 160, alpha: 0.2, size: 0.05 }); } }), { x: -0.001, z: -3.2, lean: -0.03, name: 'farL', delay: 0.05, ppu: 70 });
      ctx.flat(panelPart(x0, x1, 1.0, { fill: { top: '#d6c070', bottom: '#c9b25e' }, wave: 0.28, freq: 4.6, phase: 0.2, seed: 3, deco: (c, bb) => { dither(c, bb, '#8a7030', { n: 100, alpha: 0.22 }); } }), { x: -0.001, z: -2.25, name: 'nearL', delay: 0.1, ppu: 80 });
      const sun = ctx.prop('sun_disc', { x: -3.3, y: 3.1, z: -3.9, h: 1.8, delay: 0.1, cast: false });
      const glow = sunGlow({ size: 9, color: 0xffc680 }); glow.position.set(0, 0.9, -0.06); sun.add(glow);
      ctx.onUpdate((dt, t, sp) => { if (sp.active) glow.userData.update(t); });
      const cl = ctx.prop('cloud_a', { x: -8.2, y: 3.8, z: -3.85, len: 3.0, delay: 0.2, cast: false });
      ctx.onUpdate((dt, t) => { cl.group.position.x = -8.2 + Math.sin(t * 0.04) * 1.2; });
    }
    yield;

    // ================================================================ links: Farne wachsen zu Bäumen (WACHSE!)
    const slots = [
      { x: -10.2, z: -1.0, kind: 'self', tree: ['tree_fern', { h: 3.0 }], s: 0.0 },
      { x: -9.7, z: -2.7, tree: ['palm', { h: 4.5 }], fern: ['fern_ground', { len: 2.0 }], s: 0.04 },
      { x: -7.3, z: -1.6, tree: ['magnolia', { h: 3.6 }], fern: ['cycad', { h: 1.5 }], s: 0.14 },
      { x: -4.9, z: -2.8, tree: ['ginkgo', { h: 4.8 }], fern: ['fern_ground', { len: 1.8 }], s: 0.24 },
      { x: -2.5, z: -2.3, tree: ['magnolia', { h: 3.9 }], fern: ['tree_fern', { h: 1.7 }], s: 0.34 },
    ];
    const grows = [];
    slots.forEach((sl, i) => {
      const o = { ...sl, ph: i * 1.7 };
      o.tree = ctx.prop(sl.tree[0], { x: sl.x, z: sl.z - 0.05, ...sl.tree[1], delay: 0.12 + i * 0.04, variant: { seed: i + 3 } });
      if (sl.fern) o.fern = ctx.prop(sl.fern[0], { x: sl.x + 0.55, z: sl.z + 0.55, ...sl.fern[1], delay: 0.14 + i * 0.04, variant: { seed: i + 1 } });
      grows.push(o);
    });
    for (const [id, x, z, o] of [['fern_ground', -6.2, -0.35, { len: 1.7 }], ['horsetail', -8.6, -0.3, { h: 1.4 }], ['fern_ground', -1.2, -0.9, { len: 1.6 }]]) ctx.prop(id, { x, z, ...o, delay: 0.3, variant: { seed: 9 } });
    yield;

    // Tiere links
    const FOREST_X = { gastornis: -8.4, hyra: -3.5 };
    const purg = ctx.stand('purgatorius', { x: -4.75, z: 0.12, len: 1.05, facing: 1, delay: 0.5, card: null, hint: true });
    purg.onWake = (a) => {
      a.tw.add(0.7, (k) => { a.hop = Math.sin(k * Math.PI) * 0.4; poseAmt(a.fig, 'tail', Math.sin(k * Math.PI * 2) * 0.5 + 0.5); poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { a.hop = 0; poseAmt(a.fig, 'tail', 0); poseAmt(a.fig, 'jaw', 0); } });
      app.openCardById('purgatorius', a.popup.group.position.x, { hidden: false, text: 'Purgatorius lebte direkt nach dem Einschlag und kletterte wohl in Bäumen. Er ist winzig, aber wichtig: Er steht der Wurzel der Primaten sehr nahe, zu denen auch wir gehören.' });
    };
    purg.behaviors.push((dt, t) => { if (purg.tw.list.length === 0) poseAmt(purg.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 1.3)); });
    const plesi = ctx.stand('plesiadapis', { x: -2.2, z: 0.2, len: 1.6, facing: -1, delay: 0.52 }); plesi.setFacing(-1);
    const hyra = ctx.stand('hyracotherium', { x: FOREST_X.hyra, z: -0.9, len: 2.2, facing: 1, delay: 0.54 });
    const gast = ctx.stand('gastornis', { x: FOREST_X.gastornis, z: -0.95, len: 2.7, facing: 1, delay: 0.56 });
    const mammals = [
      { a: plesi, s: 0.28, e: 0.5 }, { a: hyra, s: 0.6, e: 0.82 }, { a: gast, s: 0.46, e: 0.7 },
    ];
    for (const a of [hyra, gast, plesi]) a.onWake = (w) => { w.tw.add(0.6, (k) => { w.hop = Math.sin(k * Math.PI) * 0.3; poseAmt(w.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { w.hop = 0; poseAmt(w.fig, 'jaw', 0); } }); };
    hyra.behaviors.push((dt, t) => { if (hyra.tw.list.length === 0) poseAmt(hyra.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 1.7)); });
    gast.behaviors.push((dt, t) => { if (gast.tw.list.length === 0) poseAmt(gast.fig, 'jaw', Math.max(0, Math.sin(t * 0.8 + 1) - 0.82) * 3); });
    yield;

    // WACHSE!-Regler
    const wachse = ctx.control('L', { id: 'wachse', label: 'WACHSE!', a: [-4.1, 3.5], b: [-1.8, 3.5], size: [2.1, 0.95], color: '#4f8a3f', value: 0, hold: true });
    wachse.onGrab = () => app.audio.sfx('grab');
    wachse.onTick = (v) => app.audio.sfx('grow', { v });
    wachse.onRelease = () => app.audio.sfx('snap');
    S.wachse = wachse;

    // Familienalbum (kleine Papierkarten) und Buch-schließen-Knopf
    const HID = Object.keys(ANIMALS_DE).filter((k) => ANIMALS_DE[k].hidden);
    const album = [];
    HID.forEach((id, i) => {
      const x = -4.67 + (HID.length > 1 ? (i * 3.45) / (HID.length - 1) : 0), z = 1.66;
      const mat = new THREE.MeshLambertMaterial({ map: null, transparent: true });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.95), mat);
      const tilt = (mulberry32(i * 7 + 3)() - 0.5) * 0.12;
      m.rotation.set(-Math.PI / 2, 0, tilt); m.position.set(x, 0.045, z); m.receiveShadow = true; m.castShadow = true;
      L.add(m);
      const card = { id, mesh: m, mat, found: null };
      L.addTap(m, () => { if (app.found.has(id)) app.openCardById(id, x); else app.ui.showToast('Dieses winzige Säugetier versteckt sich noch irgendwo im Buch. Such weiter!'); app.audio.sfx('tapp'); });
      album.push(card);
    });
    const albumTap = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 0.4), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    albumTap.rotation.x = -Math.PI / 2; albumTap.position.set(-2.95, 0.05, 1.0); L.add(albumTap);
    L.addTap(albumTap, () => { app.openCardById('album'); });
    const refreshAlbum = () => {
      for (const c of album) {
        const f = app.found.has(c.id); if (c.found === f) continue; c.found = f;
        if (c.mat.map) c.mat.map.dispose();
        c.mat.map = albumCardTex(c.id, f); c.mat.needsUpdate = true;
      }
      S.found = app.found.size;
    };
    refreshAlbum();
    // Knopf „Buch schließen“
    const BTN = { w: 2.5, h: 0.44, x: -3.0, z: 2.6 };
    const btn = slab(BTN.w, BTN.h, buttonTex(BTN.w, BTN.h)); btn.position.set(BTN.x, 0.02, BTN.z);
    const btnG = new THREE.Group(); btnG.add(btn); L.add(btnG);
    S.btn = { press: 0, closing: false };
    L.addTap(btn, () => {
      if (S.btn.closing) return; S.btn.press = 1; S.btn.closing = true;
      app.audio.sfx('musicbox'); app.audio.sfx('tapp');
      S.btn.t = 0.35;
    });
    yield;

    // ================================================================ rechts: Bühne (Himmel, Hügel, Boden)
    const skies = [], fars = [], nears = [];
    const SKYS = [
      { top: '#c6dcb0', bot: '#f8edc4', glow: 'rgba(255,240,180,.55)' },
      { top: '#9ccfe8', bot: '#fdeec6', glow: 'rgba(255,245,200,.6)' },
      { top: '#f1c286', bot: '#fde8bc', glow: 'rgba(255,225,150,.65)' },
      { top: '#cbbba7', bot: '#eee0c8', glow: 'rgba(240,228,205,.5)' },
    ];
    SKYS.forEach((s, i) => {
      const pop = ctx.flat(panelPart(0.2, 11.75, 5.0, { fill: { top: s.top, bottom: s.bot }, wave: 0.3, freq: 3.2, phase: 2.1 + i, seed: 5 + i, deco: (c, bb) => { softLight(c, bb, { color: s.glow, cx: 0.55, cy: 0.5, r: 0.7 }); dither(c, bb, '#fff', { n: 120, alpha: 0.12, size: 0.04 }); } }), { x: 0.001, z: -4.05 + i * 0.02, lean: -0.05, name: 'skyR' + i, delay: 0, ppu: 70, border: 0.04 });
      skies.push({ pop, f: fadeable(pop) });
    });
    yield;
    const FAR = [
      { h: 3.1, wave: 0.5, freq: 3.6, scallop: true, top: '#2c6a45', bot: '#4b8b55', hi: '#b6e59a', lo: '#173f28' },
      { h: 2.8, wave: 0.6, freq: 2.6, scallop: true, top: '#6f8f45', bot: '#8aa35a', hi: '#e6efa0', lo: '#40581f' },
      { h: 2.3, wave: 0.8, freq: 2.0, scallop: false, top: '#b3b45a', bot: '#c9c26a', hi: '#f0ebb0', lo: '#7a7a2a' },
      { h: 2.1, wave: 0.6, freq: 1.5, scallop: false, top: '#c7a05a', bot: '#d9b872', hi: '#f6e2a8', lo: '#8a6428' },
    ];
    const NEAR = [
      { h: 1.25, top: '#3f7d48', bot: '#5c9a52', lo: '#1f4a28' }, { h: 1.15, top: '#82a050', bot: '#9ab45c', lo: '#4a6a28' },
      { h: 1.0, top: '#b6b45c', bot: '#c9c46a', lo: '#7c7c2c' }, { h: 0.95, top: '#d0a85e', bot: '#dcbb72', lo: '#8a6428' },
    ];
    FAR.forEach((f, i) => {
      const pop = ctx.flat(panelPart(0.2, 11.75, f.h, { fill: { top: f.top, bottom: f.bot }, wave: f.wave, freq: f.freq, scallop: f.scallop, step: 0.18, phase: 1.2 + i, seed: 21 + i, deco: (c, bb) => { strata(c, bb, [f.hi, f.lo], { n: 5, seed: 4 + i, alpha: 0.18 }); dither(c, bb, f.hi, { n: 240, alpha: 0.2, size: 0.06 }); dither(c, bb, f.lo, { n: 160, alpha: 0.22, size: 0.07 }); } }), { x: 0.001, z: -3.2 + i * 0.03, lean: -0.03, name: 'farR' + i, delay: 0.05, ppu: 70 });
      fars.push({ pop, f: fadeable(pop, { shadow: false }), st: i });
    });
    NEAR.forEach((n, i) => {
      const pop = ctx.flat(panelPart(0.2, 11.75, n.h, { fill: { top: n.top, bottom: n.bot }, wave: 0.3, freq: 4.4 + i * 0.6, phase: 0.6 + i, seed: 31 + i, deco: (c, bb) => { dither(c, bb, n.lo, { n: 140, alpha: 0.24, size: 0.05 }); dither(c, bb, '#fff6c0', { n: 80, alpha: 0.14, size: 0.05 }); } }), { x: 0.001, z: -2.25 + i * 0.03, name: 'nearR' + i, delay: 0.1, ppu: 80 });
      nears.push({ pop, f: fadeable(pop, { shadow: false }), st: i });
    });
    yield;

    // Bodenschichten (weich überblendet)
    const overlays = ['light', 'grass', 'sav', 'ash'].map((k, i) => {
      const w = GROUND_RECT.x1 - GROUND_RECT.x0, h = GROUND_RECT.z1 - GROUND_RECT.z0;
      const m = flatMesh(w, h, makeOverlay(k), { y: 0.006 + i * 0.002, order: 1 + i });
      m.position.x = (GROUND_RECT.x0 + GROUND_RECT.x1) / 2; m.position.z = (GROUND_RECT.z0 + GROUND_RECT.z1) / 2; m.material.opacity = 0; m.visible = false;
      R.add(m); return m;
    });
    yield;

    // Bedienplatte: Zeitlücke-Band + Lineal
    const plate = flatMesh(PLATE.x1 - PLATE.x0, PLATE.z1 - PLATE.z0, paintPlate(), { y: 0.03, order: 6 });
    plate.position.x = (PLATE.x0 + PLATE.x1) / 2; plate.position.z = (PLATE.z0 + PLATE.z1) / 2; R.add(plate);
    const bandTap = new THREE.Mesh(new THREE.PlaneGeometry(BAND.x1 - BAND.x0, BAND.z1 - BAND.z0), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    bandTap.rotation.x = -Math.PI / 2; bandTap.position.set((BAND.x0 + BAND.x1) / 2, 0.06, (BAND.z0 + BAND.z1) / 2); R.add(bandTap);
    R.addTap(bandTap, () => { app.openCardById('zeitluecke', 5); app.audio.sfx('tapp'); });
    const pin = flatMesh(0.2, 0.68 * PIN_S, pinTex(), { y: 0.07, order: 8, basic: true });
    pin.position.z = PIN_Z - 0.227 * PIN_S; R.add(pin);
    yield;

    // Zeitsprung-Regler
    const zs = ctx.control('R', { id: 'zeit', label: 'ZEITSPRUNG', a: [SL.a, SL.z], b: [SL.b, SL.z], size: [SL.w, SL.h], color: '#c8693a', value: 0, hold: true });
    zs.onGrab = () => app.audio.sfx('grab');
    zs.onTick = (v) => app.audio.sfx('slide', { v });
    zs.onRelease = (v) => { if (v > 0.945) zs.setValue(1); app.audio.sfx('snap'); };
    zs.hintOn = true;
    S.zs = zs;
    const setLabel = (v) => {
      const ma = maOf(v), ep = epOf(v);
      const l1 = `vor ${fmtMa(ma)} Mio. J.`, l2 = ep.n;
      const sig = l1 + '|' + l2; if (sig === S.labelSig) return; S.labelSig = sig;
      drawHandle(zs.tex, l1, l2, ep.col === '#e6bf62' ? '#c99a3a' : ep.col);
    };
    setLabel(0);
    yield;

    // ================================================================ rechts: Pflanzen je Stufe
    const plants = [];
    const PL = [
      [0, 'tree_fern', 1.6, -0.9, { h: 3.0 }], [0, 'tree_fern', 10.0, -1.5, { h: 3.4, facing: -1 }], [0, 'palm', 3.4, -2.7, { h: 4.6 }], [0, 'palm', 8.7, -2.9, { h: 4.4, facing: -1 }],
      [0, 'magnolia', 5.9, -3.0, { h: 3.9 }], [0, 'fern_ground', 4.7, -0.1, { len: 1.8 }], [0, 'fern_ground', 10.0, 0.3, { len: 1.6 }],
      [1, 'ginkgo', 2.5, -2.4, { h: 4.4 }], [1, 'ginkgo', 9.5, -2.7, { h: 4.9 }], [1, 'magnolia', 5.0, -2.9, { h: 3.4 }], [1, 'bush', 3.9, -0.4, { len: 1.8 }], [1, 'bush', 10.3, -0.3, { len: 1.7 }],
      [2, 'acacia', 3.0, -2.8, { len: 4.6 }], [2, 'bush', 9.4, -1.5, { len: 1.8 }], [2, 'grass_tuft', 1.6, 0.25, { len: 1.1 }], [2, 'grass_tuft', 6.9, 0.5, { len: 1.1 }], [2, 'grass_tuft', 10.4, 0.3, { len: 1.1 }],
      [3, 'acacia', 2.7, -2.5, { len: 5.0 }], [3, 'acacia', 6.4, -3.1, { len: 4.2 }], [3, 'acacia', 10.0, -1.4, { len: 3.6, facing: -1 }], [3, 'grass_tuft', 1.2, 0.4, { len: 1.1 }], [3, 'grass_tuft', 5.2, 0.6, { len: 1.0 }], [3, 'grass_tuft', 8.3, 0.1, { len: 1.1 }],
    ];
    PL.forEach(([st, id, x, z, o], i) => {
      const pop = ctx.prop(id, { x, z, ...o, delay: 0.12 + (i % 6) * 0.03, variant: { seed: i + 2 } });
      plants.push({ pop, st, ph: i * 1.3, mats: st === 3 ? pop.fig.cuts.map((c) => c.material) : null, base: st === 3 ? pop.fig.cuts.map((c) => c.material.color.clone()) : null });
    });
    yield;

    // Tiere im Zeitsprung
    const paka = ctx.stand('pakicetus', { x: 8.6, z: -0.05, len: 2.0, facing: 1, delay: 0.5 });
    paka.onWake = (a) => { a.tw.add(0.6, (k) => { a.hop = Math.sin(k * Math.PI) * 0.15; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { a.hop = 0; poseAmt(a.fig, 'jaw', 0); } }); };
    const para = ctx.stand('paraceratherium', { x: 5.5, z: -1.7, len: 6.0, facing: 1, delay: 0.5 });
    para.onWake = (a) => { a.tw.add(1.4, (k) => { poseAmt(a.fig, 'neck', Math.sin(k * Math.PI)); a.hop = Math.sin(k * Math.PI) * 0.1; }, { done: () => { a.hop = 0; } }); };
    para.behaviors.push((dt, t) => { if (para.tw.list.length === 0) poseAmt(para.fig, 'neck', 0.15 * (0.5 + 0.5 * Math.sin(t * 0.5))); });
    const gomp = ctx.stand('gomphotherium', { x: 6.2, z: -1.2, len: 4.8, facing: 1, delay: 0.52 });
    gomp.onWake = (a) => { a.tw.add(1.1, (k) => { poseAmt(a.fig, 'trunk', Math.sin(k * Math.PI) * 0.9); a.hop = Math.sin(k * Math.PI) * 0.06; }, { done: () => { a.hop = 0; } }); };
    gomp.behaviors.push((dt, t) => { if (gomp.tw.list.length === 0) poseAmt(gomp.fig, 'trunk', 0.25 + 0.2 * Math.sin(t * 0.7)); });
    const aTree = ctx.flat(branchTreePart(), { x: 2.2, z: -0.75, name: 'apetree', delay: 0.5, ppu: 90 });
    const ape = ctx.stand('miocene_ape', { x: 3.35, z: -0.7, len: 1.25, facing: 1, delay: 0.55 });
    const APE_LIFT = 2.43; ape.fig.group.position.y = APE_LIFT; ape.proxy.position.y += APE_LIFT;
    ape.onWake = (a) => { a.tw.add(0.8, (k) => { poseAmt(a.fig, 'arm', Math.sin(k * Math.PI * 2) * 0.5 + 0.5); a.hop = Math.sin(k * Math.PI) * 0.08; }, { done: () => { a.hop = 0; poseAmt(a.fig, 'arm', 0); } }); };
    const fauna = [
      { a: paka, f: (v) => win(v, 0.12, 0.2, 0.34, 0.42), k: 0 },
      { a: para, f: (v) => win(v, 0.36, 0.45, 0.58, 0.68), k: 0 },
      { a: gomp, f: (v) => win(v, 0.6, 0.68, 0.78, 0.86), k: 0 },
      { a: ape, f: (v) => win(v, 0.6, 0.68, 0.78, 0.86), k: 0, tree: aTree },
    ];
    yield;

    // ================================================================ Laetoli: Vulkan, Aschewolke, Aschehügel, Regen, Spur
    const volcano = ctx.prop('volcano', { x: 9.3, z: -3.6, h: 4.3, delay: 0.5 });
    const ashCloud = ctx.prop('cloud_b', { x: 8.2, y: 3.2, z: -3.7, len: 4.6, delay: 0.5, cast: false, variant: { tone: 'dark' } });
    const mounds = [[1.9, -0.95, 3.6, 0.5, 1], [6.2, -1.85, 4.6, 0.66, 2], [9.9, -0.7, 2.8, 0.42, 3]].map(([x, z, w, h, sd], i) => ctx.flat(duneFlatPart(w, h, sd), { x, z, name: 'dune' + i, delay: 0.5 + i * 0.02, ppu: 90 }));
    yield;
    // Regen: feine helle Striche
    const RN = 220, RH = 4.8; // Regenhöhe unter der Kulissenoberkante
    const rainPos = new Float32Array(RN * 6), rainSeed = new Float32Array(RN * 3);
    { const r = mulberry32(77); for (let i = 0; i < RN; i++) { rainSeed[i * 3] = 0.8 + r() * 10.2; rainSeed[i * 3 + 1] = r() * RH; rainSeed[i * 3 + 2] = -3.6 + r() * 6.2; } }
    const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.LineBasicMaterial({ color: 0xfff8ec, transparent: true, opacity: 0, depthWrite: false });
    const rain = new THREE.LineSegments(rainGeo, rainMat); rain.frustumCulled = false; rain.renderOrder = 9; rain.visible = false;
    R.add(rain);
    // Fußabdrücke
    const fpTex = footprintTex();
    const fpMat = new THREE.MeshLambertMaterial({ map: fpTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
    const fpGeo = new THREE.PlaneGeometry(1, 2);
    const WALK = [
      { id: 'afarensis_m', h: 2.0, z: -0.35, x0: 3.3, step: 0.95, foot: 0.3, delay: 0.55 },
      { id: 'afarensis_f', h: 1.55, z: 0.12, x0: 1.9, step: 0.78, foot: 0.26, delay: 0.58 },
      { id: 'afarensis_child', h: 1.2, z: 0.6, x0: 2.7, step: 0.6, foot: 0.2, delay: 0.61 },
    ];
    const TRAIL = 6.0;
    const walkers = WALK.map((w, i) => {
      const a = ctx.stand(w.id, { x: w.x0, z: w.z, h: w.h, facing: 1, delay: w.delay, card: 'lucy' });
      a.amp = 0; a.lastX = w.x0; a.prints = []; a.cfg = w;
      const n = Math.floor((TRAIL - 0.3) / w.step);
      for (let j = 0; j < n; j++) {
        const m = new THREE.Mesh(fpGeo, fpMat);
        const side = j % 2 ? 1 : -1;
        m.rotation.set(-Math.PI / 2, -Math.PI / 2 + (Math.sin(j * 2.3 + i) * 0.08), 0, 'YXZ');
        const sc = w.foot; m.scale.set(side * sc * 0.5, sc, 1); m.position.set(w.x0 + 0.45 + j * w.step, 0.04 + i * 0.0006, w.z + side * 0.1); m.visible = false; m.renderOrder = 7;
        m.userData.k = 0; m.userData.sc = sc; m.userData.side = side;
        R.add(m); a.prints.push(m);
      }
      return a;
    });
    S.walkers = walkers;
    const trailTap = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.5), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    trailTap.rotation.x = -Math.PI / 2; trailTap.position.set(5, 0.05, 0.1); R.add(trailTap);
    R.addTap(trailTap, () => { app.openCardById('laetoli', 6); app.audio.sfx('tapp'); }, () => S.trailOn);
    // LAUF!-Regler (senkrecht, am rechten Rand)
    const lauf = ctx.control('R', { id: 'lauf', label: 'LAUF!', a: [10.9, 3.15], b: [10.9, 1.55], size: [1.75, 0.95], color: '#8a5a3a', value: 0, hold: true, arrow: 'none' });
    lauf.onGrab = () => app.audio.sfx('grab'); lauf.onRelease = () => app.audio.sfx('snap');
    S.lauf = lauf;
    const laufWrap = new THREE.Group(); laufWrap.position.set(10.9, 0, 2.35); R.group.remove(lauf.group); laufWrap.add(lauf.group); lauf.group.position.set(-10.9, 0, -2.35); R.add(laufWrap);
    lauf._hm = lauf.hitMeshes; lauf.hitMeshes = EMPTY;
    laufWrap.visible = false;
    yield;

    // ================================================================ Mini-Zeitstrahl „Wer war früh dabei?“ (hängende Kacheln an einem Wegweiser)
    const BAN_X = 4.4, BAN_Z = -2.1;
    const bannerPop = new Popup(R, { x: BAN_X, z: BAN_Z, delay: 0.55, name: 'banner' }); R.addPopup(bannerPop);
    const banner = new THREE.Group(); bannerPop.add(banner);
    const mkPlane = (w, h, map, o = {}) => {
      const mat = map ? new THREE.MeshLambertMaterial({ map, side: THREE.DoubleSide, transparent: !!o.transparent, opacity: o.opacity ?? 1 }) : new THREE.MeshBasicMaterial({ color: o.color || 0x5a4026, side: THREE.DoubleSide });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.castShadow = o.cast !== false; return m;
    };
    const wood = woodTex();
    for (const sx of [-3.75, 3.75]) { const p = mkPlane(0.16, 4.75, wood); p.position.set(sx, 2.375, 0); banner.add(p); }
    const rail = mkPlane(7.7, 0.14, wood); rail.position.set(0, 4.55, 0.01); banner.add(rail);
    const head = mkPlane(5.6, 0.84, bannerHeadTex()); head.position.set(0, 5.0, 0.02); banner.add(head);
    head.userData.tap = () => { app.openCardById('hominiden', BAN_X); app.audio.sfx('tapp'); };
    const tiles = TILES.map((t, i) => {
      const g = new THREE.Group(); g.position.set(-2.7 + i * 1.35, 4.25, 0.03);
      const m = mkPlane(1.28, 1.4, tileTex(t), { transparent: !!t.ghost, opacity: t.ghost ? 0.62 : 1 }); m.position.y = -0.72; g.add(m);
      const st = mkPlane(0.025, 0.34, null, { cast: false }); st.position.y = 0.17; g.add(st);
      m.userData.tap = () => { app.openCardById(t.id, BAN_X + g.position.x); app.audio.sfx('tapp'); };
      banner.add(g); return { g, m, i };
    });
    const banPick = [head, ...tiles.map((t) => t.m)];
    bannerPop.pickMeshes = EMPTY;
    S.ban = { pop: bannerPop, tiles }; S.bandTap = bandTap; S.trailTap = trailTap; S.album = album; S.albumTap = albumTap; S.btnMesh = btn; S.fauna = fauna; S.mammals = mammals; S.purg = purg; S.head = head;
    yield;

    // ================================================================ Epilog: Rotkehlchen
    const PERCH = { x: 11.1, z: -0.15 };
    const robin = ctx.stand('robin', { x: PERCH.x, z: PERCH.z, len: 0.8, facing: -1, delay: 0.6, card: 'voegel', hint: false });
    robin.setFacing(-1);
    const fly = ctx.prop('bird_fly', { x: 16, z: 1.0, len: 0.8, facing: -1, delay: 0.6, cast: false });
    S.robinObj = robin; S.flyObj = fly;
    yield;

    // ================================================================ Zustand zurücksetzen
    S.reset = () => {
      S.dwell = 0; S.robin = 'wait'; S.robinAt = 7; S.robinT = 0; S.chime = false; S.tweetT = 4;
      S.btn.closing = false; S.btn.press = 0; S.btn.t = 0; S.lastV = -1; S.found = -1; S.labelSig = '';
    };
    S.reset();

    // ================================================================ Update (nur solange die Doppelseite aktiv ist)
    const W4 = [0, 0, 0, 0], ov = [0, 0, 0, 0];
    const alpha = (w) => clamp(w * 1.6);
    let lastG = 0, gSpeed = 0, rainPh = 0;
    ctx.onUpdate((dt, t, spread) => {
      if (!spread.active) return;
      const au = app.audio;
      S.dwell += dt;

      // ---------------- links: WACHSE!
      const g = wachse.sp.x;
      gSpeed += (Math.abs(g - lastG) / Math.max(dt, 1e-3) - gSpeed) * Math.min(1, dt * 6); lastG = g;
      const sway = clamp(gSpeed * 2.2);
      for (const o of grows) {
        const gk = smooth(clamp((g - o.s) / 0.55));
        scaleOf(o.tree, o.kind === 'self' ? lerp(0.3, 1, gk) : gk);
        o.tree.pivot.rotation.z = Math.sin(t * 2.6 + o.ph) * 0.05 * sway * (o.kind === 'self' ? 0.5 : Math.min(1, gk * 4)) + Math.sin(t * 0.7 + o.ph) * 0.01;
        if (o.fern) scaleOf(o.fern, lerp(1, 0.5, gk));
      }
      for (const mm of mammals) { const k = smooth(clamp((g - mm.s) / 0.16)); scaleOf(mm.a.popup, k < 1 ? easeOutBack(k) : 1); hit(mm.a, k > 0.7); }
      if (S.found !== app.found.size) refreshAlbum();
      // Knopf
      const bs = S.btn;
      if (bs.press > 0) { bs.press = Math.max(0, bs.press - dt * 2.6); }
      btnG.position.y = -0.05 * Math.sin(Math.min(1, bs.press) * Math.PI * 0.5);
      if (bs.closing) { bs.t -= dt; if (bs.t <= 0) { bs.closing = false; app.goTo(-1); } }

      // ---------------- rechts: Zeitsprung
      const v = zs.sp.x;
      if (Math.abs(v - S.lastV) > 1e-4) { S.lastV = v; setLabel(v); au.ctl('timeLapse', v); }
      stageW(v, W4);
      const ashK = smooth(clamp((v - 0.9) / 0.09));
      const lk = smooth(clamp((v - 0.9) / 0.07));
      // Himmel (gestapelt)
      const sa = [1, W4[2] + W4[3], W4[3], ashK];
      for (let i = 0; i < 4; i++) { const a = clamp(sa[i]); skies[i].f.set(i === 0 ? 1 : a, 0); show(skies[i].pop, (i === 0 || a > 0.003) && !(i < 3 && sa[i + 1] > 0.999)); }
      for (const L_ of fars) { const a = alpha(W4[L_.st]); L_.f.set(a, L_.st === 3 ? ashK : 0); L_.pop.group.position.y = -(1 - a) * 0.9; show(L_.pop, a > 0.004); }
      for (const L_ of nears) { const a = alpha(W4[L_.st]); L_.f.set(a, L_.st === 3 ? ashK : 0); L_.pop.group.position.y = -(1 - a) * 0.5; show(L_.pop, a > 0.004); }
      ov[0] = 1 - W4[0]; ov[1] = W4[2] + W4[3]; ov[2] = W4[3]; ov[3] = ashK;
      for (let i = 0; i < 4; i++) { const m = overlays[i]; m.material.opacity = ov[i]; m.visible = ov[i] > 0.003 && !(i < 3 && ov[i + 1] > 0.999); }
      // Pflanzen
      for (const p of plants) {
        const s = smooth(clamp(W4[p.st] * 1.35));
        scaleOf(p.pop, s); p.pop.pivot.rotation.z = Math.sin(t * 0.5 + p.ph) * 0.012;
        if (p.mats) for (let i = 0; i < p.mats.length; i++) p.mats[i].color.setRGB(p.base[i].r * lerp(1, 0.8, ashK), p.base[i].g * lerp(1, 0.76, ashK), p.base[i].b * lerp(1, 0.74, ashK));
      }
      // Tiere der Zeit
      for (const f of fauna) { const k = f.f(v); scaleOf(f.a.popup, k); hit(f.a, k > 0.6); if (f.tree) scaleOf(f.tree, k); }
      // Licht und Staub in der Luft
      blendMood(BASE_MOOD, W4, ashK);
      MOTES.alpha = lerp(MOTES_COPY.alpha, 0.28, ashK);
      // Zeitlücke-Marker
      pin.position.x = pinX(maOf(v));

      // ---------------- Laetoli
      volcano.group.position.y = -(1 - lk) * 4.8; show(volcano, lk > 0.01);
      poseAmt(volcano.fig, 'smoke', 0.5 + 0.5 * Math.sin(t * 0.5));
      ashCloud.group.position.x = 8.2 + Math.sin(t * 0.07) * 0.8; scaleOf(ashCloud, lk);
      for (const m of mounds) scaleOf(m, lk);
      const wk = smooth(clamp((v - 0.92) / 0.05));
      const w = lauf.sp.x;
      let minX = 99, anyPrint = false, newPrint = false;
      for (const a of walkers) {
        const c = a.cfg, xw = c.x0 + TRAIL * w;
        scaleOf(a.popup, wk); hit(a, wk > 0.7);
        a.popup.group.position.x = xw;
        const dx = xw - a.lastX; a.lastX = xw;
        const moving = Math.abs(dx) > 0.0006 && wk > 0.5;
        if (Math.abs(dx) > 0.0004) a.setFacing(dx >= 0 ? 1 : -1);
        a.amp += ((moving ? 1 : 0) - a.amp) * (1 - Math.exp(-dt * (moving ? 12 : 6)));
        const s = Math.sin(xw * Math.PI / c.step) * a.amp, rg = a.fig.meta.ranges;
        a.fig.rotatePart('legA', rg.legA[1] * s); a.fig.rotatePart('legB', rg.legB[1] * s); a.fig.rotatePart('armA', rg.armA[1] * s); a.fig.rotatePart('armB', rg.armB[1] * s);
        if (a.amp > 0.05) a.hop = Math.abs(Math.sin(xw * Math.PI / c.step)) * 0.03 * a.amp;
        minX = Math.min(minX, xw);
        for (const m of a.prints) {
          const k = lk > 0.3 ? smooth(clamp((xw - m.position.x - 0.25) / 0.3)) : 0;
          const vis = k > 0.01;
          if (vis !== m.visible) { m.visible = vis; if (vis) { newPrint = true; if (app.fx && app.fx.dust) { const p = ctx.world(m.position.x, 0.06, m.position.z); const n = app.calm ? 1 : 3; for (let q = 0; q < n; q++) app.fx.dust.emit({ x: p.x, y: p.y, z: p.z + 0.05, vx: (Math.random() - 0.5) * 0.3, vy: 0.2 + Math.random() * 0.25, vz: (Math.random() - 0.3) * 0.2, life: 0.8, size: 0.16, alpha: 0.35, color: [0.82, 0.77, 0.68], drag: 2, grow: 1.6 }); } } }
          if (vis) { const sc = m.userData.sc * Math.sqrt(k); m.scale.set(m.userData.side * sc * 0.5, sc, 1); anyPrint = true; }
        }
      }
      if (newPrint && t - S.lastPrint > 0.12) { S.lastPrint = t; au.sfx('tapp'); }
      S.trailOn = anyPrint && lk > 0.5;
      trailTap.scale.x = Math.max(0.01, minX - 2.0); trailTap.position.x = 2.0 + (minX - 2.0) / 2; trailTap.scale.y = 1.6; trailTap.position.z = 0.15;
      laufWrap.visible = lk > 0.02; laufWrap.scale.setScalar(Math.max(0.001, lk)); lauf.hitMeshes = lk > 0.7 ? lauf._hm : EMPTY;
      // Regen
      const stand = smooth(clamp((skies[0].pop.eff - 0.35) / 0.65)); // Regen steht nur, solange die Seite aufgeklappt ist (kein Herausragen beim Blättern)
      const rk = lk * stand * (app.calm ? 0.28 : 0.4);
      rainMat.opacity = rk; rain.visible = lk > 0.02 && stand > 0.02; au.ctl('rain', lk * 0.9);
      if (rain.visible) {
        const n = Math.min(RN, Math.round(RN * clamp(app.stage.tier.fx * 1.6) * (app.calm ? 0.5 : 1)));
        rainGeo.setDrawRange(0, n * 2);
        const fall = 5.0;
        for (let i = 0; i < n; i++) {
          const sx = rainSeed[i * 3], sy = rainSeed[i * 3 + 1], sz = rainSeed[i * 3 + 2];
          const y = (RH - ((t * fall + sy) % RH)) * stand, px = sx + (RH - y / Math.max(stand, 0.05)) * 0.07;
          rainPos[i * 6] = px; rainPos[i * 6 + 1] = y; rainPos[i * 6 + 2] = sz;
          rainPos[i * 6 + 3] = px + 0.03; rainPos[i * 6 + 4] = Math.max(0.01, y - 0.42); rainPos[i * 6 + 5] = sz;
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      if (v > 0.985 && !S.chime) { S.chime = true; au.sfx('chime'); }
      // Kacheln
      const kb = smooth(clamp((v - 0.9) / 0.06));
      bannerPop.group.scale.setScalar(Math.max(0.0001, kb)); show(bannerPop, kb > 0.01); bannerPop.pickMeshes = kb > 0.7 ? banPick : EMPTY;
      for (const ti of tiles) {
        const ki = clamp((kb * 1.5 - ti.i * 0.14) / 0.6);
        ti.g.scale.set(1, Math.max(0.05, easeOutBack(ki)), 1);
        ti.g.rotation.z = Math.sin(t * 1.4 + ti.i * 1.3) * 0.035 + Math.sin(t * 8 + ti.i) * 0.1 * (1 - ki) * (ki > 0 ? 1 : 0);
      }

      // ---------------- Epilog: Rotkehlchen
      if (S.robin === 'wait') {
        if (v > 0.97 && S.robinAt > S.dwell + 2.5) S.robinAt = S.dwell + 2.5;
        if (S.dwell > S.robinAt) { S.robin = 'fly'; S.robinT = 0; au.sfx('tweet'); }
      }
      let flyOn = false;
      if (S.robin === 'fly') {
        S.robinT += dt; const u = clamp(S.robinT / 3.4), e = u * u * (3 - 2 * u) * 0.6 + u * 0.4, q = 1 - e;
        const x = q * q * q * 16 + 3 * q * q * e * 13.2 + 3 * q * e * e * 12.4 + e * e * e * (PERCH.x + 0.02);
        const y = q * q * q * 6.4 + 3 * q * q * e * 6.0 + 3 * q * e * e * 2.0 + e * e * e * 0.1 + Math.sin(S.robinT * 3.1) * 0.12 * (1 - u);
        fly.group.position.set(x, y, lerp(1.0, PERCH.z, e));
        fly.pivot.rotation.z = lerp(0.45, -0.35, smooth(u));
        const sw = fly.fig.meta.swing, ph = S.robinT * (20 - 9 * u);
        const fl = 0.5 + 0.5 * Math.sin(ph);
        fly.fig.rotatePart('wing', lerp(sw.wing[0], sw.wing[1], fl)); fly.fig.rotatePart('wing2', lerp(sw.wing2[0], sw.wing2[1], fl));
        flyOn = true;
        if (u >= 1) { S.robin = 'sit'; S.robinT = 0; au.sfx('tweet'); }
      }
      scaleOf(fly, flyOn ? 1 : 0);
      if (S.robin === 'sit') {
        S.robinT += dt; const k = clamp(S.robinT / 0.4);
        scaleOf(robin.popup, easeOutBack(k)); hit(robin, k > 0.8);
        const cyc = S.robinT % 5.4, pk = cyc < 1.0 ? Math.sin(cyc / 1.0 * Math.PI * 2) : 0;
        robin.fig.root.rotation.z = -pk * 0.28 * (v > 0.9 ? 1 : 0.4);
        poseAmt(robin.fig, 'wing', cyc > 2.6 && cyc < 3.0 ? Math.sin((cyc - 2.6) / 0.4 * Math.PI) : 0);
        S.tweetT -= dt; if (S.tweetT <= 0) { S.tweetT = 9 + Math.random() * 6; au.sfx('tweet'); poseAmt(robin.fig, 'jaw', 1); }
        else poseAmt(robin.fig, 'jaw', S.tweetT > 8.7 ? 1 : 0);
      } else { scaleOf(robin.popup, 0); hit(robin, false); }
    });
    // Anfangszustand der Schaltflächen
    laufWrap.visible = false;
  },

  onActivate(ctx) {
    const S = ctx.spread.p8; if (S && S.reset) S.reset();
    const au = ctx.app.audio; if (S && S.zs) au.ctl('timeLapse', S.zs.sp.x);
  },
  onDeactivate(ctx) {
    const app = ctx.app, S = ctx.spread.p8;
    // Licht, Luft und Ton auf Seitenwerte zurück
    for (const k of ['keyC', 'skyC', 'gndC', 'pos']) for (let i = 0; i < 3; i++) BASE_MOOD[k][i] = BASE_COPY[k][i];
    BASE_MOOD.keyI = BASE_COPY.keyI; BASE_MOOD.hemiI = BASE_COPY.hemiI; BASE_MOOD.rimI = BASE_COPY.rimI;
    MOTES.alpha = MOTES_COPY.alpha;
    app.audio.ctl('timeLapse', 0); app.audio.ctl('rain', 0);
    if (S && S.reset) S.reset();
  },
};
