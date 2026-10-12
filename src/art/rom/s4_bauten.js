// Station 4 · „Vom Konsul zum Kaiser“: Bauten und Requisiten als Papierschnitt-Specs (Meter, Basis y=0, Mitte x=0).
//   tone 'abend' = Republik in der Dämmerung (links), 'morgen' = Anfang der Kaiserzeit im Morgenlicht (rechts).
//   Ids: s4_palast, s4_tempel, s4_kurie, s4_basilika, s4_werkstatt, s4_werkbank, s4_muenzstapel, s4_amboss, s4_sack, s4_fackel
import { blob, limb, poly } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { rectP, archWall, columnPoly, pediment, ashlar, marbleVeins, roofTiles, plaster, brickwork, woodGrain } from './_arch.js';
import { mulberry32 } from '../../engine/util.js';

export const PAL = {
  abend: {
    marble: { top: '#e6dcef', bottom: '#b3a3ca' }, marbleDark: '#8f7fae', vein: 'rgba(90,70,130,.26)', seam: 'rgba(70,50,110,.30)',
    wall: { top: '#d1b8bf', bottom: '#9d8398' }, brick: { top: '#c47a62', bottom: '#8f4f45' }, roof: '#a85450', roofLine: 'rgba(60,20,50,.35)',
    gold: '#d9b24a', door: '#40264a', dark: '#2f2145', tymp: '#4c3170', glow: '#ffc47a', shade: 'rgba(40,25,90,.20)', light: 'rgba(255,200,150,.16)',
  },
  morgen: {
    marble: { top: '#fffaf0', bottom: '#e5d8bc' }, marbleDark: '#c9b78e', vein: 'rgba(150,120,90,.22)', seam: 'rgba(120,95,60,.28)',
    wall: { top: '#f3dcc0', bottom: '#d9b38f' }, brick: { top: '#e0956c', bottom: '#b9684a' }, roof: '#cf6f3e', roofLine: 'rgba(110,40,20,.35)',
    gold: '#e8bc3c', door: '#6e2a3a', dark: '#5a2a3a', tymp: '#7b2d5b', glow: '#fff0b0', shade: 'rgba(120,60,30,.12)', light: 'rgba(255,248,210,.28)',
  },
};
const palOf = (o) => PAL[o.tone === 'abend' ? 'abend' : 'morgen'];

const rectDeco = (c, x0, y0, x1, y1, fill, stroke, lw = 0.02) => {
  const { ctx, S } = c; const [a, b] = c.tf(x0, y1), [d, e] = c.tf(x1, y0);
  ctx.save(); ctx.fillStyle = fill; ctx.fillRect(a, b, d - a, e - b);
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = Math.max(1, lw * S); ctx.strokeRect(a, b, d - a, e - b); }
  ctx.restore();
};
const arcDeco = (c, cx, cy, r, a0, a1, fill) => { const { ctx, S } = c; const [X, Y] = c.tf(cx, cy); ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(X, Y); ctx.arc(X, Y, r * S, -a1, -a0); ctx.closePath(); ctx.fill(); ctx.restore(); };
const spec = (id, name, layers, extra = {}) => ({ id, parts: { body: { z: 1, layers } }, anchors: extra.anchors || {}, meta: { name, ...(extra.meta || {}) } });

// Streifen mit Kannelur (senkrechte Rillen) auf Säulen
const flutes = (c, cx, y0, y1, w, col) => { for (const k of [-0.28, 0, 0.28]) line(c, [[cx + w * k, y0], [cx + w * k, y1]], col, 0.012); };
// Lichtkante links (Licht von links oben)
const sheen = (c, cx, y0, y1, w) => line(c, [[cx - w * 0.28, y0], [cx - w * 0.28, y1]], 'rgba(255,255,255,.55)', w * 0.2);

