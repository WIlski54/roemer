// Station 1: Menschen der Sage und des Hirtendorfes, alle aus person() (gemeinsamer Baukasten, nur benutzt, nicht verändert).
//   romulus (pflügt, Arm nach vorn), hirte (Strohhut, Hirtenstab), baby (Zwilling, wird sitzend gestellt), tarquinius (König im Purpurmantel mit Krone, trägt ein Bündel)
import { limb, poly, blob } from '../dsl.js';
import { dot, line } from '../paint.js';
import { person, SKIN, mixHex } from './_people.js';

const hy = (H, hs = 1.14) => 1.7 - 0.125 * hs * 1.03;   // Kopfmitte im 1,7-m-Raum (wie in person())

export function romulus(o = {}) {
  return person({
    kind: 'buerger', id: 'romulus', name: 'Romulus', height: 1.75, skin: SKIN.tan, hair: { style: 'short', color: '#3a2417' },
    tunic: { color: '#c9a56a', color2: '#8a6a3a', len: 'short', sleeves: false, belt: '#5a3a1f' }, shoes: 'bare', mood: 'smile', ...o,
  });
}

export function hirte(o = {}) {
  const H = 1.7, s = H / 1.7;
  const crook = [
    { shapes: [limb([[0.06, 0.3, 0.04], [0.06, 1.45, 0.04], [0.02, 1.68, 0.035], [-0.1, 1.72, 0.03], [-0.17, 1.6, 0.03]], { per: 8 })], fill: { top: '#b98a52', bottom: '#80582c' }, stroke: 'rgba(40,22,8,.7)' },
  ];
  return person({
    kind: 'handwerker', id: 'hirte', name: 'Hirte', height: 1.72, skin: SKIN.tan, hair: { style: 'short', color: '#5a3a22' }, hat: 'petasos', beard: true,
    tunic: { color: '#a8946a', color2: '#7a6840', len: 'short', sleeves: true, belt: '#5a3a1f' }, shoes: 'sandals', cloak: '#7d6a4a', mood: 'smile',
    parts: { armA: crook }, ...o,
  });
}

// Zwilling: Kleinkind mit großem Kopf; sitzend zu stellen (Beine nach vorn, Figur ca. 0,28 m absenken – im Seitencode)
export function baby(o = {}) {
  const v = o.v || 1;
  return person({
    kind: 'kind', id: 'baby' + v, name: 'Zwilling', height: 0.62, headScale: 1.9, skin: v === 1 ? SKIN.fair : SKIN.warm, bulla: false,
    hair: { style: 'curly', color: v === 1 ? '#6a4326' : '#3e2616' },
    tunic: { color: '#f4ecd6', color2: '#e8d9b0', len: 'ankle', sleeves: false, belt: null }, shoes: 'bare', mood: 'open', ...o,
  });
}

export function tarquinius(o = {}) {
  const H = 1.78, s = H / 1.7, hx = 0.03, hyy = hy(H);
  const P = (pts) => pts.map(([x, y]) => [x * s, y * s]);
  const crown = [
    { shapes: [poly(P([[hx - 0.12, hyy + 0.1], [hx - 0.125, hyy + 0.21], [hx - 0.075, hyy + 0.165], [hx - 0.03, hyy + 0.25], [hx + 0.015, hyy + 0.165], [hx + 0.06, hyy + 0.25], [hx + 0.105, hyy + 0.165], [hx + 0.125, hyy + 0.21], [hx + 0.12, hyy + 0.1]]), 0)],
      fill: { top: '#ffe28a', bottom: '#c8962a' }, stroke: 'rgba(100,60,10,.8)',
      deco(c) { for (const [x, y] of [[hx - 0.03, hyy + 0.2], [hx + 0.06, hyy + 0.2], [hx - 0.09, hyy + 0.14], [hx + 0.11, hyy + 0.14]]) dot(c, x * s, y * s, 0.012, '#b3352a'); } },
  ];
  return person({
    kind: 'senator', id: 'tarquinius', name: 'Tarquinius', height: H, skin: SKIN.fair, hair: { style: 'curly', color: '#c9c2b4' }, beard: true, toga: null,
    tunic: { color: '#8a3a6a', color2: '#e8c46a', len: 'ankle', sleeves: true, belt: '#e8c46a' }, cloak: '#6a2a5a', near: 'basket', mood: 'serious', shoes: 'shoes',
    parts: { head: crown }, ...o,
  });
}
