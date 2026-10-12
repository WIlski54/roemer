// Station 2 – „Vom Stadtstaat zur Großmacht“ (509–146 v. Chr.)
// Links das Forum der Republik (Senatsgebäude, Rednerbühne mit Redner und Gans, zwei Konsuln mit Liktoren, Senatoren auf Bänken),
// rechts Alpen, Mittelmeer und die Hafenmauer Karthagos.
// Laschen: „Abstimmung“ (links) · „Über die Alpen“ und „Enterbrücke“ (rechts).
// Antippbar: Senat (Gebäude/Senatoren), Konsuln, Rutenbündel (Liktor), Rednerbühne, Hannibal, Elefanten, Hafen von Karthago, Schiffe/Enterbrücke, Gans.
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, blotches, speckles, grassTufts, roundRect, SERIF, INK } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { lerp, clamp, smooth, TAU, mulberry32, easeOutBack } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { Popup } from '../engine/popup.js';
import { curiaPart, bankPart, rostraPart, hafenPart, alpenFarPart, alpenNearPart, shipPart, SHIP } from '../art/rom/s2_bauten.js';
import { fxRate, ramp, canvasTex, waveStripPart, houseRowPart, hillsPart, plankTexture, slabTexture, smoothPts, cloudsDeco, pathTexture, rampFaceTex } from './_p2_kit.js';

// ---------------------------------------------------------------- Geometrie (Seitenkoordinaten)
const SEN_H = 2.0, SINK = 0.5;                                    // Senatorenhöhe; so tief „sitzen“ sie hinter der Bank
const SENATORS = [                                                // x, z, Variante, Einsatz beim Aufstehen (0…1)
  [-9.95, -1.72, 0, 0.05], [-8.3, -1.72, 1, 0.34], [-6.65, -1.72, 2, 0.18],
  [-9.15, -0.38, 3, 0.52], [-7.5, -0.38, 4, 0.26], [-5.85, -0.38, 5, 0.42],
];
const RO = { x: -3.55, z: -1.15, top: 1.3 };                       // Rednerbühne (Mitte der Vorderseite)
const RAMP = { zBack: -1.95, depth: 0.95 };                        // Alpenpfad (Rampe) von hinten nach vorn
const RAMP_PTS = [[0.55, 0], [0.9, 0.12], [1.6, 0.2], [2.5, 0.45], [3.3, 1.0], [4.0, 1.5], [4.5, 1.6], [5.0, 1.4], [5.6, 0.9], [6.2, 0.45], [6.7, 0.2], [7.1, 0]];
const RAMP_S = smoothPts(RAMP_PTS, 8);
const rampY = (x) => {                                            // Höhe des Pfades an der Stelle x
  if (x <= RAMP_S[0][0]) return 0; if (x >= RAMP_S[RAMP_S.length - 1][0]) return 0;
  let i = 0; while (i < RAMP_S.length - 2 && RAMP_S[i + 1][0] < x) i++;
  const a = RAMP_S[i], b = RAMP_S[i + 1]; return lerp(a[1], b[1], (x - a[0]) / Math.max(1e-6, b[0] - a[0]));
};
const SEA = [[12.6, -1.5], [10.6, -1.42], [8.9, -1.48], [7.75, -1.3], [7.15, -0.7], [6.85, 0.0], [6.25, 0.8], [5.4, 1.4], [4.3, 1.95], [3.1, 2.4], [1.8, 2.8], [0.6, 3.1], [-0.3, 3.3]];
const SHIPS = { rom: { x: 7.4, ws: 0.55 }, pun: { x: 10.55, ws: 0.52 }, z: 1.3 };

