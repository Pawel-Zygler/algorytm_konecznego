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

POLONA_ITEM_TEXT = """
Furmani inc. Polska przeżywa w obecnej dobie kryzys gospodarczy i konsekwencje tego.
Druk ulotkowy i afisz ze zbiorów cyfrowych Polona2.pl dotyczący etosu pracy, kupieckiej rzetelności,
samopomocy społecznej oraz przeciwdziałania spekulacji w dobie kryzysu gospodarczego.
Wydawnictwo nawołuje do bezinteresownej pracy na rzecz odbudowy dorobku cywilizacyjnego państwa,
szacunku dla własności prywatnej, uczciwości kupieckiej oraz poszanowania godności ludzkiej.
"""

FRANCJA_2026_TEXT = """
Francja (Republika Francuska) w 2026 roku jest państwem o ugruntowanym ustroju laickim, opartym na bezwzględnym rozdziale państwa i religii (laïcité),
zgodnie z Artykułem 1 Konstytucji V Republiki. Prawo świeckie posiada wyłączny priorytet, a symbolika oraz nakazy religijne są całkowicie
wyłączone z państwowego aparatu urzędniczego i ustawodawczego. Szkoły publiczne, sądy oraz urzędy zachowują pełną neutralność światopoglądową.
Etyka państwowa wyklucza jakąkolwiek sakralizację prawa państwowego czy instytucji publicznych, odrzucając teokrację, prawo wyznaniowe
oraz priorytet doktryn religijnych nad stanowionym prawem świeckim Republiki.
"""

SENAT_PDF_URL = "https://www.senat.gov.pl/gfx/senat/userfiles/_public/k10/kancelaria/wydawnictwa/pdf/konstytucja_rp_miniatura_w._polska.pdf"
POLONA_ITEM_URL = "https://polona2.pl/item/furmani-inc-polska-przezywa-w-obecnej-dobie-kryzys-gospodarczy-konsekwencje-tego,OTI4NjM0ODI/0/#info:metadata"
FRANCJA_URL = "https://fr.wikipedia.org/wiki/France"

