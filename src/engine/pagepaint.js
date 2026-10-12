// Painted page bases (gouache look), text cards, cover.  All coordinates are page-frame world units.
import * as THREE from 'three';
import { PAGE_W as W, PAGE_D as D } from './scene.js';
import { COVER_W, COVER_D } from './book.js';
import { mulberry32, hashStr, clamp, lerp, TAU, fbm } from './util.js';
import { grainCanvas, unionF } from './papercut.js';

export const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
export const RED = '#8B1E1E';
export const CREAM = '#F3E6C8';
export const INK = '#3a2615';

export function rectFor(side) { return side === 'L' ? { x0: -W, x1: 0, z0: -D / 2, z1: D / 2 } : { x0: 0, x1: W, z0: -D / 2, z1: D / 2 }; }
export function coverRect(side) { return side === 'L' ? { x0: -COVER_W, x1: 0, z0: -COVER_D / 2, z1: COVER_D / 2 } : { x0: 0, x1: COVER_W, z0: -COVER_D / 2, z1: COVER_D / 2 }; }

export function makeMap(ctx, rect, S) {
  return {
    ctx, S, rect,
    x: (x) => (x - rect.x0) * S, z: (z) => (z - rect.z0) * S, len: (l) => l * S,
    pt: (x, z) => [(x - rect.x0) * S, (z - rect.z0) * S],
  };
}

// ----- low-level painterly helpers
export function blotches(m, { x0, x1, z0, z1, n = 30, rmin = 0.4, rmax = 1.6, colors = ['rgba(255,255,255,.10)'], seed = 1 }) {
  const { ctx } = m; const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), rad = lerp(rmin, rmax, r()) * m.S;
    const c = colors[Math.floor(r() * colors.length)];
    const g = ctx.createRadialGradient(m.x(x), m.z(z), 0, m.x(x), m.z(z), rad);
    g.addColorStop(0, c); g.addColorStop(1, c.replace(/[\d.]+\)$/, '0)'));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), rad, rad * (0.5 + r() * 0.5), r() * 3, 0, TAU); ctx.fill();
  }
}
export function speckles(m, { x0, x1, z0, z1, n = 300, color = 'rgba(60,30,10,.25)', size = 0.03, seed = 2 }) {
  const { ctx } = m; const r = mulberry32(seed); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()); ctx.beginPath(); ctx.arc(m.x(x), m.z(z), Math.max(0.8, size * m.S * (0.4 + r())), 0, TAU); ctx.fill(); }
}
export function grassTufts(m, { x0, x1, z0, z1, n = 40, color = '#5b7a2e', h = 0.28, seed = 3, blades = 5, alpha = 0.8 }) {
  const { ctx } = m; const r = mulberry32(seed);
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 0.025 * m.S); ctx.lineCap = 'round'; ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r());
    for (let b = 0; b < blades; b++) {
      const a = -Math.PI / 2 + (b - (blades - 1) / 2) * 0.32 + (r() - 0.5) * 0.2, L = h * (0.6 + r() * 0.6);
      ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.quadraticCurveTo(m.x(x) + Math.cos(a) * L * m.S * 0.5 + (r() - 0.5) * 4, m.z(z) + Math.sin(a) * L * m.S * 0.6, m.x(x) + Math.cos(a) * L * m.S, m.z(z) + Math.sin(a) * L * m.S); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
}
export function pebbles(m, { x0, x1, z0, z1, n = 20, seed = 4, colors = ['#b49b78', '#9a8666', '#c7b08a'] }) {
  const { ctx } = m; const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), rad = (0.04 + r() * 0.1) * m.S;
    ctx.fillStyle = colors[Math.floor(r() * colors.length)]; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), rad, rad * 0.65, r() * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.ellipse(m.x(x) - rad * 0.2, m.z(z) - rad * 0.2, rad * 0.5, rad * 0.25, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(50,30,10,.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(m.x(x), m.z(z), rad, rad * 0.65, r() * 0.5, 0, TAU); ctx.stroke();
  }
}
export function wavyLine(m, pts, { color = 'rgba(60,40,20,.5)', w = 0.03, dash = null } = {}) {
  const { ctx } = m; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * m.S); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (dash) ctx.setLineDash(dash.map((d) => d * m.S));
  ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = m.pt(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke(); ctx.setLineDash([]);
}

// ----- text
export function wrap(ctx, text, maxW) {
  const lines = [];
  for (const para of String(text).split('\n')) {
    const words = para.split(' '); let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
    }
    lines.push(line);
  }
  return lines;
}

