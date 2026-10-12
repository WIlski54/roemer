// Registry group E: id -> factory. Owned by art group E. (Pflanzen, Felsen, Requisiten; Fabriken akzeptieren opts)
import { conifer_round, palm } from './props/plants_trees.js';
import { grass_tuft, bush, reeds } from './props/plants_small.js';
import { mesa_red, cliff_layers, boulder, rock_pillar, island_rock } from './props/rocks.js';
import { cloud_a, cloud_b, sun_disc, wave_strip } from './props/sky_fx.js';

export default {
  conifer_round: (o) => conifer_round(o),
  palm: (o) => palm(o),
  grass_tuft: (o) => grass_tuft(o),
  bush: (o) => bush(o),
  reeds: (o) => reeds(o),
  mesa_red: (o) => mesa_red(o),
  cliff_layers: (o) => cliff_layers(o),
  boulder: (o) => boulder(o),
  rock_pillar: (o) => rock_pillar(o),
  island_rock: (o) => island_rock(o),
  cloud_a: (o) => cloud_a(o),
  cloud_b: (o) => cloud_b(o),
  sun_disc: (o) => sun_disc(o),
  wave_strip: (o) => wave_strip(o),
};
