// Build: bundles src/main.js (+ three.js, clipper) into ONE self-contained dist/index.html
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const dev = process.argv.includes('--dev');
const outArg = (process.argv.find((a) => a.startsWith('--out=')) || '').slice(6);
const root = path.resolve('.');

// Embed narration MP3s (if present) as a generated module
const narrDir = path.join(root, 'assets/narration');
const narr = {};
if (fs.existsSync(narrDir)) {
  for (const f of fs.readdirSync(narrDir)) {
    if (f.endsWith('.mp3')) narr[f.replace(/\.mp3$/, '')] = fs.readFileSync(path.join(narrDir, f)).toString('base64');
  }
}
if (!process.argv.includes('--gallery')) fs.writeFileSync(path.join(root, 'src/data/narration.generated.js'),
  'export default ' + JSON.stringify(narr) + ';\n');

async function bundle(entry){
const result = await build({
  entryPoints: [entry],
  bundle: true,
  write: false,
  format: 'iife',
  target: ['es2020', 'safari15'],
  minify: !dev,
  sourcemap: false,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'warning',
});
return result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
}
const css = fs.readFileSync('src/style.css', 'utf8');
const tpl = fs.readFileSync('src/index.template.html', 'utf8');
fs.mkdirSync('dist', { recursive: true });
const only = process.argv.includes('--gallery') ? ['gallery'] : process.argv.includes('--main') ? ['main'] : ['main', 'gallery'];
for (const name of only) {
  const js = await bundle(name === 'main' ? 'src/main.js' : 'src/gallery.js');
  const html = tpl.replace('/*__CSS__*/', () => css).replace('/*__JS__*/', () => js);
  const file = outArg && only.length === 1 ? outArg : (name === 'main' ? 'dist/index.html' : 'dist/gallery.html');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  console.log(`${file}  ${(fs.statSync(file).size / 1024).toFixed(0)} KB` + (name === 'main' ? `  (${Object.keys(narr).length} narration clips)` : ''));
}
