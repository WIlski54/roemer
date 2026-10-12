// Station 7 (Einschlag): Mal- und Shader-Bausteine (nur von p7.js benutzt).
// Alles aus Code: Canvas-Texturen, Druckwellen-Shader, Himmels-Overlay, Hoehle fuer den versteckten Saeuger.
import * as THREE from 'three';
import { SERIF } from '../engine/pagepaint.js';
import { mulberry32, TAU } from '../engine/util.js';
import { poly, blob } from '../art/dsl.js';
import { rock, fillPoly, fillGrad, curve } from '../art/props/_e_kit.js';
import { volume } from '../art/paint.js';

const rr = (g, x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
const mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const tex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

// ------------------------------------------------------------------ Lupe (Zeichen)
function magnifier(g, cx, cy, r, { lens = 'rgba(210,235,250,.35)', rim = '#6b4a2a', handle = '#8a5a30' } = {}) {
  g.save();
  g.lineCap = 'round';
  g.strokeStyle = handle; g.lineWidth = r * 0.34; g.beginPath(); g.moveTo(cx + r * 0.72, cy + r * 0.72); g.lineTo(cx + r * 1.55, cy + r * 1.55); g.stroke();
  g.strokeStyle = '#d8b878'; g.lineWidth = r * 0.12; g.beginPath(); g.moveTo(cx + r * 0.78, cy + r * 0.7); g.lineTo(cx + r * 1.5, cy + r * 1.42); g.stroke();
  g.fillStyle = lens; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.fill();
  g.lineWidth = r * 0.2; g.strokeStyle = rim; g.stroke();
  g.lineWidth = r * 0.05; g.strokeStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(cx, cy, r * 0.82, 3.4, 4.5); g.stroke();
  g.restore();
}

// ------------------------------------------------------------------ Gesteins-Querschnitt (unter der Klappe, auf die Seite gedruckt)
// Rueckgabe: Canvas 640x415 (Seitenverhaeltnis 2.7 : 1.75) und die Lupen-Mitte in 0..1 (u, v)
export const LENS_UV = [0.755, 0.5];
export function strataCanvas() {
  const W = 640, H = 415, c = mkCanvas(W, H), g = c.getContext('2d');
  const r = mulberry32(77);
  g.fillStyle = '#f2e6c8'; rr(g, 0, 0, W, H, 26); g.fill();
  g.save(); rr(g, 14, 14, W - 28, H - 28, 18); g.clip();
  const yClay0 = 176, yClay1 = 204;
  // Palaeogen (oben): helle Sandsteinschichten
  let gr = g.createLinearGradient(0, 14, 0, yClay0); gr.addColorStop(0, '#e6d6bd'); gr.addColorStop(1, '#cdb694'); g.fillStyle = gr; g.fillRect(0, 14, W, yClay0 - 14);
  g.strokeStyle = 'rgba(120,90,60,.28)'; g.lineWidth = 2;
  for (let i = 1; i < 5; i++) { const y = 14 + i * 32; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.03 + i) * 3); g.stroke(); }
  for (let i = 0; i < 46; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,248,230,.7)' : 'rgba(110,80,50,.5)'; g.beginPath(); g.ellipse(20 + r() * (W - 40), 24 + r() * (yClay0 - 36), 2 + r() * 4, 1.5 + r() * 2.5, r() * 3, 0, TAU); g.fill(); }
  // Kreide (unten): warme Kalkschichten mit Fossilien
  gr = g.createLinearGradient(0, yClay1, 0, H); gr.addColorStop(0, '#caa66e'); gr.addColorStop(1, '#9a7448'); g.fillStyle = gr; g.fillRect(0, yClay1, W, H - yClay1);
  g.strokeStyle = 'rgba(90,60,30,.35)'; g.lineWidth = 2.5;
  for (let i = 0; i < 5; i++) { const y = yClay1 + 30 + i * 36; g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.025 + i * 2) * 4); g.stroke(); }
  // Ammonit
  g.save(); g.translate(112, 316); g.strokeStyle = 'rgba(70,45,20,.75)'; g.fillStyle = 'rgba(235,215,170,.55)'; g.lineWidth = 3.4;
  g.beginPath(); g.arc(0, 0, 36, 0, TAU); g.fill(); g.stroke();
  g.beginPath(); for (let a = 0; a < 11; a += 0.2) { const rad = 3 + a * 3; g.lineTo(Math.cos(a) * rad, Math.sin(a) * rad); } g.stroke();
  for (let a = 0; a < TAU; a += 0.55) { g.beginPath(); g.moveTo(Math.cos(a) * 16, Math.sin(a) * 16); g.lineTo(Math.cos(a) * 35, Math.sin(a) * 35); g.lineWidth = 2; g.stroke(); }
  g.restore();
  // Muschel
  g.save(); g.translate(300, 352); g.fillStyle = 'rgba(240,225,190,.6)'; g.strokeStyle = 'rgba(70,45,20,.7)'; g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(-28, 10); g.quadraticCurveTo(0, -34, 28, 10); g.closePath(); g.fill(); g.stroke();
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, 8); g.lineTo(i * 11, -12 + Math.abs(i) * 4); g.stroke(); }
  g.restore();
  for (let i = 0; i < 40; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,240,205,.5)' : 'rgba(80,50,25,.4)'; g.beginPath(); g.ellipse(20 + r() * (W - 40), yClay1 + 8 + r() * (H - yClay1 - 28), 2 + r() * 3.5, 1.4 + r() * 2.2, r() * 3, 0, TAU); g.fill(); }
  // die duenne graue Tonschicht (Grenze Kreide / Palaeogen)
  g.fillStyle = '#7f828c'; g.beginPath(); g.moveTo(0, yClay0);
  for (let x = 0; x <= W; x += 20) g.lineTo(x, yClay0 + Math.sin(x * 0.04) * 2.5);
  for (let x = W; x >= 0; x -= 20) g.lineTo(x, yClay1 + Math.sin(x * 0.05 + 1) * 2.5);
  g.closePath(); g.fill();
  g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(0, yClay0 + 3, W, 4);
  g.fillStyle = 'rgba(40,40,50,.35)'; g.fillRect(0, yClay1 - 6, W, 5);
  g.restore();
  g.strokeStyle = 'rgba(90,55,25,.7)'; g.lineWidth = 3; rr(g, 14, 14, W - 28, H - 28, 18); g.stroke();
  // Beschriftung (links, auf Papierstreifen)
  const tag = (txt, x, y, col) => {
    g.font = `bold 25px ${SERIF}`; const w = g.measureText(txt).width + 20;
    g.fillStyle = 'rgba(247,238,214,.92)'; rr(g, x, y - 20, w, 34, 8); g.fill(); g.fillStyle = col; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(txt, x + 10, y - 2);
  };
  tag('Paläogen', 28, 52, '#6b4a2a'); tag('Kreide', 28, 252, '#6b4a2a'); tag('graue Tonschicht', 28, 190, '#4a4c58');
  g.strokeStyle = '#4a4c58'; g.lineWidth = 3; g.setLineDash([6, 5]); g.beginPath(); g.moveTo(250, 190); g.lineTo(380, 190); g.stroke(); g.setLineDash([]);
  // Lupe mit vergroessertem Iridium
  const lx = LENS_UV[0] * W, ly = LENS_UV[1] * H, lr = 92;
  g.save(); g.beginPath(); g.arc(lx, ly, lr, 0, TAU); g.clip();
  gr = g.createLinearGradient(0, ly - lr, 0, ly + lr); gr.addColorStop(0, '#ddc9a8'); gr.addColorStop(0.28, '#cdb694'); gr.addColorStop(0.36, '#868993'); gr.addColorStop(0.64, '#7d808b'); gr.addColorStop(0.72, '#c4a068'); gr.addColorStop(1, '#a07a4c');
  g.fillStyle = gr; g.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
  const rg = mulberry32(5);
  for (let i = 0; i < 17; i++) { // Iridium-Teilchen, golden-silbrig
    const px = lx - lr * 0.8 + rg() * lr * 1.6, py = ly - lr * 0.22 + rg() * lr * 0.44, pr = 5 + rg() * 5;
    g.fillStyle = '#ffe9a0'; g.strokeStyle = '#a8761c'; g.lineWidth = 2; g.beginPath();
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + 0.3; g.lineTo(px + Math.cos(a) * pr, py + Math.sin(a) * pr); } g.closePath(); g.fill(); g.stroke();
  }
  g.restore();
  magnifier(g, lx, ly, lr, { lens: 'rgba(220,240,255,.18)' });
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `bold 40px ${SERIF}`; g.lineWidth = 7; g.strokeStyle = 'rgba(50,30,10,.85)'; g.fillStyle = '#ffd35a'; g.strokeText('Ir', lx - 6, ly - 52); g.fillText('Ir', lx - 6, ly - 52);
  g.font = `italic bold 21px ${SERIF}`; g.fillStyle = '#5a3a1a'; g.fillText('Iridium · Z = 77', lx - 4, ly + lr + 38);
  return c;
}

