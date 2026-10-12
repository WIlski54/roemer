# Lizenzübersicht

| Teil | Lizenz | Datei |
|---|---|---|
| Quellcode (`src/`, `tools/`, `build.mjs`), im Code erzeugte Kunst (Figuren, Kulissen, Gegenstände, Klänge) | MIT | `LICENSE` |
| Texte, Karten, Faktenbasis, Dokumentation (`src/data/`, Zeitfenster-Texte in `src/ui/zeitszenen.js`, `texte.json`, `facts.md`, `README.md`, `docs/`) | CC BY-SA 4.0 | `LICENSE-CONTENT` |
| Erzählstimme (`assets/narration/*.mp3`) | CC0 (Stimmdaten) | `assets/narration/LICENSE.txt` |

Bitte bei Weitergabe nennen: **„Das große Popup-Buch vom Römischen Reich“ von Stephan Wilski** (Engine: „Das große Dinosaurier-Popup-Buch“, https://github.com/WIlski54/dinobuch).

## Bestandteile von Dritten

- **three.js** (MIT), https://threejs.org – gebündelt in `dist/index.html`.
- **clipper-lib** (Boost Software License 1.0) – Papierschnitt-Konturen, gebündelt.
- **esbuild** (MIT), **playwright-core** (Apache 2.0) – nur zum Bauen und Testen.
- **Piper „de_DE-thorsten-medium“** (Stimmdaten CC0, Thorsten Müller / Thorsten-Voice; Modell von Rhasspy/Piper, MIT) über **sherpa-onnx** (Apache 2.0) – nur zum Erzeugen der MP3-Clips.
- Die Engine (Buch, Papierschnitt, Klangmaschine) stammt aus dem „Großen Dinosaurier-Popup-Buch“ und wurde für das Römer-Buch erweitert (Zeitrad, Zeitfenster, Reichskarte, Figurenbausatz).
