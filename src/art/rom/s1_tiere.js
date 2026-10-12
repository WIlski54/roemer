// Station 1: Schaf (weidet, trägt eine kleine Glocke) und weißer Ochse (zieht den Pflug). Seitenansicht nach +x, Meter, Boden y = 0.
//   schaf: body (Wolle + Beine), neck (Kopf, Glocke; ranges.neck [0 → −0.9] = Kopf senken zum Grasen)
//   ochse: body, neck (Kopf mit Joch), tail, legA (nah vorn), legB (fern vorn), legC (nah hinten), legD (fern hinten); meta.swing je Bein
import { blob, limb, poly } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';
import { mix, strokes, fillPoly, curve, rngOf, TAU } from './s1_kit.js';

// ------------------------------------------------------------------------------------------ Schaf
export function schaf(o = {}) {
  const seed = o.seed ?? 1, rng = rngOf(seed, 11);
  const darkFace = (seed % 2) === 1;
  const wool = o.wool || (seed % 3 === 0 ? '#efe4cc' : '#f6efdc');
  const faceTop = darkFace ? '#6a5446' : '#d9bf98', faceBot = darkFace ? '#3f302a' : '#b8966a';
  const bumps = [];
  const N = 12;
  for (let i = 0; i < N; i++) { const a = (i / N) * TAU; bumps.push(blob(Math.cos(a) * 0.3, 0.46 + Math.sin(a) * 0.15, 0.115 + rng() * 0.03, 0.105 + rng() * 0.03, 0, 18)); }
  bumps.push(blob(0.0, 0.46, 0.34, 0.18, 0, 26), blob(0.2, 0.5, 0.15, 0.15, 0, 20), blob(-0.18, 0.5, 0.15, 0.14, 0, 20));
  const legCol = { top: '#6a584c', bottom: '#3a2d27' };
  const body = {
    z: 2,
    layers: [
      { shapes: [limb([[0.24, 0.32, 0.06], [0.245, 0.15, 0.05], [0.25, 0.03, 0.05]]), limb([[-0.16, 0.32, 0.06], [-0.165, 0.15, 0.05], [-0.16, 0.03, 0.05]])], fill: { top: mix(legCol.top, '#000000', 0.25), bottom: legCol.bottom }, stroke: 'rgba(30,18,12,.55)' },
      { shapes: [limb([[0.31, 0.32, 0.065], [0.315, 0.15, 0.052], [0.32, 0.03, 0.052]]), limb([[-0.24, 0.32, 0.065], [-0.245, 0.15, 0.052], [-0.24, 0.03, 0.052]])], fill: legCol, stroke: 'rgba(30,18,12,.55)',
        deco(c) { for (const x of [0.32, -0.24]) fillPoly(c, [[x - 0.035, 0.0], [x + 0.045, 0.0], [x + 0.04, 0.035], [x - 0.03, 0.035]], '#1f1511'); } },
      { shapes: bumps, fill: { top: '#fffaf0', bottom: wool }, stroke: 'rgba(120,100,70,.55)',
        deco(c, bb) {
          volume(c, bb, { dark: 'rgba(120,100,70,.28)', light: 'rgba(255,255,255,.3)' });
          // Wolllocken: kleine Bögen
          const { ctx, tf, S } = c; ctx.save(); ctx.strokeStyle = 'rgba(140,115,80,.4)'; ctx.lineWidth = Math.max(1, S * 0.009); ctx.lineCap = 'round';
          for (let i = 0; i < 22; i++) { const x = -0.38 + rng() * 0.76, y = 0.3 + rng() * 0.3; const [X, Y] = tf(x, y); ctx.beginPath(); ctx.arc(X, Y, S * (0.03 + rng() * 0.02), 0.3, 3.4); ctx.stroke(); }
          ctx.restore();
        } },
      // kleiner Schwanz
      { shapes: [blob(-0.38, 0.52, 0.06, 0.05)], fill: wool, stroke: 'rgba(120,100,70,.55)' },
    ],
  };
  const neck = {
    z: 3, pivot: [0.3, 0.52],
    layers: [
      { shapes: [limb([[0.28, 0.5, 0.2], [0.38, 0.54, 0.15], [0.46, 0.55, 0.12]]), blob(0.56, 0.54, 0.105, 0.085, -0.25), blob(0.64, 0.5, 0.06, 0.05, -0.3)],
        fill: { top: faceTop, bottom: faceBot }, stroke: 'rgba(40,25,15,.6)',
        deco(c) {
          volume(c, { x0: 0.4, x1: 0.7, y0: 0.4, y1: 0.65, w: 0.3, h: 0.25 }, { dark: 'rgba(30,15,10,.2)', light: 'rgba(255,240,210,.2)' });
          eye(c, 0.585, 0.565, 0.02, { color: '#2a1a10', white: '#fff6dc', look: 0.3 });
          curve(c, [[0.66, 0.485], [0.62, 0.478], [0.6, 0.49]], 'rgba(30,15,10,.7)', 0.008, 1);
          dot(c, 0.682, 0.51, 0.011, '#2a1a10');
        } },
      // Wollschopf auf dem Kopf und Ohr
      { shapes: [blob(0.5, 0.64, 0.07, 0.045, 0.3), blob(0.46, 0.63, 0.05, 0.04)], fill: wool, stroke: 'rgba(120,100,70,.55)' },
      { shapes: [blob(0.5, 0.575, 0.07, 0.027, 0.55)], fill: { top: faceTop, bottom: faceBot }, stroke: 'rgba(40,25,15,.6)' },
      // Halsband mit Glöckchen
      { shapes: [limb([[0.33, 0.6, 0.03], [0.37, 0.5, 0.03], [0.35, 0.43, 0.03]])], fill: '#b3352a', stroke: 'rgba(60,15,10,.6)' },
      { shapes: [blob(0.36, 0.42, 0.03, 0.034)], fill: { top: '#ffe08a', bottom: '#c8962a' }, stroke: 'rgba(100,60,10,.7)', deco(c) { dot(c, 0.36, 0.418, 0.006, '#7a4a10'); } },
    ],
  };
  return { id: 'schaf', parts: { body, neck }, anchors: { head: [0.58, 0.55], bell: [0.36, 0.42], foot: [0.2, 0] },
    meta: { name: 'Schaf', lengthM: 1.2, heightM: 0.75, pivots: { neck: [0.3, 0.52] }, ranges: { neck: [0, -0.95] }, swing: {} } };
}