// Vorder- und Rueckseite der Klappe "Spurensuche"
export function flapFaceCanvas(kind) {
  const c = mkCanvas(512, 340), g = c.getContext('2d');
  g.fillStyle = '#f2e6c8'; rr(g, 0, 0, 512, 340, 26); g.fill();
  const gr = g.createLinearGradient(0, 0, 0, 340); gr.addColorStop(0, '#6f6a7c'); gr.addColorStop(1, '#4e4a5e');
  g.fillStyle = gr; rr(g, 14, 14, 484, 312, 18); g.fill();
  g.save(); rr(g, 14, 14, 484, 312, 18); g.clip();
  g.fillStyle = '#868a96'; g.fillRect(0, 232, 512, 20); // Tonschicht als Zierstreifen
  g.fillStyle = 'rgba(190,150,100,.6)'; g.fillRect(0, 252, 512, 90); g.fillStyle = 'rgba(210,190,160,.5)'; g.fillRect(0, 200, 512, 32);
  g.restore();
  g.strokeStyle = 'rgba(255,240,200,.65)'; g.lineWidth = 3; g.setLineDash([10, 8]); rr(g, 30, 30, 452, 280, 14); g.stroke(); g.setLineDash([]);
  g.fillStyle = '#fff3d6'; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  g.font = `bold 52px ${SERIF}`; g.fillText('Spurensuche', 256, 112);
  magnifier(g, 214, 188, 40);
  g.font = `italic 30px ${SERIF}`; g.fillText(kind === 'top' ? 'klapp mich auf!' : 'Tippe für die Karte', 256, 296);
  if (kind === 'top') { g.beginPath(); g.moveTo(386, 188); g.lineTo(366, 168); g.lineTo(406, 168); g.closePath(); g.fillStyle = 'rgba(255,243,214,.85)'; g.fill(); }
  return c;
}

