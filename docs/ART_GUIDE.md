# ART GUIDE – Papierschnitt-Tiere und -Pflanzen für das Popup-Buch vom Römischen Reich

Du baust Figuren-Specs (reiner JavaScript-Code, keine Bilddateien) für ein 3D-Popup-Buch. Jede Figur wird später als
dünner Papierschnitt (weißer Schnittrand, gemalte Gouache-Textur) aufgestellt, mit Schatten, vor Kindern der Klasse 5/6.
Projektordner: `<PROJEKTORDNER>` (alle Befehle von dort ausführen).

## Stil (verbindlich)
- **Charmant, warm, freundlich**: leicht pummelige, gut lesbare Proportionen, große freundliche Augen, KEIN Blut, KEINE
  Gruselzähne. Zähne nur als wenige einfache helle Dreiecke/Linien. Lesbar auch bei 3 cm Höhe auf dem Bildschirm:
  kräftige, klare Silhouette, wenige mutige Details (Streifen, Flecken, Platten, Federn als gröbere Bündel), keine Mikrotextur.
- **Wissenschaftlich plausibel (Stand 2020er)**: Körperbau/Proportionen/Merkmale nach modernen Rekonstruktionen. Kleine
  Theropoden/Coelurosaurier mit Flaum bzw. Federn, Archaeopteryx/Oviraptor mit Flügelfedern, T. rex Schuppenhaut (höchstens
  etwas Flaum), Pterosaurier mit Flughaut und Pycnofasern-Flaum, Mosasaurier mit Schuppen und Fluke. Echte Größen in METERN.
- **Farben**: gedeckte, warme Gouache-Töne mit Rücken dunkler / Bauch heller (`fill:{top,bottom}`), 1–2 Akzentfarben,
  Streifen/Flecken zur Wiedererkennung. Jedes Tier soll sich vom Hintergrund (Sand, Grün, Blau) abheben: Rückenfarbe
  nicht gleich Untergrundfarbe.
- Schau dir jedes Ergebnis an (Galerie-PNG mit dem Read-Tool ansehen!) und iteriere, bis es **erkennbar und hübsch** ist.
  Prüfe auch eine kleine Ansicht (`cell=220`) – ist das Tier dort noch sofort erkennbar?

## Spec-Format
```js
// src/art/animals/<id>.js
import { blob, limb, poly, xf, move, panel, spline } from '../dsl.js';
import { eye, volume, spots, stripes, scalesTexture, fuzz, line, dot } from '../paint.js';
export default function make(opts = {}) {          // opts z. B. {pose:'brood'}
  return {
    id: 'trex',
    parts: {                                       // Reihenfolge = Erstellreihenfolge; z entscheidet vorn/hinten
      body: { z: 1, layers: [ { shapes: [polyA, polyB], fill: {top:'#6e7a3c', bottom:'#d3c78a'}, deco(c, bb){ volume(c, bb); } } ] },
      jaw:  { z: 0, pivot: [x, y], layers: [ { shapes: [jawPoly], fill: '#e6dba5' } ] },   // beweglicher Teil
    },
    anchors: { head:[x,y], mouth:[x,y], eye:[x,y], back:[x,y], foot:[x,y] },   // in Metern, für Effekte/Ruf-Position
    meta: { name:'Tyrannosaurus rex', lengthM: 12,
            ranges: { jaw:[0,-0.6], ... } },       // sinnvoller Bewegungsbereich je beweglichem Teil in RADIANT: [Ruhe, Maximum]
  };
}
```
- **Koordinaten**: Meter, y nach oben, Boden bei y=0, Tier schaut nach **+x (rechts)**. Körperlänge ≈ echte Größe.
- `layers` werden von unten nach oben gemalt (fernes Bein zuerst, dann Körper, dann Kopf …). Jeder Layer: `shapes`
  (Liste von Polygonen `[[x,y],...]`, werden vereinigt), `fill` (Farbe `'#rrggbb'`, oder `{top,bottom}`, oder
  `{stops:[[0,c],[1,c]], dir:'v'|'h'}`), optional `deco(c, bb)` (Malen innerhalb des Layers, auf die Form begrenzt) und
  `stroke:null` um die dunkle Randlinie wegzulassen.
