// Station 0: Willkommen + Erduhr (Pop-up-Zifferblatt, 4,54 Mrd. Jahre = 24 Stunden)
import * as THREE from 'three';
import { mood } from '../engine/scene.js';
import { blob, poly } from '../art/dsl.js';
import { textCard, printLabel, SERIF, RED, INK, roundRect, blotches, speckles } from '../engine/pagepaint.js';
import { PAGES_DE, CARDS_DE } from '../data/pages.de.js';
import { Popup } from '../engine/popup.js';
import { TAU, clamp, lerp, smooth } from '../engine/util.js';
import { cracks } from './common.js';

// ---- Erduhr: alle Zeiten werden aus den Jahreszahlen berechnet
export const EARTH_AGE = 4540; // Mio. Jahre
export const hourOf = (yearsAgoMa) => 24 * (1 - yearsAgoMa / EARTH_AGE);
export const yearsAgoOf = (hour) => EARTH_AGE * (1 - hour / 24);
export function fmtClock(h) {
  const tot = Math.round(h * 3600); const hh = Math.floor(tot / 3600) % 24, mm = Math.floor((tot % 3600) / 60), ss = tot % 60;
  const p = (n) => String(n).padStart(2, '0');
  return h >= 23.9 ? `${p(hh)}:${p(mm)}:${p(ss)} Uhr` : `${p(hh)}:${p(mm)} Uhr`;
}
export function fmtAgo(ma) {
  if (ma >= 1000) return `vor ${(ma / 1000).toFixed(2).replace('.', ',')} Mrd. Jahren`;
  if (ma >= 10) return `vor ${Math.round(ma)} Mio. Jahren`;
  if (ma >= 1) return `vor ${ma.toFixed(1).replace('.', ',')} Mio. Jahren`;
  return `vor ${Math.round(ma * 1000)} Tausend Jahren`;
}
export const EVENTS = [
  { id: 'erde', ma: 4540, label: 'Die Erde entsteht' },
  { id: 'leben', ma: 3800, label: 'Erstes Leben im Meer' },
  { id: 'tiere', ma: 539, label: 'Tiere mit Skeletten' },
  { id: 'dino', ma: 231, label: 'Die ersten Dinosaurier' },
  { id: 'saeuger', ma: 205, label: 'Die ersten Säugetiere' },
  { id: 'ende', ma: 66, label: 'Der Asteroid trifft die Erde' },
  { id: 'lucy', ma: 3.2, label: 'Lucy geht aufrecht' },
  { id: 'sapiens', ma: 0.315, label: 'Homo sapiens' },
];
export const ERAS = [
  { name: 'Hadaikum', from: 4540, to: 4000, col: '#6b5a52' },
  { name: 'Archaikum', from: 4000, to: 2500, col: '#8a6a4a' },
  { name: 'Proterozoikum', from: 2500, to: 539, col: '#7a8a5a' },
  { name: 'Paläozoikum', from: 539, to: 252, col: '#3f8f8a' },
  { name: 'Mesozoikum', from: 252, to: 66, col: '#c8693a' },
  { name: 'Känozoikum', from: 66, to: 0, col: '#e0b040' },
];
const R = 3.05, CY = 3.3;

