// Station 4 · Der Rubikon als Papierband: ein blauer Streifen mit hellem Papierrand, der sich über die Seite schlängelt und leicht wogt.
// makeRibbon() -> { mesh, update(t, k, bumps) }. RIVER/cx(z) gelten auch für die gemalten Ufer in base().
import * as THREE from 'three';
import { mulberry32 } from '../engine/util.js';

export const RIVER = { x: 4.3, hw: 0.95, z0: -3.6, z1: 2.95 };
export const cx = (z) => RIVER.x + 0.22 * Math.sin(0.5 * z + 0.8);

function ribbonTexture() {
  const W = 256, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#f7efd8'; g.fillRect(0, 0, W, H);
  const body = g.createLinearGradient(0, 0, W, 0); body.addColorStop(0, '#3b86bb'); body.addColorStop(0.5, '#69b9df'); body.addColorStop(1, '#3b86bb');
  g.fillStyle = body; g.fillRect(14, 0, W - 28, H);
  const r = mulberry32(5); g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    const x = 28 + r() * (W - 56), y = r() * H, l = 34 + r() * 56;
    g.strokeStyle = i % 3 ? 'rgba(238,250,255,.7)' : 'rgba(25,75,140,.38)'; g.lineWidth = 3 + r() * 3;
    for (const dy of [0, H, -H]) { g.beginPath(); g.moveTo(x - l / 2, y + dy); g.quadraticCurveTo(x, y + dy - 9, x + l / 2, y + dy); g.stroke(); }
  }
  g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3;
  for (const x of [20, W - 20]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.repeat.set(1, 3.2);
  return t;
}

export function makeRibbon({ nx = 8, nz = 72 } = {}) {
  const { hw, z0, z1 } = RIVER;
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3), uv = new Float32Array((nx + 1) * (nz + 1) * 2), idx = [];
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
    const k = j * (nx + 1) + i; uv[k * 2] = i / nx; uv[k * 2 + 1] = j / nz;
    if (j < nz && i < nx) { const a = k, b = k + 1, c = k + nx + 1, d = k + nx + 2; idx.push(a, c, b, b, c, d); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setIndex(idx);
  const tex = ribbonTexture();
  const mat = new THREE.MeshLambertMaterial({ map: tex, side: THREE.DoubleSide, emissive: 0x0a2a44, emissiveIntensity: 0.25 });
  const mesh = new THREE.Mesh(geo, mat); mesh.receiveShadow = true; mesh.castShadow = false; mesh.name = 'rubikon-band'; mesh.frustumCulled = false;
  function update(t, k = 1, bumps = null) {
    let q = 0;
    for (let j = 0; j <= nz; j++) {
      const z = z0 + ((z1 - z0) * j) / nz, c = cx(z);
      for (let i = 0; i <= nx; i++) {
        const u = i / nx, e = Math.abs(u - 0.5) * 2, x = c + (u - 0.5) * 2 * hw;
        // Grundhöhe 0.095 über der Seite: auch im Wellental bleibt das Band über dem Papier (kein Durchschimmern)
        let y = 0.02 + k * (0.095 + (0.05 * Math.sin(z * 3.1 - t * 1.5 + u * 2.0) + 0.032 * Math.sin(z * 5.3 - t * 2.2 - u * 3.0)) * (1 - 0.35 * e * e) + 0.045 * e * e * e);
        if (bumps) for (let b = 0; b < bumps.length; b++) { const bp = bumps[b]; if (bp.a <= 0) continue; const dx = x - bp.x, dz = z - bp.z; y += k * bp.a * Math.exp(-(dx * dx + dz * dz * 1.4) / 0.16) * (0.5 + 0.5 * Math.sin(t * 9 + dx * 6)); }
        pos[q++] = x; pos[q++] = y; pos[q++] = z;
      }
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
    tex.offset.y = -t * 0.09;
  }
  update(0, 1, null);
  return { mesh, update, geo, tex };
}
