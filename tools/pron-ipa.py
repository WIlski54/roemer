#!/usr/bin/env python3
# Zeigt die espeak-IPA (mit Betonung) fuer Schreibvarianten. usage: python3 tools/pron-ipa.py Wort1 Wort2 ...
import sys, espeakng_loader
from phonemizer import phonemize
from phonemizer.backend.espeak.wrapper import EspeakWrapper
EspeakWrapper.set_library(espeakng_loader.get_library_path()); EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
w = sys.argv[1:]
for a, b in zip(w, phonemize(w, language="de", backend="espeak", strip=True, with_stress=True)):
    print(f"{a:26s} /{b}/")
