// Titelseite im echten Buch: Ansichten und Laschen. usage: node tools/title-test.mjs [w h] [Schritte komma]; TIER, OUT_DIR, BOOK_HTML
import { open, ready, out } from './harness.mjs';
const [w = '1280', h = '720', steps = 'a,l,r,y1,y2,y3,y4,tor,marsch,end'] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +w, h: +h, query: '?tier=' + (process.env.TIER || 'low') });
await ready(page, 200000);
const wait = (s) => page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), s);
const cam = (az, el, zoom, nx = 0, nz = 0) => page.evaluate(([az, el, zoom, nx, nz]) => { const c = window.__app.cam; c.autoReturn = false; c.hold = true; c.az.snap(az); c.az.set(az); c.el.snap(el); c.el.set(el); c.setZoom(zoom); c.nudge.x = nx; c.nudge.z = nz; }, [az, el, zoom, nx, nz]);
const sp = (code) => page.evaluate(`(async()=>{const a=window.__app; const s=a.spreads.current; const T=s.p0; const C=s.R.controls.concat(s.L.controls); const ctl=(id)=>C.find(c=>c.id===id); ${code}})()`);
const shot = (n) => page.screenshot({ path: out(`t0-${n}.png`) });
await page.evaluate(async () => { await window.__app.snapTo(0); });
await sp('s.p0.introDone=true; s.p0.intro=false;');
const S = steps.split(',');
for (const st of S) {
  if (st === 'a') { await sp("ctl('zeiger').setValue(0.708,{snap:true})"); await wait(5); await cam(0, 0.86, 1); await shot('a'); }
  if (st === 'l') { await cam(0, 1.2, 0.5, -6.2, 0.3); await wait(1); await shot('l'); }
  if (st === 'r') { await cam(0, 1.2, 0.5, 6.0, 0.3); await wait(1); await shot('r'); }
  if (st.startsWith('y')) { const yr = { y1: -600, y2: -146, y3: 395, y4: 476 }[st]; const v = await sp(`const {valueOfYear}=await import('/x').catch(()=>({})); return 0`).catch(() => 0);
    // Jahr -> Wert über die Seite selbst berechnen
    const val = await page.evaluate((yr) => { const n = yr < 0 ? 753 + yr : 752 + yr; return n / (752 + 476); }, yr);
    await sp(`ctl('zeiger').setValue(${val},{snap:true})`); await cam(0, 1.2, 0.5, -6.2, 0.3); await wait(4); await shot(st); }
  if (st === 'tor') { await sp("ctl('tor').setValue(1,{snap:true})"); await cam(0, 1.0, 0.6, 3.0, -1.5); await wait(3); await shot('tor'); }
  if (st === 'marsch') { await sp("ctl('marsch').setValue(1,{snap:true})"); await cam(0, 1.0, 0.6, 3.0, 0.5); await wait(3); await shot('marsch'); }
  if (st === 'end') { await cam(0, 0.86, 1); await sp("ctl('zeiger').setValue(1,{snap:true})"); await wait(4); await shot('end'); }
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'no errors/warnings');
await browser.close();
