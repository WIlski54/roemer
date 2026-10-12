// Station 7: Einschlag – „Der Tag, an dem der Himmel brannte“
// Szene: links Abendlandschaft mit Vulkanen und Tieren, rechts Himmel mit Asteroid, Krater-Fläche, Klappe „Spurensuche“, Höhle des Purgatorius.
// Ablauf per Lasche „METEOR!“ (zeitgesteuert über Simulationszeit, nie setTimeout): siehe Zeitplan T_* und die Schlüsselbilder ROWS.
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, SERIF, INK, roundRect, pebbles, grassTufts, blotches } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { poseAmt, paperCard, Popup } from '../engine/popup.js';
import { softTexture } from '../engine/effects.js';
import { lerp, clamp, smooth, TAU, easeOutBack, easeOutCubic, mulberry32 } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { volume } from '../art/paint.js';
import { strataCanvas, flapFaceCanvas, craterTexture, streakTexture, makeRingMaterial, makeSkyOverlayMaterial, overlayMesh, denBackPart, denLipPart, signPart, LENS_UV } from './_p7kit.js';

const IDX = 7;

// ---------------------------------------------------------------- Lichtstimmungen
const MOODS = {
  dusk: mood({ key: '#ffb27a', keyI: 2.15, sky: '#e9b2bc', gnd: '#6a4458', hemiI: 1.55, pos: [-15, 9.5, 8], rim: 0.55 }),
  glut: mood({ key: '#ff6a2c', keyI: 1.9, sky: '#d4583c', gnd: '#4a1c1c', hemiI: 1.25, pos: [-9, 8, 7], rim: 1.0 }),
  ash: mood({ key: '#a9a5b6', keyI: 1.05, sky: '#8c8898', gnd: '#3e3844', hemiI: 1.15, pos: [-5, 15, 7], rim: 0 }),
  dawn0: mood({ key: '#c9c4d8', keyI: 1.3, sky: '#a8aac4', gnd: '#5b5262', hemiI: 1.3, pos: [4, 13, 8], rim: 0 }),
  dawn: mood({ key: '#ffd7c0', keyI: 1.85, sky: '#c4cdea', gnd: '#7c6a80', hemiI: 1.6, pos: [12, 12, 8], rim: 0.25 }),
};

// ---------------------------------------------------------------- Zeitplan (Sekunden seit Auslösen)
const TRIG = 0.85;          // Lasche über diesem Wert löst den Ablauf aus
const PRE_P = 0.30;         // Weg des Asteroiden, den die Lasche vor dem Auslösen schon zeigt
const T_FLY0 = 1.3;         // Asteroid beschleunigt
const T_MET0 = 3.3;         // großer Meteor fliegt vor dem Buch ein (Bildschirmraum), Einschlag bei T_IMP
const T_WHOOSH = 3.2;
const T_IMP = 5.6;          // Einschlag
const T_ROAR = 4.3;
const T_ASH = 7.8;          // Stimmung: Aschegrau
const T_SIL = 9.8;          // Stille
const T_TINN = 10.5;
const T_DAWN0 = 12.4;
const T_TWEET = 14.5;       // Licht kehrt zurück, erster Vogelruf
const T_DAWN = 14.4;
const T_CAP = 14.8;         // Bildunterschrift + Schild
const T_LOOK = 17.4;        // letzte Schlüsselzeit
const T_DONE = 20.8;        // Vögel gelandet, Ablauf zu Ende

// Weg des Asteroiden (Seitenkoordinaten, rechte Seite): von oben rechts zur Einschlagstelle
const A0 = [9.9, 3.0, -3.9], B0 = [3.7, 0.0, -0.9];
const IX = 3.7, IZ = -0.9;  // Einschlagstelle
const AST_H = 1.6;

// Schlüsselbilder des „Looks“: [t, Overlay-α, Himmel oben rgb, Mitte rgb, unten rgb, Kulissen-Tönung rgb, Silhouette, Staub, Krater, Vulkanglut]
const RED = [[0.30, 0.04, 0.14], [0.70, 0.13, 0.10], [1.0, 0.46, 0.12]];
const RED2 = [[0.24, 0.03, 0.09], [0.58, 0.09, 0.07], [0.95, 0.30, 0.06]];
const ASH = [[0.27, 0.26, 0.31], [0.40, 0.38, 0.42], [0.58, 0.51, 0.50]];
const ASH2 = [[0.31, 0.31, 0.36], [0.45, 0.43, 0.47], [0.64, 0.58, 0.56]];
const DAWN = [[0.50, 0.58, 0.86], [0.84, 0.78, 0.92], [1.0, 0.85, 0.78]];
const row = (t, a, c, tint, sil, dust, crater, volc, haze) => [t, a, ...c[0], ...c[1], ...c[2], ...tint, sil, dust, crater, volc, ...haze];
const ROWS = [
  row(0, 0.18, RED, [1, 0.93, 0.88], 0, 0, 0, 0.6, [0.5, 0.2, 0.1, 0]),
  row(3.6, 0.30, RED, [1, 0.9, 0.82], 0, 0, 0, 0.7, [0.6, 0.2, 0.1, 0.04]),
  row(T_IMP, 0.34, RED, [1, 0.9, 0.82], 0, 0, 0, 0.8, [0.6, 0.2, 0.1, 0.06]),
  row(6.5, 0.90, RED2, [1, 0.5, 0.4], 0.15, 0.35, 1, 1, [0.62, 0.14, 0.08, 0.34]),
  row(7.8, 0.93, RED2, [0.9, 0.4, 0.32], 0.6, 0.8, 1, 1, [0.5, 0.2, 0.16, 0.45]),
  row(9.4, 0.95, ASH, [0.66, 0.54, 0.54], 1, 1, 1, 0.85, [0.36, 0.33, 0.38, 0.62]),
  row(10.6, 0.96, ASH, [0.54, 0.5, 0.54], 1, 1, 1, 0.55, [0.37, 0.35, 0.40, 0.7]),
  row(12.8, 0.96, ASH2, [0.56, 0.53, 0.58], 1, 0.9, 1, 0.45, [0.40, 0.38, 0.44, 0.7]),
  row(16.0, 0.86, DAWN, [0.72, 0.74, 0.88], 1, 0.12, 1, 0.4, [0.62, 0.64, 0.80, 0.4]),
  row(T_LOOK, 0.86, DAWN, [0.72, 0.74, 0.88], 1, 0, 1, 0.35, [0.62, 0.64, 0.80, 0.4]),
];
const NP = ROWS[0].length - 1;
const K_A = 0, K_TOP = 1, K_MID = 4, K_BOT = 7, K_TINT = 10, K_SIL = 13, K_DUST = 14, K_CRATER = 15, K_VOLC = 16, K_HAZE = 17;

// gemeinsame, wiederverwendete Objekte (keine Allokationen pro Bild)
const EM = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, life: 1, size: 0.1, alpha: 1, color: null, drag: 0, grav: 0, grow: 0 };
const C_FIRE = [1, 0.62, 0.2], C_HOT = [1, 0.86, 0.5], C_SMOKE = [0.3, 0.2, 0.19], C_DUST = [0.5, 0.33, 0.27], C_ASH = [0.62, 0.6, 0.62], C_EMBER = [1, 0.55, 0.18];
const rnd = mulberry32(7007);
const SIL = [0.1, 0.075, 0.13];

// weiches Leuchten als Fläche (liegt parallel zum Pop-up, kein Anschneiden durch Wand/Boden wie bei Sprites); depthTest false nur für den Einschlagsblitz
function glowSprite(color, size, opacity, depthTest = true) {
  const m = new THREE.MeshBasicMaterial({ map: softTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, depthTest });
  const g = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); g.scale.set(size, size, 1); g.renderOrder = 4; return g;
}

