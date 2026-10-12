// Registry Station 1: id -> factory(opts) -> spec. Besitzer: Station 1.
import { wolfin } from './rom/s1_wolfin.js';
import { schaf, ochse } from './rom/s1_tiere.js';
import { huette, pflug, feuer, grotte, zaun } from './rom/s1_bauten.js';
import { pinie, zypresse, feige, weide } from './rom/s1_baeume.js';
import { romulus, hirte, baby, tarquinius } from './rom/s1_menschen.js';

export default {
  wolfin, schaf, ochse,
  huette, pflug, feuer, grotte, zaun,
  pinie, zypresse, feige, weide,
  romulus, hirte, tarquinius,
  baby1: (o = {}) => baby({ v: 1, ...o }),
  baby2: (o = {}) => baby({ v: 2, ...o }),
};
