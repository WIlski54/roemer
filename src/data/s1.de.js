// Station 1: Seitentext und Karten (Deutsch, Klasse 5/6, Du-Ansprache).
// page: id, name, era, years, color (Punktfarbe), kicker, title, card (gedruckte Textkarte, 3 bis 4 Sätze), narr (Erzählstimme), hint (Hinweiszeile unten)
// cards: Karten-ID -> { name, sci (Latein/Eigenname), say ('sprich: …'), tts (Sprechschreibweise), meaning,
//   facts: [[Beschriftung, Wert], …] (max. 4), latin: {w, de, note} (Wort aus Rom), wow (max. 2 Sätze), text (kurz), note (Hinweis zur Unsicherheit),
//   specId + sizeM (Größenvergleich mit Mensch), hidden:true (Gans), ribbon, fragen, tags, speak (eigener Sprechtext) }
// Wichtig für die Vorlesestimme: Sage-/Überlieferungs-Hinweise stehen auch im Fließtext (text/wow), denn `note` und `facts` werden nicht vorgelesen.
export const page = {
  "id": "rom-entsteht",
  "name": "Rom entsteht",
  "era": "Königszeit",
  "years": "753–509 v. Chr.",
  "color": "#7fae5c",
  "kicker": "Station 1",
  "title": "Sieben Hügel am Tiber"
};
page.card = 'Schon lange vor 753 v. Chr. lebten Hirten auf dem Palatin, einem Hügel am Tiber. Aus kleinen Dörfern auf den Hügeln wuchs langsam eine Stadt: Rom. Die Römer erzählten später eine Sage von den Zwillingen Romulus und Remus. Das Gründungsjahr 753 wurde erst viel später ausgerechnet.';
page.narr = 'Es ist früh am Morgen am Tiber, und Nebel liegt über dem Fluss. Zieh an der Lasche Die Zwillinge: Nach der Sage kümmert sich eine Wölfin um Romulus und Remus. Mit dem Schieber Sieben Hügel steigen die Hügel Roms aus dem Papier. Und mit der Lasche Furche pflügt Romulus nach der Sage die erste Stadtgrenze um den Palatin. Tippe alles an und such die Gans!';
page.hint = 'Zieh an „Die Zwillinge“, „Sieben Hügel“ und „Furche“. Tippe auch Figuren an und such die Gans!';

