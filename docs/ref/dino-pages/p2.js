// Station 2: Jura-Wald – „Riesen des Jura“
// Brachiosaurus (Schieber „Halslänge“), Stegosaurus (Lasche „SCHWING!“), Allosaurus hinter dem Baumstamm, versteckter Säuger Castorocauda am Fluss.
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, pebbles, grassTufts, blotches, speckles, INK, RED } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt } from '../engine/popup.js';
import { lerp, clamp, smooth, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight, strata } from './common.js';
import { limb, blob } from '../art/dsl.js';
import { volume } from '../art/paint.js';
import { beads, strokes, mix, rngOf, spline } from '../art/props/_e_kit.js';
import { fxRate, softPlane, paintMist, paintShaft, Threads, LeafPool, waveStripPart, treelinePoly, addBlink, updateBlink, partPoint, modelPoint, swayPop, ramp } from './kit234.js';

const IDX = 2;

// ------------------------------------------------------------------ eigene Kulissen
// mächtiger Nadelbaum mit dickem Stamm (Versteck des Allosaurus), ~5,3 m hoch
function heroTreePart(seed = 4) {
  const rng = rngOf(seed, 7);
  const tk = [[0, 0, 1.6], [0, 0.45, 1.05], [0.03, 1.8, 0.8], [0, 3.3, 0.6], [0.02, 4.6, 0.4], [0, 5.3, 0.2]];
  const S = spline(tk, 12);
  const prof = (y) => { for (let i = 0; i < S.length - 1; i++) { const a = S[i], b = S[i + 1]; if (y >= a[1] && y <= b[1]) { const t = (y - a[1]) / (b[1] - a[1] || 1); return { x: a[0] + (b[0] - a[0]) * t, w: a[2] + (b[2] - a[2]) * t }; } } return { x: 0, w: 0.2 }; };
  const tiers = [[3.25, 1.0, -0.2, 0.28], [3.8, 1.4, -0.02, 0.32], [4.35, 1.5, 0.12, 0.34], [4.8, 1.2, 0.2, 0.3], [5.15, 0.72, 0.26, 0.26]];
  const bc = (y, L, lift, side) => { const x0 = prof(y).x + side * 0.12; return [[x0, y, 0.22], [x0 + side * L * 0.32, y + 0.06 + lift * 0.2, 0.17], [x0 + side * L * 0.66, y + lift * 0.62, 0.12], [x0 + side * L, y + lift, 0.09]]; };
  const layers = [];
  const back = [];
  for (const [y, L, lift, th] of tiers) for (const side of [-1, 1]) { const c = bc(y + 0.15, L * 0.7, lift * 0.8, side); back.push(...beads(c.map((p, i) => [p[0], p[1] + 0.1, th * (0.85 + i * 0.05)]), { per: 4, rng, jit: 0.1, sy: 0.95 })); }
  layers.push({ shapes: back, fill: { top: '#2f6f4c', bottom: '#1e4a39' }, deco(c, bb) { volume(c, bb); } });
  layers.push({
    shapes: [limb(tk, { per: 10 })], fill: { stops: [[0, '#4a3626'], [0.55, '#8a6c4e'], [1, '#6f563f']], dir: 'v' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(25,14,6,.3)', light: 'rgba(255,230,190,.14)' });
      const r = rngOf(9, 2), list = [];
      for (let i = 0; i < 46; i++) { const y = 0.3 + r() * 4.9, p = prof(y), x = p.x + (r() - 0.5) * p.w * 0.85; list.push([x, y, x + (r() - 0.5) * 0.05, y - 0.3 - r() * 0.45]); }
      strokes(c, list, '#2b1d12', 0.035, 0.34);
      const rings = []; for (let y = 0.6; y < 5; y += 0.42) { const p = prof(y), hw = p.w * 0.46; rings.push([p.x - hw, y + 0.03, p.x + hw, y - 0.03]); }
      strokes(c, rings, '#2b1d12', 0.04, 0.4);
      const lite = []; for (let y = 0.3; y < 4.9; y += 0.5) { const p = prof(y), p2 = prof(y + 0.5); lite.push([p.x - p.w * 0.32, y, p2.x - p2.w * 0.32, y + 0.5]); }
      strokes(c, lite, '#d3b88d', 0.07, 0.3);
    },
  });
  const limbs = [];
  for (const [y, L, lift] of tiers) for (const side of [-1, 1]) limbs.push(limb(bc(y, L, lift, side), { per: 6 }));
  layers.push({ shapes: limbs, fill: { top: '#6b5238', bottom: '#4a3826' }, deco(c, bb) { volume(c, bb); } });
  tiers.forEach(([y, L, lift, th], ti) => {
    const shapes = [], dots = [], t = ti / (tiers.length - 1);
    for (const side of [-1, 1]) {
      const c0 = bc(y, L, lift, side);
      const bx = c0.map((p, i) => [p[0], p[1] + 0.05, i === 0 ? 0.01 : th * (0.55 + i * 0.17)]); bx[0] = [c0[1][0] - side * L * 0.05, c0[1][1], th * 0.55];
      shapes.push(...beads(bx, { per: 4, rng, jit: 0.1, sy: 0.92 }));
      for (const s of spline(bx, 3)) dots.push([s[0] + (rng() - 0.5) * s[2], s[1] + (rng() - 0.5) * s[2] * 0.8]);
    }
    layers.push({
      shapes, fill: { top: mix('#4e9a58', '#93cf68', t * 0.55), bottom: mix('#2b6b49', '#4e9a58', t * 0.5) },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(10,40,20,.35)', light: 'rgba(235,255,170,.25)' });
        const r = rngOf(ti + 20, 4), A = [], B = [];
        for (const [x, yy] of dots) for (let k = 0; k < 2; k++) { const a = Math.PI / 2 + (r() - 0.5) * 2.4, l = 0.2 * (0.6 + r() * 0.7); (r() < 0.5 ? A : B).push([x, yy, x + Math.cos(a) * l, yy + Math.sin(a) * l]); }
        strokes(c, A, '#1c4a32', 0.026, 0.45); strokes(c, B, '#b6e47e', 0.026, 0.5);
      },
    });
  });
  return { layers };
}