// wrap with per-line widths (first lines may be narrower, e.g. next to a drop cap)
export function wrapLines(ctx, text, widths) {
  const out = []; let li = 0;
  for (const para of String(text).split('\n')) {
    const words = para.split(' '); let line = '';
    for (const w of words) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > (widths[Math.min(li, widths.length - 1)]) && line) { out.push(line); li++; line = w; } else line = t;
    }
    out.push(line); li++;
  }
  return out;
}

// cream text card with tape; returns the y used. Sizes in world units.
export function textCard(m, { x, z, w, h, title, kicker, body, size = 0.30, tilt = -0.012, tape = true, titleSize, color = CREAM, align = 'left', dropCap = true, sub }) {
  const { ctx, S } = m;
  ctx.save();
  const cx = m.x(x + w / 2), cz = m.z(z + h / 2);
  ctx.translate(cx, cz); ctx.rotate(tilt);
  const pw = w * S, ph = h * S;
  ctx.shadowColor = 'rgba(40,20,5,.38)'; ctx.shadowBlur = 0.14 * S; ctx.shadowOffsetY = 0.05 * S; ctx.shadowOffsetX = 0.03 * S;
  ctx.fillStyle = color; roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 0.08 * S); ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.save(); roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 0.08 * S); ctx.clip(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.fillStyle = ctx.createPattern(grainCanvas(), 'repeat'); ctx.fillRect(-pw / 2, -ph / 2, pw, ph); ctx.restore();
  ctx.strokeStyle = 'rgba(139,30,30,.30)'; ctx.lineWidth = Math.max(1, 0.012 * S); roundRect(ctx, -pw / 2 + 0.11 * S, -ph / 2 + 0.11 * S, pw - 0.22 * S, ph - 0.22 * S, 0.05 * S); ctx.stroke();
  const pad = 0.34 * S, tw = pw - 2 * pad;
  let yy = -ph / 2 + 0.3 * S;
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = align === 'center' ? 'center' : 'left';
  const tx = align === 'center' ? 0 : -pw / 2 + pad;
  if (kicker) {
    ctx.fillStyle = RED; ctx.font = `bold ${0.2 * S}px ${SERIF}`; try { ctx.letterSpacing = Math.round(0.035 * S) + 'px'; } catch (e) { /* older Safari */ }
    ctx.fillText(String(kicker).toUpperCase(), tx, yy + 0.12 * S); try { ctx.letterSpacing = '0px'; } catch (e) { /* ignore */ }
    yy += 0.34 * S;
  }
  if (title) {
    const ts = (titleSize || 0.44) * S; ctx.fillStyle = RED;
    let fs = ts; ctx.font = `bold ${fs}px ${SERIF}`;
    let lines = wrap(ctx, title, tw);
    while (lines.length > 2 && fs > 12) { fs -= 2; ctx.font = `bold ${fs}px ${SERIF}`; lines = wrap(ctx, title, tw); }
    for (const l of lines) { ctx.fillText(l, tx, yy + fs * 0.72); yy += fs * 1.1; }
    yy += 0.06 * S;
  }
  if (sub) { ctx.fillStyle = '#7a5b3a'; ctx.font = `italic ${0.24 * S}px ${SERIF}`; ctx.fillText(sub, tx, yy + 0.2 * S); yy += 0.34 * S; }
  if (body) {
    let fsz = size * S;
    const measure = (f) => {
      const l = f * 1.36; ctx.font = `${f}px ${SERIF}`;
      if (dropCap && align !== 'center') { ctx.font = `bold ${f * 2.5}px ${SERIF}`; const cw0 = ctx.measureText(body[0]).width + 0.07 * S; ctx.font = `${f}px ${SERIF}`; return wrapLines(ctx, body.slice(1), [tw - cw0, tw - cw0, tw]).length * l + f * 0.5; }
      return wrap(ctx, body, tw).length * l;
    };
    const avail = ph / 2 - 0.2 * S - yy;
    while (measure(fsz) > avail && fsz > 0.16 * S) fsz *= 0.97;
    const lh = fsz * 1.36;
    ctx.fillStyle = INK; ctx.font = `${fsz}px ${SERIF}`;
    if (dropCap && align !== 'center') {
      const cap = body[0]; const capSize = fsz * 2.5;
      ctx.font = `bold ${capSize}px ${SERIF}`; const cw = ctx.measureText(cap).width + 0.07 * S;
      ctx.fillStyle = RED; ctx.fillText(cap, tx, yy + lh * 1.45);
      ctx.font = `${fsz}px ${SERIF}`; ctx.fillStyle = INK;
      const lines = wrapLines(ctx, body.slice(1), [tw - cw, tw - cw, tw]);
      lines.forEach((l, i) => { ctx.fillText(l, i < 2 ? tx + cw : tx, yy + fsz * 0.95 + i * lh); });
      yy += lines.length * lh + fsz * 0.5;
    } else {
      for (const l of wrap(ctx, body, tw)) { ctx.fillText(l, tx, yy + fsz * 0.8); yy += lh; }
    }
  }
  if (tape) {
    ctx.fillStyle = 'rgba(240,205,110,.72)';
    for (const sx of [-1, 1]) { ctx.save(); ctx.translate(sx * pw * 0.42, -ph / 2 + 0.02 * S); ctx.rotate(sx * 0.35); ctx.fillRect(-0.45 * S, -0.14 * S, 0.9 * S, 0.3 * S); ctx.restore(); }
  }
  ctx.restore();
  return yy;
}
export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

