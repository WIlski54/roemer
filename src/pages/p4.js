// Station 4 · „Vom Konsul zum Kaiser“ (133 v. Chr. bis 14 n. Chr.): geteilte Bühne.
// Links die Republik im Streit (Forum in der Dämmerung, Senatoren in Grüppchen, Münzwerkstatt), rechts der Anfang der Kaiserzeit (Palast, Lorbeer, Morgenlicht);
// dazwischen schlängelt sich der Rubikon als Papierband über die rechte Seite.
// Zum Anfassen: Schieber „Rubikon“ (Caesars Truppe zieht durch den Fluss, 49 v. Chr.), Lasche „Lorbeerkranz“ (ein Senator bringt Augustus den Kranz, 27 v. Chr.),
// Drehscheibe „Münze“ (Denar umdrehen, links vorn). Antippbar mit Karte: Caesar, Augustus, Kleopatra, Rubikon, Denar, Lorbeerkranz; Gans unter dem Denar-Stapel.
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { printLabel, blotches, speckles, grassTufts, pebbles, roundRect } from '../engine/pagepaint.js';
import { lerp, clamp, smooth, TAU, mulberry32 } from '../engine/util.js';
import { Popup, specBBox } from '../engine/popup.js';
import { ANIMALS } from '../art/registry.js';
import { sunGlow, softTexture } from '../engine/effects.js';
import { panelPart, leftCard } from './common.js';
import { RIVER, cx as riverX, makeRibbon } from './_p4_fluss.js';
import { makeKranz } from './_p4_kranz.js';
import { makeMuenze } from './_p4_muenze.js';
import { DUSK, DAWN, duskSky, dawnSky, farDusk, farDawn, wallDusk, hedgeDawn, paving, pool } from './_p4_kulisse.js';

// ---------------------------------------------------------------- Maße (Seitenkoordinaten)
const K = 1.28;                                             // Welteinheiten je Modellmeter bei Personen
const SUN = { x: 4.0, y: 2.55 };                            // aufgehende Sonne (Welt-x) im Himmel rechts
const PAL = { x: 8.8, z: -2.2, ws: 0.86 };                  // Palast
const AUG = { x: 8.8, z: -0.7 };                            // Augustus auf dem Teppich
const KR = { x0: 11.2, x1: 9.45, z: -0.15 };                // Weg des Senators mit dem Kranz
const TROOP = { x0: 2.9, x1: 7.4 };                         // Weg des Anführers (Caesar) beim Schieber „Rubikon“
const WS = { x: -3.4, z: 0.55 };                            // Münzwerkstatt (Mitte, Rückwand)
const BENCH = { x: -3.4, z: 1.2, ws: 1.16 };                // Werkbank
const TORCH = [[-11.3, 0.25], [-8.6, -0.55], [-1.15, -0.2]];  // Fackeln
const hOf = (id) => specBBox(ANIMALS[id]()).h * K;          // Weltgröße einer Person (Modellmaß mal K)
const lenOf = (id, ws) => specBBox(ANIMALS[id]()).w * ws;   // Weltbreite für Gebäude mit Maßstab ws

