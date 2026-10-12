// Gemeinsame Römer-Bausteine (Personen, Gans, Deckel-Silhouetten). Besitzer: Grundgerüst.
import { person } from './rom/_people.js';
import { gans } from './rom/gans.js';
import { cover_saeule, cover_kolosseum, cover_bogen } from './rom/cover.js';

const reg = { cover_saeule, cover_kolosseum, cover_bogen };
for (let i = 1; i <= 8; i++) reg['gans' + i] = (o) => gans(i, o);
// Standard-Personen (jede Station darf eigene Varianten mit person({...}) in ihrer reg_sN.js ergänzen)
for (const k of ['buerger', 'buergerin', 'kind', 'legionaer', 'zenturio', 'aquilifer', 'senator', 'kaiser', 'haendler', 'handwerker', 'germane']) reg['p_' + k] = (o = {}) => person({ kind: k, id: 'p_' + k, ...o });
export default reg;
