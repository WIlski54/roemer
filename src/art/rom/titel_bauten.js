// Titelseite: Meilenstein, Zeitrad (Scheibe + Zeiger), Triumphbogen, Leier und die gemalten Flächen (Tor, Ausblick).
//   Alles als Papierschnitt-Parts für ctx.flat(...) (Meter, y nach oben, ws = 1) bzw. Canvas-Maler.
import { blob, poly, limb } from '../dsl.js';
import { line, dot } from '../paint.js';
import { rectP, archWall, ashlar, marbleVeins, plaster } from './_arch.js';
import { SERIF, RED, INK } from '../../engine/pagepaint.js';
import { ERAS, EVENTS, valueOfYear } from '../../data/zeit.js';

const TAU = Math.PI * 2;
export const GOLD = { top: '#f7e08e', mid: '#e3b946', bottom: '#b8862d' };
export const DISC = { R: 1.85, CY: 3.3 };           // Zeitrad: Radius und Mittelpunktshöhe (Modellraum)
export const BOGEN = { W: 5.4, H: 3.3, open: 0.48, crown: 0.86 };

// --------------------------------------------------------------------------------------------- Meilenstein (Pfeiler hinter dem Zeitrad)
export function meilensteinPart() {
  const shapes = [
    rectP(-1.18, 0, 1.18, 0.5), rectP(-0.92, 0.5, 0.92, 0.82),
    poly([[-0.62, 0.82], [0.62, 0.82], [0.52, 4.45], [-0.52, 4.45]]),
    rectP(-0.8, 4.45, 0.8, 4.66), rectP(-0.66, 4.66, 0.66, 4.78),
    blob(0, 5.08, 0.34, 0.34, 0, 32), poly([[-0.14, 4.78], [0.14, 4.78], [0.1, 4.9], [-0.1, 4.9]]),
  ];
  return {
    layers: [{
      shapes, fill: { stops: [[0, '#c7962f'], [0.28, '#f1d36f'], [0.5, '#fbe9a3'], [0.78, '#e1b440'], [1, '#b8862d']], dir: 'h' },
      deco(c, bb) {
        const { ctx, S, tf } = c;
        // Längsrillen und Glanz auf dem Schaft
        for (let i = -3; i <= 3; i++) line(c, [[i * 0.14, 0.9], [i * 0.125, 4.4]], 'rgba(120,80,15,.28)', 0.012);
        line(c, [[-0.3, 0.9], [-0.25, 4.4]], 'rgba(255,255,255,.45)', 0.05);
        // Sockel mit Schrift
        const [x, y] = tf(0, 0.25);
        ctx.fillStyle = 'rgba(100,60,10,.85)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `bold ${0.19 * S}px ${SERIF}`; ctx.fillText('MILIARIUM AUREUM', x, y);
        line(c, [[-1.0, 0.43], [1.0, 0.43]], 'rgba(120,80,15,.5)', 0.012);
        line(c, [[-1.0, 0.07], [1.0, 0.07]], 'rgba(120,80,15,.5)', 0.012);
        const [gx, gy] = tf(-0.1, 5.18); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(gx, gy, 0.1 * S, 0.07 * S, -0.5, 0, TAU); ctx.fill();
      },
    }],
  };
}

