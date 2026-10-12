#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
make-narration.py  --  Erzaehlstimme fuer "Das grosse Dinosaurier-Popup-Buch"
=========================================================================

Offline-Neuro-TTS: Piper "de_DE-thorsten-medium" (Thorsten Mueller, CC0) ueber
das pip-Paket `sherpa-onnx`.  Eingabe: assets/narration/_items.json
([{id, kind, text}]).  Ausgabe pro id: assets/narration/<id>.mp3, dazu
  assets/narration/_manifest.json   {id: {seconds, bytes}}
  assets/narration/_sentences.json  {id: [{text, start, end}]}  (Satzzeiten in s,
                                    fuer die satzweise Untertitel-Zeitung)
  assets/narration/_qa.json         (nur nach --check)

Aufruf (aus dem Projektordner):
  python3 tools/make-narration.py                  # alles erzeugen
  python3 tools/make-narration.py --only a,b       # einzelne Clips
  python3 tools/make-narration.py --check          # Qualitaetspruefung der MP3s
  python3 tools/make-narration.py --asr [--only ..]# Stichprobe per Whisper-small
  python3 tools/make-narration.py --ipa Wort ...   # espeak-IPA fuer Aussprache-Tests
  Optionen: --kbps 32 (CBR), --force (Satz-Cache ignorieren)

Abhaengigkeiten:  pip install --break-system-packages sherpa-onnx numpy scipy
                  ffmpeg (libmp3lame) im PATH
                  optional fuer --ipa:  espeakng-loader phonemizer
Modelle werden bei Bedarf nach $TTS_WORK (Standard /tmp/claude-0/tts_work) geladen
(GitHub-Releases von k2-fsa/sherpa-onnx; huggingface.co ist hier gesperrt).

Verfahren: Text -> Saetze -> Normalisierung (Zahlen, Klammern, Ersetzungstabelle)
-> Satz fuer Satz synthetisieren (Cache) -> Stille je Satz trimmen -> mit Pausen
zusammensetzen (0,12 s Luft vorn/hinten, 30 ms Ein-/Ausblendung) -> Lautheit auf
-19 LUFS (ffmpeg ebur128), Spitzen-Limit -3 dBFS -> MP3 mono 22 050 Hz CBR.