// printed caption directly on the paper (e.g. next to a control)
export function printLabel(m, text, x, z, { size = 0.26, color = '#6b4a2a', align = 'center', bold = true, italic = false, alpha = 1 } = {}) {
  const { ctx, S } = m;
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size * S}px ${SERIF}`; ctx.fillText(text, m.x(x), m.z(z)); ctx.restore();
}

// ----- the page base
// opts: { pxW, side, rect?, paper, ground:{back, front, line?}, margin, draw(ctx,m), corner:true }
export function paintPageBase({ pxW = 1536, side = 'R', rect, paper = '#f4ead2', ground = { back: '#d9b27a', front: '#c08a52' }, margin = 0.3, draw, post, corner = true, seed = 7, pageNo, noteColor = 'rgba(80,45,15,.55)' }) {
  rect = rect || rectFor(side);
  const wW = rect.x1 - rect.x0, hW = rect.z1 - rect.z0;
  const S = pxW / wW;
  const c = document.createElement('canvas'); c.width = Math.round(pxW); c.height = Math.round(hW * S);
  const ctx = c.getContext('2d');
  const m = makeMap(ctx, rect, S);
  ctx.fillStyle = paper; ctx.fillRect(0, 0, c.width, c.height);
  // printed area, softly irregular edge towards the outside, full bleed towards the spine
  const mg = margin;
  const px0 = side === 'L' ? rect.x0 + mg : rect.x0 - 1, px1 = side === 'L' ? rect.x1 + 1 : rect.x1 - mg;
  const pz0 = rect.z0 + mg, pz1 = rect.z1 - mg;
  ctx.save();
  ctx.beginPath();
  const rr = mulberry32(seed + 31);
  const wob = (v) => v + (rr() - 0.5) * 0.03;
  roundRect(ctx, m.x(px0), m.z(pz0), (px1 - px0) * S, (pz1 - pz0) * S, 0.22 * S); ctx.clip();
  const g = ctx.createLinearGradient(0, m.z(pz0), 0, m.z(pz1)); g.addColorStop(0, ground.back); g.addColorStop(1, ground.front);
  ctx.fillStyle = g; ctx.fillRect(0, 0, c.width, c.height);
  // gouache mottling
  blotches(m, { x0: rect.x0, x1: rect.x1, z0: rect.z0, z1: rect.z1, n: 34, rmin: 0.8, rmax: 2.6, colors: ['rgba(255,244,214,.10)', 'rgba(60,30,10,.07)', 'rgba(255,255,255,.07)'], seed });
  speckles(m, { x0: rect.x0, x1: rect.x1, z0: rect.z0, z1: rect.z1, n: 500, color: 'rgba(70,40,15,.12)', size: 0.022, seed: seed + 1 });
  if (draw) draw(ctx, m);
  ctx.restore();
  // printed border line
  ctx.strokeStyle = ground.line || 'rgba(70,40,15,.35)'; ctx.lineWidth = Math.max(1.5, 0.014 * S);
  roundRect(ctx, m.x(px0), m.z(pz0), (px1 - px0) * S, (pz1 - pz0) * S, 0.22 * S); ctx.stroke();
  ctx.lineWidth = Math.max(1, 0.008 * S);
  roundRect(ctx, m.x(px0 + (side === 'L' ? 0.09 : -1)), m.z(pz0 + 0.09), (px1 - px0 - 0.09 + (side === 'L' ? 0 : 1)) * S, (pz1 - pz0 - 0.18) * S, 0.16 * S); ctx.stroke();
  if (pageNo != null) {
    ctx.save(); ctx.fillStyle = noteColor; ctx.font = `italic ${0.24 * S}px ${SERIF}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`– ${pageNo} –`, m.x(side === 'L' ? rect.x0 + (rect.x1 - rect.x0) * 0.5 : rect.x0 + (rect.x1 - rect.x0) * 0.5), m.z(pz1 - 0.3)); ctx.restore();
  }
  if (post) post(ctx, m);
  // spine gutter shadow (fake AO)
  const gw = 1.7 * S, gx = side === 'L' ? m.x(rect.x1) : m.x(rect.x0);
  const gg = ctx.createLinearGradient(gx, 0, gx + (side === 'L' ? -gw : gw), 0);
  gg.addColorStop(0, 'rgba(30,14,4,.55)'); gg.addColorStop(0.35, 'rgba(30,14,4,.20)'); gg.addColorStop(1, 'rgba(30,14,4,0)');
  ctx.fillStyle = gg; ctx.fillRect(side === 'L' ? gx - gw : gx, 0, gw, c.height);
  // outer edge darkening
  const ex = side === 'L' ? m.x(rect.x0) : m.x(rect.x1);
  const eg = ctx.createLinearGradient(ex, 0, ex + (side === 'L' ? 0.45 * S : -0.45 * S), 0);
  eg.addColorStop(0, 'rgba(60,30,10,.22)'); eg.addColorStop(1, 'rgba(60,30,10,0)');
  ctx.fillStyle = eg; ctx.fillRect(side === 'L' ? ex : ex - 0.45 * S, 0, 0.45 * S, c.height);
  // turn-corner affordance (outer front corner)
  if (corner) drawCorner(m, side, rect);
  // paper fibres
  ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.fillStyle = ctx.createPattern(grainCanvas(), 'repeat'); ctx.fillRect(0, 0, c.width, c.height); ctx.restore();
  return { canvas: c, m };
}