// ---------------------------------------------------------------- Seite
export default {
  id: 'grossmacht',
  mood: mood({ key: '#fff3d8', keyI: 2.7, sky: '#cfe6f3', gnd: '#c9b58c', hemiI: 1.95, pos: [-7, 24, 12], rim: 0.12 }),
  motes: { colors: [[1, 0.97, 0.82], [0.85, 0.95, 1]], size: 0.08, alpha: 0.26, dx: 0.05, dy: 0.04, dz: 0.01, tw: 0.9, density: 0.55 },
  atmo: 'grossmacht',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    const d = PAGES_DE[2];
    return {
      L: {
        paper: '#f7efd9', ground: { back: '#efe6cc', front: '#dccfa8' }, margin: 0.3, pageNo: 3, seed: 21,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 16, rmin: 0.8, rmax: 2.2, colors: ['rgba(255,252,236,.22)', 'rgba(170,140,100,.08)'], seed: 5 });
          // Pflaster des Forums: Platten in versetzten Reihen
          const r = mulberry32(8), tints = ['rgba(255,252,240,.35)', 'rgba(205,190,155,.22)', 'rgba(235,225,200,.3)', 'rgba(190,175,150,.14)'];
          ctx.save(); ctx.lineWidth = Math.max(1, 0.014 * S);
          for (let z = -4.3, row = 0; z < 4.3; z += 0.62, row++) {
            for (let x = -12.2 + (row % 2) * 0.55; x < 0.2; x += 1.1 + r() * 0.35) {
              const w = 1.1 + r() * 0.2; ctx.fillStyle = tints[Math.floor(r() * tints.length)]; ctx.fillRect(m.x(x), m.z(z), w * S, 0.62 * S);
              ctx.strokeStyle = 'rgba(120,98,66,.30)'; ctx.strokeRect(m.x(x), m.z(z), w * S, 0.62 * S);
            }
          }
          ctx.restore();
          // Intarsien-Scheibe (Purpur und Gold) vor der Rednerbühne
          const cx = m.x(-3.3), cz = m.z(1.55);
          ctx.save(); ctx.translate(cx, cz); ctx.scale(1, 0.92);
          for (const [rr, col] of [[1.35, 'rgba(120,90,60,.45)'], [1.28, '#f2e8cd'], [1.05, '#7b2d5b'], [0.88, '#f2e8cd'], [0.7, '#e8c46a'], [0.48, '#7b2d5b'], [0.28, '#f2e8cd']]) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, rr * S, 0, TAU); ctx.fill(); }
          ctx.strokeStyle = 'rgba(90,60,40,.4)'; ctx.lineWidth = Math.max(1, 0.012 * S);
          for (let k = 0; k < 12; k++) { ctx.save(); ctx.rotate((k / 12) * TAU); ctx.beginPath(); ctx.moveTo(0.3 * S, 0); ctx.lineTo(1.04 * S, 0); ctx.stroke(); ctx.restore(); }
          ctx.restore();
          grassTufts(m, { x0: -11.6, x1: -0.4, z0: 2.4, z1: 3.9, n: 4, color: '#9aa65a', h: 0.16, seed: 4, blades: 3, alpha: 0.4 });
          printLabel(m, 'Das Forum in Rom', -1.9, 3.1, { size: 0.19, color: 'rgba(100,60,40,.55)', italic: true, bold: false });
          textCard(m, { x: -11.5, z: 0.95, w: 6.0, h: 3.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.262, titleSize: 0.4 });
        },
      },
      R: {
        paper: '#f6ecd0', ground: { back: '#cfd3a2', front: '#d9c690' }, margin: 0.3, pageNo: 4, seed: 22,
        draw(ctx, m) {
          const S = m.S, rr = mulberry32(31);
          blotches(m, { x0: 0, x1: 8, z0: -4.3, z1: 3, n: 26, rmin: 0.5, rmax: 1.7, colors: ['rgba(120,150,70,.2)', 'rgba(195,165,95,.18)', 'rgba(255,250,225,.16)'], seed: 12 });
          grassTufts(m, { x0: 0.4, x1: 7.4, z0: -0.7, z1: 2.4, n: 22, color: '#7f9a48', h: 0.2, seed: 6, blades: 4, alpha: 0.55 });
          // Kai vor der Hafenmauer
          ctx.save(); ctx.fillStyle = '#eadcb4'; ctx.strokeStyle = 'rgba(110,85,50,.45)'; ctx.lineWidth = Math.max(1, 0.015 * S);
          ctx.beginPath(); [[7.3, -2.3], [12.6, -2.3], [12.6, -1.5], [10.6, -1.42], [8.9, -1.48], [7.75, -1.3], [7.3, -1.55]].forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.stroke();
          ctx.clip(); for (let x = 7.3; x < 12.7; x += 0.7) { ctx.beginPath(); ctx.moveTo(m.x(x), m.z(-2.4)); ctx.lineTo(m.x(x + 0.2), m.z(-1.2)); ctx.stroke(); }
          ctx.restore();
          // Meer: Sandsaum, Wasserfläche, Wellen, Schaumkante
          const shore = smoothPts(SEA, 8), pathSea = () => { ctx.beginPath(); shore.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.lineTo(m.x(-0.3), m.z(4.6)); ctx.lineTo(m.x(12.6), m.z(4.6)); ctx.closePath(); };
          ctx.save(); ctx.lineJoin = 'round';
          ctx.beginPath(); shore.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.strokeStyle = '#f1e3b6'; ctx.lineWidth = 0.42 * S; ctx.stroke();
          pathSea(); const g = ctx.createLinearGradient(0, m.z(-1.5), 0, m.z(4.4)); g.addColorStop(0, '#79c8e0'); g.addColorStop(0.45, '#4aa3cf'); g.addColorStop(1, '#2d79ae'); ctx.fillStyle = g; ctx.fill();
          ctx.save(); pathSea(); ctx.clip(); ctx.strokeStyle = 'rgba(240,250,255,.36)'; ctx.lineWidth = 0.022 * S; ctx.lineCap = 'round';
          for (let i = 0; i < 150; i++) { const x = rr() * 12.4, z = -1.4 + rr() * 5.6, l = (0.2 + rr() * 0.22) * S; const X = m.x(x), Y = m.z(z); ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(X + l * 0.25, Y - 0.07 * S, X + l * 0.5, Y); ctx.quadraticCurveTo(X + l * 0.75, Y + 0.07 * S, X + l, Y); ctx.stroke(); }
          ctx.restore();
          ctx.beginPath(); shore.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z + 0.04); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
          ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 0.05 * S; ctx.setLineDash([0.22 * S, 0.14 * S]); ctx.stroke(); ctx.setLineDash([]);
          ctx.restore();
          // Beschriftungen
          printLabel(m, 'Gallien', 2.1, 0.55, { size: 0.24, color: 'rgba(70,90,40,.7)', italic: true, bold: true });
          printLabel(m, 'Weg über die Alpen (Annahme)', 4.1, -0.28, { size: 0.17, color: 'rgba(110,70,30,.65)', italic: true, bold: false });
          printLabel(m, 'Italien', 5.9, 0.35, { size: 0.24, color: 'rgba(70,90,40,.7)', italic: true, bold: true });
          printLabel(m, 'Mittelmeer', 9.4, 0.45, { size: 0.26, color: 'rgba(235,248,255,.88)', italic: true, bold: true });
          printLabel(m, 'Karthago', 9.7, -1.0, { size: 0.2, color: 'rgba(110,70,30,.7)', italic: true, bold: false });
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const T = (ctx.spread.p2 = { vote: 0, trek: 0, bridge: 0, t: 0, dustAcc: 0 });
    const tapCard = (id) => () => { app.audio.sfx('tapp'); app.openCardById(id); };
    const makeTappable = (pop, id) => { pop.pickMeshes = [pop.cut.mesh]; pop.cut.mesh.userData.tap = tapCard(id); };
    // Figur in ein Pop-up „einhängen“ (klappt mit dem Gastgeber, kein eigenes Scharnier)
    const nest = (host, a, x, y, z) => {
      const p = a.popup; host.pivot.add(p.group); p.group.position.set(x, y, z);
      // z-Versatz schrumpft beim Zusammenklappen auf 0, damit nichts über der flachen Seite schwebt
      p.update = () => { p.eff = host.eff; p.group.visible = host.eff > 0.004; p.pivot.rotation.x = 0; p.group.position.z = z * clamp(host.eff, 0, 1); };
      p.update();
    };

    // ---------------- Kulissenebene 1: Himmelswand (z −4.05) und Fernband
    for (const [s, cx] of [['L', -5.97], ['R', 5.97]]) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-5.9, 5.9, 4.8, {
        fill: { stops: [[0, '#5a9fd2'], [0.5, '#9bd0e8'], [1, '#eaf6ee']], dir: 'v' }, wave: 0.18, freq: 2.2, phase: 0.4 + k * 1.9, seed: 3 + k,
        deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,248,214,.55)', cx: s === 'L' ? 0.82 : 0.3, cy: 0.78, r: 0.85 }); cloudsDeco(c, bb, { seed: 7 + k * 5, n: 4 }); dither(c, bb, '#fff', { n: 40, alpha: 0.12, size: 0.04, seed: 5 + k }); },
      }), { x: cx, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 50, border: 0.04 });
    }
    ctx.flat(hillsPart(-5.5, 5.5, 2.1, { seed: 3, phase: 0.8, templeAt: 0.72 }), { x: -6.0, z: -3.2, name: 'hillsL', delay: 0.04, ppu: 46, border: 0.03 });
    ctx.flat(hillsPart(-2.4, 2.4, 1.7, { seed: 6, phase: 2.1, templeAt: 0.3 }), { x: 9.45, z: -3.25, name: 'hillsR', delay: 0.05, ppu: 46, border: 0.03 });
    const farA = alpenFarPart();
    ctx.flat(farA.part, { x: 3.9, z: -3.2, ws: 0.9, name: 'alpenFern', delay: 0.06, ppu: 60, border: 0.03, maxTex: 1536 });
    yield;

    // ---------------- Kulissenebene 2: Nahband – Senatsgebäude, Häuserzeile, Alpen, Hafenmauer Karthagos
    ctx.flat(houseRowPart(-2.6, 2.6, { seed: 4, hmin: 0.9, hmax: 1.9 }), { x: -2.9, z: -2.95, name: 'haeuser', delay: 0.08, ppu: 64, border: 0.03 });
    const curia = ctx.flat(curiaPart(), { x: -8.35, z: -2.45, name: 'curia', delay: 0.12, ppu: 84, border: 0.04, thickness: 0.04, receive: true, maxTex: 1536 });
    makeTappable(curia, 'senat');
    const nearA = alpenNearPart();
    ctx.flat(nearA.part, { x: 3.75, z: -2.3, ws: 0.76, name: 'alpenNah', delay: 0.1, ppu: 70, border: 0.03, maxTex: 1536 });
    const hafen = ctx.flat(hafenPart(), { x: 9.45, z: -2.2, ws: 0.76, name: 'hafen', delay: 0.14, ppu: 84, border: 0.04, thickness: 0.04, receive: true, maxTex: 1536 });
    makeTappable(hafen, 'hafen');
    yield;

    // ---------------- Alpenpfad: Rampe aus Papier, auf der die Elefanten gehen
    {
      const x0 = RAMP_S[0][0], x1 = RAMP_S[RAMP_S.length - 1][0], hMax = 1.8;
      const sh = new THREE.Shape(); sh.moveTo(x0, 0); for (const [x, y] of RAMP_S) sh.lineTo(x, Math.max(0.001, y)); sh.lineTo(x1, 0); sh.closePath();
      const geo = new THREE.ExtrudeGeometry(sh, { depth: RAMP.depth, bevelEnabled: false, curveSegments: 1 });
      const uv = geo.attributes.uv, pos = geo.attributes.position, nrm = geo.attributes.normal;
      const faceTex = rampFaceTex(x0, x1, hMax, (x) => rampY(x));
      const TH = faceTex.image.height;
      for (let i = 0; i < pos.count; i++) if (Math.abs(nrm.getZ(i)) > 0.5) uv.setXY(i, (pos.getX(i) - x0) / (x1 - x0), (pos.getY(i) / hMax) * ((TH - 8) / TH) + 2 / TH);
      const pt = pathTexture(); pt.repeat.set(1, 1);
      const mesh = new THREE.Mesh(geo, [new THREE.MeshLambertMaterial({ map: faceTex }), new THREE.MeshLambertMaterial({ map: pt })]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      const g = new THREE.Group(); g.add(mesh);
      const rp = new Popup(R, { x: 0, z: RAMP.zBack, delay: 0.16, name: 'rampe' });
      rp.add(g); R.addPopup(rp);
      rp.pickMeshes = [mesh]; mesh.userData.tap = tapCard('alpen');
      T.ramp = { pop: rp, g };
    }
    yield;

    // ---------------- Rednerbühne (Rostra) mit Redner und Gans
    const rostra = ctx.flat(rostraPart(), { x: RO.x, z: RO.z, name: 'rostra', delay: 0.2, ppu: 90, border: 0.04, thickness: 0.04, receive: true, maxTex: 1536 });
    makeTappable(rostra, 'rostra');
    {
      const depth = 1.45, slabG = new THREE.Group(); slabG.position.set(0, 0, -0.05);
      const top = new THREE.MeshLambertMaterial({ map: slabTexture() }), side = new THREE.MeshLambertMaterial({ color: 0xe3d6b2 });
      const box = new THREE.Mesh(new THREE.BoxGeometry(4.0, RO.top, depth), [side, side, top, side, side, side]);
      box.position.set(0, RO.top / 2, -depth / 2); box.castShadow = true; box.receiveShadow = true; slabG.add(box); rostra.add(slabG);
      T.slabG = slabG; box.userData.tap = tapCard('rostra'); rostra.pickMeshes.push(box);
    }
    const orator = ctx.stand('s2_redner', { x: -1, z: 0, h: 2.0, facing: -1, delay: 0.3, card: 'rostra', id: 'person', name: 'Redner', hint: false, hitPad: 0.05 });
    nest(rostra, orator, -0.85, RO.top, -0.7);
    const goose = ctx.stand('gans2', { x: -1, z: 0, len: 0.9, facing: -1, delay: 0.34, hidden: true, hint: false, hitPad: 0.2, card: 'gans2', name: 'Gans' });
    nest(rostra, goose, 0.95, RO.top, -0.35);
    yield;

    // ---------------- Bänke und Senatoren
    ctx.flat(bankPart(5.6, 0.65), { x: -8.3, z: -1.5, name: 'bankA', delay: 0.22, ppu: 90, border: 0.03, thickness: 0.04, receive: true });
    ctx.flat(bankPart(5.6, 0.65), { x: -8.3, z: -0.16, name: 'bankB', delay: 0.26, ppu: 90, border: 0.03, thickness: 0.04, receive: true });
    const sen = SENATORS.map(([x, z, v, t0], i) => {
      const a = ctx.stand('s2_senator', { x, z, h: SEN_H, facing: 1, variant: { v }, delay: 0.24 + i * 0.03, card: 'senat', id: 'person', name: 'Senator', hint: i === 1, hitPad: 0.2 });
      const s = { a, t0, rise: 0, bounce: 0, arm: 0, ph: i * 1.7 };
      a.onWake = () => { a.tw.add(0.5, (k) => { s.bounce = Math.sin(k * Math.PI) * 0.09; }, { done: () => { s.bounce = 0; } }); };
      a.behaviors.push(() => { a.hop = -SINK * (1 - s.rise) + s.bounce; a.fig.rotatePart('armA', s.arm); });
      a.hop = -SINK;
      return s;
    });
    yield;

    // ---------------- Konsuln und Liktoren (Rutenbündel)
    const cons = [[-5.1, 0.42, 0], [-3.1, 0.42, 1]].map(([x, z, v], i) => ctx.stand('s2_konsul', { x, z, h: 2.0, facing: i ? -1 : 1, variant: { v }, delay: 0.3 + i * 0.03, card: 'konsuln', id: 'person', name: 'Konsul', hint: i === 0 }));
    const lict = [[-4.15, 0.2, 0], [-2.2, 0.2, 1]].map(([x, z, v], i) => ctx.stand('s2_liktor', { x, z, h: 2.05, facing: i ? -1 : 1, variant: { v }, delay: 0.34 + i * 0.03, card: 'fasces', id: 'person', name: 'Liktor', hint: i === 0 }));
    // Bäume
    ctx.prop('s2_zypresse', { x: -11.2, z: -0.9, h: 3.2, delay: 0.36 });
    ctx.prop('s2_pinie', { x: -1.75, z: -2.5, h: 3.1, delay: 0.38 });
    ctx.prop('s2_zypresse', { x: -0.9, z: 0.1, h: 2.6, delay: 0.4 });
    yield;

    // ---------------- Rechte Seite: Elefanten, Hannibal, Bäume
    const herdDef = [
      { z: -1.62, len: 2.4, x0: 2.2, x1: 6.2, ph: 0, id: 'e1' },
      { z: -1.3, len: 2.2, x0: 1.65, x1: 5.3, ph: 1.9, id: 'e2' },
    ];
    const herd = herdDef.map((d, i) => {
      const a = ctx.stand('elefant', { x: d.x0, z: d.z, len: d.len, facing: 1, delay: 0.3 + i * 0.04, card: 'elefant', id: 'elefant', name: 'Elefant', hint: i === 1, hitPad: 0.1 });
      const m = { a, f: a.fig, d, dist: 0, last: d.x0, trunk: 0, bounce: 0, speed: 0, y: 0, pitch: 0 };
      a.onWake = () => { a.tw.add(0.9, (k) => { m.trunk = Math.sin(k * Math.PI) * 0.55; m.bounce = Math.sin(k * Math.PI * 2) * 0.05 * (1 - k); }, { done: () => { m.trunk = 0; m.bounce = 0; } }); };
      a.behaviors.push((dt, t) => {
        const f = a.fig; m.speed = Math.max(0, m.speed - dt * 4);
        const sw = Math.sin(m.dist * 3.6 + d.ph) * 0.34 * smooth(clamp(m.speed * 2)), pk = 0.2 + 0.1 * Math.sin(t * 1.3 + d.ph);
        f.rotatePart('legA', sw); f.rotatePart('legD', sw); f.rotatePart('legB', -sw); f.rotatePart('legC', -sw);
        f.rotatePart('trunk', pk + m.trunk); f.rotatePart('ear', 0.12 + 0.1 * Math.sin(t * 2.1 + d.ph)); f.rotatePart('tail', 0.15 + 0.15 * Math.sin(t * 1.7 + d.ph));
        a.hop = m.bounce + Math.abs(Math.sin(m.dist * 3.6 + d.ph)) * 0.04 * smooth(clamp(m.speed * 2));
        const e = clamp(a.popup.eff, 0, 1); a.popup.group.position.y = m.y * e; a.popup.pivot.rotation.z = m.pitch * e;   // beim Zusammenklappen flach auf die Seite
      });
      return m;
    });
    const hannibal = ctx.stand('s2_hannibal', { x: 1.0, z: 0.5, h: 1.75, facing: 1, delay: 0.36, card: 'hannibal', id: 'person', name: 'Hannibal', hint: true, hitPad: 0.25 });
    {
      let w = 0; hannibal.onWake = () => { hannibal.tw.add(1.0, (k) => { w = Math.sin(k * Math.PI); hannibal.hop = Math.sin(k * Math.PI * 3) * 0.05; hannibal.fig.rotatePart('armA', 1.4 + 0.4 * Math.sin(k * 20) * w); }, { done: () => { w = 0; hannibal.hop = 0; hannibal.fig.rotatePart('armA', 0); } }); };
    }
    ctx.prop('s2_zypresse', { x: 0.75, z: -0.2, h: 2.5, delay: 0.38 });
    ctx.prop('s2_zypresse', { x: 7.2, z: -0.5, h: 2.2, delay: 0.4 });
    ctx.prop('bush', { x: 3.4, z: 1.25, len: 1.1, delay: 0.42 });
    ctx.prop('bush', { x: 5.2, z: 1.55, len: 0.95, delay: 0.43 });
    yield;

    // ---------------- Meer: Wellenstreifen, Segelschiffe
    const waves = [
      { z: 1.85, w: 7.3, cx: 8.15, h: 0.3, top: '#6ec4dc', bottom: '#3d95c4', ph: 0.2, s: 3 },
      { z: 2.4, w: 8.8, cx: 7.4, h: 0.3, top: '#58b4d6', bottom: '#2f84b6', ph: 1.7, s: 4 },
      { z: 2.95, w: 10.4, cx: 6.6, h: 0.28, top: '#4aa5cf', bottom: '#2a76ab', ph: 3.1, s: 5 },
    ].map((d, i) => {
      const pop = ctx.flat(waveStripPart(d.w, d.h, { top: d.top, bottom: d.bottom, phase: d.ph, seed: d.s, freq: d.w / 2.2 }), { x: d.cx, z: d.z, name: 'welle' + i, delay: 0.32 + i * 0.03, ppu: 54, border: 0.02, thickness: 0.03 });
      return { pop, d };
    });
    const romShip = ctx.flat(shipPart({ pole: true }), { x: SHIPS.rom.x, z: SHIPS.z, ws: SHIPS.rom.ws, name: 'schiffRom', delay: 0.28, ppu: 100, border: 0.03, thickness: 0.04, maxTex: 1536 });
    const punShip = ctx.flat(shipPart({ dir: -1, hull: '#2f6a96', trim: '#e8c46a', sail: '#7b2d6b', stripe: '#e8c46a', flag: '#f4efe6' }), { x: SHIPS.pun.x, z: SHIPS.z, ws: SHIPS.pun.ws, name: 'schiffPun', delay: 0.3, ppu: 100, border: 0.03, thickness: 0.04, maxTex: 1536 });
    makeTappable(romShip, 'corvus'); makeTappable(punShip, 'corvus');
    // Die Enterbrücke (Corvus): Planke am Bugmast, fällt auf das gegnerische Schiff
    const hx = SHIP.poleX * SHIPS.rom.ws, hy = SHIP.hingeY * SHIPS.rom.ws;
    const tx = SHIPS.pun.x - 1.45 * SHIPS.pun.ws - SHIPS.rom.x, ty = 1.16 * SHIPS.pun.ws;
    const Lp = Math.hypot(tx - hx, ty - hy), landA = Math.atan2(ty - hy, tx - hx);
    const plankG = new THREE.Group(); plankG.position.set(hx, hy, 0.28); plankG.rotation.z = Math.PI / 2;
    {
      const wood = new THREE.MeshLambertMaterial({ map: plankTexture() }), edge = new THREE.MeshLambertMaterial({ color: 0x8a5a34 }), iron = new THREE.MeshLambertMaterial({ color: 0x9aa0a8 });
      const plank = new THREE.Mesh(new THREE.BoxGeometry(Lp, 0.07, 0.34), [edge, edge, wood, edge, edge, edge]);
      plank.position.set(Lp / 2, 0, 0); plank.castShadow = true; plankG.add(plank);
      for (const sz of [-0.16, 0.16]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(Lp, 0.045, 0.03), edge); rail.position.set(Lp / 2, 0.06, sz); plankG.add(rail); }
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.3, 8), iron); spike.position.set(Lp - 0.1, -0.17, 0); spike.rotation.z = Math.PI; plankG.add(spike);
      const lash = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.38), edge); lash.position.set(0.05, 0, 0); plankG.add(lash);
      plank.userData.tap = tapCard('corvus'); romShip.pickMeshes.push(plank);
    }
    romShip.add(plankG);
    T.plank = { g: plankG, landA };
    yield;

    // ---------------- Steuerungen
    const ctlVote = ctx.control('L', { id: 'abstimmung', label: 'Abstimmung', a: [-3.9, 3.55], b: [-1.5, 3.55], size: [2.3, 0.95], color: '#6e2f86', value: 0, springBack: false, hold: true, ticks: 12 });
    const ctlTrek = ctx.control('R', { id: 'alpen', label: 'Über die Alpen', a: [1.8, 3.6], b: [4.8, 3.6], size: [2.5, 0.95], color: '#2f6a96', value: 0, springBack: false, hold: true, ticks: 14 });
    const ctlBruecke = ctx.control('R', { id: 'bruecke', label: 'Enterbrücke', a: [7.6, 3.6], b: [10.2, 3.6], size: [2.5, 0.95], color: '#a8452c', value: 0, springBack: false, hold: true, ticks: 10 });
    T.ctls = [ctlVote, ctlTrek, ctlBruecke];

    // Abstimmung
    let cheered = false;
    ctlVote.on((v) => {
      T.vote = clamp(v);
      for (const s of sen) { s.rise = smooth(clamp((T.vote - s.t0) / 0.4)); s.arm = 2.0 * ramp(s.rise, 0.55, 1.0); }
      if (T.vote > 0.97 && !cheered) { cheered = true; app.audio.sfx('fanfare'); app.audio.sfx('menge'); }
      if (T.vote < 0.5) cheered = false;
    });
    ctlVote.onGrab = () => app.audio.sfx('grab'); ctlVote.onTick = (v) => app.audio.sfx('menge', { v }); ctlVote.onRelease = () => app.audio.sfx('snap');
    // Über die Alpen
    let roared = false;
    const moveHerd = (v, dt) => {
      herd.forEach((m) => {
        const x = lerp(m.d.x0, m.d.x1, v), pop = m.a.popup, dx = x - m.last; m.last = x;
        pop.group.position.x = x;
        m.y = rampY(x); m.pitch = Math.atan((rampY(x + 1.0) - rampY(x - 1.0)) / 2.0) * 0.7;
        if (Math.abs(dx) > 0.0003) { m.dist += Math.abs(dx); m.speed = 1; }
      });
      hannibal.fig.rotatePart('armA', v > 0.02 && v < 0.98 ? 1.5 + 0.25 * Math.sin(v * 40) : 0);
    };
    ctlTrek.on((v) => {
      T.trek = clamp(v); moveHerd(T.trek, 1 / 60);
      if (T.trek > 0.04 && !roared) { roared = true; app.audio.voice('elefant'); }
      if (T.trek < 0.01) roared = false;
    });
    ctlTrek.onGrab = () => app.audio.sfx('grab'); ctlTrek.onTick = (v) => app.audio.sfx('footstep', { v }); ctlTrek.onRelease = () => app.audio.sfx('snap');
    moveHerd(0, 0);
    // Enterbrücke
    let landed = false;
    ctlBruecke.on((v) => {
      T.bridge = clamp(v); const e = smooth(T.bridge);
      plankG.rotation.z = lerp(Math.PI / 2, landA, e);
      if (T.bridge > 0.96 && !landed) {
        landed = true; app.audio.sfx('thud'); app.audio.sfx('splash'); if (!app.calm) app.cam.shake(0.03, 0.25);
        const w = ctx.world(SHIPS.rom.x + tx, ty, SHIPS.z + 0.3);
        for (let i = 0; i < Math.round(12 * fxRate(app)); i++) app.fx.dust.emit({ x: w.x + (Math.random() - 0.5) * 0.3, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.8, vy: 0.5 + Math.random() * 0.9, vz: (Math.random() - 0.3) * 0.5, life: 0.8, size: 0.12, alpha: 0.7, color: [0.9, 0.96, 1], grav: 2.2, drag: 0.4 });
      }
      if (T.bridge < 0.5) landed = false;
    });
    ctlBruecke.onGrab = () => { app.audio.sfx('grab'); app.audio.sfx('schiff'); }; ctlBruecke.onTick = (v) => app.audio.sfx('ruder', { v }); ctlBruecke.onRelease = () => app.audio.sfx('snap');

    // ---------------- Update je Bild
    const tmp = { x: 0 };
    ctx.onUpdate((dt, t) => {
      T.t = t;
      const eff = rostra.eff;
      T.slabG.scale.z = Math.max(0.001, eff); T.ramp.g.scale.z = Math.max(0.001, T.ramp.pop.eff);
      // Redner gestikuliert
      const calm = app.calm ? 0.4 : 1;
      orator.fig.rotatePart('armA', 1.35 + Math.sin(t * 2.0) * 0.32 * calm + T.vote * 0.2);
      goose.fig.rotatePart('neck', 0.12 + 0.08 * Math.sin(t * 1.1));
      // Meer wogt, Schiffe wippen
      waves.forEach((w, i) => { w.pop.group.position.x = w.d.cx + Math.sin(t * 0.7 + i * 1.3) * 0.14 * calm; w.pop.group.position.y = Math.sin(t * 1.1 + i) * 0.02 * calm; });
      const bob = Math.sin(t * 1.25) * 0.03 * calm, rock = Math.sin(t * 0.9) * 0.012 * calm;
      romShip.group.position.y = bob; punShip.group.position.y = bob; romShip.pivot.rotation.z = rock; punShip.pivot.rotation.z = -rock;
      T.plank.g.visible = romShip.eff > 0.6;
      // Staub unter den Füßen der Elefanten, Schneeflocken am Pass
      if (!app.calm && ctx.spread.active) {
        T.dustAcc += dt * fxRate(app);
        herd.forEach((m) => {
          if (m.speed > 0.3 && T.dustAcc > 0.09 && Math.random() < 0.5) {
            const p = m.a.popup.group.position, w = ctx.world(p.x - 0.5, p.y + 0.05, p.z + 0.3);
            app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: -0.25, vy: 0.2, vz: 0.05, life: 0.9, size: 0.22, alpha: 0.32, color: [0.86, 0.78, 0.62], drag: 1.6, grow: 1.4 });
          }
        });
        if (T.dustAcc > 0.09) T.dustAcc = 0;
        if (Math.random() < dt * 2.2 * fxRate(app)) { const w = ctx.world(3.4 + Math.random() * 2.2, 3.9, -1.4 + Math.random() * 0.8); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0.12, vy: -0.28, vz: 0, life: 3, size: 0.07, alpha: 0.7, color: [1, 1, 1], drag: 0.2 }); }
      }
    });
  },

  onActivate(ctx) { /* nichts Besonderes: die Seite wird von der Engine aufgerichtet */ },
  onDeactivate(ctx) {
    const T = ctx.spread.p2; if (!T) return;
    for (const c of T.ctls || []) c.setValue(0, { snap: true });
  },
};
