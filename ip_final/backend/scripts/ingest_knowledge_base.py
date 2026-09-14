#!/usr/bin/env python3
"""Ingest curated Markdown knowledge documents into the local FAISS store.

Documents live in ``data/knowledge_base`` (not Python code). Optional YAML-like
front matter supplies source attribution. Use ``--reset`` when replacing this
curated corpus to avoid stale or duplicate vectors.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import delete

from app.core.database import AsyncSessionLocal, init_db
from app.models.db import Source
from app.services.vector_store import add_documents, reset_collection

DOMAIN_FOLDERS = {"ip": "ip", "regulatory": "regulatory", "ayurveda": "ayurveda"}


def parse_document(path: Path, root: Path) -> tuple[str, dict[str, str], str]:
    raw = path.read_text(encoding="utf-8")
    metadata: dict[str, str] = {}
    body = raw
    if raw.startswith("---\n"):
        _, front_matter, body = raw.split("---\n", 2)
        for line in front_matter.splitlines():
            if ":" in line:
                key, value = line.split(":", 1)
                metadata[key.strip()] = value.strip().strip('"')
    match = re.search(r"^#\s+(.+)$", body, flags=re.MULTILINE)
    title = metadata.get("title") or (match.group(1).strip() if match else path.stem.replace("_", " ").title())
    metadata.setdefault("domain", DOMAIN_FOLDERS.get(path.relative_to(root).parts[0], "general"))
    metadata.setdefault("authority", "Curated official-source summary")
    metadata.setdefault("document_type", "guide")
    metadata.setdefault("jurisdiction", "india")
    metadata.setdefault("source_url", "")
    return title, metadata, body.strip()


def chunk_text(text: str, size: int = 350, overlap: int = 60) -> list[str]:
    words = re.sub(r"\s+", " ", text).strip().split(" ")
    return [" ".join(words[start:min(start + size, len(words))]) for start in range(0, len(words), size - overlap)] if words else []


async def ingest(kb_dir: Path, reset: bool) -> None:
    await init_db()
    paths = sorted(kb_dir.rglob("*.md"))
    if not paths:
        raise RuntimeError(f"No Markdown documents found in {kb_dir}")
    if reset:
        reset_collection()

    ids: list[str] = []
    texts: list[str] = []
    vector_metadata: list[dict[str, Any]] = []
    sources: dict[str, dict[str, str]] = {}
    for path in paths:
        title, metadata, body = parse_document(path, kb_dir)
        source_id = hashlib.sha256(str(path.relative_to(kb_dir)).encode("utf-8")).hexdigest()[:20]
        sources[source_id] = {"title": title, **metadata}
        for index, chunk in enumerate(chunk_text(body)):
            ids.append(f"{source_id}_{index}")
            texts.append(chunk)
            vector_metadata.append({**metadata, "source_id": source_id, "document_title": title, "chunk_index": index})
    add_documents(ids=ids, texts=texts, metadatas=vector_metadata)

    async with AsyncSessionLocal() as db:
        if reset:
            await db.execute(delete(Source).where(Source.url.like("knowledge_base/%")))
        for source_id, metadata in sources.items():
            if await db.get(Source, source_id):
                continue
            db.add(Source(id=source_id, title=metadata["title"], url=metadata["source_url"],
                authority=metadata["authority"], document_type=metadata["document_type"],
                topic=metadata["domain"], domain=metadata["domain"],
                jurisdiction=metadata["jurisdiction"], language="en"))
        await db.commit()
    print(f"Ingested {len(paths)} documents and {len(ids)} chunks.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Ingest curated Markdown knowledge documents")
    parser.add_argument("--knowledge-dir", type=Path, default=Path("data/knowledge_base"))
    parser.add_argument("--reset", action="store_true", help="Clear the local vector index before ingestion")
    args = parser.parse_args()
    asyncio.run(ingest(args.knowledge_dir, args.reset))


if __name__ == "__main__":
    main()
