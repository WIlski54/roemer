// Station 2: der Elefant (Hannibals Heer). Seitenansicht, schaut nach +x, freundlich-pummelig, mit purpurner Satteldecke.
// Teile (alle um ihren Pivot drehbar, Winkel in rad, + = gegen den Uhrzeigersinn):
//   legB (z0, ferne Vorderbeine) legD (z.3, ferne Hinterbeine) tail (z.5) legA (z1, nahe Vorderbeine) legC (z1.2, nahe Hinterbeine)
//   body (z2: Rumpf, Kopf, Stoßzähne, Decke) trunk (z2.5: Rüssel, Pivot an der Rüsselwurzel; + = schwingt nach vorn/oben) ear (z2.9: Ohr, Pivot oben)
// Beine hängen beim Gehen paarweise: legA + legD vor, legB + legC zurück (meta.swing).
import { blob, limb, poly } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';

const SKIN = { top: '#a39287', bottom: '#7d6d68' }, SKIN_FAR = { top: '#8c7d75', bottom: '#675a57' };
const IVORY = { top: '#fbf4dc', bottom: '#d9ccaa' };
const LINE = 'rgba(55,40,35,.55)';

export default function make(o = {}) {
  const legs = (x, far) => {
    const fill = far ? SKIN_FAR : SKIN;
    return [{
      shapes: [limb([[x, 1.75, 0.7], [x + 0.02, 1.05, 0.62], [x, 0.2, 0.56]]), blob(x + 0.02, 0.13, 0.36, 0.15)],
      fill, stroke: LINE,
      deco(c, bb) {
        volume(c, bb);
        for (const dx of [-0.13, 0, 0.13]) dot(c, x + 0.1 + dx * 0.9, 0.12, 0.05, '#f1e6cf');          // Zehennägel
        line(c, [[x - 0.25, 0.7], [x - 0.05, 0.62]], 'rgba(60,40,35,.3)', 0.02); line(c, [[x + 0.1, 0.5], [x + 0.28, 0.42]], 'rgba(60,40,35,.28)', 0.02);
      },
    }];
  };
  const pvA = [1.05, 1.5], pvB = [0.7, 1.5], pvC = [-1.05, 1.5], pvD = [-1.4, 1.5];
  const parts = {
    legB: { z: 0, pivot: pvB, layers: legs(0.7, true) },
    legD: { z: 0.3, pivot: pvD, layers: legs(-1.4, true) },
    tail: { z: 0.5, pivot: [-1.7, 2.35], layers: [{ shapes: [limb([[-1.7, 2.35, 0.14], [-2.0, 1.75, 0.1], [-2.02, 1.2, 0.08]]), blob(-2.02, 1.12, 0.1, 0.17)], fill: { top: '#8d7d74', bottom: '#5f5350' }, stroke: LINE }] },
    legA: { z: 1, pivot: pvA, layers: legs(1.05, false) },
    legC: { z: 1.2, pivot: pvC, layers: legs(-1.05, false) },
    body: { z: 2, layers: [
      { // Rumpf, Hals und Kopf aus einem Stück
        shapes: [blob(-0.1, 1.95, 1.75, 1.0, 0.02), blob(1.15, 2.15, 0.95, 0.95), blob(2.0, 2.3, 0.88, 0.9), blob(1.85, 2.85, 0.62, 0.5), blob(2.5, 1.95, 0.4, 0.45)],
        fill: SKIN, stroke: LINE,
        deco(c, bb) {
          volume(c, bb, { dark: 'rgba(45,30,35,.34)', light: 'rgba(255,240,225,.22)' });
          // Runzeln
          for (const [x, y, w] of [[-1.2, 1.5, 0.5], [-0.3, 1.25, 0.6], [0.4, 1.4, 0.45], [-1.0, 2.5, 0.45], [0.2, 2.75, 0.5]]) line(c, [[x, y], [x + w * 0.5, y - 0.08], [x + w, y]], 'rgba(70,50,45,.24)', 0.03);
          dot(c, 2.28, 2.02, 0.08, 'rgba(235,150,140,.4)');          // Wange
          line(c, [[2.18, 2.62], [2.34, 2.66], [2.46, 2.6]], 'rgba(60,40,35,.7)', 0.03);   // Braue
          eye(c, 2.31, 2.5, 0.085, { look: 0.3 });
          line(c, [[2.45, 1.82], [2.62, 1.76], [2.74, 1.8]], 'rgba(80,45,40,.7)', 0.025);   // Mundwinkel (Lächeln)
        },
      },
      { // Satteldecke: purpurn mit Goldrand und Fransen
        shapes: [poly([[-0.8, 2.82], [0.85, 2.82], [0.98, 2.2], [0.9, 1.5], [-0.82, 1.5], [-0.95, 2.2]], 1)], fill: { top: '#7b2d6b', bottom: '#5a1d55' }, stroke: 'rgba(40,10,40,.7)',
        deco(c, bb) {
          volume(c, bb);
          line(c, [[-0.8, 2.74], [0.85, 2.74], [0.94, 2.2], [0.86, 1.62], [-0.78, 1.62], [-0.9, 2.2], [-0.8, 2.74]], '#e8c46a', 0.05);
          for (let i = 0; i < 4; i++) dot(c, -0.45 + i * 0.4, 2.2, 0.11, '#e8c46a'); for (let i = 0; i < 4; i++) dot(c, -0.45 + i * 0.4, 2.2, 0.05, '#7b2d6b');
          for (let i = 0; i < 9; i++) line(c, [[-0.78 + i * 0.2, 1.5], [-0.78 + i * 0.2, 1.38]], '#e8c46a', 0.03);
        },
      },
    ] },
    trunk: { z: 2.5, pivot: [2.5, 2.25], layers: [{
      shapes: [limb([[2.5, 2.25, 0.62], [2.95, 1.6, 0.5], [3.12, 0.95, 0.4], [3.0, 0.45, 0.3], [2.76, 0.3, 0.22], [2.62, 0.42, 0.14]])],
      fill: SKIN, stroke: LINE,
      deco(c, bb) { volume(c, bb); for (let i = 0; i < 6; i++) line(c, [[2.82 + (i % 2) * 0.06, 1.95 - i * 0.22], [3.12 - (i % 2) * 0.04, 1.9 - i * 0.22]], 'rgba(70,50,45,.26)', 0.025); },
    }] },
    tusk: { z: 2.7, layers: [{ shapes: [limb([[2.42, 1.98, 0.2], [2.8, 1.62, 0.15], [3.3, 1.7, 0.09], [3.52, 2.0, 0.03]])], fill: IVORY, stroke: 'rgba(120,100,60,.65)' }] },
    ear: { z: 2.9, pivot: [1.7, 2.8], layers: [{
      shapes: [poly([[1.7, 2.85], [1.15, 2.95], [0.78, 2.45], [0.82, 1.75], [1.15, 1.35], [1.5, 1.8], [1.82, 2.4]], 2)],
      fill: { top: '#9a8880', bottom: '#7a6a66' }, stroke: LINE,
      deco(c, bb) {
        volume(c, bb);
        const g = c.ctx; g.save(); g.fillStyle = 'rgba(214,165,160,.5)'; g.beginPath();
        [[1.55, 2.6], [1.15, 2.7], [0.98, 2.35], [1.0, 1.85], [1.18, 1.65], [1.4, 1.95], [1.6, 2.4]].forEach(([x, y], i) => { const [X, Y] = c.tf(x, y); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); });
        g.closePath(); g.fill(); g.restore();
        line(c, [[1.3, 2.7], [1.1, 2.2], [1.2, 1.7]], 'rgba(80,50,50,.25)', 0.025);
      },
    }] },
  };
  return {
    id: 'elefant', parts,
    anchors: { head: [2.1, 2.4], mouth: [2.6, 1.9], eye: [2.31, 2.5], back: [0.0, 2.9], foot: [1.1, 0], trunkTip: [2.7, 0.35] },
    meta: {
      name: 'Elefant', lengthM: 6, heightM: 3,
      pivots: { legA: pvA, legB: pvB, legC: pvC, legD: pvD, trunk: [2.5, 2.25], ear: [1.7, 2.8], tail: [-1.7, 2.35] },
      swing: { legA: [-0.38, 0.38], legB: [-0.38, 0.38], legC: [-0.38, 0.38], legD: [-0.38, 0.38] },
      ranges: { trunk: [0, 0.55], ear: [0, 0.35], tail: [0, 0.45], legA: [0, 0.38], legB: [0, -0.38], legC: [0, -0.38], legD: [0, 0.38] },
    },
  };
}
