// Platzhalter-Seite (wird durch pN.js ersetzt)
import { mood } from '../engine/scene.js';
import { PAGES_DE } from '../data/pages.de.js';
import { leftCard } from './common.js';
import { pebbles, grassTufts } from '../engine/pagepaint.js';
const GROUND = [
  ['#ecd9aa', '#dcc08a'], ['#e9b36b', '#d08a45'], ['#7fae5c', '#4f8a3f'], ['#8cc0d8', '#5f9cc0'],
  ['#4f87b3', '#2f6490'], ['#c9a96a', '#a68244'], ['#6a5b4a', '#3f3328'], ['#b3382a', '#7a1f18'], ['#e8d8a8', '#cdb67c'],
];
export function stub(i) {
  const d = PAGES_DE[i], g = GROUND[i];
  return {
    id: d.id, mood: mood({}), motes: null, atmo: d.id,
    base() {
      return {
        L: { ground: { back: g[0], front: g[1] }, margin: 0.3, pageNo: 2 * i + 1, seed: i, draw: leftCard(null, i) },
        R: { ground: { back: g[0], front: g[1] }, margin: 0.3, pageNo: 2 * i + 2, seed: i + 40, draw: (ctx, m) => { pebbles(m, { x0: 1, x1: 11, z0: 0, z1: 3.7, n: 12, seed: i }); grassTufts(m, { x0: 1, x1: 11, z0: 0.2, z1: 3.8, n: 5, seed: i + 3 }); } },
      };
    },
    *build(ctx) { ctx.prop('conifer_round', { x: 6, z: -1.5, h: 3, delay: 0.1 }); },
  };
}
