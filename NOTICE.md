# Lizenzübersicht

| Teil | Lizenz | Datei |
|---|---|---|
| Quellcode (`src/`, `tools/`, `build.mjs`), im Code erzeugte Kunst (Figuren, Kulissen, Gegenstände, Klänge) | MIT | `LICENSE` |
| Texte, Karten, Faktenbasis, Dokumentation (`src/data/`, Zeitfenster-Texte in `src/ui/zeitszenen.js`, `texte.json`, `facts.md`, `README.md`, `docs/`) | CC BY-SA 4.0 | `LICENSE-CONTENT` |
| Erzählstimme (`assets/narration/*.mp3`) | CC0 (Stimmdaten) | `assets/narration/LICENSE.txt` |

Bitte bei Weitergabe nennen: **„Das große Dinosaurier-Popup-Buch“ von Stephan Wilski**, https://github.com/WIlski54/dinobuch

## Bestandteile von Dritten

- **three.js** (MIT), https://threejs.org – gebündelt in `dist/index.html`.
- **clipper-lib** (Boost Software License 1.0) – Papierschnitt-Konturen, gebündelt.
- **esbuild** (MIT), **playwright-core** (Apache 2.0) – nur zum Bauen und Testen.
- **Piper „de_DE-thorsten-medium“** (Stimmdaten CC0, Thorsten Müller / Thorsten-Voice; Modell von Rhasspy/Piper, MIT) über **sherpa-onnx** (Apache 2.0) – nur zum Erzeugen der MP3-Clips.
- Aus diesem Buch ging die Engine (Buch, Papierschnitt, Klangmaschine) für das „Große Ägypten-Popup-Buch“ und „Die große Bibliothek“ hervor.
