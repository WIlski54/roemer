// Station 7: Bemalungen (Canvas) für Schaubild Kalkkreislauf, Bildfolge „Beton“, Gefälle-Schild, Straßenlagen und Wasser.
import { roundRect, SERIF, formula } from './_p7_kit.js';
import { mulberry32, TAU, clamp } from '../engine/util.js';

const INK = '#3a2615', RED = '#8B1E1E', GOLD = '#b8862d';

// ================================================================= Kalkkreislauf (flach auf die Seite gelegte Karte)
export const KALK = { w: 5.0, d: 2.3, W: 1600, H: 736 };
// Wege der Murmel (Pixel auf der Karte), je ein Stück pro Pfeil: Brennen -> Löschen -> Abbinden
export const KALK_SEGS = [
  { pts: [[618, 218], [986, 218]], col: '#ff8a3a' },
  { pts: [[1290, 340], [1290, 500]], col: '#4aa6e0' },
  { pts: [[996, 610], [310, 610], [310, 340]], col: '#b9b4a6' },
];
const segLen = (pts) => { let l = 0; for (let i = 0; i < pts.length - 1; i++) l += Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); return l; };
const KALK_L = KALK_SEGS.map((sg) => segLen(sg.pts)), KALK_T = KALK_L.reduce((a, b) => a + b, 0);
// Ort der Murmel bei Fortschritt u (0..1): { x, y, col, k } mit k = Sichtbarkeit (an den Enden der Pfeile blendet sie aus)
export function kalkAt(u) {
  let d = (((u % 1) + 1) % 1) * KALK_T, i = 0; while (i < KALK_L.length - 1 && d > KALK_L[i]) { d -= KALK_L[i]; i++; }
  const pts = KALK_SEGS[i].pts; let k = 0; for (; k < pts.length - 2; k++) { const l = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); if (d <= l) break; d -= l; }
  const a = pts[k], b = pts[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, q = clamp(d / l);
  const vis = clamp(Math.min(u2(d, k, pts, KALK_L[i]), 1));
  return { x: a[0] + (b[0] - a[0]) * q, y: a[1] + (b[1] - a[1]) * q, col: KALK_SEGS[i].col, k: vis };
}
function u2(d, k, pts, total) { let before = 0; for (let j = 0; j < k; j++) before += Math.hypot(pts[j + 1][0] - pts[j][0], pts[j + 1][1] - pts[j][1]); const pos = before + d; return Math.min(pos, total - pos) / 60; }

