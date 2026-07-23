import os
from fastapi import FastAPI, HTTPException, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any
import requests
import fitz
import io
from backend import analyzer
from backend import rag

app = FastAPI(
    title="Algorytm Konecznego API",
    description="Backend do analizy cywilizacyjnej próbek tekstowych według metody Feliksa Konecznego.",
    version="1.0.0"
)

# Enable CORS for Chrome Extension requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify extension origin for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Warm up ChromaDB collection on startup."""
    try:
        rag.get_chroma_collection()
        status = rag.get_index_status()
        print(f"RAG gotowy: {status.get('indexed_files', 0)} plików, {status.get('total_chunks', 0)} fragmentów")
    except Exception as e:
        print(f"RAG startup warning: {e}")

class AnalysisRequest(BaseModel):
    text: Optional[str] = None
    pdf_url: Optional[str] = None
    api_key: Optional[str] = None
    target_indices: Optional[list[str]] = None

class AnalysisResponse(BaseModel):
    sacrality_score: float
    spirit_supremacy_score: float = 0.0
    legal_dualism_score: float = 0.0
    law_source_pluralism_score: float = 0.0
    aposteriori_apriori_score: float = 0.0
    organism_mechanism_score: float = 0.0
    personalism_score: float = 0.0
    family_law_autonomy_score: float = 0.0
    church_independence_score: float = 0.0
    property_rights_stability_score: float = 0.0
    inheritance_continuity_score: float = 0.0
    morality_supremacy_score: float = 0.0
    public_morality_totality_score: float = 0.0
    administrative_responsibility_score: float = 0.0
    raw_ratings: Dict[str, Any] = {}

@app.post("/api/analyze", response_model=AnalysisResponse)
async def analyze_text(request: AnalysisRequest, x_gemini_api_key: Optional[str] = Header(None)):
    text_to_analyze = ""
    
    if request.pdf_url:
        try:
            res = requests.get(request.pdf_url, timeout=15)
            res.raise_for_status()
            doc = fitz.open(stream=res.content, filetype="pdf")
            extracted = []
            for page in doc[:15]:  # read up to 15 pages
                extracted.append(page.get_text())
            text_to_analyze = "\n".join(extracted)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Błąd pobierania PDF: {str(e)}")
    elif request.text:
        text_to_analyze = request.text
        
    if not text_to_analyze.strip():
        raise HTTPException(status_code=400, detail="Tekst wejściowy lub zawartość PDF nie może być pusta.")
        
    # Determine API key: first check Request body, then Header, then environment
    api_key = request.api_key or x_gemini_api_key or os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        raise HTTPException(
            status_code=401, 
            detail="Brak klucza API Gemini. Przekaż go w polu 'api_key' żądania, nagłówku 'X-Gemini-API-Key' lub ustaw zmienną środowiskową GEMINI_API_KEY w serwerze."
        )
        
    try:
        # Run analysis
        result = analyzer.analyze_sample(text_to_analyze, api_key=api_key, target_indices=request.target_indices)
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Błąd analizy: {str(e)}")

@app.get("/api/health")
async def health_check():
    rag_status = rag.get_index_status()
    return {
        "status": "ok",
        "indices_count": len(os.listdir(analyzer.config.INDICES_DIR)) if os.path.exists(analyzer.config.INDICES_DIR) else 0,
        "rag_indexed_files": rag_status.get("indexed_files", 0),
        "rag_total_chunks": rag_status.get("total_chunks", 0)
    }

@app.post("/api/index-books")
async def index_books(background_tasks: BackgroundTasks, force: bool = False):
    """Triggers indexing of all PDF books into ChromaDB. Runs in the background."""
    def do_index():
        print("=== Rozpoczynam indeksowanie ksiąg Konecznego ===")
        stats = rag.build_index(force=force)
        print(f"=== Indeksowanie zakończone: {stats} ===")
    
    background_tasks.add_task(do_index)
    return {
        "message": "Indeksowanie uruchomione w tle. Sprawdź /api/health aby zobaczyć postęp.",
        "books_dir": rag.BOOKS_DIR
    }

@app.get("/api/rag-status")
async def rag_status():
    """Returns current status of the RAG book index."""
    return rag.get_index_status()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8005, reload=True)
