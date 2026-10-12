// Römer-Baukasten: Personen als Papierschnitt-Figuren (Seitenansicht, schauen nach +x).
//
//   import { person } from './_people.js';
//   export const legionaer = (o) => person({ kind: 'legionaer', ...o });
//
// person(opts) liefert eine fertige Spec (id, parts, anchors, meta) – registriere sie in deiner reg_sN.js.
// Teile: legB(z0) armB(z.5) legA(z1) body(z2, Rumpf+Kopf) shield(z2.6, optional) armA(z3)
// Pivots: Beine = Hüfte, Arme = Schulter. Positiver Winkel = gegen den Uhrzeigersinn:
//   Bein/Arm hängt nach unten, + schwingt nach VORNE (Laufen: legA +, legB − usw.), armA bis ca. +2.4 hebt nach vorn/oben.
// meta.swing = { legA:[−.5,.5], legB:[−.5,.5], armA:[−.5,.5], armB:[−.5,.5] } (Lauf-/Schwingbereich), meta.ranges = [Ruhe, Maximum].
//
// Optionen (alle optional, Standardwerte je Art in KINDS):
//   kind        'buerger' | 'buergerin' | 'kind' | 'legionaer' | 'zenturio' | 'aquilifer' | 'senator' | 'kaiser' | 'haendler'
//               | 'handwerker' | 'germane'  (oder eigene Mischung über die Felder darunter)
//   height      Körperhöhe in m (Standard je Art, Erwachsene 1,70)
//   skin        Hautton '#rrggbb'          hair {style:'short'|'bun'|'long'|'curly'|'bald'|'cap', color}
//   tunic       { color, color2 (Saum/Streifen), len:'short'|'knee'|'ankle', sleeves:true|false, belt:'#hex'|null }
//   toga        { color:'#f4efe4', border:'#7b2d5b'|null }   (statt Tunika-Länge: Mantel über der Schulter, bis zu den Knöcheln)
//   armor       'lorica' (Schienenpanzer) | 'mail' (Kettenhemd) | null
//   helmet      'galea' | 'crest' (Zenturio, Busch quer) | null      hat 'petasos' | 'cap' | 'laurel' | 'veil' | null
//   beard       true/false      cloak '#hex' (Umhang)      bracae '#hex' (lange Hose, Germanen)
//   shoes       'sandals' | 'caligae' | 'shoes' | 'bare'
//   near        Gegenstand in der nahen Hand: 'pilum' | 'staff' | 'scroll' | 'tablet' | 'amphora' | 'aquila' | 'basket' | 'torch' | null
//   far         'scutum' (großer Schild vor dem Körper) | 'oval' (germanischer Schild) | null
//   sword       true: Gladius am Gürtel      bulla true: Amulett (Kind)      mood 'smile' | 'serious' | 'open'
//   parts       { armA:[layer…], body:[layer…], head:[layer…], legA:[…] }  zusätzliche Layer (eigene Dinge)
import { blob, limb, poly, xf } from '../dsl.js';
import { eye, line, dot, volume } from '../paint.js';

