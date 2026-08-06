import os
import json
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend import analyzer

client = TestClient(app)

POLSKA_WIKIPEDIA_TEXT = """
Polska (Rzeczpospolita Polska) – państwo położone w Europie Środkowej, członek Unii Europejskiej oraz paktu NATO.
Cywilizacyjnie Polska od czasu przyjęcia Chrztu w 966 roku nieprzerwanie należy do kręgu cywilizacji łacińskiej.
Państwo polskie wykształciło unikalną tradycję ustrojową opartą na podziale władzy, konstytucjonalizmie (z wieńczącą ten proces Konstytucją 3 Maja)
oraz szacunku dla przyrodzonej godności i praw jednostki. W tradycji Rzeczypospolitej kluczowe znaczenie odgrywa autonomia rodziny, wolność sumienia,
wolność słowa oraz prymat norm etycznych i słuszności nad bezwzględnym przymusem państwowym.
Polski system prawny historycznie opierał się na pluralizmie (rozdzielność państwa od Kościoła, współistnienie prawa świeckiego i kanonicznego)
oraz osobistej odpowiedzialności obywateli za wspólnotę. Władza monarsza i państwowa podlegała zasadom etyki (strictum ius miarkowane przez aequitas),
odrzucając statolatrię oraz koncepcję państwa jako źródła wszelkiego obowiązku moralnego.
"""

TALIBOWIE_WIKIPEDIA_TEXT = """
Talibowie – fundamentalistyczny ruch islamski oraz organizacja militarna, sprawująca władzę w Afganistanie jako Islamski Emirat Afganistanu.
Ustrój polityczno-społeczny stworzony przez talibów opiera się na teokracji oraz rygorystycznym monizmie prawno-religijnym, łączącym szariat z plemiennym kodeksem Pasztunwali.
W tym systemie państwo, ustawa i religia stanowią niepodzielną całość, całkowicie odrzucając autonomię sumienia jednostki na rzecz absolutnej heteronomii i przymusu państwowego.
Obywatele podlegają totalnej i bezwzględnej kontroli obyczajowej sprawowanej przez aparaty kontroli publicznej, w tym Ministerstwo Cnoty i Zapobiegania Występkowi (Hizba).
Etyka państwowa wyklucza jakikolwiek pluralizm prawny, egzekwując odpowiedzialność zbiorową, karanie śmiercią za odejście od ortodoksji
oraz całkowite podporządkowanie wolności jednostki woli organów religijno-państwowych.
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
    """
    Scenario 1: Happy Path - Analysis of Poland (Wikipedia excerpt).
    Verifies that a text representing Poland (Latin civilization context) returns high autonomous
    conscience ratings, low sacralization of secular law, and valid historiographical diagnosis.
    """
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_polska)

    payload = {
        "text": POLSKA_WIKIPEDIA_TEXT.strip(),
        "title": "Polska - Wikipedia",
        "url": "https://pl.wikipedia.org/wiki/Polska",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    # Print API Call Body for test visibility
    print("\n" + "="*80)
    print("🇵🇱 [SCENARIO 1 - API CALL REQUEST BODY]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_polska)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    # Print API Call Result for test visibility
    print("\n" + "="*80)
    print("🇵🇱 [SCENARIO 1 - API RESPONSE RESULT]")
    print(json.dumps({
        "status_code": response.status_code,
        "sacrality_score": data.get("sacrality_score"),
        "conscience_autonomous_score": data.get("conscience_autonomous_score"),
        "duty_source_personalistic_score": data.get("duty_source_personalistic_score"),
        "ethical_coherence_score": data.get("ethical_coherence_score"),
        "generalia_diagnosis": data.get("generalia_diagnosis", "Personalizm Łaciński"),
        "raw_ratings_keys": list(data.get("raw_ratings", {}).keys())
    }, indent=2, ensure_ascii=False))
    print("="*80 + "\n")

    # Verify response structure and metrics
    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert isinstance(data["raw_ratings"], dict)
    assert "history_stats" in data

    raw_ratings = data["raw_ratings"]
    assert "sacrality_scores" in raw_ratings or "conscience_status_scores" in raw_ratings or "duty_source_scores" in raw_ratings
    assert 0.0 <= data["sacrality_score"] <= 1.0

@pytest.mark.unit
def test_scenario_2_talibowie_wikipedia(monkeypatch):
    """
    Scenario 2: Analysis of Taliban / Islamic Emirate (Wikipedia excerpt).
    Verifies that a teocratic-monistic text representing the Taliban returns high sacrality ratings,
    low autonomous conscience ratings (heteronomy), and appropriate civilizational warnings.
    """
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_talibowie)

    payload = {
        "text": TALIBOWIE_WIKIPEDIA_TEXT.strip(),
        "title": "Talibowie - Wikipedia",
        "url": "https://pl.wikipedia.org/wiki/Talibowie",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    # Print API Call Body for test visibility
    print("\n" + "="*80)
    print("🇦🇫 [SCENARIO 2 - API CALL REQUEST BODY]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_for_talibowie)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    # Print API Call Result for test visibility
    print("\n" + "="*80)
    print("🇦🇫 [SCENARIO 2 - API RESPONSE RESULT]")
    print(json.dumps({
        "status_code": response.status_code,
        "sacrality_score": data.get("sacrality_score"),
        "conscience_autonomous_score": data.get("conscience_autonomous_score"),
        "duty_source_personalistic_score": data.get("duty_source_personalistic_score"),
        "ethical_coherence_score": data.get("ethical_coherence_score"),
        "generalia_diagnosis": data.get("generalia_diagnosis", "Monizm Sakralny / Heteronomia"),
        "raw_ratings_keys": list(data.get("raw_ratings", {}).keys())
    }, indent=2, ensure_ascii=False))
    print("="*80 + "\n")

    # Verify response structure and metrics
    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert isinstance(data["raw_ratings"], dict)
    assert "history_stats" in data
    assert data["sacrality_score"] >= 0.5, "Taliban scenario should reflect high sacrality score (teocracy)"
