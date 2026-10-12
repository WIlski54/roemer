// Station 6: Nest – „Dino-Babys“ (Montana, ca. 76–74 Mio. Jahre)
// Links: gedruckte Textkarte, Maiasaura-Mutter am Hauptnest (SCHLÜPFE!), rechts: Oviraptor brütet, weitere Nester, Schieber „Sonnenuntergang“.
// Eier = Papierfiguren (heil -> Risse -> Schale klappt auf -> Baby schlüpft). Das Licht wandert per Schieber zwischen zwei Lichtstimmungen.
import { mood } from '../engine/scene.js';
import { textCard, printLabel, pebbles, grassTufts, blotches, speckles } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt, Actor } from '../engine/popup.js';
import { sunGlow } from '../engine/effects.js';
import { lerp, clamp, smooth, easeOutBack, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { poly } from '../art/dsl.js';
import { wall, treeLinePart, footTrack, makeBlinker, fxN, puff, cloneMood, blendMood, Swayers, child, floorFerns, floorFlowers, puddle } from './_p56kit.js';

const IDX = 6;

// Zwei Lichtstimmungen: spätnachmittäglich-golden (A) und Abenddämmerung in Korall/Violett (B). Der Schieber mischt dazwischen.
const MOOD_A = mood({ key: '#ffc88a', keyI: 2.7, sky: '#d8e6e6', gnd: '#8f6e49', hemiI: 1.45, pos: [-15, 8.5, 8] });
const MOOD_B = mood({ key: '#ff8068', keyI: 1.95, sky: '#9c90c8', gnd: '#6a4458', hemiI: 1.18, pos: [-16.5, 3.6, 6.5] });

const EGG_L = 0.9, BABY_L = 1.3;

// kleine Vogelschar als Scherenschnitt (nur gemalt)
function birds(c, x, y, s, n, seed) {
  const { ctx, tf } = c; const r = mulberry32(seed); ctx.save(); ctx.strokeStyle = 'rgba(40,36,70,.75)'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, 0.028 * c.S);
  for (let i = 0; i < n; i++) {
    const bx = x + (r() - 0.3) * s * 3, by = y + (r() - 0.5) * s * 1.2, k = s * (0.6 + r() * 0.6);
    ctx.beginPath(); ctx.moveTo(...tf(bx - k, by + k * 0.18)); ctx.quadraticCurveTo(...tf(bx - k * 0.45, by + k * 0.5), ...tf(bx, by)); ctx.quadraticCurveTo(...tf(bx + k * 0.45, by + k * 0.5), ...tf(bx + k, by + k * 0.18)); ctx.stroke();
  }
  ctx.restore();
}

// Sanddünen-Rippel auf dem Seitenboden
function sandRipples(m, { x0, x1, z0, z1, n = 60, seed = 3, dark = 'rgba(140,100,50,.22)', light = 'rgba(255,245,210,.32)' }) {
  const { ctx } = m; const r = mulberry32(seed); ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), L = 0.5 + r() * 0.9;
    for (const [col, dz] of [[dark, 0], [light, -0.045]]) {
      ctx.strokeStyle = col; ctx.lineWidth = Math.max(1, 0.03 * m.S);
      ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z + dz)); ctx.quadraticCurveTo(m.x(x + L * 0.5), m.z(z + dz - 0.08), m.x(x + L), m.z(z + dz + 0.01)); ctx.stroke();
    }
  }
  ctx.restore();
}

// kleine Salbei-Grasbüschel auf einem Dünenrücken (gemalt)
function grassTuftsC(c, bb, seed) {
  const { ctx, tf } = c; const r = mulberry32(seed * 7 + 1); ctx.save(); ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1, 0.03 * c.S);
  for (let i = 0; i < 9; i++) {
    const x = bb.x0 + bb.w * (0.05 + 0.9 * r()), y = bb.y0 + bb.h * (0.12 + 0.5 * r()), h = 0.16 + r() * 0.14;
    ctx.strokeStyle = r() < 0.5 ? '#7f9a58' : '#6a8a4c';
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(...tf(x + k * 0.02, y)); ctx.quadraticCurveTo(...tf(x + k * 0.05, y + h * 0.6), ...tf(x + k * 0.1, y + h)); ctx.stroke(); }
  }
  ctx.restore();
}

