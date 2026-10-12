# ROEMER_BRIEF – gemeinsamer Auftrag für alle Stationen

**Produkt:** „Das große Popup-Buch vom Römischen Reich“ (Untertitel „Eine Reise auf der Straße nach Rom“): ein 3D-Popup-Buch im Browser
(Three.js, EINE selbstenthaltene HTML-Datei, alles aus Code gezeichnet, keine Bilddateien, keine externen Anfragen, keine Cookies).
Zielgruppe Klasse 5/6 (Sek I), Auftraggeber ist ein Lehrer (Chemie/Informatik, GSM Duisburg). Sprache: Deutsch, Du-Ansprache, kurze klare Sätze.
Geräte: iPad Safari (Touch) und Desktop. Aufbau: Titelseite (Station 0, macht der Projektleiter) + 8 Doppelseiten (Stationen 1–8). Du baust EINE Station.

## Was du lieferst (Eigentum – nur diese Dateien schreibst du, N = deine Stationsnummer)
- `src/pages/pN.js` und Hilfsdateien `src/pages/_pN_*.js` (Seiten-Definition, Mechanik)
- `src/art/reg_sN.js` (Registry deiner Figuren) und `src/art/rom/sN_*.js` (Figuren/Gebäude/Props als Specs)
- `src/data/sN.de.js` (`page` = Seitentext/Hinweis/Erzähltext, `cards` = alle Karten inkl. Gänsekarte `gansN`)
Alles andere ist TABU (Engine, DSL, Paint, gemeinsame Kits `rom/_people.js`, `rom/_arch.js`, `rom/gans.js`, `reg_rom.js`, `reg_e.js`, `p0`, andere Stationen).
Brauchst du etwas Gemeinsames, baust du es in deinen eigenen Dateien nach (Kopieren erlaubt) und nennst es im Bericht.

## Arbeitskopie (WICHTIG, sonst brechen sich die Agenten gegenseitig den Build)
```
mkdir -p /home/claude/work && rsync -a --exclude node_modules --exclude dist --exclude .git /home/claude/roemer-popup-buch/ /home/claude/work/sN/
ln -s /home/claude/roemer-popup-buch/node_modules /home/claude/work/sN/node_modules
cd /home/claude/work/sN
```
Arbeite NUR dort. Am Ende kopierst du genau deine Dateien (siehe oben) zurück in `/home/claude/roemer-popup-buch/` (gleiche Pfade, `cp` – keine anderen Dateien!)
und prüfst im Hauptprojekt nichts weiter; der Projektleiter baut zusammen. Gib im Bericht die Liste der kopierten Dateien an.

## Lies zuerst
`docs/PAGE_GUIDE.md` (Engine-API, Koordinaten, Mechanik-Muster, Tests), `docs/ART_GUIDE.md` (Spec-Format, DSL, Galerie-Werkzeug), `docs/KAPITEL.md` (freigegebene Planung deiner Station: Szene, Laschen, Antippbares, Gans, Ton, Tabus),
`facts.md` (Faktenbasis mit Status geprüft/umstritten/gerechnet/Fachwissen – Kartentexte MÜSSEN dazu passen), `src/art/rom/_people.js` und `_arch.js` (Kopfkommentare), Referenzseiten aus dem Dino-Buch (nur lesen, Muster übernehmen): `docs/ref/dino-pages/p1.js … p8.js` (Laschen, Läufer, Klappen, Partikel, Wellen …) und `p0_erduhr_backup.js` (Zeigerrad); `src/pages/stubpage.js` ist die Minimalseite.
Die Dino-Seiten importieren Dino-Dinge (animals, props); nimm nur die MUSTER, nicht die Imports.

## Stil
Papierschnitt-Gouache: mehrere Kulissenebenen mit welliger Oberkante (Himmelswand z≈−4.05, Fernband −3.2, Nahband −2.25), Figuren z −2…+2.6, Laschen/Schieber vorn z≈3.3–3.7.
Freundlich, warm, kein Blut, keine Gruselgesichter. Farbwelt: Terrakotta, Ocker, Purpur, Gold, Marmorweiß, Mittelmeerblau; deine Station hat eine Leitfarbe (Punktfarbe in `page.color`).
Menschen aus `person({...})` (anpassbar: Kleidung, Haare, Hut, Gegenstände, `parts`-Zusatzlayer) – nutze das für ALLE Menschen, damit der Stil einheitlich bleibt. Gebäude aus `archWall`, `columnPoly` usw. + Oberflächen-Deko. Hübsch UND sauber: nichts schwebt, nichts ragt durch Seite/Falz, nichts über den oberen Rand (Höhen siehe PAGE_GUIDE).
Mindestens: 3 Kulissenebenen, 1 großes Pop-up als Blickfang, 2–3 Laschen/Schieber/Klappen mit echter Wirkung (aus der Planung), Antippbares mit Karten, Atmosphäre (`mood`, `motes`), Partikel sparsam. Pro Doppelseite ≲ 45 Popups/Flats.
Laufen/Bewegen: `person()` liefert `meta.swing`; Muster siehe Dino-p1 (Position aus Laschenwert ableiten, Beine über sin() schwingen, `a.hop`).