// ------------------------------------------------------------------ Krater (Decal, liegt auf dem Papier)
export function craterTexture() {
  const S = 512, c = mkCanvas(S, S), g = c.getContext('2d'), h = S / 2, r = mulberry32(31);
  // verbrannter, aufgeworfener Hof
  let gr = g.createRadialGradient(h, h, 0, h, h, h);
  gr.addColorStop(0, 'rgba(24,14,16,1)'); gr.addColorStop(0.38, 'rgba(40,26,28,.96)'); gr.addColorStop(0.62, 'rgba(62,44,42,.78)'); gr.addColorStop(0.86, 'rgba(70,54,50,.22)'); gr.addColorStop(1, 'rgba(70,54,50,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  // Auswurfstrahlen
  g.lineCap = 'round';
  for (let i = 0; i < 54; i++) {
    const a = r() * TAU, r0 = h * (0.36 + r() * 0.12), r1 = h * (0.6 + r() * 0.38);
    g.strokeStyle = r() < 0.6 ? 'rgba(150,130,120,.17)' : 'rgba(16,9,9,.32)'; g.lineWidth = 2 + r() * 6;
    g.beginPath(); g.moveTo(h + Math.cos(a) * r0, h + Math.sin(a) * r0); g.lineTo(h + Math.cos(a + (r() - 0.5) * 0.08) * r1, h + Math.sin(a + (r() - 0.5) * 0.08) * r1); g.stroke();
  }
  // Brocken
  for (let i = 0; i < 70; i++) { const a = r() * TAU, d = h * (0.4 + r() * 0.5); g.fillStyle = r() < 0.5 ? 'rgba(120,100,92,.7)' : 'rgba(26,16,16,.7)'; g.beginPath(); g.ellipse(h + Math.cos(a) * d, h + Math.sin(a) * d, 2 + r() * 5, 1.5 + r() * 3.5, r() * 3, 0, TAU); g.fill(); }
  // aufgeworfener Rand (staubig, nicht weiß)
  g.lineWidth = h * 0.11; g.strokeStyle = 'rgba(112,94,86,.95)'; g.beginPath(); g.arc(h, h, h * 0.34, 0, TAU); g.stroke();
  g.lineWidth = h * 0.05; g.strokeStyle = 'rgba(158,138,126,.85)'; g.beginPath(); g.arc(h - 2, h - 3, h * 0.37, 3.5, 5.0); g.stroke();
  g.lineWidth = h * 0.035; g.strokeStyle = 'rgba(24,14,14,.75)'; g.beginPath(); g.arc(h, h, h * 0.285, 0, TAU); g.stroke();
  // innere Grube
  gr = g.createRadialGradient(h, h, 0, h, h, h * 0.285);
  gr.addColorStop(0, '#1d0f0d'); gr.addColorStop(0.75, '#150b0c'); gr.addColorStop(1, '#33201f'); g.fillStyle = gr; g.beginPath(); g.arc(h, h, h * 0.28, 0, TAU); g.fill();
  // Glutrisse (klein, nur im Inneren)
  g.save(); g.beginPath(); g.arc(h, h, h * 0.27, 0, TAU); g.clip();
  g.shadowColor = 'rgba(255,120,30,.9)'; g.shadowBlur = 10;
  for (let i = 0; i < 11; i++) {
    let a = i / 11 * TAU + r() * 0.4, px = h + Math.cos(a) * h * 0.04, py = h + Math.sin(a) * h * 0.04;
    g.strokeStyle = '#d8561a'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(px, py);
    for (let k = 0; k < 5; k++) { a += (r() - 0.5) * 0.9; px += Math.cos(a) * h * 0.045; py += Math.sin(a) * h * 0.045; g.lineTo(px, py); } g.stroke();
  }
  g.shadowBlur = 0; g.strokeStyle = '#ffc060'; g.lineWidth = 1.6;
  for (let i = 0; i < 11; i++) {
    let a = i / 11 * TAU + 0.1, px = h + Math.cos(a) * h * 0.05, py = h + Math.sin(a) * h * 0.05; g.beginPath(); g.moveTo(px, py);
    for (let k = 0; k < 3; k++) { a += (r() - 0.5) * 0.8; px += Math.cos(a) * h * 0.04; py += Math.sin(a) * h * 0.04; g.lineTo(px, py); } g.stroke();
  }
  g.restore();
  return tex(c);
}

// Feuerstreifen: Kopf rechts (heiss, weiss-gelb), Schweif nach links (orange, ausblendend)
export function streakTexture() {
  const c = mkCanvas(512, 128), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 512, 0);
  gr.addColorStop(0, 'rgba(255,70,20,0)'); gr.addColorStop(0.35, 'rgba(255,100,25,.35)'); gr.addColorStop(0.7, 'rgba(255,160,60,.75)'); gr.addColorStop(0.92, 'rgba(255,235,170,.95)'); gr.addColorStop(1, 'rgba(255,255,235,1)');
  g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
  g.globalCompositeOperation = 'destination-in';
  const v = g.createLinearGradient(0, 0, 0, 128); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.5, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = v; g.fillRect(0, 0, 512, 128);
  return tex(c);
}