// kleiner Teich mit Sandufer (gemalt)
function pond(m, x, z, rx, rz) {
  const { ctx } = m; const [X, Y] = m.pt(x, z); ctx.save(); ctx.translate(X, Y); ctx.scale(1, rz / rx);
  ctx.fillStyle = 'rgba(245,232,190,.95)'; ctx.beginPath(); ctx.arc(0, 0, rx * 1.18 * m.S, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(120,90,50,.35)'; ctx.lineWidth = Math.max(1, 0.03 * m.S); ctx.stroke();
  const g = ctx.createRadialGradient(-rx * 0.2 * m.S, -rx * 0.15 * m.S, 0, 0, 0, rx * m.S); g.addColorStop(0, '#9fe0d6'); g.addColorStop(0.6, '#4fb3bd'); g.addColorStop(1, '#2d8ea5');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx * m.S, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = Math.max(1, 0.025 * m.S); ctx.lineCap = 'round';
  for (const [a, b, w] of [[-0.4, -0.15, 0.3], [0.1, 0.18, 0.4], [0.3, -0.25, 0.25]]) { ctx.beginPath(); ctx.moveTo(a * rx * m.S, b * rx * m.S); ctx.lineTo((a + w) * rx * m.S, b * rx * m.S); ctx.stroke(); }
  ctx.restore();
}

// Nestring: dunkler gestampfter Sand, Kratzspuren, Schalensplitter
function nestRing(m, x, z, rx, rz, seed) {
  const { ctx } = m; const r = mulberry32(seed); const [X, Y] = m.pt(x, z);
  ctx.save();
  let g = ctx.createRadialGradient(X, Y, 0, X, Y, rx * m.S); g.addColorStop(0, 'rgba(120,80,40,.52)'); g.addColorStop(0.7, 'rgba(140,100,55,.32)'); g.addColorStop(1, 'rgba(140,100,55,0)');
  ctx.translate(X, Y); ctx.scale(1, rz / rx); ctx.translate(-X, -Y); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, rx * m.S, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(105,70,30,.4)'; ctx.lineWidth = Math.max(1, 0.025 * m.S);
  for (let i = 0; i < 9; i++) { const a = r() * TAU, d = rx * (0.55 + r() * 0.5); const px = x + Math.cos(a) * d, pz = z + Math.sin(a) * d * (rz / rx); ctx.beginPath(); ctx.moveTo(m.x(px), m.z(pz)); ctx.lineTo(m.x(px + Math.cos(a) * 0.22), m.z(pz + Math.sin(a) * 0.12)); ctx.stroke(); }
  ctx.fillStyle = 'rgba(250,236,200,.9)';
  for (let i = 0; i < 4; i++) { const a = r() * TAU, d = rx * (0.7 + r() * 0.35); ctx.beginPath(); ctx.ellipse(m.x(x + Math.cos(a) * d), m.z(z + Math.sin(a) * d * (rz / rx)), 0.07 * m.S, 0.04 * m.S, r() * 3, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// Bau eines Versteck-Hügels (Multituberculata): Sandhügel mit dunklem Eingang, Wurzeln und Moos
function burrowPart() {
  const hill = poly([[-0.95, 0], [-0.85, 0.2], [-0.6, 0.45], [-0.2, 0.62], [0.25, 0.6], [0.62, 0.42], [0.88, 0.2], [1.0, 0]], 2);
  return {
    layers: [{
      shapes: [hill], fill: { top: '#d9bf86', bottom: '#b08e57' },
      deco(c, bb) {
        const { ctx, tf, S } = c; const r = mulberry32(8); ctx.save(); ctx.lineCap = 'round';
        dither(c, bb, 'rgba(255,245,210,.9)', { n: 40, alpha: 0.5, size: 0.025, seed: 3 });
        // Eingang
        const [X, Y] = tf(0.0, 0.2); ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.ellipse(X, Y, 0.34 * S, 0.19 * S, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,235,190,.6)'; ctx.lineWidth = Math.max(1, 0.03 * S); ctx.beginPath(); ctx.ellipse(X, Y, 0.36 * S, 0.21 * S, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
        // Wurzeln, die über den Eingang ragen
        ctx.strokeStyle = '#5b3e24'; ctx.lineWidth = Math.max(1, 0.05 * S);
        for (const [a, b, e] of [[-0.55, 0.62, -0.18], [-0.1, 0.62, 0.05], [0.4, 0.55, 0.22]]) { ctx.beginPath(); ctx.moveTo(...tf(a, b)); ctx.quadraticCurveTo(...tf(a + e * 0.5, b * 0.5), ...tf(e, 0.28)); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,225,170,.3)'; ctx.lineWidth = Math.max(1, 0.02 * S);
        for (const [a, b, e] of [[-0.55, 0.62, -0.18], [-0.1, 0.62, 0.05], [0.4, 0.55, 0.22]]) { ctx.beginPath(); ctx.moveTo(...tf(a + 0.02, b)); ctx.quadraticCurveTo(...tf(a + e * 0.5 + 0.02, b * 0.5), ...tf(e + 0.02, 0.28)); ctx.stroke(); }
        for (let i = 0; i < 16; i++) { const t = r(), x = -0.7 + t * 1.4, y = 0.15 + Math.sin(t * Math.PI) * 0.4 * r(); const [XX, YY] = tf(x, y); ctx.fillStyle = r() < 0.5 ? 'rgba(106,150,70,.85)' : 'rgba(140,175,90,.8)'; ctx.beginPath(); ctx.ellipse(XX, YY, (0.05 + r() * 0.05) * S, (0.035 + r() * 0.03) * S, 0, 0, TAU); ctx.fill(); }
        ctx.restore();
      },
    }],
  };
}

export default {
  id: 'nest',
  mood: MOOD_A,
  motes: { colors: [[1, 0.82, 0.5], [1, 0.9, 0.7], [0.82, 0.95, 0.7]], size: 0.06, alpha: 0.5, dx: 0.12, dy: 0.1, tw: 1.4, density: 0.9 },
  atmo: 'nest',

  // --------------------------------------------------------------------------------------- bemalte Seitenflächen
  base() {
    const d = PAGES_DE[IDX];
    const dune = (m, x0, x1, seed) => {
      blotches(m, { x0, x1, z0: -2.2, z1: 4.2, n: 24, rmin: 0.8, rmax: 2.4, colors: ['rgba(255,235,170,.2)', 'rgba(150,170,100,.18)', 'rgba(170,110,60,.14)', 'rgba(255,200,140,.12)'], seed });
      speckles(m, { x0, x1, z0: -2, z1: 4, n: 320, color: 'rgba(120,85,45,.22)', size: 0.028, seed: seed + 1 });
      speckles(m, { x0, x1, z0: -2, z1: 4, n: 120, color: 'rgba(255,248,220,.38)', size: 0.026, seed: seed + 2 });
      sandRipples(m, { x0, x1, z0: -1.6, z1: 4, n: 38, seed });
    };
    return {
      L: {
        ground: { back: '#dcc48e', front: '#c9aa70' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 61,
        draw(ctx, m) {
          dune(m, -11.8, -0.3, 4);
          // Salbei-Grasinseln
          blotches(m, { x0: -11.5, x1: -0.5, z0: -1.8, z1: 1.2, n: 9, rmin: 0.5, rmax: 1.1, colors: ['rgba(120,150,90,.32)', 'rgba(150,175,110,.26)'], seed: 17 });
          nestRing(m, -3.0, 0.75, 2.3, 0.85, 5);
          // Spuren der Mütter zum Nest
          [[-8.6, -0.5], [-7.4, -0.15], [-6.1, 0.2], [-5.0, 0.55]].forEach(([x, z], i) => footTrack(m, x, z, 0.62, i % 2 ? 0.12 : -0.1, { color: 'rgba(100,70,35,.34)' }));
          floorFerns(m, { x0: -11.3, x1: -0.8, z0: -0.8, z1: 3.8, n: 11, seed: 6, color: '#5d8a46', size: 0.6 });
          floorFlowers(m, { x0: -11, x1: -0.8, z0: 0, z1: 3.9, n: 22, seed: 7, colors: ['#fff0b0', '#ffd9a0', '#ffffff'] });
          pebbles(m, { x0: -11.2, x1: -0.8, z0: -0.4, z1: 3.6, n: 12, seed: 8, colors: ['#bfae8a', '#a8987a', '#d4c4a0'] });
          grassTufts(m, { x0: -11, x1: -1, z0: 0.0, z1: 3.8, n: 12, seed: 9, color: '#6f8f46', h: 0.3 });
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
          printLabel(m, '← schlüpfe! →', -2.85, 2.98, { size: 0.19, color: 'rgba(80,50,20,.6)', italic: true, bold: false });
        },
      },
      R: {
        ground: { back: '#dac28a', front: '#c8a96e' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 62,
        draw(ctx, m) {
          dune(m, 0.3, 11.8, 9);
          blotches(m, { x0: 0.5, x1: 11.5, z0: -1.8, z1: 1.8, n: 8, rmin: 0.5, rmax: 1.1, colors: ['rgba(120,150,90,.3)', 'rgba(150,175,110,.24)'], seed: 19 });
          nestRing(m, 6.5, -0.85, 3.0, 0.95, 7); nestRing(m, 2.9, 1.4, 2.1, 0.8, 8); nestRing(m, 9.3, 2.2, 2.1, 0.8, 9);
          pond(m, 5.0, 2.25, 1.15, 0.5); puddle(m, 11.0, 3.4, 0.4, 0.15, { sky: '#9fd6d2' });
          [[1.2, 3.1], [3.1, 3.2], [8.0, 3.0]].forEach(([x, z], i) => footTrack(m, x, z, 0.55, Math.PI + (i % 2 ? 0.3 : -0.2), { color: 'rgba(100,70,35,.32)' }));
          floorFerns(m, { x0: 0.8, x1: 11.4, z0: -0.8, z1: 3.9, n: 12, seed: 10, color: '#5d8a46', size: 0.6 });
          floorFlowers(m, { x0: 0.8, x1: 11.4, z0: 0, z1: 3.9, n: 24, seed: 11, colors: ['#fff0b0', '#ffd9a0', '#ffffff'] });
          pebbles(m, { x0: 1, x1: 11, z0: 0.3, z1: 3.6, n: 14, seed: 12, colors: ['#bfae8a', '#a8987a', '#d4c4a0'] });
          grassTufts(m, { x0: 0.8, x1: 11, z0: 0.2, z1: 3.9, n: 12, seed: 13, color: '#6f8f46', h: 0.3 });
          printLabel(m, '← Sonnenuntergang →', 4.9, 2.98, { size: 0.19, color: 'rgba(80,50,20,.6)', italic: true, bold: false });
        },
      },
    };
  },

  // --------------------------------------------------------------------------------------- Aufbau
  *build(ctx) {
    const app = ctx.app, stage = app.stage;
    const sway = new Swayers(); this._sway = sway;
    const S = this._st = { sun: 0, pull: 0, armed: false, started: false, lowT: -1, low: 0, chorus: 0, fireT: 0 };
    const SIDES = [['L', -11.8, -0.15], ['R', 0.15, 11.8]];
    const cur = cloneMood(MOOD_A); this._moodCur = cur;
    const skies = [];

    // ------------------------------------------------------------------- Kulissen-Streifen
    for (const [s, x0, x1] of SIDES) {
      const L = s === 'L', c = (x0 + x1) / 2;
      // Himmel: Tagesfarben mit goldenem Horizont; darüber (als Kind) die Dämmerungsfarben, die per Schieber eingeblendet werden
      const skyOpt = { wave: 0.28, freq: L ? 2.6 : 3.2, phase: L ? 0.4 : 2.0, seed: L ? 2 : 5 };
      const mk = (fill, deco) => panelPart(x0 - c, x1 - c, 4.5, { fill, ...skyOpt, deco });
      const day = mk({ stops: [[0, '#3f86c0'], [0.4, '#86c3d6'], [0.74, L ? '#f7e6a8' : '#efe4b0'], [1, L ? '#ffcf84' : '#f6d89a']] }, (cc, bb) => {
        softLight(cc, bb, { color: L ? 'rgba(255,200,110,.62)' : 'rgba(255,215,140,.22)', cx: L ? 0.3 : 0.05, cy: 0.12, r: L ? 0.9 : 0.6 });
        dither(cc, bb, '#fff', { n: 60, alpha: 0.1, size: 0.035 });
        const g = cc.ctx; g.save(); g.fillStyle = L ? 'rgba(255,170,110,.35)' : 'rgba(255,225,170,.25)'; const r = mulberry32(L ? 3 : 4);
        for (let i = 0; i < 6; i++) { const [X, Y] = cc.tf(bb.x0 + bb.w * r(), bb.y0 + bb.h * (0.14 + r() * 0.28)); g.beginPath(); g.ellipse(X, Y, (0.9 + r() * 1.2) * cc.S, (0.07 + r() * 0.08) * cc.S, 0, 0, TAU); g.fill(); }
        g.restore();
        birds(cc, bb.x0 + bb.w * (L ? 0.58 : 0.4), bb.y0 + bb.h * 0.62, 0.12, 5, L ? 3 : 7);
      });
      const sky = ctx.flat(day, { x: c, z: -4.05, lean: -0.05, name: 'sky' + s, delay: 0.0, ppu: 70, border: 0.04 });
      const duskPart = mk({ stops: [[0, '#1e1a4e'], [0.34, '#503a86'], [0.62, '#b24c88'], [0.86, '#ff7857'], [1, '#ffb070']] }, (cc, bb) => {
        softLight(cc, bb, { color: L ? 'rgba(255,110,70,.55)' : 'rgba(255,130,100,.25)', cx: L ? 0.3 : 0.1, cy: 0.1, r: 0.8 });
        const g = cc.ctx; const r = mulberry32(L ? 21 : 22); g.save();
        for (let i = 0; i < 46; i++) { const [X, Y] = cc.tf(bb.x0 + bb.w * r(), bb.y0 + bb.h * (0.5 + 0.5 * r())); g.fillStyle = `rgba(255,250,225,${0.35 + r() * 0.6})`; g.beginPath(); g.arc(X, Y, (0.012 + r() * 0.02) * cc.S, 0, TAU); g.fill(); }
        g.restore();
      });
      const dusk = child(sky, duskPart, { z: 0.012, ppu: 60, border: 0.004, name: 'dusk' + s });
      dusk.material.transparent = true; dusk.material.opacity = 0; dusk.mesh.visible = false; dusk.material.depthWrite = false;
      skies.push(dusk);
      // ferne Hügel (Salbei im Dunst)
      wall(ctx, x0, x1, (a, b) => panelPart(a, b, L ? 2.0 : 1.7, {
        fill: { top: '#9db48f', bottom: '#7d9a77' }, wave: L ? 0.5 : 0.45, freq: L ? 2.4 : 3, phase: L ? 1.2 : 3.4, seed: 8, step: 0.2,
        deco: (cc, bb) => { dither(cc, bb, '#f6f0d0', { n: 70, alpha: 0.2, size: 0.05, seed: 9 }); softLight(cc, bb, { color: 'rgba(255,200,120,.5)', cx: L ? 0.2 : 0.0, cy: 0.9, r: 0.7 }); },
      }), { z: -3.3, lean: -0.03, name: 'far' + s, delay: 0.05, ppu: 70 });
      // Baumgruppen am Hang (Salbeigrün)
      wall(ctx, x0 + (L ? 0 : 0.15), x1 - (L ? 0.35 : 0.3), (a, b) => treeLinePart(a, b, 1.0, {
        seed: L ? 31 : 32, wave: 0.14, freq: 3, phase: L ? 0.7 : 2.4, fill: { top: '#6f9060', bottom: '#4f7350' },
        deco: (cc, bb) => { dither(cc, bb, '#2c4a30', { n: 90, alpha: 0.3, size: 0.04, seed: 3 }); dither(cc, bb, '#e9efb0', { n: 50, alpha: 0.2, size: 0.03, seed: 4 }); },
      }), { z: -2.75, lean: -0.02, name: 'trees' + s, delay: 0.08, ppu: 70 });
      // Sandhügel der Kolonie (Nahband)
      wall(ctx, x0, x1, (a, b) => panelPart(a, b, 0.78, {
        fill: { top: '#e6cb92', bottom: '#cfb077' }, wave: 0.18, freq: 4.5, phase: L ? 0.3 : 1.7, seed: 6,
        deco: (cc, bb) => { dither(cc, bb, '#a97f45', { n: 90, alpha: 0.22, size: 0.04, seed: 6 }); dither(cc, bb, '#fff3c8', { n: 60, alpha: 0.35, size: 0.03, seed: 7 }); },
      }), { z: -2.25, name: 'hill' + s, delay: 0.1, ppu: 80 });
    }
    yield;

    // ------------------------------------------------------------------- Sonne und Wolken
    const SUN = { x: -9.0, y0: 3.15, y1: 1.45 };
    const sun = ctx.prop('sun_disc', { x: SUN.x, y: SUN.y0, z: -3.9, h: 1.6, delay: 0.1, cast: false });
    const glow = sunGlow({ size: 9.0, color: 0xffb070, opacity: 0.8 }); glow.position.set(0, 0.8, -0.06); sun.add(glow);
    const clouds = [
      [ctx.prop('cloud_a', { x: -7.2, y: 3.6, z: -3.85, len: 2.8, delay: 0.2, cast: false }), -7.2, 0.05, 1.5],
      [ctx.prop('cloud_b', { x: -3.0, y: 3.15, z: -3.9, len: 2.3, delay: 0.25, cast: false }), -3.0, 0.04, 1.1],
      [ctx.prop('cloud_a', { x: 6.0, y: 3.55, z: -3.85, len: 2.6, delay: 0.3, cast: false }), 6.0, 0.04, 1.3],
    ];
    ctx.onUpdate((dt, t) => { clouds.forEach(([p, x0, sp, amp], i) => { p.group.position.x = x0 + Math.sin(t * sp + i * 1.7) * amp; }); });
    // Dünenrücken im Mittelgrund (Tiefenstaffelung hinter den Nestern)
    const duneP = (x0, x1, h, ph, seed, z, name) => wall(ctx, x0, x1, (a, b) => panelPart(a, b, h, {
      fill: { top: '#ecd49c', bottom: '#d3b57c' }, wave: h * 0.42, freq: 2.2, phase: ph, seed, step: 0.18,
      deco: (cc, bb) => { dither(cc, bb, '#a97f45', { n: 70, alpha: 0.2, size: 0.04, seed }); dither(cc, bb, '#fff6d0', { n: 60, alpha: 0.38, size: 0.03, seed: seed + 1 }); softLight(cc, bb, { color: 'rgba(255,190,110,.35)', cx: 0.1, cy: 0.9, r: 0.7 }); grassTuftsC(cc, bb, seed); },
    }), { z, name, delay: 0.14, ppu: 80, border: 0.03 });
    duneP(-11.7, -6.2, 1.05, 0.6, 41, -1.95, 'duneL1'); duneP(0.8, 5.6, 0.95, 1.4, 42, -1.85, 'duneR1'); duneP(8.0, 11.7, 1.1, 2.7, 43, -1.8, 'duneR2');
    yield;

    // ------------------------------------------------------------------- Pflanzen
    const SW = ['araucaria', 'tree_fern', 'conifer_round', 'cycad', 'horsetail', 'ginkgo', 'reeds'];
    const P = (id, o, amp = 0.012) => { const p = ctx.prop(id, o); if (SW.includes(id)) sway.add(p, amp, 0.5 + Math.random() * 0.3); return p; };
    P('araucaria', { x: -10.2, z: -3.3, h: 4.9, delay: 0.2 }, 0.006);
    P('conifer_round', { x: -1.8, z: -2.7, h: 3.3, delay: 0.22, facing: -1 });
    P('tree_fern', { x: -4.4, z: -2.5, h: 2.5, delay: 0.24 });
    P('cycad', { x: -9.3, z: -2.1, h: 1.55, delay: 0.26 });
    P('araucaria', { x: 9.7, z: -3.3, h: 4.8, delay: 0.22 }, 0.006);
    P('ginkgo', { x: 4.1, z: -3.0, h: 3.7, delay: 0.24 });
    P('conifer_round', { x: 1.7, z: -2.6, h: 2.9, delay: 0.24 });
    P('tree_fern', { x: 8.9, z: -2.3, h: 2.3, delay: 0.26, facing: -1 });
    P('cycad', { x: 1.5, z: -0.9, h: 1.35, delay: 0.28, facing: -1 });
    P('horsetail', { x: 11.1, z: -2.5, h: 1.1, delay: 0.3 });
    yield;

    // ------------------------------------------------------------------- Hilfsfunktionen für Figuren im Nest
    const pageX = (a, n) => a.popup.group.position.x + a.fig.group.position.x + a.fig.anchors[n].x * a.fig.group.scale.x;
    const midOf = (f) => ((f.bbox.x0 + f.bbox.x1) / 2) * f.ws;
    const at = (f, x, y, z) => f.group.position.set(x - midOf(f) * f.facing, y, z);

    // ------------------------------------------------------------------- Maiasaura-Mutter (links)
    const MOM = { x: -6.3, z: -1.5, len: 8.2 };
    const mom = ctx.stand('maiasaura', { x: MOM.x, z: MOM.z, len: MOM.len, facing: 1, delay: 0.3 });
    const mf = mom.fig;
    const momBl = makeBlinker(mf, { part: 'neck', anchor: 'eye', r: 0.1, color: '#9a8a3e', seed: 4 });
    const momS = { v: 0, twT: 4, tw: 0 };
    mom.behaviors.push((dt, t) => {
      const sl = S.sleepy || 0;
      const nod = 0.12 * Math.sin(t * 0.9) + 0.08 * Math.sin(t * 2.1 + 1);
      const lowK = Math.max(S.low, S.started ? 0 : 0.3 * smooth(S.pull));   // beim Ziehen an der Lasche horcht sie schon auf das Knacken
      poseAmt(mf, 'neck', clamp(lowK * 1.6 + 0.85 * smooth(S.sun) + nod * (1 - 0.6 * lowK), -0.2, 2.2));
      mf.root.rotation.z = 0.011 * Math.sin(t * 0.7 + 1);   // Gewichtsverlagerung
      if (momBl) { momBl.hold = sl; momBl.update(dt); }
    });
    mom.onWake = (a) => { a.tw.add(1.4, (k) => { S.mumNuz = Math.sin(k * Math.PI); }, { done: () => { S.mumNuz = 0; } }); };

    // ------------------------------------------------------------------- Nester mit Eiern und Babys
    const pairs = [];
    const addNest = (o) => {
      const pop = ctx.prop('nest_mound', { x: o.x, z: o.z, len: o.w, delay: o.delay, variant: { seed: o.seed } });
      const side = ctx.sideAt(o.x); const nf = pop.fig;
      const eggY = o.eggY ?? (nf.anchors.hollow.y * 0.98);
      (o.eggs || []).forEach((e, i) => {
        const face = e[3] || (i % 2 ? -1 : 1);
        const intact = ctx.fig('egg', { len: EGG_L, thickness: 0.012, border: 0.014, facing: face, variant: { seed: 3 + i + o.seed } });
        const hatch = ctx.fig('egg_hatching', { len: EGG_L, thickness: 0.012, border: 0.014, facing: face, variant: { variant: i + o.seed, seed: 3 + i + o.seed, rimSeed: i } });
        intact.setCast(false); hatch.setCast(false);
        const ex = e[0], ey = eggY + e[1], ez = e[2];
        at(intact, ex, ey, ez); at(hatch, ex, ey, ez); hatch.group.visible = false;
        pop.add(intact.group); pop.add(hatch.group); side.own(intact); side.own(hatch);
        const pr = { pop, side, intact, hatch, ex, ey, ez };
        if (o.babies && o.babies[i]) {
          const b = o.babies[i];
          const baby = ctx.fig('maiasaura_baby', { len: BABY_L, thickness: 0.02, border: 0.022, facing: b.face });
          baby.group.visible = false; pop.add(baby.group); side.own(baby);
          at(baby, b.hx, 0, 0.1 + i * 0.012);
          const act = new Actor(side, baby, pop, { id: 'maiasaura_baby', card: 'maiasaura_baby', name: 'Maiasaura-Baby', hint: false, hitPad: 0.3 });
          side.addActor(act); act.hitMeshes = [];
          Object.assign(pr, { baby, act, hx: b.hx, sx: b.sx, face: b.face, delay: b.delay, bz: 0.1 + i * 0.012, t: -1, run: false, done: false, sw: 0, bl: makeBlinker(baby, { part: 'body', anchor: 'eye', r: 0.05, color: '#a89050', seed: 20 + pairs.length, every: [3, 8] }), idle: 3 + Math.random() * 6, hopT: -1, jawT: 0, chor: -1, chorD: 0, crack2: false, hatchAudio: false, peepAudio: false, landed: false });
          act.behaviors.push(() => { act.proxy.position.set(baby.group.position.x + midOf(baby) * baby.facing, baby.group.position.y + 0.35, 0.1); });
        }
        pairs.push(pr);
      });
      return pop;
    };
    const nestX = pageX(mom, 'nest');
    const MAIN = { x: -3.0, z: 0.75 };
    addNest({
      x: MAIN.x, z: MAIN.z, w: 3.4, seed: 1, delay: 0.32,
      eggs: [[-0.62, 0.0, 0.045], [0.4, 0.0, 0.045], [-0.15, -0.1, 0.08], [0.82, -0.08, 0.08]],
      babies: [{ hx: -1.7, sx: -1.8, face: -1, delay: 0.0 }, { hx: 1.8, sx: -1.25, face: -1, delay: 0.55 }, { hx: 2.2, sx: -0.7, face: 1, delay: 1.1 }, { hx: -1.15, sx: -1.5, face: -1, delay: 1.7 }],
    });
    addNest({
      x: 2.9, z: 1.4, w: 3.0, seed: 2, delay: 0.36,
      eggs: [[-0.52, 0.0, 0.045], [0.46, 0.0, 0.045], [-0.02, -0.1, 0.08]],
      babies: [{ hx: -1.7, sx: -0.5, face: 1, delay: 0.9 }, { hx: 1.7, sx: 0.2, face: -1, delay: 1.45 }, { hx: 2.2, sx: 0.7, face: -1, delay: 2.0 }],
    });
    addNest({
      x: 9.3, z: 2.2, w: 3.0, seed: 3, delay: 0.4,
      eggs: [[-0.52, 0.0, 0.045], [0.46, 0.0, 0.045], [-0.02, -0.1, 0.08]],
      babies: [{ hx: -1.7, sx: -0.6, face: -1, delay: 1.2 }, { hx: 1.6, sx: 0.2, face: 1, delay: 0.3 }, { hx: 2.0, sx: 0.7, face: 1, delay: 1.9 }],
    });

    // ------------------------------------------------------------------- Oviraptor brütet (rechts)
    const OV = { x: 6.5, z: -0.9, w: 4.7 };
    const ovNest = ctx.prop('nest_mound', { x: OV.x, z: OV.z, len: OV.w, delay: 0.34, variant: { seed: 5 } });
    const ovLift = ovNest.fig.anchors.hollow.y * 0.55;
    const ovi = ctx.stand('oviraptor', { x: OV.x, z: OV.z + 0.16, len: 3.1, facing: -1, delay: 0.4, variant: { pose: 'brood' } });
    ovi.fig.group.position.y = ovLift; ovi.proxy.position.y += ovLift;
    const ovEggs = [];
    [[-1.95, 0.15, 1], [-1.4, 0.05, -1], [1.35, 0.1, 1], [1.95, 0.18, -1]].forEach(([dx, dz, face], i) => {
      const e = ctx.fig('egg', { len: EGG_L * 0.92, thickness: 0.012, border: 0.014, facing: face, variant: { seed: 11 + i } }); e.setCast(false);
      at(e, dx, ovLift * 0.9 + (i % 2) * 0.03, 0.22 + dz * 0.1); ovi.popup.add(e.group); ctx.sideAt(OV.x).own(e); ovEggs.push(e);
    });
    const oviBl = makeBlinker(ovi.fig, { part: 'body', anchor: 'eye', r: 0.045, color: '#8a6a44', seed: 6 });
    const oviS = { wing: 0, jaw: 0, twT: 3 };
    ovi.behaviors.push((dt, t) => {
      const sl = S.sleepy || 0;
      const br = 0.28 + 0.09 * Math.sin(t * 1.6) * (1 - 0.5 * sl);
      poseAmt(ovi.fig, 'wing', clamp(Math.max(br, oviS.wing)));
      oviS.twT -= dt; if (oviS.twT < 0 && !oviS.pk) { oviS.pk = 0.0001; oviS.twT = 6 + Math.random() * 6; }
      let pj = 0; if (oviS.pk) { oviS.pk += dt; pj = Math.max(0, Math.sin(oviS.pk * 13)) * 0.45 * (1 - sl); if (oviS.pk > 0.9) oviS.pk = 0; }
      poseAmt(ovi.fig, 'jaw', Math.max(oviS.jaw, pj));
      if (oviBl) { oviBl.hold = sl; oviBl.update(dt); }
      ovEggs.forEach((e, i) => { e.group.rotation.z = S.oviWob ? Math.sin(t * 24 + i * 2) * 0.05 * S.oviWob : 0; });
    });
    ovi.onWake = (a) => { a.tw.add(1.2, (k) => { oviS.wing = Math.sin(k * Math.PI) * 0.95; oviS.jaw = Math.max(0, Math.sin(k * 14)) * Math.sin(k * Math.PI) * 0.6; }, { done: () => { oviS.wing = 0; oviS.jaw = 0; } }); };
    yield;

    // ------------------------------------------------------------------- Versteck: Vielhöckerzähner im Bau
    const BUR = { x: 10.9, z: -1.0 };
    const burrow = ctx.flat(burrowPart(), { x: BUR.x, z: BUR.z, name: 'burrow', delay: 0.46, ppu: 150, border: 0.03 });
    const mt = ctx.stand('multituberculate', { x: BUR.x - 0.05, z: BUR.z + 0.05, len: 0.62, facing: -1, delay: 0.5, hidden: true, hint: false, hitPad: 0.25 });
    mt.fig.group.position.y = 0.06; mt.cover = burrow;
    P('fern_ground', { x: BUR.x - 0.55, z: BUR.z + 0.55, len: 1.3, delay: 0.52, variant: { seed: 3 } });
    P('fern_ground', { x: BUR.x + 0.5, z: BUR.z + 0.6, len: 1.1, delay: 0.54, variant: { seed: 1 }, facing: -1 });
    mt.onWake = (a) => {
      a.tw.add(0.7, (k) => { a.hop = Math.sin(k * Math.PI) * 0.22; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { a.hop = 0; poseAmt(a.fig, 'jaw', 0); } });
      a.tw.add(0.9, (k) => { burrow.yawG.rotation.z = Math.sin(k * 16 + 1) * 0.012 * (1 - k); }, { done: () => { burrow.yawG.rotation.z = 0; } });
    };
    mt.behaviors.push((dt, t) => { poseAmt(mt.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 1.7)); });
    yield;

    // ------------------------------------------------------------------- Vordergrund-Details
    P('fern_ground', { x: -1.2, z: 2.9, len: 1.5, delay: 0.5, variant: { seed: 1 } });
    P('fern_ground', { x: 5.4, z: 1.3, len: 1.5, delay: 0.52, variant: { seed: 2 }, facing: -1 });
    P('fern_ground', { x: 11.2, z: 3.3, len: 1.4, delay: 0.52, variant: { seed: 3 } });
    ctx.prop('boulder', { x: 0.9, z: 3.1, len: 1.2, delay: 0.55, variant: { seed: 2 } });
    ctx.prop('boulder', { x: 7.9, z: 3.0, len: 1.0, delay: 0.55, variant: { seed: 1 } });
    ctx.prop('bush', { x: 11.2, z: 1.0, len: 1.4, delay: 0.52, variant: { seed: 3 } });
    P('reeds', { x: 6.3, z: 1.7, h: 1.3, delay: 0.5 }); P('reeds', { x: 3.9, z: 2.0, h: 1.0, delay: 0.52, facing: -1 });

    // Libelle am Teich
    const dfly = ctx.prop('dragonfly', { x: 5.0, z: 1.2, len: 0.85, delay: 0.55, cast: false });
    const df = dfly.fig, dmid = ((df.bbox.x0 + df.bbox.x1) / 2) * df.ws, flap = df.meta.flap || { wing: [-0.35, 0.55], wing2: [-0.3, 0.45] };
    ctx.onUpdate((dt, t) => {
      const ph = t * 0.4, fac = Math.cos(ph) >= 0 ? 1 : -1;
      df.group.scale.x = fac; df.group.position.set(Math.sin(ph) * 2.3 - dmid * fac, 1.7 + Math.sin(t * 1.1) * 0.2 + Math.sin(t * 2.3) * 0.05, Math.sin(ph * 0.5) * 0.5);
      const f = 0.5 + 0.5 * Math.sin(t * 44);
      df.rotatePart('wing', lerp(flap.wing[0], flap.wing[1], f)); df.rotatePart('wing2', lerp(flap.wing2[0], flap.wing2[1], 1 - f));
    });

    // ------------------------------------------------------------------- SCHLÜPFE! (links) – Eier brechen auf
    const schl = ctx.control('L', { id: 'schluepfe', label: 'SCHLÜPFE!', a: [-4.0, 3.65], b: [-1.7, 3.65], size: [2.5, 1.0], color: '#d9772b', value: 0, springBack: true });
    const bigPuff = (px, py, pz, n, o) => puff(app, ctx.world(px, py, pz), fxN(app, n), o);
    const startPair = (pr, base) => { pr.run = true; pr.t = -(base + pr.delay); pr.done = false; pr.crack2 = false; pr.hatchAudio = false; pr.peepAudio = false; pr.landed = false; pr.cracked = false; };
    const trigger = () => {
      const babyPairs = pairs.filter((p) => p.baby);
      if (!S.started) {
        S.started = true; S.lowT = 0.0001; S.oviWob = 1;
        babyPairs.forEach((p) => startPair(p, 0.1));
      } else if (babyPairs.every((p) => p.done)) {
        S.chorus = 0.0001; S.lowT = 0.0001;
        babyPairs.forEach((p, i) => { p.chor = -(i * 0.18); });
      }
    };
    schl.on((v) => {
      S.pull = clamp(v);
      if (v > 0.92 && !S.armed) { S.armed = true; trigger(); } else if (v < 0.5) S.armed = false;
    });
    schl.onGrab = () => app.audio.sfx('grab'); schl.onTick = (v) => app.audio.sfx('slide', { v }); schl.onRelease = () => app.audio.sfx('snap');

    // ------------------------------------------------------------------- Sonnenuntergang (rechts) – Licht wandert
    const sunset = ctx.control('R', { id: 'sonnenuntergang', label: 'Sonnenuntergang', a: [2.6, 3.65], b: [7.6, 3.65], size: [3.3, 1.0], color: '#b0507c', value: 0, hold: true });
    sunset.on((v) => {
      S.sun = clamp(v);
      if (ctx.spread.active) { blendMood(cur, MOOD_A, MOOD_B, smooth(S.sun)); stage.setMood(cur); }
    });
    sunset.onGrab = () => app.audio.sfx('grab'); sunset.onTick = (v) => app.audio.sfx('slide', { v }); sunset.onRelease = () => app.audio.sfx('snap');

    // ------------------------------------------------------------------- Frame-Update
    const SN = (v, a, b) => smooth(clamp((v - a) / (b - a)));
    ctx.onUpdate((dt, t) => {
      const sun01 = smooth(S.sun);
      // Sonne sinkt, Dämmerungs-Himmel blendet ein
      sun.group.position.y = lerp(SUN.y0, SUN.y1, sun01);
      glow.userData.update(t, lerp(1, 1.25, sun01));
      const dk = SN(S.sun, 0.12, 0.95);
      for (const d of skies) { d.material.opacity = dk; d.mesh.visible = dk > 0.01; }
      S.sleepy = SN(S.sun, 0.72, 0.98);
      // Mutter senkt den Kopf (Zeitkurve nach dem Schlüpfen / beim Nachspiel)
      if (S.lowT >= 0) { S.lowT += dt; const q = S.lowT; S.low = SN(q, 0, 1.3) * (1 - SN(q, 6.4, 8.0)); if (q > 8.2) { S.lowT = -1; S.low = 0; } }
      if (S.mumNuz) S.low = Math.max(S.low, S.mumNuz * 0.5);
      if (S.oviWob > 0) S.oviWob = Math.max(0, S.oviWob - dt * 0.35);
      // Anspannung: beim Ziehen wackeln die Eier schon leicht
      const pullK = S.started ? 0 : S.pull;
      for (const pr of pairs) {
        if (pr.intact && !pr.done && pr.baby) {
          const run = pr.run, tt = pr.t;
          let wob = 0;
          if (!run) {
            wob = Math.sin(t * 31 + pr.ex * 5) * 0.045 * SN(pullK, 0.15, 0.9);
            // ab und zu zuckt ein Ei von selbst (Leben im Ei)
            pr.wT = (pr.wT ?? 3 + Math.random() * 8) - dt;
            if (pr.wT < 0) { pr.wQ = (pr.wQ || 0) + dt; wob += Math.sin(pr.wQ * 26) * 0.06 * Math.max(0, 1 - pr.wQ / 0.55); if (pr.wQ > 0.55) { pr.wQ = 0; pr.wT = 7 + Math.random() * 9; } }
          }
          else if (tt >= 0 && tt < 1.0) wob = Math.sin(tt * 27) * 0.14 * SN(tt, 0, 0.5) * (1 - SN(tt, 0.85, 1.0));
          const eg = pr.cracked ? pr.hatch : pr.intact;
          eg.group.rotation.z = wob; if (pr.cracked) pr.intact.group.rotation.z = wob;
        }
      }
      for (const pr of pairs) {
        if (!pr.baby) continue;
        const bf = pr.baby, bg = bf.group;
        if (pr.run && !pr.done) {
          pr.t += dt; const tt = pr.t;
          if (tt >= 0) {
            if (!pr.cracked && tt >= 0.02) { pr.cracked = true; app.audio.sfx('crack'); }
            if (!pr.crack2 && tt >= 0.55) { pr.crack2 = true; pr.intact.group.visible = false; pr.hatch.group.visible = true; app.audio.sfx('crack'); }
            // Schale klappt auf
            const capK = smooth(clamp((tt - 0.95) / 0.5));
            if (capK > 0) poseAmt(pr.hatch, 'cap', capK);
            if (!pr.hatchAudio && tt >= 0.95) { pr.hatchAudio = true; app.audio.sfx('hatch'); puff(app, ctx.world(pr.pop.group.position.x + pr.ex, pr.pop.group.position.y + pr.ey + 0.25, pr.pop.group.position.z + 0.2), fxN(app, 5), { spread: 0.35, up: 0.7, size: 0.1, life: 0.9, alpha: 0.9, color: [1, 0.95, 0.8], grow: 0.2 }); }
            // Baby taucht auf, piept, hüpft hinaus
            const rise = clamp((tt - 1.3) / 0.9);
            if (rise > 0) {
              bg.visible = true;
              const sc = Math.max(0.05, easeOutBack(rise)); bg.scale.set(sc * bf.facing, sc, 1);
              const hop = clamp((tt - 2.25) / 0.85);
              const hx0 = pr.ex, hx1 = lerp(pr.hx, pr.sx, pr.sw);
              const hxx = lerp(hx0, hx1, smooth(hop));
              const y0 = pr.ey + 0.12 + 0.12 * Math.sin(clamp(rise) * Math.PI * 0.5), yy = lerp(y0, 0, smooth(hop)) + Math.sin(hop * Math.PI) * 0.5;
              at(bf, hxx, yy, lerp(pr.ez + 0.05, pr.bz, smooth(hop)));
              bg.scale.x = sc * bf.facing;
              poseAmt(bf, 'jaw', rise > 0.3 && tt < 2.3 ? Math.max(0, Math.sin((tt - 1.5) * 15)) * 0.85 : 0);
              if (!pr.peepAudio && tt >= 1.55) { pr.peepAudio = true; app.audio.sfx('peep'); }
              if (hop >= 1 && !pr.landed) { pr.landed = true; pr.done = true; pr.act.hitMeshes = [pr.act.proxy, ...bf.hit]; bigPuff(pr.pop.group.position.x + hx1, 0.05, pr.pop.group.position.z + 0.3, 3, { spread: 0.4, up: 0.3, size: 0.3, alpha: 0.4 }); }
            }
          }
        } else if (pr.done) {
          // ruhende Position: zwischen Nestnähe und Kuschelplatz (Schieber)
          const hx1 = lerp(pr.hx, pr.sx, pr.sw);
          const hopY = 0;
          if (pr.chor !== -1 && S.chorus > 0) {
            pr.chor += dt; const q = pr.chor;
            if (q >= 0 && q < 0.7) { pr.act.hop = Math.sin(q / 0.7 * Math.PI) * 0.3; poseAmt(bf, 'jaw', Math.max(0, Math.sin(q * 18)) * 0.8); if (!pr.chA && q > 0.05) { pr.chA = true; app.audio.sfx('peep'); } }
            else if (q >= 0.7) { pr.chor = -1; pr.chA = false; pr.act.hop = 0; poseAmt(bf, 'jaw', 0); }
          }
          at(bf, hx1, hopY, pr.bz);
          // Idle: ab und zu ein Hüpfer mit Piepsen (nicht im Schlaf)
          if (pr.chor === -1) {
            pr.idle -= dt;
            if (pr.hopT < 0 && pr.idle <= 0 && S.sleepy < 0.3) { pr.hopT = 0.0001; pr.idle = 5 + Math.random() * 8; }
            if (pr.hopT >= 0) { pr.hopT += dt; const q = pr.hopT / 0.5; pr.act.hop = Math.sin(clamp(q) * Math.PI) * 0.13; poseAmt(bf, 'jaw', Math.max(0, Math.sin(q * 12)) * 0.5); if (q >= 1) { pr.hopT = -1; pr.act.hop = 0; poseAmt(bf, 'jaw', 0); } }
          }
          bg.rotation.z = (pr.face < 0 ? 1 : -1) * 0.07 * pr.sw;
          pr.bl && (pr.bl.hold = S.sleepy, pr.bl.update(dt));
        }
        // Kuschel-Anteil folgt dem Schieber (weich)
        pr.sw = lerp(pr.sw, SN(S.sun, 0.28, 0.9), clamp(dt * 3));
      }
      if (S.chorus > 0) { S.chorus += dt; if (S.chorus > 4) S.chorus = 0; }
      // Glühwürmchen in der Dämmerung
      if (S.sun > 0.55 && app.stage.tier.fx > 0.2) {
        S.fireT -= dt;
        while (S.fireT <= 0) {
          S.fireT += (app.calm ? 0.5 : 0.28) / app.stage.tier.fx;
          const x = lerp(-9, 11, Math.random()), z = lerp(-0.5, 3.4, Math.random());
          const w = ctx.world(x, 0.6 + Math.random() * 1.6, z);
          app.fx.glow.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.25, vy: 0.04 + Math.random() * 0.12, vz: (Math.random() - 0.5) * 0.1, life: 2.6 + Math.random() * 1.6, size: 0.1, alpha: 0.85, color: [0.95, 0.95, 0.45] });
        }
      }
    });
    const reset = () => {
      S.sun = 0; S.pull = 0; S.armed = false; S.started = false; S.lowT = -1; S.low = 0; S.chorus = 0; S.oviWob = 0; S.mumNuz = 0; S.sleepy = 0;
      for (const pr of pairs) {
        pr.intact.group.visible = true; pr.intact.group.rotation.z = 0; pr.hatch.group.visible = false; pr.hatch.group.rotation.z = 0; poseAmt(pr.hatch, 'cap', 0);
        if (!pr.baby) continue;
        const bf = pr.baby; bf.group.visible = false; bf.group.scale.set(bf.facing, 1, 1); bf.group.rotation.z = 0; poseAmt(bf, 'jaw', 0);
        pr.act.hitMeshes = []; pr.act.hop = 0; pr.act.tw.clear(); pr.run = false; pr.t = -1; pr.done = false; pr.cracked = false; pr.sw = 0; pr.hopT = -1; pr.chor = -1; pr.landed = false;
        at(bf, pr.hx, 0, pr.bz); if (pr.bl) pr.bl.hold = 0;
      }
      for (const d of skies) { d.material.opacity = 0; d.mesh.visible = false; }
      blendMood(cur, MOOD_A, MOOD_B, 0);
    };
    this._reset = reset;
    this._popCount = ctx.L.popups.length + ctx.R.popups.length;
  },

  onDeactivate(ctx) {
    const st = this._st; if (!st) return;
    this._sway && this._sway.reset();
    for (const s of [ctx.L, ctx.R]) { for (const c of s.controls) c.setValue(0, { snap: true }); for (const a of s.actors) a.tw.clear(); }
    this._reset && this._reset();
  },
};
