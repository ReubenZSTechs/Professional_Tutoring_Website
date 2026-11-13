"""Check what the answering model writes before the visitor sees it.

The model only sees Reuben's own knowledge files, but a successful
injection could still make it leak its instructions, invent a price, or
point visitors somewhere else. The guard watches the streamed answer and
swaps in a safe message the moment one of those appears.
"""

import re
from dataclasses import dataclass, field

_URL = re.compile(r"https?://([^\s/)>\]]+)", re.IGNORECASE)
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
# A Rupiah amount: at least five digits, with optional thousands separators.
_PRICE = re.compile(r"(?:Rp|IDR)\s?\.?\s?(\d[\d.,]{3,}\d)", re.IGNORECASE)
# Digits with at most spaces, dashes or dots between groups (no commas or brackets, which
# syllabus-code lists use). Checked further for a 9+ digit count.
_PHONE = re.compile(r"(?<![\w(])\+?\d[\d .-]{7,20}\d(?![\w)])")
_HTML = re.compile(
    r"<\s*/?\s*(script|iframe|img|a|style|svg|object|embed|form|input|link|meta)\b", re.IGNORECASE
)


@dataclass
class OutputPolicy:
    canary: str
    allowed_prices: set[int]
    allowed_hosts: set[str]
    allowed_emails: set[str]
    allowed_phone_digits: set[str]
    protected_lines: list[str] = field(default_factory=list)

    @staticmethod
    def protected_from_prompt(system_prompt: str) -> list[str]:
        """Distinctive lines of the system prompt; their appearance means a leak."""
        lines = []
        for raw in system_prompt.splitlines():
            line = raw.strip(" -*#").strip()
            if len(line) >= 60:
                lines.append(line.lower())
        return lines


def _digits(text: str) -> str:
    return re.sub(r"\D", "", text)


def check_output(text: str, policy: OutputPolicy) -> str | None:
    """Return the name of the first violation found in `text`, or None."""
    lowered = text.lower()
    if policy.canary and policy.canary.lower() in lowered:
        return "canary_leak"
    for line in policy.protected_lines:
        if line in lowered:
            return "prompt_leak"
    if _HTML.search(text):
        return "html"
    for match in _URL.finditer(text):
        host = match.group(1).lower().split(":")[0]
        if host not in policy.allowed_hosts and not any(
            host.endswith("." + h) for h in policy.allowed_hosts
        ):
            return "unknown_url"
    for match in _EMAIL.finditer(text):
        if match.group(0).lower() not in policy.allowed_emails:
            return "unknown_email"
    for match in _PRICE.finditer(text):
        digits = _digits(match.group(1))
        if len(digits) >= 5 and int(digits) not in policy.allowed_prices:
            return "unknown_price"
    for match in _PHONE.finditer(text):
        digits = _digits(match.group(0))
        if len(digits) >= 9 and not any(digits.endswith(ok) for ok in policy.allowed_phone_digits):
            return "unknown_phone"
    return None


_TOKEN_END = re.compile(r"[\s.,;:!?)\]]$")


def _settled(text: str) -> str:
    """Text without a trailing word that may still be mid-stream (e.g. "Rp 450," before "000")."""
    if not text or _TOKEN_END.search(text):
        return text
    cut = max(text.rfind(" "), text.rfind("\n"))
    return text[: cut + 1] if cut >= 0 else ""


class StreamGuard:
    """Accumulates streamed text and reports the first violation.

    While streaming, only the settled part of the text is checked, so a
    number or link that is still being written is not misjudged. Call
    `finish()` once the stream ends to check the full text.
    """

    def __init__(self, policy: OutputPolicy) -> None:
        self.policy = policy
        self.text = ""
        self.violation: str | None = None

    def feed(self, piece: str) -> str | None:
        if self.violation:
            return self.violation
        self.text += piece
        self.violation = check_output(_settled(self.text), self.policy)
        return self.violation

    def finish(self) -> str | None:
        if not self.violation:
            self.violation = check_output(self.text, self.policy)
        return self.violation
