import os
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend import analyzer

client = TestClient(app)

POLSKA_WIKIPEDIA_TEXT = """
Polska (Rzeczpospolita Polska) – państwo położone w Europie Środkowej, członek Unii Europejskiej i NATO.
Cywilizacyjnie Polska od czasu Chrztu w 966 roku należy do kręgu cywilizacji łacińskiej. Państwo polskie
wykształciło unikalną tradycję ustrojową opartą na podziale władzy, konstytucjonalizmie (Konstytucja 3 Maja)
oraz szacunku dla sprawiedliwości i praw jednostki. W tradycji Rzeczypospolitej kluczowe znaczenie ma
autonomia rodziny, wolność sumienia, wolność słowa oraz wyższość norm etycznych nad przymusem państwowym.
System prawny opiera się na pluralizmie (rozdzielność państwa i Kościoła, autonomia prawa świeckiego i kanonicznego)
oraz odpowiedzialności osobistej obywateli. Władza państwowa podlega słuszności i prawu (strictum ius ograniczane przez aequitas).
"""

TALIBOWIE_WIKIPEDIA_TEXT = """
Talibowie – fundamentalistyczny ruch islamski i organizacja militarna, rządząca Afganistanem jako Islamski Emirat Afganistanu.
Ustrój talibów opiera się na teokracji oraz rygorystycznym monizmie prawno-religijnym, łączącym szariat z kodeksem plemiennym Pasztunwali.
W systemie talibów państwo i religia stanowią niepodzielną całość, odrzucając autonomię sumienia jednostki na rzecz bezwzględnej heteronomii.
Obywatele podlegają totalnej kontroli obyczajowej sprawowanej przez Ministerstwo Cnoty i Zapobiegania Występkowi (Hizba).
Etyka państwowa wyklucza pluralizm prawny, wprowadzając odpowiedzialność zbiorową, karanie śmiercią za odejście od ortodoksji
oraz całkowite podporządkowanie praw jednostki przymusowi organów religijno-państwowych.
"""

def _mock_llm_for_polska(prompt: str, system_instruction: str, api_key: str, schema: dict) -> str:
    """Fast deterministic LLM response for Polska scenario."""
    p_lower = prompt.lower()
    s_str = str(schema)
    if "sacrality" in p_lower or "sakralno" in p_lower or "religious_law_supremacy" in s_str:
        return '{"sacrality_scores": {"religious_law_supremacy": {"score": 0.1, "explanation": "Niska sakralizacja prawa państwowego w Polsce", "news_examples": ["Art 25 Konstytucji RP", "Autonomia Kościoła i Państwa", "Prawo świeckie"]}, "clerical_theocracy": {"score": 0.05, "explanation": "Brak ustroju teokratycznego", "news_examples": ["Podział władz", "Demokracja parlamentarna", "Konstytucjonalizm"]}}}'
    elif "conscience" in p_lower or "sumien" in p_lower or "conscience_as_supreme_judge" in s_str:
        return '{"conscience_status_scores": {"no_statutory_morality_only": {"score": 0.9, "explanation": "Autonomia sumienia nad dekretami władzy", "news_examples": ["Klauzula sumienia", "Ochrona praw człowieka", "Wolność przekonań"]}, "conscience_as_supreme_judge": {"score": 0.95, "explanation": "Sumienie jednostki głównym sędzią", "news_examples": ["Wyroki Trybunału", "Słuszność etyczna", "Autonomia moralna"]}}}'
    elif "duty" in p_lower or "obowiązk" in p_lower or "ethics_over_law" in s_str:
        return '{"duty_source_scores": {"ethics_over_law": {"score": 0.9, "explanation": "Etyka staje przed prawem państwowym", "news_examples": ["Kultura prawna Rzeczypospolitej", "Etos rycerski i obywatelski", "Bezinteresowność"]}}}'
    else:
        return '{"generalia_scores": {"gen_0": {"score": 1.0}, "gen_1": {"score": 1.0}, "gen_2": {"score": 1.0}, "gen_3": {"score": 1.0}, "gen_4": {"score": 1.0}, "gen_5": {"score": 1.0}, "gen_6": {"score": 1.0}}}'

