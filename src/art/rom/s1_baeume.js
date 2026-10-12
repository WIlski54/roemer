// Station 1: Bäume am Tiber – Schirmpinie, Zypresse, Feigenbaum (der Sage nach am Lupercal), Trauerweide. Meter, Boden y = 0, Mitte x = 0.
import { blob, limb, poly } from '../dsl.js';
import { dot, line, volume } from '../paint.js';
import { mix, strokes, fillPoly, curve, rngOf, TAU } from './s1_kit.js';

const bark = (c, bb, rng, col = 'rgba(50,28,12,.45)', n = 26, y1 = 3) => { for (let i = 0; i < n; i++) { const x = bb.x0 + rng() * bb.w, y = bb.y0 + rng() * Math.min(bb.h, y1); line(c, [[x, y], [x + (rng() - 0.5) * 0.04, y + 0.15 + rng() * 0.25]], col, 0.014); } };

// ------------------------------------------------------------------------------------------ Schirmpinie
export function pinie(o = {}) {
  const rng = rngOf(o.seed ?? 1, 21);
  const trunk = [limb([[0.0, 0.0, 0.42], [0.06, 0.9, 0.3], [-0.08, 1.9, 0.26], [0.04, 2.7, 0.22], [0.0, 3.2, 0.18]], { per: 8 }),
    limb([[0.0, 2.3, 0.14], [-0.55, 2.8, 0.1], [-1.1, 3.2, 0.07]]), limb([[0.02, 2.6, 0.12], [0.6, 3.0, 0.09], [1.2, 3.3, 0.06]])];
  const blobs = [];
  const cl = [[-1.5, 3.45, 0.7, 0.4], [-0.8, 3.7, 0.85, 0.5], [0.0, 3.85, 0.95, 0.52], [0.85, 3.7, 0.85, 0.5], [1.55, 3.4, 0.72, 0.4], [-0.2, 3.35, 1.3, 0.38], [0.5, 3.45, 1.0, 0.35]];
  for (const [x, y, rx, ry] of cl) blobs.push(blob(x + (rng() - 0.5) * 0.1, y, rx, ry, (rng() - 0.5) * 0.2, 28));
  return { id: 'pinie', parts: {
    trunk: { z: 0, layers: [{ shapes: trunk, fill: { top: '#7a4a2e', bottom: '#a8683c' }, stroke: 'rgba(45,25,10,.65)', deco(c, bb) { bark(c, bb, rng, 'rgba(45,25,10,.45)', 34); fillPoly(c, [[-0.3, 0], [-0.1, 0], [-0.12, 2.8], [-0.25, 2.8]], 'rgba(255,215,170,.18)'); } }] },
    crown: { z: 1, layers: [{ shapes: blobs, fill: { top: '#7da64e', bottom: '#2f5a33' }, stroke: 'rgba(20,50,20,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(15,40,20,.4)', light: 'rgba(210,235,140,.28)' });
        const L = []; for (let i = 0; i < 260; i++) { const x = bb.x0 + rng() * bb.w, y = bb.y0 + rng() * bb.h; L.push([x, y, 1.3 + (rng() - 0.5) * 2.2, 0.08 + rng() * 0.08]); }
        strokes(c, L, 'rgba(190,225,120,.42)', 0.014, 1); strokes(c, L.slice(0, 120).map(([x, y, a, l]) => [x + 0.02, y - 0.03, a, l]), 'rgba(20,55,25,.4)', 0.012, 1);
        for (let i = 0; i < 6; i++) dot(c, bb.x0 + rng() * bb.w, bb.y0 + bb.h * (0.2 + rng() * 0.4), 0.05, '#a06a3a', 0.9);
      } }] },
  }, anchors: { top: [0, 4.2] }, meta: { name: 'Schirmpinie', lengthM: 3.6, heightM: 4.25 } };
}

