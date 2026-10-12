// Exportiert alle Texte des Buchs als texte.json (Grundlage für Arbeitsblätter). usage: node tools/export-texte.mjs [out.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAGES_DE, CARDS_DE } from '../src/data/pages.de.js';
import { ANIMALS_DE } from '../src/data/animals.de.js';
import { SCENES } from '../src/ui/zeitszenen.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Zuordnung Karte → Station aus den Abschnittskommentaren in animals.de.js ("// ---- Seite N ...")
const src = fs.readFileSync(path.join(root, 'src/data/animals.de.js'), 'utf8').split('\n');
const station = {}; let cur = null;
for (const line of src) {
  const m = line.match(/^\s*\/\/ -{5,} Seite (\d)/); if (m) { cur = +m[1]; continue; }
  const k = line.match(/^  ([a-z_0-9]+): \{/); if (k && cur !== null) station[k[1]] = cur;
}
for (const k of Object.keys(CARDS_DE)) station[k] = { erduhr: 0, iridium: 7, chicxulub: 7, ueberlebende: 7, album: 8, zeitluecke: 8 }[k] ?? null;

const kartentyp = (id, c) => (CARDS_DE[id] ? 'info' : c.hidden ? 'verstecktes Säugetier' : 'tier');
const card = (id, c) => ({
  id, typ: kartentyp(id, c), station: station[id] ?? null, name: c.name,
  wissenschaftlicherName: c.sci || null, aussprache: c.say || null, bedeutung: c.meaning || null,
  lebte: c.when || null, vonMioJahren: c.fromMa ?? null, bisMioJahren: c.toMa ?? null, periode: c.period || null,
  groesse: c.size || null, laengeM: c.lenM ?? null, masseKg: c.massKg ?? null, nahrung: c.diet || null, fundort: c.where || null,
  wow: c.wow || null, text: c.text || null, hinweisUnsicherheit: c.note || null,
  stichworte: c.tags || [], fragenFuerArbeitsblatt: c.fragen || [],
});
const cards = [...Object.entries(ANIMALS_DE), ...Object.entries(CARDS_DE)].map(([id, c]) => card(id, c));
const pages = PAGES_DE.map((p, i) => ({
  station: i, id: p.id, kapitel: p.name, zeitalter: p.era, jahre: p.years, titel: p.title, kicker: p.kicker || null,
  kartentext: p.card, erzaehltext: p.narr, bedienhinweis: p.hint,
  karten: cards.filter((c) => c.station === i).map((c) => c.id),
}));
const out = {
  titel: 'Das große Dinosaurier-Popup-Buch – alle Texte',
  zielgruppe: 'Klasse 5/6 (einfache, kurze Sätze; Du-Ansprache)',
  hinweis: 'Zahlen sind gerundet und entsprechen dem Forschungsstand, der in facts.md belegt ist. Die Erzähltexte werden im Buch von einer Neuro-TTS-Stimme gesprochen.',
  seiten: pages, karten: cards,
  zeitfenster: SCENES.map((s) => ({ id: s.id, zeit: s.when, zeitalter: s.era, titel: s.title, text: s.cap, merksatz: s.fact, ab_MioJahre: s.start })),
  arbeitsblattIdeen: [
    { thema: 'Zeitstrahl', aufgabe: 'Ordne die Tiere auf einem Zeitstrahl von 252 bis 66 Mio. Jahren (Felder vonMioJahren / bisMioJahren).' },
    { thema: 'Erduhr', aufgabe: 'Rechne Millionen Jahre in Uhrzeit um: Die Erde ist 4,54 Mrd. Jahre alt, ein Tag hat 24 Stunden.' },
    { thema: 'Größenvergleich', aufgabe: 'Vergleiche laengeM mit Dingen aus deiner Schule (Klassenzimmer 8 m, Bus 12 m).' },
    { thema: 'Chemie', aufgabe: 'Iridium (Ir, Ordnungszahl 77): Warum ist die Iridium-Schicht ein Beweis für den Einschlag?' },
    { thema: 'Zeitfenster', aufgabe: 'Ordne die Szenen des Zeitfensters (Feld zeitfenster) in die richtige Reihenfolge und trage die Uhrzeit ein: uhrzeit = 24 h × (1 − ab_MioJahre / 4540).' },
    { thema: 'Vorstellungsvermögen', aufgabe: 'Mensch und Dinosaurier: Wie viele Millionen Jahre liegen dazwischen? (Karte „Die große Zeitlücke“)' },
  ],
  lizenz: 'Texte: eigene Formulierung, frei für den Unterricht.',
};
const file = process.argv[2] || path.join(root, 'texte.json');
fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
const noStation = cards.filter((c) => c.station === null).map((c) => c.id);
console.log(`geschrieben: ${file}  Seiten ${pages.length}, Karten ${cards.length}, ohne Station: ${noStation.join(',') || '–'}`);
