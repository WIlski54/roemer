// Station 2: eigene kleine Helfer (aus den Dino-Mustern nachgebaut, damit keine gemeinsamen Dateien angefasst werden).
import * as THREE from 'three';
import { clamp, TAU, mulberry32 } from '../engine/util.js';
import { panel, poly } from '../art/dsl.js';
import { line, dot } from '../art/paint.js';
import { roofTiles } from '../art/rom/_arch.js';

// Partikelrate: an Qualitätsstufe und Ruhigen Modus gekoppelt
export const fxRate = (app) => app.stage.tier.fx * (app.calm ? 0.5 : 1);
export const ramp = (v, a, b) => clamp((v - a) / (b - a));

export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = Math.max(16, Math.round(w)); cv.height = Math.max(16, Math.round(h));
  draw(cv.getContext('2d'), cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// Wellenstreifen aus Papier (Meer): welliger Rand, Schaumsaum, Glanzlinien. Zentriert bei x = 0.
export function waveStripPart(w, h, { top = '#4fb0d4', bottom = '#2a78ab', wave = 0.12, freq = 3, phase = 0, seed = 1, scallop = true, step = 0.1, glint = '#cdf3f5', foamCol = '#ffffff' } = {}) {
  const x0 = -w / 2, x1 = w / 2;
  const edge = (t) => h + wave * (Math.sin(t * freq * TAU + phase) * 0.6 + Math.sin(t * freq * 2.3 * TAU + phase * 1.7 + seed) * 0.4);
  const shape = panel(x0, x1, 0, h, { wave, freq, phase, seed, scallop, step });
  const deco = (c, bb) => {
    const { ctx, tf, S } = c; const r = mulberry32(seed * 13 + 5);
    ctx.save();
    const [ax, ay] = tf(0, h + wave), [bx, by] = tf(0, 0);
    const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, 'rgba(255,255,255,.2)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,20,60,.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
    ctx.strokeStyle = glint; ctx.globalAlpha = 0.42; ctx.lineWidth = Math.max(1, S * 0.02); ctx.lineCap = 'round';
    for (let k = 0; k < 2; k++) {
      ctx.beginPath();
      for (let i = 0; i <= 120; i++) { const t = i / 120; const [X, Y] = tf(x0 + (x1 - x0) * t, edge(t) - (0.16 + k * 0.17) + 0.04 * Math.sin(t * 40 + k)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
      ctx.stroke();
    }
    ctx.globalAlpha = 0.9; ctx.strokeStyle = foamCol; ctx.lineWidth = Math.max(1.5, S * 0.045); ctx.lineJoin = 'round';
    ctx.beginPath(); for (let i = 0; i <= 160; i++) { const t = i / 160; const [X, Y] = tf(x0 + (x1 - x0) * t, edge(t) - 0.03); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = foamCol;
    const N = 200; let prev = edge(0), cur = edge(1 / N);
    for (let i = 1; i < N; i++) {
      const nxt = edge((i + 1) / N);
      if (cur > prev && cur >= nxt && cur > h + wave * 0.2) {
        const cx = x0 + (x1 - x0) * (i / N);
        for (let k = 0, n = 4 + Math.floor(r() * 4); k < n; k++) { const [X, Y] = tf(cx + (r() - 0.5) * 0.55, cur - 0.04 - r() * 0.13); ctx.globalAlpha = 0.6 + r() * 0.4; ctx.beginPath(); ctx.arc(X, Y, Math.max(1.2, S * (0.014 + r() * 0.018)), 0, TAU); ctx.fill(); }
      }
      prev = cur; cur = nxt;
    }
    ctx.restore();
  };
  return { layers: [{ shapes: [shape], fill: { top, bottom }, deco }] };
}

// Häuserreihe als Kulissenband (ockerfarbene Wände, Terrakotta-Dächer), x0..x1 in Modellmetern, Basis y = 0
export function houseRowPart(x0, x1, { seed = 1, hmin = 0.7, hmax = 1.5 } = {}) {
  const r = mulberry32(seed), A = [], B = [], roofs = [], doors = [];
  let x = x0;
  while (x < x1 - 0.55) {
    const w = Math.min(0.8 + r() * 0.7, x1 - x - 0.1), h = hmin + r() * (hmax - hmin), rw = 0.07;
    const body = [[x, 0], [x + w, 0], [x + w, h], [x, h]];
    (r() > 0.5 ? A : B).push(body);
    if (r() > 0.45) roofs.push(poly([[x - rw, h], [x + w + rw, h], [x + w * 0.5 + w * 0.12, h + 0.28 + r() * 0.12], [x + w * 0.5 - w * 0.12, h + 0.28 + r() * 0.1]]));
    else roofs.push([[x - rw, h], [x + w + rw, h], [x + w + rw, h + 0.1], [x - rw, h + 0.1]]);
    doors.push([x + w * 0.5, h]);
    x += w + 0.04 + r() * 0.12;
  }
  const win = (c, list, col) => { for (const [dx, h] of list) { const rr = mulberry32(Math.round(dx * 100)); dot(c, dx - 0.18, h * 0.62, 0.05, col, 0.55); dot(c, dx + 0.18, h * 0.62, 0.05, col, 0.55); if (rr() > 0.4) dot(c, dx, h * 0.3, 0.07, 'rgba(70,40,20,.5)', 0.9); } };
  return { layers: [
    { shapes: A, fill: { top: '#ecd9b0', bottom: '#d9bd8a' }, deco: (c) => win(c, doors, '#5a3a22') },
    { shapes: B, fill: { top: '#f3e8d0', bottom: '#dccaa0' }, deco: (c) => win(c, doors, '#5a3a22') },
    { shapes: roofs, fill: { top: '#d9784a', bottom: '#b3512a' }, stroke: 'rgba(80,30,10,.6)', deco: (c, bb) => roofTiles(c, bb, { h: 0.1, w: 0.12 }) },
  ] };
}

// Hügelband mit kleinem Tempel und Zypressen gemalt (Fernband der Forumsseite)
export function hillsPart(x0, x1, h, { seed = 1, phase = 0, templeAt = 0.5 } = {}) {
  const shape = panel(x0, x1, 0, h, { wave: 0.5, freq: 2.2, phase, seed, step: 0.14 });
  return { layers: [{ shapes: [shape], fill: { top: '#a9c48c', bottom: '#cfd9a6' },
    deco(c, bb) {
      const r = mulberry32(seed * 3 + 1);
      for (let i = 0; i < 70; i++) dot(c, bb.x0 + r() * bb.w, r() * h, 0.04 + r() * 0.06, r() > 0.5 ? 'rgba(80,120,60,.22)' : 'rgba(255,255,230,.2)');
      for (let i = 0; i < 9; i++) { const px = bb.x0 + (i + 0.5 + (r() - 0.5) * 0.5) * (bb.w / 9), py = h * (0.45 + r() * 0.4); const hh = 0.55 + r() * 0.35; c.ctx.save(); c.ctx.fillStyle = 'rgba(40,95,60,.8)'; c.ctx.beginPath(); const p = [[px - 0.07, py], [px - 0.1, py + hh * 0.5], [px, py + hh], [px + 0.1, py + hh * 0.5], [px + 0.07, py]]; p.forEach(([x, y], k) => { const [X, Y] = c.tf(x, y); if (k) c.ctx.lineTo(X, Y); else c.ctx.moveTo(X, Y); }); c.ctx.fill(); c.ctx.restore(); }
      // kleiner Tempel auf dem Hügel
      const tx = bb.x0 + bb.w * templeAt, ty = h * 0.78;
      c.ctx.save(); c.ctx.fillStyle = '#f4ecd8'; c.ctx.strokeStyle = 'rgba(90,70,45,.7)'; c.ctx.lineWidth = Math.max(1, c.S * 0.015);
      const path = (pts) => { c.ctx.beginPath(); pts.forEach(([x, y], k) => { const [X, Y] = c.tf(x, y); if (k) c.ctx.lineTo(X, Y); else c.ctx.moveTo(X, Y); }); c.ctx.closePath(); c.ctx.fill(); c.ctx.stroke(); };
      path([[tx - 0.5, ty], [tx + 0.5, ty], [tx + 0.5, ty + 0.06], [tx - 0.5, ty + 0.06]]);
      for (let k = 0; k < 5; k++) path([[tx - 0.44 + k * 0.22, ty + 0.06], [tx - 0.37 + k * 0.22, ty + 0.06], [tx - 0.37 + k * 0.22, ty + 0.5], [tx - 0.44 + k * 0.22, ty + 0.5]]);
      path([[tx - 0.52, ty + 0.5], [tx + 0.52, ty + 0.5], [tx + 0.52, ty + 0.57], [tx - 0.52, ty + 0.57]]);
      c.ctx.fillStyle = '#d9784a'; path([[tx - 0.56, ty + 0.57], [tx + 0.56, ty + 0.57], [tx, ty + 0.86]]);
      c.ctx.restore();
    } }] };
}

// Holzplanke der Enterbrücke (Draufsicht-Textur): Bretter, Quersprossen
export function plankTexture() {
  return canvasTex(512, 128, (g, W, H) => {
    g.fillStyle = '#b98a50'; g.fillRect(0, 0, W, H);
    const r = mulberry32(12);
    for (let y = 0; y < H; y += H / 3) { g.fillStyle = r() > 0.5 ? '#c79a5e' : '#a87a44'; g.fillRect(0, y, W, H / 3 - 2); }
    g.strokeStyle = 'rgba(70,40,15,.45)'; g.lineWidth = 3;
    for (let i = 0; i < 40; i++) { const y = r() * H; g.beginPath(); g.moveTo(r() * W, y); g.lineTo(r() * W, y + (r() - 0.5) * 6); g.stroke(); }
    g.strokeStyle = 'rgba(60,30,10,.7)'; g.lineWidth = 6;
    for (let x = 20; x < W; x += 46) { g.beginPath(); g.moveTo(x, 4); g.lineTo(x, H - 4); g.stroke(); }
  });
}

// Marmor-Deckplatte (Rednerbühne): Platte mit zarten Adern und Purpurband
export function slabTexture() {
  return canvasTex(256, 128, (g, W, H) => {
    g.fillStyle = '#efe5cd'; g.fillRect(0, 0, W, H);
    const r = mulberry32(21);
    g.strokeStyle = 'rgba(130,110,90,.28)'; g.lineWidth = 2;
    for (let i = 0; i < 9; i++) { g.beginPath(); let x = r() * W, y = r() * H; g.moveTo(x, y); for (let k = 0; k < 4; k++) { x += (r() - 0.3) * 60; y += (r() - 0.5) * 40; g.lineTo(x, y); } g.stroke(); }
    g.strokeStyle = 'rgba(123,45,91,.55)'; g.lineWidth = 8; g.strokeRect(10, 10, W - 20, H - 20);
    g.strokeStyle = 'rgba(232,196,106,.8)'; g.lineWidth = 3; g.strokeRect(22, 22, W - 44, H - 44);
  });
}

// weiche Schaumfläche (liegt flach auf der Seite unter einem Schiff)
export function foamTexture() {
  return canvasTex(256, 64, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(0.55, 'rgba(255,255,255,.0)'); gr.addColorStop(0.8, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.translate(0, 0); g.scale(1, H / W * 1.0); g.fillStyle = gr; g.fillRect(0, -(W - H) / 2 - 0, W, W); g.restore();
  });
}

// ---------------------------------------------------------------- weitere Helfer (Seite 2)
// Catmull-Rom durch Punkte [[x,y]…], n Unterteilungen je Segment
export function smoothPts(pts, n = 8) {
  const out = []; const P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  out.push(pts[pts.length - 1]); return out;
}

// weiche Papierwolken auf einem Himmelsstreifen
export function cloudsDeco(c, bb, { seed = 3, n = 5, y0 = 0.45, y1 = 0.9, alpha = 0.78 } = {}) {
  const r = mulberry32(seed), g = c.ctx; g.save();
  for (let i = 0; i < n; i++) {
    const cx = bb.x0 + bb.w * (0.08 + 0.84 * (i + r() * 0.6) / n), cy = bb.y0 + bb.h * (y0 + (y1 - y0) * r()), s = 0.55 + r() * 0.5;
    g.fillStyle = `rgba(255,255,255,${alpha})`;
    for (const [dx, dy, rr] of [[-0.55, 0, 0.3], [-0.2, 0.12, 0.42], [0.25, 0.1, 0.38], [0.6, -0.02, 0.28], [0.05, -0.08, 0.3]]) {
      const [X, Y] = c.tf(cx + dx * s, cy + dy * s); g.beginPath(); g.ellipse(X, Y, rr * s * c.S, rr * s * c.S * 0.78, 0, 0, TAU); g.fill();
    }
    const [X0, Y0] = c.tf(cx - 0.75 * s, cy - 0.12 * s), [X1] = c.tf(cx + 0.9 * s, cy);
    g.fillStyle = 'rgba(150,185,215,.28)'; g.fillRect(X0, Y0 + 0.2 * s * c.S, X1 - X0, 0.12 * s * c.S);
  }
  g.restore();
}

// Erdboden/Pfad der Elefanten-Rampe: Sand mit Kieseln und Fußspuren, kachelbar
export function pathTexture() {
  const t = canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = '#d3b078'; g.fillRect(0, 0, W, H); const r = mulberry32(17);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,240,200,.28)' : 'rgba(120,80,40,.2)'; g.beginPath(); g.arc(r() * W, r() * H, 2 + r() * 5, 0, TAU); g.fill(); }
    for (let i = 0; i < 14; i++) { g.fillStyle = 'rgba(110,100,95,.55)'; g.beginPath(); g.ellipse(r() * W, r() * H, 3 + r() * 5, 2 + r() * 3, r() * 3, 0, TAU); g.fill(); }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// Vorderseite der Rampe: Hügel mit Tannen, Felsbändern und Schnee; Profil als Funktion x -> y (Seitenkoordinaten)
export function rampFaceTex(x0, x1, hMax, profile) {
  const W = 1024, H = Math.round(W * hMax / (x1 - x0)) + 8;
  return canvasTex(W, H, (g, w, h) => {
    const X = (x) => (x - x0) / (x1 - x0) * w, Y = (y) => h - (y / hMax) * (h - 8) - 2;
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#bcc8b4'); gr.addColorStop(0.45, '#8fa078'); gr.addColorStop(1, '#6f8a5c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const r = mulberry32(11);
    for (let i = 0; i < 260; i++) { const x = x0 + r() * (x1 - x0), y = r() * Math.max(0.1, profile(x)); g.fillStyle = r() > 0.5 ? 'rgba(40,80,50,.22)' : 'rgba(255,250,215,.18)'; g.beginPath(); g.arc(X(x), Y(y), 3 + r() * 7, 0, TAU); g.fill(); }
    // Felsbänder
    g.strokeStyle = 'rgba(80,70,70,.28)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const x = x0 + (x1 - x0) * (0.1 + 0.8 * r()), ph = profile(x); if (ph < 0.8) continue; const y = ph * (0.3 + 0.4 * r()); g.beginPath(); g.moveTo(X(x - 0.3), Y(y)); g.lineTo(X(x + 0.1), Y(y - 0.06)); g.lineTo(X(x + 0.35), Y(y + 0.02)); g.stroke(); }
    // Tannen am Hang
    for (let i = 0; i < 26; i++) {
      const x = x0 + 0.25 + (x1 - x0 - 0.5) * r(), ph = profile(x); if (ph < 0.25 || ph > 1.1) continue;
      const y = ph * (0.12 + 0.55 * r()), s = 0.16 + r() * 0.14; g.fillStyle = r() > 0.4 ? '#2f6b49' : '#3f7d55';
      g.beginPath(); g.moveTo(X(x - s * 0.5), Y(y)); g.lineTo(X(x + s * 0.5), Y(y)); g.lineTo(X(x), Y(y + s * 2)); g.closePath(); g.fill();
      g.fillStyle = '#5a3a22'; g.fillRect(X(x) - 2, Y(y), 4, 7);
    }
    // Schnee nahe dem Pass
    g.fillStyle = 'rgba(255,255,255,.93)'; g.beginPath(); let first = true;
    for (let x = x0; x <= x1 + 0.001; x += 0.05) { const ph = profile(x); if (ph < 1.15) continue; const yy = ph - 0.02 - 0.05 * Math.sin(x * 9); if (first) { g.moveTo(X(x), Y(yy)); first = false; } else g.lineTo(X(x), Y(yy)); }
    for (let x = x1; x >= x0 - 0.001; x -= 0.05) { const ph = profile(x); if (ph < 1.15) continue; g.lineTo(X(x), Y(ph - 0.34 - 0.12 * Math.sin(x * 14) - 0.08 * Math.cos(x * 5))); }
    g.closePath(); g.fill();
  });
}
