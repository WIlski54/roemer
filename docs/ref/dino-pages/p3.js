// Station 3: Jura-Lagune – „Das Wunder von Solnhofen“
// Archaeopteryx (Lasche „FLATTER!“), Compsognathus, Rhamphorhynchus an Fäden, Pfeilschwanzkrebs, Ichthyosaurus im tiefen Wasser.
// Dreistufiger Schieber „Zeit vergeht“: Das Tier sinkt in den Kalkschlamm, Schichten legen sich darüber, die Klappe öffnet sich
// und gibt eine Steinplatte mit dem Fossil frei (antippen = Karte „fossil“).
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, pebbles, speckles, blotches } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt, specBBox, Popup } from '../engine/popup.js';
import { ANIMALS } from '../art/registry.js';
import { lerp, clamp, smooth, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight, strata } from './common.js';
import { fxRate, softPlane, paintMist, Threads, waveStripPart, addBlink, updateBlink, ramp, canvasTex, RipplePool, islandPart } from './kit234.js';
import { paintSlab, paintScene, paintLayer, paintSign, MUD_FRAC } from './fossil234.js';

const IDX = 3;
const TAUv = TAU;

// Schaukasten-Maße (Seitenkoordinaten)
const BX = 8.95, BZ = 0.75;
const BW = 3.8, IN_W = 3.4, IN_H = 2.2, PLINTH = 0.25, BEAM = 0.25;
const TOP = PLINTH + IN_H + BEAM;                    // Oberkante Balken 2.7
const HINGE_Y = TOP + 0.03, HINGE_Z = 0.2;
const DOOR_W = 3.48, DOOR_H = HINGE_Y - (PLINTH + 0.02);
const OPEN_ANG = 2.55;                               // Klappe schlägt nach hinten (≈146°) – Schild schaut nach oben zum Betrachter
// Uferlinie der linken Seite (z-Wert der Sandkante in Abhängigkeit von x)
const shoreZ = (x) => {
  if (x < -5.4) return -0.95 + 0.22 * Math.sin(x * 0.8);
  if (x < -3.9) { const t = (x + 5.4) / 1.5; return lerp(-0.95 + 0.22 * Math.sin(-5.4 * 0.8), -1.75, t * t * (3 - 2 * t)); }
  if (x < -1.7) return -1.75 + 0.22 * Math.sin(x * 1.3);
  const t = clamp((x + 1.7) / 1.9); return lerp(-1.75 + 0.22 * Math.sin(-1.7 * 1.3), 3.0, t * t * (3 - 2 * t));
};

// Catmull-Rom auf Skalarwerten (Flugbahn der Höhe)
function crKeys(keys, v) {
  const n = keys.length; let i = 0; while (i < n - 2 && v > keys[i + 1][0]) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const t = clamp((v - k1[0]) / (k2[0] - k1[0] || 1));
  const p0 = k0[1], p1 = k1[1], p2 = k2[1], p3 = k3[1];
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
}

// ------------------------------------------------------------------ gemalte Seitenflächen
function paintWater(m, x0, x1, z0, z1, deep) {
  const { ctx } = m; const S = m.S;
  const g = ctx.createLinearGradient(0, m.z(-4.25), 0, m.z(3.2)); g.addColorStop(0, '#abe8dc'); g.addColorStop(0.45, '#7bd2cb'); g.addColorStop(1, '#4ebcc0');
  ctx.fillStyle = g; ctx.fillRect(m.x(x0), m.z(z0), (x1 - x0) * S, (z1 - z0) * S);
}
function ripples(m, { x0, x1, z0, z1, n = 30, seed = 3, color = 'rgba(255,255,255,.5)' }) {
  const { ctx } = m; const r = mulberry32(seed); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 0.028 * m.S); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const [X, Y] = m.pt(lerp(x0, x1, r()), lerp(z0, z1, r())), w = (0.16 + r() * 0.22) * m.S;
    ctx.beginPath(); ctx.moveTo(X - w, Y); ctx.quadraticCurveTo(X - w / 2, Y - 0.07 * m.S, X, Y); ctx.quadraticCurveTo(X + w / 2, Y + 0.07 * m.S, X + w, Y); ctx.stroke();
  }
}
// Kalkschlamm: milchige, gelbliche Schlieren im flachen Wasser
function limeMud(m, x0, x1, z0, z1, n, seed) {
  blotches(m, { x0, x1, z0, z1, n, rmin: 0.5, rmax: 1.5, colors: ['rgba(255,246,190,.30)', 'rgba(244,238,176,.22)', 'rgba(255,255,235,.22)'], seed });
}
function foamLine(m, pts, { w = 0.07, a = 0.9 } = {}) {
  const { ctx } = m; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = Math.max(1.5, w * m.S);
  ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = Math.max(1, w * 0.4 * m.S); ctx.setLineDash([0.02 * m.S, 0.12 * m.S]);
  ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1] - 0.14); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
// Kleine Pfotenspur (drei Zehen) für Compsognathus
function footprint(m, x, z, rot, s, color) {
  const { ctx } = m; ctx.save(); ctx.translate(m.x(x), m.z(z)); ctx.rotate(rot); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 0.03 * s * m.S); ctx.lineCap = 'round';
  for (const a of [-0.55, 0, 0.55]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 0.2 * s * m.S, Math.sin(a) * 0.2 * s * m.S); ctx.stroke(); }
  ctx.restore();
}