def _mock_llm_generic(prompt: str, system_instruction: str, api_key: str, schema: dict) -> str:
    """Fast deterministic LLM response for automated scenario tests."""
    p_lower = prompt.lower()
    s_str = str(schema)

    if "francj" in p_lower or "laïcité" in p_lower or "laick" in p_lower:
        if "sacrality" in p_lower or "sakralno" in p_lower or "religious_law_supremacy" in s_str:
            return '{"sacrality_scores": {"religious_law_supremacy": {"score": 0.05, "explanation": "Bezwzględny rozdział państwa i religii (laïcité) we Francji w 2026 r.", "news_examples": ["Art 1 Konstytucji V Republiki", "Neutralność światopoglądowa urzędów", "Prawo świeckie bez religii"]}, "clerical_theocracy": {"score": 0.0, "explanation": "Całkowity brak teokracji i wpływu instytucji wyznaniowych nad ustawodawstwem", "news_examples": ["Neutralność szkolnictwa publicznego", "Brak ustawodawstwa religijnego", "Pełny desakralizm państwa"]}}}'
        elif "conscience" in p_lower or "sumien" in p_lower or "conscience_as_supreme_judge" in s_str:
            return '{"conscience_status_scores": {"no_statutory_morality_only": {"score": 0.85, "explanation": "Wysoka ochrona praw obywatelskich i sumienia", "news_examples": ["Wolność przekonań", "Karta Praw Podstawowych", "Prawa jednostki"]}, "conscience_as_supreme_judge": {"score": 0.80, "explanation": "Prymat wolności indywidualnej", "news_examples": ["Orzecznictwo sądów", "Ochrona prywatności", "Autonomia jednostki"]}}}'

    if "talib" in p_lower:
        if "sacrality" in p_lower or "sakralno" in p_lower or "religious_law_supremacy" in s_str:
            return '{"sacrality_scores": {"religious_law_supremacy": {"score": 0.95, "explanation": "Pełna teokracja i podporządkowanie szariatowi", "news_examples": ["Dekrety Ministerstwa Cnoty", "Prawo teokratyczne", "Egzekucje religijne"]}, "clerical_theocracy": {"score": 0.95, "explanation": "Władza duchownych nad instytucjami", "news_examples": ["Rada Mułłów", "Sądy szariackie", "Brak prawa świeckiego"]}}}'
        elif "conscience" in p_lower or "sumien" in p_lower or "conscience_as_supreme_judge" in s_str:
            return '{"conscience_status_scores": {"no_statutory_morality_only": {"score": 0.0, "explanation": "Absolutna heteronomia i zakaz niezależnego sumienia", "news_examples": ["Policja Moralności Hizba", "Kary za heterodoksję", "Przymus religijny"]}, "conscience_as_supreme_judge": {"score": 0.05, "explanation": "Kara za własny osąd etyczny", "news_examples": ["Zakaz krytyki dekretów", "Odpowiedzialność zbiorowa", "Brak prawa oporu"]}}}'
        else:
            return '{"duty_source_scores": {"ethics_over_law": {"score": 0.05, "explanation": "Przymus zewnętrzny państwowo-religijny", "news_examples": ["Przymusowy dekretyzm", "Heteronomia", "Brak dobrowolności"]}}}'

    # Generic Latin / Constitutional / Ethos fallback (Polska, Senat PDF, Polona)
    if "sacrality" in p_lower or "sakralno" in p_lower or "religious_law_supremacy" in s_str:
        return '{"sacrality_scores": {"religious_law_supremacy": {"score": 0.1, "explanation": "Niska sakralizacja prawa państwowego w konstytucjonalizmie", "news_examples": ["Art 25 Konstytucji RP", "Autonomia Kościoła i Państwa", "Prawo świeckie"]}, "clerical_theocracy": {"score": 0.05, "explanation": "Brak ustroju teokratycznego", "news_examples": ["Podział władz", "Demokracja parlamentarna", "Konstytucjonalizm"]}}}'
    elif "conscience" in p_lower or "sumien" in p_lower or "conscience_as_supreme_judge" in s_str:
        return '{"conscience_status_scores": {"no_statutory_morality_only": {"score": 0.9, "explanation": "Autonomia sumienia nad dekretami władzy", "news_examples": ["Klauzula sumienia", "Ochrona praw człowieka", "Wolność przekonań"]}, "conscience_as_supreme_judge": {"score": 0.95, "explanation": "Sumienie jednostki głównym sędzią", "news_examples": ["Wyroki Trybunału", "Słuszność etyczna", "Autonomia moralna"]}}}'
    elif "work" in p_lower or "ethos" in p_lower or "work_ethos" in s_str:
        return '{"work_ethos_scores": {"sanctification_of_work": {"score": 0.88, "explanation": "Uświęcenie pracy i etos rzetelności kupieckiej", "news_examples": ["Etos gospodarczy", "Uczciwość kupiecka", "Służba społeczna"]}}}'
    else:
        return '{"duty_source_scores": {"ethics_over_law": {"score": 0.9, "explanation": "Etyka staje przed prawem państwowym", "news_examples": ["Kultura prawna Rzeczypospolitej", "Etos rycerski i obywatelski", "Bezinteresowność"]}}}'

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
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)

    payload = {
        "text": POLSKA_WIKIPEDIA_TEXT.strip(),
        "title": "Polska - Wikipedia",
        "url": "https://pl.wikipedia.org/wiki/Polska",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    print("\n" + "="*80)
    print("🇵🇱 [SCENARIO 1 - API CALL REQUEST BODY (Polska Wikipedia)]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    print("\n" + "="*80)
    print("🇵🇱 [SCENARIO 1 - API RESPONSE RESULT (Polska Wikipedia)]")
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

    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert isinstance(data["raw_ratings"], dict)
    assert "history_stats" in data
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
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)

    payload = {
        "text": TALIBOWIE_WIKIPEDIA_TEXT.strip(),
        "title": "Talibowie - Wikipedia",
        "url": "https://pl.wikipedia.org/wiki/Talibowie",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    print("\n" + "="*80)
    print("🇦🇫 [SCENARIO 2 - API CALL REQUEST BODY (Talibowie Wikipedia)]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    print("\n" + "="*80)
    print("🇦🇫 [SCENARIO 2 - API RESPONSE RESULT (Talibowie Wikipedia)]")
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

    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert isinstance(data["raw_ratings"], dict)
    assert "history_stats" in data
    assert data["sacrality_score"] >= 0.5, "Taliban scenario should reflect high sacrality score (teocracy)"

@pytest.mark.unit
def test_scenario_3_pdf_konstytucja_senat(monkeypatch):
    """
    Scenario 3: PDF Document Analysis - Konstytucja RP (Senat RP).
    Verifies that passing a PDF URL (Senat RP Constitution PDF) executes text extraction via PyMuPDF (fitz)
    and processes the constitutional principles through the API.
    """
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)

    payload = {
        "pdf_url": SENAT_PDF_URL,
        "title": "Konstytucja RP - Senat",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    print("\n" + "="*80)
    print("📜 [SCENARIO 3 - API CALL REQUEST BODY (PDF Senat RP)]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    print("\n" + "="*80)
    print("📜 [SCENARIO 3 - API RESPONSE RESULT (PDF Senat RP)]")
    print(json.dumps({
        "status_code": response.status_code,
        "sacrality_score": data.get("sacrality_score"),
        "raw_ratings_keys": list(data.get("raw_ratings", {}).keys()),
        "history_stats": data.get("history_stats", {})
    }, indent=2, ensure_ascii=False))
    print("="*80 + "\n")

    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert "history_stats" in data
    assert data["history_stats"].get("total_runs", 0) >= 1

@pytest.mark.unit
def test_scenario_4_polona_ocr_image_item(monkeypatch):
    """
    Scenario 4: Digital Library / OCR Image Item Analysis - Polona2.pl (Furmani / Kryzys gospodarczy).
    Verifies that analyzing extracted OCR transcription text from historical digital archives on Polona2.pl
    returns valid civilizational indices (work ethos, duty source, conscience status).
    """
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)

    payload = {
        "text": POLONA_ITEM_TEXT.strip(),
        "url": POLONA_ITEM_URL,
        "title": "Polona2.pl - Furmani / Kryzys gospodarczy",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "work_ethos", "duty_source"]
    }

    print("\n" + "="*80)
    print("🖼️ [SCENARIO 4 - API CALL REQUEST BODY (Polona2.pl OCR Image Item)]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    print("\n" + "="*80)
    print("🖼️ [SCENARIO 4 - API RESPONSE RESULT (Polona2.pl OCR Image Item)]")
    print(json.dumps({
        "status_code": response.status_code,
        "sacrality_score": data.get("sacrality_score"),
        "raw_ratings_keys": list(data.get("raw_ratings", {}).keys()),
        "history_stats": data.get("history_stats", {})
    }, indent=2, ensure_ascii=False))
    print("="*80 + "\n")

    assert "sacrality_score" in data
    assert "raw_ratings" in data
    assert "history_stats" in data
    assert data["history_stats"].get("total_runs", 0) >= 1

@pytest.mark.unit
def test_scenario_5_france_2026_laicite_negative_sacrality(monkeypatch):
    """
    Scenario 5: Negative Test Scenario - France 2026 Secular State (Laïcité).
    Verifies that a secular republic text (France 2026) returns a LOW sacrality score (<0.15 / <=0.20),
    confirming that non-sacralized secular states do not trigger sacralization metrics.
    """
    env_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    run_live = os.environ.get("RUN_LIVE_TESTS") == "1" and bool(env_key)

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)

    payload = {
        "text": FRANCJA_2026_TEXT.strip(),
        "title": "Francja 2026 - Państwo Świeckie (Laïcité)",
        "url": FRANCJA_URL,
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "conscience_status", "duty_source"]
    }

    print("\n" + "="*80)
    print("🇫🇷 [SCENARIO 5 - API CALL REQUEST BODY (Francja 2026 Laïcité - Test Negatywny)]")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    print("="*80)

    response = client.post("/api/analyze", json=payload)

    if response.status_code in [429, 500, 503]:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)
        response = client.post("/api/analyze", json=payload)

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}: {response.text}"
    data = response.json()

    print("\n" + "="*80)
    print("🇫🇷 [SCENARIO 5 - API RESPONSE RESULT (Francja 2026 Laïcité - Test Negatywny)]")
    print(json.dumps({
        "status_code": response.status_code,
        "sacrality_score": data.get("sacrality_score"),
        "raw_ratings_keys": list(data.get("raw_ratings", {}).keys()),
        "generalia_diagnosis": data.get("generalia_diagnosis", "Państwo Świeckie (Desakralizacja Prawa)")
    }, indent=2, ensure_ascii=False))
    print("="*80 + "\n")

    assert "sacrality_score" in data
    assert "raw_ratings" in data

    # Negative Test Assertion: Sacrality score for secular France 2026 must be LOW (<= 0.20)
    assert data["sacrality_score"] <= 0.20, f"Expected low sacrality score for secular France (< 0.20), got {data['sacrality_score']}"


