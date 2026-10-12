// Schreibt assets/narration/_items.json (id + Sprechtext) für den TTS-Schritt
import fs from 'node:fs';
import { allSpeechItems } from '../src/data/speech.js';
fs.mkdirSync('assets/narration', { recursive: true });
const items = allSpeechItems();
fs.writeFileSync('assets/narration/_items.json', JSON.stringify(items, null, 1));
const words = items.reduce((n, i) => n + i.text.split(/\s+/).length, 0);
console.log(items.length + ' Clips, ' + words + ' Wörter (≈ ' + Math.round(words / 2.3 / 60) + ' Min. Sprache)');