// Flachwasser-Hof und Schaumkante rund um eine Insel (gemalt auf die Seite)
function islandHalo(m, cx, cz, rx, rz) {
  const { ctx } = m; ctx.save();
  ctx.translate(m.x(cx), m.z(cz)); ctx.scale(1, rz / rx);
  const R = rx * m.S;
  const g = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R); g.addColorStop(0, 'rgba(248,252,226,.9)'); g.addColorStop(0.55, 'rgba(218,246,228,.6)'); g.addColorStop(1, 'rgba(184,236,226,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.07 * m.S * (rx / rz) * 0.55;
  ctx.beginPath(); ctx.arc(0, 0, R * 0.74, 0.08 * Math.PI, 0.92 * Math.PI); ctx.stroke();
  ctx.setLineDash([0.02 * m.S, 0.16 * m.S]); ctx.lineWidth = 0.05 * m.S * (rx / rz) * 0.5; ctx.strokeStyle = 'rgba(255,255,255,.65)';
  ctx.beginPath(); ctx.arc(0, 0, R * 0.9, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}

// ------------------------------------------------------------------ Seite
export default {
  id: 'jura-lagune',
  mood: mood({ key: '#fff3d6', keyI: 2.3, sky: '#dcf3ee', gnd: '#6aa89a', hemiI: 1.95, pos: [-12, 21, 9], rim: 0.2 }),
  motes: { colors: [[1, 0.98, 0.86], [0.88, 0.99, 0.96], [1, 0.95, 0.8]], size: 0.13, alpha: 0.32, dy: 0.05, dx: 0.06, dz: 0.012, tw: 1.0, density: 0.9 },
  atmo: 'jura-lagune',
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        ground: { back: '#abe8dc', front: '#d9c88e' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 41,
        draw(ctx, m) {
          const S = m.S;
          paintWater(m, -12.2, 0.3, -4.4, 4.4);
          limeMud(m, -12, 0, -4, 1.5, 14, 41);
          ripples(m, { x0: -11.5, x1: -0.5, z0: -4, z1: -1.2, n: 38, seed: 7 });
          islandHalo(m, -8.4, -2.45, 3.3, 1.0);
          // Sandstrand mit welliger Kante
          const pts = []; for (let x = -12.3; x <= 0.31; x += 0.1) pts.push([x, shoreZ(x)]);
          // flaches Wasser entlang der Kante (milchig)
          ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          const path = (dz) => { ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1] + dz); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); };
          ctx.strokeStyle = 'rgba(236,250,206,.35)'; ctx.lineWidth = 1.7 * S; path(-0.55); ctx.stroke();
          ctx.strokeStyle = 'rgba(244,252,222,.5)'; ctx.lineWidth = 0.95 * S; path(-0.32); ctx.stroke();
          ctx.restore();
          ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
          ctx.lineTo(m.x(0.31), m.z(4.4)); ctx.lineTo(m.x(-12.3), m.z(4.4)); ctx.closePath();
          const sg = ctx.createLinearGradient(0, m.z(-1.8), 0, m.z(4)); sg.addColorStop(0, '#f1e6b8'); sg.addColorStop(1, '#d9c58a');
          ctx.fillStyle = sg; ctx.fill();
          ctx.save(); ctx.clip();
          blotches(m, { x0: -12, x1: 0, z0: -1.8, z1: 4, n: 22, rmin: 0.5, rmax: 1.5, colors: ['rgba(150,120,60,.14)', 'rgba(255,250,220,.2)', 'rgba(120,100,50,.1)'], seed: 44 });
          speckles(m, { x0: -12, x1: 0, z0: -1.8, z1: 4, n: 260, color: 'rgba(120,95,50,.3)', size: 0.022, seed: 45 });
          speckles(m, { x0: -12, x1: 0, z0: -1.8, z1: 4, n: 140, color: 'rgba(255,252,230,.5)', size: 0.02, seed: 46 });
          pebbles(m, { x0: -11, x1: -1, z0: 0.0, z1: 3.4, n: 9, seed: 47, colors: ['#cdbf98', '#b9aa80', '#dccfa8'] });
          // Spuren von Compsognathus
          for (let i = 0; i < 9; i++) footprint(m, -3.7 + i * 0.36, 1.45 + (i % 2) * 0.16, -0.1 + (i % 2) * 0.2, 0.9, 'rgba(110,86,48,.5)');
          ctx.restore();
          foamLine(m, pts, { w: 0.07 });
          // Schleifspur des Pfeilschwanzkrebses im Schlick
          ctx.save(); ctx.strokeStyle = 'rgba(150,130,70,.4)'; ctx.lineWidth = 0.1 * S; ctx.lineCap = 'round';
          const trail = (dz) => { ctx.beginPath(); for (let i = 0; i <= 30; i++) { const t = i / 30, x = lerp(-3.4, -1.1, t), z = 2.35 - 0.8 * t + 0.14 * Math.sin(t * 12) + dz; const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke(); };
          trail(0); ctx.strokeStyle = 'rgba(255,250,220,.5)'; ctx.lineWidth = 0.025 * S; trail(-0.05); trail(0.05); ctx.restore();
          // „Solnhofen, Bayern“ gedruckt, mit kleinem bayerischem Rautenband
          const bx = -2.6, bz = 2.5;
          ctx.save(); ctx.translate(m.x(bx - 0.78), m.z(bz - 0.2)); ctx.fillStyle = '#fbfaf2'; ctx.fillRect(0, 0, 1.56 * S, 0.17 * S);
          ctx.fillStyle = '#2f78c4'; for (let i = 0; i < 9; i++) { if (i % 2) continue; const cx = (i + 0.5) * 0.1733 * S; ctx.beginPath(); ctx.moveTo(cx, 0.01 * S); ctx.lineTo(cx + 0.0867 * S, 0.085 * S); ctx.lineTo(cx, 0.16 * S); ctx.lineTo(cx - 0.0867 * S, 0.085 * S); ctx.closePath(); ctx.fill(); }
          ctx.strokeStyle = 'rgba(40,60,90,.6)'; ctx.lineWidth = 0.012 * S; ctx.strokeRect(0, 0, 1.56 * S, 0.17 * S); ctx.restore();
          printLabel(m, 'Solnhofen, Bayern', bx, bz + 0.22, { size: 0.3, color: '#5e4426', italic: true, bold: false });
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
        },
      },
      R: {
        ground: { back: '#abe8dc', front: '#4ebcc0' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 42,
        draw(ctx, m) {
          const S = m.S;
          paintWater(m, -0.3, 12.2, -4.4, 4.4);
          // tiefes Wasser für den Ichthyosaurier
          ctx.save(); ctx.translate(m.x(3.4), m.z(-1.0)); ctx.scale(1, 0.46);
          let g = ctx.createRadialGradient(0, 0, 0, 0, 0, 4.4 * S); g.addColorStop(0, 'rgba(18,102,132,.92)'); g.addColorStop(0.55, 'rgba(30,132,160,.7)'); g.addColorStop(1, 'rgba(46,160,180,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 4.4 * S, 0, TAU); ctx.fill(); ctx.restore();
          ripples(m, { x0: 0.4, x1: 11.5, z0: -4, z1: 2.4, n: 44, seed: 12 });
          ripples(m, { x0: 1.5, x1: 5.5, z0: -2.4, z1: 0.4, n: 14, seed: 13, color: 'rgba(190,240,250,.38)' });
          limeMud(m, 5.5, 12, -3.4, 3.2, 16, 42);
          islandHalo(m, 3.7, -2.8, 3.0, 0.95); islandHalo(m, 11.0, -2.2, 2.3, 0.9);
          // Sandbank unter dem Schaukasten
          ctx.save();
          const bar = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * TAU; bar.push([9.1 + Math.cos(a) * (3.45 + 0.25 * Math.sin(a * 3 + 1)), 1.1 + Math.sin(a) * (2.0 + 0.15 * Math.sin(a * 4))]); }
          const barPath = (sc) => { ctx.beginPath(); bar.forEach((p, i) => { const [X, Y] = m.pt(9.1 + (p[0] - 9.1) * sc, 1.1 + (p[1] - 1.1) * sc); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); };
          ctx.fillStyle = 'rgba(244,252,222,.42)'; barPath(1.32); ctx.fill();
          ctx.fillStyle = 'rgba(248,252,230,.6)'; barPath(1.14); ctx.fill();
          const sg = ctx.createLinearGradient(0, m.z(-0.7), 0, m.z(3.0)); sg.addColorStop(0, '#f3e9bd'); sg.addColorStop(1, '#dac78f');
          ctx.fillStyle = sg; barPath(1); ctx.fill();
          ctx.save(); barPath(1); ctx.clip();
          blotches(m, { x0: 6, x1: 12, z0: -0.7, z1: 3, n: 12, rmin: 0.4, rmax: 1.0, colors: ['rgba(150,120,60,.14)', 'rgba(255,250,220,.22)'], seed: 51 });
          speckles(m, { x0: 6, x1: 12, z0: -0.7, z1: 3, n: 240, color: 'rgba(120,95,50,.3)', size: 0.022, seed: 52 });
          pebbles(m, { x0: 6.5, x1: 11.6, z0: 1.5, z1: 2.6, n: 7, seed: 53, colors: ['#cdbf98', '#b9aa80', '#dccfa8'] });
          ctx.restore();
          ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.06 * S; ctx.lineJoin = 'round'; barPath(1.0); ctx.stroke();
          ctx.restore();
          // Beschriftung der Raststellen des Schiebers
          const col = '#2c5a5e';
          printLabel(m, '1  Sinken', 3.2, 2.86, { size: 0.27, color: col });
          printLabel(m, '2  Schichten', 6.2, 2.86, { size: 0.27, color: col });
          printLabel(m, '3  Fossil', 9.2, 2.86, { size: 0.27, color: col });
        },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const SKY_W = 11.55, CX = { L: -5.975, R: 5.975 };
    // ------------------------------------------------------------ Himmel, Kalkfelsen, Wolken
    for (const s of ['L', 'R']) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-SKY_W / 2, SKY_W / 2, 5.0, {
        fill: { top: '#8dd6e8', bottom: '#fbf2d2' }, wave: 0.26, freq: 2.8, phase: 0.8 + k * 1.9, seed: 13 + k,
        deco: (c, bb) => {
          softLight(c, bb, { color: 'rgba(255,246,200,.6)', cx: s === 'L' ? 0.6 : 0.2, cy: 0.62, r: 0.8 });
          // weiche Wolkenbänke
          const { ctx: g, tf } = c; const rr = mulberry32(21 + k);
          for (let i = 0; i < 7; i++) { const cx = bb.x0 + rr() * bb.w, cy = bb.y0 + bb.h * (0.5 + rr() * 0.35), rad = 0.9 + rr() * 1.3; const [X, Y] = tf(cx, cy); const gr = g.createRadialGradient(X, Y, 0, X, Y, rad * c.S); gr.addColorStop(0, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.translate(X, Y); g.scale(1, 0.34); g.translate(-X, -Y); g.fillStyle = gr; g.beginPath(); g.arc(X, Y, rad * c.S, 0, TAUv); g.fill(); g.restore(); }
          dither(c, bb, '#fff', { n: 90, alpha: 0.14, size: 0.04, seed: 5 + k });
        },
      }), { x: CX[s], z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0.0, ppu: 70, border: 0.04 });
      ctx.flat(panelPart(-SKY_W / 2, SKY_W / 2, 1.7, {
        fill: { top: '#f1e8c8', bottom: '#dccfa4' }, wave: 0.34, freq: s === 'L' ? 2.3 : 2.8, phase: 1.1 + k * 2, seed: 17 + k,
        deco: (c, bb) => { strata(c, bb, ['#cbb98a', '#efe3bc', '#bda97b'], { n: 9, wave: 0.05, seed: 3 + k, alpha: 0.5 }); dither(c, bb, '#8aa36a', { n: 36, alpha: 0.4, size: 0.05, seed: 8 }); dither(c, bb, '#fff', { n: 70, alpha: 0.2, size: 0.04, seed: 9 }); },
      }), { x: CX[s], z: -3.5, lean: -0.02, name: 'cliff' + s, delay: 0.04, ppu: 70 });
    }
    yield;
    const sun = ctx.prop('sun_disc', { x: -2.6, z: -3.9, h: 1.5, y: 3.0, delay: 0.2, cast: false });
    const clouds = [
      ctx.prop('cloud_a', { x: -7.4, y: 3.5, z: -3.85, len: 3.3, delay: 0.2, cast: false }),
      ctx.prop('cloud_b', { x: -0.9, y: 4.0, z: -3.8, len: 2.9, delay: 0.24, cast: false }),
      ctx.prop('cloud_a', { x: 5.6, y: 3.9, z: -3.8, len: 3.1, delay: 0.22, cast: false }),
      ctx.prop('cloud_b', { x: 10.2, y: 3.4, z: -3.85, len: 2.2, delay: 0.26, cast: false }),
    ];
    const cloudX = [-7.4, -0.9, 5.6, 10.2];
    yield;

    // ------------------------------------------------------------ Inseln mit Gebüsch (Pflanzen stehen hinter der Kuppel)
    const ISL = [[-8.4, -2.7, 4.4, 0.85, 2], [3.7, -3.05, 3.8, 0.75, 3], [11.0, -2.4, 2.8, 0.7, 4]];
    ISL.forEach(([x, z, w, h, sd], i) => {
      ctx.flat(islandPart(w, h, { seed: sd }), { x, z, name: 'island' + i, delay: 0.3 + i * 0.03, ppu: 80, border: 0.035 });
    });
    ctx.prop('tree_fern', { x: -9.3, z: -3.05, h: 2.8, delay: 0.36 });
    ctx.prop('cycad', { x: -8.0, z: -3.05, h: 1.7, delay: 0.38, variant: { seed: 2 } });
    ctx.prop('bush', { x: -6.9, z: -3.0, len: 1.5, delay: 0.38 });
    ctx.prop('cycad', { x: 2.7, z: -3.4, h: 1.8, delay: 0.4 });
    ctx.prop('tree_fern', { x: 4.6, z: -3.4, h: 2.6, delay: 0.4, facing: -1 });
    ctx.prop('bush', { x: 10.5, z: -2.7, len: 1.4, delay: 0.42, variant: { seed: 3 } });
    ctx.prop('cycad', { x: 11.5, z: -2.8, h: 1.6, delay: 0.42, facing: -1 });
    yield;
    // Pflanzen auf Strand und Nehrung
    ctx.prop('tree_fern', { x: -11.1, z: -1.1, h: 2.5, delay: 0.38, facing: -1 });
    ctx.prop('horsetail', { x: -5.7, z: -1.3, h: 1.2, delay: 0.4 });
    ctx.prop('fern_ground', { x: -4.9, z: -1.0, len: 1.3, delay: 0.42, variant: { seed: 2 } });
    ctx.prop('reeds', { x: -1.7, z: -1.45, len: 1.5, delay: 0.42, facing: -1 });
    ctx.prop('reeds', { x: 6.4, z: 1.6, len: 1.3, delay: 0.44 });
    ctx.prop('horsetail', { x: 11.3, z: 1.3, h: 1.1, delay: 0.46, facing: -1 });
    const dfly = ctx.prop('dragonfly', { x: -2.7, z: -1.2, y: 1.9, len: 0.78, delay: 0.5 });
    yield;
    // Dunst über dem Wasser
    for (const [s, x, w] of [['L', -5.9, 11.2], ['R', 5.9, 11.2]]) softPlane(ctx, { x, z: -2.2, y: 0.2, w, h: 1.4, res: 24, draw: (g, W, H) => paintMist(g, W, H, { color: [236, 252, 244], alpha: 0.65, seed: x > 0 ? 4 : 9, blobs: 8 }), opacity: 0.5, delay: 0.3, name: 'mist' });

    // ------------------------------------------------------------ Tiere
    const comp = ctx.stand('compsognathus', { x: -2.4, z: 1.25, len: 2.1, facing: 1, delay: 0.46 });
    const limulus = ctx.stand('limulus', { x: -0.9, z: 1.95, len: 1.05, facing: -1, delay: 0.5 });
    const perch = ctx.prop('boulder', { x: -3.9, z: 0.55, len: 1.5, delay: 0.44, variant: { seed: 2 } });
    const PERCH_X = -3.9, PERCH_Y = 0.6, PERCH_Z = 0.8;
    const bird = ctx.stand('archaeopteryx', { x: PERCH_X, z: PERCH_Z, y: PERCH_Y, len: 1.6, facing: 1, delay: 0.52 });
    const bws = bird.fig.ws;
    const flyBB = specBBox(ANIMALS.archaeopteryx({ pose: 'fly' }));
    const flyFig = ctx.fig('archaeopteryx', { len: flyBB.w * bws, variant: { pose: 'fly' }, thickness: 0.026 });
    bird.popup.add(flyFig.group); R.own(flyFig);
    flyFig.group.visible = false; flyFig.group.position.x = bird.fig.group.position.x;
    const birdCx = ((bird.fig.bbox.x0 + bird.fig.bbox.x1) / 2) * bws;
    const ich = ctx.stand('ichthyosaurus', { x: 3.3, z: -1.65, len: 4.4, facing: 1, delay: 0.4 });
    const rham = ctx.stand('rhamphorhynchus', { x: 5.6, z: -1.9, y: 2.1, len: 2.5, facing: 1, delay: 0.5 });
    const blinks = [addBlink(bird.fig, 'body', bird.fig.spec.anchors.eye, 0.0215, '#7a5e48'), addBlink(comp.fig, 'body', comp.fig.spec.anchors.eye, 0.023, '#9d7d58'), addBlink(ich.fig, 'body', ich.fig.spec.anchors.eye, 0.09, '#5f86a6')];
    yield;
    // Wellenstreifen als Wasseroberfläche vor dem Ichthyosaurus
    const veils = [];
    [[-1.25, 0.62, 0.4, '#2a9fb4', '#1b7f9e', 3, 1.6], [-0.98, 0.42, 2.1, '#58c8cf', '#2e9cb6', 5, 1.1]].forEach(([z, h, ph, c0, c1, sd, sp], i) => {
      const p = ctx.flat(waveStripPart(5.0, h, { top: c0, bottom: c1, wave: 0.09, freq: 3.4, phase: ph, seed: sd, scallop: true, step: 0.09, lines: true, foam: true, glint: '#d8f6f0' }), { x: 3.3, z, name: 'veil' + i, delay: 0.48 + i * 0.03, ppu: 70, border: 0.025, thickness: 0.015 });
      p.sp = sp; p.ph = ph; veils.push(p);
    });
    // Fisch, der ab und zu aus dem Wasser springt
    const fish = ctx.prop('fish_a', { x: 1.6, z: 0.2, len: 0.6, delay: 0.5 });
    fish.pivot.visible = false;
    const ripL = new RipplePool(L, { n: 6 }), ripR = new RipplePool(R, { n: 9 });
    const threads = new Threads(R, { color: 0x5a4632, thick: 0.014 });
    threads.add(rham.popup, rham.fig, rham.fig.spec.anchors.back || [0, 1.2], [5.6, 4.8, -3.95]);
    yield;

    // ------------------------------------------------------------ Schaukasten „Zeit vergeht“
    const box = new THREE.Group();
    const bp = new Popup(R, { x: BX, z: BZ, delay: 0.5, k: 110, d: 12, lean: -0.14, name: 'schaukasten' });
    R.addPopup(bp); bp.add(box); box.position.y = 0.045;
    const wood = new THREE.MeshLambertMaterial({ color: 0x9a6a3e }), woodDark = new THREE.MeshLambertMaterial({ color: 0x7a4f2c }), stone = new THREE.MeshLambertMaterial({ color: 0xdcd1b0 });
    const add = (geo, mat, x, y, z, cast = true) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; box.add(m); return m; };
    add(new THREE.BoxGeometry(BW + 0.3, PLINTH, 0.62), stone, 0, PLINTH / 2, 0.02);                              // Sockel
    for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.2, IN_H + 0.02, 0.3), wood, sx * (IN_W / 2 + 0.1), PLINTH + IN_H / 2, 0);  // Pfosten
    add(new THREE.BoxGeometry(BW + 0.12, BEAM, 0.34), woodDark, 0, PLINTH + IN_H + BEAM / 2, 0);                  // Balken oben
    add(new THREE.BoxGeometry(IN_W + 0.02, 0.06, 0.3), woodDark, 0, PLINTH + 0.03, 0);                           // Schwelle
    const brass = new THREE.MeshLambertMaterial({ color: 0xd9a93a });
    for (const sx of [-1, 1]) { const h = add(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 10), brass, sx * (IN_W / 2 - 0.1), HINGE_Y + 0.0, HINGE_Z - 0.02); h.rotation.z = Math.PI / 2; }
    // Steinplatte (antippbar, wenn offen)
    const slabTex = canvasTex(IN_W * 190, IN_H * 190, (g, W, H) => paintSlab(g, W, H, 5));
    const slabMat = new THREE.MeshBasicMaterial({ map: slabTex, color: 0xdedacc });
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(IN_W, IN_H), slabMat); slab.position.set(0, PLINTH + IN_H / 2, -0.03); slab.receiveShadow = true; box.add(slab);
    // Klappe (oben angeschlagen)
    const door = new THREE.Group(); door.position.set(0, HINGE_Y, HINGE_Z); box.add(door);
    const frontTex = canvasTex(DOOR_W * 170, DOOR_H * 170, (g, W, H) => paintScene(g, W, H, 3));
    const backTex = canvasTex(DOOR_W * 120, DOOR_H * 120, (g, W, H) => paintSign(g, W, H));
    const edge = new THREE.MeshLambertMaterial({ color: 0xcdbd95 });
    const dgeo = new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.045); dgeo.translate(0, -DOOR_H / 2, 0);
    const doorMesh = new THREE.Mesh(dgeo, [edge, edge, edge, edge, new THREE.MeshLambertMaterial({ map: frontTex }), new THREE.MeshLambertMaterial({ map: backTex })]);
    doorMesh.castShadow = true; doorMesh.receiveShadow = true; door.add(doorMesh);
    const pic = new THREE.Group(); pic.position.set(0, -DOOR_H, 0.0235); door.add(pic);          // Bildkoordinaten: y von unten
    // Tier, das sinkt (Archaeopteryx mit weit geöffneten Flügeln, auf dem Rücken)
    const corpse = ctx.fig('archaeopteryx', { len: 1.9, variant: { pose: 'fly' }, thickness: 0.02 }); R.own(corpse);
    const cg = new THREE.Group(); pic.add(cg);
    corpse.group.position.set(-((corpse.bbox.x0 + corpse.bbox.x1) / 2) * corpse.ws, -((corpse.bbox.y0 + corpse.bbox.y1) / 2) * corpse.ws, 0); cg.add(corpse.group);
    corpse.setCast(false);
    cg.position.z = 0.02;
    const corpseMats = corpse.cuts.map((c) => c.material);
    // Schichten
    const LAYERS = [
      { base: ['#f0e6bf', '#d9c993'], line: 'rgba(130,105,60,.4)', yb: 0.09, seed: 1, bump: null },
      { base: ['#cfc29a', '#b3a77e'], line: 'rgba(90,76,48,.45)', yb: 0.33, seed: 2, bump: null },
      { base: ['#f3ebc8', '#ddcf9d'], line: 'rgba(130,105,60,.35)', yb: 0.57, seed: 3, bump: { x: 0.42, w: 0.12, h: 0.09 } },
    ];
    const LAY_W = DOOR_W - 0.08, LAY_H = 1.4;
    const layers = LAYERS.map((ly, i) => {
      const tex = canvasTex(LAY_W * 130, LAY_H * 130, (g, W, H) => paintLayer(g, W, H, ly));
      const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, opacity: 0 });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(LAY_W, LAY_H), mat); m.position.set(0, ly.yb + LAY_H / 2, 0.045 + i * 0.022); m.visible = false; pic.add(m);
      return { m, mat, yb: ly.yb };
    });
    // Tippen: Platte (offen → Karte), Klappe (geschlossen → kleiner Wackler)
    let openK = 0, nudge = 0, cardCool = 0, sparkT = 0;
    const slabTap = () => {
      if (openK > 0.9) { if (cardCool <= 0) { cardCool = 0.8; app.audio.sfx('fossil'); app.openCardById('fossil', BX); } }
      else { nudge = 1; app.audio.sfx('tapp'); }
    };
    slab.userData.tap = slabTap; doorMesh.userData.tap = slabTap; bp.pickMeshes = [slab, doorMesh];

    // ------------------------------------------------------------ Regler
    const zeitCtl = ctx.control('R', { id: 'zeit', label: 'Zeit vergeht', a: [3.2, 3.6], b: [9.2, 3.6], size: [2.7, 1.05], color: '#2c8f9f', value: 0, snaps: [0, 0.5, 1], ticks: 2 });
    let zeitV = 0, zeitLast = 0, openedSfx = false, fossilSfx = false, puffed = false;
    zeitCtl.on((v) => { zeitV = v; });
    zeitCtl.onGrab = () => app.audio.sfx('grab');
    zeitCtl.onTick = (v) => app.audio.sfx('slide', { v });
    zeitCtl.onSnap = () => app.audio.sfx('snap');

    const flatterCtl = ctx.control('L', { id: 'flatter', label: 'FLATTER!', a: [-4.1, 3.6], b: [-1.5, 3.6], size: [2.3, 1.0], color: '#2a9d8f', value: 0, springBack: true });
    let flV = 0, flLast = 0, flSpeed = 0, flapPh = 0, bwFacing = 1, flying = false, dipCool = 0, featherT = 0, wakeFlap = 0;
    flatterCtl.on((v) => { flV = v; });
    flatterCtl.onGrab = () => app.audio.sfx('grab');
    flatterCtl.onRelease = () => app.audio.sfx('snap');

    // ------------------------------------------------------------ Tier-Reaktionen beim Antippen
    bird.onWake = (a) => { wakeFlap = 1; a.tw.add(0.8, (k) => { a.hop = Math.sin(k * Math.PI) * 0.25; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI * 2) * 0.6 * (1 - k)); }, { done: () => { a.hop = 0; poseAmt(a.fig, 'jaw', 0); } }); };
    ich.onWake = (a) => {
      app.audio.sfx('splash'); const w = ctx.world(a.popup.group.position.x + 1.4, 0.5, -0.5);
      a.tw.add(1.2, (k) => { a.hop = Math.sin(k * Math.PI) * 0.7; }, { done: () => { a.hop = 0; } });
      if (fxRate(app) > 0) app.fx.dust.burst(Math.round(10 * fxRate(app)), { x: w.x, y: w.y, z: w.z, life: 0.9, size: 0.14, alpha: 0.8, color: [0.85, 0.97, 1], grav: 5 }, { speed: 1.4, up: 1.6, px: 0.5, pz: 0.2 });
      ripR.emit(a.popup.group.position.x + 1.2, -0.75, 1.2, 1.9);
    };
    limulus.onWake = (a) => { a.tw.add(0.7, (k) => { a.fig.root.rotation.z = Math.sin(k * Math.PI * 4) * 0.12 * (1 - k); a.hop = Math.sin(k * Math.PI) * 0.08; }, { done: () => { a.fig.root.rotation.z = 0; a.hop = 0; } }); };

    // ------------------------------------------------------------ pro Frame
    const tmpW = { x: 0, y: 0 };
    let rippleT = 1, surfT = 3, surfK = -1, fishT = 5, fishK = -1, fishX = 0, compPh = 0, compSide = 1, lastBy = PERCH_Y;
    const COMP_X0 = -2.6, COMP_X1 = -1.2;
    const SW = bird.fig.meta.swing || { wing: [-0.6, 0.55], wing2: [-0.6, 0.5] };
    const FW = flyFig.meta.swing || { wing: [-0.45, 1.0], wing2: [-0.45, 0.95] };
    const KEYS = [[0, PERCH_Y], [0.12, 0.95], [0.3, 2.1], [0.48, 1.05], [0.55, 0.82], [0.65, 1.1], [0.85, 1.95], [1, 2.15]];
    const X0 = PERCH_X, X1 = 5.3;

    ctx.onUpdate((dt, t) => {
      if (!ctx.spread.active) return;
      const rate = fxRate(app);

      // ===== Archaeopteryx: Lasche -> Flug
      flSpeed += ((flV - flLast) / Math.max(dt, 1e-3) - flSpeed) * Math.min(1, dt * 8); flLast = flV;
      const mv = clamp(Math.abs(flSpeed) * 2.4);
      const nowFlying = flV > 0.012;
      if (nowFlying !== flying) { flying = nowFlying; if (flying) app.audio.sfx('flap'); }
      bird.fig.group.visible = !nowFlying; flyFig.group.visible = nowFlying;
      const wp = bird.popup.group.position;
      if (nowFlying) {
        if (Math.abs(flSpeed) > 0.03) bwFacing = flSpeed > 0 ? 1 : -1;
        const gl = smooth(ramp(flV, 0.8, 0.96));
        const amp = clamp(0.28 + mv * 0.9 - gl * 0.2, 0.16, 1);
        flapPh += dt * (8 + 12 * mv - 3 * gl);
        const fl = 0.5 + 0.5 * Math.sin(flapPh);
        flyFig.rotatePart('wing', lerp(FW.wing[0] + 0.1, FW.wing[0] + (FW.wing[1] - FW.wing[0]) * amp, fl));
        flyFig.rotatePart('wing2', lerp(FW.wing2[0] + 0.1, FW.wing2[0] + (FW.wing2[1] - FW.wing2[0]) * amp, fl));
        const dir = bwFacing; flyFig.group.scale.x = dir; flyFig.group.position.x = -birdCx * dir;
        const xs = flV * 0.72 + 0.28 * smooth(flV);
        const ny = crKeys(KEYS, flV) + 0.03 * Math.sin(flapPh) * (1 - gl);
        const vy = (ny - lastBy) / Math.max(dt, 1e-3); lastBy = ny;
        wp.x = lerp(X0, X1, xs); wp.y = ny;
        bird.popup.pivot.rotation.z = clamp(vy * 0.1, -0.3, 0.3) * bwFacing;
        bird.fig.root.rotation.z = 0;
        // Federn und Wassertropfen
        featherT += dt * rate * (0.8 + mv * 3);
        while (featherT > 1) { featherT -= 1; const w = ctx.world(wp.x - bwFacing * 0.5, wp.y + 0.5, PERCH_Z); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: -bwFacing * 0.15 + (Math.random() - 0.5) * 0.3, vy: 0.1 + Math.random() * 0.2, vz: (Math.random() - 0.5) * 0.2, life: 1.8, size: 0.09, alpha: 0.75, color: [0.22, 0.28, 0.4], grav: 0.35, drag: 1.2 }); }
        if (wp.y < 1.12 && wp.x > -0.8 && Math.abs(flSpeed) > 0.05) {
          dipCool -= dt;
          if (dipCool <= 0) {
            dipCool = 0.22; const wpos = ctx.world(wp.x, 0.12, PERCH_Z + 0.2);
            if (rate > 0) app.fx.dust.burst(Math.round(5 * rate), { x: wpos.x, y: wpos.y, z: wpos.z, life: 0.7, size: 0.1, alpha: 0.85, color: [0.85, 0.97, 1], grav: 5 }, { speed: 0.9, up: 1.3, px: 0.2, pz: 0.1 });
            (wp.x < 0 ? ripL : ripR).emit(wp.x, PERCH_Z + 0.1, 0.55, 1.4); app.audio.sfx('splash');
          }
        } else dipCool = 0;
      } else {
        // sitzt auf dem Fels: kurze Flatterbewegung nach dem Antippen, sonst ruhige Haltung
        wp.x = PERCH_X; wp.y = PERCH_Y; lastBy = PERCH_Y; bird.popup.pivot.rotation.z = 0;
        wakeFlap = Math.max(0, wakeFlap - dt * 1.4);
        if (wakeFlap > 0) { const f = Math.sin(t * 38) * 0.5 + 0.5; bird.fig.rotatePart('wing', lerp(SW.wing[0], SW.wing[1], f) * wakeFlap); bird.fig.rotatePart('wing2', lerp(SW.wing2[0], SW.wing2[1], f) * wakeFlap); }
        else { const idle = 0.5 + 0.5 * Math.sin(t * 0.7); const tw = Math.max(0, Math.sin(t * 0.43 + 1) - 0.82) * 5; bird.fig.rotatePart('wing', -0.1 * idle + tw * 0.5); bird.fig.rotatePart('wing2', -0.1 * idle + tw * 0.4); poseAmt(bird.fig, 'jaw', Math.max(0, Math.sin(t * 0.9 + 2) - 0.93) * 8); }
        bird.fig.root.rotation.z = Math.sin(t * 0.5) * 0.015;
      }
      // Rhamphorhynchus: schaukelt an seinem Faden und schlägt langsam mit den Flügeln
      const rp = rham.popup.group.position;
      const ra = 0.45 + 0.4 * mv;
      const rf = Math.sin(t * (2.2 + 4 * mv));
      rham.fig.rotatePart('wing', lerp(-0.2, 0.5, 0.5 + 0.5 * rf) * ra * 1.6); rham.fig.rotatePart('wing2', lerp(0.2, -0.5, 0.5 + 0.5 * rf) * ra * 1.6);
      rp.x = 5.6 + 0.55 * Math.sin(t * 0.33) + 0.25 * Math.sin(t * 0.81); rp.y = 2.2 + 0.14 * Math.sin(t * 1.05) + 0.08 * rf * ra;
      rham.popup.pivot.rotation.z = 0.06 * Math.cos(t * 0.33) + 0.02 * Math.sin(t * 0.81);
      threads.update();

      // ===== Compsognathus spaziert langsam auf dem Strand hin und her
      { const cyc = 16, c = (t % cyc);
        let seg = 0, k = 0; if (c < 4) { seg = 1; k = c / 4; } else if (c < 8) seg = 0; else if (c < 12) { seg = -1; k = (c - 8) / 4; } else seg = 0;
        const sx = c < 4 ? lerp(COMP_X0, COMP_X1, smooth(k)) : c < 8 ? COMP_X1 : c < 12 ? lerp(COMP_X1, COMP_X0, smooth(k)) : COMP_X0;
        comp.popup.group.position.x = sx;
        if (seg !== 0) { if (compSide !== seg) { compSide = seg; comp.setFacing(seg); } compPh += dt * 9; const sw = Math.sin(compPh); comp.fig.rotatePart('legA', 0.45 * sw); comp.fig.rotatePart('legB', -0.45 * sw); comp.hop = Math.abs(sw) * 0.04; }
        else { comp.fig.rotatePart('legA', 0); comp.fig.rotatePart('legB', 0); if (!comp.tw.list.length) comp.hop = 0; if (!comp.tw.list.length) poseAmt(comp.fig, 'jaw', Math.max(0, Math.sin(t * 1.3 + 1) - 0.7) * 2.2); }
      }
      // Pfeilschwanzkrebs kriecht minimal
      limulus.popup.group.position.x = -1.1 + 0.14 * Math.sin(t * 0.25);
      if (!limulus.tw.list.length) limulus.fig.root.rotation.z = 0.025 * Math.sin(t * 0.9);
      for (const b of blinks) updateBlink(b, dt);

      // ===== Ichthyosaurus: schwimmt, taucht auf, Schwanz schlägt
      surfT -= dt; if (surfT <= 0 && surfK < 0) { surfK = 0; surfT = 8 + Math.random() * 4; }
      let jump = 0, pitch = 0.04 * Math.sin(t * 0.8);
      if (surfK >= 0) { surfK += dt / 1.5; const k = Math.min(1, surfK); jump = 0.42 * Math.sin(k * Math.PI); pitch = lerp(0.2, -0.18, k);
        if (!ich._up && k > 0.05) { ich._up = true; ripR.emit(ich.popup.group.position.x + 1.6, -0.75, 1.0, 1.7); app.audio.sfx('splash'); }
        if (k >= 1) { surfK = -1; ich._up = false; ripR.emit(ich.popup.group.position.x + 2.0, -0.75, 1.2, 1.9); const w = ctx.world(ich.popup.group.position.x + 2.0, 0.4, -0.75); if (rate > 0) app.fx.dust.burst(Math.round(8 * rate), { x: w.x, y: w.y, z: w.z, life: 0.8, size: 0.13, alpha: 0.8, color: [0.85, 0.97, 1], grav: 5 }, { speed: 1.0, up: 1.4, px: 0.4, pz: 0.1 }); } }
      ich.popup.group.position.x = 3.3 + 0.55 * Math.sin(t * 0.22); ich.popup.group.position.y = 0.04 * Math.sin(t * 0.9) + jump;
      ich.popup.pivot.rotation.z = pitch;
      poseAmt(ich.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 2.4)); poseAmt(ich.fig, 'flipperA', 0.5 + 0.5 * Math.sin(t * 1.2 + 1));

      // ===== Fisch springt
      if (fishK < 0) { fishT -= dt; if (fishT <= 0) { fishK = 0; fishX = 1.2 + Math.random() * 1.0; fish.pivot.visible = true; ripR.emit(fishX, 0.2, 0.5, 1.2); app.audio.sfx('splash'); } }
      else { fishK += dt / 0.9; const k = Math.min(1, fishK); fish.group.position.set(fishX + k * 0.9, 0.9 * 4 * k * (1 - k) - 0.1, 0.2); fish.pivot.rotation.z = lerp(0.9, -0.9, k);
        if (k >= 1) { fishK = -1; fishT = 6 + Math.random() * 6; fish.pivot.visible = false; ripR.emit(fishX + 0.9, 0.2, 0.6, 1.4); const w = ctx.world(fishX + 0.9, 0.1, 0.2); if (rate > 0) app.fx.dust.burst(Math.round(6 * rate), { x: w.x, y: w.y, z: w.z, life: 0.6, size: 0.1, alpha: 0.8, color: [0.85, 0.97, 1], grav: 5 }, { speed: 0.8, up: 1.2, px: 0.2, pz: 0.1 }); } }

      // ===== Wasseroberfläche: sanftes Plätschern
      rippleT -= dt * Math.max(0.4, rate);
      if (rippleT <= 0) { rippleT = 1.2 + Math.random() * 1.6; if (Math.random() < 0.4) ripL.emit(-9 + Math.random() * 7, -3 + Math.random() * 1.6, 0.45, 2.2); else ripR.emit(0.8 + Math.random() * 6.5, -3 + Math.random() * 2.4, 0.5, 2.2); }
      ripL.update(dt); ripR.update(dt);
      for (const p of veils) { p.cut.mesh.position.x = Math.sin(t * 0.7 + p.ph) * 0.14; p.cut.mesh.scale.y = 1 + 0.1 * Math.sin(t * 1.3 + p.ph * 2); }

      // ===== Libelle schwebt über der Nehrung
      { const g = dfly.group.position; g.x = -2.7 + 0.9 * Math.sin(t * 0.5) + 0.3 * Math.sin(t * 1.3); g.y = 1.9 + 0.22 * Math.sin(t * 0.9 + 1) + 0.1 * Math.sin(t * 2.1); dfly.pivot.rotation.z = 0.08 * Math.cos(t * 0.5);
        const f = 0.5 + 0.5 * Math.sin(t * 52); dfly.fig.rotatePart('wing', lerp(-0.3, 0.5, f)); dfly.fig.rotatePart('wing2', lerp(-0.25, 0.4, 1 - f)); }

      // ===== Wolken
      for (let i = 0; i < clouds.length; i++) clouds[i].group.position.x = cloudX[i] + Math.sin(t * (0.04 + i * 0.01) + i) * 1.3;
      sun.group.position.y = 3.0 + 0.05 * Math.sin(t * 0.3);

      // ===== Schaukasten aus dem Schieberwert ableiten
      const v = zeitV;
      // sinkendes Tier
      const s1 = smooth(ramp(v, 0.0, 0.3)), s2 = ramp(v, 0.3, 0.5);
      cg.position.x = -0.28 + 0.2 * Math.sin(v * 9) * (1 - s1);
      cg.position.y = lerp(1.72, 1.12, s1) - 0.07 * s2 + 0.03 * Math.sin(t * 1.4) * (1 - s1);
      cg.rotation.z = Math.PI - 0.22 + 0.16 * Math.sin(v * 7 + 0.6) * (1 - s1);
      const dim = lerp(1, 0.8, s1 + s2 * 0.1);
      for (const m of corpseMats) m.color.setRGB(dim, dim * 1.02, dim * 1.07);
      for (let i = 0; i < layers.length; i++) {
        const lt = smooth(ramp(v, 0.16 + i * 0.1, 0.3 + i * 0.1)), ly = layers[i];
        ly.m.visible = lt > 0.002; ly.mat.opacity = clamp(lt * 3); ly.m.position.y = ly.yb + LAY_H / 2 + (1 - lt) * 1.1;
      }
      // Klappe
      const oTarget = smooth(ramp(v, 0.58, 0.95));
      openK += (oTarget - openK) * Math.min(1, dt * 9);
      if (nudge > 0) nudge = Math.max(0, nudge - dt * 1.8);
      door.rotation.x = openK * OPEN_ANG + Math.sin(nudge * Math.PI * 5) * 0.05 * nudge * (1 - openK) + (openK > 0.02 && openK < 0.98 ? Math.sin(t * 7) * 0.012 : 0);
      if (openK > 0.6 && !openedSfx) { openedSfx = true; app.audio.sfx('flapOpen'); }
      if (openK < 0.4 && openedSfx) { openedSfx = false; app.audio.sfx('flapClose'); }
      if (openK > 0.97 && !fossilSfx) { fossilSfx = true; app.audio.sfx('fossil'); }
      if (openK < 0.5) fossilSfx = false;
      cardCool = Math.max(0, cardCool - dt);
      const glowE = openK > 0.97 ? 0.5 + 0.5 * Math.sin(t * 2.4) : 0; slabMat.color.setRGB(0.84 + glowE * 0.1, 0.83 + glowE * 0.09, 0.78 + glowE * 0.06);
      if (openK > 0.97 && rate > 0) { sparkT += dt * rate * 1.2; while (sparkT > 1) { sparkT -= 1; const w = ctx.world(BX + (Math.random() - 0.5) * 2.6, 0.5 + Math.random() * 1.6, BZ + 0.1); app.fx.glow.emit({ x: w.x, y: w.y, z: w.z, vx: 0, vy: 0.12, vz: 0, life: 1.4, size: 0.16, alpha: 0.8, color: [1, 0.92, 0.6] }); } }
      // Schlammwölkchen, wenn das Tier den Grund erreicht
      if (s1 > 0.97 && !puffed) { puffed = true; const w = ctx.world(BX - 0.4, 0.95, BZ + 0.3); if (rate > 0) app.fx.dust.burst(Math.round(7 * rate), { x: w.x, y: w.y, z: w.z, life: 1.4, size: 0.3, alpha: 0.5, color: [0.93, 0.89, 0.7], drag: 1.8, grow: 1.6 }, { speed: 0.35, up: 0.3, px: 0.5, pz: 0.05 }); app.audio.sfx('thud'); }
      if (s1 < 0.8) puffed = false;
      if (Math.abs(v - zeitLast) > 0.004) { app.audio.ctl('timeLapse', v); zeitLast = v; }
      // aufsteigende Blasen am sinkenden Tier
      if (v < 0.3 && v > 0.01 && rate > 0 && Math.random() < dt * 7 * rate) { const w = ctx.world(BX - 0.4 + (Math.random() - 0.5) * 0.8, 0.27 + cg.position.y + 0.1, BZ + 0.3); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0, vy: 0.35, vz: 0, life: 1.1, size: 0.07, alpha: 0.7, color: [0.92, 1, 1], drag: 0.3 }); }
    });
    ctx.spread.p3 = { zeitCtl, flatterCtl, ripL, ripR };
  },
  onDeactivate(ctx) {
    const s = ctx.spread.p3; if (!s) return;
    s.ripL.clear(); s.ripR.clear(); s.zeitCtl.setValue(0, { snap: true }); s.flatterCtl.setValue(0, { snap: true });
  },
};
