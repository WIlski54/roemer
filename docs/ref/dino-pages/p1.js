// Station 1: Trias – Morgendämmerung der Dinosaurier
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, SERIF, RED, INK, roundRect, pebbles, grassTufts, blotches, speckles, wavyLine } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt } from '../engine/popup.js';
import { paperCard } from '../engine/popup.js';
import { sunGlow } from '../engine/effects.js';
import { lerp, clamp, smooth, TAU, easeOutBack } from '../engine/util.js';
import { panelPart, cracks, leftCard, strata, dither, softLight } from './common.js';
import { blob, poly } from '../art/dsl.js';

const IDX = 1;

function pangaeaCanvas(open) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 360; const g = c.getContext('2d');
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  g.fillStyle = '#f7edd3'; rr(0, 0, 512, 360, 28); g.fill();
  if (open === 'under') { // map printed on the page below the flap
    g.fillStyle = '#4f9ccb'; rr(14, 14, 484, 332, 20); g.fill();
    g.fillStyle = 'rgba(255,255,255,.14)'; for (let i = 0; i < 9; i++) { g.beginPath(); g.arc(60 + i * 52, 40 + (i % 3) * 110, 22, 0, 6.3); g.stroke(); }
    // Pangaea: one big C-shaped continent
    g.fillStyle = '#c3a05a'; g.strokeStyle = '#6b4f1e'; g.lineWidth = 4;
    g.beginPath(); g.moveTo(170, 60); g.bezierCurveTo(300, 20, 410, 90, 380, 170); g.bezierCurveTo(360, 230, 400, 280, 330, 318); g.bezierCurveTo(270, 340, 250, 290, 230, 250); g.bezierCurveTo(200, 210, 130, 250, 110, 200); g.bezierCurveTo(80, 150, 120, 90, 170, 60); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#7ca04a'; g.beginPath(); g.ellipse(250, 130, 70, 38, 0.3, 0, 6.3); g.fill(); g.beginPath(); g.ellipse(310, 230, 38, 24, -0.4, 0, 6.3); g.fill();
    g.fillStyle = '#fff'; g.font = `bold 40px ${SERIF}`; g.textAlign = 'center'; g.fillText('PANGAEA', 245, 168);
    g.font = `italic 22px ${SERIF}`; g.fillStyle = '#e8f4ff'; g.fillText('Panthalassa (Urmeer)', 150, 322);
    g.fillStyle = '#7a1a1a'; g.font = `italic 20px ${SERIF}`; g.fillText('Ein Kontinent für alles Land', 330, 48);
    return c;
  }
  if (open === 'top') {
    g.fillStyle = '#c8693a'; rr(14, 14, 484, 332, 20); g.fill();
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 3; g.setLineDash([10, 8]); rr(30, 30, 452, 300, 14); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.font = `bold 56px ${SERIF}`; g.fillText('Pangaea', 256, 160);
    g.font = `italic 30px ${SERIF}`; g.fillText('klapp mich auf!', 256, 220);
    g.beginPath(); g.moveTo(256, 275); g.lineTo(226, 245); g.lineTo(286, 245); g.closePath(); g.fill();
    return c;
  }
  // underside (visible when standing)
  g.fillStyle = '#c8693a'; rr(14, 14, 484, 332, 20); g.fill();
  g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.font = `bold 44px ${SERIF}`; g.fillText('So sah die Welt aus', 256, 150);
  g.font = `italic 28px ${SERIF}`; g.fillText('Nur ein Kontinent!', 256, 205); g.font = `22px ${SERIF}`; g.fillText('Tippe für die Karte', 256, 270);
  return c;
}

