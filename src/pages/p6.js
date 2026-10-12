// Station 6: Leben in einer römischen Stadt (Pompeji, 1. Jh. n. Chr.) – Mittagssonne, Straßenquerschnitt.
// Links: Bäckerei, Imbiss (Thermopolium), Mauer mit Graffiti, Brunnen; Thermen-Klappe, Wachstafel (Regler „Schultag“).
// Rechts: Laden, Wohnhaus mit offenem Hof und Regenbecken (Lasche „Haus öffnen“ hebt das Dach), Trittsteine über die Straße
// (Schieber „Trittsteine“: Karren fährt durch die Lücke, ein Kind hüpft über die Steine). Ruhiger Vesuv (ohne Rauch) im Hintergrund.
// Besitzer: Station 6. Texte: src/data/s6.de.js (page, cards).
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { PAGES_DE } from '../data/pages.de.js';
import { Popup, makeFlat, paperCard, poseAmt } from '../engine/popup.js';
import { sunGlow } from '../engine/effects.js';
import { lerp, clamp, smooth, TAU } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { blendePart } from '../art/rom/s6_build.js';
import { GEO, baseL, baseR } from './_p6_base.js';
import { canvasTex, stoneTex, stoneBox, roofTop, roofUnder, makeWax, thermenTop, thermenBack, paintMosaic, fernstadt } from './_p6_kit.js';

const IDX = 6;
const HS = 0.83;                         // Maßstab des Wohnhauses (Modell 8,2 m → 6,8 Einheiten)
const LS = 0.82;                         // Maßstab der Läden
const STONE = { x: 3.6, z: [0.1, 1.2, 2.3], w: 0.9, d: 0.6, h: 0.5 };
const KID = [[2.2, -0.75, 0], [3.6, 0.1, 0.5], [3.6, 1.2, 0.5], [3.6, 2.3, 0.5], [4.9, 3.0, 0]];   // Weg des hüpfenden Kindes (x, z, Höhe)
const CART = { x0: 2.5, x1: 10.0, z: GEO.lane };

