# Das große Popup-Buch vom Römischen Reich

Ein 3D-Popup-Buch für Klasse 5/6: eine Titelseite und acht Stationen vom Hirtenfeuer am Tiber (753 v. Chr.) bis zur stillen Straße am Rhein (476 n. Chr.). Alles ist in Code gezeichnet (Three.js, Papierschnitt-Stil), alle Klänge sind synthetisch, die Erzählstimme ist eine Offline-KI-Stimme. **Eine einzige Datei: `dist/index.html`** (ca. 13 MB), keine Netzwerkzugriffe, keine Cookies.

## Bedienen

- **Öffnen:** Datei in Safari/Chrome öffnen (iPad: aus „Dateien“ oder über den Server). Auf das Buch tippen, dann geht es los.
- **Blättern:** Pfeile unten oder die Punkte; am Seitenrand ziehen. Tastatur: ← →.
- **Regler (Laschen):** am Griff ziehen. **Tippen** auf Figuren und Dinge öffnet Karten. **Vorlesen** liest die Seite, jede Karte hat einen Vorlese-Knopf.
- **Titelseite:** Zeiger drehen (Zeitrad, Reichskarte wächst), „Tor auf!“, „Marsch!“. Das **Zeitfenster** zeigt 14 Szenen von 753 v. Chr. bis 476 n. Chr.
- **Such die Gans!** Auf jeder Station sitzt eine versteckte Gans (8 insgesamt); der Zähler steht auf der Titelseite, das Album öffnest du dort per Tipp.
- Oben rechts: Ansicht verschieben/zurücksetzen, Wetter, Lesemodus, Ton, Hilfe.

## Inhalt

| Seite | Thema | Zeit |
|---|---|---|
| 0 | Titelseite: Goldener Meilenstein, Zeitrad, Reichskarte, Triumphbogen, Zeitfenster | 753 v. Chr. – 476 n. Chr. |
| 1 | Rom entsteht (Sieben Hügel, Sage von Romulus und Remus) | 753–509 v. Chr. |
| 2 | Vom Stadtstaat zur Großmacht (Abstimmung, Hannibal, Enterbrücke) | 509–146 v. Chr. |
| 3 | Die Legion (Ausrüstung, Lagerbau, Schildkröte) | Republik bis 4. Jh. |
| 4 | Vom Konsul zum Kaiser (Rubikon, Münze, Lorbeerkranz) | 133 v. Chr. – 14 n. Chr. |
| 5 | Rom auf dem Höhepunkt (Kolosseum, Pantheon, Reichsgrenzen, Tagesablauf) | 1./2. Jh. |
| 6 | Leben in einer römischen Stadt (Pompeji: Läden, Haus, Thermen, Schule) | 1. Jh. |
| 7 | Straßen, Wasser, Beton (Aquädukt, Fußbodenheizung, **Kalkkreislauf**) | 1./2. Jh. |
| 8 | Römer am Rhein und was bleibt (Limes, Köln, Xanten, Lehnwörter) | 1.–5. Jh. |

Insgesamt **111 Karten** (103 Info-Karten und 8 versteckte Gänse; Fakten, „Wort aus Rom“, Wow-Satz, kurzer Text, ggf. Hinweis zur Unsicherheit) und **121 Vorlese-Clips** (rund 48 Minuten). Tabus, die wir bewusst eingehalten haben: keine Gewaltdarstellung (keine Gladiatorenkämpfe, kein Blut, keine Mordszene), keine Hakenkreuz-Mäander, Fasces nur auf Station 2, Germanen nie „Barbaren“. Die **Musik ist erfunden, nicht überliefert** (steht im Buch).

## Dateien

- `dist/index.html` – das fertige Buch
- `texte.json` – alle Texte für Arbeitsblätter (mit Ideen, u. a. Kalkkreislauf rechnen)
- `facts.md` – Faktenbasis mit Quellen und Status (geprüft / umstritten / gerechnet / Fachwissen); **Abschnitt 11 = Gegenlese-Liste**
- `docs/GEGENLESE.md` – die vollständige Gegenlese-Liste (alle Aussagen ohne Quelle in `facts.md`)
- `docs/` – Kapitelplan, Seitenanleitung, Klangmaschine
- `src/`, `tools/`, `build.mjs` – Quellcode und Werkzeuge

## Selbst bauen

```bash
npm ci
node build.mjs --main            # -> dist/index.html (bettet assets/narration/*.mp3 ein)
node tools/export-texte.mjs      # -> texte.json
# Erzählstimme neu erzeugen (Python 3, sherpa-onnx, ffmpeg):
node tools/speech-dump.mjs && python3 tools/make-narration.py --kbps 24
```

