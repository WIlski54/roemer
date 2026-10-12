// Station 5 „Rom auf dem Höhepunkt“: Bauwerke, Marktstand, Sänfte, Meilenstein, Bäume und Stadtbänder als Papierschnitt-Specs.
// Alle Maße in Modellmetern = Seiteneinheiten (ws = 1). Besitzer: Station 5. Kopiert/abgeleitet von den gemeinsamen Kits nur über Importe, nichts geändert.
import { blob, limb, poly, xf, panel } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { archWall, columnPoly, rectP, ashlar, marbleVeins, roofTiles, plaster, brickwork } from './_arch.js';
import { mulberry32, TAU } from '../../engine/util.js';

const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
export const TRAV = { top: '#f1e5c6', bottom: '#d6c192' };           // Travertin
export const MARBLE = { top: '#faf6ec', bottom: '#dcd3be' };          // Marmor
export const TERRA = { top: '#d27a4a', bottom: '#a8492a' };           // Terrakotta
const one = (id, parts, meta = {}, anchors = {}) => ({ id, parts, anchors, meta: { name: id, ...meta } });
const stroke = 'rgba(70,50,30,.45)';

// ----------------------------------------------------------------------------------------------- Säulenhalle: Hilfen
const flutes = (c, cx, y0, h, w, n = 3, col = 'rgba(100,80,55,.28)') => { for (let k = 0; k < n; k++) line(c, [[cx + (k - (n - 1) / 2) * (w / (n + 0.4)), y0], [cx + (k - (n - 1) / 2) * (w / (n + 0.4)), y0 + h]], col, 0.012); };
function colShade(c, cx, y0, y1, w) { // runder Schaft: dunkel-hell-dunkel
  const { ctx, tf } = c; const [a, b] = tf(cx - w / 2, y1), [d, e] = tf(cx + w / 2, y0);
  const g = ctx.createLinearGradient(a, 0, d, 0); g.addColorStop(0, 'rgba(110,90,60,.42)'); g.addColorStop(0.32, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(110,90,60,.38)');
  ctx.fillStyle = g; ctx.fillRect(a, b, d - a, e - b);
}

// ----------------------------------------------------------------------------------------------- Pantheon
export const PANTHEON = { w: 4.1, h: 3.4 };
export function pantheon() {
  const nC = 8, cxs = Array.from({ length: nC }, (_, i) => -1.42 + (2.84 * i) / (nC - 1)), cw = 0.2, yb = 0.2, ch = 1.32;
  const top = yb + ch;                                                                     // Oberkante der Säulen
  const dTop = 2.3, dome = [];
  for (let i = 0; i <= 44; i++) { const a = Math.PI * i / 44; dome.push([1.8 * Math.cos(a), dTop + 0.12 + 0.98 * Math.sin(a)]); }
  const portico = [...cxs.flatMap((cx) => columnPoly(cx, yb, ch, cw)), rectP(-1.82, 0, 1.82, 0.1), rectP(-1.72, 0.1, 1.72, yb), rectP(-1.7, top, 1.7, top + 0.22), poly([[-1.78, top + 0.22], [1.78, top + 0.22], [0, top + 0.22 + 0.5]])];
  return one('h_pantheon', {
    rotunde: {
      z: 0, layers: [
        { shapes: [rectP(-1.55, yb, 1.55, top)], fill: { top: '#b99a78', bottom: '#8e6f55' }, stroke: null },       // Cella-Wand hinter den Säulen (Schatten)
        {
          shapes: [rectP(-1.98, 0.1, 1.98, dTop), rectP(-2.03, dTop, 2.03, dTop + 0.12)], fill: { top: '#e3c79e', bottom: '#c99b6d' },
          deco(c, bb) {
            brickwork(c, bb, { brick: 'rgba(140,70,35,.2)', mortar: 'rgba(250,235,205,.35)', h: 0.1, w: 0.26, seed: 4 });
            for (let i = -3; i <= 3; i++) { const x = i * 0.56; line(c, [[x - 0.16, 1.7], [x - 0.16, 2.1], [x, 2.28], [x + 0.16, 2.1], [x + 0.16, 1.7]], 'rgba(100,60,35,.28)', 0.018); } // Blendnischen
            line(c, [[-2, 1.5], [2, 1.5]], 'rgba(255,245,215,.55)', 0.035); line(c, [[-2, 1.54], [2, 1.54]], 'rgba(90,55,30,.3)', 0.012);
            line(c, [[-2, dTop - 0.02], [2, dTop - 0.02]], 'rgba(90,55,30,.35)', 0.02);
            volume(c, bb, { dark: 'rgba(70,35,15,.3)', light: 'rgba(255,248,225,.22)' });
          },
        },
        {
          shapes: [dome], fill: { top: '#f0cc92', bottom: '#cc9461' },
          deco(c, bb) {
            for (let k = 1; k <= 6; k++) { const s = k / 7; const pts = []; for (let i = 0; i <= 30; i++) { const a = Math.PI * i / 30; pts.push([1.8 * s * 1.0 * Math.cos(a) * (1 - 0.0), dTop + 0.12 + 0.98 * (0.55 + 0.45 * s) * Math.sin(a) * s + 0.0]); } line(c, pts, 'rgba(120,70,35,.28)', 0.014); }
            for (let a = 0.25; a < 3.0; a += 0.36) line(c, [[0, dTop + 1.0], [1.8 * Math.cos(a), dTop + 0.12 + 0.98 * Math.sin(a)]], 'rgba(255,240,200,.22)', 0.01);
            volume(c, bb, { dark: 'rgba(90,45,20,.28)', light: 'rgba(255,250,230,.4)' });
          },
        },
      ],
    },
    portikus: {
      z: 3, layers: [{
        shapes: portico, fill: MARBLE,
        deco(c, bb) {
          for (const cx of cxs) { colShade(c, cx, yb + 0.07, top - 0.1, cw * 0.95); flutes(c, cx, yb + 0.08, ch - 0.18, cw * 0.7, 4); }
          const [, g] = [0, 0];
          line(c, [[-1.7, top + 0.11], [1.7, top + 0.11]], 'rgba(120,100,70,.3)', 0.012);
          for (let k = 0; k < 20; k++) line(c, [[-1.55 + k * 0.163, top + 0.05], [-1.55 + k * 0.163, top + 0.17]], 'rgba(120,100,70,.28)', 0.012);   // Inschriftenband (nur Andeutung)
          // Giebelfeld
          const { ctx, tf } = c; ctx.save(); ctx.beginPath(); [[-1.55, top + 0.26], [1.55, top + 0.26], [0, top + 0.26 + 0.38]].forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = 'rgba(176,196,212,.55)'; ctx.fill(); ctx.restore();
          for (let k = -4; k <= 4; k++) dot(c, k * 0.26, top + 0.34 + Math.max(0, 0.18 - Math.abs(k) * 0.03), 0.02, 'rgba(255,245,215,.8)');
          line(c, [[-1.78, top + 0.22], [0, top + 0.72], [1.78, top + 0.22]], 'rgba(160,130,90,.6)', 0.022);
          line(c, [[-1.82, 0.1], [1.82, 0.1]], 'rgba(130,100,70,.4)', 0.014);
          volume(c, bb, { dark: 'rgba(80,60,40,.25)', light: 'rgba(255,255,255,.2)' });
        },
      }],
    },
  }, { name: 'Pantheon', lengthM: 44, heightM: 43 }, { top: [0, 3.4] });
}

// ----------------------------------------------------------------------------------------------- Tempel am Forum
export const TEMPEL = { w: 3.3, h: 2.8 };
export function tempel() {
  const nC = 6, cxs = Array.from({ length: nC }, (_, i) => -1.15 + (2.3 * i) / (nC - 1)), cw = 0.2, yb = 0.46, ch = 1.38, top = yb + ch;
  const front = [...cxs.flatMap((cx) => columnPoly(cx, yb, ch, cw)), rectP(-1.46, top, 1.46, top + 0.22), poly([[-1.54, top + 0.22], [1.54, top + 0.22], [0, top + 0.22 + 0.5]])];
  const stair = [rectP(-1.62, 0, 1.62, 0.14), rectP(-1.55, 0.14, 1.55, 0.28), rectP(-1.5, 0.28, 1.5, yb)];
  return one('h_tempel', {
    cella: {
      z: 0, layers: [{
        shapes: [rectP(-1.1, yb, 1.1, top + 0.1), rectP(-1.52, yb - 0.04, 1.52, yb)], fill: { top: '#d9c49c', bottom: '#b9996b' },
        deco(c, bb) { ashlar(c, bb, { h: 0.2, w: 0.42, seed: 3 }); volume(c, bb, { dark: 'rgba(70,45,25,.3)', light: 'rgba(255,245,215,.15)' }); },
      },
      { shapes: [rectP(-0.28, yb, 0.28, yb + 1.05)], fill: { top: '#4a2e22', bottom: '#33200f' }, stroke: 'rgba(30,15,5,.6)' },                  // Tür (dunkel)
      ],
    },
    podium: {
      z: 1, layers: [{
        shapes: stair, fill: TRAV,
        deco(c, bb) { ashlar(c, bb, { h: 0.14, w: 0.5, seed: 2, tone: 'rgba(110,85,55,.12)' }); line(c, [[-1.6, 0.14], [1.6, 0.14]], 'rgba(120,95,60,.35)', 0.014); line(c, [[-1.55, 0.28], [1.55, 0.28]], 'rgba(120,95,60,.35)', 0.014); volume(c, bb); },
      }],
    },
    portikus: {
      z: 3, layers: [{
        shapes: front, fill: MARBLE,
        deco(c, bb) {
          for (const cx of cxs) { colShade(c, cx, yb + 0.07, top - 0.1, cw * 0.95); flutes(c, cx, yb + 0.08, ch - 0.18, cw * 0.7, 4); }
          line(c, [[-1.46, top + 0.11], [1.46, top + 0.11]], 'rgba(120,100,70,.3)', 0.012);
          const { ctx, tf } = c; ctx.save(); ctx.beginPath(); [[-1.36, top + 0.27], [1.36, top + 0.27], [0, top + 0.27 + 0.32]].forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = 'rgba(190,120,95,.55)'; ctx.fill(); ctx.restore();
          line(c, [[-1.54, top + 0.22], [0, top + 0.72], [1.54, top + 0.22]], 'rgba(176,100,70,.8)', 0.03);
          volume(c, bb, { dark: 'rgba(80,60,40,.25)', light: 'rgba(255,255,255,.2)' });
        },
      }],
    },
  }, { name: 'Tempel am Forum', lengthM: 20, heightM: 14 });
}

// ----------------------------------------------------------------------------------------------- Trajanssäule
export const SAEULE = { w: 1.3, h: 4.8 };
export function saeule() {
  const shaftY0 = 1.12, shaftY1 = 4.2;
  const shaft = poly([[-0.4, shaftY0], [0.4, shaftY0], [0.34, shaftY1], [-0.34, shaftY1]]);
  const body = [rectP(-0.65, 0, 0.65, 0.1), rectP(-0.58, 0.1, 0.58, 0.88), rectP(-0.66, 0.88, 0.66, 1.0), rectP(-0.5, 1.0, 0.5, shaftY0), shaft, rectP(-0.45, shaftY1, 0.45, shaftY1 + 0.1), poly([[-0.4, shaftY1 + 0.1], [0.4, shaftY1 + 0.1], [0.5, shaftY1 + 0.26], [-0.5, shaftY1 + 0.26]]), rectP(-0.56, shaftY1 + 0.26, 0.56, shaftY1 + 0.36)];
  const top = shaftY1 + 0.36;
  const statue = [poly([[-0.1, top], [0.1, top], [0.14, top + 0.28], [0.08, top + 0.4], [-0.08, top + 0.4], [-0.14, top + 0.28]], 1), blob(0, top + 0.5, 0.08, 0.09, 0, 14), limb([[0.12, top + 0.33, 0.05], [0.24, top + 0.46, 0.04], [0.28, top + 0.62, 0.035]], { per: 4 })];
  return one('h_saeule', {
    saeule: {
      z: 0, layers: [{
        shapes: body, fill: { stops: [[0, '#f9f4e6'], [1, '#d8cdb4']], dir: 'v' },
        deco(c, bb) {
          const { ctx, tf } = c;
          // Rundung des Schafts: dunkler Rand links/rechts
          const [a, b] = tf(-0.42, shaftY1), [d, e] = tf(0.42, shaftY0);
          const g = ctx.createLinearGradient(a, 0, d, 0); g.addColorStop(0, 'rgba(110,90,60,.4)'); g.addColorStop(0.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(110,90,60,.42)');
          ctx.fillStyle = g; ctx.fillRect(a, b, d - a, e - b);
          // Spiralband: schräge Streifen mit Punktreihen (nur angedeutet, keine Bildmotive). Von vorn sieht man je Windung eine schräge Bahn.
          const turns = 8;
          for (let k = 0; k < turns; k++) {
            const t0 = k / turns, y0 = shaftY0 + 0.06 + (shaftY1 - shaftY0 - 0.3) * t0, hw = 0.36 - 0.05 * t0;
            const yA = y0, yB = y0 + 0.2, th = 0.12;
            ctx.save(); ctx.beginPath(); const P = [[-hw, yA], [hw, yB], [hw, yB + th], [-hw, yA + th]]; P.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath();
            ctx.fillStyle = k % 2 ? 'rgba(160,175,190,.42)' : 'rgba(196,140,90,.45)'; ctx.fill(); ctx.strokeStyle = 'rgba(110,80,50,.45)'; ctx.lineWidth = 0.01 * c.S; ctx.stroke(); ctx.restore();
            for (let m = 0; m < 8; m++) { const u = (m + 0.5) / 8; dot(c, -hw + 2 * hw * u, yA + (yB - yA) * u + th / 2, 0.013, 'rgba(90,60,35,.55)'); }
          }
          // Sockel: Feld mit Kranz
          const { ctx: g2 } = c; line(c, [[-0.46, 0.22], [0.46, 0.22], [0.46, 0.76], [-0.46, 0.76], [-0.46, 0.22]], 'rgba(120,95,60,.5)', 0.016);
          for (let k = 0; k < 14; k++) { const aa = k / 14 * TAU; dot(c, Math.cos(aa) * 0.2, 0.49 + Math.sin(aa) * 0.2, 0.03, 'rgba(110,150,70,.7)'); }
          dot(c, 0, 0.49, 0.08, 'rgba(210,170,70,.85)');
          line(c, [[-0.6, 0.1], [0.6, 0.1]], 'rgba(120,95,60,.4)', 0.014);
          volume(c, bb, { dark: 'rgba(80,60,40,.18)', light: 'rgba(255,255,255,.18)' });
        },
      },
      { shapes: statue, fill: { top: '#f6d97a', bottom: '#b88a2a' }, stroke: 'rgba(90,60,10,.6)' }],
    },
  }, { name: 'Trajanssäule', lengthM: 38, heightM: 38 });
}


// Amphore: Bauch, spitzer Fuß, Hals, zwei Henkel (Mittelpunkt cx, Fußpunkt y0, Breite w, Höhe h)
function amphora(cx, y0, w, h) {
  const r = w / 2;
  const body = poly([[cx, y0], [cx + r * 0.3, y0 + h * 0.08], [cx + r, y0 + h * 0.4], [cx + r * 0.92, y0 + h * 0.62], [cx + r * 0.38, y0 + h * 0.8], [cx + r * 0.3, y0 + h * 0.92], [cx + r * 0.42, y0 + h], [cx - r * 0.42, y0 + h], [cx - r * 0.3, y0 + h * 0.92], [cx - r * 0.38, y0 + h * 0.8], [cx - r * 0.92, y0 + h * 0.62], [cx - r, y0 + h * 0.4], [cx - r * 0.3, y0 + h * 0.08]], 2);
  const hd = (s) => limb([[cx + s * r * 0.34, y0 + h * 0.93, 0.035], [cx + s * r * 1.05, y0 + h * 0.85, 0.035], [cx + s * r * 0.8, y0 + h * 0.68, 0.035]], { per: 4 });
  return [body, hd(1), hd(-1)];
}
// ----------------------------------------------------------------------------------------------- Marktstand mit Sonnendach
export const MARKT = { w: 2.7, h: 2.2, awnTop: 2.14 };
export function marktstand() {
  const awn = poly([[-1.28, 2.14], [1.28, 2.14], [1.46, 1.74], [-1.46, 1.74]]);
  const scallops = []; const nS = 9; for (let i = 0; i < nS; i++) { const x0 = -1.46 + (2.92 * i) / nS, x1 = -1.46 + (2.92 * (i + 1)) / nS; const arc = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * k / 8; arc.push([(x0 + x1) / 2 + Math.cos(Math.PI - a) * (x1 - x0) / 2, 1.74 - Math.sin(a) * 0.15]); } scallops.push(arc.concat([[x1, 1.74], [x0, 1.74]])); }
  const table = [rectP(-1.18, 0.7, 1.18, 0.82), rectP(-1.1, 0.0, -1.0, 0.7), rectP(1.0, 0.0, 1.1, 0.7), rectP(-1.14, 0.2, 1.14, 0.7)];
  const posts = [rectP(-1.24, 0, -1.14, 1.9), rectP(1.14, 0, 1.24, 1.9)];
  return one('h_marktstand', {
    hinten: {
      z: 0, layers: [{ shapes: [...posts, rectP(-1.18, 0.82, 1.18, 1.76)], fill: { top: '#6a4a30', bottom: '#4a3020' }, stroke: 'rgba(40,20,8,.6)', deco(c, bb) { for (let k = 0; k < 8; k++) line(c, [[-1.16 + k * 0.3, 0.82], [-1.16 + k * 0.3, 1.74]], 'rgba(30,15,5,.3)', 0.012); } }],
    },
    tisch: {
      z: 1, layers: [{
        shapes: table, fill: { top: '#d8b078', bottom: '#a47a4a' }, stroke: 'rgba(60,35,15,.55)',
        deco(c, bb) {
          for (let k = 0; k < 7; k++) line(c, [[-1.14, 0.25 + k * 0.07], [1.14, 0.27 + k * 0.07]], 'rgba(90,55,25,.3)', 0.012);
          line(c, [[-1.18, 0.76], [1.18, 0.76]], 'rgba(255,240,200,.5)', 0.02);
          // Stoffbahn an der Tischkante
          const { ctx, tf } = c; ctx.save(); ctx.beginPath(); const T = [[-0.9, 0.7], [0.9, 0.7], [0.82, 0.3], [0.5, 0.36], [0.2, 0.28], [-0.2, 0.37], [-0.55, 0.3], [-0.84, 0.36]]; T.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = 'rgba(122,48,80,.85)'; ctx.fill(); ctx.restore();
          for (let k = 0; k < 6; k++) line(c, [[-0.7 + k * 0.28, 0.68], [-0.72 + k * 0.28, 0.36]], 'rgba(255,225,160,.45)', 0.012);
        },
      }],
    },
    ware: {
      z: 2, layers: [
        { // zwei Amphoren am Boden
          shapes: [...amphora(-1.36, 0, 0.36, 1.0), ...amphora(1.36, 0, 0.36, 1.0)],
          fill: { top: '#d68248', bottom: '#9a4c25' }, stroke: 'rgba(60,25,10,.65)',
          deco(c) { for (const cx of [-1.36, 1.36]) { line(c, [[cx - 0.17, 0.5], [cx + 0.17, 0.5]], 'rgba(60,25,10,.4)', 0.014); line(c, [[cx - 0.13, 0.36], [cx + 0.13, 0.36]], 'rgba(255,225,170,.5)', 0.02); line(c, [[cx - 0.14, 0.62], [cx + 0.14, 0.62]], 'rgba(255,225,170,.4)', 0.016); } },
        },
        { // Korb mit Äpfeln und Trauben auf dem Tisch
          shapes: [poly([[-0.9, 0.82], [-0.3, 0.82], [-0.24, 1.06], [-0.96, 1.06]], 1)], fill: { top: '#d8b26a', bottom: '#a8793a' }, stroke: 'rgba(70,40,15,.65)',
          deco(c) { for (let k = 0; k < 6; k++) line(c, [[-0.92 + k * 0.1, 0.83], [-0.94 + k * 0.1, 1.05]], 'rgba(90,55,20,.4)', 0.012); },
        },
        {
          shapes: [blob(-0.78, 1.14, 0.12), blob(-0.6, 1.17, 0.12), blob(-0.44, 1.13, 0.11), blob(-0.7, 1.28, 0.11), blob(-0.52, 1.29, 0.11)], fill: { top: '#e5563a', bottom: '#a8281a' }, stroke: 'rgba(80,20,10,.65)',
          deco(c) { dot(c, -0.82, 1.18, 0.03, 'rgba(255,255,255,.55)'); dot(c, -0.64, 1.21, 0.03, 'rgba(255,255,255,.55)'); dot(c, -0.74, 1.32, 0.03, 'rgba(255,255,255,.55)'); },
        },
        { // Stoffrollen
          shapes: [blob(0.1, 0.96, 0.17, 0.14), blob(0.38, 0.95, 0.17, 0.13), blob(0.24, 1.17, 0.17, 0.14)], fill: { top: '#e6c875', bottom: '#b68c3a' }, stroke: 'rgba(80,55,15,.6)',
          deco(c) { dot(c, 0.1, 0.96, 0.07, 'rgba(120,60,40,.45)'); dot(c, 0.38, 0.95, 0.07, 'rgba(120,60,40,.45)'); dot(c, 0.24, 1.17, 0.07, 'rgba(120,60,40,.45)'); },
        },
        { // Wasserkrug und Schale
          shapes: [poly([[0.66, 0.82], [0.9, 0.82], [0.94, 1.0], [0.88, 1.14], [0.84, 1.26], [0.72, 1.26], [0.68, 1.14], [0.62, 1.0]], 2), limb([[0.88, 1.2, 0.04], [0.98, 1.1, 0.04], [0.94, 0.98, 0.04]], { per: 4 })],
          fill: { top: '#8aa8b8', bottom: '#556f82' }, stroke: 'rgba(30,50,70,.65)',
        },
      ],
    },
    dach: {
      z: 3, layers: [
        {
          shapes: [awn], fill: '#f4ecd6', stroke: 'rgba(90,50,30,.5)',
          deco(c, bb) { // Streifen
            const n = 11; for (let k = 0; k < n; k += 2) { const { ctx, tf } = c; const x0 = -1.46 + (2.92 * k) / n, x1 = -1.46 + (2.92 * (k + 1)) / n; ctx.save(); ctx.fillStyle = '#c4552f'; ctx.beginPath(); [[x0, 1.7], [x1, 1.7], [x1, 2.2], [x0, 2.2]].forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.restore(); }
            volume(c, bb, { dark: 'rgba(80,30,20,.25)', light: 'rgba(255,255,255,.22)' });
          },
        },
        {
          shapes: scallops, fill: '#f4ecd6', stroke: 'rgba(90,50,30,.5)',
          deco(c) { const n = 9; for (let k = 0; k < n; k += 2) { const { ctx, tf } = c; const x0 = -1.46 + (2.92 * k) / n, x1 = -1.46 + (2.92 * (k + 1)) / n; ctx.save(); ctx.fillStyle = '#c4552f'; ctx.beginPath(); [[x0, 1.5], [x1, 1.5], [x1, 1.8], [x0, 1.8]].forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.restore(); } },
        },
      ],
    },
  }, { name: 'Marktstand', lengthM: 3, heightM: 2.4 }, { top: [0, MARKT.awnTop] });
}

// ----------------------------------------------------------------------------------------------- Sänfte (Trage mit Kabine)
export const SAENFTE = { w: 3.8, h: 2.64, poleY: 1.3 };
export function saenfte() {
  const py = SAENFTE.poleY;
  const poles = [rectP(-1.9, py - 0.05, 1.9, py + 0.05)];
  const cab = poly([[-0.98, 1.4], [0.98, 1.4], [1.0, 2.2], [0.84, 2.32], [-0.84, 2.32], [-1.0, 2.2]], 1);
  const roof = poly([[-1.16, 2.24], [1.16, 2.24], [0.96, 2.44], [0.0, 2.54], [-0.96, 2.44]], 2);
  return one('h_saenfte', {
    stangen: {
      z: 0, layers: [{ shapes: [...poles, blob(-1.9, py, 0.08), blob(1.9, py, 0.08), rectP(-0.62, py - 0.12, -0.5, 1.46), rectP(0.5, py - 0.12, 0.62, 1.46)], fill: { top: '#a8793f', bottom: '#6a4524' }, stroke: 'rgba(40,20,8,.65)', deco(c) { for (let k = 0; k < 12; k++) line(c, [[-1.8 + k * 0.32, py - 0.03], [-1.7 + k * 0.32, py + 0.03]], 'rgba(40,20,5,.3)', 0.012); } }],
    },
    kabine: {
      z: 1, layers: [
        {
          shapes: [cab], fill: { top: '#8c3d56', bottom: '#62233a' }, stroke: 'rgba(40,10,25,.7)',
          deco(c, bb) {
            // Innenraum dunkel (Fensteröffnung) mit Vorhang
            const { ctx, tf } = c; const win = [[-0.6, 1.66], [0.6, 1.66], [0.6, 2.12], [-0.6, 2.12]];
            ctx.save(); ctx.beginPath(); win.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = '#2a1520'; ctx.fill(); ctx.strokeStyle = '#e3b946'; ctx.lineWidth = 0.035 * c.S; ctx.stroke(); ctx.restore();
            // Vorhang links gerafft
            ctx.save(); ctx.beginPath(); [[-0.6, 2.12], [-0.6, 1.66], [-0.4, 1.66], [-0.3, 1.88], [-0.4, 2.12]].forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fillStyle = '#e8c46a'; ctx.fill(); ctx.restore();
            for (let k = 0; k < 4; k++) line(c, [[-0.56 + k * 0.06, 2.1], [-0.54 + k * 0.045, 1.68]], 'rgba(120,80,20,.4)', 0.01);
            dot(c, -0.3, 1.88, 0.045, '#c99a2e');
            line(c, [[-0.96, 1.52], [0.96, 1.52]], '#e3b946', 0.04); line(c, [[-0.94, 2.2], [0.94, 2.2]], '#e3b946', 0.035);
            for (let k = 0; k < 11; k++) dot(c, -0.85 + k * 0.17, 1.46, 0.025, '#f6d97a');
            volume(c, bb, { dark: 'rgba(40,10,20,.3)', light: 'rgba(255,200,220,.18)' });
          },
        },
        { shapes: [roof], fill: { top: '#f0d687', bottom: '#b88a2a' }, stroke: 'rgba(80,50,5,.65)', deco(c, bb) { for (let k = -4; k <= 4; k++) line(c, [[k * 0.2, 2.22], [k * 0.19, 2.42]], 'rgba(120,80,10,.3)', 0.012); volume(c, bb); } },
        { shapes: [blob(0, 2.6, 0.06, 0.06), blob(-1.12, 2.26, 0.045), blob(1.12, 2.26, 0.045)], fill: '#f6d97a', stroke: 'rgba(80,50,5,.6)' },
      ],
    },
  }, { name: 'Sänfte', lengthM: 3.4, heightM: 2.2 });
}

// ----------------------------------------------------------------------------------------------- Meilenstein
export const MEILE = { w: 0.95, h: 1.9 };
export function meilenstein() {
  const shaft = poly([[-0.27, 0.34], [0.27, 0.34], [0.23, 1.5], [-0.23, 1.5]]);
  const cap = [blob(0, 1.5, 0.27, 0.16, 0, 24)];
  return one('h_meilenstein', {
    stein: {
      z: 0, layers: [
        {
          shapes: [rectP(-0.46, 0, 0.46, 0.16), rectP(-0.38, 0.16, 0.38, 0.34), shaft, ...cap], fill: { top: '#f0e4c4', bottom: '#cdb788' },
          deco(c, bb) {
            const { ctx, tf } = c; const [a, b] = tf(-0.27, 1.6), [d, e] = tf(0.27, 0.34);
            const g = ctx.createLinearGradient(a, 0, d, 0); g.addColorStop(0, 'rgba(110,90,60,.4)'); g.addColorStop(0.3, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(110,90,60,.45)'); ctx.fillStyle = g; ctx.fillRect(a, b, d - a, e - b);
            plaster(c, bb, { n: 80, seed: 5 });
            ctx.save(); ctx.fillStyle = '#6d4426'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = `bold ${0.14 * c.S}px ${SERIF}`; let [X, Y] = tf(0, 1.2); ctx.fillText('ROMA', X, Y);
            ctx.font = `bold ${0.12 * c.S}px ${SERIF}`; [X, Y] = tf(0, 0.94); ctx.fillText('· III ·', X, Y);
            line(c, [[-0.17, 1.08], [0.17, 1.08]], 'rgba(109,68,38,.55)', 0.012); line(c, [[-0.17, 0.82], [0.17, 0.82]], 'rgba(109,68,38,.55)', 0.012); ctx.restore();
            volume(c, bb, { dark: 'rgba(80,60,40,.25)', light: 'rgba(255,255,255,.18)' });
          },
        },
        { shapes: [poly([[-0.27, 1.5], [0.27, 1.5], [0.22, 1.64], [0, 1.7], [-0.22, 1.64]], 2)], fill: { top: '#f9e08a', bottom: '#c99a2e' }, stroke: 'rgba(90,60,10,.6)' },
      ],
    },
  }, { name: 'Meilenstein', lengthM: 1.2, heightM: 1.6 });
}

// ----------------------------------------------------------------------------------------------- Bäume
export function pinie() {
  const trunk = limb([[0, 0, 0.26], [-0.05, 0.7, 0.2], [0.07, 1.45, 0.16], [0.12, 2.0, 0.12]], { per: 8 });
  const br = [limb([[0.1, 1.65, 0.09], [-0.55, 1.98, 0.07], [-0.95, 2.22, 0.05]], { per: 5 }), limb([[0.12, 1.8, 0.08], [0.75, 2.05, 0.06], [1.15, 2.26, 0.05]], { per: 5 })];
  const canopy = [blob(0.15, 2.5, 1.25, 0.46, 0.04, 30), blob(-0.85, 2.34, 0.72, 0.34, -0.1, 24), blob(1.2, 2.4, 0.7, 0.34, 0.12, 24), blob(0.25, 2.86, 0.68, 0.3, 0, 22), blob(-0.3, 2.62, 0.6, 0.3, 0.05, 20)];
  return one('h_pinie', {
    stamm: { z: 0, layers: [{ shapes: [trunk, ...br], fill: { top: '#8a5a38', bottom: '#5e3a20' }, stroke: 'rgba(40,20,8,.6)', deco(c) { for (let k = 0; k < 6; k++) line(c, [[-0.05 + k * 0.03, 0.1 + k * 0.2], [-0.03 + k * 0.03, 0.4 + k * 0.2]], 'rgba(40,20,5,.35)', 0.012); } }] },
    krone: {
      z: 2, layers: [{
        shapes: canopy, fill: { top: '#86a45a', bottom: '#4f7036' }, stroke: 'rgba(30,50,20,.6)',
        deco(c, bb) { const r = mulberry32(8); for (let i = 0; i < 90; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.035 + r() * 0.035, r() > 0.5 ? 'rgba(215,235,150,.38)' : 'rgba(30,60,25,.3)'); volume(c, bb, { dark: 'rgba(20,40,15,.3)', light: 'rgba(255,250,200,.25)' }); },
      }],
    },
  }, { name: 'Pinie', lengthM: 20, heightM: 15 });
}
export function zypresse() {
  const body = poly([[0, 0.5], [0.26, 0.9], [0.36, 1.7], [0.28, 2.5], [0.12, 3.05], [0, 3.35], [-0.12, 3.05], [-0.28, 2.5], [-0.36, 1.7], [-0.26, 0.9]], 2);
  return one('h_zypresse', {
    stamm: { z: 0, layers: [{ shapes: [rectP(-0.05, 0, 0.05, 0.7)], fill: '#5e3a20', stroke: 'rgba(40,20,8,.6)' }] },
    krone: {
      z: 1, layers: [{
        shapes: [body], fill: { top: '#4f7a4c', bottom: '#2f5236' }, stroke: 'rgba(20,45,25,.65)',
        deco(c, bb) { const r = mulberry32(3); for (let i = 0; i < 46; i++) { const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h; line(c, [[x, y], [x + (r() - 0.5) * 0.08, y + 0.14]], r() > 0.5 ? 'rgba(170,210,120,.4)' : 'rgba(10,30,15,.35)', 0.018); } volume(c, bb, { dark: 'rgba(10,30,15,.3)', light: 'rgba(230,250,170,.18)' }); },
      }],
    },
  }, { name: 'Zypresse', lengthM: 20, heightM: 25 });
}

// ----------------------------------------------------------------------------------------------- Stadtbänder (Kulissen): Nahband = Dächer und Häuser, Fernband = Hügel, Tempel, Aquädukt im Dunst
export function nahband(x0, x1, hMax, { seed = 1, phase = 0, tint = 0 } = {}) {
  const r = mulberry32(seed);
  const walls = [], roofs = [], blds = [];
  let x = x0 + 0.1;
  while (x < x1 - 0.2) {
    const w = 0.75 + r() * 0.85, h = hMax * (0.55 + r() * 0.45) + Math.sin(x * 0.7 + phase) * 0.08;
    const xr = Math.min(x1, x + w);
    walls.push(rectP(x, 0, xr, h));
    const kind = r();
    if (kind < 0.55) roofs.push(poly([[x - 0.05, h], [xr + 0.05, h], [(x + xr) / 2, h + 0.26 + r() * 0.12]]));
    else if (kind < 0.85) roofs.push(poly([[x - 0.05, h], [xr + 0.05, h], [xr - 0.1, h + 0.18], [x + 0.1, h + 0.18]]));
    else roofs.push(rectP(x - 0.05, h, xr + 0.05, h + 0.08));
    blds.push({ x, xr, h });
    x = xr + (r() < 0.25 ? 0.1 : -0.04);
  }
  const base = panel(x0, x1, 0, hMax * 0.42, { wave: 0.06, freq: (x1 - x0) / 2.2, phase, seed, step: 0.2 });
  const tintC = (a, b) => (tint ? b : a);
  return {
    layers: [
      {
        shapes: [base, ...walls], fill: { top: tintC('#ecdcb8', '#e6d8bc'), bottom: tintC('#cdb185', '#c8b18f') },
        deco(c, bb) {
          const rr = mulberry32(seed + 5);
          for (const b of blds) { // Fenster und Türen
            const nW = Math.max(1, Math.round((b.xr - b.x) / 0.42));
            for (let rowY = 0.3; rowY < b.h - 0.2; rowY += 0.46) for (let k = 0; k < nW; k++) { const wx = b.x + (b.xr - b.x) * ((k + 0.5) / nW); if (rr() < 0.82) { dot(c, wx, rowY + 0.12, 0.05, 'rgba(70,40,25,.6)'); line(c, [[wx - 0.05, rowY + 0.12], [wx - 0.05, rowY + 0.02], [wx + 0.05, rowY + 0.02], [wx + 0.05, rowY + 0.12]], 'rgba(70,40,25,.6)', 0.02); } }
            line(c, [[b.x + 0.01, 0], [b.x + 0.01, b.h]], 'rgba(120,90,60,.35)', 0.015);
          }
          plaster(c, bb, { color: 'rgba(120,80,50,.1)', n: 160, seed: seed + 2 });
          volume(c, bb, { dark: 'rgba(80,50,30,.22)', light: 'rgba(255,248,225,.22)' });
        },
      },
      { shapes: roofs, fill: TERRA, stroke: 'rgba(90,35,15,.5)', deco(c, bb) { roofTiles(c, bb, { a: 'rgba(110,40,20,.4)', b: 'rgba(255,205,150,.28)', h: 0.09, w: 0.12 }); volume(c, bb, { dark: 'rgba(80,25,10,.25)', light: 'rgba(255,230,190,.2)' }); } },
    ],
  };
}

export function fernband(x0, x1, hMax, { seed = 3, phase = 0, temples = 3, arches = false } = {}) {
  const r = mulberry32(seed);
  const hills = panel(x0, x1, 0, hMax * 0.55, { wave: hMax * 0.18, freq: Math.max(2, (x1 - x0) / 3.6), phase, seed, step: 0.2 });
  const marks = [];
  const detail = [];
  for (let i = 0; i < temples; i++) { // kleine Tempelchen / Kuppeln auf den Hügeln
    const cx = x0 + (x1 - x0) * ((i + 0.3 + r() * 0.4) / temples), w = 0.55 + r() * 0.3, y = hMax * 0.5;
    if (r() < 0.5) { detail.push(rectP(cx - w / 2, y, cx + w / 2, y + 0.4), poly([[cx - w / 2 - 0.06, y + 0.4], [cx + w / 2 + 0.06, y + 0.4], [cx, y + 0.66]])); }
    else { detail.push(rectP(cx - w / 2, y, cx + w / 2, y + 0.3)); const d = []; for (let k = 0; k <= 16; k++) { const a = Math.PI * k / 16; d.push([cx + Math.cos(a) * w / 2, y + 0.3 + Math.sin(a) * w * 0.42]); } detail.push(d); }
  }
  const arcade = arches ? archWall(x0 + (x1 - x0) * 0.1, x0 + (x1 - x0) * 0.1 + 4.2, hMax * 0.36, hMax * 0.36 + 0.9, 7, { open: 0.58, crown: 0.84 }) : [];
  return {
    layers: [
      {
        shapes: [hills, ...arcade, ...detail], fill: { top: '#c4c9bd', bottom: '#d6cfba' },
        deco(c, bb) { plaster(c, bb, { color: 'rgba(150,140,120,.14)', n: 140, seed: seed + 3 }); const g = c.ctx; for (const p of detail) { /* Dunst */ } volume(c, bb, { dark: 'rgba(140,130,110,.2)', light: 'rgba(255,255,255,.35)' }); },
      },
    ],
  };
}

// ----------------------------------------------------------------------------------------------- Kolosseum: Reihen
export const KOL_H = [1.0, 0.98, 0.97, 0.78];                     // Höhe der drei Arkadenreihen und des Obergeschosses
export const KOL_Y0 = [0, 1.0, 1.98, 2.95];
export const KOL_TOP = 3.73;
// Ein Wandstück (Segment) einer Reihe: w breit, n Bögen. Reihe 0..2 = Arkaden (dorisch, ionisch, korinthisch), 3 = Obergeschoss mit kleinen Fenstern.
export function tierPart(tier, w, n) {
  const h = KOL_H[tier], hw = w / 2, bw = w / n;
  const arcade = tier < 3;
  const cornice = 0.075;
  const wall = archWall(-hw, hw, 0, h - cornice, n, arcade ? { open: 0.6, crown: 0.84 } : { open: 0.3, crown: 0.62 });
  const shapes = [...wall, rectP(-hw, h - cornice - 0.01, hw, h)];
  const stone = tier === 3 ? { top: '#e9d9b3', bottom: '#cbb487' } : { top: '#f1e3c1', bottom: '#d3bc8c' };
  return {
    layers: [{
      shapes, fill: stone,
      deco(c, bb) {
        const { ctx, tf } = c;
        ashlar(c, bb, { h: 0.13, w: 0.3, tone: 'rgba(120,95,60,.08)', line: 'rgba(110,85,50,.2)', seed: 3 + tier });
        plaster(c, bb, { color: 'rgba(120,90,55,.09)', n: 90, seed: 2 + tier });
        // Halbsäulen auf den Pfeilern
        const colW = tier === 3 ? 0.1 : 0.12;
        for (let i = 0; i <= n; i++) {
          const x = -hw + bw * i;
          const y0 = 0.04, y1 = h - cornice - 0.05;
          const [a, b] = tf(x - colW / 2, y1), [d, e] = tf(x + colW / 2, y0);
          const g = ctx.createLinearGradient(a, 0, d, 0); g.addColorStop(0, 'rgba(120,95,60,.45)'); g.addColorStop(0.35, 'rgba(255,252,236,.65)'); g.addColorStop(1, 'rgba(120,95,60,.4)');
          ctx.fillStyle = g; ctx.fillRect(a, b, d - a, e - b);
          // Kapitell und Basis
          ctx.fillStyle = 'rgba(250,244,225,.9)'; let [p, q] = tf(x - colW * 0.72, y1 + 0.005); ctx.fillRect(p, q, colW * 1.44 * c.S, 0.05 * c.S);
          [p, q] = tf(x - colW * 0.7, y0 + 0.03); ctx.fillRect(p, q, colW * 1.4 * c.S, 0.04 * c.S);
          if (tier === 1) { dot(c, x - colW * 0.52, y1 - 0.01, 0.018, 'rgba(110,85,50,.6)'); dot(c, x + colW * 0.52, y1 - 0.01, 0.018, 'rgba(110,85,50,.6)'); }
          if (tier === 2) for (let k = -1; k <= 1; k++) line(c, [[x + k * 0.03, y1 - 0.07], [x + k * 0.03 + k * 0.012, y1 + 0.01]], 'rgba(110,85,50,.55)', 0.014);
        }
        // Bogenlaibung: dunkler Streifen entlang des Bogenrandes (Tiefe)
        if (arcade) {
          const open = 0.6, crown = 0.84, ow = bw * open, r = ow / 2, yc = (h - cornice) * crown, ys = yc - r;
          for (let j = 0; j < n; j++) {
            const cx = -hw + bw * (j + 0.5);
            ctx.save(); ctx.strokeStyle = 'rgba(70,45,25,.55)'; ctx.lineWidth = 0.035 * c.S; ctx.lineJoin = 'round';
            ctx.beginPath(); let [X, Y] = tf(cx - r, 0); ctx.moveTo(X, Y); [X, Y] = tf(cx - r, ys); ctx.lineTo(X, Y);
            for (let k = 0; k <= 16; k++) { const a = Math.PI - (k / 16) * Math.PI; [X, Y] = tf(cx + r * Math.cos(a), ys + r * Math.sin(a)); ctx.lineTo(X, Y); }
            [X, Y] = tf(cx + r, 0); ctx.lineTo(X, Y); ctx.stroke(); ctx.restore();
            // Schlussstein
            dot(c, cx, yc + 0.045, 0.026, 'rgba(120,90,55,.55)');
          }
        } else { // Obergeschoss: Schilde (Clipei) zwischen den Pilastern
          for (let j = 0; j < n; j++) { const cx = -hw + bw * (j + 0.5); dot(c, cx, h * 0.2, 0.05, 'rgba(176,100,60,.6)'); dot(c, cx, h * 0.2, 0.026, 'rgba(240,210,140,.7)'); }
        }
        // Gesims
        const [gx, gy] = tf(-hw, h); ctx.fillStyle = 'rgba(255,250,232,.8)'; ctx.fillRect(gx, gy, w * c.S, 0.03 * c.S);
        line(c, [[-hw, h - cornice], [hw, h - cornice]], 'rgba(100,75,45,.5)', 0.016);
        volume(c, bb, { dark: 'rgba(80,55,30,.2)', light: 'rgba(255,250,230,.2)' });
      },
    }],
  };
}

// Vorderansicht des ganzen Kolosseums (für Galerie/Karte): vier Reihen, 12 Bögen breit
export function kolosseumFront() {
  const parts = {};
  const W = 6.0, n = 12;
  [0, 1, 2, 3].forEach((t) => {
    const tp = tierPart(t, W, n);
    const y0 = KOL_Y0[t];
    parts['reihe' + t] = { z: t, layers: tp.layers.map((l) => ({ ...l, shapes: l.shapes.map((s) => s.map(([x, y]) => [x, y + y0])), deco: (c, bb) => l.deco({ ...c, tf: (x, y) => c.tf(x, y + y0) }, { ...bb, y0: bb.y0 - y0, y1: bb.y1 - y0 }) })) };
  });
  return one('h_kolosseum_vorn', parts, { name: 'Kolosseum (Vorderansicht)', lengthM: 189, heightM: 48 });
}
