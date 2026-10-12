// Station 8 „Römer am Rhein und was bleibt“ (1. bis 5. Jh. n. Chr.): Rheinlandschaft im Morgendunst mit Limes, Wachturm, Kastell und Hafen;
// auf der linken Seite die Schlussseite „Was bleibt“ mit acht Steintafeln (Wörter aus dem Lateinischen) und der Karte „Römer bei uns“.
// Lasche „Wachturm“ (Signalfeuer), Schieber „Rheinschiff“ (Handelsschiff flussabwärts), Regler „Zeit“ (Kastell → Ruine → Stadt von heute).
// Antippbar: Köln, Xanten, Wachturm, Kastell (je Zeitstufe), Rhein/Limes, Schiff, Händler, Inschriftenstein, Konstantin, 395, 476, Wald, Karte (+ Orte), acht Tafeln, Gans.
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, blotches, speckles, grassTufts, pebbles, roundRect, SERIF, RED, INK } from '../engine/pagepaint.js';
import { PAGES_DE, CARDS_DE } from '../data/pages.de.js';
import { lerp, clamp, smooth, TAU, mulberry32, easeOutBack } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { TAFELN, flapCanvas } from '../art/rom/s8_tafel.js';
import { fxRate, canvasTex, softPlane, paintMist, waveStripPart, treelinePoly, fadeable, setFade, makeFire, ramp } from './_p8_kit.js';
import { ROAD_R, ROAD_L, MAP, PINS, mapToPage, riverC, riverW, paintRoadLeft, paintRiverRight, paintMap } from './_p8_paint.js';

const TOTAL_GEESE = Math.max(8, Object.keys(CARDS_DE).filter((k) => CARDS_DE[k].hidden).length);

// ---------------------------------------------------------------- Geometrie
const TAB = { z: -1.08, x0: -10.7, dx: 1.36, len: 1.2 };                  // Steintafeln (Mitte der ersten, Abstand, Breite)
const FLAP = { w: 0.9, h: 0.52, y: 0.03 };                                  // Lasche unter der Tafel (Welt-Einheiten)
const SHIP = { x0: 2.9, x1: 8.35, z: 0.55, len: 3.3 };                     // Handelsschiff: Start, Ziel, Fahrrinne, Länge
const KAS = { x: 6.9, z: -2.45, len: 4.2 };                                 // Kastell in drei Zeitstufen
const TOWER = { x: 3.7, z: -1.95, h: 3.6 };                                 // Wachturm
const TOWER2 = { x: 1.45, z: -2.7, h: 2.2 };                                // zweiter Turm in Sichtweite
const HAFEN = { x: 10.3, z: -0.55, len: 3.0 };                              // Hafen mit Kran

// ---------------------------------------------------------------- Hilfen
function flapMesh(fw, fh, texIn, texOut) {
  const g = new THREE.Group(), d = 0.026;
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshLambertMaterial({ map: texIn }));
  inner.rotation.x = -Math.PI / 2; inner.position.set(0, d / 2, fh / 2);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(fw, fh), new THREE.MeshLambertMaterial({ map: texOut }));
  outer.rotation.x = Math.PI / 2; outer.position.set(0, -d / 2, fh / 2);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(fw, d, fh), new THREE.MeshLambertMaterial({ color: 0xcfc8b4 }));
  rim.position.set(0, 0, fh / 2); rim.scale.set(0.998, 0.94, 0.998);
  inner.castShadow = true; outer.castShadow = true; inner.receiveShadow = true;
  g.add(inner, outer, rim);
  return { group: g, inner, outer, rim };
}
const texOf = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

// Hügelkette (sehr fern, im Dunst) in die Himmelswand malen
function paintRidge(c, bb, base, amp, col, seed) {
  const { ctx, tf } = c; const r = mulberry32(seed); const ph = [r() * 6, r() * 6, r() * 6];
  ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(...tf(bb.x0, 0));
  for (let i = 0; i <= 80; i++) { const t = i / 80, x = bb.x0 + bb.w * t; ctx.lineTo(...tf(x, base + amp * (0.55 * Math.sin(t * 7 + ph[0]) + 0.3 * Math.sin(t * 17 + ph[1]) + 0.15 * Math.sin(t * 31 + ph[2])))); }
  ctx.lineTo(...tf(bb.x1, 0)); ctx.closePath(); ctx.fill(); ctx.restore();
}

