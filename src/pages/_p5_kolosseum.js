// Station 5: das Pop-up-Kolosseum.
//  - 16 Wandstücke (je ein Pop-up, im Kreis um den Mittelpunkt; gleich lange Sehnen auf einer Ellipse = „oval aus gestaffelten Segmenten“).
//    Jedes Wandstück trägt vier Reihen (3 Arkadenreihen + Obergeschoss) als Klone derselben vier Papierformen. Die Reihen sind in der Seite
//    „versenkt“ und steigen mit der Lasche „Kolosseum auf!“ nacheinander heraus.
//  - Sitzstufen (cavea): gewölbter Ring aus Papier mit gemalter Menge, wächst mit den Reihen (Höhe skaliert mit dem Aufrichtgrad).
//  - Sonnensegel (velarium): Ring-Stoff mit Öffnung in der Mitte, wird vom Rand nach innen gespannt (Faden „Sonnensegel“), dazu 16 kleine Masten.
// Alle Volumen (Sitzstufen, Segel) werden mit dem Aufrichtgrad der Wandstücke in y flachgedrückt, damit beim Blättern nichts durch die Seite ragt.
import * as THREE from 'three';
import { Popup, makeFlat } from '../engine/popup.js';
import { tierPart, KOL_H, KOL_Y0, KOL_TOP } from '../art/rom/s5_bauten.js';
import { canvasTex, ringPoints, mulberry32, TAU, clamp } from './_p5_kit.js';
import { smooth } from '../engine/util.js';

export const KOL = { cx: 5.15, cz: -0.15, A: 3.15, B: 2.0, N: 16, arches: 2, arenaA: 1.42, arenaB: 0.66 };

// ---- Sitzstufen: Profil (Anteil nach außen t, Höhe y); t=0 Arenarand, t=1 Innenseite der Fassade
const PROFILE = [[0, 0], [0, 0.3], [0.07, 0.34], [0.36, 1.1], [0.36, 1.27], [0.41, 1.3], [0.69, 2.15], [0.69, 2.33], [0.74, 2.37], [0.97, 3.05], [1, 3.32]];
const ZONES = [{ a: 0, b: 1, kind: 'podium' }, { a: 1, b: 4, kind: 'ima' }, { a: 4, b: 5, kind: 'riser' }, { a: 5, b: 7, kind: 'media' }, { a: 7, b: 8, kind: 'riser' }, { a: 8, b: 10, kind: 'summa' }];

function profLens() { const L = [0]; for (let k = 1; k < PROFILE.length; k++) L.push(L[k - 1] + Math.hypot(PROFILE[k][0] * 1.0 - PROFILE[k - 1][0] * 1.0, PROFILE[k][1] - PROFILE[k - 1][1]) + (PROFILE[k][0] !== PROFILE[k - 1][0] ? Math.abs(PROFILE[k][0] - PROFILE[k - 1][0]) * 1.3 : 0)); return L; }