// ------------------------------------------------------------------------------------------ Zypresse
export function zypresse(o = {}) {
  const rng = rngOf(o.seed ?? 1, 22);
  const lobes = []; const N = 11;
  for (let i = 0; i < N; i++) { const t = i / (N - 1), r = 0.46 * Math.sin(Math.PI * (0.1 + 0.85 * t)) + 0.1; lobes.push(blob((rng() - 0.5) * 0.06, 0.55 + t * 3.3, r, 0.42, 0, 22)); }
  lobes.push(poly([[-0.05, 3.9], [0.0, 4.5], [0.05, 3.9]], 1));
  return { id: 'zypresse', parts: {
    trunk: { z: 0, layers: [{ shapes: [limb([[0, 0, 0.16], [0, 0.7, 0.12]])], fill: '#6b4a2c', stroke: 'rgba(40,22,8,.65)' }] },
    crown: { z: 1, layers: [{ shapes: lobes, fill: { top: '#4f7e48', bottom: '#223f2c' }, stroke: 'rgba(15,40,20,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(10,30,15,.35)', light: 'rgba(200,230,140,.2)' });
        const L = []; for (let i = 0; i < 160; i++) { const x = bb.x0 + rng() * bb.w, y = bb.y0 + rng() * bb.h; L.push([x, y, Math.PI / 2 + (rng() - 0.5) * 0.5, 0.1 + rng() * 0.12]); }
        strokes(c, L, 'rgba(160,205,110,.35)', 0.014, 1); strokes(c, L.slice(0, 80).map(([x, y, a, l]) => [x + 0.02, y, a, l]), 'rgba(10,35,18,.35)', 0.012, 1);
      } }] },
  }, anchors: { top: [0, 4.5] }, meta: { name: 'Zypresse', lengthM: 1.2, heightM: 4.5 } };
}

// ------------------------------------------------------------------------------------------ Feigenbaum (knorrig, mit breiten Blättern und Früchten)
export function feige(o = {}) {
  const rng = rngOf(o.seed ?? 2, 23);
  const trunk = [limb([[0.0, 0.0, 0.62], [-0.1, 0.55, 0.46], [0.05, 1.1, 0.38], [0.0, 1.5, 0.3]], { per: 8 }), limb([[0.0, 1.1, 0.24], [-0.7, 1.55, 0.16], [-1.3, 1.85, 0.1]]), limb([[0.05, 1.2, 0.22], [0.75, 1.6, 0.15], [1.4, 1.9, 0.1]]),
    limb([[-0.2, 0.0, 0.3], [-0.5, -0.0, 0.2]]), limb([[0.25, 0.0, 0.3], [0.58, 0.0, 0.18]])];
  const blobs = []; const cl = [[-1.35, 2.0, 0.75, 0.55], [-0.6, 2.4, 0.85, 0.62], [0.2, 2.55, 0.9, 0.62], [1.0, 2.35, 0.85, 0.6], [1.5, 1.95, 0.7, 0.5], [0.0, 2.0, 1.2, 0.5]];
  for (const [x, y, rx, ry] of cl) blobs.push(blob(x, y, rx, ry, 0, 26));
  const leaves = []; for (let i = 0; i < 42; i++) { const x = -1.9 + rng() * 3.8, y = 1.5 + rng() * 1.5; leaves.push([x, y, rng() * TAU]); }
  return { id: 'feige', parts: {
    trunk: { z: 0, layers: [{ shapes: trunk, fill: { top: '#8c8070', bottom: '#665a4c' }, stroke: 'rgba(40,30,20,.65)', deco(c, bb) { bark(c, bb, rng, 'rgba(40,30,20,.4)', 24, 1.6); fillPoly(c, [[-0.35, 0], [-0.2, 0], [-0.22, 1.4], [-0.3, 1.2]], 'rgba(255,240,215,.2)'); } }] },
    crown: { z: 1, layers: [{ shapes: blobs, fill: { top: '#8fbf55', bottom: '#3f7a38' }, stroke: 'rgba(20,55,20,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(20,50,25,.35)', light: 'rgba(225,245,150,.28)' });
        for (const [x, y, a] of leaves) { const { ctx, tf, S } = c; const [X, Y] = tf(x, y); ctx.save(); ctx.translate(X, Y); ctx.rotate(a); ctx.fillStyle = (x + y) % 0.7 > 0.35 ? 'rgba(190,230,110,.55)' : 'rgba(30,85,40,.45)'; ctx.beginPath();
          ctx.moveTo(0, 0); ctx.bezierCurveTo(S * 0.1, -S * 0.14, S * 0.22, -S * 0.1, S * 0.28, 0); ctx.bezierCurveTo(S * 0.22, S * 0.1, S * 0.1, S * 0.14, 0, 0); ctx.fill(); ctx.restore(); }
        for (let i = 0; i < 9; i++) { dot(c, bb.x0 + rng() * bb.w, bb.y0 + bb.h * (0.1 + rng() * 0.6), 0.055, '#7a3f62', 0.95); }
      } }] },
  }, anchors: { top: [0, 3.1], trunk: [0, 0.8] }, meta: { name: 'Feigenbaum', lengthM: 3.8, heightM: 3.15 } };
}