// ------------------------------------------------------------------ Druckwellen-Ring (Shader auf einer seitengrossen Plane)
export function makeRingMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    uniforms: { uC: { value: new THREE.Vector2() }, uR: { value: 0 }, uW: { value: 0.6 }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vP; void main(){ vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vP; uniform vec2 uC; uniform float uR; uniform float uW; uniform float uA;
      void main(){
        float d = length(vP - uC);
        float front = smoothstep(uR - uW, uR, d) * (1.0 - smoothstep(uR, uR + uW * 0.3, d));
        float trail = smoothstep(uR - uW * 3.4, uR - uW * 1.1, d) * (1.0 - smoothstep(uR - uW * 1.1, uR - uW * 0.1, d));
        float dust = (1.0 - smoothstep(uR - uW * 4.5, uR - uW * 2.0, d)) * step(0.01, uR) * 0.0;
        float a = (front * 0.8 + trail * 0.34 + dust) * uA;
        if (a < 0.004) discard;
        vec3 col = mix(vec3(0.30, 0.18, 0.16), vec3(0.98, 0.80, 0.58), clamp(front * 1.2, 0.0, 1.0));
        gl_FragColor = vec4(col, a);
      }`,
  });
}

// ------------------------------------------------------------------ Himmels-Overlay: gleiche Form wie die Himmelswand, Farbverlauf per Uniform
export function makeSkyOverlayMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
    uniforms: { cTop: { value: new THREE.Vector3(0.3, 0.05, 0.12) }, cMid: { value: new THREE.Vector3(0.7, 0.14, 0.12) }, cBot: { value: new THREE.Vector3(1.0, 0.48, 0.14) }, uA: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      varying vec2 vUv; uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cBot; uniform float uA;
      void main(){
        float y = vUv.y;
        vec3 c = y < 0.45 ? mix(cBot, cMid, y / 0.45) : mix(cMid, cTop, (y - 0.45) / 0.55);
        float n = 0.5 + 0.5 * sin(vUv.x * 41.0 + y * 6.0) * sin(vUv.x * 13.0 - y * 9.0);
        c *= 0.92 + 0.08 * n;
        gl_FragColor = vec4(c, uA);
      }`,
  });
}
export function overlayMesh(cut, mat) {
  const geo = cut.mesh.geometry.clone();
  const p = geo.attributes.position, uv = geo.attributes.uv;
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / (x1 - x0), (p.getY(i) - y0) / (y1 - y0));
  uv.needsUpdate = true;
  const m = new THREE.Mesh(geo, mat); m.position.z = 0.006; m.renderOrder = 1; m.castShadow = false; m.receiveShadow = false;
  m.visible = false;
  return m;
}

