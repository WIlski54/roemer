// Titelseite (Station 0): „Der Goldene Meilenstein“ – Textkarte „So funktioniert das Buch“, Reichskarte als Papierschnitt-Relief (links),
// Triumphbogen „SPQR“ mit Lasche „Tor auf!“ (Lasche links vorn), Schieber „Marsch!“ (Kohorte zieht über die Straße), Goldener Meilenstein mit
// Zeitrad (Lasche „Zeiger drehen“, rechts vorn): das Jahr bestimmt Reichskarte, Anzeige und das Zeitfenster neben dem Buch.
// Antippbar: Meilenstein, Zeitrad, Triumphbogen, Legionsadler, Kohorte, jede Stufe der Reichskarte, Leier (Musik), Gänse-Zähler (Album).
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { textCard, printLabel, blotches, speckles, grassTufts, pebbles, roundRect, SERIF, RED, INK } from '../engine/pagepaint.js';
import { PAGES_DE, CARDS_DE } from '../data/pages.de.js';
import { lerp, clamp, smooth, TAU, mulberry32, Spring, easeOutBack } from '../engine/util.js';
import { panelPart, dither, softLight } from './common.js';
import { buildKarte } from '../art/rom/titel_karte.js';
import { meilensteinPart, zeitradPart, zeigerPart, bogenPart, leierPart, paintDoor, paintAusblick, DISC, BOGEN } from '../art/rom/titel_bauten.js';
import { valueOfYear, yearOfValue, fmtYear, eraOf, EVENTS } from '../data/zeit.js';
// Eigener kleiner Helfer (statt gemeinsamer Station-Kits): Canvas zeichnen und als Textur liefern.
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

// ---------------------------------------------------------------- Geometrie der Seite (Seitenkoordinaten)
const MAP = { w: 6.6, x0: -11.3, z0: -3.78 };                // Reichskarte links hinten (Kartenmaße aus buildKarte)
const ARCH = { x: 3.05, z: -2.75 };                           // Triumphbogen (Mitte des Bogens)
const STONE = { x: 9.7, z: -1.95 };                           // Goldener Meilenstein (Mitte)
const ROAD_Z = 0.55, ROAD_W = 1.2;                            // Straße der Kohorte (Mittellinie, Breite)
const COH = { x0: 5.35, x1: 7.95, gap: 1.18 };                 // Anführer: Startpunkt und Ziel
const STAGES = [
  { id: 'karte_rom', from: -753, name: 'Stadt Rom', when: 'ab 753 v. Chr.', col: '#7a2347' },
  { id: 'karte_italien', from: -264, name: 'Ganz Italien', when: 'um 264 v. Chr.', col: '#a3283f' },
  { id: 'karte_mittelmeer', from: -146, name: 'Mittelmeer-Reich', when: 'um 146 v. Chr.', col: '#c8693a' },
  { id: 'karte_caesar', from: -51, name: 'Caesar und die Kaiser', when: '51 v. bis 116 n. Chr.', col: '#e0a63a' },
  { id: 'karte_hoehepunkt', from: 117, name: 'Größte Ausdehnung', when: 'um 117 n. Chr.', col: '#f0cb5a' },
  { id: 'karte_teilung', from: 395, name: 'Das Reich wird geteilt', when: '395 n. Chr.', col: '#6b2a8f' },
  { id: 'karte_ende', from: 476, name: 'Ende im Westen', when: '476 n. Chr.', col: '#9a8f9c' },
];
const stageOf = (y) => { let s = 0; STAGES.forEach((st, i) => { if (y >= st.from) s = i; }); return s; };
const HEIGHT = [0.11, 0.14, 0.17, 0.2, 0.23];                 // Reliefhöhe je Gruppe der Karte
const GCOL = ['#7a2347', '#a3283f', '#c8693a', '#e0a63a', '#f0cb5a'];
const WEST_COL = '#c8693a', EAST_COL = '#6b2a8f', LOST_COL = '#cfc4cf';
const TOTAL_GEESE = Object.keys(CARDS_DE).filter((k) => CARDS_DE[k].hidden).length || 8;