Hinweis: Die Rauschkomponente von VITS ist zufaellig.  Reproduzierbar sind die
Ergebnisse ueber den Satz-Cache ($TTS_WORK/sent); ohne Cache klingt jeder Lauf
minimal anders (gleiche Aussprache, leicht andere Mikro-Prosodie).
"""
import argparse
import difflib
import hashlib
import json
import os
import re
import subprocess
import sys
import tarfile
import time
from pathlib import Path

import numpy as np
from scipy.ndimage import minimum_filter1d, uniform_filter1d
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parent.parent
NARR = ROOT / "assets" / "narration"
WORK = Path(os.environ.get("TTS_WORK", "/tmp/claude-0/tts_work"))

MODEL_NAME = "vits-piper-de_DE-thorsten-medium"
MODEL_URL = f"https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/{MODEL_NAME}.tar.bz2"
MODEL_DIR = WORK / "model" / MODEL_NAME
ASR_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-whisper-small.tar.bz2"
ASR_DIR = WORK / "asr" / "sherpa-onnx-whisper-small"  # wird beim Entpacken angelegt

SR = 22050
LENGTH_SCALE = 1.10      # >1 = ruhiger (Standard 1.0)
NOISE_SCALE = 0.667
NOISE_W = 0.8
TARGET_LUFS = -19.0
PEAK_CEIL_DB = -3.0
AIR = 0.12               # s Luft vorn/hinten
FADE = 0.030             # s Ein-/Ausblendung
KBPS_DEFAULT = 32

# Pausen nach einem Satz (s), nach dem Schlusszeichen
PAUSE = {".": 0.24, "!": 0.30, "?": 0.28}
PAUSE_TITLE = 0.42       # nach dem Kartentitel (1. Satz bei kind == card)
PAUSE_WOW = 0.34         # nach der Interjektion "Wau!"

# --------------------------------------------------------------------------
# Textnormalisierung
# --------------------------------------------------------------------------
# (1) Fehler in den Quelltexten, die sonst hoerbar wuerden.  Die Quelle ist
#     NICHT angefasst; bitte dort (src/data/speech.js) korrigieren, dann kann
#     der Eintrag hier entfallen.
TEXT_FIXES = [
    (r"\bEr lebte Gruppe: vor", "Die Gruppe lebte vor"),            # card_multituberculate
    (r"Millionen\s+\)", "Millionen Jahren)"),                         # card_hominiden (3x)
    (r"(Art: [\d,]+ bis [\d,]+ Millionen)$", r"\1 Jahren"),          # card_lucy (Satzende fehlt)
]

# (2) Aussprache: Respelling in deutscher Orthografie (espeak-ng "de" liest sonst
#     falsch).  Reihenfolge wichtig (laengere Muster zuerst).
PRONUNCIATION = [
    (r"\bLucy in the Sky with Diamonds\b", "Lucy in ße Skai wiss Daimonds"),
    (r"\bSpace Shuttle\b", "Speis Schattel"),
    (r"\bBeatles\b", "Bietels"),
    (r"\bPop-?[Uu]p\b", "Popp App"),           # sonst "Pohp-uhp"; Leerzeichen = Knacklaut vor "App"
    (r"\bWow\b", "Wau"),                       # sonst "wohf"
    (r"\bBabys\b", "Behbies"),                 # Auswahl B (Hoerprobe 10.10.): sonst Umschaltung ins Englische
    (r"\bBaby\b", "Behbi"),
    (r"\bCartoon\b", "Kartuhn"),
    (r"\bCousins\b", "Kusangs"),              # Auswahl D (Hoerprobe 10.10.)
    (r"\bDinosaurier", "Dino-Sau-ri-er"),     # Auswahl B: sonst Betonung auf der letzten Silbe (auch Dinosauriern, Dinosaurierzeit)
    (r"\bBaumkronen\b", "Baum-Kronen"),       # Auswahl B
    (r"\bLagune\b", "La-gune"),               # Auswahl A
    (r"\bVulkanasche\b", "Vulkan Asche"),     # Auswahl D
    (r"\bMary\b", "Märi"),
    (r"\bLeakey\b", "Liki"),
    (r"\bMaastricht\b", "Maas-tricht"),        # sonst "Maaschtricht"
    (r"\bPang(?:ä|ae)a\b", "Pann-gäa"),         # sonst fehlt das g ("Pangäa" -> "Pang-ä-a")
    (r"\bChicxulub\b", "Tschikschulub"),
    (r"\bTschad\b", "Tschatt"),               # sonst langes a ("Tschaad")
    (r"\bPakicetus\b", "Pakizetus"),
    (r"\bTriceratops\b", "Trizeratops"),
    (r"\bThagomizer\b", "Tagomaiser"),
    (r"\bSahelanthropus\b", "Sa-helantropus"), # sonst verschluckt espeak das h
    (r"\bCoelophysis\b", "Zölofüsis"),
    (r"\bRhamphorhynchus\b", "Ramforünkus"),
    (r"\bPteranodon\b", "Teranodon"),          # sonst "Pe-te-ranodon"
    (r"\bAusträlopitekus\b", "Australopitekus"),
    (r"\bKompsonathus\b", "Kompsognathus"),
    (r"\bCompsognathus\b", "Kompsognathus"),
]

_ONES = ["null", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn",
         "elf", "zwölf", "dreizehn", "vierzehn", "fünfzehn", "sechzehn", "siebzehn", "achtzehn", "neunzehn"]
_TENS = ["", "", "zwanzig", "dreißig", "vierzig", "fünfzig", "sechzig", "siebzig", "achtzig", "neunzig"]


def _lt100(n):
    if n < 20:
        return _ONES[n]
    t, o = divmod(n, 10)
    return _TENS[t] if o == 0 else _ONES[o] + "und" + _TENS[t]


def _lt1000(n):
    h, r = divmod(n, 100)
    s = ("" if h == 1 else _ONES[h]) + "hundert" if h else ""
    return s + (_lt100(r) if r else "")


def cardinal(n):
    if n == 0:
        return "null"
    if n < 1000:
        return _lt1000(n)
    if n < 1_000_000:
        th, r = divmod(n, 1000)
        return ("ein" if th == 1 else _lt1000(th)) + "tausend" + (_lt1000(r) if r else "")
    m, r = divmod(n, 1_000_000)
    return cardinal(m) + (" Million " if m == 1 else " Millionen ") + (cardinal(r) if r else "")


def year_words(n):  # 1100..1999 -> "achtzehnhunderteinundsechzig"
    h, r = divmod(n, 100)
    return _lt100(h) + "hundert" + (_lt100(r) if r else "")


def speak_numbers(s):
    """Zahlen/Uhrzeiten -> Woerter (espeak liest '22:47' und Jahreszahlen falsch)."""
    s = re.sub(r"\b(\d{1,2}):(\d{2})(?:\s*Uhr)?",
               lambda m: f"{cardinal(int(m[1]))} Uhr" + (f" {cardinal(int(m[2]))}" if int(m[2]) else ""), s)
    s = re.sub(r"\b(\d{1,3}) (\d{3})\b", lambda m: m[1] + m[2], s)          # 10 000 -> 10000
    s = re.sub(r"\b(\d+),(\d+)\b",
               lambda m: cardinal(int(m[1])) + " Komma " + " ".join(_ONES[int(d)] for d in m[2]), s)
    s = re.sub(r"\b(1[1-9]\d\d)\b", lambda m: year_words(int(m[1])), s)
    s = re.sub(r"\b\d+\b", lambda m: cardinal(int(m[0])), s)
    return s


def to_spoken(sentence):
    s = sentence
    for pat, rep in TEXT_FIXES:
        s = re.sub(pat, rep, s)
    s = speak_numbers(s)
    s = re.sub(r"\s*\(", ", ", s)                      # Klammern -> Kommapausen
    s = re.sub(r"\)\s*(?=[A-Za-zÄÖÜäöüß])", ", ", s)
    s = s.replace(")", "")
    for pat, rep in PRONUNCIATION:
        s = re.sub(pat, rep, s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+([,.!?:;])", r"\1", s)
    s = re.sub(r",(\s*,)+", ",", s)
    if s and s[-1] not in ".!?":
        s += "."
    return s[:1].upper() + s[1:]


def split_sentences(text):
    t = re.sub(r"\s+", " ", text.strip())
    t = re.sub(r"(?<=[^.!?:\s]) (?=Wow!)", "\x00", t)      # "... Millionen Wow!" -> eigener Satz
    return [p for p in re.split(r"(?<=[.!?]) +|\x00", t) if p.strip()]


# --------------------------------------------------------------------------
# Hilfen: Download, TTS, Audio
# --------------------------------------------------------------------------
def download(url, dest):
    dest.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(8):  # der Proxy kappt grosse Transfers gelegentlich -> fortsetzen
        r = subprocess.run(["curl", "-sS", "-L", "-C", "-", "-o", str(dest), url])
        if r.returncode == 0:
            return
        time.sleep(2)
    sys.exit(f"Download fehlgeschlagen: {url}")


def ensure_archive(url, dest_dir, probe):
    if (dest_dir / probe).exists():
        return
    arc = WORK / "dl" / url.rsplit("/", 1)[1]
    print(f"[model] lade {url}", flush=True)
    download(url, arc)
    with tarfile.open(arc, "r:bz2") as tf:
        try:
            tf.extractall(dest_dir.parent, filter="data")
        except TypeError:  # Python < 3.12
            tf.extractall(dest_dir.parent)
    arc.unlink(missing_ok=True)


_tts = None


def get_tts():
    global _tts
    if _tts is None:
        ensure_archive(MODEL_URL, MODEL_DIR, "de_DE-thorsten-medium.onnx")
        import sherpa_onnx
        vits = sherpa_onnx.OfflineTtsVitsModelConfig(
            model=str(MODEL_DIR / "de_DE-thorsten-medium.onnx"),
            tokens=str(MODEL_DIR / "tokens.txt"),
            data_dir=str(MODEL_DIR / "espeak-ng-data"),
            length_scale=LENGTH_SCALE, noise_scale=NOISE_SCALE, noise_scale_w=NOISE_W)
        mc = sherpa_onnx.OfflineTtsModelConfig(vits=vits, num_threads=2, provider="cpu")
        _tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=mc, max_num_sentences=1))
        assert _tts.sample_rate == SR
    return _tts


def synth_sentence(text, force=False):
    key = hashlib.sha1(json.dumps([MODEL_NAME, LENGTH_SCALE, NOISE_SCALE, NOISE_W, text],
                                  ensure_ascii=False).encode()).hexdigest()[:20]
    f = WORK / "sent" / f"{key}.npy"
    if f.exists() and not force:
        return np.load(f)
    a = get_tts().generate(text, sid=0, speed=1.0)
    x = np.asarray(a.samples, dtype=np.float32)
    f.parent.mkdir(parents=True, exist_ok=True)
    np.save(f, x)
    return x


def trim_silence(x):
    hop = int(0.010 * SR)
    n = len(x) // hop
    if n < 3:
        return x
    fr = np.sqrt(np.mean(x[: n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12)
    # Schwelle -50 dB rel. zum lauten Sprachpegel (Stille des Modells liegt bei ca. -90 dBFS):
    # so bleiben leise Anlaute (f, h, p) und Ausklaenge erhalten
    thr = max(np.percentile(fr, 90) * 10 ** (-50 / 20), 10 ** (-75 / 20))
    idx = np.where(fr > thr)[0]
    if len(idx) == 0:
        return x
    return x[max(idx[0] - 1, 0) * hop: min((idx[-1] + 3) * hop, len(x))]


def fade(x, n_in, n_out):
    x = x.copy()
    n_in, n_out = min(n_in, len(x)), min(n_out, len(x))
    if n_in:
        x[:n_in] *= 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n_in))
    if n_out:
        x[-n_out:] *= 0.5 + 0.5 * np.cos(np.linspace(0, np.pi, n_out))
    return x


def ffmpeg_bin():
    return os.environ.get("FFMPEG", "ffmpeg")


def lufs(x):
    p = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-f", "f32le", "-ar", str(SR), "-ac", "1",
                        "-i", "pipe:0", "-af", "ebur128", "-f", "null", "-"],
                       input=x.astype("<f4").tobytes(), capture_output=True)
    err = p.stderr.decode(errors="replace")
    m = re.search(r"I:\s+(-?[\d.]+) LUFS", err[err.rfind("Summary:"):])
    return float(m[1]) if m else float("nan")


def peak_db(x):
    return 20 * np.log10(max(float(np.max(np.abs(x))), 1e-9))


def limit(x, ceil_db=PEAK_CEIL_DB, look_ms=4.0):
    c = 10 ** (ceil_db / 20)
    g = np.minimum(1.0, c / np.maximum(np.abs(x), 1e-9))
    w = int(look_ms / 1000 * SR) * 2 + 1
    g = uniform_filter1d(minimum_filter1d(g, size=w), size=w)
    return (x * g).astype(np.float32)


def normalize_loudness(x):
    y = x
    for _ in range(4):
        l = lufs(y)
        if abs(l - TARGET_LUFS) < 0.15:
            break
        y = y * 10 ** ((TARGET_LUFS - l) / 20)
        if peak_db(y) > PEAK_CEIL_DB:
            y = limit(y)
    if peak_db(y) > PEAK_CEIL_DB + 0.01:
        y = limit(y)
    return y.astype(np.float32)


def encode_mp3(x, path, kbps):
    path.parent.mkdir(parents=True, exist_ok=True)
    p = subprocess.run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1",
                        "-i", "pipe:0", "-c:a", "libmp3lame", "-b:a", f"{kbps}k", "-ar", str(SR), "-ac", "1",
                        "-fflags", "+bitexact", "-flags:a", "+bitexact", "-id3v2_version", "0", str(path)],
                       input=x.astype("<f4").tobytes(), capture_output=True)
    if p.returncode:
        sys.exit("ffmpeg: " + p.stderr.decode(errors="replace"))


def decode_mp3(path):
    p = subprocess.run([ffmpeg_bin(), "-hide_banner", "-loglevel", "error", "-i", str(path), "-f", "f32le",
                        "-ar", str(SR), "-ac", "1", "pipe:1"], capture_output=True)
    if p.returncode:
        raise RuntimeError(p.stderr.decode(errors="replace"))
    return np.frombuffer(p.stdout, dtype="<f4")


def probe_duration(path):
    p = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                       capture_output=True)
    return float(p.stdout.decode().strip())


# --------------------------------------------------------------------------
# Clip bauen
# --------------------------------------------------------------------------
hp_sos = butter(2, 60, btype="highpass", fs=SR, output="sos")


def build_clip(item, kbps, force):
    kind = item.get("kind", "")
    orig = split_sentences(item["text"])
    spoken = [to_spoken(s) for s in orig]
    parts, segs, t = [np.zeros(int(AIR * SR), dtype=np.float32)], [], AIR
    for i, sp in enumerate(spoken):
        x = trim_silence(synth_sentence(sp, force))
        x = sosfilt(hp_sos, x - np.mean(x)).astype(np.float32)
        x = fade(x, int(0.008 * SR), int(0.012 * SR))
        parts.append(x)
        segs.append({"text": orig[i], "start": round(t, 3), "end": round(t + len(x) / SR, 3)})
        t += len(x) / SR
        if i < len(spoken) - 1:
            if kind == "card" and i == 0:
                pz = PAUSE_TITLE
            elif sp == "Wau!":
                pz = PAUSE_WOW
            else:
                pz = PAUSE.get(sp[-1], 0.24)
            parts.append(np.zeros(int(pz * SR), dtype=np.float32))
            t += pz
    parts.append(np.zeros(int(AIR * SR), dtype=np.float32))
    y = np.concatenate(parts)
    y = normalize_loudness(y)
    y = fade(y, int(FADE * SR), int(FADE * SR))
    out = NARR / f"{item['id']}.mp3"
    encode_mp3(y, out, kbps)
    # Regelschleife auf die DEKODIERTE MP3: der MP3-Tiefpass nimmt ~0,5 LU weg
    for _ in range(2):
        l = lufs(decode_mp3(out))
        if abs(l - TARGET_LUFS) <= 0.2:
            break
        y = limit(y * 10 ** (min(TARGET_LUFS - l, 1.0) / 20))
        encode_mp3(y, out, kbps)
    return out, segs, spoken


def load_items():
    return json.load(open(NARR / "_items.json", encoding="utf-8"))


def select(items, only):
    if not only:
        return items
    ids = [s for s in only.split(",") if s]
    known = {i["id"] for i in items}
    bad = [i for i in ids if i not in known]
    if bad:
        sys.exit("Unbekannte ids: " + ", ".join(bad))
    return [i for i in items if i["id"] in ids]


def load_json(path):
    try:
        return json.load(open(path, encoding="utf-8"))
    except Exception:
        return {}


def cmd_make(args):
    items = load_items()
    todo = select(items, args.only)
    NARR.mkdir(parents=True, exist_ok=True)
    manifest = load_json(NARR / "_manifest.json")
    sentences = load_json(NARR / "_sentences.json")
    t0 = time.time()
    for n, it in enumerate(todo, 1):
        out, segs, _ = build_clip(it, args.kbps, args.force)
        dur = probe_duration(out)
        manifest[it["id"]] = {"seconds": round(dur, 2), "bytes": out.stat().st_size}
        sentences[it["id"]] = segs
        print(f"[{n:2d}/{len(todo)}] {it['id']:<26s} {dur:6.2f} s  {out.stat().st_size / 1024:6.1f} KB  ({len(segs)} Saetze)", flush=True)
    ids = [i["id"] for i in items]
    manifest = {k: manifest[k] for k in ids if k in manifest}
    sentences = {k: sentences[k] for k in ids if k in sentences}
    json.dump(manifest, open(NARR / "_manifest.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    json.dump(sentences, open(NARR / "_sentences.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    tot_b = sum(v["bytes"] for v in manifest.values())
    tot_s = sum(v["seconds"] for v in manifest.values())
    print(f"fertig in {time.time() - t0:.0f} s: {len(manifest)} Clips, {tot_s / 60:.1f} min, {tot_b / 1e6:.2f} MB")
    stray = sorted(p.stem for p in NARR.glob("*.mp3") if p.stem not in set(ids))
    if stray:
        print("WARNUNG: MP3 ohne Item (wird vom Build eingebettet!): " + ", ".join(stray))
    if tot_b > 5_000_000:
        print("WARNUNG: Gesamtgroesse > 5 MB -> --kbps 24 probieren")


# --------------------------------------------------------------------------
# Qualitaetspruefung
# --------------------------------------------------------------------------
def cmd_check(args):
    items = select(load_items(), args.only)
    qa, bad = {}, 0
    for it in items:
        f = NARR / f"{it['id']}.mp3"
        r = {"ok": True, "problems": []}
        if not f.exists() or f.stat().st_size < 500:
            qa[it["id"]] = {"ok": False, "problems": ["fehlt/leer"]}
            bad += 1
            continue
        try:
            x = decode_mp3(f)
        except Exception as e:
            qa[it["id"]] = {"ok": False, "problems": ["nicht dekodierbar: " + str(e)[:80]]}
            bad += 1
            continue
        words = len(it["text"].split())
        dur = len(x) / SR
        pk = peak_db(x) if len(x) else -999
        rms = float(np.sqrt(np.mean(x ** 2))) if len(x) else 0.0
        r.update(seconds=round(dur, 2), bytes=f.stat().st_size, words=words, wps=round(words / dur, 2) if dur else 0,
                 peak_dbfs=round(pk, 2), lufs=round(lufs(x), 2), clipped=int(np.sum(np.abs(x) >= 0.999)),
                 container_seconds=round(probe_duration(f), 2))
        if not np.all(np.isfinite(x)):
            r["problems"].append("NaN/Inf")
        if rms < 0.005:
            r["problems"].append("fast stumm")
        if r["clipped"] or pk > -0.5:
            r["problems"].append("Clipping")
        if not (1.4 <= r["wps"] <= 3.64):
            r["problems"].append(f"Tempo {r['wps']} Woerter/s")
        if abs(r["lufs"] - TARGET_LUFS) > 1.0:
            r["problems"].append(f"Lautheit {r['lufs']} LUFS")
        r["ok"] = not r["problems"]
        bad += not r["ok"]
        qa[it["id"]] = r
        print(f"{'OK ' if r['ok'] else 'ERR'} {it['id']:<26s} {r['seconds']:6.2f}s {r['wps']:4.2f} w/s  {r['lufs']:6.2f} LUFS  peak {r['peak_dbfs']:6.2f}  {'; '.join(r['problems'])}")
    ok = [v for v in qa.values() if "seconds" in v]
    if ok:
        print(f"\n{len(qa)} Clips geprueft, {bad} mit Problemen | Dauer {sum(v['seconds'] for v in ok) / 60:.1f} min | "
              f"{sum(v['bytes'] for v in ok) / 1e6:.2f} MB | Tempo {min(v['wps'] for v in ok)}-{max(v['wps'] for v in ok)} w/s | "
              f"LUFS {min(v['lufs'] for v in ok)}..{max(v['lufs'] for v in ok)} | max. Peak {max(v['peak_dbfs'] for v in ok)} dBFS")
    if not args.only:
        json.dump(qa, open(NARR / "_qa.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    return bad


# --------------------------------------------------------------------------
# Spracherkennung (Whisper-small ueber sherpa-onnx), WER
# --------------------------------------------------------------------------
def norm_tokens(s):
    s = speak_numbers(s).lower().replace("ß", "ss")
    s = re.sub(r"\bwow\b", "wau", s)  # Whisper schreibt die Interjektion englisch
    s = s.replace("%", " prozent ")
    s = re.sub(r"[^a-zäöüéèàç0-9 ]", " ", s.replace("-", " "))
    return s.split()


def wer(ref, hyp, fuzzy=False):
    def same(a, b):
        return a == b or (fuzzy and difflib.SequenceMatcher(None, a, b).ratio() >= 0.72)
    d = list(range(len(hyp) + 1))
    for i in range(1, len(ref) + 1):
        prev, d[0] = d[0], i
        for j in range(1, len(hyp) + 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (0 if same(ref[i - 1], hyp[j - 1]) else 1))
            prev, d[j] = d[j], cur
    return d[len(hyp)], len(ref)


def cmd_asr(args):
    import sherpa_onnx
    d = ASR_DIR
    if not (d / "small-tokens.txt").exists():
        ensure_archive(ASR_URL, d, "small-tokens.txt")
    rec = sherpa_onnx.OfflineRecognizer.from_whisper(
        encoder=str(d / "small-encoder.int8.onnx"), decoder=str(d / "small-decoder.int8.onnx"),
        tokens=str(d / "small-tokens.txt"), language="de", task="transcribe", num_threads=2)
    items = select(load_items(), args.only)
    sents = load_json(NARR / "_sentences.json")
    tot = [0, 0, 0]
    results = {}
    for it in items:
        x = decode_mp3(NARR / f"{it['id']}.mp3")
        segs = sents[it["id"]]
        spoken = [to_spoken(s["text"]) for s in segs]
        # Saetze zu <= 27-s-Bloecken buendeln (Whisper-Limit 30 s)
        blocks, cur = [], []
        for k, s in enumerate(segs):
            if cur and s["end"] - segs[cur[0]]["start"] > 27:
                blocks.append(cur)
                cur = []
            cur.append(k)
        blocks.append(cur)
        hyp_all = []
        for b in blocks:
            a, z = max(segs[b[0]]["start"] - 0.1, 0), segs[b[-1]]["end"] + 0.1
            st = rec.create_stream()
            st.accept_waveform(SR, x[int(a * SR): int(z * SR)])
            rec.decode_stream(st)
            hyp_all += norm_tokens(st.result.text)
        ref = norm_tokens(" ".join(spoken))
        e1, n = wer(ref, hyp_all)
        e2, _ = wer(ref, hyp_all, fuzzy=True)
        tot[0] += e1
        tot[1] += e2
        tot[2] += n
        results[it["id"]] = {"wer": round(e1 / n, 3), "wer_fuzzy": round(e2 / n, 3), "hyp": " ".join(hyp_all)}
        print(f"{it['id']:<26s} WER {e1 / n:5.1%}  (namenstolerant {e2 / n:5.1%})", flush=True)
        if args.verbose:
            sm = difflib.SequenceMatcher(None, ref, hyp_all)
            for op, i1, i2, j1, j2 in sm.get_opcodes():
                if op != "equal":
                    print(f"      {op:8s} ref[{' '.join(ref[i1:i2])}]  hyp[{' '.join(hyp_all[j1:j2])}]")
    print(f"\nGESAMT: WER {tot[0] / tot[2]:.1%}, namenstolerant {tot[1] / tot[2]:.1%}  ({tot[2]} Woerter, {len(items)} Clips)")
    json.dump(results, open(WORK / "asr_results.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)


def cmd_ipa(words):
    import espeakng_loader
    from phonemizer import phonemize
    from phonemizer.backend.espeak.wrapper import EspeakWrapper
    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
    spoken = [to_spoken(w).rstrip(".!?") for w in words]
    for w, s, p in zip(words, spoken, phonemize(spoken, language="de", backend="espeak", strip=True)):
        print(f"{w:28s} -> {s:28s} /{p}/")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", default="", help="kommagetrennte ids")
    ap.add_argument("--kbps", type=int, default=KBPS_DEFAULT)
    ap.add_argument("--force", action="store_true", help="Satz-Cache ignorieren und neu synthetisieren")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--asr", action="store_true")
    ap.add_argument("--verbose", "-v", action="store_true")
    ap.add_argument("--ipa", nargs="+", metavar="WORT")
    args = ap.parse_args()
    if args.ipa:
        return cmd_ipa(args.ipa)
    if args.check:
        sys.exit(1 if cmd_check(args) else 0)
    if args.asr:
        return cmd_asr(args)
    cmd_make(args)


if __name__ == "__main__":
    main()