// ------------------------------------------------------------------------------------------------------- Tempel (Säulenhalle mit Giebel)
export function tempel(o = {}) {
  const P = palOf(o), n = o.n || 6, W = o.w || 3.6, hw = W / 2, colH = 2.3, y0 = 0.36;
  const cxs = Array.from({ length: n }, (_, i) => -hw + 0.28 + (i * (W - 0.56)) / (n - 1));
  const steps = [rectP(-hw - 0.22, 0, hw + 0.22, 0.18), rectP(-hw - 0.1, 0.18, hw + 0.1, y0)];
  const cella = [rectP(-hw + 0.2, y0, hw - 0.2, y0 + colH + 0.02)];
  const cols = cxs.flatMap((cx) => columnPoly(cx, y0, colH, 0.3));
  const yb = y0 + colH;
  const beam = [rectP(-hw - 0.08, yb, hw + 0.08, yb + 0.26), rectP(-hw - 0.14, yb + 0.26, hw + 0.14, yb + 0.4), pediment(-hw - 0.2, hw + 0.2, yb + 0.4, 0.78)];
  const acr = [blob(0, yb + 0.4 + 0.78 + 0.1, 0.13, 0.17, 0, 14), blob(-hw - 0.14, yb + 0.5, 0.1, 0.14, 0, 12), blob(hw + 0.14, yb + 0.5, 0.1, 0.14, 0, 12)];
  const layers = [
    { shapes: cella, fill: P.wall, deco(c, bb) { volume(c, bb); plaster(c, bb, { color: 'rgba(80,50,70,.12)', n: 90, seed: 3 }); rectDeco(c, -0.3, y0, 0.3, y0 + 1.5, P.door, 'rgba(0,0,0,.4)'); arcDeco(c, 0, y0 + 1.5, 0.3, 0, Math.PI, P.door); if (o.tone === 'abend') { dot(c, 0, y0 + 0.7, 0.2, P.glow, 0.25); } } },
    { shapes: steps, fill: P.marble, deco(c, bb) { volume(c, bb); line(c, [[bb.x0, 0.18], [bb.x1, 0.18]], P.seam, 0.016); } },
    { shapes: cols, fill: { stops: [[0, P.marble.bottom], [0.45, P.marble.top], [1, P.marble.bottom]], dir: 'h' }, deco(c, bb) { cxs.forEach((cx) => { flutes(c, cx, y0 + 0.15, yb - 0.18, 0.3, P.seam); sheen(c, cx, y0 + 0.12, yb - 0.16, 0.3); }); } },
    { shapes: beam, fill: P.marble,
      deco(c, bb) {
        volume(c, bb); marbleVeins(c, bb, { color: P.vein, n: 5, seed: 6 });
        const ty0 = yb + 0.44, ty1 = yb + 0.4 + 0.62;
        // Giebelfeld (Tympanon) mit goldener Scheibe
        const { ctx, tf } = c; ctx.save(); ctx.fillStyle = P.tymp; ctx.beginPath();
        const pts = [[-hw + 0.1, yb + 0.44], [hw - 0.1, yb + 0.44], [0, yb + 0.4 + 0.62]]; pts.forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.restore();
        dot(c, 0, yb + 0.7, 0.16, P.gold, 1); dot(c, 0, yb + 0.7, 0.09, '#fff2b8', 1);
        line(c, [[-hw - 0.08, yb + 0.26], [hw + 0.08, yb + 0.26]], P.gold, 0.02);
      } },
    { shapes: acr, fill: { top: '#f4d675', bottom: P.gold }, stroke: 'rgba(90,60,10,.6)' },
  ];
  return spec('s4_tempel', 'Tempel', layers, { anchors: { top: [0, yb + 1.3] } });
}

