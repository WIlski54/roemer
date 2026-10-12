// Stage: renderer, lights, wooden table, quality tiers, vignette-free (vignette is CSS).
import * as THREE from 'three';
import { fbm, mulberry32, lerp, clamp } from './util.js';
import { setMaxAnisotropy } from './papercut.js';

export const PAGE_W = 12;   // width of one page (world units)
export const PAGE_D = 8.5;  // depth of one page

export const TIERS = {
  high: { name: 'high', pr: 2, shadow: 2048, motes: 260, fx: 1.0, pageTex: 1536, cutTex: 1024 },
  med: { name: 'med', pr: 1.5, shadow: 1024, motes: 140, fx: 0.7, pageTex: 1280, cutTex: 768 },
  low: { name: 'low', pr: 1, shadow: 1024, motes: 60, fx: 0.4, pageTex: 1024, cutTex: 640 },
};

// ---------- wood ----------
function makeWood(w = 1536, h = 768) {
  const col = document.createElement('canvas'); col.width = w; col.height = h;
  const bump = document.createElement('canvas'); bump.width = w; bump.height = h;
  const g = col.getContext('2d'), gb = bump.getContext('2d');
  const img = g.createImageData(w, h), imb = gb.createImageData(w, h);
  const rnd = mulberry32(2024);
  const planks = 6, ph = h / planks;
  const tint = [], off = [];
  for (let i = 0; i < planks; i++) { tint.push(0.8 + rnd() * 0.4); off.push(rnd() * 100); }
  for (let y = 0; y < h; y++) {
    const pi = Math.min(planks - 1, Math.floor(y / ph));
    const seam = Math.min(y - pi * ph, (pi + 1) * ph - y);
    for (let x = 0; x < w; x++) {
      const warp = fbm(x * 0.0035 + off[pi], y * 0.015, 3) * 5.0;
      const ring = Math.sin((y * 0.55 + warp * 14 + off[pi] * 3) * 0.18);
      const fine = fbm(x * 0.02, y * 0.7 + off[pi], 2);
      let v = 0.5 + ring * 0.16 + fine * 0.25;
      if (seam < 2.2) v *= 0.35 + seam * 0.25;
      const t = tint[pi];
      const r = (70 + v * 70) * t, gg = (32 + v * 34) * t, b = (20 + v * 20) * t;
      const i = (y * w + x) * 4;
      img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = 255;
      const bv = clamp(v * 255 * (seam < 2.5 ? 0.15 : 1), 0, 255);
      imb.data[i] = imb.data[i + 1] = imb.data[i + 2] = bv; imb.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0); gb.putImageData(imb, 0, 0);
  return { col, bump };
}

export class Stage {
  constructor(canvas, { tier = 'high', lockTier = false } = {}) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    const r = this.renderer;
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.setClearColor(0x1a0c07, 1);
    setMaxAnisotropy(Math.min(8, r.capabilities.getMaxAnisotropy()));
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x1a0c07, 55, 110);
    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.5, 200);
    this.tierName = tier; this.tier = TIERS[tier]; this.lockTier = lockTier;
    this.ft = 16; this._slow = 0; this._fast = 0; this._frames = 0;
    this.moodNow = null;
    this.wx = { dim: 1, cool: 0, flash: 0 };   // Wetter: Dimmen, kühle Tönung, Blitz (siehe weather.js)

    // ----- lights
    this.hemi = new THREE.HemisphereLight(0xfff1dc, 0x7a5236, 1.75);
    this.scene.add(this.hemi);
    this.key = new THREE.DirectionalLight(0xffeccc, 2.3);
    this.key.position.set(-13, 21, 9);
    this.key.target.position.set(0, 0, 0.5);
    this.key.castShadow = true;
    const sc = this.key.shadow.camera;
    sc.left = -17; sc.right = 17; sc.top = 13; sc.bottom = -13; sc.near = 4; sc.far = 60;
    this.key.shadow.bias = -0.0006; this.key.shadow.normalBias = 0.03; this.key.shadow.radius = 3;
    this.scene.add(this.key, this.key.target);
    this.rim = new THREE.DirectionalLight(0xffd6a0, 0.0);
    this.rim.position.set(14, 8, -12);
    this.scene.add(this.rim);

    // ----- table
    const { col, bump } = makeWood();
    const tex = new THREE.CanvasTexture(col); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1.6, 1.6);
    const bt = new THREE.CanvasTexture(bump); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; bt.repeat.copy(tex.repeat);
    this.tableMat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: bt, bumpScale: 1.4, roughness: 0.72, metalness: 0.0 });
    // Fein unterteilt: zwei riesige Dreiecke ragen hinter die Kamera und liefern bei manchen Seitenverhältnissen
    // (z. B. exakt 1024x768) falsche Tiefenwerte, der Tisch überdeckt dann Teile des Buchs.
    const table = new THREE.Mesh(new THREE.PlaneGeometry(150, 100, 30, 20), this.tableMat);
    table.rotation.x = -Math.PI / 2; table.position.y = -0.31; table.receiveShadow = true;
    this.table = table; this.scene.add(table);
    this.tableY = -0.31;

    this.applyTier(tier);
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  applyTier(name) {
    this.tierName = name; this.tier = TIERS[name];
    const r = this.renderer;
    r.setPixelRatio(Math.min(devicePixelRatio || 1, this.tier.pr));
    const sh = this.key.shadow;
    if (sh.map && sh.mapSize.x !== this.tier.shadow) { sh.map.dispose(); sh.map = null; }
    sh.mapSize.set(this.tier.shadow, this.tier.shadow);
    this.resize();
    if (this.onTier) this.onTier(this.tier);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    if (this.onResize) this.onResize(w, h);
  }

  // adaptive quality from frame time
  sample(dt) {
    this.ft = lerp(this.ft, dt * 1000, 0.06);
    this._frames++;
    if (this.lockTier || this._frames < 90) return;
    if (this.ft > 30) this._slow++; else this._slow = Math.max(0, this._slow - 1);
    if (this.ft < 13) this._fast++; else this._fast = 0;
    if (this._slow > 70) {
      this._slow = 0;
      const next = this.tierName === 'high' ? 'med' : this.tierName === 'med' ? 'low' : null;
      if (next) this.applyTier(next);
    }
  }

  // smoothly blend light mood: {key:[hex,intensity], hemi:[sky,ground,int], pos:[x,y,z], table:[r,g,b]}
  setMood(m, instant) {
    this.moodTarget = m;
    if (instant || !this.moodNow) { this.moodNow = JSON.parse(JSON.stringify(m)); this._applyMood(); }
  }
  updateMood(dt) {
    if (!this.moodTarget || !this.moodNow) return;
    const k = 1 - Math.exp(-dt * 2.2), a = this.moodNow, b = this.moodTarget;
    const mix = (x, y) => x + (y - x) * k;
    a.keyC = a.keyC.map((v, i) => mix(v, b.keyC[i])); a.keyI = mix(a.keyI, b.keyI);
    a.skyC = a.skyC.map((v, i) => mix(v, b.skyC[i])); a.gndC = a.gndC.map((v, i) => mix(v, b.gndC[i])); a.hemiI = mix(a.hemiI, b.hemiI);
    a.pos = a.pos.map((v, i) => mix(v, b.pos[i])); a.rimI = mix(a.rimI, b.rimI || 0);
    this._applyMood();
  }
  _applyMood() {
    const a = this.moodNow, w = this.wx, ex = (this.exposure ?? 1) * w.dim, c = w.cool, f = w.flash;
    const tint = (v) => [(v[0] * (1 - 0.30 * c)) * (1 - f) + 0.86 * f, (v[1] * (1 - 0.12 * c)) * (1 - f) + 0.93 * f, v[2] * (1 - 0.0 * c) * (1 - f) + 1.0 * f];
    this.key.color.setRGB(...tint(a.keyC)); this.key.intensity = a.keyI * ex * (1 + 1.1 * f);
    this.hemi.color.setRGB(...tint(a.skyC)); this.hemi.groundColor.setRGB(...a.gndC); this.hemi.intensity = a.hemiI * ex * (1 + 0.9 * f);
    this.key.position.set(...a.pos);
    this.rim.intensity = a.rimI;
  }
  render() { this.renderer.render(this.scene, this.camera); }
}

const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
export function mood({ key = '#ffeccc', keyI = 2.3, sky = '#fff1dc', gnd = '#7a5236', hemiI = 1.75, pos = [-13, 21, 9], rim = 0 } = {}) {
  return { keyC: hex(key), keyI, skyC: hex(sky), gndC: hex(gnd), hemiI, pos, rimI: rim };
}
