// Station 7: „Straßen, Wasser, Beton“ (Kaiserzeit, Leitfarbe Steingrau / Wasserblau / frisches Grün) – klarer Morgen auf einer römischen Baustelle.
// Links: Pop-up-Aquädukt mit drei Bogenreihen (Rinnenfenster, Wasser läuft nur mit Gefälle, Wasserspeier in ein Becken), Bleirohr, Schaubild Kalkkreislauf, Bildfolge „Beton“.
// Rechts: Badehaus im Schnitt (Hypokaustum), Straßenquerschnitt (Lagen), Tretradkran, Mörtelwanne mit Maurer, Ziegelstapel, Glasbläser.
// Bedienung: Regler „Gefälle“ · Schieber „Straßenschichten“ · Kurbel „Tretrad“ · Lasche „Beton“ · Lasche „Fußbodenheizung“.
// Antippbar (Karte): Aquädukt/Becken, Bleirohr, Kalkkreislauf-Tafel, Beton-Bildfolge, Straße/Soldat/Steinmetz, Tretradkran/Arbeiter, Mörtelwanne/Maurer, Hypokaustum, Glasbläser/Tisch, Ziegel; die Gans sitzt oben auf dem Aquädukt.
// Gemeinsame Dateien werden nur importiert, nicht verändert; alle Hilfen dieser Seite liegen in _p7_kit.js / _p7_draw.js.
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, blotches, speckles, grassTufts, pebbles } from '../engine/pagepaint.js';
import { PAGES_DE } from '../data/pages.de.js';
import { lerp, clamp, TAU, mulberry32 } from '../engine/util.js';
import { makeFlat } from '../engine/popup.js';
import { sunGlow } from '../engine/effects.js';
import { panelPart, dither, softLight, strata } from './common.js';
import { aquaeduktPart, aquaeduktHinten, beckenPart, bleirohrPart, thermenPart, strassePart, AQ, TH, STR } from '../art/rom/s7_bauten.js';
import { kranGestell, kranRad, kranLast, steinhaufen, wannePart, ziegelPart, glasTisch, KRAN, WANNE_SURF } from '../art/rom/s7_baustelle.js';
import { canvasTex, pagePlane, hOf, relabel, crestGeo, segMesh, setSeg, glowMesh, smooth01, easeOutBack } from './_p7_kit.js';
import { KALK, kalkAt, drawKalk, BETON, drawBeton, SIGN, drawSign, LAGEN, drawSlab, drawChannelBack, drawFloor, drawWaterBody, drawFall } from './_p7_draw.js';

const IDX = 7;
// Orte (Seitenkoordinaten)
const AQP = { x: -6.825, z: -1.55 };          // Aquädukt (Mitte, Standlinie)
const FALL_X = 5.08;                          // Wasserfall, lokal zum Aquädukt
const BEC = { x: AQP.x + FALL_X, z: -1.15 };  // Becken unter dem Wasserspeier
const ROHR = { x: -4.15, z: -0.78 };
const KALK_P = { x: -2.8, z: 0.65 }, BETON_P = { x: -2.8, z: 2.45 }, SIGN_P = { x: -9.1, z: -0.55 };
const TH_P = { x: 3.4, z: -1.9 }, STR_P = { x: 2.9, z: 1.1 }, KRAN_P = { x: 9.0, z: -0.9 };
const THR = 0.12;                              // Mindest-Neigung, ab der das Wasser läuft

