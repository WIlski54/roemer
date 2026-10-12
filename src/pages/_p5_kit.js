// Station 5: kleine eigene Hilfen (statt gemeinsamer Kits): Canvas-Texturen, Lichtstimmungen mischen, Kind-Flats, Partikel-Mengen.
import * as THREE from 'three';
import { makeFlat } from '../engine/popup.js';
import { mulberry32, TAU, clamp } from '../engine/util.js';

export function canvasTex(w, h, draw, { repeat = false } = {}) {
  const c = document.createElement('canvas'); c.width = Math.max(8, Math.round(w)); c.height = Math.max(8, Math.round(h));
  draw(c.getContext('2d'), c.width, c.height);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// ---- Lichtstimmungen mischen (mood()-Objekte)
export const cloneMood = (m) => JSON.parse(JSON.stringify(m));
export function blendMood(out, A, B, k) {
  const L = (a, b) => a + (b - a) * k;
  for (let i = 0; i < 3; i++) { out.keyC[i] = L(A.keyC[i], B.keyC[i]); out.skyC[i] = L(A.skyC[i], B.skyC[i]); out.gndC[i] = L(A.gndC[i], B.gndC[i]); out.pos[i] = L(A.pos[i], B.pos[i]); }
  out.keyI = L(A.keyI, B.keyI); out.hemiI = L(A.hemiI, B.hemiI); out.rimI = L(A.rimI || 0, B.rimI || 0);
  return out;
}

// ---- Partikel: Anzahl an Qualitätsstufe und Ruhigen Modus koppeln
export const fxN = (app, n) => Math.max(1, Math.round(n * app.stage.tier.fx * (app.calm ? 0.55 : 1)));
export function puff(app, w, n, { spread = 0.3, up = 0.35, size = 0.26, life = 0.8, alpha = 0.35, color = [0.86, 0.76, 0.58], vx = 0, grow = 1.8 } = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU, s = spread * (0.4 + Math.random());
    app.fx.dust.emit({ x: w.x + (Math.random() - 0.5) * spread, y: w.y + 0.03, z: w.z + (Math.random() - 0.3) * spread * 0.6, vx: Math.cos(a) * s + vx, vy: up * (0.3 + Math.random() * 0.8), vz: Math.sin(a) * s * 0.5, life: life * (0.7 + Math.random() * 0.6), size: size * (0.7 + Math.random() * 0.6), alpha, color, drag: 1.5, grow });
  }
}

// ---- Kleines Flat als Kind eines bestehenden Pop-ups (zählt nicht als eigenes Pop-up)
export function child(popup, part, { x = 0, y = 0, z = 0.03, ppu = 120, border = 0.02, name = 'child', maxTex = 1024, cast = false } = {}) {
  const cut = makeFlat(part, { ws: 1, ppu, thickness: 0.02, border, name, maxTex });
  cut.mesh.position.set(x, y, z); cut.mesh.castShadow = cast;
  popup.add(cut.mesh); popup.side.own(cut);
  return cut;
}

// Papierflat leuchtet auch bei dunklerem Licht (Himmel): Selbstleuchten aus der eigenen Textur
export function glowy(material, k = 0.55) {
  material.emissive = new THREE.Color(k, k, k); material.emissiveMap = material.map; material.needsUpdate = true;
}

// Leuchtfläche (Sonnenschein, Strahlen) auf einen Kasten in Weltkoordinaten begrenzen und zum Rand hin sanft ausblenden,
// damit nichts über den Himmel hinaus auf den Tisch strahlt. box = { x0, x1, y0, y1, fade }
export function clipGlow(group, box) {
  const u = { value: new THREE.Vector4(box.x0, box.x1, box.y0, box.y1) }, fade = { value: box.fade ?? 0.4 };
  group.traverse((o) => {
    if (!o.isMesh) return;
    o.material.onBeforeCompile = (sh) => {
      sh.uniforms.uBox = u; sh.uniforms.uFade = fade;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;\nuniform vec4 uBox;\nuniform float uFade;')
        .replace('#include <dithering_fragment>', 'gl_FragColor.a *= smoothstep(uBox.x, uBox.x + uFade, vWp.x) * (1.0 - smoothstep(uBox.y - uFade, uBox.y, vWp.x)) * smoothstep(uBox.z, uBox.z + uFade, vWp.y) * (1.0 - smoothstep(uBox.w - uFade, uBox.w, vWp.y));\n#include <dithering_fragment>');
    };
    o.material.customProgramCacheKey = () => 'p5clip';
    o.material.needsUpdate = true;
  });
}

// ---- Ring aus N gleich langen Sehnen auf einer Ellipse (Halbachsen A in x, B in z). Liefert N Eckpunkte und die Sehnenlänge.
export function ringPoints(A, B, N) {
  const pt = (t) => [A * Math.cos(t), B * Math.sin(t)];
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const nextT = (t, c) => { // kleinstes t' > t mit |P(t') − P(t)| = c
    const p = pt(t); let lo = t, hi = t + 1.9; // Sehne wächst monoton, solange der Bogen < ~π ist
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (dist(p, pt(mid)) < c) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  };
  let per = 0; { let q = pt(0); for (let i = 1; i <= 400; i++) { const p = pt((i / 400) * TAU); per += dist(p, q); q = p; } }
  let cl = per / N * 0.8, ch = per / N * 1.2;
  for (let it = 0; it < 40; it++) {
    const c = (cl + ch) / 2; let t = 0; for (let i = 0; i < N; i++) t = nextT(t, c);
    if (t < TAU) cl = c; else ch = c;
  }
  const c = (cl + ch) / 2; const pts = []; let t = 0;
  for (let i = 0; i < N; i++) { pts.push(pt(t)); t = nextT(t, c); }
  return { pts, chord: c, perimeter: per };
}

export { mulberry32, TAU, clamp };
