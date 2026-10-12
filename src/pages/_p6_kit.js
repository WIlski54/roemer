// Station 6 (Pompeji): 3D-Hilfen und gemalte Texturen (Trittsteine, Dach-Lasche, Wachstafel, Thermen-Klappe, Mosaik, Fernstadt).
// Besitzer: Station 6. Alles aus Code (Canvas), keine Bilddateien.
import * as THREE from 'three';
import { mulberry32, TAU } from '../engine/util.js';
import { SERIF, roundRect } from '../engine/pagepaint.js';
import { poly } from '../art/dsl.js';
import { roofTiles, plaster } from '../art/rom/_arch.js';
import { line, dot } from '../art/paint.js';
import { C, R } from '../art/rom/s6_build.js';

export function canvasTex(w, h, draw, { repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---------------------------------------------------------------- Trittstein (echter Quader, behauene Lavastein-Optik)
export function stoneTex() {
  return canvasTex(160, 160, (g, W, H) => {
    const r = mulberry32(8); const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#9a9080'); gr.addColorStop(1, '#6f675b'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,245,220,.13)' : 'rgba(40,30,20,.14)'; g.beginPath(); g.arc(r() * W, r() * H, 1 + r() * 3, 0, TAU); g.fill(); }
    g.strokeStyle = 'rgba(40,30,20,.35)'; g.lineWidth = 2; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(r() * W, r() * H); g.lineTo(r() * W, r() * H); g.stroke(); }
    g.strokeStyle = 'rgba(30,20,10,.55)'; g.lineWidth = 6; g.strokeRect(0, 0, W, H);
  });
}
export function stoneBox(w, h, d, tex) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshLambertMaterial({ map: tex, color: 0xf1e8d8 }));
  m.castShadow = true; m.receiveShadow = true; m.position.y = h / 2; return m;
}