// --------------------------------------------------------------------------------------------- Zeitrad (Scheibe)
function arcText(ctx, txt, cx, cy, r, mid, size, bottom) {
  ctx.save(); ctx.font = `bold ${size}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const chars = [...txt], ws = chars.map((ch) => ctx.measureText(ch).width + size * 0.07), total = ws.reduce((a, b) => a + b, 0) / r;
  let a = bottom ? mid + total / 2 : mid - total / 2;
  chars.forEach((ch, i) => {
    const w = ws[i] / r, aa = bottom ? a - w / 2 : a + w / 2;
    ctx.save(); ctx.translate(cx + Math.cos(aa) * r, cy + Math.sin(aa) * r); ctx.rotate(bottom ? aa - Math.PI / 2 : aa + Math.PI / 2); ctx.fillText(ch, 0, 0); ctx.restore();
    a += bottom ? -w : w;
  });
  ctx.restore();
}
export const angleOfYear = (y) => valueOfYear(y) * TAU - Math.PI / 2; // 12 Uhr = 753 v. Chr., im Uhrzeigersinn

function zeitradFace(c) {
  const { ctx, S, tf } = c; const { R, CY } = DISC;
  const [cx, cy] = tf(0, CY);
  const ring = (r0, r1, a0, a1, col) => { ctx.beginPath(); ctx.arc(cx, cy, r1 * S, a0, a1, false); ctx.arc(cx, cy, r0 * S, a1, a0, true); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
  // Scheibe
  ctx.fillStyle = '#f7edd3'; ctx.beginPath(); ctx.arc(cx, cy, R * S, 0, TAU); ctx.fill();
  const g = ctx.createRadialGradient(cx, cy, 0.2 * S, cx, cy, R * S); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(1, 'rgba(120,80,30,.14)'); ctx.fillStyle = g; ctx.fill();
  // Goldrand
  ctx.lineWidth = 0.17 * S; ctx.strokeStyle = '#b8862d'; ctx.beginPath(); ctx.arc(cx, cy, (R - 0.085) * S, 0, TAU); ctx.stroke();
  ctx.lineWidth = 0.04 * S; ctx.strokeStyle = '#fff0b3'; ctx.beginPath(); ctx.arc(cx, cy, (R - 0.03) * S, 0, TAU); ctx.stroke();
  // Zeitalter-Ring (Farbe = Zeitalter), Beschriftung entlang des Bogens
  const r1 = R - 0.2, r0 = R - 0.66;
  for (const e of ERAS) {
    const a0 = angleOfYear(e.from), a1 = angleOfYear(e.to);
    ring(r0, r1, a0, a1, e.col);
    ctx.strokeStyle = 'rgba(255,245,215,.9)'; ctx.lineWidth = 0.03 * S; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * r0 * S, cy + Math.sin(a0) * r0 * S); ctx.lineTo(cx + Math.cos(a0) * r1 * S, cy + Math.sin(a0) * r1 * S); ctx.stroke();
    const mid = (a0 + a1) / 2, lower = Math.sin(mid) > 0.05;
    ctx.fillStyle = '#fff6df'; arcText(ctx, e.name, cx, cy, ((r0 + r1) / 2) * S, mid, 0.225 * S, lower);
  }
  ctx.strokeStyle = 'rgba(60,30,10,.55)'; ctx.lineWidth = 0.014 * S; ctx.beginPath(); ctx.arc(cx, cy, r1 * S, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, r0 * S, 0, TAU); ctx.stroke();
  // Striche: alle 50 Jahre kurz, alle 100 lang (Jahrhunderte)
  ctx.strokeStyle = INK;
  for (let y = -750; y <= 450; y += 50) {
    const a = angleOfYear(y), major = y % 100 === 0, len = major ? 0.2 : 0.11;
    ctx.lineWidth = (major ? 0.028 : 0.014) * S;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r0 - 0.03) * S, cy + Math.sin(a) * (r0 - 0.03) * S); ctx.lineTo(cx + Math.cos(a) * (r0 - 0.03 - len) * S, cy + Math.sin(a) * (r0 - 0.03 - len) * S); ctx.stroke();
  }
  // Zeitenwende (Jahr 1) und Anfang/Ende
  { const a = angleOfYear(1); ctx.strokeStyle = RED; ctx.lineWidth = 0.05 * S; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * (r0 - 0.03) * S, cy + Math.sin(a) * (r0 - 0.03) * S); ctx.lineTo(cx + Math.cos(a) * (r0 - 0.34) * S, cy + Math.sin(a) * (r0 - 0.34) * S); ctx.stroke();
    ctx.fillStyle = RED; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${0.14 * S}px ${SERIF}`; ctx.fillText('Jahr 1', cx + Math.cos(a) * (r0 - 0.47) * S, cy + Math.sin(a) * (r0 - 0.47) * S); }
  ctx.fillStyle = INK; ctx.font = `bold ${0.13 * S}px ${SERIF}`;
  { const a = angleOfYear(-753); ctx.fillText('753 v.', cx + Math.cos(a) * (r0 - 0.43) * S - 0.12 * S, cy + Math.sin(a) * (r0 - 0.43) * S); }
  { const a = angleOfYear(476); ctx.fillText('476 n.', cx + Math.cos(a) * (r0 - 0.43) * S + 0.12 * S, cy + Math.sin(a) * (r0 - 0.43) * S); }
  // Ereignis-Punkte (am Außenrand des Rings)
  for (const e of EVENTS) {
    const a = angleOfYear(e.y), rr = r1 + 0.1;
    ctx.fillStyle = '#ffd166'; ctx.strokeStyle = '#7a4a10'; ctx.lineWidth = 0.014 * S;
    ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr * S, cy + Math.sin(a) * rr * S, 0.065 * S, 0, TAU); ctx.fill(); ctx.stroke();
  }
  // Mitte
  const hg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 0.6 * S); hg.addColorStop(0, '#fff9e6'); hg.addColorStop(1, '#efe0b4');
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(cx, cy, 0.58 * S, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#b8862d'; ctx.lineWidth = 0.035 * S; ctx.beginPath(); ctx.arc(cx, cy, 0.58 * S, 0, TAU); ctx.stroke();
}
export function zeitradPart() {
  const { R, CY } = DISC;
  return { layers: [{ shapes: [blob(0, CY, R + 0.02, R + 0.02, 0, 96)], fill: '#f7edd3', deco: (c) => zeitradFace(c), stroke: null }] };
}
export function zeigerPart() {
  const L = DISC.R - 0.3;
  const hand = poly([[-0.075, -0.4], [0.075, -0.4], [0.055, L - 0.35], [0, L], [-0.055, L - 0.35]]);
  const hub = blob(0, 0, 0.17, 0.17, 0, 24);
  return { layers: [{ shapes: [hand, hub], fill: { top: '#e8402f', bottom: '#8d1111' }, stroke: 'rgba(40,0,0,.55)' }] };
}