// ------------------------------------------------------------------------------------------------------- Kurie (Senatsgebäude, Backstein, schlicht)
export function kurie(o = {}) {
  const P = palOf(o), W = o.w || 3.8, hw = W / 2, H = 2.55;
  const body = [rectP(-hw, 0.2, hw, H), rectP(-hw - 0.12, 0, hw + 0.12, 0.2)];
  const gable = [rectP(-hw - 0.1, H, hw + 0.1, H + 0.2), poly([[-hw + 0.25, H + 0.2], [hw - 0.25, H + 0.2], [0, H + 0.82]], 0)];
  const door = [];
  const layers = [
    { shapes: body, fill: P.brick,
      deco(c, bb) {
        volume(c, bb); brickwork(c, bb, { brick: 'rgba(90,30,20,.30)', mortar: 'rgba(250,225,200,.42)', h: 0.1, w: 0.24, seed: 5 }); plaster(c, bb, { color: 'rgba(60,20,30,.14)', n: 140, seed: 8 });
        // Marmorsockel
        rectDeco(c, -hw - 0.12, 0, hw + 0.12, 0.62, P.marble.top, P.seam); line(c, [[-hw - 0.1, 0.62], [hw + 0.1, 0.62]], P.seam, 0.02);
        // große Bronzetür
        rectDeco(c, -0.5, 0.2, 0.5, 1.7, P.door, 'rgba(240,200,110,.9)', 0.035);
        for (let i = -1; i <= 1; i += 2) for (let j = 0; j < 4; j++) rectDeco(c, i * 0.24 - 0.17, 0.35 + j * 0.34, i * 0.24 + 0.17, 0.35 + j * 0.34 + 0.27, 'rgba(255,220,130,.16)', 'rgba(240,200,110,.55)', 0.012);
        if (o.tone === 'abend') { dot(c, 0, 0.95, 0.4, P.glow, 0.18); }
        // Fenster (Lichtschein)
        for (const sx of [-1, 1]) for (const wx of [0.95, 1.5]) { const x = sx * wx + sx * 0.0; rectDeco(c, x - 0.12, 1.45, x + 0.12, 2.1, o.tone === 'abend' ? '#ffd48a' : '#3b2c4a', 'rgba(250,235,200,.9)', 0.025); }
        // Stufen
        for (let k = 0; k < 3; k++) rectDeco(c, -0.85 - k * 0.05, k * 0.07, 0.85 + k * 0.05, k * 0.07 + 0.07, P.marble.top, P.seam, 0.01);
      } },
    { shapes: gable, fill: { top: P.marble.top, bottom: P.marble.bottom }, deco(c, bb) { volume(c, bb); dot(c, 0, H + 0.45, 0.14, P.gold, 1); dot(c, 0, H + 0.45, 0.07, '#fff2b8', 1); line(c, [[-hw - 0.1, H + 0.1], [hw + 0.1, H + 0.1]], P.gold, 0.02); } },
  ];
  return spec('s4_kurie', 'Kurie', layers, { anchors: { door: [0, 0.2] } });
}

// ------------------------------------------------------------------------------------------------------- Basilika (Bogenhalle, durchbrochen)
export function basilika(o = {}) {
  const P = palOf(o), n = o.n || 4, W = o.w || 4.0, hw = W / 2, H = 2.35;
  const wall = archWall(-hw, hw, 0.42, H, n, { open: 0.6, crown: 0.84 });
  const base = [rectP(-hw - 0.1, 0, hw + 0.1, 0.42)];
  const cornice = [rectP(-hw - 0.12, H, hw + 0.12, H + 0.22), rectP(-hw + 0.1, H + 0.22, hw - 0.1, H + 0.55)];
  const roof = [poly([[-hw - 0.2, H + 0.55], [hw + 0.2, H + 0.55], [hw - 0.35, H + 0.95], [-hw + 0.35, H + 0.95]], 0)];
  const layers = [
    { shapes: [...base, ...wall], fill: P.wall, deco(c, bb) { volume(c, bb); ashlar(c, bb, { tone: 'rgba(80,50,80,.12)', line: P.seam, h: 0.22, w: 0.5, seed: 4 }); plaster(c, bb, { color: 'rgba(60,30,60,.12)', n: 120, seed: 6 }); } },
    { shapes: cornice, fill: P.marble, deco(c, bb) { volume(c, bb); line(c, [[bb.x0, H + 0.22], [bb.x1, H + 0.22]], P.gold, 0.02); for (let i = 0; i < 16; i++) { const x = -hw + 0.3 + i * ((W - 0.6) / 15); rectDeco(c, x - 0.06, H + 0.28, x + 0.06, H + 0.5, P.marbleDark, null); } } },
    { shapes: roof, fill: P.roof, deco(c, bb) { volume(c, bb); roofTiles(c, bb, { a: P.roofLine, b: 'rgba(255,220,180,.22)', h: 0.1, w: 0.13 }); } },
  ];
  return spec('s4_basilika', 'Bogenhalle', layers);
}