function drawCorner(m, side, rect) {
  const { ctx, S } = m;
  const cs = 1.15;
  const ox = side === 'L' ? rect.x0 : rect.x1, oz = rect.z1;
  const sx = side === 'L' ? 1 : -1;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(m.x(ox), m.z(oz - cs)); ctx.lineTo(m.x(ox + sx * cs), m.z(oz)); ctx.lineTo(m.x(ox), m.z(oz)); ctx.closePath();
  // covers the painting: show bare paper like a dog-ear
  ctx.fillStyle = '#efe4c8'; ctx.fill();
  ctx.clip();
  const gr = ctx.createLinearGradient(m.x(ox + sx * cs * 0.5), m.z(oz - cs * 0.5), m.x(ox), m.z(oz));
  gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(1, 'rgba(120,90,50,.28)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  ctx.strokeStyle = 'rgba(80,50,20,.45)'; ctx.lineWidth = Math.max(1, 0.012 * S);
  ctx.beginPath(); ctx.moveTo(m.x(ox), m.z(oz - cs)); ctx.lineTo(m.x(ox + sx * cs), m.z(oz)); ctx.stroke();
  // little arrow
  ctx.fillStyle = 'rgba(139,30,30,.55)'; ctx.save(); ctx.translate(m.x(ox + sx * 0.36), m.z(oz - 0.36)); ctx.rotate(side === 'L' ? Math.PI * 0.75 : Math.PI * 0.25 * -1 + Math.PI);
  ctx.restore();
}

export function toTexture(canvas, { aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; return t;
}

// ----- gold foil helper & silhouettes
export function silhouettePolys(spec, parts) {
  const polys = [];
  for (const [k, p] of Object.entries(spec.parts)) { if (parts && !parts.includes(k)) continue; for (const l of p.layers) for (const s of l.shapes) polys.push(s); }
  return unionF(polys);
}
export function fillPolys(ctx, polys, tf) {
  ctx.beginPath();
  for (const p of polys) { p.forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); }
}
export function goldGradient(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, '#8a5f1c'); g.addColorStop(0.22, '#f3d57a'); g.addColorStop(0.42, '#b98626'); g.addColorStop(0.62, '#fff0b3'); g.addColorStop(0.82, '#a87420'); g.addColorStop(1, '#e6c262');
  return g;
}