// ---------------------------------------------------------------- Dach-Lasche (Ziegeldach als Klappdeckel) mit Blende
export function roofTop(w, d) {
  return canvasTex(768, Math.round(768 * d / w), (g, W, H) => {
    const r = mulberry32(12); g.fillStyle = '#c5643a'; g.fillRect(0, 0, W, H);
    const rows = 9, rh = H / rows;
    for (let y = 0; y < rows; y++) { const cols = 20; const cw = W / cols; for (let x = -1; x < cols; x++) {
      const ox = x * cw + (y % 2 ? cw / 2 : 0); const k = 0.82 + r() * 0.3;
      g.fillStyle = `rgb(${Math.round(200 * k)},${Math.round(98 * k)},${Math.round(58 * k)})`; g.beginPath(); g.moveTo(ox, y * rh); g.lineTo(ox + cw, y * rh); g.lineTo(ox + cw * 0.9, y * rh + rh * 1.05); g.quadraticCurveTo(ox + cw * 0.5, y * rh + rh * 1.35, ox + cw * 0.1, y * rh + rh * 1.05); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(70,25,10,.5)'; g.lineWidth = 2; g.stroke(); g.fillStyle = 'rgba(255,215,170,.22)'; g.fillRect(ox + cw * 0.25, y * rh + 3, cw * 0.18, rh * 0.8); } }
    // Dachöffnung (Compluvium) als dunkles Viereck in der Mitte
    g.fillStyle = '#2b2018'; roundRect(g, W * 0.36, H * 0.3, W * 0.28, H * 0.4, 8); g.fill(); g.strokeStyle = '#8a5a30'; g.lineWidth = 8; g.stroke();
    const sky = g.createLinearGradient(0, H * 0.3, 0, H * 0.7); sky.addColorStop(0, '#8fc4e6'); sky.addColorStop(1, '#d6ecf4'); g.fillStyle = sky; roundRect(g, W * 0.37, H * 0.32, W * 0.26, H * 0.36, 6); g.fill();
    g.strokeStyle = 'rgba(80,30,10,.6)'; g.lineWidth = 5; g.strokeRect(2, 2, W - 4, H - 4);
  });
}
export function roofUnder(w, d) {
  return canvasTex(512, Math.round(512 * d / w), (g, W, H) => {
    g.fillStyle = '#8f6a42'; g.fillRect(0, 0, W, H); const r = mulberry32(5);
    for (let i = 0; i < 9; i++) { g.fillStyle = i % 2 ? '#7a5634' : '#9a7448'; g.fillRect(0, i * H / 9, W, H / 9 - 3); for (let k = 0; k < 8; k++) { g.strokeStyle = 'rgba(50,25,8,.3)'; g.beginPath(); g.moveTo(r() * W, i * H / 9); g.lineTo(r() * W, (i + 1) * H / 9); g.stroke(); } }
    g.fillStyle = '#4a3220'; for (let i = 0; i < 4; i++) g.fillRect(W * (0.12 + i * 0.25), 0, 14, H);
  });
}

// ---------------------------------------------------------------- Wachstafel (Holzrahmen, Wachs, wird vom Griffel beschrieben)
const WAX_LINES = ['I  II  III  IV  V', 'VI  VII  VIII  IX  X', 'X + V = XV'];
export function makeWax(w = 1.9, h = 1.3) {
  const grp = new THREE.Group();
  const cv = document.createElement('canvas'); cv.width = 760; cv.height = Math.round(760 * h / w); const g = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.09), new THREE.MeshLambertMaterial({ color: 0x8a5a30 })); frame.position.y = h / 2 + 0.55; frame.castShadow = true; frame.receiveShadow = true; grp.add(frame);
  const wax = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.2, h - 0.2), new THREE.MeshLambertMaterial({ map: tex })); wax.position.set(0, h / 2 + 0.55, 0.05); grp.add(wax);
  for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.1), new THREE.MeshLambertMaterial({ color: 0x6f4526 })); leg.position.set(sx * (w / 2 - 0.2), 0.31, -0.05); leg.castShadow = true; grp.add(leg); }
  // Griffel (Stilus): dünner Stab mit Spitze, wandert mit dem Schreiben
  const sty = new THREE.Group(); const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.018, 0.62, 8), new THREE.MeshLambertMaterial({ color: 0x5b3a22 })); rod.position.y = 0.31; rod.castShadow = true;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.07, 8), new THREE.MeshLambertMaterial({ color: 0xd9d4c8 })); tip.rotation.x = Math.PI; tip.position.y = -0.03; sty.add(rod, tip); sty.rotation.z = -0.5; sty.rotation.x = 0.25; sty.position.z = 0.1; grp.add(sty);
  const total = WAX_LINES.join('').length;
  const out = { group: grp, mesh: frame, wax, hits: [frame, wax], sty, last: -1,
    draw(f) {
      const n = Math.round(f * total); if (n === out.last) return; out.last = n;
      const W = cv.width, H = cv.height;
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#5a3524'); gr.addColorStop(1, '#3f2519'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,225,170,.06)'; for (let i = 0; i < 14; i++) g.fillRect(0, i * H / 14, W, 3);
      g.font = `bold ${H * 0.17}px ${SERIF}`; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillStyle = '#ead6a4'; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3;
      let left = n, ex = W * 0.08, ey = H * 0.25;
      WAX_LINES.forEach((ln, i) => { const y = H * (0.22 + i * 0.27); const take = Math.max(0, Math.min(ln.length, left)); left -= take; const txt = ln.slice(0, take); g.fillText(txt, W * 0.08, y); if (take > 0) { ex = W * 0.08 + g.measureText(txt).width; ey = y; } });
      g.shadowColor = 'transparent'; tex.needsUpdate = true;
      out.tipX = (ex / W - 0.5) * (w - 0.2); out.tipY = h / 2 + 0.55 + (0.5 - ey / H) * (h - 0.2);
    } };
  out.draw(0); return out;
}