// Papierstreifen für den Fluss (Welle, heller Saum)
const riverStrip = (w, h, ph, seed, top, bottom) => waveStripPart(w, h, { top, bottom, wave: 0.09, freq: w / 1.5, phase: ph, seed, scallop: true, step: 0.09, lines: true, foam: true, glint: '#d8f6f0' });

// Abdruck eines Sauropodenfußes (rund, vier Zehen) auf dem Seitenboden
function sauropodPrint(m, x, z, s, rot, color) {
  const { ctx } = m; ctx.save(); ctx.translate(m.x(x), m.z(z)); ctx.rotate(rot); ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(0, 0, 0.42 * s * m.S, 0.3 * s * m.S, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < 4; i++) { const a = -0.9 + i * 0.6; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 0.5 * s * m.S, Math.sin(a) * 0.4 * s * m.S, 0.11 * s * m.S, 0.09 * s * m.S, a, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Fluss (gemalt): mäandert quer über die rechte Seite
const RIVER = [[0.2, 2.45], [2.2, 2.2], [4.6, 2.55], [7.0, 2.05], [9.6, 2.35], [11.8, 2.0]];
function paintRiver(m) {
  const { ctx } = m;
  const path = () => { ctx.beginPath(); RIVER.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); };
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // Ufer: Sand/feuchte Erde
  ctx.strokeStyle = 'rgba(214,205,150,.9)'; ctx.lineWidth = 1.95 * m.S; path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(168,150,98,.55)'; ctx.lineWidth = 1.7 * m.S; path(); ctx.stroke();
  ctx.strokeStyle = '#2e8aa4'; ctx.lineWidth = 1.45 * m.S; path(); ctx.stroke();
  ctx.strokeStyle = '#4fb4c0'; ctx.lineWidth = 1.0 * m.S; path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,245,240,.55)'; ctx.lineWidth = 0.4 * m.S; path(); ctx.stroke();
  // Kräuselstriche
  const r = mulberry32(31); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.03 * m.S;
  for (let i = 0; i < 40; i++) {
    const t = r() * (RIVER.length - 1), k = Math.floor(t), u = t - k, a = RIVER[k], b = RIVER[Math.min(RIVER.length - 1, k + 1)];
    const x = lerp(a[0], b[0], u), z = lerp(a[1], b[1], u) + (r() - 0.5) * 0.7; const [X, Y] = m.pt(x, z);
    ctx.beginPath(); ctx.moveTo(X - 0.22 * m.S, Y); ctx.quadraticCurveTo(X - 0.1 * m.S, Y - 0.07 * m.S, X, Y); ctx.quadraticCurveTo(X + 0.1 * m.S, Y + 0.07 * m.S, X + 0.22 * m.S, Y); ctx.stroke();
  }
  ctx.restore();
}

