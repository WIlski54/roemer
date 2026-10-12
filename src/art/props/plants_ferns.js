// Gruppe E – Farne, Schachtelhalm, Palmfarn (Stehkulissen, Meter, Basis y=0).
import { volume } from '../paint.js';
import {
  blob, limb, poly, TAU, rngOf, variantOf, mix, shade, leaf, frond, crozier, centerline, along, strand,
  fillPoly, fillGrad, curve, strokes, finish, cluster,
} from './_e_kit.js';

// Ein Wedel = eine Layer-Ebene (eigener weißer-/dunkler Rand wie bei übereinanderliegendem Papier)
function frondLayer(fr, top, bottom, { rib = null, veins = true, volDark = 'rgba(30,50,10,.30)' } = {}) {
  const ribC = rib || shade(bottom, -0.35);
  return {
    shapes: fr.all,
    fill: { top, bottom },
    deco(c, bb) {
      volume(c, bb, { dark: volDark, light: 'rgba(255,255,200,.18)' });
      if (veins) strokes(c, fr.veins, ribC, 0.008, 0.38);
      curve(c, fr.cl.map((p) => [p[0], p[1]]), ribC, 0.016, { alpha: 0.8 });
    },
  };
}

const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);
const T = { rel: [0.5, 1] };

// ------------------------------------------------------------------------------------------------
// Bodenfarn ~0,8 m. Variante 1 (seed 1): aufrechter Fächer; Variante 2 (seed 2): überhängende Wedel + Farn-Schnecke
export function fern_ground(opts = {}) {
  const v = variantOf(opts, 2), rng = rngOf(opts.seed ?? 1, 5);
  const layers = [];
  const fronds = [];
  if (v === 0) {
    const angs = [168, 146, 124, 104, 86, 68, 50, 28, 8];
    angs.forEach((deg, i) => {
      const a = deg * Math.PI / 180, mid = Math.abs(deg - 90) / 90;
      const L = 0.62 + (1 - mid) * 0.2 + (rng() - 0.5) * 0.05;
      fronds.push({ a, L, bend: -Math.sign(Math.cos(a) || 1) * (0.35 + mid * 0.75), x: (i - 4) * 0.014, depth: 1 - mid });
    });
  } else {
    const angs = [170, 146, 122, 102, 82, 60, 36, 10];
    angs.forEach((deg, i) => {
      const a = deg * Math.PI / 180, mid = Math.abs(deg - 90) / 90;
      const L = 0.5 + (1 - mid) * 0.28 + (rng() - 0.5) * 0.05;
      fronds.push({ a, L, bend: -Math.sign(Math.cos(a) || 1) * (0.7 + mid * 0.9), x: (i - 3.5) * 0.015, depth: 1 - mid });
    });
  }
  fronds.sort((p, q) => p.depth - q.depth);   // seitliche zuerst (hinten), mittlere zuletzt (vorn)
  fronds.forEach((f, i) => {
    const t = i / (fronds.length - 1);
    const fr = frond(f.x, 0.02, f.a, f.L, {
      bend: f.bend, p: 1.6, pairs: v === 0 ? 7 : 6, leafL: f.L * (v === 0 ? 0.3 : 0.34), leafW: f.L * (v === 0 ? 0.14 : 0.16),
      spread: v === 0 ? 1.1 : 1.0, start: 0.1, end: 0.93, shrink: 0.7, curve: 0.1, fat: 0.5, rachisW: 0.034, rng, sizeJit: 0.12,
    });
    layers.push(frondLayer(fr, mix('#4a9a48', '#a2d25c', 0.15 + 0.8 * t), mix('#2d6e3e', '#5aa84a', t)));
  });
  if (v === 1) {
    const cr = crozier(0.0, 0.03, Math.PI / 2 + 0.1, 0.34, 0.075, 0.04);
    layers.push({ shapes: [cr], fill: { top: '#a2d25c', bottom: '#5aa84a' }, deco(c, bb) { volume(c, bb); } });
  }
  return spec('fern_ground', 'Bodenfarn', { body: { z: 1, layers } },
    { base: [0, 0], top: T, crown: { rel: [0.5, 0.5] } }, { kind: 'plant', variant: v + 1, variants: 2 }, { h: opts.h ?? 0.8, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Baumfarn ~3 m: Stamm mit Blattnarben + große Wedelkrone
export function tree_fern(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 11);
  const top = [0.12, 1.95];
  const trunk = limb([[0, 0, 0.5], [0.0, 0.22, 0.34], [0.05, 0.9, 0.28], [0.1, 1.5, 0.27], [top[0], top[1], 0.25]], { per: 8 });
  const layers = [];
  layers.push({
    shapes: [trunk],
    fill: { stops: [[0, '#4e3320'], [0.5, '#7b5634'], [1, '#6a4a2c']], dir: 'v' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(25,12,4,.30)', light: 'rgba(255,220,160,.18)' });
      const r = rngOf(opts.seed ?? 1, 2);
      const cx = (y) => (y / top[1]) * 0.11;
      // Blattnarben: gestaffelte helle Rauten mit dunklem Kern
      for (let row = 0; row < 12; row++) {
        const y = 0.3 + row * 0.14;
        for (let k = -1; k <= 1; k++) {
          const x = cx(y) + k * 0.1 + (row % 2 ? 0.05 : 0);
          if (Math.abs(x - cx(y)) > 0.09) continue;
          fillPoly(c, [[x, y + 0.058], [x + 0.047, y], [x, y - 0.058], [x - 0.047, y]], '#b58f5a', 0.85);
          fillPoly(c, [[x, y + 0.03], [x + 0.022, y], [x, y - 0.03], [x - 0.022, y]], '#35200f', 0.75);
        }
      }
      strokes(c, Array.from({ length: 26 }, () => { const y = r() * 1.8 + 0.1, x = cx(y) + (r() - 0.5) * 0.3; return [x, y, x + (r() - 0.5) * 0.03, y - 0.2]; }), '#2d1a0c', 0.012, 0.35);
    },
  });
  const spec0 = [   // [Winkel°, Länge, bend, Tiefe]
    [170, 1.3, 1.9, 0.05], [10, 1.3, -1.9, 0.05], [152, 1.6, 1.5, 0.25], [28, 1.6, -1.5, 0.25], [130, 1.7, 1.15, 0.4], [50, 1.7, -1.15, 0.4],
    [110, 1.55, 0.7, 0.6], [70, 1.55, -0.7, 0.6], [92, 1.15, 0.25, 0.8],
  ];
  spec0.sort((a, b) => a[3] - b[3]).forEach(([deg, L, bend, d]) => {
    const f = frond(top[0], top[1] - 0.02, deg * Math.PI / 180, L, {
      bend, p: 1.5, pairs: 8, leafL: L * 0.28, leafW: L * 0.12, spread: 1.12, start: 0.1, end: 0.94, shrink: 0.7, curve: 0.1, fat: 0.5,
      rachisW: 0.055, rng, sizeJit: 0.1,
    });
    layers.push(frondLayer(f, mix('#3f8a47', '#9ccf55', d * 0.9), mix('#25603a', '#4f9f48', d)));
  });
  const cr = crozier(top[0], top[1] + 0.02, Math.PI / 2 - 0.15, 0.32, 0.075, 0.045);
  layers.push({ shapes: [cr], fill: { top: '#a6d45e', bottom: '#5aa84a' }, deco(c, bb) { volume(c, bb); } });
  return spec('tree_fern', 'Baumfarn', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1], dx: 0.1 }, crown: [top[0], top[1] + 0.1] }, { kind: 'plant' }, { h: opts.h ?? 3.0, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Schachtelhalm ~1,2 m: mehrere gegliederte Halme mit Astquirlen und Sporenähren
export function horsetail(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 17);
  const stems = [
    { x: -0.42, h: 0.8, lean: -0.05, d: 0, cone: false },
    { x: 0.42, h: 0.88, lean: 0.06, d: 0, cone: true },
    { x: -0.2, h: 1.02, lean: -0.04, d: 0.5, cone: false },
    { x: 0.2, h: 1.12, lean: 0.03, d: 0.5, cone: true },
    { x: 0.0, h: 1.2, lean: 0.0, d: 1, cone: false },
  ];
  const layers = [];
  stems.forEach((s) => {
    const w0 = 0.075, w1 = 0.052;
    const sx = (yy) => s.x + s.lean * yy;
    const tipY = s.h * 0.9;
    // Knoten: Internodien unten lang, oben kurz
    const nodes = [];
    const nN = Math.round(4 + s.h * 3);
    for (let i = 0; i < nN; i++) { const t = (i + 0.55) / (nN + 0.1); nodes.push(tipY * (0.07 + 0.92 * (1 - Math.pow(1 - t, 1.2)))); }
    const shapes = [limb([[sx(0), 0, w0], [sx(s.h * 0.5), s.h * 0.5, (w0 + w1) / 2], [sx(tipY), tipY, w1]], { per: 8 })];
    if (s.cone) shapes.push(blob(sx(s.h * 0.99), tipY + 0.085, 0.048, 0.1, 0, 24));
    else shapes.push(leaf(sx(tipY), tipY - 0.02, Math.PI / 2, s.h * 0.12 + 0.03, 0.062, { fat: 0.3 }));
    const sheaths = [];
    nodes.forEach((ny, i) => {
      const rel = ny / s.h, x = sx(ny);
      const wN = 0.082 - rel * 0.026;
      const sh = [[x - wN, ny - 0.016], [x - wN, ny + 0.012]];
      const nt = 4;
      for (let k = 0; k <= nt; k++) { sh.push([x - wN + (2 * wN * (k + 0.5)) / (nt + 1), ny + 0.052]); if (k < nt) sh.push([x - wN + (2 * wN * (k + 1)) / (nt + 1), ny + 0.014]); }
      sh.push([x + wN, ny + 0.012], [x + wN, ny - 0.016]);
      shapes.push(sh); sheaths.push({ x, y: ny, w: wN });
      // Quirl: dünne Äste, nach oben gebogen; Länge nimmt nach oben ab (Tannenbaum-Form), unterste Knoten kahl
      if (rel < 0.1 || (ny > tipY * 0.97)) return;
      const bl = (0.4 * Math.min(1, (rel - 0.08) / 0.2) * (1.1 - rel * 0.85)) * (0.9 + 0.2 * rng()) * (0.8 + s.h * 0.22);
      const fan = [[0.95, 1.0], [0.55, 0.82], [0.2, 0.55]];
      for (const side of [-1, 1]) {
        fan.forEach(([da, lk], fi) => {
          if (rel > 0.8 && fi === 0) return;
          const ang = Math.PI / 2 - side * (da * (0.7 + 0.5 * (1 - rel)) + (rng() - 0.5) * 0.1);
          shapes.push(leaf(x + side * wN * 0.6, ny + 0.02, ang, bl * lk, 0.034 + 0.014 * (1 - rel), { fat: 0.28, curve: side * 0.16 }));
        });
      }
    });
    const light = mix('#9cc66a', '#cde493', s.d), dark = mix('#5d9444', '#7ab458', s.d);
    layers.push({
      shapes, fill: { top: light, bottom: dark },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(30,60,10,.28)', light: 'rgba(255,255,210,.2)' });
        const body = [[sx(0) - w0 / 2, 0], [sx(0) + w0 / 2, 0], [sx(tipY) + w1 / 2, tipY], [sx(tipY) - w1 / 2, tipY]];
        fillGrad(c, body, sx(0) - w0 / 2, 0, sx(0) + w0 / 2, 0, [[0, 'rgba(50,90,30,.6)'], [0.4, 'rgba(255,255,220,.4)'], [1, 'rgba(45,85,28,.65)']]);
        for (const sh of sheaths) {
          strokes(c, [[sh.x - sh.w, sh.y - 0.002, sh.x + sh.w, sh.y - 0.002]], '#5a4a28', 0.024, 0.85);
          strokes(c, [[sh.x - sh.w, sh.y + 0.02, sh.x + sh.w, sh.y + 0.02]], '#9a8a52', 0.012, 0.6);
        }
        if (s.cone) {
          const cx = sx(s.h * 0.99), cy = tipY + 0.085;
          fillPoly(c, blob(cx, cy, 0.048, 0.1, 0, 24), '#8a6a3a', 0.96);
          for (let k = 0; k < 7; k++) strokes(c, [[cx - 0.05, cy - 0.085 + k * 0.03, cx + 0.05, cy - 0.085 + k * 0.03]], '#4a3418', 0.011, 0.6);
          fillPoly(c, blob(cx - 0.018, cy + 0.02, 0.012, 0.05, 0, 12), '#c8aa6c', 0.55);
        }
      },
    });
  });
  return spec('horsetail', 'Schachtelhalm', { body: { z: 1, layers } },
    { base: [0, 0], top: T, crown: { rel: [0.5, 0.75] } }, { kind: 'plant' }, { h: opts.h ?? 1.2, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Palmfarn ~1,5 m: kurzer Stamm mit Rautenmuster, steife Fiederwedel, orangefarbener Zapfen
export function cycad(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 23);
  const top = [0.0, 0.58];
  const trunk = limb([[0, -0.05, 0.6], [0.0, 0.15, 0.6], [0.01, 0.36, 0.52], [0.0, 0.58, 0.44]], { per: 8 });
  const layers = [];
  layers.push({
    shapes: [trunk],
    fill: { top: '#8a6a44', bottom: '#4f3820' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(25,12,4,.35)', light: 'rgba(255,225,170,.2)' });
      const q = 0.1;
      for (let row = 0; row < 7; row++) {
        for (let k = -4; k <= 4; k++) {
          const x = k * q + (row % 2 ? q / 2 : 0), y = 0.07 + row * 0.085;
          if (Math.abs(x) > 0.27) continue;
          fillPoly(c, [[x, y + 0.055], [x + 0.052, y], [x, y - 0.055], [x - 0.052, y]], '#b3905c', 0.45);
          strokes(c, [[x - 0.052, y, x, y + 0.055], [x, y + 0.055, x + 0.052, y], [x + 0.052, y, x, y - 0.055], [x, y - 0.055, x - 0.052, y]], '#2f1c0c', 0.012, 0.6);
        }
      }
    },
  });
  const spec0 = [
    [172, 0.95, 1.15, 0.1], [8, 0.95, -1.15, 0.1], [156, 1.05, 0.95, 0.25], [24, 1.05, -0.95, 0.25], [138, 1.12, 0.75, 0.4], [42, 1.12, -0.75, 0.4],
    [120, 1.12, 0.5, 0.55], [60, 1.12, -0.5, 0.55], [104, 1.05, 0.3, 0.7], [76, 1.05, -0.3, 0.7],
  ];
  spec0.sort((a, b) => a[3] - b[3]).forEach(([deg, L, bend, d]) => {
    const f = frond(top[0], top[1] - 0.04, deg * Math.PI / 180, L, {
      bend, p: 1.6, pairs: 9, leafL: 0.3, leafW: 0.062, spread: 1.2, start: 0.14, end: 0.95, shrink: 0.45, curve: 0.04, fat: 0.5,
      rachisW: 0.05, rng, sizeJit: 0.06,
    });
    layers.push(frondLayer(f, mix('#2f7845', '#7cc060', d * 0.8), mix('#1d5238', '#3f8f4c', d), { veins: false }));
  });
  const cone = [blob(0, top[1] + 0.2, 0.11, 0.22, 0, 28), poly([[-0.045, top[1] + 0.36], [0, top[1] + 0.54], [0.045, top[1] + 0.36]], 1)];
  layers.push({
    shapes: cone, fill: { top: '#f4ad3e', bottom: '#c1631c' },
    deco(c, bb) {
      volume(c, bb);
      for (let r = 0; r < 9; r++) for (let k = 0; k < 3; k++) {
        const x = -0.07 + k * 0.07 + (r % 2 ? 0.035 : 0), y = top[1] - 0.02 + r * 0.05;
        fillPoly(c, [[x, y + 0.032], [x + 0.033, y], [x, y - 0.032], [x - 0.033, y]], '#8c3c10', 0.35);
      }
    },
  });
  return spec('cycad', 'Palmfarn', { body: { z: 1, layers } },
    { base: [0, 0], top: T, crown: [0, top[1] + 0.2] }, { kind: 'plant' }, { h: opts.h ?? 1.5, floor: 0 });
}
