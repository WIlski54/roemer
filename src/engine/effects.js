// Reusable visual helpers: sun glow with rays, glow sprites, soft textures.
import * as THREE from 'three';

let SOFT = null;
export function softTexture() {
  if (SOFT) return SOFT;
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  SOFT = new THREE.CanvasTexture(c); SOFT.colorSpace = THREE.SRGBColorSpace; return SOFT;
}
let RAYS = null;
export function raysTexture() {
  if (RAYS) return RAYS;
  const c = document.createElement('canvas'); c.width = c.height = 512;
  const g = c.getContext('2d'); g.translate(256, 256);
  const n = 14;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, w = 0.07 + (i % 3) * 0.02;
    const gr = g.createRadialGradient(0, 0, 20, 0, 0, 250);
    gr.addColorStop(0, 'rgba(255,240,180,.55)'); gr.addColorStop(1, 'rgba(255,240,180,0)');
    g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 250, a - w, a + w); g.closePath(); g.fill();
  }
  RAYS = new THREE.CanvasTexture(c); RAYS.colorSpace = THREE.SRGBColorSpace; return RAYS;
}

// glow + rotating rays; returns a Group (add to a popup pivot) with .update(t)
export function sunGlow({ size = 6, color = 0xffd27a, rays = true, opacity = 0.9 } = {}) {
  const g = new THREE.Group();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: softTexture(), color, transparent: true, opacity: 0.8 * opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.renderOrder = 3; g.add(glow);
  let ray = null;
  if (rays) {
    ray = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.7, size * 1.7), new THREE.MeshBasicMaterial({ map: raysTexture(), color, transparent: true, opacity: 0.55 * opacity, blending: THREE.AdditiveBlending, depthWrite: false }));
    ray.position.z = 0.01; ray.renderOrder = 3; g.add(ray);
  }
  g.userData.update = (t, k = 1) => { if (ray) { ray.rotation.z = t * 0.05; ray.material.opacity = (0.45 + 0.1 * Math.sin(t * 0.8)) * opacity * k; } glow.material.opacity = (0.7 + 0.08 * Math.sin(t * 1.1)) * opacity * k; };
  return g;
}
