// Station 1: „Rom entsteht“ (753–509 v. Chr.) – Tiberufer im Morgenlicht, sieben Hügel, Hirtenhütten und Schafe.
//   Lasche „Die Zwillinge“  (links vorn):  Grotte, Feigenbaum, Wölfin und die Zwillinge Romulus und Remus klappen nacheinander aus dem Papier auf.
//   Schieber „Sieben Hügel“ (rechts vorn): die sieben Hügel steigen nacheinander aus dem Papier (Palatin zuerst, er ist der älteste).
//   Lasche „Furche“         (rechts vorn): Romulus pflügt mit dem Ochsen die Furche um den Palatin (die erste Stadtgrenze, Sage).
// Antippbar: Wölfin/Zwillinge, Romulus (mit Ochse), Hirtenhütten, Tiber (Wellen), Tarquinius, Hügel; versteckt: Gans auf dem Kapitol (gans1).
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, blotches, speckles, grassTufts, pebbles, SERIF } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt, makeFigure, specBBox, Actor, FOLD } from '../engine/popup.js';
import { ANIMALS } from '../art/registry.js';
import { sunGlow } from '../engine/effects.js';
import { clamp, lerp, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { blob } from '../art/dsl.js';
import { fxRate, ramp, smooth, mixHex, softPlane, paintMist, waveStripPart, hillShape, ribbonMesh } from './_p1_kit.js';

const IDX = 1;
const SKY_W = 11.55, CX = { L: -5.975, R: 5.975 };
// Tiber: Mittellinie und Breite (Seitenkoordinaten, über beide Seiten stetig)
const riverZ = (x) => -2.3 + 0.28 * Math.sin(x * 0.4 + 0.9) + 0.1 * Math.sin(x * 0.95 + 2.1);
const riverW = (x) => 1.2 + 0.2 * Math.sin(x * 0.33 + 1.4);
// Furche: Ellipse um den Palatin
const E = { cx: 3.95, cz: 0.45, rx: 3.2, rz: 1.75, a0: Math.PI * 0.75 };
const HAZE = '#d3e6dd';
const HILLS = [
  { id: 'palatin', name: 'Palatin', x: 3.95, z: 0.4, w: 4.5, h: 1.75, seed: 3, order: 0 },
  { id: 'kapitol', name: 'Kapitol', x: -5.3, z: -3.0, w: 5.0, h: 3.05, seed: 5, order: 1 },
  { id: 'aventin', name: 'Aventin', x: -9.5, z: -3.55, w: 5.0, h: 2.45, seed: 8, order: 2 },
  { id: 'caelius', name: 'Caelius', x: -2.4, z: -3.5, w: 4.2, h: 2.35, seed: 2, order: 3 },
  { id: 'esquilin', name: 'Esquilin', x: 9.7, z: -3.35, w: 4.4, h: 2.7, seed: 11, order: 4 },
  { id: 'viminal', name: 'Viminal', x: 6.5, z: -3.6, w: 4.4, h: 2.4, seed: 4, order: 5, lx: 0.6 },
  { id: 'quirinal', name: 'Quirinal', x: 2.5, z: -3.25, w: 4.4, h: 2.9, seed: 6, order: 6 },
];

// ---------------------------------------------------------------- gemalter Fluss auf der Seitenfläche
function drawRiver(ctx, m, xa, xb) {
  const S = m.S, n = 100, r = mulberry32(17);
  const edge = (side, off) => { const pts = []; for (let i = 0; i <= n; i++) { const x = xa + ((xb - xa) * i) / n; pts.push(m.pt(x, riverZ(x) + side * (riverW(x) / 2 + off))); } return pts; };
  const poly = (a, b, fill) => { ctx.beginPath(); a.forEach(([X, Y], i) => { if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); b.slice().reverse().forEach(([X, Y]) => ctx.lineTo(X, Y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); };
  // sandige Ufer
  ctx.save(); ctx.shadowColor = 'rgba(70,50,20,.25)'; ctx.shadowBlur = 0.12 * S;
  poly(edge(-1, 0.3), edge(1, 0.32), '#e9ddb0'); ctx.restore();
  poly(edge(-1, 0.1), edge(1, 0.12), '#d6c690');
  // Wasser
  const g = ctx.createLinearGradient(0, m.z(-3.1), 0, m.z(-1.3)); g.addColorStop(0, '#9ccfe0'); g.addColorStop(0.55, '#6fb0cf'); g.addColorStop(1, '#4b8fb4');
  poly(edge(-1, 0), edge(1, 0), g);
  // Uferlinien und glitzernde Wellen
  ctx.save(); ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(45,100,130,.55)'; ctx.lineWidth = 0.03 * S; ctx.beginPath(); edge(-1, 0).forEach(([X, Y], i) => { if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.025 * S; ctx.beginPath(); edge(1, 0).forEach(([X, Y], i) => { if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
  ctx.strokeStyle = 'rgba(235,248,255,.5)'; ctx.lineWidth = 0.022 * S;
  for (let i = 0; i < 70; i++) { const x = xa + r() * (xb - xa), z = riverZ(x) + (r() - 0.5) * riverW(x) * 0.75, l = (0.25 + r() * 0.35) * S; const [X, Y] = m.pt(x, z); ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(X + l * 0.25, Y - 0.05 * S, X + l * 0.5, Y); ctx.quadraticCurveTo(X + l * 0.75, Y + 0.05 * S, X + l, Y); ctx.stroke(); }
  ctx.restore();
}

// ---------------------------------------------------------------- Hügel-Kulisse (Papierform mit Beschriftung)
function hillPart(h, shape, colors, { palatin = false } = {}) {
  const { top, bottom } = colors;
  return { layers: [{
    shapes: [shape.pts], fill: { top, bottom }, stroke: 'rgba(40,70,30,.4)',
    deco(c, bb) {
      const { ctx: g, tf, S } = c, r = mulberry32(h.seed * 13 + 5);
      // Licht von rechts (die Sonne geht rechts auf)
      const gr = g.createLinearGradient(...tf(bb.x0, bb.y0 + bb.h * 0.5), ...tf(bb.x1, bb.y0 + bb.h * 0.5));
      gr.addColorStop(0, 'rgba(30,60,30,.22)'); gr.addColorStop(0.55, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,238,170,.30)');
      g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H);
      // Höhenlinien: Felder und Weideflächen
      g.lineCap = 'round';
      for (let k = 1; k <= 3; k++) {
        g.strokeStyle = k % 2 ? 'rgba(255,255,230,.16)' : 'rgba(40,80,30,.14)'; g.lineWidth = Math.max(1, S * 0.03);
        g.beginPath(); shape.pts.slice(1, -1).forEach(([x, y], i) => { const [X, Y] = tf(x, y * (1 - k * 0.2) - k * 0.05); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke();
      }
      // Gräser, Büsche, Zypressen-Pünktchen unter der Kuppe
      for (let i = 0; i < 70; i++) {
        const x = bb.x0 + r() * bb.w, yc = shape.yAt(x), y = yc * (0.25 + r() * 0.65);
        if (y > yc - 0.05) continue;
        const [X, Y] = tf(x, y);
        if (r() < 0.45) { g.fillStyle = r() < 0.5 ? 'rgba(40,95,45,.55)' : 'rgba(25,75,40,.5)'; g.beginPath(); g.ellipse(X, Y, S * (0.05 + r() * 0.05), S * (0.04 + r() * 0.04), 0, 0, TAU); g.fill(); }
        else { g.strokeStyle = 'rgba(40,90,40,.45)'; g.lineWidth = Math.max(1, S * 0.014); g.beginPath(); g.moveTo(X, Y); g.lineTo(X + (r() - 0.5) * S * 0.05, Y - S * (0.08 + r() * 0.08)); g.stroke(); }
      }
      if (palatin) { // Trampelpfad und Feldstreifen
        g.strokeStyle = 'rgba(190,150,90,.55)'; g.lineWidth = Math.max(2, S * 0.07);
        g.beginPath(); [[-1.3, 0.0], [-0.9, 0.55], [-0.2, 1.0], [0.4, 1.45], [0.6, 1.9]].forEach(([x, y], i) => { const [X, Y] = tf(x, y * h.h / 2.7); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.stroke();
      }
      // Beschriftung (wie handgeschrieben auf das Papier gedruckt)
      g.save(); g.font = `italic bold ${Math.max(10, S * 0.3)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const [LX, LY] = tf(palatin ? -0.6 : (h.lx || 0), h.h * (palatin ? 0.34 : 0.7));
      g.lineWidth = S * 0.07; g.strokeStyle = 'rgba(255,250,225,.85)'; g.lineJoin = 'round'; g.strokeText(h.name, LX, LY);
      g.fillStyle = 'rgba(70,45,20,.9)'; g.fillText(h.name, LX, LY); g.restore();
    },
  }] };
}

export default {
  id: 'rom-entsteht',
  mood: mood({ key: '#ffd9a6', keyI: 2.35, sky: '#e4eee6', gnd: '#80754a', hemiI: 1.85, pos: [10, 19, 10], rim: 0.08 }),
  motes: { colors: [[1, 0.92, 0.7], [0.85, 1, 0.8]], size: 0.075, alpha: 0.4, dx: 0.08, dy: 0.1, dz: 0.01, tw: 1.2, density: 0.8 },
  atmo: 'rom-entsteht',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        ground: { back: '#b9c97c', front: '#9cb55f' }, margin: 0.3, pageNo: 3, seed: 31,
        draw(ctx, m) {
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 22, rmin: 0.8, rmax: 2.4, colors: ['rgba(235,240,170,.2)', 'rgba(80,120,50,.1)'], seed: 7 });
          speckles(m, { x0: -11.6, x1: -0.3, z0: -1.6, z1: 4.0, n: 160, color: 'rgba(255,248,215,.55)', size: 0.03, seed: 21 });
          drawRiver(ctx, m, -12.4, 0.4);
          grassTufts(m, { x0: -11.5, x1: -0.5, z0: -1.4, z1: 3.9, n: 20, color: '#6f9040', h: 0.28, seed: 5, blades: 4, alpha: 0.65 });
          pebbles(m, { x0: -11, x1: -0.8, z0: -1.4, z1: 3.5, n: 8, seed: 3 });
          // Lichtung unter der Grotte
          ctx.save(); ctx.fillStyle = 'rgba(200,170,110,.35)'; ctx.beginPath(); ctx.ellipse(m.x(-3.3), m.z(0.9), 2.5 * m.S, 0.85 * m.S, 0, 0, TAU); ctx.fill(); ctx.restore();
          printLabel(m, 'Tiber', -6.0, riverZ(-6.0) + 0.02, { size: 0.3, color: 'rgba(255,255,255,.8)', italic: true, bold: false });
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
        },
      },
      R: {
        ground: { back: '#bccb7a', front: '#9db55c' }, margin: 0.3, pageNo: 4, seed: 32,
        draw(ctx, m) {
          blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.8, rmax: 2.4, colors: ['rgba(235,240,170,.2)', 'rgba(80,120,50,.1)'], seed: 9 });
          speckles(m, { x0: 0.3, x1: 11.7, z0: -1.6, z1: 4.0, n: 200, color: 'rgba(255,248,215,.55)', size: 0.03, seed: 23 });
          drawRiver(ctx, m, -0.4, 12.4);
          grassTufts(m, { x0: 0.5, x1: 11.5, z0: -1.4, z1: 3.9, n: 22, color: '#6f9040', h: 0.28, seed: 6, blades: 4, alpha: 0.65 });
          pebbles(m, { x0: 1, x1: 11.5, z0: -1.4, z1: 3.5, n: 8, seed: 4 });
          // Weg: aus Rom hinaus (Tarquinius geht nach rechts)
          const path = [[7.4, 1.9], [8.8, 2.35], [10.2, 2.25], [11.5, 1.9], [12.4, 1.75]];
          ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          for (const [w, col] of [[1.05, 'rgba(120,90,45,.35)'], [0.88, '#dcc590']]) { ctx.strokeStyle = col; ctx.lineWidth = w * m.S; ctx.beginPath(); path.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); }
          ctx.restore();
          // gestrichelte Vorzeichnung der Furche
          ctx.save(); ctx.setLineDash([0.14 * m.S, 0.13 * m.S]); ctx.strokeStyle = 'rgba(110,70,30,.5)'; ctx.lineWidth = 0.05 * m.S; ctx.lineCap = 'round'; ctx.beginPath();
          for (let i = 0; i <= 120; i++) { const a = E.a0 - (TAU * i) / 120, [X, Y] = m.pt(E.cx + E.rx * Math.cos(a), E.cz + E.rz * Math.sin(a)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
          ctx.stroke(); ctx.restore();
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R, sfx = (n, o) => app.audio.sfx(n, o);
    const S = (ctx.spread.p1 = {
      hv: 0, tv: 0, fv: 0, intro: null, act: false, hills: [], pieces: [], sheep: [], strips: [], smoke: [], t: 0, fMoveT: -9, dir: 1, dist: 0, tipWorld: new THREE.Vector3(),
    });
    const tapCard = (id) => () => { sfx('tapp'); app.openCardById(id); };
    const sideOf = (x) => (x < 0 ? L : R);

    // ---------------- Himmel (Morgen: oben zartblau, am Horizont warm) und Sonne
    for (const s of ['L', 'R']) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-SKY_W / 2, SKY_W / 2, 5.0, {
        fill: { stops: [[0, '#8dbcdc'], [0.38, '#cfe3e8'], [0.62, '#fbe9c6'], [0.82, '#fdd9a2'], [1, '#f5c68e']], dir: 'v' }, wave: 0.26, freq: 2.8, phase: 0.7 + k * 1.9, seed: 11 + k,
        deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,236,170,.55)', cx: s === 'L' ? 0.95 : 0.42, cy: 0.42, r: 0.9 }); dither(c, bb, '#fff', { n: 90, alpha: 0.12, size: 0.04, seed: 5 + k }); },
      }), { x: CX[s], z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 56, border: 0.04 });
    }
    // tiefe Sonne hinter den Hügeln rechts, mit Glanz
    const sunPart = { layers: [{ shapes: [blob(0, 2.3, 0.85, 0.85, 0, 48)], fill: { top: '#fff6c0', bottom: '#ffd46c' }, stroke: null,
      deco: (c) => { const { ctx: g, tf, S: px } = c; const [X, Y] = tf(-0.2, 2.5); const gr = g.createRadialGradient(X, Y, 0, X, Y, px * 0.9); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H); } }] };
    const sun = ctx.flat(sunPart, { x: 8.3, z: -3.97, name: 'sonne', delay: 0.05, ppu: 50, border: 0.03 });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.72, 48), new THREE.MeshBasicMaterial({ color: 0xffe58f, toneMapped: false, transparent: true, opacity: 0.9, depthWrite: false }));
    disc.position.set(0, 2.3, 0.04); disc.renderOrder = 3; sun.add(disc);
    const glow = sunGlow({ size: 4.4, color: 0xffd27a, opacity: 0.45 }); glow.position.set(0, 2.3, 0.05); sun.add(glow);
    yield;

    // ---------------- sieben Hügel: Kulissenebenen, steigen aus dem Papier (riseG schiebt die Form unter die Seite)
    for (const hd of HILLS) {
      const far = clamp((-hd.z - 3.0) / 0.7);
      const f = hd.id === 'palatin' ? 0.0 : 0.1 + 0.3 * far;
      const topC = mixHex(hd.id === 'palatin' ? '#b7c96a' : '#a3c35d', HAZE, f), botC = mixHex(hd.id === 'palatin' ? '#86a549' : '#6f9d4c', HAZE, f * 0.8);
      const shape = hillShape(hd.w, hd.h, hd.seed);
      const side = sideOf(hd.x);
      const pop = ctx.flat(hillPart(hd, shape, { top: topC, bottom: botC }, { palatin: hd.id === 'palatin' }), { x: hd.x, z: hd.z, name: 'hill-' + hd.id, delay: 0.05 + 0.02 * hd.order, ppu: 64, border: 0.035, thickness: 0.03, lean: hd.id === 'palatin' ? -0.01 : -0.03 });
      const riseG = new THREE.Group(); pop.pivot.add(riseG); riseG.add(pop.cut.mesh);
      const H = { ...hd, pop, riseG, shape, side, e: 0, up: false, start: hd.order * 0.115 };
      riseG.position.y = -(hd.h + 0.4); riseG.visible = false;
      side.addTap(pop.cut.mesh, tapCard('huegel'), () => H.e > 0.55);
      S.hills.push(H);
    }
    const Hp = (id) => S.hills.find((h) => h.id === id);
    yield;

    // ---------------- Gans auf dem Kapitol (Hirtenhut), teilweise hinter einem Busch
    {
      const kap = Hp('kapitol'), gx = 0.95, gy = kap.shape.yAt(gx) - 0.03;
      const gFig = makeFigure('gans1', { len: 0.95, thickness: 0.026, border: 0.03 });
      const midx = ((gFig.bbox.x0 + gFig.bbox.x1) / 2) * gFig.ws * gFig.facing;
      gFig.group.position.set(gx - midx, gy, 0.14);
      kap.riseG.add(gFig.group); kap.side.own(gFig);
      const act = new Actor(kap.side, gFig, kap.pop, { id: 'gans1', card: 'gans1', name: 'Gans', hint: false, hitPad: 0.2 });
      act.hidden = true; kap.side.addActor(act);
      kap.riseG.add(act.proxy); act.proxy.position.y += gy; act.proxy.position.z = 0.16;
      act.fullHit = act.hitMeshes.slice(); act.hitMeshes = [];
      S.goose = { act, hill: kap };
      const bush = makeFigure('bush', { len: 0.95, thickness: 0.02, border: 0.03 });
      const bx = ((bush.bbox.x0 + bush.bbox.x1) / 2) * bush.ws;
      bush.group.position.set(gx + 0.05 - bx, gy - 0.04, 0.3); kap.riseG.add(bush.group); kap.side.own(bush);
      // ein paar Zypressen auf dem Kapitol
      for (const [cxl, hh] of [[-1.4, 0.9], [-0.7, 0.7], [1.9, 0.8]]) {
        const cy = makeFigure('zypresse', { h: hh, thickness: 0.02, border: 0.025 }); const mx = ((cy.bbox.x0 + cy.bbox.x1) / 2) * cy.ws;
        cy.group.position.set(cxl - mx, kap.shape.yAt(cxl) - 0.04, 0.12); kap.riseG.add(cy.group); kap.side.own(cy);
      }
    }
    // ---------------- Hirtenhütten auf dem Palatin (Casa Romuli oben in der Mitte), Rauch vom Hauptdach
    {
      const pal = Hp('palatin');
      S.palSmoke = [];
      for (const [hx, len, big] of [[0.45, 1.9, true], [-1.1, 1.3, false], [1.6, 1.2, false]]) {
        const fg = makeFigure('huette', { len, thickness: 0.026, border: 0.03 });
        const mx = ((fg.bbox.x0 + fg.bbox.x1) / 2) * fg.ws;
        fg.group.position.set(hx - mx, pal.shape.yAt(hx) - 0.06, 0.16 + (big ? 0 : 0.03)); pal.riseG.add(fg.group); pal.side.own(fg);
        for (const hm of fg.hit) { pal.side.addTap(hm, tapCard('huette'), () => pal.e > 0.55 && pal.pop.eff > 0.6); }
        const mk = new THREE.Object3D(); mk.position.set(hx, pal.shape.yAt(hx) - 0.06 + 2.2 * (len / 3.4), 0.2); pal.riseG.add(mk);
        if (big) S.palSmoke.push(mk);
      }
    }
    yield;

    // ---------------- Fluss: Wellenstreifen (antippbar → Karte Tiber), Dunst, Lichtstrahl
    for (const [x, w, ph] of [[-8.0, 3.9, 0.3], [-2.3, 3.6, 1.7], [3.0, 3.8, 2.6], [9.0, 3.9, 0.9]]) {
      const z = riverZ(x) + 0.34;
      const pop = ctx.flat(waveStripPart(w, 0.17, { wave: 0.05, freq: 3, phase: ph, seed: Math.round(x) + 5 }), { x, z, name: 'welle', delay: 0.18, ppu: 70, border: 0.02, thickness: 0.02 });
      pop.pickMeshes = [pop.cut.mesh]; pop.cut.mesh.userData.tap = tapCard('tiber');
      S.strips.push({ pop, x0: 0, ph, z });
    }
    // unsichtbare Fläche über dem gemalten Fluss: ein Tipp aufs Wasser öffnet die Tiber-Karte (Hütten und Bäume davor haben Vorrang)
    for (const [sd, xa, xb] of [[L, -12.4, 0.05], [R, -0.05, 12.4]]) {
      const pp = []; for (let i = 0; i <= 40; i++) { const x = xa + ((xb - xa) * i) / 40; pp.push([x, riverZ(x)]); }
      const rv = ribbonMesh(pp, 0.62, '#000000', { y: 0.03, order: 0 }); rv.userData.setCount(pp.length - 1); rv.material.visible = false; sd.add(rv);
      sd.addTap(rv, tapCard('tiber'), () => true);
    }
    const mistL = softPlane(ctx, { x: CX.L, z: riverZ(-6) + 0.2, w: 11.6, h: 1.7, draw: (g, W, H) => paintMist(g, W, H, { color: [234, 246, 242], alpha: 0.62, seed: 4, blobs: 10, fadeL: true }), opacity: 0.9, name: 'dunstL', delay: 0.3, order: 6 });
    const mistR = softPlane(ctx, { x: CX.R, z: riverZ(6) + 0.2, w: 11.6, h: 1.7, draw: (g, W, H) => paintMist(g, W, H, { color: [234, 246, 242], alpha: 0.62, seed: 9, blobs: 10, fadeR: true }), opacity: 0.9, name: 'dunstR', delay: 0.3, order: 6 });
    const mistFar = softPlane(ctx, { x: CX.R, z: -3.3, w: 11.6, h: 2.6, draw: (g, W, H) => paintMist(g, W, H, { color: [250, 244, 225], alpha: 0.55, seed: 21, blobs: 8, fadeR: true }), opacity: 0.8, name: 'dunstfern', delay: 0.3, order: 4 });
    S.mist = [mistL, mistR, mistFar];
    yield;

    // ---------------- Bäume, Schilf, Büsche
    ctx.prop('pinie', { x: -10.2, z: -2.7, len: 3.3, delay: 0.16 });
    ctx.prop('pinie', { x: 10.0, z: -1.05, len: 2.8, delay: 0.16, facing: -1 });
    for (const [x, z, h] of [[-0.45, -1.5, 2.9], [7.5, -0.3, 3.3], [11.4, 0.4, 2.7]]) ctx.prop('zypresse', { x, z, h, delay: 0.2 });
    ctx.prop('weide', { x: 5.0, z: -2.35, h: 3.2, delay: 0.2 });
    ctx.prop('reeds', { x: -10.9, z: -1.2, h: 1.5, delay: 0.24 });
    ctx.prop('reeds', { x: 7.9, z: -1.2, h: 1.4, delay: 0.26, facing: -1 });
    ctx.prop('bush', { x: -0.9, z: 2.2, len: 1.0, delay: 0.3 });
    ctx.prop('bush', { x: 11.2, z: 3.0, len: 1.1, delay: 0.3 });
    yield;

    // ---------------- Hirtendorf links hinten: Hütten, Feuer, Schafe, Hirte
    const hutPop = (x, z, len, delay) => { const p = ctx.prop('huette', { x, z, len, delay }); p.pickMeshes = p.fig.hit; for (const m of p.fig.hit) m.userData.tap = tapCard('huette'); return p; };
    hutPop(-10.2, -1.15, 2.7, 0.22); hutPop(-7.4, -0.95, 2.2, 0.24);
    const fire = ctx.prop('feuer', { x: -8.75, z: -0.5, len: 0.85, delay: 0.3 }); S.fire = fire;
    const sheepAt = (x, z, facing, seed) => { const p = ctx.prop('schaf', { x, z, len: 1.05, facing, delay: 0.3 + seed * 0.02, variant: { seed } }); p.pickMeshes = p.fig.hit;
      for (const m of p.fig.hit) m.userData.tap = () => { sfx('chime'); S.bounce = { p, t: 0 }; }; S.sheep.push({ p, ph: seed * 1.9, bounce: 0 }); return p; };
    sheepAt(-9.6, -0.4, 1, 1); sheepAt(-6.3, -0.15, -1, 2); sheepAt(-1.3, -1.2, 1, 3);
    sheepAt(8.7, 0.9, 1, 4); sheepAt(9.6, 1.55, -1, 5);
    const hirte = ctx.stand('hirte', { x: -6.15, z: -0.75, h: 1.75, facing: -1, id: 'person', name: 'Hirte', card: null, hint: false, delay: 0.32 }); hirte.setFacing(-1);
    hutPop(9.9, -0.45, 2.4, 0.28);
    yield;

    // ---------------- Grotte der Wölfin mit Feigenbaum, Wölfin und Zwillingen (klappen mit der Lasche auf)
    const grotte = ctx.prop('grotte', { x: -3.7, z: -0.95, len: 3.5, delay: 0 });
    const feige = ctx.prop('feige', { x: -1.5, z: -0.7, len: 2.7, delay: 0 });
    const wolf = ctx.stand('wolfin', { x: -3.5, z: 0.6, len: 2.5, facing: 1, id: 'wolfin', card: 'wolfin', name: 'Wölfin', hint: false, delay: 0, hitPad: 0.3 });
    const babyScale = (a) => a.fig.ws;
    const mkBaby = (id, x, z, pose) => {
      const a = ctx.stand(id, { x, z, h: 1.05, facing: 1, id: 'wolfin', card: 'wolfin', name: 'Zwilling', hint: false, delay: 0, hitPad: 0.25 });
      const s = 0.62 / 1.7; a.fig.group.position.y = -(0.9 * s - 0.04) * a.fig.ws; // sitzend: Hüfte auf den Boden
      a.fig.rotatePart('legA', 1.5); a.fig.rotatePart('legB', 1.4); a.pose = pose; return a;
    };
    const baby1 = mkBaby('baby1', -3.55, 1.05, 0), baby2 = mkBaby('baby2', -2.75, 1.3, 1.7);
    const pieces = [
      { pop: grotte, a: null, from: 0.0, to: 0.38 }, { pop: feige, a: null, from: 0.1, to: 0.5 },
      { pop: wolf.popup, a: wolf, from: 0.3, to: 0.75 }, { pop: baby1.popup, a: baby1, from: 0.55, to: 0.88 }, { pop: baby2.popup, a: baby2, from: 0.64, to: 1.0 },
    ];
    for (const p of pieces) { p.k = 0; if (p.a) p.a.fullHit = p.a.hitMeshes.slice(); }
    S.pieces = pieces;
    // sanftes Nicken und Schwanzwedeln der Wölfin; beim Antippen hebt sie den Kopf
    wolf.behaviors.push((dt, t) => { if (wolf.tw.list.length === 0) { wolf.fig.rotatePart('neck', -0.07 + 0.05 * Math.sin(t * 0.9)); wolf.fig.rotatePart('tail', 0.1 * Math.sin(t * 1.4)); } });
    wolf.onWake = (a) => { a.tw.add(1.2, (k) => { a.fig.rotatePart('neck', Math.sin(k * Math.PI) * 0.4); a.fig.rotatePart('tail', Math.sin(k * 22) * 0.3 * (1 - k)); }); };
    for (const b of [baby1, baby2]) b.onWake = (a) => { a.tw.add(0.7, (k) => { a.hop = Math.sin(k * Math.PI) * 0.12; }, { done: () => { a.hop = 0; } }); };
    yield;

    // ---------------- Romulus mit Ochse und Pflug (ein Pop-up, wandert entlang der Furche)
    const rom = ctx.stand('romulus', { x: 1.7, z: 1.2, h: 1.75, facing: 1, id: 'person', card: 'romulus', name: 'Romulus', hint: true, delay: 0.34, hitPad: 0.4 });
    {
      const wsR = rom.fig.ws, sR = 1.75 / 1.7, th = 0.95;
      const sh = [0, 1.36 * sR * wsR], hv = [0.03 * sR * wsR, (0.89 - 1.36) * sR * wsR];
      const handX = sh[0] + hv[0] * Math.cos(th) - hv[1] * Math.sin(th), handY = sh[1] + hv[0] * Math.sin(th) + hv[1] * Math.cos(th);
      const pbb = specBBox(ANIMALS.pflug()), obb = specBBox(ANIMALS.ochse());
      const plowWs = handY / 0.96, oxWs = (0.94 * plowWs) / 1.3;
      const plow = makeFigure('pflug', { len: pbb.w * plowWs, thickness: 0.02, border: 0.03 }), ox = makeFigure('ochse', { len: obb.w * oxWs, thickness: 0.026, border: 0.03 });
      plow.group.position.set(0, 0, 0.0); rom.fig.group.position.x = -0.55 * plowWs - handX; rom.fig.group.position.z = 0.03;
      ox.group.position.set(1.7 * plowWs - 0.97 * oxWs, 0, -0.1);
      rom.popup.add(plow.group); rom.popup.add(ox.group); rom.side.own(plow); rom.side.own(ox);
      for (const f of [plow, ox]) for (const m of f.hit) { m.userData.actor = rom; rom.hitMeshes.push(m); }
      rom.fig.rotatePart('armA', th); rom.fig.rotatePart('armB', 0.9);
      // Trefferfläche über das ganze Gespann
      const cxTeam = ((-0.64 * plowWs - handX) + (1.7 * plowWs + 1.4 * oxWs)) / 2;
      rom.proxy.position.x = cxTeam; rom.proxy.scale.x = 3.4; rom.proxy.scale.y = 1.15;
      S.team = { a: rom, plow, ox, plowWs, oxWs, tipLocalY: 0.04 };
    }
    // Furchen-Linie (wächst mit der Lasche)
    const FN = 181, PX = [], PZ = [], CUM = [0];
    for (let i = 0; i < FN; i++) { const a = E.a0 - (TAU * i) / (FN - 1); PX.push(E.cx + E.rx * Math.cos(a)); PZ.push(E.cz + E.rz * Math.sin(a)); if (i) CUM.push(CUM[i - 1] + Math.hypot(PX[i] - PX[i - 1], PZ[i] - PZ[i - 1])); }
    const pts = PX.map((x, i) => [x, PZ[i]]);
    const furB = ribbonMesh(pts, 0.17, '#a4763c', { y: 0.011, order: 1 }), furA = ribbonMesh(pts, 0.085, '#4e311a', { y: 0.014, order: 2 });
    R.add(furB); R.add(furA);
    S.fur = { PX, PZ, CUM, FN, furA, furB };
    yield;

    // ---------------- Tarquinius, der letzte König, verlässt Rom
    const tarq = ctx.stand('tarquinius', { x: 10.5, z: 2.1, h: 1.9, facing: 1, id: 'person', card: 'tarquinius', name: 'Tarquinius', hint: true, delay: 0.36, hitPad: 0.35 });
    tarq.behaviors.push((dt, t) => { poseAmt(tarq.fig, 'legA', 0); });
    yield;

    // ---------------- Steuerungen
    const ctlTw = ctx.control('L', { id: 'zwillinge', label: 'Die Zwillinge', a: [-4.0, 3.6], b: [-1.6, 3.6], size: [2.4, 1.0], color: '#c58a2e', value: 0, springBack: false, hold: true, ticks: 0 });
    const ctlHill = ctx.control('R', { id: 'huegel', label: 'Sieben Hügel', a: [1.5, 3.6], b: [4.9, 3.6], size: [2.4, 1.0], color: '#4f8f3c', value: 0, springBack: false, hold: true, ticks: 7 });
    const ctlFur = ctx.control('R', { id: 'furche', label: 'Furche', a: [7.9, 3.6], b: [10.4, 3.6], size: [2.0, 1.0], color: '#3f7fa6', value: 0, springBack: false, hold: true, ticks: 0 });
    S.ctl = { tw: ctlTw, hill: ctlHill, fur: ctlFur };
    const loud = () => S.act && !S.quiet;
    S.hush = (fn) => { S.quiet = true; try { fn(); } finally { S.quiet = false; for (const c of [ctlTw, ctlHill, ctlFur]) c.lastTick = c.sp.x; } };
    const grab = (c) => { c.onGrab = () => { S.intro = null; sfx('grab'); }; c.onRelease = () => sfx('snap'); };
    [ctlTw, ctlHill, ctlFur].forEach(grab);

    // Hügel steigen nacheinander
    const setHills = (v) => {
      S.hv = v;
      for (const h of S.hills) {
        const e = smooth(ramp(v, h.start, h.start + 0.3)); h.e = e;
        h.riseG.position.y = -(h.h + 0.4) * (1 - e); h.riseG.visible = e > 0.003;
        if (e > 0.5 && !h.up) { h.up = true; if (loud()) sfx('pop'); } else if (e < 0.35 && h.up) { h.up = false; if (loud()) sfx('tick'); }
      }
      const g = S.goose; if (g) g.act.hitMeshes = g.hill.e > 0.6 ? g.act.fullHit : [];
    };
    ctlHill.on(setHills); ctlHill.onTick = (v) => { if (loud() && !S.intro) sfx('slide', { v }); };

    // Zwillinge klappen auf (Zustand nur aus v)
    const setTwins = (v) => { if (v > 0.02 && S.tv <= 0.02 && loud()) sfx('flapOpen'); else if (v <= 0.02 && S.tv > 0.02 && loud()) sfx('flapClose'); if (v > 0.8 && S.tv <= 0.8 && loud()) { sfx('chime'); if (!S.intro) app.audio.voice('wolfin'); } S.tv = v; };
    ctlTw.on(setTwins); ctlTw.onTick = (v) => { if (loud() && !S.intro) sfx('slide', { v }); };

    // Furche: Romulus mit dem Gespann geht rund um den Palatin
    const setFurrow = (v) => {
      const { PX: px, PZ: pz, CUM: cum, FN: n, furA: fa, furB: fb } = S.fur;
      S.fv = v; const idx = v * (n - 1), i0 = Math.min(n - 2, Math.floor(idx)), u = idx - i0;
      fa.userData.setCount(idx); fb.userData.setCount(idx);
      const x = lerp(px[i0], px[i0 + 1], u), z = lerp(pz[i0], pz[i0 + 1], u), dx = px[i0 + 1] - px[i0];
      if (Math.abs(dx) > 0.004) S.dir = Math.sign(dx);
      const g = S.team.a.popup.group; g.position.x = x; g.position.z = z; g.scale.x = S.dir;
      const dist = lerp(cum[i0], cum[i0 + 1], u), moving = Math.abs(dist - S.dist) > 0.002; S.dist = dist;
      if (moving) {
        S.fMoveT = app.t; const ph = dist * 2.6, f = S.team.a.fig, ox = S.team.ox;
        f.rotatePart('legA', Math.sin(ph) * 0.42); f.rotatePart('legB', -Math.sin(ph) * 0.42);
        ox.rotatePart('legA', Math.sin(ph) * 0.34); ox.rotatePart('legD', Math.sin(ph) * 0.34); ox.rotatePart('legB', -Math.sin(ph) * 0.34); ox.rotatePart('legC', -Math.sin(ph) * 0.34);
        S.team.a.hop = Math.abs(Math.sin(ph)) * 0.035;
        if (S.act && Math.random() < 0.55 * fxRate(app)) { const w = ctx.world(x, 0.06, z + 0.12); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: -S.dir * 0.3, vy: 0.3 + Math.random() * 0.2, vz: 0.1, life: 0.8, size: 0.2, alpha: 0.4, color: [0.62, 0.45, 0.28], drag: 1.6, grow: 1.8 }); }
      }
    };
    ctlFur.on(setFurrow); ctlFur.onTick = (v) => { if (loud()) sfx('footstep', { v }); };
    setFurrow(0);
    // beim ersten Bild: Ruhestellung
    S.team.a.popup.group.position.set(PX[0], 0, PZ[0]);

    // ---------------- Update je Bild
    const tmp = new THREE.Vector3();
    ctx.onUpdate((dt, t) => {
      S.t = t; const act = (S.act = ctx.spread.active);
      // Einleitung: die Hügel steigen von selbst, dann klappen die Zwillinge auf
      if (S.intro) {
        S.intro.t += dt; const it = S.intro.t;
        ctlHill.touched = ctlTw.touched = true;
        ctlHill.setValue(smooth(ramp(it, 0.9, 5.2)), { snap: true });
        if (it > 4.3) ctlTw.setValue(smooth(ramp(it, 4.3, 6.4)), { snap: true });
        if (it > 6.6) { S.intro = null; ctlHill.touched = ctlTw.touched = false; }
      }
      // Zwillings-Tableau: Aufklappen nach v, gedeckelt vom Pop-up-Zustand der Seite
      for (const p of S.pieces) {
        const kk = smooth(ramp(S.tv, p.from, p.to)), pop = p.pop;
        const k = Math.min(pop.eff, kk > 0.999 ? 9 : kk);
        pop.pivot.rotation.x = (1 - clamp(k, 0, 1.18)) * FOLD + pop.lean * Math.min(k, 1); pop.group.visible = k > 0.004; p.k = k;
        if (p.a) p.a.hitMeshes = k > 0.65 ? p.a.fullHit : [];
      }
      const open = S.tv > 0.55;
      baby1.fig.rotatePart('armA', 2.55 + 0.3 * Math.sin(t * 2.2)); baby2.fig.rotatePart('armA', 2.45 + 0.3 * Math.sin(t * 2.6 + 1)); baby1.fig.rotatePart('armB', 0.6 + 0.3 * Math.sin(t * 2.0)); baby2.fig.rotatePart('armB', 0.8 + 0.3 * Math.sin(t * 2.3));
      // Schafe grasen; Antippen = Hüpfer
      for (const s of S.sheep) { const g = 0.5 + 0.5 * Math.sin(t * 0.45 + s.ph); poseAmt(s.p.fig, 'neck', g > 0.6 ? 1 : g / 0.6 * 0.8); }
      if (S.bounce) { S.bounce.t += dt; const k = S.bounce.t / 0.5; S.bounce.p.group.position.y = k < 1 ? Math.sin(k * Math.PI) * 0.18 : 0; if (k >= 1) { S.bounce.p.group.position.y = 0; S.bounce = null; } }
      // Wellen und Dunst bewegen sich
      for (const w of S.strips) { const m = w.pop.cut.mesh; m.position.x = Math.sin(t * 0.55 + w.ph) * 0.3; m.position.y = Math.sin(t * 1.05 + w.ph * 2) * 0.02; }
      S.mist[0].mesh.position.x = Math.sin(t * 0.07) * 0.5; S.mist[1].mesh.position.x = Math.sin(t * 0.06 + 1) * 0.5; S.mist[2].mesh.position.x = Math.sin(t * 0.04 + 2) * 0.4;
      glow.userData.update(t);
      // Feuer flackert
      fire.fig.rotatePart('flame', 0.08 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 12.1)); fire.fig.parts.flame.scale.set(1, 1 + 0.13 * Math.sin(t * 9.1 + 1), 1);
      // Gespann: wenn niemand zieht, bleibt es stehen
      if (t - S.fMoveT > 0.14) { const f = S.team.a.fig, ox = S.team.ox; for (const p of ['legA', 'legB']) f.rotatePart(p, 0); for (const p of ['legA', 'legB', 'legC', 'legD']) ox.rotatePart(p, 0); S.team.a.hop = 0; }
      // Rauch und Funken (sparsam)
      if (act && !app.calm) {
        const rate = fxRate(app);
        if (Math.random() < 1.2 * dt * rate && Hp('palatin').e > 0.6 && S.palSmoke[0]) { S.palSmoke[0].getWorldPosition(tmp); app.fx.dust.emit({ x: tmp.x, y: tmp.y, z: tmp.z, vx: 0.12, vy: 0.45, vz: 0, life: 2.6, size: 0.2, alpha: 0.2, color: [0.85, 0.85, 0.86], drag: 0.7, grow: 2.2 }); }
        if (Math.random() < 1.4 * dt * rate && fire.group.visible) { const w = ctx.world(-8.75, 0.75, -0.4); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0.1, vy: 0.5, vz: 0, life: 2.2, size: 0.18, alpha: 0.18, color: [0.78, 0.78, 0.8], drag: 0.8, grow: 2.2 }); if (Math.random() < 0.5) app.fx.glow.emit({ x: w.x + (Math.random() - 0.5) * 0.2, y: w.y - 0.5, z: w.z, vx: 0.05, vy: 0.7, vz: 0, life: 0.9, size: 0.06, alpha: 0.9, color: [1, 0.7, 0.3], drag: 0.5, grow: 0 }); }
      }
    });
    // Ruhige Ausgangslage: Hügel und Zwillinge noch unten
    setHills(0); setTwins(0);
  },

  onActivate(ctx) {
    const S = ctx.spread.p1, app = ctx.app; if (!S) return;
    S.act = true; S.t0 = app.t;
    S.hush(() => {
      S.ctl.fur.setValue(0, { snap: true });
      if (app.calm) { S.intro = null; S.ctl.hill.setValue(1, { snap: true }); S.ctl.tw.setValue(1, { snap: true }); }
      else { S.ctl.hill.setValue(0, { snap: true }); S.ctl.tw.setValue(0, { snap: true }); S.intro = { t: 0 }; }
    });
  },
  onDeactivate(ctx) {
    const S = ctx.spread.p1; if (!S) return;
    S.intro = null; S.act = false;
    S.hush(() => { for (const c of [S.ctl.hill, S.ctl.tw, S.ctl.fur]) { c.setValue(0, { snap: true }); c.touched = false; } });
  },
};