function node(g, x, y, w, h, fill, edge, name, f) {
  g.save(); g.shadowColor = 'rgba(60,40,15,.3)'; g.shadowBlur = 8; g.shadowOffsetY = 4; g.fillStyle = fill; roundRect(g, x, y, w, h, 26); g.fill(); g.restore();
  g.strokeStyle = edge; g.lineWidth = 6; roundRect(g, x, y, w, h, 26); g.stroke();
  g.fillStyle = INK; g.font = `bold 58px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(name, x + w / 2, y + 62);
  formula(g, f, x + w / 2, y + 160, 98, { align: 'center', color: RED });
}
function arrow(g, pts, color, lw = 14) {
  g.save(); g.strokeStyle = color; g.fillStyle = color; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[pts.length - 2], a = Math.atan2(y1 - y0, x1 - x0), L = 40;
  g.beginPath(); g.moveTo(x1 + Math.cos(a) * 8, y1 + Math.sin(a) * 8); g.lineTo(x1 - Math.cos(a - 0.5) * L, y1 - Math.sin(a - 0.5) * L); g.lineTo(x1 - Math.cos(a + 0.5) * L, y1 - Math.sin(a + 0.5) * L); g.closePath(); g.fill(); g.restore();
}
function badge(g, x, y, n, col) {
  g.save(); g.fillStyle = col; g.beginPath(); g.arc(x, y, 30, 0, TAU); g.fill(); g.strokeStyle = '#fff4d0'; g.lineWidth = 5; g.stroke();
  g.fillStyle = '#fff'; g.font = `bold 38px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(n), x, y + 2); g.restore();
}
export function drawKalk(g, W, H) {
  g.clearRect(0, 0, W, H);
  g.save(); g.shadowColor = 'rgba(40,25,10,.4)'; g.shadowBlur = 16; g.shadowOffsetY = 6; g.fillStyle = '#fbf3da'; roundRect(g, 10, 10, W - 20, H - 20, 36); g.fill(); g.restore();
  g.strokeStyle = GOLD; g.lineWidth = 6; roundRect(g, 10, 10, W - 20, H - 20, 36); g.stroke();
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillStyle = RED; g.font = `bold italic 80px ${SERIF}`; g.fillText('Der Kalkkreislauf', 52, 100);
  // Warnschild (oben rechts)
  g.save(); g.fillStyle = '#fff1d6'; g.strokeStyle = '#b5382a'; g.lineWidth = 5; roundRect(g, 860, 30, 710, 84, 24); g.fill(); g.stroke(); g.restore();
  g.fillStyle = '#c4382a'; g.beginPath(); g.moveTo(912, 46); g.lineTo(950, 100); g.lineTo(874, 100); g.closePath(); g.fill();
  g.fillStyle = '#fff'; g.font = `bold 34px ${SERIF}`; g.textAlign = 'center'; g.fillText('!', 912, 94);
  g.fillStyle = '#9a2418'; g.font = `bold 48px ${SERIF}`; g.textAlign = 'left'; g.fillText('Nicht zu Hause nachmachen!', 972, 87);
  // Stoffe
  node(g, 30, 130, 560, 180, '#e4ded0', '#8f887a', 'Kalkstein', 'CaCO3');
  node(g, 1010, 130, 560, 180, '#f7ecd0', '#e08a3a', 'gebrannter Kalk', 'CaO');
  node(g, 1010, 520, 560, 180, '#f4f6f3', '#4aa6e0', 'gelöschter Kalk', 'Ca(OH)2');
  // 1 Brennen
  formula(g, 'CO2 entweicht', 802, 176, 52, { align: 'center', color: '#5a6a78', bold: false });
  arrow(g, [[610, 218], [990, 218]], '#e0702a');
  badge(g, 672, 284, 1, '#e0702a'); g.fillStyle = INK; g.font = `bold 70px ${SERIF}`; g.textAlign = 'left'; g.fillText('Brennen', 712, 308);
  g.font = `italic 50px ${SERIF}`; g.fillStyle = '#6b4a2a'; g.textAlign = 'center'; g.fillText('etwa 900 °C', 802, 360);
  // 2 Löschen
  arrow(g, [[1290, 332], [1290, 508]], '#2f86c4');
  g.font = `bold 70px ${SERIF}`; const tw2 = g.measureText('Löschen').width; g.fillStyle = INK; g.textAlign = 'right'; g.fillText('Löschen', 1252, 420);
  badge(g, 1252 - tw2 - 42, 398, 2, '#2f86c4');
  g.font = `bold 50px ${SERIF}`; const twW = g.measureText('viel Wärme!').width; g.fillStyle = RED; g.fillText('viel Wärme!', 1252, 484);
  g.font = `italic 50px ${SERIF}`; g.fillStyle = '#6b4a2a'; g.fillText('+ Wasser,', 1252 - twW - 16, 484);
  // 3 Abbinden
  arrow(g, [[1000, 610], [310, 610], [310, 338]], '#8c8f94');
  badge(g, 378, 392, 3, '#7b8087'); g.fillStyle = INK; g.font = `bold 70px ${SERIF}`; g.textAlign = 'left'; g.fillText('Abbinden', 418, 416);
  formula(g, '+ CO2 aus der Luft', 350, 478, 50, { color: '#6b4a2a', bold: false });
  g.fillStyle = '#6b4a2a'; g.font = `italic 50px ${SERIF}`; g.textAlign = 'left'; g.fillText('dauert lange', 350, 534);
}

