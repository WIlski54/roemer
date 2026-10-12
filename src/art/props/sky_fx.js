// Gruppe E – Himmel, Wasser, Effekt-Requisiten: Wolken, Sonne, Asteroid, Wellenband, Fußabdrücke.
import { volume } from '../paint.js';
import {
  blob, limb, poly, TAU, rngOf, variantOf, mix, shade, leaf, rock, ribbon, wavy, cluster, clipBelow, clipAxis, spline,
  fillPoly, fillPolys, fillGrad, strokePoly, curve, strokes, finish, pathPoly, centerline, along, strand,
} from './_e_kit.js';

const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);

function radial(c, x, y, r0, r1, stops) {
  const [X, Y] = c.tf(x, y);
  const g = c.ctx.createRadialGradient(X, Y, r0 * c.S, X, Y, r1 * c.S);
  stops.forEach(([t, col]) => g.addColorStop(t, col));
  return g;
}
function fillRadial(c, pts, x, y, r0, r1, stops, alpha = 1) {
  c.ctx.save(); c.ctx.globalAlpha = alpha; c.ctx.fillStyle = radial(c, x, y, r0, r1, stops); pathPoly(c, pts); c.ctx.fill(); c.ctx.restore();
}
// Mulde: dunkle Vertiefung mit Innenschatten (Licht von links oben -> unten rechts hell)
function depression(c, shapes, { dark, mid, dx = 0.006, dy = -0.006 }) {
  const { ctx, tf } = c;
  fillPolys(c, shapes, dark, 1);
  ctx.save();
  ctx.beginPath();
  for (const p of shapes) { p.forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); }
  ctx.clip('nonzero');
  fillPolys(c, shapes.map((p) => p.map(([x, y]) => [x + dx, y + dy])), mid, 1);
  ctx.restore();
}

// ------------------------------------------------------------------------------------------------
// Wolken ~3 m breit: gewölbt, wollig, flacher Boden; zwei Papierlagen (Schattenlage dahinter). opts.tone 'light'|'dark' (Gewitterwolke)
function cloud(id, name, discs, opts, W) {
  const dark = opts.tone === 'dark' || opts.tone === 'dunkel';
  const cols = dark
    ? { top: '#c4c9dc', bottom: '#8a90aa', back: '#6c7290', line: 'rgba(40,45,75,.6)', arc: 'rgba(60,66,100,.5)', hi: 'rgba(240,242,252,.4)' }
    : { top: '#ffffff', bottom: '#e9f0fc', back: '#bccbea', line: 'rgba(95,115,165,.5)', arc: 'rgba(130,155,215,.5)', hi: 'rgba(255,255,255,.85)' };
  const mkShape = (dx, dy, k) => {
    const sh = [];
    for (const [x, y, r] of discs) {
      sh.push(blob(x * k + dx, y * k + dy, r * k, r * k * 0.93, 0, 28));
      // wollige Nebenkuppen am Rand jeder Kuppel
      for (const a of [0.62, 2.5]) sh.push(blob((x + Math.cos(a) * r * 0.82) * k + dx, (y + Math.sin(a) * r * 0.82) * k + dy, r * k * 0.4, r * k * 0.37, 0, 20));
    }
    sh.push(blob(dx, dy + 0.27 * k, W * 0.33 * k, 0.34 * k, 0, 36));
    const cut = sh.map((p) => clipBelow(p, dy + 0.12)).filter((p) => p.length > 2);
    const n = Math.round(W * 3.2);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; cut.push(blob(dx - W * 0.4 * k + t * W * 0.8 * k, dy + 0.12, 0.17 * k, 0.1 * k, 0, 14)); }
    return cut;
  };
  const layers = [{
    shapes: mkShape(0.07, -0.07, 1.0), fill: { top: cols.back, bottom: shade(cols.back, -0.1) }, stroke: cols.line,
    deco(c, bb) { volume(c, bb, { dark: 'rgba(30,40,80,.2)', light: 'rgba(255,255,255,.1)' }); },
  }, {
    shapes: mkShape(0, 0, 1.0), fill: { top: cols.top, bottom: cols.bottom }, stroke: cols.line,
    deco(c, bb) {
      volume(c, bb, { dark: dark ? 'rgba(30,35,70,.3)' : 'rgba(110,130,190,.22)', light: 'rgba(255,255,255,0)' });
      if (!dark) fillGrad(c, [[bb.x0 - 1, bb.y0 - 1], [bb.x1 + 1, bb.y0 - 1], [bb.x1 + 1, bb.y1 + 1], [bb.x0 - 1, bb.y1 + 1]], 0, bb.y1, 0, bb.y0 + bb.h * 0.45, [[0, 'rgba(255,255,255,.25)'], [1, 'rgba(255,255,255,0)']]);
      for (const [x, y, r] of discs) {
        const arc = [];
        for (let a = 3.5; a <= 5.0; a += 0.15) arc.push([x + Math.cos(a) * r * 0.72, y + Math.sin(a) * r * 0.72]);
        curve(c, arc, cols.arc, 0.028, { alpha: 1 });
        fillPoly(c, blob(x - r * 0.3, y + r * 0.45, r * 0.22, r * 0.11, 0.5, 14), cols.hi);
      }
    },
  }];
  return spec(id, name, { body: { z: 1, layers, grain: 0.22 } }, { base: [0, 0], top: { rel: [0.5, 1] }, center: { rel: [0.5, 0.45] } }, { kind: 'sky', tone: dark ? 'dark' : 'light' }, { w: opts.w ?? 3, baseY: true });
}
export function cloud_a(opts = {}) {
  return cloud('cloud_a', 'Wolke A', [[-1.0, 0.45, 0.46], [-0.35, 0.72, 0.66], [0.5, 0.64, 0.6], [1.12, 0.42, 0.44]], opts, 2.6);
}
export function cloud_b(opts = {}) {
  return cloud('cloud_b', 'Wolke B', [[-1.35, 0.36, 0.34], [-0.85, 0.55, 0.48], [-0.2, 0.76, 0.58], [0.5, 0.62, 0.5], [1.05, 0.48, 0.42], [1.5, 0.3, 0.27]], opts, 3.2);
}

