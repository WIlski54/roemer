// Malerei für das Schaukasten-Fossil von Station 3 (Solnhofen): Steinplatte mit Strichzeichnung des Urvogel-Skeletts,
// Querschnitt Lagune/Kalkschlamm (Klappe), Schichtstreifen, Schild auf der Rückseite der Klappe. Reine Canvas-Funktionen.
const TAU = Math.PI * 2;
const mb = (seed) => { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const lerp = (a, b, t) => a + (b - a) * t;

// Kurve durch Punkte (Mittelpunkt-Quadratik)
function curve(g, pts) {
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
  const l = pts[pts.length - 1]; g.lineTo(l[0], l[1]);
}

// ------------------------------------------------------------------------------------------------ Steinplatte + Fossil
// Felder: 10 x 6,55 Einheiten (u = W/10)
export function paintSlab(g, W, H, seed = 5) {
  const r = mb(seed), u = W / 10;
  g.save();
  let gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#b3a88e'); gr.addColorStop(0.5, '#a59a80'); gr.addColorStop(1, '#988d70');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 46; i++) { // weiche Flecken
    const x = r() * W, y = r() * H, rad = u * (0.5 + r() * 1.6), light = r() < 0.5;
    const rg = g.createRadialGradient(x, y, 0, x, y, rad); rg.addColorStop(0, light ? 'rgba(255,251,232,.12)' : 'rgba(80,66,44,.12)'); rg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = rg; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  // Schichtung des Plattenkalks
  g.lineWidth = Math.max(1, u * 0.012);
  for (let i = 0; i < 30; i++) {
    const y = r() * H, f = 0.6 + r() * 1.4, ph = r() * 6; g.strokeStyle = r() < 0.55 ? 'rgba(112,96,68,.15)' : 'rgba(255,252,236,.26)';
    g.beginPath(); for (let x = 0; x <= W; x += u * 0.2) { const yy = y + Math.sin(x / u * f + ph) * u * 0.04; if (x) g.lineTo(x, yy); else g.moveTo(x, yy); } g.stroke();
  }
  for (let i = 0; i < 1100; i++) { g.fillStyle = r() < 0.5 ? 'rgba(110,92,64,.20)' : 'rgba(255,252,236,.34)'; g.beginPath(); g.arc(r() * W, r() * H, Math.max(0.7, u * (0.006 + r() * 0.012)), 0, TAU); g.fill(); }
  // Dendriten (schwarze, farnartige Mangan-Muster, typisch für Solnhofen)
  const dend = (x, y, ang, len, d) => {
    if (d > 4 || len < u * 0.08) return;
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    g.lineWidth = Math.max(1, u * 0.03 * (1 - d * 0.2)); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
    dend(x2, y2, ang + 0.5 + r() * 0.4, len * 0.62, d + 1); dend(x2, y2, ang - 0.5 - r() * 0.4, len * 0.62, d + 1);
    if (r() < 0.7) dend(x + (x2 - x) * 0.5, y + (y2 - y) * 0.5, ang + (r() < 0.5 ? 0.9 : -0.9), len * 0.45, d + 2);
  };
  g.strokeStyle = 'rgba(46,34,24,.5)'; g.lineCap = 'round';
  dend(u * 0.35, H - u * 0.2, -1.2, u * 0.7, 0); dend(W - u * 0.5, u * 0.3, 2.3, u * 0.65, 0); dend(W - u * 0.25, H - u * 0.4, -2.6, u * 0.55, 1); dend(u * 0.3, u * 0.5, 0.9, u * 0.5, 1);
  fossil(g, u, r);
  // Rand dunkler, Ecken leicht beschädigt
  const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(60,46,30,0)'); vg.addColorStop(1, 'rgba(40,30,18,.35)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.restore();
}

function fossil(g, u, r) {
  const ink = '#3a2717', boneC = '#f4e8c4', boneLo = '#d8c394', fe = 'rgba(58,42,28,.78)', feFill = 'rgba(150,122,86,.26)';
  const P = (x, y) => [x * u, y * u];
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  // Prägeeffekt: heller Versatz unten rechts
  g.shadowColor = 'rgba(255,252,236,.85)'; g.shadowOffsetX = u * 0.022; g.shadowOffsetY = u * 0.03; g.shadowBlur = 0;

  const bone = (x0, y0, x1, y1, w0, w1) => { // Röhrenknochen mit runden Enden
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    g.beginPath();
    g.moveTo(...P(x0 + nx * w0 / 2, y0 + ny * w0 / 2)); g.lineTo(...P(x1 + nx * w1 / 2, y1 + ny * w1 / 2));
    g.arc(x1 * u, y1 * u, w1 / 2 * u, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
    g.lineTo(...P(x0 - nx * w0 / 2, y0 - ny * w0 / 2));
    g.arc(x0 * u, y0 * u, w0 / 2 * u, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
    g.closePath(); g.fillStyle = boneC; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.058; g.stroke();
    g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(255,250,230,.8)'; g.lineWidth = u * 0.012; g.beginPath(); g.moveTo(...P(x0 + nx * w0 * 0.18, y0 + ny * w0 * 0.18)); g.lineTo(...P(x1 + nx * w1 * 0.18, y1 + ny * w1 * 0.18)); g.stroke();
    g.shadowColor = 'rgba(255,252,236,.85)';
  };
  const feather = (bx, by, ang, L, wd, barbs = 14) => { // Feder: Schaft + Fahne + Äste
    const ca = Math.cos(ang), sa = Math.sin(ang), nx = -sa, ny = ca;
    const ex = bx + ca * L, ey = by + sa * L;
    g.beginPath(); g.moveTo(...P(bx, by));
    g.quadraticCurveTo(...P(bx + ca * L * 0.5 + nx * wd, by + sa * L * 0.5 + ny * wd), ...P(ex, ey));
    g.quadraticCurveTo(...P(bx + ca * L * 0.5 - nx * wd * 0.7, by + sa * L * 0.5 - ny * wd * 0.7), ...P(bx, by));
    g.fillStyle = feFill; g.fill(); g.strokeStyle = fe; g.lineWidth = u * 0.022; g.stroke();
    g.strokeStyle = 'rgba(50,36,24,.9)'; g.lineWidth = u * 0.03; g.beginPath(); g.moveTo(...P(bx, by)); g.lineTo(...P(ex, ey)); g.stroke();
    g.strokeStyle = 'rgba(70,52,36,.38)'; g.lineWidth = u * 0.008; g.beginPath();
    for (let i = 1; i < barbs; i++) {
      const t = i / barbs, px = bx + ca * L * t, py = by + sa * L * t, w = wd * Math.sin(Math.PI * Math.pow(t, 0.8)) * 0.85;
      g.moveTo(...P(px, py)); g.lineTo(...P(px + ca * w * 0.8 + nx * w, py + sa * w * 0.8 + ny * w));
      g.moveTo(...P(px, py)); g.lineTo(...P(px + ca * w * 0.8 - nx * w * 0.7, py + sa * w * 0.8 - ny * w * 0.7));
    }
    g.stroke();
  };
  const claw = (x, y, ang, L) => { g.beginPath(); g.moveTo(...P(x, y)); g.quadraticCurveTo(...P(x + Math.cos(ang) * L * 0.6, y + Math.sin(ang) * L * 0.6 - L * 0.2), ...P(x + Math.cos(ang + 0.5) * L, y + Math.sin(ang + 0.5) * L)); g.strokeStyle = ink; g.lineWidth = u * 0.032; g.stroke(); };

  // --- Flügel (hinter dem Körper)
  const wing = (sh, el, wr, hd, base, a0, a1, Lp, secA, sign) => {
    // Federn zuerst
    for (let k = 0; k < 9; k++) { const t = k / 8; feather(base[0], base[1], lerp(a0, a1, t), Lp * (0.82 + 0.18 * Math.sin(Math.min(1, t * 1.15) * Math.PI * 0.6 + 0.5)), 0.2, 16); }
    for (let j = 0; j < 7; j++) {
      const t = (j + 0.5) / 7, px = lerp(wr[0], el[0], t), py = lerp(wr[1], el[1], t);
      feather(px, py, secA + sign * (-0.12 + t * 0.34), 1.25 + (1 - t) * 0.5, 0.17, 12);
    }
    bone(sh[0], sh[1], el[0], el[1], 0.17, 0.14);                       // Oberarm
    bone(el[0], el[1], wr[0], wr[1], 0.13, 0.1);                        // Elle
    bone(el[0] + 0.02 * sign, el[1] - 0.12 * sign, wr[0], wr[1] - 0.1 * sign, 0.08, 0.07); // Speiche
    bone(wr[0], wr[1], hd[0], hd[1], 0.1, 0.065);                       // Mittelhand
    for (let c = 0; c < 3; c++) { const a = Math.atan2(hd[1] - wr[1], hd[0] - wr[0]); claw(hd[0] - 0.05 * c, hd[1] - 0.02 * c * sign, a - 0.25 + c * 0.32 - (sign > 0 ? 0 : 0.2), 0.34 - c * 0.04); }
  };
  wing([3.5, 2.85], [4.2, 2.32], [5.15, 1.95], [5.85, 1.62], [5.4, 1.78], -0.72, 0.22, 2.05, -0.3, 1);
  wing([3.7, 3.55], [4.3, 4.15], [5.15, 4.7], [5.8, 5.0], [5.4, 4.88], 0.0, 0.78, 1.75, 0.45, -1);

  // --- Schwanz mit Federfahne
  const tail = [[4.7, 3.5], [5.5, 3.58], [6.5, 3.75], [7.5, 3.72], [8.5, 3.55], [9.45, 3.38]];
  const tp = []; for (let i = 0; i < tail.length - 1; i++) for (let s = 0; s < 6; s++) { const t = s / 6; tp.push([lerp(tail[i][0], tail[i + 1][0], t), lerp(tail[i][1], tail[i + 1][1], t)]); }
  tp.push(tail[tail.length - 1]);
  for (let i = 3; i < tp.length - 1; i += 1) {
    const a = Math.atan2(tp[i + 1][1] - tp[i][1], tp[i + 1][0] - tp[i][0]), L = 0.7 + 0.35 * Math.sin(Math.min(1, (i - 3) / 22) * Math.PI * 0.8);
    for (const sg of [-1, 1]) {
      const b = a + sg * 1.0, ex = tp[i][0] + Math.cos(b) * L, ey = tp[i][1] + Math.sin(b) * L;
      g.strokeStyle = fe; g.lineWidth = u * 0.024; g.beginPath(); g.moveTo(...P(tp[i][0], tp[i][1])); g.lineTo(...P(ex, ey)); g.stroke();
      if (i % 2 === 0) { g.strokeStyle = 'rgba(70,52,36,.3)'; g.lineWidth = u * 0.008; g.beginPath(); g.moveTo(...P(lerp(tp[i][0], ex, 0.55), lerp(tp[i][1], ey, 0.55))); g.lineTo(...P(ex + Math.cos(a) * 0.2, ey + Math.sin(a) * 0.2)); g.stroke(); }
    }
  }
  for (let i = 0; i < tp.length; i++) { const w = lerp(0.15, 0.06, i / tp.length); g.beginPath(); g.ellipse(tp[i][0] * u, tp[i][1] * u, w * 0.8 * u, w * 0.55 * u, 0, 0, TAU); g.fillStyle = boneC; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.022; g.stroke(); }

  // --- Beine
  const leg = (h, k, a, f, toes) => {
    bone(h[0], h[1], k[0], k[1], 0.2, 0.15); bone(k[0], k[1], a[0], a[1], 0.15, 0.1); bone(a[0], a[1], f[0], f[1], 0.1, 0.075);
    for (const [dx, dy] of toes) { bone(f[0], f[1], f[0] + dx, f[1] + dy, 0.06, 0.04); claw(f[0] + dx, f[1] + dy, Math.atan2(dy, dx), 0.2); }
  };
  leg([4.5, 3.62], [4.05, 4.3], [3.2, 4.85], [2.65, 5.45], [[-0.65, 0.42], [-0.25, 0.62], [0.2, 0.5], [0.35, -0.3]]);
  leg([4.75, 3.7], [4.6, 4.55], [3.95, 5.25], [3.55, 5.8], [[-0.55, 0.38], [-0.2, 0.55], [0.3, 0.45], [0.42, -0.25]]);
  // Hosenfedern
  for (let i = 0; i < 5; i++) feather(4.55 - i * 0.05, 3.9 + i * 0.1, 2.1 + i * 0.12, 0.8, 0.12, 8);

  // --- Rumpf: Wirbelsäule, Rippen, Becken
  const N0 = [3.2, 2.98], H0 = [4.6, 3.55];
  for (let i = 0; i < 10; i++) {
    const t = 0.06 + i * 0.085, sx = lerp(N0[0], H0[0], t), sy = lerp(N0[1], H0[1], t), nx = -(H0[1] - N0[1]), ny = H0[0] - N0[0], nl = Math.hypot(nx, ny), L = 0.62 * (1 - 0.55 * Math.abs(t - 0.4) * 1.6);
    for (const sg of [-1, 1]) {
      const ex = sx + nx / nl * L * sg + 0.18, ey = sy + ny / nl * L * sg + 0.12;
      g.beginPath(); g.moveTo(...P(sx, sy)); g.quadraticCurveTo(...P(sx + nx / nl * L * 0.55 * sg - 0.05, sy + ny / nl * L * 0.55 * sg - 0.12 * sg), ...P(ex, ey));
      g.strokeStyle = ink; g.lineWidth = u * 0.058; g.stroke(); g.strokeStyle = boneC; g.lineWidth = u * 0.032; g.stroke();
    }
  }
  g.beginPath(); g.moveTo(...P(N0[0], N0[1])); g.lineTo(...P(H0[0], H0[1])); g.strokeStyle = ink; g.lineWidth = u * 0.07; g.stroke(); g.strokeStyle = boneC; g.lineWidth = u * 0.04; g.stroke();
  for (let i = 0; i < 13; i++) { const t = i / 12; g.beginPath(); g.arc(lerp(N0[0], H0[0], t) * u, lerp(N0[1], H0[1], t) * u, u * 0.052, 0, TAU); g.fillStyle = boneLo; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.016; g.stroke(); }
  // Gabelbein (Furcula)
  g.beginPath(); g.moveTo(...P(3.15, 2.75)); g.quadraticCurveTo(...P(3.45, 3.25), ...P(3.8, 2.8)); g.strokeStyle = ink; g.lineWidth = u * 0.05; g.stroke(); g.strokeStyle = boneC; g.lineWidth = u * 0.026; g.stroke();
  // Becken
  g.beginPath(); g.moveTo(...P(4.35, 3.3)); g.lineTo(...P(4.95, 3.42)); g.lineTo(...P(4.85, 3.85)); g.lineTo(...P(4.4, 3.8)); g.closePath(); g.fillStyle = boneC; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.03; g.stroke();

  // --- Hals + Schädel
  const neck = [[3.2, 2.98], [2.9, 2.62], [2.62, 2.2], [2.64, 1.85], [2.55, 1.68]];
  curve(g, neck.map((p) => P(p[0], p[1]))); g.strokeStyle = ink; g.lineWidth = u * 0.09; g.stroke(); g.strokeStyle = boneC; g.lineWidth = u * 0.055; g.stroke();
  for (let i = 0; i < 9; i++) { const t = i / 8, k = Math.min(neck.length - 2, Math.floor(t * (neck.length - 1))), f = t * (neck.length - 1) - k; const x = lerp(neck[k][0], neck[k + 1][0], f), y = lerp(neck[k][1], neck[k + 1][1], f); g.beginPath(); g.arc(x * u, y * u, u * 0.05, 0, TAU); g.fillStyle = boneLo; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.014; g.stroke(); }
  // Schädel mit bezahntem Schnabel
  const sk = [[2.78, 1.52], [2.35, 1.34], [1.9, 1.38], [1.62, 1.54], [1.66, 1.68], [2.15, 1.76], [2.62, 1.9], [2.78, 1.74]];
  g.beginPath(); sk.forEach((p, i) => { const q = P(p[0], p[1]); if (i) g.lineTo(...q); else g.moveTo(...q); }); g.closePath();
  g.fillStyle = boneC; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.036; g.stroke();
  g.beginPath(); g.moveTo(...P(1.7, 1.6)); g.quadraticCurveTo(...P(2.1, 1.64), ...P(2.6, 1.7)); g.strokeStyle = ink; g.lineWidth = u * 0.016; g.stroke(); // Mundspalt
  g.fillStyle = ink; for (let i = 0; i < 7; i++) { const t = i / 6, x = lerp(1.74, 2.2, t), y = lerp(1.6, 1.64, t); g.beginPath(); g.moveTo(...P(x - 0.03, y)); g.lineTo(...P(x, y + 0.11)); g.lineTo(...P(x + 0.03, y)); g.closePath(); g.fill(); }
  g.beginPath(); g.arc(2.34 * u, 1.55 * u, u * 0.15, 0, TAU); g.fillStyle = '#3a2a1c'; g.fill(); g.strokeStyle = ink; g.lineWidth = u * 0.03; g.stroke();
  g.beginPath(); g.arc(2.34 * u, 1.55 * u, u * 0.06, 0, TAU); g.fillStyle = boneLo; g.fill();
  g.restore();
}

// ------------------------------------------------------------------------------------------------ Klappenbild: Querschnitt der Lagune
// Wasser oben (~62 %), Kalkschlamm unten. Rückgabe: Anteil der Schlammoberkante (von unten)
export const MUD_FRAC = 0.38;
export function paintScene(g, W, H, seed = 3) {
  const r = mb(seed), u = W / 3;
  const mudTop = H * (1 - MUD_FRAC);
  const wg = g.createLinearGradient(0, 0, 0, mudTop); wg.addColorStop(0, '#cdf4ec'); wg.addColorStop(0.18, '#8fe0d6'); wg.addColorStop(0.6, '#43b6c4'); wg.addColorStop(1, '#2688a6');
  g.fillStyle = wg; g.fillRect(0, 0, W, H);
  // Lichtstrahlen
  for (let i = 0; i < 6; i++) { const x = (i + 0.4 + r() * 0.3) / 6 * W, w = u * (0.18 + r() * 0.22); g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + w, 0); g.lineTo(x + w * 2.4 - u * 0.4, mudTop); g.lineTo(x - u * 0.2, mudTop); g.closePath(); g.fill(); }
  // Oberfläche: Wellenlinien
  g.lineCap = 'round';
  for (let k = 0; k < 3; k++) { g.strokeStyle = `rgba(255,255,255,${0.75 - k * 0.2})`; g.lineWidth = u * (0.03 - k * 0.007); g.beginPath(); for (let x = 0; x <= W; x += u * 0.1) { const y = u * (0.05 + k * 0.1) + Math.sin(x / u * 5 + k * 1.7) * u * 0.025; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  // Blasen + Schwebeteilchen
  for (let i = 0; i < 34; i++) { const x = r() * W, y = u * 0.3 + r() * (mudTop - u * 0.6), rad = u * (0.012 + r() * 0.026); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = Math.max(1, u * 0.008); g.stroke(); }
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(235,255,245,.35)'; g.beginPath(); g.arc(r() * W, r() * mudTop, Math.max(0.8, u * 0.006), 0, TAU); g.fill(); }
  // Kalkschlamm
  const mg = g.createLinearGradient(0, mudTop, 0, H); mg.addColorStop(0, '#efe5bd'); mg.addColorStop(1, '#d9c995');
  g.fillStyle = mg; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += u * 0.06) g.lineTo(x, mudTop + Math.sin(x / u * 6) * u * 0.018 + Math.sin(x / u * 15 + 1) * u * 0.008);
  g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,252,236,.8)'; g.lineWidth = u * 0.016; g.beginPath(); for (let x = 0; x <= W; x += u * 0.06) { const y = mudTop + Math.sin(x / u * 6) * u * 0.018 + Math.sin(x / u * 15 + 1) * u * 0.008 + u * 0.012; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  for (let i = 0; i < 160; i++) { g.fillStyle = r() < 0.5 ? 'rgba(130,105,55,.22)' : 'rgba(255,252,230,.4)'; g.beginPath(); g.arc(r() * W, mudTop + u * 0.05 + r() * (H - mudTop - u * 0.05), Math.max(0.8, u * (0.006 + r() * 0.012)), 0, TAU); g.fill(); }
  // Rand
  g.strokeStyle = 'rgba(40,60,70,.55)'; g.lineWidth = u * 0.02; g.strokeRect(u * 0.01, u * 0.01, W - u * 0.02, H - u * 0.02);
  g.fillStyle = 'rgba(122,98,50,.8)'; g.font = `italic ${u * 0.11}px Georgia,serif`; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText('Kalkschlamm', u * 0.09, H - u * 0.08);
}

// Schichtstreifen (Sediment) – welliger Rand oben, undurchsichtig. opts: {base,line,bump:{x,w,h},seed}
export function paintLayer(g, W, H, { base = ['#efe5bd', '#d8c892'], line = 'rgba(120,98,56,.4)', bump = null, seed = 1, label = null } = {}) {
  const r = mb(seed), u = H / 0.6; // H entspricht 0,6 Einheiten Höhe
  const topY = (x) => H * 0.22 + Math.sin(x / W * 14 + seed) * H * 0.045 + Math.sin(x / W * 31 + seed * 2) * H * 0.02 - (bump ? bump.h * H * Math.exp(-Math.pow((x / W - bump.x) / bump.w, 2)) : 0);
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, base[0]); gr.addColorStop(1, base[1]);
  g.clearRect(0, 0, W, H);
  g.fillStyle = gr; g.beginPath(); g.moveTo(0, H); g.lineTo(0, topY(0)); for (let x = 0; x <= W; x += 3) g.lineTo(x, topY(x)); g.lineTo(W, H); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,252,236,.85)'; g.lineWidth = Math.max(1.5, H * 0.03); g.beginPath(); for (let x = 0; x <= W; x += 3) { const y = topY(x) + H * 0.02; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
  g.strokeStyle = line; g.lineWidth = Math.max(1, H * 0.018);
  for (let k = 0; k < 3; k++) { g.beginPath(); const y0 = H * (0.45 + k * 0.2); for (let x = 0; x <= W; x += 4) { const y = y0 + Math.sin(x / W * (9 + k * 3) + seed + k) * H * 0.03; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); }
  for (let i = 0; i < 70; i++) { g.fillStyle = r() < 0.5 ? 'rgba(110,88,48,.28)' : 'rgba(255,252,232,.42)'; g.beginPath(); g.arc(r() * W, H * (0.3 + r() * 0.7), Math.max(0.8, H * (0.012 + r() * 0.02)), 0, TAU); g.fill(); }
  g.strokeStyle = 'rgba(70,55,30,.5)'; g.lineWidth = Math.max(1, H * 0.014); g.beginPath(); g.moveTo(0, H - 1); g.lineTo(0, topY(0)); for (let x = 0; x <= W; x += 3) g.lineTo(x, topY(x)); g.lineTo(W, H - 1); g.stroke();
}

