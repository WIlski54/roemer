// Station 1 „Rom entsteht“: eigene Hilfen (Kopien aus dem Dino-Buch-Muster kit234.js, angepasst) – nichts Gemeinsames wird verändert.
import * as THREE from 'three';
import { Popup } from '../engine/popup.js';
import { clamp, lerp, TAU, mulberry32 } from '../engine/util.js';
import { panel } from '../art/dsl.js';

// Partikelrate: an Qualitätsstufe und Ruhigen Modus gekoppelt
export const fxRate = (app) => app.stage.tier.fx * (app.calm ? 0.5 : 1);
export const ramp = (v, a, b) => clamp((v - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const mixHex = (a, b, t) => { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = Math.max(16, Math.round(w)); cv.height = Math.max(16, Math.round(h));
  draw(cv.getContext('2d'), cv.width, cv.height);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}

// durchscheinende Papierebene (Dunst, Lichtstrahl), faltet mit der Seite auf. draw(g, W, H) malt in ein Canvas.
export function softPlane(ctx, o) {
  const { x = 0, z = 0, y = 0, w, h, res = 40, draw, opacity = 1, additive = false, delay = 0, name = 'soft', lean = 0, order = 5, k = 100, d = 11 } = o;
  const side = ctx.sideAt(x);
  const tex = canvasTex(w * res, h * res, draw);
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, fog: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.y = h / 2; mesh.renderOrder = order; mesh.name = name;
  const pop = new Popup(side, { x, z, y, delay, lean, k, d, name });
  pop.add(mesh); side.addPopup(pop);
  return { pop, mesh, mat };
}

// weicher Dunststreifen: überlappende Ellipsen mit Verlauf, unten kräftig, oben ausfransend
export function paintMist(g, W, H, { color = [235, 250, 240], alpha = 0.55, seed = 3, blobs = 9, fadeL = false, fadeR = false } = {}) {
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
  g.globalCompositeOperation = 'destination-in';
  const fg = g.createLinearGradient(0, 0, 0, H); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(0.28, 'rgba(0,0,0,1)'); fg.addColorStop(0.8, 'rgba(0,0,0,1)'); fg.addColorStop(1, 'rgba(0,0,0,0.0)');
  g.fillStyle = fg; g.fillRect(0, 0, W, H);
  if (fadeL || fadeR) { // seitlich weich auslaufen (nur an den freien Enden, an der Falz bleibt der Dunst durchgehend)
    const hg = g.createLinearGradient(0, 0, W, 0);
    hg.addColorStop(0, fadeL ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)'); hg.addColorStop(0.16, 'rgba(0,0,0,1)'); hg.addColorStop(0.84, 'rgba(0,0,0,1)'); hg.addColorStop(1, fadeR ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
    g.fillStyle = hg; g.fillRect(0, 0, W, H);
  }
  g.globalCompositeOperation = 'source-over';
}

// Lichtstrahl (additiv): weiches, schräges Band
export function paintShaft(g, W, H, { color = [255, 244, 200], alpha = 0.5 } = {}) {
  g.clearRect(0, 0, W, H);
  const [cr, cg, cb] = color;
  const gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, `rgba(${cr},${cg},${cb},0)`); gr.addColorStop(0.5, `rgba(${cr},${cg},${cb},${alpha})`); gr.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'destination-in';
  const vg = g.createLinearGradient(0, 0, 0, H); vg.addColorStop(0, 'rgba(0,0,0,1)'); vg.addColorStop(0.55, 'rgba(0,0,0,0.55)'); vg.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over';
}

// Wellenstreifen aus Papier (Fluss): welliger Rand, helle Kämme. Rückgabe: Part-Spezifikation, zentriert bei x = 0.
export function waveStripPart(w, h, { top = '#7cc0d6', bottom = '#3d86ad', wave = 0.06, freq = 3, phase = 0, seed = 1, step = 0.1, glint = '#e4f6fb' } = {}) {
  const x0 = -w / 2, x1 = w / 2;
  const edge = (t) => h + wave * (Math.sin(t * freq * TAU + phase) * 0.6 + Math.sin(t * freq * 2.3 * TAU + phase * 1.7 + seed) * 0.4);
  const shape = panel(x0, x1, 0, h, { wave, freq, phase, seed, step });
  const deco = (c) => {
    const { ctx, tf, S } = c;
    ctx.save();
    const g = ctx.createLinearGradient(...tf(0, h + wave), ...tf(0, 0)); g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,30,70,.22)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
    ctx.strokeStyle = glint; ctx.globalAlpha = 0.7; ctx.lineWidth = Math.max(1.2, S * 0.03); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); for (let i = 0; i <= 140; i++) { const t = i / 140; const [X, Y] = tf(x0 + (x1 - x0) * t, edge(t) - 0.03); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke();
    ctx.globalAlpha = 0.45; ctx.lineWidth = Math.max(1, S * 0.018);
    for (let k = 0; k < 2; k++) { ctx.beginPath(); for (let i = 0; i <= 100; i++) { const t = i / 100; const [X, Y] = tf(x0 + (x1 - x0) * t, edge(t) - 0.07 - k * 0.05 + 0.012 * Math.sin(t * 40 + k)); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); } ctx.stroke(); }
    ctx.restore();
  };
  return { layers: [{ shapes: [shape], fill: { top, bottom }, deco }] };
}