// ---------------------------------------------------------------- Seite
export default {
  id: 'einschlag',
  mood: MOODS.dusk,
  motes: { colors: [[1, 0.55, 0.22], [1, 0.8, 0.5], [0.82, 0.78, 0.8], [0.7, 0.66, 0.7]], size: 0.07, alpha: 0.55, dy: 0.16, dx: 0.14, tw: 1.8, density: 0.8 },
  atmo: 'einschlag',
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        ground: { back: '#a1966a', front: '#8a8250' }, margin: 0.3, pageNo: 15, seed: 71,
        draw(ctx, m) {
          blotches(m, { x0: -11.8, x1: -0.2, z0: -4.1, z1: 4.2, n: 38, rmin: 0.6, rmax: 2.0, colors: ['rgba(255,150,90,.13)', 'rgba(90,50,120,.11)', 'rgba(70,95,45,.12)'], seed: 31 });
          grassTufts(m, { x0: -11.3, x1: -0.7, z0: -2.2, z1: 3.9, n: 14, seed: 33, color: '#6c7f3b', h: 0.3 });
          pebbles(m, { x0: -11, x1: -1, z0: -0.4, z1: 3.6, n: 10, seed: 35, colors: ['#9a8a86', '#867a80', '#b0a090'] });
          textCard(m, { x: -11.5, z: -0.1, w: 6.0, h: 4.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.29, titleSize: 0.42 });
        },
      },
      R: {
        ground: { back: '#a08e74', front: '#8b7a58' }, margin: 0.3, pageNo: 16, seed: 72,
        draw(ctx, m) {
          blotches(m, { x0: 0.2, x1: 11.8, z0: -4.1, z1: 4.2, n: 38, rmin: 0.6, rmax: 2.0, colors: ['rgba(255,150,90,.13)', 'rgba(90,50,120,.11)', 'rgba(70,95,45,.10)'], seed: 37 });
          grassTufts(m, { x0: 0.8, x1: 11.2, z0: -2.2, z1: 3.8, n: 12, seed: 39, color: '#6c7f3b', h: 0.3 });
          pebbles(m, { x0: 1, x1: 11, z0: -0.4, z1: 3.4, n: 10, seed: 41, colors: ['#9a8a86', '#867a80', '#b0a090'] });
          // schwach gedruckte Zielmarke an der späteren Einschlagstelle
          ctx.save(); ctx.strokeStyle = 'rgba(120,40,40,.28)'; ctx.lineWidth = 0.035 * m.S; ctx.setLineDash([0.16 * m.S, 0.14 * m.S]);
          ctx.beginPath(); ctx.ellipse(m.x(IX), m.z(IZ), 1.35 * m.S, 0.95 * m.S, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(m.x(IX - 0.25), m.z(IZ)); ctx.lineTo(m.x(IX + 0.25), m.z(IZ)); ctx.moveTo(m.x(IX), m.z(IZ - 0.2)); ctx.lineTo(m.x(IX), m.z(IZ + 0.2)); ctx.stroke(); ctx.restore();
          // Gesteinsfolge unter der Klappe
          ctx.save(); ctx.drawImage(strataCanvas(), m.x(8.5), m.z(2.2), 2.7 * m.S, 1.75 * m.S); ctx.restore();
          ctx.strokeStyle = 'rgba(60,30,10,.7)'; ctx.lineWidth = 0.04 * m.S; roundRect(ctx, m.x(8.5), m.z(2.2), 2.7 * m.S, 1.75 * m.S, 0.12 * m.S); ctx.stroke();
        },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app, spread = ctx.spread, L = ctx.L, R = ctx.R, audio = app.audio, fx = app.fx;
    const scen = [], volM = [], sil = [];            // Materialgruppen: Kulissen, Vulkane, Silhouetten-Tiere
    const regS = (pop, arr = scen) => { if (pop.cut) arr.push(pop.cut.material); else if (pop.fig) for (const c of pop.fig.cuts) arr.push(c.material); return pop; };
    const ac = (n, v) => { if (audio.ctl) audio.ctl(n, v); };
    const sfx = (n, o) => { if (audio.sfx) audio.sfx(n, o); };

    // ============================================================ Kulissenebenen
    const skyCuts = [], hillCuts = [];
    const mkHaze = () => new THREE.MeshBasicMaterial({ color: 0x808080, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    const hazeFar = mkHaze(), hazeNear = mkHaze();
    const skyDeco = (side) => (c, bb) => {
      const { ctx: g, tf, S, rng } = c;
      softLight(c, bb, { color: 'rgba(255,176,104,.66)', cx: side === 'L' ? 0.88 : 0.16, cy: 0.04, r: 0.95 });
      for (let i = 0; i < 8; i++) { // lange Wolkenbänder
        const [X, Y] = tf(bb.x0 + rng() * bb.w, bb.y0 + bb.h * (0.2 + rng() * 0.62)), w = 1.2 + rng() * 2.6;
        g.fillStyle = i % 2 ? 'rgba(255,150,130,.30)' : 'rgba(70,40,110,.32)';
        g.beginPath(); g.ellipse(X, Y, w * 0.5 * S, (0.07 + rng() * 0.05) * S, 0, 0, TAU); g.fill();
      }
      g.fillStyle = 'rgba(255,245,230,.85)'; // erste Sterne
      for (let i = 0; i < 40; i++) { const [X, Y] = tf(bb.x0 + rng() * bb.w, bb.y0 + bb.h * (0.62 + rng() * 0.38)); g.beginPath(); g.arc(X, Y, Math.max(1, 0.012 * S * (0.5 + rng())), 0, TAU); g.fill(); }
    };
    for (const s of ['L', 'R']) {
      const cx = s === 'L' ? -6 : 6;
      const sky = regS(ctx.flat(panelPart(-5.8, 5.8, 5.0, { fill: { stops: [[0, '#2f2b68'], [0.42, '#7a4a86'], [0.74, '#e0786c'], [1, '#ffc07e']] }, wave: 0.3, freq: 3.2, phase: s === 'L' ? 0.5 : 2.1, seed: s === 'L' ? 2 : 5, deco: skyDeco(s) }), { x: cx, z: -4.05, lean: -0.05, name: 'sky' + s, delay: 0, ppu: 70, border: 0.04 }));
      skyCuts.push(sky.cut);
      hillCuts.push(regS(ctx.flat(panelPart(-5.8, 5.8, 2.7, { fill: { top: '#69487f', bottom: '#8c5a84' }, wave: 0.55, freq: s === 'L' ? 3.3 : 2.7, step: 0.2, phase: s === 'L' ? 1.0 : 3.3, seed: 8, deco: (c, bb) => { volume(c, bb, { dark: 'rgba(30,10,50,.35)', light: 'rgba(255,190,160,.25)' }); dither(c, bb, '#2a1240', { n: 140, alpha: 0.16 }); } }), { x: cx, z: -3.2, lean: -0.03, name: 'far' + s, delay: 0.05, ppu: 70 })).cut);
      hillCuts.push(regS(ctx.flat(panelPart(-5.8, 5.8, 1.1, { fill: { top: '#7a8056', bottom: '#586244' }, wave: 0.3, freq: 5, phase: s === 'L' ? 0.2 : 1.6, seed: 3, deco: (c, bb) => { dither(c, bb, '#2c3a1c', { n: 100, alpha: 0.22 }); dither(c, bb, '#ffc890', { n: 40, alpha: 0.2, size: 0.03 }); } }), { x: cx, z: -2.25, name: 'near' + s, delay: 0.1, ppu: 80 })).cut);
    }
    // Rot-/Grau-/Morgen-Overlay über den Himmelswänden (Farben als Uniforms)
    const skyMat = makeSkyOverlayMaterial(), overlays = [];
    for (const cut of skyCuts) { const o = overlayMesh(cut, skyMat); cut.mesh.add(o); overlays.push(o); }
    const hazes = [];
    hillCuts.forEach((cut, i) => { const o = new THREE.Mesh(cut.mesh.geometry, i % 2 ? hazeNear : hazeFar); o.position.z = 0.006; o.renderOrder = 1; o.visible = false; cut.mesh.add(o); hazes.push(o); });
    yield;

    // ============================================================ links: Vulkane (Dekkan-Trappen), Bäume, Wolken
    const vols = [
      regS(ctx.prop('volcano', { x: -8.7, z: -3.55, h: 5.3, delay: 0.1 }), volM),
      regS(ctx.prop('volcano', { x: -3.7, z: -3.7, h: 4.4, delay: 0.12, facing: -1, variant: { seed: 2 } }), volM),
    ];
    const vGlow = [];
    for (const v of vols) {
      const a = v.fig.anchors.crater, sp = glowSprite(0xff7a2a, v.fig.ws * 8, 0.5);
      sp.position.set(a.x, a.y, 0.12); v.fig.root.add(sp); vGlow.push(sp);
    }
    const cloudL = regS(ctx.prop('cloud_a', { x: -2.4, y: 3.5, z: -3.9, len: 3.0, delay: 0.2, cast: false, variant: { tone: 'dark' } }));
    const cloudR = regS(ctx.prop('cloud_b', { x: 4.6, y: 3.8, z: -3.9, len: 2.6, delay: 0.24, cast: false, variant: { tone: 'dark' } }));
    const sway = [];
    const swy = (pop, k = 1) => { pop.swK = k; sway.push(pop); return pop; };
    swy(regS(ctx.prop('conifer_round', { x: -11.0, z: -1.9, h: 3.9, delay: 0.2 })), 0.7);
    swy(regS(ctx.prop('magnolia', { x: -5.7, z: -2.5, h: 3.1, delay: 0.22, facing: -1 })), 1);
    swy(regS(ctx.prop('conifer_round', { x: -7.9, z: -2.95, h: 3.0, delay: 0.24, variant: { seed: 2 } })), 0.8);
    swy(regS(ctx.prop('fern_ground', { x: -9.3, z: -0.55, len: 1.5, delay: 0.3 })), 1.6);
    swy(regS(ctx.prop('fern_ground', { x: -1.5, z: 0.4, len: 1.5, delay: 0.3, facing: -1, variant: { seed: 2 } })), 1.6);
    yield;

    // ============================================================ links: Tiere (später Silhouetten)
    const rex = ctx.stand('trex', { x: -3.5, z: -1.0, len: 5.0, facing: 1, delay: 0.34 });
    const tri = ctx.stand('triceratops', { x: -7.4, z: -1.5, len: 4.4, facing: 1, delay: 0.38 });
    const ank = ctx.stand('ankylosaurus', { x: -10.3, z: -0.7, len: 3.2, facing: 1, delay: 0.42 });
    const dinos = [rex, tri, ank];
    for (const a of dinos) sil.push(...a.mats);
    rex.behaviors.push((dt, t) => { if (rex.tw.list.length === 0) poseAmt(rex.fig, 'jaw', S.roar); });
    tri.behaviors.push((dt, t) => { if (tri.tw.list.length === 0) poseAmt(tri.fig, 'head', 0.25 + 0.2 * Math.sin(t * 0.5 + 1) + S.fear * 0.6); });
    ank.behaviors.push((dt, t) => { if (ank.tw.list.length === 0) poseAmt(ank.fig, 'tail', 0.5 + 0.5 * Math.sin(t * 0.7) * (1 - S.fear * 0.8)); });
    rex.onWake = (a) => { a.tw.add(1.0, (k) => { poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); a.hop = Math.sin(k * Math.PI) * 0.1; }, { done: () => { a.hop = 0; } }); audio.voice('trex'); };
    tri.onWake = (a) => { a.tw.add(1.2, (k) => { poseAmt(a.fig, 'head', Math.sin(k * Math.PI)); a.hop = Math.sin(k * Math.PI) * 0.08; }, { done: () => { a.hop = 0; } }); audio.voice('triceratops'); };
    ank.onWake = (a) => { a.tw.add(1.2, (k) => { poseAmt(a.fig, 'tail', 0.5 + 0.5 * Math.sin(k * 9) * (1 - k)); a.hop = Math.sin(k * Math.PI) * 0.06; }, { done: () => { a.hop = 0; } }); audio.voice('ankylosaurus'); };
    yield;

    // ============================================================ rechts: Asteroid, Felsen, Bäume
    const astPop = ctx.prop('asteroid', { x: A0[0], y: A0[1], z: A0[2], h: AST_H, delay: 0.3, cast: false });
    const astGlow = glowSprite(0xff7a2a, 3.0, 0.3); astGlow.position.set(0, AST_H / 2, 0.08); astPop.add(astGlow);
    const streakG = new THREE.Group(), streakTex = streakTexture();
    const streak = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.8), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    streak.renderOrder = 3; streakG.add(streak); streakG.position.set(0, AST_H / 2, 0.05);
    streakG.rotation.z = Math.atan2(B0[1] - A0[1], B0[0] - A0[0]); astPop.add(streakG);
    const pillar = regS(ctx.prop('rock_pillar', { x: 9.9, z: -2.55, h: 3.3, delay: 0.14 }));
    const mag = swy(regS(ctx.prop('magnolia', { x: 11.0, z: -1.2, h: 3.3, delay: 0.2, facing: -1 })), 1);
    const boulder = regS(ctx.prop('boulder', { x: 6.9, z: -1.7, len: 1.5, delay: 0.24 }));
    regS(ctx.prop('bush', { x: 1.5, z: -1.9, len: 1.8, delay: 0.26 }));
    regS(ctx.prop('bush', { x: 10.2, z: 0.5, len: 1.5, delay: 0.3, facing: -1 }));
    swy(regS(ctx.prop('horsetail', { x: 6.1, z: 1.0, h: 1.3, delay: 0.3 })), 1.6);
    swy(regS(ctx.prop('cycad', { x: 1.9, z: 0.9, h: 1.2, delay: 0.32, facing: -1 })), 1.4);
    yield;

    // ============================================================ rechts: Höhle des Purgatorius (schwer, aber fair)
    const DX = 8.1, DZ = -0.5;
    const denBack = regS(ctx.flat(denBackPart(), { x: DX, z: DZ - 0.22, ws: 1.15, name: 'denBack', delay: 0.3, ppu: 150 }));
    const purg = ctx.stand('purgatorius', { x: DX + 0.06, z: DZ - 0.05, y: -0.18, len: 1.0, facing: 1, delay: 0.36, hidden: true, hint: false, hitPad: 0.25 });
    const denLip = regS(ctx.flat(denLipPart(), { x: DX, z: DZ + 0.22, ws: 1.1, name: 'denLip', delay: 0.4, ppu: 150 }));
    purg.cover = denLip;
    for (const m of purg.mats) m.color.setRGB(0.3, 0.26, 0.34);
    const eyeA = purg.fig.anchors.eye;
    const eyeGlint = glowSprite(0xfff0c8, 0.22, 0); eyeGlint.position.set(eyeA.x, eyeA.y, 0.07); purg.fig.root.add(eyeGlint);
    purg.onWake = (a) => {
      a.tw.add(0.9, (k) => { a.hop = Math.sin(k * Math.PI) * 0.55; poseAmt(a.fig, 'jaw', Math.sin(k * Math.PI)); poseAmt(a.fig, 'tail', Math.sin(k * 8) * 0.5 + 0.5); }, { done: () => { a.hop = 0; } });
      audio.voice('purgatorius');
    };
    yield;

    // ============================================================ rechts: Krater-Fläche, Druckwellen, Einschlagsglut, Staubwolken
    const craterMat = new THREE.MeshBasicMaterial({ map: craterTexture(), transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const crater = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 4.6), craterMat);
    crater.rotation.x = -Math.PI / 2; crater.position.set(IX, 0.02, IZ); crater.scale.set(1, 0.8, 1); crater.renderOrder = 1; crater.visible = false; R.add(crater);
    const hitSite = new THREE.Mesh(new THREE.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hitSite.rotation.x = -Math.PI / 2; hitSite.position.set(IX, 0.05, IZ); hitSite.scale.set(1, 0.75, 1); R.add(hitSite);
    R.addTap(hitSite, () => { if (!S.locked) app.openCardById('chicxulub', IX); }, () => !S.locked);
    const rings = [];
    for (const [side, cx] of [[L, -6], [R, 6]]) {
      const mat = makeRingMaterial(), m = new THREE.Mesh(new THREE.PlaneGeometry(12, 8.5), mat);
      m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.03, 0); m.renderOrder = 2; m.visible = false; side.add(m);
      mat.uniforms.uC.value.set(IX - cx, -IZ); rings.push(m);
    }
    const impactGlow = glowSprite(0xffa850, 6, 0, false); impactGlow.position.set(IX, 0.5, IZ + 0.6); impactGlow.renderOrder = 5; R.add(impactGlow);
    // Staubsäulen: dunkle Wolken-Papierschnitte, die aus der Einschlagstelle wachsen
    const dustDefs = [[3.6, -0.5, 5.6, 'cloud_b', 0.0, 0.3], [3.5, -0.9, 2.6, 'cloud_a', 0.15, 1.5], [3.7, -1.2, 2.4, 'cloud_b', 0.30, 2.7], [3.6, -1.6, 5.4, 'cloud_a', 0.45, 3.7], [1.6, -0.2, 3.2, 'cloud_b', 0.25, 0.5], [5.7, -0.8, 3.4, 'cloud_a', 0.35, 0.8]];
    const dustClouds = dustDefs.map(([x, z, len, id, d0, rise], i) => {
      const p = regS(ctx.prop(id, { x, z, len, delay: 0.45 + i * 0.02, cast: false, variant: { tone: 'dark', seed: i + 1 } }));
      for (const c of p.fig.cuts) { c.material.transparent = true; c.material.opacity = 0; }
      p.fig.group.visible = false; p.d0 = d0; p.rise = rise; p.bx = x; return p;
    });
    yield;

    // Morgensonne: geht beim Zurückkehren des Lichts hinter den Hügeln auf (Sprites in einem Pop-up, falten mit der Seite)
    const sunPop = new Popup(R, { x: 9.6, z: -3.8, y: 1.0, delay: 0.5, name: 'dawnsun' }); R.addPopup(sunPop);
    const sunHalo = glowSprite(0xffd9a8, 7.5, 0), sunCore = glowSprite(0xfff3dc, 2.6, 0); sunPop.add(sunHalo); sunPop.add(sunCore);

    // ============================================================ Vögel (Überlebende) und Schild
    const signX = 6.3, signZ = 1.3;
    const signPop = ctx.flat(signPart(), { x: signX, z: signZ, name: 'sign', delay: 0.5, ppu: 100 });
    signPop.cut.mesh.visible = false; signPop.group.scale.setScalar(0.001);
    signPop.cut.mesh.userData.tap = () => { if (!S.locked && S.signK > 0.9) app.openCardById('ueberlebende', signX); };
    const perchOf = (pop, dx = 0, dy = -0.1) => { const f = pop.fig, a = f.anchors.top; return [pop.group.position.x + f.group.position.x + a.x * f.facing + dx, pop.group.position.y + a.y + dy, pop.group.position.z + 0.12]; };
    const pPil = perchOf(pillar), pMag = perchOf(mag, -0.2, -0.45);
    const birdDefs = [
      { side: R, perch: [pPil[0] - 0.2, pPil[1], pPil[2]], c: [8.4, 4.3, -2.0], rx: 1.5, ry: 0.55, w: 1.5, ph: 0.0, ret: true, ex: [16, 7.5] },
      { side: R, perch: [pPil[0] + 0.25, pPil[1] - 0.05, pPil[2]], c: [9.6, 4.6, -2.0], rx: 1.1, ry: 0.5, w: -1.7, ph: 2.0, ret: true, ex: [16, 6.5] },
      { side: R, perch: [boulder.group.position.x + 0.1, 0.78, -1.5], c: [7.0, 4.0, -1.8], rx: 1.7, ry: 0.5, w: 1.3, ph: 3.5, ex: [16, 6.8] },
      { side: R, perch: [pMag[0], pMag[1], pMag[2]], c: [10.6, 4.9, -1.5], rx: 1.0, ry: 0.4, w: -1.6, ph: 1.2, ex: [16.5, 7.4] },
      { side: L, perch: [-10.9, 3.65, -1.7], c: [-9.6, 4.6, -1.9], rx: 1.4, ry: 0.5, w: 1.4, ph: 5.0, ex: [-16, 7.0] },
      { side: L, perch: [-6.9, 2.95, -2.9], c: [-7.0, 4.5, -2.2], rx: 1.2, ry: 0.45, w: -1.5, ph: 0.8, ex: [-16, 6.4] },
    ];
    const birds = birdDefs.map((d, i) => {
      const a = ctx.stand('bird_fly', { x: d.perch[0], y: d.perch[1], z: d.perch[2], len: 0.62, facing: i % 2 ? -1 : 1, delay: 0.55 + i * 0.02, card: null, hint: false, hitPad: 0.4 });
      a.dir = i % 2 ? -1 : 1; a.bd = d; a.idx = i;
      d.idx = i; d.up = 0.4 + i * 0.2; d.land = 3.7 + i * 0.12; d.out = T_TWEET + i * 0.26; d.enter = d.out + 3.0; d.fph = i * 1.7; d.enter0x = i === 0 ? 2.4 : 10.6;
      d.sx = signX + (i === 0 ? -0.95 : 0.95); d.sy = 2.05; d.sz = signZ + 0.14;
      a.onWake = (b) => { b.tw.add(0.7, (k) => { b.hop = Math.sin(k * Math.PI) * 0.35; flapBird(b, Math.sin(k * 18) * 0.5 + 0.5); }, { done: () => { b.hop = 0; flapBird(b, 0); } }); };
      return a;
    });
    function flapBird(a, s) { const sw = a.fig.meta.swing || {}; const w1 = sw.wing || [-0.4, 1], w2 = sw.wing2 || [-0.4, 0.95]; a.fig.rotatePart('wing', lerp(w1[0], w1[1], s)); a.fig.rotatePart('wing2', lerp(w2[0], w2[1], s)); }
    yield;

    // ============================================================ Lasche METEOR!
    const ctl = ctx.control('R', { id: 'meteor', label: 'METEOR!', a: [1.6, 3.65], b: [6.6, 3.65], size: [2.4, 1.0], color: '#b3201a', value: 0, springBack: true });
    ctl.onGrab = () => { sfx('grab'); if (S.phase === 'done') startReset(); };
    ctl.onTick = (v) => { if (S.phase === 'idle') sfx('slide', { v }); };
    ctl.onRelease = () => { if (S.phase === 'idle') sfx('snap'); };
    const ctlHit = ctl.hitMeshes;

    // ============================================================ Klappe „Spurensuche“ (Gesteinsquerschnitt mit lupenförmigem Iridium)
    const hinge = new THREE.Group(); hinge.position.set(9.85, 0.03, 2.2);
    const mkTex = (kind) => { const t = new THREE.CanvasTexture(flapFaceCanvas(kind)); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
    const flapCard = paperCard(2.7, 1.75, mkTex('top'), mkTex('bottom'), { depth: 0.05 });
    hinge.add(flapCard); R.add(hinge);
    const flap = { open: 0, target: 0, cardAt: -1 };
    R.addTap(flapCard.userData.top, () => { if (S.locked) return; flap.target = flap.target ? 0 : 1; sfx(flap.target ? 'flapOpen' : 'flapClose'); flap.cardAt = flap.target ? app.t + 0.6 : -1; }, () => !S.locked);
    flapCard.userData.bottom.userData.tap = () => { if (S.locked) return; flap.target = 0; flap.cardAt = -1; sfx('flapClose'); };
    R.taps.push({ mesh: flapCard.userData.bottom, enabled: () => !S.locked });
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.62, 16), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    lens.rotation.x = -Math.PI / 2; lens.position.set(8.5 + LENS_UV[0] * 2.7, 0.06, 2.2 + LENS_UV[1] * 1.75);
    R.addTap(lens, () => { if (!S.locked && flap.open > 0.8) app.openCardById('iridium', 9.9); }, () => !S.locked && flap.open > 0.8); R.add(lens);
    yield;

    // ============================================================ Zustand und Ablauf
    const S = { phase: 'idle', ts: 0, pre: 0, mood: 'dusk', imp: false, locked: false, roar: 0, fear: 0, signK: 0, cw: 0, sun: 0, resetAt: -1, capUntil: -1, capShown: false, acc: [0, 0, 0, 0, 0, 0, 0, 0], p: 0, offR: null, offL: null, flags: {}, resetT: 0, erupt: 0 };
    const cur = new Float32Array(NP), tgt = new Float32Array(NP), idleT = new Float32Array(NP);
    const setIdle = (pre) => { sampleLook(0, idleT); idleT[K_A] *= pre; for (let k = 0; k < 3; k++) idleT[K_TINT + k] = lerp(1, idleT[K_TINT + k], pre); idleT[K_VOLC] = 0.4 + 0.2 * pre; idleT[K_HAZE + 3] *= pre; };
    function sampleLook(ts, out) {
      let i = 0; while (i < ROWS.length - 2 && ts >= ROWS[i + 1][0]) i++;
      const a = ROWS[i], b = ROWS[i + 1], u = clamp((ts - a[0]) / (b[0] - a[0]));
      for (let k = 0; k < NP; k++) out[k] = a[k + 1] + (b[k + 1] - a[k + 1]) * u;
    }
    setIdle(0); cur.set(idleT);
    const tmpV = new THREE.Vector3(), flashEl = { el: null, at: 0 };
    const fxk = () => app.stage.tier.fx * (app.calm ? 0.6 : 1);

    // ---- Lichtblitz (DOM-Overlay, Anstieg höchstens 150 ms, dann weiches Abklingen (0,7 s), nur einmal; im Ruhigen Modus stark abgeschwächt)
    function flash() {
      if (!document.body.animate) return;
      killFlash();
      const el = flashEl.el = document.createElement('div'); flashEl.at = app.t;
      el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;opacity:0;background:radial-gradient(ellipse at 56% 55%,rgba(255,250,228,1) 0%,rgba(255,236,190,.96) 45%,rgba(255,214,150,.8) 80%,rgba(255,190,120,.55) 100%)';
      el.setAttribute('aria-hidden', 'true'); document.body.appendChild(el);
      const peak = app.calm ? 0.35 : 0.88;
      const an = el.animate([{ opacity: 0 }, { opacity: peak, offset: 0.17 }, { opacity: peak * 0.5, offset: 0.4 }, { opacity: 0 }], { duration: 720, easing: 'ease-out' });
      an.onfinish = () => { if (flashEl.el === el) flashEl.el = null; el.remove(); };
    }
    function killFlash() { const el = flashEl.el; if (el) { flashEl.el = null; try { el.getAnimations().forEach((x) => x.cancel()); } catch (e) { /* ignore */ } el.remove(); } }

    // ---- Hilfsfunktionen für Partikel
    const emit = (P, x, y, z, vx, vy, vz, life, size, alpha, color, drag, grav, grow) => {
      EM.x = x; EM.y = y; EM.z = z; EM.vx = vx; EM.vy = vy; EM.vz = vz; EM.life = life; EM.size = size; EM.alpha = alpha; EM.color = color; EM.drag = drag; EM.grav = grav; EM.grow = grow; P.emit(EM);
    };
    const offs = () => { if (!S.offR) { S.offR = ctx.world(0, 0, 0).clone(); S.offL = ctx.world(-1, 0, 0).clone(); S.offL.x += 1; } };
    const wx = (x) => x + (x < 0 ? S.offL.x : S.offR.x), wy = (x, y) => y + (x < 0 ? S.offL.y : S.offR.y), wz = (z) => z + S.offR.z;
    const rate = (i, perSec, dt) => { S.acc[i] += perSec * dt; const n = Math.floor(S.acc[i]); S.acc[i] -= n; return n; };

    // ---- Zustandswechsel
    function setMoodOnce(name) { if (S.mood === name) return; S.mood = name; app.stage.setMood(MOODS[name]); }
    function lockInput(on) {
      S.locked = on;
      ctl.hitMeshes = on ? [] : ctlHit;
      for (const side of [L, R]) for (const a of side.actors) { if (on) { if (!a._hm) { a._hm = a.hitMeshes; a.hitMeshes = []; } } else if (a._hm) { a.hitMeshes = a._hm; a._hm = null; } }
      signPop.pickMeshes = !on && S.signK > 0.9 ? [signPop.cut.mesh] : [];
    }
    function startRun() {
      offs(); S.phase = 'run'; S.dirty = true; S.ts = 0; S.p = PRE_P; S.imp = false; S.flags = {}; lockInput(true);
      ctl.touched = true;
    }
    function startReset() {
      S.phase = 'reset'; S.resetT = 0; killFlash(); hideCaption(); setMoodOnce('dusk');
      for (const b of birds) b.card = null;
      sfx('flapClose');
    }
    function finishReset() {
      S.phase = 'idle'; S.ts = 0; S.imp = false; S.erupt = 0; S.flags = {}; S.signK = 0; S.roar = 0; S.fear = 0;
      for (const b of birds) { b.card = null; b.fig.group.visible = true; b.bd.pop = 0; }
      signPop.cut.mesh.visible = false; signPop.group.scale.setScalar(0.001); signPop.pickMeshes = [];
      crater.visible = false; for (const r of rings) r.visible = false;
      impactGlow.material.opacity = 0; ctl.touched = false;
      lockInput(false);
    }
    // alles auf Anfang (beim Verlassen der Seite, verzögert; oder beim Wiederbetreten)
    function hardReset() {
      killFlash(); hideCaption();
      S.phase = 'idle'; S.dirty = false; S.ts = 0; S.pre = 0; S.erupt = 0; metG.visible = false; S.imp = false; S.flags = {}; S.signK = 0; S.roar = 0; S.fear = 0; S.resetAt = -1;
      setIdle(0); cur.set(idleT); applyLook(0); lockInput(false);
      for (const b of birds) { b.card = null; b.fig.group.visible = true; }
      signPop.cut.mesh.visible = false; signPop.group.scale.setScalar(0.001); signPop.pickMeshes = [];
      crater.visible = false; for (const r of rings) r.visible = false; impactGlow.material.opacity = 0;
      streak.material.opacity = 0; astPop.fig.group.visible = true; astGlow.visible = true;
      S.sun = 0; sunHalo.material.opacity = sunCore.material.opacity = 0; sunHalo.visible = sunCore.visible = false;
      for (const d of dustClouds) { d.fig.group.visible = false; d.group.scale.setScalar(1); }
      ctl.touched = false;
      if (flap.target) { flap.target = 0; flap.cardAt = -1; }
      ac('tension', 0);
    }
    function hideCaption() { if (S.capShown) { S.capShown = false; if (app.ui && app.ui.caption && app.ui.caption.textContent === CAP) app.ui.showCaption(''); } }
    const CAP = 'Eine Gruppe von Dinosauriern hat überlebt: die Vögel.';

    // ---- Look anwenden (Overlay, Tönung, Silhouetten, Krater, Staub, Vulkanglut)
    function applyLook(now) {
      const L0 = cur, u = skyMat.uniforms;
      u.uA.value = L0[K_A]; u.cTop.value.set(L0[K_TOP], L0[K_TOP + 1], L0[K_TOP + 2]); u.cMid.value.set(L0[K_MID], L0[K_MID + 1], L0[K_MID + 2]); u.cBot.value.set(L0[K_BOT], L0[K_BOT + 1], L0[K_BOT + 2]);
      const vis = L0[K_A] > 0.004; for (const o of overlays) o.visible = vis;
      hazeFar.color.setRGB(L0[K_HAZE], L0[K_HAZE + 1], L0[K_HAZE + 2], THREE.SRGBColorSpace); hazeNear.color.setRGB(L0[K_HAZE] * 0.72, L0[K_HAZE + 1] * 0.72, L0[K_HAZE + 2] * 0.74, THREE.SRGBColorSpace); hazeFar.opacity = hazeNear.opacity = L0[K_HAZE + 3]; const hv = L0[K_HAZE + 3] > 0.004; for (const o of hazes) o.visible = hv;
      const tr = L0[K_TINT], tg = L0[K_TINT + 1], tb = L0[K_TINT + 2];
      for (const m of scen) m.color.setRGB(tr, tg, tb);
      const vr = lerp(1, tr, 0.45), vg = lerp(1, tg, 0.45), vb = lerp(1, tb, 0.45);
      for (const m of volM) m.color.setRGB(vr, vg, vb);
      const s = L0[K_SIL];
      for (const m of sil) m.color.setRGB(lerp(tr, SIL[0], s), lerp(tg, SIL[1], s), lerp(tb, SIL[2], s));
      const cr = L0[K_CRATER]; craterMat.opacity = cr; crater.visible = cr > 0.01; craterMat.color.setRGB(lerp(1, tr, 0.6), lerp(1, tg, 0.6), lerp(1, tb, 0.6));
      const vo = L0[K_VOLC];
      for (let i = 0; i < vGlow.length; i++) { const p = 0.85 + 0.15 * Math.sin(now * (1.7 + i * 0.6) + i); vGlow[i].material.opacity = clamp(vo * 0.8 * p, 0, 1); }
      // Staubwolken
      const dust = L0[K_DUST];
      for (const d of dustClouds) {
        const k = smooth(clamp((dust * 1.25 - d.d0) / 0.55));
        const on = k > 0.01; d.fig.group.visible = on;
        if (on) {
          d.group.scale.set(0.35 + 0.65 * k, 0.15 + 0.85 * k, 1); d.group.position.y = d.rise * k;
          const op = clamp(dust * 1.6, 0, 1) * 0.94; for (const c of d.fig.cuts) c.material.opacity = op;
        }
      }
    }

    // ---- Vögel: Position zu jeder Zeit ts aus dem Zeitplan (stetig, ohne Zustandsautomat)
    const bp = { x: 0, y: 0, z: 0, fl: 0, dir: 1, vis: true };
    function circ(d, ts, o) { const ph = d.ph + d.w * ts; o.x = d.c[0] + Math.cos(ph) * d.rx; o.y = d.c[1] + Math.sin(ph * 1.3) * d.ry; o.z = d.c[2]; o.dir = Math.sign(-Math.sin(ph) * d.w) || 1; }
    const cp = { x: 0, y: 0, z: 0, dir: 1 };
    function birdAt(d, ts, o) {
      const P = d.perch; o.vis = true; o.fl = 0; o.dir = d.idx % 2 ? -1 : 1;
      if (ts < d.up) { o.x = P[0]; o.y = P[1]; o.z = P[2]; return; }
      if (ts < d.up + 1.0) { const u = smooth((ts - d.up) / 1.0); circ(d, ts, cp); o.x = lerp(P[0], cp.x, u); o.y = lerp(P[1], cp.y, u) + Math.sin(u * Math.PI) * 0.5; o.z = lerp(P[2], cp.z, u); o.fl = 1; o.dir = cp.dir; return; }
      if (ts < d.land) { circ(d, ts, cp); o.x = cp.x; o.y = cp.y; o.z = cp.z; o.fl = 1; o.dir = cp.dir; return; }
      if (ts < d.land + 1.1) { const u = smooth((ts - d.land) / 1.1); circ(d, d.land, cp); o.x = lerp(cp.x, P[0], u); o.y = lerp(cp.y, P[1], u); o.z = lerp(cp.z, P[2], u); o.fl = u < 0.85 ? 1 : 0.4; o.dir = P[0] >= cp.x ? 1 : -1; return; }
      if (ts < d.out) { o.x = P[0]; o.y = P[1]; o.z = P[2]; return; }
      if (ts < d.out + 2.8) { const u = (ts - d.out) / 2.8, e = Math.pow(u, 1.5); o.x = lerp(P[0], d.ex[0], e); o.y = lerp(P[1], d.ex[1], e) + Math.sin(u * 9) * 0.12 * (1 - e); o.z = P[2]; o.fl = 1; o.dir = d.ex[0] >= P[0] ? 1 : -1; return; }
      if (d.ret && ts >= d.enter) {
        const u = clamp((ts - d.enter) / 2.0), e = smooth(u);
        o.x = lerp(d.enter0x, d.sx, e); o.y = lerp(7.6, d.sy, e * e * (3 - 2 * e)) + Math.sin(u * 7) * 0.1 * (1 - u); o.z = d.sz; o.fl = u < 0.88 ? 1 : (1 - u) * 6; o.dir = d.sx >= d.enter0x ? 1 : -1; return;
      }
      o.vis = false;
    }
    function updateBirds(dt, now) {
      const run = S.phase === 'run' || S.phase === 'done' || (S.phase === 'reset');
      for (let i = 0; i < birds.length; i++) {
        const a = birds[i], d = a.bd, fg = a.fig.group;
        if (S.phase === 'idle' || (S.phase === 'reset')) {
          const P = d.perch; a.popup.group.position.set(P[0], P[1], P[2]); fg.visible = true;
          const rest = S.pre * (0.5 + 0.5 * Math.sin(now * 11 + i * 2));
          if (a.tw.list.length === 0) { flapBird(a, S.pre > 0.4 ? clamp(rest - 0.2) : 0); a.hop = S.pre > 0.35 ? Math.max(0, Math.sin(now * 12 + i * 3)) * 0.07 * S.pre : 0; }
          continue;
        }
        birdAt(d, S.ts, bp);
        fg.visible = bp.vis; a.popup.group.position.set(bp.x, bp.y, bp.z);
        if (bp.dir !== a.dir) a.setFacing(bp.dir);
        d.fph += dt * (bp.fl > 0.5 ? 17 : 6); const fv = bp.fl > 0.01 ? 0.5 + 0.5 * Math.sin(d.fph) : 0; if (a.tw.list.length === 0) { flapBird(a, fv * clamp(bp.fl + 0.2)); a.hop = 0; }
        if (d.ret && S.ts >= d.enter + 2.0 && !a.card) a.card = 'ueberlebende';
      }
    }

    // ---- Hauptschleife der Seite
    function update(dt, now) {
      if (flashEl.el && now - flashEl.at > 1.3) killFlash(); // Rückfall: Blitz-Div verschwindet auch ohne WAAPI-Ende (Simulationszeit)
      flap.open += (flap.target - flap.open) * (1 - Math.exp(-dt * 6)); hinge.rotation.x = -flap.open * 1.38;
      if (!spread.active) { if (S.resetAt >= 0 && now >= S.resetAt) hardReset(); return; }
      const v = ctl.sp.x;
      const ph = S.phase;
      // ---------------- Zeitgeber
      if (ph === 'idle') {
        S.pre = smooth(clamp(v / TRIG)); ac('tension', clamp(v));
        S.p = PRE_P * S.pre; setIdle(S.pre); tgt.set(idleT);
        if (v >= TRIG && (cur[K_SIL] < 0.02)) startRun();
      } else if (ph === 'run') {
        S.ts = Math.min(T_DONE, S.ts + dt); runEvents(dt, now);
        sampleLook(S.ts, tgt);
        if (S.ts >= T_DONE) { S.phase = 'done'; lockInput(false); if (S.signK > 0.9) signPop.pickMeshes = [signPop.cut.mesh]; }
      } else if (ph === 'done') { sampleLook(T_LOOK, tgt); }
      else if (ph === 'reset') {
        S.resetT += dt; setIdle(0); tgt.set(idleT);
        let maxd = 0; for (let k = 0; k < NP; k++) maxd = Math.max(maxd, Math.abs(cur[k] - tgt[k]));
        S.signK = Math.max(0, S.signK - dt * 2.4);
        if (S.resetT > 0.5 && maxd < 0.03 && S.signK <= 0) finishReset();
      }
      // ---------------- Look folgen und anwenden
      const f = 1 - Math.exp(-dt * (ph === 'reset' ? 2.6 : ph === 'run' ? 6 : 8));
      for (let k = 0; k < NP; k++) cur[k] += (tgt[k] - cur[k]) * f;
      applyLook(now);
      // ---------------- Elemente
      updateAsteroid(dt);
      updateMeteor(dt, now);
      updateWorld(dt, now);
      updateBirds(dt, now);
      updateSign(dt, now);
      if (flap.cardAt >= 0 && now >= flap.cardAt) { flap.cardAt = -1; if (flap.target) app.openCardById('iridium', 9.9); }
      // Bildunterschrift ausblenden
      if (S.capShown && now > S.capUntil) hideCaption();
    }
    ctx.onUpdate(update);

    // ---- Asteroid und Feuerstreifen
    function updateAsteroid(dt) {
      const ph = S.phase; let vis = true, heat = 0.1 + 0.4 * S.pre, p = S.p, shrink = 1;
      if (ph === 'run') {
        if (S.ts < T_IMP) {
          const q = clamp((S.ts - T_FLY0) / (T_IMP - T_FLY0)); p = PRE_P + (1 - PRE_P) * Math.pow(q, 2.2); heat = 0.55 + 0.45 * q;
          if (S.ts >= T_FLY0 - 0.5 && S.ts < T_MET0) { // Feuerschweif aus Partikeln
            const n = rate(0, (14 + 130 * q) * fxk(), dt);
            for (let i = 0; i < n; i++) {
              const x = lerp(A0[0], B0[0], p), z = lerp(A0[2], B0[2], p), y = lerp(A0[1], B0[1], Math.pow(p, 1.15)) + AST_H * 0.5;
              const sc = 1 + 0.5 * p, ox = (rnd() - 0.5) * 0.5, oy = (rnd() - 0.5) * 0.4;
              emit(fx.glow, wx(x) + ox, wy(x, y) + oy, wz(z) + 0.1, 1.2 + rnd() * 1.4, 0.7 + rnd() * 0.9, (rnd() - 0.3) * 0.4, 0.5 + rnd() * 0.5, (0.35 + rnd() * 0.5) * sc, 0.8, rnd() < 0.5 ? C_FIRE : C_HOT, 0.8, 0, -0.3);
              if (rnd() < 0.7) emit(fx.dust, wx(x) + ox * 1.4, wy(x, y) + oy + 0.1, wz(z) + 0.05, 1.0 + rnd(), 0.5 + rnd() * 0.8, (rnd() - 0.5) * 0.4, 1.2 + rnd() * 0.9, (0.45 + rnd() * 0.6) * sc, 0.55, C_SMOKE, 0.9, 0, 1.6);
            }
          }
          shrink = 1 - smooth(clamp((S.ts - (T_MET0 - 0.5)) / 0.5)); if (shrink < 0.02) vis = false;
        } else { vis = false; p = 1; }
      } else if (ph === 'done') { vis = false; p = 1; }
      else if (ph === 'reset') { vis = S.resetT > 1.0; p = 0; heat = 0.1; }
      astPop.fig.group.visible = vis; astGlow.visible = vis; streakG.visible = vis;
      if (!vis) return;
      const x = lerp(A0[0], B0[0], p), z = lerp(A0[2], B0[2], p), y = lerp(A0[1], B0[1], Math.pow(p, 1.15)), sc = 1 + 0.5 * p;
      astPop.group.position.set(x, y, z); astPop.group.scale.setScalar(Math.max(0.001, sc * shrink));
      const len = 0.6 + 4.2 * heat * heat; streak.scale.set(len, 1, 1); streak.position.x = -len / 2 + 0.25; streak.material.opacity = clamp((heat - 0.25) * 1.4, 0, 1) * 0.9;
      astGlow.material.opacity = 0.25 + 0.55 * heat; astGlow.scale.setScalar(3.0 + 2.2 * heat);
    }


    // ---- Großer Meteor: glühender Brocken mit Halo und langem Feuerschweif, fliegt im Bildschirmraum von links oben quer vor dem Buch
    const cam3 = app.stage.camera, MET_D = 12, metG = new THREE.Group(); metG.visible = false;
    const rockGeo = new THREE.IcosahedronGeometry(1, 1);
    { const pa = rockGeo.attributes.position, hs = (x, y, z) => { const v = Math.sin(Math.round(x * 20) * 12.9898 + Math.round(y * 20) * 78.233 + Math.round(z * 20) * 37.719) * 43758.5453; return v - Math.floor(v); };
      for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i), k = 0.8 + 0.34 * hs(x, y, z); pa.setXYZ(i, x * k * 1.08, y * k * 0.92, z * k); }
      rockGeo.computeVertexNormals(); }
    const rockMat = new THREE.MeshLambertMaterial({ color: 0xb02c16, emissive: 0xe0300a, emissiveIntensity: 0.5, flatShading: true, fog: false, depthTest: false });
    const rock = new THREE.Mesh(rockGeo, rockMat); rock.renderOrder = 12; metG.add(rock);
    const metHalo = glowSprite(0xff8a30, 1, 0.9, false), metCore = glowSprite(0xffd9a0, 1, 0.95, false); metHalo.renderOrder = 6; metCore.renderOrder = 6; metG.add(metHalo, metCore);
    const tailG = new THREE.Group(); metG.add(tailG);
    const mkTail = (w, op, ro) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0, fog: false })); m.renderOrder = ro; m.userData.w = w; m.userData.op = op; tailG.add(m); return m; };
    const tails = [mkTail(0.22, 0.6, 5), mkTail(0.09, 0.85, 5)];
    const mv = new THREE.Vector3(), mv2 = new THREE.Vector3(), metP = new THREE.Vector3(), metBack = new THREE.Vector3();
    app.stage.scene.add(metG);
    function updateMeteor(dt, now) {
      const ts = S.ts, on = S.phase === 'run' && ts >= T_MET0 && ts < T_IMP + 0.02;
      if (!on) { metG.visible = false; return; }
      cam3.updateMatrixWorld();
      const hh = Math.tan(cam3.fov * Math.PI / 360) * MET_D, asp = cam3.aspect;
      const q = clamp((ts - T_MET0) / (T_IMP - T_MET0)), e = Math.pow(q, 1.7);
      // Ziel = Einschlagstelle im Bild; Start weit links oben außerhalb
      offs(); mv.set(wx(IX), wy(IX, 0.3), wz(IZ)).project(cam3);
      const sx = -1.45, sy = 1.35, nx = lerp(sx, mv.x, e), ny = lerp(sy, mv.y, e) + 0.1 * Math.sin(Math.PI * e);
      const dx = (mv.x - sx) * asp, dy = mv.y - sy, ang = Math.atan2(dy, dx), dl = Math.hypot(dx, dy) || 1;
      mv2.set(nx * asp * hh, ny * hh, -MET_D); cam3.localToWorld(mv2); metP.copy(mv2);
      metG.position.copy(metP); metG.quaternion.copy(cam3.quaternion); metG.visible = true;
      const r = hh * (0.1 + 0.05 * e); rock.scale.setScalar(r); rock.rotation.set(now * 1.3, now * 0.9, now * 0.6);
      rockMat.emissiveIntensity = 0.45 + 0.15 * Math.sin(now * 17) + 0.1 * q;
      const hs = hh * (1.15 + 0.7 * e) * (1 + 0.04 * Math.sin(now * 23)); metHalo.scale.set(hs, hs, 1); metHalo.material.opacity = 0.7 + 0.15 * e;
      const cs = hh * 0.3 * (1 + 0.4 * e); metCore.scale.set(cs, cs, 1); metCore.material.opacity = 0.4;
      tailG.rotation.z = ang;
      const len = hh * (2.2 + 2.6 * e), fadeIn = clamp(q * 8);
      for (const t of tails) { t.scale.set(len, hh * t.userData.w * (0.8 + 0.4 * e), 1); t.position.x = -len / 2 + r * 0.6; t.material.opacity = t.userData.op * fadeIn * (0.85 + 0.15 * Math.sin(now * 29)); }
      // Partikel-Schweif in der Welt (bleibt hinter dem Meteor zurück)
      const k = fxk(), n = rate(0, (50 + 110 * q) * k, dt);
      metBack.set(-dx / dl, -dy / dl, 0).applyQuaternion(cam3.quaternion);
      for (let i = 0; i < n; i++) {
        const t = rnd(), sp = 0.6 + rnd() * 1.6, ox = (rnd() - 0.5) * r * 1.6, oy = (rnd() - 0.5) * r * 1.6;
        mv2.set(ox, oy, 0).applyQuaternion(cam3.quaternion);
        emit(fx.glow, metP.x + mv2.x - metBack.x * r * 0.3 * t, metP.y + mv2.y - metBack.y * r * 0.3 * t, metP.z + mv2.z - metBack.z * r * 0.3 * t, metBack.x * sp, metBack.y * sp, metBack.z * sp, 0.55 + rnd() * 0.7, hh * (0.05 + rnd() * 0.09), 0.5, rnd() < 0.45 ? C_HOT : C_FIRE, 0.7, 0, -0.5);
        if (rnd() < 0.8) emit(fx.dust, metP.x + mv2.x, metP.y + mv2.y, metP.z + mv2.z, metBack.x * sp * 0.7, metBack.y * sp * 0.7 + 0.2, metBack.z * sp * 0.7, 1.2 + rnd() * 1.0, hh * (0.1 + rnd() * 0.13), 0.5, C_SMOKE, 0.7, 0, 1.6);
      }
    }

    // ---- Ereignisse des Ablaufs (einmalig, nach Schwellen)
    function once(key, cond, fn) { if (!S.flags[key] && cond) { S.flags[key] = true; fn(); } }
    function runEvents(dt, now) {
      const ts = S.ts;
      ac('tension', ts < T_IMP ? 0.85 + 0.15 * clamp(ts / T_IMP) : 0);
      once('whoosh', ts >= T_WHOOSH, () => sfx('whoosh', { v: 1 }));
      once('whoosh2', ts >= 4.4, () => sfx('whoosh', { v: 1 }));
      S.fear = smooth(clamp((ts - 2.2) / 2.2)) * (ts < T_IMP ? 1 : 0.3);
      S.roar = ts > T_ROAR && ts < T_IMP + 0.4 ? smooth(clamp((ts - T_ROAR) / 0.4)) * (1 - smooth(clamp((ts - T_IMP + 0.3) / 0.7))) : 0;
      once('imp', ts >= T_IMP, impact);
      once('ash', ts >= T_ASH, () => setMoodOnce('ash'));
      once('sil', ts >= T_SIL, () => { if (audio.silence) audio.silence(4.2); });
      once('tinn', ts >= T_TINN, () => sfx('tinnitus'));
      once('dawn0', ts >= T_DAWN0, () => setMoodOnce('dawn0'));
      once('dawn', ts >= T_DAWN, () => setMoodOnce('dawn'));
      once('tweet', ts >= T_TWEET, () => sfx('tweet'));
      once('cap', ts >= T_CAP, () => { if (app.ui && app.ui.showCaption) { app.ui.showCaption(CAP); S.capShown = true; S.capUntil = now + 11; } sfx('chime'); });
      once('rumble2', ts >= T_IMP + 1.5, () => { sfx('rumble'); app.cam.shake(0.18, 0.8); });
    }
    function impact() {
      S.imp = true; S.erupt = 1; flash();
      for (let g = 0; g < vGlow.length; g++) { vGlow[g].getWorldPosition(tmpV); for (let i = 0, n = Math.floor(40 * fxk()); i < n; i++) emit(fx.glow, tmpV.x + (rnd() - 0.5) * 0.5, tmpV.y, tmpV.z + 0.15, (rnd() - 0.5) * 3.2, 3 + rnd() * 5, (rnd() - 0.5) * 0.6, 1.2 + rnd() * 1.3, 0.09 + rnd() * 0.15, 0.95, rnd() < 0.5 ? C_HOT : C_FIRE, 0.3, 3, -0.2); } app.cam.shake(0.45, 1.15); sfx('impact'); ac('tension', 0);
      setMoodOnce('glut');
      for (const r of rings) { r.visible = true; r.material.uniforms.uR.value = 0; r.material.uniforms.uA.value = 0; }
      impactGlow.material.opacity = 1;
      const k = fxk();
      for (let i = 0, n = Math.floor(46 * k); i < n; i++) { // Funken
        const a = rnd() * TAU, sp = 2.5 + rnd() * 5.5;
        emit(fx.glow, wx(IX), wy(IX, 0.3), wz(IZ), Math.cos(a) * sp, 2 + rnd() * 5, Math.sin(a) * sp * 0.7, 0.8 + rnd() * 0.9, 0.12 + rnd() * 0.22, 0.95, rnd() < 0.5 ? C_HOT : C_FIRE, 0.5, 6, -0.2);
      }
      for (let i = 0, n = Math.floor(90 * k); i < n; i++) { // Staubring und Staubsäule
        const a = rnd() * TAU, sp = 1.5 + rnd() * 4.5, up = i % 5 === 0;
        emit(fx.dust, wx(IX) + Math.cos(a) * 0.3, wy(IX, 0.15), wz(IZ) + Math.sin(a) * 0.2, Math.cos(a) * sp * (up ? 0.5 : 1), up ? 2.0 + rnd() * 2.5 : 0.4 + rnd() * 1.4, Math.sin(a) * sp * (up ? 0.5 : 0.8), 2.4 + rnd() * 1.6, 0.9 + rnd() * 1.1, 0.55, rnd() < 0.5 ? C_DUST : C_SMOKE, 1.3, 0, 1.8);
      }
    }
    ctx.spread.p7dbg = { S, cur, tgt, ctl };

    // ---- Welt-Updates: Druckwelle, Einschlagsglut, Staub/Asche, Vulkanfunken, Wolken, Höhle
    const pops = [];
    for (const side of [L, R]) for (const p of side.popups) pops.push(p);
    function updateWorld(dt, now) {
      // Wind: Bäume und Farne wiegen sich, stärker bei Unruhe und Druckwelle
      const wind = 0.5 + 3.0 * S.fear + 1.5 * S.pre + (S.imp && S.phase === 'run' ? 4 * Math.exp(-(S.ts - T_IMP) * 0.8) : 0);
      for (let i = 0; i < sway.length; i++) sway[i].pivot.rotation.z = Math.sin(now * (1.3 + i * 0.17) + i * 1.9) * 0.012 * sway[i].swK * wind;
      // Morgensonne
      const sunT = (S.phase === 'run' && S.ts > 13.4) || S.phase === 'done' ? smooth(clamp((S.ts - 13.4) / 4.0)) : 0;
      S.sun += (sunT - S.sun) * (1 - Math.exp(-dt * 3)); sunPop.group.position.y = 0.9 + 1.0 * S.sun;
      sunHalo.material.opacity = 0.7 * S.sun; sunCore.material.opacity = 0.85 * S.sun; sunHalo.visible = sunCore.visible = S.sun > 0.01;
      // Vulkan-Rauch wiegt, Wolken ziehen, Augenglanz in der Höhle
      for (let i = 0; i < vols.length; i++) poseAmt(vols[i].fig, 'smoke', 0.5 + 0.5 * Math.sin(now * 0.4 + i * 2));
      S.cw += dt * (0.05 + 0.5 * S.fear + 0.25 * S.pre); cloudL.group.position.x = -2.4 + Math.sin(S.cw) * 1.5; cloudR.group.position.x = 4.6 + Math.sin(S.cw * 0.8 + 1) * 1.3;
      const gph = (now % 6.5) / 6.5; eyeGlint.material.opacity = S.phase === 'run' || S.phase === 'done' ? 0.0 : (gph < 0.06 ? Math.sin(gph / 0.06 * Math.PI) * 0.95 : 0.12);
      // Vulkan-Funken
      const vo = cur[K_VOLC];
      if (vGlow.length) {
        S.erupt = S.imp && S.phase !== 'idle' && S.phase !== 'reset' ? Math.exp(-Math.max(0, S.ts - T_IMP) / 3.2) : 0;
        const n = rate(1, (1.5 + 9 * vo * vo + 60 * S.erupt) * fxk(), dt);
        for (let i = 0; i < n; i++) {
          const g = vGlow[i & 1]; g.getWorldPosition(tmpV);
          const er = S.erupt;
          emit(fx.glow, tmpV.x + (rnd() - 0.5) * 0.6, tmpV.y + 0.05, tmpV.z + 0.15, (rnd() - 0.4) * (0.8 + 2.4 * er), 0.8 + rnd() * 1.4 + er * 3.5, (rnd() - 0.5) * 0.3, 1.1 + rnd() * 1.1, 0.07 + rnd() * 0.08, 0.9, C_EMBER, 0.4, -0.2, -0.3);
        }
      }
      const run = S.phase === 'run', ts = S.ts, rt = ts - T_IMP;
      if (S.imp && (run || S.phase === 'done')) {
        // Einschlagsglut
        impactGlow.material.opacity = clamp(1 - rt / 1.3, 0, 1) * 0.9; const gs = 5 + 5 * easeOutCubic(clamp(rt / 1.3)); impactGlow.scale.set(gs, gs * 0.8, 1);
        // Druckwelle auf dem Papier
        const R0 = 17 * (1 - Math.pow(1 - clamp(rt / 4.8), 2));
        const a = clamp(rt / 0.12) * 0.95 * (1 - smooth(clamp((rt - 0.5) / 4.3)));
        for (const r of rings) { const u = r.material.uniforms; u.uR.value = R0; u.uW.value = 0.5 + 0.28 * Math.min(rt, 4); u.uA.value = a; r.visible = a > 0.004; }
        // Papier-Kick: Pop-ups wippen, wenn die Welle sie erreicht
        if (rt < 5.6) {
          for (let i = 0; i < pops.length; i++) {
            const p = pops[i], px = p.group.position.x - IX, pz = p.group.position.z - IZ, d = Math.sqrt(px * px + pz * pz), u = (d - R0) / 1.5;
            if (u > -3 && u < 3 && p.eff > 0.5) { const o = 0.15 / (1 + 0.1 * d) * Math.exp(-u * u * 0.5) * Math.cos(u * 2.4) * (app.calm ? 0.25 : 1); p.pivot.rotation.x += o; }
          }
          for (const side of [L, R]) for (const a of side.actors) {
            const px = a.popup.group.position.x - IX, pz = a.popup.group.position.z - IZ, d = Math.sqrt(px * px + pz * pz), u = (d - R0) / 1.2;
            if (u > -2.5 && u < 2.5 && a.tw.list.length === 0 && a.bd === undefined) a.hop = Math.max(0, Math.exp(-u * u) * 0.28 * (app.calm ? 0.3 : 1));
          }
        }
        // Staubsäule, Staubwelle, Asche
        const k = fxk();
        if (rt > 0.1 && rt < 2.6) {
          const n = rate(2, 22 * k, dt);
          for (let i = 0; i < n; i++) emit(fx.dust, wx(IX) + (rnd() - 0.5) * 2.4, wy(IX, 0.3), wz(IZ) + (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 2.0, 1.8 + rnd() * 2.4, (rnd() - 0.5) * 0.5, 2.6 + rnd() * 1.4, 0.8 + rnd() * 0.9, 0.42, rnd() < 0.5 ? C_DUST : C_SMOKE, 1.0, 0, 1.6);
        }
        if (rt > 0.2 && rt < 3.0) {
          const n = rate(3, 22 * k, dt);
          for (let i = 0; i < n; i++) {
            const a = rnd() * TAU, x = IX + Math.cos(a) * R0 * 0.9, z = IZ + Math.sin(a) * R0 * 0.6;
            if (x > -11.5 && x < 11.5 && z > -3.2 && z < 3.6) emit(fx.dust, wx(x), wy(x, 0.1), wz(z), Math.cos(a) * 0.6, 0.4 + rnd() * 0.5, Math.sin(a) * 0.3, 2.0 + rnd(), 0.8 + rnd() * 0.7, 0.5, C_DUST, 1.4, 0, 2.0);
          }
        }
        if (ts > T_IMP + 0.1 && ts < T_IMP + 7) { // goldene Funken schweben über der ganzen Szene
          const m = rate(5, 26 * k * clamp((T_IMP + 7 - ts) / 3), dt);
          for (let i = 0; i < m; i++) { const x = -11.5 + rnd() * 23, z = -3 + rnd() * 6.5, big = rnd() < 0.18; emit(fx.glow, wx(x), wy(x, 0.3 + rnd() * 4.6), wz(z), (rnd() - 0.4) * 0.35, 0.25 + rnd() * 0.6, (rnd() - 0.5) * 0.2, 3.2 + rnd() * 2.6, big ? 0.22 + rnd() * 0.2 : 0.05 + rnd() * 0.1, big ? 0.4 : 0.85, rnd() < 0.5 ? C_HOT : C_EMBER, 0.2, -0.1, 0); }
        }
        if (S.erupt > 0.05) { // Rauchfahnen der Vulkane
          const m = rate(6, 14 * S.erupt * k, dt);
          for (let i = 0; i < m; i++) { const g = vGlow[i & 1]; g.getWorldPosition(tmpV); emit(fx.dust, tmpV.x + (rnd() - 0.5) * 0.5, tmpV.y + 0.1, tmpV.z + 0.1, (rnd() - 0.5) * 0.8, 1.2 + rnd() * 1.6, 0, 2.2 + rnd(), 0.5 + rnd() * 0.5, 0.5, C_SMOKE, 0.6, 0, 1.8); }
        }
        if (ts > T_ASH && ts < 16.5) { // Aschefall, langsam
          const m = rate(4, 5 * k, dt);
          for (let i = 0; i < m; i++) { const x = -11 + rnd() * 22, z = -3 + rnd() * 6; emit(fx.dust, wx(x), wy(x, 4.6 + rnd() * 0.8), wz(z), (rnd() - 0.5) * 0.15, -0.35 - rnd() * 0.2, 0, 6.5, 0.07 + rnd() * 0.07, 0.55, C_ASH, 0.2, 0, 0); }
        }
        crater.scale.set(0.35 + 0.65 * easeOutCubic(clamp(rt / 0.8)), 0.28 + 0.52 * easeOutCubic(clamp(rt / 0.8)), 1);
      } else if (S.phase === 'idle' || S.phase === 'reset') { for (const r of rings) r.visible = false; impactGlow.material.opacity = 0; }
    }

    // ---- Schild (nach dem Ablauf)
    function updateSign(dt, now) {
      const run = S.phase === 'run' || S.phase === 'done';
      if (run && S.ts >= T_CAP) S.signK = Math.min(1, S.signK + dt / 0.9);
      const k = S.signK; signPop.cut.mesh.visible = k > 0.01;
      if (k > 0.01) { const e = easeOutBack(clamp(k)); signPop.group.scale.setScalar(Math.max(0.001, e)); }
    }

    // ---- Schnittstelle zur Seitenverwaltung
    spread.p7 = {
      S,
      activate() { if (S.dirty || S.resetAt >= 0) { hardReset(); if (S.mood !== 'dusk') { S.mood = 'dusk'; app.stage.setMood(MOODS.dusk); } } },
      deactivate() {
        killFlash(); hideCaption(); ac('tension', 0); flap.target = 0; flap.cardAt = -1;
        fx.glow.clear(); fx.dust.clear(); impactGlow.material.opacity = 0; for (const r of rings) r.visible = false;
        S.phase = 'idle'; S.ts = 0; S.erupt = 0; metG.visible = false; lockInput(false); S.resetAt = app.t + 0.9;
        if (app.cam) { app.cam.shakeDur = 0; }
      },
      dispose() { killFlash(); hideCaption(); ac('tension', 0); app.stage.scene.remove(metG); },
    };
  },

  onActivate(ctx) { const P = ctx.spread.p7; if (P) P.activate(); },
  onDeactivate(ctx) { const P = ctx.spread.p7; if (P) P.deactivate(); },
  dispose(ctx) { const P = ctx && ctx.spread && ctx.spread.p7; if (P) P.dispose(); },
};