function paintCavea(g, W, H) {
  const L = profLens(), tot = L[L.length - 1], rnd = mulberry32(11);
  const vy = (len) => H - (len / tot) * H;      // Länge entlang des Profils -> Pixel-y (oben = außen)
  const COL = { podium: '#e8d8b0', ima: '#ecdcb4', riser: '#cdb88a', media: '#e7d4a6', summa: '#e2cf9e' };
  for (const z of ZONES) {
    const y0 = vy(L[z.b]), y1 = vy(L[z.a]);
    g.fillStyle = COL[z.kind]; g.fillRect(0, y0, W, y1 - y0);
    if (z.kind === 'podium') { g.strokeStyle = 'rgba(120,100,120,.25)'; g.lineWidth = 2; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(rnd() * W, y0); g.bezierCurveTo(rnd() * W, y0 + 4, rnd() * W, y1 - 3, rnd() * W, y1); g.stroke(); } }
    if (z.kind === 'riser') { g.fillStyle = 'rgba(110,80,45,.28)'; g.fillRect(0, y0, W, y1 - y0); g.fillStyle = 'rgba(255,248,225,.5)'; g.fillRect(0, y0, W, 2); }
  }
  // Sitzreihen und Menge
  const heads = ['#d9a577', '#c98f60', '#e8bf94', '#b97d52'], coats = ['#f4efe4', '#f4efe4', '#e0a45a', '#c8693a', '#6f9a7b', '#5b87b8', '#a8453a', '#e9d7a4', '#7a5aa0'];
  for (const z of ZONES) {
    if (z.kind === 'podium' || z.kind === 'riser') continue;
    const y0 = vy(L[z.b]), y1 = vy(L[z.a]), rows = Math.max(3, Math.round((z.b === 10 ? 9 : 10) * (L[z.b] - L[z.a]) / (L[4] - L[1])));
    const rh = (y1 - y0) / rows;
    for (let r = 0; r < rows; r++) {
      const yy = y0 + r * rh;
      g.strokeStyle = 'rgba(110,85,50,.4)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
      g.fillStyle = 'rgba(255,250,232,.3)'; g.fillRect(0, yy + 1.5, W, 2);
      const step = 24 + rnd() * 6;
      for (let x = rnd() * step; x < W; x += step * (0.8 + rnd() * 0.5)) {
        if (rnd() < 0.42) continue;
        const hy = yy + rh * 0.62, s = rh * 0.62;
        g.fillStyle = coats[Math.floor(rnd() * coats.length)]; g.beginPath(); g.ellipse(x, hy + s * 0.55, s * 0.6, s * 0.5, 0, Math.PI, 0); g.fill();
        g.fillStyle = heads[Math.floor(rnd() * heads.length)]; g.beginPath(); g.arc(x, hy - s * 0.05, s * 0.34, 0, TAU); g.fill();
        if (rnd() < 0.3) { g.fillStyle = 'rgba(60,40,25,.65)'; g.beginPath(); g.arc(x, hy - s * 0.18, s * 0.3, Math.PI * 1.05, Math.PI * 1.95); g.fill(); }
      }
    }
  }
  // Gänge (Vomitorien): helle Streifen alle 1/16 des Umfangs
  const aisles = KOL.N;
  for (let i = 0; i < aisles; i++) {
    const x = (i + 0.5) * W / aisles;
    g.fillStyle = 'rgba(244,232,196,.85)'; g.fillRect(x - 7, vy(L[10]), 14, vy(L[1]) - vy(L[10]));
    g.strokeStyle = 'rgba(100,75,45,.5)'; g.lineWidth = 1.5; g.strokeRect(x - 7, vy(L[10]), 14, vy(L[1]) - vy(L[10]));
    g.strokeStyle = 'rgba(100,75,45,.35)'; for (let y = vy(L[10]); y < vy(L[1]); y += 9) { g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.stroke(); }
  }
  // sanfte Alterung
  for (let i = 0; i < 400; i++) { g.fillStyle = rnd() > 0.5 ? 'rgba(130,95,55,.08)' : 'rgba(255,255,240,.12)'; g.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 5, 1 + rnd() * 3); }
}