// ================================================================= Bildfolge „Beton“: Kalk + Vulkanasche + Wasser = Mörtel
export const BETON = { w: 4.95, d: 1.1, W: 1584, H: 352 };
const LUMPS = [[-70, 40, 40], [-20, 52, 36], [30, 44, 42], [-45, 6, 34], [10, 10, 38], [60, 8, 30], [-12, -26, 32]];
function lump(g, x, y, r, seed) {
  const rr = mulberry32(seed); g.beginPath();
  for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU, d = r * (0.78 + rr() * 0.3); g.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.85); }
  g.closePath(); g.fillStyle = '#fbf8ef'; g.fill(); g.strokeStyle = '#a49d8c'; g.lineWidth = 4; g.stroke();
  g.strokeStyle = 'rgba(160,150,130,.5)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - r * 0.3, y - r * 0.1); g.lineTo(x + r * 0.2, y + r * 0.3); g.stroke();
}
export function drawBeton(g, W, H, v) {
  g.clearRect(0, 0, W, H);
  const tw = 350, gap = 45, x0 = (W - (4 * tw + 3 * gap)) / 2, y0 = 18, th = H - 36;
  const caps = ['Kalk', 'Vulkanasche', 'Wasser', 'Mörtel'];
  for (let i = 0; i < 4; i++) {
    const a = clamp(v * 4 - i), x = x0 + i * (tw + gap), cx = x + tw / 2, now = a > 0 && a < 1;
    g.save(); g.shadowColor = now ? 'rgba(255,200,60,.9)' : 'rgba(40,25,10,.35)'; g.shadowBlur = now ? 22 : 10; g.shadowOffsetY = 4;
    g.fillStyle = a > 0 ? '#fbf3da' : 'rgba(251,243,218,.6)'; roundRect(g, x, y0, tw, th, 28); g.fill(); g.restore();
    g.strokeStyle = a >= 1 ? '#5a9a4a' : GOLD; g.lineWidth = a >= 1 ? 7 : 5; roundRect(g, x, y0, tw, th, 28); g.stroke();
    g.save(); g.globalAlpha = a > 0 ? 1 : 0.38; g.translate(cx, y0 + 130);
    if (i === 0) { // gebrannter Kalk: weiße Brocken
      const n = Math.ceil(a * LUMPS.length); for (let k = 0; k < n; k++) { const [lx, ly, lr] = LUMPS[k]; lump(g, lx, ly, lr * (k === n - 1 ? 0.5 + 0.5 * ((a * LUMPS.length) % 1 || 1) : 1), k + 3); }
    } else if (i === 1) { // Vulkanasche: kleiner Vulkan, grauer Aschehaufen
      g.fillStyle = '#7b6a60'; g.beginPath(); g.moveTo(-120, 70); g.lineTo(-62, -40); g.lineTo(-40, -40); g.lineTo(18, 70); g.closePath(); g.fill(); g.strokeStyle = '#4a3a32'; g.lineWidth = 4; g.stroke();
      g.fillStyle = '#ff7a2a'; g.beginPath(); g.ellipse(-51, -40, 12, 6, 0, 0, TAU); g.fill();
      const s = 0.25 + 0.75 * a; g.fillStyle = '#6f7074'; g.beginPath(); g.moveTo(10, 78); g.quadraticCurveTo(70, 78 - 118 * s, 128, 78); g.closePath(); g.fill(); g.strokeStyle = '#3b3c40'; g.lineWidth = 4; g.stroke();
      const r = mulberry32(5); g.fillStyle = '#9a9ba0'; for (let k = 0; k < 24 * a; k++) { g.beginPath(); g.arc(20 + r() * 100, 78 - r() * 70 * s, 3 + r() * 2, 0, TAU); g.fill(); }
      if (a < 1) { g.fillStyle = 'rgba(120,120,125,.55)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(-48 + k * 6, -58 - k * 20 + (a * 20) % 6, 10 + k * 5, 0, TAU); g.fill(); } }
    } else if (i === 2) { // Wasser: Tropfen und Welle
      g.fillStyle = '#4aa6e0'; g.strokeStyle = '#2a76ac'; g.lineWidth = 4;
      for (let k = 0; k < 3; k++) { const dy = ((a * 3 + k * 0.33) % 1) * 60; g.save(); g.translate(-60 + k * 60, -50 + dy); g.beginPath(); g.moveTo(0, -30); g.quadraticCurveTo(26, 6, 0, 22); g.quadraticCurveTo(-26, 6, 0, -30); g.fill(); g.stroke(); g.restore(); }
      g.fillStyle = '#6cc0ea'; g.beginPath(); g.moveTo(-110, 90); for (let k = 0; k <= 11; k++) g.lineTo(-110 + k * 20, 60 + Math.sin(k * 1.3 + a * 6) * 8); g.lineTo(110, 90); g.closePath(); g.fill(); g.stroke();
    } else { // Mörtel in der Wanne
      g.fillStyle = '#b98a52'; g.strokeStyle = '#6b4a2a'; g.lineWidth = 4; g.beginPath(); g.moveTo(-90, 20); g.lineTo(90, 20); g.lineTo(76, 90); g.lineTo(-76, 90); g.closePath(); g.fill(); g.stroke();
      g.fillStyle = a > 0 ? `hsl(40,${14 - 6 * a}%,${70 - 14 * a}%)` : '#5f4228'; g.beginPath(); g.ellipse(0, 20, 90, 22, 0, 0, TAU); g.fill(); g.stroke();
      if (a > 0.3) { g.strokeStyle = 'rgba(80,70,60,.6)'; g.lineWidth = 4; g.beginPath(); g.ellipse(0, 20, 50 * a, 10 * a, 0, 0.3, 4.6); g.stroke(); }
      if (a >= 1) { g.fillStyle = '#ffd84a'; for (const [sx, sy] of [[-86, -22], [88, -10], [4, -40]]) { g.save(); g.translate(sx, sy); g.rotate(0.6); g.fillRect(-3, -14, 6, 28); g.fillRect(-14, -3, 28, 6); g.restore(); } }
    }
    g.restore();
    g.fillStyle = a > 0 ? INK : 'rgba(58,38,21,.5)'; g.font = `bold 62px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(caps[i], cx, y0 + th - 34);
    if (a >= 1) { g.fillStyle = '#5a9a4a'; g.font = `bold 52px ${SERIF}`; g.textAlign = 'right'; g.fillText('✓', x + tw - 20, y0 + 56); }
    if (i < 3) { g.fillStyle = a >= 1 ? RED : 'rgba(139,30,30,.35)'; g.font = `bold 76px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(i === 2 ? '=' : '+', x + tw + gap / 2, y0 + th / 2 - 8); }
  }
}