export default {
  id: 'rhein',
  mood: mood({ key: '#dfe9f0', keyI: 2.1, sky: '#e8f0f2', gnd: '#6a7f70', hemiI: 1.9, pos: [-12, 20, 10], rim: 0.12 }),
  motes: { colors: [[0.86, 0.93, 1], [0.8, 0.9, 0.96]], size: 0.08, alpha: 0.28, dx: 0.05, dy: 0.03, dz: 0.01, tw: 0.8, density: 0.6 },
  atmo: 'rhein',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    const d = PAGES_DE[8];
    return {
      L: {
        paper: '#edf0e8', ground: { back: '#aebcaa', front: '#8fa88a' }, margin: 0.3, pageNo: 17, seed: 17,
        draw(ctx, m) {
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 20, rmin: 0.8, rmax: 2.2, colors: ['rgba(235,245,240,.22)', 'rgba(70,110,90,.09)'], seed: 4 });
          speckles(m, { x0: -11.8, x1: -0.3, z0: -4, z1: 4, n: 300, color: 'rgba(40,70,50,.2)', size: 0.03, seed: 13 });
          grassTufts(m, { x0: -11.7, x1: -0.5, z0: -3.8, z1: -2.2, n: 12, color: '#7a9a6a', h: 0.22, seed: 5, blades: 4, alpha: 0.6 });
          grassTufts(m, { x0: -11.7, x1: -0.5, z0: 0.0, z1: 3.9, n: 10, color: '#7a9a6a', h: 0.22, seed: 8, blades: 4, alpha: 0.5 });
          paintRoadLeft(ctx, m);
          pebbles(m, { x0: -11.5, x1: -0.6, z0: 0.0, z1: 3.9, n: 8, seed: 7, colors: ['#b7ae98', '#a39a84', '#cdc6ae'] });
          paintMap(ctx, m);
          textCard(m, { x: -11.5, z: 0.4, w: 6.0, h: 3.6, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.262, titleSize: 0.4 });
        },
      },
      R: {
        paper: '#edf0e8', ground: { back: '#9fb09c', front: '#86a082' }, margin: 0.3, pageNo: 18, seed: 18,
        draw(ctx, m) {
          blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.6, rmax: 1.9, colors: ['rgba(235,245,240,.2)', 'rgba(60,100,80,.1)'], seed: 9 });
          speckles(m, { x0: 0.3, x1: 11.8, z0: -4, z1: 4, n: 340, color: 'rgba(40,70,50,.2)', size: 0.03, seed: 14 });
          grassTufts(m, { x0: 0.4, x1: 11.6, z0: -3.8, z1: -2.3, n: 14, color: '#6f9262', h: 0.22, seed: 5, blades: 4, alpha: 0.6 });
          paintRiverRight(ctx, m);
          grassTufts(m, { x0: 0.5, x1: 11.6, z0: 1.9, z1: 3.1, n: 22, color: '#7d9d6c', h: 0.24, seed: 6, blades: 4, alpha: 0.6 });
          pebbles(m, { x0: 0.5, x1: 11.6, z0: 2.0, z1: 3.9, n: 10, seed: 7, colors: ['#b7ae98', '#a39a84', '#cdc6ae'] });
          // beschriftete Stufen des Reglers „Zeit“ (hinter dem Schlitz)
          for (const [t, x] of [['Römerzeit', 8.9], ['Ruine', 9.9], ['heute', 10.9]]) printLabel(m, t, x, 2.88, { size: 0.15, color: 'rgba(40,60,50,.75)', italic: true, bold: false });
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const T = (ctx.spread.p8 = { fire1: 0, fire2: 0, shipV: 0, timeV: 0, zeitState: 0, opened: new Set(), allOpenDone: false, geese: null, foundN: -1, shipDist: 0, spark: 0, smoke: 0 });
    const rand = mulberry32(8);
    const openCard = (id) => { app.audio.sfx('tapp'); app.openCardById(id); };
    const tapMeshes = (meshes, fn) => { for (const m of meshes) m.userData.tap = fn; };
    const tapProp = (pop, id) => { const ms = pop.fig.cuts.map((c) => c.mesh); pop.pickMeshes = ms; tapMeshes(ms, () => openCard(id)); return pop; };
    const anchorOf = (pop, k) => { const a = pop.fig.anchors[k]; return new THREE.Vector3(a.x + pop.fig.group.position.x, a.y, 0.05); };

    // ---------------- Himmel (Dunst), ferne Hügel im Papier
    for (const [s, cx] of [['L', -5.975], ['R', 5.975]]) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-5.775, 5.775, 5.0, {
        fill: { stops: [[0, '#8fa8ba'], [0.42, '#c3d4dc'], [0.78, '#e6eeec'], [1, '#f2f0e4']], dir: 'v' }, wave: 0.2, freq: 2.4, phase: 0.6 + k * 1.7, seed: 3 + k,
        deco: (c, bb) => {
          softLight(c, bb, { color: 'rgba(255,247,222,.6)', cx: s === 'L' ? 0.88 : 0.3, cy: 0.3, r: 0.85 });
          if (s === 'R') { const [X, Y] = c.tf(bb.x0 + bb.w * 0.3, 3.55); c.ctx.fillStyle = 'rgba(255,252,238,.55)'; c.ctx.beginPath(); c.ctx.arc(X, Y, 0.42 * c.S, 0, TAU); c.ctx.fill(); }
          paintRidge(c, bb, 2.5, 0.35, 'rgba(160,184,196,.55)', 3 + k); paintRidge(c, bb, 1.95, 0.3, 'rgba(132,160,172,.6)', 9 + k);
          dither(c, bb, '#fff', { n: 50, alpha: 0.12, size: 0.04, seed: 5 + k });
        },
      }), { x: cx, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 56, border: 0.04 });
    }
    yield;

    // ---------------- dunkler Wald (tippbar), Köln und Xanten als Papierschnitt-Städte
    for (const [s, cx] of [['L', -5.975], ['R', 5.975]]) {
      const k = s === 'L' ? 0 : 1;
      const pop = ctx.flat({ layers: [{ shapes: [treelinePoly(-5.775, 5.775, 0, 2.5, { seed: 11 + k * 5, tooth: 0.75, base: 0.46 })], fill: { top: '#3c6050', bottom: '#233f35' }, deco: (c, bb) => { dither(c, bb, '#bfe0c8', { n: 70, alpha: 0.1, size: 0.04, seed: 4 + k }); dither(c, bb, '#0d2820', { n: 90, alpha: 0.18, seed: 6 + k }); const { ctx: g, tf } = c; const gr = g.createLinearGradient(...tf(0, bb.y1), ...tf(0, bb.y0 + bb.h * 0.2)); gr.addColorStop(0, 'rgba(210,225,230,.45)'); gr.addColorStop(1, 'rgba(210,225,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H); } }] },
        { x: cx, z: -3.45, name: 'wald' + s, delay: 0.06, ppu: 66, border: 0.03 });
      pop.pickMeshes = [pop.cut.mesh]; pop.cut.mesh.userData.tap = () => openCard('wald');
    }
    const koeln = tapProp(ctx.prop('s8_koeln_r', { x: -6.1, z: -2.95, len: 7.2, delay: 0.1 }), 'koeln');
    const xanten = tapProp(ctx.prop('s8_xanten_r', { x: 9.95, z: -2.95, len: 4.0, delay: 0.1 }), 'xanten');
    yield;

    // ---------------- Kastell in drei Zeitstufen (Regler „Zeit“)
    const kast = ['s8_kastell_roem', 's8_kastell_ruine', 's8_kastell_heute'].map((id, i) => {
      const pop = ctx.prop(id, { x: KAS.x, z: KAS.z + i * 0.012, len: KAS.len, delay: 0.14 + i * 0.01 });
      fadeable(pop); return pop;
    });
    const KAS_CARD = ['zeit_kastell', 'zeit_ruine', 'zeit_heute'];
    kast.forEach((pop, i) => { const ms = pop.fig.cuts.map((c) => c.mesh); pop.pickMeshes = ms; tapMeshes(ms, () => openCard(KAS_CARD[T.zeitState])); });
    // Bildunterschrift auf dem Boden (ändert sich mit der Zeit)
    const capCv = document.createElement('canvas'); capCv.width = 768; capCv.height = 144; const cg = capCv.getContext('2d');
    const capTex = new THREE.CanvasTexture(capCv); capTex.colorSpace = THREE.SRGBColorSpace; capTex.anisotropy = 4;
    const CAPS = ['Römerzeit: das Kastell', 'Später: eine Ruine', 'Heute: eine Stadt am Rhein'];
    const drawCap = (st) => {
      cg.clearRect(0, 0, 768, 144);
      cg.save(); cg.fillStyle = 'rgba(248,244,228,.94)'; roundRect(cg, 6, 8, 756, 128, 28); cg.fill(); cg.strokeStyle = 'rgba(79,125,106,.9)'; cg.lineWidth = 6; roundRect(cg, 6, 8, 756, 128, 28); cg.stroke(); cg.restore();
      cg.textAlign = 'center'; cg.textBaseline = 'middle'; cg.fillStyle = '#2f4a3e'; cg.font = `bold 52px ${SERIF}`; cg.fillText(CAPS[st], 384, 76); capTex.needsUpdate = true;
    };
    drawCap(0);
    const cap = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.47), new THREE.MeshBasicMaterial({ map: capTex, transparent: true, depthWrite: false }));
    cap.rotation.x = -Math.PI / 2; cap.position.set(KAS.x, 0.016, -0.86); R.add(cap);
    yield;

    // ---------------- Wachtürme mit Signalfeuer
    const tower = tapProp(ctx.prop('s8_wachturm', { x: TOWER.x, z: TOWER.z, h: TOWER.h, delay: 0.18 }), 'wachturm');
    const tower2 = tapProp(ctx.prop('s8_wachturm', { x: TOWER2.x, z: TOWER2.z, h: TOWER2.h, delay: 0.2 }), 'wachturm');
    const fa = anchorOf(tower, 'fire'), fb = anchorOf(tower2, 'fire');
    const fire1 = makeFire(tower, fa.x, fa.y, 0.06, { size: 0.55 });
    const fire2 = makeFire(tower2, fb.x, fb.y, 0.06, { size: 0.36 });
    yield;

    // ---------------- Hafen, Händler und Römer im friedlichen Austausch
    const hafen = ctx.prop('s8_hafen', { x: HAFEN.x, z: HAFEN.z, len: HAFEN.len, delay: 0.22 });
    hafen.pickMeshes = hafen.fig.cuts.map((c) => c.mesh); tapMeshes(hafen.pickMeshes, () => openCard('schiff'));
    const quayY = 0.49 * hafen.fig.ws;
    const qx = HAFEN.x + 0.45;
    const haendler = ctx.stand('p_germane', { x: qx + 0.5, z: HAFEN.z + 0.1, y: quayY, h: 1.1, facing: -1, delay: 0.3, card: 'haendler', id: 'haendler', name: 'Germanischer Händler', hint: false, variant: { far: null, near: 'basket', sword: false, tunic: { color: '#6f8a5a' } } });
    const roemer = ctx.stand('p_legionaer', { x: qx - 0.35, z: HAFEN.z + 0.1, y: quayY, h: 1.1, facing: 1, delay: 0.3, card: 'haendler', id: 'roemer-kai', name: 'Römischer Soldat', hint: false, variant: { far: null, near: 'tablet' } });
    yield;

    // ---------------- Handelsschiff mit Steuermann, Wasserstreifen davor
    const ship = ctx.prop('s8_schiff', { x: SHIP.x0, z: SHIP.z, len: SHIP.len, delay: 0.3 });
    ship.pickMeshes = ship.fig.cuts.map((c) => c.mesh); tapMeshes(ship.pickMeshes, () => openCard('schiff'));
    const sws = ship.fig.ws, helmA = anchorOf(ship, 'helm');
    const steer = ctx.stand('p_handwerker', { x: SHIP.x0 + helmA.x, z: SHIP.z - 0.03, y: 0.1, h: 0.92, facing: 1, delay: 0.34, card: 'schiff', id: 'steuermann', name: 'Steuermann', hint: false, variant: { near: 'staff', hat: 'cap' } });
    const wstrip = (w, h, ph, sd, c0, c1, z, x, nm, dl) => ctx.flat(waveStripPart(w, h, { top: c0, bottom: c1, wave: 0.06, freq: w / 1.5, phase: ph, seed: sd, scallop: true, step: 0.09, lines: true, foam: true, glint: '#d8f0f2', foamCol: '#f2fbff' }), { x, z, name: nm, delay: dl, ppu: 66, border: 0.02, thickness: 0.015 });
    wstrip(10.6, 0.26, 0.4, 3, '#86aebd', '#4e7e93', SHIP.z + 0.15, 6.0, 'wv1', 0.4);
    wstrip(10.2, 0.2, 1.7, 5, '#9bbfcc', '#6a97a8', SHIP.z + 0.62, 6.2, 'wv2', 0.42);
    // der Rhein selbst ist tippbar (Limes: die „nasse Grenze“)
    const riverHit = new THREE.Mesh(new THREE.PlaneGeometry(11.4, 2.2), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    riverHit.rotation.x = -Math.PI / 2; riverHit.position.set(6.4, 0.014, 0.55); R.add(riverHit); R.addTap(riverHit, () => openCard('limes'));
    yield;

    // ---------------- Meilensteine am Weg: 313, 395, 476
    const konst = tapProp(ctx.prop('s8_konstantin', { x: 1.15, z: -0.9, h: 1.85, delay: 0.26 }), 'konstantin');
    const m395 = tapProp(ctx.prop('s8_meilenstein', { x: 2.05, z: -0.85, h: 1.0, variant: { year: '395' }, delay: 0.28 }), 'teilung395');
    const m476 = tapProp(ctx.prop('s8_meilenstein', { x: 2.7, z: -0.85, h: 1.0, variant: { year: '476' }, delay: 0.3 }), 'ende476');
    const stein = tapProp(ctx.prop('s8_inschrift', { x: 5.15, z: -0.95, h: 1.0, delay: 0.3 }), 'inschrift');
    yield;

    // ---------------- Bäume, Schilf, Gans am Ufer
    ctx.prop('s8_baum', { x: 0.75, z: -1.1, h: 2.5, delay: 0.3, variant: { seed: 2 } });
    ctx.prop('s8_baum', { x: 11.35, z: 2.45, h: 1.8, delay: 0.32, variant: { seed: 5, tone: 0.5 } });
    ctx.prop('s8_baum', { x: -10.95, z: -2.4, h: 2.6, delay: 0.32, variant: { seed: 7, tone: 0.3 } });
    ctx.prop('bush', { x: 4.6, z: 2.35, len: 1.2, delay: 0.34 });
    ctx.prop('reeds', { x: 1.0, z: 1.95, h: 1.0, delay: 0.34, variant: { seed: 3 } });
    ctx.prop('reeds', { x: 3.45, z: 2.85, h: 1.0, delay: 0.36, variant: { seed: 5 } });
    const gans = ctx.stand('gans8', { x: 2.95, z: 2.3, len: 0.8, facing: 1, delay: 0.5, hidden: true, hint: false, hitPad: 0.25, card: 'gans8', name: 'Gans' });
    ctx.prop('bush', { x: 2.7, z: 2.72, len: 1.5, delay: 0.38, variant: { seed: 4 } });
    yield;

    // ---------------- Dunst (zwei Schichten rechts, eine links)
    const mist = [
      softPlane(ctx, { x: 6.0, z: -1.2, y: 0.0, w: 11.8, h: 1.6, res: 26, draw: (g, W, H) => paintMist(g, W, H, { color: [226, 238, 244], alpha: 0.7, seed: 3, blobs: 8 }), opacity: 0.38, delay: 0.3, name: 'mist' }),
      softPlane(ctx, { x: -6.0, z: -2.5, y: 0.1, w: 11.8, h: 1.8, res: 24, draw: (g, W, H) => paintMist(g, W, H, { color: [226, 238, 244], alpha: 0.7, seed: 8, blobs: 8 }), opacity: 0.4, delay: 0.3, name: 'mist' }),
      softPlane(ctx, { x: 6.0, z: 1.15, y: 0.0, w: 11.8, h: 0.8, res: 24, draw: (g, W, H) => paintMist(g, W, H, { color: [230, 242, 246], alpha: 0.6, seed: 5, blobs: 7 }), opacity: 0.3, delay: 0.34, name: 'mist2' }),
    ].map((m, i) => Object.assign(m, { bx: i === 1 ? -6.0 : 6.0, ph: i * 2.1 }));
    yield;

    // ---------------- Schlussseite: acht Steintafeln mit Lasche „Woher?“
    const tabs = TAFELN.map((t, i) => {
      const tx = TAB.x0 + i * TAB.dx;
      const pop = ctx.prop('s8_tafel', { x: tx, z: TAB.z, len: TAB.len, variant: { k: t.k }, delay: 0.12 + i * 0.03 });
      const gx = pop.fig.group.position.x;
      const fl = flapMesh(FLAP.w, FLAP.h, texOf(flapCanvas(t.k, true)), texOf(flapCanvas(t.k, false)));
      const hinge = new THREE.Group(); hinge.position.set(gx, FLAP.y, 0.034); hinge.add(fl.group); hinge.rotation.x = -1.53; pop.add(hinge);
      const it = { t, i, pop, hinge, fl, open: 0, target: 0 };
      const slab = pop.fig.cuts[0].mesh;
      const toggleFlap = () => { if (it.target) { it.target = 0; app.audio.sfx('flapClose'); } else openIt(); };
      const openIt = () => {
        it.target = 1; app.audio.sfx('flapOpen');
        setTimeout(() => { if (ctx.spread.active) app.openCardById(t.card); }, 450);
        T.opened.add(t.k);
      };
      pop.pickMeshes = [slab, fl.inner, fl.outer, fl.rim];
      slab.userData.tap = () => { if (!it.target) openIt(); else openCard(t.card); };
      fl.outer.userData.tap = () => { if (!it.target) openIt(); };
      fl.rim.userData.tap = toggleFlap;
      fl.inner.userData.tap = toggleFlap;
      return it;
    });
    T.tabs = tabs;
    yield;

    // ---------------- Karte „Römer bei uns“ (antippen: Karte, Orte einzeln)
    const mw = MAP.x1 - MAP.x0, mh = MAP.z1 - MAP.z0, mcx = (MAP.x0 + MAP.x1) / 2, mcz = (MAP.z0 + MAP.z1) / 2;
    const mapHit = new THREE.Mesh(new THREE.PlaneGeometry(mw, mh), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    mapHit.rotation.x = -Math.PI / 2; mapHit.position.set(mcx, 0.02, mcz); L.add(mapHit);
    L.addTap(mapHit, (hit) => {
      const px = hit.point.x - app.book.group.position.x, pz = hit.point.z - app.book.group.position.z;
      let best = null, bd = 0.55;
      for (const p of Object.values(PINS)) { const [x, z] = mapToPage(p.u, p.v); const dd = Math.hypot(px - x, pz - z); if (dd < bd) { bd = dd; best = p; } }
      openCard(best ? best.card : 'roemer_bei_uns');
    });
    const [rx, rz] = mapToPage(PINS.werthausen.u, PINS.werthausen.v);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0xc0392b, transparent: true, opacity: 0.6, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.88, 1, 36), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.set(rx, 0.03, rz); ring.renderOrder = 4; L.add(ring);
    yield;

    // ---------------- Steuerungen
    const ctlFire = ctx.control('R', { id: 'wachturm', label: 'Wachturm', a: [1.25, 3.62], b: [3.25, 3.62], size: [1.65, 0.86], color: '#a8452c', value: 0, springBack: false, hold: true, ticks: 4 });
    const ctlShip = ctx.control('R', { id: 'rheinschiff', label: 'Rheinschiff', a: [5.1, 3.62], b: [7.1, 3.62], size: [1.65, 0.86], color: '#2f6f8f', value: 0, springBack: false, hold: true, ticks: 10 });
    const ctlTime = ctx.control('R', { id: 'zeit', label: 'Zeit', a: [8.9, 3.62], b: [10.9, 3.62], size: [1.5, 0.86], color: '#4f7d6a', value: 0, springBack: false, hold: true, ticks: 2 });
    T.ctlFire = ctlFire; T.ctlShip = ctlShip; T.ctlTime = ctlTime;

    // Lasche „Wachturm“: Feuer am ersten Turm, dann am zweiten, zuletzt das Horn
    let horn = false;
    ctlFire.on((v) => {
      T.fire1 = smooth(ramp(v, 0.06, 0.34)); T.fire2 = smooth(ramp(v, 0.5, 0.78));
      if (v > 0.92 && !horn) { horn = true; app.audio.sfx('cornu'); }
      if (v < 0.5) horn = false;
    });
    let lit1 = false;
    ctlFire.onGrab = () => app.audio.sfx('grab'); ctlFire.onTick = (v) => { app.audio.sfx('slide', { v }); if (v > 0.1 && !lit1) { lit1 = true; app.audio.sfx('feuer'); } if (v < 0.05) lit1 = false; }; ctlFire.onRelease = () => app.audio.sfx('snap');

    // Schieber „Rheinschiff“
    const shipPos = (v) => lerp(SHIP.x0, SHIP.x1, v);
    ctlShip.on((v) => { T.shipV = clamp(v); });
    ctlShip.onGrab = () => app.audio.sfx('grab'); ctlShip.onTick = (v) => { app.audio.sfx('ruder', { v }); }; ctlShip.onRelease = (v) => { app.audio.sfx('snap'); if (v > 0.97) { app.audio.sfx('seil'); app.audio.sfx('kran'); } };

    // Regler „Zeit“: Kastell → Ruine → Stadt von heute (überblenden)
    const applyTime = (v) => {
      T.timeV = v;
      const a = 1 - smooth(ramp(v, 0.14, 0.44)), c = smooth(ramp(v, 0.56, 0.86)), b = Math.max(0, 1 - a - c);
      const op = [a, b, c];
      kast.forEach((pop, i) => { setFade(pop, op[i]); });
      let dom = 0; if (op[1] > op[dom]) dom = 1; if (op[2] > op[dom]) dom = 2;
      if (dom !== T.zeitState) { T.zeitState = dom; drawCap(dom); kast.forEach((pop, i) => pop.fig.setCast(i === dom)); }
      app.audio.ctl('timeLapse', ctlTime.dragging ? 0.5 : 0);
    };
    ctlTime.on((v) => applyTime(clamp(v)));
    ctlTime.onGrab = () => app.audio.sfx('grab'); ctlTime.onTick = (v) => app.audio.sfx('tick', { fast: true }); ctlTime.onRelease = () => { app.audio.sfx('snap'); app.audio.ctl('timeLapse', 0); };
    kast.forEach((pop, i) => pop.fig.setCast(i === 0));
    applyTime(0);

    // ---------------- Überraschungen
    const spawnGeese = () => {
      if (T.geese) return;
      T.geese = [];
      for (let i = 0; i < 8; i++) {
        const a = ctx.stand('gans' + (i + 1), { x: -10.2 + i * 1.3, z: 0.14, len: 0.62, facing: i % 2 ? -1 : 1, card: null, hint: false, hitPad: 0.1, name: 'Gans' });
        a.popup.snap(1); a.fig.group.scale.setScalar(0.0001); a.t0 = app.t + i * 0.18; a.phase = i * 1.3; T.geese.push(a);
      }
      app.audio.sfx('fanfare'); app.audio.sfx('chime');
    };
    const sparkle = (n) => {
      const r = fxRate(app); if (r <= 0) return;
      for (const it of tabs) { const w = ctx.world(it.pop.group.position.x, 1.9, TAB.z); app.fx.glow.burst(Math.max(2, Math.round(n * r / 8)), { x: w.x, y: w.y, z: w.z, life: 1.4, size: 0.12, alpha: 0.9, color: [1, 0.9, 0.5], grav: -0.1, drag: 1 }, { speed: 0.9, up: 0.6, px: 0.9 }); }
    };

    // ---------------- Update je Bild
    const tmpA = new THREE.Vector3();
    let sparkT = 0, smokeT = 0, lastShipX = shipPos(0);
    ctx.onUpdate((dt, t) => {
      const act = ctx.spread.active, calm = app.calm, rate = fxRate(app);
      // Dunst driftet langsam
      for (const m of mist) m.pop.group.position.x = m.bx + (calm ? 0.1 : 0.35) * Math.sin(t * 0.06 + m.ph);
      // Feuer
      fire1.update(t, T.fire1, calm); fire2.update(t, T.fire2, calm + 0);
      if (act && rate > 0 && !calm) {
        sparkT -= dt; smokeT -= dt;
        for (const [pop, fx, k, big] of [[tower, fa, T.fire1, 1], [tower2, fb, T.fire2, 0.6]]) {
          if (k > 0.25 && sparkT <= 0) {
            const w = ctx.world(pop.group.position.x + fx.x, fx.y + 0.2 * big, pop.group.position.z + 0.08);
            app.fx.glow.emit({ x: w.x + (rand() - 0.5) * 0.12, y: w.y, z: w.z, vx: (rand() - 0.5) * 0.3, vy: 0.45 + rand() * 0.5, vz: 0, life: 0.9, size: 0.06 * big + 0.02, alpha: 0.85, color: [1, 0.72, 0.3], drag: 0.6, grav: 0.2 });
          }
          if (k > 0.4 && smokeT <= 0) {
            const w = ctx.world(pop.group.position.x + fx.x, fx.y + 0.5 * big, pop.group.position.z + 0.05);
            app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0.08 + rand() * 0.06, vy: 0.3, vz: 0, life: 2.6, size: 0.18 * big + 0.06, alpha: 0.2, color: [0.72, 0.74, 0.78], drag: 0.4, grow: 0.12 });
          }
        }
        if (sparkT <= 0) sparkT = 0.11 / Math.max(0.4, rate); if (smokeT <= 0) smokeT = 0.5 / Math.max(0.4, rate);
      }
      // Schiff: Position aus dem Schieber, Wippen, Ruder, Steuermann fährt mit
      const sx = shipPos(T.shipV), moved = sx - lastShipX; lastShipX = sx;
      T.shipDist += Math.abs(moved);
      const bob = (calm ? 0.012 : 0.026) * Math.sin(t * 1.7), pitch = (calm ? 0.004 : 0.011) * Math.sin(t * 1.3 + 1);
      ship.group.position.x = sx; ship.fig.root.position.y = bob + 0.01; ship.fig.root.rotation.z = pitch;
            for (let k = 1; k <= 4; k++) ship.fig.rotatePart('oar' + k, Math.sin(T.shipDist * 9 + k * 0.8) * 0.23 + 0.05);
      steer.popup.group.position.x = sx + helmA.x; steer.popup.group.position.y = 0.1 + bob;
      if (act && rate > 0 && Math.abs(moved) > 0.0015 && rand() < 0.5 * rate) { const w = ctx.world(sx + SHIP.len * 0.46, 0.06, SHIP.z + 0.22); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0.05, vy: 0.25, vz: 0.1, life: 0.7, size: 0.11, alpha: 0.7, color: [0.92, 0.98, 1], grav: 1.5 }); }
      // Tafeln: Laschen klappen mit Feder
      for (const it of tabs) {
        it.open += (it.target - it.open) * (1 - Math.exp(-dt * 7));
        it.hinge.rotation.x = lerp(-1.53, 0.0, clamp(it.open));
      }
      if (!T.allOpenDone && T.opened.size >= TAFELN.length && act) {
        T.allOpenDone = true; setTimeout(() => { if (!ctx.spread.active) return; sparkle(40); app.audio.sfx('chime'); app.audio.silence && app.audio.silence(2.5); setTimeout(() => app.audio.sfx('musicbox'), 1200); }, 900);
      }
      // Pulsierender Ring am Ort „Duisburg · Moers“
      const pk = (t * 0.7) % 1; ring.scale.setScalar(0.08 + pk * 0.3); ringMat.opacity = (1 - pk) * (calm ? 0.35 : 0.65); ring.visible = act;
      // Gänse-Zähler: Überraschung, wenn alle acht gefunden sind
      const n = app.found ? app.found.size : 0;
      if (n !== T.foundN) { T.foundN = n; if (n >= TOTAL_GEESE && act) spawnGeese(); }
      if (T.geese) for (const a of T.geese) {
        const s = easeOutBack(clamp((t - a.t0) / 0.7)); a.fig.group.scale.setScalar(Math.max(0.0001, s));
        a.hop = Math.max(0, Math.sin(t * 3.2 + a.phase)) * (calm ? 0.02 : 0.08);
      }
    });
    T.sparkle = sparkle; T.spawnGeese = spawnGeese;
  },

  onActivate(ctx) {
    const T = ctx.spread.p8, app = ctx.app;
    if (T && T.geese === null && app.found && app.found.size >= TOTAL_GEESE) setTimeout(() => ctx.spread.active && T.spawnGeese && T.spawnGeese(), 1800);
  },
  onDeactivate(ctx) {
    const T = ctx.spread.p8; if (!T) return;
    for (const it of T.tabs || []) it.target = 0;
  },
};