## Hosting

Nur nach deiner Freigabe: Das Buch ist eine statische Datei und läuft auf jedem Webserver (z. B. Flask/Coolify, `index.html` ausliefern). Ich habe nichts veröffentlicht.

## Was geprüft wurde (und womit)

- **Netz und Konsole:** Das Buch macht 0 Anfragen nach außen, setzt 0 Cookies und schreibt keine Konsolenfehler (Headless-Chromium, `tools/net-check.mjs`).
- **Antippen per simuliertem Touch** (`tools/touch-all.mjs`, alle 9 Seiten): Jede Lasche lässt sich per Touch ziehen, jede antippbare Fläche öffnet ihre Karte, es gibt keine Tipps auf unbekannte Karten, jede Karte ist erreichbar (die Reichskarten-Karten der Titelseite und die Zeit-Stufen von Station 8 je nach Zeigerstellung). Dabei fiel ein echter Fehler auf und ist behoben: Zwei Karten hießen „haendler“, die Pompeji-Karte wurde von der Rhein-Karte überschrieben.
- **Texte:** Drei unabhängige KI-Leser haben jede Karte, jeden Seitentext und jede Zeitfenster-Szene gegen `facts.md` gelesen (Fachleute waren nicht dabei). Sie fanden 292 Aussagen ohne belegte Quelle (197 „sicher“, 77 „wahrscheinlich“, 15 „unsicher“, nur wenige Punkte im Netz nachgeprüft) und rund 40 Fehler oder Unschärfen; alle sind im Buch korrigiert (Liste in `facts.md`, Abschnitt 11.3). Offene Entscheidungen stehen in Abschnitt 11.4.
- **Stimme:** Alle 121 Clips wurden automatisch geprüft (Lautheit −19 LUFS, keine Übersteuerung, plausibles Sprechtempo). Eine Stichprobe per Spracherkennung (6 Clips) ergab 20 % Wortfehler (15 % ohne Eigennamen), am schlechtesten bei der Formel des Kalkkreislaufs (Buchstaben einzeln gesprochen).
- **Klänge:** Die Klangmaschine wurde gemessen (Pegel, Spitzen, Stille, Klicks), nicht gehört.

## Ehrliche Grenzen

- **Nicht auf einem echten iPad getestet.** Alle Tests liefen in einem Headless-Browser mit Software-Rendering (sehr langsam, ca. 3 Bilder/s). Echte Bildrate, Touch-Gefühl und Speicherverbrauch sind unbekannt. Ist es auf dem iPad zu ruckelig, hilft `?tier=low` hinter der Adresse.
- **Klänge und Stimme nie gehört.** Bitte einmal anhören: Fachwörter und Namen (z. B. „Hypokaustum“, „Pont du Gard“) können seltsam klingen. Falsch gesprochene Wörter lassen sich in `tools/make-narration.py` (Tabelle `PRONUNCIATION`) korrigieren.
- **Fachwissen:** Die Aussagen in `docs/GEGENLESE.md` sind nicht mit Quellen belegt, sondern von KI gegengelesen. Bitte zuerst die 15 „unsicheren“ und die 77 „wahrscheinlichen“ prüfen (`facts.md`, Abschnitt 11.1 und 11.2). Offen sind außerdem: Länge der römischen Meile, zweite Quelle für die Teilung 395, Tretradkran nur Wikipedia, Corvus (Länge und Wirkung nur nach Polybios), Gänse-Sage (Livius nicht geöffnet), „opus caementicium“ gegen Abschnitt 0 (Abschnitt 11.4).
- Bei kleinen Fenstern sind einige Figuren und Beschriftungen klein; manche Karten sind hoch (am Tablet im Querformat scrollen sie). Die Arena im Kolosseum (Station 5) ist eine kleine Tippfläche.
- Bilder wie Reichskarte, Hafen, Pompeji, Zeitfenster sind **vereinfacht und teilweise erfunden** (steht auf den Karten und in der Hilfe, z. B. Schiffsfarben, Graffiti, Hannibals Aussehen, die Kirche bei Konstantin).

## Lizenz

Quellcode und im Code erzeugte Kunst: MIT. Texte, Karten, Faktenbasis, Dokumentation: CC BY-SA 4.0 (wie beim Dinosaurier-Buch übernommen, bitte bestätigen). Erzählstimme: CC0-Stimmdaten (Piper „thorsten-medium“). Details in `NOTICE.md`.
