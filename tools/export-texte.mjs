// Exportiert alle Texte des Buchs als texte.json (Grundlage für Arbeitsblätter). usage: node tools/export-texte.mjs [out.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as s0 from '../src/data/s0.de.js';
import * as s1 from '../src/data/s1.de.js';
import * as s2 from '../src/data/s2.de.js';
import * as s3 from '../src/data/s3.de.js';
import * as s4 from '../src/data/s4.de.js';
import * as s5 from '../src/data/s5.de.js';
import * as s6 from '../src/data/s6.de.js';
import * as s7 from '../src/data/s7.de.js';
import * as s8 from '../src/data/s8.de.js';
import { SCENES } from '../src/ui/zeitszenen.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const S = [s0, s1, s2, s3, s4, s5, s6, s7, s8];

const card = (id, c, station) => ({
  id, station, typ: c.hidden ? 'versteckte Gans' : 'info', name: c.name,
  lateinisch: c.sci || null, aussprache: c.say || null, bedeutung: c.meaning || null,
  fakten: (c.facts || []).map(([beschriftung, wert]) => ({ beschriftung, wert })),
  wortAusRom: c.latin ? { wort: c.latin.w, deutsch: c.latin.de, hinweis: c.latin.note || null } : null,
  wow: c.wow || null, text: c.text || null, hinweisUnsicherheit: c.note || null,
  stichworte: c.tags || [], fragenFuerArbeitsblatt: c.fragen || [],
});
const cards = S.flatMap((m, i) => Object.entries(m.cards).map(([id, c]) => card(id, c, i)));
const pages = S.map((m, i) => ({
  station: i, id: m.page.id, kapitel: m.page.name, zeitalter: m.page.era, jahre: m.page.years, titel: m.page.title, kicker: m.page.kicker || null,
  kartentext: m.page.card, erzaehltext: m.page.narr, bedienhinweis: m.page.hint,
  karten: cards.filter((c) => c.station === i).map((c) => c.id),
}));
const out = {
  titel: 'Das große Popup-Buch vom Römischen Reich – alle Texte',
  zielgruppe: 'Klasse 5/6 (einfache, kurze Sätze; Du-Ansprache)',
  hinweis: 'Jahreszahlen und Zahlen stehen mit Quelle und Status in facts.md (geprüft / umstritten / gerechnet / Fachwissen). Aussagen mit Status „Fachwissen“ stehen in der Gegenlese-Liste (facts.md, Abschnitt 11). Die Erzähltexte werden im Buch von einer Neuro-TTS-Stimme gesprochen.',
  seiten: pages, karten: cards,
  zeitfenster: SCENES.map((s) => ({ id: s.id, jahr: s.at, zeit: s.when, zeitalter: s.era, titel: s.title, text: s.cap, merksatz: s.fact })),
  arbeitsblattIdeen: [
    { thema: 'Zeitstrahl', aufgabe: 'Ordne die Szenen des Zeitfensters (Feld zeitfenster, Feld jahr) auf einem Zeitstrahl von 753 v. Chr. bis 476 n. Chr. Wie viele Jahre liegen zwischen dem ersten und dem letzten Jahr? (Es gibt kein Jahr 0: 753 + 476 − 1 = 1228.)' },
    { thema: 'Lehnwörter', aufgabe: 'Sammle alle lateinischen Wörter aus den Karten (Feld wortAusRom) und finde ihr deutsches Wort. Welche kennst du noch aus anderen Sprachen?' },
    { thema: 'Chemie: Kalkkreislauf', aufgabe: 'Station 7, Karte „Kalkkreislauf“: Stelle die drei Reaktionsgleichungen auf (Brennen, Löschen, Abbinden). Wie viel gebrannten Kalk (CaO) erhältst du aus 1 t reinem Kalkstein (CaCO₃)? Rechne mit M(CaCO₃) = 100 g/mol und M(CaO) = 56 g/mol.' },
    { thema: 'Reichskarte', aufgabe: 'Titelseite: Stelle das Zeitrad auf die sieben Stufen der Karte und schreibe auf, welche Gebiete jeweils neu dazukommen.' },
    { thema: 'Quellen prüfen', aufgabe: 'Suche eine Karte mit dem Feld hinweisUnsicherheit. Warum ist die Aussage unsicher? Wie könnte man mehr herausfinden?' },
    { thema: 'Spurensuche', aufgabe: 'Station 8: Welche römischen Spuren findest du in deiner Stadt oder Region (Namen, Straßen, Mauerreste, Wörter)?' },
  ],
  lizenz: 'Texte: eigene Formulierung, frei für den Unterricht (CC BY-SA 4.0, siehe LICENSE-CONTENT).',
};
const file = process.argv[2] || path.join(root, 'texte.json');
fs.writeFileSync(file, JSON.stringify(out, null, 2) + '\n');
console.log(`geschrieben: ${file}  Seiten ${pages.length}, Karten ${cards.length}, Zeitfenster ${out.zeitfenster.length}`);