function paintSail(g, W, H) {
  const n = KOL.N * 2, rnd = mulberry32(5);
  for (let i = 0; i < n; i++) {
    const x0 = (i / n) * W, x1 = ((i + 1) / n) * W;
    const gr = g.createLinearGradient(0, 0, 0, H);
    if (i % 2) { gr.addColorStop(0, '#d98652'); gr.addColorStop(1, '#c46a3a'); } else { gr.addColorStop(0, '#f8eed6'); gr.addColorStop(1, '#ecdfbd'); }
    g.fillStyle = gr; g.fillRect(x0, 0, x1 - x0 + 1, H);
    g.strokeStyle = 'rgba(90,50,25,.45)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0, H); g.stroke();
  }
  // Gewebe
  g.strokeStyle = 'rgba(90,60,30,.10)'; g.lineWidth = 1;
  for (let y = 0; y < H; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  for (let x = 0; x < W; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  // Saum außen und innen
  g.fillStyle = 'rgba(70,35,15,.5)'; g.fillRect(0, 0, W, 5); g.fillRect(0, H - 6, W, 6);
  g.fillStyle = 'rgba(255,245,215,.35)'; g.fillRect(0, 5, W, 2);
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(80,50,25,.06)'; g.fillRect(rnd() * W, rnd() * H, 3, 2); }
}

export function buildKolosseum(ctx, { side, onTap }) {
  const app = ctx.app, { cx, cz, A, B, N, arches } = KOL;
  const { pts, chord } = ringPoints(A, B, N);
  const ppu = Math.min(app.q.ppu, 240);
  // ---------------------------------------------------- vier Reihen als Papierformen
  const masters = [0, 1, 2, 3].map((t) => {
    const cut = makeFlat(tierPart(t, chord * 1.05, arches), { ws: 1, ppu, thickness: 0.03, border: 0.006, name: 's5:tier' + t, maxTex: 1536 });
    side.own(cut); cut.mesh.receiveShadow = true; return cut;
  });
  const mastGeo = new THREE.CylinderGeometry(0.02, 0.026, 0.52, 6); mastGeo.translate(0, 0.26, 0);
  const mastMat = new THREE.MeshLambertMaterial({ color: 0x6b4a2a });
  const knobGeo = new THREE.SphereGeometry(0.04, 8, 6), knobMat = new THREE.MeshLambertMaterial({ color: 0xd8b04a });
  const flagShape = new THREE.Shape(); flagShape.moveTo(0.02, 0.5); flagShape.lineTo(0.3, 0.44); flagShape.lineTo(0.02, 0.37); flagShape.closePath();
  const flagGeo = new THREE.ShapeGeometry(flagShape);
  const flagMats = ['#c8452c', '#f6efd9', '#d9a43a'].map((c) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
  const segs = [];
  for (let i = 0; i < N; i++) {
    const p = pts[i], q = pts[(i + 1) % N];
    const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2, dx = q[0] - p[0], dz = q[1] - p[1], dl = Math.hypot(dx, dz);
    let nx = -dz / dl, nz = dx / dl; if (nx * mx + nz * mz > 0) { nx = -nx; nz = -nz; }          // nach innen (zur Mitte)
    const yaw = Math.atan2(nx, nz);
    const pop = new Popup(side, { x: cx + mx, z: cz + mz, y: i * 0.0035, yaw, delay: 0.02, k: 130, d: 12, name: 'kol-seg' + i });
    side.addPopup(pop);
    const tiers = masters.map((m, t) => {
      const grp = new THREE.Group(); const mesh = m.mesh.clone(); mesh.castShadow = true; mesh.receiveShadow = true; mesh.userData.tap = onTap; grp.add(mesh); pop.add(grp); return { grp, mesh };
    });
    const mastG = new THREE.Group(); const mast = new THREE.Mesh(mastGeo, mastMat); mast.castShadow = true; const knob = new THREE.Mesh(knobGeo, knobMat); knob.position.y = 0.53;
    const flag = new THREE.Mesh(flagGeo, flagMats[i % 3]); flag.position.set(0.0, 0.0, 0); mastG.add(flag);
    mastG.add(mast, knob); mastG.position.z = -0.012; pop.add(mastG);
    pop.pickMeshes = tiers.map((t) => t.mesh);
    segs.push({ pop, tiers, mastG, mx, mz });
  }

  // ---------------------------------------------------- Sitzstufen (Ring-Loft)
  const caveaTex = canvasTex(2048, 512, paintCavea); caveaTex.wrapS = THREE.RepeatWrapping;
  const MT = 96, ellAt = (t, th) => { const a = KOL.arenaA + (A - 0.16 - KOL.arenaA) * t, b = KOL.arenaB + (B - 0.16 - KOL.arenaB) * t; return [a * Math.cos(th), b * Math.sin(th)]; };
  const L = profLens(), totL = L[L.length - 1];
  const cPos = [], cUv = [], cIdx = [];
  for (let k = 0; k < PROFILE.length; k++) for (let j = 0; j <= MT; j++) {
    const th = (j / MT) * TAU, [x, z] = ellAt(PROFILE[k][0], th);
    cPos.push(x, PROFILE[k][1], z); cUv.push(j / MT, L[k] / totL);
  }
  for (let k = 0; k < PROFILE.length - 1; k++) for (let j = 0; j < MT; j++) {
    const a = k * (MT + 1) + j, b = a + 1, c = a + MT + 1, d = c + 1; cIdx.push(a, c, b, b, c, d);
  }
  const cGeo = new THREE.BufferGeometry();
  cGeo.setAttribute('position', new THREE.Float32BufferAttribute(cPos, 3)); cGeo.setAttribute('uv', new THREE.Float32BufferAttribute(cUv, 2)); cGeo.setIndex(cIdx); cGeo.computeVertexNormals();
  const cavea = new THREE.Mesh(cGeo, new THREE.MeshLambertMaterial({ map: caveaTex, side: THREE.DoubleSide }));
  cavea.castShadow = false; cavea.receiveShadow = true; cavea.userData.tap = onTap;
  const caveaG = new THREE.Group(); caveaG.position.set(cx, 0.004, cz); caveaG.add(cavea); side.add(caveaG);

  // ---------------------------------------------------- Sonnensegel
  const sailTex = canvasTex(1024, 128, paintSail); sailTex.wrapS = THREE.RepeatWrapping;
  const MS = 96, KS = 7, YO = KOL_TOP + 0.46, DROP = 1.15, QMIN = 0.58;
  const sPos = new Float32Array((MS + 1) * (KS + 1) * 3), sUv = new Float32Array((MS + 1) * (KS + 1) * 2), sIdx = [];
  for (let k = 0; k < KS; k++) for (let j = 0; j < MS; j++) { const a = k * (MS + 1) + j, b = a + 1, c = a + MS + 1, d = c + 1; sIdx.push(a, c, b, b, c, d); }
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(sPos, 3)); sGeo.setAttribute('uv', new THREE.BufferAttribute(sUv, 2)); sGeo.setIndex(sIdx);
  const sail = new THREE.Mesh(sGeo, new THREE.MeshLambertMaterial({ map: sailTex, side: THREE.DoubleSide }));
  sail.castShadow = true; sail.receiveShadow = false; sail.frustumCulled = false;
  const sailG = new THREE.Group(); sailG.position.set(cx, 0.004, cz); sailG.add(sail); side.add(sailG);
  const sailAt = (s, th) => { const f = 1 - (1 - QMIN) * s; return [(A - 0.07) * f * Math.cos(th), YO - DROP * Math.pow(s, 1.12) + 0.035 * Math.sin(th * N) * s, (B - 0.07) * f * Math.sin(th)]; };
  const state = { lift: 0, sail: 0, top: KOL_H[0], ratio: KOL_H[0] / KOL_TOP, kEff: 0, tierR: [1, 0, 0, 0] };
  function setSail(v) {
    state.sail = v = clamp(v);
    const sMax = v;
    for (let k = 0; k <= KS; k++) for (let j = 0; j <= MS; j++) {
      const th = (j / MS) * TAU, s = sMax * (k / KS), [x, y, z] = sailAt(s, th), i = k * (MS + 1) + j;
      sPos[i * 3] = x; sPos[i * 3 + 1] = y; sPos[i * 3 + 2] = z; sUv[i * 2] = j / MS;
    }
    // Texturkoordinate: der Stoff wird „herausgezogen“; v hängt an der absoluten Lage s, damit die Muster stehen bleiben
    for (let k = 0; k <= KS; k++) for (let j = 0; j <= MS; j++) sUv[(k * (MS + 1) + j) * 2 + 1] = 1 - sMax * (k / KS);
    sGeo.attributes.position.needsUpdate = true; sGeo.attributes.uv.needsUpdate = true; sGeo.computeVertexNormals(); sGeo.computeBoundingSphere();
  }

  // ---------------------------------------------------- Lift (Lasche „Kolosseum auf!“)
  function setLift(v) {
    state.lift = v = clamp(v);
    const r = [1, smooth(clamp(v / 0.42)), smooth(clamp((v - 0.27) / 0.42)), smooth(clamp((v - 0.55) / 0.45))];
    state.tierR = r;
    let top = 0;
    for (let t = 0; t < 4; t++) {
      const y = KOL_Y0[t] - (1 - r[t]) * (KOL_Y0[t] + KOL_H[t] + 0.08);
      top = Math.max(top, y + KOL_H[t]);
      for (const sg of segs) { sg.tiers[t].grp.position.y = y; sg.tiers[t].grp.visible = y + KOL_H[t] > 0.02; }
    }
    for (const sg of segs) sg.pop.pickMeshes = sg.tiers.filter((q) => q.grp.visible).map((q) => q.mesh);
    state.top = top; state.ratio = top / KOL_TOP;
    for (const sg of segs) { sg.mastG.position.y = top - 0.01; sg.mastG.scale.y = Math.max(0.2, state.ratio); sg.mastG.visible = state.ratio > 0.3; }
  }

  // ---------------------------------------------------- pro Bild: Volumen an den Aufrichtgrad der Wandstücke koppeln
  function update() {
    let m = 1.5; for (const sg of segs) m = Math.min(m, sg.pop.eff);
    m = clamp(m); state.kEff = m;
    const h = Math.max(0.0008, m * state.ratio);
    caveaG.scale.y = h; caveaG.visible = m > 0.01;
    sailG.scale.y = h; sailG.visible = m > 0.01 && state.sail > 0.012;
  }
  setLift(0); setSail(0);

  return {
    segs, chord, state, cavea, sail, caveaG, sailG, setLift, setSail, update, YO,
    // Punkt am vorderen Rand des Segels (Seitenkoordinaten) für den Faden
    ropeTop(out) {
      const ang = Math.PI / 2 - 0.25;                                                // etwas rechts der Mitte der Vorderseite
      const h = Math.max(0.001, state.kEff * state.ratio), a = A - 0.07, b = B - 0.07;
      out.set(cx + a * Math.cos(ang), YO * h, cz + b * Math.sin(ang)); return out;
    },
    dispose() { caveaTex.dispose(); sailTex.dispose(); cGeo.dispose(); sGeo.dispose(); mastGeo.dispose(); knobGeo.dispose(); flagGeo.dispose(); },
  };
}
