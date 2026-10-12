// Sprechtexte: EINE Quelle für die eingebetteten Neuro-TTS-Clips (tools/make-narration.py) und das Vorlesen im Buch.
// Clip-IDs: "cover", "page0".."page8", "card_<kartenId>"
import { PAGES_DE, CARDS_DE } from './pages.de.js';

export function normalizeForSpeech(t) {
  return String(t || '')
    .replace(/„|“|"/g, '')
    .replace(/\bMio\.(?!\s*Jahr)/g, 'Millionen Jahren').replace(/\bMio\.\s*/g, 'Millionen ').replace(/\bMrd\.\s*/g, 'Milliarden ')
    .replace(/\bz\. ?B\./g, 'zum Beispiel').replace(/\bca\./g, 'circa').replace(/\bu\. ?a\./g, 'unter anderem').replace(/\bd\. ?h\./g, 'das heißt').replace(/\busw\./g, 'und so weiter')
    .replace(/(\d)\s*cm³/g, '$1 Kubikzentimeter').replace(/(\d)\s*km\b/g, '$1 Kilometer').replace(/(\d)\s*kg\b/g, '$1 Kilogramm').replace(/(\d)\s*m\b/g, '$1 Meter')
    .replace(/(\d)\s*°C/g, '$1 Grad Celsius').replace(/(\d)\s*%/g, '$1 Prozent')
    .replace(/(\d)–(\d)/g, '$1 bis $2').replace(/ – /g, ', ').replace(/·/g, ',')
    .replace(/\bv\. Chr\./g, 'vor Christus').replace(/\bn\. Chr\./g, 'nach Christus').replace(/\bJh\./g, 'Jahrhundert')
    .replace(/\s+/g, ' ').replace(/ ([,.!?])/g, '$1').trim();
}
const stop = (s) => (/[.!?]$/.test(s) ? s : s + '.');

export function cardSpeechParts(id) {
  const d = CARDS_DE[id]; if (!d) return [];
  if (d.speak) return [d.speak];
  const parts = [d.tts || d.name];
  if (d.meaning) parts.push(d.meaning.replace(/^Bedeutung:\s*/, 'Der Name bedeutet: '));
  if (d.latin) parts.push('Das Wort ' + (d.latin.tts || d.latin.w) + ' ist lateinisch und bedeutet: ' + d.latin.de);
  if (d.wow) parts.push('Wow! ' + d.wow);
  if (d.text) parts.push(d.text);
  return parts;
}
export const cardSpeech = (id) => cardSpeechParts(id).map((p) => stop(normalizeForSpeech(p))).join(' ');
export const pageSpeech = (i) => normalizeForSpeech(PAGES_DE[i].narr);
export const COVER_SPEECH = 'Das große Popup-Buch vom Römischen Reich. Eine Reise auf der Straße nach Rom. Tippe auf das Buch, dann geht es los!';

// alle Clips in fester Reihenfolge
export function allSpeechItems() {
  const items = [{ id: 'cover', kind: 'cover', text: normalizeForSpeech(COVER_SPEECH) }];
  PAGES_DE.forEach((p, i) => items.push({ id: 'page' + i, kind: 'page', text: pageSpeech(i) }));
  for (const id of Object.keys(CARDS_DE)) items.push({ id: 'card_' + id, kind: 'card', text: cardSpeech(id) });
  return items;
}