// ------------------------------------------------------------------------------------------ Ochse (weiß, mit Joch)
export function ochse(o = {}) {
  const rng = rngOf(o.seed ?? 2, 5);
  const HIDE = { top: '#faf4e6', bottom: '#d9ccb0' }, HIDED = { top: '#e4d9c0', bottom: '#b9aa8c' };
  const hoof = '#4a3a30';
  const legF = (x, far) => ({ shapes: [limb([[x, 0.86, 0.27], [x, 0.42, 0.18], [x + 0.01, 0.1, 0.145]]), poly([[x - 0.08, 0.0], [x + 0.12, 0.0], [x + 0.11, 0.12], [x - 0.08, 0.12]], 1)], fill: far ? HIDED : HIDE, stroke: 'rgba(80,60,40,.5)',
    deco(c) { fillPoly(c, [[x - 0.09, 0.0], [x + 0.13, 0.0], [x + 0.12, 0.075], [x - 0.09, 0.075]], hoof); } });
  const legH = (x, far) => ({ shapes: [blob(x - 0.02, 0.84, 0.22, 0.3, -0.2), limb([[x, 0.62, 0.2], [x - 0.04, 0.32, 0.13], [x, 0.09, 0.125]]), poly([[x - 0.08, 0.0], [x + 0.11, 0.0], [x + 0.11, 0.12], [x - 0.07, 0.12]], 1)], fill: far ? HIDED : HIDE, stroke: 'rgba(80,60,40,.5)',
    deco(c) { fillPoly(c, [[x - 0.09, 0.0], [x + 0.12, 0.0], [x + 0.12, 0.075], [x - 0.08, 0.075]], hoof); } });
  const parts = {};
  parts.legD = { z: 0, pivot: [-0.5, 0.92], layers: [legH(-0.4, true)] };
  parts.legB = { z: 0.5, pivot: [0.62, 0.95], layers: [legF(0.7, true)] };
  parts.tail = { z: 1, pivot: [-0.86, 1.14], layers: [{ shapes: [limb([[-0.82, 1.12, 0.08], [-0.98, 0.98, 0.07], [-1.0, 0.62, 0.06]], { per: 8 }), blob(-1.0, 0.5, 0.07, 0.14)], fill: HIDED, stroke: 'rgba(80,60,40,.5)' }] };
  parts.body = { z: 2, layers: [{
    shapes: [blob(0.0, 1.0, 0.8, 0.39, 0.0, 44), blob(0.45, 1.16, 0.3, 0.28), blob(-0.6, 1.02, 0.28, 0.34), blob(0.72, 0.74, 0.2, 0.22)],
    fill: { top: HIDE.top, bottom: HIDE.bottom }, stroke: 'rgba(80,60,40,.55)',
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(110,85,50,.3)', light: 'rgba(255,255,250,.35)' });
      const L = []; for (let i = 0; i < 70; i++) L.push([-0.8 + rng() * 1.5, 0.7 + rng() * 0.6, -0.1 + (rng() - 0.5) * 0.5, 0.08 + rng() * 0.08]); strokes(c, L, 'rgba(120,95,60,.2)', 0.012, 1);
      fillPoly(c, [[-0.7, 0.66], [0.6, 0.62], [0.7, 0.68], [-0.7, 0.74]], 'rgba(120,95,60,.14)');
    } },
  ] };
  parts.legC = { z: 2.4, pivot: [-0.5, 0.92], layers: [legH(-0.5, false)] };
  parts.legA = { z: 2.5, pivot: [0.5, 0.95], layers: [legF(0.52, false)] };
  // Kopf mit Hörnern und Joch
  parts.neck = { z: 3, pivot: [0.66, 1.1], layers: [
    { shapes: [limb([[0.6, 1.1, 0.55], [0.88, 1.04, 0.42], [1.08, 0.94, 0.34]]), blob(1.22, 0.84, 0.25, 0.19, -0.6), blob(1.4, 0.69, 0.15, 0.12, -0.7)],
      fill: HIDE, stroke: 'rgba(80,60,40,.55)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(110,85,50,.22)', light: 'rgba(255,255,250,.3)' });
        fillPoly(c, [[1.38, 0.8], [1.5, 0.72], [1.5, 0.64], [1.36, 0.6], [1.3, 0.68]], 'rgba(200,160,140,.8)'); // Maul
        dot(c, 1.47, 0.73, 0.014, '#3a2a24');
        eye(c, 1.24, 0.9, 0.028, { color: '#2a1a10', white: '#fff6dc', look: 0.3 });
        curve(c, [[1.38, 0.62], [1.31, 0.62], [1.27, 0.66]], 'rgba(70,40,30,.8)', 0.01, 1);
        dot(c, 1.15, 0.8, 0.04, 'rgba(235,140,120,.3)');
      } },
    { shapes: [blob(1.06, 1.0, 0.1, 0.045, 0.3)], fill: { top: '#f3d6c8', bottom: '#d9a898' }, stroke: 'rgba(80,60,40,.55)' },
    { shapes: [limb([[1.16, 1.0, 0.1], [1.06, 1.2, 0.08], [1.14, 1.38, 0.055], [1.32, 1.46, 0.02]])], fill: { top: '#efe4c8', bottom: '#b9a880' }, stroke: 'rgba(80,60,40,.55)' },
    // Joch: Holzbalken auf dem Nacken, zwei Bügel um den Hals
    { shapes: [limb([[0.8, 1.14, 0.045], [0.82, 0.86, 0.04]]), limb([[0.94, 1.12, 0.045], [0.95, 0.84, 0.04]])], fill: '#7a4a24', stroke: 'rgba(40,20,8,.7)' },
    { shapes: [poly([[0.66, 1.36], [1.08, 1.32], [1.1, 1.24], [0.68, 1.28]], 1)], fill: { top: '#b98a52', bottom: '#8a5f2f' }, stroke: 'rgba(50,28,10,.7)', deco(c) { line(c, [[0.72, 1.31], [1.04, 1.28]], 'rgba(255,230,180,.35)', 0.01); } },
  ] };
  return { id: 'ochse', parts, anchors: { head: [1.3, 0.9], yoke: [0.97, 1.3], foot: [0.5, 0] },
    meta: { name: 'Ochse', lengthM: 2.6, heightM: 1.45, pivots: { neck: [0.66, 1.1], legA: [0.5, 0.95], legB: [0.62, 0.95], legC: [-0.5, 0.92], legD: [-0.5, 0.92], tail: [-0.86, 1.14] },
      ranges: { neck: [0, 0.25], tail: [0, 0.3] }, swing: { legA: [-0.4, 0.4], legB: [-0.4, 0.4], legC: [-0.35, 0.35], legD: [-0.35, 0.35] } } };
}
