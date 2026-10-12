# Klangmaschine – Dokumentation

Reines Web Audio, keine Audiodateien (außer den eingebetteten Erzähl-Clips aus `src/data/narration.generated.js`), keine Bibliotheken.
Alles in `src/audio/` (ca. 99 KiB Quelltext, nicht minifiziert):

| Datei | Inhalt |
|---|---|
| `audio.js` | `AudioEngine` (öffentliche API, Frame-Schleife, Ducking, `renderOffline`) |
| `synth.js` | Kern: Rauschpuffer, Hüllkurven, `Voice` (Stimmen-Pool-Eintrag), `Rig` (Graph, Busse, Master-Kette, Hall) |
| `sfx.js` | 41 Geräusche + Drosselung (`GAP`) |
| `voices.js` | 38 Tierstimmen (FM + subtraktiv + Formanten), `cine`-Varianten |
| `scenes.js` | 10 Atmosphären (`Scenes`), ctl-Schichten (`Layers`: tension, timeLapse, wind, underwater) |
| `music.js` | generative Pentatonik-Betten je Szene, Finale-Pad + Flöte, Spieluhr-Melodie |
| `narration.js` | Erzählstimme: MP3-Clips, Rückfall Sprachsynthese, Untertitel satzweise |
| `levels.js` | automatisch kalibrierte Pegelkorrekturen (nicht von Hand pflegen) |

## API

```js
const audio = new AudioEngine(app);          // app.calm, app.station, app.stage.tier werden gelesen
```

Felder (alle frei setzbar): `enabled` (Ton an), `volume` (0…1, Standard 0.6), `cine` (dramatischere Tierstimmen), `captions`,
`speaking` (nur lesen), `autoNarrate`, `onCaption(text)` (leer = ausblenden), `onSpeaking(bool)`; zusätzlich `unlocked`, `ctx`, `rig`.

| Methode | Wirkung |
|---|---|
| `unlock()` | Bei jeder Geste aufrufen (iOS): erzeugt/ setzt den `AudioContext` fort, spielt einen Stille-Puffer, weckt die Sprachsynthese. Vorher passiert nichts (Aufrufe werden verworfen, `setScene`/`ctl` werden gemerkt und beim Start angewandt). |
| `setEnabled(b)` | Aus: Master 0, Szene/Musik/Layer weg, Erzählung stoppt, Kontext wird nach 0.35 s angehalten. An: Kontext läuft, Szene und ctl-Werte kommen zurück. |
| `setVolume(v)` | Master-Gain mit Rampe (30 ms). Die Lautstärke ist *der* Master-Regler (siehe Hörschutz). |
| `sfx(name, opts?)` | Einmal-Geräusch. Unbekannte Namen werden still ignoriert. Je Name gedrosselt (`GAP`). |
| `voice(id)` | Tierstimme eines Actors; gleiche Tiere unterbrechen sich; Wiederholung < 0.25 s wird verschluckt; unbekannte ids → leises Blip. |
| `setScene(id)` | Atmosphäre + Musik wechseln (Überblendung 1.2 s). Unbekannte ids bleiben ohne Wirkung. |
| `ctl(name, v)` | Kontinuierlicher Wert 0…1 (siehe unten). Unbekannte Namen: still ignoriert. |
| `silence(sec = 3, delay = 0)` | Alles außer Erzählstimme sanft (0.5 s) auf 0, `sec` s halten, 1.8 s zurück. Für den Einschlag. |
| `narrate({ id, text })` | Liest vor, liefert ein Promise (löst am Ende oder bei Abbruch auf). Startet vorherige Erzählung neu. |
| `stopNarration()` | Bricht sanft ab (60 ms Rampe), Untertitel werden geleert, `speaking → false`. |
| `onPageShown(i)` | Nach der Landung einer Seite: nach 0.9 s liest die Stimme `PAGES_DE[i].narr` (nur wenn `autoNarrate`, Ton an, nichts spricht und `app.station === i`). Wird durch Umblättern/`stopNarration` entwertet. |
| `update(dt)` | Pro Frame (Untertitel, Scheduler, Aufräumen). Keine Allokationen im Normalfall; zusätzlich ein 150-ms-Sicherheitstakt. |
| `renderOffline(kind, name, seconds, o)` | Testhilfe, siehe unten. |