// ================================================================= Schild zum Gefälle (ändert sich mit dem Regler)
export const SIGN = { w: 5.0, d: 0.9, W: 1600, H: 288 };
const SIGN_TXT = [['Kein Gefälle: Das Wasser steht.', '#8a8f94'], ['Wenig Gefälle: Es fließt langsam.', '#3f8fc0'], ['Mehr Gefälle: Es fließt schnell.', '#2a76ac']];
export function drawSign(g, W, H, state) {
  g.clearRect(0, 0, W, H); const [txt, col] = SIGN_TXT[state];
  g.save(); g.shadowColor = 'rgba(40,25,10,.35)'; g.shadowBlur = 12; g.shadowOffsetY = 5; g.fillStyle = '#fbf3da'; roundRect(g, 10, 10, W - 20, H - 20, 40); g.fill(); g.restore();
  g.strokeStyle = col; g.lineWidth = 9; roundRect(g, 10, 10, W - 20, H - 20, 40); g.stroke();
  // kleines Symbol: schräge Rinne mit Tropfen
  g.save(); g.translate(120, H / 2); g.strokeStyle = col; g.lineWidth = 14; g.lineCap = 'round'; g.beginPath(); g.moveTo(-60, state ? -26 : 0); g.lineTo(60, state ? 26 : 0); g.stroke();
  g.fillStyle = col; g.beginPath(); g.moveTo(10, state ? -78 : -70); g.quadraticCurveTo(34, state ? -48 : -40, 10, state ? -28 : -20); g.quadraticCurveTo(-14, state ? -48 : -40, 10, state ? -78 : -70); g.fill(); g.restore();
  g.fillStyle = INK; g.font = `bold 76px ${SERIF}`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(txt, 220, 130);
  g.fillStyle = '#7a5a3a'; g.font = `italic 50px ${SERIF}`; g.fillText('Im Bild stark übertrieben: Römer brauchten nur ganz wenig.', 220, 214);
}

