// Die versteckte Gans (gans1 … gans8): immer dieselbe freundliche Gans, aber mit einem anderen Hut je Station.
//   1 Hirtenhut · 2 Senatorenschärpe · 3 Legionärshelm · 4 Lorbeerkranz · 5 Reisehut · 6 rotes Kopftuch · 7 Strohhut mit Band · 8 Zipfelmütze + Schal
// Teile: body, neck (Hals + Kopf, Pivot Halsansatz), jaw (Schnabelunterteil), wing, legA, legB. Länge ≈ 0.8 m, Höhe ≈ 0.75 m.
import { blob, limb, poly } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';

const WHITE = { top: '#ffffff', bottom: '#e4ddcb' }, OR = '#f08a2a', ORD = '#c8601a';
export function gans(n = 1) {
  const parts = {};
  const neckPivot = [0.17, 0.5];
  // Hut / Zubehör am Kopf (kommt in den Hals-Teil, damit es mitgeht)
  const hat = [];
  const hx = 0.31, hy = 0.9;
  if (n === 1) hat.push({ shapes: [blob(hx - 0.02, hy + 0.045, 0.1, 0.022), blob(hx - 0.03, hy + 0.08, 0.05, 0.04)], fill: '#d8c28a', stroke: 'rgba(70,50,20,.7)' });
  if (n === 3) hat.push({ shapes: [poly([[hx - 0.07, hy + 0.01], [hx - 0.06, hy + 0.08], [hx, hy + 0.115], [hx + 0.06, hy + 0.08], [hx + 0.07, hy + 0.04], [hx + 0.01, hy + 0.04]], 2), poly([[hx - 0.07, hy + 0.01], [hx - 0.09, hy - 0.05], [hx - 0.03, hy - 0.03]])], fill: { top: '#eceef0', bottom: '#8d9299' }, stroke: 'rgba(50,55,65,.75)' });
  if (n === 4) { const l = []; for (let i = 0; i < 7; i++) { const a = 0.4 + i * 0.4; l.push(blob(hx - 0.01 + Math.cos(a) * 0.065, hy + 0.01 + Math.sin(a) * 0.06, 0.022, 0.012, a + 1.5)); } hat.push({ shapes: l, fill: { top: '#8ab04a', bottom: '#4c7a2a' }, stroke: 'rgba(30,60,10,.65)' }); }
  if (n === 5) hat.push({ shapes: [blob(hx - 0.01, hy + 0.05, 0.12, 0.02), blob(hx - 0.02, hy + 0.085, 0.055, 0.04)], fill: '#5b87b8', stroke: 'rgba(20,40,70,.7)' });
  if (n === 6) hat.push({ shapes: [poly([[hx - 0.07, hy + 0.02], [hx - 0.04, hy + 0.09], [hx + 0.05, hy + 0.08], [hx + 0.07, hy + 0.03]], 2), blob(hx - 0.09, hy + 0.0, 0.03, 0.02)], fill: '#c0392b', stroke: 'rgba(80,10,10,.7)' });
  if (n === 7) hat.push({ shapes: [blob(hx - 0.01, hy + 0.05, 0.11, 0.02), blob(hx - 0.02, hy + 0.08, 0.05, 0.035)], fill: '#e0c070', stroke: 'rgba(90,60,20,.7)' }, { shapes: [poly([[hx - 0.07, hy + 0.055], [hx + 0.05, hy + 0.055], [hx + 0.05, hy + 0.07], [hx - 0.07, hy + 0.07]])], fill: '#b3352a' });
  if (n === 8) hat.push({ shapes: [poly([[hx - 0.065, hy + 0.03], [hx + 0.06, hy + 0.04], [hx + 0.02, hy + 0.1], [hx - 0.1, hy + 0.17], [hx - 0.1, hy + 0.1]], 2), blob(hx - 0.105, hy + 0.17, 0.02)], fill: '#c0392b', stroke: 'rgba(80,10,10,.7)' }, { shapes: [limb([[0.2, 0.58, 0.07], [0.27, 0.66, 0.065], [0.3, 0.74, 0.06]])], fill: '#e8d9a8', stroke: 'rgba(80,60,30,.6)' });
  parts.legB = { z: 0, pivot: [-0.02, 0.24], layers: [{ shapes: [limb([[0.0, 0.26, 0.05], [0.0, 0.0, 0.04]]), poly([[-0.04, 0.0], [0.13, 0.0], [0.15, 0.025], [0.05, 0.05], [-0.03, 0.04]], 1)], fill: ORD, stroke: 'rgba(70,30,5,.6)' }] };
  parts.legA = { z: 1, pivot: [0.04, 0.24], layers: [{ shapes: [limb([[0.06, 0.26, 0.055], [0.06, 0.0, 0.045]]), poly([[0.02, 0.0], [0.19, 0.0], [0.22, 0.03], [0.1, 0.055], [0.02, 0.045]], 1)], fill: OR, stroke: 'rgba(70,30,5,.6)' }] };
  parts.jaw = { z: 1.9, pivot: [0.35, 0.89], layers: [{ shapes: [poly([[0.345, 0.885], [0.43, 0.875], [0.4, 0.848], [0.345, 0.855]], 1)], fill: ORD, stroke: 'rgba(70,30,5,.6)' }] };
  parts.body = { z: 2, layers: [
    { shapes: [blob(0.0, 0.4, 0.3, 0.2, 0.08), poly([[-0.25, 0.46], [-0.42, 0.62], [-0.3, 0.5]], 1), blob(0.16, 0.45, 0.14, 0.15)], fill: WHITE, stroke: 'rgba(90,80,60,.6)',
      deco(c, bb) { volume(c, bb, { dark: 'rgba(60,45,20,0.14)', light: 'rgba(255,255,255,0.3)' }); line(c, [[-0.2, 0.27], [0.1, 0.22]], 'rgba(150,140,120,.3)', 0.012); } },
    ...(n === 2 ? [{ shapes: [poly([[-0.18, 0.56], [0.24, 0.5], [0.26, 0.44], [-0.14, 0.5]], 1)], fill: '#7b2d5b', stroke: 'rgba(40,10,30,.6)' }] : []),
  ] };
  parts.neck = { z: 2.2, pivot: neckPivot, layers: [
    { shapes: [limb([[0.17, 0.5, 0.15], [0.25, 0.64, 0.095], [0.27, 0.78, 0.075], [0.3, 0.88, 0.07]]), blob(hx, hy, 0.062, 0.056)], fill: WHITE, stroke: 'rgba(90,80,60,.6)' },
    { shapes: [poly([[0.345, 0.915], [0.43, 0.885], [0.435, 0.872], [0.345, 0.86]], 1)], fill: OR, stroke: 'rgba(70,30,5,.6)', deco(c) { eye(c, 0.322, 0.905, 0.0155, { look: 0.3 }); dot(c, 0.3, 0.87, 0.017, 'rgba(235,120,100,.4)'); } },
    ...hat,
  ] };
  parts.wing = { z: 2.5, pivot: [0.1, 0.5], layers: [{ shapes: [blob(-0.06, 0.42, 0.18, 0.09, -0.2), poly([[-0.2, 0.4], [-0.36, 0.4], [-0.22, 0.36]], 1)], fill: { top: '#f4efe0', bottom: '#cfc6b0' }, stroke: 'rgba(90,80,60,.6)',
    deco(c) { for (let i = 0; i < 4; i++) line(c, [[-0.25 + i * 0.07, 0.37], [-0.27 + i * 0.07, 0.31]], 'rgba(120,110,90,.4)', 0.01); } }] };
  return { id: 'gans' + n, parts, anchors: { head: [hx, hy], mouth: [0.42, 0.87], eye: [0.322, 0.905], foot: [0.1, 0] },
    meta: { name: 'Gans', lengthM: 0.8, heightM: 0.75, pivots: { neck: neckPivot, jaw: [0.35, 0.89], wing: [0.1, 0.5], legA: [0.04, 0.24], legB: [-0.02, 0.24] },
      swing: { legA: [-0.5, 0.5], legB: [-0.5, 0.5] }, ranges: { neck: [0, 0.45], jaw: [0, -0.5], wing: [0, 0.9], legA: [0, 0.5], legB: [0, -0.5] } } };
}