**Erweiterungen gegenüber dem Stub:** `catalog()` (Listen der Namen/ids), `stats()` (Pool-Größe, Zustand, Szene), `renderOffline`, die Felder `unlocked/ctx/rig`,
die `sfx`-Optionen und die ctl-Namen `rain`/`hush`. Alle Stub-Methodennamen sind unverändert.

### sfx-Namen (41) und Optionen

`turn` (`fwd`, `steps`) · `lift` · `land` (`cover`: schwerer Einband) · `grab` · `snap` · `card` (`close`) · `found` · `tick` (`rate`, `fast`) · `gong` · `slide` (`v` 0…1: Tonhöhe folgt der Zugstrecke) ·
`flapOpen` · `flapClose` · `pop` · `footstep` (`v`, `big`) · `stomp` (`big`) · `swing` · `flap` · `splash` (`big`) · `bubble` · `dive` · `wave` · `chomp` · `crack` · `splinter` · `peep` · `hatch` ·
`whoosh` · `rumble` (`dur`) · `impact` · `thud` · `chime` (`note`) · `grow` · `rustle` · `horn` · `tapp` · `fossil` · `woodcrack` · `ping` · `musicbox` (≈ 16 s Abschiedsmelodie, Musik-Bus) · `tinnitus` · `tweet`.

Nicht aufgeführte Optionen (z. B. `dir`, `v` bei `lift`) werden ignoriert. `impact` und `tinnitus` laufen über den Bus `over`: sie werden von `silence()`/`hush` nicht stumm geschaltet. Bei `app.calm` ist `impact` zusätzlich um 20 % leiser.

### Tierstimmen (38 ids + Aliase)

`coelophysis plateosaurus eoraptor morganucodon brachiosaurus stegosaurus allosaurus castorocauda archaeopteryx compsognathus rhamphorhynchus limulus ichthyosaurus pteranodon elasmosaurus mosasaurus trex triceratops ankylosaurus didelphodon maiasaura maiasaura_baby oviraptor multituberculate egg purgatorius hyracotherium gastornis plesiadapis pakicetus paraceratherium gomphotherium miocene_ape afarensis_f afarensis_m afarensis_child robin bird_fly`

Aliase: `lucy`, `australopithecus` → `afarensis_f`; `homo_fruehe` → `afarensis_m`; `sahelanthropus`, `orrorin`, `ardipithecus` → `miocene_ape`.
Standard = tiefes Brummen/Grollen bzw. zarte Rufe; `cine = true` macht Brüllen/Fauchen dramatischer (eigene Pegelkalibrierung, Spitze −7 dBFS statt −9).

### Szenen (10) und Musik

`cover erduhr trias jura-wald jura-lagune kreide-meer spaetkreide nest einschlag finale` (die Seiten-`atmo`-ids des Buchs). `setScene('cover')` für das geschlossene Buch.
Musik gibt es für alle außer `einschlag` (bewusste Stille). Das Finale hat ein warmes Pad (6 verstimmte Sägezähne, Akkordwechsel alle ≈ 12 s) plus Flöte.
Die Betten sind sehr leise, pentatonisch, mit Pausen von 3…10 s; jede Szene hat ein eigenes Instrument (Spieluhr, Celesta, Marimba, Kalimba, Glas, Flöte).

### ctl-Werte (0…1)

| Name | Wirkung |
|---|---|
| `tension` | Pfeifen (500 → 3,5 kHz) + Drohne + Luftrauschen; in der Szene `einschlag` zusätzlich Wind lauter, Vulkangrollen, Vögel erst häufiger, ab 0.8 still. Bei 0 baut sich die Schicht nach 3 s ab. |
| `timeLapse` | Zeitraffer-Regler (Position 0…1): sirrendes Ticken + aufsteigendes Pentatonik-Arpeggio, **nur solange sich der Wert bewegt** (klingt nach ≈ 1 s Stillstand aus, die Schicht wird nach 4 s abgebaut). Im `finale` blendet er Waldvögel/Insekten → Savannenvögel/trockenen Wind → Grillen über. |
| `rain` | Leiser Regen im `finale` (Tropfen + Rauschen). In anderen Szenen ohne Wirkung. |
| `wind` | Zusätzliche Windschicht über jeder Szene. |
| `underwater` | Tiefpass auf Atmo- und Musik-Bus von 22 kHz → 450 Hz (exponentiell). Läuft auch bei Ton aus mit, wirkt sich nur auf die Busse aus. |
| `hush` | Dämpft alle Busse außer Stimme/`over` auf `1 − v` (z. B. für ruhige Momente). |

