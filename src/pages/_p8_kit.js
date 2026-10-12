// Station 8: eigene Hilfen der Seite (Kopien/Anpassungen der Dino-Muster: Dunstebenen, Wellenstreifen, Waldsilhouette, Flamme).
import * as THREE from 'three';
import { Popup } from '../engine/popup.js';
import { clamp, lerp, TAU, mulberry32 } from '../engine/util.js';
import { panel } from '../art/dsl.js';

export const ramp = (v, a, b) => clamp((v - a) / (b - a));
export const easeIO = (t) => t * t * (3 - 2 * t);

// Partikelrate: an Qualitätsstufe und Ruhigen Modus gekoppelt
export const fxRate = (app) => app.stage.tier.fx * (app.calm ? 0.5 : 1);


function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = Math.max(16, Math.round(w)); cv.height = Math.max(16, Math.round(h));
  draw(cv.getContext('2d'), cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
export { canvasTex };


// durchscheinende Papierebene (Dunst, Lichtstrahl, Schleier), faltet mit der Seite auf. draw(g, W, H) malt in ein Canvas.
export function softPlane(ctx, o) {
  const { x = 0, z = 0, y = 0, w, h, res = 40, draw, opacity = 1, additive = false, delay = 0, name = 'soft', lean = 0, order = 5, k = 100, d = 11, tilt = 0 } = o;
  const side = ctx.sideAt(x);
  const tex = canvasTex(w * res, h * res, draw);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.y = h / 2; mesh.renderOrder = order; mesh.name = name;
  const pop = new Popup(side, { x, z, y, delay, lean, k, d, name });
  const holder = new THREE.Group(); holder.rotation.z = tilt; holder.add(mesh);
  pop.add(holder); side.addPopup(pop);
  return { pop, mesh, mat, holder };
}

// weicher Dunststreifen: überlappende Ellipsen mit Verlauf, unten kräftig, oben ausfransend
export function paintMist(g, W, H, { color = [235, 250, 240], alpha = 0.55, seed = 3, blobs = 9 } = {}) {
  const r = mulberry32(seed);
  g.clearRect(0, 0, W, H);
  const [cr, cg, cb] = color;
  for (let i = 0; i < blobs; i++) {
    const cx = (i + 0.3 + r() * 0.4) / blobs * W, cy = H * (0.58 + r() * 0.3), rx = W / blobs * (1.3 + r() * 0.9), ry = H * (0.34 + r() * 0.22);
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, `rgba(${cr},${cg},${cb},${alpha})`); gr.addColorStop(0.6, `rgba(${cr},${cg},${cb},${alpha * 0.45})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
  }
  // unten ganz ausblenden damit kein harter Rand entsteht
  g.globalCompositeOperation = 'destination-in';
  const fg = g.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.28, 'rgba(0,0,0,1)'); fg.addColorStop(0.8, 'rgba(0,0,0,1)'); fg.addColorStop(1, 'rgba(0,0,0,0.0)');
  g.fillStyle = fg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
}


// ---- Wellenstreifen aus Papier (Meer, Fluss): welliger Rand, Schaumpunkte auf den Kämmen -----------------------------
// Rückgabe: Part-Spezifikation für ctx.flat, zentriert bei x=0.
export function waveStripPart(w, h, { top = '#3aa9c2', bottom = '#1f6f9a', wave = 0.16, freq = 3, phase = 0, seed = 1, foam = true, scallop = false, step = 0.1, lines = true, foamCol = '#ffffff', glint = '#bff0f0' } = {}) {
  const x0 = -w / 2, x1 = w / 2;
  const edge = (t) => h + wave * (Math.sin(t * freq * TAU + phase) * 0.6 + Math.sin(t * freq * 2.3 * TAU + phase * 1.7 + seed) * 0.4);
  const shape = panel(x0, x1, 0, h, { wave, freq, phase, seed, scallop, step });
  const deco = (c, bb) => {
    const { ctx, tf, S } = c; const r = mulberry32(seed * 13 + 5);
    ctx.save();
    // dunklere Tiefe unten, hellere Haut oben
    const [ax, ay] = tf(0, h + wave), [bx, by] = tf(0, 0);
    const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, 'rgba(255,255,255,.18)'); g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,20,60,.28)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
    if (lines) {
      ctx.strokeStyle = glint; ctx.globalAlpha = 0.42; ctx.lineWidth = Math.max(1, S * 0.022); ctx.lineCap = 'round';
      for (let k = 0; k < 3; k++) {
        const depth = 0.18 + k * 0.2; ctx.beginPath();
        for (let i = 0; i <= 120; i++) { const t = i / 120; const [X, Y] = tf(x0 + (x1 - x0) * t, edge(t) - depth + 0.05 * Math.sin(t * 40 + k)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (foam) {
      // weißer Saum auf der Oberkante
      ctx.strokeStyle = foamCol; ctx.globalAlpha = 0.85; ctx.lineWidth = Math.max(1.5, S * 0.05); ctx.lineJoin = 'round';
      ctx.beginPath(); for (let i = 0; i <= 160; i++) { const t = i / 160; const [X, Y] = tf(x0 + (x1 - x0) * t, edge(t) - 0.03); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = foamCol;
      // Schaumpunkte an den Kämmen
      const N = 220; let prev = edge(0), cur = edge(1 / N);
      for (let i = 1; i < N; i++) {
        const nxt = edge((i + 1) / N);
        if (cur > prev && cur >= nxt && cur > h + wave * 0.25) {
          const t = i / N, cx = x0 + (x1 - x0) * t;
          const n = 5 + Math.floor(r() * 5);
          for (let k = 0; k < n; k++) {
            const [X, Y] = tf(cx + (r() - 0.5) * 0.62, cur - 0.04 - r() * 0.16);
            ctx.globalAlpha = 0.6 + r() * 0.4; ctx.beginPath(); ctx.arc(X, Y, Math.max(1.3, S * (0.016 + r() * 0.02)), 0, TAU); ctx.fill();
          }
          // kleine Gischtkringel
          ctx.globalAlpha = 0.9; ctx.strokeStyle = foamCol; ctx.lineWidth = Math.max(1, S * 0.02);
          const [X, Y] = tf(cx + 0.06, cur - 0.15); ctx.beginPath(); ctx.arc(X, Y, S * 0.07, Math.PI * 0.9, Math.PI * 2.1); ctx.stroke();
        }
        prev = cur; cur = nxt;
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  };
  return { layers: [{ shapes: [shape], fill: { top, bottom }, deco }] };
}

// Fichtenreihe (Waldsilhouette) als Polygon, y0 = Basis, h = max. Höhe
export function treelinePoly(x0, x1, y0, h, { seed = 1, tooth = 0.7, base = 0.4 } = {}) {
  const r = mulberry32(seed);
  const pts = [[x0, y0], [x0, y0 + h * base]];
  let x = x0 + (r() * 0.2);
  while (x < x1 - 0.2) {
    const w = tooth * (0.7 + r() * 0.8), th = h * (0.55 + r() * 0.45), vy = y0 + h * base * (0.9 + r() * 0.3), ty = y0 + th;
    const k = (f) => vy + (ty - vy) * f;
    pts.push([x, vy], [x + w * 0.24, k(0.42)], [x + w * 0.34, k(0.38)], [x + w * 0.5, ty], [x + w * 0.66, k(0.4)], [x + w * 0.76, k(0.44)]);
    x += w * 0.95;
  }
  pts.push([x1, y0 + h * base], [x1, y0]);
  return pts;
}


// ---- Überblenden eines Papierschnitt-Pop-ups (Materialien klonen, damit gemeinsame Kantenmaterialien unberührt bleiben)
export function fadeable(pop) {
  const mats = [];
  for (const cut of pop.fig.cuts) {
    const m = cut.mesh;
    m.material = m.material.map((mm, i) => { if (i === 0) return mm; const c = mm.clone(); return c; });
    for (const mm of m.material) { mm.transparent = false; mats.push(mm); }
  }
  pop.fade = { mats, v: 1 };
  return pop.fade;
}
export function setFade(pop, v) {
  const f = pop.fade; if (!f) return;
  if (Math.abs(f.v - v) < 0.002 && (v > 0.002) === (f.v > 0.002)) return;
  f.v = v;
  const vis = v > 0.004;
  for (const cut of pop.fig.cuts) cut.mesh.visible = vis;
  for (const m of f.mats) { m.transparent = v < 0.998; m.opacity = v; m.depthWrite = v > 0.6; m.needsUpdate = true; }
}

// ---- Flamme: gestufte Papier-Flamme (additiv) plus weicher Schein
let FLAME_TEX = null, GLOW_TEX = null;
export function flameTexture() {
  if (FLAME_TEX) return FLAME_TEX;
  FLAME_TEX = canvasTex(128, 192, (g, W, H) => {
    g.clearRect(0, 0, W, H);
    const drop = (cx, base, w, h, col, lean = 0) => {
      g.fillStyle = col; g.beginPath(); g.moveTo(cx - w, base);
      g.bezierCurveTo(cx - w * 1.1, base - h * 0.45, cx - w * 0.3 + lean, base - h * 0.62, cx + lean, base - h);
      g.bezierCurveTo(cx + w * 0.3 + lean, base - h * 0.62, cx + w * 1.1, base - h * 0.45, cx + w, base);
      g.bezierCurveTo(cx + w * 0.6, base + h * 0.07, cx - w * 0.6, base + h * 0.07, cx - w, base); g.closePath(); g.fill();
    };
    drop(W * 0.5, H * 0.9, W * 0.36, H * 0.84, 'rgba(255,120,30,.95)', W * 0.04);
    drop(W * 0.5, H * 0.9, W * 0.27, H * 0.64, 'rgba(255,176,50,.97)', -W * 0.02);
    drop(W * 0.5, H * 0.9, W * 0.16, H * 0.4, 'rgba(255,232,150,.98)', W * 0.01);
  });
  FLAME_TEX.colorSpace = THREE.SRGBColorSpace;
  return FLAME_TEX;
}
export function glowTexture() {
  if (GLOW_TEX) return GLOW_TEX;
  GLOW_TEX = canvasTex(128, 128, (g, W, H) => {
    const gr = g.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W / 2);
    gr.addColorStop(0, 'rgba(255,200,110,.85)'); gr.addColorStop(0.35, 'rgba(255,150,60,.35)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  });
  return GLOW_TEX;
}
// Feuer an einem Pop-up: liefert { group, update(t, k) } ; k = 0..1 Stärke. pos in Pop-up-Koordinaten (Welt-Einheiten).
export function makeFire(pop, x, y, z, { size = 0.5 } = {}) {
  const group = new THREE.Group(); group.position.set(x, y, z); group.visible = false;
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.62, size), new THREE.MeshBasicMaterial({ map: flameTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  flame.position.y = size * 0.5 - 0.04; flame.renderOrder = 8;
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(size * 3.0, size * 3.0), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0 }));
  glow.position.set(0, size * 0.45, -0.02); glow.renderOrder = 7;
  group.add(glow, flame); pop.add(group);
  return {
    group, flame, glow,
    update(t, k, calm = false) {
      group.visible = k > 0.02;
      if (!group.visible) return;
      const fl = calm ? 0.04 : 0.13;
      const s = (0.35 + 0.65 * k) * (1 + fl * Math.sin(t * 11.0) + fl * 0.6 * Math.sin(t * 17.3 + 1));
      flame.scale.set(s * (1 + fl * 0.8 * Math.sin(t * 13 + 2)), s * (1 + fl * Math.sin(t * 9 + 0.4)), 1);
      flame.rotation.z = (calm ? 0.02 : 0.07) * Math.sin(t * 6.1);
      glow.material.opacity = (0.35 + 0.5 * k) * (1 + 0.1 * Math.sin(t * 8));
      glow.scale.setScalar(0.7 + 0.5 * k);
    },
  };
}
