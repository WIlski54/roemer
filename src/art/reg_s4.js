// Registry Station 4: id -> factory(opts) -> spec. Besitzer: Station 4.
import { palast, tempel, kurie, basilika, werkstatt, werkbank, muenzstapel, amboss, sack, fackel } from './rom/s4_bauten.js';
import { zypresse, lorbeer, lorbeerbusch } from './rom/s4_natur.js';
import { caesar, augustus, senator, senatorKranz, kleopatra, legionaer, aquilifer, muenzer } from './rom/s4_leute.js';

const reg = {
  s4_palast: (o) => palast(o), s4_tempel: (o) => tempel(o), s4_kurie: (o) => kurie(o), s4_basilika: (o) => basilika(o),
  s4_werkstatt: (o) => werkstatt(o), s4_werkbank: (o) => werkbank(o), s4_muenzstapel: (o) => muenzstapel(o), s4_amboss: (o) => amboss(o),
  s4_sack: (o) => sack(o), s4_fackel: (o) => fackel(o),
  s4_zypresse: (o) => zypresse(o), s4_lorbeer: (o) => lorbeer(o), s4_lorbeerbusch: (o) => lorbeerbusch(o),
  s4_caesar: (o) => caesar(o), s4_augustus: (o) => augustus(o), s4_senator_kranz: (o) => senatorKranz(o),
  s4_kleopatra: (o) => kleopatra(o), s4_aquilifer: (o) => aquilifer(o), s4_muenzer: (o) => muenzer(o),
};
for (let i = 0; i < 6; i++) reg['s4_senator' + (i + 1)] = (o) => senator(i, o);
for (let i = 0; i < 3; i++) reg['s4_legionaer' + (i + 1)] = (o) => legionaer(i, o);
export default reg;
