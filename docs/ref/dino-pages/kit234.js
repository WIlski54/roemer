// Gemeinsame Bausteine für die Stationen 2 (Jura-Wald), 3 (Jura-Lagune) und 4 (Kreide-Meer).
import * as THREE from 'three';
import { Popup } from '../engine/popup.js';
import { clamp, lerp, TAU, mulberry32 } from '../engine/util.js';
import { panel } from '../art/dsl.js';

// Partikelrate: an Qualitätsstufe und Ruhigen Modus gekoppelt
export const fxRate = (app) => app.stage.tier.fx * (app.calm ? 0.5 : 1);

// kleine Hilfen --------------------------------------------------------------------------------------------
export const wob = (t, f, ph = 0) => Math.sin(t * f + ph);
export const easeIO = (t) => t * t * (3 - 2 * t);
export const ramp = (v, a, b) => clamp((v - a) / (b - a));

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

// Lichtstrahl (additiv): schräges, weiches Band
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

// ---- Fäden (Flugsaurier, Fische): Papierfaden von einer festen Stelle der Seite zu einem Punkt am Tier --------------
const UP = new THREE.Vector3(0, 1, 0);
export class Threads {
  constructor(side, { color = 0x5a4632, thick = 0.013 } = {}) {
    this.side = side; this.items = []; this.thick = thick;
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    this.mat = new THREE.MeshBasicMaterial({ color });
    this.tmpA = new THREE.Vector3(); this.tmpB = new THREE.Vector3(); this.tmpD = new THREE.Vector3();
    this.group = new THREE.Group(); side.add(this.group);
  }
  // pop: Popup des Tieres, fig: Figur (Marker hängt in fig.root), model:[mx,my] Anker in Modellmetern, top:[x,y,z] Aufhängung in Seitenkoordinaten
  add(pop, fig, model, top, { brad = true } = {}) {
    const marker = new THREE.Object3D(); marker.position.set(model[0] * fig.ws, model[1] * fig.ws, 0.03); fig.root.add(marker);
    const mesh = new THREE.Mesh(this.geo, this.mat); mesh.frustumCulled = false; this.group.add(mesh);
    const it = { pop, marker, mesh, top: new THREE.Vector3(...top), vis: true };
    if (brad) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.085, 14), new THREE.MeshBasicMaterial({ color: 0x3b2c1c })); b.position.set(top[0], top[1], top[2] + 0.045); this.group.add(b); it.brad = b; }
    this.items.push(it);
    return it;
  }
  update() {
    const a = this.tmpA, b = this.tmpB, d = this.tmpD, th = this.thick;
    for (const it of this.items) {
      const show = it.pop.eff > 0.02 && it.vis;
      it.mesh.visible = show; if (it.brad) it.brad.visible = it.pop.eff > 0.02;
      if (!show) continue;
      it.marker.getWorldPosition(a); this.side.group.worldToLocal(a);
      b.copy(it.top);
      d.subVectors(b, a); const len = d.length() || 0.001; d.multiplyScalar(1 / len);
      it.mesh.position.copy(a).addScaledVector(d, len * 0.5);
      it.mesh.scale.set(th, len, th);
      it.mesh.quaternion.setFromUnitVectors(UP, d);
    }
  }
}

