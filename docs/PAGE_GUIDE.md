# PAGE GUIDE – so baut man eine Doppelseite (Station) im Popup-Buch vom Römischen Reich

Projekt: `<PROJEKTORDNER>` (alle Befehle von dort). Sprache der Oberfläche/Texte: Deutsch, Du-Ansprache, Klasse 5/6.
Lies **vor dem Start**: `src/pages/p1.js` (komplette Referenz-Seite, funktioniert), `src/pages/p0.js`, `src/pages/common.js`,
`src/engine/spreads.js` (SpreadCtx), `src/engine/popup.js` (Popup/Actor/Control/PageSide), `docs/ART_GUIDE.md`, `docs/ROEMER_BRIEF.md` und `docs/KAPITEL.md`
(Spezifikation des Auftraggebers; der Abschnitt deiner Station ist verbindlich), und die Datei deiner Station `src/data/sN.de.js` (Seitentext `page` und Karten `cards`).

## Koordinaten (Seitenrahmen, identisch für linke und rechte Seite)
- Linke Seite x ∈ [−12, 0], rechte x ∈ [0, 12]; Tiefe z ∈ [−4.25, 4.25] (**+z = zum Betrachter**, vorn), y nach oben. Falz bei x = 0.
- Kulissenebenen (Z-Staffelung, von hinten): Himmelswand z ≈ −4.05, Fernband −3.2, Nahband −2.25, Tiere/Pflanzen z −2 … +2.6, Laschen/Schieber vorn z ≈ 3.3 … 3.7.
- **Höhen**: Kulissenwand ≤ 5.0, alles andere ≤ 5.5 (die Kamera sieht ca. 5.3 über dem Falz am hinteren Rand; Höheres wird oben abgeschnitten).
  Die Doppelseite ist 24 breit: Gesamtkomposition auf **beide** Seiten verteilen; der Falz (x=0) ist ein V-Knick, nichts Wichtiges genau darauf.
- Linke Seite: gedruckte Textkarte (`textCard`, siehe p1.js `base().L.draw`, ca. x −11.5…−5.6, z −0.1…3.95) – davor/darauf dürfen keine hohen Pop-ups stehen.
  Der Text kommt aus `PAGES_DE[i]` (= `page` in `src/data/sN.de.js`) (`kicker, title, years, card`). Die Karte passt ihre Schrift automatisch an.
- Seitenzahlen: linke Seite `2*i+1`, rechte `2*i+2` (`pageNo` in `base()`).
- Farbwelt: Terrakotta, Ocker, Purpur, Gold, Marmorweiß, Mittelmeerblau; jede Station hat ihre eigene Leitfarbe (siehe `docs/KAPITEL.md`). Kulissen mit welliger Oberkante, mehrere Ebenen, Papier-Look.

## Seiten-Definition (default export von `src/pages/pN.js`)
```js
export default {
  id: 'jura-wald',                         // = PAGES_DE[i].id (wird für Atmo/Ton verwendet)
  mood: mood({key,keyI,sky,gnd,hemiI,pos,rim}),   // Lichtstimmung (aus ../engine/scene.js), weich überblendet
  motes: { colors:[[r,g,b]..], size, alpha, dx, dy, dz, tw, density },  // schwebende Körnchen, oder null
  atmo: 'jura-wald',                       // Atmosphäre-ID für audio.setScene (=id)
  base() { return { L:{ground:{back,front}, margin, pageNo, seed, draw(ctx,m){…}}, R:{…} }; },   // bemalte Seitenflächen (Canvas, m = Karte x/z→Pixel)
  *build(ctx) { …; yield; … },             // Generator: nach jedem größeren Block `yield;` (bildweise Erstellung, kein Ruckeln)
  onActivate(ctx,now){}, onDeactivate(ctx){}, update(dt,t,ctx){}, dispose(ctx){}   // optional
};
```
Ersetze nur DEINE Datei(en); `src/pages/index.js` importiert bereits `./p2.js … ./p8.js` (Platzhalter, die du überschreibst).