// ---------------------------------------------------------------- Thermen-Klappe: Außenseite (Schild), Innenseite, gemalte Räume auf der Seite
export function thermenTop(w, h) {
  return canvasTex(768, Math.round(768 * h / w), (g, W, H) => {
    g.fillStyle = '#f7edd3'; roundRect(g, 0, 0, W, H, 26); g.fill(); g.fillStyle = '#b5402b'; roundRect(g, 14, 14, W - 28, H - 28, 20); g.fill();
    g.strokeStyle = 'rgba(255,240,200,.7)'; g.lineWidth = 3; g.setLineDash([10, 8]); roundRect(g, 30, 30, W - 60, H - 60, 14); g.stroke(); g.setLineDash([]);
    // Bogen mit Wasserwellen
    g.fillStyle = '#f2dfae'; g.beginPath(); g.arc(W * 0.17, H * 0.62, H * 0.3, Math.PI, 0); g.lineTo(W * 0.17 + H * 0.3, H * 0.9); g.lineTo(W * 0.17 - H * 0.3, H * 0.9); g.closePath(); g.fill();
    g.fillStyle = '#4f9ccb'; g.beginPath(); g.arc(W * 0.17, H * 0.64, H * 0.2, Math.PI, 0); g.lineTo(W * 0.17 + H * 0.2, H * 0.9); g.lineTo(W * 0.17 - H * 0.2, H * 0.9); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(W * 0.1, H * (0.7 + i * 0.06)); g.quadraticCurveTo(W * 0.14, H * (0.66 + i * 0.06), W * 0.17, H * (0.7 + i * 0.06)); g.quadraticCurveTo(W * 0.2, H * (0.74 + i * 0.06), W * 0.24, H * (0.7 + i * 0.06)); g.stroke(); }
    g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.font = `bold ${H * 0.3}px ${SERIF}`; g.fillText('Thermen', W * 0.6, H * 0.5);
    g.font = `italic ${H * 0.16}px ${SERIF}`; g.fillText('klapp mich auf!', W * 0.6, H * 0.74);
  });
}
export function thermenBack(w, h) {
  return canvasTex(768, Math.round(768 * h / w), (g, W, H) => {
    g.fillStyle = '#f7edd3'; roundRect(g, 0, 0, W, H, 26); g.fill(); g.fillStyle = '#b5402b'; roundRect(g, 14, 14, W - 28, H - 28, 20); g.fill();
    g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.font = `bold ${H * 0.2}px ${SERIF}`; g.fillText('Kalt · Lauwarm · Heiß', W / 2, H * 0.42);
    g.font = `italic ${H * 0.15}px ${SERIF}`; g.fillText('Eine übliche Reihenfolge: lauwarm, heiß, kalt', W / 2, H * 0.68);
    g.font = `${H * 0.12}px ${SERIF}`; g.fillText('Tippe für die Karte', W / 2, H * 0.86);
  });
}
// auf die Seite gemalt (m = Kartenabbildung aus paintPageBase): drei Räume von Blau bis Rot
export function paintThermenUnder(ctx, m, x0, z0, w, h) {
  const S = m.S, X = m.x(x0), Z = m.z(z0), W = w * S, H = h * S, rw = W / 3;
  ctx.save(); ctx.fillStyle = '#f7edd3'; roundRect(ctx, X - 0.08 * S, Z - 0.08 * S, W + 0.16 * S, H + 0.16 * S, 0.1 * S); ctx.fill(); ctx.restore();
  const rooms = [['Frigidarium', 'kalt', '#6fb3e0', '#3f86c0'], ['Tepidarium', 'lauwarm', '#e8c46a', '#d89a4a'], ['Caldarium', 'heiß', '#e8744a', '#b5402b']];
  rooms.forEach(([n, t, a, b], i) => {
    const x = X + i * rw; const gr = ctx.createLinearGradient(0, Z, 0, Z + H); gr.addColorStop(0, a); gr.addColorStop(1, b);
    ctx.fillStyle = gr; ctx.fillRect(x, Z, rw, H); ctx.strokeStyle = 'rgba(60,30,12,.7)'; ctx.lineWidth = 0.03 * S; ctx.strokeRect(x, Z, rw, H);
    // Becken
    ctx.fillStyle = i === 0 ? '#9fd4f0' : i === 1 ? '#e8d6a0' : '#ff9a6a'; roundRect(ctx, x + rw * 0.12, Z + H * 0.38, rw * 0.76, H * 0.36, 0.07 * S); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 0.02 * S; ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(x + rw * 0.2, Z + H * (0.5 + k * 0.08)); ctx.quadraticCurveTo(x + rw * 0.3, Z + H * (0.46 + k * 0.08), x + rw * 0.4, Z + H * (0.5 + k * 0.08)); ctx.quadraticCurveTo(x + rw * 0.5, Z + H * (0.54 + k * 0.08), x + rw * 0.6, Z + H * (0.5 + k * 0.08)); ctx.stroke(); }
    // Badegast (Kopf im Wasser) und Beschriftung
    ctx.fillStyle = '#f0c9a4'; ctx.beginPath(); ctx.arc(x + rw * (0.4 + i * 0.12), Z + H * 0.5, 0.11 * S, 0, TAU); ctx.fill(); ctx.fillStyle = '#4a2f1d'; ctx.beginPath(); ctx.arc(x + rw * (0.4 + i * 0.12), Z + H * 0.47, 0.1 * S, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff6e0'; ctx.textAlign = 'center'; ctx.font = `bold ${0.2 * S}px ${SERIF}`; ctx.fillText(n, x + rw / 2, Z + H * 0.14); ctx.font = `italic ${0.17 * S}px ${SERIF}`; ctx.fillText(t, x + rw / 2, Z + H * 0.27);
    if (i === 2) { // Hypokaustum: Ziegelpfeiler unter dem Boden mit warmer Luft
      ctx.fillStyle = '#7a2a18'; ctx.fillRect(x + rw * 0.05, Z + H * 0.84, rw * 0.9, H * 0.12); for (let k = 0; k < 6; k++) { ctx.fillStyle = '#c0583a'; ctx.fillRect(x + rw * (0.1 + k * 0.145), Z + H * 0.84, rw * 0.05, H * 0.12); }
      ctx.fillStyle = 'rgba(255,180,90,.8)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + rw * (0.18 + k * 0.145), Z + H * 0.9, 0.05 * S, 0, TAU); ctx.fill(); }
    }
    if (i === 0) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.025 * S; for (let k = 0; k < 3; k++) { const px = x + rw * (0.25 + k * 0.25); ctx.beginPath(); ctx.moveTo(px, Z + H * 0.88); ctx.lineTo(px + 0.04 * S, Z + H * 0.84); ctx.lineTo(px + 0.08 * S, Z + H * 0.88); ctx.stroke(); } }
  });
  ctx.fillStyle = 'rgba(60,30,12,.8)'; ctx.font = `bold italic ${0.16 * S}px ${SERIF}`; ctx.textAlign = 'center';
}

