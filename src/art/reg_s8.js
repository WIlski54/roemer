// Registry der Station 8 (Römer am Rhein): Steintafeln, Bauten, Schiff, Stadtsilhouetten.
import { tafel, TAFELN } from './rom/s8_tafel.js';
import { wachturm, kastellRoemer, kastellRuine, kastellHeute } from './rom/s8_bauten.js';
import { baum } from './rom/s8_natur.js';
import { koelnRoemisch, xantenRoemisch } from './rom/s8_staedte.js';
import { schiff, boot } from './rom/s8_schiff.js';
import { hafen, inschriftenstein, meilenstein, konstantin } from './rom/s8_hafen.js';

const reg = {
  s8_tafel: (o) => tafel(o),
  s8_wachturm: (o) => wachturm(o),
  s8_kastell_roem: (o) => kastellRoemer(o),
  s8_kastell_ruine: (o) => kastellRuine(o),
  s8_kastell_heute: (o) => kastellHeute(o),
  s8_baum: (o) => baum(o),
  s8_koeln_r: (o) => koelnRoemisch(o),
  s8_xanten_r: (o) => xantenRoemisch(o),
  s8_schiff: (o) => schiff(o),
  s8_boot: (o) => boot(o),
  s8_hafen: (o) => hafen(o),
  s8_inschrift: (o) => inschriftenstein(o),
  s8_meilenstein: (o) => meilenstein(o),
  s8_meilenstein_476: () => meilenstein({ year: '476' }),
  s8_konstantin: (o) => konstantin(o),
};
for (const t of TAFELN) reg['s8_tafel_' + t.k] = () => tafel({ k: t.k });   // Einzel-IDs (Galerie)
export default reg;