## SpreadCtx (`ctx`) – Bausteine
- `ctx.stand(id, {x,z,len|h,facing,delay,lean,card,hint,hidden,hitPad,variant,name,y,ox})` → **Actor** (antippbares Tier; `card` = Karten-ID aus `ANIMALS_DE`, `null` = keine Karte).
  Actor: `.popup` (Popup), `.fig` (Figure), `.tw` (Tweens: `a.tw.add(dur, (k)=>{…}, {delay, ease, done})`), `.behaviors[]` (`(dt,t,actor)=>…` pro Frame),
  `.onWake = (a)=>{…}` (beim Antippen), `.hop` (Hüpfhöhe in y, wird pro Frame angewandt), `.setFacing(±1)`, `.dir`, `.wake()`.
  `len` = Länge des Tiers in WELT-Einheiten (1 Einheit ≈ 1 m nur grob: Tiere werden bewusst unmaßstäblich groß/klein skaliert, damit alles lesbar ist; Größenvergleich steht auf der Karte).
  Sehr kleine Dinge bekommen `len` ≈ 0.9–1.2, damit man sie antippen kann.
- `ctx.prop(id, {x,z,y,len|h,facing,delay,lean,yaw,variant,cast,border,ox})` → Popup (Kulisse aus der Registry: Pflanzen, Felsen, Sonne … siehe unten), `pop.fig`.
- `ctx.flat(partSpec, {x,z,y,ws,delay,lean,yaw,thickness,border,ppu,name,receive,maxTex})` → Popup mit selbst gemachter Papierform (`panelPart(...)` aus `pages/common.js` = Kulissenstreifen mit welliger Kante; oder eigener `{layers:[{shapes,fill,deco(c,bb),stroke}]}`).
  `ctx.cross(part,o)` = zwei gekreuzte Flats (Pseudo-Volumen: Vulkan, Felsen).
- `ctx.control('L'|'R', {id,label,a:[x,z],b:[x,z],size:[w,h],color,value,snaps,springBack,ticks,hold})` → **Control** (Zug-Lasche / Schieber entlang a→b).
  `.sp.x` = aktueller (gefederter) Wert 0..1, `.v` Zielwert, `.on((v)=>…)` bei jeder Änderung, `.onTick(v)` alle ~3.5 %, `.onGrab`, `.onRelease(v)`, `.onSnap(v)`, `.setValue(v,{silent,snap})`, `.dragging`, `.touched`.
  `springBack:true` = springt zurück (Lasche „RENN!“-Stil), `hold:true` = bleibt stehen, `snaps:[0,.5,1]` = rastet ein (Stufenschieber).
  Beschriftung: kurz, deutsch (z. B. „RENN!“, „Halslänge“). Controls liegen vorn (z ≈ 3.3–3.7).
