// Station 3 „Die Legion“: Marschlager im Abendrot als Querschnitt (Graben, Wall mit Pfählen, Wachturm, Zeltreihen, Feldzeichen, Feuer).
// Links: Regler „Lagerbau“ (das Lager entsteht Schritt für Schritt) und Schieber „Schildkröte“ (Testudo: Schilde zum Dach).
// Rechts: der große Legionär mit fünf Laschen (Helm, Panzer, Schwert, Schild, Speer), Zenturio, Adlerträger, Marschgepäck.
// Antippbar: Legionär, jedes Ausrüstungsteil, Nagelsandalen, Zenturio, Adlerträger, Marschgepäck, Schildkröte, Lager; die Gans hockt hinter dem Zelt der dritten Reihe.
import { mood } from '../engine/scene.js';
import { panelPart } from './common.js';
import { baseDefs, LAY, SKY_STOPS, skyDeco, hillDeco, nearDeco, bodyH } from './_p3_paint.js';
import { buildLager, buildTestudo } from './_p3_lager.js';
import { buildGear } from './_p3_gear.js';

export default {
  id: 'legion',
  mood: mood({ key: '#ffb677', keyI: 2.35, sky: '#f0a67a', gnd: '#5c3225', hemiI: 1.7, pos: [14, 14, 9], rim: 0.1 }),
  motes: { colors: [[1, 0.72, 0.38], [1, 0.58, 0.32]], size: 0.085, alpha: 0.3, dx: -0.04, dy: 0.05, dz: 0.01, tw: 1.1, density: 0.6 },
  atmo: 'legion',

  base() { return baseDefs(); },

  *build(ctx) {
    const app = ctx.app;
    const T = (ctx.spread.p3 = { intro: false, introDone: false, introT: 0 });

    // ---------------- Kulissen: Abendhimmel, Sonne hinter den fernen Hügeln, Wolken, nahe Hügel
    for (const [s, cx, k] of [['L', -5.975, 0], ['R', 5.975, 1]]) {
      ctx.flat(panelPart(-5.775, 5.775, 5.0, { fill: { stops: SKY_STOPS, dir: 'v' }, wave: 0.2, freq: 2.4, phase: 0.6 + k * 1.7, seed: 3 + k, deco: skyDeco(s) }), { x: cx, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 56, border: 0.04 });
    }
    ctx.prop('leg_sonne', { x: LAY.sun.x, z: LAY.sun.z, y: 0.55, h: 3.2, delay: 0.03, cast: false });
    for (const [x, y, len, v] of [[-6.2, 3.55, 3.5, 0], [4.1, 3.9, 3.2, 1], [11.0, 3.3, 2.6, 0]]) ctx.prop('leg_wolke', { x, y, z: -3.7, len, variant: v, delay: 0.05, cast: false });
    for (const [s, cx, k] of [['L', -6.0, 0], ['R', 6.0, 1]]) {
      ctx.flat(panelPart(-5.5, 5.5, 1.9, { fill: { top: '#8c5a7c', bottom: '#c88672' }, wave: 0.4, freq: 2.2, phase: 1.1 + k * 2.1, seed: 12 + k, deco: hillDeco }), { x: cx, z: -3.2, name: 'far' + s, delay: 0.06, ppu: 50, border: 0.03 });
      ctx.flat(panelPart(-5.7, 5.7, 1.0, { fill: { top: '#7b4a3a', bottom: '#a8683f' }, wave: 0.22, freq: 3.1, phase: 0.4 + k * 1.3, seed: 20 + k, deco: nearDeco }), { x: cx, z: -2.25, name: 'near' + s, delay: 0.08, ppu: 54, border: 0.03 });
    }
    yield;
    for (const [id, x, z, h, v] of [['leg_pinie', -11.2, -2.05, 3.7, 0], ['leg_pinie', 2.1, -2.4, 3.6, 1], ['leg_zypresse', 6.1, -2.5, 3.5, 0], ['leg_pinie', 11.0, -2.1, 3.4, 1]]) {
      ctx.prop(id, { x, z, h, variant: v, delay: 0.12 });
    }
    yield;

    // ---------------- das Lager (Querschnitt, Turm, Zelte, Gans), danach die Schildkröte
    yield* buildLager(ctx, T);
    yield* buildTestudo(ctx, T);

    // ---------------- rechts: Zenturio, Adlerträger, Marschgepäck
    const zen = ctx.stand('p_zenturio', { x: LAY.zenturio.x, z: LAY.zenturio.z, h: bodyH('p_zenturio', 2.3), card: 'leg_zenturio', id: 'person', name: 'Zenturio', hint: true, delay: 0.3 });
    const aqu = ctx.stand('p_aquilifer', { x: LAY.aquilifer.x, z: LAY.aquilifer.z, h: bodyH('p_aquilifer', 2.2), card: 'leg_aquilifer', id: 'person', name: 'Adlerträger', hint: true, delay: 0.32 });
    for (const a of [zen, aqu]) a.onWake = () => { a.tw.add(0.45, (t) => { a.hop = Math.sin(t * Math.PI) * 0.1; }, { done: () => { a.hop = 0; } }); app.audio.sfx('ping'); };
    ctx.stand('leg_marschgepaeck', { x: LAY.gepaeck.x, z: LAY.gepaeck.z, h: 2.4, card: 'leg_marschgepaeck', name: 'Marschgepäck', hint: true, hitPad: 0.3, delay: 0.34 });
    yield;

    // ---------------- der große Legionär mit den fünf Laschen
    buildGear(ctx, T);
    yield;
  },

  onActivate(ctx) {
    const T = ctx.spread.p3; if (!T) return;
    clearTimeout(T.timer);
    T.timer = setTimeout(() => {
      if (!ctx.spread.active || T.introDone || !T.lager || T.lager.dragging || T.lager.v > 0.02) return;
      if (ctx.app.calm) { T.lager.touched = true; T.lager.setValue(1, { snap: true }); T.introDone = true; } else { T.intro = true; T.introT = 0; }
    }, 1500);
  },
  onDeactivate(ctx) {
    const T = ctx.spread.p3; if (!T) return;
    clearTimeout(T.timer); T.intro = false;
  },
};