## Texte und Karten (Fachlichkeit!)
- Jede Aussage auf Karten/Seitentexten kommt aus `facts.md` (Status beachten) oder aus verlässlichem Fachwissen, das du dort ergänzt/markierst. Unsicheres → Feld `note` („Hinweis: …“) mit beiden Lesarten. Keine wörtlichen Zitate, eigene Worte.
- Karten-Felder: `name, sci (lat. Name/Eigenname), say ('sprich: …'), tts (Sprechschreibweise für die Vorlesestimme), meaning, facts: [[Beschriftung, Wert], …] (max. 4), latin: {w, de, note?} („Wort aus Rom“, z. B. murus → Mauer), wow (max. 2 Sätze), text (3–4 kurze Sätze), note, specId + sizeM (optional: Größenvergleich mit Mensch 1,75 m), fragen (Anschluss für Arbeitsblatt), tags, speak (optional eigener Sprechtext)`.
  Jede Karte: klar, kindgerecht, ≤ 70 Wörter Fließtext. Lateinische Namen mit Aussprachehilfe. Je Station ein Latein-Wort, das im Deutschen weiterlebt (Planung in `docs/KAPITEL.md`).
- `page`: `card` (gedruckte Textkarte, 3–4 Sätze, wird links aufs Papier gedruckt), `narr` (Erzähltext zum Vorlesen, 3–5 Sätze, spricht die Laschen an), `hint` (Hinweiszeile unten: Namen der Laschen exakt wie auf den Laschen), `era`, `years`, `kicker`, `title` (schon vorbelegt, darfst du verbessern, `id`/`color` nur im Notfall).
- Tabus (verbindlich): kein Blut, keine Leichen, keine Kampfszenen/Gladiatorenkämpfe, kein Hakenkreuz-Mäander, Fasces nur in Station 2 mit Einordnung, keine Caesar-Ermordung zeigen, kein Vesuvausbruch (nur Zeitpunkt nennen), Germanen nie „Barbaren“, Sklaverei sachlich nennen, Musik „erfunden, nicht überliefert“, rote Tuniken nur als Annahme (Hinweis), Zahlen die „nicht als Fakt“ in facts.md Abschnitt 0 stehen NICHT verwenden.
- Ton/Erzählstimme-Zeichen: Ziffern/Abkürzungen so schreiben, dass `normalizeForSpeech` (src/data/speech.js) sie aussprechen kann; Zahlenwörter in `speak`/`tts` ausschreiben, wenn es sonst falsch klingt.

## Hilfen der Engine
Ton: `app.audio.sfx(name, opts)` / `app.audio.voice(id)` / `app.audio.ctl(name, wert)`; ein anderer Auftrag baut die Klangmaschine (Unbekanntes wird still ignoriert). `atmo` = `page.id`.
Verfügbare SFX-Namen = die vereinbarten aus PAGE_GUIDE (`turn lift land grab snap card found tick gong slide flapOpen flapClose pop footstep stomp swing flap splash bubble wave crack thud chime rustle ping whoosh …`) PLUS die Römer-Namen
`cornu tuba fanfare trommel marsch hammer saege seil wasser muenze griffel menge kran rad kutsche feuer schiff ruder honk`.
Tierstimmen/Figurenstimmen über `app.audio.voice(id)`: `gans1…gans8` (Gans, automatisch beim Antippen), `wolfin`, `elefant`, `pferd`, `hund`, `esel`, `person` (kurzes freundliches „Hm“ für Menschen), sonst Stille.
Wetter, Kamera, Partikel: siehe PAGE_GUIDE. Ruhiger Modus (`app.calm`) beachten; kein Blitz > 150 ms.

## Testen (in deiner Arbeitskopie)
```
node build.mjs --main --dev --out=/tmp/claude-0/pN/index.html
BOOK_HTML=/tmp/claude-0/pN/index.html OUT_DIR=/tmp/claude-0/pN node tools/shot.mjs <name> N 1280 720 6 [az el zoom]
```
Schau JEDEN Screenshot mit dem Read-Werkzeug an (Standard, Leseansicht `0 1.34 0.86`, ein schräger Winkel `0.55 0.7`), mit gesetzten Laschen (`EVAL=`, siehe PAGE_GUIDE) und beide Fenstergrößen 1280×720 und 1024×768 (iPad-ähnlich). Figuren einzeln in der Galerie prüfen (`node build.mjs --gallery --out=…`, `node tools/gallery.mjs …`, `pose=` für Gelenke).
Konsole muss sauber sein („no errors/warnings“). Tippe per `tools/t3.mjs`-Muster Laschen und Figuren an, prüfe dass Karten aufgehen und die Gans gefunden wird.
Mit `?tier=low` ist Software-WebGL langsam (~3 Bilder/s): kleine Fenster, `sim`-Sekunden klein halten.

## Bericht (letzte Nachricht, ≤ 40 Zeilen)
1) kopierte Dateien, 2) was die Station tut (Laschen/Schieber/Klappen mit ihren Beschriftungen), 3) Kartenliste (IDs), Position der Gans, 4) Faktenabweichungen/Lücken gegenüber facts.md (jede Aussage, die nicht aus facts.md stammt, einzeln), 5) Screenshot-Pfade (Dateien in /tmp/claude-0/pN/), 6) Bekannte Mängel ehrlich, 7) falls du eine gemeinsame Datei geändert hättest (sollst du nicht): was und warum.