// ---------------------------------------------------------------- Mosaik „Achtung, Hund!“ (eigene Zeichnung im Stil römischer Mosaike)
export function paintMosaic(g, W, H) {
  g.fillStyle = '#efe3c2'; g.fillRect(0, 0, W, H);
  // Rahmen aus schwarzen und ocker Steinchen (kein Mäander)
  const t = Math.round(W / 40); for (let x = 0; x < W; x += t) for (const y of [0, H - t, t, H - 2 * t]) { g.fillStyle = (x / t + y / t) % 2 ? '#2b2220' : '#d8a04a'; g.fillRect(x, y, t, t); }
  for (let y = 0; y < H; y += t) for (const x of [0, W - t]) { g.fillStyle = (x / t + y / t) % 2 ? '#2b2220' : '#d8a04a'; g.fillRect(x, y, t, t); }
  g.lineJoin = g.lineCap = 'round';
  // Kette
  g.strokeStyle = '#6a5a48'; g.lineWidth = H * 0.025; g.setLineDash([H * 0.04, H * 0.025]); g.beginPath(); g.moveTo(W * 0.78, H * 0.24); g.quadraticCurveTo(W * 0.7, H * 0.4, W * 0.62, H * 0.44); g.stroke(); g.setLineDash([]);
  // Hund (Profil, links schauend, aufmerksam)
  g.fillStyle = '#2f2420'; g.strokeStyle = '#1a1210'; g.lineWidth = H * 0.012;
  g.beginPath(); g.ellipse(W * 0.5, H * 0.52, W * 0.2, H * 0.14, 0, 0, TAU); g.fill();                         // Rumpf
  g.beginPath(); g.ellipse(W * 0.68, H * 0.44, W * 0.07, H * 0.1, -0.3, 0, TAU); g.fill();                   // Brust
  g.beginPath(); g.ellipse(W * 0.4, H * 0.36, W * 0.07, H * 0.065, 0, 0, TAU); g.fill();                     // Kopf
  g.beginPath(); g.moveTo(W * 0.34, H * 0.35); g.lineTo(W * 0.24, H * 0.4); g.lineTo(W * 0.25, H * 0.45); g.lineTo(W * 0.37, H * 0.43); g.closePath(); g.fill(); // Schnauze
  g.beginPath(); g.moveTo(W * 0.4, H * 0.3); g.lineTo(W * 0.46, H * 0.2); g.lineTo(W * 0.46, H * 0.32); g.closePath(); g.fill();                         // Ohr
  g.lineWidth = H * 0.05; g.strokeStyle = '#2f2420';
  for (const [x, y, x2] of [[0.34, 0.58, 0.32], [0.42, 0.62, 0.44], [0.58, 0.62, 0.6], [0.66, 0.58, 0.7]]) { g.beginPath(); g.moveTo(W * x, H * y); g.lineTo(W * x2, H * 0.8); g.stroke(); }
  g.beginPath(); g.moveTo(W * 0.69, H * 0.48); g.quadraticCurveTo(W * 0.78, H * 0.38, W * 0.8, H * 0.5); g.stroke();                                   // Schwanz
  g.fillStyle = '#a8462e'; g.fillRect(W * 0.43, H * 0.4, W * 0.025, H * 0.06);                                                                     // rotes Halsband
  g.fillStyle = '#e8d2a0'; g.beginPath(); g.arc(W * 0.37, H * 0.34, H * 0.016, 0, TAU); g.fill(); g.fillStyle = '#111'; g.beginPath(); g.arc(W * 0.375, H * 0.34, H * 0.008, 0, TAU); g.fill();
  g.fillStyle = '#d9a05a'; g.beginPath(); g.ellipse(W * 0.5, H * 0.58, W * 0.12, H * 0.04, 0, 0, TAU); g.fill();                                  // heller Bauch
  g.fillStyle = '#f0e0b8'; g.font = `bold ${H * 0.13}px ${SERIF}`; g.textAlign = 'center'; g.fillStyle = '#2b2220'; g.fillText('CAVE CANEM', W / 2, H * 0.92);
  // Steinchen-Raster
  const r = mulberry32(3); const s = Math.round(W / 60);
  for (let y = 0; y < H; y += s) for (let x = 0; x < W; x += s) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.08)' : 'rgba(40,20,5,.08)'; g.fillRect(x, y, s, s); }
  g.strokeStyle = 'rgba(70,45,20,.28)'; g.lineWidth = 1; for (let x = 0; x < W; x += s) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y < H; y += s) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
}

