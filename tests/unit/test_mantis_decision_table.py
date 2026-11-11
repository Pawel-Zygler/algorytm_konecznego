"""
Decision Table Tests (Tabele Decyzyjne) for Mantis AI Engine & API Contract.
Implements ISTQB Specification-based technique: Decision Table Testing.

Covers all 7 civilizational outcomes across the 6 sequential gates of Mantis AI:
1. Łacińska (Latin)
2. Bizantyńska (Byzantine)
3. Turańska (Turanian)
4. Chińska (Chinese)
5. Arabska / Sakralna (Arab / Islamic)
6. Żydowska (Jewish)
7. Bramińska (Brahminic)
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend import analyzer

client = TestClient(app)

# ==============================================================================
# DECISION TABLE MATRIX
# ==============================================================================
# Columns:
# 1. rule_id
# 2. text_sample
# 3. sacrality_score
# 4. legal_dualism_score
# 5. church_score
# 6. conscience_score
# 7. personalism_score
# 8. expected_civ
# 9. expected_diagnosis_fragment
# ==============================================================================
DECISION_TABLE_MANTIS = [
    (
        "R1_LATIN",
        "Polska Rzeczpospolita, rządy prawa, personalizm chrześcijański",
        0.15, 0.85, 0.80, 0.90, 0.90,
        "Łacińska",
        "personalistycznych"
    ),
    (
        "R2_BYZANTINE",
        "Cesarstwo Bizantyńskie, etatyzm, biurokracja urzędnicza, prymat państwa",
        0.25, 0.20, 0.15, 0.20, 0.50,
        "Bizantyńska",
        "Cezaropapizm"
    ),
    (
        "R3_TURANIAN",
        "Horda mongolska, ordy, bezwzględne posłuszeństwo wodzowi, brak własności",
        0.10, 0.10, 0.05, 0.05, 0.15,
        "Turańska",
        "Ustrój obozowy"
    ),
    (
        "R4_CHINESE",
        "Państwo Środka Chiny, Konfucjusz, rytuał Li, kult przodków, aczasowość",
        0.10, 0.20, 0.30, 0.40, 0.40,
        "Chińska",
        "Konfucjanizm"
    ),
    (
        "R5_ARAB_ISLAMIC",
        "Kalifat Abbasydów, prawo szariatu, koraniczny monizm prawny, teokracja",
        0.90, 0.05, 0.05, 0.10, 0.30,
        "Arabska / Sakralna",
        "Teokracja, Szariat"
    ),
    (
        "R6_JEWISH",
        "Tradycja talmudyczna Izraela, Tora, halacha, kazuistyka rodowa, prawo Mojżeszowe",
        0.85, 0.10, 0.10, 0.40, 0.50,
        "Żydowska",
        "kazuistyka talmudyczna"
    ),
    (
        "R7_BRAHMINIC",
        "Cywilizacja indyjska, kasty, braminizm, prawo Manu, sanskryt, karma i reinkarnacja",
        0.92, 0.10, 0.10, 0.20, 0.20,
        "Bramińska",
        "Kastowo-Rytualny"
    ),
]


class TestMantisDecisionTable:
    """Full decision table verification for Mantis 80/20 decision tree."""

    @pytest.mark.unit
    @pytest.mark.parametrize(
        "rule_id,text_sample,sac_score,dual_score,church_score,conscience_score,pers_score,expected_civ,expected_diag",
        DECISION_TABLE_MANTIS
    )
    def test_decision_table_all_7_civilizations(
        self, monkeypatch, rule_id, text_sample, sac_score, dual_score, church_score,
        conscience_score, pers_score, expected_civ, expected_diag
    ):
        """Decision Table: Verifies each civilizational path of the tree with mocked indicator vector."""
        mock_indicators = {
            "sacrality_score": sac_score,
            "legal_dualism_score": dual_score,
            "church_independence_score": church_score,
            "conscience_status_score": conscience_score,
            "personalism_score": pers_score,
            "public_morality_totality_score": 0.5,
            "raw_ratings": {},
            "history_stats": {}
        }
        monkeypatch.setattr(analyzer, "analyze_sample", lambda *args, **kwargs: mock_indicators.copy())

        res = analyzer.analyze_sample_jmantis(text_sample, api_key="test_api_key")

        assert res["primary_civilization"] == expected_civ, f"Failed on rule {rule_id}: expected {expected_civ}, got {res['primary_civilization']}"
        assert expected_diag.lower() in res["civilization_diagnosis"].lower(), f"Diagnosis missing '{expected_diag}' in {res['civilization_diagnosis']}"
        assert len(res["mantis_gates"]) >= 5


class TestApiContractBVA:
    """Tests input contract boundaries (BVA) for FastAPI endpoint /api/analyze."""

    @pytest.mark.unit
    def test_empty_request_body_returns_400(self):
        """BVA (Empty input): Request with neither text, url, nor pdf_url must fail with 400 Bad Request."""
        response = client.post("/api/analyze", json={})
        assert response.status_code == 400
        assert "nie może być pusty" in response.json().get("detail", "")

    @pytest.mark.unit
    def test_blank_whitespace_text_returns_400(self):
        """BVA (Whitespace-only text): Request with '   ' must return 400."""
        response = client.post("/api/analyze", json={"text": "   \n\t  "})
        assert response.status_code == 400
        assert "nie może być pusty" in response.json().get("detail", "")

    @pytest.mark.unit
    def test_missing_api_key_returns_401(self, monkeypatch):
        """Security/Contract: When no GEMINI_API_KEY exists in env/request, returns 401 Unauthorized."""
        monkeypatch.setenv("GEMINI_API_KEY", "")
        monkeypatch.setattr(analyzer.config, "GEMINI_API_KEY", "")
        response = client.post("/api/analyze", json={"text": "Krótki tekst testowy", "api_key": ""})
        assert response.status_code == 401
        assert "Brak klucza API Gemini" in response.json().get("detail", "")
