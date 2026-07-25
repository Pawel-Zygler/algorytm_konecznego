import sqlite3
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any, List

DB_PATH = os.path.join(os.path.dirname(__file__), "history.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL,
                title TEXT,
                timestamp DATETIME NOT NULL,
                quincunx_score REAL,
                ethical_coherence_score REAL,
                chyznosc_score REAL,
                spirit_score REAL,
                raw_result TEXT
            )
        """)
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_history_url ON analysis_history(url)")
        conn.commit()

# Ensure DB table is initialized on module load
init_db()

def save_analysis(url: str, title: Optional[str], result: Dict[str, Any]) -> int:
    if not url or not url.strip():
        url = "unknown_source"
        
    title = title or "Brak tytułu"
    now = datetime.utcnow().isoformat() + "Z"
    
    quincunx_score = float(result.get("quincunx_coherence_score", -1.0))
    ethical_coherence = float(result.get("ethical_coherence_score", -1.0))
    chyznosc = float(result.get("time_mastery_efficiency_score", -1.0))
    spirit = float(result.get("spirit_supremacy_score", -1.0))
    raw_json = json.dumps(result, ensure_ascii=False)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO analysis_history (
                url, title, timestamp, quincunx_score, ethical_coherence_score, chyznosc_score, spirit_score, raw_result
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (url, title, now, quincunx_score, ethical_coherence, chyznosc, spirit, raw_json))
        conn.commit()
        return cursor.lastrowid

def get_history_for_url(url: str, limit: int = 20) -> List[Dict[str, Any]]:
    if not url:
        return []
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, url, title, timestamp, quincunx_score, ethical_coherence_score, chyznosc_score, spirit_score, raw_result
            FROM analysis_history
            WHERE url = ?
            ORDER BY id DESC
            LIMIT ?
        """, (url, limit))
        rows = cursor.fetchall()
        result = []
        for r in rows:
            item = dict(r)
            try:
                item["raw_result"] = json.loads(item["raw_result"]) if item["raw_result"] else {}
            except Exception:
                item["raw_result"] = {}
            result.append(item)
        return result

def get_history_stats_for_url(url: str) -> Dict[str, Any]:
    if not url:
        return {"total_runs": 0, "avg_quincunx": -1.0, "avg_ethical_coherence": -1.0, "avg_chyznosc": -1.0, "avg_spirit": -1.0}
        
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                COUNT(*) as total_runs,
                AVG(CASE WHEN quincunx_score >= 0 THEN quincunx_score ELSE NULL END) as avg_quincunx,
                AVG(CASE WHEN ethical_coherence_score >= 0 THEN ethical_coherence_score ELSE NULL END) as avg_ethical_coherence,
                AVG(CASE WHEN chyznosc_score >= 0 THEN chyznosc_score ELSE NULL END) as avg_chyznosc,
                AVG(CASE WHEN spirit_score >= 0 THEN spirit_score ELSE NULL END) as avg_spirit
            FROM analysis_history
            WHERE url = ?
        """, (url,))
        row = cursor.fetchone()
        if not row or row["total_runs"] == 0:
            return {"total_runs": 0, "avg_quincunx": -1.0, "avg_ethical_coherence": -1.0, "avg_chyznosc": -1.0, "avg_spirit": -1.0}
            
        return {
            "total_runs": row["total_runs"],
            "avg_quincunx": round(row["avg_quincunx"], 2) if row["avg_quincunx"] is not None else -1.0,
            "avg_ethical_coherence": round(row["avg_ethical_coherence"], 2) if row["avg_ethical_coherence"] is not None else -1.0,
            "avg_chyznosc": round(row["avg_chyznosc"], 2) if row["avg_chyznosc"] is not None else -1.0,
            "avg_spirit": round(row["avg_spirit"], 2) if row["avg_spirit"] is not None else -1.0
        }

def get_all_sources(limit: int = 50) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT url, title, MAX(timestamp) as last_analyzed, COUNT(*) as run_count,
                   AVG(CASE WHEN quincunx_score >= 0 THEN quincunx_score ELSE NULL END) as avg_quincunx
            FROM analysis_history
            GROUP BY url
            ORDER BY last_analyzed DESC
            LIMIT ?
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]