// --------------------------------------------------------------------------------------------- Triumphbogen
export function bogenPart() {
  const { W, H, open, crown } = BOGEN, hw = W / 2;
  const shapes = [];
  shapes.push(...archWall(-hw, hw, 0, H, 1, { open, crown }));
  shapes.push(rectP(-hw - 0.18, H, hw + 0.18, H + 0.3));                 // Gebälk
  shapes.push(rectP(-hw + 0.38, H + 0.3, hw - 0.38, H + 1.05));          // Attika (mit SPQR)
  shapes.push(rectP(-hw + 0.2, H + 1.05, hw - 0.2, H + 1.2));            // Gesims
  // Quadriga (vereinfachte goldene Silhouette): Sockel, Wagen, vier Pferde
  const y0 = H + 1.2;
  shapes.push(rectP(-1.3, y0, 1.3, y0 + 0.12));
  shapes.push(poly([[-0.9, y0 + 0.12], [-0.2, y0 + 0.12], [-0.12, y0 + 0.62], [-0.95, y0 + 0.5]], 1));
  const horses = [];
  for (let i = 0; i < 4; i++) {
    const x = -0.05 + i * 0.36, yb = y0 + 0.12;
    horses.push(blob(x + 0.14, yb + 0.32, 0.22, 0.14, 0.05, 18));
    horses.push(limb([[x + 0.26, yb + 0.36, 0.17], [x + 0.4, yb + 0.58, 0.12], [x + 0.46, yb + 0.7, 0.1]], { per: 6 }));
    horses.push(blob(x + 0.51, yb + 0.72, 0.1, 0.06, -0.5, 12));
    horses.push(limb([[x + 0.06, yb + 0.22, 0.07], [x + 0.03, yb + 0.1, 0.05], [x + 0.03, yb, 0.04]], { per: 4 }));
    horses.push(limb([[x + 0.3, yb + 0.22, 0.07], [x + 0.33, yb + 0.1, 0.05], [x + 0.34, yb, 0.04]], { per: 4 }));
  }
  const q = { shapes: [...shapes.slice(-2), ...horses], fill: { top: '#f8e08a', bottom: '#c99a2e' }, stroke: 'rgba(90,60,10,.6)' };
  const body = shapes.slice(0, -2);
  const rr = (W - W * open) / 4 + W * open / 2; // Mitte der Pfeiler (Betrag)
  const ow = W * open, hwO = ow / 2, yc = H * crown, ys = yc - hwO;
  return {
    layers: [
      {
        shapes: body, fill: { top: '#f6f0e1', bottom: '#d9cfb8' },
        deco(c, bb) {
          const { ctx, S, tf } = c;
          ashlar(c, bb, { tone: 'rgba(90,70,50,.14)', line: 'rgba(80,65,45,.28)', h: 0.3, w: 0.62, seed: 7 });
          marbleVeins(c, bb, { color: 'rgba(120,115,140,.22)', n: 14, seed: 4 });
          plaster(c, bb, { color: 'rgba(120,100,70,.12)', n: 200, seed: 2 });
          // Halbsäulen vor den Pfeilern
          for (const sx of [-1, 1]) {
            const x = sx * (hwO + (hw0(W) - hwO) / 2), w = 0.5;
            const [px0, py0] = tf(x - w / 2, 0.15), [px1] = tf(x + w / 2, 0.15), [, py1] = tf(x, H - 0.05);
            const gr = ctx.createLinearGradient(px0, 0, px1, 0); gr.addColorStop(0, 'rgba(120,100,70,.55)'); gr.addColorStop(0.35, 'rgba(255,255,255,.65)'); gr.addColorStop(1, 'rgba(120,100,70,.5)');
            ctx.fillStyle = gr; ctx.fillRect(px0, py1, px1 - px0, py0 - py1);
            for (let k = -2; k <= 2; k++) line(c, [[x + k * 0.085, 0.2], [x + k * 0.085, H - 0.1]], 'rgba(90,70,40,.3)', 0.012);
            ctx.fillStyle = '#e9dcc0'; const [bx, by] = tf(x - 0.36, 0.15); ctx.fillRect(bx, by - 0.12 * S, 0.72 * S, 0.12 * S);
            const [cx2, cy2] = tf(x - 0.36, H - 0.05); ctx.fillRect(cx2, cy2 - 0.02 * S, 0.72 * S, 0.14 * S);
            // Relieffeld über dem Seitenbogen: kleine goldene Siegesgöttin als Zeichen (Kreis mit Kranz)
            dot(c, x, H - 0.75, 0.2, 'rgba(201,154,46,.75)', 1); dot(c, x, H - 0.75, 0.13, 'rgba(255,240,180,.8)', 1);
          }
          // Gebälk-Zierband
          const [gx0, gy0] = tf(-W / 2 - 0.18, H + 0.12); ctx.fillStyle = 'rgba(201,154,46,.85)'; ctx.fillRect(gx0, gy0, (W + 0.36) * S, 0.04 * S);
          // Attika mit Inschriftenfeld „SPQR“
          const ix0 = -W / 2 + 0.68, ix1 = W / 2 - 0.68, iy0 = H + 0.4, iy1 = H + 0.97;
          const [ax0, ay0] = tf(ix0, iy1), [ax1, ay1] = tf(ix1, iy0);
          ctx.fillStyle = '#6b2147'; ctx.fillRect(ax0, ay0, ax1 - ax0, ay1 - ay0);
          ctx.strokeStyle = '#e3b946'; ctx.lineWidth = 0.04 * S; ctx.strokeRect(ax0 + 0.03 * S, ay0 + 0.03 * S, ax1 - ax0 - 0.06 * S, ay1 - ay0 - 0.06 * S);
          ctx.fillStyle = '#f7e08e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `bold ${0.4 * S}px ${SERIF}`;
          const [tx, ty] = tf(0, (iy0 + iy1) / 2 - 0.02); ctx.fillText('S·P·Q·R', tx, ty);
          // Lorbeer-Medaillons links und rechts neben der Inschrift
          for (const sx of [-1, 1]) { dot(c, sx * (W / 2 - 0.5), H + 0.68, 0.17, '#e3b946', 1); dot(c, sx * (W / 2 - 0.5), H + 0.68, 0.11, '#6b2147', 1); }
        },
      },
      q,
    ],
  };
}
const hw0 = (W) => W / 2;

