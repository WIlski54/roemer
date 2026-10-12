// Debug gallery (dist/gallery.html): renders every animal spec. Query: ?ids=a,b,c  &mode=fit|scale  &cols=4
import * as THREE from 'three';
import { Figure } from './engine/figure.js';
import { ANIMALS } from './art/registry.js';

const q = new URLSearchParams(location.search);
const ids = (q.get('ids') ? q.get('ids').split(',') : Object.keys(ANIMALS)).filter((i) => ANIMALS[i]);
const mode = q.get('mode') || 'fit';
const cols = +(q.get('cols') || 4);
const cell = +(q.get('cell') || 360);
const W = cols * cell, rows = Math.ceil(ids.length / cols), H = rows * cell;
const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
document.body.style.overflow = 'auto';
canvas.style.position = 'static'; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd9c9a3);
const cam = new THREE.OrthographicCamera(0, W, 0, -H, -50, 50);
scene.add(new THREE.AmbientLight(0xffffff, 2.2));
const dl = new THREE.DirectionalLight(0xffffff, 1.2); dl.position.set(-3, 5, 8); scene.add(dl);
const ui = document.getElementById('ui'); ui.style.pointerEvents = 'none';
const human = ANIMALS.human ? ANIMALS.human() : null;
const pose = Object.fromEntries((q.get('pose') || '').split(',').filter(Boolean).map((p) => { const [k, v] = p.split(':'); return [k, +v]; }));
let globalMax = 0;
const specs = ids.map((id) => ANIMALS[id]());
if (mode === 'scale') for (const s of specs) { const f = new Figure(s, { worldScale: 1, ppu: 4 }); globalMax = Math.max(globalMax, f.bbox.w, f.bbox.h); f.dispose(); }
ids.forEach((id, i) => {
  const spec = specs[i];
  const probe = new Figure(spec, { worldScale: 1, ppu: 4 });
  const bw = probe.bbox.w, bh = probe.bbox.h; probe.dispose();
  const maxdim = mode === 'scale' ? globalMax : Math.max(bw, bh);
  const ws = (cell * 0.78) / maxdim;
  const f = new Figure(spec, { worldScale: ws, ppu: 1, maxTex: 1024 });
  const cx = (i % cols) * cell + cell / 2, cy = -(Math.floor(i / cols) * cell + cell * 0.82);
  const midx = (f.bbox.x0 + f.bbox.x1) / 2 * ws;
  f.group.position.set(cx - midx, cy, 0);
  for (const [k, v] of Object.entries(pose)) f.rotatePart(k, v);
  scene.add(f.group);
  if (human && id !== 'human') {
    const hf = new Figure(human, { worldScale: ws, ppu: 1 });
    hf.group.position.set((i % cols) * cell + 12 + 0.2 * ws, cy, -1); scene.add(hf.group);
  }
  const lab = document.createElement('div');
  lab.textContent = id; lab.style.cssText = `position:absolute;left:${(i % cols) * cell + 6}px;top:${Math.floor(i / cols) * cell + 4}px;font:12px monospace;color:#222`;
  ui.appendChild(lab);
});
// ground lines
const mat = new THREE.LineBasicMaterial({ color: 0x8a7a55 });
for (let i = 0; i < ids.length; i++) {
  const cy = -(Math.floor(i / cols) * cell + cell * 0.82), x0 = (i % cols) * cell;
  const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x0 + 4, cy, -10), new THREE.Vector3(x0 + cell - 4, cy, -10)]);
  scene.add(new THREE.Line(g, mat));
}
renderer.render(scene, cam);
window.__bookReady = true;