export const SKIN = { fair: '#f0c9a4', warm: '#e2b088', tan: '#cf9a70', brown: '#a8714c', dark: '#7a4c32' };
const DARK = '#2c1a10';
const mixHex = (a, b, t) => { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
export { mixHex };

const KINDS = {
  buerger: { height: 1.68, skin: SKIN.warm, hair: { style: 'short', color: '#4a2f1d' }, tunic: { color: '#d9c08a', color2: '#b8935a', len: 'knee', sleeves: true, belt: '#6b4a2a' }, shoes: 'shoes' },
  buergerin: { height: 1.56, skin: SKIN.fair, female: true, hair: { style: 'bun', color: '#3a2417' }, tunic: { color: '#b8453a', color2: '#e8c46a', len: 'ankle', sleeves: true, belt: '#e8c46a' }, shoes: 'shoes' },
  kind: { height: 1.2, skin: SKIN.warm, hair: { style: 'short', color: '#5a3a22' }, tunic: { color: '#e3cf9a', color2: '#b8453a', len: 'knee', sleeves: true, belt: '#8a6a3a' }, shoes: 'sandals', bulla: true, headScale: 1.36 },
  legionaer: { height: 1.72, skin: SKIN.warm, hair: { style: 'short', color: '#3a2417' }, tunic: { color: '#b3352a', color2: '#7d2118', len: 'knee', sleeves: false, belt: '#4a3020' }, armor: 'lorica', helmet: 'galea', shoes: 'caligae', near: 'pilum', far: 'scutum', sword: true },
  zenturio: { height: 1.76, skin: SKIN.warm, hair: { style: 'short', color: '#4a3a30' }, tunic: { color: '#b3352a', color2: '#7d2118', len: 'knee', sleeves: false, belt: '#4a3020' }, armor: 'mail', helmet: 'crest', shoes: 'caligae', near: 'staff', sword: true, cloak: '#8b1e1e', greaves: true },
  aquilifer: { height: 1.74, skin: SKIN.tan, hair: { style: 'short', color: '#2f2018' }, tunic: { color: '#b3352a', color2: '#7d2118', len: 'knee', sleeves: false, belt: '#4a3020' }, armor: 'mail', helmet: 'galea', shoes: 'caligae', near: 'aquila', sword: true, cloak: '#6a1f2a' },
  senator: { height: 1.7, skin: SKIN.fair, hair: { style: 'bald', color: '#b9b2a6' }, toga: { color: '#f4efe4', border: '#7b2d5b' }, tunic: { color: '#f4efe4', color2: '#7b2d5b', len: 'ankle', sleeves: true, belt: null }, shoes: 'shoes', near: 'scroll', mood: 'serious' },
  kaiser: { height: 1.7, skin: SKIN.fair, hair: { style: 'curly', color: '#c9a44a' }, toga: { color: '#f4efe4', border: '#7b2d5b' }, tunic: { color: '#f4efe4', color2: '#7b2d5b', len: 'ankle', sleeves: true, belt: null }, shoes: 'shoes', hat: 'laurel' },
  haendler: { height: 1.66, skin: SKIN.tan, hair: { style: 'cap', color: '#6b3d1f' }, tunic: { color: '#6f9a7b', color2: '#3d6b52', len: 'knee', sleeves: true, belt: '#5a3a1f' }, shoes: 'sandals', beard: true, near: 'basket' },
  handwerker: { height: 1.68, skin: SKIN.tan, hair: { style: 'short', color: '#3a2a1c' }, tunic: { color: '#c9b080', color2: '#9a7a48', len: 'short', sleeves: false, belt: '#6b4a2a' }, shoes: 'sandals' },
  germane: { height: 1.8, skin: SKIN.fair, hair: { style: 'long', color: '#c88a3e' }, tunic: { color: '#6f7f4a', color2: '#4a5a30', len: 'short', sleeves: true, belt: '#6b4a2a' }, bracae: '#7a6a52', shoes: 'bare', beard: true, cloak: '#8a5a3a', far: 'oval' },
};

export function person(o = {}) {
  const base = KINDS[o.kind || 'buerger'] || KINDS.buerger;
  const k = { ...base, ...o, hair: { ...base.hair, ...(o.hair || {}) }, tunic: { ...base.tunic, ...(o.tunic || {}) } };
  const H = k.height, s = H / 1.7, hs = k.headScale || 1.14;
  const skin = k.skin, skinD = mixHex(skin, '#7a4a30', 0.25);
  const T = k.tunic, tun = T.color, tunD = mixHex(T.color, '#2a1208', 0.28);
  const female = !!k.female, toga = k.toga, armor = k.armor;
  const mood = k.mood || 'smile';
  // ---- scaled helpers (alle Maße im 1,70-m-Raum entwerfen)
  const B = (cx, cy, rx, ry = rx, rot = 0, n = 36) => blob(cx * s, cy * s, rx * s, ry * s, rot, n);
  const L = (pts, per = 8) => limb(pts.map(([x, y, w]) => [x * s, y * s, (w || 0) * s]), { per });
  const P = (pts, sm = 0) => poly(pts.map(([x, y]) => [x * s, y * s]), sm);
  const S = (v) => v * s;
  const HIP = [0, 0.9], SH = [0.0, 1.36];
  const hr = 0.125 * hs, hx = 0.03, hy = 1.7 - hr * 1.03;
  const hemY = { short: 0.7, knee: 0.52, ankle: 0.1 }[T.len] ?? 0.52;
  const legFull = !!k.bracae || (T.len === 'short' && !female);
  const parts = {};

  // ======================= BEINE
  const legLayer = (far) => {
    const skinOrBr = k.bracae || skin;
    const col = far ? mixHex(skinOrBr, '#000000', 0.12) : skinOrBr;
    const layers = [];
    const thigh = L([[0, 0.92, 0.17], [0.02, 0.5, 0.13], [0.0, 0.1, 0.1]]);
    layers.push({ shapes: [thigh, P([[-0.05, 0.0], [0.2, 0.0], [0.22, 0.055], [0.17, 0.1], [-0.04, 0.11]], 1)], fill: { top: col, bottom: mixHex(col, '#000000', 0.18) }, stroke: 'rgba(60,30,12,.55)' });
    const sh = k.shoes || 'sandals';
    if (sh !== 'bare') {
      const sc = sh === 'caligae' ? '#5b3a22' : sh === 'shoes' ? '#6b3f23' : '#8a5a34';
      layers.push({ shapes: [P([[-0.055, 0.0], [0.205, 0.0], [0.235, 0.06], [0.18, 0.115], [-0.05, 0.125]], 1)], fill: sc, stroke: 'rgba(40,20,8,.6)',
        deco(c) { if (sh === 'sandals' || sh === 'caligae') { for (let i = 0; i < 4; i++) line(c, [[S(-0.02 + i * 0.05), S(0.12)], [S(0.0 + i * 0.05), S(0.3 + (sh === 'caligae' ? 0.06 : 0))]], '#5b3a22', S(0.016)); } } });
    }
    if (k.greaves) layers.push({ shapes: [L([[0.0, 0.42, 0.12], [0.0, 0.14, 0.11]])], fill: { top: '#d7d8da', bottom: '#9a9ca0' }, stroke: 'rgba(60,60,70,.6)' });
    if ((k.parts || {}).legA && !far) layers.push(...k.parts.legA);
    return layers;
  };
  const around = (layers, rot, px, py) => layers.map((l) => ({ ...l, shapes: l.shapes.map((sh) => xf(sh.map(([x, y]) => [x - px, y - py]), { rot }).map(([x, y]) => [x + px, y + py])) }));
  parts.legB = { z: 0, pivot: [HIP[0] * s, HIP[1] * s], layers: around(legLayer(true), -0.14, HIP[0] * s, HIP[1] * s) };
  parts.legA = { z: 1, pivot: [HIP[0] * s, HIP[1] * s], layers: legLayer(false) };

  // ======================= ARME
  const armLayer = (far) => {
    const layers = [];
    const sk = far ? mixHex(skin, '#000000', 0.1) : skin;
    const arm = L([[0, 1.36, 0.1], [0.015, 1.13, 0.085], [0.025, 0.93, 0.07]]);
    const hand = B(0.03, 0.89, 0.048, 0.052);
    layers.push({ shapes: [arm, hand], fill: sk, stroke: 'rgba(60,30,12,.55)' });
    const slv = (armor === 'mail' || armor === 'lorica') ? '#b3352a' : tun;
    if (T.sleeves || toga || armor === 'lorica') {
      const long = T.sleeves && !armor ? 0.28 : 0.2;
      layers.push({ shapes: [L([[0, 1.37, 0.14], [0.012, 1.37 - long, 0.125]])], fill: far ? mixHex(slv, '#000000', 0.12) : slv, stroke: 'rgba(60,30,12,.55)' });
    }
    if (!far && k.near) layers.push(...heldItem(k.near, s, k));
    if (!far && (k.parts || {}).armA) layers.push(...k.parts.armA);
    return layers;
  };
  parts.armB = { z: 0.5, pivot: [SH[0] * s, SH[1] * s], layers: around(armLayer(true), 0.1, SH[0] * s, SH[1] * s) };
  parts.armA = { z: 3, pivot: [SH[0] * s, SH[1] * s], layers: armLayer(false) };

  // ======================= RUMPF
  const bodyLayers = [];
  const chest = female ? 0.15 : 0.17;
  // Tunika / Kleid
  const hemW = T.len === 'ankle' ? 0.19 : 0.2;
  const garment = P([[-chest - 0.01, 1.38], [-0.01, 1.43], [chest + 0.02, 1.38], [chest + 0.04, 1.2], [chest + 0.015, 1.0], [hemW + 0.04, hemY + 0.04], [hemW + 0.03, hemY], [-hemW - 0.01, hemY], [-hemW - 0.03, hemY + 0.05], [-chest - 0.03, 1.0], [-chest - 0.04, 1.2]], 2);
  bodyLayers.push({ shapes: [garment], fill: { top: tun, bottom: tunD }, stroke: 'rgba(50,25,10,.6)',
    deco(c, bb) {
      volume(c, bb);
      if (T.color2 && T.len !== 'short') line(c, [[S(-hemW - 0.02), S(hemY + 0.035)], [S(hemW + 0.03), S(hemY + 0.035)]], T.color2, S(0.035));
      if (T.len === 'ankle' || toga) for (let i = 0; i < 4; i++) line(c, [[S(-0.1 + i * 0.07), S(hemY + 0.08)], [S(-0.09 + i * 0.07), S(0.9 - i * 0.04)]], 'rgba(40,20,10,.16)', S(0.014));
    } });
  // Toga: Tuch über Schulter bis Knöchel, mit Randstreifen
  if (toga) {
    const wrap = P([[-chest - 0.04, 1.4], [0.05, 1.44], [chest + 0.05, 1.3], [chest + 0.06, 0.9], [chest + 0.1, 0.55], [chest + 0.1, 0.08], [-0.02, 0.07], [-chest - 0.07, 0.1], [-chest - 0.08, 0.8], [-0.0, 1.0], [-chest - 0.03, 1.3]], 2);
    bodyLayers.push({ shapes: [wrap], fill: { top: toga.color, bottom: mixHex(toga.color, '#8a7a60', 0.3) }, stroke: 'rgba(70,50,30,.55)',
      deco(c, bb) {
        volume(c, bb);
        for (let i = 0; i < 6; i++) line(c, [[S(-0.17 + i * 0.075), S(0.12 + (i % 2) * 0.05)], [S(-0.12 + i * 0.07), S(1.2 - i * 0.06)]], 'rgba(90,70,45,.22)', S(0.014));
        if (toga.border) line(c, [[S(chest + 0.04), S(1.36)], [S(chest + 0.05), S(0.1)]], toga.border, S(0.04), { alpha: 0.9 });
      } });
  }
  // Kleid-Gürtel
  if (T.belt && !toga) bodyLayers.push({ shapes: [P([[-chest - 0.04, 1.03], [chest + 0.04, 1.03], [chest + 0.045, 0.97], [-chest - 0.045, 0.97]])], fill: T.belt, stroke: 'rgba(40,20,8,.6)' });
  // Panzerung
  if (armor === 'lorica') {
    bodyLayers.push({ shapes: [P([[-chest - 0.02, 1.37], [chest + 0.03, 1.37], [chest + 0.06, 1.2], [chest + 0.05, 0.95], [-chest - 0.05, 0.95], [-chest - 0.06, 1.2]], 2)], fill: { top: '#e3e5e8', bottom: '#8f949b' }, stroke: 'rgba(50,55,65,.7)',
      deco(c, bb) { for (let i = 0; i < 7; i++) line(c, [[S(-0.25), S(1.33 - i * 0.055)], [S(0.25), S(1.33 - i * 0.055)]], 'rgba(40,45,55,.55)', S(0.012)); line(c, [[S(0.0), S(1.38)], [S(0.01), S(0.95)]], 'rgba(255,255,255,.35)', S(0.02)); } });
    bodyLayers.push({ shapes: [P([[-0.15, 1.42], [0.2, 1.42], [0.22, 1.33], [-0.17, 1.33]], 1)], fill: '#c9ccd0', stroke: 'rgba(50,55,65,.7)' }); // Schulterklappen
  } else if (armor === 'mail') {
    bodyLayers.push({ shapes: [P([[-chest - 0.03, 1.37], [chest + 0.04, 1.37], [chest + 0.06, 1.15], [chest + 0.07, 0.82], [-chest - 0.07, 0.82], [-chest - 0.06, 1.15]], 2)], fill: { top: '#c9ccd2', bottom: '#7f858e' }, stroke: 'rgba(50,55,65,.7)',
      deco(c, bb) { for (let y = 0.84; y < 1.36; y += 0.04) for (let x = -0.22; x < 0.24; x += 0.045) dot(c, S(x + ((y * 25) % 2 < 1 ? 0 : 0.02)), S(y), S(0.012), 'rgba(40,45,55,.35)'); } });
  }
  if (k.sword) bodyLayers.push({ shapes: [P([[-0.1, 0.96], [-0.04, 0.96], [-0.06, 0.55], [-0.12, 0.55]])], fill: '#7b5a3a', stroke: 'rgba(40,20,8,.7)' }); // Scheide
  if (k.sword) bodyLayers.push({ shapes: [P([[-0.13, 1.0], [-0.03, 1.0], [-0.03, 0.96], [-0.13, 0.96]])], fill: '#d7b24a' });
  // Umhang hinten
  if (k.cloak) bodyLayers.unshift({ shapes: [P([[-chest - 0.02, 1.4], [-chest - 0.28, 0.5], [-chest - 0.22, 0.3], [-0.05, 0.62], [-0.02, 1.2]], 2)], fill: { top: k.cloak, bottom: mixHex(k.cloak, '#000000', 0.3) }, stroke: 'rgba(40,10,10,.6)' });
  if (k.bulla) bodyLayers.push({ shapes: [B(0.17, 1.28, 0.035)], fill: '#e8c46a', stroke: 'rgba(90,60,10,.7)' });
  if ((k.parts || {}).body) bodyLayers.push(...k.parts.body);
  // Hals + Kopf
  bodyLayers.push({ shapes: [L([[0.0, 1.36, 0.11], [0.015, 1.47, 0.1]])], fill: skinD, stroke: 'rgba(60,30,12,.5)' });
  const head = [B(hx, hy, hr, hr * 1.03), B(hx + hr * 0.98, hy - hr * 0.1, hr * 0.26, hr * 0.22), B(hx + hr * 0.5, hy - hr * 0.8, hr * 0.5, hr * 0.38)];
  bodyLayers.push({ shapes: head.map((p) => p.map(([x, y]) => [x, y])), fill: { top: skin, bottom: skinD }, stroke: 'rgba(60,30,12,.6)' });
  // Ohr
  bodyLayers.push({ shapes: [blob(S(hx - 0.02), S(hy - 0.01), S(0.03 * hs), S(0.04 * hs))], fill: skinD, stroke: 'rgba(60,30,12,.45)' });
  // Haar
  const hc = k.hair.color, hsty = k.hair.style;
  const hairShapes = [];
  const hb = (cx, cy, rx, ry, rot = 0) => blob(S(cx), S(cy), S(rx * hs), S(ry * hs), rot);
  if (hsty === 'short') hairShapes.push(hb(hx - 0.02, hy + 0.035, 0.132, 0.118, 0.1));
  else if (hsty === 'curly') { for (let i = 0; i < 9; i++) { const a = 0.2 + i * 0.36; hairShapes.push(hb(hx - 0.01 + Math.cos(a) * 0.1, hy + 0.02 + Math.sin(a) * 0.1, 0.045, 0.045)); } hairShapes.push(hb(hx - 0.02, hy + 0.03, 0.11, 0.1)); }
  else if (hsty === 'bun') { hairShapes.push(hb(hx - 0.02, hy + 0.03, 0.13, 0.115, 0.1)); hairShapes.push(hb(hx - 0.14, hy - 0.04, 0.07, 0.07)); }
  else if (hsty === 'long') { hairShapes.push(hb(hx - 0.03, hy + 0.03, 0.14, 0.125, 0.1)); hairShapes.push(L([[hx - 0.1, hy + 0.02, 0.1], [hx - 0.15, hy - 0.2, 0.11], [hx - 0.14, hy - 0.42, 0.08]])); }
  else if (hsty === 'cap') hairShapes.push(hb(hx - 0.02, hy + 0.05, 0.128, 0.1, 0.1));
  else if (hsty === 'bald') { hairShapes.push(blob(S(hx - hr * 1.0), S(hy + 0.0), S(0.028), S(0.06), 0.15)); }
  if (hairShapes.length) bodyLayers.push({ shapes: hairShapes, fill: { top: mixHex(hc, '#ffffff', 0.12), bottom: hc }, stroke: 'rgba(40,20,8,.6)' });
  // Bart
  if (k.beard) bodyLayers.push({ shapes: [P([[hx + 0.0, hy - 0.04], [hx + hr * 1.0, hy - 0.06], [hx + hr * 0.95, hy - hr * 1.0], [hx + hr * 0.4, hy - hr * 1.15], [hx - 0.05, hy - hr * 0.8]], 2)], fill: hc, stroke: 'rgba(40,20,8,.6)' });
  // Gesicht (Hautfläche vor dem Haaransatz) + Augen, Mund, Wange
  bodyLayers.push({ shapes: [B(hx + hr * 0.38, hy - hr * 0.1, hr * 0.74, hr * 0.78), B(hx + hr * 0.98, hy - hr * 0.1, hr * 0.26, hr * 0.22)], fill: { top: skin, bottom: skinD }, stroke: null,
    deco(c) {
      eye(c, S(hx + hr * 0.52), S(hy + hr * 0.12), S(0.027 * hs), { look: 0.35 });
      line(c, [[S(hx + hr * 0.3), S(hy + hr * 0.4)], [S(hx + hr * 0.72), S(hy + hr * 0.42)]], 'rgba(60,30,12,.7)', S(0.013)); // Braue
      const my = hy - hr * 0.5;
      if (mood === 'open') dot(c, S(hx + hr * 0.62), S(my), S(0.02), '#7a2a22');
      else if (mood === 'serious') line(c, [[S(hx + hr * 0.45), S(my)], [S(hx + hr * 0.78), S(my)]], 'rgba(90,40,30,.85)', S(0.012));
      else line(c, [[S(hx + hr * 0.42), S(my + 0.012)], [S(hx + hr * 0.6), S(my - 0.012)], [S(hx + hr * 0.8), S(my + 0.014)]], 'rgba(100,40,30,.85)', S(0.012));
      dot(c, S(hx + hr * 0.3), S(hy - hr * 0.32), S(0.03 * hs), 'rgba(224,120,100,.45)');
    } });
  // Kopfbedeckung
  const hat = k.hat, hel = k.helmet;
  if (hel) {
    const hd = hr * 1.03;
    const dome = [P([[hx - hd * 1.05, hy - 0.02], [hx - hd * 0.95, hy + hd * 0.6], [hx - 0.02, hy + hd * 1.12], [hx + hd * 0.7, hy + hd * 0.7], [hx + hd * 1.0, hy + hd * 0.34], [hx + hd * 1.0, hy + hd * 0.2], [hx - hd * 0.1, hy + hd * 0.22]], 2)];
    const neck = P([[hx - hd * 1.05, hy - 0.02], [hx - hd * 1.1, hy - hd * 0.7], [hx - hd * 0.4, hy - hd * 0.85], [hx - hd * 0.2, hy - 0.02]], 1);
    const cheek = P([[hx - hd * 0.05, hy + hd * 0.1], [hx + hd * 0.5, hy + hd * 0.1], [hx + hd * 0.6, hy - hd * 0.8], [hx + hd * 0.2, hy - hd * 0.7]], 1);
    bodyLayers.push({ shapes: [...dome, neck, cheek], fill: { top: '#e6e8ea', bottom: '#8d9299' }, stroke: 'rgba(50,55,65,.75)', deco(c) { line(c, [[S(hx - hd), S(hy + 0.1)], [S(hx + hd * 0.95), S(hy + 0.1)]], 'rgba(255,255,255,.4)', S(0.012)); } });
    if (hel === 'crest') bodyLayers.push({ shapes: [P([[hx - hd * 0.9, hy + hd * 1.0], [hx - hd * 0.5, hy + hd * 1.55], [hx + hd * 0.1, hy + hd * 1.6], [hx + hd * 0.7, hy + hd * 1.55], [hx + hd * 0.95, hy + hd * 1.0], [hx + hd * 0.5, hy + hd * 1.12], [hx - hd * 0.1, hy + hd * 1.15]], 2)], fill: '#f3efe6', stroke: 'rgba(90,70,50,.6)', deco(c) { for (let i = 0; i < 9; i++) line(c, [[S(hx - hd * 0.8 + i * hd * 0.2), S(hy + hd * 1.1)], [S(hx - hd * 0.8 + i * hd * 0.2), S(hy + hd * 1.5)]], 'rgba(150,130,100,.5)', S(0.01)); } });
  } else if (hat === 'laurel') {
    const leaves = []; for (let i = 0; i < 10; i++) { const a = Math.PI * 0.95 - i * 0.28; leaves.push(blob(S(hx - 0.02 + Math.cos(a) * hr * 1.0), S(hy + 0.02 + Math.sin(a) * hr * 1.0), S(0.032), S(0.017), a + 1.5)); }
    bodyLayers.push({ shapes: leaves, fill: { top: '#8ab04a', bottom: '#4c7a2a' }, stroke: 'rgba(30,60,10,.65)' });
  } else if (hat === 'petasos') {
    bodyLayers.push({ shapes: [B(hx - 0.01, hy + 0.09, 0.2, 0.04), B(hx - 0.01, hy + 0.14, 0.09, 0.07)], fill: '#d8c28a', stroke: 'rgba(70,50,20,.65)' });
  } else if (hat === 'veil') {
    bodyLayers.push({ shapes: [P([[hx - hr * 1.15, hy + hr * 0.3], [hx - 0.02, hy + hr * 1.15], [hx + hr * 0.75, hy + hr * 0.5], [hx + hr * 0.5, hy - hr * 0.4], [hx - hr * 0.3, hy - hr * 1.4], [hx - hr * 1.25, hy - hr * 1.1]], 3)], fill: '#e8dcc0', stroke: 'rgba(80,60,30,.55)' });
  }
  if ((k.parts || {}).head) bodyLayers.push(...k.parts.head);
  parts.body = { z: 2, layers: bodyLayers };

  // ======================= SCHILD (vor dem Körper, an der fernen Hand)
  if (k.far) {
    if (k.far === 'scutum') {
      const sh = P([[-0.2, 1.2], [0.2, 1.2], [0.24, 0.6], [0.2, 0.15], [-0.2, 0.15], [-0.24, 0.6]], 2);
      parts.shield = { z: 2.6, pivot: [0.0, 0.7 * s], layers: [{ shapes: [sh.map(([x, y]) => [x + S(0.2), y])], fill: { top: '#c0392b', bottom: '#8e2418' }, stroke: 'rgba(50,10,10,.75)',
        deco(c, bb) { const cx = S(0.2), cy = S(0.66); dot(c, cx, cy, S(0.07), '#e8c35a', 1); dot(c, cx, cy, S(0.04), '#fff1b0', 1); line(c, [[cx, S(1.15)], [cx, S(0.2)]], '#e8c35a', S(0.03)); for (const dy of [0.45, -0.45]) { line(c, [[cx - S(0.14), cy + S(dy)], [cx + S(0.14), cy + S(dy)]], '#e8c35a', S(0.02)); } line(c, [[S(-0.0), S(1.2)], [S(0.4), S(1.2)], [S(0.44), S(0.6)], [S(0.4), S(0.15)], [S(0.0), S(0.15)], [S(-0.04), S(0.6)], [S(0.0), S(1.2)]], '#7a1a10', S(0.02)); } }] };
    } else if (k.far === 'oval') {
      parts.shield = { z: 2.6, pivot: [0.0, 0.8 * s], layers: [{ shapes: [B(0.18, 0.85, 0.24, 0.42)], fill: { top: '#a8683a', bottom: '#74401f' }, stroke: 'rgba(50,25,10,.75)', deco(c) { dot(c, S(0.18), S(0.85), S(0.07), '#d9d9d9'); line(c, [[S(0.18), S(1.25)], [S(0.18), S(0.45)]], '#e8c46a', S(0.03)); } }] };
    }
  }

  const id = o.id || ('person_' + (o.kind || 'buerger'));
  return {
    id, parts,
    anchors: { head: [hx * s, hy * s], mouth: [(hx + hr * 0.7) * s, (hy - hr * 0.5) * s], eye: [(hx + hr * 0.5) * s, (hy + hr * 0.12) * s], hand: [0.03 * s, 0.89 * s], hip: [0, 0.9 * s], foot: [0.1 * s, 0], back: [-0.15 * s, 1.2 * s] },
    meta: {
      name: o.name || id, lengthM: H, heightM: H,
      pivots: { legA: [0, 0.9 * s], legB: [0, 0.9 * s], armA: [0, 1.36 * s], armB: [0, 1.36 * s] },
      swing: { legA: [-0.5, 0.5], legB: [-0.5, 0.5], armA: [-0.45, 0.45], armB: [-0.45, 0.45] },
      ranges: { legA: [0, 0.5], legB: [0, -0.5], armA: [0, 2.4], armB: [0, 0.8], shield: [0, 0.15] },
    },
  };
}

// ---------------------------------------------------------------- Gegenstände in der nahen Hand (Handpunkt ≈ (0.03, 0.89), Arm hängt nach unten)
function heldItem(kind, s, k) {
  const L = (pts, per = 8) => limb(pts.map(([x, y, w]) => [x * s, y * s, (w || 0) * s]), { per });
  const P = (pts, sm = 0) => poly(pts.map(([x, y]) => [x * s, y * s]), sm);
  const B = (cx, cy, rx, ry = rx, rot = 0) => blob(cx * s, cy * s, rx * s, ry * s, rot, 28);
  const S = (v) => v * s;
  switch (kind) {
    case 'pilum': return [
      { shapes: [L([[0.04, 0.35, 0.03], [0.04, 1.45, 0.03]])], fill: '#8a5a34', stroke: 'rgba(40,20,8,.7)' },
      { shapes: [L([[0.04, 1.4, 0.016], [0.04, 2.0, 0.014]]), P([[0.02, 1.98], [0.06, 1.98], [0.04, 2.1]])], fill: '#aeb3ba', stroke: 'rgba(50,55,65,.75)' }];
    case 'staff': return [ // Rebstock des Zenturio
      { shapes: [L([[0.04, 0.5, 0.03], [0.04, 1.35, 0.03]])], fill: '#a8793f', stroke: 'rgba(40,20,8,.7)' }, { shapes: [B(0.04, 1.37, 0.04)], fill: '#d7b24a', stroke: 'rgba(90,60,10,.7)' }];
    case 'scroll': return [
      { shapes: [L([[0.03, 0.84, 0.07], [0.15, 1.04, 0.07]])], fill: '#f1e6c4', stroke: 'rgba(90,70,40,.7)' }, { shapes: [B(0.03, 0.84, 0.04), B(0.15, 1.04, 0.04)], fill: '#8a5a34', stroke: 'rgba(40,20,8,.7)' }];
    case 'tablet': return [{ shapes: [P([[0.0, 0.84], [0.2, 0.84], [0.2, 1.08], [0.0, 1.08]], 1)], fill: '#8a6a3a', stroke: 'rgba(40,20,8,.7)', deco(c) { for (let i = 0; i < 4; i++) line(c, [[S(0.03), S(0.9 + i * 0.045)], [S(0.17), S(0.9 + i * 0.045)]], 'rgba(60,30,10,.55)', S(0.01)); } }];
    case 'amphora': return [{ shapes: [P([[0.0, 0.6], [0.1, 0.6], [0.16, 0.78], [0.14, 0.98], [0.1, 1.06], [0.11, 1.18], [0.0, 1.18], [-0.01, 1.06], [-0.05, 0.98], [-0.06, 0.78]], 2), L([[0.1, 1.15, 0.025], [0.17, 1.05, 0.025], [0.14, 0.95, 0.025]])], fill: { top: '#c0703a', bottom: '#8a4a22' }, stroke: 'rgba(60,25,10,.7)', deco(c) { line(c, [[S(-0.05), S(0.9)], [S(0.15), S(0.9)]], 'rgba(60,25,10,.4)', S(0.012)); line(c, [[S(-0.04), S(0.72)], [S(0.15), S(0.72)]], 'rgba(60,25,10,.4)', S(0.012)); } }];
    case 'basket': return [{ shapes: [P([[-0.04, 0.6], [0.2, 0.6], [0.24, 0.84], [-0.08, 0.84]], 1)], fill: '#c9a25a', stroke: 'rgba(70,45,15,.7)', deco(c) { for (let i = 0; i < 5; i++) line(c, [[S(-0.06 + i * 0.07), S(0.6)], [S(-0.07 + i * 0.07), S(0.84)]], 'rgba(90,55,20,.45)', S(0.012)); } }];
    case 'torch': return [{ shapes: [L([[0.04, 0.5, 0.03], [0.04, 1.25, 0.03]])], fill: '#7a4a24', stroke: 'rgba(40,20,8,.7)' }, { shapes: [B(0.04, 1.34, 0.055, 0.09)], fill: { top: '#ffe08a', bottom: '#ff8a2a' }, stroke: 'rgba(120,40,0,.6)' }];
    case 'aquila': return [
      { shapes: [L([[0.04, 0.35, 0.03], [0.04, 2.0, 0.03]])], fill: '#8a5a34', stroke: 'rgba(40,20,8,.7)' },
      { shapes: [P([[0.04, 2.02], [-0.12, 2.08], [-0.2, 2.2], [-0.08, 2.17], [0.04, 2.22], [0.16, 2.17], [0.28, 2.2], [0.2, 2.08]], 1), B(0.04, 2.15, 0.045, 0.06), P([[0.04, 2.18], [0.1, 2.22], [0.08, 2.17]])], fill: { top: '#f3d57a', bottom: '#b98626' }, stroke: 'rgba(90,60,10,.75)' },
      { shapes: [P([[-0.04, 1.88], [0.12, 1.88], [0.12, 1.94], [-0.04, 1.94]])], fill: '#d7b24a', stroke: 'rgba(90,60,10,.7)' }];
    default: return [];
  }
}
export { heldItem };
