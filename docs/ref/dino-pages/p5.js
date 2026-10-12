// Station 5: Spätkreide an Land – „Könige der Kreide“ (Nordamerika, ca. 68–66 Mio. Jahre)
// Links: T. rex (BEISS!) und gedruckte Textkarte, rechts: Triceratops (Kopf runter!), Ankylosaurus mit Keule, Flussdelta aus Papierstreifen.
import { mood } from '../engine/scene.js';
import { textCard, printLabel, pebbles, grassTufts, blotches, speckles } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt } from '../engine/popup.js';
import { sunGlow } from '../engine/effects.js';
import { lerp, clamp, smooth, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { poly, blob } from '../art/dsl.js';
import { wall, treeLinePart, waterPart, riverBand, footTrack, makeBlinker, fxN, puff, Swayers, child, floorFerns, floorFlowers, puddle } from './_p56kit.js';

const IDX = 5;
const CHARCOAL = '#1b2a45';

// kleiner Flugsaurier / Vogel als Scherenschnitt-Silhouette im Himmel (nur gemalt)
function flyer(c, x, y, s, flip = 1, alpha = 0.7) {
  const { ctx, tf } = c; const P = (dx, dy) => tf(x + dx * s * flip, y + dy * s);
  ctx.save(); ctx.fillStyle = CHARCOAL; ctx.globalAlpha = alpha;
  ctx.beginPath(); let p = P(-0.55, 0.2); ctx.moveTo(...p);
  let q = P(-0.28, 0.3), e = P(0, 0.03); ctx.quadraticCurveTo(...q, ...e);
  q = P(0.28, 0.3); e = P(0.55, 0.2); ctx.quadraticCurveTo(...q, ...e);
  q = P(0.28, 0.12); e = P(0.04, -0.06); ctx.quadraticCurveTo(...q, ...e);
  q = P(-0.28, 0.12); e = P(-0.55, 0.2); ctx.quadraticCurveTo(...q, ...e);
  ctx.fill();
  // Kopf mit Schnabel und Haube
  ctx.beginPath(); p = P(0.0, 0.0); ctx.moveTo(...p); ctx.lineTo(...P(0.34, -0.03)); ctx.lineTo(...P(0.04, 0.06)); ctx.lineTo(...P(-0.16, 0.12)); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// Baumstamm (Totholz) mit gebrochener Spitze – der Stamm, in den der T. rex beißt
function trunkPart(H, W) {
  const hw = W / 2;
  const body = poly([
    [-hw * 1.55, 0], [-hw * 1.05, 0.28], [-hw * 0.92, 0.9], [-hw * 0.86, 2.0], [-hw * 0.84, H * 0.78], [-hw * 0.7, H * 0.93], [-hw * 0.5, H * 0.84], [-hw * 0.32, H * 1.0], [-hw * 0.12, H * 0.9],
    [hw * 0.05, H * 0.97], [hw * 0.25, H * 0.86], [hw * 0.5, H * 0.96], [hw * 0.8, H * 0.8], [hw * 0.86, 2.0], [hw * 0.92, 0.9], [hw * 1.05, 0.28], [hw * 1.55, 0],
  ], 1);
  const stubL = poly([[-hw * 0.8, 2.55], [-hw * 1.9, 2.95], [-hw * 2.0, 3.2], [-hw * 1.5, 3.1], [-hw * 0.8, 2.9]], 1);
  const stubR = poly([[hw * 0.8, 1.55], [hw * 1.9, 1.85], [hw * 1.95, 2.08], [hw * 1.4, 2.0], [hw * 0.8, 1.85]], 1);
  const stubR2 = poly([[hw * 0.8, H * 0.62], [hw * 1.45, H * 0.7], [hw * 1.5, H * 0.74], [hw * 0.8, H * 0.7]], 1);
  return {
    layers: [{
      shapes: [body, stubL, stubR, stubR2], fill: { stops: [[0, '#7a5a3a'], [0.45, '#9a7a52'], [0.8, '#6a4a2e'], [1, '#543823']], dir: 'h' },
      deco(c, bb) {
        const { ctx, tf, S } = c; const r = mulberry32(21);
        // Rindenfurchen
        ctx.save(); ctx.lineCap = 'round';
        for (let i = 0; i < 17; i++) {
          const x = bb.x0 + (0.1 + 0.8 * (i / 16)) * bb.w * 0.8 + bb.w * 0.1, y0 = r() * H * 0.9, L = 0.5 + r() * 1.1;
          ctx.strokeStyle = r() < 0.7 ? 'rgba(50,30,15,.42)' : 'rgba(255,230,180,.25)'; ctx.lineWidth = Math.max(1, (0.025 + r() * 0.03) * S);
          ctx.beginPath(); const [a, b] = tf(x, y0); ctx.moveTo(a, b);
          const [a2, b2] = tf(x + (r() - 0.5) * 0.12, y0 + L * 0.5); const [a3, b3] = tf(x + (r() - 0.5) * 0.08, y0 + L); ctx.quadraticCurveTo(a2, b2, a3, b3); ctx.stroke();
        }
        // Astlöcher
        for (const [x, y, rx, ry] of [[-0.12, 1.2, 0.1, 0.17], [0.15, 2.2, 0.08, 0.13], [-0.2, 3.1, 0.07, 0.11]]) {
          const [X, Y] = tf(x, y); ctx.fillStyle = 'rgba(35,20,8,.65)'; ctx.beginPath(); ctx.ellipse(X, Y, rx * S, ry * S, 0.2, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(210,170,110,.55)'; ctx.lineWidth = Math.max(1, 0.02 * S); ctx.stroke();
        }
        // Moos am Fuß und helle Lichtkante links
        const g = ctx.createLinearGradient(...tf(0, 0), ...tf(0, 1.3)); g.addColorStop(0, 'rgba(80,130,50,.75)'); g.addColorStop(1, 'rgba(80,130,50,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
        ctx.restore();
      },
    }],
  };
}

// frische Bissspur: heller Holzfleck mit Zahndellen (erscheint beim Zubeißen)
function scarPart() {
  const pts = [[-0.34, 0.42], [-0.2, 0.52], [-0.12, 0.34], [0.0, 0.5], [0.1, 0.3], [0.24, 0.44], [0.3, 0.2], [0.2, 0.0], [0.3, -0.2], [0.14, -0.3], [0.2, -0.5], [0.02, -0.4], [-0.08, -0.56], [-0.16, -0.36], [-0.3, -0.46], [-0.34, -0.18], [-0.42, 0.0], [-0.34, 0.2]];
  return {
    layers: [{
      shapes: [poly(pts, 1)], fill: { top: '#f1d9a0', bottom: '#d9b476' }, stroke: 'rgba(100,60,25,.7)',
      deco(c, bb) {
        const { ctx, tf, S } = c; ctx.save(); ctx.strokeStyle = 'rgba(150,100,50,.45)'; ctx.lineWidth = Math.max(1, 0.02 * S); ctx.lineCap = 'round';
        for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(...tf(-0.3 + i * 0.12, 0.4 - i * 0.02)); ctx.lineTo(...tf(-0.28 + i * 0.12, -0.36 + i * 0.03)); ctx.stroke(); }
        ctx.restore();
      },
    }],
  };
}

// Wurzelhöhle (Versteck für Didelphodon): Wurzelbogen mit Moos
function caveArchPart() {
  const arch = poly([
    [-1.25, 0], [-1.1, 0.22], [-1.0, 0.6], [-0.78, 1.02], [-0.34, 1.26], [0.2, 1.24], [0.66, 1.0], [0.92, 0.62], [1.04, 0.22], [1.2, 0],
    [0.7, 0], [0.62, 0.3], [0.38, 0.5], [0.0, 0.56], [-0.38, 0.5], [-0.62, 0.3], [-0.74, 0],
  ], 1);
  return {
    layers: [{
      shapes: [arch], fill: { top: '#6d4d30', bottom: '#4d3320' },
      deco(c, bb) {
        const { ctx, tf, S } = c; const r = mulberry32(5); ctx.save(); ctx.lineCap = 'round';
        // Wurzelstränge
        ctx.strokeStyle = 'rgba(30,18,8,.55)'; ctx.lineWidth = Math.max(1, 0.05 * S);
        for (let i = 0; i < 6; i++) { const a = -1.0 + i * 0.36; ctx.beginPath(); ctx.moveTo(...tf(a, 0.0)); ctx.quadraticCurveTo(...tf(a + (r() - 0.5) * 0.5, 0.7), ...tf(a * 0.5 + 0.1, 1.15)); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,225,170,.28)'; ctx.lineWidth = Math.max(1, 0.025 * S);
        for (let i = 0; i < 6; i++) { const a = -0.95 + i * 0.36; ctx.beginPath(); ctx.moveTo(...tf(a + 0.05, 0.05)); ctx.quadraticCurveTo(...tf(a + 0.1, 0.7), ...tf(a * 0.5 + 0.15, 1.1)); ctx.stroke(); }
        // Moos oben
        for (let i = 0; i < 26; i++) { const t = r(), x = -0.8 + t * 1.6, y = 0.98 + Math.sin(t * Math.PI) * 0.22 - 0.1 * r(); const [X, Y] = tf(x, y); ctx.fillStyle = r() < 0.5 ? 'rgba(96,150,60,.85)' : 'rgba(130,175,80,.8)'; ctx.beginPath(); ctx.ellipse(X, Y, (0.07 + r() * 0.08) * S, (0.05 + r() * 0.05) * S, 0, 0, TAU); ctx.fill(); }
        ctx.restore();
      },
    }],
  };
}

export default {
  id: 'spaetkreide',
  mood: mood({ key: '#ffb98a', keyI: 2.55, sky: '#bcd3ea', gnd: '#7d5a46', hemiI: 1.42, pos: [-15, 11, 8] }),
  motes: { colors: [[1, 0.78, 0.55], [1, 0.9, 0.72], [0.75, 0.92, 0.96]], size: 0.065, alpha: 0.45, dx: 0.16, dy: 0.1, tw: 1.3, density: 0.9 },
  atmo: 'spaetkreide',

  // --------------------------------------------------------------------------------------- bemalte Seitenflächen
  base() {
    const d = PAGES_DE[IDX];
    const meadow = (m, x0, x1, seed) => {
      blotches(m, { x0, x1, z0: -2.2, z1: 4.2, n: 22, rmin: 0.7, rmax: 2.2, colors: ['rgba(70,120,50,.22)', 'rgba(215,225,120,.2)', 'rgba(120,80,40,.14)', 'rgba(255,240,170,.12)'], seed });
      speckles(m, { x0, x1, z0: -2, z1: 4, n: 260, color: 'rgba(40,90,40,.2)', size: 0.03, seed: seed + 1 });
    };
    return {
      L: {
        ground: { back: '#b0bb72', front: '#8aaa58' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 51,
        draw(ctx, m) {
          meadow(m, -11.8, -0.3, 4);
          // Fluss mit Sandufer hinter dem T. rex
          riverBand(m, [[-12.2, -1.5], [-10, -1.85], [-7.5, -1.55], [-5.2, -2.0], [-2.8, -1.75], [0.4, -1.5]], 1.15);
          puddle(m, -9.6, 0.9, 0.5, 0.2); puddle(m, -3.4, 1.7, 0.4, 0.16);
          // Spuren des T. rex (große Dreizeher), darunter der Weg zum Stamm
          [[-10.6, -0.1], [-9.0, -0.35], [-7.6, 0.0], [-6.0, -0.25], [-4.4, 0.1]].forEach(([x, z], i) => footTrack(m, x, z, 0.85, i % 2 ? 0.1 : -0.08));
          floorFerns(m, { x0: -11.3, x1: -0.8, z0: -0.6, z1: 3.8, n: 12, seed: 3, size: 0.6 });
          floorFlowers(m, { x0: -11, x1: -0.8, z0: 0, z1: 3.9, n: 26, seed: 4 });
          pebbles(m, { x0: -11.2, x1: -0.8, z0: -0.4, z1: 3.6, n: 12, seed: 3, colors: ['#b9ab86', '#a39573', '#cdbd95'] });
          grassTufts(m, { x0: -11, x1: -1, z0: 0.0, z1: 3.8, n: 12, seed: 7, color: '#4f7f30', h: 0.32 });
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
          printLabel(m, '← beiß zu! →', -3.0, 2.98, { size: 0.19, color: 'rgba(60,40,15,.6)', italic: true, bold: false });
        },
      },
      R: {
        ground: { back: '#aeba70', front: '#88a857' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 52,
        draw(ctx, m) {
          meadow(m, 0.3, 11.8, 9);
          // Flussdelta: ein Hauptarm teilt sich in mehrere Rinnen mit Sandbänken
          riverBand(m, [[-0.4, -1.5], [2.0, -1.8], [4.4, -1.65], [6.4, -2.0], [8.8, -1.95], [12.2, -2.3]], [1.2, 0.8]);
          riverBand(m, [[3.4, -1.7], [5.0, -1.2], [7.0, -1.0], [9.2, -1.2], [12.2, -0.9]], [0.75, 0.5]);
          riverBand(m, [[6.2, -1.1], [7.9, -0.5], [9.8, -0.25], [12.2, -0.1]], [0.5, 0.42]);
          puddle(m, 2.0, 3.0, 0.55, 0.2); puddle(m, 9.9, 3.5, 0.45, 0.17);
          // Spuren: Triceratops (rundlich) und Ankylosaurus
          [[1.4, 1.7], [2.9, 2.2], [4.6, 1.75]].forEach(([x, z], i) => footTrack(m, x, z, 0.55, Math.PI + (i % 2 ? 0.3 : -0.2), { color: 'rgba(70,50,25,.36)' }));
          [[6.0, 3.4], [7.4, 3.0]].forEach(([x, z], i) => footTrack(m, x, z, 0.34, Math.PI + (i % 2 ? 0.1 : -0.15), { color: 'rgba(70,50,25,.36)' }));
          // Magnolienblüten am Boden
          const r = mulberry32(14); ctx.save();
          for (let i = 0; i < 26; i++) {
            const x = lerp(8.4, 11.5, r()), z = lerp(-0.3, 2.0, r()); const [X, Y] = m.pt(x, z); ctx.fillStyle = r() < 0.5 ? 'rgba(247,190,212,.95)' : 'rgba(255,226,234,.95)';
            ctx.beginPath(); ctx.ellipse(X, Y, 0.085 * m.S, 0.047 * m.S, r() * 3, 0, TAU); ctx.fill();
          }
          ctx.restore();
          floorFerns(m, { x0: 0.8, x1: 11.4, z0: -0.4, z1: 3.9, n: 12, seed: 8, size: 0.6 });
          floorFlowers(m, { x0: 0.8, x1: 11.4, z0: 0, z1: 3.9, n: 28, seed: 6 });
          pebbles(m, { x0: 1, x1: 11, z0: 0.3, z1: 3.6, n: 14, seed: 12, colors: ['#b9ab86', '#a39573', '#cdbd95'] });
          grassTufts(m, { x0: 0.8, x1: 11, z0: 0.2, z1: 3.9, n: 12, seed: 17, color: '#4f7f30', h: 0.32 });
          printLabel(m, '← Kopf runter! →', 4.8, 2.98, { size: 0.19, color: 'rgba(60,40,15,.6)', italic: true, bold: false });
        },
      },
    };
  },

  // --------------------------------------------------------------------------------------- Aufbau
  *build(ctx) {
    const app = ctx.app;
    const sway = new Swayers(); this._sway = sway;
    const state = this._st = { bites: 0, scar: 0, trunkWob: 0 };
    const SIDES = [['L', -11.8, -0.15], ['R', 0.15, 11.8]];

    // ------------------------------------------------------------------- Kulissen-Streifen
    for (const [s, x0, x1] of SIDES) {
      const L = s === 'L';
      // Himmelswand: Tiefblau oben, Türkis, im Westen (links) korallorange am Horizont
      wall(ctx, x0, x1, (a, b) => panelPart(a, b, 4.5, {
        fill: { stops: [[0, '#173f7a'], [0.4, '#2a8fb3'], [0.72, L ? '#86cfc6' : '#79cdca'], [1, L ? '#f9b080' : '#d8e1b0']] },
        wave: 0.28, freq: L ? 2.6 : 3.2, phase: L ? 0.4 : 2.0, seed: L ? 2 : 5,
        deco: (c, bb) => {
          softLight(c, bb, { color: L ? 'rgba(255,115,70,.66)' : 'rgba(255,170,110,.18)', cx: L ? 0.3 : 0.05, cy: 0.14, r: L ? 0.85 : 0.6 });
          softLight(c, bb, { color: 'rgba(255,200,140,.28)', cx: L ? 0.55 : 0.2, cy: 0.05, r: 0.5 });
          dither(c, bb, '#fff', { n: 70, alpha: 0.1, size: 0.035 });
          const { ctx: g, tf } = c; g.save(); g.fillStyle = L ? 'rgba(255,140,100,.45)' : 'rgba(255,210,170,.22)';
          const r = mulberry32(L ? 3 : 4);
          for (let i = 0; i < 7; i++) { const [X, Y] = tf(bb.x0 + bb.w * r(), bb.y0 + bb.h * (0.12 + r() * 0.28)); g.beginPath(); g.ellipse(X, Y, (0.9 + r() * 1.2) * c.S, (0.08 + r() * 0.08) * c.S, 0, 0, TAU); g.fill(); }
          g.restore();
          if (L) { flyer(c, bb.x0 + bb.w * 0.22, bb.y0 + bb.h * 0.48, 0.5, 1); flyer(c, bb.x0 + bb.w * 0.3, bb.y0 + bb.h * 0.55, 0.32, -1, 0.6); flyer(c, bb.x0 + bb.w * 0.7, bb.y0 + bb.h * 0.62, 0.4, 1, 0.55); }
          else { flyer(c, bb.x0 + bb.w * 0.5, bb.y0 + bb.h * 0.58, 0.36, -1, 0.5); }
        },
      }), { z: -4.05, lean: -0.05, name: 'sky' + s, delay: 0.0, ppu: 70, border: 0.04 });
      // ferne Gebirge (Rocky Mountains im Westen)
      wall(ctx, x0, x1, (a, b) => panelPart(a, b, L ? 2.15 : 1.7, {
        fill: { top: L ? '#5578b0' : '#648cb8', bottom: L ? '#456a9e' : '#5681a8' }, wave: L ? 0.6 : 0.5, freq: L ? 2.4 : 3, phase: L ? 1.2 : 3.4, seed: 8, step: 0.2,
        deco: (c, bb) => {
          dither(c, bb, '#e8f2ff', { n: 70, alpha: 0.2, size: 0.05, seed: 9 });
          softLight(c, bb, { color: 'rgba(255,160,120,.45)', cx: L ? 0.2 : 0.0, cy: 0.9, r: 0.7 });
        },
      }), { z: -3.3, lean: -0.03, name: 'far' + s, delay: 0.05, ppu: 70 });
      // Nadelwald-Linie
      wall(ctx, x0 + (L ? 0 : 0.15), x1 - (L ? 0.35 : 0.3), (a, b) => treeLinePart(a, b, 1.05, {
        seed: L ? 11 : 12, wave: 0.14, freq: 3, phase: L ? 0.7 : 2.4, fill: { top: '#2b7a6d', bottom: '#225b55' },
        deco: (c, bb) => { dither(c, bb, '#0f3c3c', { n: 90, alpha: 0.3, size: 0.04, seed: 3 }); dither(c, bb, '#9fdcb8', { n: 50, alpha: 0.18, size: 0.03, seed: 4 }); },
      }), { z: -2.75, lean: -0.02, name: 'trees' + s, delay: 0.08, ppu: 70 });
      // Nahband: Auenwiese
      wall(ctx, x0, x1, (a, b) => panelPart(a, b, 0.62, {
        fill: { top: '#7fa95e', bottom: '#5f8d4c' }, wave: 0.12, freq: 6, phase: L ? 0.3 : 1.7, seed: 3,
        deco: (c, bb) => { dither(c, bb, '#35602f', { n: 90, alpha: 0.25, size: 0.04, seed: 6 }); dither(c, bb, '#d7ef9c', { n: 40, alpha: 0.2, size: 0.03, seed: 7 }); },
      }), { z: -2.3, name: 'meadow' + s, delay: 0.1, ppu: 80 });
    }
    yield;

    // ------------------------------------------------------------------- Wasser-Streifen (Fluss und Delta), driften gegeneinander
    const water = [];
    const addWater = (x0, x1, z, h, ph, delay, tone) => {
      const p = wall(ctx, x0, x1, (a, b) => waterPart(a, b, h, { phase: ph, seed: Math.round(ph * 10) + 1, top: tone[0], bottom: tone[1] }), { z, name: 'water' + Math.round(x0 * 10) + ':' + Math.round(z * 10), delay, ppu: 80, border: 0.025 });
      water.push({ p, x: p.group.position.x, ph, amp: 0.1 + h * 0.5 });
    };
    const T1 = ['#69cfc7', '#2c8da4'], T2 = ['#58bfc4', '#287f9c'];
    addWater(-11.7, -5.9, -1.55, 0.3, 0.3, 0.12, T1); addWater(-6.1, -0.25, -1.9, 0.34, 2.1, 0.13, T2);
    addWater(0.25, 4.6, -1.55, 0.3, 1.1, 0.12, T1); addWater(4.4, 11.7, -1.95, 0.34, 3.2, 0.13, T2);
    addWater(5.0, 9.0, -1.1, 0.26, 2.6, 0.16, T2); addWater(9.2, 11.7, -0.62, 0.24, 0.6, 0.17, T1);
    ctx.onUpdate((dt, t) => { for (const w of water) w.p.group.position.x = w.x + Math.sin(t * 0.45 + w.ph) * w.amp; });
    yield;

    // ------------------------------------------------------------------- Sonne, Wolken im Westen
    const sun = ctx.prop('sun_disc', { x: -9.6, y: 1.35, z: -3.9, h: 1.7, delay: 0.1, cast: false });
    const glow = sunGlow({ size: 9.5, color: 0xff9a62, opacity: 0.75 }); glow.position.set(0, 0.85, -0.06); sun.add(glow);
    ctx.onUpdate((dt, t) => glow.userData.update(t));
    const clouds = [
      [ctx.prop('cloud_a', { x: -8.0, y: 3.6, z: -3.85, len: 3.0, delay: 0.2, cast: false }), -8.0, 0.05, 1.6],
      [ctx.prop('cloud_b', { x: -3.6, y: 3.2, z: -3.9, len: 2.4, delay: 0.25, cast: false }), -3.6, 0.04, 1.2],
      [ctx.prop('cloud_a', { x: -10.0, y: 2.8, z: -3.88, len: 2.0, delay: 0.28, cast: false }), -10.0, 0.035, 0.5],
      [ctx.prop('cloud_a', { x: 6.2, y: 3.7, z: -3.85, len: 2.6, delay: 0.3, cast: false }), 6.2, 0.04, 1.3],
    ];
    ctx.onUpdate((dt, t) => { clouds.forEach(([p, x0, sp, amp], i) => { p.group.position.x = x0 + Math.sin(t * sp + i * 1.7) * amp; }); });
    yield;

    // ------------------------------------------------------------------- Pflanzen (Hintergrund bis Mittelgrund)
    const SW = ['araucaria', 'tree_fern', 'magnolia', 'conifer_round', 'cycad', 'horsetail', 'reeds'];
    const P = (id, o, amp = 0.012) => { const p = ctx.prop(id, o); if (SW.includes(id)) sway.add(p, amp, 0.5 + Math.random() * 0.3); return p; };
    P('araucaria', { x: -10.3, z: -3.2, h: 5.1, delay: 0.2 }, 0.006);
    P('conifer_round', { x: -9.4, z: -2.7, h: 3.3, delay: 0.22 });
    P('magnolia', { x: -4.6, z: -2.4, h: 3.0, delay: 0.24 });
    P('conifer_round', { x: -1.7, z: -2.7, h: 3.5, delay: 0.24, facing: -1 });
    P('tree_fern', { x: -10.6, z: -0.5, h: 2.5, delay: 0.26 });
    P('reeds', { x: -5.7, z: -1.3, h: 1.2, delay: 0.28 });
    P('araucaria', { x: 8.0, z: -3.2, h: 5.0, delay: 0.22 }, 0.006);
    P('conifer_round', { x: 2.0, z: -2.8, h: 3.2, delay: 0.24 });
    P('magnolia', { x: 10.0, z: -2.3, h: 3.4, delay: 0.24 });
    P('tree_fern', { x: 10.5, z: 0.5, h: 2.6, delay: 0.26, facing: -1 });
    P('reeds', { x: 5.7, z: -1.3, h: 1.2, delay: 0.28 });
    P('horsetail', { x: 1.1, z: -1.2, h: 1.15, delay: 0.3, facing: -1 });
    yield;

    // ------------------------------------------------------------------- T. rex (links) – BEISS!
    const REX = { x: -7.3, z: -0.6, len: 8.6 };
    const rex = ctx.stand('trex', { x: REX.x, z: REX.z, len: REX.len, facing: 1, delay: 0.34 });
    const rf = rex.fig;
    const pageX = (a, n) => a.popup.group.position.x + a.fig.group.position.x + a.fig.anchors[n].x * a.fig.group.scale.x;
    const mouthY = rf.anchors.mouth.y;
    const LUNGE = 0.7, TW = 1.25;
    const mouthX0 = pageX(rex, 'mouth');
    // Stamm vor dem Maul: bei offenem Kiefer eine Handbreit Abstand, beim Zubeißen ragt die Schnauze in den Stamm
    const trunkX = mouthX0 + 0.2 + TW * 0.43;
    const trunk = ctx.flat(trunkPart(4.4, TW), { x: trunkX, z: REX.z + 0.007, name: 'trunk', delay: 0.3, ppu: 120, border: 0.035 });   // knapp zwischen Oberkopf (vorn) und Unterkiefer (hinten): Maul klemmt den Stamm
    const scar = child(trunk, scarPart(), { x: -TW * 0.43 + 0.1, y: mouthY - 0.05, z: 0.004, ppu: 130, border: 0.01, name: 'scar' });
    scar.material.transparent = true; scar.material.opacity = 0; scar.mesh.visible = false;
    const rexBl = makeBlinker(rf, { part: 'body', anchor: 'eye', r: 0.23, color: '#a2653f', seed: 1 });
    const rexS = { open: 0.7, v: 0, roar: 0, tailTw: 0, twT: 3.5, step: -1, stepLeg: 0, hit: false, nextStep: 3.0, stompsLeft: 0, stompGap: 0, bite: false };
    const footW = () => ctx.world(pageX(rex, 'foot') + 0.2, 0.05, REX.z + 0.3);
    const stomp = (k = 1) => {
      app.audio.sfx('stomp'); app.cam.shake(0.05 * k, 0.32); sway.kick(0.7 * k);
      puff(app, footW(), fxN(app, 4), { spread: 0.7, up: 0.35, size: 0.46, alpha: 0.4, life: 0.9, color: [0.85, 0.74, 0.55] });
    };
    rex.behaviors.push((dt, t) => {
      const S = rexS, v = S.v;
      // Kiefer: in Ruhe halb offen, mit v zubeißen (zu), Brüllen beim Antippen
      const idle = S.open + 0.05 * Math.sin(t * 1.3);
      poseAmt(rf, 'jaw', clamp(Math.max(lerp(idle, 0, smooth(clamp(v / 0.93))), S.roar)));
      // Schwanz: langsames Schwingen, ab und zu ein Zucken
      S.twT -= dt; if (S.twT < 0 && S.tailTw <= 0) { S.tailTw = 0.0001; S.twT = 3 + Math.random() * 4; }
      let tw = 0; if (S.tailTw > 0) { S.tailTw += dt; tw = Math.sin(S.tailTw * 14) * 0.09 * Math.max(0, 1 - S.tailTw / 0.7); if (S.tailTw > 0.7) S.tailTw = 0; }
      rf.rotatePart('tail', 0.06 * Math.sin(t * 0.8) + tw);
      // Schritte (Sub-Bass) alle paar Sekunden
      if (S.step < 0) {
        S.nextStep -= dt; if (S.stompGap > 0) S.stompGap -= dt;
        if ((S.nextStep <= 0 && v < 0.05 && S.roar < 0.1) || (S.stompsLeft > 0 && S.stompGap <= 0)) { S.step = 0; S.stepLeg = S.stepLeg ? 0 : 1; S.hit = false; if (S.stompsLeft > 0) S.stompsLeft--; }
      }
      if (S.step >= 0) {
        S.step += dt / 0.85; const p = S.step, lift = Math.sin(clamp(p) * Math.PI);
        rf.rotatePart(S.stepLeg ? 'legB' : 'legA', lift * 0.32); rf.rotatePart(S.stepLeg ? 'legA' : 'legB', -lift * 0.08);
        rex.hop = lift * 0.05;
        if (!S.hit && p >= 0.9) { S.hit = true; stomp(); }
        if (p >= 1.1) { S.step = -1; rex.hop = 0; rf.rotatePart('legA', 0); rf.rotatePart('legB', 0); S.nextStep = S.stompsLeft > 0 ? 0 : 6 + Math.random() * 3; S.stompGap = 0.15; }
      }
      rexBl && rexBl.update(dt);
    });
    rex.onWake = (a) => {
      a.tw.add(1.6, (k) => { rexS.roar = Math.sin(clamp(k / 0.9) * Math.PI); }, { done: () => { rexS.roar = 0; } });
      rexS.stompsLeft = 2; rexS.stompGap = 0.1; rexS.nextStep = 0;
    };
    const beiss = ctx.control('L', { id: 'beiss', label: 'BEISS!', a: [-4.0, 3.65], b: [-1.7, 3.65], size: [2.3, 1.0], color: '#c8452c', value: 0, springBack: true });
    // Splitter beim Zubeißen
    const chomp = () => {
      state.bites++; state.scar = 1;
      app.audio.sfx('chomp'); setTimeout(() => app.audio.sfx('woodcrack'), 90); setTimeout(() => app.audio.sfx('splinter'), 170);
      app.cam.shake(0.2, 0.55);
      const w = ctx.world(trunkX - 0.3, mouthY, REX.z + 0.4);
      const n = fxN(app, 34);
      for (let i = 0; i < n; i++) {
        const a = (Math.random() - 0.35) * 2.2, sp = 1.0 + Math.random() * 2.4, wood = Math.random() < 0.55;
        app.fx.dust.emit({ x: w.x + (Math.random() - 0.5) * 0.4, y: w.y + (Math.random() - 0.5) * 0.6, z: w.z, vx: Math.cos(a) * sp * 0.9 + 0.3, vy: 0.6 + Math.random() * 2.0, vz: 0.4 + Math.random() * 1.2, life: 0.9 + Math.random() * 0.7, size: 0.13 + Math.random() * 0.2, alpha: 1, grav: 5.5, drag: 0.6, color: wood ? [0.97, 0.8, 0.5] : [0.55, 0.36, 0.19] });
      }
      puff(app, w, fxN(app, 3), { spread: 0.7, up: 0.3, size: 0.4, alpha: 0.28, color: [0.8, 0.66, 0.45] });
      state.trunkWob = 0.0001;                       // Stamm wackelt
      anky.tw.add(0.01, () => {}, { delay: 0.4, done: () => ankySwing(anky) });   // Ankylosaurus erschrickt und schlägt zu
    };
    beiss.on((v) => {
      rexS.v = clamp(v);
      rex.popup.group.position.x = REX.x + LUNGE * smooth(clamp(v / 0.93));
      if (v > 0.93 && !rexS.bite) { rexS.bite = true; chomp(); } else if (v < 0.55) rexS.bite = false;
    });
    beiss.onGrab = () => app.audio.sfx('grab'); beiss.onTick = (v) => app.audio.sfx('slide', { v }); beiss.onRelease = () => app.audio.sfx('snap');
    ctx.onUpdate((dt, t) => {
      if (state.trunkWob > 0) { state.trunkWob += dt; const k = Math.max(0, 1 - state.trunkWob / 1.2); trunk.yawG.rotation.z = Math.sin(state.trunkWob * 30) * 0.035 * k * k; if (state.trunkWob > 1.2) { state.trunkWob = 0; trunk.yawG.rotation.z = 0; } }
      const so = state.scar; if (so > 0 && trunk.eff > 0.9) { scar.mesh.visible = true; scar.material.opacity = Math.min(1, so); } else scar.mesh.visible = false;
    });
    yield;

    // ------------------------------------------------------------------- Triceratops (rechts) – Kopf runter!
    const TRI = { x: 4.6, z: 0.8, len: 5.7 };
    const tri = ctx.stand('triceratops', { x: TRI.x, z: TRI.z, len: TRI.len, facing: -1, delay: 0.38 });
    const tf = tri.fig;
    const triS = { v: 0, wake: 0, dusted: false, flick: 0, fT: 4 };
    const triBl = makeBlinker(tf, { part: 'head', anchor: 'eye', r: 0.21, color: '#7d98a4', seed: 2 });
    const headPart = tf.parts.head, headRestY = headPart.position.y;
    tri.behaviors.push((dt, t) => {
      const m = Math.max(triS.v, triS.wake);
      triS.fT -= dt; if (triS.fT < 0 && triS.flick <= 0) { triS.flick = 0.0001; triS.fT = 3 + Math.random() * 4; }
      let fl = 0; if (triS.flick > 0) { triS.flick += dt; fl = Math.sin(triS.flick * 22) * 0.12 * Math.max(0, 1 - triS.flick / 0.45); if (triS.flick > 0.45) triS.flick = 0; }   // Ohren-/Schildzucken
      const idle = 0.07 + 0.06 * Math.sin(t * 0.6 + 1) + fl;
      const mk = clamp(m);
      poseAmt(tf, 'head', mk * 1.2 + idle * (1 - mk));   // Spezifikationsbereich (0..1) leicht ueberzogen
      headPart.position.y = headRestY + 0.4 * smooth(mk);   // Kopf hebt sich beim Senken etwas aus dem Nacken: die Hoerner tauchen nicht unter die Seite
      triBl && triBl.update(dt);
    });
    tri.onWake = (a) => { a.tw.add(1.3, (k) => { triS.wake = Math.sin(k * Math.PI) * 0.9; }, { done: () => { triS.wake = 0; } }); app.audio.sfx('thud'); };
    const kopf = ctx.control('R', { id: 'kopf', label: 'Kopf runter!', a: [3.3, 3.65], b: [6.3, 3.65], size: [2.4, 1.0], color: '#2a7fa5', value: 0, hold: true });
    kopf.on((v) => {
      triS.v = clamp(v); tri.popup.group.position.x = TRI.x - 0.35 * smooth(clamp(v));
      if (v > 0.92 && !triS.dusted) { triS.dusted = true; puff(app, ctx.world(TRI.x - 3.0, 0.05, TRI.z + 0.5), fxN(app, 3), { spread: 0.5, up: 0.25, size: 0.3, alpha: 0.35 }); app.audio.sfx('thud'); }
      else if (v < 0.6) triS.dusted = false;
    });
    kopf.onGrab = () => app.audio.sfx('grab'); kopf.onTick = (v) => app.audio.sfx('slide', { v }); kopf.onRelease = () => app.audio.sfx('snap');
    yield;

    // ------------------------------------------------------------------- Ankylosaurus – Keule
    const ANK = { x: 9.0, z: 2.5, len: 4.2 };
    const anky = ctx.stand('ankylosaurus', { x: ANK.x, z: ANK.z, len: ANK.len, facing: -1, delay: 0.42 });
    const af = anky.fig;
    const ankS = { rot: -0.6, swing: 0 };
    const ankBl = makeBlinker(af, { part: 'body', anchor: 'eye', r: 0.15, color: '#a86a46', seed: 3 });
    anky.behaviors.push((dt, t) => {
      af.rotatePart('tail', ankS.swing ? ankS.rot : -0.6 + 0.04 * Math.sin(t * 0.9));
      ankBl && ankBl.update(dt);
    });
    const thud = () => {
      app.audio.sfx('thud'); app.cam.shake(0.1, 0.35); sway.kick(0.5);
      const cx = anky.popup.group.position.x + af.group.position.x + af.group.scale.x * (-3.2 * af.ws);
      puff(app, ctx.world(cx, 0.05, ANK.z + 0.3), fxN(app, 6), { spread: 0.8, up: 0.45, size: 0.42, alpha: 0.5 });
    };
    function ankySwing(a) {
      if (ankS.swing) return; ankS.swing = 1; let hit = false;
      a.tw.add(1.9, (k) => {
        // Ausholen (hoch) – Schlag (runter) – langsam zurück
        if (k < 0.16) ankS.rot = lerp(-0.6, -0.8, smooth(k / 0.16));
        else if (k < 0.3) { const q = (k - 0.16) / 0.14; ankS.rot = lerp(-0.8, 0.4, q * q); if (q >= 0.97 && !hit) { hit = true; thud(); } }
        else ankS.rot = lerp(0.4, -0.6, smooth((k - 0.3) / 0.7));
      }, { done: () => { ankS.swing = 0; } });
      app.audio.sfx('swing');
    }
    anky.onWake = (a) => ankySwing(a);
    yield;

    // ------------------------------------------------------------------- Versteck: Didelphodon in der Wurzelhöhle
    const CAVE = { x: 9.4, z: -1.0 };
    const arch = ctx.flat(caveArchPart(), { x: CAVE.x, z: CAVE.z, name: 'cave', delay: 0.46, ppu: 150, border: 0.03 });
    child(arch, { layers: [{ shapes: [blob(0, 0.3, 0.78, 0.36, 0, 30)], fill: '#1a110a', stroke: null }] }, { z: -0.3, ppu: 60, border: 0.005, name: 'cave-dark' });
    const dide = ctx.stand('didelphodon', { x: CAVE.x - 0.05, z: CAVE.z - 0.15, len: 0.95, facing: 1, delay: 0.5, hidden: true, hint: false, hitPad: 0.25 });
    dide.cover = arch;
    const frond = ctx.prop('fern_ground', { x: CAVE.x - 0.5, z: CAVE.z + 0.4, len: 1.35, delay: 0.52, variant: { seed: 2 } });
    dide.onWake = (a) => {
      a.tw.add(0.7, (k) => { a.hop = Math.sin(k * Math.PI) * 0.3; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { a.hop = 0; poseAmt(a.fig, 'jaw', 0); } });
      a.tw.add(0.9, (k) => { frond.yawG.rotation.z = Math.sin(k * 18) * 0.06 * (1 - k); arch.yawG.rotation.z = Math.sin(k * 16 + 1) * 0.012 * (1 - k); }, { done: () => { frond.yawG.rotation.z = 0; arch.yawG.rotation.z = 0; } });
    };
    dide.behaviors.push((dt, t) => { poseAmt(dide.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 1.4)); });
    yield;

    // ------------------------------------------------------------------- Libelle über dem Delta
    const dfly = ctx.prop('dragonfly', { x: 7.0, z: -0.3, len: 0.85, delay: 0.55, cast: false });
    const df = dfly.fig, dmid = ((df.bbox.x0 + df.bbox.x1) / 2) * df.ws, flap = df.meta.flap || { wing: [-0.35, 0.55], wing2: [-0.3, 0.45] };
    ctx.onUpdate((dt, t) => {
      const ph = t * 0.33, fac = Math.cos(ph) >= 0 ? 1 : -1;
      df.group.scale.x = fac; df.group.position.set(Math.sin(ph) * 2.6 - dmid * fac, 2.2 + Math.sin(t * 1.1) * 0.22 + Math.sin(t * 2.3) * 0.05, Math.sin(ph * 0.5) * 0.4);
      const f = 0.5 + 0.5 * Math.sin(t * 44);
      df.rotatePart('wing', lerp(flap.wing[0], flap.wing[1], f)); df.rotatePart('wing2', lerp(flap.wing2[0], flap.wing2[1], 1 - f));
    });
    yield;

    // ------------------------------------------------------------------- Vordergrund-Details
    P('fern_ground', { x: -5.8, z: -0.35, len: 1.5, delay: 0.5, variant: { seed: 1 } });
    P('fern_ground', { x: 1.5, z: 1.9, len: 1.6, delay: 0.52, variant: { seed: 2 }, facing: -1 });
    P('fern_ground', { x: -1.7, z: 2.0, len: 1.5, delay: 0.5, variant: { seed: 2 } });
    ctx.prop('boulder', { x: 11.0, z: 1.4, len: 1.3, delay: 0.55, variant: { seed: 2 } });
    ctx.prop('boulder', { x: -0.8, z: 3.0, len: 1.0, delay: 0.55, variant: { seed: 1 } });
    ctx.prop('bush', { x: 2.6, z: 2.9, len: 1.4, delay: 0.52, variant: { seed: 3 } });
    ctx.onUpdate((dt, t) => sway.update(dt, t));
    this._popCount = ctx.L.popups.length + ctx.R.popups.length;
  },

  onDeactivate(ctx) {
    const st = this._st; if (!st) return;
    st.bites = 0; st.scar = 0; st.trunkWob = 0;
    this._sway && this._sway.reset();
    for (const s of [ctx.L, ctx.R]) { for (const c of s.controls) c.setValue(0, { snap: true }); for (const a of s.actors) a.tw.clear(); }
  },
};