export default {
  id: 'ingenieure',
  mood: mood({ key: '#ffe2ae', keyI: 2.5, sky: '#eaf3ff', gnd: '#78905a', hemiI: 1.85, pos: [9, 19, 9], rim: 0.1 }),
  motes: { colors: [[1, 0.95, 0.74], [0.82, 0.95, 1]], size: 0.08, alpha: 0.32, dx: 0.05, dy: 0.06, dz: 0.02, tw: 1.0, density: 0.8 },
  atmo: 'ingenieure',
  weatherDefault: 'clear',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    const d = PAGES_DE[IDX];
    return {
      L: {
        paper: '#f3efd9', ground: { back: '#b3cf82', front: '#93b866' }, margin: 0.3, pageNo: 2 * IDX + 1, seed: 71,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 22, rmin: 0.7, rmax: 2.0, colors: ['rgba(255,250,200,.18)', 'rgba(90,140,60,.10)'], seed: 6 });
          speckles(m, { x0: -11.7, x1: -0.3, z0: -3.9, z1: 4, n: 300, color: 'rgba(60,100,40,.2)', size: 0.03, seed: 8 });
          grassTufts(m, { x0: -11.7, x1: -0.4, z0: -0.4, z1: 3.9, n: 10, color: '#6f9a3f', h: 0.24, seed: 4, blades: 4, alpha: 0.6 });
          // Fluss im Tal unter den Bögen (biegt hinter dem Aquädukt nach hinten ab)
          const river = [[-12.4, -1.45], [-10, -1.28], [-7.5, -1.55], [-5.6, -1.5], [-4.2, -1.8], [-3.0, -2.5], [-2.0, -3.4], [-1.2, -4.4]];
          const trace = (w, col, off = 0) => { ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w * S; ctx.beginPath(); river.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z + off); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.restore(); };
          trace(1.35, 'rgba(226,210,160,.9)'); trace(1.05, '#5da6cf'); trace(0.7, '#78bde0'); trace(0.14, 'rgba(255,255,255,.55)', -0.12);
          const rr = mulberry32(12); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.025 * S; ctx.lineCap = 'round';
          for (let i = 0; i < 40; i++) { const k = rr() * (river.length - 1), a = river[Math.floor(k)], b = river[Math.ceil(k)], t = k % 1; const x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t) + (rr() - 0.5) * 0.7; const [X, Y] = m.pt(x, z); ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(X + 0.1 * S, Y - 0.05 * S, X + 0.2 * S, Y); ctx.stroke(); }
          textCard(m, { x: -11.5, z: 0.15, w: 5.9, h: 2.9, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.27, titleSize: 0.4 });
        },
      },
      R: {
        paper: '#f3ecd3', ground: { back: '#bcd18a', front: '#a2c172' }, margin: 0.3, pageNo: 2 * IDX + 2, seed: 72,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.7, rmax: 2.0, colors: ['rgba(255,250,200,.18)', 'rgba(90,140,60,.10)'], seed: 9 });
          speckles(m, { x0: 0.3, x1: 11.7, z0: -3.9, z1: 4, n: 300, color: 'rgba(60,100,40,.2)', size: 0.03, seed: 10 });
          // Baustellen-Boden: Sand und Schotter rund um Kran und Wanne
          ctx.save(); ctx.fillStyle = 'rgba(224,206,158,.85)'; ctx.shadowColor = 'rgba(80,60,20,.25)'; ctx.shadowBlur = 0.1 * S;
          ctx.beginPath(); ctx.ellipse(m.x(8.8), m.z(1.1), 3.5 * S, 1.9 * S, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(m.x(5.5), m.z(0.3), 1.6 * S, 0.9 * S, 0, 0, TAU); ctx.fill(); ctx.restore();
          pebbles(m, { x0: 5.4, x1: 12, z0: -0.9, z1: 3.2, n: 14, seed: 3, colors: ['#bfae88', '#a8966f', '#d0c09a'] });
          grassTufts(m, { x0: 0.5, x1: 11.6, z0: -0.4, z1: 3.9, n: 12, color: '#6f9a3f', h: 0.24, seed: 14, blades: 4, alpha: 0.6 });
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const S = (ctx.spread.p7 = { v: { gef: 0, str: 0, tret: 0, beton: 0, heiz: 0 }, flow: 0, sign: -1, act: -9, landed: [false, false, false, false], bstage: -1, hot: 0, tW: 0, tS: 0, tHam: 0 });
    const tapFlat = (pop, fn) => { pop.pickMeshes = [pop.cut.mesh]; pop.cut.mesh.userData.tap = fn; return pop; };
    const open = (id) => () => { app.audio.sfx('tapp'); app.openCardById(id); };
    // Figur in ein Pop-up einhängen (faltet sich mit), Position lokal zum Pop-up
    const nest = (a, pop, lx, ly, lz) => {
      const f = a.fig, midx = ((f.bbox.x0 + f.bbox.x1) / 2) * f.ws * f.facing;
      pop.pivot.add(f.group); f.group.position.set(lx - midx, ly, lz);
      pop.pivot.add(a.proxy); a.proxy.position.set(lx + (a.proxy.position.x - 0), a.proxy.position.y + ly, lz + 0.1);
    };
    const fxRate = () => (app.calm ? 0.25 : (app.stage && app.stage.tier ? app.stage.tier.fx : 0.7));

    // ---------------- Kulissen: Himmel, Fernband, Nahband (je Seite)
    const sky = { cx: {} };
    for (const s of ['L', 'R']) {
      const k = s === 'L' ? 0 : 1, x0 = k ? 0.2 : -11.8, x1 = k ? 11.8 : -0.2, hw = (x1 - x0) / 2, cx = (x0 + x1) / 2;
      sky.cx[s] = cx;
      sky[s] = ctx.flat(panelPart(-hw, hw, 5.0, {
        fill: { stops: [[0, '#68ade0'], [0.5, '#a6d6ee'], [1, '#fdebc8']], dir: 'v' }, wave: 0.2, freq: 2.6, phase: 0.6 + k * 1.6, seed: 3 + k,
        deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,238,175,.55)', cx: k ? 0.3 : 0.97, cy: 0.78, r: 0.9 }); dither(c, bb, '#fff', { n: 50, alpha: 0.13, size: 0.04, seed: 5 + k }); },
      }), { x: cx, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 56, border: 0.04 });
      ctx.flat(panelPart(-hw, hw, 2.5, {
        fill: { top: '#8cbd93', bottom: '#b9d6a0' }, wave: 0.5, freq: k ? 2.6 : 3.0, phase: 1.0 + k * 2.2, seed: 8 + k, step: 0.2,
        deco: (c, bb) => { strata(c, bb, ['#a2cc8c', '#7fae7e', '#b6d89c', '#6f9f78'], { n: 6, wave: 0.12, seed: 4 + k, alpha: 0.4 }); dither(c, bb, '#3d6b3a', { n: 140, alpha: 0.16, size: 0.04, seed: 3 + k }); },
      }), { x: cx, z: -3.2, lean: -0.03, name: 'far' + s, delay: 0.05, ppu: 56 });
      ctx.flat(panelPart(-hw, hw, 0.95, {
        fill: { top: '#5f9f48', bottom: '#86bf58' }, wave: 0.2, freq: 5, phase: 0.3 + k * 1.4, seed: 3 + k,
        deco: (c, bb) => { dither(c, bb, '#2f6a2a', { n: 120, alpha: 0.2, size: 0.05, seed: 6 + k }); dither(c, bb, '#d7f0a0', { n: 60, alpha: 0.22, size: 0.04, seed: 2 + k }); },
      }), { x: cx, z: -2.25, name: 'near' + s, delay: 0.1, ppu: 64 });
    }
    yield;
    // ---------------- Sonne (klarer Morgen), Wolken – hängen im Himmelsblatt, falten sich mit
    const skyProp = (sideKey, id, lx, ly, o) => {
      const fig = ctx.fig(id, { thickness: 0.02, border: 0.03, ...o }); fig.setCast(false); ctx.sideKey(sideKey).own(fig);
      const holder = new THREE.Group(); holder.position.set(lx, ly, 0.05); const midx = ((fig.bbox.x0 + fig.bbox.x1) / 2) * fig.ws * fig.facing;
      fig.group.position.set(-midx, 0, 0); holder.add(fig.group); (sky[sideKey]).pivot.add(holder); return holder;
    };
    const sun = skyProp('R', 'sun_disc', 0.95 - sky.cx.R, 2.9, { h: 1.9 });
    const glow = sunGlow({ size: 5.4, color: 0xffdc90, opacity: 0.7 }); glow.position.set(0, 0.95, -0.06); sun.add(glow);
    ctx.onUpdate((dt, t) => glow.userData.update(t));
    const cl1 = skyProp('L', 'cloud_a', -2.6, 3.2, { len: 2.6 }), cl2 = skyProp('R', 'cloud_b', 2.2, 3.35, { len: 2.2 });
    ctx.onUpdate((dt, t) => { cl1.position.x = -2.6 + Math.sin(t * 0.05) * 1.6; cl2.position.x = 2.2 + Math.sin(t * 0.04 + 1) * 1.4; });
    yield;

    // ---------------- Aquädukt (links): drei Bogenreihen, dahinter zweite Mauer, Rinnenfenster mit Wasser, Wasserspeier
    ctx.flat(aquaeduktHinten(), { x: AQP.x, z: AQP.z - 0.5, name: 'aqu-hinten', delay: 0.06, ppu: 50, maxTex: 1400, border: 0.03 });
    const aq = ctx.flat(aquaeduktPart(), { x: AQP.x, z: AQP.z, name: 'aquaedukt', delay: 0.1, ppu: 80, maxTex: Math.max(app.q.maxTex, 1800), border: 0.04, thickness: 0.05 });
    tapFlat(aq, open('aquaedukt'));
    const WN = AQ.win, wW = WN.x1 - WN.x0, wcx = (WN.x0 + WN.x1) / 2, wcy = (WN.y0 + WN.y1) / 2;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(wW + 0.3, WN.y1 - WN.y0 + 0.06), new THREE.MeshBasicMaterial({ map: canvasTex(512, 64, drawChannelBack) }));
    back.position.set(wcx - 0.15, wcy, -0.035); aq.add(back);
    const tilt = new THREE.Group(); tilt.position.set(wcx, wcy, -0.02); aq.add(tilt);
    const ext = wW + 0.34, cOff = -0.13;           // links 0,3 über das Fenster hinaus (verdeckt), rechts bündig
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(ext, 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 64, drawFloor) })); floor.position.set(cOff, -0.17 - 0.25, 0); tilt.add(floor);
    const waterMat = new THREE.MeshBasicMaterial({ map: canvasTex(1024, 64, drawWaterBody), color: 0xffffff });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(ext, 0.22), waterMat); water.position.set(cOff, -0.06, 0.004); tilt.add(water);
    const crestMat = new THREE.MeshBasicMaterial({ color: 0xeaf7ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false });
    const ROWS = [{ y: -0.135, spd: 0.8, n: 10, w: 0.36, h: 0.05 }, { y: -0.07, spd: 1.0, n: 10, w: 0.3, h: 0.05 }, { y: -0.005, spd: 1.25, n: 9, w: 0.26, h: 0.045 }];
    const crests = [];
    ROWS.forEach((row, ri) => { for (let i = 0; i < row.n; i++) { const m = new THREE.Mesh(crestGeo(row.w, row.h), crestMat); m.position.z = 0.008 + ri * 0.002; tilt.add(m); crests.push({ m, row, x: -wW / 2 + ((i + ri * 0.37) / row.n) * wW, ph: i * 1.7 + ri }); } });
    const fallTex = canvasTex(64, 256, drawFall); fallTex.wrapS = fallTex.wrapT = THREE.RepeatWrapping;
    const fall = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 1), new THREE.MeshBasicMaterial({ map: fallTex, transparent: true, opacity: 0.94 })); fall.position.set(FALL_X, 2, 0.03); fall.visible = false; aq.add(fall);
    // Gans: sitzt oben auf der obersten Bogenreihe (auf dem Deckgesims), hängt im Aquädukt und faltet sich mit
    const goose = ctx.stand('gans7', { x: AQP.x + 2.3, z: AQP.z, len: 0.85, hidden: true, hint: false, hitPad: 0.2, card: 'gans7', name: 'Gans', delay: 0.4 });
    nest(goose, aq, 2.3, AQ.capY1 + 0.05, 0.14);
    yield;

    // Becken am Ende der Leitung, Bleirohr
    const bk = ctx.flat(beckenPart(), { x: BEC.x, z: BEC.z, name: 'becken', delay: 0.14, ppu: 90, border: 0.035, thickness: 0.05 });
    tapFlat(bk, open('aquaedukt'));
    const pipe = ctx.flat(bleirohrPart(), { x: ROHR.x, z: ROHR.z, name: 'bleirohr', delay: 0.16, ppu: 100, border: 0.035, thickness: 0.04 });
    tapFlat(pipe, open('bleirohr'));
    yield;

    // ---------------- Karten auf der Seite: Schild zum Gefälle, Kalkkreislauf, Bildfolge Beton
    const sign = pagePlane(SIGN.w, SIGN.d, SIGN.W, SIGN.H, (g, W, H) => drawSign(g, W, H, Math.max(0, S.sign)));
    sign.mesh.position.set(SIGN_P.x, 0.012, SIGN_P.z); L.add(sign.mesh);
    const kalk = pagePlane(KALK.w, KALK.d, KALK.W, KALK.H, drawKalk);
    kalk.mesh.position.set(KALK_P.x, 0.012, KALK_P.z); L.add(kalk.mesh); L.addTap(kalk.mesh, open('kalkkreislauf'));
    const marble = new THREE.Mesh(new THREE.CircleGeometry(0.1, 20), new THREE.MeshBasicMaterial({ color: 0xff8a3a })); marble.rotation.x = -Math.PI / 2; marble.renderOrder = 3; L.add(marble);
    const mglow = glowMesh(0xffcc66, 0.5, 0.7); mglow.rotation.x = -Math.PI / 2; L.add(mglow);
    const bet = pagePlane(BETON.w, BETON.d, BETON.W, BETON.H, (g, W, H) => drawBeton(g, W, H, S.v.beton));
    bet.mesh.position.set(BETON_P.x, 0.012, BETON_P.z); L.add(bet.mesh); L.addTap(bet.mesh, open('moertel'));
    yield;

    // ---------------- Badehaus mit Hypokaustum (rechts hinten)
    const th = ctx.flat(thermenPart(), { x: TH_P.x, z: TH_P.z, name: 'thermen', delay: 0.12, ppu: 80, maxTex: 1600, border: 0.04, thickness: 0.05 });
    tapFlat(th, open('hypokaustum'));
    const glowCh = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 0.75), new THREE.MeshBasicMaterial({ color: 0xff6a20, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    glowCh.position.set(-0.25, 0.675, 0.02); th.add(glowCh);
    const flameShape = new THREE.Shape(); flameShape.moveTo(0, 0); flameShape.quadraticCurveTo(0.17, 0.12, 0.06, 0.3); flameShape.quadraticCurveTo(0.1, 0.4, 0, 0.5); flameShape.quadraticCurveTo(-0.1, 0.34, -0.07, 0.24); flameShape.quadraticCurveTo(-0.16, 0.1, 0, 0);
    const flameGeo = new THREE.ShapeGeometry(flameShape, 6);
    const flames = [[-2.72, 0.02, 0xff7a24, 1.0], [-2.52, 0.02, 0xffb534, 0.8], [-2.62, 0.02, 0xffe27a, 0.55]].map(([x, y, col, sc], i) => { const m = new THREE.Mesh(flameGeo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95 })); m.position.set(x, y, 0.03 + i * 0.002); m.userData = { sc, ph: i * 2.1 }; th.add(m); return m; });
    const mouthGlow = glowMesh(0xff7a24, 1.5, 0); mouthGlow.position.set(-2.6, 0.3, 0.04); th.add(mouthGlow);
    const arrowShape = new THREE.Shape(); arrowShape.moveTo(-0.13, -0.075); arrowShape.lineTo(0.12, 0); arrowShape.lineTo(-0.13, 0.075); arrowShape.lineTo(-0.07, 0); arrowShape.closePath();
    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    const AIR = [[-2.5, 0.66], [TH.flue.x0 + 0.17, 0.66], [TH.flue.x0 + 0.17, 2.7]];
    const segLen = [Math.hypot(AIR[1][0] - AIR[0][0], AIR[1][1] - AIR[0][1]), Math.hypot(AIR[2][0] - AIR[1][0], AIR[2][1] - AIR[1][1])], airTotal = segLen[0] + segLen[1];
    const arrows = Array.from({ length: 13 }, (_, i) => { const m = new THREE.Mesh(arrowGeo, new THREE.MeshBasicMaterial({ color: 0xffd23a, transparent: true, opacity: 0, depthWrite: false })); m.position.z = 0.05; th.add(m); return { m, s: (i / 13) * airTotal }; });
    const shimmer = Array.from({ length: 5 }, (_, k) => { const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(20 * 3), 3)); const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff8a3a, transparent: true, opacity: 0 })); l.userData = { x: -1.1 + k * 0.5, ph: k * 1.3 }; l.position.z = 0.04; th.add(l); return l; });
    yield;

    // ---------------- Straßenquerschnitt mit Lagen
    const rd = ctx.flat(strassePart(), { x: STR_P.x, z: STR_P.z, name: 'strasse', delay: 0.16, ppu: 90, border: 0.04, thickness: 0.05 });
    tapFlat(rd, open('strasse'));
    const slabs = []; let ys = STR.soil;
    LAGEN.forEach((lg, i) => {
      const tex = canvasTex(1024, Math.round(lg.h * 320), (g, w, h) => { g.scale(2, 2); drawSlab(g, w / 2, h / 2, i); });
      const col = ['#7d776c', '#cfc7b4', '#d2c5a2', '#bdb8ab'][i];
      const side = new THREE.MeshLambertMaterial({ color: col });
      const m = new THREE.Mesh(new THREE.BoxGeometry(STR.trench, lg.h, 0.14), [side, side, side, side, new THREE.MeshLambertMaterial({ map: tex }), side]);
      m.position.set(0, ys + lg.h / 2, 0.06); m.castShadow = true; m.visible = false; rd.add(m); slabs.push({ m, y: ys + lg.h / 2 }); ys += lg.h;
    });
    const soldat = ctx.stand('s7_soldat', { x: 6.0, z: 1.35, h: hOf('s7_soldat', 1.2), facing: -1, delay: 0.3, card: 'strasse', name: 'Soldat beim Straßenbau', hint: true });
    const mason = ctx.stand('s7_steinmetz', { x: 5.15, z: -0.12, h: hOf('s7_steinmetz', 1.2), facing: 1, delay: 0.32, card: 'strasse', name: 'Steinmetz', hint: false });
    ctx.flat(steinhaufen(), { x: 6.2, z: -0.1, ws: 0.62, name: 'steinblock', delay: 0.33, ppu: 100, border: 0.03 });
    yield;

    // ---------------- Tretradkran (rechts hinten): Gestell, Rad, Seile, Last, Arbeiter im Rad
    const kr = ctx.flat(kranGestell(), { x: KRAN_P.x, z: KRAN_P.z, name: 'kran', delay: 0.2, ppu: 80, maxTex: 1500, border: 0.04, thickness: 0.05 });
    tapFlat(kr, open('tretradkran'));
    ctx.flat(steinhaufen(), { x: KRAN_P.x + KRAN.tip.x, z: KRAN_P.z - 0.05, ws: 1.0, name: 'steinhaufen', delay: 0.24, ppu: 100, border: 0.03 });
    const wheelCut = makeFlat(kranRad(), { ws: 1, ppu: Math.min(app.q.ppu, 100), thickness: 0.05, border: 0.03, name: 'p7:rad', maxTex: 1100 }); R.own(wheelCut);
    const wheelG = new THREE.Group(); wheelG.position.set(KRAN.wheel.x, KRAN.wheel.y, 0.1); wheelG.add(wheelCut.mesh); kr.add(wheelG);
    wheelCut.mesh.userData.tap = open('tretradkran'); kr.pickMeshes.push(wheelCut.mesh);
    const lastCut = makeFlat(kranLast(), { ws: 1, ppu: Math.min(app.q.ppu, 110), thickness: 0.05, border: 0.03, name: 'p7:last', maxTex: 700 }); R.own(lastCut);
    const HOOK0 = 2.02, HOOK1 = 3.5;
    const lastG = new THREE.Group(); lastG.position.set(KRAN.tip.x, HOOK0, 0.12); lastG.add(lastCut.mesh); kr.add(lastG);
    lastCut.mesh.userData.tap = open('tretradkran'); kr.pickMeshes.push(lastCut.mesh);
    const ropeA = segMesh(0xd8c293, 0.05, 0.07), ropeC = segMesh(0xd8c293, 0.05, 0.07); kr.add(ropeA); kr.add(ropeC);
    setSeg(ropeA, KRAN.wheel.x, KRAN.wheel.y + 0.3, KRAN.apex.x, KRAN.apex.y);
    const walker = ctx.stand('s7_treter', { x: KRAN_P.x + KRAN.wheel.x, z: KRAN_P.z, h: hOf('s7_treter', 0.86), facing: 1, delay: 0.3, card: 'tretradkran', name: 'Arbeiter im Tretrad', hint: true, hitPad: 0.3 });
    nest(walker, kr, KRAN.wheel.x, KRAN.wheel.y - KRAN.wheel.r + 0.08, 0.22);
    yield;

    // ---------------- Mörtelwanne mit Maurer, Ziegelstapel, Glasbläser
    const wn = ctx.flat(wannePart(), { x: 8.45, z: 2.2, name: 'wanne', delay: 0.34, ppu: 100, border: 0.035, thickness: 0.05 });
    tapFlat(wn, open('moertel'));
    const surf = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshBasicMaterial({ color: 0x5f4228 })); surf.scale.set(WANNE_SURF.rx, WANNE_SURF.ry, 1); surf.position.set(0, WANNE_SURF.y, 0.012); wn.add(surf);
    const maurer = ctx.stand('s7_maurer', { x: 7.05, z: 2.2, h: hOf('s7_maurer', 1.2), facing: 1, delay: 0.36, card: 'moertel', name: 'Maurer', hint: true });
    const zg = ctx.flat(ziegelPart(), { x: 10.75, z: 2.1, name: 'ziegel', delay: 0.38, ppu: 100, border: 0.03 });
    tapFlat(zg, open('ziegel'));
    const gl = ctx.stand('s7_glas', { x: 8.55, z: 0.95, h: hOf('s7_glas', 1.15), facing: 1, delay: 0.4, card: 'glasblaeserpfeife', name: 'Glasbläser', hint: true });
    gl.fig.rotatePart('armA', 1.5);
    const bulb = glowMesh(0xff8a2a, 0.75, 0.0); bulb.position.set(1.3 * gl.fig.ws, 0.96 * gl.fig.ws, 0.14); gl.fig.group.add(bulb);
    const gt = ctx.flat(glasTisch(), { x: 10.75, z: 0.95, ws: 1.1, name: 'glastisch', delay: 0.42, ppu: 110, border: 0.03 });
    tapFlat(gt, open('glasblaeserpfeife'));
    yield;

    // ---------------- Kulisse: Zypressen, Büsche, Gräser
    for (const [x, z, h, d] of [[-11.3, -2.9, 3.6, 0.3], [-1.9, -2.95, 3.3, 0.32], [0.7, -3.0, 3.0, 0.34], [6.4, -3.0, 3.4, 0.36], [11.5, -2.7, 3.2, 0.36]]) ctx.prop('zypresse7', { x, z, h, delay: d });
    for (const [x, z, len, d] of [[-11.5, 3.0, 0.9, 0.42], [0.9, 3.0, 0.9, 0.42], [11.4, 1.0, 1.0, 0.44], [5.4, 2.7, 0.9, 0.44]]) ctx.prop('bush', { x, z, len, delay: d });
    for (const [x, z, len] of [[-5.5, 3.0, 0.8], [3.2, 2.6, 0.7], [11.0, 3.1, 0.8]]) ctx.prop('grass_tuft', { x, z, len, delay: 0.46 });
    yield;

    // ---------------- Laschen
    const base = (o) => ({ springBack: false, hold: true, ...o });
    const cGef = ctx.control('L', base({ id: 'gefaelle', label: 'Gefälle', a: [-10.2, 3.62], b: [-7.5, 3.62], size: [2.1, 1.0], color: '#3f8fc0', ticks: 12 }));
    const cBet = ctx.control('L', base({ id: 'beton', label: 'Beton', a: [-4.5, 3.62], b: [-1.8, 3.62], size: [2.0, 1.0], color: '#8b6f4e', ticks: 4 }));
    const cStr = ctx.control('R', base({ id: 'strassenschichten', label: 'Straßenschichten', a: [1.3, 3.62], b: [2.9, 3.62], size: [1.9, 1.0], color: '#6e747c', ticks: 4 }));
    const cTre = ctx.control('R', base({ id: 'tretrad', label: 'Tretrad', a: [5.15, 3.62], b: [6.75, 3.62], size: [1.9, 1.0], color: '#a8742e', ticks: 12 }));
    const cHei = ctx.control('R', base({ id: 'fussbodenheizung', label: 'Fußbodenheizung', a: [9.0, 3.62], b: [10.6, 3.62], size: [1.9, 1.0], color: '#c5502c', ticks: 8 }));
    relabel(cStr, ['Straßen-', 'schichten'], '#6e747c'); relabel(cHei, ['Fußboden-', 'heizung'], '#c5502c');
    for (const c of [cGef, cBet, cStr, cTre, cHei]) { c.onGrab = () => { app.audio.sfx('grab'); S.act = app.t; }; c.onRelease = () => app.audio.sfx('snap'); }
    cGef.onTick = (v) => app.audio.sfx('slide', { v });
    cBet.onTick = (v) => { app.audio.sfx('slide', { v }); };
    cStr.onTick = (v) => { app.audio.sfx('slide', { v }); };
    cTre.onTick = (v) => { app.audio.sfx('seil', { v }); if (Math.floor(v * 24) % 2 === 0) app.audio.sfx('rad', { v }); else app.audio.sfx('kran', { v }); };
    cHei.onTick = (v) => app.audio.sfx('slide', { v });
    cGef.on((v) => { if (S.v.gef <= THR && v > THR) app.audio.sfx('splash'); S.v.gef = v; });
    cBet.on((v) => { S.v.beton = v; });
    cStr.on((v) => { S.v.str = v; S.tHam = app.t; });
    cTre.on((v) => { S.v.tret = v; });
    cHei.on((v) => { if (S.v.heiz < 0.05 && v >= 0.05) app.audio.sfx('feuer'); S.v.heiz = v; });
    S.ctl = { cGef, cBet, cStr, cTre, cHei };

    // ---------------- Bewegung
    const tmpV = new THREE.Vector3();
    const emit = (kind, x, y, z, o) => { const w = ctx.world(x, y, z); app.fx[kind].emit({ x: w.x, y: w.y, z: w.z, ...o }); };
    let nextWater = 0, lastBStage = -1, lastFlowS = 0;
    ctx.onUpdate((dt, t) => {
      const act = ctx.spread.active; if (!act) return;
      const v = { gef: cGef.sp.x, str: cStr.sp.x, tret: cTre.sp.x, beton: cBet.sp.x, heiz: cHei.sp.x };
      const fx = fxRate();
      // --- Gefälle: Rinne neigt sich (stark übertrieben), Wasser läuft erst ab Mindest-Neigung
      const th0 = -v.gef * 0.045; tilt.rotation.z = th0;
      const u = clamp((v.gef - THR) / (1 - THR)), flow = v.gef > THR ? 0.45 + 2.5 * u : 0;
      S.flow = lerp(S.flow, flow, 1 - Math.exp(-dt * 4));
      const run = clamp(S.flow / 0.45);
      waterMat.color.setRGB(lerp(0.78, 1, run), lerp(0.88, 1, run), lerp(0.7, 1, run));   // stehendes Wasser: matt, grünlich
      crestMat.opacity = 0.35 + 0.5 * run;
      for (const c of crests) {
        c.x += S.flow * c.row.spd * dt; if (c.x > wW / 2) c.x -= wW + 0.1;
        const edge = clamp((wW / 2 - c.x) / 0.7) * clamp((c.x + wW / 2 + 0.2) / 0.7);
        c.m.position.set(c.x, c.row.y + (S.flow > 0.05 ? 0.012 * Math.sin(t * 3 + c.ph) : 0.006 * Math.sin(t * 1.1 + c.ph)), c.m.position.z); c.m.scale.setScalar(Math.max(0.001, edge));
      }
      const fallTop = wcy - 0.17 + (wW / 2) * th0;
      fall.visible = run > 0.2; if (fall.visible) { const h = Math.max(0.2, fallTop - 0.78); fall.scale.y = h; fall.position.y = 0.78 + h / 2; fall.material.opacity = 0.94 * clamp(run); fallTex.repeat.set(1, h / 0.9); fallTex.offset.y -= dt * (1.2 + 1.4 * u); }
      if (fall.visible && Math.random() < dt * 14 * fx) emit('dust', BEC.x + (Math.random() - 0.5) * 0.3, 1.0, BEC.z + 0.15, { vx: (Math.random() - 0.5) * 0.9, vy: 0.7 + Math.random() * 0.6, vz: 0.2, life: 0.7, size: 0.1, alpha: 0.6, color: [0.85, 0.95, 1], grav: 3, drag: 0.4 });
      if (S.flow > 0.4 && t > nextWater) { app.audio.sfx('wasser', { v: u }); nextWater = t + 1.5; }
      const sg = v.gef < THR ? 0 : v.gef < 0.5 ? 1 : 2;
      if (sg !== S.sign) { S.sign = sg; sign.redraw(); }
      // --- Schaubild: eine Murmel läuft den Kreislauf entlang (nur auf den Pfeilen sichtbar)
      const km = kalkAt(t * 0.06), kscale = KALK.W / KALK.w;
      const px = KALK_P.x + (km.x - KALK.W / 2) / kscale, pz = KALK_P.z + (km.y - KALK.H / 2) / kscale;
      marble.position.set(px, 0.03, pz); mglow.position.set(px, 0.032, pz); marble.scale.setScalar(Math.max(0.001, km.k)); mglow.scale.setScalar(Math.max(0.001, km.k));
      marble.material.color.set(km.col); mglow.material.color.set(km.col);
      // --- Beton: Bildfolge neu zeichnen, wenn sich der Schieber ändert
      const bs = Math.round(v.beton * 400); if (bs !== lastBStage) { lastBStage = bs; bet.redraw(); const st = Math.floor(v.beton * 4 + 0.001); if (st !== S.bstage) { if (S.bstage >= 0 && st > S.bstage) app.audio.sfx(st >= 4 ? 'chime' : 'tick'); S.bstage = st; } }
      const mixc = v.beton < 0.25 ? [0.37, 0.26, 0.16] : v.beton < 0.5 ? [0.94, 0.91, 0.87] : v.beton < 0.75 ? [0.71, 0.69, 0.66] : v.beton < 0.995 ? [0.55, 0.55, 0.57] : [0.66, 0.64, 0.57];
      surf.material.color.setRGB(...mixc);
      // --- Straße: Lagen fallen nacheinander in den Graben
      slabs.forEach((s, i) => {
        const p = clamp(v.str * 4 - i); s.m.visible = p > 0.004;
        s.m.position.y = s.y + (1 - easeOutBack(p)) * 1.9; s.m.rotation.z = (1 - p) * 0.05 * (i % 2 ? 1 : -1);
        if (p >= 0.999 && !S.landed[i]) { S.landed[i] = true; if (act) { app.audio.sfx('thud'); app.audio.sfx('hammer'); if (!app.calm) for (let k = 0; k < 6; k++) emit('dust', STR_P.x + (Math.random() - 0.5) * 3, s.y + 0.1, STR_P.z + 0.2, { vx: (Math.random() - 0.5) * 1.2, vy: 0.4 + Math.random() * 0.5, vz: 0.3, life: 0.8, size: 0.3, alpha: 0.45, color: [0.82, 0.76, 0.62], drag: 1.6, grow: 2 }); if (i === 3) app.audio.sfx('chime'); } }
        else if (p < 0.99) S.landed[i] = false;
      });
      const busy = clamp(1 - (t - S.tHam) / 1.2);                  // Arbeiter am Straßenbau regen sich, solange der Schieber bewegt wurde
      if (soldat.fig.parts.armA) soldat.fig.rotatePart('armA', 0.15 + busy * (0.3 + 0.25 * Math.sin(t * 6)));
      soldat.hop = busy * Math.abs(Math.sin(t * 6)) * 0.03;
      const sw = busy * (0.5 + 0.5 * Math.sin(t * 7.5)); mason.fig.rotatePart('armA', 0.45 + (1 - sw) * 0.95 * (busy > 0.05 ? 1 : 0.0));
      if (busy > 0.05 && sw < 0.08 && t - S.tS > 0.55) { S.tS = t; app.audio.sfx('hammer'); if (!app.calm && Math.random() < fx) emit('dust', 6.3, 0.7, -0.05, { vx: 0.3, vy: 0.5, vz: 0.2, life: 0.5, size: 0.15, alpha: 0.5, color: [0.9, 0.85, 0.75], drag: 1.2 }); }
      // --- Tretrad: Rad dreht, Arbeiter läuft, Last steigt
      const phi = v.tret * TAU * 2.6; wheelG.rotation.z = -phi;
      const lift = smooth01(v.tret); lastG.position.y = lerp(HOOK0, HOOK1, lift);
      setSeg(ropeC, KRAN.tip.x, KRAN.tip.y, KRAN.tip.x, lastG.position.y + 0.04);
      const mv = Math.abs(v.tret - (S.lastTret ?? v.tret)); S.lastTret = v.tret; const walking = clamp(mv * 80);
      const ph = phi * 4.4; walker.fig.rotatePart('legA', Math.sin(ph) * 0.5 * (0.2 + 0.8 * walking)); walker.fig.rotatePart('legB', -Math.sin(ph) * 0.5 * (0.2 + 0.8 * walking));
      walker.fig.rotatePart('armA', Math.sin(ph) * 0.35 * walking); walker.fig.rotatePart('armB', -Math.sin(ph) * 0.35 * walking); walker.hop = walking * Math.abs(Math.sin(ph)) * 0.04;
      // --- Mörtel: Maurer rührt
      const stir = 0.25 + 0.75 * clamp(v.beton * 1.3);
      maurer.fig.rotatePart('armA', 0.98 + 0.2 * Math.sin(t * 3.2 * stir) * stir); maurer.hop = 0.012 * Math.abs(Math.sin(t * 3.2 * stir)) * stir;
      // --- Fußbodenheizung: Feuer, Glut im Hohlraum, Luftpfeile, Wärme über dem Boden
      const hv = v.heiz, hot = clamp(hv * 1.15);
      glowCh.material.opacity = 0.42 * hot; mouthGlow.material.opacity = 0.9 * hot * (0.85 + 0.15 * Math.sin(t * 9));
      flames.forEach((f) => { const k = hot * f.userData.sc * (0.85 + 0.25 * Math.sin(t * 11 + f.userData.ph)); f.scale.set(Math.max(0.001, k), Math.max(0.001, k * (0.95 + 0.2 * Math.sin(t * 7 + f.userData.ph))), 1); f.visible = hot > 0.02; });
      const spd = (0.35 + 1.6 * hv) * (hv > 0.02 ? 1 : 0);
      arrows.forEach((a) => {
        a.s = (a.s + spd * dt) % airTotal; const s = a.s, onFirst = s < segLen[0];
        const p0 = onFirst ? AIR[0] : AIR[1], p1 = onFirst ? AIR[1] : AIR[2], q = (onFirst ? s : s - segLen[0]) / (onFirst ? segLen[0] : segLen[1]);
        a.m.position.x = lerp(p0[0], p1[0], q); a.m.position.y = lerp(p0[1], p1[1], q); a.m.rotation.z = onFirst ? 0 : Math.PI / 2;
        a.m.material.opacity = hot > 0.02 ? Math.min(0.95, 0.15 + hot) * clamp(s / 0.4) * clamp((airTotal - s) / 0.5) : 0; a.m.material.color.setHSL(0.12 - 0.05 * (s / airTotal), 1, 0.58);
      });
      shimmer.forEach((l) => { const pos = l.geometry.attributes.position; for (let i = 0; i < 20; i++) { const yy = TH.floorY + 0.1 + (i / 19) * 1.3 + ((t * 0.5 + l.userData.ph) % 0.3); pos.setXYZ(i, l.userData.x + 0.07 * Math.sin(yy * 7 + t * 3 + l.userData.ph), yy, 0); } pos.needsUpdate = true; l.material.opacity = 0.55 * hot; });
      if (hot > 0.25 && Math.random() < dt * 6 * hot * fx) emit('dust', TH_P.x + TH.x0 + 0.47, 2.2, TH_P.z + 0.1, { vx: 0.1 + Math.random() * 0.1, vy: 0.5 + Math.random() * 0.3, vz: 0.05, life: 1.4, size: 0.3, alpha: 0.28, color: [0.75, 0.74, 0.72], drag: 0.5, grow: 2.2 });
      if (hot > 0.25 && !app.calm && Math.random() < dt * 5 * hot * fx) emit('glow', TH_P.x + TH.x0 + 0.5 + Math.random() * 0.3, 0.3, TH_P.z + 0.3, { vx: 0.2, vy: 0.6 + Math.random() * 0.6, vz: 0.1, life: 0.9, size: 0.1, alpha: 0.7, color: [1, 0.6, 0.2] });
      // --- Glasbläser: Glut am Kolben pulsiert
      bulb.material.opacity = 0.55 + 0.25 * Math.sin(t * 2.3);
    });
    // Anfangszustand
    cGef.setValue(0, { snap: true, silent: true }); S.sign = -1;
  },

  onActivate() {},
  onDeactivate(ctx) { const S = ctx.spread.p7; if (S) { S.act = -9; } },
};
