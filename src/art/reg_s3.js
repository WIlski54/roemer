// Registry Station 3 „Die Legion“: id -> factory(opts) -> spec. Besitzer: Station 3. Alle IDs beginnen mit leg_.
import { person } from './rom/_people.js';
import { ausruest, pilumSpec, gladiusSpec } from './rom/s3_equip.js';
import { zelt, signum, vexillum, palisade, turm, feuer, marschgepaeck, pinie, zypresse, sonne, wolke, erdblock, graben, wall } from './rom/s3_camp.js';

export default {
  leg_ausruest: (v) => ausruest({ rest: v === 'rest' }),
  leg_ausruest_rest: () => ausruest({ rest: true }),
  leg_pilum: () => pilumSpec(),
  leg_gladius: () => gladiusSpec(),
  // Soldat für Schildkröte und Wache: Legionär ohne Wurfspeer in der Hand
  leg_soldat: (o = {}) => person({ kind: 'legionaer', near: null, id: 'leg_soldat', name: 'Legionär', ...(typeof o === 'object' ? o : {}) }),
  leg_zelt: (v) => zelt({ variant: typeof v === 'number' ? v : 0 }),
  leg_signum: () => signum(),
  leg_vexillum: () => vexillum(),
  leg_palisade: (o = {}) => palisade(typeof o === 'object' ? o : {}),
  leg_turm: () => turm(),
  leg_feuer: () => feuer(),
  leg_marschgepaeck: () => marschgepaeck(),
  leg_pinie: (v) => pinie({ flip: v === 1 }),
  leg_zypresse: () => zypresse(),
  leg_sonne: () => sonne(),
  leg_wolke: (v) => wolke({ long: v === 1 }),
  leg_erdblock: () => erdblock(),
  leg_graben: () => graben(),
  leg_wall: () => wall(),
};