function clockFace(c) {
  const { ctx, S, tf } = c;
  const [cx, cy] = tf(0, CY);
  const arc = (r0, r1, a0, a1, col) => {
    ctx.beginPath(); ctx.arc(cx, cy, r1 * S, -Math.PI / 2 + a0, -Math.PI / 2 + a1, false); ctx.arc(cx, cy, r0 * S, -Math.PI / 2 + a1, -Math.PI / 2 + a0, true); ctx.closePath(); ctx.fillStyle = col; ctx.fill();
  };
  // face
  ctx.fillStyle = '#f7edd3'; ctx.beginPath(); ctx.arc(cx, cy, R * S, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(cx, cy, 0.3 * S, cx, cy, R * S); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(120,80,30,.12)'); ctx.fillStyle = g; ctx.fill();
  // gold rim
  ctx.lineWidth = 0.16 * S; ctx.strokeStyle = '#b8862d'; ctx.beginPath(); ctx.arc(cx, cy, (R - 0.08) * S, 0, TAU); ctx.stroke();
  ctx.lineWidth = 0.04 * S; ctx.strokeStyle = '#fff0b3'; ctx.beginPath(); ctx.arc(cx, cy, (R - 0.02) * S, 0, TAU); ctx.stroke();
  // era ring (angle from years)
  for (const e of ERAS) {
    const a0 = (hourOf(e.from) / 24) * TAU, a1 = (hourOf(e.to) / 24) * TAU;
    arc(R - 0.78, R - 0.36, a0, a1, e.col);
  }
  ctx.strokeStyle = 'rgba(60,30,10,.5)'; ctx.lineWidth = 0.012 * S; ctx.beginPath(); ctx.arc(cx, cy, (R - 0.36) * S, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, (R - 0.78) * S, 0, TAU); ctx.stroke();
  // dinosaur arc (231..66) on an inner ring
  arc(R - 1.12, R - 0.84, (hourOf(231) / 24) * TAU, (hourOf(66) / 24) * TAU, '#a4161a');
  // ticks and numerals
  ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let h = 0; h < 24; h++) {
    const a = (h / 24) * TAU - Math.PI / 2, major = h % 3 === 0;
    ctx.lineWidth = (major ? 0.045 : 0.02) * S;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (R - 0.36) * S, cy + Math.sin(a) * (R - 0.36) * S); ctx.lineTo(cx + Math.cos(a) * (R - (major ? 0.22 : 0.28)) * S, cy + Math.sin(a) * (R - (major ? 0.22 : 0.28)) * S); ctx.stroke();
    if (major) { ctx.font = `bold ${0.26 * S}px ${SERIF}`; const lab = h === 0 ? '24' : String(h); ctx.fillText(lab, cx + Math.cos(a) * (R - 0.55) * S, cy + Math.sin(a) * (R - 0.55) * S); }
  }
  // event marks on the dinosaur ring edge
  const mark = (ma, col, r = R - 0.98, rad = 0.07) => { const a = (hourOf(ma) / 24) * TAU - Math.PI / 2; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * S, cy + Math.sin(a) * r * S, rad * S, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 0.02 * S; ctx.stroke(); };
  mark(205, '#ffd166'); mark(0.315, '#2b6cb0', R - 0.57, 0.06);
  // legend inside (below the centre so the hand does not cover it at 0 o'clock)
  const ly = [['#a4161a', 'Dinosaurier'], ['#ffd166', 'erste Säugetiere'], ['#2b6cb0', 'Homo sapiens']];
  ctx.textAlign = 'left'; ctx.font = `${0.2 * S}px ${SERIF}`;
  ly.forEach(([col, t], i) => { const x = cx - 0.78 * S, y = cy + (1.02 + i * 0.3) * S; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 0.085 * S, 0, TAU); ctx.fill(); ctx.fillStyle = INK; ctx.fillText(t, x + 0.19 * S, y + 0.01 * S); });
  ctx.textAlign = 'center'; ctx.font = `italic bold ${0.28 * S}px ${SERIF}`; ctx.fillStyle = RED; ctx.fillText('Die Erduhr', cx, cy + 0.28 * S);
  ctx.font = `${0.17 * S}px ${SERIF}`; ctx.fillStyle = '#6b4a2a'; ctx.fillText('4,54 Milliarden Jahre', cx, cy + 0.52 * S); ctx.fillText('in 24 Stunden', cx, cy + 0.72 * S);
}

function clockPart() {
  const disc = blob(0, CY, R + 0.08, R + 0.08, 0, 96);
  const foot = poly([[-1.15, 0], [1.15, 0], [0.7, CY - R + 0.6], [-0.7, CY - R + 0.6]]);
  return { layers: [{ shapes: [disc, foot], fill: '#f7edd3', deco: (c) => clockFace(c), stroke: null }] };
}
function handPart() {
  const hand = poly([[-0.1, -0.45], [0.1, -0.45], [0.07, R - 0.95], [0, R - 0.5], [-0.07, R - 0.95]]);
  const hub = blob(0, 0, 0.26, 0.26, 0, 24);
  return { layers: [{ shapes: [hand, hub], fill: { top: '#d62828', bottom: '#8d1111' }, stroke: 'rgba(40,0,0,.55)' }] };
}

