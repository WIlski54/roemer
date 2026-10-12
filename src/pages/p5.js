// Station 5: „Rom auf dem Höhepunkt“ (1. und 2. Jh. n. Chr.) – Stadtpanorama Roms im Papierschnitt.
// Linke Seite: gedruckte Textkarte, Reichskarte (Tafel, Schieber „Reichsgrenzen“), Forum mit Marktstand, Pantheon und Trajanssäule.
// Rechte Seite: das Pop-up-Kolosseum (Lasche „Kolosseum auf!“ stapelt die Arkadenreihen, Faden „Sonnensegel“ spannt das Velarium),
//               eine Sänfte auf der Straße, Tempel, Meilenstein; Regler „Tagesablauf“ bewegt Sonne, Licht und Schatten von Morgen bis Abend.
// Antippbar: Kolosseum (Wände und Sitzstufen), Arena, Sonnensegel, Pantheon, Trajanssäule, Forum (Platz und Tempel), Marktstand und Händler, Sänfte und Träger,
//            Meilenstein, Reichskarte, die Häuserbänder (Rom), die versteckte Gans auf dem Marktstand-Dach.
import * as THREE from 'three';
import { Popup } from '../engine/popup.js';
import { textCard, printLabel, blotches, speckles, roundRect, SERIF } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { lerp, clamp, smooth, TAU, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { sunGlow } from '../engine/effects.js';
import { nahband, fernband } from '../art/rom/s5_bauten.js';
import { createKarte } from '../art/rom/s5_karte.js';
import { canvasTex, child, glowy, puff, fxN, cloneMood, clipGlow } from './_p5_kit.js';
import { MOOD_START, TAG0, moodAt, dawnK, duskK, sunPos, sunTint } from './_p5_licht.js';
import { buildKolosseum, KOL } from './_p5_kolosseum.js';

const IDX = 5;                                                  // Stationsnummer = Index in PAGES_DE / DEFS
const PL = { x0: -5.4, x1: -0.4, z0: -0.4, z1: 3.15 };         // Forum-Platz (links)
const ROAD = { z0: 2.4, z1: 3.1 };                              // Straße vor dem Kolosseum (rechts)
const SANF = { z: 2.72, xa: 3.4, xb: 9.4, speed: 0.46 };       // Sänftenweg
const TAG_SUN_OFF = 0.7;                                        // Mitte der Sonnenscheibe über dem Fuß des Pop-ups

// ---------------------------------------------------------------- Malen: Boden
function paving(ctx, m, x0, x1, z0, z1, { base = '#efe3c3', line = 'rgba(120,90,55,.34)', seed = 3, cell = 0.36, curb = '#b9a173' } = {}) {
  const S = m.S, r = mulberry32(seed);
  const poly = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
  const path = () => { ctx.beginPath(); poly.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(70,40,15,.38)'; ctx.shadowBlur = 0.09 * S; ctx.fillStyle = curb; path(); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(0, 0);
  const ix = 0.06; ctx.beginPath(); [[x0 + ix, z0 + ix], [x1 - ix, z0 + ix], [x1 - ix, z1 - ix], [x0 + ix, z1 - ix]].forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath();
  ctx.fillStyle = base; ctx.fill(); ctx.clip();
  ctx.strokeStyle = line; ctx.lineWidth = 0.016 * S;
  for (let z = z0, row = 0; z < z1; z += cell, row++) {
    ctx.beginPath(); ctx.moveTo(m.x(x0), m.z(z)); ctx.lineTo(m.x(x1), m.z(z)); ctx.stroke();
    for (let x = x0 + (row % 2) * cell * 0.9; x < x1; x += cell * (1.6 + r() * 0.5)) { ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.lineTo(m.x(x), m.z(z + cell)); ctx.stroke(); }
  }
  for (let i = 0; i < 120; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,248,222,.22)' : 'rgba(120,85,45,.12)'; ctx.beginPath(); ctx.arc(m.x(x0 + r() * (x1 - x0)), m.z(z0 + r() * (z1 - z0)), (0.04 + r() * 0.08) * S, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function pavingEllipse(ctx, m, cx, cz, rx, rz, { base = '#f0e5c6', curb = '#b9a173', line = 'rgba(120,90,55,.3)' } = {}) {
  const S = m.S, [X, Y] = m.pt(cx, cz);
  ctx.save(); ctx.shadowColor = 'rgba(70,40,15,.38)'; ctx.shadowBlur = 0.1 * S; ctx.fillStyle = curb; ctx.beginPath(); ctx.ellipse(X, Y, (rx + 0.07) * S, (rz + 0.07) * S, 0, 0, TAU); ctx.fill(); ctx.restore();
  ctx.fillStyle = base; ctx.beginPath(); ctx.ellipse(X, Y, rx * S, rz * S, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(X, Y, rx * S, rz * S, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = line; ctx.lineWidth = 0.014 * S;
  for (let k = 1; k < 5; k++) { const f = k / 5; ctx.beginPath(); ctx.ellipse(X, Y, rx * f * S, rz * f * S, 0, 0, TAU); ctx.stroke(); }
  for (let a = 0; a < TAU; a += TAU / 36) { ctx.beginPath(); ctx.moveTo(X + Math.cos(a) * rx * 0.3 * S, Y + Math.sin(a) * rz * 0.3 * S); ctx.lineTo(X + Math.cos(a) * rx * S, Y + Math.sin(a) * rz * S); ctx.stroke(); }
  ctx.restore();
}
function arenaFloor(ctx, m) {
  const S = m.S, [X, Y] = m.pt(KOL.cx, KOL.cz), a = KOL.arenaA + 0.02, b = KOL.arenaB + 0.02, r = mulberry32(8);
  const g = ctx.createRadialGradient(X, Y, 0, X, Y, a * S); g.addColorStop(0, '#f1dca0'); g.addColorStop(1, '#dcbc7a');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y, a * S, b * S, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.ellipse(X, Y, a * S, b * S, 0, 0, TAU); ctx.clip();
  ctx.strokeStyle = 'rgba(140,100,50,.28)'; ctx.lineWidth = 0.012 * S;
  for (let k = 1; k <= 6; k++) { ctx.beginPath(); ctx.ellipse(X, Y, a * S * (k / 6.5), b * S * (k / 6.5), 0, 0, TAU); ctx.stroke(); }
  for (let i = 0; i < 160; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,245,200,.35)' : 'rgba(120,80,35,.18)'; ctx.beginPath(); ctx.arc(X + (r() - 0.5) * 2 * a * S, Y + (r() - 0.5) * 2 * b * S, (0.015 + r() * 0.03) * S, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---------------------------------------------------------------- Malen: Himmel
function paintClouds(c, bb, seed, n) {
  const g = c.ctx, r = mulberry32(seed); g.save();
  for (let i = 0; i < n; i++) {
    const [X, Y] = c.tf(bb.x0 + bb.w * (0.06 + 0.88 * r()), bb.y0 + bb.h * (0.5 + 0.38 * r())), w = (0.9 + 1.0 * r()) * c.S;
    g.fillStyle = 'rgba(255,255,255,.6)';
    for (let k = 0; k < 5; k++) { g.beginPath(); g.ellipse(X + (k - 2) * w * 0.22, Y + Math.sin(k * 1.7 + i) * 0.04 * c.S, w * 0.3 * (1 - Math.abs(k - 2) * 0.13), w * 0.1, 0, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(120,150,200,.12)'; g.beginPath(); g.ellipse(X, Y + w * 0.07, w * 0.55, w * 0.04, 0, 0, TAU); g.fill();
  }
  g.restore();
}

const SKY_DAY = { stops: [[0, '#4a90cb'], [0.4, '#8cc5e4'], [0.76, '#f4ecc8'], [1, '#fbe3aa']] };
const SKY_DAWN = { stops: [[0, '#6f86c4'], [0.4, '#e6a5b6'], [0.76, '#ffd3a2'], [1, '#ffe7b6']] };
const SKY_DUSK = { stops: [[0, '#2f3260'], [0.34, '#7b4a8c'], [0.64, '#d96f62'], [0.88, '#ff9f4e'], [1, '#ffcb78']] };

export default {
  id: 'hoehepunkt',
  mood: MOOD_START,
  motes: { colors: [[1, 0.92, 0.66], [1, 0.84, 0.58]], size: 0.085, alpha: 0.26, dx: 0.05, dy: 0.04, dz: 0.01, tw: 1.0, density: 0.65 },
  atmo: 'hoehepunkt',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        paper: '#f6ecd2', ground: { back: '#ead9b0', front: '#dcc48e' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 15,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 18, rmin: 0.8, rmax: 2.2, colors: ['rgba(255,244,214,.2)', 'rgba(190,140,80,.08)'], seed: 4 });
          speckles(m, { x0: -11.8, x1: -0.2, z0: -4, z1: 4, n: 260, color: 'rgba(110,70,30,.2)', size: 0.03, seed: 13 });
          paving(ctx, m, PL.x0, PL.x1, PL.z0, PL.z1, { seed: 3 });
          // Stufen zum Forum: drei helle Linien am hinteren Rand
          ctx.strokeStyle = 'rgba(255,250,232,.7)'; ctx.lineWidth = 0.03 * S; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(m.x(PL.x0 + 0.15), m.z(PL.z0 + 0.12 + k * 0.1)); ctx.lineTo(m.x(PL.x1 - 0.15), m.z(PL.z0 + 0.12 + k * 0.1)); ctx.stroke(); }
          printLabel(m, 'Forum Romanum', (PL.x0 + PL.x1) / 2 + 0.3, 2.78, { size: 0.19, color: 'rgba(100,60,20,.6)', italic: true, bold: false });
          textCard(m, { x: -11.4, z: 0.62, w: 5.95, h: 3.2, kicker: d.kicker || d.era, title: d.title, body: d.card, size: 0.275, titleSize: 0.4, sub: d.years });
        },
      },
      R: {
        paper: '#f4e6c6', ground: { back: '#ecdab0', front: '#d8b983' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 16,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.6, rmax: 1.9, colors: ['rgba(255,244,214,.18)', 'rgba(150,100,50,.1)'], seed: 9 });
          speckles(m, { x0: 0.3, x1: 11.8, z0: -4, z1: 4, n: 300, color: 'rgba(110,70,30,.2)', size: 0.03, seed: 14 });
          // Straße vor dem Kolosseum (setzt sich über den Falz nach links fort)
          paving(ctx, m, 0.0, 12.0, ROAD.z0, ROAD.z1, { seed: 21, cell: 0.35, base: '#e6d5ad', curb: '#a98f62' });
          // Platz ums Kolosseum
          pavingEllipse(ctx, m, KOL.cx, KOL.cz, KOL.A + 0.6, KOL.B + 0.45);
          arenaFloor(ctx, m);
          printLabel(m, 'Via Sacra', 10.4, 2.78, { size: 0.16, color: 'rgba(100,60,20,.55)', italic: true, bold: false });
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, stage = app.stage, L = ctx.L, R = ctx.R;
    const S = (ctx.spread.p5 = { lift: 0, sail: 0, tag: TAG0, grenzen: 0, tagDirty: true, mapV: -1, fanfare: false, intro: false, introT: 0, actT: -1, ctl: {}, steps: 0 });
    const cur = cloneMood(MOOD_START);
    const tint = [1, 1, 1];
    const openCard = (id, sfx = ['tapp']) => (hit) => { for (const s of sfx) app.audio.sfx(s); app.openCardById(id, hit && hit.point ? hit.point.x : undefined); };
    const tappable = (pop, fn) => { const ms = pop.fig ? pop.fig.hit : [pop.cut.mesh]; pop.pickMeshes = ms; for (const mm of ms) mm.userData.tap = fn; };
    const lifted = [];                                    // Pop-ups, deren Fußhöhe beim Falten mit absinkt (Sonne, Gans)
    const raise = (pop, y) => { pop.baseY = y; lifted.push(pop); return pop; };

    // ---------------- Himmel (mit Dämmerungs-Schichten), Fernband, Nahband
    const SIDES = [['L', -11.9, -0.1, 0], ['R', 0.1, 11.9, 1]];
    const dawns = [], dusks = [], nears = [];
    for (const [s, x0, x1, k] of SIDES) {
      const c = (x0 + x1) / 2, w = x1 - x0;
      const mk = (fill, deco) => panelPart(-w / 2, w / 2, 4.7, { fill, wave: 0.2, freq: 2.4, phase: 0.5 + k * 1.6, seed: 3 + k, deco });
      const day = mk(SKY_DAY, (cc, bb) => { softLight(cc, bb, { color: 'rgba(255,236,170,.4)', cx: k ? 0.8 : 0.2, cy: 0.3, r: 0.8 }); dither(cc, bb, '#fff', { n: 50, alpha: 0.1, size: 0.04, seed: 5 + k }); paintClouds(cc, bb, 31 + k * 7, 4); });
      const sky = ctx.flat(day, { x: c, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 54, border: 0.04 });
      glowy(sky.cut.material, 0.55);
      const dawn = child(sky, mk(SKY_DAWN, (cc, bb) => softLight(cc, bb, { color: 'rgba(255,190,140,.5)', cx: 0.05, cy: 0.2, r: 0.9 })), { z: 0.012, ppu: 40, border: 0.004, name: 'dawn' + s });
      const dusk = child(sky, mk(SKY_DUSK, (cc, bb) => { softLight(cc, bb, { color: 'rgba(255,120,70,.5)', cx: 0.95, cy: 0.2, r: 0.9 }); const g = cc.ctx, r = mulberry32(21 + k); for (let i = 0; i < 40; i++) { const [X, Y] = cc.tf(bb.x0 + bb.w * r(), bb.y0 + bb.h * (0.62 + 0.38 * r())); g.fillStyle = `rgba(255,250,225,${0.3 + r() * 0.5})`; g.beginPath(); g.arc(X, Y, (0.01 + r() * 0.016) * cc.S, 0, TAU); g.fill(); } }), { z: 0.024, ppu: 40, border: 0.004, name: 'dusk' + s });
      for (const o of [dawn, dusk]) { o.material.transparent = true; o.material.opacity = 0; o.mesh.visible = false; o.material.depthWrite = false; glowy(o.material, 0.55); }
      dawns.push(dawn); dusks.push(dusk);
    }
    yield;
    for (const [s, x0, x1, k] of SIDES) {
      const c = (x0 + x1) / 2, w = x1 - x0;
      ctx.flat(fernband(-w / 2, w / 2, 2.4, { seed: 5 + k * 3, phase: 0.8 + k * 1.9, temples: 3, arches: k === 0 }), { x: c, z: -3.2, lean: -0.03, name: 'far' + s, delay: 0.05, ppu: 58, border: 0.03 });
    }
    for (const [s, x0, x1, k] of SIDES) {
      const c = (x0 + x1) / 2, w = x1 - x0;
      const near = ctx.flat(nahband(-w / 2, w / 2, 1.5, { seed: 11 + k * 5, phase: 0.4 + k * 2.2, tint: k }), { x: c, z: -2.6, name: 'near' + s, delay: 0.08, ppu: 70, border: 0.03, receive: true });
      near.pickMeshes = [near.cut.mesh]; near.cut.mesh.userData.tap = openCard('h_rom', ['tapp']); nears.push(near);
    }
    yield;

    // ---------------- Sonne (wandert mit dem Regler „Tagesablauf“; Fuß hebt sich mit dem Aufstellen)
    const sun = ctx.prop('sun_disc', { x: 3, z: -3.85, h: 1.4, delay: 0.1, cast: false });
    glowy(sun.fig.cuts[0].material, 0.9);
    const glow = sunGlow({ size: 5.6, color: 0xffe6a0, opacity: 0.5 }); glow.position.set(0, TAG_SUN_OFF, -0.06); sun.add(glow);
    { const a = ctx.world(-11.9, 0.04, 0), b = ctx.world(11.9, 4.5, 0); clipGlow(glow, { x0: a.x, x1: b.x, y0: a.y, y1: b.y, fade: 0.45 }); }   // Schein bleibt im Himmel

    // ---------------- Reichskarte (Tafel links hinten) für den Schieber „Reichsgrenzen“
    const K = createKarte({ W: 1100, H: 820 });
    const mapTex = new THREE.CanvasTexture(K.canvas); mapTex.colorSpace = THREE.SRGBColorSpace; mapTex.anisotropy = 4;
    const MW = 4.6, MH = MW * K.aspect;
    const mapPop = new Popup(L, { x: -9.0, z: -0.95, lean: -0.34, delay: 0.12, name: 'karte' }); L.addPopup(mapPop);
    const board = new THREE.Mesh(new THREE.BoxGeometry(MW + 0.2, MH + 0.2, 0.06), new THREE.MeshLambertMaterial({ color: 0xf1e7cf }));
    board.position.set(0, (MH + 0.2) / 2, -0.04); board.castShadow = true;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), new THREE.MeshLambertMaterial({ map: mapTex }));
    face.position.set(0, (MH + 0.2) / 2, 0.0);
    const tapMap = openCard('h_reichskarte', ['tapp']);
    board.userData.tap = tapMap; face.userData.tap = tapMap; mapPop.pickMeshes = [board, face]; mapPop.add(board); mapPop.add(face);
    L.own({ dispose() { mapTex.dispose(); } });
    yield;

    // ---------------- Bauten: Pantheon, Trajanssäule, Tempel, Pinien, Meilenstein
    const pant = ctx.prop('h_pantheon', { x: -4.45, z: -1.5, h: 3.4, delay: 0.14 }); tappable(pant, openCard('h_pantheon', ['tapp', 'chime']));
    const saeule = ctx.prop('h_saeule', { x: -1.55, z: -1.15, h: 4.8, delay: 0.16 }); tappable(saeule, openCard('h_trajanssaeule', ['tapp']));
    const tempel = ctx.prop('h_tempel', { x: 10.35, z: -1.3, h: 2.8, delay: 0.14 }); tappable(tempel, openCard('h_forum', ['tapp']));
    ctx.prop('h_pinie', { x: 1.4, z: -0.55, h: 2.7, delay: 0.2 });
    ctx.prop('h_pinie', { x: 11.35, z: 0.6, h: 2.9, delay: 0.24, facing: -1 });
    const stein = ctx.prop('h_meilenstein', { x: 11.05, z: 1.85, h: 1.6, delay: 0.2 }); tappable(stein, openCard('h_meilenstein', ['tapp', 'thud']));
    // Forum-Platz tippbar
    const forumTap = new THREE.Mesh(new THREE.PlaneGeometry(PL.x1 - PL.x0, PL.z1 - PL.z0), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    forumTap.rotation.x = -Math.PI / 2; forumTap.position.set((PL.x0 + PL.x1) / 2, 0.02, (PL.z0 + PL.z1) / 2); L.add(forumTap); L.addTap(forumTap, openCard('h_forum', ['tapp']));
    yield;

    // ---------------- Marktstand mit Händler und der versteckten Gans
    const stand = ctx.prop('h_marktstand', { x: -3.3, z: 1.0, h: 2.2, delay: 0.2 }); tappable(stand, openCard('h_marktstand', ['tapp', 'muenze']));
    const haendler = ctx.stand('h_haendler', { x: -1.5, z: 1.2, h: 1.62, facing: -1, delay: 0.26, card: 'h_marktstand', name: 'Händler', hint: false });
    haendler.onWake = (a) => { app.audio.sfx('muenze'); a.tw.add(0.5, (t) => { a.hop = Math.sin(t * Math.PI) * 0.12; }, { done: () => { a.hop = 0; } }); };
    const gans = ctx.stand('gans5', { x: -2.55, z: 1.08, y: 2.14, len: 0.9, facing: -1, delay: 0.3, card: 'gans5', hidden: true, hint: false, hitPad: 0.2, name: 'Gans' });
    raise(gans.popup, 2.14);
    ctx.stand('h_buerger', { x: -5.05, z: 0.4, h: 1.72, facing: 1, delay: 0.28, card: null, hint: false, name: 'Bürger' });
    ctx.stand('h_buergerin', { x: -0.75, z: 2.1, h: 1.68, facing: -1, delay: 0.3, card: null, hint: false, name: 'Bürgerin' });
    ctx.stand('h_kind', { x: -2.05, z: 2.25, h: 1.2, facing: 1, delay: 0.32, card: null, hint: false, name: 'Kind' });
    yield;

    // ---------------- Bürgerin und Kind am Meilenstein (rechts)
    ctx.stand('h_buergerin', { x: 9.35, z: 1.45, h: 1.68, facing: 1, delay: 0.3, card: null, hint: false, name: 'Bürgerin' });
    ctx.stand('h_kind', { x: 10.2, z: 1.8, h: 1.2, facing: 1, delay: 0.32, card: null, hint: false, name: 'Kind' });
    // ---------------- Sänfte mit zwei Trägern (laufen langsam hin und her)
    const san = ctx.stand('h_saenfte', { x: SANF.xa, z: SANF.z, len: 3.8, facing: 1, delay: 0.3, card: 'h_saenfte', name: 'Sänfte', hint: true });
    const trA = ctx.stand('h_traeger', { x: SANF.xa - 1.9, z: SANF.z + 0.06, h: 1.75, facing: 1, delay: 0.32, card: 'h_saenfte', name: 'Träger', hint: false });
    const trB = ctx.stand('h_traeger', { x: SANF.xa + 1.9, z: SANF.z + 0.06, h: 1.75, facing: 1, delay: 0.34, card: 'h_saenfte', name: 'Träger', hint: false });
    const walkers = [trA, trB];
    for (const a of [san, trA, trB]) a.onWake = (x) => { app.audio.sfx('tapp'); };
    const SW = { x: SANF.xa, dir: 1, pause: 1.2, dist: 0, last: 0 };
    yield;

    // ---------------- Kolosseum
    const arenaTap = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    arenaTap.rotation.x = -Math.PI / 2; arenaTap.scale.set(KOL.arenaA, KOL.arenaB, 1); arenaTap.position.set(KOL.cx, 0.03, KOL.cz); R.add(arenaTap); R.addTap(arenaTap, openCard('h_arena', ['tapp']));
    const kol = buildKolosseum(ctx, { side: R, onTap: openCard('h_kolosseum', ['tapp', 'menge']) });
    kol.cavea.userData.tap = openCard('h_kolosseum', ['tapp', 'menge']);
    kol.sail.userData.tap = openCard('h_velarium', ['tapp', 'rustle']);
    R.addTap(kol.sail, kol.sail.userData.tap, () => kol.sailG.visible);
    R.addTap(kol.cavea, kol.cavea.userData.tap, () => kol.caveaG.visible);
    S.kol = kol;
    yield;

    // ---------------- Tauben (fliegen über dem Forum)
    const doveCv = (wingUp) => canvasTex(128, 96, (g) => {
      g.translate(64, 52); g.lineJoin = 'round'; g.fillStyle = '#fbf8ee'; g.strokeStyle = '#8a7a62'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(0, 4, 26, 11, 0, 0, TAU); g.fill(); g.stroke();                                  // Körper
      g.beginPath(); g.arc(26, -2, 8.5, 0, TAU); g.fill(); g.stroke();                                           // Kopf
      g.fillStyle = '#e8a050'; g.beginPath(); g.moveTo(33, -3); g.lineTo(43, 0); g.lineTo(33, 2); g.closePath(); g.fill();
      g.fillStyle = '#2a1a10'; g.beginPath(); g.arc(28, -4, 1.8, 0, TAU); g.fill();
      g.fillStyle = '#fbf8ee'; g.beginPath(); g.moveTo(-24, 2); g.lineTo(-44, 10); g.lineTo(-40, -2); g.closePath(); g.fill(); g.stroke();   // Schwanz
      g.fillStyle = '#f1ecdc'; g.beginPath(); if (wingUp) { g.moveTo(-6, -2); g.quadraticCurveTo(-10, -36, 8, -44); g.quadraticCurveTo(14, -24, 12, -2); } else { g.moveTo(-6, 6); g.quadraticCurveTo(-14, 32, 6, 38); g.quadraticCurveTo(16, 22, 12, 6); } g.closePath(); g.fill(); g.stroke();
    });
    const doveTex = [doveCv(true), doveCv(false)];
    const doveMat = doveTex.map((t) => new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, fog: false }));
    const doveGeo = new THREE.PlaneGeometry(0.56, 0.42);
    const doves = [0, 1, 2, 3, 4].map((i) => { const m = new THREE.Mesh(doveGeo, doveMat[0]); m.renderOrder = 8; m.visible = false; L.add(m); return { m, ph: i * 1.31, rx: 2.2 + (i % 3) * 0.5, rz: 0.8 + (i % 2) * 0.35, sp: 0.42 + i * 0.03, y: 3.9 + (i % 3) * 0.35 }; });
    L.own({ dispose() { doveGeo.dispose(); doveTex.forEach((t) => t.dispose()); doveMat.forEach((mm) => mm.dispose()); } });
    yield;

    // ---------------- Steuerungen
    // Lasche „Kolosseum auf!“ (rechts vorn, links beginnend)
    const ctlKol = ctx.control('R', { id: 'kolosseum', label: 'Kolosseum auf!', a: [1.95, 3.6], b: [3.05, 3.6], size: [2.4, 0.95], color: '#b4552d', value: 0, hold: true, ticks: 0 });
    const ctlSegel = ctx.control('R', { id: 'sonnensegel', label: 'Sonnensegel', a: [5.95, 3.6], b: [7.05, 3.6], size: [2.4, 0.95], color: '#b8862d', value: 0, hold: true, ticks: 0 });
    const ctlTag = ctx.control('R', { id: 'tagesablauf', label: 'Tagesablauf', a: [9.45, 3.6], b: [10.5, 3.6], size: [2.2, 0.95], color: '#2f7a96', value: TAG0, hold: true, ticks: 0 });
    const ctlMap = ctx.control('L', { id: 'reichsgrenzen', label: 'Reichsgrenzen', a: [-3.85, 3.6], b: [-2.05, 3.6], size: [2.5, 0.95], color: '#8b2a4a', value: 0, hold: true, ticks: 8 });
    S.ctl = { kol: ctlKol, segel: ctlSegel, tag: ctlTag, grenzen: ctlMap };
    for (const c of [ctlKol, ctlSegel, ctlTag, ctlMap]) { c.onGrab = () => app.audio.sfx('grab'); c.onTick = (v) => app.audio.sfx('slide', { v }); c.onRelease = () => app.audio.sfx('snap'); }

    ctlKol.on((v) => {
      S.lift = clamp(v); kol.setLift(S.lift);
      if (S.lift > 0.97 && !S.fanfare) { S.fanfare = true; if (S.actT >= 0) { app.audio.sfx('fanfare'); app.audio.sfx('thud'); if (!app.calm) glints(); } }
      if (S.lift < 0.5) S.fanfare = false;
      const st = Math.floor(S.lift * 3 + 0.02); if (st !== S.steps) { if (S.actT >= 0) app.audio.sfx('pop'); S.steps = st; }
    });
    ctlSegel.on((v) => { S.sail = clamp(v); kol.setSail(S.sail); });
    ctlTag.on((v) => { S.tag = clamp(v); S.tagDirty = true; });
    ctlMap.on((v) => { S.grenzen = clamp(v); });
    const glints = () => {
      const n = fxN(app, 10);
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU, w = ctx.world(KOL.cx + Math.cos(a) * (KOL.A - 0.2), 3.9, KOL.cz + Math.sin(a) * (KOL.B - 0.2)); app.fx.glow.emit({ x: w.x, y: w.y, z: w.z, vx: Math.cos(a) * 0.35, vy: 0.5 + Math.random() * 0.4, vz: Math.sin(a) * 0.2, life: 1.3 + Math.random() * 0.8, size: 0.14, alpha: 0.9, color: [1, 0.86, 0.45], drag: 1.2 }); }
    };

    // Faden vom Sonnensegel zum Griff
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), new THREE.MeshBasicMaterial({ color: 0x6f4a28 }));
    rope.visible = false; rope.frustumCulled = false; R.add(rope);
    const P0 = new THREE.Vector3(), P1 = new THREE.Vector3(), DIR = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);

    // ---------------- Einsatz je Bild
    const tmpW = new THREE.Vector3();
    ctx.onUpdate((dt, t) => {
      const act = ctx.spread.active;
      if (act && S.actT < 0) { S.actT = t; }
      if (!act) S.actT = -1;
      // Wandstücke, Volumen, Faden
      kol.update();
      const kEff = kol.state.kEff;
      if (kEff > 0.9) {
        kol.ropeTop(P0); const hp = ctlSegel.handle.position; P1.set(hp.x - 0.15 + (S.sail * 0.0), 0.14, hp.z - 0.5);
        DIR.subVectors(P1, P0); const len = Math.max(0.01, DIR.length()); rope.position.copy(P0).addScaledVector(DIR, 0.5); rope.scale.set(1, len, 1); rope.quaternion.setFromUnitVectors(UP, DIR.multiplyScalar(1 / len)); rope.visible = true;
      } else rope.visible = false;
      // Fuß erhöhter Pop-ups sinkt beim Falten mit
      for (const p of lifted) p.group.position.y = p.baseY * Math.min(1, p.eff);
      // Intro: das Kolosseum fährt beim Aufschlagen von selbst nach oben
      if (S.intro) {
        if (ctlKol.dragging) S.intro = false;
        else { S.introT += dt; const k = clamp((S.introT - 1.0) / 3.4); ctlKol.setValue(smooth(k), { snap: true }); if (k >= 1) S.intro = false; }
      }
      // Sonne, Himmel und Licht (nur auf der aktiven Seite)
      const u = S.tag, sp = sunPos(u); sunTint(u, tint);
      const sy = (sp.y - TAG_SUN_OFF); sun.group.position.x = sp.x;
      sun.group.position.y = (S.tagDirty || true) ? sy * Math.min(1, sun.eff) : 0;
      for (const c of sun.fig.cuts) c.material.color.setRGB(tint[0], tint[1], tint[2]);
      glow.userData.update(t, lerp(1, 0.9, Math.abs(u - 0.5) * 2));
      for (const ch of glow.children) ch.material.color.setRGB(1, lerp(0.9, 0.58, Math.pow(Math.abs(u - 0.5) * 2, 1.5)), lerp(0.62, 0.3, Math.pow(Math.abs(u - 0.5) * 2, 1.5)));
      if (S.tagDirty) {
        S.tagDirty = false;
        const dk = dusks[0] && duskK(u), dw = dawnK(u);
        for (const d of dawns) { d.material.opacity = dw; d.mesh.visible = dw > 0.01; }
        for (const d of dusks) { d.material.opacity = dk; d.mesh.visible = dk > 0.01; }
        if (act) { moodAt(u, cur); stage.setMood(cur); }
      }
      if (!act) return;
      // Sänfte: Weg hin und her, Beine schwingen
      if (kEff > 0.5) {
        if (SW.pause > 0) { SW.pause -= dt; } else {
          const dx = SANF.speed * dt * SW.dir; SW.x += dx; SW.dist += Math.abs(dx);
          if (SW.x > SANF.xb) { SW.x = SANF.xb; SW.dir = -1; SW.pause = 2.2; } else if (SW.x < SANF.xa) { SW.x = SANF.xa; SW.dir = 1; SW.pause = 2.2; }
        }
      }
      const walking = SW.pause <= 0;
      if (san.dir !== SW.dir) { san.setFacing(SW.dir); trA.setFacing(SW.dir); trB.setFacing(SW.dir); }
      san.popup.group.position.x = SW.x;
      trA.popup.group.position.x = SW.x - 1.9 * SW.dir; trB.popup.group.position.x = SW.x + 1.9 * SW.dir;
      walkers.forEach((a, i) => {
        const ph = SW.dist * 5.2 + i * Math.PI;
        if (walking) { a.fig.rotatePart('legA', Math.sin(ph) * 0.36); a.fig.rotatePart('legB', -Math.sin(ph) * 0.36); a.hop = Math.abs(Math.sin(ph)) * 0.04; } else { a.fig.rotatePart('legA', 0); a.fig.rotatePart('legB', 0); a.hop = 0; }
      });
      san.hop = walking ? Math.abs(Math.sin(SW.dist * 5.2)) * 0.04 : 0;
      if (walking && !app.calm) {
        SW.step = (SW.step || 0) - dt;
        if (SW.step <= 0) { SW.step = 0.62; app.audio.sfx('footstep'); if (S.steps >= 0) { tmpW.copy(ctx.world(SW.x - 1.9 * SW.dir, 0, SANF.z + 0.2)); puff(app, tmpW, fxN(app, 1), { alpha: 0.22, size: 0.2 }); } }
      }
      // Reichskarte zeichnen, wenn sich der Schieber bewegt
      if (Math.abs(S.grenzen - S.mapV) > 0.004 || (S.grenzen !== S.mapV && (S.grenzen < 0.002 || S.grenzen > 0.998))) {
        S.mapV = S.grenzen; K.draw(S.grenzen); mapTex.needsUpdate = true;
        if (S.grenzen > 0.985 && !S.mapDone) { S.mapDone = true; app.audio.sfx('chime'); } if (S.grenzen < 0.5) S.mapDone = false;
      }
      // Tauben
      const dv = !app.calm && L.scrub() > 0.98;
      for (const d of doves) {
        const a = t * d.sp + d.ph, x = -2.9 + Math.cos(a) * d.rx, z = 0.5 + Math.sin(a) * d.rz, flapOn = Math.sin(t * 0.9 + d.ph * 2) > -0.2;
        d.m.visible = dv; if (!dv) continue;
        d.m.position.set(x, d.y + Math.sin(t * 1.3 + d.ph) * 0.18, z);
        d.m.scale.x = Math.sin(a + Math.PI / 2) > 0 ? -1 : 1;                                   // schaut in Flugrichtung
        d.m.material = doveMat[flapOn && Math.sin(t * 9 + d.ph) > 0 ? 0 : 1];
      }
    });
    S.reset = () => { SW.x = SANF.xa; SW.dir = 1; SW.pause = 1.2; SW.dist = 0; };
    S.cur = cur; S.kolMeta = KOL; S.karte = K; S.sw = SW;
  },

  onActivate(ctx) {
    const S = ctx.spread.p5; if (!S) return;
    const app = ctx.app;
    S.actT = -1; S.fanfare = false; S.steps = 0; S.mapV = -1; S.mapDone = false; S.tagDirty = true;
    S.reset && S.reset();
    S.intro = !app.calm; S.introT = 0;
    if (app.calm) S.ctl.kol.setValue(1, { snap: true });
    if (S.kol) S.kol.setLift(S.ctl.kol.sp.x);
    S.hornT = setTimeout(() => { if (ctx.spread.active && !app.calm) app.audio.sfx('flap'); }, 2500);
  },
  onDeactivate(ctx) {
    const S = ctx.spread.p5; if (!S) return;
    S.intro = false; clearTimeout(S.hornT);
    const d = { kol: 0, segel: 0, tag: TAG0, grenzen: 0 };
    for (const k of Object.keys(d)) S.ctl[k].setValue(d[k], { snap: true });
    for (const s of [ctx.L, ctx.R]) for (const a of s.actors) a.tw.clear();
    S.mapV = -1; S.tagDirty = true;
  },
};