export default {
  id: 'trias',
  mood: mood({ key: '#ffdca8', keyI: 2.55, sky: '#ffeccf', gnd: '#a0603a', hemiI: 1.8, pos: [-13, 20, 8] }),
  motes: { colors: [[1, 0.88, 0.55], [1, 0.95, 0.75], [0.95, 0.75, 0.45]], size: 0.07, alpha: 0.5, dy: 0.12, dx: 0.12, tw: 1.4, density: 1 },
  atmo: 'trias',
  weatherDefault: 'clear',
  base() {
    const d = PAGES_DE[IDX];
    const g1 = { back: '#e9b36b', front: '#d08a45' };
    return {
      L: {
        ground: g1, margin: 0.3, pageNo: 3, seed: 21,
        draw(ctx, m) {
          cracks(m, { x0: -11.6, x1: -0.4, z0: -1.0, z1: 4.0, n: 70, seed: 3 });
          pebbles(m, { x0: -11, x1: -0.8, z0: -0.3, z1: 3.5, n: 14, seed: 8 });
          grassTufts(m, { x0: -11, x1: -1, z0: 0, z1: 3.7, n: 7, seed: 5, color: '#7a8b3e', h: 0.3 });
          // inset map under the flap
          ctx.save(); ctx.drawImage(pangaeaCanvas('under'), m.x(-5.2), m.z(2.0), 2.5 * m.S, 1.75 * m.S); ctx.restore();
          ctx.strokeStyle = 'rgba(60,30,10,.7)'; ctx.lineWidth = 0.04 * m.S; roundRect(ctx, m.x(-5.2), m.z(2.0), 2.5 * m.S, 1.75 * m.S, 0.12 * m.S); ctx.stroke();
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
        },
      },
      R: {
        ground: { back: '#e6b06a', front: '#cf8744' }, margin: 0.3, pageNo: 4, seed: 22,
        draw(ctx, m) {
          cracks(m, { x0: 0.6, x1: 11.5, z0: -1.0, z1: 4.0, n: 80, seed: 9 });
          // dusty run track
          const path = [[0.4, 1.55], [3.5, 1.4], [6.3, 1.65], [9.0, 1.45], [11.4, 1.6]];
          ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
          ctx.strokeStyle = 'rgba(247,225,175,.5)'; ctx.lineWidth = 2.1 * m.S; ctx.beginPath(); path.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1] + 0.55); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
          ctx.strokeStyle = 'rgba(150,90,40,.35)'; ctx.lineWidth = 0.03 * m.S; ctx.setLineDash([0.18 * m.S, 0.14 * m.S]);
          for (const off of [-0.45, 1.6]) { ctx.beginPath(); path.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1] + off); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); }
          ctx.restore();
          pebbles(m, { x0: 1, x1: 11, z0: 0, z1: 3.7, n: 14, seed: 11 });
          grassTufts(m, { x0: 1, x1: 11, z0: 0.2, z1: 3.8, n: 6, seed: 15, color: '#7a8b3e', h: 0.3 });
          printLabel(m, '← Rudel →', 5.8, 3.9, { size: 0.17, color: 'rgba(90,55,25,.6)', italic: true, bold: false });
        },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app;
    const SK = ['L', 'R'];
    // ---------------------------------------------------------------- backdrop layers
    for (const s of SK) {
      const x0 = s === 'L' ? -11.75 : 0.2, x1 = s === 'L' ? -0.2 : 11.75;
      // sky wall (tallest, furthest)
      ctx.flat(panelPart(x0, x1, 5.0, { fill: { top: '#8fcbe0', bottom: '#fde6b8' }, wave: 0.3, freq: 3.2, phase: s === 'L' ? 0.5 : 2.1, seed: s === 'L' ? 2 : 5, deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,240,190,.55)', cx: s === 'L' ? 0.8 : 0.6, cy: 0.55, r: 0.7 }); dither(c, bb, '#fff', { n: 120, alpha: 0.12, size: 0.04 }); } }), { z: -4.05, lean: -0.05, name: 'sky' + s, delay: 0.0, ppu: 70, border: 0.04 });
      // far mesa band
      ctx.flat(panelPart(x0, x1, 2.6, { fill: { top: '#d57f4f', bottom: '#b9603a' }, wave: 0.55, freq: s === 'L' ? 3.3 : 2.7, step: 0.2, phase: s === 'L' ? 1.0 : 3.3, seed: 8, deco: (c, bb) => { strata(c, bb, ['#e8a26f', '#c46c42', '#f0b47f', '#a8552f'], { n: 8, seed: 4, alpha: 0.35 }); dither(c, bb, '#6b2f14', { n: 160, alpha: 0.18 }); } }), { z: -3.2, lean: -0.03, name: 'mesa' + s, delay: 0.05, ppu: 70 });
      // near dune band
      ctx.flat(panelPart(x0, x1, 1.05, { fill: { top: '#ecc27a', bottom: '#d9a258' }, wave: 0.3, freq: 5, scallop: false, phase: s === 'L' ? 0.2 : 1.6, seed: 3, deco: (c, bb) => { dither(c, bb, '#8a5a24', { n: 100, alpha: 0.22 }); } }), { z: -2.25, name: 'dune' + s, delay: 0.1, ppu: 80 });
    }
    yield;
    // sun with glow + rays
    const sun = ctx.prop('sun_disc', { x: 7.6, y: 2.9, z: -3.9, h: 2.0, delay: 0.1, cast: false });
    const glow = sunGlow({ size: 8.5, color: 0xffd27a }); glow.position.set(0, 1.0, -0.06); sun.add(glow);
    ctx.onUpdate((dt, t) => glow.userData.update(t));
    const cloud = ctx.prop('cloud_a', { x: 3.4, y: 3.7, z: -3.85, len: 2.8, delay: 0.2, cast: false });
    const cloud2 = ctx.prop('cloud_b', { x: -5.0, y: 3.9, z: -3.9, len: 2.4, delay: 0.25, cast: false });
    ctx.onUpdate((dt, t) => { cloud.group.position.x = 3.4 + Math.sin(t * 0.05) * 1.6; cloud2.group.position.x = -5.0 + Math.sin(t * 0.04 + 1) * 1.4; });
    yield;
    // rock and plant props
    ctx.prop('mesa_red', { x: -6.8, z: -3.0, len: 7.2, delay: 0.12 });
    ctx.prop('mesa_red', { x: 5.2, z: -3.15, len: 6.8, delay: 0.14, facing: -1 });
    ctx.prop('rock_pillar', { x: -8.9, z: -2.7, h: 3.3, delay: 0.16 });
    ctx.prop('cliff_layers', { x: 10.6, z: -2.9, h: 3.8, delay: 0.16 });
    yield;
    ctx.prop('araucaria', { x: -11.0, z: -3.3, h: 5.0, delay: 0.2 });
    ctx.prop('tree_fern', { x: -9.2, z: -1.5, h: 3.3, delay: 0.24 });
    ctx.prop('tree_fern', { x: 10.1, z: -1.1, h: 2.9, delay: 0.26, facing: -1 });
    ctx.prop('horsetail', { x: -4.4, z: -1.9, h: 1.6, delay: 0.28 });
    ctx.prop('horsetail', { x: 4.2, z: -2.0, h: 1.5, delay: 0.3 });
    ctx.prop('cycad', { x: -7.6, z: -0.2, h: 1.6, delay: 0.3 });
    ctx.prop('cycad', { x: 8.8, z: 0.2, h: 1.5, delay: 0.32, facing: -1 });
    ctx.prop('boulder', { x: 0.9, z: 2.6, len: 1.3, delay: 0.36, variant: { seed: 2 } });
    yield;
    // ---------------------------------------------------------------- animals
    const plat = ctx.stand('plateosaurus', { x: 3.7, z: -1.1, len: 5.6, facing: -1, delay: 0.34 });
    plat.setFacing(-1);
    plat.behaviors.push((dt, t) => { if (plat.tw.list.length === 0) poseAmt(plat.fig, 'neck', 0.45 + 0.35 * Math.sin(t * 0.55 + 1)); });
    plat.onWake = (a) => { a.tw.add(1.4, (k) => { poseAmt(a.fig, 'neck', Math.sin(k * Math.PI) * 1.0); a.hop = Math.sin(k * Math.PI) * 0.12; }, { done: () => { a.hop = 0; } }); app.audio.voice('plateosaurus'); };

    const eor = ctx.stand('eoraptor', { x: -1.9, z: 2.9, len: 1.7, facing: 1, delay: 0.4 });
    eor.behaviors.push((dt, t) => poseAmt(eor.fig, 'jaw', Math.max(0, Math.sin(t * 0.9) - 0.7)));
    eor.onWake = (a) => { a.tw.add(0.7, (k) => { a.hop = Math.sin(k * Math.PI) * 0.4; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { a.hop = 0; } }); app.audio.voice('eoraptor'); };

    // pack of Coelophysis (RENN!)
    const pack = [];
    const starts = [2.1, 1.5, 2.8], ends = [10.4, 9.5, 10.9], zs = [1.55, 2.2, 2.9], lens = [2.5, 2.3, 2.1];
    for (let i = 0; i < 3; i++) {
      const a = ctx.stand('coelophysis', { x: starts[i], z: zs[i], len: lens[i], facing: 1, delay: 0.42 + i * 0.05, card: i === 0 ? 'coelophysis' : 'coelophysis' });
      a.runX = starts[i]; a.lastX = starts[i]; a.phase = i * 1.7; a.dist = 0;
      pack.push(a);
    }
    const run = ctx.control('R', { id: 'renn', label: 'RENN!', a: [2.6, 3.6], b: [9.0, 3.6], size: [2.3, 1.0], color: '#c8452c', value: 0, springBack: true });
    ctx.onUpdate((dt, t) => {
      const v = run.sp.x;
      pack.forEach((a, i) => {
        const x = lerp(starts[i], ends[i], smooth(clamp(v * 1.02 - i * 0.015)));
        const dx = x - a.lastX; a.lastX = x;
        a.popup.group.position.x = x;
        if (Math.abs(dx) > 0.0004) a.setFacing(dx >= 0 ? 1 : -1);
        if (Math.abs(dx) > 0.002) {
          a.dist += Math.abs(dx);
          const ph = a.dist * 5.2 + a.phase;
          const sw = a.fig.meta.swing || {};
          for (const [p, off] of [['legA', 0], ['legB', Math.PI]]) { const r = sw[p] || [-0.5, 0.5]; a.fig.rotatePart(p, lerp(r[0], r[1], 0.5 + 0.5 * Math.sin(ph + off))); }
          a.hop = Math.abs(Math.sin(ph)) * 0.09;
          if (Math.random() < Math.min(1, Math.abs(dx) * 14)) {
            const w = ctx.world(x - (dx > 0 ? 0.6 : -0.6), 0.08, zs[i]);
            app.fx.dust.emit({ x: w.x, y: w.y, z: w.z + 0.1, vx: -Math.sign(dx) * 0.5 - 0.3 * Math.random(), vy: 0.35 + Math.random() * 0.4, vz: (Math.random() - 0.5) * 0.4, life: 0.9, size: 0.34, alpha: 0.5, color: [0.93, 0.78, 0.55], drag: 1.6, grow: 2.2 });
          }
        } else { for (const p of ['legA', 'legB']) a.fig.rotatePart(p, 0); }
      });
    });
    run.onGrab = () => app.audio.sfx('grab');
    run.onTick = (v) => app.audio.sfx('footstep', { v });
    run.onRelease = (v) => app.audio.sfx('snap');

    // hidden early mammal behind a fern leaf
    const morg = ctx.stand('morganucodon', { x: -7.6, z: -0.25, len: 0.95, facing: 1, delay: 0.5, hidden: true, hint: false, hitPad: 0.2 });
    morg.onWake = (a) => { a.tw.add(0.6, (k) => { a.hop = Math.sin(k * Math.PI) * 0.35; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); }, { done: () => { a.hop = 0; } }); app.audio.voice('morganucodon'); };
    const fern = ctx.prop('fern_ground', { x: -7.15, z: 0.12, len: 1.7, delay: 0.52, variant: { seed: 2 } });
    morg.cover = fern; // app wiggles it when found
    yield;

    // ---------------------------------------------------------------- Pangaea flap on the left page
    const side = ctx.L;
    const hinge = new THREE.Group(); hinge.position.set(-3.95, 0.03, 2.0);
    const card = paperCard(2.5, 1.75, new THREE.CanvasTexture(pangaeaCanvas('top')), new THREE.CanvasTexture(pangaeaCanvas('bottom')), { depth: 0.05 });
    for (const m of [card.userData.top, card.userData.bottom]) { m.material.map.colorSpace = THREE.SRGBColorSpace; m.material.map.anisotropy = 4; }
    hinge.add(card); side.add(hinge);
    let open = 0, openTarget = 0;
    side.addTap(card.userData.top, () => { openTarget = openTarget ? 0 : 1; app.audio.sfx(openTarget ? 'flapOpen' : 'flapClose'); if (openTarget) setTimeout(() => app.openCardById('pangaea'), 450); });
    for (const mm of [card.userData.bottom]) mm.userData.tap = () => { openTarget = 0; app.audio.sfx('flapClose'); };
    side.taps.push({ mesh: card.userData.bottom });
    side.onUpdate((dt) => {
      open += (openTarget - open) * (1 - Math.exp(-dt * 6));
      hinge.rotation.x = -open * 1.38;
    });
    ctx.spread.flap = { get open() { return openTarget; }, close() { openTarget = 0; } };
  },
  onDeactivate(ctx) { if (ctx.spread.flap) ctx.spread.flap.close(); },
};