// ------------------------------------------------------------------------------------------------------- Palast des ersten Kaisers (Blickfang, Morgenlicht)
export function palast(o = {}) {
  const P = palOf({ tone: 'morgen', ...o }), W = 7.0, hw = W / 2, colH = 2.6, y0 = 0.5, yb = y0 + colH;
  const pw = 2.15;                                     // halbe Breite der Säulenhalle
  const cxs = [-1.85, -1.1, -0.37, 0.37, 1.1, 1.85];
  // Seitenflügel mit Rundbogenfenstern (durchbrochen), links und rechts
  const wingL = [rectP(-hw, 0, -pw + 0.1, 0.78), ...archWall(-hw, -pw + 0.1, 0.78, 2.9, 2, { open: 0.5, crown: 0.82 })];
  const wingR = [rectP(pw - 0.1, 0, hw, 0.78), ...archWall(pw - 0.1, hw, 0.78, 2.9, 2, { open: 0.5, crown: 0.82 })];
  const wingRoofs = [poly([[-hw - 0.15, 2.9], [-pw + 0.2, 2.9], [-pw - 0.1, 3.38], [-hw + 0.3, 3.38]], 0), poly([[pw - 0.2, 2.9], [hw + 0.15, 2.9], [hw - 0.3, 3.38], [pw + 0.1, 3.38]], 0)];
  const stylobate = [rectP(-pw - 0.35, 0, pw + 0.35, 0.22), rectP(-pw - 0.2, 0.22, pw + 0.2, 0.36), rectP(-pw - 0.1, 0.36, pw + 0.1, y0)];
  const cella = [rectP(-pw + 0.12, y0, pw - 0.12, yb + 0.02)];
  const cols = cxs.flatMap((cx) => columnPoly(cx, y0, colH, 0.36));
  const beam = [rectP(-pw - 0.1, yb, pw + 0.1, yb + 0.3), rectP(-pw - 0.18, yb + 0.3, pw + 0.18, yb + 0.48), pediment(-pw - 0.28, pw + 0.28, yb + 0.48, 1.02)];
  const apex = yb + 0.48 + 1.02;
  const acr = [blob(0, apex + 0.16, 0.17, 0.22, 0, 16), blob(-pw - 0.2, yb + 0.62, 0.12, 0.18, 0, 12), blob(pw + 0.2, yb + 0.62, 0.12, 0.18, 0, 12),
    poly([[-0.07, apex + 0.3], [0.07, apex + 0.3], [0, apex + 0.62]], 0)];
  const layers = [
    { shapes: [...wingL, ...wingR], fill: P.wall, deco(c, bb) { volume(c, bb); ashlar(c, bb, { tone: 'rgba(120,80,60,.10)', line: P.seam, h: 0.26, w: 0.6, seed: 9 }); plaster(c, bb, { color: 'rgba(120,70,40,.12)', n: 140, seed: 4 }); } },
    { shapes: wingRoofs, fill: P.roof, deco(c, bb) { volume(c, bb); roofTiles(c, bb, { a: P.roofLine, b: 'rgba(255,230,190,.3)', h: 0.1, w: 0.13 }); } },
    { shapes: stylobate, fill: P.marble, deco(c, bb) { volume(c, bb); line(c, [[bb.x0, 0.22], [bb.x1, 0.22]], P.seam, 0.016); line(c, [[bb.x0, 0.36], [bb.x1, 0.36]], P.seam, 0.016); for (let i = -4; i <= 4; i++) line(c, [[i * 0.5, 0], [i * 0.5, 0.5]], 'rgba(120,95,60,.14)', 0.01); } },
    { shapes: cella, fill: P.wall,
      deco(c, bb) {
        volume(c, bb); plaster(c, bb, { color: 'rgba(120,70,40,.12)', n: 100, seed: 12 });
        // Tür mit Goldrahmen und rotem Vorhang
        rectDeco(c, -0.62, y0, 0.62, y0 + 1.75, P.door, P.gold, 0.05); arcDeco(c, 0, y0 + 1.75, 0.62, 0, Math.PI, P.door);
        { const { ctx, S } = c; const [X, Y] = c.tf(0, y0 + 1.75); ctx.save(); ctx.strokeStyle = P.gold; ctx.lineWidth = 0.05 * S; ctx.beginPath(); ctx.arc(X, Y, 0.62 * S, Math.PI, 0); ctx.stroke(); ctx.restore(); }
        for (const sx of [-1, 1]) { line(c, [[sx * 0.2, y0], [sx * 0.2, y0 + 2.3]], 'rgba(255,225,140,.25)', 0.02); }
        // purpurne Fahnen zwischen den Säulen
        for (const [a, b] of [[-1.85, -1.1], [1.1, 1.85]]) { const mx = (a + b) / 2; rectDeco(c, mx - 0.2, y0 + 0.9, mx + 0.2, yb - 0.08, '#7b2d5b', P.gold, 0.02); line(c, [[mx - 0.2, y0 + 0.9], [mx, y0 + 0.74], [mx + 0.2, y0 + 0.9]], P.gold, 0.03); dot(c, mx, y0 + 1.65, 0.1, P.gold, 1); }
      } },
    { shapes: cols, fill: { stops: [[0, P.marble.bottom], [0.4, P.marble.top], [1, P.marble.bottom]], dir: 'h' }, deco(c, bb) { cxs.forEach((cx) => { flutes(c, cx, y0 + 0.16, yb - 0.2, 0.36, P.seam); sheen(c, cx, y0 + 0.14, yb - 0.18, 0.36); }); } },
    { shapes: beam, fill: P.marble,
      deco(c, bb) {
        const { ctx, tf } = c;
        volume(c, bb); marbleVeins(c, bb, { color: P.vein, n: 7, seed: 8 });
        // Giebelfeld in Purpur mit Strahlenkranz (Morgensonne) und Lorbeerkranz
        ctx.save(); ctx.fillStyle = P.tymp; ctx.beginPath();
        [[-pw + 0.05, yb + 0.52], [pw - 0.05, yb + 0.52], [0, apex - 0.1]].forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); ctx.restore();
        const cy = yb + 0.95;
        for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; line(c, [[Math.cos(a) * 0.3, cy + Math.sin(a) * 0.3], [Math.cos(a) * 0.5, cy + Math.sin(a) * 0.5]], P.gold, 0.035, { alpha: 0.9 }); }
        dot(c, 0, cy, 0.27, P.gold, 1); dot(c, 0, cy, 0.19, '#fff0b0', 1);
        for (let i = 0; i < 9; i++) { const a = Math.PI * (0.55 + i * 0.1); dot(c, -1.1 + Math.cos(a) * 0.35 + 0.35, yb + 0.7 + Math.sin(a) * 0.2, 0.05, '#8ab04a', 0.9); dot(c, 1.1 - Math.cos(a) * 0.35 - 0.35, yb + 0.7 + Math.sin(a) * 0.2, 0.05, '#8ab04a', 0.9); }
        line(c, [[-pw - 0.1, yb + 0.3], [pw + 0.1, yb + 0.3]], P.gold, 0.03);
        for (let i = 0; i < 18; i++) { const x = -pw + 0.15 + i * ((2 * pw - 0.3) / 17); rectDeco(c, x - 0.05, yb + 0.04, x + 0.05, yb + 0.26, P.marbleDark, null); }
      } },
    { shapes: acr, fill: { top: '#f7dc7e', bottom: P.gold }, stroke: 'rgba(90,60,10,.65)' },
  ];
  return spec('s4_palast', 'Palast des Augustus', layers, { anchors: { door: [0, y0], top: [0, apex + 0.6] } });
}

