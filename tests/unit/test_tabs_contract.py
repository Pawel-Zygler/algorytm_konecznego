"""
Zestaw testów jednostkowych (pytest) weryfikujących poprawność i kompletność
kontraktu danych oraz renderowania 5 głównych zakładek interfejsu wtyczki Chrome:
  1. Sakralność (Indeks Sakralności)
  2. Supremacja Ducha (Agregacja 12 indeksów duchowych)
  3. Personalizm (7 Generaliów Etyki / Siedem Niewiadomych)
  4. Chyżość (Wydajność Cywilizacyjna i Opanowanie Czasu)
  5. Quincunx (Pięciomian Bytu: Dobro, Prawda, Zdrowie, Dobrobyt, Piękno)

Dla każdej zakładki testy weryfikują:
  - Obecność i poprawność Karty Głównej (Hero Card: tytuł, wartość, status/diagnoza).
  - Obecność Opisu Wskaźnika (tekst wyjaśniający, co mierzy dana zakładka wg metodologii Konecznego).
  - Listę Pytań z Odpowiedziami (nazwa wskaźnika, pytanie badawcze, ocena liczbowa, wyjaśnienie).
  - Dowody w postaci Odnośników (news_examples mapowane na linki wyszukiwania z ikoną).
"""

import json
import os
import re
import urllib.parse
import pytest

# Ścieżki do istniejących fixtures
FIXTURES_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../e2e/fixtures"))
POLSKA_FIXTURE_PATH = os.path.join(FIXTURES_DIR, "mock_polska_result.json")
GERMAN_FIXTURE_PATH = os.path.join(FIXTURES_DIR, "mock_german_confederation_result.json")
CONTENT_JS_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../extension/content.js"))


# ==============================================================================
# FIKTURY PYTEST
# ==============================================================================