def _mock_llm_for_talibowie(prompt: str, system_instruction: str, api_key: str, schema: dict) -> str:
    """Fast deterministic LLM response for Talibowie scenario."""
    p_lower = prompt.lower()
    s_str = str(schema)
    if "sacrality" in p_lower or "sakralno" in p_lower or "religious_law_supremacy" in s_str:
        return '{"sacrality_scores": {"religious_law_supremacy": {"score": 0.95, "explanation": "Pełna teokracja i podporządkowanie szariatowi", "news_examples": ["Dekrety Ministerstwa Cnoty", "Prawo teokratyczne", "Egzekucje religijne"]}, "clerical_theocracy": {"score": 0.95, "explanation": "Władza duchownych nad instytucjami", "news_examples": ["Rada Mułłów", "Sądy szariackie", "Brak prawa świeckiego"]}}}'
    elif "conscience" in p_lower or "sumien" in p_lower or "conscience_as_supreme_judge" in s_str:
        return '{"conscience_status_scores": {"no_statutory_morality_only": {"score": 0.0, "explanation": "Absolutna heteronomia i zakaz niezależnego sumienia", "news_examples": ["Policja Moralności Hizba", "Kary za heterodoksję", "Przymus religijny"]}, "conscience_as_supreme_judge": {"score": 0.05, "explanation": "Kara za własny osąd etyczny", "news_examples": ["Zakaz krytyki dekretów", "Odpowiedzialność zbiorowa", "Brak prawa oporu"]}}}'
    elif "duty" in p_lower or "obowiązk" in p_lower or "ethics_over_law" in s_str:
        return '{"duty_source_scores": {"ethics_over_law": {"score": 0.05, "explanation": "Przymus zewnętrzny państwowo-religijny", "news_examples": ["Przymusowy dekretyzm", "Heteronomia sprawdzana przez aparat", "Brak dobrowolności"]}}}'
    else:
        return '{"generalia_scores": {"gen_0": {"score": 0.0}, "gen_1": {"score": 0.0}, "gen_2": {"score": 0.0}, "gen_3": {"score": 0.0}, "gen_4": {"score": 0.0}, "gen_5": {"score": 0.0}, "gen_6": {"score": 0.0}}}'

@pytest.mark.unit
def test_scenario_1_happy_path_polska_wikipedia(monkeypatch):
    """Scenario 1: Happy Path - Analysis of Poland (Wikipedia excerpt)."""
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_polska)

    payload = {
        "text": POLSKA_WIKIPEDIA_TEXT,
        "title": "Polska - Wikipedia",
        "url": "https://pl.wikipedia.org/wiki/Polska",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_polska)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    # Verify response structure and metrics
    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert isinstance(data["raw_ratings"], dict)
    assert "history_stats" in data

    # Verify ratings contain evaluated indices
    raw_ratings = data["raw_ratings"]
    assert "sacrality_scores" in raw_ratings or "conscience_status_scores" in raw_ratings or "duty_source_scores" in raw_ratings
    assert 0.0 <= data["sacrality_score"] <= 1.0

@pytest.mark.unit
def test_scenario_2_talibowie_wikipedia(monkeypatch):
    """Scenario 2: Analysis of Taliban / Islamic Emirate (Wikipedia excerpt)."""
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_talibowie)

    payload = {
        "text": TALIBOWIE_WIKIPEDIA_TEXT,
        "title": "Talibowie - Wikipedia",
        "url": "https://pl.wikipedia.org/wiki/Talibowie",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_talibowie)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    # Verify response structure and metrics
    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert isinstance(data["raw_ratings"], dict)
    assert "history_stats" in data

    # Verify sacrality rating for Taliban teocracy
    assert data["sacrality_score"] >= 0.5, "Taliban scenario should reflect high sacrality score (teocracy)"
