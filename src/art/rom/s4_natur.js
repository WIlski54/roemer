// Station 4 · Pflanzen: Zypresse (Dämmerung/Morgen), Lorbeerbaum (kugelig geschnitten, im Terrakotta-Topf) und Lorbeer-Busch.
//   Ids: s4_zypresse, s4_lorbeer, s4_lorbeerbusch
import { blob, limb, poly } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { mulberry32 } from '../../engine/util.js';

const spec = (id, name, layers, extra = {}) => ({ id, parts: { body: { z: 1, layers } }, anchors: extra.anchors || {}, meta: { name, ...(extra.meta || {}) } });
const mixHex = (a, b, t) => { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };

// ---- Zypresse: schlanke dunkle Flamme, gewölbte Schuppenstriche (opts.tone 'abend' = bläulicher)
export function zypresse(o = {}) {
  const abend = o.tone === 'abend', seed = o.seed || 1;
  const top = abend ? '#3f6a62' : '#4f8a4c', bot = abend ? '#1f3d46' : '#2a5a34';
  const prof = [[0, 0, 0.12], [0, 0.45, 0.13], [0.01, 0.6, 0.42], [0.0, 1.3, 0.78], [-0.01, 2.2, 0.82], [0.0, 3.1, 0.6], [0.01, 3.8, 0.3], [0.0, 4.35, 0.03]];
  const layers = [
    { shapes: [limb(prof, { per: 10 })], fill: { top, bottom: bot },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(5,25,30,.4)', light: abend ? 'rgba(170,200,230,.22)' : 'rgba(230,255,170,.3)' });
        const r = mulberry32(11 + seed * 7);
        for (let i = 0; i < 90; i++) { const y = 0.6 + r() * 3.6, hw = 0.4 * Math.max(0, Math.min(1, (4.3 - y) / 1.2)) + 0.05; const x = (r() - 0.5) * hw * 1.7; line(c, [[x - 0.05, y], [x, y + 0.1], [x + 0.05, y]], i % 2 ? 'rgba(10,45,30,.45)' : (abend ? 'rgba(150,200,200,.3)' : 'rgba(200,240,140,.32)'), 0.018); }
        line(c, [[-0.2, 0.7], [-0.12, 3.5]], abend ? 'rgba(200,225,245,.25)' : 'rgba(255,255,200,.3)', 0.06);
      } },
  ];
  return spec('s4_zypresse', 'Zypresse', layers);
}

// ---- Lorbeerbaum im Topf: runde, glänzende Krone (Kugelschnitt) auf geradem Stämmchen
export function lorbeer(o = {}) {
  const seed = o.seed || 1, abend = o.tone === 'abend';
  const r = mulberry32(21 + seed * 5);
  const crown = [];
  const cx = 0, cy = 2.05, R = 0.95;
  crown.push(blob(cx, cy, R * 0.85, R * 0.82, 0, 30));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.2; crown.push(blob(cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.75, R * (0.3 + r() * 0.06), R * (0.28 + r() * 0.06), 0, 18)); }
  const trunk = limb([[0.0, 0.62, 0.17], [0.02, 1.2, 0.13], [0.0, 1.55, 0.12]], { per: 6 });
  const pot = poly([[-0.34, 0.6], [0.34, 0.6], [0.28, 0.12], [0.22, 0.0], [-0.22, 0.0], [-0.28, 0.12]], 1);
  const rim = poly([[-0.4, 0.6], [0.4, 0.6], [0.37, 0.7], [-0.37, 0.7]], 0);
  const top = abend ? '#4c7a5c' : '#5d9a3e', bot = abend ? '#27483f' : '#2c6a30';
  const layers = [
    { shapes: [trunk], fill: { top: '#8a6a46', bottom: '#5b4129' }, deco(c) { line(c, [[-0.03, 0.7], [-0.02, 1.5]], 'rgba(255,230,190,.3)', 0.03); } },
    { shapes: [pot], fill: { top: '#d9824a', bottom: '#9a4a24' }, stroke: 'rgba(70,30,10,.65)', deco(c, bb) { volume(c, bb); line(c, [[-0.3, 0.38], [0.3, 0.38]], '#f0c06a', 0.03); line(c, [[-0.25, 0.22], [0.25, 0.22]], 'rgba(90,40,15,.4)', 0.02); } },
    { shapes: [rim], fill: { top: '#e39656', bottom: '#b05d2e' }, stroke: 'rgba(70,30,10,.65)' },
    { shapes: crown, fill: { top, bottom: bot },
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(8,40,25,.4)', light: 'rgba(235,255,170,.3)' });
        const rr = mulberry32(5 + seed);
        for (let i = 0; i < 130; i++) { const a = rr() * 6.283, d = Math.sqrt(rr()) * R * 0.95; const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.95, ang = rr() * 6.283; line(c, [[x, y], [x + Math.cos(ang) * 0.14, y + Math.sin(ang) * 0.1]], i % 3 ? 'rgba(15,60,30,.5)' : 'rgba(215,245,140,.55)', 0.026); }
        for (let i = 0; i < 6; i++) { const a = rr() * 6.283, d = rr() * R * 0.7; dot(c, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.9, 0.035, '#e8c64a', 0.95); }
      } },
  ];
  return spec('s4_lorbeer', 'Lorbeerbaum', layers);
}

// ---- Lorbeer-Busch (niedrig, ohne Topf) für den Boden
export function lorbeerbusch(o = {}) {
  const r = mulberry32(33 + (o.seed || 1) * 3), abend = o.tone === 'abend';
  const shapes = [blob(0, 0.45, 0.8, 0.45, 0, 28)]; for (let i = 0; i < 7; i++) { const a = Math.PI * (i / 6); shapes.push(blob(Math.cos(a) * 0.6, 0.35 + Math.sin(a) * 0.3, 0.3, 0.28, 0, 16)); }
  return spec('s4_lorbeerbusch', 'Lorbeerbusch', [{ shapes, fill: { top: abend ? '#4c7a5c' : '#5d9a3e', bottom: abend ? '#27483f' : '#2c6a30' }, deco(c, bb) { volume(c, bb); for (let i = 0; i < 50; i++) { const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h * 0.9, ang = r() * 6.283; line(c, [[x, y], [x + Math.cos(ang) * 0.12, y + Math.sin(ang) * 0.08]], i % 3 ? 'rgba(15,60,30,.5)' : 'rgba(215,245,140,.55)', 0.024); } } }]);
}
