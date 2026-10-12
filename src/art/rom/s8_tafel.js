// Station 8: die acht Steintafeln der Schlussseite „Was bleibt“ (Wörter, die aus dem Lateinischen kommen).
// Spec 's8_tafel' mit variant {k:'fenster'|'strasse'|'mauer'|'ziegel'|'kaiser'|'wein'|'kaese'|'muenze'}: stehende Steinplatte mit Rundbogen,
// Bild-Medaillon, deutschem Wort und einer Nische unten (dort klappt die Lasche mit dem lateinischen Wort auf, siehe flapCanvas).
import { poly, blob } from '../dsl.js';
import { line, dot } from '../paint.js';
import { mulberry32 } from '../../engine/util.js';
import { mixHex } from './_people.js';

const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
export const TAFELN = [
  { k: 'fenster', de: 'Fenster', la: 'fenestra', say: 'fe-NES-tra', card: 't_fenster', col: '#7fb6d4' },
  { k: 'strasse', de: 'Straße', la: 'via strata', say: 'WI-a STRA-ta', card: 't_strasse', col: '#a5a39b' },
  { k: 'mauer', de: 'Mauer', la: 'murus', say: 'MU-rus', card: 't_mauer', col: '#d6b36a' },
  { k: 'ziegel', de: 'Ziegel', la: 'tegula', say: 'TE-gu-la', card: 't_ziegel', col: '#d98a62' },
  { k: 'kaiser', de: 'Kaiser', la: 'Caesar', say: 'KAI-sar', card: 't_kaiser', col: '#9a6ab0' },
  { k: 'wein', de: 'Wein', la: 'vinum', say: 'WI-num', card: 't_wein', col: '#b3566e' },
  { k: 'kaese', de: 'Käse', la: 'caseus', say: 'KA-se-us', card: 't_kaese', col: '#ecc455' },
  { k: 'muenze', de: 'Münze', la: 'moneta', say: 'mo-NE-ta', card: 't_muenze', col: '#e7c260' },
];
export const TAFEL_W = 0.9, TAFEL_H = 1.42;   // Modellmaße (m) der Platte
export const NISCHE = { y0: 0.14, y1: 0.43 };   // Nischenbereich unten (von der Lasche verdeckt)

