// Gruppe E – Bäume: Araukarie, Rundkonifere, Ginkgo, Magnolie, Palme, Schirmakazie (Stehkulissen, Meter, Basis y=0, Mitte x=0).
import { volume } from '../paint.js';
import {
  blob, limb, poly, TAU, rngOf, mix, shade, leaf, frond, beads, fan, cluster, profile, spline, centerline, along, strand,
  fillPoly, fillGrad, curve, strokes, finish, clipBelow,
} from './_e_kit.js';

const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);

// Rindenmuster: horizontale Ringnarben quer über den Stamm (prof = profile(ctrl))
function barkRings(c, prof, y0, y1, step, color, { alpha = 0.5, wk = 1, sag = 0.03, w = 0.03, rng = null } = {}) {
  for (let y = y0; y < y1; y += step) {
    const p = prof(y), hw = (p.w / 2) * wk * 0.96, j = rng ? (rng() - 0.5) * step * 0.3 : 0;
    curve(c, [[p.x - hw, y + j + sag], [p.x, y + j - sag], [p.x + hw, y + j + sag]], color, w, { alpha });
  }
}
// Nadel-/Blattstriche: wirre kurze Striche an Punkten (pts = [[x,y,ang]])
function needleTicks(c, pts, len, dark, light, w, rng) {
  const A = [], B = [];
  for (const [x, y, ang] of pts) {
    for (let k = 0; k < 2; k++) {
      const a = ang + (rng() - 0.5) * 1.6;
      const l = len * (0.6 + rng() * 0.7);
      (rng() < 0.5 ? A : B).push([x, y, x + Math.cos(a) * l, y + Math.sin(a) * l]);
    }
  }
  strokes(c, A, dark, w, 0.45); strokes(c, B, light, w, 0.5);
}

