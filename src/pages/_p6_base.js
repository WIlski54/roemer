// Station 6 (Pompeji): bemalte Seitenflächen (Straße aus Lavaplatten mit Radspuren, Bürgersteig, Atrium-Boden mit Regenbecken).
// Besitzer: Station 6.
import { textCard, blotches, speckles, grassTufts, pebbles, roundRect } from '../engine/pagepaint.js';
import { mulberry32, TAU } from '../engine/util.js';
import { paintThermenUnder } from './_p6_kit.js';

export const GEO = {
  streetZ0: -0.45, streetZ1: 3.3, walkZ0: -1.5,        // Straße (dunkle Platten) und Bürgersteig davor
  lane: 1.75,                                          // Spur der Karrenräder (Radrillen)
  thermen: { x: -5.4, z: 1.5, w: 3.6, h: 1.4 },        // Thermen-Klappe (links)
  house: { x0: 4.9, x1: 11.7, zBack: -3.0, zFront: -0.82, cx: 8.3 },
  imp: { x: 8.3, z: -2.2, w: 2.3, d: 0.95 },           // Regenbecken (Impluvium)
};

function slabs(ctx, m, { x0, x1, z0, z1, seed, base, joint, hi, rowH = 0.55, wMin = 0.5, wMax = 1.05 }) {
  const r = mulberry32(seed), S = m.S;
  ctx.save(); ctx.beginPath(); ctx.rect(m.x(x0), m.z(z0), (x1 - x0) * S, (z1 - z0) * S); ctx.clip();
  for (let z = z0 - 0.2, row = 0; z < z1; z += rowH * (0.85 + r() * 0.3), row++) {
    for (let x = x0 - r() * wMax; x < x1; ) {
      const w = wMin + r() * (wMax - wMin), h = rowH * (0.85 + r() * 0.3);
      const tone = base[Math.floor(r() * base.length)];
      ctx.fillStyle = tone;
      const j = () => (r() - 0.5) * 0.08 * S;
      ctx.beginPath(); ctx.moveTo(m.x(x) + j(), m.z(z) + j()); ctx.lineTo(m.x(x + w) + j(), m.z(z) + j()); ctx.lineTo(m.x(x + w) + j(), m.z(z + h) + j()); ctx.lineTo(m.x(x) + j(), m.z(z + h) + j()); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = joint; ctx.lineWidth = 0.035 * S; ctx.stroke();
      ctx.fillStyle = hi; ctx.beginPath(); ctx.ellipse(m.x(x + w * 0.4), m.z(z + h * 0.35), w * 0.28 * S, h * 0.14 * S, 0, 0, TAU); ctx.fill();
      x += w;
    }
  }
  ctx.restore();
}

function street(ctx, m, x0, x1, seed) {
  const S = m.S, G = GEO;
  // Boden unter den Läden (Schatten) und Bürgersteig (hohe Randsteine, hell)
  slabs(ctx, m, { x0, x1, z0: G.walkZ0, z1: G.streetZ0, seed: seed + 1, base: ['#d9c9a4', '#cfbc94', '#e0d0ac'], joint: 'rgba(90,65,35,.45)', hi: 'rgba(255,248,225,.22)', rowH: 0.5 });
  ctx.fillStyle = 'rgba(60,35,15,.28)'; ctx.fillRect(m.x(x0), m.z(G.streetZ0 - 0.07), (x1 - x0) * S, 0.07 * S);   // Randstein-Kante
  // Fahrbahn aus großen dunklen Platten
  slabs(ctx, m, { x0, x1, z0: G.streetZ0, z1: G.streetZ1, seed, base: ['#a09785', '#908777', '#a89e8b', '#968d7d'], joint: 'rgba(35,28,20,.6)', hi: 'rgba(255,240,215,.1)', rowH: 0.6, wMin: 0.6, wMax: 1.3 });
  // Radrillen: zwei Spuren entlang der Straße
  ctx.save(); ctx.beginPath(); ctx.rect(m.x(x0), m.z(G.streetZ0), (x1 - x0) * S, (G.streetZ1 - G.streetZ0) * S); ctx.clip();
  ctx.strokeStyle = 'rgba(35,28,20,.4)'; ctx.lineWidth = 0.09 * S;
  for (const dz of [-0.09, 0.09]) { ctx.beginPath(); ctx.moveTo(m.x(x0), m.z(G.lane + dz)); for (let x = x0; x <= x1; x += 0.5) ctx.lineTo(m.x(x), m.z(G.lane + dz + Math.sin(x * 1.7 + seed) * 0.012)); ctx.stroke(); }
  ctx.restore();
  // Straßenrand vorn
  ctx.fillStyle = 'rgba(60,35,15,.3)'; ctx.fillRect(m.x(x0), m.z(G.streetZ1), (x1 - x0) * S, 0.06 * S);
}