// ------------------------------------------------------------------------------------------------------- Münzwerkstatt: Gerüst mit Dach (Markise), ohne Tisch
export function werkstatt(o = {}) {
  const W = 4.0, hw = W / 2, H = 3.0;
  const posts = [rectP(-hw, 0, -hw + 0.2, H), rectP(hw - 0.2, 0, hw, H)];
  const back = [rectP(-hw + 0.2, 0.4, hw - 0.2, H - 0.3)];
  const awning = [poly([[-hw - 0.25, H], [hw + 0.25, H], [hw + 0.1, H + 0.55], [-hw - 0.1, H + 0.55]], 0)];
  const valance = []; const n = 10; for (let i = 0; i < n; i++) { const x = -hw - 0.25 + ((W + 0.5) * (i + 0.5)) / n; valance.push(blob(x, H, (W + 0.5) / n / 2, 0.22, 0, 14)); }
  const layers = [
    { shapes: back, fill: { top: '#e9cfa6', bottom: '#cba57c' }, deco(c, bb) { volume(c, bb); plaster(c, bb, { color: 'rgba(120,70,40,.14)', n: 120, seed: 5 }); woodGrain(c, bb, { color: 'rgba(90,50,20,.12)', n: 10, seed: 3, vertical: true });
      // Regal mit Krügen und Säckchen
      for (const y of [1.45, 2.15]) { rectDeco(c, -hw + 0.3, y, hw - 0.3, y + 0.07, '#8a5a30', 'rgba(40,20,5,.5)', 0.012); }
      [[-1.3, 1.52], [-0.7, 1.52], [0.5, 1.52], [1.2, 1.52], [-1.0, 2.22], [0.2, 2.22], [1.0, 2.22]].forEach(([x, y], i) => { const r = 0.14 + (i % 3) * 0.02; dot(c, x, y + r * 0.9, r, i % 2 ? '#c0703a' : '#a85a2e', 1); rectDeco(c, x - 0.04, y + r * 1.7, x + 0.04, y + r * 2.1, i % 2 ? '#c0703a' : '#a85a2e', null); });
    } },
    { shapes: posts, fill: { top: '#a8793f', bottom: '#74481f' }, deco(c, bb) { volume(c, bb); woodGrain(c, bb, { color: 'rgba(40,20,5,.35)', n: 5, seed: 4, vertical: true }); } },
    { shapes: [...awning, ...valance], fill: '#7b2d5b',
      deco(c, bb) {
        const { ctx, tf, S } = c; ctx.save();
        for (let i = 0; i < 12; i++) { if (i % 2) continue; const x0 = bb.x0 + (bb.w * i) / 12, x1 = bb.x0 + (bb.w * (i + 1)) / 12; const [a, b] = tf(x0, bb.y1 + 0.1), [d, e] = tf(x1, bb.y0 - 0.1); ctx.fillStyle = '#f3e4c0'; ctx.fillRect(a, b, d - a, e - b); }
        ctx.restore(); volume(c, bb); line(c, [[bb.x0, H], [bb.x1, H]], '#e8bc3c', 0.03);
      } },
  ];
  return spec('s4_werkstatt', 'Münzwerkstatt', layers, { anchors: { signL: [-hw - 0.2, H - 0.4] } });
}

