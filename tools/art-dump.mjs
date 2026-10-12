import { ANIMALS } from '../src/art/registry.js';
const bb = (spec) => { let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9; for (const p of Object.values(spec.parts||{})) for (const l of p.layers) for (const poly of l.shapes) for (const [x,y] of poly){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);} return {w:x1-x0,h:y1-y0}; };
const rows = [];
for (const [id, f] of Object.entries(ANIMALS)) {
  try {
    const s = f(); const b = bb(s); const m = s.meta || {};
    rows.push(`${id.padEnd(20)} ${b.w.toFixed(2)}×${b.h.toFixed(2)} m  parts: ${Object.keys(s.parts).map((k)=>{const p=s.parts[k]; return k+(p.pivot?`@(${p.pivot.map((v)=>v.toFixed(2)).join(',')})`:'');}).join(' ')}  ranges: ${JSON.stringify(m.ranges||{})}${m.swing?' swing:'+JSON.stringify(m.swing):''}${m.flap?' flap:'+JSON.stringify(m.flap):''}${s.anchors?' anchors:'+Object.keys(s.anchors).join('/'):''}${m.render?' render:'+JSON.stringify(m.render).slice(0,80):''}`);
  } catch (e) { rows.push(id + ' ERR ' + e.message); }
}
console.log(rows.join('\n'));
