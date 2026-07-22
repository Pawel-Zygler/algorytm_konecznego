"""
RAG (Retrieval-Augmented Generation) module for Koneczny books.
Indexes PDF books using ChromaDB and sentence-transformers embeddings,
then retrieves relevant passages to augment LLM prompts.
"""

import os
import json
import hashlib
import chromadb
from chromadb.config import Settings
from typing import List, Tuple
from backend import config

# Paths
BOOKS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "books")
CHROMA_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_db")
INDEX_STATE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "chroma_index_state.json")

# ChromaDB client (persistent)
_chroma_client = None
_collection = None

COLLECTION_NAME = "koneczny_books"

# Chunk settings
CHUNK_SIZE = 800   # characters per chunk
CHUNK_OVERLAP = 150


def get_chroma_collection():
    """Returns (creates if needed) persistent ChromaDB collection."""
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory=CHROMA_DB_PATH,
            anonymized_telemetry=False
        ))
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extracts plain text from a PDF file using PyMuPDF."""
    import fitz  # PyMuPDF
    doc = fitz.open(pdf_path)
    text_parts = []
    for page in doc:
        text = page.get_text("text")
        if text.strip():
            text_parts.append(text)
    doc.close()
    return "\n".join(text_parts)


def chunk_text(text: str, source: str) -> List[Tuple[str, dict]]:
    """Splits text into overlapping chunks."""
    chunks = []
    start = 0
    text = text.strip()
    while start < len(text):
        end = start + CHUNK_SIZE
        chunk = text[start:end]
        if chunk.strip():
            chunks.append((chunk, {"source": source, "start_char": start}))
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks


def get_file_hash(path: str) -> str:
    """Returns MD5 hash of a file for change detection."""
    hasher = hashlib.md5()
    with open(path, "rb") as f:
        for block in iter(lambda: f.read(65536), b""):
            hasher.update(block)
    return hasher.hexdigest()


def load_index_state() -> dict:
    """Loads the dictionary of already-indexed files {filename: md5_hash}."""
    if os.path.exists(INDEX_STATE_PATH):
        with open(INDEX_STATE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_index_state(state: dict):
    """Saves the index state to disk."""
    with open(INDEX_STATE_PATH, "w", encoding="utf-8") as f:
        json.dump(state, f, ensure_ascii=False, indent=2)


def build_index(force: bool = False) -> dict:
    """
    Builds the ChromaDB index from all PDF files in the books directory.
    Only indexes new or changed files. Returns stats dict.
    """
    collection = get_chroma_collection()
    index_state = load_index_state()
    
    stats = {"indexed": 0, "skipped": 0, "failed": 0, "total_chunks": 0}
    
    if not os.path.exists(BOOKS_DIR):
        print(f"Books directory not found: {BOOKS_DIR}")
        return stats
    
    pdf_files = [f for f in os.listdir(BOOKS_DIR) if f.lower().endswith(".pdf")]
    
    for filename in pdf_files:
        pdf_path = os.path.join(BOOKS_DIR, filename)
        file_hash = get_file_hash(pdf_path)
        
        # Skip if already indexed and unchanged
        if not force and index_state.get(filename) == file_hash:
            stats["skipped"] += 1
            print(f"  Pominięto (bez zmian): {filename}")
            continue
        
        print(f"  Indeksuję: {filename}...")
        try:
            text = extract_text_from_pdf(pdf_path)
            if not text.strip():
                print(f"    Ostrzeżenie: Brak tekstu w pliku {filename} (może być skan bez OCR)")
                stats["failed"] += 1
                continue
            
            chunks = chunk_text(text, filename)
            
            if not chunks:
                stats["failed"] += 1
                continue
            
            # Delete old chunks for this file if re-indexing
            if index_state.get(filename):
                try:
                    existing = collection.get(where={"source": filename})
                    if existing["ids"]:
                        collection.delete(ids=existing["ids"])
                except Exception:
                    pass
            
            # Add in batches of 100
            batch_size = 100
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i:i + batch_size]
                ids = [f"{filename}::chunk::{i+j}" for j, _ in enumerate(batch)]
                documents = [c[0] for c in batch]
                metadatas = [c[1] for c in batch]
                
                collection.upsert(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas
                )
            
            index_state[filename] = file_hash
            stats["indexed"] += 1
            stats["total_chunks"] += len(chunks)
            print(f"    OK: {len(chunks)} fragmentów")
            
        except Exception as e:
            print(f"    Błąd przy indeksowaniu {filename}: {e}")
            stats["failed"] += 1
    
    save_index_state(index_state)
    return stats


def retrieve_relevant_passages(query_text: str, n_results: int = 5) -> List[dict]:
    """
    Retrieves the most relevant passages from Koneczny's books
    for a given query text (the page content being analyzed).
    
    Returns a list of dicts with 'text' and 'source' keys.
    """
    collection = get_chroma_collection()
    
    # Check if collection has any documents
    count = collection.count()
    if count == 0:
        return []
    
    # Use first 2000 chars of query for retrieval (semantic similarity)
    query = query_text[:2000]
    
    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, count),
        include=["documents", "metadatas", "distances"]
    )
    
    passages = []
    if results and results["documents"] and results["documents"][0]:
        for doc, meta, dist in zip(
            results["documents"][0],
            results["metadatas"][0],
            results["distances"][0]
        ):
            # Filter out very distant results (low relevance threshold)
            if dist < 1.5:
                source = meta.get("source", "nieznane źródło")
                # Clean up source name
                source_clean = source.replace(".pdf", "").strip()
                passages.append({
                    "text": doc.strip(),
                    "source": source_clean,
                    "distance": round(dist, 3)
                })
    
    return passages


def format_passages_for_prompt(passages: List[dict]) -> str:
    """Formats retrieved passages for inclusion in the LLM prompt."""
    if not passages:
        return ""
    
    lines = ["\n=== FRAGMENTY DZIEŁ FELIKSA KONECZNEGO (jako źródła do oceny wskaźników) ===\n"]
    for i, p in enumerate(passages, 1):
        lines.append(f"[Fragment {i} — źródło: {p['source']}]\n{p['text']}\n")
    lines.append("=== KONIEC FRAGMENTÓW ===\n")
    return "\n".join(lines)


def get_index_status() -> dict:
    """Returns current status of the ChromaDB index."""
    try:
        collection = get_chroma_collection()
        count = collection.count()
        state = load_index_state()
        return {
            "indexed_files": len(state),
            "total_chunks": count,
            "files": list(state.keys())
        }
    except Exception as e:
        return {"error": str(e), "indexed_files": 0, "total_chunks": 0}