// ------------------------------------------------------------------------------------------------------- Werkbank mit offenem Unterbau (Platz für die Gans)
export function werkbank(o = {}) {
  const W = 2.5, hw = W / 2, TH = 1.02;
  const top = [rectP(-hw, TH - 0.12, hw, TH), rectP(-hw - 0.06, TH, hw + 0.06, TH + 0.06)];
  const legs = [rectP(-hw + 0.1, 0, -hw + 0.3, TH - 0.12), rectP(hw - 0.3, 0, hw - 0.1, TH - 0.12)];
  const rail = [rectP(-hw + 0.3, 0.3, hw - 0.3, 0.38)];
  const cloth = [poly([[-hw + 0.5, TH + 0.06], [-hw + 1.15, TH + 0.06], [-hw + 1.1, TH - 0.34], [-hw + 0.95, TH - 0.22], [-hw + 0.78, TH - 0.36], [-hw + 0.6, TH - 0.2], [-hw + 0.5, TH - 0.3]], 0)];
  const layers = [
    { shapes: legs.concat(rail), fill: { top: '#a8793f', bottom: '#6e431c' }, deco(c, bb) { volume(c, bb); woodGrain(c, bb, { color: 'rgba(40,20,5,.35)', n: 4, seed: 7, vertical: true }); } },
    { shapes: top, fill: { top: '#c8975a', bottom: '#8a5a30' }, deco(c, bb) { volume(c, bb); woodGrain(c, bb, { color: 'rgba(60,30,10,.35)', n: 3, seed: 2 }); } },
    { shapes: cloth, fill: '#7b2d5b', deco(c, bb) { line(c, [[bb.x0, bb.y1 - 0.02], [bb.x1, bb.y1 - 0.02]], '#e8bc3c', 0.03); for (let i = 0; i < 4; i++) line(c, [[bb.x0 + 0.1 + i * 0.16, bb.y1], [bb.x0 + 0.08 + i * 0.16, bb.y0]], 'rgba(40,0,30,.25)', 0.012); } },
  ];
  return spec('s4_werkbank', 'Werkbank', layers);
}