// ------------------------------------------------------------------------------------------------
// Sonnenscheibe ~2 m: Scheibe mit gewelltem Strahlenkranz (lange orange S-Strahlen + kurze gelbe Spitzen)
export function sun_disc(opts = {}) {
  const cx = 0, cy = 1.0, R0 = 0.52;
  const longRays = [], shortRays = [];
  const N = 10;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + 0.1;
    const cl = [];
    for (let k = 0; k <= 8; k++) {
      const t = k / 8, r = R0 - 0.05 + t * (0.5 + 0.05), off = 0.07 * Math.sin(t * 5.6 + i * 0.4) * (0.4 + t);
      const ax = Math.cos(a), ay = Math.sin(a);
      cl.push([cx + ax * r - ay * off, cy + ay * r + ax * off, 0.27 * (1 - t) + 0.01]);
    }
    longRays.push(limb(cl, { per: 4 }));
    const b = a + Math.PI / N;
    shortRays.push(leaf(cx + Math.cos(b) * (R0 - 0.06), cy + Math.sin(b) * (R0 - 0.06), b, 0.36, 0.2, { fat: 0.3 }));
  }
  const layers = [
    { shapes: longRays, fill: { top: '#f9b02a', bottom: '#ee7c1c' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(160,50,10,.3)', light: 'rgba(255,240,150,.25)' }); } },
    { shapes: shortRays, fill: { top: '#ffe170', bottom: '#fbb92e' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(200,100,10,.2)', light: 'rgba(255,255,220,.25)' }); } },
    {
      shapes: [blob(cx, cy, R0, R0, 0, 56)], fill: '#ffd448',
      deco(c, bb) {
        fillRadial(c, blob(cx, cy, R0 + 0.02, R0 + 0.02, 0, 56), cx - 0.1, cy + 0.1, 0.02, R0 * 1.15, [[0, '#fff9c4'], [0.55, '#ffdc54'], [1, '#f9a623']]);
        const ring = []; for (let a = 0; a <= TAU + 0.1; a += 0.15) ring.push([cx + Math.cos(a) * R0 * 0.8, cy + Math.sin(a) * R0 * 0.8]);
        curve(c, ring, 'rgba(240,140,30,.55)', 0.02, { alpha: 1 });
        fillPoly(c, blob(cx - 0.2, cy + 0.2, 0.12, 0.07, 0.6, 14), 'rgba(255,255,255,.55)');
      },
    },
  ];
  return spec('sun_disc', 'Sonnenscheibe', { body: { z: 1, layers, grain: 0.3 } }, { base: [0, 0], top: { rel: [0.5, 1] }, center: [cx, cy] }, { kind: 'sky' }, { h: opts.h ?? 2.0 });
}

// ------------------------------------------------------------------------------------------------
// Asteroid ~2 m: zerklüfteter Felsbrocken, glühende Risse, Krater, heiße Vorderseite
export function asteroid(opts = {}) {
  const rng = rngOf(opts.seed ?? 1, 191);
  const body = poly(rock(0, 1.0, 1.0, 0.92, { seed: 7 + (opts.seed ?? 1), n: 15, rough: 0.3, smooth: 1, flatBottom: false }), 0);
  const layers = [{
    shapes: [body], fill: { top: '#6a5a54', bottom: '#2a201e' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(10,6,6,.4)', light: 'rgba(255,230,210,.18)' });
      const rr = rngOf(opts.seed ?? 1, 193);
      // Facetten
      fillPoly(c, [[-3, 3], [0.2, 3], [-0.1, 1.5], [-0.7, 0.9], [-3, 0.9]], 'rgba(255,225,200,.14)');
      fillPoly(c, [[3, -1], [3, 1.3], [0.4, 1.0], [0.1, -1]], 'rgba(10,5,5,.3)');
      // Krater
      for (const [x, y, r] of [[-0.45, 1.45, 0.24], [0.4, 0.55, 0.19], [0.5, 1.5, 0.13], [-0.55, 0.65, 0.12]]) {
        fillPoly(c, blob(x, y, r, r * 0.8, 0.3, 18), 'rgba(15,8,8,.55)');
        fillPoly(c, blob(x + r * 0.15, y - r * 0.2, r * 0.8, r * 0.55, 0.3, 18), 'rgba(90,70,64,.55)');
        curve(c, [[x - r, y + 0.02], [x - r * 0.4, y + r * 0.75], [x + r * 0.5, y + r * 0.8]], 'rgba(255,230,205,.35)', 0.02, { alpha: 1 });
      }
      // Heißer Schein auf der Vorderseite (rechts unten) und an den Kanten
      fillRadial(c, body, 0.9, 0.45, 0.05, 1.5, [[0, 'rgba(255,170,50,.65)'], [1, 'rgba(255,100,30,0)']]);
      // glühende Risse mit Schein
      const cracks = [];
      const starts = [[-0.1, 1.0], [0.25, 0.8], [-0.35, 1.2], [0.1, 1.3], [-0.2, 0.6]];
      starts.forEach(([sx, sy], i) => {
        const a0 = [0.5, -0.7, 2.6, 1.3, -2.2][i], pts = [[sx, sy]];
        let px = sx, py = sy, a = a0;
        const len = 5 + Math.floor(rr() * 3);
        for (let k = 0; k < len; k++) { a += (rr() - 0.5) * 1.2; const st = 0.16 + rr() * 0.12; px += Math.cos(a) * st; py += Math.sin(a) * st; pts.push([px, py]); }
        cracks.push(pts);
      });
      const tapered = (pts, w) => limb(pts.map((p, i) => [p[0], p[1], w * Math.sin(Math.PI * (0.12 + 0.76 * (i / (pts.length - 1))))]), { per: 3 });
      c.ctx.save(); c.ctx.shadowColor = 'rgba(255,140,40,.9)'; c.ctx.shadowBlur = c.S * 0.1;
      for (const pts of cracks) fillPoly(c, tapered(pts, 0.085), '#ff7a1c');
      c.ctx.restore();
      for (const pts of cracks) fillPoly(c, tapered(pts, 0.045), '#ffc64a');
      for (const pts of cracks) fillPoly(c, tapered(pts, 0.016), '#fff4b8', 0.9);
    },
  }];
  return spec('asteroid', 'Asteroid', { body: { z: 1, layers } }, { base: [0, 0], top: { rel: [0.5, 1] }, center: { rel: [0.5, 0.5] } }, { kind: 'effect' }, { h: opts.h ?? 2.0 });
}

// ------------------------------------------------------------------------------------------------
// Wellenband ~6 m breit: zwei Papierlagen aus echten Kamm-Wellen mit überhängender Welle, Schaumkringel. opts.tone 'light'|'dark'
const WAVE_UNIT = [[0.0, 0.3], [0.18, 0.34], [0.4, 0.5], [0.6, 0.74], [0.78, 0.92], [0.95, 1.0], [1.15, 0.98], [1.32, 0.88], [1.42, 0.72], [1.42, 0.56], [1.36, 0.52], [1.33, 0.62],
  [1.26, 0.74], [1.12, 0.8], [0.98, 0.72], [0.98, 0.58], [1.04, 0.46], [1.14, 0.37], [1.3, 0.31], [1.5, 0.3]];
function chaikinOpen(pts, k) {
  let p = pts;
  for (let i = 0; i < k; i++) {
    const out = [p[0]];
    for (let j = 0; j < p.length - 1; j++) {
      const a = p[j], b = p[j + 1];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    out.push(p[p.length - 1]);
    p = out;
  }
  return p;
}
export function wave_strip(opts = {}) {
  const dark = opts.tone === 'dark' || opts.tone === 'dunkel';
  const P = dark
    ? { frontT: '#3f7fbe', frontB: '#17376a', backT: '#2b5c98', backB: '#10284f', foam: '#eaf1f8', foam2: '#9fbfdc', line: 'rgba(8,25,60,.65)', ink: 'rgba(170,205,240,.35)' }
    : { frontT: '#63c8e2', frontB: '#2c8fc2', backT: '#3b9ccf', backB: '#236fa8', foam: '#ffffff', foam2: '#cdeaf4', line: 'rgba(15,70,110,.55)', ink: 'rgba(255,255,255,.4)' };
  const X0 = -3, X1 = 3, U = 1.5;
  const unitPath = chaikinOpen(WAVE_UNIT, 2);
  const mk = (shift, lift, sc) => {
    const polys = [], paths = [];
    for (let k = -2; k < 5; k++) {
      const xs = X0 + shift + k * U * sc;
      const path = unitPath.map(([x, y]) => [xs + x * sc, y * sc + lift]);
      let pg = [[path[0][0], -0.1]].concat(path, [[path[path.length - 1][0], -0.1]]);
      pg = clipAxis(clipAxis(pg, 0, X0, true), 0, X1, false);
      if (pg.length >= 3) polys.push(pg);
      paths.push(path);
    }
    return { polys, paths };
  };
  const back = mk(0.62, 0.1, 1.08), front = mk(0, 0, 1.0);
  const tipIdx = unitPath.reduce((bi, p, i) => (p[1] > 0.5 && p[0] > unitPath[bi][0] ? i : bi), 0);
  const crestStart = unitPath.findIndex((p) => p[1] > 0.7);
  const inX = (p) => p[0] >= X0 && p[0] <= X1;
  const layers = [{
    shapes: back.polys, fill: { top: P.backT, bottom: P.backB }, stroke: P.line,
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(0,20,60,.3)', light: 'rgba(200,240,255,.15)' });
      for (const path of back.paths) {
        const crest = path.slice(crestStart, tipIdx + 1).filter(inX);
        if (crest.length > 2) curve(c, crest, P.foam2, 0.05, { alpha: 0.9 });
      }
    },
  }, {
    shapes: front.polys, fill: { top: P.frontT, bottom: P.frontB }, stroke: P.line,
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(0,20,60,.35)', light: 'rgba(210,245,255,.25)' });
      // Konturlinien: versetzte Kopien der Wellenlinie (Schwung im Wasser)
      for (const path of front.paths) for (let k = 1; k <= 3; k++) {
        const cl = path.filter(inX).map(([x, y]) => [x, y - 0.12 * k]);
        if (cl.length > 2) curve(c, cl, P.ink, 0.018, { alpha: 1 });
      }
      for (const path of front.paths) {
        const crest = path.slice(crestStart, tipIdx + 1).filter(inX);
        if (crest.length > 2) curve(c, crest, P.foam, 0.07, { alpha: 1 });
        // Schaumkringel am Wellenkopf
        const tip = path[tipIdx];
        if (inX(tip)) {
          const sp = [];
          for (let a = 0; a < 10; a += 0.3) { const r = 0.1 * (1 - a / 12); sp.push([tip[0] - 0.2 + Math.cos(a) * r, tip[1] - 0.04 + Math.sin(a) * r]); }
          curve(c, sp, P.foam, 0.03, { alpha: 1 });
          for (const [dx, dy, r] of [[0.07, -0.02, 0.045], [0.0, -0.17, 0.035], [-0.42, -0.16, 0.04], [0.1, -0.26, 0.026]]) fillPoly(c, blob(tip[0] + dx, tip[1] + dy, r, r, 0, 12), P.foam);
        }
        // Schaumsaum im Trog
        const trough = path.slice(path.length - 4).filter(inX);
        if (trough.length > 2) curve(c, trough.map(([x, y]) => [x, y + 0.01]), P.foam, 0.045, { alpha: 0.9 });
      }
      const rr = rngOf(opts.seed ?? 1, 201);
      for (let k = 0; k < 14; k++) {
        const x = X0 + 0.2 + rr() * (X1 - X0 - 0.4), y = 0.06 + rr() * 0.2, r = 0.035 + rr() * 0.03;
        const ring = []; for (let a = 0; a <= TAU + 0.2; a += 0.4) ring.push([x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8]);
        curve(c, ring, P.foam, 0.016, { alpha: 0.9 });
      }
    },
  }];
  return spec('wave_strip', 'Wellenband', { body: { z: 1, layers } }, { base: [0, 0], top: { rel: [0.5, 1] }, surface: { rel: [0.5, 0.45] } }, { kind: 'water', tone: dark ? 'dark' : 'light' }, { w: opts.w ?? 6, baseY: true, centerX: true });
}

// ------------------------------------------------------------------------------------------------
// Fußabdruck eines frühen Menschen (Laetoli) von oben, rechter Fuß, Zehen nach oben, ~0,22 m: dunkle Vertiefung auf Aschegrund
const FOOT = (() => {
  const L = 0.22;
  const body = [[0.02, 0.125, 0.12, 0.13, 0], [0.0, 0.7, 0.18, 0.115, 0.05]];   // Ferse, Ballen (Ellipsen: x,y,rx,ry,rot)
  const mid = [[0.03, 0.22, 0.17], [0.065, 0.4, 0.15], [0.03, 0.56, 0.2]];       // Mittelfuß (Außenkante breiter, Innenseite = Bogen)
  const toes = [[-0.125, 0.89, 0.085, 0.102, -0.12], [-0.005, 0.935, 0.055, 0.067, -0.04], [0.075, 0.905, 0.05, 0.062, 0.06], [0.135, 0.862, 0.046, 0.055, 0.15], [0.18, 0.805, 0.04, 0.048, 0.25]];
  return { L, body, mid, toes };
})();
function footShapes(m) {
  const { L, body, mid, toes } = FOOT;
  const bodyS = body.map(([x, y, rx, ry, rot]) => blob(x * L, y * L, rx * L + m, ry * L + m, rot, 26));
  const midS = limb(mid.map(([x, y, w]) => [x * L, y * L, w * L + 2 * m]), { per: 6 });
  const toeS = toes.map(([x, y, rx, ry, rot]) => blob(x * L, y * L, rx * L + m, ry * L + m, rot, 18));
  return { bodyS, midS, toeS };
}
export function footprint(opts = {}) {
  const margin = footShapes(0.016), core = footShapes(0);
  const patch = [...margin.bodyS, margin.midS, ...margin.toeS];
  const print = [...core.bodyS, core.midS, ...core.toeS];
  const layers = [{
    shapes: patch, fill: { top: '#bdb8b2', bottom: '#8a857f' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,36,34,.3)', light: 'rgba(255,255,250,.3)' });
      const rr = rngOf(opts.seed ?? 1, 211);
      for (let k = 0; k < 40; k++) fillPoly(c, blob(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h, 0.002 + rr() * 0.003, 0.0015 + rr() * 0.002, 0, 6), rr() < 0.5 ? 'rgba(255,255,250,.55)' : 'rgba(50,45,42,.35)');
    },
  }, {
    shapes: print, fill: '#3c3532', stroke: 'rgba(30,25,22,.5)',
    deco(c, bb) {
      depression(c, print, { dark: '#2d2724', mid: '#6a615a', dx: 0.0035, dy: -0.0035 });
      // heller Rand (aufgeworfene Asche) unten rechts neben der Mulde
      for (const p of print) curve(c, p.filter((_, i) => i % 2 === 0).concat([p[0]]).map(([x, y]) => [x + 0.003, y - 0.003]), 'rgba(255,255,250,.25)', 0.003, { alpha: 1 });
    },
  }];
  return spec('footprint', 'Fußabdruck (früher Mensch)', { body: { z: 1, layers } }, { base: [0, 0], top: { rel: [0.5, 1] }, center: { rel: [0.5, 0.5] } }, { kind: 'track', footLengthM: 0.22 }, { baseY: true, centerX: true });
}

// ------------------------------------------------------------------------------------------------
// Dinosaurier-Spur ~0,3 m: dreizehiger Abdruck mit Krallenspitzen in Schlamm/Sand
export function dino_track(opts = {}) {
  const L = 0.3;
  const toe = (x0, y0, x1, y1, w0, w1) => {
    const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
    return limb([[x0 * L, y0 * L, w0 * L], [mx * L, my * L, (w0 * 0.8 + w1 * 0.2) * L], [x1 * L, y1 * L, w1 * L]], { per: 6 });
  };
  const claw = (x, y, ang, len, w) => leaf(x * L, y * L, ang, len * L, w * L, { fat: 0.15 });
  const dir = (x0, y0, x1, y1) => Math.atan2(y1 - y0, x1 - x0);
  const T = [[0.0, 0.3, 0.0, 0.84, 0.15, 0.085], [-0.03, 0.3, -0.34, 0.68, 0.14, 0.08], [0.03, 0.3, 0.34, 0.68, 0.14, 0.08]];
  const clawsDef = [[0.0, 0.84, Math.PI / 2, 0.16, 0.085], [-0.34, 0.68, dir(-0.03, 0.3, -0.34, 0.68), 0.15, 0.08], [0.34, 0.68, dir(0.03, 0.3, 0.34, 0.68), 0.15, 0.08]];
  const mkAll = (grow) => [
    ...T.map(([a, b, c2, d, w0, w1]) => toe(a, b, c2, d, w0 + grow, w1 + grow)),
    ...clawsDef.map(([x, y, an, ln, w]) => claw(x, y, an, ln + grow * 0.6, w + grow)),
    blob(0, 0.15 * L, (0.1 + grow / 2) * L, (0.11 + grow / 2) * L, 0, 22),
  ];
  const print = mkAll(0);
  const patch = mkAll(0.11);
  const layers = [{
    shapes: patch, fill: { top: '#e4d1a6', bottom: '#b79a68' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(90,60,30,.3)', light: 'rgba(255,248,220,.35)' });
      const rr = rngOf(opts.seed ?? 1, 221);
      for (let k = 0; k < 60; k++) fillPoly(c, blob(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h, 0.003 + rr() * 0.004, 0.002 + rr() * 0.003, 0, 6), rr() < 0.5 ? 'rgba(255,248,220,.6)' : 'rgba(100,70,35,.4)');
    },
  }, {
    shapes: print, fill: '#5a4028', stroke: 'rgba(60,40,20,.55)',
    deco(c, bb) {
      depression(c, print, { dark: '#46301d', mid: '#7e6040', dx: 0.005, dy: -0.005 });
      fillPolys(c, clawsDef.map(([x, y, an, ln, w]) => claw(x, y, an, ln, w)), 'rgba(35,22,10,.65)');
    },
  }];
  return spec('dino_track', 'Dinosaurier-Fußabdruck', { body: { z: 1, layers } }, { base: [0, 0], top: { rel: [0.5, 1] }, center: { rel: [0.5, 0.5] } }, { kind: 'track', trackLengthM: 0.3 }, { baseY: true, centerX: true });
}
