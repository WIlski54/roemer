// Station 8: gemalte Flächen der beiden Seiten (Straße von damals bis heute, Rhein, Karte „Römer bei uns“).
import { roundRect, SERIF } from '../engine/pagepaint.js';
import { mulberry32, lerp, clamp, TAU } from '../engine/util.js';

// ---------------------------------------------------------------- Geometrie
export const ROAD_R = { z: -1.45, hw: 0.5 };                            // Straße auf der rechten Seite (Mittellinie, halbe Breite)
export const ROAD_L = { z0: -2.05, zFold: -0.95, zFar: -0.18 };        // linke Seite: Oberkante, Unterkante am Falz / weiter links
export const riverW = (x) => 2.25 * (0.45 + 0.55 * Math.sin(0.5 * Math.PI * clamp((x - 0.1) / 1.9))) * (1 + 0.09 * Math.sin(x * 0.6 + 1.2)) * (x < 0.1 ? 0 : 1);
export const riverC = (x) => 0.55 + 0.1 * Math.sin(x * 0.45 + 0.4);
export const MAP = { x0: -5.12, x1: -0.78, z0: 0.42, z1: 3.78, pad: 0.16 };
const MW = MAP.x1 - MAP.x0, MH = MAP.z1 - MAP.z0;
// Karten-Koordinaten (u nach rechts, v nach unten, 0..1 im Innenbereich) -> Seite
export const mapToPage = (u, v) => [MAP.x0 + MAP.pad + u * (MW - 2 * MAP.pad), MAP.z0 + MAP.pad + v * (MH - 2 * MAP.pad)];
export const PINS = {
  xanten: { u: 0.5, v: 0.3, label: 'Xanten', card: 'xanten', dx: 0.07, dy: -0.03, align: 'left' },
  werthausen: { u: 0.58, v: 0.53, label: 'Duisburg · Moers', card: 'werthausen', dx: -0.07, dy: 0.0, align: 'right', ring: true },
  koeln: { u: 0.68, v: 0.8, label: 'Köln', card: 'koeln', dx: 0.07, dy: 0.0, align: 'left' },
};

