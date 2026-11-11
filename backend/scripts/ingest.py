"""Load the knowledge base into Supabase.

Reads every markdown file under `knowledge/`, splits it into chunks,
embeds the chunks with Gemini and stores them in the `documents` table.
Safe to re-run: unchanged chunks are skipped and chunks that no longer
exist in the files are deleted.

    python backend/scripts/ingest.py            # sync knowledge/ to Supabase
    python backend/scripts/ingest.py --dry-run  # show the chunks, change nothing
"""

import argparse
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from core.config import KNOWLEDGE_DIR, get_settings  # noqa: E402
from llm.gemini import GeminiClient  # noqa: E402
from rag.chunker import Chunk, chunk_markdown  # noqa: E402
from rag.embedder import Embedder  # noqa: E402
from services.supabase import SupabaseClient  # noqa: E402

DELETE_BATCH = 40


def load_chunks(knowledge_dir: Path = KNOWLEDGE_DIR) -> list[Chunk]:
    chunks: list[Chunk] = []
    for path in sorted(knowledge_dir.rglob("*.md")):
        source = path.relative_to(knowledge_dir).as_posix()
        chunks.extend(chunk_markdown(path.read_text(encoding="utf-8"), source=source))
    return chunks


async def sync(chunks: list[Chunk]) -> None:
    settings = get_settings()
    if not (settings.gemini_ready and settings.supabase_ready):
        sys.exit("Set GEMINI_API_KEY, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env first.")
    supabase = SupabaseClient(settings)
    embedder = Embedder(GeminiClient(settings))

    existing = await supabase.select("documents", params={"select": "content_hash"})
    stored = {row["content_hash"] for row in existing}
    wanted = {chunk.content_hash for chunk in chunks}

    new_chunks = [chunk for chunk in chunks if chunk.content_hash not in stored]
    if new_chunks:
        vectors = await embedder.embed_documents([(c.title, c.content) for c in new_chunks])
        await supabase.upsert(
            "documents",
            [
                {
                    "source": chunk.source,
                    "chunk_index": chunk.index,
                    "content": chunk.content,
                    "metadata": {"title": chunk.title, "heading": chunk.heading},
                    "content_hash": chunk.content_hash,
                    "embedding": vector,
                }
                for chunk, vector in zip(new_chunks, vectors, strict=True)
            ],
            on_conflict="content_hash",
        )

    stale = sorted(stored - wanted)
    for start in range(0, len(stale), DELETE_BATCH):
        batch = ",".join(stale[start : start + DELETE_BATCH])
        await supabase.delete("documents", filters={"content_hash": f"in.({batch})"})

    print(
        f"{len(chunks)} chunks in knowledge/: {len(new_chunks)} added, "
        f"{len(wanted & stored)} unchanged, {len(stale)} removed."
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--dry-run", action="store_true", help="print chunks without writing")
    args = parser.parse_args()

    chunks = load_chunks()
    if args.dry_run:
        for chunk in chunks:
            print(
                f"--- {chunk.source} #{chunk.index} ({len(chunk.content)} chars)\n{chunk.content}\n"
            )
        print(f"{len(chunks)} chunks (dry run, nothing written).")
        return
    asyncio.run(sync(chunks))


if __name__ == "__main__":
    main()
