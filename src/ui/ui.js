// DOM overlay: brand, tools, nav pill, hint, captions, info cards, help dialog, loading screen.
import { ANIMALS } from '../art/registry.js';
import { silhouettePolys, fillPolys } from '../engine/pagepaint.js';
import { specBBox } from '../engine/popup.js';

const SVG = {
  eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/></svg>',
  sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5v5h4l5 4v-13l-5 4H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5v5h4l5 4v-13l-5 4H3z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  move: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="8.5" y="8.5" width="7" height="7" rx="1.2" fill="currentColor"/></svg>',
  help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 115 1.9c-.9.9-2.2 1.3-2.2 2.9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.2" fill="currentColor"/></svg>',
  left: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  right: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  speak: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 9.5v5h4l5 4v-13l-5 4H3z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 010 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  stop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>',
  goose: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 20c0-4 2-6 5-6.5-1.8-1.4-2-4.2-.6-6C11 5.600 14 5.600 15 8c.3.800.2 1.500-.2 2.200L20 11l-3.200 1.600c0 2.600-1.600 4.800-4.300 5.600V20h-2v-1.500c-.6 0-1.300-.1-2-.3V20z" fill="currentColor"/><circle cx="12.600" cy="7.600" r=".9" fill="#fff"/></svg>',
  wx_clear: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.2" fill="currentColor"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  wx_rain: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14.5a4 4 0 01-.4-7.98 5.6 5.6 0 0110.7 1.4A3.3 3.3 0 0117 14.5z" fill="currentColor"/><path d="M8 17.5l-1.2 3M12.5 17.5l-1.2 3M17 17.5l-1.2 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  wx_storm: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 14a4 4 0 01-.4-7.98 5.6 5.6 0 0110.7 1.4A3.3 3.3 0 0117 14z" fill="currentColor"/><path d="M13.2 13.2l-3 4.6h3.2l-1.9 4.2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  wx_mist: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12.5a4 4 0 01-.4-7.98 5.6 5.6 0 0110.7 1.4A3.3 3.3 0 0117 12.5z" fill="currentColor"/><path d="M3.5 16h17M6 19.5h12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5c3-1 6-1 9 1 3-2 6-2 9-1v14c-3-1-6-1-9 1-3-2-6-2-9-1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6v14" stroke="currentColor" stroke-width="2"/></svg>',
};
export { SVG };

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

