// Station 4 · Drehscheibe „Münze“: ein großer Denar (eigene Zeichnung, keine echte Münze) auf einem Holzständer.
// Vorderseite: Kopf im Profil mit Lorbeerkranz. Rückseite: Schild zwischen Lorbeerzweigen. Beschriftung frei erfunden.
// makeMuenze({R}) -> { group, coin, hit, turn(angle) }: group steht auf y=0, die Münze dreht sich um die senkrechte Achse.
import * as THREE from 'three';

const SERIF = "Georgia,'Palatino Linotype',Palatino,serif";
const C = 512, MID = 256, RAD = 240;

function disc(g) {
  g.clearRect(0, 0, C, C);
  const gr = g.createRadialGradient(MID - 60, MID - 70, 20, MID, MID, RAD);
  gr.addColorStop(0, '#fbfcfe'); gr.addColorStop(0.6, '#dfe4ec'); gr.addColorStop(1, '#a9b2c1');
  g.fillStyle = gr; g.beginPath(); g.arc(MID, MID, RAD, 0, 7); g.fill();
  g.strokeStyle = '#5a6278'; g.lineWidth = 6; g.beginPath(); g.arc(MID, MID, RAD - 3, 0, 7); g.stroke();
  // Perlenrand
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; g.fillStyle = i % 2 ? '#8e98ac' : '#f6f8fc'; g.beginPath(); g.arc(MID + Math.cos(a) * (RAD - 22), MID + Math.sin(a) * (RAD - 22), 6.5, 0, 7); g.fill(); }
  g.strokeStyle = 'rgba(90,98,120,.55)'; g.lineWidth = 3; g.beginPath(); g.arc(MID, MID, RAD - 36, 0, 7); g.stroke();
}
function arcText(g, str, mid, r, size, bottom) {
  g.save(); g.font = `bold ${size}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#4a5266';
  const n = str.length, step = (size * 0.82) / r;
  for (let i = 0; i < n; i++) {
    const a = mid + (i - (n - 1) / 2) * step * (bottom ? -1 : 1);
    g.save(); g.translate(MID + Math.cos(a) * r, MID + Math.sin(a) * r); g.rotate(a + (bottom ? -Math.PI / 2 : Math.PI / 2)); g.fillText(str[i], 0, 0); g.restore();
  }
  g.restore();
}
function leaf(g, x, y, ang, len, wid, fill = '#aab3c4') {
  g.save(); g.translate(x, y); g.rotate(ang); g.fillStyle = fill; g.strokeStyle = '#4a5266'; g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * 0.45, -wid, len, 0); g.quadraticCurveTo(len * 0.45, wid, 0, 0); g.closePath(); g.fill(); g.stroke();
  g.strokeStyle = 'rgba(74,82,102,.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(len * 0.1, 0); g.lineTo(len * 0.85, 0); g.stroke(); g.restore();
}

export function paintVorne() {
  const c = document.createElement('canvas'); c.width = c.height = C; const g = c.getContext('2d');
  disc(g);
  arcText(g, 'AVGVSTVS', -Math.PI / 2, RAD - 62, 44, false);
  arcText(g, 'PRINCEPS', Math.PI / 2, RAD - 62, 44, true);
  // Kopf im Profil (schaut nach rechts)
  const U = 205, ox = MID - 14, oy = MID + 4;
  const P = (x, y) => [ox + x * U, oy + y * U];
  const pts = [[-0.26, 0.66], [-0.21, 0.32], [-0.29, 0.02], [-0.2, -0.3], [0.04, -0.41], [0.24, -0.31], [0.33, -0.12], [0.34, -0.03], [0.32, 0.03], [0.46, 0.15], [0.34, 0.19], [0.355, 0.25], [0.335, 0.3], [0.3, 0.39], [0.2, 0.45], [0.19, 0.53], [0.24, 0.66]];
  g.beginPath(); pts.forEach(([x, y], i) => { const [X, Y] = P(x, y); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath();
  const sk = g.createLinearGradient(...P(-0.3, -0.4), ...P(0.4, 0.6)); sk.addColorStop(0, '#f2f4f9'); sk.addColorStop(1, '#c4ccda');
  g.fillStyle = sk; g.fill(); g.strokeStyle = '#4a5266'; g.lineWidth = 5; g.lineJoin = 'round'; g.stroke();
  // Haar (kleine Locken) hinter dem Kranz
  g.strokeStyle = '#6a7388'; g.lineWidth = 3.5; g.lineCap = 'round';
  for (let i = 0; i < 9; i++) { const [X, Y] = P(-0.22 + (i % 3) * 0.1, -0.2 + Math.floor(i / 3) * 0.12); g.beginPath(); g.arc(X, Y, 9, 0.4, 4.4); g.stroke(); }
  // Auge, Ohr, Mundlinie
  g.strokeStyle = '#3a4258'; g.lineWidth = 4; g.beginPath(); const [ex, ey] = P(0.2, -0.04); g.moveTo(ex - 10, ey + 2); g.quadraticCurveTo(ex, ey - 7, ex + 11, ey + 1); g.stroke();
  g.beginPath(); const [mx, my] = P(0.33, 0.27); g.moveTo(mx, my); g.lineTo(mx - 20, my + 3); g.stroke();
  g.beginPath(); const [ax, ay] = P(-0.06, 0.1); g.ellipse(ax, ay, 12, 20, 0.1, 0, 7); g.stroke();
  // Lorbeerkranz
  const path = [[0.2, -0.34], [0.08, -0.41], [-0.06, -0.41], [-0.19, -0.35], [-0.27, -0.25], [-0.31, -0.12], [-0.32, 0.02]];
  path.forEach(([x, y], i) => { const nx = path[Math.min(i + 1, path.length - 1)], pv = path[Math.max(i - 1, 0)]; const [X, Y] = P(x, y); const ang = Math.atan2(nx[1] - pv[1], nx[0] - pv[0]) * 1; leaf(g, X, Y, ang - 0.5, 48, 15); leaf(g, X, Y, ang + 0.55, 40, 12, '#c3cad8'); });
  // Bänder hinten
  g.strokeStyle = '#4a5266'; g.lineWidth = 4; const [bx, by] = P(-0.31, 0.05); g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx - 30, by + 40, bx - 46, by + 90); g.moveTo(bx, by); g.quadraticCurveTo(bx - 8, by + 50, bx - 14, by + 100); g.stroke();
  return c;
}
export function paintHinten() {
  const c = document.createElement('canvas'); c.width = c.height = C; const g = c.getContext('2d');
  disc(g);
  arcText(g, 'ROMA', -Math.PI / 2, RAD - 62, 48, false);
  arcText(g, 'S · P · Q · R', Math.PI / 2, RAD - 62, 38, true);
  // Schild mit Stern
  const sg = g.createRadialGradient(MID - 20, MID - 24, 6, MID, MID, 92); sg.addColorStop(0, '#f6f8fc'); sg.addColorStop(1, '#b4bccb');
  g.fillStyle = sg; g.beginPath(); g.arc(MID, MID, 92, 0, 7); g.fill(); g.strokeStyle = '#4a5266'; g.lineWidth = 6; g.stroke();
  g.lineWidth = 3; g.beginPath(); g.arc(MID, MID, 70, 0, 7); g.stroke();
  g.fillStyle = '#6a7388'; g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, r = i % 2 ? 22 : 54; const x = MID + Math.cos(a) * r, y = MID + Math.sin(a) * r; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.closePath(); g.fill(); g.strokeStyle = '#3a4258'; g.lineWidth = 3; g.stroke();
  // zwei Lorbeerzweige links und rechts
  for (const sd of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const a0 = Math.PI / 2 + sd * (0.35 + i * 0.2) * -1; // Winkel um die Mitte (unten beginnend, nach oben)
      const rr = 128; const x = MID + Math.cos(a0) * rr, y = MID + Math.sin(a0) * rr;
      const tang = a0 + (sd < 0 ? -Math.PI / 2 : Math.PI / 2) * -1; // Blick Richtung Zweigspitze (nach oben)
      leaf(g, x, y, tang - 0.45 * sd, 46, 14); leaf(g, x, y, tang + 0.55 * sd, 38, 11, '#c3cad8');
    }
  }
  return c;
}
const tex = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

export function makeMuenze({ R = 0.62, T = 0.09, yc = 1.55 } = {}) {
  const group = new THREE.Group(); group.name = 'muenze-stand';
  const wood = new THREE.MeshLambertMaterial({ color: 0x9a6b38 }), woodD = new THREE.MeshLambertMaterial({ color: 0x74481f }), gold = new THREE.MeshLambertMaterial({ color: 0xe8bc3c });
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 0.1, 28), woodD); foot.position.y = 0.05; foot.castShadow = true; group.add(foot);
  const foot2 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.12, 24), wood); foot2.position.y = 0.16; foot2.castShadow = true; group.add(foot2);
  const poleH = yc - R + 0.06;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, poleH, 14), wood); pole.position.y = poleH / 2 + 0.1; pole.castShadow = true; group.add(pole);
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 18), gold); ring.position.y = poleH + 0.08; group.add(ring);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), gold); fin.position.y = yc + R + 0.05; fin.castShadow = true; group.add(fin);
  const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2 * R + 0.12, 8), woodD); axle.position.y = yc; group.add(axle);
  // die Münze
  const coin = new THREE.Group(); coin.position.y = yc;
  const edge = new THREE.Mesh(new THREE.CylinderGeometry(R, R, T, 48, 1, true).rotateX(Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0x9aa3b4, side: THREE.DoubleSide }));
  edge.castShadow = true; coin.add(edge);
  const front = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshLambertMaterial({ map: tex(paintVorne()), transparent: false }));
  front.position.z = T / 2 + 0.001; coin.add(front);
  const back = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshLambertMaterial({ map: tex(paintHinten()) }));
  back.rotation.y = Math.PI; back.position.z = -T / 2 - 0.001; coin.add(back);
  const hit = new THREE.Mesh(new THREE.CircleGeometry(R * 1.1, 20), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); hit.position.z = 0.06; hit.userData.noRot = true;
  group.add(coin);
  // Tippfläche steht fest (dreht nicht mit), damit sie auch bei der Kante noch trifft
  hit.position.y = yc; group.add(hit);
  return { group, coin, hit, R, yc, meshes: [hit, front, back, edge] };
}