// ------------------------------------------------------------------------------------------------------- Denar-Stapel (Silbermünzen, sechs Säulchen)
export function muenzstapel(o = {}) {
  const cols = [[-0.3, 9], [-0.1, 6], [0.1, 11], [0.3, 4]];
  const shapes = []; const discs = [];
  for (const [cx, n] of cols) for (let i = 0; i < n; i++) { const e = blob(cx + ((i * 7 + cx * 10) % 3 - 1) * 0.006, 0.03 + i * 0.044, 0.095, 0.034, 0, 14); shapes.push(e); discs.push([cx, i]); }
  const layers = [{
    shapes, fill: { top: '#f4f6fa', bottom: '#aeb6c4' }, stroke: 'rgba(60,66,84,.8)',
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,50,80,.28)', light: 'rgba(255,255,255,.4)' });
      for (const [cx, n] of cols) for (let i = 0; i < n; i++) line(c, [[cx - 0.09, 0.03 + i * 0.044 - 0.012], [cx + 0.09, 0.03 + i * 0.044 - 0.012]], 'rgba(70,80,100,.55)', 0.007);
      for (const [cx, n] of cols) dot(c, cx - 0.04, 0.03 + (n - 1) * 0.044 + 0.012, 0.014, 'rgba(255,255,255,.9)', 1);
    },
  }];
  return spec('s4_muenzstapel', 'Denar-Stapel', layers, { anchors: { top: [0.1, 0.5] } });
}

// ------------------------------------------------------------------------------------------------------- Amboss auf Holzklotz
export function amboss(o = {}) {
  const block = [poly([[-0.2, 0], [0.2, 0], [0.18, 0.34], [-0.18, 0.34]], 1)];
  const iron = [poly([[-0.42, 0.52], [0.32, 0.52], [0.34, 0.44], [0.16, 0.4], [0.12, 0.34], [-0.12, 0.34], [-0.16, 0.4], [-0.3, 0.42]], 0), poly([[0.3, 0.52], [0.52, 0.5], [0.34, 0.45]], 0)];
  const layers = [
    { shapes: block, fill: { top: '#b0824a', bottom: '#74481f' }, deco(c, bb) { volume(c, bb); woodGrain(c, bb, { color: 'rgba(40,20,5,.4)', n: 4, seed: 3, vertical: true }); } },
    { shapes: iron, fill: { top: '#8d939d', bottom: '#454a54' }, stroke: 'rgba(20,25,35,.75)', deco(c, bb) { volume(c, bb); line(c, [[-0.38, 0.5], [0.3, 0.5]], 'rgba(255,255,255,.5)', 0.014); } },
  ];
  return spec('s4_amboss', 'Amboss', layers, { anchors: { face: [0, 0.52] } });
}

// ------------------------------------------------------------------------------------------------------- Geldsack
export function sack(o = {}) {
  const body = [poly([[-0.2, 0], [0.2, 0], [0.24, 0.2], [0.14, 0.38], [0.07, 0.46], [-0.07, 0.46], [-0.14, 0.38], [-0.24, 0.2]], 2)];
  const layers = [{ shapes: body, fill: { top: '#d9c08a', bottom: '#a8895a' }, stroke: 'rgba(70,45,15,.7)', deco(c, bb) { volume(c, bb); line(c, [[-0.1, 0.37], [0.1, 0.37]], '#6b4a2a', 0.03); line(c, [[-0.1, 0.34], [-0.14, 0.28]], '#6b4a2a', 0.02); dot(c, 0.03, 0.17, 0.07, 'rgba(255,255,255,.4)', 1); } }];
  return spec('s4_sack', 'Geldsack', layers);
}

// ------------------------------------------------------------------------------------------------------- Fackel an Holzstab (Dämmerung); die Flamme wird als Glühen in der Seite animiert
export function fackel(o = {}) {
  const pole = [limb([[0, 0, 0.07], [0, 1.6, 0.06]], { per: 3 })];
  const cup = [poly([[-0.14, 1.55], [0.14, 1.55], [0.09, 1.38], [-0.09, 1.38]], 1)];
  const flame = [blob(0, 1.78, 0.12, 0.25, 0, 18), blob(0, 1.7, 0.2, 0.17, 0, 18)];
  const layers = [
    { shapes: pole, fill: { top: '#9a6b38', bottom: '#5e3a18' } },
    { shapes: cup, fill: { top: '#b8862d', bottom: '#7a5418' }, stroke: 'rgba(60,35,5,.7)' },
    { shapes: flame, fill: { top: '#fff0a0', bottom: '#ff8a2a' }, stroke: 'rgba(160,50,0,.55)', deco(c, bb) { dot(c, 0, 1.74, 0.06, '#fffbe0', 0.9); } },
  ];
  return spec('s4_fackel', 'Fackel', layers, { anchors: { flame: [0, 1.78] } });
}