// ------------------------------------------------------------------------------------------ Trauerweide am Fluss
export function weide(o = {}) {
  const rng = rngOf(o.seed ?? 3, 24);
  const crown = [blob(0, 2.7, 1.25, 0.65, 0, 28), blob(-0.9, 2.45, 0.7, 0.45), blob(0.95, 2.5, 0.7, 0.45)];
  const strands = []; for (let i = 0; i < 16; i++) { const x = -1.6 + i * 0.21 + (rng() - 0.5) * 0.08, top = 2.55 - Math.abs(x) * 0.12, L = 1.2 + rng() * 0.7; strands.push(limb([[x, top, 0.08], [x + (rng() - 0.5) * 0.12, top - L * 0.5, 0.06], [x + (rng() - 0.5) * 0.15, top - L, 0.02]], { per: 6 })); }
  return { id: 'weide', parts: {
    trunk: { z: 0, layers: [{ shapes: [limb([[0.0, 0.0, 0.46], [0.1, 0.9, 0.34], [-0.05, 1.8, 0.26], [0.0, 2.5, 0.2]], { per: 8 }), limb([[0.0, 1.8, 0.14], [-0.8, 2.4, 0.1]]), limb([[0.02, 1.9, 0.13], [0.85, 2.45, 0.09]])], fill: { top: '#6e5c46', bottom: '#8a735a' }, stroke: 'rgba(40,28,15,.65)', deco(c, bb) { bark(c, bb, rng, 'rgba(40,28,15,.4)', 22, 2.4); } }] },
    strands: { z: 1, layers: [{ shapes: strands, fill: { top: '#a9cf68', bottom: '#6a9f48' }, stroke: 'rgba(30,70,25,.45)', deco(c, bb) { for (let i = 0; i < 70; i++) dot(c, bb.x0 + rng() * bb.w, bb.y0 + rng() * bb.h, 0.03, rng() < 0.5 ? 'rgba(210,240,140,.6)' : 'rgba(40,100,40,.4)'); } }] },
    crown: { z: 2, layers: [{ shapes: crown, fill: { top: '#a4cc66', bottom: '#5f9440' }, stroke: 'rgba(30,70,25,.55)', deco(c, bb) { volume(c, bb, { dark: 'rgba(20,55,25,.3)', light: 'rgba(235,250,170,.3)' }); for (let i = 0; i < 80; i++) { const x = bb.x0 + rng() * bb.w, y = bb.y0 + rng() * bb.h; line(c, [[x, y], [x + 0.02, y - 0.12]], 'rgba(220,245,150,.4)', 0.014); } } }] },
  }, anchors: { top: [0, 3.3] }, meta: { name: 'Trauerweide', lengthM: 3.4, heightM: 3.35 } };
}
