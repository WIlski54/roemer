// p8: kleine, farbige Papierschnitt-Bilder von Tieren (für Familienalbum und Karten): setzt die fertig gemalten Teile (Körper, Kiefer, Schwanz ...) in Ruhelage zusammen.
import { makeFigure } from './popup.js';

const CACHE = new Map();

// Liefert ein Canvas (w x h px, transparent). dark=true ergibt eine einfarbige dunkle Silhouette (z. B. „noch nicht gefunden“).
export function animalPicture(id, w = 160, h = 110, { dark = false, pad = 0.07, tone = '#3a2d26' } = {}) {
  const key = `${id}|${w}x${h}|${dark ? tone : 'c'}`;
  if (CACHE.has(key)) return CACHE.get(key);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  let fig = null;
  try {
    fig = makeFigure(id, { len: 1, ppu: 420, maxTex: 1200, thickness: 0.01, border: 0.003 });
    const order = Object.entries(fig.spec.parts).map(([name, p], i) => ({ cut: fig.cuts[i], z: p.z ?? i, i }));
    order.sort((a, b) => a.z - b.z || a.i - b.i);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const { cut } of order) { const b = cut.bbox; x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); y0 = Math.min(y0, b.y0); y1 = Math.max(y1, b.y1); }
    const T = Math.min((w * (1 - 2 * pad)) / (x1 - x0), (h * (1 - 2 * pad)) / (y1 - y0));
    const offX = (w - (x1 - x0) * T) / 2, offY = (h - (y1 - y0) * T) / 2;
    const tmp = document.createElement('canvas'); tmp.width = w; tmp.height = h;
    const tg = tmp.getContext('2d');
    for (const { cut } of order) {
      const b = cut.bbox, c = cut.canvas;
      const S = (c.width - 4) / Math.max(1e-6, b.w);
      const ox = b.x0 - 2 / S, oy = b.y1 + 2 / S;
      tg.drawImage(c, offX + (ox - x0) * T, offY + (y1 - oy) * T, (c.width / S) * T, (c.height / S) * T);
    }
    if (dark) {
      tg.globalCompositeOperation = 'source-in'; tg.fillStyle = tone; tg.fillRect(0, 0, w, h); tg.globalCompositeOperation = 'source-over';
    }
    g.drawImage(tmp, 0, 0);
  } catch (e) { /* unknown id: leave empty */ } finally { if (fig) fig.dispose(); }
  CACHE.set(key, cv);
  return cv;
}