export class UI {
  constructor(root, handlers) {
    this.root = root; this.h = handlers; this.cardOpen = false;
    root.innerHTML = '';
    // brand
    this.brand = el('div', 'brand', '<span class="brand-ico">' + SVG.book + '</span><span>Das große Popup-Buch vom Römischen Reich</span>');
    // tools
    this.tools = el('div', 'tools');
    this.btnWeather = this.mkBtn('Wetter ändern (jetzt: klar)', SVG.wx_clear, () => handlers.weather && handlers.weather(), 'round');
    this.btnPan = this.mkBtn('Buch verschieben (Hand): mit einem Finger ziehen', SVG.move, () => handlers.pan && handlers.pan(), 'round');
    this.btnReset = this.mkBtn('Ansicht zurücksetzen', SVG.home, () => handlers.resetView && handlers.resetView(), 'round');
    this.btnReset.style.display = 'none';
    this.btnView = this.mkBtn('Leseansicht', SVG.eye, () => handlers.view(), 'round');
    this.btnSound = this.mkBtn('Ton an oder aus', SVG.sound, () => handlers.sound(), 'round');
    this.btnHelp = this.mkBtn('Hilfe: So liest man dieses Buch', SVG.help, () => this.openHelp(), 'round');
    this.tools.append(this.btnReset, this.btnPan, this.btnWeather, this.btnView, this.btnSound, this.btnHelp);
    // era header (top centre)
    this.header = el('div', 'era'); this.header.setAttribute('aria-live', 'polite');
    // found counter
    this.found = el('div', 'found', SVG.goose + '<span class="fc">0/8</span>'); this.found.title = 'Gefundene Gänse'; this.found.setAttribute('role', 'button'); this.found.tabIndex = 0;
    this.found.setAttribute('aria-label', 'Gänse gefunden: 0 von 8'); this.found.style.display = 'none';
    this.found.addEventListener('click', () => handlers.album && handlers.album());
    this.found.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlers.album && handlers.album(); } });
    // caption
    this.caption = el('div', 'caption'); this.caption.setAttribute('aria-live', 'polite'); this.caption.style.display = 'none';
    // hint
    this.hint = el('div', 'hint');
    // nav
    this.nav = el('nav', 'nav'); this.nav.setAttribute('aria-label', 'Seitennavigation');
    this.btnPrev = this.mkBtn('Vorherige Seite', SVG.left, () => handlers.prev(), 'navbtn');
    this.btnNext = this.mkBtn('Nächste Seite', SVG.right, () => handlers.next(), 'navbtn');
    this.dots = el('div', 'dots');
    this.btnSpeak = this.mkBtn('Seiteneinführung vorlesen', SVG.speak + '<span>Vorlesen</span>', () => handlers.narrate(), 'speakbtn');
    this.nav.append(this.btnPrev, this.dots, this.btnNext);
    this.navWrap = el('div', 'navwrap'); this.navWrap.append(this.btnSpeak, this.nav);
    // card + help + loading + toast
    this.card = el('div', 'card'); this.card.setAttribute('role', 'dialog'); this.card.setAttribute('aria-modal', 'false'); this.card.style.display = 'none';
    this.help = el('div', 'help'); this.help.style.display = 'none'; this.help.setAttribute('role', 'dialog'); this.help.setAttribute('aria-modal', 'true'); this.help.setAttribute('aria-label', 'So liest man dieses Buch');
    this.toast = el('div', 'toast'); this.toast.style.display = 'none';
    this.loading = el('div', 'loading', '<div class="ld-book">' + SVG.book + '</div><div class="ld-title">Das große Popup-Buch vom Römischen Reich</div><div class="ld-text">Das Buch wird gefaltet …</div><div class="ld-bar"><i></i></div>');
    root.append(this.brand, this.header, this.tools, this.found, this.caption, this.hint, this.navWrap, this.card, this.help, this.toast, this.loading);
    this.buildHelp();
    addEventListener('keydown', (e) => this.onKey(e));
  }

  mkBtn(label, svg, fn, cls) {
    const b = el('button', cls, svg); b.type = 'button'; b.setAttribute('aria-label', label); b.title = label;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(e); });
    b.addEventListener('pointerdown', (e) => e.stopPropagation());
    return b;
  }

  onKey(e) {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    if (e.key === 'Escape') { if (this.helpOpen) this.closeHelp(); else if (this.cardOpen) this.closeCard(); return; }
    if (this.helpOpen) return;
    if (e.key === 'ArrowRight') { this.h.next(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { this.h.prev(); e.preventDefault(); }
    else if (e.key === 'r' || e.key === 'R') this.h.view();
    else if (e.key === 'm' || e.key === 'M') this.h.sound();
    else if (e.key === 'w' || e.key === 'W') this.h.weather && this.h.weather();
    else if (e.key === 'v' || e.key === 'V') this.h.pan && this.h.pan();
    else if (e.key === '0') this.h.resetView && this.h.resetView();
    else if (e.key === '?' || e.key === 'h' || e.key === 'H') this.openHelp();
  }

  // ----- loading
  setLoading(p, text) { const i = this.loading.querySelector('.ld-bar i'); i.style.width = Math.round(p * 100) + '%'; if (text) this.loading.querySelector('.ld-text').textContent = text; }
  hideLoading() { this.loading.classList.add('done'); setTimeout(() => { this.loading.style.display = 'none'; }, 900); }

  // ----- nav
  setStops(stops) {
    this.stops = stops; this.dots.innerHTML = '';
    stops.forEach((s, i) => {
      const b = el('button', 'dot'); b.type = 'button'; b.style.setProperty('--c', s.color);
      b.setAttribute('aria-label', `${i === 0 ? 'Titelseite und Meilenstein' : 'Seite ' + i + ': ' + s.name}`);
      b.innerHTML = `<i></i><span class="tip">${s.name}</span>`;
      b.addEventListener('click', (e) => { e.stopPropagation(); this.h.go(i); });
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      this.dots.appendChild(b);
    });
  }
  setActive(i, closed = false) {
    [...this.dots.children].forEach((d, k) => { d.classList.toggle('on', k === i && !closed); if (k === i && !closed) d.setAttribute('aria-current', 'page'); else d.removeAttribute('aria-current'); });
    this.btnPrev.disabled = false; this.btnNext.disabled = i >= this.stops.length - 1 && !closed ? true : false;
    this.btnPrev.classList.toggle('dim', closed);
  }
  setHeader(era, years, color) {
    this.header.innerHTML = era ? `<b>${era}</b><span>${years || ''}</span>` : '';
    if (color) this.header.style.setProperty('--c', color);
    this.header.classList.toggle('off', !era);
  }
  setWeather(mode, label) {
    this.btnWeather.innerHTML = SVG['wx_' + mode] || SVG.wx_clear;
    const t = 'Wetter ändern (jetzt: ' + (label || 'Klar').toLowerCase() + ')';
    this.btnWeather.setAttribute('aria-label', t); this.btnWeather.title = t;
    this.btnWeather.classList.toggle('on', mode !== 'clear');
  }
  setViewDirty(on) { this.btnReset.style.display = on ? '' : 'none'; }
  setHint(t) { this.hint.textContent = t || ''; this.hint.classList.toggle('off', !t); }
  setSound(on) { this.btnSound.innerHTML = on ? SVG.sound : SVG.mute; this.btnSound.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  setSpeaking(on) { this.btnSpeak.classList.toggle('on', on); this.btnSpeak.innerHTML = (on ? SVG.stop : SVG.speak) + '<span>' + (on ? 'Stopp' : 'Vorlesen') + '</span>'; }
  showCaption(text) { if (!text) { this.caption.style.display = 'none'; return; } this.caption.textContent = text; this.caption.style.display = 'block'; }
  setFound(n, total) { this.found.style.display = 'flex'; this.found.querySelector('.fc').textContent = `${n}/${total}`; this.found.setAttribute('aria-label', `Gänse gefunden: ${n} von ${total}`); this.found.classList.add('bump'); setTimeout(() => this.found.classList.remove('bump'), 700); }
  showToast(t, ms = 2600) { this.toast.textContent = t; this.toast.style.display = 'block'; this.toast.classList.remove('in'); void this.toast.offsetWidth; this.toast.classList.add('in'); clearTimeout(this._tt); this._tt = setTimeout(() => { this.toast.style.display = 'none'; }, ms); }

  // ----- info card
  // d: {name, sci, say, meaning, when, period, length, mass, diet, where, wow, text, note, specId, sizeM, hidden, found}
  showCard(d, opts = {}) {
    const c = this.card; c.className = 'card' + (d.hidden ? ' hidden-card' : '') + (opts.side ? ' side-' + opts.side : '');
    const fact = (k, v) => v ? `<div class="fact"><b>${k}</b><span>${v}</span></div>` : '';
    c.innerHTML = `
      <button class="x" aria-label="Karte schließen">${SVG.close}</button>
      ${d.hidden ? '<div class="ribbon">' + (d.ribbon || 'Gefunden! Eine versteckte Gans') + '</div>' : ''}
      <div class="head">
        <canvas class="cmp" width="320" height="170" aria-hidden="true"></canvas>
        <div class="names">
          <h2>${d.name}</h2>
          ${d.sci ? `<div class="sci">${d.sci}</div>` : ''}
          ${d.say ? `<div class="say">${d.say}</div>` : ''}
          ${d.meaning ? `<div class="mean">${d.meaning}</div>` : ''}
        </div>
      </div>
      <div class="facts">
        ${(d.facts || []).map((f) => fact(f[0], f[1])).join('')}
      </div>
      ${d.latin ? `<div class="latin"><b>Wort aus Rom</b> <i>${d.latin.w}</i> → ${d.latin.de}${d.latin.note ? '<span>' + d.latin.note + '</span>' : ''}</div>` : ''}
      ${d.wow ? `<div class="wow"><b>Wow!</b> ${d.wow}</div>` : ''}
      ${d.text ? `<p class="body">${d.text}</p>` : ''}
      ${d.note ? `<p class="note">${d.note}</p>` : ''}
      ${d.extra || ''}
      <div class="foot">
        ${opts.speakId !== false ? `<button class="read" type="button">${SVG.speak}<span>Vorlesen</span></button>` : ''}
        <button class="ok" type="button">Weiter</button>
      </div>`;
    c.style.display = 'block'; c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
    this.cardOpen = true;
    c.querySelector('.x').addEventListener('click', () => this.closeCard());
    c.querySelector('.ok').addEventListener('click', () => this.closeCard());
    const rd = c.querySelector('.read'); if (rd) rd.addEventListener('click', () => this.h.readCard && this.h.readCard(d));
    c.querySelector('.x').focus({ preventScroll: true });
    if (d.specId) this.drawCompare(c.querySelector('canvas.cmp'), d);
    else c.querySelector('canvas.cmp').style.display = 'none';
    this.h.cardOpened && this.h.cardOpened(d);
  }
  closeCard() { if (!this.cardOpen) return; this.card.classList.remove('in'); this.card.style.display = 'none'; this.cardOpen = false; this.h.cardClosed && this.h.cardClosed(); }

  // silhouette next to a 1.75 m person, true scale (length of the animal along x, height as drawn)
  drawCompare(cv, d) {
    const g = cv.getContext('2d'); g.clearRect(0, 0, cv.width, cv.height);
    const mk = ANIMALS[d.specId]; if (!mk) return;
    const spec = mk(d.variant); const bb = specBBox(spec);
    const hum = ANIMALS.human(); const hb = specBBox(hum);
    const realLen = d.sizeM || (spec.meta && spec.meta.lengthM) || bb.w;
    const k = d.sizeH ? d.sizeH / bb.h : realLen / bb.w; // model-meter scale factor so the animal has its real size
    const aw = bb.w * k, ah = bb.h * k, hw = hb.w, hh = hb.h;
    const pad = 14, floor = cv.height - 20;
    const totalW = hw + 0.25 + aw, totalH = Math.max(ah, hh);
    const sc = Math.min((cv.width - pad * 2) / totalW, (floor - pad) / totalH);
    // ground
    g.strokeStyle = 'rgba(80,50,20,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(pad / 2, floor + 1); g.lineTo(cv.width - pad / 2, floor + 1); g.stroke();
    const draw = (spc, bbx, kk, ox, fillTop, fillBot) => {
      const polys = silhouettePolys(spc);
      const tf = (x, y) => [ox + (x - bbx.x0) * kk * sc, floor - (y - bbx.y0) * kk * sc];
      const gr = g.createLinearGradient(0, floor - bbx.h * kk * sc, 0, floor); gr.addColorStop(0, fillTop); gr.addColorStop(1, fillBot);
      fillPolys(g, polys, tf); g.fillStyle = gr; g.fill('nonzero'); g.strokeStyle = 'rgba(60,30,10,.6)'; g.lineWidth = 1.2; g.stroke();
    };
    const x0 = (cv.width - totalW * sc) / 2;
    draw(hum, hb, 1, x0, '#c46a52', '#4c6aa0');
    draw(spec, bb, k, x0 + (hw + 0.25) * sc, '#b8793d', '#6b3d1f');
    g.fillStyle = '#6b4a2a'; g.font = 'bold 12px Georgia,serif'; g.textAlign = 'left';
    g.fillText('Mensch 1,75 m', x0, 13);
  }

  // ----- help
  buildHelp() {
    const h = this.help;
    h.innerHTML = `<div class="help-in">
      <button class="x" aria-label="Hilfe schließen">${SVG.close}</button>
      <h2>So liest man dieses Buch</h2>
      <ul>
        <li><b>Umblättern:</b> Fass die Seite einfach an und zieh sie zur Seite, wie bei einem echten Buch. Oder zieh an der umgeknickten Ecke, tippe auf die Pfeile oder auf die Punkte. Tasten ← und →.</li>
        <li><b>Laschen und Schieber:</b> Greif die bunten Laschen und zieh sie. Manche springen zurück, manche bleiben stehen.</li>
        <li><b>Antippen:</b> Figuren, Gebäude und Dinge erzählen dir etwas auf einer Info-Karte. Mit dem Lautsprecher-Knopf liest sie dir jemand vor.</li>
        <li><b>Zeitfenster:</b> Auf der Titelseite zeigt ein frei auf dem Tisch schwebendes Bild neben dem Buch, was im Römischen Reich zum Jahr des Zeitrads los war. Mit den Pfeilen oder den Punkten springst du zur nächsten Szene. Auf dem iPad blendet ein Tipp aufs Bild den Text ein.</li>
        <li><b>Lesen und Umschauen:</b> Mit zwei Fingern kannst du das Buch verschieben und zoomen, um Texte groß zu lesen (Maus: Mausrad zoomt, Umschalt-Taste oder rechte Maustaste beim Ziehen verschiebt). Der Hand-Knopf (Taste <kbd>V</kbd>) lässt dich schon mit einem Finger verschieben. Zieh auf dem Tisch neben dem Buch, dann dreht sich die Kamera. Der Knopf mit den Ecken (Taste <kbd>0</kbd>) setzt die Ansicht zurück, das Auge (<kbd>R</kbd>) zeigt das Buch von oben.</li>
        <li><b>Wetter:</b> Der Wolken-Knopf oder die Taste <kbd>W</kbd> lässt es regnen, stürmen oder dunsten.</li>
        <li><b>Ton:</b> Taste <kbd>M</kbd> oder der Lautsprecher schaltet um.</li>
        <li><b>Karte schließen:</b> X, <kbd>Esc</kbd> oder neben die Karte tippen.</li>
        <li><b>Such die Gans!</b> Auf jeder Doppelseite versteckt sich eine kleine Gans. Wer alle acht findet, bekommt eine Überraschung.</li>
      </ul>
      <div class="opts">
        <label>Lautstärke <input id="vol" type="range" min="0" max="100" value="60" aria-label="Lautstärke"></label>
        <label class="chk"><input id="calm" type="checkbox"> Ruhiger Modus (weniger Wackeln und Blitze)</label>
        <label class="chk"><input id="cine" type="checkbox"> Kräftigere Klänge (Signalhörner, Trommeln)</label>
        <label class="chk"><input id="auto" type="checkbox" checked> Jede Seite am Anfang kurz vorlesen</label>
        <label class="chk"><input id="cap" type="checkbox" checked> Vorgelesenen Text als Untertitel zeigen</label>
      </div>
      <p class="last">Jede Seite, jede Falte, jede Figur, jede Textur und jeder Ton in diesem Buch ist aus Code gemacht. Die Musik ist erfunden: Wie römische Musik wirklich klang, wissen wir kaum.</p>
      <button class="ok" type="button">Los geht's</button>
    </div>`;
    h.querySelector('.x').addEventListener('click', () => this.closeHelp());
    h.querySelector('.ok').addEventListener('click', () => this.closeHelp());
    h.addEventListener('pointerdown', (e) => { if (e.target === h) this.closeHelp(); });
    h.querySelector('#vol').addEventListener('input', (e) => this.h.volume && this.h.volume(+e.target.value / 100));
    h.querySelector('#calm').addEventListener('change', (e) => this.h.calm && this.h.calm(e.target.checked));
    h.querySelector('#cine').addEventListener('change', (e) => this.h.cine && this.h.cine(e.target.checked));
    h.querySelector('#cap').addEventListener('change', (e) => this.h.captions && this.h.captions(e.target.checked));
    h.querySelector('#auto').addEventListener('change', (e) => this.h.auto && this.h.auto(e.target.checked));
  }
  openHelp() { this.help.style.display = 'flex'; this.helpOpen = true; this.help.querySelector('.ok').focus({ preventScroll: true }); this.h.helpOpened && this.h.helpOpened(); }
  closeHelp() { this.help.style.display = 'none'; this.helpOpen = false; }
}
