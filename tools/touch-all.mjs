// Tippt jede antippbare Fläche jeder Station per simuliertem Touch an und zieht jede Lasche (Software-WebGL, deshalb kleines Fenster).
// Ablauf je Station: 1) jede Lasche per Touch bis zum Ende ziehen (bewegt sie sich?), 2) alle Laschen auf Endstellung setzen,
// 3) jedes antippbare Netz der Seite einmal antippen; geprüft wird: öffnet sich eine Karte (Titel, Text), gibt es Tipps auf unbekannte
// Karten-IDs (openCardById ignoriert die still!), sind alle Karten der Station erreichbar, lässt sich die Karte per Touch schließen.
// usage: [BOOK_HTML=..] [OUT_DIR=..] [TIER=low] node tools/touch-all.mjs [von=0] [bis=8] [w=800] [h=600]
import fs from 'node:fs';
import { open, ready, out } from './harness.mjs';
import * as s0 from '../src/data/s0.de.js';
import * as s1 from '../src/data/s1.de.js';
import * as s2 from '../src/data/s2.de.js';
import * as s3 from '../src/data/s3.de.js';
import * as s4 from '../src/data/s4.de.js';
import * as s5 from '../src/data/s5.de.js';
import * as s6 from '../src/data/s6.de.js';
import * as s7 from '../src/data/s7.de.js';
import * as s8 from '../src/data/s8.de.js';
const S = [s0, s1, s2, s3, s4, s5, s6, s7, s8];
const [from = '0', to = '8', W = '800', H = '600'] = process.argv.slice(2);
const { browser, ctx, page, logs } = await open({ w: +W, h: +H, touch: true, query: '?tier=' + (process.env.TIER || 'low') });
await ready(page, 300000);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const cdp = await ctx.newCDPSession(page);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const wait = (s) => page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), s);
const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
// Tipp, dann warten bis die Seite das Loslassen wirklich verarbeitet hat (auf schweren Seiten hängen Ereignisse hinter den Bildern;
// ohne das wird das Ergebnis dem falschen Tipp zugeordnet)
const ups = () => page.evaluate(() => window.__ups || 0);
const tap = async (x, y) => {
  for (let versuch = 0; versuch < 3; versuch++) {
    const u0 = await ups();
    await tp('touchStart', x, y); await pause(70); await tp('touchEnd');
    try { await page.waitForFunction((u) => (window.__ups || 0) > u, u0, { timeout: 15000, polling: 100 }); await pause(150); return true; }
    catch (e) { log('  Tipp ohne pointerup, Karte offen?', await page.evaluate(() => !!window.__app.ui.cardOpen)); await page.evaluate(() => window.__app.ui.closeCard()); await pause(300); }
  }
  return false;
};
await page.evaluate(() => {
  const a = window.__app; window.__tapLog = []; a.canvas.addEventListener('pointerup', () => { window.__ups = (window.__ups || 0) + 1; });
  const orig = a.openCardById.bind(a);
  a.openCardById = (id, wx, over) => { orig(id, wx, over); window.__tapLog.push({ id, opened: !!a.ui.cardOpen }); };
});
const report = []; let bad = 0;
for (let n = +from; n <= +to; n++) {
  log('Station', n);
  await page.evaluate((k) => window.__app.snapTo(k), n); await wait(1.5);
  const cur0 = await page.evaluate(() => window.__app.book.cur);
  // 1) Laschen per Touch
  const ctlInfo = await page.evaluate(() => {
    const a = window.__app, V = a.stage.camera.position.constructor, cam = a.stage.camera, sp = a.spreads.current;
    const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
    return [...sp.L.controls, ...sp.R.controls].map((c) => { const hw = new V(); c.handle.getWorldPosition(hw); return { id: c.id, label: c.label || c.id, v0: c.v, handle: proj(hw), end: proj(c.handle.parent.localToWorld(new V(c.b.x, 0.02, c.b.y))) }; });
  });
  const moved = [];
  for (const c of ctlInfo) {
    const pk = await page.evaluate(([x, y]) => { const p = window.__app.pick({ clientX: x, clientY: y }); return p && p.type === 'control' ? p.ctl.id : null; }, c.handle);
    await tp('touchStart', c.handle[0], c.handle[1]); await pause(60);
    for (let i = 1; i <= 12; i++) { await tp('touchMove', c.handle[0] + (c.end[0] - c.handle[0]) * i / 12, c.handle[1] + (c.end[1] - c.handle[1]) * i / 12); await pause(35); }
    const v = await page.evaluate((id) => { const a = window.__app; const k = [...a.spreads.current.L.controls, ...a.spreads.current.R.controls].find((x) => x.id === id); return k ? k.v : null; }, c.id);
    await tp('touchEnd'); await pause(250);
    moved.push({ id: c.id, label: c.label, picked: pk === c.id, v0: +(+c.v0).toFixed(2), v: v == null ? null : +v.toFixed(2), ok: v != null && Math.abs(v - c.v0) > 0.2 });
  }
  // 2) alle Laschen auf Endstellung, damit alles sichtbar ist; Seite beruhigen lassen
  const CTLV = Object.fromEntries((process.env.CTL || '').split(',').filter(Boolean).map((kv) => kv.split('=')));   // z.B. CTL=zeit=0.5,wachturm=1
  await page.evaluate((o) => { const a = window.__app; for (const c of [...a.spreads.current.L.controls, ...a.spreads.current.R.controls]) if (c.setValue) c.setValue(o[c.id] !== undefined ? +o[c.id] : 1); }, CTLV);
  await wait(2.5);
  // 3) Ziele finden (Pick-Netze der Seite, Bildschirmpunkte aus ihrer Box, mit app.pick bestätigt). Der Punkt wird vor jedem Tipp
  //    neu bestimmt, weil sich Figuren bewegen (Marsch, Wellen).
  const scanRes = await page.evaluate(() => {
    const a = window.__app, V = a.stage.camera.position.constructor, cam = a.stage.camera;
    const keyOf = (pk) => pk.type === 'control' ? pk.ctl : pk.type === 'actor' ? pk.actor : pk.fn;
    const toScreen = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
    window.__locate = (o, tgt) => {
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox; o.updateWorldMatrix(true, false);
      const c = [(bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2], sx = bb.max.x - bb.min.x, sy = bb.max.y - bb.min.y, sz = bb.max.z - bb.min.z;
      const samples = [[0, 0, 0], [.25, .25, 0], [-.25, .25, 0], [.25, -.25, 0], [-.25, -.25, 0], [0, .35, 0], [0, -.35, 0], [.35, 0, 0], [-.35, 0, 0], [0, 0, .3], [0, 0, -.3], [.3, .3, .3], [-.3, -.3, -.3]];
      for (const [fx, fy, fz] of samples) {
        const w = o.localToWorld(new V(c[0] + fx * sx, c[1] + fy * sy, c[2] + fz * sz)); const [x, y] = toScreen(w);
        if (x < 6 || x > innerWidth - 6 || y < 56 || y > innerHeight - 70) continue;
        const pk = a.pick({ clientX: x, clientY: y }); if (pk && keyOf(pk) === tgt) return { pk, x, y };
      }
      return null;
    };
    const objs = a.spreads.pickables(); const found = new Map(); const unreachable = []; window.__tg = [];
    for (const o of objs) {
      const tgt = o.userData.control || o.userData.actor || o.userData.tap; if (!tgt || found.has(tgt) || o.userData.control || !o.geometry) continue;
      const ok = window.__locate(o, tgt); const nm = o.name || tgt.name || tgt.id || o.type;
      if (!ok) { unreachable.push(String(nm)); continue; }
      window.__tg.push({ o, tgt });
      found.set(tgt, { i: window.__tg.length - 1, type: ok.pk.type, label: String(ok.pk.type === 'actor' ? (ok.pk.actor.name || ok.pk.actor.id || '?') : nm), card: ok.pk.type === 'actor' ? (ok.pk.actor.card || '') : '', pt: [ok.x, ok.y] });
    }
    return { list: [...found.values()], unreachable };
  });
  const unreachable = scanRes.unreachable, taps = scanRes.list;
  log('  Tipp-Ziele', taps.length, 'nicht antippbar', unreachable.length);
  const opened = new Set(), unknown = [], emptyCard = [], silent = [];
  for (const t of taps) {
    if (process.env.ONLY && !new RegExp(process.env.ONLY).test(t.label)) continue;   // z.B. ONLY=bogen|meilenstein
    await page.evaluate(() => { window.__tapLog.length = 0; });
    const pt = await page.evaluate((i) => { const g = window.__tg[i]; const r = window.__locate(g.o, g.tgt); return r ? [r.x, r.y] : null; }, t.i);
    if (!pt) { unreachable.push(t.label + ' (später verdeckt)'); continue; }
    await tap(pt[0], pt[1]); await pause(150);
    const st = await page.evaluate(() => {
      const a = window.__app, u = a.ui; const log = window.__tapLog.splice(0);
      const title = u.cardOpen ? ((u.card.querySelector('h1,h2,h3,.title,.name') || u.card).textContent || '').trim().slice(0, 50) : '';
      return { open: !!u.cardOpen, title, body: u.cardOpen ? (u.card.textContent || '').trim().length : 0, log, cur: a.book.cur };
    });
    if (process.env.VERBOSE) log('  tipp', t.type, t.label, t.card || '', '->', st.log.map((l) => l.id + (l.opened ? '' : '(!)')).join(',') || '-', st.open ? 'Karte offen' : '');
    for (const l of st.log) { if (l.opened) opened.add(l.id); else unknown.push(`${t.label}→${l.id}`); }
    if (st.open && (!st.title || st.body < 60)) emptyCard.push(`${t.label}→${st.log.map((l) => l.id).join(',')}`);
    if (!st.open && !st.log.length && t.card) silent.push(`${t.label}(${t.card})`);
    await page.evaluate(() => window.__app.ui.closeCard()); await pause(100);
    if (st.cur !== cur0) { log('  Tipp auf', t.label, 'hat umgeblättert; zurück'); await page.evaluate((k) => window.__app.snapTo(k), n); await wait(1.5); }
  }
  // Karte per Touch schließen (einmal je Station)
  let closeOk = null;
  const ct = taps.find((t) => t.card) || taps[0];
  if (ct) {
    const cpt = await page.evaluate((i) => { const g = window.__tg[i]; const r = window.__locate(g.o, g.tgt); return r ? [r.x, r.y] : null; }, ct.i);
    if (cpt) await tap(cpt[0], cpt[1]); await pause(350);
    const xb = await page.evaluate(() => { const u = window.__app.ui; const b = u.card.querySelector('.x'); if (!b || !u.cardOpen) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
    if (xb) { await tap(xb[0], xb[1]); await pause(350); closeOk = !(await page.evaluate(() => window.__app.ui.cardOpen)); }
    await page.evaluate(() => window.__app.ui.closeCard());
  }
  const expected = Object.keys(S[n].cards); const missing = expected.filter((id) => !opened.has(id));
  const row = { station: n, taps: taps.length, unreachable, controls: moved, cards: expected.length, opened: [...opened], missing, unknown, emptyCard, silent, closeOk };
  report.push(row);
  const stuck = moved.filter((m) => !m.ok || !m.picked);
  if (unknown.length || emptyCard.length || stuck.length || closeOk === false) bad++;
  console.log(`S${n}: Tipp-Ziele ${taps.length}, Laschen per Touch ${moved.filter((m) => m.ok).length}/${moved.length}, Karten per Tipp ${opened.size}/${expected.length}, Schließen per Touch ${closeOk}`);
  if (unreachable.length) console.log('   nicht antippbar (verdeckt/außerhalb):', unreachable.join(', '));
  if (missing.length) console.log('   per Tipp nicht erreicht:', missing.join(', '));
  if (unknown.length) console.log('   UNBEKANNTE KARTE:', unknown.join(', '));
  if (emptyCard.length) console.log('   LEERE KARTE:', emptyCard.join(', '));
  if (silent.length) console.log('   Figur mit Karte, aber ohne Reaktion:', silent.join(', '));
  if (stuck.length) console.log('   Lasche reagiert nicht:', stuck.map((m) => `${m.label}(${m.v0}->${m.v}${m.picked ? '' : ', nicht getroffen'})`).join(', '));
  fs.writeFileSync(out('touch-all.json'), JSON.stringify(report, null, 1));
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'keine Konsolenfehler/-warnungen');
console.log(bad ? `AUFFÄLLIG: ${bad} Station(en)` : 'alle Stationen ohne Auffälligkeit');
await browser.close();