// ------------------------------------------------------------------------------------------ Hügel: Kulisse mit sanft welliger Kuppe
// Rückgabe { part, yAt(x) }: yAt liefert die Kuppenhöhe (Modellmeter) an der Stelle x (für Dinge, die oben stehen).
export function hillShape(w, h, seed = 1) {
  const pr = mulberry32(seed * 31 + 7), ph1 = pr() * 6, ph2 = pr() * 6, skew = (pr() - 0.5) * 0.18;
  const yAt = (x) => {
    const t = clamp((x + w / 2) / w); const tt = clamp(t + skew * Math.sin(Math.PI * t));
    return h * Math.pow(Math.sin(Math.PI * tt), 0.8) * (1 + 0.035 * Math.sin(t * 17 + ph1) + 0.02 * Math.sin(t * 31 + ph2));
  };
  const pts = [[-w / 2, 0]]; const n = Math.max(24, Math.round(w / 0.1));
  for (let i = 1; i < n; i++) { const x = -w / 2 + (w * i) / n; pts.push([x, yAt(x)]); }
  pts.push([w / 2, 0]);
  return { pts, yAt };
}

// Punkt auf der Ellipse (Seitenkoordinaten x/z)
export const ellipsePt = (E, a) => [E.cx + E.rx * Math.cos(a), E.cz + E.rz * Math.sin(a)];

// Band (Dreiecksstreifen) entlang einer Linie in der Seitenebene, wächst über setDrawRange. pts: [[x,z],…], half = halbe Breite.
export function ribbonMesh(pts, half, color, { y = 0.012, order = 1 } = {}) {
  const n = pts.length, pos = new Float32Array(n * 2 * 3), idx = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], tz = b[1] - a[1]; const m = Math.hypot(tx, tz) || 1; tx /= m; tz /= m;
    const nx = -tz, nz = tx;
    pos.set([pts[i][0] + nx * half, y, pts[i][1] + nz * half, pts[i][0] - nx * half, y, pts[i][1] - nz * half], i * 6);
    if (i < n - 1) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = order; mesh.receiveShadow = true; mesh.frustumCulled = false;
  mesh.userData.setCount = (k) => { const c = Math.max(0, Math.min(n - 1, Math.floor(k))); geo.setDrawRange(0, c * 6); mesh.visible = c > 0; };
  mesh.userData.setCount(0);
  return mesh;
}