export default {
  id: 'kaiser',
  mood: mood({ key: '#ffd6a0', keyI: 2.15, sky: '#ecc9c4', gnd: '#6a4a5a', hemiI: 1.7, pos: [-8, 16, 11], rim: 0.14 }),
  motes: { colors: [[1, 0.88, 0.6], [1, 0.78, 0.55]], size: 0.085, alpha: 0.3, dx: 0.05, dy: 0.04, dz: 0.01, tw: 1.0, density: 0.6 },
  atmo: 'kaiser',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    return {
      L: {
        paper: '#f1e4d0', ground: { back: '#9a84b0', front: '#7a6698' }, margin: 0.3, pageNo: 9, seed: 14,
        draw(ctx, m) {
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 20, rmin: 0.8, rmax: 2.4, colors: ['rgba(255,170,120,.10)', 'rgba(50,30,110,.12)'], seed: 6 });
          paving(m, { x0: -11.7, x1: -0.3, z0: -2.0, z1: 4.0, seed: 3 });
          // Fackelschein auf dem Pflaster
          for (const [x, z] of TORCH) pool(m, x, z + 0.35, 1.7, 'rgba(255,190,110,.42)');
          pool(m, WS.x, 1.7, 2.4, 'rgba(255,200,130,.22)');
          speckles(m, { x0: -11.7, x1: -0.3, z0: -2.0, z1: 4.0, n: 160, color: 'rgba(40,20,70,.2)', size: 0.03, seed: 8 });
          leftCard(null, 4)(ctx, m);
        },
      },
      R: {
        paper: '#f6ead0', ground: { back: '#f1d9a6', front: '#e3bf7c' }, margin: 0.3, pageNo: 10, seed: 15,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.7, rmax: 2.0, colors: ['rgba(255,244,196,.18)', 'rgba(140,100,50,.08)'], seed: 9 });
          // grüne Ufer links und rechts (folgen dem Fluss)
          const bank = (hw, col, shadow) => {
            ctx.save(); if (shadow) { ctx.shadowColor = 'rgba(40,30,10,.35)'; ctx.shadowBlur = 0.1 * S; }
            ctx.fillStyle = col; ctx.beginPath();
            for (let z = RIVER.z0; z <= RIVER.z1 + 0.01; z += 0.2) { const [X, Y] = m.pt(riverX(z) - hw, z); if (z === RIVER.z0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); }
            for (let z = RIVER.z1; z >= RIVER.z0 - 0.01; z -= 0.2) { const [X, Y] = m.pt(riverX(z) + hw, z); ctx.lineTo(X, Y); }
            ctx.closePath(); ctx.fill(); ctx.restore();
          };
          bank(RIVER.hw + 1.7, 'rgba(150,190,100,.55)', false);
          bank(RIVER.hw + 0.34, '#b79c6e', true);
          bank(RIVER.hw + 0.14, '#6f8a6a', false);
          grassTufts(m, { x0: 0.5, x1: 3.0, z0: -3, z1: 3.6, n: 14, color: '#7aa24a', h: 0.26, seed: 5, blades: 4, alpha: 0.7 });
          grassTufts(m, { x0: 5.6, x1: 11.6, z0: 0.9, z1: 3.7, n: 14, color: '#8aae52', h: 0.24, seed: 6, blades: 4, alpha: 0.65 });
          pebbles(m, { x0: 0.4, x1: 11.6, z0: 1.2, z1: 3.9, n: 9, seed: 7 });
          // Blümchen auf den Wiesen und ein Pfad aus Trittplatten vom Palasthof nach vorn
          { const r = mulberry32(21); for (let i = 0; i < 46; i++) { const left = i % 3 === 0; const x = left ? 0.5 + r() * 2.6 : 5.8 + r() * 5.6, z = left ? -2.6 + r() * 5.6 : 0.9 + r() * 2.9; if (!left && Math.abs(x - 8.8) < 0.6 && z < 0.9) continue; const col = ['#fff4d8', '#e9785a', '#f0b43a', '#ffffff'][i % 4]; for (let k = 0; k < 4; k++) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(m.x(x + (r() - 0.5) * 0.16), m.z(z + (r() - 0.5) * 0.1), 0.026 * S, 0, TAU); ctx.fill(); } } }
          { ctx.save(); const rr = mulberry32(5); for (let i = 0; i < 6; i++) { const x = 8.8 + (i % 2 ? 0.28 : -0.28) + (rr() - 0.5) * 0.1, z = 0.95 + i * 0.4; ctx.shadowColor = 'rgba(70,45,10,.3)'; ctx.shadowBlur = 0.05 * S; ctx.fillStyle = i % 2 ? '#e6d3a4' : '#dcc690'; roundRect(ctx, m.x(x - 0.3), m.z(z - 0.15), 0.6 * S, 0.3 * S, 0.08 * S); ctx.fill(); } ctx.restore(); }
          // Palasthof: heller Marmor mit goldenem Rand, Teppich zur Tür
          const px0 = 5.75, px1 = 11.85, pz0 = -2.45, pz1 = 0.5;
          ctx.save(); ctx.shadowColor = 'rgba(60,40,10,.3)'; ctx.shadowBlur = 0.08 * S; ctx.fillStyle = '#f4ead2'; roundRect(ctx, m.x(px0), m.z(pz0), (px1 - px0) * S, (pz1 - pz0) * S, 0.12 * S); ctx.fill(); ctx.restore();
          paving(m, { x0: px0, x1: px1, z0: pz0, z1: pz1, tw: 0.8, th: 0.55, stroke: 'rgba(150,115,70,.3)', a: 'rgba(255,255,255,.22)', b: 'rgba(200,160,100,.10)', seed: 11 });
          ctx.strokeStyle = '#c9a04a'; ctx.lineWidth = 0.035 * S; roundRect(ctx, m.x(px0), m.z(pz0), (px1 - px0) * S, (pz1 - pz0) * S, 0.12 * S); ctx.stroke();
          const cw = 0.95, cx0 = AUG.x - cw / 2, cz0 = pz0 + 0.05, cz1 = pz1 + 0.35;
          ctx.save(); ctx.shadowColor = 'rgba(50,10,30,.4)'; ctx.shadowBlur = 0.07 * S; ctx.fillStyle = '#7b2d5b'; ctx.fillRect(m.x(cx0), m.z(cz0), cw * S, (cz1 - cz0) * S); ctx.restore();
          ctx.strokeStyle = '#e8bc3c'; ctx.lineWidth = 0.04 * S; ctx.strokeRect(m.x(cx0 + 0.08), m.z(cz0 + 0.05), (cw - 0.16) * S, (cz1 - cz0 - 0.1) * S);
          ctx.fillStyle = '#e8bc3c'; for (let z = cz0 + 0.3; z < cz1 - 0.2; z += 0.5) { ctx.beginPath(); ctx.moveTo(m.x(AUG.x), m.z(z - 0.12)); ctx.lineTo(m.x(AUG.x + 0.12), m.z(z)); ctx.lineTo(m.x(AUG.x), m.z(z + 0.12)); ctx.lineTo(m.x(AUG.x - 0.12), m.z(z)); ctx.closePath(); ctx.fill(); }
          // Morgenlicht
          pool(m, 3.6, -1.2, 3.4, 'rgba(255,240,180,.35)'); pool(m, 9.0, 1.4, 3.6, 'rgba(255,236,170,.2)');
          printLabel(m, 'Der Rubikon, 49 v. Chr.', 4.45, 3.12, { size: 0.19, color: 'rgba(40,70,110,.65)', italic: true, bold: false });
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const T = (ctx.spread.p4 = { v: 0, kranzDone: false, hammerT: 0, hits: 0, splashT: 0 });
    const tapFig = (pop, fn) => { pop.pickMeshes = pop.fig.hit; for (const mm of pop.fig.hit) mm.userData.tap = fn; };
    const tapFlat = (pop, fn) => { pop.pickMeshes = [pop.cut.mesh]; pop.cut.mesh.userData.tap = fn; };
    const card = (id, x) => () => { app.audio.sfx('tapp'); app.openCardById(id, x); };
    const person = (id, o) => ctx.stand(id, { h: hOf(id), ...o });

    // ---------------- Himmel, Fernband, Nahband (je Seite)
    const sky = {};
    for (const [s, x] of [['L', -5.975], ['R', 5.975]]) {
      const isL = s === 'L';
      sky[s] = ctx.flat(panelPart(-5.775, 5.775, 5.0, { fill: { stops: isL ? DUSK : DAWN, dir: 'v' }, wave: 0.2, freq: 2.4, phase: isL ? 0.6 : 2.3, seed: isL ? 3 : 4, deco: isL ? duskSky : dawnSky(SUN.x - 5.975, SUN.y) }),
        { x, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 56, border: 0.04 });
    }
    const sun = sunGlow({ size: 4.6, color: 0xffd27a, rays: true, opacity: 0.8 }); sun.position.set(SUN.x - 5.975, SUN.y, 0.06); sky.R.add(sun);
    yield;
    for (const [s, x] of [['L', -5.975], ['R', 5.975]]) {
      const isL = s === 'L';
      ctx.flat(panelPart(-5.5, 5.5, 2.5, { fill: isL ? { top: '#76629a', bottom: '#4e4376' } : { top: '#e6c297', bottom: '#c3946c' }, wave: 0.32, freq: 1.7, phase: isL ? 1.1 : 2.9, seed: isL ? 12 : 13, deco: isL ? farDusk : farDawn }),
        { x: x + (isL ? 0.3 : -0.3), z: -3.4, name: 'far' + s, delay: 0.05, ppu: 50, border: 0.03 });
      ctx.flat(panelPart(-5.5, 5.5, isL ? 1.15 : 0.95, { fill: isL ? { top: '#b69cc0', bottom: '#8a6f98' } : { top: '#a8c96c', bottom: '#6f9b4a' }, wave: isL ? 0.04 : 0.1, freq: isL ? 2 : 3, phase: isL ? 0.5 : 1.9, seed: isL ? 14 : 15, scallop: !isL, step: 0.2, deco: isL ? wallDusk : hedgeDawn }),
        { x: x + (isL ? -0.2 : 0.2), z: -2.55, name: 'near' + s, delay: 0.08, ppu: 56, border: 0.03 });
    }
    yield;

    // ---------------- Links: Forum in der Dämmerung (Tempel, Kurie, Zypressen, Fackeln)
    ctx.prop('s4_tempel', { x: -9.7, z: -2.1, len: lenOf('s4_tempel', 0.95), variant: { tone: 'abend', n: 6, w: 3.6 }, delay: 0.1, border: 0.04 });
    ctx.prop('s4_kurie', { x: -5.2, z: -2.1, len: lenOf('s4_kurie', 0.95), variant: { tone: 'abend' }, delay: 0.14, border: 0.04 });
    ctx.prop('s4_zypresse', { x: -7.55, z: -2.0, h: 3.5, variant: { tone: 'abend', seed: 2 }, delay: 0.16 });
    ctx.prop('s4_zypresse', { x: -11.55, z: -2.3, h: 3.2, variant: { tone: 'abend', seed: 5 }, delay: 0.18 });
    ctx.prop('s4_zypresse', { x: -0.95, z: -2.0, h: 3.0, variant: { tone: 'abend', seed: 8 }, delay: 0.2 });
    const torches = TORCH.map(([x, z], i) => {
      const pop = ctx.prop('s4_fackel', { x, z, h: 2.1, delay: 0.2 + i * 0.03 });
      const fy = pop.fig.anchors.flame ? pop.fig.anchors.flame.y : 1.8;
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: softTexture(), color: 0xffa855, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false }));
      glow.position.set(0, fy, 0.12); glow.renderOrder = 4; pop.fig.group.add(glow);
      return { pop, glow, fy, ph: i * 2.1 };
    });
    yield;

    // ---------------- Links: Senatoren im Streit (zwei Dreiergrüppchen)
    const SEN = [
      { id: 's4_senator1', x: -10.6, z: -1.35, f: 1, base: 1.1, amp: 0.55, fr: 1.7, ph: 0 },
      { id: 's4_senator2', x: -9.5, z: -1.2, f: -1, base: 0.9, amp: 0.7, fr: 1.4, ph: 2.2 },
      { id: 's4_senator3', x: -10.1, z: -0.4, f: 1, base: 0.5, amp: 0.4, fr: 1.1, ph: 4.0 },
      { id: 's4_senator4', x: -7.55, z: -1.4, f: 1, base: 1.0, amp: 0.6, fr: 1.5, ph: 1.0 },
      { id: 's4_senator5', x: -6.5, z: -1.25, f: -1, base: 1.2, amp: 0.5, fr: 1.9, ph: 3.1 },
      { id: 's4_senator6', x: -7.05, z: -0.3, f: -1, base: 0.4, amp: 0.45, fr: 1.2, ph: 5.0 },
    ];
    SEN.forEach((s, i) => {
      const a = person(s.id, { x: s.x, z: s.z, facing: s.f, delay: 0.26 + i * 0.03, card: null, hint: false, name: 'Senator', hitPad: 0.2 });
      a.behaviors.push((dt, t) => {
        if (a.popup.eff < 0.7) return;
        const k = app.calm ? 0.45 : 1, w = Math.sin(t * s.fr + s.ph), burst = Math.max(0, Math.sin(t * 0.55 + s.ph)) ; // Redeschübe
        a.fig.rotatePart('armA', s.base + s.amp * k * (0.5 + 0.5 * w) * (0.35 + 0.65 * burst) - 0.15);
        a.fig.rotatePart('armB', -0.1 + 0.15 * k * Math.sin(t * s.fr * 0.7 + s.ph + 1));
      });
    });
    yield;

    // ---------------- Links: Münzwerkstatt (Gerüst, Werkbank, Denar-Stapel, Amboss, Münzer, Säcke, Gans)
    const stall = ctx.prop('s4_werkstatt', { x: WS.x, z: WS.z, len: lenOf('s4_werkstatt', 1.0), delay: 0.3, border: 0.04 });
    ctx.prop('s4_werkbank', { x: BENCH.x, z: BENCH.z, len: lenOf('s4_werkbank', BENCH.ws), delay: 0.34, border: 0.035 });
    const benchTop = 1.25;
    const stack = ctx.prop('s4_muenzstapel', { x: BENCH.x + 0.25, z: BENCH.z + 0.045, y: benchTop, len: 0.66, delay: 0.38, border: 0.025 });
    tapFig(stack, card('denar', stack.group.position.x));
    const anvil = ctx.prop('s4_amboss', { x: BENCH.x + 0.95, z: BENCH.z + 0.045, y: benchTop, len: 0.8, delay: 0.38, border: 0.025 });
    ctx.prop('s4_sack', { x: BENCH.x - 1.75, z: 1.62, h: 0.62, delay: 0.4 });
    ctx.prop('s4_sack', { x: BENCH.x + 0.85, z: 1.62, h: 0.52, delay: 0.42, facing: -1 });
    const muenzer = person('s4_muenzer', { x: BENCH.x + 1.95, z: 1.1, facing: -1, delay: 0.34, card: 'denar', name: 'Münzer', hint: false });
    // die Gans: steht vor der Werkbank, genau unter dem Denar-Stapel (Lorbeerkranz am Kopf)
    const goose = ctx.stand('gans4', { x: BENCH.x + 0.25, z: 1.42, len: 0.72, facing: 1, delay: 0.5, hidden: true, hint: false, hitPad: 0.2, card: 'gans4', name: 'Gans' });
    yield;

    // ---------------- Links vorn: die große Münze zum Drehen (Drehscheibe „Münze“)
    const muenze = makeMuenze({ R: 0.62, yc: 1.55 });
    const coinPop = new Popup(L, { x: -0.85, z: 1.85, delay: 0.3, name: 'muenze' }); coinPop.add(muenze.group); L.addPopup(coinPop);
    const openDenar = () => { app.audio.sfx('muenze'); app.openCardById('denar', -0.85); };
    L.addTap(muenze.hit, () => { ctlM.setValue(ctlM.v < 0.5 ? 1 : 0); openDenar(); }, () => coinPop.eff > 0.7);
    for (const mm of [muenze.meshes[1], muenze.meshes[2], muenze.meshes[3]]) L.addTap(mm, () => { ctlM.setValue(ctlM.v < 0.5 ? 1 : 0); openDenar(); }, () => coinPop.eff > 0.7);
    yield;

    // ---------------- Rechts: der Rubikon als Papierband
    const rib = makeRibbon(); R.add(rib.mesh);
    R.addTap(rib.mesh, () => { app.audio.sfx('wasser'); app.openCardById('rubikon', RIVER.x); });
    yield;

    // ---------------- Rechts: Palast, Lorbeertöpfe, Zypressen, Kleopatra mit Palme
    const palast = ctx.prop('s4_palast', { x: PAL.x, z: PAL.z, len: lenOf('s4_palast', PAL.ws), variant: { tone: 'morgen' }, delay: 0.1, border: 0.04 });
    tapFig(palast, card('augustus', PAL.x));
    for (const x of [7.0, 10.6]) { const p = ctx.prop('s4_lorbeer', { x, z: -1.55, h: 2.3, variant: { tone: 'morgen', seed: x > 9 ? 2 : 1 }, delay: 0.2 }); tapFig(p, card('lorbeerkranz', x)); }
    ctx.prop('s4_zypresse', { x: 5.55, z: -2.3, h: 3.5, variant: { tone: 'morgen', seed: 3 }, delay: 0.22 });
    ctx.prop('s4_zypresse', { x: 11.65, z: -2.0, h: 3.1, variant: { tone: 'morgen', seed: 6 }, delay: 0.24 });
    ctx.prop('palm', { x: 0.8, z: -2.15, h: 3.7, delay: 0.26 });
    const kleo = person('s4_kleopatra', { x: 1.45, z: -1.1, facing: 1, delay: 0.3, card: 'kleopatra', name: 'Kleopatra' });
    yield;

    // ---------------- Rechts: Augustus und der Senator mit dem Lorbeerkranz
    const aug = person('s4_augustus', { x: AUG.x, z: AUG.z, facing: 1, delay: 0.32, card: 'augustus', name: 'Augustus' });
    const sen = person('s4_senator_kranz', { x: KR.x0, z: KR.z, facing: -1, delay: 0.34, card: null, hint: false, name: 'Senator', hitPad: 0.2 });
    const kranz = makeKranz({ R: 0.24 });
    aug.popup.pivot.add(kranz.group);
    const handMark = new THREE.Object3D(), headMark = new THREE.Object3D();
    { const arm = sen.fig.parts.armA, ah = sen.fig.anchors.hand; handMark.position.set(ah.x - arm.position.x, ah.y - arm.position.y, 0.1); arm.add(handMark); }
    { const hd = aug.fig.anchors.head; headMark.position.set(hd.x, hd.y + 0.06, 0.05); aug.fig.parts.body.add(headMark); }
    for (const mm of kranz.meshes) mm.userData.tap = () => { app.audio.sfx('tapp'); app.openCardById('lorbeerkranz', AUG.x); };
    R.taps.push(...kranz.meshes.map((mm) => ({ mesh: mm, enabled: () => aug.popup.eff > 0.7 })));
    yield;

    // ---------------- Rechts: Caesars Truppe (Schieber „Rubikon“)
    const TR = [
      { id: 's4_caesar', off: 0, z: 1.85, card: 'caesar', name: 'Caesar', hint: true },
      { id: 's4_aquilifer', off: -0.55, z: 1.35, card: 'rubikon', name: 'Adlerträger' },
      { id: 's4_legionaer1', off: -1.05, z: 1.85, card: 'rubikon', name: 'Legionär' },
      { id: 's4_legionaer2', off: -1.55, z: 1.35, card: 'rubikon', name: 'Legionär' },
      { id: 's4_legionaer3', off: -2.05, z: 1.85, card: 'rubikon', name: 'Legionär' },
    ].map((d, i) => {
      const a = person(d.id, { x: TROOP.x0 + d.off, z: d.z, facing: 1, delay: 0.4 + i * 0.03, card: d.card, name: d.name, hint: !!d.hint, hitPad: 0.25 });
      return { ...d, a, f: a.fig, dist: 0, ph: i * 0.8, moving: 0, idle: 0 };
    });
    yield;

    // ---------------- Steuerungen
    const ctlR = ctx.control('R', { id: 'rubikon', label: 'Rubikon', a: [1.3, 3.6], b: [4.9, 3.6], size: [2.1, 0.95], color: '#6b2a8f', value: 0, springBack: false, hold: true, ticks: 14 });
    const ctlK = ctx.control('R', { id: 'kranz', label: 'Lorbeerkranz', a: [7.7, 3.6], b: [10.3, 3.6], size: [2.7, 0.95], color: '#b8862d', value: 0, springBack: false, hold: true, ticks: 12 });
    const ctlM = ctx.control('L', { id: 'muenze', label: 'Münze', a: [-4.2, 3.6], b: [-1.5, 3.6], size: [2.0, 0.95], color: '#8a3a72', value: 0, snaps: [0, 1], ticks: 0 });
    ctx.spread.p4.ctl = { ctlR, ctlK, ctlM };
    for (const c of [ctlR, ctlK, ctlM]) { c.onGrab = () => app.audio.sfx('grab'); c.onRelease = () => app.audio.sfx('snap'); }
    ctlR.onTick = (v) => app.audio.sfx('marsch', { n: 2, v });
    ctlK.onTick = (v) => app.audio.sfx('slide', { v });
    ctlM.onSnap = () => { app.audio.sfx('muenze'); app.audio.sfx('chime'); };
    ctlM.onTick = (v) => app.audio.sfx('tick', { v });
    ctlK.on((v) => {
      if (v > 0.97 && !T.kranzDone) {
        T.kranzDone = true; app.audio.sfx('fanfare'); setTimeout(() => ctx.spread.active && app.audio.sfx('chime'), 1400);
        if (!app.calm) { const w = ctx.world(AUG.x, 2.4, AUG.z + 0.1); app.fx.glow.burst(Math.round(16 * app.stage.tier.fx), { x: w.x, y: w.y, z: w.z, life: 1.2, size: 0.12, alpha: 0.9, color: [1, 0.85, 0.4] }, { speed: 1.2, h: 0.6, up: 0.9 }); }
      }
      if (v < 0.6) T.kranzDone = false;
    });
    yield;

    // ---------------- Frame-Update: alles aus den Reglerwerten ableiten
    const vTmp = new THREE.Vector3(), vHand = new THREE.Vector3(), vHead = new THREE.Vector3();
    const bumps = []; for (let i = 0; i < TR.length; i++) bumps.push({ x: 0, z: 0, a: 0 });
    const place = (m, nx, dt, rate) => {
      const pos = m.a.popup.group.position, dx = nx - pos.x; pos.x = nx;
      if (Math.abs(dx) > 0.0004) { m.dist += Math.abs(dx); m.idle = 0; m.moving = Math.min(1, m.moving + 0.35); }
      else { m.idle += dt; if (m.idle > 0.1) m.moving = Math.max(0, m.moving - dt * 5); }
      const ph = m.dist * 7 + m.ph, sw = Math.sin(ph) * 0.42 * m.moving;
      m.f.rotatePart('legA', sw); m.f.rotatePart('legB', -sw); m.a.hop = Math.abs(Math.sin(ph)) * 0.05 * m.moving;
    };
    const kranzSen = { a: sen, f: sen.fig, dist: 0, ph: 0, moving: 0, idle: 0 };
    let armCaesar = 0, splashAcc = 0;
    ctx.onUpdate((dt, t) => {
      const act = ctx.spread.active;
      if (!act && !R.group.visible && !L.group.visible) return;     // unsichtbare Seite: nichts zu tun
      // --- Fluss: wogt, Wellen um die Watenden
      const vR = ctlR.sp.x, lead = lerp(TROOP.x0, TROOP.x1, vR);
      let inWater = 0;
      TR.forEach((m, i) => {
        place(m, lead + m.off, dt);
        const wx = lead + m.off, wz = m.z, inR = Math.abs(wx - riverX(wz)) < RIVER.hw + 0.25;
        bumps[i].x = wx; bumps[i].z = wz; bumps[i].a = inR ? 0.035 + 0.05 * m.moving : 0;
        if (inR && m.moving > 0.3) inWater++;
        // Wasserspritzer an den Füßen (sparsam)
        if (act && inR && m.moving > 0.5 && !app.calm && m.a.popup.eff > 0.7 && Math.random() < dt * 5 * app.stage.tier.fx) {
          const w = ctx.world(wx + 0.1, 0.12, wz + 0.05);
          app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.6, vy: 0.9 + Math.random() * 0.6, vz: 0.1, life: 0.5, size: 0.07, alpha: 0.7, color: [0.8, 0.93, 1], drag: 0.6, grav: 3.2, grow: 0.3 });
        }
      });
      splashAcc += dt; if (act && inWater && splashAcc > 0.7) { splashAcc = 0; app.audio.sfx('splash'); }
      rib.update(t, R.scrub(), bumps);
      // Caesar zeigt nach vorn, solange der Schieber bewegt wird
      armCaesar = lerp(armCaesar, ctlR.dragging ? 1.45 : 0.15, 1 - Math.exp(-dt * 6));
      TR[0].f.rotatePart('armA', armCaesar);

      // --- Lorbeerkranz: Senator geht zu Augustus, hebt den Kranz, setzt ihn auf
      const v = ctlK.sp.x, walk = smooth(clamp(v / 0.72));
      place(kranzSen, lerp(KR.x0, KR.x1, walk), dt);
      const raise = smooth(clamp((v - 0.42) / 0.38)), lower = smooth(clamp((v - 0.88) / 0.12));
      sen.fig.rotatePart('armA', 1.2 + 1.0 * raise - 0.7 * lower);
      const e = smooth(clamp((v - 0.74) / 0.2));
      handMark.updateWorldMatrix(true, false); headMark.updateWorldMatrix(true, false);
      handMark.getWorldPosition(vHand); headMark.getWorldPosition(vHead);
      vTmp.copy(vHand); vTmp.x += -0.08 * (1 - e); vTmp.y += 0.13 * (1 - e); vTmp.z += 0.07; vTmp.lerp(vHead, e);
      kranz.group.parent.updateWorldMatrix(true, false); kranz.group.parent.worldToLocal(vTmp);
      kranz.group.position.copy(vTmp); kranz.group.rotation.set(-1.15 * e, 0, 0); kranz.group.scale.setScalar(lerp(1.0, 0.86, e));

      // --- Münze: Drehscheibe (0 = Vorderseite, 1 = Rückseite)
      const mv = ctlM.sp.x;
      muenze.coin.rotation.y = Math.PI * mv + (app.calm ? 0 : Math.sin(t * 0.9) * 0.05);
      muenze.coin.position.y = muenze.yc + Math.sin(Math.PI * clamp(mv)) * 0.18;

      // --- Münzer hämmert: heben, schlagen, kurz ruhen
      T.hammerT += dt * (ctlM.dragging ? 1.8 : 1);
      const per = 1.8, ph = (T.hammerT % per) / per;
      let th, hit = false;
      if (ph < 0.58) th = lerp(1.7, 2.9, smooth(ph / 0.58)); else if (ph < 0.68) { th = lerp(2.9, 1.7, (ph - 0.58) / 0.1); } else th = 1.7 + 0.12 * Math.sin((ph - 0.68) * 30) * (1 - (ph - 0.68) / 0.32);
      muenzer.fig.rotatePart('armA', th);
      const strike = ph >= 0.68 && !(T.hitDone === Math.floor(T.hammerT / per));
      if (strike) {
        T.hitDone = Math.floor(T.hammerT / per); T.hits++;
        if (act && muenzer.popup.eff > 0.8) {
          if (T.hits % 2 === 0) app.audio.sfx('hammer');
          if (!app.calm) { const w = ctx.world(BENCH.x + 0.95, benchTop + 0.62, BENCH.z + 0.1); app.fx.glow.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 1.2, vy: 1.0 + Math.random(), vz: 0.2, life: 0.35, size: 0.06, alpha: 0.95, color: [1, 0.85, 0.5], drag: 0.8, grav: 3 }); }
        }
      }

      // --- Fackeln flackern, Sonne strahlt
      for (const to of torches) { const f = 1 + 0.09 * Math.sin(t * 8.5 + to.ph) + 0.05 * Math.sin(t * 13.3 + to.ph * 2); to.glow.scale.setScalar(app.calm ? 1 : f); to.glow.material.opacity = 0.55 + 0.15 * (app.calm ? 0 : Math.sin(t * 7 + to.ph)); }
      sun.userData.update(t, 1);
    });
    // Anfangsstellung herstellen (alles aus den Reglerwerten 0)
    TR.forEach((m) => place(m, TROOP.x0 + m.off, 0));
  },

  onActivate(ctx) {
    const app = ctx.app, T = ctx.spread.p4; if (!T) return;
    clearTimeout(T.t1); T.t1 = setTimeout(() => { if (ctx.spread.active) app.audio.sfx('menge'); }, 900);
  },
  onDeactivate(ctx) {
    const T = ctx.spread.p4; if (!T) return;
    clearTimeout(T.t1);
    const c = T.ctl; if (c) for (const k of [c.ctlR, c.ctlK, c.ctlM]) k.setValue(0, { snap: true, silent: false });
    T.kranzDone = false;
  },
};
