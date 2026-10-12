// Seitentexte und Karten: je Station eine Datei src/data/sN.de.js (Station 0 = Titelseite, 1..8 = Doppelseiten).
import * as s0 from './s0.de.js';
import * as s1 from './s1.de.js';
import * as s2 from './s2.de.js';
import * as s3 from './s3.de.js';
import * as s4 from './s4.de.js';
import * as s5 from './s5.de.js';
import * as s6 from './s6.de.js';
import * as s7 from './s7.de.js';
import * as s8 from './s8.de.js';
const S = [s0, s1, s2, s3, s4, s5, s6, s7, s8];
export const PAGES_DE = S.map((m) => m.page);
export const CARDS_DE = Object.assign({}, ...S.map((m) => m.cards));