export default {
  id: 'stadtleben',
  mood: mood({ key: '#fff0cf', keyI: 2.55, sky: '#ffeed2', gnd: '#a0603a', hemiI: 1.8, pos: [-9, 22, 9], rim: 0.05 }),
  motes: { colors: [[1, 0.92, 0.66], [1, 0.84, 0.58]], size: 0.08, alpha: 0.32, dx: 0.06, dy: 0.05, dz: 0.01, tw: 1.0, density: 0.7 },
  atmo: 'stadtleben',

  base() { const d = PAGES_DE[IDX]; return { L: baseL(d), R: baseR() }; },

  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R, G = GEO, H = G.house;
    const S6 = (ctx.spread.p6 = { open: 0, thermen: 0, kidV: 0 });
    const TAPSFX = { brunnen: 'wasser', kind: 'griffel', wachstafel: 'griffel', haendler: 'muenze', imbiss: 'menge', baecker: 'menge' };   // kleines Geräusch passend zur Karte
    const openCard = (id, x, voice) => { app.audio.sfx('tapp'); if (TAPSFX[id]) app.audio.sfx(TAPSFX[id]); if (voice) app.audio.voice(voice); app.openCardById(id, x); };
    const tapProp = (pop, id, voice) => { const fn = () => openCard(id, pop.group.position.x, voice); pop.pickMeshes = pop.fig ? pop.fig.hit : [pop.cut.mesh]; for (const m of pop.pickMeshes) m.userData.tap = fn; };
    const person = (id, o, card) => ctx.stand(id, { z: -1.3, facing: 1, card, id: 'person', name: o.name, hint: !!o.hint, ...o });

    // ---------------------------------------------------------------- Himmel, Sonne, Vesuv, ferne Stadt
    for (const [s, cx] of [['L', -5.975], ['R', 5.975]]) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-5.775, 5.775, 5.0, { fill: { stops: [[0, '#4f9fd6'], [0.45, '#8cc6e6'], [0.8, '#d8ecdf'], [1, '#fbe9bd']], dir: 'v' }, wave: 0.18, freq: 2.2, phase: 0.4 + k * 1.9, seed: 3 + k,
        deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,245,200,.55)', cx: s === 'L' ? 0.95 : 0.3, cy: 0.85, r: 0.9 }); dither(c, bb, '#fff', { n: 50, alpha: 0.1, size: 0.04, seed: 5 + k }); } }),
        { x: cx, z: -4.05, lean: -0.04, name: 'sky' + s, ppu: 56, border: 0.04 });
    }
    const sun = ctx.prop('sun_disc', { x: 3.4, y: 4.2, z: -3.9, h: 1.5, delay: 0.1, cast: false });
    const glow = sunGlow({ size: 7, color: 0xffe9a0 }); glow.position.set(0, 0.8, -0.06); sun.add(glow);
    ctx.onUpdate((dt, t) => glow.userData.update(t));
    const cl1 = ctx.prop('cloud_a', { x: -4.2, y: 3.9, z: -3.85, len: 2.8, delay: 0.2, cast: false });
    const cl2 = ctx.prop('cloud_b', { x: 9.4, y: 4.2, z: -3.85, len: 2.4, delay: 0.25, cast: false });
    ctx.onUpdate((dt, t) => { cl1.group.position.x = -4.2 + Math.sin(t * 0.05) * 1.3; cl2.group.position.x = 9.4 + Math.sin(t * 0.04 + 1) * 1.1; });
    const vesuv = ctx.prop('s6_vesuv', { x: 6.9, y: 1.1, z: -3.7, len: 9.4, delay: 0.06, cast: false }); tapProp(vesuv, 'vesuv');
    for (const [s, cx, seed] of [['L', -5.975, 3], ['R', 5.975, 8]]) ctx.flat(fernstadt(-5.775, 5.775, seed), { x: cx, z: -3.3, name: 'fern' + s, delay: 0.08, ppu: 60, border: 0.03 });
    yield;

    // ---------------------------------------------------------------- Häuserfront links: Bäckerei, Imbiss, Graffiti-Mauer, Brunnen
    const bak = ctx.prop('s6_laden_baecker', { x: -9.97, z: -2.0, h: 3.7 * LS, delay: 0.12 }); tapProp(bak, 'baecker');
    const imb = ctx.prop('s6_imbiss', { x: -5.77, z: -2.0, h: 3.5 * LS, delay: 0.14 }); tapProp(imb, 'imbiss');
    const gra = ctx.prop('s6_graffitiwand', { x: -2.7, z: -2.0, h: 2.74 * 0.85, delay: 0.16 }); tapProp(gra, 'graffiti');
    const fou = ctx.prop('s6_brunnen', { x: -1.0, z: -1.7, h: 1.62 * 0.9, delay: 0.18 }); tapProp(fou, 'brunnen');
    ctx.prop('s6_zypresse', { x: -7.9, z: -2.9, h: 3.8, delay: 0.2 });
    ctx.prop('s6_zypresse', { x: -3.4, z: -2.9, h: 3.3, delay: 0.22 });
    ctx.prop('s6_pinie', { x: -0.9, z: -3.0, h: 4.2, delay: 0.24 });
    yield;

    // ---------------------------------------------------------------- Häuserfront rechts: Laden, Pinie; Wohnhaus
    const han = ctx.prop('s6_laden_haendler', { x: 2.5, z: -2.0, h: 3.7 * LS, delay: 0.14 }); tapProp(han, 'haendler');
    ctx.prop('s6_pinie', { x: 4.55, z: -2.9, h: 4.2, delay: 0.24 });
    ctx.prop('s6_zypresse', { x: 11.7, z: -3.2, h: 3.9, delay: 0.22 });
    const inn = ctx.prop('s6_haus_innen', { x: H.cx, z: -3.1, len: 8.2 * HS, delay: 0.16 }); tapProp(inn, 'haus');
    const wall = ctx.prop('s6_hauswand', { x: H.cx, z: H.zFront - 0.04, len: 8.2 * HS, delay: 0.2 }); tapProp(wall, 'haus');
    yield;

    // Regenbecken (Impluvium): marmorner Rand und bewegtes Wasser
    const I = G.imp, imp = new Popup(R, { x: I.x, z: I.z, delay: 0.2, name: 'impluvium' });
    const rimMat = new THREE.MeshLambertMaterial({ color: 0xefe6d2 });
    const rim = (w, d, x, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, d), rimMat); b.position.set(x, 0.07, z); b.castShadow = true; b.receiveShadow = true; imp.add(b); b.userData.tap = () => openCard('haus', I.x); return b; };
    const rims = [rim(I.w + 0.2, 0.1, 0, -I.d / 2 - 0.05), rim(I.w + 0.2, 0.1, 0, I.d / 2 + 0.05), rim(0.1, I.d, -I.w / 2 - 0.05, 0), rim(0.1, I.d, I.w / 2 + 0.05, 0)];
    const waterTex = canvasTex(256, 128, (g, W, Hh) => { g.fillStyle = '#4c8fc0'; g.fillRect(0, 0, W, Hh); g.strokeStyle = 'rgba(235,248,255,.5)'; g.lineWidth = 3; for (let i = 0; i < 9; i++) { const y = (i + 0.5) * Hh / 9; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 16) g.lineTo(x, y + Math.sin(x * 0.09 + i * 1.7) * 5); g.stroke(); } }, { repeat: true });
    waterTex.repeat.set(2, 1);
    const water = new THREE.Mesh(new THREE.PlaneGeometry(I.w, I.d), new THREE.MeshLambertMaterial({ map: waterTex })); water.rotation.x = -Math.PI / 2; water.position.y = 0.055; water.receiveShadow = true; imp.add(water);
    R.addPopup(imp); imp.pickMeshes = [...rims, water]; water.userData.tap = () => openCard('haus', I.x);
    ctx.onUpdate((dt, t) => { waterTex.offset.x = (t * 0.03) % 1; waterTex.offset.y = Math.sin(t * 0.5) * 0.02; });

    // Dach als Klappdeckel mit hängender Blende (klappt beim Öffnen unter das Dach)
    const LW = 7.0, LD = H.zFront - H.zBack, LY = (0.8 + 1.95) * HS;
    const lidRoot = new THREE.Group(); R.add(lidRoot);
    const hinge = new THREE.Group(); hinge.position.set(H.cx, LY, H.zBack); lidRoot.add(hinge);
    R.onUpdate(() => { const e = clamp(inn.eff, 0, 1); lidRoot.visible = e > 0.01; lidRoot.scale.y = Math.max(0.001, e); });
    const lid = paperCard(LW, LD, roofTop(LW, LD), roofUnder(LW, LD), { depth: 0.08 }); hinge.add(lid);
    const skirtG = new THREE.Group(); skirtG.position.set(0, 0, LD); lid.add(skirtG);
    const skirt = makeFlat(blendePart(), { ws: HS, ppu: 100, thickness: 0.03, border: 0.02, name: 'p6:blende', maxTex: 1536 });
    skirt.mesh.position.set(-4.1 * HS, -1.95 * HS, 0); skirt.mesh.castShadow = false; skirtG.add(skirt.mesh); R.own(skirt);
    const lidTap = () => { openCard('haus', H.cx); };
    for (const m of [lid.userData.top, lid.userData.bottom, skirt.mesh]) m.userData.tap = lidTap;
    R.taps.push({ mesh: lid.userData.top }, { mesh: lid.userData.bottom }, { mesh: skirt.mesh });
    yield;

    // Mosaik „Achtung, Hund!“ auf der Schwelle des Hauses
    const mos = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.9), new THREE.MeshLambertMaterial({ map: canvasTex(540, 360, paintMosaic) }));
    mos.rotation.x = -Math.PI / 2; mos.position.set(H.cx, 0.018, -0.2); mos.receiveShadow = true; R.add(mos);
    R.addTap(mos, () => { app.audio.sfx('tapp'); app.audio.voice('hund'); app.openCardById('hund', H.cx); });
    yield;

    // ---------------------------------------------------------------- Menschen
    const baeck = person('s6_baecker', { x: -10.9, z: -1.2, h: 1.65, delay: 0.3, name: 'Bäcker', hint: true }, 'baecker');
    const kundin = person('s6_kundin', { x: -9.5, z: -1.1, h: 1.6, facing: -1, delay: 0.32, name: 'Kundin' }, 'baecker'); kundin.setFacing(-1);
    const wirt = person('s6_wirt', { x: -6.9, z: -1.25, h: 1.65, delay: 0.3, name: 'Imbiss', hint: true }, 'imbiss');
    const kunde = person('s6_kunde', { x: -5.55, z: -1.15, h: 1.65, facing: -1, delay: 0.34, name: 'Kunde' }, 'imbiss'); kunde.setFacing(-1);
    const traeger = person('s6_traeger', { x: -1.9, z: -0.9, h: 1.65, delay: 0.34, name: 'Wasserträger' }, 'brunnen');
    const haendler = person('s6_haendler', { x: 1.3, z: -1.2, h: 1.65, delay: 0.3, name: 'Händler', hint: true }, 'haendler');
    const kind = person('s6_kind_tafel', { x: -3.2, z: 0.25, h: 1.25, delay: 0.36, name: 'Kind mit Wachstafel', hint: true }, 'kind');
    const hopper = person('s6_kind_huepfer', { x: KID[0][0], z: KID[0][1], h: 1.25, delay: 0.36, name: 'Kind' }, 'trittsteine');
    hopper.popup.yawG.rotation.y = -0.5;
    // Haus: Familie im Hof (erst sichtbar, wenn das Dach offen ist; durch die Tür blitzt der Hof schon durch)
    person('s6_hausherr', { x: 6.1, z: -1.65, h: 1.6, delay: 0.4, name: 'Hausherr' }, 'haus');
    person('s6_hausfrau', { x: 6.95, z: -1.55, h: 1.55, delay: 0.42, name: 'Hausherrin' }, 'haus').setFacing(1);
    const hk = person('s6_kind_haus', { x: 10.2, z: -1.5, h: 1.15, facing: -1, delay: 0.44, name: 'Kind' }, 'haus'); hk.setFacing(-1);
    yield;

    // Gans im Innenhof (rotes Kopftuch): watschelt vor dem Regenbecken, durch die Tür zu sehen
    const goose = ctx.stand('gans6', { x: H.cx, z: -1.4, len: 1.05, facing: 1, delay: 0.46, hidden: true, hint: false, hitPad: 0.25, card: 'gans6' });
    goose.walk = { x: H.cx, dir: 1, ph: 0 };
    goose.behaviors.push((dt, t, a) => {
      const w = a.walk, span = S6.open > 0.6 ? 1.6 : 0.5;
      w.x += w.dir * dt * 0.28; if (w.x > H.cx + span) { w.dir = -1; a.setFacing(-1); } else if (w.x < H.cx - span) { w.dir = 1; a.setFacing(1); }
      if (S6.open < 0.6) w.x = clamp(w.x, H.cx - 0.45, H.cx + 0.45);
      a.popup.group.position.x = w.x; w.ph += dt * 6.5;
      const s = Math.sin(w.ph); a.fig.rotatePart('legA', s * 0.42); a.fig.rotatePart('legB', -s * 0.42); a.hop = Math.abs(s) * 0.03;
      poseAmt(a.fig, 'neck', 0.25 + 0.2 * Math.sin(w.ph * 0.5));
    });
    goose.onWake = (a) => { a.tw.add(0.7, (k) => { a.hop += Math.sin(k * Math.PI) * 0.3; poseAmt(a.fig, 'wing', Math.sin(k * Math.PI)); poseAmt(a.fig, 'jaw', Math.sin(k * 6) * 0.5 + 0.5); }, { done: () => poseAmt(a.fig, 'wing', 0) }); };
    yield;

    // ---------------------------------------------------------------- Trittsteine (echte Quader) und Karren
    const stex = stoneTex();
    STONE.z.forEach((z, i) => {
      const pop = new Popup(R, { x: STONE.x, z, delay: 0.3 + i * 0.05, name: 'stein' + i });
      const b = stoneBox(STONE.w, STONE.h, STONE.d, stex); pop.add(b); R.addPopup(pop); pop.pickMeshes = [b]; b.userData.tap = () => openCard('trittsteine', STONE.x);
    });
    const cart = ctx.stand('s6_karren', { x: CART.x0, z: CART.z, len: 4.2, facing: 1, delay: 0.38, card: 'trittsteine', id: 'esel', name: 'Karren' });
    cart.dist = 0; cart.lastX = CART.x0;
    yield;

    // ---------------------------------------------------------------- Schultag: Wachstafel mit Griffel
    const wax = makeWax(1.7, 1.15), WP = { x: -1.2, z: 0.9 };
    const waxPop = new Popup(L, { x: WP.x, z: WP.z, delay: 0.34, lean: 0.12, name: 'wachstafel' }); waxPop.add(wax.group); L.addPopup(waxPop); waxPop.pickMeshes = wax.hits;
    for (const m of wax.hits) m.userData.tap = () => openCard('wachstafel', WP.x);
    wax.draw(0);

    // ---------------------------------------------------------------- Thermen-Klappe (links vorn)
    const T = G.thermen;
    const hingeT = new THREE.Group(); hingeT.position.set(T.x + T.w / 2, 0.03, T.z);
    const flap = paperCard(T.w, T.h, thermenTop(T.w, T.h), thermenBack(T.w, T.h), { depth: 0.05 }); hingeT.add(flap); L.add(hingeT);
    let tTarget = 0;
    const toggleT = () => { tTarget = tTarget ? 0 : 1; app.audio.sfx(tTarget ? 'flapOpen' : 'flapClose'); if (tTarget) setTimeout(() => { if (tTarget) app.openCardById('thermen'); }, 450); };
    L.addTap(flap.userData.top, toggleT);
    flap.userData.bottom.userData.tap = () => { tTarget = 0; app.audio.sfx('flapClose'); }; L.taps.push({ mesh: flap.userData.bottom });
    L.onUpdate((dt) => { S6.thermen += (tTarget - S6.thermen) * (1 - Math.exp(-dt * 6)); hingeT.rotation.x = -S6.thermen * 1.38; });
    ctx.spread.flap = { close() { tTarget = 0; }, open() { tTarget = 1; }, get v() { return S6.thermen; } };
    yield;

    // ---------------------------------------------------------------- Laschen und Regler
    const ctlHaus = ctx.control('R', { id: 'haus', label: 'Haus öffnen', a: [7.0, 3.65], b: [10.4, 3.65], size: [2.5, 1.0], color: '#b5402b', value: 0, springBack: false, hold: true, ticks: 12 });
    const ctlStein = ctx.control('R', { id: 'trittsteine', label: 'Trittsteine', a: [1.9, 3.65], b: [4.5, 3.65], size: [2.4, 1.0], color: '#a3592f', value: 0, springBack: false, hold: true, ticks: 14 });
    const ctlSchule = ctx.control('L', { id: 'schultag', label: 'Schultag', a: [-4.8, 3.65], b: [-1.9, 3.65], size: [2.4, 1.0], color: '#8a3a4a', value: 0, springBack: false, hold: true, ticks: 12 });

    let horn = false;
    ctlHaus.on((v) => {
      const o = smooth(clamp(v)); S6.open = o; hinge.rotation.x = -o * 1.36;
      skirtG.rotation.x = smooth(clamp((v - 0.1) / 0.55)) * (Math.PI / 2);
      if (v > 0.92 && !horn) { horn = true; app.audio.sfx('wasser'); app.audio.sfx('chime'); } if (v < 0.3) horn = false;
    });
    ctlHaus.onGrab = () => app.audio.sfx('grab'); ctlHaus.onTick = (v) => app.audio.sfx('slide', { v }); ctlHaus.onRelease = () => app.audio.sfx('snap');

    const lerpK = (u) => { // Weg des Kindes: Abschnitt und Anteil
      const n = KID.length - 1, k = Math.min(n - 1, Math.floor(u * n)), f = u * n - k; return [k, f];
    };
    ctlStein.on((v) => {
      S6.kidV = v;
      // Karren
      const x = lerp(CART.x0, CART.x1, clamp(v)), dx = x - cart.lastX; cart.lastX = x; cart.popup.group.position.x = x;
      if (Math.abs(dx) > 1e-4) {
        cart.dist += Math.abs(dx); cart.fig.rotatePart('wheel', -cart.dist / 0.47);
        const ph = cart.dist * 6.0, sw = 0.4 * Math.sin(ph);
        cart.fig.rotatePart('legA', sw); cart.fig.rotatePart('legC', -sw); cart.fig.rotatePart('legB', -sw); cart.fig.rotatePart('legD', sw);
        cart.hop = Math.abs(Math.sin(ph * 0.5)) * 0.02;
      } else cart.hop = 0;
      // Kind: hüpft von Stein zu Stein
      const u = clamp((v - 0.12) / 0.76), [k, f] = lerpK(u), a = KID[k], b = KID[k + 1], e = smooth(f);
      const px = lerp(a[0], b[0], e), pz = lerp(a[1], b[1], e), py = lerp(a[2], b[2], e);
      hopper.popup.group.position.set(px, py, pz);
      const jump = (u > 0 && u < 1) ? Math.sin(Math.PI * f) * 0.34 : 0; hopper.hop = jump;
      const air = jump > 0.04 ? 1 : 0; hopper.fig.rotatePart('legA', air * 0.5); hopper.fig.rotatePart('legB', -air * 0.4); hopper.fig.rotatePart('armA', air * 1.3); hopper.fig.rotatePart('armB', air * 0.5);
    });
    ctlStein.onGrab = () => app.audio.sfx('grab'); ctlStein.onTick = (v) => { app.audio.sfx('rad', { v }); app.audio.sfx('footstep', { v }); }; ctlStein.onRelease = () => app.audio.sfx('snap');
    ctlStein.setValue(0, { silent: false, snap: true });

    ctlSchule.on((v) => { wax.draw(clamp(v)); wax.sty.position.set(wax.tipX ?? 0, (wax.tipY ?? 1.2) + 0.03, 0.1); });
    ctlSchule.onGrab = () => app.audio.sfx('grab'); ctlSchule.onTick = () => app.audio.sfx('griffel'); ctlSchule.onRelease = () => app.audio.sfx('snap');
    ctlSchule.setValue(0, { silent: false, snap: true });
    ctlHaus.setValue(0, { silent: false, snap: true });

    // ---------------------------------------------------------------- Atmosphäre: Dampf am Imbiss, Wasserspritzer am Brunnen, Staub unter den Rädern
    const fxK = () => (app.stage && app.stage.tier ? app.stage.tier.fx : 0.7) * (app.calm ? 0.4 : 1);
    let steamT = 0, dropT = 0, rutT = 0;
    ctx.onUpdate((dt, t) => {
      if (!ctx.spread.active || !app.fx) return;
      steamT -= dt; dropT -= dt;
      if (steamT <= 0) { steamT = 0.55 / Math.max(0.2, fxK()); const sx = -5.77 + (Math.random() - 0.5) * 2.6, w = ctx.world(sx, 1.25, -1.95); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z + 0.2, vx: 0.03, vy: 0.28, vz: 0.02, life: 1.6, size: 0.3, alpha: 0.22, color: [1, 0.98, 0.94], drag: 0.6, grow: 1.6 }); }
      if (dropT <= 0) { dropT = 0.18 / Math.max(0.2, fxK()); const w = ctx.world(-1.0 + 0.3, 0.5, -1.7); app.fx.dust.emit({ x: w.x + (Math.random() - 0.5) * 0.05, y: w.y, z: w.z + 0.15, vx: (Math.random() - 0.5) * 0.12, vy: 0.1, vz: 0.02, life: 0.6, size: 0.07, alpha: 0.7, color: [0.75, 0.9, 1], drag: 0.3, grav: -2.2 }); }
      if (S6.kidV > 0.01 && S6.kidV < 0.99 && Math.abs(cart.lastX - (cart.prevX ?? cart.lastX)) > 0.002) {
        rutT -= dt; if (rutT <= 0) { rutT = 0.07; const w = ctx.world(cart.lastX - 0.5, 0.08, CART.z + 0.1); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: -0.4 - Math.random() * 0.3, vy: 0.3 + Math.random() * 0.3, vz: 0, life: 0.8, size: 0.3, alpha: 0.4 * fxK(), color: [0.8, 0.7, 0.55], drag: 1.5, grow: 2 }); }
      }
      cart.prevX = cart.lastX;
    });
  },

  onActivate(ctx) { const S6 = ctx.spread.p6; if (S6) S6.thermen = S6.thermen || 0; },
  onDeactivate(ctx) { if (ctx.spread.flap) ctx.spread.flap.close(); },
};