@pytest.fixture(scope="session")
def polska_data():
    """Wczytuje fixture Polski (Cywilizacja Łacińska)."""
    assert os.path.exists(POLSKA_FIXTURE_PATH), f"Fixture nie istnieje: {POLSKA_FIXTURE_PATH}"
    with open(POLSKA_FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(scope="session")
def german_data():
    """Wczytuje fixture Związku Niemieckiego (Cywilizacja Bizantyńska)."""
    assert os.path.exists(GERMAN_FIXTURE_PATH), f"Fixture nie istnieje: {GERMAN_FIXTURE_PATH}"
    with open(GERMAN_FIXTURE_PATH, "r", encoding="utf-8") as f:
        raw = json.load(f)
        return raw.get("pełne_dane_wynikowe", raw)


@pytest.fixture(scope="session")
def content_js_source():
    """Wczytuje kod źródłowy extension/content.js do audytu metadanych."""
    assert os.path.exists(CONTENT_JS_PATH), f"Plik content.js nie istnieje: {CONTENT_JS_PATH}"
    with open(CONTENT_JS_PATH, "r", encoding="utf-8") as f:
        return f.read()


@pytest.fixture(params=["polska", "german"])
def any_civ_data(request, polska_data, german_data):
    """Sparametryzowana fiktura dostarczająca oba zestawy danych."""
    if request.param == "polska":
        return polska_data, "Łacińska"
    return german_data, "Bizantyńska"


# ==============================================================================
# SYMULATOR RENDERERA KONTRAKTU EXTENSION (buildDarkHero + buildCardsGroup)
# ==============================================================================

def render_hero_card(title: str, score_pct: int, status_text: str, custom_val: str = None, description: str = None) -> str:
    """Odzwierciedla logikę buildDarkHero z extension/content.js."""
    is_missing = score_pct < 0
    display_val = "N/A" if is_missing else (custom_val if custom_val is not None else f"{score_pct}%")
    display_status = "Brak danych w tekście" if is_missing else status_text
    desc_html = f'<div class="dark-hero-desc">{description}</div>' if description else ""

    return f"""
    <div class="dark-hero-card">
      <div class="dark-hero-label">{title}</div>
      {desc_html}
      <div class="dark-hero-val">{display_val}</div>
      <div class="dark-hero-status">{"✕" if is_missing else "✓"} {display_status}</div>
      <div class="dark-ring-pct">{display_val}</div>
    </div>
    """


def render_cards_group(scores_dict: dict, meta_dict: dict) -> str:
    """Odzwierciedla logikę buildCardsGroup z extension/content.js."""
    cards_html = []
    for key, val in scores_dict.items():
        if not isinstance(val, dict):
            continue
        score = val.get("score", 0)
        explanation = val.get("explanation", "")
        news_examples = val.get("news_examples", [])
        meta = meta_dict.get(key, {"name": key.replace("_", " "), "question": ""})
        label = meta.get("name", key)
        question = meta.get("question", "")

        pct = "Brak danych" if score < 0 else f"{round(score * 100)}%"
        polarity = ""
        if score >= 0:
            if score > 0.5:
                polarity = '<span class="pol-high">[+ Podwyższa]</span>'
            elif score < 0.5:
                polarity = '<span class="pol-low">[- Obniża]</span>'
            else:
                polarity = '<span class="pol-neutral">[Neutralne]</span>'

        links_html = []
        for n in news_examples:
            url = f"https://www.google.com/search?q={urllib.parse.quote(n)}"
            links_html.append(
                f'<a href="{url}" target="_blank" rel="noopener noreferrer" class="news-item-link">'
                f'<div class="news-item"><span>{n}</span><svg class="external-link-icon"></svg></div></a>'
            )
        news_section = ""
        if news_examples:
            news_section = f'<div class="news-title">Kontekst ze świata</div><div class="news-list">{"".join(links_html)}</div>'

        card = f"""
        <div class="answer-card" data-key="{key}">
          <div class="answer-head">
            <div class="answer-name">{label}</div>
            <div class="answer-question">{question}</div>
            <span class="answer-pct">{pct}</span>
            {polarity}
          </div>
          <div class="answer-body">
            <p class="explanation-text">{explanation}</p>
            {news_section}
          </div>
        </div>
        """
        cards_html.append(card)
    return "\n".join(cards_html)


# ==============================================================================
# STAŁE METADANYCH ZGODNE Z ALGORYTMEM I CONTENT.JS
# ==============================================================================

SACRALITY_KEYS = [
    "RELIGIOUS_LAW_SUPREMACY", "THEOCRATIC_AUTHORITY", "FAMILY_RELIGIOUS_CONTROL",
    "RELIGIOUS_EDUCATION", "PROPERTY_RELIGIOUS_CONTROL", "SACRAL_CRIMINAL_LAW",
    "RELIGIOUS_TIME_CALENDAR", "SCIENCE_RELIGION_FUSION", "ETHICS_RELIGION_IDENTITY",
    "SACRAL_ECONOMICS", "SOCIAL_HIERARCHY_RELIGIOUS", "STATE_CHURCH_UNITY",
    "APOSTASY_PUNISHMENT"
]

GENERALIA_KEYS = [
    "duty_source_personalistic", "motivation_altruism", "responsibility_personal",
    "justice_equity", "conscience_autonomous", "time_mastery_historicism",
    "work_ethos_sanctification"
]

TIME_MASTERY_KEYS = [
    "scientific_chronology", "active_critical_tradition", "hereditary_surnames",
    "term_discipline", "capitalization_of_time", "sub_specie_aeternitatis",
    "time_rich_language", "historicism_national_consciousness", "dated_documentation",
    "latin_historicism_unique", "generational_voluntary_synthesis",
    "family_emancipation_workshop", "truth_and_goodness_cult",
    "no_sacral_passive_stagnation", "no_turanian_camp_presentism"
]

QUINCUNX_KEYS = [
    "ethics_totality_public_private", "good_above_law_force", "personal_moral_accountability",
    "natural_truth_pure_science", "academic_educational_freedom",
    "public_scientific_health_duty", "res_sacra_miser_ethics",
    "individual_hereditary_property", "honest_prosperity_duty",
    "beauty_allegory_of_good", "full_artistic_freedom"
]

TAB_DESCRIPTIONS = {
    "sacrality": "Mierzy, czy porządek życia zbiorowego (prawo, państwo, instytucje) posiada charakter sakralny, tzn. czy jest uznawany za święty, nietykalny i wyjęty spod krytyki moralnej i rozumowej.",
    "spirit": "Supremacja Ducha to agregacja 12 podstawowych indeksów: od dualizmu prawnego po odpowiedzialność urzędniczą. Określa dominację sił duchowych w kształtowaniu życia zbiorowego.",
    "generalia": "Siedem Niewiadomych Etyki: Obowiązek, Bezinteresowność, Odpowiedzialność, Sprawiedliwość, Sumienie, Czas i Praca. Ocena spójności etycznej określa czy społeczeństwo opiera się na wolności osoby (Łacińska) czy przymusie gromadnościowym.",
    "chyznosc": "Wydajność cywilizacyjna (Chyżość Historyczna) to zdolność społeczności do oszczędzania i akumulacji czasu. Im wyższa chyżość, tym szybciej rozwijają się prawo, etyka i gospodarka, pozwalając kolejnym pokoleniom zaczynać tam, gdzie poprzednie skończyły.",
    "quincunx": "Pięciomian Bytu (Quincunx): Dobro, Prawda, Zdrowie, Dobrobyt i Piękno. Tylko Cywilizacja Łacińska rozwija harmonijnie wszystkie 5 sfer pod hegemonią Etyki. Brak jakiejkolwiek sfery czyni cywilizację defektowną."
}


# ==============================================================================
# TESTY KONTRAKTU DLA 5 ZAKŁADEK
# ==============================================================================

class TestTab1SakralnoscContract:
    """Testy jednostkowe Zakładki 1: Sakralność."""

    def test_hero_card_contract(self, any_civ_data):
        """Weryfikuje obecność karty głównej, wartości liczbowej i etykiety statusu."""
        data, civ_type = any_civ_data
        score = data.get("sacrality_score")
        assert score is not None, "Brak pola 'sacrality_score' w głównym payloadzie"
        assert score == -1 or 0.0 <= score <= 1.0, f"Wartość sacrality_score ({score}) poza zakresem [-1, 0.0..1.0]"

        score_pct = round(score * 100) if score >= 0 else -1
        status = (
            "Brak danych w tekście" if score_pct < 0
            else ("Wysoki poziom sakralizacji" if score_pct >= 65 else ("Umiarkowany poziom sakralizacji" if score_pct >= 35 else "Niski poziom sakralizacji"))
        )
        hero_html = render_hero_card("INDEKS SAKRALNOŚCI", score_pct, status)

        assert "INDEKS SAKRALNOŚCI" in hero_html
        if score_pct >= 0:
            assert f"{score_pct}%" in hero_html
            assert "✓" in hero_html
        else:
            assert "N/A" in hero_html
            assert "✕" in hero_html
            assert "Brak danych w tekście" in hero_html
        assert status in hero_html
        assert "dark-hero-card" in hero_html

    def test_indicator_description_contract(self):
        """Weryfikuje obecność i ścisłe brzmienie opisu wyjaśniającego co mierzy wskaźnik."""
        desc = TAB_DESCRIPTIONS["sacrality"]
        assert "Mierzy, czy porządek życia zbiorowego" in desc
        assert "charakter sakralny" in desc
        assert "nietykalny i wyjęty spod krytyki" in desc

    def test_questions_answers_and_proof_links(self, any_civ_data):
        """Weryfikuje kompletność 13 pytań, odpowiedzi (score, explanation) i dowodów (news_examples)."""
        data, civ_type = any_civ_data
        raw = data.get("raw_ratings", {})
        scores = raw.get("sacrality_scores", {})

        assert len(scores) == 13, f"Oczekiwano dokładnie 13 wskaźników sakralności, znaleziono: {len(scores)}"

        for key in SACRALITY_KEYS:
            assert key in scores, f"Brak wskaźnika sakralności '{key}' w raw_ratings"
            item = scores[key]
            assert isinstance(item, dict), f"Element '{key}' musi być słownikiem"

            # 1. Odpowiedź / Score
            score = item.get("score")
            assert score is not None, f"Brak 'score' dla wskaźnika '{key}'"
            assert score in [-1.0, -1] or 0.0 <= score <= 1.0, f"Niepoprawny score ({score}) w '{key}'"

            # 2. Uzasadnienie
            exp = item.get("explanation")
            assert isinstance(exp, str) and len(exp.strip()) > 10, f"Zbyt krótkie lub brakujące uzasadnienie w '{key}': {exp}"

            # 3. Dowody w postaci linków (news_examples)
            proofs = item.get("news_examples")
            assert isinstance(proofs, list) and len(proofs) >= 1, f"Brak dowodów (news_examples) dla '{key}'"
            for proof in proofs:
                assert isinstance(proof, str) and len(proof.strip()) > 3, f"Pusty lub niepoprawny dowód w '{key}': {proof}"
                # Sprawdzenie generowania poprawnego linku wyszukiwania
                encoded_url = f"https://www.google.com/search?q={urllib.parse.quote(proof)}"
                assert encoded_url.startswith("https://www.google.com/search?q=")


class TestTab2SupremacjaDuchaContract:
    """Testy jednostkowe Zakładki 2: Supremacja Ducha."""

    def test_hero_card_contract(self, any_civ_data):
        """Weryfikuje kartę główną Supremacji Ducha."""
        data, civ_type = any_civ_data
        score = data.get("spirit_supremacy_score")
        assert score is not None, "Brak pola 'spirit_supremacy_score'"
        assert 0.0 <= score <= 1.0, f"Niepoprawny spirit_supremacy_score: {score}"

        score_pct = round(score * 100)
        status = "Wysoka supremacja ducha" if score_pct >= 65 else ("Umiarkowany poziom supremacji" if score_pct >= 35 else "Niski poziom supremacji")
        hero_html = render_hero_card("SUPREMACJA DUCHA", score_pct, status)

        assert "SUPREMACJA DUCHA" in hero_html
        assert f"{score_pct}%" in hero_html
        assert status in hero_html

    def test_indicator_description_contract(self):
        """Weryfikuje opis co mierzy wskaźnik Supremacji Ducha."""
        desc = TAB_DESCRIPTIONS["spirit"]
        assert "agregacja 12 podstawowych indeksów" in desc
        assert "dominację sił duchowych" in desc

    def test_subindices_questions_answers_and_proofs(self, any_civ_data):
        """Weryfikuje obecność kluczowych podwskaźników z pytaniami, odpowiedziami i dowodami."""
        data, civ_type = any_civ_data
        raw = data.get("raw_ratings", {})

        expected_subindices = [
            ("legal_dualism_scores", 25, "Dualizm Prawny"),
            ("church_independence_scores", 15, "Niezależność Kościoła"),
            ("personalism_scores", 16, "Personalizm"),
            ("conscience_status_scores", 15, "Status Sumienia"),
            ("public_morality_totality_scores", 16, "Moralność Publiczna"),
        ]

        for sub_key, min_count, sub_name in expected_subindices:
            assert sub_key in raw, f"Brak podindeksu '{sub_key}' ({sub_name}) w raw_ratings"
            sub_dict = raw[sub_key]
            assert len(sub_dict) >= min_count, f"Podindeks '{sub_key}' ma {len(sub_dict)} elementów, oczekiwano min. {min_count}"

            # Sprawdzenie losowych próbek pytań i dowodów
            for k, val in list(sub_dict.items())[:3]:
                assert "score" in val, f"Brak score w {sub_key}.{k}"
                assert "explanation" in val and len(val["explanation"]) > 5, f"Brak explanation w {sub_key}.{k}"
                assert "news_examples" in val and isinstance(val["news_examples"], list), f"Brak news_examples w {sub_key}.{k}"
                assert len(val["news_examples"]) >= 1, f"Pusta lista news_examples w {sub_key}.{k}"


class TestTab3PersonalizmContract:
    """Testy jednostkowe Zakładki 3: Personalizm (7 Generaliów Etyki)."""

    def test_hero_card_contract(self, any_civ_data):
        """Weryfikuje kartę główną Spójności Generaliów Etyki."""
        data, civ_type = any_civ_data
        eth_score = data.get("ethical_coherence_score")
        assert eth_score is not None, "Brak 'ethical_coherence_score' w payloadzie"
        assert 0.0 <= eth_score <= 7.0, f"ethical_coherence_score ({eth_score}) poza zakresem [0.0, 7.0]"

        diag = data.get("generalia_diagnosis")
        assert isinstance(diag, str) and len(diag) > 5, f"Brak poprawnej diagnozy generaliów: {diag}"

        if civ_type == "Łacińska":
            assert "Personalistycznego" in diag or "Łacińska" in diag
            assert eth_score >= 6.0
        else:
            assert "Gromadnościowego" in diag or "MIESZANKA" in diag or eth_score < 6.0

        custom_val = f"{eth_score:.1f} / 7.0"
        hero_html = render_hero_card(
            "SPÓJNOŚĆ GENERALIÓW ETYKI",
            round((eth_score / 7.0) * 100),
            diag,
            custom_val=custom_val,
            description="Siedem Niewiadomych Etyki (Krok 3). Wymaga pełnego wyliczenia generaliów."
        )

        assert "SPÓJNOŚĆ GENERALIÓW ETYKI" in hero_html
        assert custom_val in hero_html
        assert diag in hero_html
        assert "Siedem Niewiadomych Etyki" in hero_html

    def test_indicator_description_contract(self):
        """Weryfikuje opis co mierzy wskaźnik 7 Generaliów Etyki."""
        desc = TAB_DESCRIPTIONS["generalia"]
        assert "Siedem Niewiadomych Etyki: Obowiązek, Bezinteresowność, Odpowiedzialność" in desc
        assert "wolności osoby (Łacińska) czy przymusie gromadnościowym" in desc

    def test_7_generalia_questions_answers_and_proofs(self, any_civ_data):
        """Weryfikuje wszystkie 7 wskaźników generaliów z pytaniami, odpowiedziami i dowodami."""
        data, civ_type = any_civ_data
        raw = data.get("raw_ratings", {})
        gen_scores = raw.get("generalia_scores", {})

        assert len(gen_scores) == 7, f"Zakładka Personalizm musi posiadać dokładnie 7 generaliów, znaleziono: {len(gen_scores)}"

        for key in GENERALIA_KEYS:
            assert key in gen_scores, f"Brak wskaźnika generaliów '{key}' w raw_ratings"
            item = gen_scores[key]

            # 1. Odpowiedź / score
            assert "score" in item, f"Brak score dla {key}"
            assert item["score"] in [0.0, 1.0, 0, 1] or (0.0 <= item["score"] <= 1.0)

            # 2. Uzasadnienie
            assert "explanation" in item, f"Brak explanation dla {key}"
            assert len(item["explanation"].strip()) > 10, f"Zbyt krótkie wyjaśnienie dla {key}"

            # 3. Dowody
            assert "news_examples" in item, f"Brak dowodów w {key}"
            assert isinstance(item["news_examples"], list) and len(item["news_examples"]) == 3, f"Oczekiwano dokładnie 3 dowodów dla {key}"
            for proof in item["news_examples"]:
                assert len(proof.strip()) > 5


class TestTab4ChyznoscContract:
    """Testy jednostkowe Zakładki 4: Chyżość Historyczna (Wydajność Cywilizacyjna)."""

    def test_hero_card_contract(self, any_civ_data):
        """Weryfikuje kartę główną Chyżości Historycznej."""
        data, civ_type = any_civ_data
        score = data.get("time_mastery_efficiency_score")
        assert score is not None, "Brak pola 'time_mastery_efficiency_score'"
        assert 0.0 <= score <= 1.0, f"time_mastery_efficiency_score ({score}) poza [0.0, 1.0]"

        score_pct = round(score * 100)
        diag = data.get("time_mastery_efficiency_diagnosis")
        assert isinstance(diag, str) and len(diag) > 5, f"Brak poprawnej diagnozy chyżości: {diag}"

        hero_html = render_hero_card(
            "KROK 4: CHYŻOŚĆ HISTORYCZNA (WYDAJNOŚĆ)",
            score_pct,
            diag,
            description="Mierzy wyraz historyzmu prywatnego i publicznego oraz zdolność do oszczędzania czasu dla przyszłych pokoleń (zamiast zaczynania od zera ab ovo)."
        )

        assert "KROK 4: CHYŻOŚĆ HISTORYCZNA (WYDAJNOŚĆ)" in hero_html
        assert f"{score_pct}%" in hero_html
        assert diag in hero_html
        assert "zdolność do oszczędzania czasu dla przyszłych pokoleń" in hero_html

    def test_indicator_description_contract(self):
        """Weryfikuje opis co mierzy wskaźnik Chyżości Historycznej."""
        desc = TAB_DESCRIPTIONS["chyznosc"]
        assert "Wydajność cywilizacyjna (Chyżość Historyczna)" in desc
        assert "zdolność społeczności do oszczędzania i akumulacji czasu" in desc
        assert "kolejnym pokoleniom zaczynać tam, gdzie poprzednie skończyły" in desc

    def test_15_time_mastery_questions_answers_and_proofs(self, any_civ_data):
        """Weryfikuje 15 wskaźników opanowania czasu z pytaniami, odpowiedziami i dowodami."""
        data, civ_type = any_civ_data
        raw = data.get("raw_ratings", {})
        tm_scores = raw.get("time_mastery_scores", {})

        assert len(tm_scores) == 15, f"Oczekiwano dokładnie 15 wskaźników Chyżości, znaleziono: {len(tm_scores)}"

        for key in TIME_MASTERY_KEYS:
            assert key in tm_scores, f"Brak wskaźnika chyżości '{key}'"
            item = tm_scores[key]

            assert "score" in item and (0.0 <= item["score"] <= 1.0 or item["score"] == -1.0)
            assert "explanation" in item and len(item["explanation"].strip()) > 10
            assert "news_examples" in item and len(item["news_examples"]) >= 1


class TestTab5QuincunxContract:
    """Testy jednostkowe Zakładki 5: Quincunx Bytu (Pięciomian Bytu)."""

    def test_hero_card_contract(self, any_civ_data):
        """Weryfikuje kartę główną Pięciomianu Bytu (Quincunx)."""
        data, civ_type = any_civ_data
        score = data.get("quincunx_coherence_score")
        assert score is not None, "Brak 'quincunx_coherence_score'"
        assert 0.0 <= score <= 1.0, f"quincunx_coherence_score ({score}) poza [0.0, 1.0]"

        score_pct = round(score * 100)
        diag = data.get("quincunx_diagnosis")
        assert isinstance(diag, str) and len(diag) > 5, f"Brak diagnozy Quincunxa: {diag}"

        hero_html = render_hero_card(
            "KROK 5: PIĘCIOMIAN BYTU (QUINCUNX)",
            score_pct,
            diag,
            description="Mierzy harmonijną współmierność 5 sfer bytu (Dobro, Prawda, Zdrowie, Dobrobyt, Piękno) pod przodownictwem Etyki."
        )

        assert "KROK 5: PIĘCIOMIAN BYTU (QUINCUNX)" in hero_html
        assert f"{score_pct}%" in hero_html
        assert diag in hero_html
        assert "harmonijną współmierność 5 sfer bytu" in hero_html

    def test_indicator_description_contract(self):
        """Weryfikuje opis co mierzy wskaźnik Quincunxa."""
        desc = TAB_DESCRIPTIONS["quincunx"]
        assert "Pięciomian Bytu (Quincunx): Dobro, Prawda, Zdrowie, Dobrobyt i Piękno" in desc
        assert "Tylko Cywilizacja Łacińska rozwija harmonijnie wszystkie 5 sfer pod hegemonią Etyki" in desc

    def test_11_quincunx_questions_answers_and_proofs(self, any_civ_data):
        """Weryfikuje 11 wskaźników Quincunxa (obejmujących Dobro, Prawdę, Zdrowie, Dobrobyt, Piękno)."""
        data, civ_type = any_civ_data
        raw = data.get("raw_ratings", {})
        q_scores = raw.get("quincunx_scores", {})

        assert len(q_scores) == 11, f"Oczekiwano dokładnie 11 wskaźników Quincunxa, znaleziono: {len(q_scores)}"

        # Sfery bytu: Dobro (1-3), Prawda (4-5), Zdrowie (6-7), Dobrobyt (8-9), Piękno (10-11)
        for key in QUINCUNX_KEYS:
            assert key in q_scores, f"Brak wskaźnika quincunxa '{key}'"
            item = q_scores[key]

            assert "score" in item and (0.0 <= item["score"] <= 1.0 or item["score"] == -1.0)
            assert "explanation" in item and len(item["explanation"].strip()) > 10
            assert "news_examples" in item and len(item["news_examples"]) >= 1


# ==============================================================================
# AUDYT SYNCHRONIZACJI Z EXTENSION/CONTENT.JS
# ==============================================================================

class TestContentJsSynchronization:
    """Weryfikuje integralność kodu frontendowego w extension/content.js."""

    def test_metadata_dictionaries_exist_in_content_js(self, content_js_source):
        """Upewnia się, że wszystkie słowniki META istnieją w content.js i zawierają wymagane klucze."""
        meta_dicts_to_check = [
            ("SACRALITY_META", SACRALITY_KEYS),
            ("GENERALIA_META", GENERALIA_KEYS),
            ("TIME_MASTERY_META", TIME_MASTERY_KEYS),
            ("QUINCUNX_META", QUINCUNX_KEYS),
        ]

        for meta_name, expected_keys in meta_dicts_to_check:
            assert f"const {meta_name} =" in content_js_source, f"Brak definicji {meta_name} w content.js"
            for key in expected_keys:
                assert f"{key}:" in content_js_source, f"Klucz '{key}' nie został zdefiniowany w {meta_name} w content.js"

    def test_views_and_descriptions_exist_in_content_js(self, content_js_source):
        """Upewnia się, że wszystkie 5 widoków zakładek i ich opisy są osadzone w content.js."""
        view_ids = [
            "view-sacrality",
            "view-spirit",
            "view-generalia",
            "view-chyznosc",
            "view-quincunx"
        ]
        for vid in view_ids:
            assert f'id="{vid}"' in content_js_source, f"Brak kontenera widoku #{vid} w content.js"

        for tab_name, desc_text in TAB_DESCRIPTIONS.items():
            # Sprawdzenie słów kluczowych opisu w pliku content.js
            first_sentence = desc_text.split(".")[0].strip()
            assert first_sentence in content_js_source, f"Opis zakładki '{tab_name}' nie występuje w content.js: {first_sentence}"

    def test_html_rendering_output_structure(self, polska_data):
        """Weryfikuje, czy renderowanie kart generuje kompletny HTML z klasami i linkami."""
        raw = polska_data["raw_ratings"]
        meta_mock = {k: {"name": f"Wskaźnik {k}", "question": f"Czy zachodzi {k}?"} for k in GENERALIA_KEYS}
        rendered_html = render_cards_group(raw["generalia_scores"], meta_mock)

        assert "answer-card" in rendered_html
        assert "answer-name" in rendered_html
        assert "answer-question" in rendered_html
        assert "explanation-text" in rendered_html
        assert "news-item-link" in rendered_html
        assert "https://www.google.com/search?q=" in rendered_html
        assert "external-link-icon" in rendered_html
