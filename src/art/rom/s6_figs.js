// Station 6 (Pompeji): Figuren und Props – Personen über person({…}) aus dem gemeinsamen Kit, dazu Karren mit Maultier.
// Besitzer: Station 6. Alles Papierschnitt-Specs aus Code (Meter, schaut nach +x).
import { blob, limb, poly } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';
import { person, mixHex, SKIN } from './_people.js';
import { woodGrain } from './_arch.js';

const pts = (a) => a.map(([x, y]) => [x, y]);
const apron = (col, trim) => ({ shapes: [poly(pts([[0.06, 1.2], [0.22, 1.14], [0.25, 0.62], [0.02, 0.6]]), 1)], fill: col, stroke: 'rgba(80,60,40,.55)', deco(c, bb) { line(c, [[0.02, 1.18], [0.22, 1.12]], trim, 0.03); } });

export const figs = {
  s6_kind_tafel: (o = {}) => person({ kind: 'kind', id: 's6_kind_tafel', name: 'Kind mit Wachstafel', near: 'tablet', tunic: { color: '#e8d6a2', color2: '#b8453a', len: 'knee', sleeves: true, belt: '#8a6a3a' }, ...o }),
  s6_kind_huepfer: (o = {}) => person({ kind: 'kind', id: 's6_kind_huepfer', name: 'Kind', near: null, hair: { style: 'short', color: '#2f1f14' }, tunic: { color: '#c8693a', color2: '#e8c46a', len: 'knee', sleeves: false, belt: '#8a6a3a' }, ...o }),
  s6_baecker: (o = {}) => person({ kind: 'handwerker', id: 's6_baecker', name: 'Bäcker', near: 'basket', hair: { style: 'cap', color: '#d8d0c0' }, tunic: { color: '#efe4c8', color2: '#c9b080', len: 'short', sleeves: true, belt: '#6b4a2a' }, shoes: 'sandals', parts: { body: [apron('#fbf6e8', '#c9b080')] }, ...o }),
  s6_haendler: (o = {}) => person({ kind: 'haendler', id: 's6_haendler', name: 'Händler', near: 'amphora', tunic: { color: '#6f9a7b', color2: '#3d6b52', len: 'knee', sleeves: true, belt: '#5a3a1f' }, ...o }),
  s6_wirt: (o = {}) => person({ kind: 'buerger', id: 's6_wirt', name: 'Imbiss', near: 'amphora', mood: 'open', skin: SKIN.tan, hair: { style: 'short', color: '#2f1f14' }, tunic: { color: '#e8d8a8', color2: '#8f2f22', len: 'knee', sleeves: true, belt: '#8f2f22' }, parts: { body: [apron('#a8462e', '#e8c46a')] }, ...o }),
  s6_kundin: (o = {}) => person({ kind: 'buergerin', id: 's6_kundin', name: 'Kundin', hat: 'veil', near: 'basket', tunic: { color: '#c8693a', color2: '#e8c46a', len: 'ankle', sleeves: true, belt: '#e8c46a' }, ...o }),
  s6_kunde: (o = {}) => person({ kind: 'buerger', id: 's6_kunde', name: 'Kunde', near: null, tunic: { color: '#6a8cb8', color2: '#3d5a88', len: 'knee', sleeves: true, belt: '#5a3a1f' }, ...o }),
  s6_traeger: (o = {}) => person({ kind: 'handwerker', id: 's6_traeger', name: 'Wasserträger', near: 'amphora', hair: { style: 'short', color: '#2a1c12' }, skin: SKIN.brown, tunic: { color: '#b9a070', color2: '#8a7048', len: 'short', sleeves: false, belt: '#6b4a2a' }, ...o }),
  s6_hausherr: (o = {}) => person({ kind: 'senator', id: 's6_hausherr', name: 'Hausherr', near: 'scroll', hair: { style: 'short', color: '#6a5a4a' }, ...o }),
  s6_hausfrau: (o = {}) => person({ kind: 'buergerin', id: 's6_hausfrau', name: 'Hausherrin', near: null, tunic: { color: '#7b5a9a', color2: '#e8c46a', len: 'ankle', sleeves: true, belt: '#e8c46a' }, hair: { style: 'bun', color: '#3a2417' }, ...o }),
  s6_kind_haus: (o = {}) => person({ kind: 'kind', id: 's6_kind_haus', name: 'Kind im Haus', near: null, tunic: { color: '#f0e6c8', color2: '#7b5a9a', len: 'knee', sleeves: true, belt: '#8a6a3a' }, ...o }),
};

