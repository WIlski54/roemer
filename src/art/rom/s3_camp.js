// Station 3: Marschlager im Abendrot – Zelt, Feldzeichen, Wachturm, Pfähle, Lagerfeuer, Marschgepäck, Bäume, Sonne, Wolken
// und die Querschnitt-Teile (Erdblock, Graben, Wall). Alle Maße in Metern, Basis bei y = 0, Mitte bei x = 0.
// Licht kommt vom Abendhimmel rechts: rechte Flächen warm (Rostrot/Gold), linke Flächen kühler (Violett).
import { blob, poly, limb } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { mulberry32 } from '../../engine/util.js';
import { rect, spec, COL, woodDeco, nail, rope, mixHex } from './s3_kit.js';

// Abendlicht: warmer Schein von rechts, kühler Schatten links, dunkler zum Boden hin
export function warm(c, bb, { r = 0.26, l = 0.2, d = 0.16 } = {}) {
  const { ctx, tf } = c;
  const [x0, y0] = tf(bb.x0, bb.y1), [x1] = tf(bb.x1, bb.y1);
  const g = ctx.createLinearGradient(x0, y0, x1, y0);
  g.addColorStop(0, `rgba(80,40,90,${l})`); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(255,150,70,${r})`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
  volume(c, bb, { dark: `rgba(50,20,20,${d})`, light: 'rgba(255,230,190,.12)' });
}
const rim = (c, pts, w = 0.02) => line(c, pts, 'rgba(255,200,120,.55)', w);

// ------------------------------------------------------------------------------------------------ Zelt (Giebelansicht, Leder)
export function zelt(o = {}) {
  const v = ((o.variant ?? 0) % 3 + 3) % 3;
  const W = 1.0, H = 1.3;                                       // halbe Breite, Höhe
  const slopeL = poly([[-W - 0.04, 0.0], [-0.1, H - 0.02], [0.0, H + 0.02], [0.1, H - 0.02], [W + 0.04, 0.0]], 0);
  const tone = [{ top: '#f1dfb4', bottom: '#cfa86c' }, { top: '#ecd6a4', bottom: '#c49a5f' }, { top: '#f3e3bd', bottom: '#d3ad72' }][v];
  const door = poly([[-0.33, 0.0], [-0.02, 0.92], [0.02, 0.92], [0.33, 0.0]], 0);
  const flapL = poly([[-0.42, 0.0], [-0.03, 0.97], [0.0, 0.97], [-0.16, 0.0]], 0);
  const flapR = poly([[0.42, 0.0], [0.03, 0.97], [0.0, 0.97], [0.16, 0.0]], 0);
  const ropes = [rope([[-0.7, 0.5], [-1.0, 0.25], [-1.2, 0.03]], 0.026), rope([[1.5, 0.35], [1.38, 0.18], [1.3, 0.03]], 0.026)];
  const pegs = [poly([[-1.25, 0.0], [-1.15, 0.0], [-1.2, 0.13]]), poly([[1.25, 0.0], [1.35, 0.0], [1.3, 0.13]])];
  const back = poly([[0.05, H + 0.0], [0.64, H - 0.1], [W + 0.66, 0.0], [W + 0.04, 0.0]], 0);
  const layers = [
    { shapes: [...ropes, ...pegs], fill: '#8a6a40', stroke: 'rgba(50,30,10,.6)' },
    { shapes: [back], fill: { top: '#f7e7c0', bottom: '#dcb67c' }, stroke: 'rgba(70,40,15,.7)',
      deco(c, bb) { for (const k of [0.25, 0.5, 0.75]) line(c, [[0.05 + k * 0.6, H - 0.1 * k], [W + 0.04 + k * 0.6, 0.0]], 'rgba(90,55,25,.45)', 0.012); warm(c, bb, { r: 0.4, l: 0.05, d: 0.1 }); } },
    { shapes: [slopeL, blob(0, H + 0.03, 0.065, 0.065)], fill: tone, stroke: 'rgba(70,40,15,.7)',
      deco(c, bb) {
        for (const k of [-0.82, -0.58, -0.34, 0.34, 0.58, 0.82]) line(c, [[k * 0.1, H - 0.02], [k * 1.02, 0.02]], 'rgba(90,55,25,.5)', 0.012);   // Lederbahnen
        for (const k of [-0.82, -0.58, -0.34, 0.34, 0.58, 0.82]) for (let t = 0.14; t < 0.95; t += 0.1) dot(c, k * (0.1 + 0.92 * t), (H - 0.02) * (1 - t), 0.006, 'rgba(90,55,25,.5)');
        line(c, [[-W, 0.07], [W, 0.07]], 'rgba(90,55,25,.45)', 0.012);
        if (v === 1) line(c, [[-W + 0.02, 0.17], [W - 0.02, 0.17]], COL.rust, 0.05);                       // Saumstreifen
        warm(c, bb, { r: 0.32, l: 0.26, d: 0.12 });
        rim(c, [[0.1, H - 0.03], [W + 0.0, 0.03]], 0.018);
      } },
    { shapes: [door], fill: { top: '#4a2c1b', bottom: '#26140b' }, stroke: 'rgba(30,15,5,.8)',
      deco(c) { line(c, [[0.0, 0.88], [0.0, 0.0]], 'rgba(255,170,90,.07)', 0.3); } },
    { shapes: [flapL], fill: { top: '#e9cf98', bottom: '#c39a5c' }, stroke: 'rgba(70,40,15,.7)', deco(c) { line(c, [[-0.1, 0.8], [-0.3, 0.05]], 'rgba(90,55,25,.4)', 0.01); } },
    { shapes: [flapR], fill: { top: '#f4e2b8', bottom: '#d7b274' }, stroke: 'rgba(70,40,15,.7)', deco(c) { line(c, [[0.1, 0.8], [0.3, 0.05]], 'rgba(90,55,25,.4)', 0.01); warm(c, { x0: 0, x1: 0.5, y0: 0, y1: 1, w: 0.5, h: 1 }, { r: 0.3, l: 0 }); } },
  ];
  if (v === 2) { // Wimpel am Zenturionszelt
    layers.push({ shapes: [limb([[0, H + 0.02, 0.04], [0, H + 0.32, 0.03]], { per: 3 }), poly([[0.0, H + 0.3], [0.34, H + 0.22], [0.0, H + 0.14]])], fill: COL.scarlet, stroke: 'rgba(60,15,10,.7)' });
  }
  return spec('leg_zelt', 'Zelt', { body: { z: 1, layers } }, { top: [0, H] }, { lengthM: 2.7, heightM: H });
}

// ------------------------------------------------------------------------------------------------ Feldzeichen
export function signum() {
  const pole = limb([[0, 0.0, 0.07], [0, 3.35, 0.07]], { per: 4 });
  const spear = poly([[0, 3.95], [0.11, 3.5], [0.05, 3.38], [-0.05, 3.38], [-0.11, 3.5]], 1);
  const discs = [[0.0, 2.02, 0.23], [0.0, 2.5, 0.19], [0.0, 2.9, 0.15]];
  const bar = limb([[-0.42, 3.12, 0.05], [0.42, 3.12, 0.05]], { per: 3 });
  const lunula = poly([[-0.2, 3.36], [-0.12, 3.24], [0.12, 3.24], [0.2, 3.36], [0.1, 3.3], [-0.1, 3.3]], 1);
  const tass = [-0.4, 0.4].map((x) => limb([[x, 3.12, 0.03], [x, 2.82, 0.07]], { per: 3 }));
  const ferrule = poly([[-0.05, 0.28], [0.05, 0.28], [0.0, -0.02]]);
  return spec('leg_signum', 'Feldzeichen (Signum)', { body: { z: 1, layers: [
    { shapes: [pole], fill: { top: '#c9985a', bottom: '#8a5a34' }, stroke: 'rgba(50,25,10,.7)', deco: woodDeco({ n: 2, vertical: true, w: 0.01 }) },
    { shapes: [...tass], fill: COL.scarlet, stroke: 'rgba(60,15,10,.7)' },
    { shapes: [bar, ferrule, spear, lunula, ...discs.map(([x, y, r]) => blob(x, y, r, r * 0.9))], fill: { top: COL.bronzeL, bottom: COL.bronzeD }, stroke: 'rgba(90,55,10,.8)',
      deco(c) { for (const [x, y, r] of discs) { dot(c, x, y, r * 0.55, 'rgba(255,245,200,.5)'); dot(c, x, y, r * 0.22, COL.bronzeD); line(c, [[x - r * 0.7, y + r * 0.2], [x - r * 0.2, y + r * 0.7]], 'rgba(255,255,255,.6)', 0.015); } warm(c, { x0: -0.5, x1: 0.5, y0: 0, y1: 4, w: 1, h: 4 }, { r: 0.3, l: 0.1 }); } },
  ] } }, { top: [0, 3.95] }, { heightM: 3.95 });
}
export function vexillum() {
  const pole = limb([[0, 0.0, 0.07], [0, 3.1, 0.07]], { per: 4 });
  const bar = limb([[-0.5, 3.02, 0.06], [0.5, 3.02, 0.06]], { per: 3 });
  const cloth = poly([[-0.44, 3.0], [0.44, 3.0], [0.46, 1.95], [0.3, 2.03], [0.15, 1.93], [0, 2.03], [-0.15, 1.93], [-0.3, 2.03], [-0.46, 1.95]], 0);
  const knob = blob(0, 3.18, 0.07, 0.07);
  const ferrule = poly([[-0.05, 0.28], [0.05, 0.28], [0.0, -0.02]]);
  return spec('leg_vexillum', 'Fahne (Vexillum)', { body: { z: 1, layers: [
    { shapes: [pole], fill: { top: '#c9985a', bottom: '#8a5a34' }, stroke: 'rgba(50,25,10,.7)', deco: woodDeco({ n: 2, vertical: true, w: 0.01 }) },
    { shapes: [cloth], fill: { top: '#c63d2e', bottom: '#8e2418' }, stroke: 'rgba(60,15,10,.7)',
      deco(c, bb) { line(c, [[-0.4, 2.1], [0.4, 2.1]], COL.bronzeL, 0.03); line(c, [[-0.4, 3.0], [0.4, 3.0]], COL.bronzeL, 0.02); for (let a = 0; a < 14; a++) { const t = a / 14 * Math.PI * 2; dot(c, 0.24 * Math.cos(t), 2.56 + 0.24 * Math.sin(t), 0.045, COL.bronzeL); } dot(c, 0, 2.56, 0.13, COL.bronzeL); dot(c, 0, 2.56, 0.085, '#c63d2e'); dot(c, 0, 2.56, 0.04, COL.bronzeL); warm(c, bb, { r: 0.4, l: 0.16 }); } },
    { shapes: [bar, knob, ferrule], fill: { top: COL.bronzeL, bottom: COL.bronzeD }, stroke: 'rgba(90,55,10,.8)' },
  ] } }, { top: [0, 3.2] }, { heightM: 3.2 });
}

// ------------------------------------------------------------------------------------------------ Pfahlreihe (Palisade)
export function palisade(o = {}) {
  const n = o.n || 6, sw = 0.235, hs = [1.12, 1.2, 1.06, 1.17, 1.1, 1.22];
  const x0 = -(n * sw) / 2, shapes = [];
  for (let i = 0; i < n; i++) { const x = x0 + i * sw + sw / 2, h = hs[i % hs.length]; shapes.push(poly([[x - sw / 2 + 0.004, 0], [x + sw / 2 - 0.004, 0], [x + sw / 2 - 0.004, h - 0.26], [x, h], [x - sw / 2 + 0.004, h - 0.26]])); }
  return spec('leg_palisade', 'Pfahlreihe', { body: { z: 1, layers: [{
    shapes, fill: { top: '#d1a15f', bottom: '#8f6335' }, stroke: 'rgba(55,30,10,.75)',
    deco(c, bb) {
      for (let i = 0; i < n; i++) {
        const x = x0 + i * sw + sw / 2;
        line(c, [[x, 0], [x, 1.25]], i % 2 ? 'rgba(80,45,15,.16)' : 'rgba(255,225,170,.14)', sw * 0.85);
        line(c, [[x - 0.045, 0.1], [x - 0.04, 1.0]], 'rgba(70,40,15,.34)', 0.009);
        line(c, [[x + 0.05, 0.2], [x + 0.055, 0.9]], 'rgba(70,40,15,.28)', 0.008);
        line(c, [[x - sw / 2, 0], [x - sw / 2, 1.25]], 'rgba(50,25,8,.5)', 0.012);
        dot(c, x - 0.02, hs[i % hs.length] - 0.3, 0.012, 'rgba(60,30,10,.45)');
      }
      for (const y of [0.38, 0.72]) { line(c, [[x0, y], [-x0, y]], '#6e5030', 0.05); line(c, [[x0, y + 0.02], [-x0, y + 0.02]], 'rgba(255,225,170,.28)', 0.012); for (let k = 0; k < n * 2; k++) line(c, [[x0 + 0.06 + k * sw / 2, y - 0.02], [x0 + 0.1 + k * sw / 2, y + 0.02]], 'rgba(40,25,10,.5)', 0.008); }
      warm(c, bb, { r: 0.3, l: 0.2 });
    },
  }] } }, {}, { heightM: 1.2 });
}

// ------------------------------------------------------------------------------------------------ Wachturm (Holz, 4,85 hoch, Plattform auf 2,5)
export function turm() {
  const PY = 2.5, RY = 3.1, UY = 4.3;
  const posts = [limb([[-0.86, 0, 0.17], [-0.62, PY, 0.14]], { per: 4 }), limb([[0.86, 0, 0.17], [0.62, PY, 0.14]], { per: 4 })];
  const braces = [limb([[-0.8, 0.12, 0.07], [0.58, PY - 0.1, 0.07]], { per: 4 }), limb([[0.8, 0.12, 0.07], [-0.58, PY - 0.1, 0.07]], { per: 4 }), limb([[-0.74, 1.2, 0.1], [0.74, 1.2, 0.1]], { per: 3 })];
  const deck = [rect(-1.0, PY, 1.0, PY + 0.16), rect(-0.92, PY - 0.14, 0.92, PY)];
  const rail = [limb([[-0.94, RY, 0.07], [0.94, RY, 0.07]], { per: 3 }), limb([[-0.94, PY + 0.62, 0.05], [0.94, PY + 0.62, 0.05]], { per: 3 }), ...[-0.94, -0.47, 0, 0.47, 0.94].map((x) => limb([[x, PY + 0.1, 0.07], [x, RY, 0.07]], { per: 3 }))];
  const roofPosts = [limb([[-0.88, PY + 0.1, 0.09], [-0.88, UY, 0.09]], { per: 3 }), limb([[0.88, PY + 0.1, 0.09], [0.88, UY, 0.09]], { per: 3 })];
  const roof = poly([[-1.3, UY - 0.02], [0, UY + 0.82], [1.3, UY - 0.02], [1.18, UY - 0.12], [-1.18, UY - 0.12]], 0);
  const ladder = [limb([[1.22, 0, 0.06], [1.0, PY + 0.2, 0.06]], { per: 3 }), limb([[1.42, 0, 0.06], [1.2, PY + 0.2, 0.06]], { per: 3 })];
  const rungs = []; for (let i = 0; i < 9; i++) { const t = (i + 0.5) / 9, y = t * (PY + 0.2); rungs.push(limb([[1.22 - 0.22 * t, y, 0.04], [1.42 - 0.22 * t, y, 0.04]], { per: 2 })); }
  const wood = { top: '#b98a52', bottom: '#7e5530' };
  return spec('leg_turm', 'Wachturm', { body: { z: 1, layers: [
    { shapes: [...ladder, ...rungs], fill: { top: '#a4743f', bottom: '#6d4727' }, stroke: 'rgba(40,20,8,.7)' },
    { shapes: [...braces], fill: { top: '#a4743f', bottom: '#6d4727' }, stroke: 'rgba(40,20,8,.7)', deco(c, bb) { warm(c, bb, { r: 0.2, l: 0.2 }); } },
    { shapes: [...posts, ...deck], fill: wood, stroke: 'rgba(40,20,8,.75)',
      deco(c, bb) { woodDeco({ n: 3, vertical: true, w: 0.01 })(c, { x0: -1, x1: 1, y0: 0, y1: PY, w: 2, h: PY }); for (let x = -0.9; x < 1.0; x += 0.2) line(c, [[x, PY - 0.13], [x, PY + 0.15]], 'rgba(40,20,8,.45)', 0.01); nail(c, -0.7, 0.3, 0.015); nail(c, 0.7, 0.3, 0.015); warm(c, bb, { r: 0.26, l: 0.2 }); } },
    { shapes: [...rail, ...roofPosts], fill: wood, stroke: 'rgba(40,20,8,.75)', deco(c, bb) { warm(c, bb, { r: 0.26, l: 0.2 }); } },
    { shapes: [roof], fill: { top: '#e6c97f', bottom: '#b38a45' }, stroke: 'rgba(70,45,15,.8)',
      deco(c, bb) { const r = mulberry32(5); for (let i = 0; i < 70; i++) { const x = -1.25 + r() * 2.5, y = UY + r() * 0.8; line(c, [[x, y], [x + (r() - 0.5) * 0.1, y - 0.18]], r() > 0.5 ? 'rgba(120,80,20,.4)' : 'rgba(255,240,170,.35)', 0.012); } line(c, [[-1.2, UY - 0.08], [0, UY + 0.8], [1.2, UY - 0.08]], 'rgba(90,55,15,.55)', 0.03); warm(c, bb, { r: 0.28, l: 0.18 }); } },
  ] } }, { platform: [0, PY + 0.16] }, { heightM: 5.12, platformY: PY + 0.16 });
}

// ------------------------------------------------------------------------------------------------ Lagerfeuer
export function feuer() {
  const logs = [limb([[-0.42, 0.04, 0.12], [0.4, 0.2, 0.12]], { per: 4 }), limb([[0.42, 0.04, 0.12], [-0.4, 0.2, 0.12]], { per: 4 }), limb([[-0.3, 0.14, 0.1], [0.3, 0.1, 0.1]], { per: 3 })];
  const stones = [-0.62, -0.32, 0.0, 0.32, 0.62].map((x, i) => blob(x, 0.07, 0.15, 0.1, i * 0.4, 12));
  const fl = (s, dx) => poly([[-0.3 * s + dx, 0.15], [-0.34 * s + dx, 0.5 * s + 0.15], [-0.12 * s + dx, 0.8 * s + 0.2], [-0.04 * s + dx, 1.1 * s + 0.2], [0.1 * s + dx, 0.75 * s + 0.2], [0.3 * s + dx, 0.55 * s + 0.15], [0.32 * s + dx, 0.15]], 2);
  return spec('leg_feuer', 'Lagerfeuer', { body: { z: 1, layers: [
    { shapes: stones, fill: { top: '#aaa6a0', bottom: '#6d6862' }, stroke: 'rgba(40,35,30,.7)' },
    { shapes: [fl(1, 0)], fill: { top: '#e6452a', bottom: '#ff8a2a' }, stroke: 'rgba(120,30,10,.6)' },
    { shapes: [fl(0.72, 0.03)], fill: { top: '#ff9a2a', bottom: '#ffc94a' }, stroke: 'rgba(160,70,10,.5)' },
    { shapes: [fl(0.42, -0.02)], fill: { top: '#ffe27a', bottom: '#fff4b0' }, stroke: null },
    { shapes: logs, fill: { top: '#7a4f2d', bottom: '#4a2d18' }, stroke: 'rgba(30,15,5,.8)', deco(c) { dot(c, -0.4, 0.05, 0.05, '#c98a4a'); dot(c, 0.4, 0.05, 0.05, '#c98a4a'); line(c, [[-0.3, 0.1], [0.3, 0.2]], 'rgba(255,170,80,.4)', 0.02); } },
  ] } }, {}, { heightM: 1.2 });
}

// ------------------------------------------------------------------------------------------------ Marschgepäck (Tragestock mit Bündel)
export function marschgepaeck() {
  // Tragestock (furca) mit Gepäck: Kochgeschirr links, Decke rechts, Packsack in der Mitte; am Boden Spitzhacke und Korb
  const pole = limb([[0, 0, 0.075], [0, 1.98, 0.065]], { per: 4 });
  const cross = limb([[-0.62, 1.8, 0.06], [0.62, 1.8, 0.06]], { per: 3 });
  const mound = [blob(0, 0.03, 0.34, 0.08, 0, 16)];
  const potCord = limb([[-0.5, 1.8, 0.02], [-0.5, 1.5, 0.02]], { per: 2 }), rollCord = limb([[0.5, 1.8, 0.02], [0.5, 1.62, 0.02]], { per: 2 });
  const sackCord = [limb([[0, 1.8, 0.02], [-0.05, 1.5, 0.02]], { per: 2 })];
  const sack = [blob(0, 0.98, 0.31, 0.36, 0, 26), poly([[-0.11, 1.3], [0.11, 1.3], [0.07, 1.52], [-0.07, 1.52]], 0)];
  const pot = [blob(-0.5, 1.28, 0.2, 0.2, 0, 22), poly([[-0.74, 1.46], [-0.26, 1.46], [-0.3, 1.51], [-0.7, 1.51]]), limb([[-0.7, 1.48, 0.025], [-0.66, 1.62, 0.025], [-0.5, 1.7, 0.025], [-0.34, 1.62, 0.025], [-0.3, 1.48, 0.025]], { per: 3 })];
  const roll = [blob(0.5, 1.3, 0.13, 0.33, 0, 24)];
  const basket = poly([[0.34, 0.5], [0.82, 0.5], [0.76, 0.0], [0.4, 0.0]], 1);
  const pick = limb([[-0.62, 0.0, 0.055], [-0.46, 1.05, 0.05]], { per: 4 });
  const pickHead = poly([[-0.72, 1.12], [-0.34, 1.1], [-0.34, 1.03], [-0.5, 1.04], [-0.72, 1.0]], 0);
  return spec('leg_marschgepaeck', 'Marschgepäck', { body: { z: 1, layers: [
    { shapes: [...mound], fill: { top: '#b58a58', bottom: '#8a6238' }, stroke: 'rgba(50,25,10,.6)' },
    { shapes: [pick, pole, cross], fill: { top: '#c9985a', bottom: '#8a5a34' }, stroke: 'rgba(50,25,10,.75)', deco: woodDeco({ n: 3, vertical: true, w: 0.01 }) },
    { shapes: [pickHead], fill: { top: '#d9dde2', bottom: '#8f949b' }, stroke: 'rgba(50,55,65,.8)' },
    { shapes: [potCord, rollCord, ...sackCord], fill: '#6e5030', stroke: null },
    { shapes: [...roll], fill: { top: '#c63d2e', bottom: '#8e2418' }, stroke: 'rgba(60,15,10,.75)', deco(c) { for (const y of [1.12, 1.48]) line(c, [[0.36, y], [0.64, y]], '#6e5030', 0.04); line(c, [[0.45, 1.0], [0.45, 1.6]], 'rgba(255,200,170,.3)', 0.02); } },
    { shapes: [...pot], fill: { top: COL.bronzeL, bottom: COL.bronzeD }, stroke: 'rgba(90,55,10,.8)', deco(c) { line(c, [[-0.62, 1.22], [-0.52, 1.36]], 'rgba(255,255,255,.55)', 0.02); } },
    { shapes: [...sack], fill: { top: '#d7b17a', bottom: '#a47a45' }, stroke: 'rgba(70,40,15,.75)', deco(c, bb) { line(c, [[-0.1, 1.31], [0.1, 1.31]], '#5e3e20', 0.05); line(c, [[-0.2, 1.2], [-0.24, 0.8]], 'rgba(90,55,20,.4)', 0.02); line(c, [[0.2, 1.2], [0.24, 0.8]], 'rgba(90,55,20,.4)', 0.02); line(c, [[0, 1.26], [0, 0.7]], 'rgba(90,55,20,.3)', 0.02); dot(c, 0.1, 0.85, 0.09, 'rgba(150,100,50,.55)'); line(c, [[0.03, 0.85], [0.17, 0.85]], 'rgba(60,35,15,.5)', 0.012); warm(c, bb, { r: 0.28, l: 0.14 }); } },
    { shapes: [basket], fill: { top: '#d1a45a', bottom: '#9a6c32' }, stroke: 'rgba(70,40,10,.75)', deco(c) { for (let i = 0; i < 5; i++) line(c, [[0.38 + i * 0.09, 0.5], [0.44 + i * 0.075, 0.01]], 'rgba(90,55,20,.5)', 0.012); for (let j = 0; j < 5; j++) line(c, [[0.36, 0.43 - j * 0.09], [0.78, 0.43 - j * 0.09]], 'rgba(255,230,170,.3)', 0.012); } },
  ] } }, { top: [0, 2.0] }, { heightM: 2.0 });
}

// ------------------------------------------------------------------------------------------------ Bäume, Sonne, Wolken
export function pinie(o = {}) {
  const k = o.flip ? -1 : 1;
  const trunk = limb([[0.0, 0, 0.3], [0.08 * k, 1.1, 0.2], [-0.05 * k, 2.2, 0.17], [0.0, 2.8, 0.15]], { per: 6 });
  const crowns = [[-0.9 * k, 3.1, 0.62, 0.3], [-0.2 * k, 3.4, 0.8, 0.36], [0.7 * k, 3.15, 0.66, 0.31], [1.2 * k, 2.95, 0.4, 0.2], [-1.3 * k, 2.95, 0.4, 0.2]];
  const crown = crowns.map(([x, y, rx, ry]) => blob(x, y, rx, ry, 0, 24));
  return spec('leg_pinie', 'Pinie', { body: { z: 1, layers: [
    { shapes: [trunk, limb([[0.05 * k, 2.4, 0.08], [0.7 * k, 2.95, 0.07]], { per: 3 }), limb([[-0.02 * k, 2.3, 0.08], [-0.8 * k, 2.85, 0.07]], { per: 3 })], fill: { top: '#8a4e32', bottom: '#5e3524' }, stroke: 'rgba(40,20,8,.7)', deco(c) { for (let i = 0; i < 6; i++) line(c, [[-0.06, 0.2 + i * 0.4], [0.06, 0.4 + i * 0.4]], 'rgba(40,20,10,.4)', 0.015); } },
    { shapes: crown, fill: { top: '#7f8c4a', bottom: '#4f5c30' }, stroke: 'rgba(30,40,15,.7)',
      deco(c, bb) { const r = mulberry32(8); for (let i = 0; i < 40; i++) { const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h; line(c, [[x, y], [x + 0.12, y + 0.04], [x + 0.2, y]], 'rgba(40,55,20,.35)', 0.02); } warm(c, bb, { r: 0.34, l: 0.2 }); } },
  ] } }, {}, { heightM: 3.7 });
}
export function zypresse() {
  const pts = [[0, 3.55]];
  const hw = (y) => 0.43 * Math.pow(Math.sin(Math.PI * Math.min(1, (y + 0.15) / 3.7)), 0.8);
  const ys = []; for (let y = 3.35; y > 0.45; y -= 0.26) ys.push(y);
  ys.forEach((y, i) => pts.push([hw(y) + (i % 2 ? 0.05 : -0.02), y]));
  pts.push([0.12, 0.25], [0.1, 0.0], [-0.1, 0.0], [-0.12, 0.25]);
  for (let i = ys.length - 1; i >= 0; i--) pts.push([-hw(ys[i]) - (i % 2 ? 0.05 : -0.02), ys[i]]);
  const cy = poly(pts, 1);
  return spec('leg_zypresse', 'Zypresse', { body: { z: 1, layers: [{
    shapes: [cy], fill: { top: '#587344', bottom: '#2f4426' }, stroke: 'rgba(20,35,12,.7)',
    deco(c, bb) { for (let i = 0; i < 9; i++) { const x = -0.3 + i * 0.075; line(c, [[x, 0.5 + (i % 3) * 0.15], [x * 0.7, 2.9 - Math.abs(i - 4) * 0.25]], 'rgba(20,40,15,.35)', 0.025); } for (let i = 0; i < 12; i++) { const y = 0.7 + i * 0.22, w = hw(y) * 0.8; line(c, [[-w, y], [w, y + 0.1]], 'rgba(170,200,110,.18)', 0.02); } warm(c, bb, { r: 0.34, l: 0.2 }); },
  }] } }, {}, { heightM: 3.5 });
}
export function sonne() {
  const rays = []; for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r0 = 1.0, r1 = i % 2 ? 1.35 : 1.6; rays.push(poly([[Math.cos(a - 0.09) * r0, Math.sin(a - 0.09) * r0 + 1.6], [Math.cos(a) * r1, Math.sin(a) * r1 + 1.6], [Math.cos(a + 0.09) * r0, Math.sin(a + 0.09) * r0 + 1.6]])); }
  return spec('leg_sonne', 'Abendsonne', { body: { z: 1, layers: [
    { shapes: rays, fill: '#ffc86a', stroke: null },
    { shapes: [blob(0, 1.6, 1.0, 1.0, 0, 40)], fill: { top: '#fff1b0', bottom: '#ffb45a' }, stroke: 'rgba(200,90,30,.5)', deco(c) { dot(c, -0.25, 1.9, 0.22, 'rgba(255,255,255,.4)'); } },
  ] } }, { center: [0, 1.6] }, { heightM: 3.2 });
}
export function wolke(o = {}) {
  const long = o.long ? 1.4 : 1;
  const bumps = [[-1.6, 0.18, 0.32], [-1.0, 0.28, 0.42], [-0.3, 0.34, 0.5], [0.5, 0.3, 0.46], [1.2, 0.24, 0.38], [1.8, 0.16, 0.28]].map(([x, y, r]) => blob(x * long, y, r * long, r * 0.7, 0, 20));
  return spec('leg_wolke', 'Abendwolke', { body: { z: 1, layers: [
    { shapes: bumps.map((b) => b.map(([x, y]) => [x + 0.06, y - 0.05])), fill: '#b35a78', stroke: null },
    { shapes: bumps, fill: { top: '#ffd9b4', bottom: '#f09a86' }, stroke: 'rgba(150,70,80,.45)', deco(c, bb) { line(c, [[bb.x0 + 0.2, bb.y0 + 0.2], [bb.x1 - 0.2, bb.y0 + 0.2]], 'rgba(200,90,100,.3)', 0.1); } },
  ] } }, {}, { heightM: 1 });
}

// ------------------------------------------------------------------------------------------------ Querschnitt: Erdblock, Graben (V), Wall (Rasensoden)
export const QS = { w: 4.8, h: 0.62, ditchW: 1.2, ditchD: 0.55 };
export function erdblock() {
  const hw = QS.w / 2, h = QS.h;
  const top = []; for (let i = 0; i <= 24; i++) { const x = -hw + (QS.w * i) / 24; top.push([x, h + Math.sin(i * 1.7) * 0.012]); }
  const sh = poly([[-hw, 0], ...top, [hw, 0]], 0);
  return spec('leg_erdblock', 'Erde im Querschnitt', { body: { z: 1, layers: [{
    shapes: [sh], fill: { top: '#a8714a', bottom: '#76492d' }, stroke: 'rgba(50,25,10,.7)',
    deco(c, bb) {
      const r = mulberry32(11);
      for (let i = 0; i < 90; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h * 0.95, 0.01 + r() * 0.03, r() > 0.5 ? 'rgba(255,215,160,.22)' : 'rgba(50,25,10,.24)');
      for (let i = 0; i < 7; i++) { const x = bb.x0 + r() * bb.w, y = 0.1 + r() * (h - 0.2); dot(c, x, y, 0.035 + r() * 0.035, 'rgba(200,190,175,.7)'); }
      line(c, [[bb.x0, h - 0.0], [bb.x1, h - 0.0]], '#7f8f45', 0.07); line(c, [[bb.x0, h + 0.015], [bb.x1, h + 0.015]], '#a1b058', 0.03);
      for (let x = bb.x0 + 0.1; x < bb.x1; x += 0.17 + r() * 0.12) line(c, [[x, h], [x + (r() - 0.5) * 0.06, h + 0.07 + r() * 0.05]], '#8a9a48', 0.016);
      warm(c, bb, { r: 0.3, l: 0.2, d: 0.12 });
    },
  }] } }, {}, { heightM: h });
}
// Der Graben ist ein dunkles V; sein Ursprung (0,0) liegt an der Oberkante, er hängt nach unten (y < 0)
export function graben() {
  const hw = QS.ditchW / 2, d = QS.ditchD;
  const v = poly([[-hw - 0.02, 0.03], [hw + 0.02, 0.03], [0.1, -d], [-0.1, -d]], 0);
  return spec('leg_graben', 'Graben', { body: { z: 1, layers: [{
    shapes: [v], fill: { top: '#5b3a26', bottom: '#2a170d' }, stroke: 'rgba(25,12,5,.85)',
    deco(c, bb) {
      for (let i = 0; i < 9; i++) line(c, [[-hw + i * 0.19, 0.0], [-hw * 0.2 + i * 0.05, -d * 0.9]], 'rgba(20,8,2,.35)', 0.02);
      line(c, [[-hw, 0.0], [-0.1, -d]], 'rgba(255,200,140,.28)', 0.025);
      const r = mulberry32(3); for (let i = 0; i < 24; i++) dot(c, -hw * 0.8 + r() * hw * 1.6, -r() * d * 0.6, 0.01 + r() * 0.02, 'rgba(255,220,170,.18)');
      warm(c, bb, { r: 0.18, l: 0.1, d: 0.0 });
    },
  }] } }, {}, { heightM: d });
}
export function wall() {
  const w = poly([[-1.48, 0], [-0.98, 0.6], [-0.74, 1.08], [-0.68, 1.14], [0.7, 1.14], [0.76, 1.06], [1.0, 0.7], [1.48, 0.0]], 1);
  return spec('leg_wall', 'Wall', { body: { z: 1, layers: [{
    shapes: [w], fill: { top: '#b88557', bottom: '#8c5d3a' }, stroke: 'rgba(50,25,10,.7)',
    deco(c, bb) {
      for (let i = 0; i < 6; i++) { // Lagen aus Rasensoden
        const y = 0.12 + i * 0.17;
        line(c, [[-1.55 + y * 0.6, y], [1.55 - y * 0.55, y]], i % 2 ? 'rgba(60,35,15,.4)' : 'rgba(255,225,170,.3)', 0.03);
        for (let x = -1.2 + (i % 2) * 0.25; x < 1.2; x += 0.5) line(c, [[x, y], [x, y + 0.17]], 'rgba(60,35,15,.3)', 0.012);
      }
      line(c, [[-0.7, 1.12], [0.7, 1.12]], '#7f8f45', 0.06);
      const r = mulberry32(2); for (let i = 0; i < 50; i++) dot(c, -1.3 + r() * 2.6, r() * 1.0, 0.012 + r() * 0.02, 'rgba(50,25,10,.22)');
      warm(c, bb, { r: 0.32, l: 0.2, d: 0.12 });
    },
  }] } }, {}, { heightM: 1.14 });
}
