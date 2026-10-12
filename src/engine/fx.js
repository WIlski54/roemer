// Particle systems: soft round sprites with per-particle colour/size/alpha. Used for ambient motes and event bursts.
import * as THREE from 'three';
import { mulberry32, clamp, lerp } from './util.js';

const VS = `
attribute vec4 aColor; attribute float aSize;
uniform float uScale;
varying vec4 vColor;
void main(){
  vColor = aColor;
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  gl_PointSize = aSize * uScale / max(0.1, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const FS = `
varying vec4 vColor;
void main(){
  vec2 p = gl_PointCoord - 0.5; float d = length(p)*2.0;
  float a = smoothstep(1.0, 0.15, d) * vColor.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor.rgb, a);
}`;

export class Particles {
  constructor(scene, max = 800, { additive = false, depthTest = true } = {}) {
    this.max = max; this.n = 0;
    this.pos = new Float32Array(max * 3); this.col = new Float32Array(max * 4); this.size = new Float32Array(max);
    this.vel = new Float32Array(max * 3); this.life = new Float32Array(max); this.age = new Float32Array(max);
    this.s0 = new Float32Array(max); this.a0 = new Float32Array(max); this.grav = new Float32Array(max); this.drag = new Float32Array(max); this.grow = new Float32Array(max);
    this.alive = new Uint8Array(max);
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aColor', new THREE.BufferAttribute(this.col, 4));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({
      vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, depthTest,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, uniforms: { uScale: { value: 800 } },
    });
    this.points = new THREE.Points(this.geo, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 10;
    scene.add(this.points);
    this.cursor = 0; this.rnd = mulberry32(99);
    this.limit = max;
  }
  setScale(h, fovDeg, pr) { this.mat.uniforms.uScale.value = (h * pr) / (2 * Math.tan((fovDeg * Math.PI) / 360)); }
  // emit: {x,y,z, vx,vy,vz, life, size, color:[r,g,b], alpha, grav, drag, grow}
  emit(o) {
    const i = this.cursor; this.cursor = (this.cursor + 1) % Math.min(this.max, this.limit);
    const c = o.color || [1, 1, 1];
    this.pos[i * 3] = o.x; this.pos[i * 3 + 1] = o.y; this.pos[i * 3 + 2] = o.z;
    this.vel[i * 3] = o.vx || 0; this.vel[i * 3 + 1] = o.vy || 0; this.vel[i * 3 + 2] = o.vz || 0;
    this.life[i] = o.life || 1; this.age[i] = 0; this.s0[i] = o.size || 0.1; this.a0[i] = o.alpha ?? 1;
    this.grav[i] = o.grav || 0; this.drag[i] = o.drag || 0; this.grow[i] = o.grow || 0;
    this.col[i * 4] = c[0]; this.col[i * 4 + 1] = c[1]; this.col[i * 4 + 2] = c[2]; this.col[i * 4 + 3] = this.a0[i];
    this.size[i] = this.s0[i]; this.alive[i] = 1;
    return i;
  }
  burst(n, o, spread = {}) {
    const r = this.rnd;
    for (let k = 0; k < n; k++) {
      const a = r() * Math.PI * 2, e = (r() - 0.3) * (spread.elev ?? 1), sp = (spread.speed ?? 1) * (0.4 + r() * 0.8);
      this.emit({
        ...o,
        x: o.x + (r() - 0.5) * (spread.px || 0), y: o.y + (r() - 0.5) * (spread.py || 0), z: o.z + (r() - 0.5) * (spread.pz || 0),
        vx: Math.cos(a) * sp * (spread.h ?? 1) + (o.vx || 0), vz: Math.sin(a) * sp * (spread.h ?? 1) + (o.vz || 0), vy: (spread.up ?? 1) * sp * (0.4 + Math.abs(e)) + (o.vy || 0),
        life: (o.life || 1) * (0.6 + r() * 0.8), size: (o.size || 0.1) * (0.6 + r() * 0.8),
      });
    }
  }
  clear() { this.alive.fill(0); this.size.fill(0); this.geo.attributes.aSize.needsUpdate = true; }
  update(dt) {
    let any = false;
    for (let i = 0; i < this.max; i++) {
      if (!this.alive[i]) continue;
      any = true;
      this.age[i] += dt;
      const k = this.age[i] / this.life[i];
      if (k >= 1) { this.alive[i] = 0; this.size[i] = 0; this.col[i * 4 + 3] = 0; continue; }
      const d = Math.exp(-this.drag[i] * dt);
      this.vel[i * 3] *= d; this.vel[i * 3 + 1] = this.vel[i * 3 + 1] * d - this.grav[i] * dt; this.vel[i * 3 + 2] *= d;
      this.pos[i * 3] += this.vel[i * 3] * dt; this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt; this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const fade = k < 0.15 ? k / 0.15 : 1 - (k - 0.15) / 0.85;
      this.col[i * 4 + 3] = this.a0[i] * fade * fade * (3 - 2 * fade) ;
      this.size[i] = this.s0[i] * (1 + this.grow[i] * k);
    }
    if (any || this._dirty) {
      this.geo.attributes.position.needsUpdate = true; this.geo.attributes.aColor.needsUpdate = true; this.geo.attributes.aSize.needsUpdate = true;
      this._dirty = any;
    }
  }
}

// Ambient motes: slowly wandering specks above the book. Preset describes colour/size/drift.
export class Motes {
  constructor(scene, max = 300) {
    this.max = max; this.count = max;
    this.p = new Particles(scene, max, { additive: false });
    this.p.limit = max;
    this.rnd = mulberry32(7);
    this.items = [];
    this.preset = null; this.t = 0;
    for (let i = 0; i < max; i++) this.items.push({ ph: this.rnd() * 6.28, sp: 0.4 + this.rnd(), r: this.rnd(), i });
    this.p.alive.fill(0);
    this.target = { x0: -13, x1: 13, y0: 0.2, y1: 9, z0: -5, z1: 5 };
  }
  setPreset(pr) {
    this.preset = pr;
    const r = this.rnd;
    for (let i = 0; i < this.max; i++) {
      const it = this.items[i];
      it.x = lerp(-13, 13, r()); it.y = lerp(0.2, 9, r()); it.z = lerp(-5, 5, r());
    }
  }
  update(dt, t, scaleFx = 1) {
    const pr = this.preset; const P = this.p;
    if (!pr) { P.size.fill(0); P.geo.attributes.aSize.needsUpdate = true; return; }
    const n = Math.floor(this.max * clamp(scaleFx, 0, 1) * (pr.density ?? 1));
    for (let i = 0; i < this.max; i++) {
      const it = this.items[i];
      if (i >= n) { P.size[i] = 0; P.col[i * 4 + 3] = 0; continue; }
      it.x += (pr.dx || 0) * dt + Math.sin(t * 0.3 * it.sp + it.ph) * 0.15 * dt;
      it.y += (pr.dy || 0) * dt + Math.cos(t * 0.4 * it.sp + it.ph) * 0.12 * dt;
      it.z += (pr.dz || 0) * dt + Math.sin(t * 0.2 * it.sp + it.ph * 2) * 0.1 * dt;
      if (it.x > 13) it.x = -13; if (it.x < -13) it.x = 13;
      if (it.y > 9.5) it.y = 0.2; if (it.y < 0.1) it.y = 9.4;
      if (it.z > 5.5) it.z = -5; if (it.z < -5.5) it.z = 5;
      P.pos[i * 3] = it.x; P.pos[i * 3 + 1] = it.y; P.pos[i * 3 + 2] = it.z;
      const tw = 0.55 + 0.45 * Math.sin(t * (pr.tw || 1.2) * it.sp + it.ph);
      const c = pr.colors[i % pr.colors.length];
      P.col[i * 4] = c[0]; P.col[i * 4 + 1] = c[1]; P.col[i * 4 + 2] = c[2]; P.col[i * 4 + 3] = (pr.alpha ?? 0.5) * tw * (0.5 + it.r * 0.5);
      P.size[i] = (pr.size ?? 0.05) * (0.6 + it.r * 0.9);
    }
    P.geo.attributes.position.needsUpdate = true; P.geo.attributes.aColor.needsUpdate = true; P.geo.attributes.aSize.needsUpdate = true;
  }
}