// ------------------------------------------------------------ Karren mit Maultier (Seitenansicht, fährt nach +x)
function wheelShapes(cx, cy, R, r, n = 24) {
  const out = [];
  for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1.15) / n) * Math.PI * 2; out.push(poly([[cx + Math.cos(a0) * R, cy + Math.sin(a0) * R], [cx + Math.cos(a1) * R, cy + Math.sin(a1) * R], [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r], [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r]])); }
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI; out.push(limb([[cx + Math.cos(a) * (r + 0.02), cy + Math.sin(a) * (r + 0.02), 0.07], [cx - Math.cos(a) * (r + 0.02), cy - Math.sin(a) * (r + 0.02), 0.07]], { per: 2, caps: false })); }
  out.push(blob(cx, cy, 0.1)); return out;
}
export function karren() {
  const MUL = '#8c7a68', MULD = '#6b5a4c', WOOD = '#9a6a3a';
  const legL = (x, hipY, far) => ({ shapes: [limb([[x, hipY, 0.14], [x + 0.02, 0.42, 0.1], [x, 0.1, 0.075]], { per: 6 }), poly([[x - 0.06, 0.0], [x + 0.1, 0.0], [x + 0.1, 0.1], [x - 0.05, 0.1]])], fill: far ? MULD : MUL, stroke: 'rgba(40,25,15,.6)' });
  const parts = {
    legB: { z: 0, pivot: [2.7, 0.8], layers: [legL(2.7, 0.8, true)] },
    legD: { z: 0, pivot: [1.95, 0.8], layers: [legL(1.95, 0.8, true)] },
    cart: { z: 1, layers: [
      { shapes: [limb([[1.25, 0.8, 0.07], [2.05, 0.98, 0.06]], { per: 4 })], fill: WOOD, stroke: 'rgba(50,25,8,.7)' },
      { shapes: [poly([[-0.9, 0.62], [1.45, 0.62], [1.5, 0.7], [1.5, 1.22], [-0.95, 1.22], [-0.95, 0.7]], 1)], fill: { top: '#b07a42', bottom: '#8a5a30' }, stroke: 'rgba(50,25,8,.7)', deco(c, bb) { woodGrain(c, bb, { n: 5, seed: 6 }); for (let i = 0; i < 6; i++) line(c, [[bb.x0 + 0.2 + i * 0.4, bb.y0], [bb.x0 + 0.2 + i * 0.4, bb.y1]], 'rgba(40,20,5,.35)', 0.012); line(c, [[bb.x0, bb.y1 - 0.04], [bb.x1, bb.y1 - 0.04]], 'rgba(255,230,180,.3)', 0.03); } },
      // Ladung: zwei Amphoren und ein Sack
      { shapes: [blob(-0.35, 1.52, 0.2, 0.33), blob(0.15, 1.5, 0.2, 0.31)], fill: { top: '#d09050', bottom: '#b0703a' }, stroke: 'rgba(70,30,10,.7)', deco(c) { for (const x of [-0.35, 0.15]) { line(c, [[x - 0.19, 1.5], [x + 0.19, 1.5]], 'rgba(70,30,10,.4)', 0.015); dot(c, x - 0.07, 1.62, 0.03, 'rgba(255,235,190,.5)'); } } },
      { shapes: [blob(0.78, 1.45, 0.28, 0.22, 0.1)], fill: { top: '#e6d6a8', bottom: '#c9b27a' }, stroke: 'rgba(90,70,30,.6)', deco(c) { line(c, [[0.62, 1.5], [0.9, 1.42]], 'rgba(100,80,40,.4)', 0.015); } },
      // Maultier-Rumpf
      { shapes: [blob(2.35, 1.0, 0.62, 0.3, 0.04), limb([[2.8, 1.08, 0.3], [3.02, 1.38, 0.22], [3.12, 1.52, 0.18]], { per: 6 }), blob(3.22, 1.48, 0.21, 0.125, -0.5), blob(3.36, 1.42, 0.09, 0.07, -0.5), limb([[1.75, 1.05, 0.1], [1.55, 0.8, 0.07], [1.5, 0.55, 0.05]], { per: 5 }), poly([[3.05, 1.55], [3.0, 1.82], [3.12, 1.6]]), poly([[3.16, 1.58], [3.17, 1.84], [3.25, 1.6]])],
        fill: { top: MUL, bottom: MULD }, stroke: 'rgba(40,25,15,.65)', deco(c, bb) { volume(c, bb); eye(c, 3.24, 1.5, 0.026, { look: 0.3 }); dot(c, 3.4, 1.4, 0.015, '#2a1c14'); line(c, [[2.88, 1.34], [3.05, 1.66]], '#3a2a20', 0.05); } },
      // Geschirr
      { shapes: [limb([[2.7, 1.28, 0.05], [2.72, 0.95, 0.05]], { per: 3 }), limb([[2.75, 1.3, 0.05], [3.0, 1.15, 0.045]], { per: 3 })], fill: '#a63a2a', stroke: 'rgba(60,15,10,.6)' },
    ] },
    legC: { z: 2, pivot: [2.7, 0.8], layers: [legL(2.7, 0.8, false)] },
    legA: { z: 2, pivot: [1.95, 0.8], layers: [legL(1.95, 0.8, false)] },
    wheel: { z: 3, pivot: [0.2, 0.5], layers: [{ shapes: wheelShapes(0.2, 0.5, 0.5, 0.4), fill: { top: '#a8763e', bottom: '#7a5028' }, stroke: 'rgba(50,25,8,.75)', deco(c, bb) { dot(c, 0.2, 0.5, 0.1, '#5a3a1c'); dot(c, 0.2, 0.5, 0.035, '#d9b25a'); } }] },
  };
  return { id: 's6_karren', parts, anchors: { head: [3.2, 1.5], axle: [0.2, 0.5] },
    meta: { name: 'Karren', lengthM: 4.4, pivots: { wheel: [0.2, 0.5] }, swing: { legA: [-0.45, 0.45], legB: [-0.45, 0.45], legC: [-0.45, 0.45], legD: [-0.45, 0.45] }, ranges: { legA: [0, 0.4], legB: [0, -0.4], legC: [0, 0.4], legD: [0, -0.4] } } };
}
