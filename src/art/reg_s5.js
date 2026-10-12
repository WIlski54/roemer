// Registry Station 5 „Rom auf dem Höhepunkt“: id -> factory(opts) -> spec. Besitzer: Station 5. Alle Kennungen beginnen mit „h_“.
import { person } from './rom/_people.js';
import { pantheon, tempel, saeule, marktstand, saenfte, meilenstein, pinie, zypresse, kolosseumFront } from './rom/s5_bauten.js';

const reg = {
  h_pantheon: pantheon, h_tempel: tempel, h_saeule: saeule, h_marktstand: marktstand, h_saenfte: saenfte, h_meilenstein: meilenstein,
  h_pinie: pinie, h_zypresse: zypresse, h_kolosseum_vorn: kolosseumFront,
  // Marktszene: Händler am Stand, Sänftenträger, Passanten (alle über person({...}) aus dem gemeinsamen Baukasten)
  h_haendler: (o = {}) => person({ kind: 'haendler', id: 'h_haendler', name: 'Händler', height: 1.7, tunic: { color: '#6f9a7b', color2: '#3d6b52', len: 'knee', sleeves: true, belt: '#5a3a1f' }, near: 'basket', ...o }),
  h_traeger: (o = {}) => person({ kind: 'handwerker', id: 'h_traeger', name: 'Sänftenträger', height: 1.72, skin: '#b07a52', hair: { style: 'short', color: '#2f2018' }, tunic: { color: '#c9a565', color2: '#8a6a3a', len: 'short', sleeves: false, belt: '#6b4a2a' }, shoes: 'sandals', near: null, ...o }),
  h_buerger: (o = {}) => person({ kind: 'senator', id: 'h_buerger', name: 'Bürger', toga: { color: '#f4efe4', border: null }, near: 'scroll', hair: { style: 'short', color: '#3a2a1c' }, mood: 'smile', ...o }),
  h_buergerin: (o = {}) => person({ kind: 'buergerin', id: 'h_buergerin', name: 'Bürgerin', hat: 'veil', tunic: { color: '#a8453a', color2: '#e8c46a', len: 'ankle', sleeves: true, belt: '#e8c46a' }, ...o }),
  h_kind: (o = {}) => person({ kind: 'kind', id: 'h_kind', name: 'Kind', tunic: { color: '#e9d7a4', color2: '#b8453a', len: 'knee', sleeves: true, belt: '#8a6a3a' }, ...o }),
};
export default reg;
