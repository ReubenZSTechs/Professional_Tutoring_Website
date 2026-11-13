"""Normalise visitor text before anything else looks at it.

Removes the characters attackers use to hide instructions (zero-width,
bidi controls, control codes) and folds look-alike Unicode to its plain
form, so pattern checks and the model see the same text a human would.
"""

import re
import unicodedata

# Zero-width and bidirectional control characters.
_INVISIBLE = re.compile("[​-‏ -‮⁠-⁤⁦-⁯﻿­᠎]")
# Control characters other than newline and tab.
_CONTROL = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]")
_SPACES = re.compile(r"[ \t ]+")
_NEWLINES = re.compile(r"\n{3,}")


def sanitize_text(text: str, max_chars: int | None = None) -> str:
    text = unicodedata.normalize("NFKC", text or "")
    text = _INVISIBLE.sub("", text)
    text = _CONTROL.sub("", text)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = _SPACES.sub(" ", text)
    text = _NEWLINES.sub("\n\n", text)
    text = "\n".join(line.strip() for line in text.split("\n")).strip()
    if max_chars is not None:
        text = text[:max_chars].strip()
    return text