- Der **Papierumriss** (weißer Rand) entsteht automatisch aus der Vereinigung aller Layer-Formen des Parts.
- **Bewegliche Teile** (eigene Parts) drehen um `pivot` (Modellkoordinaten) um die z-Achse: **positiver Winkel = gegen den
  Uhrzeigersinn** (Tier schaut nach rechts: Kiefer öffnen = negativ; Hals/Kopf heben = positiv; Schwanz hoch = negativ,
  runter = positiv). Standard-Namen (nutze sie exakt, die Seitenlogik greift darauf zu):
  `body` (Pflicht, enthält Hauptsilhouette), `jaw` (Unterkiefer/Schnabelunterteil, z kleiner als body → liegt dahinter),
  `neck` (Hals+Kopf als EIN Teil, Pivot an der Halsbasis/Schulter), `tail` (Schwanz ab Hüfte), `wing`/`wing2` (nahe/ferne Flügel,
  Pivot an der Schulter), `legA`/`legB` (Laufbeine, Pivot an der Hüfte), `flipperA`/`flipperB`, `trunk`, `head`.
  **Wichtig**: Bewegliche Teile müssen dort, wo sie am Körper ansetzen, **in den Körper hineinragen und vom Körper
  verdeckt werden** (Körper hat größeres z) bzw. umgekehrt, damit beim Drehen um ±0,5 rad keine Lücke klafft.
  Der Hauptkörper darf dann an dieser Stelle NICHT dasselbe Stück nochmals enthalten (sonst doppelt).
- `meta.ranges`: je beweglichem Teil `[ruhe, maximum]` in Radiant. Die Seitenlogik interpoliert dazwischen.
- Optional weitere Posen: `make({pose:'...'})` (z. B. 'brood', 'fly', 'perched', 'walk').

## DSL (src/art/dsl.js)
- `blob(cx, cy, rx, ry=rx, rot=0, n=40)` Ellipse.
- `limb([[x,y,w],...], {per:10, caps:true})` verjüngter Strang entlang einer Catmull-Rom-Kurve; `w` = Durchmesser. Ideal für
  Hals, Schwanz, Beine, Arme. Ein Punkt mit `w` nahe 0 am Ende = Spitze.
- `poly(pts, smoothing=0)` geschlossenes Polygon, `smoothing`=1–3 rundet Ecken (Chaikin).
- `xf(poly, {x,y,rot,s,sx,sy,flipX})` transformieren, `move(poly,dx,dy)`, `spline(ctrl, per)`, `panel(x0,x1,y0,h,{wave,freq,phase,seed,scallop})` für Kulissen mit welligem Rand.
- Alle Polygone eines Layers werden per Clipper vereinigt (Löcher und Überlappungen sind erlaubt).
## Malhilfen (src/art/paint.js), `c` = Painter, `bb` = Layer-Bounding-Box
`eye(c,x,y,r,{color,white,look})`, `volume(c,bb,{dark,light})` (Licht oben/Schatten unten), `spots(c,bb,color,n,rmin,rmax,{seed,alpha})`,
`stripes(c,bb,color,n,{width,slant,alpha})`, `scalesTexture(c,bb,color,{size,alpha})`, `fuzz(c,bb,color,n,len)`, `line(c,pts,color,w,{alpha})`, `dot(c,x,y,r,color,alpha)`.
Eigenes Malen: `c.ctx` (Canvas2D), `c.tf(x,y)` → Pixel, `c.S` Pixel pro Meter, `c.rng()`.
Für eigene wiederkehrende Helfer lege eine NEUE Datei an (z. B. `src/art/animals/_<gruppe>.js`) – ändere NICHT `dsl.js`, `paint.js`, `src/engine/*`.

## Prüf-Werkzeug (Galerie)
Jede Gruppe baut in ein EIGENES Verzeichnis (parallele Arbeit, nichts überschreiben):
```
node build.mjs --gallery --out=/tmp/claude-0/art_<gruppe>/gallery.html
node tools/gallery.mjs /tmp/claude-0/art_<gruppe>/sheet.png html=/tmp/claude-0/art_<gruppe>/gallery.html ids=a,b,c cols=3 cell=420 [mode=scale] [pose=jaw:-0.5,neck:0.3]
```
Dann das PNG mit dem Read-Tool ansehen. `mode=scale` zeigt alle im selben Maßstab, `human` (1,75 m) wird links eingeblendet.
`pose=` dreht bewegliche Teile aller Figuren (Test der Gelenknähte!). Registrierung: trage deine Tiere in **deine** Datei
`src/art/reg_<gruppe>.js` ein (`export default { id: factoryFn, ... }`) – nur diese Datei teilt sich die Registry.
Beispiele zum Abschauen: `src/art/animals/_theropod.js` (parametrischer Baukasten), `coelophysis.js`, `human.js`.
Der Baukasten `_theropod.js` ist nur ein grober Startpunkt – gute Tiere entstehen meist durch **eigene, sorgfältig gesetzte Kurven**.

## Abnahme (Checkliste je Tier)
1. Sofort als das Tier erkennbar (Schlüsselmerkmale!), auch klein. 2. Freundlich, hübsch, farblich stimmig. 3. Pivot-/Gelenktest mit
`pose=` ohne Lücken. 4. `anchors` und `meta.ranges` gesetzt. 5. In `reg_<gruppe>.js` registriert, Galerie baut ohne Fehler.
Am Ende: ein Gesamt-PNG `/tmp/claude-0/art_<gruppe>/final.png` + kurze Liste: id → bewegliche Teile (+ranges) → Besonderheiten/Posen.