// ---------------------------------------------------------------- kleine Malhelfer (Modellkoordinaten)
const path = (c, pts, close = true) => { const { ctx, tf } = c; ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); if (close) ctx.closePath(); };
const fillP = (c, pts, fill, stroke, lw = 0.008) => { const { ctx, S } = c; path(c, pts); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, lw * S); ctx.lineJoin = 'round'; ctx.stroke(); } };
const circ = (c, x, y, r, fill, stroke, lw = 0.008) => { const { ctx, tf, S } = c; const [X, Y] = tf(x, y); ctx.beginPath(); ctx.arc(X, Y, Math.max(0.5, r * S), 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, lw * S); ctx.stroke(); } };
const ell = (c, x, y, rx, ry, rot, fill, stroke, lw = 0.008) => { const { ctx, tf, S } = c; const [X, Y] = tf(x, y); ctx.beginPath(); ctx.ellipse(X, Y, Math.max(0.5, rx * S), Math.max(0.5, ry * S), -rot, 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, lw * S); ctx.stroke(); } };
const lin = (c, x0, y0, x1, y1, stops) => { const { ctx, tf } = c; const a = tf(x0, y0), b = tf(x1, y1); const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); stops.forEach(([t, col]) => g.addColorStop(t, col)); return g; };
const rad = (c, x, y, r0, r1, stops) => { const { ctx, tf, S } = c; const [X, Y] = tf(x, y); const g = ctx.createRadialGradient(X, Y, r0 * S, X, Y, r1 * S); stops.forEach(([t, col]) => g.addColorStop(t, col)); return g; };
// gemeißelter Text: horizontal gestaucht, damit er in die Breite passt
function carve(c, text, cx, cy, h, { color = '#4a4338', fit = 0.8, italic = false, weight = 'bold', hi = 'rgba(255,250,232,.7)', rot = 0 } = {}) {
  const { ctx, tf, S } = c; const [X, Y] = tf(cx, cy);
  ctx.save(); ctx.translate(X, Y); if (rot) ctx.rotate(rot); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${h * S}px ${SERIF}`;
  const w = ctx.measureText(text).width, sx = Math.min(1.25, (fit * S) / Math.max(1, w));
  ctx.scale(sx, 1);
  ctx.fillStyle = hi; ctx.fillText(text, 0.011 * S / sx, 0.012 * S);
  ctx.fillStyle = color; ctx.fillText(text, 0, 0);
  ctx.restore();
}
export { carve };

// ---------------------------------------------------------------- Symbole (Mitte cx,cy; Radius r ≈ 0.22)
const ICONS = {
  fenster(c, cx, cy) {
    const arch = (hw, y0, y1) => { const p = [[cx - hw, y0], [cx + hw, y0], [cx + hw, y1]]; for (let k = 1; k < 12; k++) { const a = (k / 12) * Math.PI; p.push([cx + hw * Math.cos(a), y1 + hw * Math.sin(a)]); } p.push([cx - hw, y1]); return p; };
    fillP(c, [[cx - 0.2, cy - 0.215], [cx + 0.2, cy - 0.215], [cx + 0.2, cy - 0.17], [cx - 0.2, cy - 0.17]], '#d9d3c2', 'rgba(70,60,45,.7)');   // Fensterbank
    fillP(c, arch(0.155, cy - 0.17, cy + 0.07), '#8a5a34', 'rgba(50,28,10,.8)');                                                           // Rahmen
    const gl = lin(c, cx - 0.1, cy + 0.2, cx + 0.1, cy - 0.12, [[0, '#e8f5fb'], [1, '#8fb9d3']]);
    fillP(c, arch(0.12, cy - 0.145, cy + 0.07), gl, 'rgba(40,25,10,.6)', 0.006);                                                           // Scheibe
    line(c, [[cx, cy - 0.145], [cx, cy + 0.19]], '#8a5a34', 0.022); line(c, [[cx - 0.12, cy - 0.02], [cx + 0.12, cy - 0.02]], '#8a5a34', 0.022);
    line(c, [[cx - 0.08, cy + 0.12], [cx - 0.03, cy + 0.16]], 'rgba(255,255,255,.9)', 0.014); line(c, [[cx + 0.03, cy + 0.0], [cx + 0.08, cy + 0.04]], 'rgba(255,255,255,.8)', 0.012);
  },
  strasse(c, cx, cy) {
    fillP(c, [[cx - 0.26, cy - 0.26], [cx + 0.26, cy - 0.26], [cx + 0.26, cy + 0.3], [cx - 0.26, cy + 0.3]], lin(c, 0, cy + 0.3, 0, cy - 0.2, [[0, '#cfe3f0'], [0.55, '#e9f0da'], [1, '#7da25a']]));   // Himmel + Wiese
    fillP(c, [[cx - 0.26, cy + 0.08], [cx + 0.26, cy + 0.08], [cx + 0.26, cy + 0.0], [cx - 0.26, cy + 0.0]], '#9cb98a');
    fillP(c, [[cx - 0.22, cy - 0.2], [cx + 0.22, cy - 0.2], [cx + 0.02, cy + 0.075], [cx - 0.02, cy + 0.075]], '#b9ad96', 'rgba(70,55,40,.7)', 0.007);        // Weg
    for (let i = 0; i < 6; i++) { const t = (i + 1) / 7, y = cy + 0.075 - Math.pow(t, 0.8) * 0.275, w = 0.02 + 0.2 * Math.pow(t, 0.9); line(c, [[cx - w, y], [cx + w, y]], 'rgba(80,65,45,.55)', 0.006 + t * 0.006); }
    line(c, [[cx, cy - 0.2], [cx, cy + 0.075]], 'rgba(255,245,200,.7)', 0.01);
    fillP(c, [[cx + 0.15, cy - 0.15], [cx + 0.2, cy - 0.15], [cx + 0.2, cy - 0.04], [cx + 0.15, cy - 0.04]], '#d2cbb8', 'rgba(70,55,40,.7)', 0.006);
  },
  mauer(c, cx, cy) {
    fillP(c, [[cx - 0.21, cy - 0.17], [cx + 0.21, cy - 0.17], [cx + 0.21, cy + 0.06], [cx - 0.21, cy + 0.06]], lin(c, 0, cy + 0.06, 0, cy - 0.17, [[0, '#e1c991'], [1, '#c3a46b']]), 'rgba(70,50,25,.75)');
    for (let i = 0; i < 3; i++) fillP(c, [[cx - 0.21 + i * 0.15, cy + 0.06], [cx - 0.21 + i * 0.15 + 0.1, cy + 0.06], [cx - 0.21 + i * 0.15 + 0.1, cy + 0.14], [cx - 0.21 + i * 0.15, cy + 0.14]], '#d4b67d', 'rgba(70,50,25,.75)');
    for (let r = 0; r < 4; r++) { const y = cy - 0.17 + r * 0.06; line(c, [[cx - 0.21, y], [cx + 0.21, y]], 'rgba(80,55,25,.55)', 0.007); for (let x = cx - 0.21 + (r % 2) * 0.07; x < cx + 0.21; x += 0.14) line(c, [[x, y], [x, y + 0.06]], 'rgba(80,55,25,.5)', 0.006); }
    fillP(c, [[cx - 0.015, cy - 0.12], [cx + 0.015, cy - 0.12], [cx + 0.015, cy - 0.04], [cx - 0.015, cy - 0.04]], 'rgba(40,25,10,.8)');
  },
  ziegel(c, cx, cy) {
    fillP(c, [[cx - 0.15, cy - 0.19], [cx + 0.15, cy - 0.19], [cx + 0.15, cy - 0.02], [cx - 0.15, cy - 0.02]], '#f1e6c8', 'rgba(80,55,30,.7)');
    fillP(c, [[cx - 0.05, cy - 0.19], [cx + 0.04, cy - 0.19], [cx + 0.04, cy - 0.09], [cx - 0.05, cy - 0.09]], '#8a5a34', 'rgba(50,28,10,.8)');
    fillP(c, [[cx + 0.075, cy - 0.15], [cx + 0.125, cy - 0.15], [cx + 0.125, cy - 0.09], [cx + 0.075, cy - 0.09]], '#9fc6dc', 'rgba(50,28,10,.8)', 0.006);
    fillP(c, [[cx + 0.07, cy + 0.04], [cx + 0.115, cy + 0.04], [cx + 0.115, cy + 0.2], [cx + 0.07, cy + 0.2]], '#b0603f', 'rgba(60,25,10,.8)', 0.006);
    fillP(c, [[cx - 0.21, cy - 0.02], [cx + 0.21, cy - 0.02], [cx, cy + 0.2]], lin(c, 0, cy + 0.2, 0, cy - 0.02, [[0, '#cf6a43'], [1, '#a2472a']]), 'rgba(60,25,10,.85)');
    for (let r = 0; r < 4; r++) { const y = cy - 0.02 + r * 0.045, hw = 0.21 * (1 - (y - (cy - 0.02)) / 0.22); if (hw > 0.02) { line(c, [[cx - hw, y], [cx + hw, y]], 'rgba(70,25,10,.5)', 0.006); for (let x = cx - hw + (r % 2) * 0.035; x < cx + hw; x += 0.07) line(c, [[x, y], [x, y + 0.045]], 'rgba(70,25,10,.4)', 0.005); } }
  },
  kaiser(c, cx, cy) {
    for (const side of [-1, 1]) for (let i = 0; i < 8; i++) {
      const t = i / 7, ang = -Math.PI / 2 + side * (0.25 + t * 2.55);
      const px = cx + Math.cos(ang) * 0.175, py = cy + Math.sin(ang) * 0.175;
      ell(c, px, py, 0.05, 0.021, ang + Math.PI / 2 + side * 0.4, lin(c, px - 0.04, py, px + 0.04, py, [[0, '#9cc25a'], [1, '#4c7a2a']]), 'rgba(30,60,10,.7)', 0.005);
    }
    circ(c, cx, cy, 0.125, lin(c, cx - 0.1, cy + 0.12, cx + 0.1, cy - 0.12, [[0, '#9a5aa8'], [1, '#5f2a6e']]), '#d7b24a', 0.012);
    const { ctx, tf, S } = c; const [X, Y] = tf(cx, cy - 0.005);
    ctx.save(); ctx.font = `bold ${0.19 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#f2d36b'; ctx.strokeStyle = 'rgba(60,20,50,.7)'; ctx.lineWidth = Math.max(1, 0.008 * S); ctx.strokeText('C', X, Y); ctx.fillText('C', X, Y); ctx.restore();
    fillP(c, [[cx - 0.03, cy - 0.2], [cx + 0.03, cy - 0.2], [cx + 0.07, cy - 0.27], [cx - 0.07, cy - 0.27]], '#7b2d5b', 'rgba(40,10,30,.7)', 0.006);
  },
  wein(c, cx, cy) {
    const ax = cx - 0.075;
    fillP(c, [[ax - 0.02, cy - 0.2], [ax + 0.06, cy - 0.2], [ax + 0.1, cy - 0.12], [ax + 0.1, cy], [ax + 0.075, cy + 0.08], [ax + 0.085, cy + 0.15], [ax - 0.045, cy + 0.15], [ax - 0.035, cy + 0.08], [ax - 0.07, cy], [ax - 0.06, cy - 0.12]], lin(c, ax - 0.07, 0, ax + 0.1, 0, [[0, '#e08a52'], [1, '#a64f26']]), 'rgba(60,25,10,.85)', 0.008);
    line(c, [[ax - 0.06, cy - 0.04], [ax + 0.095, cy - 0.04]], 'rgba(60,25,10,.45)', 0.008); line(c, [[ax - 0.05, cy - 0.1], [ax + 0.09, cy - 0.1]], 'rgba(60,25,10,.4)', 0.007);
    for (const sd of [-1, 1]) line(c, [[ax + 0.02 + sd * 0.052, cy + 0.14], [ax + 0.02 + sd * 0.11, cy + 0.1], [ax + 0.02 + sd * 0.085, cy + 0.03]], '#a64f26', 0.022);
    const gx = cx + 0.1, gy = cy - 0.02;
    for (const [dx, dy] of [[-0.05, 0.09], [0, 0.09], [0.05, 0.09], [-0.025, 0.04], [0.025, 0.04], [0, -0.01]]) circ(c, gx + dx, gy + dy, 0.03, rad(c, gx + dx - 0.01, gy + dy + 0.01, 0.003, 0.036, [[0, '#d7a0c8'], [1, '#5f2a78']]), 'rgba(40,10,50,.7)', 0.005);
    line(c, [[gx, gy + 0.12], [gx + 0.01, gy + 0.16]], '#5a3a1a', 0.012);
    ell(c, gx + 0.04, gy + 0.18, 0.06, 0.03, 0.5, '#5f9a3a', 'rgba(30,60,10,.75)', 0.006);
  },
  kaese(c, cx, cy) {
    circ(c, cx - 0.02, cy - 0.02, 0.19, rad(c, cx - 0.06, cy + 0.06, 0.02, 0.22, [[0, '#f8dc78'], [1, '#e1a636']]), '#a8701c', 0.01);
    fillP(c, [[cx - 0.02, cy - 0.02], [cx + 0.17, cy + 0.07], [cx + 0.17, cy - 0.14]], 'rgba(60,40,10,.12)');
    fillP(c, [[cx - 0.02, cy - 0.02], [cx + 0.165, cy + 0.075], [cx + 0.165, cy - 0.115]], lin(c, cx, 0, cx + 0.17, 0, [[0, '#fbeaa0'], [1, '#f2c75a']]), '#a8701c', 0.008);
    for (const [x, y, r] of [[-0.1, 0.07, 0.034], [-0.07, -0.08, 0.028], [-0.14, -0.04, 0.02], [0.03, 0.12, 0.022], [0.0, -0.13, 0.02]]) circ(c, cx + x, cy + y, r, '#d69a2a', 'rgba(110,70,10,.6)', 0.004);
    for (const [x, y, r] of [[0.1, 0.0, 0.02], [0.07, -0.06, 0.014]]) circ(c, cx + x, cy + y, r, '#e3b04a', 'rgba(110,70,10,.5)', 0.004);
  },
  muenze(c, cx, cy) {
    circ(c, cx + 0.07, cy - 0.04, 0.16, lin(c, cx - 0.1, cy + 0.1, cx + 0.2, cy - 0.2, [[0, '#f6dc86'], [1, '#b98626']]), '#8a5f1c', 0.01);
    circ(c, cx - 0.04, cy + 0.03, 0.19, rad(c, cx - 0.1, cy + 0.12, 0.02, 0.28, [[0, '#fff0b3'], [0.5, '#e7c262'], [1, '#a87420']]), '#7a5416', 0.012);
    circ(c, cx - 0.04, cy + 0.03, 0.15, null, 'rgba(110,70,10,.7)', 0.009);
    const { ctx, tf, S } = c; const [X, Y] = tf(cx - 0.04, cy + 0.025);
    ctx.save(); ctx.font = `bold ${0.2 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,245,200,.7)'; ctx.fillText('M', X + 0.008 * S, Y + 0.01 * S); ctx.fillStyle = '#8a5f1c'; ctx.fillText('M', X, Y); ctx.restore();
    line(c, [[cx - 0.14, cy + 0.12], [cx - 0.08, cy + 0.17]], 'rgba(255,255,255,.8)', 0.012);
  },
};

// ---------------------------------------------------------------- die Tafel selbst
function slabShape() {
  // Stele mit Giebel (wie ein kleiner Tempel): Sockel, Körper, Gesims, Dreiecksgiebel
  const hw = TAFEL_W / 2;
  return [[-hw - 0.05, 0], [hw + 0.05, 0], [hw + 0.05, 0.1], [hw, 0.1], [hw, 1.2], [hw + 0.04, 1.2], [hw + 0.04, 1.26], [0.0, 1.43], [-hw - 0.04, 1.26], [-hw - 0.04, 1.2], [-hw, 1.2], [-hw, 0.1], [-hw - 0.05, 0.1]];
}
export function tafel(opts = {}) {
  const k = opts.k || 'fenster';
  const T = TAFELN.find((t) => t.k === k) || TAFELN[0];
  const ICX = 0, ICY = 0.945;
  const stone = ['#d3cdbb', '#a9a28e'];
  const body = {
    z: 1,
    layers: [{
      shapes: [slabShape()], fill: { top: stone[0], bottom: stone[1] }, stroke: 'rgba(60,52,40,.7)',
      deco(c, bb) {
        const { ctx, tf, S } = c; const r = mulberry32(k.length * 977 + 13);
        // Steinmaserung: Flecken, Körnchen, Haarrisse, ein wenig Moos
        for (let i = 0; i < 90; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.006 + r() * 0.016, r() > 0.5 ? 'rgba(90,80,62,.2)' : 'rgba(255,252,240,.3)');
        for (let i = 0; i < 5; i++) { let x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h; const pts = [[x, y]]; for (let s = 0; s < 4; s++) { x += (r() - 0.5) * 0.12; y -= r() * 0.1; pts.push([x, y]); } line(c, pts, 'rgba(70,60,45,.28)', 0.005); }
        for (let i = 0; i < 3; i++) { const x = bb.x0 + 0.05 + r() * (bb.w - 0.1), y = 0.12 + r() * 0.05; for (let j = 0; j < 9; j++) dot(c, x + (r() - 0.5) * 0.14, y + r() * 0.03, 0.008 + r() * 0.012, 'rgba(98,130,70,.4)'); }
        // Rahmen (gemeißelte Doppellinie) und Sockelband
        const hw = TAFEL_W / 2 - 0.045;
        const fr = [[-hw, 0.14], [hw, 0.14], [hw, 1.16], [-hw, 1.16]];
        path(c, fr); ctx.strokeStyle = 'rgba(60,50,35,.55)'; ctx.lineWidth = Math.max(1, 0.012 * S); ctx.stroke();
        path(c, fr.map(([x, y]) => [x * 0.94, y + (y > 0.5 ? -0.014 : 0.014)])); ctx.strokeStyle = 'rgba(255,250,232,.5)'; ctx.lineWidth = Math.max(1, 0.008 * S); ctx.stroke();
        line(c, [[-hw - 0.04, 0.1], [hw + 0.04, 0.1]], 'rgba(60,50,35,.5)', 0.01);
        line(c, [[-hw - 0.05, 1.2], [hw + 0.05, 1.2]], 'rgba(60,50,35,.5)', 0.01);
        fillP(c, [[-0.3, 1.285], [0.3, 1.285], [0.0, 1.38]].map(([x, y]) => [x * 0.8, y * 0.995 - 0.01]), 'rgba(120,112,92,.18)', 'rgba(60,50,35,.35)', 0.006);
        // Medaillon mit Bild
        const col = T.col;
        circ(c, ICX, ICY, 0.262, null, 'rgba(60,50,35,.6)', 0.012);
        circ(c, ICX, ICY, 0.25, rad(c, ICX - 0.08, ICY + 0.09, 0.02, 0.34, [[0, mixHex(col, '#ffffff', 0.6)], [1, mixHex(col, '#2a2018', 0.12)]]), 'rgba(60,50,35,.75)', 0.01);
        ctx.save(); circ(c, ICX, ICY, 0.243, null); ctx.clip();
        ICONS[k](c, ICX, ICY);
        ctx.restore();
        // deutsches Wort, groß und gemeißelt
        const wy = 0.575;
        fillBand(c, wy, 0.25);
        carve(c, T.de.toUpperCase(), 0, wy, 0.2, { color: '#3d362a', fit: 0.74 });
        // Nische unten (darunter klappt die Lasche auf)
        const n0 = NISCHE.y0, n1 = NISCHE.y1;
        fillP(c, [[-hw + 0.04, n0], [hw - 0.04, n0], [hw - 0.04, n1], [-hw + 0.04, n1]], lin(c, 0, n1, 0, n0, [[0, '#8f897a'], [1, '#b6b09f']]), 'rgba(50,42,30,.7)', 0.008);
        carve(c, 'kommt vom Lateinischen:', 0, (n0 + n1) / 2 + 0.05, 0.07, { color: '#4c4536', fit: 0.66, italic: true, weight: 'normal', hi: 'rgba(255,250,232,.4)' });
        line(c, [[-0.18, (n0 + n1) / 2 - 0.04], [0.18, (n0 + n1) / 2 - 0.04]], 'rgba(50,42,30,.45)', 0.008);
        carve(c, '▼', 0, (n0 + n1) / 2 - 0.1, 0.07, { color: '#4c4536', fit: 0.1, weight: 'normal', hi: 'rgba(0,0,0,0)' });
      },
    }],
  };
  return {
    id: 's8_tafel', parts: { body },
    anchors: { top: [0, TAFEL_H], base: [0, 0], mid: [0, 0.8] },
    meta: { name: T.de, lengthM: TAFEL_W, heightM: TAFEL_H },
  };
}
function fillBand(c, y, h) {
  const { ctx } = c;
  fillP(c, [[-0.39, y - h / 2], [0.39, y - h / 2], [0.39, y + h / 2], [-0.39, y + h / 2]], 'rgba(120,112,92,.16)', 'rgba(60,50,35,.28)', 0.005);
}

// ---------------------------------------------------------------- Lasche (zwei Seiten): außen „Woher?“, innen das lateinische Wort
function stoneBase(g, w, h, seed) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#d0cab8'); gr.addColorStop(1, '#a29b86');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = mulberry32(seed);
  for (let i = 0; i < 160; i++) { g.fillStyle = r() > 0.5 ? 'rgba(90,80,62,.18)' : 'rgba(255,252,240,.28)'; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 3.5, 0, 6.3); g.fill(); }
  g.strokeStyle = 'rgba(60,50,35,.6)'; g.lineWidth = Math.max(2, h * 0.035); g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
  g.strokeStyle = 'rgba(255,250,232,.45)'; g.lineWidth = Math.max(1, h * 0.018); g.strokeRect(h * 0.07, h * 0.07, w - h * 0.14, h * 0.86 - h * 0.0);
}
export function flapCanvas(k, inner) {
  const T = TAFELN.find((t) => t.k === k) || TAFELN[0];
  const w = 512, h = 312;                               // Seitenverhältnis wie die Lasche (0,9 × 0,52)
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  stoneBase(g, w, h, k.length * 31 + (inner ? 7 : 3));
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const fit = (txt, size, style, maxW) => { let s = size; g.font = `${style} ${s}px ${SERIF}`; while (g.measureText(txt).width > maxW && s > 12) { s -= 2; g.font = `${style} ${s}px ${SERIF}`; } return s; };
  if (inner) {
    // innen (liegt aufgeklappt vor der Platte, wird von vorn gelesen): lateinisches Wort groß, darunter die Aussprache
    const s1 = fit(T.la, h * 0.32, 'italic bold', w * 0.8);
    g.fillStyle = 'rgba(255,250,232,.7)'; g.fillText(T.la, w / 2 + 2, h * 0.34 + 2);
    g.fillStyle = '#3d362a'; g.fillText(T.la, w / 2, h * 0.34);
    g.fillStyle = '#6a5a3a'; fit('sprich: ' + T.say, h * 0.17, 'italic', w * 0.86); g.fillText('sprich: ' + T.say, w / 2, h * 0.65);
    g.fillStyle = '#7a1f1f'; fit('aus dem Lateinischen', h * 0.13, 'italic bold', w * 0.8); g.fillText('aus dem Lateinischen', w / 2, h * 0.85);
  } else {
    fit('Woher?', h * 0.3, 'bold', w * 0.7);
    g.fillStyle = 'rgba(255,250,232,.7)'; g.fillText('Woher?', w / 2 + 2, h * 0.38 + 2);
    g.fillStyle = '#4a4338'; g.fillText('Woher?', w / 2, h * 0.38);
    g.fillStyle = '#7a1f1f'; fit('tippe und klapp mich auf', h * 0.14, 'italic bold', w * 0.86); g.fillText('tippe und klapp mich auf', w / 2, h * 0.72);
  }
  return cv;
}