// ---------------------------------------------------------------- Hilfen
function ringsToShapes(rings) {
  const area = (r) => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return Math.abs(a / 2); };
  const inside = (pt, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const xi = r[i][0], yi = r[i][1], xj = r[j][0], yj = r[j][1]; if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)) c = !c; } return c; };
  const rs = rings.filter((r) => r.length >= 3).map((r) => ({ r, a: area(r) })).sort((p, q) => q.a - p.a);
  const outers = [], holes = [];
  for (const it of rs) { const depth = rs.filter((o) => o !== it && o.a > it.a && inside(it.r[0], o.r)).length; (depth % 2 === 0 ? outers : holes).push(it); }
  const shapes = outers.map((o) => ({ o, shape: new THREE.Shape(o.r.map((q) => new THREE.Vector2(q[0], q[1]))) }));
  for (const h of holes) { const host = shapes.filter((s) => inside(h.r[0], s.o.r)).sort((p, q) => p.o.a - q.o.a)[0]; if (host) host.shape.holes.push(new THREE.Path(h.r.map((q) => new THREE.Vector2(q[0], q[1])))); }
  return shapes.map((s) => s.shape);
}
let GRAIN = null;
function grainTex() {
  if (GRAIN) return GRAIN;
  GRAIN = canvasTex(128, 128, (g, W, H) => { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); const r = mulberry32(5); for (let i = 0; i < 700; i++) { g.fillStyle = r() > 0.5 ? 'rgba(120,90,50,.07)' : 'rgba(255,255,255,.2)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); } });
  GRAIN.wrapS = GRAIN.wrapT = THREE.RepeatWrapping; GRAIN.colorSpace = THREE.NoColorSpace; return GRAIN;
}
function drawGoose(g, x, y, s, found) {
  g.save(); g.translate(x, y); g.scale(s, s); g.lineJoin = 'round'; g.lineCap = 'round';
  const body = found ? '#fbf6ea' : 'rgba(70,45,30,.4)', edge = found ? '#7a5a3a' : 'rgba(70,45,30,.55)';
  g.fillStyle = body; g.strokeStyle = edge; g.lineWidth = 0.05;
  g.beginPath(); g.moveTo(-0.62, 0.0); g.lineTo(-0.34, 0.2); g.lineTo(-0.5, 0.38); g.closePath(); g.fill(); g.stroke();                 // Schwanz
  g.beginPath(); g.ellipse(-0.02, 0.2, 0.52, 0.34, -0.12, 0, TAU); g.fill(); g.stroke();                                              // Körper
  g.strokeStyle = edge; g.lineWidth = 0.27; g.beginPath(); g.moveTo(0.3, 0.12); g.bezierCurveTo(0.52, 0.0, 0.5, -0.3, 0.56, -0.5); g.stroke();   // Hals (Rand)
  g.strokeStyle = body; g.lineWidth = 0.2; g.beginPath(); g.moveTo(0.3, 0.12); g.bezierCurveTo(0.52, 0.0, 0.5, -0.3, 0.56, -0.5); g.stroke();   // Hals (Füllung)
  g.fillStyle = body; g.strokeStyle = edge; g.lineWidth = 0.05; g.beginPath(); g.arc(0.6, -0.58, 0.15, 0, TAU); g.fill(); g.stroke();   // Kopf
  g.fillStyle = found ? '#f08a24' : 'rgba(70,45,30,.5)'; g.beginPath(); g.moveTo(0.72, -0.64); g.lineTo(0.98, -0.56); g.lineTo(0.72, -0.5); g.closePath(); g.fill();
  g.fillStyle = found ? '#2c1a10' : 'rgba(20,10,5,.55)'; g.beginPath(); g.arc(0.63, -0.6, 0.035, 0, TAU); g.fill();
  if (found) { g.strokeStyle = '#d8c9a8'; g.lineWidth = 0.045; g.beginPath(); g.moveTo(-0.3, 0.22); g.quadraticCurveTo(-0.05, 0.4, 0.28, 0.2); g.stroke(); }
  else { g.fillStyle = 'rgba(40,25,15,.55)'; g.font = 'bold 0.5px Georgia,serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0.0, 0.2); }
  g.restore();
}

export default {
  id: 'titel',
  mood: mood({ key: '#ffd7a0', keyI: 2.45, sky: '#f4d3ae', gnd: '#7a4a38', hemiI: 1.8, pos: [-12, 20, 11], rim: 0.1 }),
  motes: { colors: [[1, 0.9, 0.62], [1, 0.82, 0.55]], size: 0.09, alpha: 0.3, dx: 0.06, dy: 0.05, dz: 0.01, tw: 1.0, density: 0.7 },
  atmo: 'titel',

  // ------------------------------------------------------------ gemalte Seitenflächen
  base() {
    const d = PAGES_DE[0];
    const K = buildKarte({ w: MAP.w });
    return {
      L: {
        paper: '#f6ecd2', ground: { back: '#efe2c4', front: '#e3cf9f' }, margin: 0.3, pageNo: 1, seed: 3,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 18, rmin: 0.8, rmax: 2.2, colors: ['rgba(255,244,214,.2)', 'rgba(200,150,90,.08)'], seed: 4 });
          // Kartenrahmen: gemaltes Meer mit Wellen, Rand wie ein aufgeklebtes Papier
          const x0 = MAP.x0 - 0.14, z0 = MAP.z0 - 0.14, w = MAP.w + 0.28, h = K.d + 0.28;
          ctx.save(); ctx.shadowColor = 'rgba(40,20,5,.4)'; ctx.shadowBlur = 0.14 * S; ctx.shadowOffsetY = 0.05 * S;
          ctx.fillStyle = '#fbf3da'; roundRect(ctx, m.x(x0), m.z(z0), w * S, h * S, 0.07 * S); ctx.fill(); ctx.restore();
          const gx = m.x(MAP.x0), gz = m.z(MAP.z0), gw = MAP.w * S, gh = K.d * S;
          const sea = ctx.createLinearGradient(0, gz, 0, gz + gh); sea.addColorStop(0, '#5f94bd'); sea.addColorStop(1, '#3d78a8');
          ctx.fillStyle = sea; ctx.fillRect(gx, gz, gw, gh);
          ctx.save(); ctx.beginPath(); ctx.rect(gx, gz, gw, gh); ctx.clip();
          const r = mulberry32(21); ctx.strokeStyle = 'rgba(235,248,255,.34)'; ctx.lineWidth = 0.022 * S; ctx.lineCap = 'round';
          for (let i = 0; i < 170; i++) { const x = gx + r() * gw, y = gz + r() * gh, l = (0.18 + r() * 0.2) * S; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l * 0.25, y - 0.07 * S, x + l * 0.5, y); ctx.quadraticCurveTo(x + l * 0.75, y + 0.07 * S, x + l, y); ctx.stroke(); }
          ctx.restore();
          ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 0.035 * S; ctx.strokeRect(gx, gz, gw, gh);
          // Windrose in der Ecke
          const [wx, wz] = [m.x(MAP.x0 + 0.55), m.z(MAP.z0 + K.d - 0.55)]; ctx.save(); ctx.translate(wx, wz); ctx.fillStyle = 'rgba(255,240,200,.9)';
          for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -0.3 * S); ctx.lineTo(0.06 * S, -0.06 * S); ctx.lineTo(-0.06 * S, -0.06 * S); ctx.closePath(); ctx.fill(); }
          ctx.fillStyle = '#7a1f1f'; ctx.font = `bold ${0.14 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', 0, 0.02 * S - 0.4 * S); ctx.restore();
          // Textkarte
          textCard(m, { x: -11.5, z: 0.95, w: 6.0, h: 3.05, kicker: d.kicker, title: d.title, sub: d.years, body: d.card, size: 0.262, titleSize: 0.4 });
        },
      },
      R: {
        paper: '#f4e6c6', ground: { back: '#ead2a0', front: '#d4af6e' }, margin: 0.3, pageNo: 2, seed: 4,
        draw(ctx, m) {
          const S = m.S;
          blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.6, rmax: 1.9, colors: ['rgba(255,244,214,.18)', 'rgba(150,100,50,.1)'], seed: 9 });
          speckles(m, { x0: 0.3, x1: 11.8, z0: -4, z1: 4, n: 380, color: 'rgba(110,70,30,.22)', size: 0.03, seed: 13 });
          pebbles(m, { x0: 0.4, x1: 11.6, z0: 1.9, z1: 3.9, n: 10, seed: 7 });
          grassTufts(m, { x0: 0.4, x1: 11.6, z0: -3.7, z1: 3.9, n: 14, color: '#8a9a4a', h: 0.22, seed: 5, blades: 4, alpha: 0.6 });
          // Straße: Pflaster mit Randsteinen; vom Tor sich verbreiternd, dann quer über die Seite
          const road = (pts, col, off = 0) => { ctx.beginPath(); pts.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z + off); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
          const gate = ARCH.x, gz0 = ARCH.z + 0.45;
          const zh0 = ROAD_Z - ROAD_W / 2, zh1 = ROAD_Z + ROAD_W / 2;
          const shape = [[gate - 1.15, gz0], [gate + 1.15, gz0], [gate + 1.75, zh0], [12.3, zh0], [12.3, zh1], [gate - 1.75, zh1], [0.15, zh1], [0.15, zh0], [gate - 1.75, zh0]];
          ctx.save(); ctx.shadowColor = 'rgba(60,30,10,.35)'; ctx.shadowBlur = 0.08 * S; road(shape, '#b9a47c'); ctx.restore();
          road(shape.map(([x, z]) => [x, z]), '#ddc99a');
          // Plattenmuster
          ctx.save(); ctx.beginPath(); shape.forEach(([x, z], i) => { const [X, Y] = m.pt(x, z); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.clip();
          const rr = mulberry32(31); ctx.strokeStyle = 'rgba(120,85,45,.35)'; ctx.lineWidth = 0.018 * S;
          for (let z = gz0; z < zh1; z += 0.34) { ctx.beginPath(); ctx.moveTo(m.x(0), m.z(z)); ctx.lineTo(m.x(12.4), m.z(z)); ctx.stroke(); }
          for (let z = gz0, row = 0; z < zh1; z += 0.34, row++) for (let x = (row % 2) * 0.28; x < 12.4; x += 0.56 + rr() * 0.12) { ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.lineTo(m.x(x), m.z(z + 0.34)); ctx.stroke(); }
          for (let i = 0; i < 160; i++) { ctx.fillStyle = rr() > 0.5 ? 'rgba(255,245,210,.22)' : 'rgba(120,80,40,.13)'; ctx.beginPath(); ctx.arc(m.x(rr() * 12), m.z(gz0 + rr() * (zh1 - gz0)), (0.04 + rr() * 0.07) * S, 0, TAU); ctx.fill(); }
          ctx.restore();
          // Plattform unter dem Meilenstein
          ctx.save(); ctx.shadowColor = 'rgba(60,30,10,.35)'; ctx.shadowBlur = 0.1 * S; ctx.fillStyle = '#e3cf9d'; ctx.beginPath(); ctx.ellipse(m.x(STONE.x), m.z(STONE.z + 0.2), 2.05 * S, 1.2 * S, 0, 0, TAU); ctx.fill(); ctx.restore();
          ctx.strokeStyle = 'rgba(120,85,45,.5)'; ctx.lineWidth = 0.03 * S; ctx.beginPath(); ctx.ellipse(m.x(STONE.x), m.z(STONE.z + 0.2), 1.75 * S, 1.0 * S, 0, 0, TAU); ctx.stroke();
          // Beschriftung der Straße
          printLabel(m, 'Via Triumphalis', 8.9, ROAD_Z + 0.02, { size: 0.17, color: 'rgba(100,60,20,.55)', italic: true, bold: false });
          printLabel(m, '0 Uhr', 1.0, 0, { size: 0.01, color: 'rgba(0,0,0,0)' });
        },
      },
    };
  },

  // ------------------------------------------------------------ Aufbau
  *build(ctx) {
    const app = ctx.app, L = ctx.L, R = ctx.R;
    const T = (ctx.spread.p0 = { year: -753, stage: 0, pieces: [], found: -1, intro: false, introDone: false, introT: 0, actT: -1, gateOpen: 0, parade: 0 });
    const rand = mulberry32(5);

    // ---------------- Himmel und ferne Hügel
    for (const [s, cx] of [['L', -5.975], ['R', 5.975]]) {
      const k = s === 'L' ? 0 : 1;
      ctx.flat(panelPart(-5.775, 5.775, 5.0, {
        fill: { stops: [[0, '#7c6aa4'], [0.38, '#d68f88'], [0.74, '#f6c88f'], [1, '#fde5b4']], dir: 'v' }, wave: 0.2, freq: 2.4, phase: 0.6 + k * 1.7, seed: 3 + k,
        deco: (c, bb) => { softLight(c, bb, { color: 'rgba(255,230,160,.5)', cx: s === 'L' ? 0.9 : 0.35, cy: 0.35, r: 0.9 }); dither(c, bb, '#fff', { n: 60, alpha: 0.12, size: 0.04, seed: 5 + k }); },
      }), { x: cx, z: -4.05, lean: -0.04, name: 'sky' + s, delay: 0, ppu: 56, border: 0.04 });
    }
    ctx.flat(panelPart(-5.5, 5.5, 1.5, { fill: { top: '#9a6f90', bottom: '#c78f88' }, wave: 0.3, freq: 2.0, phase: 1.1, seed: 12 }), { x: 6.0, z: -3.5, name: 'hills', delay: 0.05, ppu: 50, border: 0.03 });
    yield;

    // ---------------- Reichskarte (Papierschnitt-Relief) links hinten
    const K = buildKarte({ w: MAP.w });
    const mapX = MAP.x0, mapZ = MAP.z0 + K.d;                      // Südwestecke der Karte (Seitenkoordinaten)
    const grain = grainTex(); grain.needsUpdate = true;
    const sideMat = new THREE.MeshLambertMaterial({ color: 0xf6edd6 });
    const mk = (rings, height, color) => {
      const geo = new THREE.ExtrudeGeometry(ringsToShapes(rings), { depth: height, bevelEnabled: false, curveSegments: 1 });
      const m = new THREE.Mesh(geo, [new THREE.MeshLambertMaterial({ color, map: grain }), sideMat]);
      m.rotation.x = -Math.PI / 2; m.position.set(mapX, 0.004, mapZ); m.castShadow = true; m.receiveShadow = true; return m;
    };
    const land = mk(K.land, 0.05, '#ecdfbd'); L.add(land);
    yield;
    const hitList = [];
    K.pieces.forEach((p, i) => {
      const parts = [];
      for (const [rings, east] of [[p.west, false], [p.east, true]]) {
        if (!rings.length) continue;
        const mesh = mk(rings, HEIGHT[p.group], GCOL[p.group]); mesh.scale.z = 0.001; mesh.visible = false; L.add(mesh);
        const it = { p, mesh, east, spring: new Spring(0, 150, 14), col: new THREE.Color(GCOL[p.group]), colT: new THREE.Color(GCOL[p.group]), up: 0, delay: 0 };
        parts.push(it); T.pieces.push(it); hitList.push(it);
        L.addTap(mesh, () => { if (it.spring.x < 0.5) return; app.audio.sfx('tapp'); app.openCardById(STAGES[stageOf(T.year)].id); }, () => it.spring.x > 0.5);
      }
    });
    // Reihenfolge des Auftauchens: nach Jahr, bei gleichem Jahr gestaffelt
    T.pieces.forEach((it, i) => { it.rank = it.p.from * 1000 + i; });
    yield;

    // ---------------- Triumphbogen mit Tor und Ausblick
    const { W: AW, H: AH, open: AO, crown: AC } = BOGEN;
    const hwO = (AW * AO) / 2, yc = AH * AC, ys = yc - hwO;
    const arch = ctx.flat(bogenPart(), { x: ARCH.x, z: ARCH.z, name: 'bogen', delay: 0.12, ppu: Math.min(app.q.ppu, 120), maxTex: 1536, thickness: 0.04, border: 0.05, receive: false });
    const back = new THREE.Mesh(new THREE.PlaneGeometry(2 * hwO + 0.2, yc + 0.1), new THREE.MeshBasicMaterial({ map: canvasTex(320, 380, paintAusblick), fog: false }));
    back.position.set(0, (yc + 0.1) / 2, -0.07); arch.add(back);
    const leafTex = canvasTex(200, 440, paintDoor);
    const leafMats = [new THREE.MeshLambertMaterial({ color: 0xcaa24a }), new THREE.MeshLambertMaterial({ map: leafTex })];
    const leaves = [1, -1].map((sd) => {
      const pts = [[0, 0], [hwO, 0], [hwO, yc]];
      for (let k = 1; k <= 14; k++) { const a = hwO * (1 - k / 14); pts.push([a, ys + Math.sqrt(Math.max(0, hwO * hwO - (hwO - a) * (hwO - a)))]); }
      const shape = new THREE.Shape(pts.map(([a, y]) => new THREE.Vector2(-sd * a, y)));
      const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: false, curveSegments: 1 });
      const uv = geo.attributes.uv, pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, Math.abs(pos.getX(i)) / hwO, pos.getY(i) / yc);
      const mesh = new THREE.Mesh(geo, [leafMats[1], new THREE.MeshLambertMaterial({ color: 0xcaa24a })]);
      mesh.castShadow = true; mesh.receiveShadow = true;
      const g = new THREE.Group(); g.position.set(sd * hwO, 0, 0.0); g.add(mesh); arch.add(g);
      return { g, sd };
    });
    arch.pickMeshes = [arch.cut.mesh]; arch.cut.mesh.userData.tap = () => { app.audio.sfx('tapp'); app.openCardById('triumphbogen'); };
    leaves.forEach((lf) => lf.g.children[0].userData.tap = () => { app.audio.sfx('tapp'); app.openCardById('triumphbogen'); });
    arch.pickMeshes.push(...leaves.map((l) => l.g.children[0]));
    yield;

    // ---------------- Goldener Meilenstein mit Zeitrad
    const stone = ctx.flat(meilensteinPart(), { x: STONE.x, z: STONE.z, name: 'meilenstein', delay: 0.18, ppu: Math.min(app.q.ppu, 150), maxTex: 1280, thickness: 0.06, border: 0.05 });
    stone.pickMeshes = [stone.cut.mesh]; stone.cut.mesh.userData.tap = () => { app.audio.sfx('tapp'); app.openCardById('meilenstein'); };
    const wheel = ctx.flat(zeitradPart(), { x: STONE.x, z: STONE.z + 0.2, name: 'zeitrad', delay: 0.26, ppu: Math.min(app.q.ppu, 170), maxTex: 1536, thickness: 0.05, border: 0.07 });
    wheel.pickMeshes = [wheel.cut.mesh]; wheel.cut.mesh.userData.tap = () => { app.audio.sfx('tapp'); app.openCardById('zeitrad'); };
    const handCut = ctx.flat(zeigerPart(), { x: 0, z: 0, name: 'zeiger', thickness: 0.03, border: 0.03 });
    handCut.group.removeFromParent(); R.popups.splice(R.popups.indexOf(handCut), 1);
    const handG = new THREE.Group(); handG.position.set(0, DISC.CY, 0.1); handG.add(...handCut.pivot.children); wheel.add(handG);
    // Jahres-Anzeige in der Mitte des Rades (zeichnet sich bei jeder Änderung neu)
    const hubCv = document.createElement('canvas'); hubCv.width = 256; hubCv.height = 256; const hg = hubCv.getContext('2d');
    const hubTex = new THREE.CanvasTexture(hubCv); hubTex.colorSpace = THREE.SRGBColorSpace; hubTex.anisotropy = 4;
    const hub = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 1.16), new THREE.MeshBasicMaterial({ map: hubTex, transparent: true, depthWrite: false }));
    hub.position.set(0, DISC.CY, 0.115); hub.renderOrder = 6; wheel.add(hub);
    // Anzeige unter dem Meilenstein (Jahr, Zeitalter, Ereignis)
    const dispCv = document.createElement('canvas'); dispCv.width = 1024; dispCv.height = 320; const dg = dispCv.getContext('2d');
    const dispTex = new THREE.CanvasTexture(dispCv); dispTex.colorSpace = THREE.SRGBColorSpace; dispTex.anisotropy = 4;
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.4), new THREE.MeshBasicMaterial({ map: dispTex, transparent: true }));
    disp.rotation.x = -Math.PI / 2; disp.position.set(STONE.x, 0.014, 2.2); R.add(disp);
    yield;

    // ---------------- Kohorte auf der Straße
    const coh = [
      ['p_zenturio', 2.1, 'kohorte'], ['p_aquilifer', 2.04, 'aquila'], ['p_legionaer', 2.0, 'kohorte'], ['p_legionaer', 2.0, 'kohorte'], ['p_legionaer', 2.0, 'kohorte'],
    ].map(([id, h, card], i) => {
      const a = ctx.stand(id, { x: COH.x0 - i * COH.gap, z: ROAD_Z + 0.04 + (i % 2) * 0.1, h, facing: 1, delay: 0.3 + i * 0.04, card, id: i === 1 ? 'aquila' : 'kohorte', name: i === 0 ? 'Zenturio' : i === 1 ? 'Adlerträger' : 'Legionär', hint: i === 1 });
      return { a, f: a.fig, i, ph: i * 0.8, dist: 0, last: a.popup.group.position.x };
    });
    const moveCohort = (v, dt) => {
      const lead = lerp(COH.x0, COH.x1, v);
      coh.forEach((m) => {
        const nx = lead - m.i * COH.gap, dx = nx - m.a.popup.group.position.x; m.a.popup.group.position.x = nx;
        if (Math.abs(dx) > 0.0004 && dt > 0) { m.dist += Math.abs(dx); const ph = m.dist * 7 + m.ph; m.f.rotatePart('legA', Math.sin(ph) * 0.42); m.f.rotatePart('legB', -Math.sin(ph) * 0.42); m.a.hop = Math.abs(Math.sin(ph)) * 0.05; }
        else { m.f.rotatePart('legA', 0); m.f.rotatePart('legB', 0); m.a.hop = 0; }
      });
    };
    yield;

    // ---------------- Kulisse: Zypressen, Büsche, Leier
    ctx.prop('zypresse', { x: 6.55, z: -2.0, h: 3.0, delay: 0.34 });
    ctx.prop('zypresse', { x: 7.15, z: -3.0, h: 2.5, delay: 0.36 });
    ctx.prop('zypresse', { x: 0.55, z: -3.0, h: 2.6, delay: 0.36 });
    ctx.prop('bush', { x: 11.4, z: 1.4, len: 1.1, delay: 0.38 });
    ctx.prop('bush', { x: 0.9, z: 2.2, len: 1.0, delay: 0.38 });
    const leier = ctx.flat(leierPart(), { x: 5.6, z: 2.55, ws: 1.5, name: 'leier', delay: 0.4, ppu: 140, thickness: 0.04, border: 0.04 });
    leier.pickMeshes = [leier.cut.mesh]; leier.cut.mesh.userData.tap = () => { app.audio.sfx('musicbox'); app.audio.sfx('chime'); app.openCardById('musik'); };
    yield;

    // ---------------- Anzeige-Tafeln auf der linken Seite: Stufen-Legende und Gänse-Zähler
    const LEG = { x: -2.55, z: -1.95, w: 3.7, h: 4.4 };
    const legCv = document.createElement('canvas'); legCv.width = 592; legCv.height = 704; const lg = legCv.getContext('2d');
    const legTex = new THREE.CanvasTexture(legCv); legTex.colorSpace = THREE.SRGBColorSpace; legTex.anisotropy = 4;
    const legend = new THREE.Mesh(new THREE.PlaneGeometry(LEG.w, LEG.h), new THREE.MeshBasicMaterial({ map: legTex, transparent: true })); legend.rotation.x = -Math.PI / 2; legend.position.set(LEG.x, 0.012, LEG.z); L.add(legend);
    const GZ = { x: -2.75, z: 2.0, w: 4.2, h: 1.9 };
    const gCv = document.createElement('canvas'); gCv.width = 672; gCv.height = 304; const gg = gCv.getContext('2d');
    const gTex = new THREE.CanvasTexture(gCv); gTex.colorSpace = THREE.SRGBColorSpace; gTex.anisotropy = 4;
    const gans = new THREE.Mesh(new THREE.PlaneGeometry(GZ.w, GZ.h), new THREE.MeshBasicMaterial({ map: gTex, transparent: true })); gans.rotation.x = -Math.PI / 2; gans.position.set(GZ.x, 0.013, GZ.z); L.add(gans);
    L.addTap(gans, () => { app.audio.sfx('tapp'); app.openCardById('album'); });
    // Überraschung, wenn alle Gänse gefunden sind: drei Gänse tauchen auf dem Zähler auf
    const paradeGeese = ['gans2', 'gans5', 'gans8'].map((id, i) => {
      const a = ctx.stand(id, { x: GZ.x - 1.2 + i * 1.2, z: GZ.z - 0.2, len: 0.85, facing: i === 1 ? -1 : 1, delay: 0.5, card: null, hint: false, hitPad: 0.1, name: 'Gans' });
      a.fig.group.scale.setScalar(0.0001); return a;
    });
    yield;

    // ---------------- Steuerungen
    const ctlTor = ctx.control('L', { id: 'tor', label: 'Tor auf!', a: [-4.0, 3.55], b: [-2.0, 3.55], size: [1.9, 0.95], color: '#8b2a4a', value: 0, springBack: false, hold: true, ticks: 0 });
    const ctlMarsch = ctx.control('R', { id: 'marsch', label: 'Marsch!', a: [1.4, 3.6], b: [4.6, 3.6], size: [2.1, 0.95], color: '#a3283f', value: 0, springBack: false, hold: true, ticks: 14 });
    const ctlZeiger = ctx.control('R', { id: 'zeiger', label: 'Zeiger drehen', a: [7.6, 3.6], b: [10.7, 3.6], size: [2.4, 1.0], color: '#b8862d', value: 0, springBack: false, hold: true, ticks: 30 });
    T.ctl = ctlZeiger;

    // Tor
    let horn = false;
    ctlTor.on((v) => {
      const e = smooth(clamp(v)); T.gateOpen = e;
      for (const lf of leaves) lf.g.rotation.y = lf.sd * 1.72 * e;
      if (v > 0.9 && !horn) { horn = true; app.audio.sfx('cornu'); app.audio.sfx('chime'); }
      if (v < 0.25) horn = false;
    });
    ctlTor.onGrab = () => app.audio.sfx('grab'); ctlTor.onTick = (v) => app.audio.sfx('slide', { v }); ctlTor.onRelease = () => app.audio.sfx('snap');

    // Marsch
    ctlMarsch.on((v) => moveCohort(clamp(v), 1 / 60));
    ctlMarsch.onGrab = () => app.audio.sfx('grab'); ctlMarsch.onTick = (v) => app.audio.sfx('marsch', { n: 2, v }); ctlMarsch.onRelease = () => app.audio.sfx('snap');
    moveCohort(0, 0);

    // Zeitrad
    const drawHub = (year) => {
      hg.clearRect(0, 0, 256, 256); hg.textAlign = 'center'; hg.textBaseline = 'middle'; hg.fillStyle = '#6b4a2a'; hg.font = `bold 26px ${SERIF}`; hg.fillText('Jahr', 128, 78);
      const abs = Math.abs(year); hg.fillStyle = '#7a1a1a'; hg.font = `bold ${abs >= 1000 ? 60 : 72}px ${SERIF}`; hg.fillText(String(abs), 128, 142);
      hg.fillStyle = '#4a3220'; hg.font = `bold 34px ${SERIF}`; hg.fillText(year < 0 ? 'v. Chr.' : 'n. Chr.', 128, 198); hubTex.needsUpdate = true;
    };
    const drawDisp = (year, st) => {
      dg.clearRect(0, 0, 1024, 320);
      dg.save(); dg.fillStyle = 'rgba(247,237,211,.92)'; roundRect(dg, 6, 6, 1012, 308, 34); dg.fill(); dg.strokeStyle = '#b8862d'; dg.lineWidth = 6; roundRect(dg, 6, 6, 1012, 308, 34); dg.stroke(); dg.restore();
      const era = eraOf(year); let ev = null, bd = 1e9; for (const e of EVENTS) { const d = Math.abs(e.y - year); if (d < bd) { bd = d; ev = e; } }
      dg.textAlign = 'center'; dg.textBaseline = 'middle';
      dg.fillStyle = '#7a1a1a'; dg.font = `bold 96px ${SERIF}`; dg.fillText(fmtYear(year), 512, 82);
      dg.fillStyle = era.col; dg.beginPath(); dg.arc(512 - dg.measureText(era.name).width / 2 - 30, 158, 14, 0, TAU); dg.fill();
      dg.fillStyle = '#3a2615'; dg.font = `bold 46px ${SERIF}`; dg.fillText(era.name, 512, 158);
      dg.font = `italic 38px ${SERIF}`; dg.fillStyle = '#6b4a2a'; dg.fillText('Karte: ' + STAGES[st].name, 512, 214);
      if (ev && bd <= 12) { dg.fillStyle = '#a4161a'; dg.font = `bold 38px ${SERIF}`; dg.fillText('★ ' + ev.label, 512, 268); }
      else { dg.fillStyle = '#8a6b3f'; dg.font = `italic 34px ${SERIF}`; dg.fillText('Zieh den Zeiger weiter!', 512, 268); }
      dispTex.needsUpdate = true;
    };
    const drawLegend = (st) => {
      lg.clearRect(0, 0, 592, 704); const sx = 592 / LEG.w;
      lg.fillStyle = 'rgba(251,243,218,.93)'; roundRect(lg, 4, 4, 584, 696, 26); lg.fill(); lg.strokeStyle = '#b8862d'; lg.lineWidth = 5; roundRect(lg, 4, 4, 584, 696, 26); lg.stroke();
      lg.textAlign = 'left'; lg.textBaseline = 'middle'; lg.fillStyle = RED; lg.font = `bold italic 42px ${SERIF}`; lg.fillText('Das Reich wächst', 34, 60);
      lg.strokeStyle = 'rgba(139,30,30,.35)'; lg.lineWidth = 2; lg.beginPath(); lg.moveTo(34, 96); lg.lineTo(558, 96); lg.stroke();
      STAGES.forEach((s, i) => {
        const y = 150 + i * 76, reached = i <= st, now = i === st;
        lg.globalAlpha = reached ? 1 : 0.42;
        if (now) { lg.fillStyle = 'rgba(240,203,90,.4)'; roundRect(lg, 18, y - 34, 556, 68, 18); lg.fill(); lg.strokeStyle = '#b8862d'; lg.lineWidth = 3; roundRect(lg, 18, y - 34, 556, 68, 18); lg.stroke(); }
        lg.fillStyle = s.col; lg.beginPath(); lg.arc(52, y, 17, 0, TAU); lg.fill(); lg.strokeStyle = '#fff4d0'; lg.lineWidth = 4; lg.stroke();
        lg.fillStyle = '#3a2615'; lg.textAlign = 'left'; lg.font = `${now ? 'bold ' : ''}35px ${SERIF}`; lg.fillText(s.name, 86, y - 13);
        lg.fillStyle = '#7a5a3a'; lg.font = `italic 28px ${SERIF}`; lg.fillText(s.when, 86, y + 21);
        lg.globalAlpha = 1;
      });
      legTex.needsUpdate = true;
    };
    const drawGeese = (n) => {
      gg.clearRect(0, 0, 672, 304);
      gg.fillStyle = n >= TOTAL_GEESE ? 'rgba(255,238,170,.96)' : 'rgba(251,243,218,.93)'; roundRect(gg, 4, 4, 664, 296, 26); gg.fill(); gg.strokeStyle = '#b8862d'; gg.lineWidth = 5; roundRect(gg, 4, 4, 664, 296, 26); gg.stroke();
      gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.fillStyle = RED; gg.font = `bold italic 46px ${SERIF}`; gg.fillText(n >= TOTAL_GEESE ? 'Alle Gänse gefunden! Bravo!' : 'Such die Gans!', 336, 56);
      for (let i = 0; i < TOTAL_GEESE; i++) drawGoose(gg, 96 + i * 68, 150, 62, i < n);
      gg.fillStyle = '#3a2615'; gg.font = `bold 34px ${SERIF}`; gg.fillText(n + ' von ' + TOTAL_GEESE + ' gefunden', 336, 232);
      gg.fillStyle = '#8a6b3f'; gg.font = `italic 26px ${SERIF}`; gg.fillText('Tippe hier für dein Gänse-Album', 336, 272);
      gTex.needsUpdate = true;
    };
    drawLegend(0); drawDisp(-753, 0); drawHub(-753); drawGeese(0);

    // Zustand: Jahr -> Stufe -> Karte
    let lastStage = -1, lastYear = null;
    const applyYear = (v) => {
      const year = yearOfValue(v); T.year = year; handG.rotation.z = -v * TAU;
      const st = stageOf(year);
      if (year !== lastYear) { lastYear = year; drawHub(year); drawDisp(year, st); }
      if (st !== lastStage) {
        if (lastStage >= 0 && T.actT >= 0) app.audio.sfx(st > lastStage ? 'ping' : 'tick');
        lastStage = st; T.stage = st; drawLegend(st);
      }
      // Ziele der Kartenteile
      const split = year >= 395, lost = year >= 476;
      for (const it of T.pieces) {
        it.on = year >= it.p.from;
        it.colT.set(split ? (it.east ? EAST_COL : lost ? LOST_COL : WEST_COL) : GCOL[it.p.group]);
        it.sink = lost && !it.east;
      }
    };
    ctlZeiger.on((v) => applyYear(clamp(v)));
    ctlZeiger.onGrab = () => { app.audio.sfx('grab'); T.intro = false; };
    ctlZeiger.onTick = () => app.audio.sfx('tick', { fast: true });
    ctlZeiger.onRelease = (v) => { app.audio.sfx('snap'); if (v > 0.995) app.audio.sfx('gong'); };
    applyYear(0);
    if (app.timewin) {
      app.timewin.attach(ctlZeiger); app.timewin.setV(0);
      app.timewin.avoid = { x0: STONE.x - 2.0, x1: STONE.x + 2.0, y1: 5.5, z: STONE.z };
    }
    R.group.userData.zeitrad = wheel;

    // ---------------- Update je Bild
    const tmpC = new THREE.Color();
    ctx.onUpdate((dt, t) => {
      const act = ctx.spread.active;
      if (act) {
        if (T.actT < 0) T.actT = t;
        if (app.timewin) app.timewin.setV(ctlZeiger.sp.x);
      } else T.actT = -1;
      // Intro: der Zeiger läuft einmal von der Gründung bis zur größten Ausdehnung
      if (T.intro) {
        T.introT += dt; const k = clamp(T.introT / 7.5); const e = k * k * (3 - 2 * k);
        ctlZeiger.touched = true; ctlZeiger.setValue(e * valueOfYear(117), { snap: true });
        if (k >= 1) { T.intro = false; T.introDone = true; }
      }
      // Kartenteile heben sich (Reihenfolge nach Jahr, Stufen gestaffelt)
      const now = act ? t - T.actT : -1;
      const order = T.pieces.slice().sort((a, b) => a.rank - b.rank);
      order.forEach((it, i) => {
        if (it.on !== it.prevOn) { it.prevOn = it.on; it.delay = i * 0.07; it.t0 = now; }
        const ready = act && now > 0.7 && it.on && (now - (it.t0 || 0)) >= it.delay;
        const target = ready ? (it.sink ? 0.28 : 1) : 0;
        it.spring.set(target);
        const s = it.spring.update(dt);
        it.mesh.visible = s > 0.012; it.mesh.scale.z = Math.max(0.001, s);
        it.col.lerp(it.colT, 1 - Math.exp(-dt * 5)); it.mesh.material[0].color.copy(it.col);
      });
      // Gänse-Zähler und Überraschung
      const n = app.found ? app.found.size : 0;
      if (n !== T.found) {
        T.found = n; drawGeese(n);
        if (n >= TOTAL_GEESE && act) { T.parade = 1; app.audio.sfx('fanfare'); app.audio.sfx('chime'); }
      }
      if (n >= TOTAL_GEESE) {
        paradeGeese.forEach((g, i) => {
          const s = easeOutBack(clamp((t - (T.paradeT0 ?? (T.paradeT0 = t)) - i * 0.25) / 0.7)); g.fig.group.scale.setScalar(Math.max(0.0001, s));
          g.hop = Math.max(0, Math.sin(t * 3 + i * 1.7)) * 0.09;
        });
      }
      // Tor: goldener Lichtschein, wenn offen (nur als Farbe im Ausblick: Plane hell)
      back.material.color.setScalar(1 + 0.05 * T.gateOpen);
    });
    // Hinweis-Lauf des Zeigers (einmal je Sitzung)
    ctx.spread.hintSweep = () => { if (!T.introDone && !ctlZeiger.dragging && ctlZeiger.v < 0.02 && !app.calm) { T.intro = true; T.introT = 0; } };
  },

  onActivate(ctx) {
    const app = ctx.app, T = ctx.spread.p0;
    if (app.timewin) app.timewin.show();
    if (T) { T.paradeT0 = undefined; setTimeout(() => ctx.spread.active && ctx.spread.hintSweep && ctx.spread.hintSweep(), 2300); }
  },
  onDeactivate(ctx) {
    const app = ctx.app, T = ctx.spread.p0;
    if (app.timewin) app.timewin.hide();
    if (T) { T.intro = false; }
  },
};