// --------------------------------------------------------------------------------------------- Leier (Musik-Karte)
export function leierPart() {
  const arm = (sx) => limb([[sx * 0.3, 0.42, 0.17], [sx * 0.52, 0.72, 0.13], [sx * 0.5, 1.12, 0.11], [sx * 0.34, 1.34, 0.1]], { per: 8 });
  const shapes = [blob(0, 0.3, 0.46, 0.3, 0, 28), arm(-1), arm(1), rectP(-0.46, 1.3, 0.46, 1.42), blob(-0.46, 1.36, 0.09, 0.09, 0, 10), blob(0.46, 1.36, 0.09, 0.09, 0, 10)];
  return {
    layers: [{
      shapes, fill: { top: '#f0c25a', bottom: '#a8641f' },
      deco(c) {
        for (let i = -3; i <= 3; i++) line(c, [[i * 0.115, 0.5], [i * 0.115, 1.3]], 'rgba(255,248,220,.95)', 0.014);
        dot(c, 0, 0.3, 0.13, 'rgba(70,35,10,.55)', 1); dot(c, 0, 0.3, 0.075, 'rgba(255,230,160,.5)', 1);
        line(c, [[-0.36, 0.14], [0.36, 0.14]], 'rgba(255,255,255,.35)', 0.03);
      },
    }],
  };
}