export function baseL(def) {
  return {
    paper: '#f4e6c6', ground: { back: '#e3c38a', front: '#d3a96e' }, margin: 0.3, pageNo: 13, seed: 61,
    draw(ctx, m) {
      blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 18, rmin: 0.8, rmax: 2.2, colors: ['rgba(255,244,214,.18)', 'rgba(150,100,50,.08)'], seed: 62 });
      street(ctx, m, -12, 0.1, 5);
      // Thermen: gemalte Räume unter der Klappe
      const T = GEO.thermen; paintThermenUnder(ctx, m, T.x, T.z, T.w, T.h);
      speckles(m, { x0: -12, x1: 0, z0: 3.4, z1: 4.2, n: 60, color: 'rgba(110,70,30,.25)', size: 0.03, seed: 7 });
      textCard(m, { x: -11.35, z: 0.62, w: 5.9, h: 3.2, kicker: def.kicker, title: def.title, sub: def.years, body: def.card, size: 0.275, titleSize: 0.4 });
    },
  };
}

export function baseR() {
  return {
    paper: '#f4e6c6', ground: { back: '#e3c38a', front: '#d3a96e' }, margin: 0.3, pageNo: 14, seed: 63,
    draw(ctx, m) {
      const S = m.S, H = GEO.house, I = GEO.imp;
      blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 20, rmin: 0.6, rmax: 1.9, colors: ['rgba(255,244,214,.16)', 'rgba(150,100,50,.09)'], seed: 64 });
      street(ctx, m, -0.1, 12.2, 9);
      // Atrium-Boden hinter der niedrigen Straßenwand: Terrazzo mit Randband
      const x = m.x(H.x0), z = m.z(H.zBack), w = (H.x1 - H.x0) * S, h = (H.zFront - H.zBack) * S;
      ctx.save(); ctx.beginPath(); ctx.rect(x, z, w, h); ctx.clip();
      const gr = ctx.createLinearGradient(0, z, 0, z + h); gr.addColorStop(0, '#b87a56'); gr.addColorStop(1, '#cd9468'); ctx.fillStyle = gr; ctx.fillRect(x, z, w, h);
      const r = mulberry32(14); for (let i = 0; i < 700; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,240,215,.5)' : 'rgba(80,40,20,.35)'; ctx.fillRect(x + r() * w, z + r() * h, 0.025 * S, 0.025 * S); }
      ctx.strokeStyle = '#2b2220'; ctx.lineWidth = 0.09 * S; ctx.strokeRect(x + 0.18 * S, z + 0.18 * S, w - 0.36 * S, h - 0.36 * S);
      ctx.strokeStyle = '#efe3c2'; ctx.lineWidth = 0.05 * S; ctx.strokeRect(x + 0.32 * S, z + 0.32 * S, w - 0.64 * S, h - 0.64 * S);
      // Sonnenfleck unter der Dachöffnung
      const sg = ctx.createRadialGradient(m.x(I.x + 0.6), m.z(I.z + 0.3), 0, m.x(I.x + 0.6), m.z(I.z + 0.3), 2.0 * S); sg.addColorStop(0, 'rgba(255,240,170,.55)'); sg.addColorStop(1, 'rgba(255,240,170,0)'); ctx.fillStyle = sg; ctx.fillRect(x, z, w, h);
      // Becken-Grund (Wasser kommt als eigene Fläche)
      ctx.fillStyle = '#3e6f98'; roundRect(ctx, m.x(I.x - I.w / 2), m.z(I.z - I.d / 2), I.w * S, I.d * S, 0.06 * S); ctx.fill();
      ctx.restore();
      grassTufts(m, { x0: 0.3, x1: 11.8, z0: 3.5, z1: 4.0, n: 5, seed: 15, color: '#8a9a4a', h: 0.2, alpha: 0.5 });
    },
  };
}
