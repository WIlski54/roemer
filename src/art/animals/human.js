// 1.75 m human silhouette, used as the size reference on info cards and in the gallery.
import { blob, limb, poly } from '../dsl.js';
export default () => ({
  id: 'human',
  parts: { body: { layers: [{ shapes: [
    blob(0, 1.62, 0.1, 0.12), limb([[0, 1.5, 0.12], [0, 1.4, 0.2]]),
    limb([[0, 1.45, 0.38], [0.01, 1.05, 0.3], [0, 0.95, 0.28]]),
    limb([[-0.07, 0.95, 0.15], [-0.08, 0.5, 0.11], [-0.07, 0.04, 0.09]]), limb([[0.07, 0.95, 0.15], [0.08, 0.5, 0.11], [0.09, 0.04, 0.09]]),
    limb([[-0.17, 1.38, 0.09], [-0.2, 1.1, 0.075], [-0.18, 0.88, 0.06]]), limb([[0.17, 1.38, 0.09], [0.2, 1.1, 0.075], [0.18, 0.88, 0.06]]),
    poly([[-0.09, 0.04], [0.2, 0.04], [0.2, 0], [-0.09, 0]]),
  ], fill: { top: '#d9825b', bottom: '#4f6fa8' } }] } },
  anchors: { head: [0, 1.62] },
});