export const cards = {
  wolfin: {
    name: 'Die Wölfin mit Romulus und Remus', sci: 'Lupa', say: 'sprich: LU-pa', tts: 'Die Wölfin mit Romulus und Remus',
    meaning: 'Bedeutung: lupa ist das lateinische Wort für Wölfin',
    facts: [
      ['Das ist', 'eine Sage'],
      ['Eltern der Zwillinge', 'Rhea Silvia (Sage)'],
      ['Ort', 'am Tiber'],
      ['Wölfin auf Latein', 'lupa'],
    ],
    wow: 'Von einer Wölfin gefunden: So erzählt es die Sage von den Gründern Roms.',
    text: 'Nach der Sage waren Romulus und Remus Söhne der Rhea Silvia. Als Babys wurden sie am Tiber ausgesetzt. Dort fand sie eine Wölfin und kümmerte sich um die beiden. So erzählten es die Römer später über den Anfang ihrer Stadt.',
    note: 'Hinweis: Das ist eine Sage! Ob es Romulus und Remus wirklich gab, wissen wir nicht.',
    specId: 'wolfin', sizeM: 1.9,
    fragen: ['Woran erkennst du, dass diese Geschichte eine Sage ist?', 'Warum erzählt man sich gern Geschichten über den Anfang einer Stadt?'],
    tags: ['Station 1', 'Sage', 'Wölfin', 'Romulus und Remus'],
  },
  romulus: {
    name: 'Romulus pflügt die Stadtgrenze', sci: 'Romulus', say: 'sprich: RO-mu-lus', tts: 'Romulus pflügt die Stadtgrenze',
    facts: [
      ['Das ist', 'eine Sage'],
      ['Gründung nach der Sage', '753 v. Chr.'],
      ['Seine Furche', 'rund um den Palatin'],
      ['Sie bedeutet', 'die erste Stadtgrenze'],
    ],
    latin: { w: 'murus', de: 'die Mauer. Unser Wort „Mauer“ kommt daher.', note: 'Mit dem Steinbau kam das Wort zu uns. Im Althochdeutschen gibt es „Mauer“ schon seit dem 8. Jahrhundert.', tts: 'murus' },
    wow: 'Eine Furche als Stadtgrenze: Nach der Sage zog Romulus sie mit dem Pflug.',
    text: 'Die Römer erzählten: Romulus gründete Rom im Jahr 753 vor Christus. Mit einem Pflug und einem Ochsen zog er eine Furche rund um den Palatin. Sie zeigte, wo die Stadt enden sollte. Auch das ist eine Sage.',
    note: 'Hinweis: Das Jahr 753 v. Chr. hat der Gelehrte Varro erst fast 700 Jahre später ausgerechnet. Die Sage erzählt auch von einem Streit der beiden Brüder. Wie er ausgeht, lassen wir hier offen.',
    fragen: ['Wozu braucht eine Stadt eine Grenze?', 'Wo sieht man bei uns noch Mauern, und woher kommt das Wort?'],
    tags: ['Station 1', 'Romulus', 'Sage', 'Mauer'],
  },
  huette: {
    name: 'Die Hirtenhütte', sci: 'Casa Romuli', say: 'sprich: KA-sa RO-mu-li', tts: 'Die Hirtenhütte',
    meaning: 'Bedeutung: Casa Romuli heißt Haus des Romulus',
    facts: [
      ['Bauart', 'oval, mit Strohdach'],
      ['Ort', 'Palatin'],
      ['Dauerhaft bewohnt', 'etwa ab dem 10. oder 9. Jh. v. Chr.'],
      ['Casa Romuli', 'angeblich das Haus des Gründers'],
    ],
    wow: 'Schon lange vor 753 v. Chr. wohnten Menschen auf dem Palatin.',
    text: 'Auf dem Palatin stand ein Dorf aus kleinen Hütten mit Strohdach. Hirten lebten hier schon lange vor 753 vor Christus. Später zeigten die Römer stolz eine Hütte als das Haus von Romulus.',
    note: 'Hinweis: Dass diese Hütte wirklich Romulus gehörte, ist nicht bewiesen.',
    fragen: ['Wie würdest du heute in so einer Hütte wohnen?', 'Warum zeigten die Römer ein „Haus des Romulus“?'],
    tags: ['Station 1', 'Palatin', 'Hütte'],
  },
  tiber: {
    name: 'Der Tiber', sci: 'Tiberis', say: 'sprich: TI-be-ris', tts: 'Der Tiber',
    meaning: 'Bedeutung: Tiberis ist der lateinische Name des Flusses',
    facts: [
      ['Lage', 'mitten durch die Stadt Rom'],
      ['Heute', 'Tevere (italienisch)'],
      ['Sage', 'Hier wurden die Zwillinge ausgesetzt'],
      ['Hügel', 'liegen nicht weit vom Ufer'],
    ],
    wow: 'Der Tiber ist älter als die Stadt Rom, und er fließt noch heute durch sie hindurch.',
    text: 'Der Tiber ist der Fluss von Rom. Die Sage erzählt, dass die Zwillinge Romulus und Remus an seinem Ufer ausgesetzt wurden. Die Hügel, auf denen Rom wuchs, liegen nicht weit vom Wasser. Morgens zieht hier oft Nebel über den Fluss.',
    note: 'Hinweis: Der Nebel ist nur Stimmung für das Bild.',
    fragen: ['Welcher Fluss fließt durch deine Stadt?', 'Warum bauten Menschen ihre Dörfer gern an Flüssen?'],
    tags: ['Station 1', 'Tiber', 'Fluss'],
  },
  tarquinius: {
    name: 'Tarquinius, der letzte König', sci: 'Tarquinius Superbus', say: 'sprich: tar-KWI-ni-us su-PER-bus', tts: 'Tarquinius, der letzte König',
    meaning: 'Bedeutung: Superbus heißt der Stolze',
    facts: [
      ['Rolle', 'siebter und letzter König (Überlieferung)'],
      ['Vertrieben', 'um 509 v. Chr. (Überlieferung)'],
      ['Danach', 'kein König mehr in Rom'],
      ['Quelle', 'erst Jahrhunderte später aufgeschrieben'],
    ],
    wow: 'Von 753 bis 509 sollen nur sieben Könige regiert haben. Die Liste ist halb sagenhaft.',
    text: 'Nach der Überlieferung war Tarquinius der siebte und letzte König von Rom. Die Römer vertrieben ihn um 509 vor Christus. Danach hatte Rom keinen König mehr. Die Liste der sieben Könige ist halb Sage und wurde erst Jahrhunderte später aufgeschrieben.',
    note: 'Hinweis: Das Jahr ist unsicher. Je nach Quelle liegt die Vertreibung bei 510, 509 oder um 507 bis 506 v. Chr. Darum schreiben wir „um 509“.',
    fragen: ['Woran erkennst du, dass die Geschichte der sieben Könige nicht ganz sicher ist?', 'Wie wird bei uns heute entschieden, wer regiert?'],
    tags: ['Station 1', 'König', 'Überlieferung'],
  },
  huegel: {
    name: 'Die sieben Hügel Roms', sci: 'septem colles', say: 'sprich: SEP-tem KOL-les', tts: 'Die sieben Hügel Roms',
    meaning: 'Bedeutung: septem colles heißt sieben Hügel',
    facts: [
      ['Die sieben', 'Palatin, Kapitol, Aventin, Caelius, Esquilin, Viminal, Quirinal'],
      ['Der älteste', 'der Palatin'],
      ['Entwicklung', 'Rom wuchs langsam aus Dörfern zusammen'],
      ['Von den Nachbarn', 'lernten die Römer viel'],
    ],
    wow: 'Rom ist langsam gewachsen: Aus Dörfern auf Hügeln wurde nach und nach eine Stadt.',
    text: 'Auf den Hügeln am Tiber lagen kleine Dörfer. Der Palatin ist der älteste Hügel. Mit der Zeit wuchsen die Dörfer zusammen. Von den Nachbarn im Norden, den Etruskern, lernten die Römer viel.',
    note: 'Hinweis: Wann die Dörfer zusammenwuchsen, ist umstritten. Manche Forscher denken an eine langsame Entwicklung seit etwa 1000 v. Chr., andere an einen Zusammenschluss Mitte des 8. Jahrhunderts v. Chr. Wie stark die Etrusker Rom prägten, wird diskutiert.',
    fragen: ['Kannst du die sieben Hügel am Schieber nacheinander benennen?', 'Warum baut man eine Siedlung gern auf einen Hügel?'],
    tags: ['Station 1', 'Hügel', 'Rom wächst'],
  },
  gans1: {
    name: 'Die Gans auf dem Kapitol', sci: 'anser', say: 'sprich: AN-ser', tts: 'Die Gans auf dem Kapitol',
    meaning: 'Bedeutung: anser ist das lateinische Wort für Gans',
    wow: 'Gefunden! Nach einer Sage haben Gänse das Kapitol gerettet.',
    text: 'Du hast die Gans oben auf dem Kapitol gefunden. Sie trägt einen Hirtenhut. Nach der Sage haben Gänse das Kapitol gerettet: Ihr Schnattern warnte die Römer vor den Galliern.',
    note: 'Hinweis: Das ist eine Sage. Die Gänse sind nur in alten Erzählungen überliefert. Das war erst um 390 v. Chr., also nach der Zeit der Könige. Das Datum ist umstritten.',
    hidden: true,
    tags: ['Station 1', 'Gans', 'Kapitol', 'Sage'],
  },
};
