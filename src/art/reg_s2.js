// Registry Station 2: id -> factory(opts) -> spec. Besitzer: Station 2.
import elefant from './rom/s2_elefant.js';
import { senator, redner, konsul, liktor, hannibal } from './rom/s2_leute.js';
import { zypresse, pinie, curiaPart, bankPart, rostraPart, hafenPart, alpenFarPart, alpenNearPart, shipPart } from './rom/s2_bauten.js';
const body = (id, part) => ({ id, parts: { body: { z: 1, layers: part.layers } }, anchors: {}, meta: { name: id, lengthM: 1 } });

export default {
  elefant: (o) => elefant(o),
  s2_senator: (o) => senator(o),
  s2_redner: (o) => redner(o),
  s2_konsul: (o) => konsul(o),
  s2_liktor: (o) => liktor(o),
  s2_hannibal: (o) => hannibal(o),
  s2_zypresse: (o) => zypresse(o),
  s2_pinie: (o) => pinie(o),
  // Bauten und Kulissen (auch in der Galerie prüfbar)
  s2_curia: () => body('s2_curia', curiaPart()),
  s2_bank: () => body('s2_bank', bankPart()),
  s2_rostra: () => body('s2_rostra', rostraPart()),
  s2_hafen: () => body('s2_hafen', hafenPart()),
  s2_alpen_fern: () => body('s2_alpen_fern', alpenFarPart().part),
  s2_alpen_nah: () => body('s2_alpen_nah', alpenNearPart().part),
  s2_schiff_rom: () => body('s2_schiff_rom', shipPart({ pole: true })),
  s2_schiff_punier: () => body('s2_schiff_punier', shipPart({ dir: -1, hull: '#2f6a96', trim: '#e8c46a', sail: '#7b2d6b', stripe: '#e8c46a', flag: '#f4efe6' })),
};
