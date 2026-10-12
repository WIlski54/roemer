// Station 4 · Lorbeerkranz als kleines 3D-Objekt aus Papierblättern (ein InstancedMesh, ein Zeichenaufruf).
// makeKranz({R}) -> { group, hit, meshes }: Ring in der XY-Ebene (Achse z), Schleife unten. group.scale skaliert die Größe.
import * as THREE from 'three';
import { mulberry32 } from '../engine/util.js';

let LEAF = null;
function leafGeo() {
  if (LEAF) return LEAF;
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.18, 0.1, 0.62, 0.11, 1, 0); s.bezierCurveTo(0.62, -0.11, 0.18, -0.1, 0, 0);
  LEAF = new THREE.ShapeGeometry(s, 5);
  return LEAF;
}
const GREENS = ['#5f9a3a', '#4c8a34', '#78ac48', '#3f7a30', '#8fbe55', '#6aa23e'];

export function makeKranz({ R = 0.24, n = 30, seed = 7 } = {}) {
  const group = new THREE.Group(); group.name = 'kranz';
  const stem = new THREE.Mesh(new THREE.TorusGeometry(R, 0.017, 5, 36), new THREE.MeshLambertMaterial({ color: 0x5b4a24 }));
  stem.castShadow = true; group.add(stem);
  const rows = 2, count = n * rows;
  const inst = new THREE.InstancedMesh(leafGeo(), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), count);
  const r = mulberry32(seed), m = new THREE.Matrix4(), qz = new THREE.Quaternion(), qx = new THREE.Quaternion(), q = new THREE.Quaternion();
  const p = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color(), ax = new THREE.Vector3(1, 0, 0), az = new THREE.Vector3(0, 0, 1);
  let k = 0;
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < n; i++) {
      const a = ((i + row * 0.5) / n) * Math.PI * 2;
      const rr = R + (row ? 0.012 : -0.012);
      p.set(Math.cos(a) * rr, Math.sin(a) * rr, row ? 0.014 : -0.014);
      qz.setFromAxisAngle(az, a + Math.PI / 2 + (row ? -0.5 : 0.5) + (r() - 0.5) * 0.2);
      qx.setFromAxisAngle(ax, (row ? 0.45 : -0.45) + (r() - 0.5) * 0.3);
      q.copy(qz).multiply(qx);
      const L = 0.15 + r() * 0.03; sc.set(L, L * 1.5, 1);
      m.compose(p, q, sc); inst.setMatrixAt(k, m);
      col.set(GREENS[Math.floor(r() * GREENS.length)]); inst.setColorAt(k, col); k++;
    }
  }
  inst.instanceMatrix.needsUpdate = true; if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  inst.castShadow = true; group.add(inst);
  // goldene Beeren
  const bm = new THREE.MeshLambertMaterial({ color: 0xe8bc3c }), bg = new THREE.SphereGeometry(0.02, 8, 6);
  for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + 0.3; const b = new THREE.Mesh(bg, bm); b.position.set(Math.cos(a) * R, Math.sin(a) * R, 0.03); group.add(b); }
  // Schleife unten (Purpur mit Gold) mit zwei Bändern
  const bow = new THREE.Group(); bow.position.set(0, -R, 0.03);
  const tailShape = new THREE.Shape(); tailShape.moveTo(-0.025, 0); tailShape.lineTo(0.025, 0); tailShape.lineTo(0.032, -0.2); tailShape.lineTo(0, -0.17); tailShape.lineTo(-0.032, -0.2); tailShape.closePath();
  const tailGeo = new THREE.ShapeGeometry(tailShape), tailMat = new THREE.MeshLambertMaterial({ color: 0x7b2d5b, side: THREE.DoubleSide });
  const t1 = new THREE.Mesh(tailGeo, tailMat); t1.rotation.z = 0.28; const t2 = new THREE.Mesh(tailGeo, tailMat); t2.rotation.z = -0.28; bow.add(t1, t2);
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), new THREE.MeshLambertMaterial({ color: 0xe8bc3c })); bow.add(knot);
  group.add(bow);
  // unsichtbare Tippfläche (Raycaster ignoriert visible)
  const hit = new THREE.Mesh(new THREE.CircleGeometry(R * 1.35, 20), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
  hit.position.z = 0.02; group.add(hit);
  return { group, hit, meshes: [hit, stem, inst], R };
}