// ------------------------------------------------------------------ Hoehle des Purgatorius: Rueckwand mit dunkler Oeffnung + vordere Felslippe
export function denBackPart() {
  const mound = poly([[-1.2, 0], [-1.16, 0.3], [-0.9, 0.78], [-0.45, 1.12], [0.1, 1.22], [0.62, 1.06], [0.98, 0.7], [1.16, 0.3], [1.22, 0]], 2);
  const boulders = [rock(-0.92, 0.2, 0.34, 0.22, { seed: 3, n: 9, rough: 0.2 }), rock(0.98, 0.18, 0.3, 0.2, { seed: 8, n: 9, rough: 0.2 })];
  const mouth = [0.05, 0.4, 0.52, 0.4];
  return {
    layers: [
      {
        shapes: [mound], fill: { top: '#a69aa6', bottom: '#6a5a66' },
        deco(c, bb) {
          volume(c, bb, { dark: 'rgba(30,15,30,.4)', light: 'rgba(255,235,225,.3)' });
          const rg = mulberry32(12);
          for (let k = 0; k < 6; k++) { const y = 0.25 + k * 0.17; curve(c, [[bb.x0, y], [0, y + 0.05 * (k % 2 ? 1 : -1)], [bb.x1, y + 0.02]], 'rgba(60,40,55,.38)', 0.022, { alpha: 1 }); }
          for (let k = 0; k < 30; k++) fillPoly(c, blob(bb.x0 + rg() * bb.w, bb.y0 + rg() * bb.h * 0.95, 0.012 + rg() * 0.02, 0.01 + rg() * 0.014, 0, 6), rg() < 0.5 ? 'rgba(255,240,230,.4)' : 'rgba(40,25,40,.4)');
          // dunkle Oeffnung mit Innenschatten
          fillPoly(c, blob(mouth[0] - 0.01, mouth[1] + 0.02, mouth[2] + 0.1, mouth[3] + 0.09, 0, 40), '#2a1a28', 0.55);
          fillGrad(c, blob(mouth[0], mouth[1], mouth[2], mouth[3], 0, 40), 0, mouth[1] + mouth[3], 0, mouth[1] - mouth[3], [[0, '#0f070d'], [0.55, '#1b0e18'], [1, '#32202e']], 1);
          curve(c, [[mouth[0] - mouth[2], mouth[1] + 0.06], [mouth[0] - mouth[2] * 0.5, mouth[1] + mouth[3] * 1.04], [mouth[0] + mouth[2] * 0.5, mouth[1] + mouth[3] * 1.04], [mouth[0] + mouth[2], mouth[1] + 0.06]], 'rgba(255,235,225,.5)', 0.03, { alpha: 1 });
        },
      },
      { shapes: boulders, fill: { top: '#8f8290', bottom: '#5c4c5a' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(30,15,30,.4)', light: 'rgba(255,235,225,.3)' }); } },
    ],
  };
}
export function denLipPart() {
  const lip = poly([[-1.35, 0], [-1.3, 0.2], [-0.95, 0.36], [-0.5, 0.42], [-0.05, 0.37], [0.45, 0.44], [0.95, 0.35], [1.3, 0.18], [1.38, 0]], 2);
  const stones = [rock(-0.2, 0.12, 0.22, 0.14, { seed: 14, n: 8, rough: 0.2 }), rock(0.62, 0.1, 0.2, 0.13, { seed: 6, n: 8, rough: 0.2 })];
  return {
    layers: [
      { shapes: [lip], fill: { top: '#b4a8b2', bottom: '#74646f' }, deco(c, bb) { volume(c, bb, { dark: 'rgba(30,15,30,.38)', light: 'rgba(255,238,230,.34)' }); curve(c, [[bb.x0 + 0.1, 0.34], [-0.4, 0.4], [0.2, 0.38], [bb.x1 - 0.1, 0.32]], 'rgba(255,240,232,.5)', 0.03, { alpha: 1 }); } },
      { shapes: stones, fill: { top: '#9d909c', bottom: '#665663' }, deco(c, bb) { volume(c, bb); } },
    ],
  };
}

// ------------------------------------------------------------------ Schild "Die Voegel haben ueberlebt" (Pop-up nach dem Ablauf)
export function signPart() {
  const plate = poly([[-1.75, 0.95], [-1.75, 2.05], [1.75, 2.05], [1.75, 0.95]], 0);
  const post = poly([[-0.14, 0], [-0.14, 1.0], [0.14, 1.0], [0.14, 0]], 0);
  return {
    layers: [
      { shapes: [post], fill: { top: '#8a6a4a', bottom: '#5a4030' }, deco(c, bb) { volume(c, bb); } },
      {
        shapes: [plate], fill: { top: '#f6ead0', bottom: '#e6d2a4' },
        deco(c, bb) {
          const { ctx, tf, S } = c;
          const [x0, y0] = tf(-1.65, 2.0), [x1, y1] = tf(1.65, 1.0);
          ctx.save(); ctx.strokeStyle = 'rgba(139,30,30,.55)'; ctx.lineWidth = 0.025 * S; ctx.setLineDash([0.12 * S, 0.09 * S]); ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.restore();
          ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const cx = (x0 + x1) / 2;
          ctx.fillStyle = '#6b4a2a'; ctx.font = `italic ${0.2 * S}px ${SERIF}`; ctx.fillText('Eine Gruppe hat überlebt:', cx, y0 + (y1 - y0) * 0.27);
          ctx.fillStyle = '#8B1E1E'; ctx.font = `bold ${0.46 * S}px ${SERIF}`; ctx.fillText('die Vögel!', cx - 0.2 * S, y0 + (y1 - y0) * 0.68);
          // kleiner Vogel
          const bx = cx + 1.0 * S, by = y0 + (y1 - y0) * 0.66;
          ctx.fillStyle = '#5d4030'; ctx.beginPath(); ctx.ellipse(bx, by, 0.2 * S, 0.12 * S, -0.2, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(bx + 0.19 * S, by - 0.08 * S, 0.075 * S, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx + 0.25 * S, by - 0.09 * S); ctx.lineTo(bx + 0.36 * S, by - 0.06 * S); ctx.lineTo(bx + 0.25 * S, by - 0.04 * S); ctx.fill();
          ctx.beginPath(); ctx.moveTo(bx - 0.18 * S, by); ctx.lineTo(bx - 0.38 * S, by + 0.07 * S); ctx.lineTo(bx - 0.16 * S, by + 0.07 * S); ctx.fill();
          ctx.fillStyle = '#f3e3c4'; ctx.beginPath(); ctx.arc(bx + 0.21 * S, by - 0.09 * S, 0.016 * S, 0, TAU); ctx.fill();
          ctx.restore();
        },
      },
    ],
  };
}
