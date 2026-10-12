#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Hoerproben fuer Aussprache-Varianten (gleiche Stimme/Parameter wie das Buch).
usage: python3 tools/pron-test.py [spec.json] [ausgabe.html]
spec: [{"word": "...", "sentence": "... {W} ...", "variants": [["A","Schreibweise"], ...]}]
Schreibt eine HTML-Seite mit eingebetteten MP3-Playern (Wort einzeln, dann im Satz)."""
import sys, json, base64, importlib.util, io
from pathlib import Path
import numpy as np
from scipy.signal import sosfilt
ROOT = Path(__file__).resolve().parent.parent
spec_ = importlib.util.spec_from_file_location("mn", ROOT / "tools" / "make-narration.py")
mn = importlib.util.module_from_spec(spec_); sys.argv = ["x"]; spec_.loader.exec_module(mn)
SR = mn.SR
def clip(text_word, text_sentence, tmp):
    parts = [np.zeros(int(0.1 * SR), np.float32)]
    for i, t in enumerate([text_word, text_sentence]):
        x = mn.trim_silence(mn.synth_sentence(mn.speak_numbers(t)))
        x = sosfilt(mn.hp_sos, x - np.mean(x)).astype(np.float32); x = mn.fade(x, int(0.008 * SR), int(0.012 * SR))
        parts += [x, np.zeros(int((0.7 if i == 0 else 0.1) * SR), np.float32)]
    y = mn.normalize_loudness(np.concatenate(parts)); y = mn.fade(y, int(0.03 * SR), int(0.03 * SR))
    mn.encode_mp3(y, Path(tmp), 48)
    return base64.b64encode(Path(tmp).read_bytes()).decode()
spec = json.load(open(sys.argv[1] if len(sys.argv) > 1 else ROOT / "tools" / "pron-spec.json"))
out = Path(sys.argv[2] if len(sys.argv) > 2 else "/tmp/claude-0/pron/hoerproben.html"); out.parent.mkdir(parents=True, exist_ok=True)
html = ["<!doctype html><html lang=de><meta charset=utf-8><meta name=viewport content='width=device-width,initial-scale=1'><title>Aussprache-Hörproben</title>",
        "<style>body{font:16px/1.4 Georgia,serif;max-width:760px;margin:0 auto;padding:16px;background:#f6edd6;color:#3a2615}h1{color:#8B1E1E}h2{color:#8B1E1E;border-bottom:2px solid #c9a96a;margin-top:28px}.s{color:#6a4a2a;font-style:italic;margin:.2em 0 .6em}.v{display:flex;align-items:center;gap:10px;padding:6px 0;flex-wrap:wrap}.v b{width:2em;font-size:1.3em;color:#8B1E1E}.v span{min-width:11em}.v code{background:#fff8e6;padding:2px 6px;border-radius:4px}audio{height:36px}</style>",
        "<h1>Aussprache-Hörproben</h1><p>Jede Zeile: zuerst das Wort einzeln, dann im Satz. Merke dir den Buchstaben, der am besten klingt.</p>"]
for n, w in enumerate(spec, 1):
    html.append(f"<h2>{n}. {w['word']} <small>(Seite {w['seite']})</small></h2><p class=s>{w['sentence'].replace('{W}', w['word'])}</p>")
    for k, sp in w["variants"]:
        say = sp.replace(" (aktuell)", "")
        b64 = clip(say, w["sentence"].replace("{W}", say), "/tmp/claude-0/pron/_t.mp3")
        html.append(f"<div class=v><b>{k}</b><span><code>{sp}</code></span><audio controls preload=none src='data:audio/mpeg;base64,{b64}'></audio></div>")
    print(w["word"], "ok", flush=True)
out.write_text("\n".join(html), encoding="utf-8"); print(out, out.stat().st_size)
