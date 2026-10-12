// Station 7: kleine Hilfen nur für diese Seite (Canvas-Texturen, Beschriftung der Laschen, Formelschrift, Seile, Wellen).
// Nichts hier ändert gemeinsame Dateien; was aus Engine/Registry gebraucht wird, wird nur importiert.
import * as THREE from 'three';
import { TAU, clamp } from '../engine/util.js';
import { SERIF, roundRect } from '../engine/pagepaint.js';
import { ANIMALS } from '../art/registry.js';
import { specBBox } from '../engine/popup.js';
import { softTexture } from '../engine/effects.js';

export { SERIF, roundRect };

export function canvasTex(w, h, draw, { aniso = 4 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.userData = { canvas: c, g };
  return t;
}
// flach auf die Seite gelegte, bemalte Karte (wie die Legende der Titelseite); liefert { mesh, tex, g, redraw }
export function pagePlane(w, d, pxW, pxH, draw, { y = 0.012, transparent = true } = {}) {
  const tex = canvasTex(pxW, pxH, draw);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: tex, transparent, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1 }));
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = y; mesh.renderOrder = 2;
  const redraw = () => { draw(tex.userData.g, pxW, pxH); tex.needsUpdate = true; };
  return { mesh, tex, g: tex.userData.g, redraw, w, d, pxW, pxH };
}
// Höhe (Welt) für eine Figur, deren Körper k Welt-Einheiten je Meter bekommt (Menschen: k = 1,2)
export function hOf(id, k = 1.2) { const bb = specBBox(ANIMALS[id]()); return bb.h * k; }

// Formel mit Index-Ziffern: Ziffern nach Buchstabe oder ")" werden tiefgestellt; Rest normal
export function formula(g, text, x, y, size, { color = '#2a1a0c', align = 'left', bold = true } = {}) {
  const parts = []; let prev = '';
  for (const ch of text) { const sub = /\d/.test(ch) && /[A-Za-z)]/.test(prev); parts.push({ ch, sub }); prev = ch; }
  const f = (sub) => `${bold ? 'bold ' : ''}${Math.round(size * (sub ? 0.62 : 1))}px ${SERIF}`;
  g.save(); g.textAlign = 'left'; let tw = 0; for (const p of parts) { g.font = f(p.sub); p.w = g.measureText(p.ch).width; tw += p.w; }  g.restore();
  let cx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x;
  g.save(); g.fillStyle = color; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  for (const p of parts) { g.font = f(p.sub); g.fillText(p.ch, cx, y + (p.sub ? size * 0.26 : 0)); cx += p.w; }
  g.restore();
  return tw;
}

// eigene Beschriftung für eine Lasche (zweizeilig möglich), im selben Papier-Stil wie die Engine-Laschen
const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };
export function relabel(ctl, lines, color, { text = '#fff6df' } = {}) {
  const [w, h] = ctl.size, S = 160, W = Math.ceil(w * S), H = Math.ceil(h * S);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  const rr = (x, y, ww, hh, rad) => { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + ww, y, x + ww, y + hh, rad); g.arcTo(x + ww, y + hh, x, y + hh, rad); g.arcTo(x, y + hh, x, y, rad); g.arcTo(x, y, x + ww, y, rad); g.closePath(); };
  const r = 0.22 * S, m = 0.07 * S;
  g.fillStyle = '#f6edd6'; rr(0, 0, W, H, r); g.fill();
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, shade(color, 1.12)); gr.addColorStop(1, shade(color, 0.86));
  g.fillStyle = gr; rr(m, m, W - 2 * m, H - 2 * m, r * 0.75); g.fill();
  g.strokeStyle = 'rgba(255,240,210,.55)'; g.lineWidth = 2; g.setLineDash([7, 6]); rr(m * 2, m * 2, W - 4 * m, H - 4 * m, r * 0.55); g.stroke(); g.setLineDash([]);
  g.fillStyle = 'rgba(40,10,5,.28)'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(W * 0.12 + i * 0.07 * S, H * (0.4 + j * 0.2), 0.022 * S, 0, 7); g.fill(); }
  g.fillStyle = text; g.textAlign = 'center'; g.textBaseline = 'middle';
  const n = lines.length; let fs = H * (n > 1 ? 0.3 : 0.44); const maxW = W * 0.58;
  g.font = `bold ${fs}px ${SERIF}`; while (Math.max(...lines.map((l) => g.measureText(l).width)) > maxW && fs > 10) { fs -= 2; g.font = `bold ${fs}px ${SERIF}`; }
  g.shadowColor = 'rgba(60,10,5,.5)'; g.shadowBlur = 3; g.shadowOffsetY = 2;
  lines.forEach((l, i) => g.fillText(l, W * 0.57, H * 0.5 + (i - (n - 1) / 2) * fs * 1.08));
  g.shadowColor = 'transparent'; g.fillStyle = 'rgba(255,246,223,.9)';
  const ah = H * 0.2, tri = (x, dir) => { g.beginPath(); g.moveTo(x, H / 2); g.lineTo(x - dir * ah * 0.9, H / 2 - ah); g.lineTo(x - dir * ah * 0.9, H / 2 + ah); g.closePath(); g.fill(); };
  tri(W - 0.1 * S, 1); tri(0.34 * S, -1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const old = ctl.capMat.map; ctl.capMat.map = t; ctl.capMat.needsUpdate = true; if (old && old.dispose) old.dispose();
}

// Wellenkamm (Halbmond) als Papierschnitt-Form
export function crestGeo(w, h) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.quadraticCurveTo(0, h * 1.9, w / 2, 0); s.quadraticCurveTo(0, h * 0.9, -w / 2, 0);
  return new THREE.ShapeGeometry(s, 6);
}
// Seil / Strecke zwischen zwei Punkten (Einheitsplane, wird skaliert und gedreht)
export function segMesh(color, w = 0.05, z = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  m.userData.w = w; m.position.z = z; return m;
}
export function setSeg(m, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1e-4;
  m.position.x = (x0 + x1) / 2; m.position.y = (y0 + y1) / 2; m.rotation.z = Math.atan2(dy, dx); m.scale.set(len, m.userData.w, 1);
}
// weiches additives Leuchten
export function glowMesh(color, size, opacity = 0.8) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: softTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.renderOrder = 4; return m;
}
export const smooth01 = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOutBack = (t) => { t = clamp(t); const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export { TAU, clamp };

// Kleiner Schatten-/Papier-Rahmen für eine bemalte Plane (Papierkante)
export function paperEdge(w, d, color = 0xf1e7cf, t = 0.04) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, t, d), new THREE.MeshLambertMaterial({ color }));
  m.position.y = t / 2; m.receiveShadow = true; return m;
}