- `ctx.onUpdate((dt,t,spread)=>…)` pro Frame; `ctx.addTo('L'|'R', object3D)`; `ctx.L`/`ctx.R` = PageSide (`.add(obj)`, `.addTap(mesh, fn)`, `.onUpdate(fn)`, `.popups`, `.actors`, `.controls`); `ctx.world(x,y,z)` Seitenrahmen→Welt (für Partikel).
- Tippbare Nicht-Tiere: `mesh.userData.tap = fn; side.taps.push({mesh})` bzw. `side.addTap(mesh, fn)`; für Pop-ups `popup.pickMeshes=[mesh]` + `mesh.userData.tap`. Hit-Tests laufen nur gegen diese Listen (Raycaster ignoriert `visible`!).
- **Popup** (`pop`): `.group.position`, `.pivot`, `.eff` (0..1 Aufrichtgrad), `.always`, `.onPop`, `.add(obj3D)` hängt etwas ins Pop-up. Pop-ups richten sich gestaffelt (back→front) mit Feder und leichtem Überschwingen auf, wenn die Seite landet, und falten flach beim Umblättern (Seite verwaltet das selbst).
- **Figuren posieren**: `import { poseAmt } from '../engine/popup.js'` → `poseAmt(fig, 'jaw', 0..1)` (interpoliert `meta.ranges[part]=[ruhe,max]`), oder direkt `fig.rotatePart('legA', rad)`; Lauf-/Flügelbereiche in `fig.meta.swing`/`fig.meta.flap` (`[min,max]` rad, siehe `docs`-Tabelle unten). Tierlisten mit Teilen/Ranges: `node tools/art-dump.mjs`.
- **Partikel**: `app.fx.dust.emit({x,y,z,vx,vy,vz,life,size,alpha,color:[r,g,b],drag,grav,grow})` (normale Mischung: Staub, Splitter, Spritzer, Rauch), `app.fx.glow` (additiv: Glut, Funken, Leuchten). `burst(n, base, {speed,h,up,px,py,pz})`. Weltposition: `ctx.world(x,y,z)`. Größe `size` = Durchmesser in Welt-Einheiten. Maximal ein paar Hundert Partikel gleichzeitig; Rate an `app.stage.tier.fx` (1 / 0.7 / 0.4) und `app.calm` koppeln.
- `app.openCardById(id, worldX)` öffnet eine Info-Karte; `app.cam.shake(amp, dur)` (Ruhiger Modus dämpft selbst); `app.calm` (bool); `app.stage.tier.fx`; `app.q` {ppu,maxTex,pageTex}; `app.t` Sekunden.
- **Ton** (Klangmaschine kommt parallel, Stub macht erst nichts; Aufrufe sind immer erlaubt): `app.audio.sfx(name, opts)`, `app.audio.voice(tierId)`,
  `app.audio.ctl(name, wert)` (kontinuierliche Parameter: `'underwater'` 0..1, `'tension'` 0..1, `'timeLapse'` 0..1, `'hush'` 0..1 …), `app.audio.silence(sek)`.
  Vereinbarte **SFX-Namen**: `turn lift land grab snap card found tick gong slide flapOpen flapClose pop footstep stomp swing flap splash bubble dive wave chomp crack splinter peep hatch whoosh rumble impact thud chime grow rustle horn tapp fossil woodcrack ping musicbox tinnitus tweet`. Unbekannte Namen werden still ignoriert; nutze bevorzugt diese.
  Kontinuierliche Laschen: `control.onTick = (v)=>app.audio.sfx('slide',{v})`; `onGrab → 'grab'`, `onRelease/onSnap → 'snap'`.

## Registry-Bausteine (`ctx.prop` / `ctx.stand`, IDs) – Römer-Buch
Alles, was `ctx.stand`/`ctx.prop` kennt, steht in `src/art/registry.js` (`ANIMALS[id](opts)` liefert eine Spec). Quellen:
- `src/art/reg_rom.js` (gemeinsam, NICHT ändern): Personen `p_buerger p_buergerin p_kind p_legionaer p_zenturio p_aquilifer p_senator p_kaiser p_haendler p_handwerker p_germane` (aus `rom/_people.js`, `person({…})`), Gänse `gans1 … gans8`, `human`.
- `src/art/reg_e.js` (generische Kulisse): `conifer_round palm grass_tuft bush reeds mesa_red cliff_layers boulder rock_pillar island_rock cloud_a cloud_b sun_disc wave_strip`.
- `src/art/reg_sN.js` (DEINE Station): trage dort eigene Figuren/Gebäude ein (`export default { id: (o)=>spec }`).
Eigene Bausteine: neue Datei `src/art/rom/sN_*.js` (Specs mit DSL) oder `ctx.flat(...)` mit eigenem Part. **Nicht** `dsl.js/paint.js/engine/*` und die gemeinsamen Kits ändern; Hilfsfunktionen, die du brauchst, schreibst du in deine eigene Datei.
Gebäude: `rom/_arch.js` (archWall, columnPoly, pediment, brickwork, ashlar, marbleVeins, roofTiles, plaster, woodGrain).

## Karten und die versteckte Gans
- Jede antippbare Figur braucht eine Karte in DEINER `src/data/sN.de.js` (`export const cards = { id: {…} }`); Format siehe Kopf dieser Datei. Antippbar ohne Karte: `card: null`.
- Die Gans deiner Station: Karte `gansN` (N = Stationsnummer) mit `hidden: true` in `cards`, Figur `ctx.stand('gansN', { hidden: true, hint: false, hitPad: 0.2, len: ~0.9, card: 'gansN', … })` an dem Ort aus der Kapitelübersicht (`docs/KAPITEL.md`, „Such die Gans“). Antippen löst Zähler und Karte automatisch aus. Schwer, aber fair: ein Stück Hals/Schnabel/Hut muss sichtbar sein.

