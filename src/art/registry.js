// Registry of all figure / prop specs. Each module default-exports { id: factory }, factory(opts) returns a spec.
import human from './animals/human.js';
import e from './reg_e.js';
import rom from './reg_rom.js';
import s1 from './reg_s1.js';
import s2 from './reg_s2.js';
import s3 from './reg_s3.js';
import s4 from './reg_s4.js';
import s5 from './reg_s5.js';
import s6 from './reg_s6.js';
import s7 from './reg_s7.js';
import s8 from './reg_s8.js';

export const ANIMALS = { human, ...e, ...rom, ...s1, ...s2, ...s3, ...s4, ...s5, ...s6, ...s7, ...s8 };