function mossGround(m, rect, seed) {
  blotches(m, { x0: rect.x0, x1: rect.x1, z0: -1.6, z1: 4.2, n: 22, rmin: 0.6, rmax: 1.8, colors: ['rgba(30,90,40,.14)', 'rgba(210,240,150,.12)', 'rgba(20,70,50,.12)'], seed });
  grassTufts(m, { x0: rect.x0 + 0.5, x1: rect.x1 - 0.5, z0: -0.6, z1: 3.8, n: 26, seed: seed + 3, color: '#2f6f3a', h: 0.32, blades: 5 });
  speckles(m, { x0: rect.x0, x1: rect.x1, z0: -1.5, z1: 4.0, n: 160, color: 'rgba(240,255,200,.18)', size: 0.02, seed: seed + 5 });
}

export default {
  id: 'jura-wald',
  mood: mood({ key: '#fff1d2', keyI: 2.25, sky: '#e2f6e9', gnd: '#4d7046', hemiI: 1.9, pos: [-12, 21, 9], rim: 0.18 }),
  motes: { colors: [[0.86, 0.97, 0.88], [0.95, 1, 0.92], [0.78, 0.93, 0.85]], size: 0.15, alpha: 0.3, dy: 0.04, dx: 0.07, dz: 0.012, tw: 0.8, density: 0.95 },
  atmo: 'jura-wald',
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        ground: { back: '#8cbe73', front: '#5a9a55' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 31,
        draw(ctx, m) {
          mossGround(m, { x0: -12, x1: 0 }, 5);
          pebbles(m, { x0: -5.2, x1: -0.8, z0: 0.2, z1: 3.0, n: 7, seed: 12, colors: ['#9cae86', '#8a9a76', '#b3bd98'] });
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
        },
      },
      R: {
        ground: { back: '#88bb71', front: '#5b9b57' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 32,
        draw(ctx, m) {
          mossGround(m, { x0: 0, x1: 12 }, 9);
          // Spur des Riesen: runde Fußabdrücke
          const pts = [[11.1, 1.0], [10.0, 0.55], [8.9, 1.0], [7.8, 0.6]];
          pts.forEach(([x, z], i) => sauropodPrint(m, x, z, 0.8, i % 2 ? 0.2 : -0.15, 'rgba(60,70,30,.32)'));
          paintRiver(m);
          pebbles(m, { x0: 1, x1: 11, z0: 0.3, z1: 1.6, n: 7, seed: 16, colors: ['#9cae86', '#8a9a76', '#b3bd98'] });
        },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const SKY_W = 11.55, CX = { L: -5.975, R: 5.975 };
    const keys = ['L', 'R'];
    // ------------------------------------------------------------ Kulissenebenen (Himmel, Hügel, Waldrand)
    for (const s of keys) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-SKY_W / 2, SKY_W / 2, 5.0, { fill: { top: '#86cbe6', bottom: '#eaf7e6' }, wave: 0.28, freq: 3.0, phase: 0.6 + k * 1.7, seed: 3 + k, deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,248,200,.5)', cx: s === 'L' ? 0.2 : 0.8, cy: 0.62, r: 0.75 }); dither(c, bb, '#fff', { n: 110, alpha: 0.12, size: 0.04, seed: 5 + k }); } }), { x: CX[s], z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0.0, ppu: 70, border: 0.04 });
      ctx.flat(panelPart(-SKY_W / 2, SKY_W / 2, 1.9, { fill: { top: '#79b9a0', bottom: '#5aa088' }, wave: 0.42, freq: s === 'L' ? 2.4 : 2.0, phase: 1.2 + k, seed: 6 + k, deco: (c, bb) => { dither(c, bb, '#fff', { n: 70, alpha: 0.12, size: 0.05, seed: 9 }); dither(c, bb, '#1d4d44', { n: 90, alpha: 0.12, seed: 8 }); } }), { x: CX[s], z: -3.45, lean: -0.02, name: 'hills' + s, delay: 0.04, ppu: 70 });
      ctx.flat({ layers: [{ shapes: [treelinePoly(-SKY_W / 2, SKY_W / 2, 0, 2.3, { seed: 11 + k * 5, tooth: 0.72, base: 0.46 })], fill: { top: '#2d7852', bottom: '#1d563f' }, deco: (c, bb) => { dither(c, bb, '#b8e8a0', { n: 80, alpha: 0.12, size: 0.04, seed: 4 }); dither(c, bb, '#0d2c22', { n: 90, alpha: 0.18, seed: 6 }); } }] }, { x: CX[s], z: -2.95, name: 'trees' + s, delay: 0.08, ppu: 70 });
    }
    yield;
    // Wolken, Vulkan mit Rauch
    const cloud = ctx.prop('cloud_a', { x: 3.6, y: 3.7, z: -3.85, len: 2.6, delay: 0.2, cast: false });
    const cloud2 = ctx.prop('cloud_b', { x: -3.2, y: 3.9, z: -3.9, len: 2.3, delay: 0.25, cast: false });
    const volc = ctx.prop('volcano', { x: -9.1, z: -3.62, h: 4.5, delay: 0.1 });
    const crater = volc.fig.anchors.crater || volc.fig.anchors.smoke || new THREE.Vector3(0, 3.3, 0);
    const craterX = -9.1 + volc.fig.group.position.x + crater.x, craterY = crater.y;
    yield;
    // ------------------------------------------------------------ Pflanzen hinten und Mitte
    ctx.prop('araucaria', { x: -11.9, z: -3.1, h: 5.3, delay: 0.2 });
    ctx.prop('araucaria', { x: -3.4, z: -3.2, h: 5.2, delay: 0.22, variant: { seed: 2 } });
    ctx.prop('araucaria', { x: 1.9, z: -3.3, h: 5.4, delay: 0.24, variant: { seed: 3 } });
    const treeF = ctx.prop('araucaria', { x: 6.9, z: -2.4, h: 5.3, delay: 0.26, variant: { seed: 1 } });
    ctx.prop('araucaria', { x: 11.0, z: -3.0, h: 5.2, delay: 0.28, variant: { seed: 2 } });
    ctx.prop('conifer_round', { x: 9.7, z: -1.9, h: 3.7, delay: 0.3, variant: { seed: 2 } });
    ctx.prop('tree_fern', { x: -10.6, z: -1.6, h: 2.8, delay: 0.3 });
    ctx.prop('tree_fern', { x: 10.5, z: -0.2, h: 2.7, delay: 0.32, facing: -1 });
    ctx.prop('cycad', { x: -1.7, z: -1.9, h: 1.5, delay: 0.32 });
    ctx.prop('cycad', { x: 10.9, z: 1.0, h: 1.4, delay: 0.34, facing: -1 });
    ctx.prop('horsetail', { x: 1.3, z: 0.7, h: 1.3, delay: 0.34 });
    ctx.prop('horsetail', { x: -1.2, z: -0.7, h: 1.2, delay: 0.36, facing: -1 });
    ctx.prop('fern_ground', { x: 2.3, z: 1.35, len: 1.5, delay: 0.38, variant: { seed: 2 } });
    ctx.prop('fern_ground', { x: -1.6, z: 1.55, len: 1.4, delay: 0.4, variant: { seed: 3 } });
    ctx.prop('fern_ground', { x: 8.6, z: 0.8, len: 1.3, delay: 0.4 });
    ctx.prop('horsetail', { x: 6.2, z: 1.1, h: 1.0, delay: 0.4, facing: -1 });
    ctx.prop('fern_ground', { x: 4.6, z: 1.15, len: 1.2, delay: 0.42, variant: { seed: 3 } });
    ctx.prop('boulder', { x: 0.9, z: 2.0, len: 1.0, delay: 0.42, variant: { seed: 3 } });
    // Dunst: halbtransparente Bänder zwischen den Ebenen
    const mist = [];
    for (const [s, x, z, y, w, h, op] of [['L', -5.9, -2.45, 0.5, 11.2, 1.7, 0.6], ['R', 5.9, -2.45, 0.5, 11.2, 1.7, 0.6], ['L', -6.0, -3.55, 1.9, 11.6, 1.8, 0.4], ['R', 5.9, -3.55, 1.9, 11.6, 1.8, 0.4]]) {
      mist.push(Object.assign(softPlane(ctx, { x, z, y, w, h, res: 26, draw: (g, W, H) => paintMist(g, W, H, { color: [226, 248, 236], alpha: 0.7, seed: x > 0 ? 3 : 8, blobs: 8 }), opacity: op, delay: 0.3, name: 'mist' }), { bx: x }));
    }
    // Lichtstrahlen durch die Kronen (additiv)
    const shafts = [];
    for (const [x, ang, w] of [[-4.6, -0.42, 1.2], [2.6, -0.42, 1.5], [8.4, -0.42, 1.1]]) {
      const sp = softPlane(ctx, { x, z: -2.0, y: 0, w, h: 5.2, res: 22, draw: (g, W, H) => paintShaft(g, W, H, { color: [255, 246, 205], alpha: 0.6 }), opacity: 0.2, additive: true, delay: 0.4, name: 'shaft', order: 4, tilt: ang });
      shafts.push(sp);
    }
    yield;

    // ------------------------------------------------------------ Baumstamm + Allosaurus
    const allo = ctx.stand('allosaurus', { x: -6.55, z: -2.0, len: 5.2, facing: 1, delay: 0.4 });
    const hero = ctx.flat(heroTreePart(), { x: -6.3, z: -1.35, name: 'hero', delay: 0.42, ppu: 100, border: 0.045, thickness: 0.03 });
    allo.baseX = allo.popup.group.position.x;
    allo.onWake = (a) => { a.tw.add(1.1, (k) => { poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); a.fig.root.rotation.z = Math.sin(k * Math.PI) * 0.05; }, { done: () => { poseAmt(a.fig, 'jaw', 0); a.fig.root.rotation.z = retreatTilt; } }); app.audio.voice('allosaurus'); };
    let retreatTilt = 0;

    const stego = ctx.stand('stegosaurus', { x: -3.0, z: 0.2, len: 4.4, facing: 1, delay: 0.46 });
    stego.onWake = (a) => { a.tw.add(1.0, (k) => { a.hop = Math.sin(k * Math.PI) * 0.12; swingTail = Math.sin(k * Math.PI * 2) * 0.22; }, { done: () => { a.hop = 0; swingTail = 0; } }); app.audio.voice('stegosaurus'); };
    let swingTail = 0;
    yield;

    // ------------------------------------------------------------ Brachiosaurus
    const brachio = ctx.stand('brachiosaurus', { x: 4.3, z: -0.9, len: 6.8, facing: 1, delay: 0.34 });
    const NECK0 = -1.15, NECK1 = 0.3, V0 = 0.5;
    let neckV = V0, rustle = 0, atMax = false, lastV = V0, rustleSfx = 0;
    brachio.onWake = (a) => { a.tw.add(1.2, (k) => { a.hop = Math.sin(k * Math.PI) * 0.1; }, { done: () => { a.hop = 0; } }); app.audio.voice('brachiosaurus'); };
    const blinks = [addBlink(brachio.fig, 'neck', brachio.fig.spec.anchors.eye, 0.2, '#9e90b4'), null];
    yield;

    // ------------------------------------------------------------ Fluss: Papierstreifen
    const rv = [];
    [[2.42, 0.3, 0.5, '#2f93ac', '#1d6a8c', 0.0, 3, 2.0], [2.72, 0.27, 2.2, '#5fcad0', '#2f9db8', 1.0, 5, 1.2]].forEach(([z, h, ph, c0, c1, dl, sd, sp], i) => {
      const p = ctx.flat(riverStrip(11.2, h, ph, sd, c0, c1), { x: 6.0, z, name: 'river' + i, delay: 0.42 + dl * 0.05, ppu: 70, border: 0.025, thickness: 0.015 });
      p.sp = sp; p.ph = ph; rv.push(p);
    });
    // Uferpflanzen + versteckter Säuger
    const cast = ctx.stand('castorocauda', { x: 9.5, z: 1.45, len: 1.05, facing: 1, delay: 0.5, hidden: true, hint: false, hitPad: 0.25 });
    const bush = ctx.prop('bush', { x: 10.2, z: 1.68, len: 1.5, delay: 0.52, variant: { seed: 2 } });
    cast.cover = bush;
    cast.onWake = (a) => {
      a.tw.add(0.9, (k) => { a.hop = Math.sin(k * Math.PI) * 0.3; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); poseAmt(a.fig, 'tail', Math.sin(k * Math.PI * 3)); bush.pivot.rotation.z = Math.sin(k * Math.PI * 4) * 0.05 * (1 - k); }, { done: () => { a.hop = 0; poseAmt(a.fig, 'jaw', 0); poseAmt(a.fig, 'tail', 0); bush.pivot.rotation.z = 0; } });
      app.audio.voice('castorocauda');
    };
    ctx.prop('reeds', { x: 8.3, z: 1.35, len: 1.5, delay: 0.5 });
    ctx.prop('reeds', { x: 1.1, z: 1.7, len: 1.4, delay: 0.52, facing: -1 });
    yield;

    // ------------------------------------------------------------ Blätter + Aufhänger der Wirkungen
    const leaves = new LeafPool(R, { n: 16, size: 0.22 });
    const tmp = { x: 0, y: 0 };

    // ------------------------------------------------------------ Schieber „Halslänge“
    const neckCtl = ctx.control('R', { id: 'hals', label: 'Halslänge', a: [3.4, 3.6], b: [9.4, 3.6], size: [2.7, 1.05], color: '#2f8f5a', value: V0, springBack: false, hold: true, ticks: 4 });
    neckCtl.on((v) => { neckV = v; });
    neckCtl.onGrab = () => app.audio.sfx('grab');
    neckCtl.onTick = (v) => { app.audio.sfx('slide', { v }); };
    neckCtl.onRelease = () => app.audio.sfx('snap');

    // ------------------------------------------------------------ Lasche „SCHWING!“
    const swingCtl = ctx.control('L', { id: 'schwing', label: 'SCHWING!', a: [-4.1, 3.6], b: [-1.5, 3.6], size: [2.3, 1.0], color: '#c8452c', value: 0, springBack: true });
    let swingV = 0, lastZero = 0, stomped = 0;
    swingCtl.on((v) => { swingV = v; });
    swingCtl.onGrab = () => app.audio.sfx('grab');
    swingCtl.onRelease = () => app.audio.sfx('snap');
    const tailAng = (v) => { const s = Math.sin(clamp(v) * Math.PI * 3); return s >= 0 ? 0.36 * s : 0.5 * s; };

    // ------------------------------------------------------------ pro Frame
    const rt = { x: 0, y: 0 }; let smokeT = 0, leafT = 0, shakeCool = 0;
    ctx.onUpdate((dt, t) => {
      if (!ctx.spread.active) return;
      const rate = fxRate(app);
      // --- Brachiosaurus-Hals aus dem Schieber
      const idle = neckCtl.dragging ? 0 : 0.02 * Math.sin(t * 0.55) + 0.012 * Math.sin(t * 1.3 + 1);
      const ang = lerp(NECK0, NECK1, neckV) + idle;
      brachio.fig.rotatePart('neck', ang);
      const dv = Math.abs(neckV - lastV); lastV = neckV;
      rustle = Math.min(1, rustle + dv * 7); rustle = Math.max(0, rustle - dt * 0.9);
      partPoint(brachio, 'neck', 11.04, 13.28, ang, rt);       // Maul in Seitenkoordinaten
      const crown = rt.y > 3.1 && rt.x > 5.2 && rt.x < 8.8;
      const rus = crown ? rustle : rustle * 0.15;
      // Baumkrone und Büsche rascheln
      treeF.pivot.rotation.z = rus * 0.035 * Math.sin(t * 17) + 0.004 * Math.sin(t * 0.8);
      leafT += dt * (rus > 0.05 ? rate * (3 + rus * 18) : 0);
      while (leafT > 1) { leafT -= 1; leaves.emit(rt.x + (Math.random() - 0.5) * 1.6, clamp(rt.y + 0.3 + Math.random() * 0.8, 2.4, 5.2), -2.3 + Math.random() * 1.2, 0.2); }
      rustleSfx -= dt; if (rus > 0.12 && rustleSfx <= 0) { rustleSfx = 0.28; app.audio.sfx('rustle', { v: rus }); }
      if (neckV > 0.985 && !atMax) { atMax = true; app.audio.voice('brachiosaurus'); app.audio.sfx('horn'); rustle = 1; for (let i = 0; i < 6; i++) leaves.emit(rt.x + (Math.random() - 0.5) * 1.8, 4.6 + Math.random() * 0.6, -2.3 + Math.random() * 1.2, 0.3); }
      if (neckV < 0.9) atMax = false;
      leaves.update(dt);
      for (const b of blinks) updateBlink(b, dt);

      // --- Stegosaurus-Schwanz + Allosaurus weicht zurück
      const idleTail = swingCtl.dragging || swingV > 0.01 ? 0 : 0.05 * Math.sin(t * 1.1) * Math.max(0, Math.sin(t * 0.37));
      const sa = tailAng(swingV) + swingTail + idleTail;
      stego.fig.rotatePart('tail', sa);
      const sz = Math.sin(clamp(swingV) * Math.PI * 3);
      if ((sz > 0) !== (lastZero > 0) && swingV > 0.02) { app.audio.sfx('swing', { v: swingV }); }
      lastZero = sz;
      if (swingV > 0.4 && swingV < 0.6 && stomped < 1) { stomped = 1; app.audio.sfx('stomp'); stego.hop = 0.07; }
      if (swingV < 0.1) stomped = 0;
      stego.hop = Math.max(0, stego.hop - dt * 0.8);
      const back = smooth(ramp(swingV, 0.05, 0.4));
      allo.popup.group.position.x = allo.baseX - 0.95 * back;
      retreatTilt = 0.1 * back; if (!allo.tw.list.length) allo.fig.root.rotation.z = retreatTilt;
      if (!allo.tw.list.length) poseAmt(allo.fig, 'jaw', back > 0.05 ? 0.35 * back : Math.max(0, Math.sin(t * 0.7) - 0.9) * 2);
      // Staub, wenn der Schwanz auf den Boden schlägt
      if (sa > 0.3 && Math.random() < dt * 14 * rate) {
        partPoint(stego, 'tail', -5.1, 1.92, sa, tmp); const w = ctx.world(tmp.x, 0.1, 0.4);
        app.fx.dust.emit({ x: w.x, y: w.y, z: w.z + 0.2, vx: -0.4 - Math.random() * 0.4, vy: 0.3 + Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.4, life: 0.8, size: 0.3, alpha: 0.45, color: [0.62, 0.7, 0.45], drag: 1.6, grow: 2 });
      }

      // --- Mikroanimation: Wolken, Dunst, Lichtstrahlen, Fluss
      cloud.group.position.x = 3.6 + Math.sin(t * 0.05) * 1.5; cloud2.group.position.x = -3.2 + Math.sin(t * 0.04 + 1) * 1.3;
      for (let i = 0; i < mist.length; i++) mist[i].pop.group.position.x = mist[i].bx + Math.sin(t * 0.07 + i * 1.7) * 0.5;
      for (let i = 0; i < shafts.length; i++) shafts[i].mat.opacity = 0.17 + 0.07 * Math.sin(t * 0.35 + i * 2.1);
      for (const p of rv) { p.cut.mesh.position.x = Math.sin(t * 0.7 + p.ph) * 0.12; p.cut.mesh.scale.y = 1 + 0.12 * Math.sin(t * 1.3 + p.ph * 2); }
      poseAmt(volc.fig, 'smoke', 0.5 + 0.5 * Math.sin(t * 0.4));
      // Vulkanrauch
      smokeT += dt * 3.2 * rate;
      while (smokeT > 1) {
        smokeT -= 1; const w = ctx.world(craterX + (Math.random() - 0.5) * 0.2, craterY + 0.05, -3.4);
        app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0.12 + Math.random() * 0.1, vy: 0.35 + Math.random() * 0.2, vz: 0, life: 4.0, size: 0.42, alpha: 0.4, color: [0.52, 0.5, 0.52], drag: 0.25, grow: 3.2 });
      }
    });
    ctx.spread.p2 = { neckCtl, swingCtl, leaves };
  },
  onDeactivate(ctx) {
    const s = ctx.spread.p2; if (!s) return;
    s.leaves.clear(); s.neckCtl.setValue(0.5, { snap: true }); s.swingCtl.setValue(0, { snap: true });
  },
};