export function paintCover({ pxW = 1536, specs }) {
  const rect = coverRect('R');
  const wW = rect.x1 - rect.x0, hW = rect.z1 - rect.z0, S = pxW / wW;
  const c = document.createElement('canvas'); c.width = Math.round(pxW); c.height = Math.round(hW * S);
  const ctx = c.getContext('2d');
  const m = makeMap(ctx, rect, S);
  // cloth
  const base = ctx.createLinearGradient(0, 0, c.width, c.height); base.addColorStop(0, '#6a1f4a'); base.addColorStop(1, '#3d0f2c');
  ctx.fillStyle = base; ctx.fillRect(0, 0, c.width, c.height);
  const r = mulberry32(77);
  ctx.globalAlpha = 0.16;
  for (let y = 0; y < c.height; y += 3) { ctx.fillStyle = r() > 0.5 ? '#220818' : '#a8658a'; ctx.fillRect(0, y, c.width, 1.4); }
  for (let x = 0; x < c.width; x += 3) { ctx.fillStyle = r() > 0.5 ? '#220818' : '#a8658a'; ctx.fillRect(x, 0, 1.4, c.height); }
  ctx.globalAlpha = 1;
  // vignette
  const vg = ctx.createRadialGradient(c.width * 0.5, c.height * 0.5, c.height * 0.2, c.width * 0.5, c.height * 0.5, c.width * 0.65); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.4)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, c.width, c.height);
  const gold = goldGradient(ctx, 0, 0, c.width, c.height);
  // frame
  const fr = (inset, lw, a) => { ctx.strokeStyle = gold; ctx.globalAlpha = a; ctx.lineWidth = lw * S; roundRect(ctx, inset * S, inset * S, c.width - 2 * inset * S, c.height - 2 * inset * S, 0.18 * S); ctx.stroke(); ctx.globalAlpha = 1; };
  fr(0.38, 0.05, 1); fr(0.55, 0.02, 0.9);
  // corner ornaments
  ctx.fillStyle = gold;
  for (const [cx, cy] of [[0.38, 0.38], [(wW - 0.38), 0.38], [0.38, hW - 0.38], [wW - 0.38, hW - 0.38]]) { ctx.beginPath(); ctx.arc(cx * S, cy * S, 0.13 * S, 0, TAU); ctx.fill(); ctx.fillStyle = '#3d0f2c'; ctx.beginPath(); ctx.arc(cx * S, cy * S, 0.06 * S, 0, TAU); ctx.fill(); ctx.fillStyle = gold; }
  // emblem: gold silhouettes (Säule, Kolosseum, Triumphbogen) at the bottom
  if (specs) {
    const place = (spec, cx, base, h, flip) => {
      const polys = silhouettePolys(spec);
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const p of polys) for (const [x, y] of p) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      const sc = (h * S) / (y1 - y0);
      const tf = (x, y) => [c.width * cx + ((x - (x0 + x1) / 2) * (flip ? -1 : 1)) * sc, base * S - (y - y0) * sc];
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 0.12 * S; ctx.shadowOffsetY = 0.06 * S;
      fillPolys(ctx, polys, tf); ctx.fillStyle = goldGradient(ctx, 0, (base - h) * S, c.width, base * S); ctx.fill('nonzero'); ctx.restore();
      ctx.save(); fillPolys(ctx, polys, tf); ctx.strokeStyle = 'rgba(255,240,170,.55)'; ctx.lineWidth = Math.max(1, 0.012 * S); ctx.stroke(); ctx.restore();
    };
    place(specs.saeule, 0.15, hW - 1.0, 3.6, false);
    place(specs.kolosseum, 0.46, hW - 1.0, 2.0, false);
    place(specs.bogen, 0.81, hW - 1.0, 2.7, false);
    // ground line
    ctx.strokeStyle = gold; ctx.lineWidth = 0.04 * S; ctx.beginPath(); ctx.moveTo(1.1 * S, (hW - 1.0) * S); ctx.lineTo((wW - 1.1) * S, (hW - 1.0) * S); ctx.stroke();
  }
  // title
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const tt = (txt, y, size, style = 'bold') => {
    ctx.font = `${style} ${size * S}px ${SERIF}`;
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillText(txt, c.width / 2 + 0.035 * S, y * S + 0.035 * S); ctx.restore();
    ctx.fillStyle = goldGradient(ctx, 0, (y - size) * S, 0, y * S); ctx.fillText(txt, c.width / 2, y * S);
    ctx.save(); ctx.strokeStyle = 'rgba(255,235,160,.5)'; ctx.lineWidth = Math.max(1, 0.008 * S); ctx.strokeText(txt, c.width / 2, y * S); ctx.restore();
  };
  tt('Das große Popup-Buch vom', 1.75, 0.5, 'italic');
  tt('RÖMISCHEN', 2.95, 0.98);
  tt('REICH', 3.95, 0.98);
  ctx.strokeStyle = gold; ctx.lineWidth = 0.025 * S; ctx.beginPath(); ctx.moveTo(c.width * 0.22, 4.28 * S); ctx.lineTo(c.width * 0.78, 4.28 * S); ctx.stroke();
  tt('Eine Reise auf der Straße nach Rom', 4.85, 0.4, 'italic');
  return { canvas: c, m };
}
