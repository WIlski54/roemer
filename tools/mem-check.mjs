// GPU-Texturspeicher je Station schätzen (einmalige Texturen im Szenengraph, inkl. MIP-Kette) + three.js-Zähler.
// usage: TIER=med node tools/mem-check.mjs
import { open, ready } from './harness.mjs';
const tier = process.env.TIER || 'med';
const { browser, page, logs } = await open({ w: 1024, h: 768, query: '?tier=' + tier });
await ready(page, 200000);
const measure = () => page.evaluate(() => {
  const a = window.__app, seen = new Set(); let bytes = 0, n = 0, biggest = [];
  const add = (t) => {
    if (!t || !t.isTexture || seen.has(t.uuid)) return; seen.add(t.uuid);
    const im = t.image; if (!im) return; const w = im.width || im.videoWidth || 0, h = im.height || im.videoHeight || 0;
    const b = w * h * 4 * (t.generateMipmaps !== false && t.minFilter !== 1006 && t.minFilter !== 1003 ? 1.34 : 1); bytes += b; n++; biggest.push([w + 'x' + h, Math.round(b / 1e6 * 10) / 10]);
  };
  a.stage.scene.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) { for (const k in m) { const v = m[k]; if (v && v.isTexture) add(v); } if (m.uniforms) for (const k in m.uniforms) { const v = m.uniforms[k] && m.uniforms[k].value; if (v && v.isTexture) add(v); } } });
  if (a.stage.key.shadow.map) { const s = a.stage.key.shadow.mapSize; bytes += s.x * s.y * 4; }
  biggest.sort((x, y) => y[1] - x[1]);
  const i = a.stage.renderer.info;
  return { station: a.station, textures: n, MB: Math.round(bytes / 1e6), threeTex: i.memory.textures, geos: i.memory.geometries, built: a.spreads.list.filter((s) => s.built).map((s) => s.index ?? '').length, top: biggest.slice(0, 3).map((x) => x.join('=')).join(' ') };
});
console.log('tier', tier, JSON.stringify(await measure()));
for (const s of [0, 1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2, 1, 0]) {
  await page.evaluate(async (s) => { await window.__app.snapTo(s); }, s);
  await page.waitForTimeout(1200);
  console.log('station', String(s).padEnd(2), JSON.stringify(await measure()));
}
console.log(logs.filter((l) => /error|warn/i.test(l) && !/accounts.google|ERR_|proxy|connect/i.test(l)).slice(0, 10).join('\n') || 'no errors/warnings');
await browser.close();
