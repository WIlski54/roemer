// Gemeinsame Bausteine der Stationen 5 (Könige der Kreide) und 6 (Dino-Babys): Kulissenteile, Blinzeln, Staub, Lichtmischung.
import * as THREE from 'three';
import { panel, poly, blob, limb, spline } from '../art/dsl.js';
import { mulberry32, lerp, clamp, smooth, TAU } from '../engine/util.js';
import { makeFlat } from '../engine/popup.js';

// ---------------------------------------------------------------------------------------------------- Kulissen
// Flat über [x0,x1] (Seitenrahmen, absolut) bauen: gehört dadurch zur richtigen Seite (x<0 = links) und klappt an deren Falz.
export function wall(ctx, x0, x1, makePart, o = {}) {
  const c = (x0 + x1) / 2;
  return ctx.flat(makePart(x0 - c, x1 - c), { x: c, ...o });
}

// Nadelbaum-Silhouette (Scherenschnitt): Reihe gestufter Fichten auf welliger Basis. Jeder Baum ist ein eigenes Polygon.
export function treeLinePart(x0, x1, h, { seed = 1, wave = 0.1, freq = 2, phase = 0, tMin = 0.55, tMax = 1.15, wMin = 0.36, wMax = 0.66, overlap = 0.78, fill, deco } = {}) {
  const r = mulberry32(seed);
  const base = (x) => h + wave * Math.sin(((x - x0) / (x1 - x0)) * freq * TAU + phase);
  const shapes = [panel(x0, x1, 0, h - 0.05, { wave, freq, phase, seed, step: 0.12 })];
  let x = x0 - 0.1;
  while (x < x1 - 0.15) {
    const w = lerp(wMin, wMax, r()), th = lerp(tMin, tMax, r()), b = base(Math.min(x1, x + w / 2)) - 0.12;
    shapes.push([
      [x, b], [x + w * 0.30, b + th * 0.40], [x + w * 0.17, b + th * 0.40], [x + w * 0.38, b + th * 0.72], [x + w * 0.29, b + th * 0.72], [x + w * 0.5, b + th],
      [x + w * 0.71, b + th * 0.72], [x + w * 0.62, b + th * 0.72], [x + w * 0.83, b + th * 0.40], [x + w * 0.70, b + th * 0.40], [x + w, b],
    ]);
    x += w * overlap * (0.8 + r() * 0.4);
  }
  return { layers: [{ shapes, fill, deco }] };
}

