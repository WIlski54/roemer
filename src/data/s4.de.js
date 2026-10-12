// Station 4: Seitentext und Karten (Deutsch, Klasse 5/6, Du-Ansprache).
// page: id, name, era, years, color (Punktfarbe), kicker, title, card (gedruckte Textkarte, 3 bis 4 Sätze), narr (Erzählstimme), hint (Hinweiszeile unten)
// cards: Karten-ID -> { name, sci (Latein/Eigenname), say ('sprich: …'), tts (Sprechschreibweise), meaning,
//   facts: [[Beschriftung, Wert], …] (max. 4), latin: {w, de, note} (Wort aus Rom), wow (max. 2 Sätze), text (kurz), note (Hinweis zur Unsicherheit),
//   specId + sizeM (Größenvergleich mit Mensch), hidden:true (Gans), ribbon, fragen, tags, speak (eigener Sprechtext) }
// Quellen: facts.md Abschnitt 4 (Caesar, Rubikon, Augustus, Denar, Monate, Kleopatra, Wort „Kaiser“) und Abschnitt 8 (Münze). Was dort nicht steht,
// ist als Fachwissen im Projektbericht von Station 4 einzeln aufgelistet.
export const page = {
  "id": "kaiser",
  "name": "Vom Konsul zum Kaiser",
  "era": "Ende der Republik",
  "years": "133 v. Chr. bis 14 n. Chr.",
  "color": "#c99a2e",
  "kicker": "Station 4",
  "title": "Ein Mann und ein Fluss"
};
page.card = 'Rom war eine Republik, in der gewählte Männer mitbestimmten. Doch im Streit um die Macht gab es Bürgerkriege, und 49 v. Chr. führte Caesar seine Soldaten über den Fluss Rubikon. Am Ende stand Augustus an der Spitze, der erste Kaiser. Er nannte sich lieber „Princeps“, der Erste Bürger.';
page.narr = 'Links streiten die Senatoren am Abend. Rechts beginnt ein neuer Morgen, und dazwischen fließt der Rubikon. Schieb den Regler Rubikon, dann führt Caesar seine Soldaten über den Fluss. Zieh den Lorbeerkranz, dann setzt ein Senator ihn Augustus auf. Und mit der Münze drehst du einen Denar um und siehst beide Seiten.';
page.hint = 'Schieb „Rubikon“, zieh „Lorbeerkranz“ und dreh die „Münze“ · Tippe auf alles · Such die Gans';
export const cards = {
  caesar: {
    name: 'Gaius Julius Caesar', sci: 'Gaius Iulius Caesar', say: 'sprich: GAI-us YU-li-us KAI-sar', tts: 'Gajus Julius Kaisar',
    meaning: 'Bedeutung: Caesar war der Beiname seiner Familie',
    facts: [
      ['Gallien', '58 bis 50 v. Chr. von ihm erobert'],
      ['Rubikon', '49 v. Chr. mit dem Heer überschritten'],
      ['Amt', 'Feldherr, ab Februar 44 v. Chr. Diktator auf Lebenszeit'],
      ['Gestorben', '15. März 44 v. Chr.'],
    ],
    latin: { w: 'Caesar', de: 'Beiname einer römischen Familie. Daraus wurde unser Wort „Kaiser“, auch das Wort „Zar“.', tts: 'Kaisar' },
    wow: 'Caesar war nie Kaiser, und trotzdem heißt der Kaiser nach ihm. Auch der Monat Juli ist nach ihm benannt.',
    text: 'Caesar war ein römischer Feldherr und eroberte in acht Jahren Gallien. 49 v. Chr. führte er sein Heer über den Rubikon, und es kam zum Bürgerkrieg. Er wurde sehr mächtig, war aber nie Kaiser. Am 15. März 44 v. Chr. wurde er von Gegnern ermordet.',
    note: 'Hinweis: Seinen Spruch „Der Würfel ist gefallen“ überliefert erst der Schreiber Sueton, viel später. Ob Caesar das so gesagt hat, ist unsicher. Sein Aussehen und sein roter Mantel sind in diesem Buch eine Zeichnung und eine Annahme.',
    fragen: ['Warum heißt der Herrscher bei uns „Kaiser“, in Russland früher „Zar“?', 'Was meint man heute, wenn jemand „den Rubikon überschreitet“?'],
    tags: ['Station 4', 'Caesar', 'Kaiser', 'Julius'],
  },
  augustus: {
    name: 'Augustus', sci: 'Augustus', say: 'sprich: au-GUS-tus', tts: 'Augustus',
    meaning: 'Bedeutung: der Erhabene, der Ehrwürdige',
    facts: [
      ['Titel „Augustus“', 'seit Januar 27 v. Chr.'],
      ['Er nannte sich', '„Princeps“, erster Bürger'],
      ['Gestorben', '14 n. Chr.'],
      ['Monat', 'Der August ist nach ihm benannt (8 v. Chr.)'],
    ],
    latin: { w: 'princeps', de: 'der Erste. Davon kommt unser Wort „Prinz“.', tts: 'Prinkeps' },
    wow: 'Nach Caesar heißt der Juli, nach Augustus der August. Zwei Römer stehen bis heute in unserem Kalender.',
    text: 'Augustus hieß zuerst Octavian und war Caesars Großneffe und Erbe. Nach den Bürgerkriegen regierte er allein und bekam 27 v. Chr. den Titel Augustus. Er nannte sich aber lieber „Princeps“, der erste Bürger. Mit ihm beginnt die Kaiserzeit.',
    note: 'Hinweis: Das Wort „Kaiser“ gab es damals noch nicht. Dass ihm ein Senator den Lorbeerkranz aufsetzt, ist eine Szene für dieses Buch.',
    fragen: ['Welche Monatsnamen kennst du, die von Römern stammen?', 'Warum wollte Augustus nicht „König“ heißen, sondern „erster Bürger“?'],
    tags: ['Station 4', 'Augustus', 'Princeps', 'Kaiserzeit'],
  },
  kleopatra: {
    name: 'Kleopatra', sci: 'Kleopatra VII.', say: 'sprich: kle-o-PA-tra', tts: 'Kleopatra die Siebte',
    meaning: 'Bedeutung: griechischer Name, „Ruhm des Vaters“',
    facts: [
      ['Lebte', 'etwa 69 bis 30 v. Chr.'],
      ['Herrschaft', 'Königin von Ägypten'],
      ['Stadt', 'Alexandria am Mittelmeer'],
      ['Besonderes', 'letzte aktive Herrscherin des alten Ägypten'],
    ],
    wow: 'Kleopatra war die letzte Herrscherin des alten Ägypten, die wirklich regierte. Nach ihr herrschten die Römer.',
    text: 'Kleopatra war Königin von Ägypten. Sie regierte ein reiches Land und verbündete sich mit mächtigen Römern wie Caesar. Als sie im Jahr 30 v. Chr. starb, wurde Ägypten römisch. Hier trägt sie Diadem und Zepter, wie es einer Herrscherin gehört.',
    note: 'Hinweis: Wie Kleopatra wirklich aussah, wissen wir nicht, das Bild im Buch ist eine Zeichnung. Vieles über sie schrieben später ihre römischen Gegner.',
    fragen: ['Welche Herrscherinnen und Herrscher kennst du aus anderen Ländern?'],
    tags: ['Station 4', 'Kleopatra', 'Ägypten'],
  },
  rubikon: {
    name: 'Der Rubikon', sci: 'Rubico', say: 'sprich: RU-bi-kon', tts: 'Rubikon',
    meaning: 'Bedeutung: ein kleiner Grenzfluss in Norditalien',
    facts: [
      ['Jahr', '49 v. Chr.'],
      ['Wer', 'Caesar mit seinem Heer'],
      ['Grenze', 'Ein Feldherr durfte sein Heer nicht nach Italien führen'],
      ['Folge', 'Bürgerkrieg in Rom'],
    ],
    wow: 'Noch heute sagt man „den Rubikon überschreiten“, wenn man etwas beginnt und nicht mehr zurück kann.',
    text: 'Der Rubikon war ein kleiner Fluss und galt als Grenze nach Italien. Ein Feldherr durfte sein Heer nicht über diese Grenze führen. Doch im Jahr 49 v. Chr. tat Caesar es trotzdem. Danach gab es Krieg zwischen ihm und seinen Gegnern in Rom.',
    note: 'Hinweis: Sicher ist vor allem das Jahr 49 v. Chr., nicht alles andere ist so sicher. Den Spruch „Der Würfel ist gefallen“ überliefert erst Sueton. Welcher heutige Bach der Rubikon war, ist unter Fachleuten nicht ganz sicher. Kleidung und Schilde der Soldaten sind eine Annahme.',
    fragen: ['Wo gibt es in deinem Leben einen Punkt, an dem man „nicht mehr zurück kann“?'],
    tags: ['Station 4', 'Rubikon', 'Caesar', 'Bürgerkrieg'],
  },
  denar: {
    name: 'Der Denar', sci: 'denarius', say: 'sprich: de-NA-ri-us', tts: 'Denarius',
    meaning: 'Bedeutung: „je zehn“, der Zehner',
    facts: [
      ['Metall', 'Silber'],
      ['Seit', 'etwa 211 v. Chr.'],
      ['Hauptmünze', 'bis ins frühe dritte Jahrhundert n. Chr.'],
      ['Geprägt', 'mit Stempel und Hammer'],
    ],
    latin: { w: 'moneta', de: 'Beiname der Göttin Juno. Aus „Juno Moneta“ wurde unser Wort „Münze“.', tts: 'Moneta' },
    wow: 'Jede Münze war wie ein kleines Plakat: Herrscher ließen ihr Gesicht darauf prägen, damit alle sie kannten.',
    text: 'Der Denar war eine kleine Silbermünze. Man bezahlte damit auf dem Markt, und Soldaten bekamen ihren Sold in Münzen. Der Münzer legte ein Stück Silber zwischen zwei Stempel und schlug mit dem Hammer zu. Vorne war oft ein Kopf zu sehen, hinten ein Bild.',
    note: 'Hinweis: Die Münze im Buch ist frei gezeichnet. Sie ist keine Abbildung einer echten Münze.',
    fragen: ['Wer ist auf unseren Euro-Münzen abgebildet, und was zeigt die andere Seite?'],
    tags: ['Station 4', 'Denar', 'Münze', 'Geld'],
  },
  lorbeerkranz: {
    name: 'Der Lorbeerkranz', sci: 'corona laurea', say: 'sprich: ko-RO-na LAU-re-a', tts: 'Korona laurea',
    meaning: 'Bedeutung: Kranz aus Lorbeer',
    facts: [
      ['Pflanze', 'Lorbeer, grün das ganze Jahr'],
      ['Bedeutung', 'Zeichen für Sieg und Ehre'],
      ['Im Buch', '27 v. Chr., Kranz für Augustus'],
      ['Heute', 'bei Siegern und in der Redensart „auf den Lorbeeren ausruhen“'],
    ],
    wow: 'Wer sich „auf seinen Lorbeeren ausruht“, ruht sich auf einem alten Erfolg aus. Der Spruch kommt vom Lorbeerkranz der Sieger.',
    text: 'Der Lorbeer war für die Römer ein Zeichen für Sieg und Ehre. Siegreiche Feldherren trugen bei ihrem Triumph einen Lorbeerkranz. Auch Augustus wird oft mit Lorbeer gezeigt. Wenn du die Lasche ziehst, bringt ihm ein Senator den Kranz.',
    note: 'Hinweis: Wie Augustus den Kranz genau überreicht bekam, ist nicht überliefert. Die Szene im Buch ist eine Bild-Idee.',
    fragen: ['Wo siehst du heute noch Kränze oder Blätter als Zeichen für einen Sieg?'],
    tags: ['Station 4', 'Lorbeer', 'Augustus', 'Sieg'],
  },
  gans4: {
    name: 'Gans mit Lorbeerkranz', sci: 'anser', say: 'sprich: AN-ser', tts: 'Anser', hidden: true,
    meaning: 'Bedeutung: anser ist das lateinische Wort für Gans',
    wow: 'Der Lorbeerkranz war in Rom ein Zeichen für Sieg. Du hast die Gans gefunden, also gehört der Kranz ihr!',
    text: 'Gefunden! Die Gans hat sich in der Münzwerkstatt versteckt, genau unter dem Stapel mit den Denaren. Auf dem Kopf trägt sie einen Lorbeerkranz wie Augustus. Bei dem Lärm der Hämmer hat sie wohl noch niemand bemerkt.',
    fragen: ['Was würdest du als Siegerin oder Sieger auf dem Kopf tragen?'],
    tags: ['Station 4', 'Gans'],
  },
};