Kleinste Änderung, die verarbeitet wird: 0.003 (Schutz vor Aufruf-Flut aus Schiebereglern).

## Erzählung

* Clip-ids: `cover`, `page<i>`, `card_<id>` (`main.js` übergibt `card:<id>`, das wird zu `card_<id>` normalisiert). Clips stammen aus `narration.generated.js` (Base64-MP3), werden erst beim Abspielen dekodiert (LRU-Cache: 4 Stück).
* Untertitel: der übergebene `text` wird in Sätze geteilt (Abkürzungen wie „ca.“, „Mio.“, „z. B.“ trennen nicht; ohne Lookbehind wegen älterer Safari-Versionen). Sätze werden nach Zeichenanteil über die Clip-Dauer verteilt, gekoppelt an die Audiouhr. Weicht der gezeigte Text stark vom gesprochenen ab, laufen die Untertitel leicht versetzt.
* Ohne Clip: `speechSynthesis` satzweise (deutsche Stimme bevorzugt, „natürlich“ klingende zuerst). Startet in 2 s keine Äußerung, laufen die Untertitel im Zeittakt (≈ 14 Zeichen/s) weiter.
* Ton aus: keine Sprache, Untertitel laufen im Zeittakt.
* Ducking während der Erzählung: Musik und Atmo auf 35 %, Effekte auf 70 % (Rampe 80 ms rein, 250 ms raus).
* Gemessene Pegel der eingebetteten Clips: Spitze ≈ −3 dBFS, Sprach-RMS ≈ −17,4 dBFS (Bus `voice`, kein Zusatz-Gain).

## Graph und Hörschutz

```
Quellen → Bus (music | atmo | fx | voice | over) → duck → pre → lull (hush × silence) → mix
mix → Hochpass 14 Hz → master (= Lautstärke-Regler) → Limiter (DynamicsCompressor, Schwelle −3 dB, Knie 0, 20:1, 2 ms/120 ms) → ×0.82 → Ausgang
```

* `music`/`atmo` haben einen Tiefpass (für `underwater`); `voice` und `over` umgehen `lull`.
* Jeder Gain wird mit Rampen geändert, nie mit Sprüngen. Alle Hüllkurven enden linear auf 0 (kein Klick), Einsätze ≥ 1,5–10 ms.
* Stimmen-Pool: max. 24 gleichzeitige (16 beim Tier `low`), Prioritäten 0–3 (ältere/leisere werden zuerst mit Fade geschlossen), Knoten werden nach `onended` getrennt, `sweep()` räumt Verwaiste.
* Messbefunde zur Master-Kette (siehe unten): Chrome/Safari hängen dem `DynamicsCompressor` automatisch ein Makeup-Gain an (≈ +1,7 dB beim Limiter). Es wird durch ×0.82 ausgeglichen: Ein 1-kHz-Ton mit −10 dBFS kommt mit Kette bei −10,0 dBFS heraus (Differenz 0,0 dB). Ein zusätzlicher „Glue“-Kompressor wurde verworfen, weil er Transienten deutlich einebnete.
* Im `OfflineAudioContext` fehlt dem Limiter am Anfang kurz die Einschwingzeit (erster Klang nach Start ≈ 1…3 dB leiser). Das ist ein Artefakt des Offline-Renderns und tritt nur dort auf; die Master-Tests nutzen daher 1 s Vorlauf (`o.at`).
* Der Einschlag am Ausgang (Lautstärke 1.0): −3,6 dBFS Spitze (bei Standard 0.6 ≈ −8 dBFS), Schwerpunkt ≈ 52 Hz (Sub 30–40 Hz). Tinnitus: Spitze −27,9 dBFS, klingt weich aus.

## Pegelziele und Ausnahmen

Gemessen ohne Master (Rohsignal, `raw`), danach wirken Lautstärke-Regler und Limiter.