// ---------------------------------------------------------------- Straße links: Römerpflaster rechts, Asphalt links
export function paintRoadLeft(ctx, m) {
  const S = m.S, r = mulberry32(41);
  const bottom = (x) => lerp(ROAD_L.zFar, ROAD_L.zFold, clamp((x + 4.2) / 4.2));       // an der rechten Seite schmaler (passt zur Straße der rechten Seite)
  const top = ROAD_L.z0;
  const poly = []; for (let x = -12.2; x <= 0.31; x += 0.3) poly.push([x, top]); for (let x = 0.3; x >= -12.2; x -= 0.3) poly.push([x, bottom(x)]);
  const path = () => { ctx.beginPath(); poly.forEach(([x, z], i) => { const X = m.x(x), Z = m.z(z); if (i) ctx.lineTo(X, Z); else ctx.moveTo(X, Z); }); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(40,50,40,.35)'; ctx.shadowBlur = 0.1 * S; path(); ctx.fillStyle = '#b2aa96'; ctx.fill(); ctx.restore();
  path(); ctx.fillStyle = '#c4bca5'; ctx.fill();
  ctx.save(); path(); ctx.clip();
  // römisches Pflaster
  ctx.strokeStyle = 'rgba(90,76,56,.4)'; ctx.lineWidth = 0.018 * S;
  const zA = top, zB = ROAD_L.zFar + 0.1;
  for (let z = zA, row = 0; z < zB + 1.2; z += 0.3, row++) {
    ctx.beginPath(); ctx.moveTo(m.x(-12.3), m.z(z)); ctx.lineTo(m.x(0.4), m.z(z)); ctx.stroke();
    for (let x = -12.3 + (row % 2) * 0.24; x < 0.4; x += 0.48 + r() * 0.1) { ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.lineTo(m.x(x), m.z(z + 0.3)); ctx.stroke(); }
  }
  for (let i = 0; i < 220; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,250,230,.22)' : 'rgba(90,70,50,.14)'; ctx.beginPath(); ctx.arc(m.x(-12 + r() * 12.4), m.z(top + r() * 1.9), (0.03 + r() * 0.06) * S, 0, TAU); ctx.fill(); }
  // Asphalt von links her: Verlauf in die Römerstraße
  const gx0 = m.x(-7.4), gx1 = m.x(-4.4);
  const ga = ctx.createLinearGradient(gx0, 0, gx1, 0); ga.addColorStop(0, 'rgba(74,80,88,1)'); ga.addColorStop(0.55, 'rgba(74,80,88,.88)'); ga.addColorStop(1, 'rgba(74,80,88,0)');
  ctx.fillStyle = ga; ctx.fillRect(0, m.z(top - 0.1), m.x(0), m.z(1.2) - m.z(top - 0.1));
  // Asphaltkörnung + Randlinien + gestrichelte Mitte (nur dort, wo Asphalt ist)
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, m.x(-5.2), m.z(2)); ctx.clip();
  for (let i = 0; i < 400; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.1)'; ctx.fillRect(m.x(-12.2 + r() * 7), m.z(top + r() * 2), 0.03 * S, 0.03 * S); }
  const zMid = (top + bottom(-9)) / 2;
  ctx.strokeStyle = 'rgba(240,240,232,.9)'; ctx.lineWidth = 0.045 * S;
  ctx.beginPath(); ctx.moveTo(m.x(-12.2), m.z(top + 0.1)); ctx.lineTo(m.x(-5.4), m.z(top + 0.1)); ctx.moveTo(m.x(-12.2), m.z(bottom(-9) - 0.1)); ctx.lineTo(m.x(-5.4), m.z(bottom(-9) - 0.1)); ctx.stroke();
  ctx.setLineDash([0.4 * S, 0.3 * S]); ctx.beginPath(); ctx.moveTo(m.x(-12.2), m.z(zMid)); ctx.lineTo(m.x(-5.4), m.z(zMid)); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  ctx.restore();
  // Randsteine
  ctx.strokeStyle = 'rgba(70,60,45,.5)'; ctx.lineWidth = 0.03 * S; path(); ctx.stroke();
  // Beschriftung (klein, gedruckt)
  ctx.save(); ctx.font = `italic ${0.17 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(70,56,40,.55)';
  ctx.fillText('früher: via strata', m.x(-1.9), m.z(top + 0.18)); ctx.fillText('heute: Straße', m.x(-10.3), m.z(top + 0.18)); ctx.restore();
}

// ---------------------------------------------------------------- Rhein, Ufer und Römerstraße auf der rechten Seite
export function paintRiverRight(ctx, m) {
  const S = m.S, r = mulberry32(17);
  // Römerstraße am Ufer (Limesweg)
  const z0 = ROAD_R.z - ROAD_R.hw, z1 = ROAD_R.z + ROAD_R.hw;
  const rp = () => { ctx.beginPath(); ctx.moveTo(m.x(0), m.z(z0)); for (let x = 0; x <= 12.3; x += 0.4) ctx.lineTo(m.x(x), m.z(z0 + 0.03 * Math.sin(x * 1.3))); ctx.lineTo(m.x(12.3), m.z(z1)); for (let x = 12.3; x >= 0; x -= 0.4) ctx.lineTo(m.x(x), m.z(z1 + 0.03 * Math.sin(x * 1.1 + 2))); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(40,50,40,.35)'; ctx.shadowBlur = 0.08 * S; rp(); ctx.fillStyle = '#b2aa96'; ctx.fill(); ctx.restore();
  rp(); ctx.fillStyle = '#c4bca5'; ctx.fill();
  ctx.save(); rp(); ctx.clip();
  ctx.strokeStyle = 'rgba(90,76,56,.4)'; ctx.lineWidth = 0.018 * S;
  for (let z = z0, row = 0; z < z1; z += 0.25, row++) { ctx.beginPath(); ctx.moveTo(m.x(0), m.z(z)); ctx.lineTo(m.x(12.4), m.z(z)); ctx.stroke(); for (let x = (row % 2) * 0.22; x < 12.4; x += 0.44 + r() * 0.1) { ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.lineTo(m.x(x), m.z(z + 0.25)); ctx.stroke(); } }
  for (let i = 0; i < 140; i++) { ctx.fillStyle = r() > 0.5 ? 'rgba(255,250,230,.22)' : 'rgba(90,70,50,.14)'; ctx.beginPath(); ctx.arc(m.x(r() * 12), m.z(z0 + r() * (z1 - z0)), (0.03 + r() * 0.05) * S, 0, TAU); ctx.fill(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(70,60,45,.5)'; ctx.lineWidth = 0.03 * S; rp(); ctx.stroke();
  // Fluss: Ufer (feuchte Erde), Wasser mit Verlauf, Strömungslinien, Kräusel
  const xs = []; for (let x = 0; x <= 12.4; x += 0.2) xs.push(x);
  const edge = (x, side, grow) => riverC(x) + side * (riverW(x) / 2 + grow);
  const riverPath = (grow) => { ctx.beginPath(); xs.forEach((x, i) => { const X = m.x(x), Z = m.z(edge(x, -1, grow)); if (i) ctx.lineTo(X, Z); else ctx.moveTo(X, Z); }); for (let i = xs.length - 1; i >= 0; i--) ctx.lineTo(m.x(xs[i]), m.z(edge(xs[i], 1, grow))); ctx.closePath(); };
  ctx.save(); ctx.shadowColor = 'rgba(30,50,40,.4)'; ctx.shadowBlur = 0.08 * S; riverPath(0.2); ctx.fillStyle = '#8c8f78'; ctx.fill(); ctx.restore();   // Uferstreifen
  riverPath(0.2); ctx.fillStyle = '#b9b79a'; ctx.fill();                                                                                      // Kies
  riverPath(0.06);
  const gw = ctx.createLinearGradient(0, m.z(-0.7), 0, m.z(1.9)); gw.addColorStop(0, '#6c909f'); gw.addColorStop(0.5, '#8db1bf'); gw.addColorStop(1, '#b3cdd4');
  ctx.fillStyle = gw; ctx.fill();
  ctx.save(); riverPath(0.06); ctx.clip();
  // Himmelsspiegelung (heller Dunst), Strömungsfäden, Kräusel
  const gl = ctx.createLinearGradient(m.x(0), 0, m.x(12), 0); gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.55, 'rgba(255,248,230,.28)'); gl.addColorStop(1, 'rgba(255,255,255,.05)');
  ctx.fillStyle = gl; ctx.fillRect(m.x(0), m.z(-1), m.x(12.4) - m.x(0), m.z(2.4) - m.z(-1));
  ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const off = (r() - 0.5) * 2.0; ctx.strokeStyle = r() > 0.4 ? 'rgba(235,248,252,.38)' : 'rgba(40,80,100,.16)'; ctx.lineWidth = (0.015 + r() * 0.02) * S; ctx.beginPath(); const xa = r() * 10; for (let k = 0; k <= 12; k++) { const x = xa + k * 0.22; const X = m.x(x), Z = m.z(riverC(x) + off * (riverW(x) / 2) * 0.9 + 0.02 * Math.sin(k)); if (k) ctx.lineTo(X, Z); else ctx.moveTo(X, Z); } ctx.stroke(); }
  for (let i = 0; i < 70; i++) { const x = 0.8 + r() * 11, z = riverC(x) + (r() - 0.5) * riverW(x) * 0.85, l = (0.12 + r() * 0.2) * S; ctx.strokeStyle = 'rgba(240,250,252,.55)'; ctx.lineWidth = (0.014 + r() * 0.012) * S; ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.quadraticCurveTo(m.x(x) + l * 0.25, m.z(z) - 0.05 * S, m.x(x) + l * 0.5, m.z(z)); ctx.quadraticCurveTo(m.x(x) + l * 0.75, m.z(z) + 0.05 * S, m.x(x) + l, m.z(z)); ctx.stroke(); }
  ctx.restore();
  // Kiesel am Ufer
  for (let i = 0; i < 110; i++) { const x = 0.4 + r() * 11.6, side = r() > 0.5 ? 1 : -1, z = edge(x, side, 0.02 + r() * 0.16); ctx.fillStyle = r() > 0.5 ? 'rgba(140,130,108,.7)' : 'rgba(220,214,190,.7)'; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), (0.03 + r() * 0.05) * S, (0.02 + r() * 0.03) * S, r(), 0, TAU); ctx.fill(); }
}

// ---------------------------------------------------------------- Karte „Römer bei uns“ (stark vereinfacht)
export function paintMap(ctx, m) {
  const S = m.S, r = mulberry32(9);
  const X0 = MAP.x0, Z0 = MAP.z0;
  ctx.save(); ctx.shadowColor = 'rgba(30,40,30,.4)'; ctx.shadowBlur = 0.14 * S; ctx.shadowOffsetY = 0.05 * S;
  ctx.fillStyle = '#f8f1dc'; roundRect(ctx, m.x(X0), m.z(Z0), MW * S, MH * S, 0.08 * S); ctx.fill(); ctx.restore();
  const P = (u, v) => { const [x, z] = mapToPage(u, v); return [m.x(x), m.z(z)]; };
  const ix = m.x(X0 + MAP.pad), iz = m.z(Z0 + MAP.pad), iw = (MW - 2 * MAP.pad) * S, ih = (MH - 2 * MAP.pad) * S;
  ctx.save(); ctx.beginPath(); ctx.rect(ix, iz, iw, ih); ctx.clip();
  // Land
  const land = ctx.createLinearGradient(ix, iz, ix + iw, iz + ih); land.addColorStop(0, '#e8e8cf'); land.addColorStop(1, '#d2dcb6');
  ctx.fillStyle = land; ctx.fillRect(ix, iz, iw, ih);
  for (let i = 0; i < 90; i++) { const [X, Z] = P(r(), r()); ctx.strokeStyle = 'rgba(90,130,80,.35)'; ctx.lineWidth = 0.014 * S; ctx.beginPath(); ctx.moveTo(X, Z); ctx.lineTo(X - 0.012 * S, Z - 0.05 * S); ctx.moveTo(X, Z); ctx.lineTo(X + 0.012 * S, Z - 0.05 * S); ctx.stroke(); }
  // Hügel unten rechts und Wald
  for (let i = 0; i < 9; i++) { const [X, Z] = P(0.8 + r() * 0.2, 0.55 + r() * 0.4); ctx.fillStyle = 'rgba(120,150,100,.45)'; ctx.beginPath(); ctx.ellipse(X, Z, 0.16 * S, 0.1 * S, 0, Math.PI, 0); ctx.fill(); }
  // Meer (Nordsee) oben links
  const sea = [[0, 0], [0.54, 0], [0.5, 0.09], [0.38, 0.15], [0.22, 0.19], [0.12, 0.28], [0.05, 0.4], [0, 0.46]];
  ctx.beginPath(); sea.forEach(([u, v], i) => { const [X, Z] = P(u, v); if (i) ctx.lineTo(X, Z); else ctx.moveTo(X, Z); }); ctx.closePath();
  const sg = ctx.createLinearGradient(ix, iz, ix + iw * 0.5, iz + ih * 0.4); sg.addColorStop(0, '#9fc3d6'); sg.addColorStop(1, '#bcd8e2'); ctx.fillStyle = sg; ctx.fill();
  ctx.strokeStyle = 'rgba(70,100,110,.55)'; ctx.lineWidth = 0.03 * S; ctx.stroke();
  for (let i = 0; i < 12; i++) { const [X, Z] = P(r() * 0.4, r() * 0.3); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 0.014 * S; ctx.beginPath(); ctx.moveTo(X, Z); ctx.quadraticCurveTo(X + 0.04 * S, Z - 0.03 * S, X + 0.08 * S, Z); ctx.stroke(); }
  // Rhein
  const rhine = [[0.8, 1.04], [0.76, 0.92], [0.69, 0.8], [0.64, 0.68], [0.6, 0.55], [0.56, 0.42], [0.5, 0.3], [0.4, 0.24], [0.3, 0.22], [0.2, 0.22]];
  const curve = (pts, off = 0) => { ctx.beginPath(); pts.forEach(([u, v], i) => { const [X, Z] = P(u + off, v); if (i === 0) ctx.moveTo(X, Z); else { const [pu, pv] = pts[i - 1]; const [PX, PZ] = P(pu + off, pv); ctx.quadraticCurveTo(PX, PZ, (PX + X) / 2, (PZ + Z) / 2); } }); const [lu, lv] = pts[pts.length - 1]; const [LX, LZ] = P(lu + off, lv); ctx.lineTo(LX, LZ); };
  curve(rhine); ctx.strokeStyle = 'rgba(60,100,125,.6)'; ctx.lineWidth = 0.12 * S; ctx.lineCap = 'round'; ctx.stroke();
  curve(rhine); ctx.strokeStyle = '#6aa3c2'; ctx.lineWidth = 0.085 * S; ctx.stroke();
  curve(rhine); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 0.02 * S; ctx.stroke();
  // Limes (rot, gestrichelt, westliches Ufer)
  const limes = rhine.slice(1, 8);
  ctx.setLineDash([0.1 * S, 0.07 * S]); curve(limes, -0.055); ctx.strokeStyle = '#a82f2f'; ctx.lineWidth = 0.035 * S; ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
  // Orte
  ctx.save(); ctx.textBaseline = 'middle';
  for (const [k, p] of Object.entries(PINS)) {
    const [X, Z] = P(p.u, p.v);
    ctx.fillStyle = 'rgba(40,30,20,.3)'; ctx.beginPath(); ctx.ellipse(X + 0.02 * S, Z + 0.035 * S, 0.075 * S, 0.035 * S, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.strokeStyle = '#fff6df'; ctx.lineWidth = 0.025 * S; ctx.beginPath(); ctx.arc(X, Z, 0.075 * S, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6df'; ctx.beginPath(); ctx.arc(X, Z, 0.026 * S, 0, TAU); ctx.fill();
    const [lx, lz] = P(p.u + p.dx, p.v + p.dy);
    ctx.font = `bold ${0.145 * S}px ${SERIF}`; ctx.textAlign = p.align;
    ctx.lineWidth = 0.05 * S; ctx.strokeStyle = 'rgba(248,241,220,.9)'; ctx.strokeText(p.label, lx, lz); ctx.fillStyle = '#3a2615'; ctx.fillText(p.label, lx, lz);
  }
  // Beschriftungen
  ctx.font = `italic ${0.14 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(40,80,100,.75)';
  { const [X, Z] = P(0.18, 0.08); ctx.fillText('Nordsee', X, Z); }
  { const [X, Z] = P(0.78, 0.7); ctx.fillStyle = 'rgba(40,80,120,.85)'; ctx.fillText('Rhein', X, Z); }
  { const [X, Z] = P(0.35, 0.34); ctx.fillStyle = '#a82f2f'; ctx.font = `bold italic ${0.13 * S}px ${SERIF}`; ctx.fillText('Limes', X, Z); }
  ctx.font = `bold ${0.19 * S}px ${SERIF}`; ctx.textAlign = 'right'; ctx.fillStyle = '#8B1E1E'; { const [X, Z] = P(0.99, 0.05); ctx.fillText('Römer bei uns', X, Z); }
  ctx.font = `italic ${0.095 * S}px ${SERIF}`; ctx.fillStyle = 'rgba(70,50,30,.6)'; { const [X, Z] = P(0.99, 0.985); ctx.fillText('stark vereinfacht, nicht maßstabsgetreu', X, Z); }
  // Nordpfeil
  { const [X, Z] = P(0.07, 0.86); ctx.fillStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(X, Z - 0.17 * S); ctx.lineTo(X + 0.06 * S, Z + 0.04 * S); ctx.lineTo(X, Z); ctx.lineTo(X - 0.06 * S, Z + 0.04 * S); ctx.closePath(); ctx.fill(); ctx.font = `bold ${0.12 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('N', X, Z + 0.15 * S); }
  ctx.restore();
  // Rahmen
  ctx.strokeStyle = 'rgba(138,90,42,.8)'; ctx.lineWidth = 0.03 * S; ctx.strokeRect(ix, iz, iw, ih);
}