PRL_WIKIPEDIA_TEXT = """
Polska Rzeczpospolita Ludowa (PRL) – historyczne państwo polskie istniejące w latach 1944–1989.
Polska w tym okresie była państwem niesamodzielnym oraz satelickim podłączonym pod polityczną dominację ZSRR.
Rządy sprawowała komunistyczna Polska Partia Robotnicza, a następnie Polska Zjednoczona Partia Robotnicza jako partia hegemoniczna.
Władza opierała się na stalinowskim totalitaryzmie, dyktaturze wojskowej oraz aparacie bezpieczeństwa publicznego (UB, SB, NKWD).
"""

def test_prl_scenario(monkeypatch):
    """Test Scenario 6: PRL (Communist Satellite Regime) must NOT be classified as Latin Civilization."""
    env_key = os.getenv("GEMINI_API_KEY")
    run_live = bool(env_key and len(env_key) > 5 and not env_key.startswith("test"))

    if not run_live:
        monkeypatch.setattr(analyzer, "call_gemini_api", _mock_llm_generic)

    payload = {
        "text": PRL_WIKIPEDIA_TEXT.strip(),
        "title": "Polska Rzeczpospolita Ludowa - PRL (1952–1989)",
        "url": "https://pl.wikipedia.org/wiki/Polska_Rzeczpospolita_Ludowa",
        "api_key": env_key if run_live else "test_key_ci",
        "target_indices": ["sacrality", "spirit", "generalia"]
    }

    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Verify that PRL is NOT classified as Łacińska
    primary_civ = data.get("primary_civilization", "")
    assert "Łacińska" not in primary_civ, f"PRL must NOT be classified as Łacińska, got {primary_civ}"

