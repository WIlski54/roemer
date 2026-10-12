// Station 4: Kreide-Meer – „Flügel über dem Meer“
// Steilküste aus Holzschichten, Meer aus Papierwellen. Pteranodon an Fäden (Laschen „FLATTER!“ und „STURZ!“),
// Elasmosaurus (Schieber „Periskop“), Mosasaurus schnellt hervor, wenn man auf die Wellen tippt. Die drei sind keine Dinosaurier („Cousins“).
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, pebbles, speckles, blotches } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt } from '../engine/popup.js';
import { lerp, clamp, smooth, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { fxRate, Threads, waveStripPart, addBlink, updateBlink, partPoint, ramp, RipplePool } from './kit234.js';

const IDX = 4;
const PX = 8.6;                  // Aufhängung des Pteranodon
const HANG = 3.0;                // Höhe der Füße im Ruhezustand
const ELA_Y = -0.35;             // Elasmosaurus-Körper liegt zum Teil unter der Wasserfläche (= Seitenfläche)
const ELA_X = 4.2, ELA_Z = -1.5;
const MOS_Z = 0.05;

// ------------------------------------------------------------------ gemalte Seiten
const shoreX = (z) => -5.25 + 0.5 * Math.sin(z * 0.9 + 1) + 0.28 * Math.sin(z * 2.3);
function seaGround(m, x0, x1) {
  const { ctx } = m; const S = m.S;
  const g = ctx.createLinearGradient(0, m.z(-4.25), 0, m.z(4.25)); g.addColorStop(0, '#7fd6d8'); g.addColorStop(0.4, '#3ba5c6'); g.addColorStop(0.75, '#1f73a6'); g.addColorStop(1, '#154f86');
  ctx.fillStyle = g; ctx.fillRect(m.x(x0), 0, (x1 - x0) * S, ctx.canvas.height);
  blotches(m, { x0, x1, z0: -4, z1: 4, n: 26, rmin: 0.8, rmax: 2.4, colors: ['rgba(190,245,240,.1)', 'rgba(10,50,110,.18)', 'rgba(255,255,255,.05)'], seed: x0 < 0 ? 61 : 62 });
  // Strömungslinien
  const r = mulberry32(x0 < 0 ? 5 : 6); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(1, 0.026 * S); ctx.lineCap = 'round';
  for (let i = 0; i < 46; i++) {
    const [X, Y] = m.pt(lerp(x0 + 0.4, x1 - 0.4, r()), lerp(-4, 4, r())), w = (0.2 + r() * 0.3) * S;
    ctx.beginPath(); ctx.moveTo(X - w, Y); ctx.quadraticCurveTo(X - w / 2, Y - 0.08 * S, X, Y); ctx.quadraticCurveTo(X + w / 2, Y + 0.08 * S, X + w, Y); ctx.stroke();
  }
}
function foamRing(m, cx, cz, rx, rz) {
  const { ctx } = m; ctx.save(); ctx.translate(m.x(cx), m.z(cz)); ctx.scale(1, rz / rx);
  const R = rx * m.S; const g = ctx.createRadialGradient(0, 0, R * 0.4, 0, 0, R); g.addColorStop(0, 'rgba(235,252,250,.55)'); g.addColorStop(0.7, 'rgba(180,235,240,.25)'); g.addColorStop(1, 'rgba(150,225,235,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill(); ctx.restore();
}

// ------------------------------------------------------------------ Steilküste aus Holzschichten
function cliffPoly(x0, x1, h, seed) {
  const r = mulberry32(seed * 11 + 1); const pts = [[x0, 0], [x0, h * 0.9]];
  for (let x = x0 + 0.3, i = 0; x < x1 - 0.5; x += 0.3 + r() * 0.25, i++) pts.push([x, h * (0.9 + 0.1 * Math.sin(i * 0.8 + seed) - 0.05 * r())]);
  const yt = pts[pts.length - 1][1];
  pts.push([x1 - 0.15, yt * 0.97], [x1 + 0.02, yt * 0.82], [x1 - 0.14, yt * 0.7], [x1 + 0.05, yt * 0.55], [x1 - 0.12, yt * 0.4], [x1 + 0.03, yt * 0.25], [x1 - 0.06, yt * 0.1], [x1, 0]);
  return pts;
}
const WOOD = ['#9a6a3e', '#b8854f', '#7e5230', '#c49560', '#8a5c36', '#a87848'];
function woodDeco(seed) {
  return (c, bb) => {
    const { ctx, tf } = c; const r = mulberry32(seed * 5 + 2);
    const bh = 0.36; const n = Math.ceil(bb.h / bh);
    for (let k = 0; k < n; k++) {
      const y0 = bb.y0 + k * bh; ctx.fillStyle = WOOD[(k + seed) % WOOD.length]; ctx.globalAlpha = 0.9;
      ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = bb.x0 + bb.w * i / 40, [X, Y] = tf(x, y0 + bh + Math.sin(i * 0.7 + k * 1.9 + seed) * 0.035); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      for (let i = 40; i >= 0; i--) { const x = bb.x0 + bb.w * i / 40, [X, Y] = tf(x, y0 + Math.sin(i * 0.7 + (k - 1) * 1.9 + seed) * 0.035); ctx.lineTo(X, Y); }
      ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
      // helle Oberkante + dunkle Fuge
      ctx.strokeStyle = 'rgba(255,225,170,.35)'; ctx.lineWidth = Math.max(1, c.S * 0.02); ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = bb.x0 + bb.w * i / 40, [X, Y] = tf(x, y0 + bh - 0.03 + Math.sin(i * 0.7 + k * 1.9 + seed) * 0.035); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke();
      ctx.strokeStyle = 'rgba(40,22,10,.6)'; ctx.lineWidth = Math.max(1.2, c.S * 0.03); ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = bb.x0 + bb.w * i / 40, [X, Y] = tf(x, y0 + Math.sin(i * 0.7 + (k - 1) * 1.9 + seed) * 0.035); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke();
      // Maserung
      ctx.strokeStyle = 'rgba(50,28,12,.3)'; ctx.lineWidth = Math.max(1, c.S * 0.012);
      for (let j = 0; j < 6; j++) { const yy = y0 + 0.05 + r() * (bh - 0.1), x1 = bb.x0 + r() * bb.w, len = 0.8 + r() * 1.8; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const [X, Y] = tf(x1 + len * i / 12, yy + Math.sin(i * 0.9 + j) * 0.02); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke(); }
      if (r() < 0.55) { const [X, Y] = tf(bb.x0 + r() * bb.w, y0 + bh * (0.35 + r() * 0.3)); ctx.fillStyle = 'rgba(60,32,14,.55)'; ctx.beginPath(); ctx.ellipse(X, Y, c.S * 0.13, c.S * 0.06, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(40,20,8,.6)'; ctx.stroke(); }
    }
    // Schatten zur Meerseite
    const g = ctx.createLinearGradient(...tf(bb.x0, 0), ...tf(bb.x1, 0)); g.addColorStop(0, 'rgba(255,230,180,.12)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,15,5,.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
  };
}
function cliffPart(x0, x1, h, seed) {
  const poly = cliffPoly(x0, x1, h, seed);
  // grüne Kappe: obere Kante nachzeichnen
  const top = poly.slice(1, poly.length - 8); const cap = [...top, ...top.slice().reverse().map(([x, y], i) => [x, y - (0.2 + 0.1 * Math.abs(Math.sin(i * 1.3 + seed)))])];
  return {
    layers: [
      { shapes: [poly], fill: { top: '#a87848', bottom: '#6d4426' }, deco: woodDeco(seed) },
      { shapes: [cap], fill: { top: '#8dc66b', bottom: '#4f9a56' }, deco: (c, bb) => { const { ctx, tf } = c; const r = mulberry32(seed + 9); ctx.strokeStyle = 'rgba(30,80,40,.6)'; ctx.lineWidth = Math.max(1, c.S * 0.02); for (let i = 0; i < 60; i++) { const [X, Y] = tf(bb.x0 + r() * bb.w, bb.y0 + r() * bb.h); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + (r() - 0.5) * c.S * 0.05, Y - c.S * (0.05 + r() * 0.07)); ctx.stroke(); } } },
    ],
  };
}

// Papierwellen
const waveStrip = (w, h, ph, sd, c0, c1, wave = 0.1, fr = 3.4) => waveStripPart(w, h, { top: c0, bottom: c1, wave, freq: fr, phase: ph, seed: sd, scallop: true, step: 0.09, lines: true, foam: true, glint: '#d8f6f4', foamCol: '#ffffff' });

// kleine Hilfsfunktionen
const crKey = (keys, v) => { const n = keys.length; let i = 0; while (i < n - 2 && v > keys[i + 1][0]) i++; const a = keys[i], b = keys[i + 1]; return lerp(a[1], b[1], smooth(clamp((v - a[0]) / (b[0] - a[0] || 1)))); };

export default {
  id: 'kreide-meer',
  mood: mood({ key: '#fff4dc', keyI: 2.3, sky: '#dcf2f6', gnd: '#3b7fa6', hemiI: 1.95, pos: [-12, 21, 9], rim: 0.2 }),
  motes: { colors: [[0.9, 0.98, 1], [1, 1, 1], [0.8, 0.95, 1]], size: 0.12, alpha: 0.32, dy: 0.05, dx: 0.09, dz: 0.012, tw: 1.0, density: 0.9 },
  atmo: 'kreide-meer',
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        ground: { back: '#7fd6d8', front: '#e6c995' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 51,
        draw(ctx, m) {
          const S = m.S;
          seaGround(m, -12.3, 0.3);
          // Strand mit Wellenkante
          const pts = []; for (let z = -4.4; z <= 4.41; z += 0.1) pts.push([shoreX(z), z]);
          ctx.save();
          const path = (dx) => { ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0] + dx, p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); };
          ctx.lineJoin = 'round'; ctx.lineCap = 'round';
          ctx.strokeStyle = 'rgba(190,240,236,.45)'; ctx.lineWidth = 1.5 * S; path(0.55); ctx.stroke();
          ctx.strokeStyle = 'rgba(215,248,242,.5)'; ctx.lineWidth = 0.8 * S; path(0.3); ctx.stroke();
          ctx.restore();
          ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
          ctx.lineTo(m.x(-12.4), m.z(4.4)); ctx.lineTo(m.x(-12.4), m.z(-4.4)); ctx.closePath();
          const sg = ctx.createLinearGradient(m.x(-12), 0, m.x(-5), 0); sg.addColorStop(0, '#e9cf9c'); sg.addColorStop(1, '#d9aa72'); ctx.fillStyle = sg; ctx.fill();
          ctx.save(); ctx.clip();
          blotches(m, { x0: -12, x1: -5, z0: -4, z1: 4, n: 20, rmin: 0.5, rmax: 1.4, colors: ['rgba(150,100,50,.16)', 'rgba(255,240,200,.2)'], seed: 53 });
          // dunkler, nasser Felsgrund unter der Klippe
          blotches(m, { x0: -12, x1: -5.5, z0: -3.8, z1: -1.2, n: 18, rmin: 0.6, rmax: 1.6, colors: ['rgba(60,38,22,.4)', 'rgba(90,60,35,.3)'], seed: 54 });
          speckles(m, { x0: -12, x1: -5, z0: -1.5, z1: 4, n: 280, color: 'rgba(120,80,40,.3)', size: 0.022, seed: 55 });
          pebbles(m, { x0: -11, x1: -5.6, z0: 0, z1: 3.6, n: 10, seed: 56, colors: ['#cdb08a', '#b99870', '#e0c8a0'] });
          pebbles(m, { x0: -11.5, x1: -6.0, z0: -3.4, z1: -1.4, n: 9, seed: 57, colors: ['#7a5a40', '#5e4430', '#8d6a4c'] });
          ctx.restore();
          // Schaumsaum
          ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.lineWidth = 0.075 * S; path(0.0); ctx.stroke();
          ctx.setLineDash([0.02 * S, 0.15 * S]); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.05 * S; path(0.22); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
        },
      },
      R: {
        ground: { back: '#7fd6d8', front: '#154f86' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 52,
        draw(ctx, m) {
          seaGround(m, -0.3, 12.3);
          foamRing(m, ELA_X, ELA_Z + 0.1, 3.8, 0.8);
        },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const SKY_W = 11.55, CX = { L: -5.975, R: 5.975 };
    // ------------------------------------------------------------ Himmel + Horizont
    for (const s of ['L', 'R']) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-SKY_W / 2, SKY_W / 2, 5.0, {
        fill: { top: '#69bfe6', bottom: '#e4f6f3' }, wave: 0.26, freq: 2.7, phase: 1.3 + k * 1.7, seed: 23 + k,
        deco: (c, bb) => {
          softLight(c, bb, { color: 'rgba(255,246,200,.55)', cx: s === 'L' ? 0.62 : 0.3, cy: 0.66, r: 0.8 });
          const { ctx: g, tf } = c; const rr = mulberry32(31 + k);
          for (let i = 0; i < 6; i++) { const cx = bb.x0 + rr() * bb.w, cy = bb.y0 + bb.h * (0.5 + rr() * 0.3), rad = 0.9 + rr() * 1.2; const [X, Y] = tf(cx, cy); const gr = g.createRadialGradient(X, Y, 0, X, Y, rad * c.S); gr.addColorStop(0, 'rgba(255,255,255,.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.translate(X, Y); g.scale(1, 0.32); g.translate(-X, -Y); g.fillStyle = gr; g.beginPath(); g.arc(X, Y, rad * c.S, 0, TAU); g.fill(); g.restore(); }
          dither(c, bb, '#fff', { n: 80, alpha: 0.14, size: 0.04, seed: 7 + k });
        },
      }), { x: CX[s], z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0.0, ppu: 70, border: 0.04 });
      ctx.flat(waveStrip(SKY_W, 1.0, 0.7 + k * 2, 8 + k, '#a5e6e2', '#7bd0d6', 0.12, 4.2), { x: CX[s], z: -3.7, name: 'horizon' + s, delay: 0.05, ppu: 70, border: 0.03, thickness: 0.015 });
    }
    yield;
    const sun = ctx.prop('sun_disc', { x: -2.3, z: -3.9, h: 1.55, y: 3.0, delay: 0.2, cast: false });
    const cloudX = [-9.0, 2.6, 8.4];
    const clouds = [
      ctx.prop('cloud_a', { x: cloudX[0], y: 4.0, z: -3.85, len: 3.2, delay: 0.2, cast: false }),
      ctx.prop('cloud_b', { x: cloudX[1], y: 3.9, z: -3.8, len: 3.0, delay: 0.24, cast: false }),
      ctx.prop('cloud_a', { x: cloudX[2], y: 4.15, z: -3.85, len: 2.8, delay: 0.22, cast: false }),
    ];
    yield;

    // ------------------------------------------------------------ Steilküste (gestufte Holzschichten) + Pflanzen
    [[0, -5.55, 4.1, 1, -3.4], [0, -6.3, 3.5, 2, -2.85], [0, -7.05, 2.9, 3, -2.3], [0, -7.85, 2.3, 4, -1.75]].forEach(([_, xr, h, sd, z], i) => {
      const x0 = -11.9, w = xr - x0, cx = (x0 + xr) / 2;
      ctx.flat({ layers: cliffPart(-w / 2, w / 2, h, sd).layers }, { x: cx, z, name: 'cliff' + i, delay: 0.1 + i * 0.05, ppu: 70, border: 0.04, thickness: 0.03 });
    });
    ctx.prop('cliff_layers', { x: -5.0, z: -1.5, h: 3.1, delay: 0.3 });
    ctx.prop('cliff_layers', { x: -4.1, z: -2.3, h: 2.2, delay: 0.32, facing: -1, variant: { seed: 2 } });
    ctx.prop('ginkgo', { x: -9.2, z: -3.3, h: 1.85, y: 3.5, delay: 0.34 });
    ctx.prop('cycad', { x: -7.3, z: -2.7, h: 1.35, y: 3.05, delay: 0.36 });
    ctx.prop('bush', { x: -10.6, z: -2.2, len: 1.5, y: 2.4, delay: 0.38 });
    yield;
    // Felsinsel im Meer
    ctx.prop('island_rock', { x: -2.4, z: -2.3, h: 2.1, delay: 0.3 });
    yield;

    // ------------------------------------------------------------ Meer aus Papierwellen
    const waves = [];
    const addWave = (side, cx, w, z, h, ph, sd, c0, c1, sp, amp, wave, fr) => {
      const p = ctx.flat(waveStrip(w, h, ph, sd, c0, c1, wave, fr), { x: cx, z, name: 'wave' + waves.length, delay: 0.4 + waves.length * 0.025, ppu: 70, border: 0.025, thickness: 0.015 });
      p.sp = sp; p.ph = ph; p.amp = amp; p.sc = 0.08; p.bx = cx; waves.push(p); return p;
    };
    // rechte Seite: 5 Streifen von hinten (hellgrün-türkis) nach vorn (tiefblau)
    addWave('R', 6.0, 11.6, -3.0, 0.52, 0.2, 3, '#86dcd9', '#4fb9cb', 0.55, 0.16, 0.09, 3.6);
    addWave('R', 6.0, 11.6, -2.3, 0.66, 1.9, 5, '#56c3d2', '#2f95bd', 0.62, 0.15, 0.1, 3.2);
    const wFront = addWave('R', 6.0, 11.6, -1.05, 0.78, 3.6, 7, '#33a3c9', '#1f72a6', 0.7, 0.14, 0.11, 3.0);
    addWave('R', 6.0, 11.6, 0.55, 0.8, 5.1, 9, '#1f84ba', '#15548a', 0.78, 0.13, 0.11, 2.8);
    addWave('R', 6.0, 11.6, 1.65, 0.62, 0.9, 11, '#17689f', '#0f3f73', 0.86, 0.12, 0.1, 2.6);
    // linke Seite (kürzer)
    addWave('L', -2.85, 5.3, -1.1, 0.7, 2.5, 13, '#4cbdd0', '#2b8fb8', 0.66, 0.14, 0.1, 3.0);
    addWave('L', -2.85, 5.3, 0.5, 0.74, 4.0, 15, '#2a9bc6', '#1b69a2', 0.74, 0.13, 0.1, 2.8);
    addWave('L', -2.85, 5.3, 1.7, 0.6, 5.7, 17, '#1b78b0', '#124a80', 0.82, 0.12, 0.1, 2.6);
    yield;

    // ------------------------------------------------------------ Tiere
    const ela = ctx.stand('elasmosaurus', { x: ELA_X, z: ELA_Z, y: ELA_Y, len: 6.4, facing: 1, delay: 0.5 });
    const blinks = [addBlink(ela.fig, 'neck', ela.fig.spec.anchors.eye, 0.098, '#5fa563')];
    const pt = ctx.stand('pteranodon', { x: PX, z: -0.3, y: HANG, len: 4.4, facing: 1, delay: 0.56 });
    const moso = ctx.stand('mosasaurus', { x: 6.0, z: MOS_Z, y: -5.0, len: 5.8, facing: 1, delay: 0.6, hint: false });
    moso.popup.pivot.visible = false;
    const mosoHits = moso.hitMeshes; moso.hitMeshes = [];          // nur antippbar, solange der Mosasaurus sichtbar ist
    const fish = ctx.prop('fish_b', { x: PX, z: -0.1, len: 1.0, delay: 0.6 });
    const ptWs = pt.fig.ws, ptCy = ((pt.fig.bbox.y0 + pt.fig.bbox.y1) / 2) * ptWs, ptThroat = 1.62 * ptWs - ptCy;
    const threads = new Threads(R, { color: 0x5a4632, thick: 0.015 });
    threads.add(pt.popup, pt.fig, [0.3, 1.0], [PX + 0.75, 4.9, -3.95]);
    threads.add(pt.popup, pt.fig, [-0.3, 1.0], [PX - 0.75, 4.9, -3.95]);
    const ripR = new RipplePool(R, { n: 10, color: 0xffffff, op: 0.75 }), ripL = new RipplePool(L, { n: 6, color: 0xffffff, op: 0.7 });
    yield;

    // ------------------------------------------------------------ Regler
    const flapCtl = ctx.control('L', { id: 'flatter', label: 'FLATTER!', a: [-4.1, 3.6], b: [-1.5, 3.6], size: [2.3, 1.0], color: '#e0732f', value: 0, springBack: true });
    const diveCtl = ctx.control('R', { id: 'sturz', label: 'STURZ!', a: [1.6, 3.6], b: [3.7, 3.6], size: [2.2, 1.0], color: '#c8352c', value: 0, springBack: true });
    const periCtl = ctx.control('R', { id: 'periskop', label: 'Periskop', a: [6.9, 3.6], b: [9.1, 3.6], size: [2.6, 1.05], color: '#1f7fa6', value: 0, springBack: false, hold: true, ticks: 4 });
    let flV = 0, flLast = 0, flSpeed = 0, diveV = 0, periV = 0, periLast = 0;
    flapCtl.on((v) => { flV = v; }); diveCtl.on((v) => { diveV = v; }); periCtl.on((v) => { periV = v; });
    for (const c of [flapCtl, diveCtl, periCtl]) { c.onGrab = () => app.audio.sfx('grab'); }
    flapCtl.onRelease = diveCtl.onRelease = () => app.audio.sfx('snap');
    periCtl.onTick = (v) => app.audio.sfx('slide', { v }); periCtl.onRelease = () => app.audio.sfx('snap');

    // ------------------------------------------------------------ Tippen auf die Wellen: Mosasaurus schnellt hervor
    let leapK = -1, leapX0 = 4.5, leapCool = 0, leapWhoosh = false;
    const splash = (x, y, z, n, big) => { const w = ctx.world(x, y, z), r = fxRate(app); if (r > 0) app.fx.dust.burst(Math.max(2, Math.round(n * r)), { x: w.x, y: w.y, z: w.z, life: big ? 1.1 : 0.8, size: big ? 0.2 : 0.13, alpha: 0.85, color: [0.88, 0.98, 1], grav: 5.5 }, { speed: big ? 2.2 : 1.3, up: big ? 2.4 : 1.6, px: big ? 1.4 : 0.5, pz: 0.3 }); };
    const startLeap = (px, side) => {
      if (leapK >= 0 || leapCool > 0) return;
      leapCool = 2.6; leapK = 0; leapWhoosh = false; leapX0 = clamp(px - 1.2, 2.3, 6.4);
      moso.popup.pivot.visible = true; moso.hitMeshes = mosoHits; app.audio.sfx('wave');
      ripR.emit(leapX0 + 0.9, MOS_Z + 0.3, 1.3, 1.8); splash(leapX0 + 0.9, 0.3, MOS_Z + 0.2, 14, true);
    };
    const tapPlane = (side, x0, x1, z0, z1) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
      m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.75, (z0 + z1) / 2); side.add(m);
      side.addTap(m, (hit) => { const p = side.group.worldToLocal(hit.point.clone()); const px = side === R ? p.x : 2.4; if (leapK < 0 && leapCool <= 0) startLeap(px, side); (side === R ? ripR : ripL).emit(p.x, p.z + 0.2, 0.8, 1.4); });
      return m;
    };
    tapPlane(R, 0.3, 11.7, -3.1, 2.5); tapPlane(L, -5.2, -0.3, -2.9, 2.6);
    moso.onWake = (a) => { a.tw.add(0.5, (k) => { poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => poseAmt(a.fig, 'jaw', 0) }); };
    pt.onWake = (a) => { a.tw.add(0.7, (k) => { wakeFlap = Math.sin(k * Math.PI); }, { done: () => { wakeFlap = 0; } }); };
    ela.onWake = (a) => { a.tw.add(0.9, (k) => { a.hop = Math.sin(k * Math.PI) * 0.12; }, { done: () => { a.hop = 0; } }); };
    let wakeFlap = 0;

    // ------------------------------------------------------------ pro Frame
    const out = { x: 0, y: 0 };
    let flapPh = 0, ptSfx = false, dipped = false, dropT = 0, ringT = 2, plungeSfx = false, fishK = -1, fishT = 3, fishX = PX, uwLast = 0;
    const CY0 = HANG + ptCy;
    const KC = [[0, CY0], [0.1, CY0 + 0.12], [0.36, CY0 - 1.0], [0.5, 0.3], [0.58, 0.45], [0.82, CY0 - 0.5], [1, CY0]];   // Höhe der Körpermitte
    const KT = [[0, 0], [0.1, 0], [0.34, 3.0], [0.52, 3.0], [0.8, 0.12], [1, 0]];                                          // Drehung (3 = Kopf nach unten)
    ctx.onUpdate((dt, t) => {
      if (!ctx.spread.active) return;
      const rate = fxRate(app);
      // ===== Wellen, Wolken
      for (const w of waves) { w.cut.mesh.position.x = Math.sin(t * w.sp + w.ph) * w.amp; w.cut.mesh.scale.y = 1 + w.sc * Math.sin(t * w.sp * 1.7 + w.ph * 2.3); }
      for (let i = 0; i < clouds.length; i++) clouds[i].group.position.x = cloudX[i] + Math.sin(t * (0.04 + i * 0.012) + i * 1.3) * 1.4;
      sun.group.position.y = 3.0 + 0.05 * Math.sin(t * 0.3);

      // ===== Pteranodon: Flattern (Lasche links) und Sturzflug (Lasche rechts)
      flSpeed += ((flV - flLast) / Math.max(dt, 1e-3) - flSpeed) * Math.min(1, dt * 8); flLast = flV;
      const mv = clamp(Math.abs(flSpeed) * 2.4), fv = flV;
      const dv = diveV;
      const climb = smooth(ramp(dv, 0.5, 0.72)) * (1 - smooth(ramp(dv, 0.93, 1)));
      const tuck = smooth(ramp(dv, 0.12, 0.3)) * (1 - smooth(ramp(dv, 0.5, 0.64)));
      const amp = clamp(0.3 + mv * 0.9 + fv * 0.25 + climb * 0.5, 0.2, 1);
      wakeFlap = Math.max(0, wakeFlap - dt * 0.8);
      flapPh += dt * (4.2 + 9 * mv + 5 * fv + 8 * climb + 10 * wakeFlap);
      const fl = 0.5 + 0.5 * Math.sin(flapPh);
      const wa = lerp(lerp(-0.45, 0.6, fl) * Math.max(amp, wakeFlap), -0.45, tuck);
      pt.fig.rotatePart('wing', wa); pt.fig.rotatePart('wing2', -wa);
      // Bahn: Mitte (cx,cy) und Drehung th um den Fußpunkt, das Popup wird entsprechend versetzt
      const th = crKey(KT, dv) + (dv < 0.02 ? 0.05 * Math.sin(t * 0.8) : 0) + 0.1 * tuck * Math.sin(t * 11) * 0;
      const cy = crKey(KC, dv) + (0.1 * Math.sin(t * 0.9) + 0.14 * Math.sin(fv * TAU) + 0.1 * fv) * (1 - tuck);
      const cx = PX + 0.6 * Math.sin(fv * TAU * 0.5) * Math.min(1, fv * 6) + 0.25 * Math.sin(t * 0.37) * (1 - tuck);
      const sn = Math.sin(th), cs = Math.cos(th);
      const bx = cx + ptCy * sn, by = cy - ptCy * cs;
      pt.popup.group.position.x = bx; pt.popup.group.position.y = by; pt.popup.pivot.rotation.z = th;
      // Fisch: schwimmt an der Oberfläche, springt dem Kopf entgegen und hängt dann im Schlund
      const tx = cx + ptThroat * -sn, ty = cy + ptThroat * cs;                 // Schlund (Fischposition am Tier)
      const jump = smooth(ramp(dv, 0.28, 0.45)), carry = dv >= 0.45;
      let idleY = 0, idleR = 0.08 * Math.sin(t * 2.2);
      if (dv < 0.2 && fishK < 0) { fishT -= dt; if (fishT <= 0) { fishK = 0; fishX = PX - 0.6 + Math.random() * 1.2; ripR.emit(fishX, -0.1, 0.5, 1.2); if (rate > 0) splash(fishX, 0.1, -0.1, 5, false); app.audio.sfx('splash'); } }
      if (fishK >= 0) {
        fishK += dt / 1.1; const k = Math.min(1, fishK); idleY = 4 * k * (1 - k) * 1.0; idleR = lerp(0.9, -0.9, k);
        if (k >= 1) { fishK = -1; fishT = 5 + Math.random() * 4; ripR.emit(fishX + 0.7, -0.1, 0.6, 1.3); if (rate > 0) splash(fishX + 0.7, 0.1, -0.1, 5, false); }
      } else if (dv > 0.2) fishX = PX;
      const fxp = carry ? tx : lerp(fishX, tx, jump), fyp = carry ? ty : lerp(idleY - 0.05, ty, jump);
      fish.group.position.x = fxp; fish.group.position.y = fyp - 0.14;
      fish.pivot.rotation.z = carry ? 0.5 * th + 0.22 * Math.sin(t * 10) * ramp(dv, 0.5, 0.7) : lerp(idleR, 0.9, jump);
      fish.fig.rotatePart('tail', 0.35 * Math.sin(t * (dv > 0.3 ? 14 : 5)));
      // Wassereintritt (Schnabel berührt die Fläche)
      if (dv > 0.44 && !dipped) { dipped = true; splash(cx, 0.1, -0.1, 16, true); ripR.emit(cx, 0.15, 1.3, 1.8); ripR.emit(cx, 0.15, 0.7, 1.2); app.audio.sfx('splash'); }
      if (dv < 0.4) dipped = false;
      if (dv > 0.12 && !plungeSfx) { plungeSfx = true; app.audio.sfx('dive'); }
      if (dv < 0.06) plungeSfx = false;
      if (dv > 0.1 && dv < 0.46 && Math.random() < dt * 8 * rate) { const w = ctx.world(cx + (Math.random() - 0.5) * 0.7, cy + 0.8, -0.3); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0, vy: 0.2, vz: 0, life: 0.6, size: 0.1, alpha: 0.5, color: [1, 1, 1], drag: 2 }); }
      if (dv > 0.5 && dv < 0.9) { dropT += dt * 14 * rate; while (dropT > 1) { dropT -= 1; const w = ctx.world(cx + (Math.random() - 0.5) * 0.5, Math.max(0.2, cy - 0.3), -0.1); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.3, vy: -0.1, vz: 0, life: 0.9, size: 0.07, alpha: 0.85, color: [0.85, 0.97, 1], grav: 4 }); } }
      const uw = smooth(ramp(dv, 0.44, 0.5)) * (1 - smooth(ramp(dv, 0.56, 0.66))) * 0.7;
      if (Math.abs(uw - uwLast) > 0.03 || (uw === 0 && uwLast !== 0)) { uwLast = uw; app.audio.ctl('underwater', uw); }
      if (mv > 0.2 && !ptSfx) { ptSfx = true; app.audio.sfx('flap'); } if (mv < 0.1) ptSfx = false;
      threads.update();

      // ===== Elasmosaurus-Periskop
      const dragging = periCtl.dragging;
      const ang = lerp(-0.32, 0.78, periV) + (dragging ? 0 : 0.035 * Math.sin(t * 0.6) + 0.015 * Math.sin(t * 1.7 + 1));
      ela.fig.rotatePart('neck', ang);
      ela.popup.group.position.y = ELA_Y + 0.04 * Math.sin(t * 0.9) + 0.1 * smooth(periV);
      poseAmt(ela.fig, 'flipperA', 0.5 + 0.5 * Math.sin(t * 1.3)); poseAmt(ela.fig, 'flipperB', 0.5 + 0.5 * Math.sin(t * 1.3 + 1.5));
      const dvp = periV - periLast; periLast = periV;
      partPoint(ela, 'neck', 10.25, 4.2, ang, out);
      if (dvp > 0.0004 && out.y > 0.5) { dropT += dt * 16 * rate; while (dropT > 1) { dropT -= 1; const w = ctx.world(out.x + (Math.random() - 0.5) * 0.3, out.y, ELA_Z + 0.05); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.2, vy: 0.0, vz: 0, life: 1.0, size: 0.06, alpha: 0.85, color: [0.85, 0.97, 1], grav: 4.5 }); } }
      ringT -= dt * Math.max(0.5, rate); if (ringT <= 0) { ringT = 2.4 + Math.random() * 1.6; ripR.emit(ELA_X + 0.8 + Math.random() * 1.2, ELA_Z + 0.35, 0.8, 2.4); if (Math.random() < 0.5) ripL.emit(-4.6 + Math.random() * 3.6, -1.5 + Math.random() * 3, 0.5, 2.2); }
      for (const b of blinks) updateBlink(b, dt);

      // ===== Mosasaurus: Sprung
      leapCool = Math.max(0, leapCool - dt);
      if (leapK >= 0) {
        leapK += dt / 1.9; const k = Math.min(1, leapK);
        const arc = 4 * k * (1 - k), x = leapX0 + 2.4 * k, y = -2.45 + 5.45 * arc;
        moso.popup.group.position.set(x, y, MOS_Z); moso.popup.pivot.rotation.z = lerp(0.95, -1.0, k) + 0.04 * Math.sin(t * 9);
        poseAmt(moso.fig, 'jaw', smooth(ramp(k, 0.3, 0.45)) * (1 - smooth(ramp(k, 0.62, 0.78)))); poseAmt(moso.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 12)); poseAmt(moso.fig, 'flipperA', 0.5 + 0.5 * Math.sin(t * 6));
        if (k > 0.12 && !leapWhoosh) { leapWhoosh = true; app.audio.sfx('whoosh'); }
        if (y > 0.4 && Math.random() < dt * 14 * rate) { const w = ctx.world(x - 1.3 + Math.random() * 2.2, y + 0.3 + Math.random() * 0.6, MOS_Z); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.4, vy: -0.2, vz: 0, life: 0.9, size: 0.08, alpha: 0.9, color: [0.88, 0.98, 1], grav: 4.5 }); }
        if (k >= 1) { leapK = -1; moso.popup.pivot.visible = false; moso.hitMeshes = []; moso.popup.group.position.y = -5; poseAmt(moso.fig, 'jaw', 0); splash(x + 0.9, 0.3, MOS_Z + 0.2, 20, true); ripR.emit(x + 0.9, MOS_Z + 0.3, 1.6, 2.0); ripR.emit(x + 0.9, MOS_Z + 0.3, 0.9, 1.3); app.audio.sfx('splash', { big: true }); app.cam.shake(0.035, 0.25); }
      }
      ripR.update(dt); ripL.update(dt);
    });
    ctx.spread.p4 = { flapCtl, diveCtl, periCtl, ripL, ripR, moso, resetLeap: () => { leapK = -1; leapCool = 0; moso.popup.pivot.visible = false; moso.hitMeshes = []; moso.popup.group.position.y = -5; } };
  },
  onDeactivate(ctx) {
    const s = ctx.spread.p4; if (!s) return;
    s.ripL.clear(); s.ripR.clear(); s.resetLeap(); ctx.app.audio.ctl('underwater', 0);
    s.flapCtl.setValue(0, { snap: true }); s.diveCtl.setValue(0, { snap: true }); s.periCtl.setValue(0, { snap: true });
  },
};