// ---- Blatt-Pool: kleine Papierblätter, die aus einer Krone herabsegeln ---------------------------------------------
function leafTexture(c0, c1) {
  return canvasTex(64, 64, (g, W, H) => {
    g.translate(W / 2, H / 2); g.rotate(-0.6);
    const gr = g.createLinearGradient(-W * 0.4, 0, W * 0.4, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1);
    g.fillStyle = gr; g.strokeStyle = 'rgba(30,60,30,.7)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-W * 0.42, 0); g.quadraticCurveTo(0, -H * 0.42, W * 0.42, 0); g.quadraticCurveTo(0, H * 0.42, -W * 0.42, 0); g.fill(); g.stroke();
    g.strokeStyle = 'rgba(240,255,200,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-W * 0.36, 0); g.lineTo(W * 0.36, 0); g.stroke();
  });
}
export class LeafPool {
  // palette: Liste von [c0,c1]; n = Anzahl; size = Weltgröße
  constructor(side, { n = 14, size = 0.2, palette = [['#7cc063', '#3c8f4a'], ['#a6d56a', '#5da24a'], ['#5eae73', '#2f7a50']], opaque = true } = {}) {
    this.side = side; this.n = n; this.cursor = 0;
    this.group = new THREE.Group(); side.add(this.group);
    this.geo = new THREE.PlaneGeometry(size, size);
    this.mats = palette.map(([a, b]) => new THREE.MeshLambertMaterial({ map: leafTexture(a, b), transparent: true, alphaTest: 0.25, side: THREE.DoubleSide }));
    this.items = [];
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.geo, this.mats[i % this.mats.length]); m.visible = false; m.castShadow = true;
      this.group.add(m);
      this.items.push({ m, life: 0, age: 0, vx: 0, vy: 0, vz: 0, sp: 0, ph: 0, rest: 0 });
    }
  }
  emit(x, y, z, vx = 0) {
    const it = this.items[this.cursor]; this.cursor = (this.cursor + 1) % this.n;
    it.m.visible = true; it.m.position.set(x, y, z); it.age = 0; it.life = 4.5 + Math.random() * 1.5; it.rest = 0;
    it.vx = vx + (Math.random() - 0.5) * 0.5; it.vy = -0.15 - Math.random() * 0.2; it.vz = (Math.random() - 0.3) * 0.25;
    it.sp = 2 + Math.random() * 3; it.ph = Math.random() * 6;
    it.m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
  }
  update(dt) {
    for (const it of this.items) {
      if (!it.m.visible) continue;
      it.age += dt;
      const m = it.m;
      if (m.position.y > 0.03) {
        it.vy = Math.max(-0.75, it.vy - 0.6 * dt);
        m.position.x += (it.vx + Math.sin(it.age * 2.2 + it.ph) * 0.35) * dt; m.position.y += it.vy * dt; m.position.z += it.vz * dt;
        m.rotation.x += it.sp * dt * 0.7; m.rotation.z += it.sp * dt;
      } else { m.position.y = 0.03; m.rotation.x = -Math.PI / 2; it.rest += dt; if (it.rest > 2.2) m.scale.setScalar(Math.max(0.001, 1 - (it.rest - 2.2) / 0.7)); if (it.rest > 2.9) { m.visible = false; m.scale.setScalar(1); } }
      if (it.age > it.life) { m.visible = false; m.scale.setScalar(1); }
    }
  }
  clear() { for (const it of this.items) { it.m.visible = false; it.m.scale.setScalar(1); } }
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

// Augen-Blinzeln: kleine Hautklappe über dem Auge. part = Name des Figurenteils, eye = Modell-Auge [x,y] in m, r = Radius in m
export function addBlink(fig, part, eye, r, color = '#8f84c4') {
  const g = fig.parts[part]; if (!g) return null;
  const pv = (fig.spec.parts[part].pivot) || [0, 0], ws = fig.ws;
  const lid = new THREE.Group(); lid.position.set((eye[0] - pv[0]) * ws, (eye[1] - pv[1] + r) * ws, 0.012);
  const m = new THREE.Mesh(new THREE.CircleGeometry(r * ws * 1.08, 14), new THREE.MeshBasicMaterial({ color }));
  m.position.y = -r * ws; lid.add(m); lid.scale.y = 0.001; g.add(lid);
  return { lid, next: 2 + Math.random() * 3, t: -1 };
}
export function updateBlink(b, dt) {
  if (!b) return;
  if (b.t < 0) { b.next -= dt; if (b.next <= 0) { b.t = 0; } b.lid.scale.y = 0.001; return; }
  b.t += dt;
  const k = b.t / 0.22;
  b.lid.scale.y = k >= 1 ? 0.001 : Math.max(0.001, Math.sin(k * Math.PI));
  if (k >= 1) { b.t = -1; b.next = 2.5 + Math.random() * 4.5; }
}

// Winkel eines Modellpunkts nach Drehung des Teils um seinen Pivot (Modellmeter) -> Seitenkoordinaten
export function partPoint(act, part, mx, my, ang, out) {
  const f = act.fig, ws = f.ws, pv = (f.spec.parts[part].pivot) || [0, 0];
  const rx = mx - pv[0], ry = my - pv[1], c = Math.cos(ang), s = Math.sin(ang);
  const X = pv[0] + rx * c - ry * s, Y = pv[1] + rx * s + ry * c;
  const dir = f.group.scale.x;
  out.x = act.popup.group.position.x + f.group.position.x + X * ws * dir;
  out.y = Y * ws + (act.popup.group.position.y || 0) + f.root.position.y;
  return out;
}
export function modelPoint(act, mx, my, out) {
  const f = act.fig, ws = f.ws, dir = f.group.scale.x;
  out.x = act.popup.group.position.x + f.group.position.x + mx * ws * dir;
  out.y = my * ws + (act.popup.group.position.y || 0) + f.root.position.y;
  return out;
}

// Wackeln einer Kulisse (Pop-up-Pivot in der Papierebene): amplitude (rad), Frequenz
export function swayPop(pop, amp, t, f = 6, ph = 0) { pop.pivot.rotation.z = amp * Math.sin(t * f + ph); }