// ================================================================= Lagen der Straße
export const LAGEN = [
  { id: 'statumen', h: 0.55, lines: ['statumen', 'faustgroße Steine'] },
  { id: 'rudus', h: 0.46, lines: ['rudus', 'Steinbrocken mit Kalk'] },
  { id: 'nucleus', h: 0.4, lines: ['nucleus · feiner'] },
  { id: 'pavimentum', h: 0.34, lines: ['pavimentum · Platten'] },
];
export function drawSlab(g, W, H, kind) {
  const r = mulberry32(kind * 17 + 3);
  if (kind === 0) { // große, faustgroße Steine
    g.fillStyle = '#7d776c'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 90; k++) { const x = r() * W, y = r() * H, rx = 16 + r() * 14, ry = rx * (0.7 + r() * 0.3); g.fillStyle = `hsl(${30 + r() * 15},${6 + r() * 8}%,${48 + r() * 22}%)`; g.beginPath(); g.ellipse(x, y, rx, ry, r() * 3, 0, TAU); g.fill(); g.strokeStyle = 'rgba(50,45,38,.65)'; g.lineWidth = 3; g.stroke(); }
  } else if (kind === 1) { // Steinbrocken mit Kalkmörtel
    g.fillStyle = '#e4dccb'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 120; k++) { const x = r() * W, y = r() * H, s = 8 + r() * 12; g.fillStyle = `hsl(${28 + r() * 14},${6 + r() * 8}%,${52 + r() * 18}%)`; g.beginPath(); for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU; g.lineTo(x + Math.cos(a) * s * (0.8 + r() * 0.4), y + Math.sin(a) * s * (0.7 + r() * 0.4)); } g.closePath(); g.fill(); g.strokeStyle = 'rgba(70,60,48,.55)'; g.lineWidth = 2; g.stroke(); }
  } else if (kind === 2) { // feinere Schicht
    g.fillStyle = '#d9ccaa'; g.fillRect(0, 0, W, H);
    for (let k = 0; k < 520; k++) { const x = r() * W, y = r() * H; g.fillStyle = `hsl(${32 + r() * 16},${10 + r() * 14}%,${48 + r() * 30}%)`; g.beginPath(); g.arc(x, y, 2 + r() * 4, 0, TAU); g.fill(); }
  } else { // Platten
    g.fillStyle = '#bdb8ab'; g.fillRect(0, 0, W, H);
    let x = 0, row = 0; while (x < W) { const w = 70 + r() * 50; g.fillStyle = `hsl(${40 + r() * 10},${6 + r() * 6}%,${66 + r() * 10}%)`; g.fillRect(x + 2, 4, w - 4, H - 8); g.strokeStyle = 'rgba(70,62,50,.55)'; g.lineWidth = 3; g.strokeRect(x + 2, 4, w - 4, H - 8); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(x + 8, 10); g.lineTo(x + w - 10, 10); g.stroke(); x += w; row++; }
  }
  g.strokeStyle = 'rgba(40,30,20,.65)'; g.lineWidth = 4; g.strokeRect(0, 0, W, H);
  // Schild mit Namen
  const L = LAGEN[kind].lines, ph = L.length > 1 ? H * 0.88 : H * 0.8, pw = Math.min(W * 0.84, 480);
  g.save(); g.shadowColor = 'rgba(30,20,10,.45)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.fillStyle = 'rgba(251,243,218,.95)'; roundRect(g, W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 16); g.fill(); g.restore();
  g.strokeStyle = GOLD; g.lineWidth = 3; roundRect(g, W / 2 - pw / 2, H / 2 - ph / 2, pw, ph, 16); g.stroke();
  g.textAlign = 'center'; g.textBaseline = 'middle';
  if (L.length > 1) { g.fillStyle = INK; g.font = `bold ${Math.round(H * 0.38)}px ${SERIF}`; g.fillText(L[0], W / 2, H / 2 - H * 0.17); g.fillStyle = '#6b4a2a'; g.font = `italic ${Math.round(H * 0.22)}px ${SERIF}`; g.fillText(L[1], W / 2, H / 2 + H * 0.2); }
  else { g.fillStyle = INK; g.font = `bold ${Math.round(H * 0.5)}px ${SERIF}`; g.fillText(L[0], W / 2, H / 2 + 2); }
}

// ================================================================= Wasser im Rinnenfenster
export function drawChannelBack(g, W, H) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#46606c'); gr.addColorStop(1, '#2a3a44'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(210,225,230,.12)'; g.lineWidth = 2; for (let y = 14; y < H; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const r = mulberry32(4); for (let k = 0; k < 60; k++) { g.fillStyle = 'rgba(180,200,210,.10)'; g.fillRect(r() * W, r() * H, 20 + r() * 40, 5); }
}
export function drawFloor(g, W, H) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#c9bea4'); gr.addColorStop(0.15, '#b6aa8e'); gr.addColorStop(1, '#8c8168'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(70,58,40,.45)'; g.lineWidth = 3; for (let x = 0; x < W; x += 56) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  g.strokeStyle = 'rgba(255,250,225,.45)'; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 3); g.lineTo(W, 3); g.stroke();
}
export function drawWaterBody(g, W, H) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#7fcbec'); gr.addColorStop(0.5, '#4aa0d2'); gr.addColorStop(1, '#2f7ab0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 2); g.lineTo(W, 2); g.stroke();
  const r = mulberry32(9); g.strokeStyle = 'rgba(20,70,120,.22)'; g.lineWidth = 2; for (let k = 0; k < 40; k++) { const x = r() * W, y = 6 + r() * (H - 10); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 40, y); g.stroke(); }
}
export function drawFall(g, W, H) {
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#5aaee0'); gr.addColorStop(0.5, '#cfeeff'); gr.addColorStop(1, '#5aaee0'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = mulberry32(2); for (let k = 0; k < 26; k++) { const x = 4 + r() * (W - 8), y = r() * H, l = 14 + r() * 40; g.strokeStyle = r() > 0.5 ? 'rgba(255,255,255,.9)' : 'rgba(40,120,180,.5)'; g.lineWidth = 2 + r() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + l); g.stroke(); }
}