// Schild auf der Rückseite der Klappe: bayerische Rauten, „Solnhofen, Bayern“. Das Bild wird um 180° gedreht gemalt,
// weil die Klappe nach hinten klappt (Rückseite steht dann auf dem Kopf).
export function paintSign(g, W, H) {
  g.save(); g.translate(W, H); g.rotate(Math.PI);
  const u = W / 3;
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#e9dfc2'); gr.addColorStop(1, '#d3c7a4'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const r = mb(9); for (let i = 0; i < 500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(110,92,64,.16)' : 'rgba(255,252,236,.3)'; g.beginPath(); g.arc(r() * W, r() * H, Math.max(0.7, u * 0.008), 0, TAU); g.fill(); }
  const band = (y0, bh) => { // Rautenband: weiß-blau
    const n = Math.round(W / (bh * 1.0)), cw = W / n;
    g.fillStyle = '#fbfaf2'; g.fillRect(0, y0, W, bh);
    g.fillStyle = '#2f78c4';
    for (let i = 0; i < n; i++) { const cx = (i + 0.5) * cw; g.beginPath(); g.moveTo(cx, y0 + bh * 0.04); g.lineTo(cx + cw / 2, y0 + bh / 2); g.lineTo(cx, y0 + bh * 0.96); g.lineTo(cx - cw / 2, y0 + bh / 2); g.closePath(); if (i % 2 === 0) g.fill(); }
    g.strokeStyle = 'rgba(30,50,90,.6)'; g.lineWidth = u * 0.015; g.strokeRect(0, y0, W, bh);
  };
  band(H * 0.06, H * 0.12); band(H * 0.82, H * 0.12);
  g.fillStyle = '#3a2a1a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold ${u * 0.3}px Georgia,'Palatino Linotype',serif`; g.fillText('Solnhofen, Bayern', W / 2, H * 0.40);
  g.font = `italic ${u * 0.16}px Georgia,'Palatino Linotype',serif`; g.fillStyle = '#6a4a2a'; g.fillText('Hier fand man den Urvogel!', W / 2, H * 0.60);
  g.strokeStyle = 'rgba(70,50,30,.5)'; g.lineWidth = u * 0.03; g.strokeRect(u * 0.04, u * 0.04, W - u * 0.08, H - u * 0.08);
  g.restore();
}