function displayCanvas() {
  const c = document.createElement('canvas'); c.width = 768; c.height = 240; return c;
}

export default {
  id: 'erduhr',
  mood: mood({ key: '#ffe9c4', keyI: 2.3, sky: '#fff3de', gnd: '#8a6a4a', hemiI: 1.8 }),
  motes: { colors: [[1, 0.9, 0.6], [1, 1, 0.85]], size: 0.06, alpha: 0.4, dy: 0.05, dx: 0.08, tw: 1.1, density: 0.6 },
  atmo: 'erduhr',
  base() {
    const L = PAGES_DE[0];
    return {
      L: {
        paper: '#f2e6c8', ground: { back: '#ecd9aa', front: '#dcc08a' }, margin: 0.4, pageNo: 1,
        draw(ctx, m) {
          blotches(m, { x0: -12, x1: 0, z0: -4.4, z1: 4.4, n: 16, rmin: 1, rmax: 2.4, colors: ['rgba(255,244,214,.18)'], seed: 4 });
          textCard(m, { x: -10.6, z: -3.2, w: 9.3, h: 4.35, kicker: L.kicker, title: L.title, body: L.card, size: 0.37, titleSize: 0.56, tilt: -0.012 });
          // timeline legend: eight eras as coloured dots
          const names = ['Trias', 'Jura-Wald', 'Jura-Lagune', 'Kreide-Meer', 'Kreide-Land', 'Nest', 'Einschlag', 'Säugetiere'];
          const cols = PAGES_DE.slice(1).map((p) => p.color);
          printLabel(m, 'Deine Reise durch die Zeit', -5.95, 2.0, { size: 0.3, color: RED, italic: true });
          names.forEach((n, i) => {
            const x = -10.2 + i * 1.22, z = 3.0;
            ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(m.x(x), m.z(z), 0.2 * m.S, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff4d0'; ctx.lineWidth = 0.05 * m.S; ctx.stroke();
            ctx.strokeStyle = 'rgba(80,45,15,.35)'; ctx.lineWidth = 0.02 * m.S; if (i) { ctx.beginPath(); ctx.moveTo(m.x(x - 1.22 + 0.22), m.z(z)); ctx.lineTo(m.x(x - 0.22), m.z(z)); ctx.stroke(); }
            printLabel(m, String(i + 1), x, z + 0.01, { size: 0.2, color: '#fff', bold: true });
            const parts = n.split('-'); parts.forEach((pp, j) => printLabel(m, parts.length > 1 ? (j ? pp : pp + '-') : pp, x, z + 0.52 + j * 0.21, { size: 0.185, color: '#5a3d22' }));
          });
        },
      },
      R: {
        ground: { back: '#e2cd96', front: '#c9a96a' }, margin: 0.35, pageNo: 2,
        draw(ctx, m) {
          cracks(m, { x0: 0.6, x1: 11.4, z0: -0.5, z1: 4.0, n: 70, seed: 12, color: 'rgba(110,70,30,.28)' });
          // display field + slot labels
          ctx.fillStyle = 'rgba(60,30,10,.18)'; roundRect(ctx, m.x(3.5), m.z(1.55), 5.8 * m.S, 1.1 * m.S, 0.2 * m.S); ctx.fill();
          printLabel(m, '0 Uhr', 2.55, 4.0, { size: 0.19, color: '#6b4a2a' });
          printLabel(m, '24 Uhr', 9.4, 4.0, { size: 0.19, color: '#6b4a2a' });
        },
      },
    };
  },

  *build(ctx) {
    const app = ctx.app;
    // ---- the clock stands on the right page
    const clock = ctx.flat(clockPart(), { x: 6.4, z: -1.2, ws: 1, name: 'erduhr', delay: 0.05, thickness: 0.05, border: 0.07, ppu: Math.min(app.q.ppu, 180), maxTex: 1536, lean: -0.05 });
    yield;
    const handCut = ctx.flat(handPart(), { x: 0, z: 0, name: 'zeiger', thickness: 0.03, border: 0.03 });
    // re-parent the hand into the clock so it folds with it, pivoting at the clock centre
    handCut.group.removeFromParent(); ctx.R.popups.splice(ctx.R.popups.indexOf(handCut), 1);
    const handG = new THREE.Group(); handG.position.set(0, CY, 0.09);
    handG.add(...handCut.pivot.children); clock.add(handG);
    // tap on the clock face -> card
    const faceMesh = clock.cut.mesh; faceMesh.userData.tap = () => app.openCardById('erduhr');
    clock.pickMeshes = [faceMesh];

    // ---- live display on the page (time + event)
    const cv = displayCanvas(), g = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const disp = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 1.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    disp.rotation.x = -Math.PI / 2; disp.position.set(6.4, 0.012, 2.1); ctx.R.add(disp);
    let lastKey = '';
    const draw = (h) => {
      const ma = yearsAgoOf(h);
      let ev = null; for (const e of EVENTS) { const eh = hourOf(e.ma); if (Math.abs(eh - h) * 3600 < (e.ma < 1 ? 5 : 1200) * (e.ma < 1 ? 1 : 1)) ev = e; }
      for (const e of EVENTS) { if (e.ma > 60 && Math.abs(hourOf(e.ma) - h) < 0.12) ev = e; }
      const key = fmtClock(h) + (ev ? ev.id : ''); if (key === lastKey) return; lastKey = key;
      g.clearRect(0, 0, cv.width, cv.height);
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#7a1a1a'; g.font = `bold 84px ${SERIF}`; g.fillText(fmtClock(h), cv.width / 2, 72);
      g.fillStyle = '#4a3220'; g.font = `italic 40px ${SERIF}`; g.fillText(h < 0.01 ? 'Beginn der Erde' : h > 23.9999 ? 'heute' : fmtAgo(ma), cv.width / 2, 142);
      if (ev) { g.fillStyle = '#a4161a'; g.font = `bold 36px ${SERIF}`; g.fillText('★ ' + ev.label, cv.width / 2, 200); }
      tex.needsUpdate = true;
    };
    draw(0);
    // ---- control: turn the hand
    const ctl = ctx.control('R', { id: 'zeiger', label: 'Zeiger drehen', a: [3.4, 3.35], b: [9.4, 3.35], size: [2.9, 1.0], color: '#b8862d', value: 0, springBack: false, hold: true, ticks: 24 });
    let hourLast = 0, midnight = false;
    ctl.on((v) => {
      v = clamp(v, 0, 1); const h = v * 24; handG.rotation.z = -(v * TAU); draw(h);
      const hi = Math.floor(h);
      if (hi !== hourLast) { hourLast = hi; app.audio.sfx('tick', { rate: Math.abs(v - (ctl._pv ?? v)) }); }
      if (v > 0.995 && !midnight) { midnight = true; app.audio.sfx('gong'); app.fx.burst && 0; }
      if (v < 0.97) midnight = false;
      ctl._pv = v;
    });
    ctl.onTick = (v) => app.audio.sfx('tick', { fast: true });
    if (app.timewin) { app.timewin.attach(ctl); app.timewin.setHour(0); }
    ctx.onUpdate((dt, t) => { if (app.timewin && ctx.spread.active) app.timewin.setHour(ctl.sp.x * 24); });
    // hint: let the hand sweep once when the page appears
    this._hint = true;
    ctx.spread.hintSweep = () => { ctl.touched = true; ctl.setValue(0.07, { silent: false }); setTimeout(() => { if (!ctl.dragging && ctl.v < 0.1) ctl.setValue(0); }, 900); };
  },
  onDeactivate(ctx) { if (ctx.app.timewin) ctx.app.timewin.hide(); },
  onActivate(ctx) { if (ctx.app.timewin) ctx.app.timewin.show(); setTimeout(() => ctx.spread.hintSweep && ctx.spread.active && ctx.spread.hintSweep(), 1700); },
};