## Mechanik-Muster (siehe p1.js)
- Lasche mit Wirkung: `ctl.on(v => …)` schreibt Positionen/Posen aus `v` (kein Zustand außer `v` → rückwärts zurückspulbar).
- Laufen: Position aus `v` ableiten, Beine über `Math.sin(distanz*k)` swingen, `a.hop` als Auf-und-ab, Staub bei Bewegung.
- Fäden/Drähte (Pteranodon): `THREE.Line`/dünne Plane vom Tier zu einem Punkt am Rand der Seite oder der Kulisse, Länge/Winkel aus `v`.
- Klappen: `paperCard(w,h,texTop,texBottom)` (p1.js, Pangaea) oder eigenes `THREE.Group` an einer Scharnierachse; Tippen schaltet `target`, Update federt `open`.
- Wellen: mehrere `wave_strip`-Props/`panelPart`-Streifen mit gegeneinander verschobener Phase (`onUpdate`: `position.x = base + sin(t*…)`).
- Alles muss beim Zurückspringen von Lasche/Schieber konsistent sein; beim Verlassen der Seite (`onDeactivate`) Zustände zurücksetzen (Klappen schließen, Partikel aus).
- Immer Ruhigen Modus beachten (`app.calm`: weniger Wackeln/Blitze/Partikel). **Kein Blitz > 150 ms, höchstens 3 Hz.**

## Qualität und Budget
- Pro Doppelseite ≲ 45 Popups/Flats; Texturgrößen über `ppu`/`maxTex` begrenzen (Kulissenstreifen `ppu: 70`, Figuren automatisch). Keine Allokationen pro Frame (Vektoren wiederverwenden). Keine neuen Dateien als Medien (alles aus Code), keine externen Anfragen.
- Text auf Seiten/Lasche: kurz, deutsch, kindgerecht. Längere Erklärungen gehören in `src/data/*.de.js`, nicht in die Seitendatei.
- Tabu: kein Blut, keine Kampfszenen, keine KI-Bilder, keine Cookies/Tracking; weitere Tabus je Station in `docs/KAPITEL.md`.

## Testen (Software-WebGL, ~3 Bilder/s, daher `?tier=low` und kleine Fenster)
```
node build.mjs --main --dev --out=/tmp/claude-0/<dein-ordner>/index.html          # eigener Build, überschreibt NICHT dist/
BOOK_HTML=/tmp/claude-0/<dein-ordner>/index.html OUT_DIR=/tmp/claude-0/<dein-ordner> node tools/shot.mjs <name> <station> 1280 720 6 [az el zoom]
```
`shot.mjs` springt per `snapTo(station)` auf die Seite, wartet `simSeconds` Simulationszeit, speichert `<OUT_DIR>/<name>.png` und druckt Konsolenfehler/-warnungen.
`EVAL='…'` führt vorher JS aus (mit `a = window.__app`), z. B. `EVAL="a.spreads.current.R.controls[0].setValue(0.6,{snap:true}); await new Promise(r=>setTimeout(r,500))"`.
Kamera: `az`(−0.75…0.75) `el`(0.4…1.35) `zoom`. Schau dir jeden Screenshot mit dem Read-Tool an (Leseansicht + zwei Orbit-Winkel, z. B. `0.55 0.7` und `-0.5 1.1`), iteriere, bis es hübsch UND sauber ist (nichts ragt durch Seite/Falz, nichts schwebt, Schatten stimmen, nichts über den oberen Rand).
Eigene Mini-Tests per Playwright: siehe `tools/t3.mjs` (Control ziehen, Tier antippen, Seite blättern).
`build.mjs` schreibt außerdem `src/data/narration.generated.js` neu (harmlos).
`app.goTo(station|-1)` blättert (−1 = Buch schließen), `app.found` (Set der gefundenen Gänse-IDs), `app.snapTo(s)` (nur Tests).
Bei Fehlern in der Engine: kleine, rückwärtskompatible Korrekturen sind erlaubt (mit `Edit`, nie ganze Dateien neu schreiben – andere arbeiten parallel in anderen Dateien), im Abschlussbericht nennen.