// --------------------------------------------------------------------------------------------- Tor (Flügel-Textur) und Ausblick hinter dem Tor
export function paintDoor(g, W, H) {
  g.fillStyle = '#b8862d'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(255,240,170,.35)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(60,30,0,.3)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const panel = (x, y, w, h) => { g.fillStyle = '#c99a3a'; g.fillRect(x, y, w, h); g.strokeStyle = '#f3d77a'; g.lineWidth = 3; g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.strokeStyle = '#6e4a10'; g.lineWidth = 2; g.strokeRect(x + 5, y + 5, w - 10, h - 10); };
  panel(W * 0.08, H * 0.04, W * 0.84, H * 0.26); panel(W * 0.08, H * 0.34, W * 0.84, H * 0.3); panel(W * 0.08, H * 0.68, W * 0.84, H * 0.27);
  g.fillStyle = '#fff1b0'; for (let i = 0; i < 12; i++) { const x = W * (0.14 + (i % 4) * 0.24), y = H * (0.1 + Math.floor(i / 4) * 0.3); g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  g.fillStyle = '#7a4a10'; g.beginPath(); g.arc(W * 0.9, H * 0.5, 9, 0, TAU); g.fill(); g.strokeStyle = '#f3d77a'; g.lineWidth = 3; g.stroke();
}
export function paintAusblick(g, W, H) {
  const sky = g.createLinearGradient(0, 0, 0, H * 0.72); sky.addColorStop(0, '#6a4a8a'); sky.addColorStop(0.5, '#e07a5a'); sky.addColorStop(1, '#ffd48a');
  g.fillStyle = sky; g.fillRect(0, 0, W, H);
  const sun = g.createRadialGradient(W * 0.5, H * 0.66, 0, W * 0.5, H * 0.66, W * 0.5); sun.addColorStop(0, 'rgba(255,248,190,1)'); sun.addColorStop(0.2, 'rgba(255,225,140,.8)'); sun.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, H);
  g.fillStyle = '#7b4c5c'; g.fillRect(0, H * 0.7, W, H * 0.3);
  // Silhouetten der Stadt am Horizont
  g.fillStyle = '#5a2a4a';
  g.fillRect(W * 0.12, H * 0.6, W * 0.1, H * 0.1); g.fillRect(W * 0.16, H * 0.56, W * 0.02, H * 0.04);
  g.beginPath(); g.arc(W * 0.3, H * 0.65, W * 0.065, Math.PI, 0); g.fill(); g.fillRect(W * 0.235, H * 0.65, W * 0.13, H * 0.05);
  g.fillRect(W * 0.62, H * 0.63, W * 0.26, H * 0.07); g.fillStyle = 'rgba(255,214,140,.55)'; for (let i = 0; i < 7; i++) g.fillRect(W * (0.635 + i * 0.034), H * 0.645, W * 0.016, H * 0.035);
  g.fillStyle = '#4a2040'; for (const x of [0.08, 0.45, 0.58, 0.9]) { g.beginPath(); g.ellipse(W * x, H * 0.66, W * 0.012, H * 0.05, 0, 0, TAU); g.fill(); }
  // Straße, die sich in die Tiefe verjüngt
  g.fillStyle = '#e4cd98'; g.beginPath(); g.moveTo(W * 0.46, H * 0.7); g.lineTo(W * 0.54, H * 0.7); g.lineTo(W * 0.9, H); g.lineTo(W * 0.1, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(120,80,40,.45)'; g.lineWidth = 2;
  for (let i = 1; i <= 7; i++) { const t = (i / 8) ** 1.7, y = H * (0.7 + 0.3 * t), hw = W * (0.04 + 0.4 * t); g.beginPath(); g.moveTo(W * 0.5 - hw, y); g.lineTo(W * 0.5 + hw, y); g.stroke(); }
  g.strokeStyle = 'rgba(255,245,205,.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(W * 0.46, H * 0.7); g.lineTo(W * 0.1, H); g.moveTo(W * 0.54, H * 0.7); g.lineTo(W * 0.9, H); g.stroke();
}
