"""Split markdown knowledge files into retrieval-sized chunks.

Chunks follow the document's headings so that each one is about a single
topic, and every chunk starts with its heading trail ("Rates > Packages")
so it still makes sense when read on its own.
"""

import hashlib
import re
from dataclasses import dataclass, field

HEADING_RE = re.compile(r"^(#{1,4})\s+(.*)$")


@dataclass
class Chunk:
    source: str  # path relative to knowledge/, e.g. "tutoring/rates.md"
    title: str  # document title (first H1, or the file name)
    heading: str  # heading trail for this chunk
    content: str
    index: int = 0
    content_hash: str = field(default="", repr=False)

    def __post_init__(self) -> None:
        if not self.content_hash:
            digest = hashlib.sha256(f"{self.source}\n{self.content}".encode()).hexdigest()
            self.content_hash = digest


def _split_long(text: str, max_chars: int, overlap: int) -> list[str]:
    """Split on paragraph boundaries, carrying a little overlap forward."""
    if len(text) <= max_chars:
        return [text]
    pieces: list[str] = []
    current = ""
    for paragraph in re.split(r"\n\s*\n", text):
        paragraph = paragraph.strip()
        if not paragraph:
            continue
        candidate = f"{current}\n\n{paragraph}" if current else paragraph
        if len(candidate) <= max_chars:
            current = candidate
            continue
        if current:
            pieces.append(current)
            tail = current[-overlap:] if overlap else ""
            current = f"{tail}\n\n{paragraph}" if tail else paragraph
        else:
            current = paragraph
        # A single paragraph longer than the limit is cut hard.
        while len(current) > max_chars:
            pieces.append(current[:max_chars])
            current = current[max_chars - overlap :]
    if current:
        pieces.append(current)
    return pieces


def chunk_markdown(
    text: str, *, source: str, max_chars: int = 800, overlap: int = 100
) -> list[Chunk]:
    title = (
        source.rsplit("/", 1)[-1].removesuffix(".md").replace("-", " ").replace("_", " ").title()
    )
    trail: list[str] = []  # current heading stack
    sections: list[tuple[str, list[str]]] = []  # (heading trail, lines)
    lines: list[str] = []
    found_title = False

    def flush() -> None:
        body = "\n".join(lines).strip()
        if body:
            sections.append((" > ".join(trail), [body]))
        lines.clear()

    for line in text.splitlines():
        match = HEADING_RE.match(line)
        if not match:
            lines.append(line)
            continue
        flush()
        level, heading = len(match.group(1)), match.group(2).strip()
        if level == 1 and not found_title:
            title, found_title = heading, True
        del trail[level - 1 :]
        while len(trail) < level - 1:
            trail.append("")
        trail.append(heading)
    flush()

    chunks: list[Chunk] = []
    for heading, bodies in sections:
        heading = " > ".join(part for part in heading.split(" > ") if part)
        for piece in _split_long(bodies[0], max_chars, overlap):
            content = f"{heading}\n{piece}" if heading else piece
            chunks.append(
                Chunk(
                    source=source, title=title, heading=heading, content=content, index=len(chunks)
                )
            )
    return chunks
