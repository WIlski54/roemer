// Wetter für das Buch: Regen (Striche auf der GPU + Wellenringe + Spritzer), Sturm (dunkleres, kühles Licht, Böen,
// sanfter Blitz + Donner) und Dunst (treibende Nebelschichten). Alles aus Code; der Wetter-Knopf in der UI schaltet durch.
//
// Lichtschutz: höchstens EIN Blitz alle ≥ 5 s (≈ 0,2 Hz), Gesamtdauer ≤ 140 ms, Zusatzhelligkeit moderat (Licht, kein
// Vollbild-Weiß). Im „Ruhigen Modus“ gibt es gar keinen Blitz, nur fernes Grollen.
import * as THREE from 'three';
import { clamp, lerp, mulberry32, fbm, smooth } from './util.js';
import { PAGE_W, PAGE_D } from './scene.js';

export const WEATHER_MODES = ['clear', 'rain', 'storm', 'mist'];
export const WEATHER_LABEL = { clear: 'Klar', rain: 'Regen', storm: 'Sturm', mist: 'Dunst' };
const BLOCKED_PAGE = 7;            // Einschlag: eigenes „Wetter“ (Aschewolke, Stille)
const BOX_X = PAGE_W * 2 + 3.2, BOX_Z = PAGE_D + 2.6, BOX_H = 9.5;
const RAIN_COUNT = { high: 900, med: 600, low: 340 };
const RIPPLES = { high: 44, med: 28, low: 16 };

// ---------------------------------------------------------------- Regen-Striche (reine GPU-Animation)
const RAIN_VS = /* glsl */ `
attribute vec3 aC;                 // x: Seite (-1/1), y: Ende (0 = Schweif, 1 = Kopf), z: Zufall
uniform float uT, uH, uSlant, uSpeed, uLen, uW, uY0, uPix, uDensity;
uniform vec3 uBox;
varying float vA; varying float vY; varying float vS;
void main(){
  float rnd = aC.z;
  float spd = uSpeed * (0.85 + 0.3 * rnd);
  float fall = mod(position.z * uH + uT * spd, uH);
  float y = uH - fall;
  vec3 dir = normalize(vec3(uSlant, -1.0, 0.0));
  vec3 P = vec3((position.x - 0.5) * uBox.x + uSlant * (fall - uH * 0.5), uY0 + y, (position.y - 0.5) * uBox.z);
  vec3 pos = P - dir * uLen * (0.7 + 0.6 * rnd) * (1.0 - aC.y);
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vec3 toCam = cameraPosition - wp.xyz;
  float dist = length(toCam);
  vec3 side = normalize(cross(dir, toCam));
  float w = max(uW, uPix * dist);
  wp.xyz += side * aC.x * w * 0.5;
  gl_Position = projectionMatrix * viewMatrix * wp;
  float gate = step(fract(position.x * 37.17 + position.y * 91.3), uDensity);
  vA = (0.12 + 0.88 * aC.y) * gate * smoothstep(0.0, 0.3, y) * (1.0 - smoothstep(uH - 1.6, uH, y)) * (0.55 + 0.45 * rnd);
  vY = pos.y; vS = aC.x;
}`;
const RAIN_FS = /* glsl */ `
uniform vec3 uColor; uniform float uOpacity, uY0;
varying float vA; varying float vY; varying float vS;
void main(){
  if (vY < uY0) discard;
  float a = vA * uOpacity * (1.0 - vS * vS * 0.8);
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}`;

// ---------------------------------------------------------------- Dunst: gekachelte Nebeltextur + Schicht-Shader
function tileableFog(w = 256, h = 128) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  const f = (x, y) => fbm(x * 0.045 + 3.1, y * 0.07 + 7.7, 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // nahtlos kacheln: vier verschobene Proben, glatt gemischt
      const u = x / w, v = y / h, wu = smooth(u), wv = smooth(v);
      const a = f(x, y), b = f(x - w, y), cc = f(x, y - h), d = f(x - w, y - h);
      const n = lerp(lerp(a, b, wu), lerp(cc, d, wu), wv);
      const t = clamp(0.5 + n * 1.5, 0, 1);
      const al = Math.pow(smooth(clamp((t - 0.28) / 0.62, 0, 1)), 1.2);
      const i = (y * w + x) * 4;
      img.data[i] = 255; img.data[i + 1] = 255; img.data[i + 2] = 255; img.data[i + 3] = Math.round(al * 255);
    }
  }
  g.putImageData(img, 0, 0);
  return c;
}
const MIST_VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MIST_FS = `
uniform sampler2D uMap; uniform vec2 uOff, uRep; uniform float uOpacity; uniform vec3 uColor;
varying vec2 vUv;
void main(){
  vec2 e = abs(vUv - 0.5) * 2.0;
  float edge = (1.0 - smoothstep(0.55, 1.0, e.x)) * (1.0 - smoothstep(0.35, 1.0, e.y));
  float a = texture2D(uMap, vUv * uRep + uOff).a * edge * uOpacity;
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}`;

function ringTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.62, 'rgba(255,255,255,0)'); gr.addColorStop(0.8, 'rgba(255,255,255,0.95)');
  gr.addColorStop(0.9, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Weather {
  constructor(app) {
    this.app = app; this.stage = app.stage;
    this.mode = 'clear';          // vom Knopf gewählt
    this.page = -1;               // Station, auf der das Buch (bald) steht
    this.k = { rain: 0, storm: 0, mist: 0 };
    this.root = new THREE.Group(); this.root.name = 'weather'; this.stage.scene.add(this.root);
    this.rnd = mulberry32(2718);
    this.nextFlash = 6; this.thunderAt = -1; this.thunderDur = 3; this.flashT0 = -1e9;
    this.wx = this.stage.wx;      // { dim, cool, flash } – wird in Stage._applyMood ausgewertet
    this.buildRain(); this.buildRipples(); this.buildMist(); this.buildVeil();
    this.applyTier(this.stage.tier);
    this.audioKey = '';
  }

  // ------------------------------------------------------------ Aufbau
  buildRain() {
    const n = RAIN_COUNT.high, rnd = this.rnd;
    const pos = new Float32Array(n * 4 * 3), aC = new Float32Array(n * 4 * 3), idx = new Uint32Array(n * 6);
    const corners = [[-1, 0], [1, 0], [-1, 1], [1, 1]];
    for (let i = 0; i < n; i++) {
      const x = rnd(), z = rnd(), ph = rnd(), r = rnd();
      for (let c = 0; c < 4; c++) {
        const o = (i * 4 + c) * 3;
        pos[o] = x; pos[o + 1] = z; pos[o + 2] = ph;
        aC[o] = corners[c][0]; aC[o + 1] = corners[c][1]; aC[o + 2] = r;
      }
      const v = i * 4; idx.set([v, v + 1, v + 2, v + 1, v + 3, v + 2], i * 6);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aC', new THREE.BufferAttribute(aC, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.rainU = {
      uT: { value: 0 }, uH: { value: BOX_H }, uSlant: { value: 0.05 }, uSpeed: { value: 15 }, uLen: { value: 0.9 }, uW: { value: 0.022 },
      uY0: { value: 0.1 }, uPix: { value: 0.002 }, uDensity: { value: 0.6 }, uBox: { value: new THREE.Vector3(BOX_X, 0, BOX_Z) },
      uColor: { value: new THREE.Color(0.80, 0.88, 1.0) }, uOpacity: { value: 0 },
    };
    const mat = new THREE.ShaderMaterial({ vertexShader: RAIN_VS, fragmentShader: RAIN_FS, uniforms: this.rainU, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.rain = new THREE.Mesh(geo, mat); this.rain.frustumCulled = false; this.rain.renderOrder = 9; this.rain.visible = false;
    this.root.add(this.rain);
  }
  buildRipples() {
    const tex = ringTexture(), geo = new THREE.PlaneGeometry(1, 1);
    this.ripples = [];
    for (let i = 0; i < RIPPLES.high; i++) {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, color: 0xdbe8ff, polygonOffset: true, polygonOffsetFactor: -3 }));
      m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 6;
      this.root.add(m); this.ripples.push({ m, age: 0, life: 1, on: false, r: 0.4 });
    }
    this.rippleCursor = 0; this.rippleAcc = 0;
  }
  buildMist() {
    const cv = tileableFog(), tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
    this.mist = [];
    const geo = new THREE.PlaneGeometry(BOX_X + 4, BOX_Z + 3);
    for (let i = 0; i < 5; i++) {
      const u = { uMap: { value: tex }, uOff: { value: new THREE.Vector2(i * 0.31, i * 0.17) }, uRep: { value: new THREE.Vector2(1.7 + i * 0.15, 1.05) }, uOpacity: { value: 0 }, uColor: { value: new THREE.Color(0.86, 0.9, 0.93) } };
      const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ vertexShader: MIST_VS, fragmentShader: MIST_FS, uniforms: u, transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2; m.position.y = 0.45 + i * 0.95; m.renderOrder = 7 + i * 0.01; m.visible = false;
      this.root.add(m);
      this.mist.push({ m, u, sx: (i % 2 ? -1 : 1) * (0.006 + i * 0.0016), sy: 0.002 + i * 0.0009 });
    }
  }
  buildVeil() { // Dunkelverlauf am oberen Bildrand (Gewitterwolken) bzw. heller Hauch (Dunst); reine CSS-Fläche, ändert sich nur langsam
    const v = document.createElement('div'); v.id = 'wxveil'; v.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(v, document.getElementById('ui'));
    this.veil = v; this._veil = '';
  }

  applyTier(t) {
    const n = RAIN_COUNT[t.name] || 600;
    this.rain.geometry.setDrawRange(0, n * 6);
    this.rippleMax = RIPPLES[t.name] || 28;
    this.splash = t.name !== 'low';
  }
  onResize(h) { const fov = this.stage.camera.fov * Math.PI / 180; this.rainU.uPix.value = (2 * Math.tan(fov / 2) / h) * 1.4; }

  // ------------------------------------------------------------ Steuerung
  get blocked() { return this.page < 0 || this.page === BLOCKED_PAGE; }
  get effective() { return this.blocked ? 'clear' : this.mode; }
  setPage(s) { this.page = s; this.syncAudio(); }
  setMode(m) { this.mode = m; this.syncAudio(); }
  cycle() {
    const app = this.app;
    if (this.page < 0) { app.ui.showToast('Öffne zuerst das Buch, dann kannst du das Wetter ändern.'); return this.mode; }
    if (this.page === BLOCKED_PAGE) { app.ui.showToast('Hier macht der Himmel gerade etwas ganz anderes …'); return this.mode; }
    const next = WEATHER_MODES[(WEATHER_MODES.indexOf(this.mode) + 1) % WEATHER_MODES.length];
    this.setMode(next);
    if (next === 'storm') this.nextFlash = this.app.calm ? 6 : 2.2;
    return next;
  }
  syncAudio() {
    const e = this.effective, au = this.app.audio, key = e + (this.app.calm ? 'c' : '');
    if (key === this.audioKey) return; this.audioKey = key;
    const rain = { clear: 0, rain: 0.5, storm: 0.95, mist: 0 }[e], wind = { clear: 0, rain: 0.12, storm: 0.8, mist: 0.1 }[e];
    au.ctl('rainfall', rain); au.ctl('wind', wind);
  }

  // ------------------------------------------------------------ pro Frame
  update(dt, t) {
    const app = this.app, e = this.effective, calm = app.calm;
    const tgt = { rain: e === 'rain' ? 0.62 : e === 'storm' ? 1 : 0, storm: e === 'storm' ? 1 : 0, mist: e === 'mist' ? 1 : 0 };
    const kk = 1 - Math.exp(-dt * 1.7), k = this.k;
    k.rain += (tgt.rain - k.rain) * kk; k.storm += (tgt.storm - k.storm) * kk; k.mist += (tgt.mist - k.mist) * kk;
    if (k.rain < 0.003 && tgt.rain === 0) k.rain = 0; if (k.storm < 0.003 && tgt.storm === 0) k.storm = 0; if (k.mist < 0.003 && tgt.mist === 0) k.mist = 0;
    const on = k.rain > 0 || k.storm > 0 || k.mist > 0;

    // ---- Licht (Stage liest wx in _applyMood)
    const wx = this.wx;
    wx.dim = 1 - 0.30 * k.storm - 0.07 * k.rain - 0.07 * k.mist;
    wx.cool = clamp(0.55 * k.storm + 0.25 * k.rain + 0.35 * k.mist, 0, 1);
    this.lightning(dt, t, e, calm);

    // ---- Regen
    const rainOn = k.rain > 0.004;
    this.rain.visible = rainOn;
    if (rainOn) {
      const U = this.rainU, s = k.storm;
      U.uT.value = t; U.uOpacity.value = 0.72 * Math.min(1, k.rain * 1.2);
      U.uDensity.value = lerp(0.72, 1.0, s) * clamp(k.rain / 0.62, 0, 1);
      U.uSpeed.value = lerp(15, 21, s); U.uLen.value = lerp(0.85, 1.35, s);
      const gust = 0.5 + 0.5 * Math.sin(t * 0.55) * Math.sin(t * 0.23 + 1.3);
      U.uSlant.value = lerp(0.05, calm ? 0.28 : 0.30 + 0.28 * gust, s);
      const bk = this.app.book; U.uY0.value = Math.max(bk.pageTopY('L', Math.max(0, bk.cur - 1)), bk.pageTopY('R', Math.max(0, bk.cur - 1))) + 0.01;
      this.root.position.set(bk.group.position.x, 0, bk.group.position.z);
      this.rippleStep(dt, k.rain, s);
    } else this.rippleStep(dt, 0, 0);

    // ---- Dunst
    const reading = app.reading ? 0.4 : 1, elF = clamp((1.5 - app.cam.el.x) / 0.35, 0.35, 1);
    for (let i = 0; i < this.mist.length; i++) {
      const L = this.mist[i], u = L.u;
      L.m.visible = k.mist > 0.004;
      if (!L.m.visible) continue;
      u.uOff.value.x += L.sx * dt * (calm ? 0.5 : 1); u.uOff.value.y += L.sy * dt * (calm ? 0.5 : 1);
      u.uOpacity.value = k.mist * (0.17 + 0.026 * i) * reading * elF;
    }
    if (on) this.root.position.set(app.book.group.position.x, 0, app.book.group.position.z);

    // ---- Himmelsschleier
    const vs = (k.storm * 0.9).toFixed(2) + '|' + (k.mist * 0.8).toFixed(2) + '|' + (k.rain * 0.4).toFixed(2);
    if (vs !== this._veil) {
      this._veil = vs;
      this.veil.style.setProperty('--st', (k.storm * 0.9).toFixed(3)); this.veil.style.setProperty('--ms', (k.mist * 0.8).toFixed(3)); this.veil.style.setProperty('--rn', (k.rain * 0.4).toFixed(3));
      this.veil.style.display = (k.storm + k.mist + k.rain) > 0.003 ? 'block' : 'none';
    }
  }

  rippleStep(dt, rain, storm) {
    const R = this.ripples, rnd = this.rnd, app = this.app, bk = app.book;
    if (rain > 0.02) {
      this.rippleAcc += dt * (10 + 22 * storm) * rain * this.stage.tier.fx * (app.calm ? 0.7 : 1);
      const yL = bk.pageTopY('L', Math.max(0, bk.cur - 1)), yR = bk.pageTopY('R', Math.max(0, bk.cur - 1));
      let guard = 6, active = 0; for (const r of R) if (r.on) active++;
      while (this.rippleAcc >= 1 && guard-- > 0) {
        this.rippleAcc -= 1;
        const x = (rnd() * 2 - 1) * (PAGE_W - 0.8), z = (rnd() * 2 - 1) * (PAGE_D / 2 - 0.5);
        if (active >= this.rippleMax) break;
        active++;
        const r = R[this.rippleCursor]; this.rippleCursor = (this.rippleCursor + 1) % R.length;
        r.on = true; r.age = 0; r.life = 0.55 + rnd() * 0.45; r.r = 0.34 + rnd() * 0.34 + storm * 0.12;
        r.m.position.set(x, (x < 0 ? yL : yR) + 0.012, z); r.m.visible = true;
        if (this.splash && !app.calm && rnd() < 0.55) {
          const wp = this.root.position;
          for (let q = 0; q < 2; q++) app.fx.dust.emit({ x: wp.x + x, y: (x < 0 ? yL : yR) + 0.03, z: wp.z + z, vx: (rnd() - 0.5) * 0.9, vy: 1.3 + rnd() * 1.4, vz: (rnd() - 0.5) * 0.9, life: 0.32 + rnd() * 0.2, size: 0.045, color: [0.86, 0.93, 1], alpha: 0.5, grav: 9 });
        }
      }
    }
    for (const r of R) {
      if (!r.on) continue;
      r.age += dt; const k = r.age / r.life;
      if (k >= 1) { r.on = false; r.m.visible = false; r.m.material.opacity = 0; continue; }
      const s = 0.07 + r.r * (1 - Math.pow(1 - k, 2.2));
      r.m.scale.set(s * 2, s * 2, 1); r.m.material.opacity = 0.8 * Math.pow(1 - k, 1.4);
    }
  }

  lightning(dt, t, e, calm) {
    const wx = this.wx, au = this.app.audio;
    // Flash-Hüllkurve in ECHTZEIT (unabhängig von der Bildrate): Anstieg sofort, Abklingen in 130 ms
    const el = (performance.now() - this.flashT0) / 1000;
    wx.flash = el >= 0 && el < 0.13 ? Math.pow(1 - el / 0.13, 2) * 0.72 : 0;
    if (e !== 'storm' || this.k.storm < 0.7) { this.thunderAt = -1; return; }
    this.nextFlash -= dt;
    if (this.nextFlash <= 0) {
      this.nextFlash = 5.5 + this.rnd() * 7;                       // ≥ 5,5 s Abstand → deutlich unter 3 Hz
      if (calm) { this.nextFlash = 14 + this.rnd() * 10; au.sfx('rumble', { dur: 2.2 }); }
      else { this.flashT0 = performance.now(); wx.flash = 0.72; this.thunderAt = 0.35 + this.rnd() * 0.9; this.thunderDur = 2.6 + this.rnd() * 1.6; }
    }
    if (this.thunderAt >= 0) { this.thunderAt -= dt; if (this.thunderAt < 0) { au.sfx('rumble', { dur: this.thunderDur }); this.thunderAt = -1; } }
  }
}
