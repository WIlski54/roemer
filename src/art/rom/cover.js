// Goldene Silhouetten für den Buchdeckel (nur Umrisse zählen): Säule, Kolosseum, Triumphbogen.
import { poly } from '../dsl.js';
import { archWall, columnPoly, rectP } from './_arch.js';
const spec = (id, shapes) => ({ id, parts: { body: { layers: [{ shapes, fill: '#d9b24a' }] } }, anchors: {}, meta: { name: id } });

export const cover_saeule = () => spec('cover_saeule', [
  rectP(-0.9, 0, 0.9, 0.7), rectP(-0.75, 0.7, 0.75, 1.1), rectP(-0.5, 1.1, 0.5, 7.2), rectP(-0.62, 7.2, 0.62, 7.45), rectP(-0.75, 7.45, 0.75, 7.62),
  poly([[-0.2, 7.62], [0.2, 7.62], [0.26, 8.5], [0.12, 8.9], [-0.12, 8.9], [-0.26, 8.5]], 1),
]);
export const cover_kolosseum = () => {
  const shapes = [];
  const W = 16;
  for (let t = 0; t < 3; t++) shapes.push(...archWall(-W / 2, W / 2, t * 1.7, t * 1.7 + 1.7 - 0.12, 20, { open: 0.58, crown: 0.86 }));
  for (let t = 0; t < 3; t++) shapes.push(rectP(-W / 2, t * 1.7 + 1.58, W / 2, t * 1.7 + 1.72));
  shapes.push(rectP(-W / 2, 5.1, W / 2, 6.6));
  return spec('cover_kolosseum', shapes);
};
export const cover_bogen = () => {
  const shapes = [];
  shapes.push(...archWall(-3.4, 3.4, 0, 4.6, 1, { open: 0.5, crown: 0.84 }));
  shapes.push(rectP(-3.9, 0, -3.4, 4.6), rectP(3.4, 0, 3.9, 4.6));
  shapes.push(rectP(-4.2, 4.6, 4.2, 5.1), rectP(-3.6, 5.1, 3.6, 6.6), rectP(-3.9, 6.6, 3.9, 6.9));
  shapes.push(rectP(-0.6, 6.9, 0.6, 7.3), poly([[-0.5, 7.3], [0.5, 7.3], [0.25, 8.3], [-0.25, 8.3]], 1)); // Quadriga-Andeutung
  shapes.push(poly([[-1.9, 6.9], [-0.9, 6.9], [-1.1, 7.7], [-1.7, 7.7]], 1), poly([[0.9, 6.9], [1.9, 6.9], [1.7, 7.7], [1.1, 7.7]], 1));
  return spec('cover_bogen', shapes);
};
