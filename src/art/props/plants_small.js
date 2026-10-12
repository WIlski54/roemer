// Gruppe E – kleine Pflanzen: Grasbüschel (3 Varianten), Busch, Schilf (Meter, Basis y=0).
import { volume } from '../paint.js';
import { blob, limb, poly, TAU, rngOf, variantOf, mix, shade, leaf, centerline, along, strand, cluster, fillPoly, curve, strokes, finish } from './_e_kit.js';

const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);

// ------------------------------------------------------------------------------------------------
// Grasbüschel ~0,5 m. seed 1/2/3 -> Variante 1 aufrecht, 2 überhängend, 3 mit Samenständen
export function grass_tuft(opts = {}) {
  const v = variantOf(opts, 3), rng = rngOf(opts.seed ?? 1, 91);
  const blades = [];
  const add = (x, deg, L, W, bend, depth) => blades.push({ x, a: deg * Math.PI / 180, L, W, bend, depth });
  if (v === 0) {         // aufrechter, dichter Horst
    [[-0.1, 124, 0.34], [-0.07, 112, 0.44], [-0.04, 102, 0.52], [-0.01, 94, 0.58], [0.02, 86, 0.56], [0.05, 77, 0.5], [0.08, 66, 0.44], [0.11, 54, 0.36],
      [-0.12, 138, 0.26], [0.13, 40, 0.27], [-0.03, 108, 0.4], [0.04, 80, 0.42], [0.0, 98, 0.48], [0.06, 70, 0.36]]
      .forEach(([x, d, L]) => add(x, d, L * (0.94 + rng() * 0.12), 0.044, 0.5 + rng() * 0.3, Math.abs(d - 90) / 60));
  } else if (v === 1) {  // überhängender Springbrunnen-Horst
    [[-0.1, 124, 0.66], [-0.07, 114, 0.72], [-0.04, 104, 0.76], [-0.01, 96, 0.78], [0.02, 86, 0.78], [0.05, 76, 0.76], [0.08, 66, 0.72], [0.11, 56, 0.66],
      [-0.03, 108, 0.58], [0.04, 80, 0.58], [0.0, 90, 0.5]]
      .forEach(([x, d, L]) => add(x, d, L * (0.94 + rng() * 0.12), 0.062, 1.05 + (1 - Math.abs(d - 90) / 60) * 0.3, 0.2 + (1 - Math.abs(d - 90) / 70) * 0.8));
  } else {               // niedrigere Blätter + Halme mit Ähren
    [[-0.1, 132, 0.3], [-0.06, 116, 0.36], [-0.02, 102, 0.4], [0.03, 82, 0.38], [0.06, 66, 0.34], [0.1, 48, 0.3], [0.0, 92, 0.3], [-0.08, 124, 0.24], [0.08, 56, 0.24]]
      .forEach(([x, d, L]) => add(x, d, L, 0.042, 0.6, Math.abs(d - 90) / 50));
  }
  blades.sort((p, q) => q.depth - p.depth);
  const mk = (list, top, bot) => {
    const shapes = [], ribs = [];
    for (const b of list) {
      const curveK = -Math.sign(Math.cos(b.a) || 1) * b.bend * 0.4;
      shapes.push(leaf(b.x, 0.0, b.a, b.L, b.W, { fat: 0.3, curve: curveK, baseW: 0.55, n: 10 }));
      const dx = Math.cos(b.a), dy = Math.sin(b.a), nx = -dy, ny = dx;
      ribs.push([[b.x, 0.02], [b.x + dx * b.L * 0.5 + nx * curveK * b.L * 0.25, dy * b.L * 0.5 + ny * curveK * b.L * 0.25], [b.x + dx * b.L * 0.9 + nx * curveK * b.L * 0.81, dy * b.L * 0.9 + ny * curveK * b.L * 0.81]]);
    }
    return { shapes, fill: { top, bottom: bot }, deco(c, bb) { volume(c, bb, { dark: 'rgba(20,50,10,.35)', light: 'rgba(255,255,190,.25)' }); for (const r of ribs) curve(c, r, shade(bot, -0.3), 0.01, { alpha: 0.5 }); } };
  };
  const layers = [];
  const third = Math.ceil(blades.length / 3);
  if (v === 2) {
    // Samenstände: dünne Halme mit weizenartigen Ähren (Körner wechselständig)
    const stalks = [[-0.06, 102, 0.5, 0.2], [0.04, 82, 0.6, -0.18], [0.1, 68, 0.44, -0.3], [-0.12, 114, 0.4, 0.3]];
    const sShapes = [], heads = [];
    for (const [x, deg, L, bend] of stalks) {
      const cl = centerline(x, 0.0, deg * Math.PI / 180, L, bend, { p: 1.4, n: 12 });
      sShapes.push(strand(cl, 0.03, 0.018, { every: 2 }));
      const hc = centerline(...along(cl, 1.0).slice(0, 2), along(cl, 1.0)[2], 0.26, bend * 0.3, { n: 8 });
      sShapes.push(strand(hc, 0.02, 0.008, { every: 2 }));
      heads.push(hc);
      for (let k = 0; k < 5; k++) for (const side of [-1, 1]) {
        const [px, py, ang] = along(hc, 0.08 + k * 0.17 + (side < 0 ? 0.08 : 0));
        sShapes.push(leaf(px, py, ang + side * 0.62, 0.095 - k * 0.008, 0.04, { fat: 0.5, n: 6 }));
      }
      sShapes.push(leaf(...along(hc, 0.98).slice(0, 2), along(hc, 0.98)[2], 0.06, 0.03, { fat: 0.5, n: 6 }));
    }
    layers.push(mk(blades.slice(0, third), '#86a63a', '#58782a'));
    layers.push({ shapes: sShapes, fill: { top: '#e2cb7c', bottom: '#8f8c3e' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(50,40,0,.3)', light: 'rgba(255,255,220,.3)' }); for (const hc of heads) curve(c, hc.map((p) => [p[0], p[1]]), '#7a6a2a', 0.008, { alpha: 0.5 }); } });
    layers.push(mk(blades.slice(third), '#8cb43c', '#5f8a30'));
  } else {
    layers.push(mk(blades.slice(0, third), '#6c9a38', '#3f6a2a'));
    layers.push(mk(blades.slice(third, third * 2), '#86b246', '#4f7e30'));
    layers.push(mk(blades.slice(third * 2), '#a8cf58', '#69973a'));
  }
  return spec('grass_tuft', 'Grasbüschel', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'plant', variant: v + 1, variants: 3 }, { h: opts.h ?? 0.5, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Busch ~1 m: runde, wollige Laubmasse in drei Grüntönen mit abstehenden Blättchen
export function bush(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 97);
  const lumps = [[-0.42, 0.42, 0.34, 0.3, 0], [0.4, 0.4, 0.36, 0.3, 0], [0.0, 0.52, 0.5, 0.42, 0.3], [-0.22, 0.7, 0.32, 0.26, 0.6], [0.22, 0.68, 0.34, 0.26, 0.8], [0.0, 0.34, 0.6, 0.3, 0.1]];
  const layers = [{
    shapes: [limb([[0, 0, 0.14], [0.02, 0.2, 0.1], [0, 0.35, 0.08]], { per: 4 })],
    fill: '#6a4a2e', deco(c, bb) { volume(c, bb); },
  }];
  lumps.forEach(([x, y, rx, ry, d], i) => {
    const sh = cluster(x, y, rx, ry, { bumps: 9, rb: ry * 0.55, seed: i + 3, jit: 0.15, inset: 0.9, core: 0.85 });
    const r2 = rngOf(i + 70, 3);
    const leaves = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + r2() * 0.5;
      const L = leaf(x + Math.cos(a) * rx * 0.82, y + Math.sin(a) * ry * 0.82, a + (r2() - 0.5) * 0.7, 0.19, 0.1, { fat: 0.45 });
      sh.push(L);
    }
    const dots = [];
    for (let k = 0; k < 14; k++) { const a = r2() * TAU, rr = Math.sqrt(r2()) * 0.85; dots.push([x + Math.cos(a) * rx * rr, y + Math.sin(a) * ry * rr, a]); }
    layers.push({
      shapes: sh, fill: { top: mix('#4f9a46', '#8bc75a', d), bottom: mix('#2b6a3a', '#4a9040', d * 0.8) },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(8,40,20,.4)', light: 'rgba(240,255,170,.3)' });
        for (const [dx, dy, a] of dots) { fillPoly(c, leaf(dx, dy, a + 0.4, 0.1, 0.05, { fat: 0.45 }), 'rgba(235,255,170,.4)'); }
      },
    });
  });
  if (opts.flowers) {
    const fl = [[-0.4, 0.62], [0.1, 0.9], [0.45, 0.62], [-0.12, 0.5], [0.3, 0.3]];
    layers.push({
      shapes: fl.map(([x, y]) => blob(x, y, 0.075, 0.075, 0, 14)), fill: '#fff4d8',
      deco(c) { for (const [x, y] of fl) fillPoly(c, blob(x, y, 0.028, 0.028, 0, 8), '#f2b73c', 1); },
    });
  }
  return spec('bush', 'Busch', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'plant' }, { h: opts.h ?? 1.0, floor: 0 });
}

// ------------------------------------------------------------------------------------------------
// Schilf ~1,5 m: schlanke Halme mit langen überhängenden Blättern und federigen, hängenden Rispen
export function reeds(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 101);
  const stems = [
    [-0.42, 98, 1.15, 0.16, false], [0.42, 80, 1.2, -0.2, false], [-0.22, 104, 1.34, 0.2, true], [0.2, 78, 1.36, -0.22, true], [0.0, 92, 1.5, 0.06, true],
    [-0.08, 100, 1.0, 0.1, false], [0.1, 84, 0.95, -0.1, false],
  ];
  const layers = [];
  const bladeLayer = (list, top, bot) => ({
    shapes: list, fill: { top, bottom: bot }, deco(c, bb) { volume(c, bb, { dark: 'rgba(30,50,10,.3)', light: 'rgba(255,255,200,.25)' }); },
  });
  const mkBlades = (xs) => {
    const out = [];
    for (const [x, deg, H, bend] of xs) {
      for (let k = 0; k < 2; k++) {
        const s = 0.1 + k * 0.24, side = (k + (x > 0 ? 1 : 0)) % 2 ? 1 : -1;
        const px = x + bend * s * 0.4, py = H * s;
        const a = Math.PI / 2 - side * (0.5 + rng() * 0.25);
        out.push(leaf(px, py, a, 0.8 + rng() * 0.2, 0.07, { fat: 0.25, curve: side * 0.5, baseW: 0.3, n: 10 }));
      }
    }
    return out;
  };
  layers.push(bladeLayer(mkBlades(stems.slice(0, 4)), '#7ea447', '#4a6e2c'));
  const ground = [];
  for (let k = 0; k < 7; k++) { const side = k % 2 ? 1 : -1, x = (k - 3) * 0.08; ground.push(leaf(x, 0, Math.PI / 2 - side * (0.25 + (k % 4) * 0.12), 0.8 + (k % 3) * 0.12, 0.07, { fat: 0.2, curve: side * 0.5, baseW: 0.4, n: 10 })); }
  layers.push(bladeLayer(ground, '#8db54e', '#52792f'));
  const stemShapes = [], plumes = [];
  for (const [x, deg, H, bend, hasPlume] of stems) {
    const cl = centerline(x - bend * 0.3, 0, deg * Math.PI / 180, H, bend * 1.4, { p: 1.3, n: 16 });
    stemShapes.push(strand(cl, 0.05, 0.03, { every: 2 }));
    if (hasPlume) plumes.push(cl);
  }
  layers.push({
    shapes: stemShapes, fill: { top: '#d9d28a', bottom: '#97a04c' },
    deco(c, bb) { volume(c, bb, { dark: 'rgba(40,40,5,.3)', light: 'rgba(255,255,220,.35)' }); },
  });
  layers.push(bladeLayer(mkBlades(stems.slice(4)), '#8fb855', '#587f30'));
  plumes.forEach((cl) => {
    const [tx, ty, ta] = along(cl, 1.0);
    const dir = ta > Math.PI / 2 ? 1 : -1;
    const pc = centerline(tx, ty - 0.02, ta, 0.5, dir * 1.1, { p: 1.3, n: 12 });
    const sh = [strand(pc, 0.06, 0.02, { every: 2 })];
    for (let k = 0; k < 11; k++) {
      for (const side of [-1, 1]) {
        const [px, py, ang] = along(pc, 0.06 + k * 0.085 + (side < 0 ? 0.04 : 0));
        const lk = Math.sin(Math.PI * (0.25 + 0.7 * (k / 11))) ;
        sh.push(leaf(px, py, ang + side * 0.6, 0.2 * (0.45 + 0.55 * lk), 0.052, { fat: 0.4, curve: -side * 0.12 }));
      }
    }
    layers.push({
      shapes: sh, fill: { top: '#c8ad92', bottom: '#8a6a5c' },
      deco(c, bb) { volume(c, bb, { dark: 'rgba(50,20,15,.35)', light: 'rgba(255,245,225,.45)' }); curve(c, pc.map((p) => [p[0], p[1]]), '#5a3a2c', 0.014, { alpha: 0.6 }); },
    });
  });
  return spec('reeds', 'Schilf', { body: { z: 1, layers } },
    { base: [0, 0], top: { rel: [0.5, 1] } }, { kind: 'plant' }, { h: opts.h ?? 1.5, floor: 0 });
}