// Wasserstreifen aus Papier: welliger Oberrand, helle Wellenstriche und Schaumlinie
export function waterPart(x0, x1, h, { phase = 0, seed = 1, top = '#63c8c6', bottom = '#2a8aa3', wave = 0.07, period = 1.3 } = {}) {
  const freq = Math.max(2, (x1 - x0) / period);
  const topY = (x) => { const t = (x - x0) / (x1 - x0); return h + wave * (Math.sin(t * freq * TAU + phase) * 0.6 + Math.sin(t * freq * 2.3 * TAU + phase * 1.7 + seed) * 0.4); };
  return {
    layers: [{
      shapes: [panel(x0, x1, 0, h, { wave, freq, phase, seed, step: 0.1 })], fill: { top, bottom },
      deco(c, bb) {
        const { ctx, tf, S } = c; const r = mulberry32(seed * 7 + 3);
        ctx.save(); ctx.lineCap = 'round';
        // helle Wellenstriche
        ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = Math.max(1, 0.025 * S);
        const n = Math.round((x1 - x0) * 1.6);
        for (let i = 0; i < n; i++) {
          const x = bb.x0 + r() * bb.w, y = bb.y0 + (0.12 + r() * 0.5) * bb.h, L = 0.25 + r() * 0.5;
          ctx.beginPath(); const [a, b] = tf(x, y); ctx.moveTo(a, b); const [a2, b2] = tf(x + L * 0.5, y + 0.03); const [a3, b3] = tf(x + L, y); ctx.quadraticCurveTo(a2, b2, a3, b3); ctx.stroke();
        }
        // Schaumlinie am Oberrand
        ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = Math.max(1.5, 0.045 * S); ctx.beginPath();
        for (let x = x0; x <= x1; x += 0.08) { const [a, b] = tf(x, topY(x) - 0.035); if (x === x0) ctx.moveTo(a, b); else ctx.lineTo(a, b); }
        ctx.stroke();
        // dunklere Unterkante
        const g = ctx.createLinearGradient(...tf(0, bb.y0), ...tf(0, bb.y0 + bb.h * 0.45)); g.addColorStop(0, 'rgba(10,50,80,.35)'); g.addColorStop(1, 'rgba(10,50,80,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H);
        ctx.restore();
      },
    }],
  };
}

// ---------------------------------------------------------------------------------------------------- Seitenboden (Malen)
// Flussband (Ufersand + Wasser) entlang einer Polylinie [[x,z],...] auf dem Seitenboden. widths = [Sand, Wasser]
export function riverBand(m, pts, w, { sand = '#e2d3a2', sandEdge = 'rgba(120,90,50,.35)', water = '#4eb3bd', deep = '#2f8da6', shine = 'rgba(255,255,255,.4)' } = {}) {
  const { ctx } = m;
  const ctrl = (k) => spline(pts.map((p, i) => [p[0], p[1], Array.isArray(w) ? lerp(w[0], w[1], i / (pts.length - 1)) * k : w * k]), 10);
  const poly2 = (k) => { const s = ctrl(k); return limb(s.map((p) => [p[0], p[1], p[2]]), { per: 1, caps: true }); };
  const draw = (k, col, alpha = 1) => { const P = poly2(k); ctx.beginPath(); P.forEach((q, i) => { const [X, Y] = m.pt(q[0], q[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.globalAlpha = alpha; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1; return P; };
  const P0 = draw(1.65, sand);
  ctx.strokeStyle = sandEdge; ctx.lineWidth = Math.max(1, 0.02 * m.S); ctx.stroke();
  draw(1.0, deep);
  draw(0.78, water);
  draw(0.3, shine, 0.35);
  return P0;
}

// dreizehiger Fußabdruck (Seitenboden), Länge s, Richtung rot (rad, 0 = nach +x)
export function footTrack(m, x, z, s, rot, { color = 'rgba(70,45,25,.38)', hi = 'rgba(255,240,200,.18)', toes = 3 } = {}) {
  const { ctx } = m; const [X, Y] = m.pt(x, z);
  ctx.save(); ctx.translate(X, Y); ctx.rotate(rot); ctx.fillStyle = color;
  const S = m.S * s;
  ctx.beginPath(); ctx.ellipse(-0.18 * S, 0, 0.22 * S, 0.17 * S, 0, 0, TAU); ctx.fill();
  for (let i = 0; i < toes; i++) {
    const a = (i - (toes - 1) / 2) * 0.62;
    ctx.beginPath(); ctx.ellipse(Math.cos(a) * 0.3 * S, Math.sin(a) * 0.3 * S, 0.24 * S, 0.075 * S, a, 0, TAU); ctx.fill();
  }
  ctx.fillStyle = hi; ctx.beginPath(); ctx.ellipse(-0.2 * S, -0.05 * S, 0.12 * S, 0.06 * S, 0, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---------------------------------------------------------------------------------------------------- Blinzeln
// Lid-Plättchen, das alle paar Sekunden kurz übers Auge klappt. part = Teil, in dem der Anker liegt.
export function makeBlinker(fig, { part = 'body', anchor = 'eye', r = 0.1, color = '#8b5231', seed = 1, every = [2.8, 6.5] } = {}) {
  const g = fig.parts[part]; const a = fig.anchors[anchor]; if (!g || !a) return null;
  const ws = fig.ws; const piv = (fig.spec.parts[part] && fig.spec.parts[part].pivot) || [0, 0];
  const rw = r * ws;
  const geo = new THREE.CircleGeometry(1, 18); geo.translate(0, -1, 0);
  const mat = new THREE.MeshLambertMaterial({ color, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(a.x - piv[0] * ws, a.y - piv[1] * ws + rw, 0.004);
  mesh.scale.set(rw, 0.0001, 1); mesh.visible = false; mesh.castShadow = false; mesh.renderOrder = 2;
  g.add(mesh);
  const rnd = mulberry32(seed * 977 + 11);
  let timer = lerp(every[0], every[1], rnd()), tt = -1, dbl = false;
  const self = {
    mesh, hold: 0,   // hold 0..1: Lid bleibt (teilweise) geschlossen = Schlafen
    update(dt) {
      if (self.hold > 0.01 && tt < 0) { mesh.visible = true; mesh.scale.y = Math.max(0.0001, rw * clamp(self.hold * 1.15)); return; }
      if (tt < 0) { timer -= dt; if (timer <= 0) { tt = 0; dbl = rnd() < 0.2; } else { if (mesh.visible) mesh.visible = false; return; } }
      tt += dt;
      const D = 0.17; let k = 0;
      if (tt < D) k = Math.sin((tt / D) * Math.PI);
      else if (dbl && tt > D + 0.1 && tt < D * 2 + 0.1) k = Math.sin(((tt - D - 0.1) / D) * Math.PI);
      if (tt > (dbl ? D * 2 + 0.1 : D)) { tt = -1; timer = lerp(every[0], every[1], rnd()); k = 0; }
      k = Math.max(k, self.hold); mesh.visible = k > 0.03; mesh.scale.y = Math.max(0.0001, rw * clamp(k * 1.15));
    },
    dispose() { geo.dispose(); mat.dispose(); },
  };
  return self;
}

// ---------------------------------------------------------------------------------------------------- Partikel
// Gewicht aus Qualitätsstufe und Ruhigem Modus (Anzahl)
export const fxN = (app, n) => Math.max(1, Math.round(n * app.stage.tier.fx * (app.calm ? 0.55 : 1)));

// Staubwölkchen (Erdfarben)
export function puff(app, w, n, { spread = 0.4, up = 0.5, size = 0.34, life = 0.9, alpha = 0.5, color = [0.82, 0.68, 0.5], vx = 0, grow = 2.2 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = spread * (0.4 + Math.random());
    app.fx.dust.emit({ x: w.x + (Math.random() - 0.5) * spread, y: w.y + 0.03, z: w.z + (Math.random() - 0.3) * spread * 0.6, vx: Math.cos(a) * s + vx, vy: up * (0.3 + Math.random() * 0.8), vz: Math.sin(a) * s * 0.5, life: life * (0.7 + Math.random() * 0.6), size: size * (0.7 + Math.random() * 0.6), alpha, color, drag: 1.5, grow });
  }
}

// ---------------------------------------------------------------------------------------------------- Mischung von Lichtstimmungen
export function cloneMood(m) { return JSON.parse(JSON.stringify(m)); }
export function blendMood(out, A, B, k) {
  const L = (a, b) => a + (b - a) * k;
  for (let i = 0; i < 3; i++) { out.keyC[i] = L(A.keyC[i], B.keyC[i]); out.skyC[i] = L(A.skyC[i], B.skyC[i]); out.gndC[i] = L(A.gndC[i], B.gndC[i]); out.pos[i] = L(A.pos[i], B.pos[i]); }
  out.keyI = L(A.keyI, B.keyI); out.hemiI = L(A.hemiI, B.hemiI); out.rimI = L(A.rimI || 0, B.rimI || 0);
  return out;
}

// ---------------------------------------------------------------------------------------------------- Mikroanimation
// Wiegen von Pflanzen: sanftes Schwanken um die Fußlinie; q = Bodenbeben (0..1) addiert ein schnelles Zittern
export class Swayers {
  constructor() { this.list = []; this.q = 0; }
  add(pop, amp = 0.012, spd = 0.6, weight = 1) { this.list.push({ pop, amp, spd, ph: Math.random() * 6.28, weight }); return pop; }
  kick(k = 1) { this.q = Math.max(this.q, k); }
  update(dt, t) {
    this.q = Math.max(0, this.q - dt * 2.4);
    for (const s of this.list) {
      const p = s.pop; if (p.eff < 0.96) { p.yawG.rotation.z = 0; continue; }
      p.yawG.rotation.z = Math.sin(t * s.spd + s.ph) * s.amp + this.q * s.weight * 0.018 * Math.sin(t * 46 + s.ph * 3);
    }
  }
  reset() { for (const s of this.list) s.pop.yawG.rotation.z = 0; this.q = 0; }
}

// ---------------------------------------------------------------------------------------------------- mehr Bausteine
// kleines Flat als Kind eines bestehenden Pop-ups (zählt nicht als eigenes Pop-up): Spuren, Höhlendunkel, Bissspur ...
export function child(popup, part, { x = 0, y = 0, z = 0.03, ppu = 120, border = 0.02, name = 'child', maxTex = 1024 } = {}) {
  const cut = makeFlat(part, { ws: 1, ppu, thickness: 0.02, border, name, maxTex });
  cut.mesh.position.set(x, y, z); cut.mesh.castShadow = false;
  popup.add(cut.mesh); popup.side.own(cut);
  return cut;
}

// Farnwedel auf dem Seitenboden (gemalt): schlanker Bogen mit Fiederchen
export function floorFerns(m, { x0, x1, z0, z1, n = 12, seed = 1, color = '#4d8a3a', hi = 'rgba(190,230,120,.55)', size = 0.55 } = {}) {
  const { ctx } = m; const r = mulberry32(seed);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), s = size * (0.7 + r() * 0.7), fronds = 4 + Math.floor(r() * 3);
    for (let f = 0; f < fronds; f++) {
      const a = -Math.PI / 2 + (f - (fronds - 1) / 2) * 0.5 + (r() - 0.5) * 0.2, L = s * (0.7 + r() * 0.4);
      const ex = Math.cos(a) * L, ez = Math.sin(a) * L * 0.55; const [X, Y] = m.pt(x, z);
      const cx = X + ex * m.S * 0.55 + (r() - 0.5) * 6, cy = Y + ez * m.S * 0.4 - L * m.S * 0.25;
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 0.022 * m.S);
      ctx.beginPath(); ctx.moveTo(X, Y); ctx.quadraticCurveTo(cx, cy, X + ex * m.S, Y + ez * m.S - L * m.S * 0.15); ctx.stroke();
      // Fiederchen entlang des Wedels
      ctx.lineWidth = Math.max(1, 0.015 * m.S); ctx.strokeStyle = hi;
      for (let k = 1; k < 7; k++) {
        const t = k / 7, px = (1 - t) * (1 - t) * X + 2 * (1 - t) * t * cx + t * t * (X + ex * m.S), py = (1 - t) * (1 - t) * Y + 2 * (1 - t) * t * cy + t * t * (Y + ez * m.S - L * m.S * 0.15);
        const ll = (1 - t * 0.7) * 0.16 * m.S; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - ll, py - ll * 0.35); ctx.moveTo(px, py); ctx.lineTo(px + ll, py - ll * 0.35); ctx.stroke();
      }
    }
  }
  ctx.restore();
}

// kleine Blümchen / Tupfen auf dem Boden
export function floorFlowers(m, { x0, x1, z0, z1, n = 20, seed = 1, colors = ['#fff0b0', '#f7c6d6', '#ffffff'], r0 = 0.045 } = {}) {
  const { ctx } = m; const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), [X, Y] = m.pt(x, z), rad = r0 * m.S * (0.7 + r() * 0.8);
    ctx.fillStyle = colors[Math.floor(r() * colors.length)]; ctx.beginPath(); ctx.arc(X, Y, rad, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(210,150,40,.9)'; ctx.beginPath(); ctx.arc(X, Y, rad * 0.4, 0, TAU); ctx.fill();
  }
}

// Pfütze, die den Himmel spiegelt
export function puddle(m, x, z, rx, rz, { sky = '#7fc9d3', rim = 'rgba(90,60,30,.4)' } = {}) {
  const { ctx } = m; const [X, Y] = m.pt(x, z);
  ctx.save(); ctx.fillStyle = 'rgba(90,60,30,.25)'; ctx.beginPath(); ctx.ellipse(X, Y, (rx + 0.1) * m.S, (rz + 0.07) * m.S, 0, 0, TAU); ctx.fill();
  const g = ctx.createLinearGradient(X, Y - rz * m.S, X, Y + rz * m.S); g.addColorStop(0, sky); g.addColorStop(1, '#3f95ad'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(X, Y, rx * m.S, rz * m.S, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = Math.max(1, 0.015 * m.S); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(X - rx * 0.25 * m.S, Y - rz * 0.25 * m.S, rx * 0.3 * m.S, rz * 0.12 * m.S, 0, 0, TAU); ctx.fill();
  ctx.restore();
}