| Klasse | Ziel |
|---|---|
| SFX-Spitze | −12 … −4 dBFS; meist −8; häufige kleine Geräusche (tick, tapp, slide, footstep, bubble …) −10 … −12 |
| `impact` | Spitze −5 dBFS (am Ausgang bei Lautstärke 1.0 ≤ −3 dBFS), 30–40 Hz Sub |
| `tinnitus` | −27 dBFS, weiches Ausklingen |
| Tierstimme | −9 dBFS, `cine` −7 dBFS |
| Atmosphäre | RMS −28 dBFS (−32 … −24); **Ausnahmen:** `cover` −46 (nur Hauch), `erduhr` −32, `einschlag` −30 (dort tragen ctl/Ereignisse), `spaetkreide` −27 |
| Musik | RMS −34 dBFS (−38 … −30); **Ausnahmen:** `cover` −37, `spaetkreide` −36, `finale` −33 |

`levels.js` enthält die dB-Korrekturen je Klang; sie werden von `node tools/audio-check.mjs --calibrate` geschrieben (linear in dB, konvergiert in einem Durchlauf). Von Hand nur grob ändern, sonst neu kalibrieren.

## Tests

```
node tools/audio-check.mjs                      # Buch bauen, headless starten, alles offline rendern, messen, Live-Test
node tools/audio-check.mjs --lite               # nur die Klangmaschine bündeln (≈ 1 min statt ≈ 2,5 min)
node tools/audio-check.mjs --calibrate          # zuvor levels.js neu schreiben (2 Durchläufe, danach Messung)
node tools/audio-check.mjs --only=trex          # nur Klänge, deren Name den Teil enthält
node tools/audio-check.mjs --no-build           # vorhandenes /tmp/claude-0/audio_test/index.html wiederverwenden
```

Ausgabe: Tabelle (Dauer, Spitze, RMS, DC, Stille %, Schwerpunkt, Klicks Anfang/Ende, Befund), JSON in `/tmp/claude-0/audio_test/audio-check.json`, WAV-Dateien in `/tmp/claude-0/audio_test/wav/`. Exit-Code 1 bei Verstößen.

Geprüft werden (Stand dieser Fassung: **158 Klänge, 0 Verstöße, 0 Warnungen**): alle 41 sfx (+ 10 Varianten wie `land{cover}`, `splash{big}` …), 38 Stimmen mit und ohne `cine` + unbekannte id, 10 Szenen à 12 s (+ 4 Varianten: Spannung, nach Einschlag, Savanne + Regen, unter Wasser), 9 Musikbetten à 32 s, 3 ctl-Verläufe, 3 Mastertests.
Verstoß = Spitze > −1 dBFS, < −40 dBFS, DC > 0,01, Klick am Anfang/Ende, NaN, Clipping, offenes Ende; Warnung = Zielpegel verfehlt.

Der Live-Test (13 Prüfungen) fährt die echte Engine: `unlock`, Szenen-Rundlauf, Sturm von 530 Aufrufen (Pool ≤ 24), Aufräumen nach Szenenwechseln, Erzählung mit Test-WAV und einem echten MP3-Clip, Rückfall, `stopNarration`, Ton aus/an, Konsole ohne Fehler.

`renderOffline(kind, name, seconds, o)`: `kind` = `sfx` (mit `o.opts`), `voice` (`o.cine`), `scene` (`o.ctl`, `o.layers`, `o.events`), `music`, `ctl` (`o.from` → `o.to`), `sine`; weitere Optionen `seed`, `sr`, `master`, `volume`, `at` (Vorlauf), `calm`. Rückgabe: mono `Float32Array`. Gleicher Seed = gleiches Ergebnis.

## Bekannte Schwächen

* Es konnte nicht gehört werden – Klangdesign ist über Spektrogramme und Pegel abgesichert, nicht über Ohren. Bitte einmal auf dem iPad probehören (Tierstimmen, Spieluhr, Einschlag/Stille).
* iPad-Lautsprecher geben < 150 Hz kaum wieder: Sub des Einschlags, Brummen von T-Rex/Brachiosaurus und Vulkangrollen sind dort vor allem als Obertöne hörbar.
* Sprachsynthese-Rückfall: Stimmen und Qualität hängen vom Gerät ab; ohne deutsche Stimme laufen nur Untertitel.
* Die Untertitel-Zeiten für MP3-Clips sind eine Schätzung nach Zeichenanteil, keine echten Satzgrenzen.
* `onPageShown` verlässt sich auf `app.station`; ohne dieses Feld spricht die Stimme nicht automatisch.