// ---- Wasserringe: flache Ringe, die auf der Seite aufgehen und verblassen ------------------------------------------
export class RipplePool {
  constructor(side, { n = 8, color = 0xffffff, y = 0.022, op = 0.7 } = {}) {
    this.group = new THREE.Group(); side.add(this.group); this.op = op; this.cur = 0;
    this.geo = new THREE.RingGeometry(0.84, 1, 40); this.geo.rotateX(-Math.PI / 2);
    this.items = [];
    for (let i = 0; i < n; i++) {
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, fog: false });
      const m = new THREE.Mesh(this.geo, mat); m.position.y = y; m.visible = false; m.renderOrder = 3; this.group.add(m);
      this.items.push({ m, mat, age: 0, life: 1, r1: 1, zs: 0.6 });
    }
  }
  emit(x, z, r1 = 0.8, life = 1.7, zs = 0.62) {
    const it = this.items[this.cur]; this.cur = (this.cur + 1) % this.items.length;
    it.m.position.x = x; it.m.position.z = z; it.m.visible = true; it.age = 0; it.life = life; it.r1 = r1; it.zs = zs;
  }
  update(dt) {
    for (const it of this.items) {
      if (!it.m.visible) continue;
      it.age += dt; const k = it.age / it.life;
      if (k >= 1) { it.m.visible = false; continue; }
      const r = 0.06 + it.r1 * (1 - (1 - k) * (1 - k));
      it.m.scale.set(r, 1, r * it.zs);
      it.mat.opacity = this.op * Math.pow(1 - k, 1.5);
    }
  }
  clear() { for (const it of this.items) it.m.visible = false; }
}

// ---- Insel: sandige Kuppel mit moosiger Kappe (Papierform für ctx.flat, zentriert bei x=0) -------------------------
export function islandPart(w, h, { seed = 1, sand = ['#f1e6b8', '#d6c185'], moss = ['#9ccb78', '#6fa65a'], wob = 0.06 } = {}) {
  const r = mulberry32(seed * 7 + 3), n = 28, top = [];
  for (let i = 0; i <= n; i++) { const t = i / n, k = Math.sin(Math.PI * t); top.push([-w / 2 + w * t, h * Math.pow(k, 0.62) * (1 + (r() - 0.5) * wob * 3)]); }
  const body = [[-w / 2, 0], ...top.slice(1, -1), [w / 2, 0]];
  const cap = top.slice(3, -3).map(([x, y]) => [x, y]);
  const capPoly = [...cap, ...cap.slice().reverse().map(([x, y], i) => [x, y - (0.1 + 0.07 * Math.abs(Math.sin(i * 1.7 + seed)))])];
  return {
    layers: [
      {
        shapes: [body], fill: { top: sand[0], bottom: sand[1] },
        deco: (c, bb) => {
          const { ctx, tf } = c; const rr = mulberry32(seed + 11);
          // Sandschatten rechts, Lichtkante links
          const g = ctx.createLinearGradient(...tf(bb.x0, bb.y0 + bb.h * 0.5), ...tf(bb.x1, bb.y0 + bb.h * 0.5));
          g.addColorStop(0, 'rgba(255,250,220,.28)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(120,90,40,.22)');
          ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
          ctx.fillStyle = 'rgba(120,95,50,.28)';
          for (let i = 0; i < 70; i++) { const [X, Y] = tf(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h * 0.7); ctx.beginPath(); ctx.arc(X, Y, Math.max(0.8, c.S * (0.012 + rr() * 0.02)), 0, TAU); ctx.fill(); }
          ctx.fillStyle = 'rgba(255,252,230,.4)';
          for (let i = 0; i < 40; i++) { const [X, Y] = tf(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h * 0.7); ctx.beginPath(); ctx.arc(X, Y, Math.max(0.8, c.S * (0.01 + rr() * 0.015)), 0, TAU); ctx.fill(); }
        },
      },
      { shapes: [capPoly], fill: { top: moss[0], bottom: moss[1] }, deco: (c, bb) => { const { ctx, tf } = c; const rr = mulberry32(seed + 5); ctx.strokeStyle = 'rgba(30,80,40,.55)'; ctx.lineWidth = Math.max(1, c.S * 0.018); for (let i = 0; i < 40; i++) { const [X, Y] = tf(bb.x0 + rr() * bb.w, bb.y0 + rr() * bb.h); ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X + (rr() - 0.5) * c.S * 0.05, Y - c.S * (0.06 + rr() * 0.07)); ctx.stroke(); } } },
    ],
  };
}
