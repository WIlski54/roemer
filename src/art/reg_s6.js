// Registry Station 6: id -> factory(opts) -> spec. Besitzer: Station 6.
import { taberna, imbiss, brunnen, hausInnen, hauswand, vesuv, zypresse, pinie, graffitiwand } from './rom/s6_build.js';
import { figs, karren } from './rom/s6_figs.js';

export default {
  ...figs,
  s6_karren: () => karren(),
  s6_laden_baecker: () => taberna({ kind: 'baecker' }),
  s6_laden_haendler: () => taberna({ kind: 'haendler' }),
  s6_imbiss: () => imbiss(),
  s6_brunnen: () => brunnen(),
  s6_haus_innen: () => hausInnen(),
  s6_hauswand: () => hauswand(),
  s6_vesuv: () => vesuv(),
  s6_zypresse: () => zypresse(),
  s6_pinie: () => pinie(),
  s6_graffitiwand: () => graffitiwand(),
};