// ---------------------------------------------------------------- Fernstadt (Dächer, Zypressen) als Flat-Part
export function fernstadt(x0, x1, seed = 3) {
  const r = mulberry32(seed); const layers = []; const cols = [['#f1dfb0', '#e0c58a'], ['#e8c8a0', '#d9a878'], ['#f0d6b0', '#dfbb8a'], ['#eadbbd', '#d6bf94']];
  layers.push({ shapes: [poly([[x0, 0], [x1, 0], [x1, 1.0], [x0, 1.0]])], fill: { top: '#d9b98a', bottom: '#c9a070' } });
  let x = x0 + 0.2;
  while (x < x1 - 0.8) {
    const w = 0.9 + r() * 1.1, h = 0.7 + r() * 0.7, col = cols[Math.floor(r() * cols.length)];
    layers.push({ shapes: [poly([[x, 0.8], [x + w, 0.8], [x + w, 0.8 + h], [x, 0.8 + h]])], fill: { top: col[0], bottom: col[1] }, stroke: 'rgba(90,60,30,.35)',
      deco(c, bb) { for (let k = 0; k < 2; k++) { const wx = bb.x0 + bb.w * (0.2 + 0.4 * k); R(c, wx, bb.y0 + bb.h * 0.45, wx + 0.14, bb.y0 + bb.h * 0.75, 'rgba(60,40,30,.55)'); } } });
    const roof = r() > 0.5 ? poly([[x - 0.1, 0.8 + h], [x + w + 0.1, 0.8 + h], [x + w * 0.5, 0.8 + h + 0.3 + r() * 0.1]]) : poly([[x - 0.1, 0.8 + h], [x + w + 0.1, 0.8 + h], [x + w, 0.8 + h + 0.22], [x, 0.8 + h + 0.22]]);
    layers.push({ shapes: [roof], fill: { top: '#d9784a', bottom: '#b0502e' }, stroke: 'rgba(80,30,10,.4)', deco(c, bb) { roofTiles(c, bb, { h: 0.08, w: 0.16 }); } });
    x += w + 0.05 + r() * 0.35;
    if (r() > 0.55 && x < x1 - 1) { const ch = 1.2 + r() * 0.6; layers.push({ shapes: [poly([[x, 0.8], [x + 0.28, 0.8], [x + 0.2, 0.8 + ch * 0.6], [x + 0.14, 0.8 + ch], [x + 0.08, 0.8 + ch * 0.6]], 2)], fill: { top: '#4f7a3a', bottom: '#2f5a2a' }, stroke: 'rgba(20,50,20,.4)' }); x += 0.5; }
  }
  return { layers };
}