// ------------------------------------------------------------------------------------------------
// Araukarie ~12 m: schlanker Stamm, etagenartige Äste mit grünen Nadelpolstern, schirmförmige Krone (opts.h)
export function araucaria(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 31);
  const tk = [[0, 0, 1.15], [0, 0.55, 0.68], [0.04, 3, 0.52], [0.0, 7, 0.46], [0.03, 10.5, 0.38], [0.0, 11.7, 0.18]];
  const prof = profile(tk);
  const layers = [];
  // [y, halbe Spannweite, Hebung der Astspitze, Dicke des Polsters]
  const crownTiers = [[7.0, 1.7, 0.1, 0.46], [8.0, 2.3, 0.3, 0.5], [9.0, 2.85, 0.45, 0.52], [10.0, 3.15, 0.6, 0.52], [10.9, 2.75, 0.65, 0.5]];
  const lowTiers = [[5.3, 1.25, -0.7, 0.36], [6.2, 1.55, -0.55, 0.4]];
  const all = lowTiers.concat(crownTiers);
  const branchCtrl = (y, L, lift, side, off = 0) => {
    const x0 = prof(y).x + side * 0.15;
    return [[x0, y, 0.24], [x0 + side * L * 0.3, y + 0.08 + lift * 0.18, 0.18], [x0 + side * L * 0.65, y + lift * 0.62, 0.13], [x0 + side * L, y + lift, 0.1]];
  };
  // Hintere Polster (dunkel), verdecken den Stamm in der Krone
  const back = [];
  for (const [y, L, lift, th] of crownTiers) for (const side of [-1, 1]) {
    const c = branchCtrl(y + 0.2, L * 0.62, lift * 0.8, side);
    back.push(...beads(c.map((p, i) => [p[0], p[1] + 0.12, th * (0.8 + i * 0.05)]), { per: 4, rng, jit: 0.1, sy: 1.0 }));
  }
  layers.push({ shapes: back, fill: { top: '#3c7a52', bottom: '#254f3a' }, deco(c, bb) { volume(c, bb); } });
  // Stamm
  layers.push({
    shapes: [limb(tk, { per: 10 })],
    fill: { stops: [[0, '#4d3a2a'], [0.5, '#7b6248'], [1, '#6a5340']], dir: 'v' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(25,14,6,.3)', light: 'rgba(255,230,190,.15)' });
      barkRings(c, prof, 0.4, 11.4, 0.34, '#2b1d12', { alpha: 0.55, w: 0.045, sag: 0.05, rng });
      const r = rngOf(7, 2);
      strokes(c, Array.from({ length: 40 }, () => { const y = 0.4 + r() * 10.8, p = prof(y); const x = p.x + (r() - 0.5) * p.w * 0.8; return [x, y, x, y - 0.4]; }), '#2b1d12', 0.03, 0.28);
      // helle Kante links (Licht von links)
      for (let y = 0.2; y < 11; y += 0.5) { const p = prof(y), p2 = prof(y + 0.5); strokes(c, [[p.x - p.w * 0.32, y, p2.x - p2.w * 0.32, y + 0.5]], '#c9ad86', 0.06, 0.28); }
    },
  });
  // Astholz + tote Aststummel am Stamm
  const limbs = [];
  for (const [y, L, lift] of all) for (const side of [-1, 1]) limbs.push(limb(branchCtrl(y, L, lift, side), { per: 6 }));
  for (let i = 0; i < 7; i++) {
    const y = 0.9 + i * 0.62, side = i % 2 ? 1 : -1, x0 = prof(y).x;
    limbs.push(limb([[x0, y, 0.2], [x0 + side * 0.3, y - 0.12, 0.13], [x0 + side * 0.52, y - 0.3, 0.06]], { per: 4 }));
  }
  layers.push({ shapes: limbs, fill: { top: '#6b5238', bottom: '#4a3826' }, deco(c, bb) { volume(c, bb); } });
  // Nadelpolster je Etage (eigene Ebene = eigener Rand)
  all.forEach(([y, L, lift, th], ti) => {
    const t = ti / (all.length - 1);
    const shapes = [], dots = [];
    for (const side of [-1, 1]) {
      const bc = branchCtrl(y, L, lift, side);
      const bx = bc.map((p, i) => [p[0], p[1] + 0.05, i === 0 ? 0.01 : th * (0.5 + i * 0.17) * (i === 3 ? 0.9 : 1)]);
      bx[0] = [bc[1][0] - side * L * 0.05, bc[1][1], th * 0.55];
      const bd = beads(bx, { per: 4, rng, jit: 0.1, sy: 0.95 });
      shapes.push(...bd);
      for (const s of spline(bx, 3)) dots.push([s[0] + (rng() - 0.5) * s[2], s[1] + (rng() - 0.5) * s[2] * 0.8, side > 0 ? 0.5 : Math.PI - 0.5]);
    }
    const top = mix('#4f9a56', '#8fcc62', t * 0.6), bot = mix('#2d6b48', '#4f9a56', t * 0.5);
    layers.push({
      shapes, fill: { top, bottom: bot },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(10,40,20,.35)', light: 'rgba(235,255,170,.25)' });
        needleTicks(c, dots, 0.2, '#1f4d34', '#b3e27c', 0.026, rngOf(ti + 3, 4));
      },
    });
  });
  // Schirm-Deckel: breites, gewölbtes Polster oben + Leittrieb
  const apex = beads([[-2.5, 11.15, 0.4], [-1.3, 11.6, 0.5], [0, 11.82, 0.55], [1.3, 11.6, 0.5], [2.5, 11.15, 0.4]], { per: 4, rng, jit: 0.08 });
  layers.push({
    shapes: apex, fill: { top: '#9bd36a', bottom: '#4f9a56' },
    deco(c, bb) { volume(c, bb); needleTicks(c, Array.from({ length: 34 }, () => [(rng() - 0.5) * 4.6, 11.2 + rng() * 0.6, Math.PI / 2 + (rng() - 0.5) * 1.2]), 0.2, '#1f4d34', '#c8ee95', 0.026, rng); },
  });
  return spec('araucaria', 'Araukarie', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, crown: [0, 9.3] }, { kind: 'plant' }, { h: opts.h ?? 12, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Runder dichter Nadelbaum 6 m: kurzer Stamm, übereinanderliegende, wollige Nadeletagen, kleine Zapfen
export function conifer_round(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 41);
  const tk = [[0, 0, 0.8], [0, 0.4, 0.52], [0, 1.0, 0.46], [0, 1.8, 0.4]];
  const layers = [{
    shapes: [limb(tk, { per: 6 })],
    fill: { top: '#7a5c3c', bottom: '#4a3422' },
    deco(c, bb) { volume(c, bb); strokes(c, [[-0.1, 0.1, -0.08, 1.4], [0.08, 0.2, 0.1, 1.6], [0, 0.0, 0.0, 1.3]], '#2b1d12', 0.04, 0.35); },
  }];
  const tiers = [[1.75, 1.85, 0.72], [2.65, 2.05, 0.78], [3.55, 1.95, 0.78], [4.45, 1.6, 0.74], [5.25, 1.1, 0.64], [5.85, 0.5, 0.42]];
  const cones = [];
  tiers.forEach(([y, rx, ry], i) => {
    const t = i / (tiers.length - 1);
    const sh = cluster(0, y, rx, ry, { bumps: Math.round(8 + rx * 3), rb: ry * 0.62, seed: i + 1, jit: 0.12, inset: 0.9, core: 0.82 });
    // Nadelspitzen am Rand
    const r2 = rngOf(i + 11, 5);
    for (let k = 0; k < 14; k++) {
      const a = (k / 14) * TAU + r2() * 0.3, ex = Math.cos(a) * rx * 0.97, ey = Math.sin(a) * ry * 0.97;
      sh.push(leaf(ex * 0.9, y + ey * 0.9, a + (r2() - 0.5) * 0.4, 0.34, 0.15, { fat: 0.35 }));
    }
    const dots = [];
    for (let k = 0; k < 46; k++) { const a = r2() * TAU, rr = Math.sqrt(r2()) * 0.9; dots.push([Math.cos(a) * rx * rr, y + Math.sin(a) * ry * rr * 0.9, a]); }
    layers.push({
      shapes: sh,
      fill: { top: mix('#3f8a5a', '#74b866', t * 0.7), bottom: mix('#23583f', '#2f7050', t * 0.5) },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(8,30,20,.4)', light: 'rgba(230,255,170,.28)' });
        needleTicks(c, dots, 0.24, '#183f2c', '#a5dc7c', 0.028, rngOf(i + 40, 6));
      },
    });
    if (i % 2 === 0 && i < 5) cones.push([(i % 4 === 0 ? -1 : 1) * rx * 0.62, y - ry * 0.55]);
  });
  // kleine hängende Zapfen
  cones.forEach(([x, y], i) => {
    layers.push({
      shapes: [blob(x, y, 0.12, 0.2, 0.15, 18)], fill: { top: '#b0753a', bottom: '#6e4220' },
      deco(c, bb) { for (let k = 0; k < 5; k++) strokes(c, [[x - 0.14, y + 0.16 - k * 0.075, x + 0.14, y + 0.12 - k * 0.075]], '#3a2210', 0.016, 0.55); },
    });
  });
  return spec('conifer_round', 'Runder Nadelbaum', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, crown: [0, 3.5] }, { kind: 'plant' }, { h: opts.h ?? 6, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Ginkgo ~8 m: Fächerblätter, gelbgrün
export function ginkgo(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 53);
  const tk = [[0, 0, 0.85], [0, 0.5, 0.56], [0.05, 2.0, 0.44], [0.1, 3.4, 0.36], [0.12, 4.6, 0.26], [0.1, 5.9, 0.14]];
  const prof = profile(tk);
  // Hauptäste: [Astansatz y, Winkel°, Länge]
  const brs = [[1.9, 36, 3.0], [2.9, 50, 3.0], [3.7, 64, 2.7], [4.4, 80, 2.3], [2.1, 144, 2.9], [3.1, 130, 3.0], [3.9, 115, 2.6], [4.6, 98, 2.1], [5.3, 75, 1.5], [5.5, 108, 1.4]];
  const branches = brs.map(([y, deg, L]) => {
    const a = deg * Math.PI / 180, x0 = prof(y).x;
    const cl = centerline(x0, y, a, L, (Math.PI / 2 - a) * 0.55, { p: 1.1, n: 14 });
    return { cl, L };
  });
  // Blattpositionen entlang der Äste
  const leaves = [];
  branches.forEach(({ cl }, bi) => {
    const nL = 7;
    for (let k = 0; k < nL; k++) {
      const s = 0.38 + 0.62 * (k / (nL - 1)), [px, py, ang] = along(cl, s);
      for (let j = 0; j < 2; j++) {
        const side = j ? 1 : -1;
        const a = ang + side * (0.55 + rng() * 0.7) + (rng() - 0.5) * 0.3;
        leaves.push({ x: px, y: py, a, R: 0.66 + rng() * 0.16 - s * 0.06, tone: rng(), depth: rng() });
      }
    }
    const [px, py, ang] = along(cl, 1.0);
    leaves.push({ x: px, y: py, a: ang + (rng() - 0.5) * 0.4, R: 0.52, tone: rng(), depth: rng() }); // Endblatt
  });
  // Stammspitze
  for (let k = 0; k < 4; k++) leaves.push({ x: 0.1 + (k - 1.5) * 0.15, y: 5.7 + k * 0.1, a: Math.PI / 2 + (k - 1.5) * 0.5, R: 0.5, tone: rng(), depth: rng() });
  leaves.sort((p, q) => p.depth - q.depth);
  const mkLeaf = (lf) => {
    const f = fan(lf.x, lf.y, lf.a, lf.R, { span: 2.0, notch: 0.3 });
    const dark = lf.depth < 0.4;
    const base = mix('#a5bf33', '#e3d84a', lf.tone * 0.9);
    return {
      shapes: [f.blade, f.stalk],
      fill: { top: dark ? shade(base, -0.2) : shade(base, 0.12), bottom: dark ? shade(base, -0.38) : shade(base, -0.12) },
      deco(c) {
        const col = dark ? 'rgba(70,80,10,.45)' : 'rgba(110,110,20,.45)';
        const ls = [];
        for (let k = 0; k < 7; k++) { const th = lf.a - 0.9 + (1.8 * k) / 6; ls.push([lf.x, lf.y, lf.x + Math.cos(th) * lf.R * 0.9, lf.y + Math.sin(th) * lf.R * 0.9]); }
        strokes(c, ls, col, 0.011, 1);
      },
    };
  };
  const nBack = Math.floor(leaves.length * 0.4);
  const layers = leaves.slice(0, nBack).map(mkLeaf);
  layers.push({
    shapes: [limb(tk, { per: 8 }), ...branches.map(({ cl }) => strand(cl, 0.2, 0.06))],
    fill: { stops: [[0, '#5a4636'], [0.5, '#8a7660'], [1, '#76624c']], dir: 'v' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(25,14,6,.28)', light: 'rgba(255,235,200,.14)' });
      const r = rngOf(3, 2);
      strokes(c, Array.from({ length: 40 }, () => { const y = 0.2 + r() * 5.3, p = prof(y), x = p.x + (r() - 0.5) * p.w * 0.8; return [x, y, x + (r() - 0.5) * 0.04, y - 0.45]; }), '#2b1d12', 0.03, 0.3);
    },
  });
  leaves.slice(nBack).forEach((lf) => layers.push(mkLeaf(lf)));
  return spec('ginkgo', 'Ginkgo', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, crown: [0.1, 5.2] }, { kind: 'plant' }, { h: opts.h ?? 8, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Magnolie (Oberkreide) ~6 m: Laubbaum mit großen, glänzenden Blättern und einigen cremeweißen Blüten
export function magnolia(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 61);
  const tk = [[0, 0, 0.9], [0, 0.5, 0.58], [0.04, 1.6, 0.46], [0.0, 2.3, 0.38]];
  const prof = profile(tk);
  // Gabeläste
  const limbsDef = [[-52, 1.7], [-28, 1.9], [0, 1.6], [24, 1.9], [48, 1.7]].map(([d, L]) => ({ a: (90 + d) * Math.PI / 180, L }));
  const topX = 0.0, topY = 2.3;
  const cls = limbsDef.map(({ a, L }, i) => centerline(topX, topY - 0.1, a, L, (Math.PI / 2 - a) * 0.4, { p: 1.1, n: 12 }));
  // Blattbüschel: Mittelpunkte in Ellipse um die Astspitzen
  const clumps = [];
  const cc = [[-2.1, 4.1, 1.15], [-1.0, 4.9, 1.15], [0.0, 5.2, 1.2], [1.1, 4.9, 1.15], [2.1, 4.1, 1.15], [-1.5, 3.2, 1.0], [1.5, 3.3, 1.0], [0, 3.9, 1.3], [-2.6, 3.2, 0.7], [2.6, 3.2, 0.7]];
  cc.forEach(([x, y, r], i) => clumps.push({ x, y, r, depth: i < 5 ? 0.5 + rng() * 0.5 : rng() * 0.5 }));
  clumps.sort((a, b) => a.depth - b.depth);
  const mkClump = (cl, ci) => {
    const shapes = [], vs = [];
    const n = 11;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rng() * 0.4, rr = cl.r * (0.25 + 0.7 * Math.sqrt(rng()));
      const x = cl.x + Math.cos(a) * rr * 0.9, y = cl.y + Math.sin(a) * rr * 0.75;
      const dir = Math.atan2(y - cl.y, x - cl.x) + (rng() - 0.5) * 0.6, L = 0.62 + rng() * 0.16, W = 0.3 + rng() * 0.06;
      shapes.push(leaf(x - Math.cos(dir) * 0.28, y - Math.sin(dir) * 0.28, dir, L, W, { fat: 0.45, curve: (rng() - 0.5) * 0.12 }));
      vs.push([x - Math.cos(dir) * 0.28, y - Math.sin(dir) * 0.28, dir, L]);
    }
    const dep = cl.depth;
    return {
      shapes, fill: { top: mix('#3d8a4e', '#76bd5a', dep), bottom: mix('#1f5a3c', '#3f8a4e', dep) },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(8,36,20,.4)', light: 'rgba(235,255,180,.3)' });
        for (const [x, y, d, L] of vs) strokes(c, [[x, y, x + Math.cos(d) * L * 0.82, y + Math.sin(d) * L * 0.82]], 'rgba(220,245,160,.6)', 0.022, 1);
      },
    };
  };
  const layers = [];
  const nb = Math.floor(clumps.length * 0.45);
  clumps.slice(0, nb).forEach((cl, i) => layers.push(mkClump(cl, i)));
  layers.push({
    shapes: [limb(tk, { per: 8 }), ...cls.map((cl) => strand(cl, 0.3, 0.1))],
    fill: { stops: [[0, '#5f4b3c'], [0.5, '#86756a'], [1, '#6d5c4e']], dir: 'v' },
    deco(c, bb) { volume(c, bb, { dark: 'rgba(25,14,6,.3)', light: 'rgba(255,235,200,.16)' }); strokes(c, [[-0.1, 0.1, -0.08, 1.3], [0.1, 0.2, 0.12, 1.7], [0, 1.4, 0, 2.2]], '#2b1d12', 0.035, 0.3); },
  });
  clumps.slice(nb).forEach((cl, i) => layers.push(mkClump(cl, i + 20)));
  // Blüten: Tulpenform, cremeweiß mit rosa Grund
  const flowers = [[-2.0, 4.85, 0.9, -0.15], [-0.7, 5.75, 1.0, 0.1], [0.9, 5.45, 1.0, -0.05], [2.0, 4.6, 0.9, 0.15], [-1.4, 3.7, 0.8, 0.0], [0.2, 4.4, 0.85, 0.1]];
  flowers.forEach(([x, y, s, tilt]) => {
    const pet = [];
    [-58, -30, 0, 30, 58].forEach((dd, k) => {
      const a = (90 + dd) * Math.PI / 180 + tilt, L = (k === 2 ? 0.78 : k % 2 ? 0.66 : 0.6) * s;
      pet.push({ k, sh: leaf(x, y, a, L, L * 0.62, { fat: 0.55, curve: -Math.sign(dd || 1) * 0.1 }), a, L });
    });
    pet.sort((p, q) => Math.abs(q.k - 2) - Math.abs(p.k - 2));
    layers.push({
      shapes: pet.map((p) => p.sh), fill: { top: '#fff7ea', bottom: '#e99ab0' },
      deco(c, bb) {
        for (const p of pet) strokes(c, [[x, y, x + Math.cos(p.a) * p.L * 0.8, y + Math.sin(p.a) * p.L * 0.8]], 'rgba(200,90,120,.45)', 0.012, 1);
        fillPoly(c, blob(x, y + 0.3 * s, 0.1 * s, 0.15 * s, 0, 12), '#f2c24a', 0.9);
      },
    });
  });
  return spec('magnolia', 'Magnolie', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, crown: [0, 4.3] }, { kind: 'plant', blossoms: flowers.length }, { h: opts.h ?? 6, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Palme (Eozän) ~6 m: schlanker, leicht gebogener Ringstamm, Krone aus Fiederwedeln, Fruchtbüschel
export function palm(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 71);
  const tk = [[0, 0, 0.62], [0.03, 0.5, 0.4], [0.2, 1.8, 0.34], [0.45, 3.1, 0.32], [0.55, 4.2, 0.3], [0.5, 4.8, 0.28]];
  const prof = profile(tk);
  const T = [0.5, 4.75];
  const layers = [];
  layers.push({
    shapes: [limb(tk, { per: 10 })],
    fill: { stops: [[0, '#8a6a46'], [0.5, '#b69468'], [1, '#9a7b52']], dir: 'v' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,22,8,.32)', light: 'rgba(255,235,190,.2)' });
      barkRings(c, prof, 0.35, 4.7, 0.2, '#4a3118', { alpha: 0.6, w: 0.04, sag: 0.04, rng });
      for (let y = 0.3; y < 4.6; y += 0.4) { const p = prof(y), p2 = prof(y + 0.4); strokes(c, [[p.x - p.w * 0.28, y, p2.x - p2.w * 0.28, y + 0.4]], '#e9d0a0', 0.05, 0.3); }
    },
  });
  const defs = [   // [Winkel°, Länge, bend, Tiefe]
    [176, 2.1, 1.7, 0.1], [4, 2.1, -1.7, 0.1], [155, 2.4, 1.45, 0.3], [25, 2.4, -1.45, 0.3], [132, 2.4, 1.15, 0.5], [48, 2.4, -1.15, 0.5],
    [112, 2.1, 0.8, 0.7], [70, 2.1, -0.8, 0.7], [92, 1.4, 0.2, 0.9],
  ];
  defs.sort((a, b) => a[3] - b[3]).forEach(([deg, L, bend, d]) => {
    const f = frond(T[0], T[1] - 0.05, deg * Math.PI / 180, L, {
      bend, p: 1.5, pairs: 11, leafL: L * 0.3, leafW: L * 0.065, spread: 0.85, start: 0.1, end: 0.96, shrink: 0.55, curve: 0.1, fat: 0.4,
      droop: 0.5, rachisW: 0.07, rng, sizeJit: 0.1,
    });
    const top = mix('#3c9648', '#9ad456', d), bot = mix('#1e6a3a', '#4aa04a', d);
    layers.push({
      shapes: f.all, fill: { top, bottom: bot },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(8,40,20,.38)', light: 'rgba(240,255,170,.25)' });
        strokes(c, f.veins, shade(bot, -0.3), 0.012, 0.45);
        curve(c, f.cl.map((p) => [p[0], p[1]]), shade(bot, -0.4), 0.03, { alpha: 0.85 });
      },
    });
  });
  // Fruchtbüschel unter der Krone
  const fr = [];
  for (let k = 0; k < 7; k++) fr.push(blob(T[0] - 0.22 + (k % 3) * 0.2, T[1] - 0.3 - Math.floor(k / 3) * 0.2, 0.11, 0.14, 0, 14));
  layers.push({ shapes: fr, fill: { top: '#f0a040', bottom: '#b8561c' }, deco(c, bb) { volume(c, bb); fillPoly(c, blob(T[0] - 0.05, T[1] - 0.25, 0.03, 0.04, 0, 8), '#fff0c8', 0.6); } });
  return spec('palm', 'Palme', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] }, crown: [T[0], T[1] + 0.1] }, { kind: 'plant' }, { h: opts.h ?? 6, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Schirmakazie ~5 m: gegabelter, dunkler Stamm, flache, geschichtete Schirmkrone (Savanne)
export function acacia(opts = {}) {
  const trunk = [[0.1, 0, 0.8], [0.0, 0.4, 0.52], [0.12, 1.4, 0.44], [0.05, 2.2, 0.42]];
  const arms = [
    [[0.05, 2.0, 0.4], [-0.5, 2.5, 0.3], [-1.4, 3.15, 0.22], [-2.5, 3.6, 0.13]],
    [[0.08, 2.2, 0.4], [0.05, 2.9, 0.3], [0.1, 3.5, 0.2], [0.0, 4.2, 0.12]],
    [[0.1, 2.0, 0.4], [0.7, 2.4, 0.3], [1.5, 3.0, 0.22], [2.5, 3.6, 0.13]],
  ];
  const pads = [   // [cx, cy, rx, ry, Tiefe]
    [-3.1, 3.55, 1.5, 0.5, 0], [3.1, 3.6, 1.5, 0.5, 0.05], [-1.6, 3.95, 2.0, 0.66, 0.3], [1.7, 4.0, 2.0, 0.66, 0.35], [0.0, 4.5, 2.4, 0.74, 0.9],
  ];
  const layers = [];
  const mkPad = ([cx, cy, rx, ry, d], i) => {
    const sh = cluster(cx, cy, rx, ry, { bumps: Math.round(rx * 4.5), rb: ry * 0.52, seed: i + 5, jit: 0.15, arcFrom: 0.0, arcTo: Math.PI, inset: 0.93, core: 0.9 })
      .map((p) => clipBelow(p, cy - ry * 0.3)).filter((p) => p.length > 2);
    // gewellte Unterkante (kleine Bögen)
    for (let k = 0; k < Math.round(rx * 3.2); k++) { const t = (k + 0.5) / Math.round(rx * 3.2); sh.push(blob(cx - rx * 0.88 + t * rx * 1.76, cy - ry * 0.3, rx * 0.24, ry * 0.2, 0, 14)); }
    const r2 = rngOf(i + 90, 7);
    const ticks = [];
    for (let k = 0; k < Math.round(rx * 30); k++) { const x = cx + (r2() - 0.5) * 2 * rx * 0.95, y = cy - ry * 0.2 + r2() * ry * 0.95; ticks.push([x, y, Math.PI / 2 + (r2() - 0.5) * 2.0]); }
    return {
      shapes: sh, fill: { top: mix('#a3b546', '#cfd965', d * 0.6), bottom: mix('#566e2a', '#7f9638', d * 0.7) },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(25,40,5,.55)', light: 'rgba(250,255,190,.3)' });
        needleTicks(c, ticks, 0.22, '#3c5420', '#e4efa0', 0.024, rngOf(i + 9, 3));
      },
    };
  };
  layers.push(mkPad(pads[0], 0), mkPad(pads[1], 1));
  layers.push({
    shapes: [limb(trunk, { per: 8 }), ...arms.map((a) => limb(a, { per: 8 }))],
    fill: { stops: [[0, '#3f3026'], [0.5, '#6a5238'], [1, '#54402c']], dir: 'v' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(20,10,4,.35)', light: 'rgba(255,225,180,.16)' });
      const r = rngOf(5, 8);
      strokes(c, Array.from({ length: 22 }, () => { const y = 0.1 + r() * 2.2, x = (r() - 0.5) * 0.5 + 0.07; return [x, y, x + (r() - 0.5) * 0.05, y - 0.35]; }), '#1c120a', 0.04, 0.4);
      strokes(c, [[-0.12, 0.1, -0.08, 1.2], [0.22, 0.3, 0.24, 1.6]], '#a58a62', 0.06, 0.28);
    },
  });
  layers.push(mkPad(pads[2], 2), mkPad(pads[3], 3), mkPad(pads[4], 4));
  return spec('acacia', 'Schirmakazie', { body: { z: 1, layers } },
    { base: [0.1, 0], top: { rel: [0.5, 1] }, crown: [0, 4.3] }, { kind: 'plant' }, { h: opts.h ?? 5, floor: 0 });
}
