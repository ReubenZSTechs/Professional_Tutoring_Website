"""Fast, deterministic screen for prompt-injection attempts.

Each pattern has a weight; a message whose total reaches the block score
gets a canned reply without any model call. This catches the common,
cheap attacks. Subtler ones are left to the LLM classifier in the
rewriter and to the output guard.
"""

import re
from dataclasses import dataclass

_RULES: list[tuple[str, int, str]] = [
    # --- English: overriding instructions ---------------------------------
    (
        r"\b(ignore|disregard|forget|override|bypass|skip)\b.{0,40}\b(previous|prior|above|earlier|all|any|your|its|the|these|those)\b.{0,30}\b(instructions?|rules?|prompts?|guidelines?|restrictions?|constraints?|guardrails?|policy|policies|filters?|safety)\b",
        3,
        "override",
    ),
    (r"\b(ignore|disregard)\b.{0,20}\b(everything|all)\b.{0,20}\b(above|before)\b", 3, "override"),
    (r"\bnew (instructions?|rules?|system prompt)\b", 2, "override"),
    (
        r"\b(from now on|starting now|for the rest of (this|the) (chat|conversation))\b.{0,40}\b(you (are|will|must)|act as|respond as|behave as|ignore)\b",
        3,
        "override",
    ),
    # --- Prompt / secret extraction ---------------------------------------
    (
        r"\b(system|developer|hidden|secret|initial|original|confidential)\s+(prompt|message|instructions?|rules?|directives?|marker)\b",
        2,
        "extraction",
    ),
    # "...your instructions / rules" is about the assistant; "the rules for rescheduling" is not.
    (
        r"\b(reveal|print|show|repeat|output|display|dump|leak|expose|tell me|give me|what (is|are|were))\b.{0,40}\b(your|its)\b.{0,20}\b(prompt|instructions?|rules?|system message|configuration|guidelines|directives|canary|secret|api key|token|marker)\b",
        3,
        "extraction",
    ),
    (
        r"\b(reveal|print|show|repeat|output|display|dump|leak|expose|tell me|give me|what (is|are|were))\b.{0,40}\bthe\b.{0,20}\b(prompt|system message|system prompt|configuration|canary|secret|api key|access token|marker)\b",
        3,
        "extraction",
    ),
    (
        r"\b(repeat|print|output|show|copy)\b.{0,15}\b(text|words|content|everything|message|lines)\b.{0,10}\b(above|before|earlier|preceding)\b",
        3,
        "extraction",
    ),
    (r"\b(verbatim|word for word|exactly as written)\b", 1, "extraction"),
    (r"\b(api[_ -]?key|secret key|password|access token|service[_ -]role)\b", 2, "extraction"),
    (
        r"\b(what is|what's|tell me|give me|send me|share)\b.{0,20}\b(the|your)\b.{0,15}\b(password|api[_ -]?key|secret key|access token|service[_ -]role)\b",
        2,
        "extraction",
    ),
    # --- Private information about the tutor -------------------------------
    (
        r"\b(home address|alamat rumah\w*|where (does|do) (he|she|reuben|you) live|date of birth|tanggal lahir|id number|passport|nik|bank account|rekening)\b",
        2,
        "private",
    ),
    # --- Role / persona hijack --------------------------------------------
    (
        r"\b(you are now|act as|pretend (to be|you are|that you)|role-?play as|imagine you are|simulate (being|a)|take on the role)\b",
        2,
        "persona",
    ),
    (
        r"\b(jailbreak|jail-break|dan mode|do anything now|developer mode|god mode|unfiltered mode|evil mode|no restrictions mode)\b",
        3,
        "jailbreak",
    ),
    (
        r"\b(without|no|remove|disable|turn off|free from)\b.{0,20}\b(restrictions?|filters?|safety|guardrails?|limitations?|censorship|rules|guidelines)\b",
        2,
        "jailbreak",
    ),
    (
        r"\byou (have|are) (no|not bound by|free from)\b.{0,20}\b(rules|restrictions|limits|guidelines)\b",
        3,
        "jailbreak",
    ),
    # --- Fake message boundaries and markup -------------------------------
    (
        r"<\s*/?\s*(system|assistant|user|human|instruction|instructions|im_start|im_end|s|sys|prompt|tool|function_call)\b[^>]*>",
        3,
        "markup",
    ),
    (r"\[/?(INST|SYS|SYSTEM|ASSISTANT|USER)\]", 3, "markup"),
    (r"<\|[a-z_]+\|>", 3, "markup"),
    (r"(^|\n)\s*(system|assistant|developer|tool)\s*:", 2, "markup"),
    (r"(^|\n)\s*#{1,3}\s*(system|instructions?|rules?)\b", 2, "markup"),
    (r"\b(end of|begin|start of)\s+(system|instructions?|prompt)\b", 2, "markup"),
    (r"\bthis is (the|your) (developer|administrator|admin|system|owner)\b", 2, "markup"),
    # --- Encoded or obfuscated payloads -----------------------------------
    (r"[A-Za-z0-9+/]{80,}={0,2}", 2, "encoded"),
    (r"\b(base64|rot13|hex[- ]?encoded|decode (this|the following))\b", 2, "encoded"),
    (r"(.)\1{40,}", 1, "noise"),
    # --- Indonesian -------------------------------------------------------
    (
        r"\b(abaikan|lupakan|hiraukan|kesampingkan|lewati|langgar)\b.{0,30}\b(semua|seluruh|setiap|instruksi|perintah|aturan|petunjuk|batasan|pedoman|sistem)\b",
        3,
        "override",
    ),
    (
        r"\b(instruksi|perintah|aturan|petunjuk)\s+(sebelumnya|di atas|awal|sistem|rahasia|tersembunyi)\b",
        2,
        "override",
    ),
    (
        r"\b(tunjukkan|tampilkan|bocorkan|sebutkan|ulangi|cetak|beritahu|beri tahu|apa)\b.{0,40}\b(prompt|instruksi sistem|aturan(mu| anda| kamu)|perintah(mu| anda| kamu)|konfigurasi|kunci api|rahasia|token)\b",
        3,
        "extraction",
    ),
    (
        r"\b(berpura-?pura|anggap (dirimu|kamu|anda|saja)|bertindak sebagai|berperan sebagai|seolah-olah kamu|mulai sekarang kamu)\b",
        2,
        "persona",
    ),
    (
        r"\b(mode pengembang|mode developer|tanpa (batasan|aturan|filter|sensor)|bebas dari aturan)\b",
        3,
        "jailbreak",
    ),
    (r"\b(kata sandi|password|kunci rahasia)\b", 2, "extraction"),
    (
        r"\b(apa|sebutkan|berikan|beri tahu|kirim)\b.{0,30}\b(kata sandi|password|kunci (api|rahasia)|token|konfigurasi)\b",
        2,
        "extraction",
    ),
]

RULES = [
    (re.compile(pattern, re.IGNORECASE | re.DOTALL), weight, label)
    for pattern, weight, label in _RULES
]


@dataclass(frozen=True)
class InjectionVerdict:
    score: int
    labels: tuple[str, ...]

    @property
    def is_suspicious(self) -> bool:
        return self.score > 0


def score_injection(text: str) -> InjectionVerdict:
    score = 0
    labels: list[str] = []
    for pattern, weight, label in RULES:
        if pattern.search(text):
            score += weight
            if label not in labels:
                labels.append(label)
    return InjectionVerdict(score=score, labels=tuple(labels))


def is_injection(text: str, block_score: int) -> bool:
    return score_injection(text).score >= block_score
