import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.analyzer import calculate_koneczny_metrics, get_indices_context

client = TestClient(app)

def test_fastapi_health_endpoint():
    """Test 1: GET /api/health endpoint returns 200 OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "ok"

def test_indices_context_loader():
    """Test 2: Verify index files are cached and loaded into memory."""
    context = get_indices_context()
    assert isinstance(context, str)
    assert len(context) > 100

def test_calculate_koneczny_metrics_math():
    """Test 3: Math averaging for scores and handling of missing (-1.0) values."""
    mock_llm_data = {
        "conscience_status_scores": {
            "no_statutory_morality_only": {"score": 1.0, "explanation": "Test explanation", "news_examples": ["Ex 1", "Ex 2", "Ex 3"]},
            "conscience_as_supreme_judge": {"score": 0.8, "explanation": "Test explanation", "news_examples": ["Ex 1", "Ex 2", "Ex 3"]},
            "missing_indicator": {"score": -1.0, "explanation": "No data", "news_examples": []}
        }
    }
    result = calculate_koneczny_metrics(mock_llm_data)
    assert result["conscience_autonomous_score"] == 0.9

def test_duty_source_and_motivation_scores():
    """Test 4: Duty Source & Motivation score calculations."""
    mock_llm_data = {
        "duty_source_scores": {
            "ethics_over_law": {"score": 1.0},
            "voluntary_action": {"score": 0.8}
        },
        "motivation_scores": {
            "truth_for_truth_sake": {"score": 0.9},
            "altruistic_faith": {"score": 0.7}
        }
    }
    result = calculate_koneczny_metrics(mock_llm_data)
    assert result["duty_source_personalistic_score"] == 0.9
    assert result["motivation_altruism_score"] == 0.8

def test_justice_nature_scores():
    """Test 5: Justice Nature score calculation."""
    mock_llm_data = {
        "justice_nature_scores": {
            "equity_over_letter": {"score": 1.0},
            "judge_conscience_role": {"score": 0.8}
        }
    }
    result = calculate_koneczny_metrics(mock_llm_data)
    assert result["justice_equity_score"] == 0.9

def test_generalia_coherence_and_poisonous_mixture_alert():
    """Test 6: Generalia 7 ethical unknowns coherence score and poisonous mixture alert."""
    # Test Personalistic dominance (sum >= 6.0)
    mock_llm_personalistic = {
        "generalia_scores": {f"gen_{i}": {"score": 1.0} for i in range(7)}
    }
    res_pers = calculate_koneczny_metrics(mock_llm_personalistic)
    assert res_pers["ethical_coherence_score"] == 7.0
    assert res_pers["mixture_alert"] is False
    assert "Personalistycznego" in res_pers["generalia_diagnosis"]

    # Test Poisonous Mixture Alert (sum between 2.5 and 5.5)
    mock_llm_mixture = {
        "generalia_scores": {
            "gen_0": {"score": 1.0},
            "gen_1": {"score": 1.0},
            "gen_2": {"score": 1.0},
            "gen_3": {"score": 1.0},
            "gen_4": {"score": 0.0},
            "gen_5": {"score": 0.0},
            "gen_6": {"score": 0.0}
        }
    }
    res_mix = calculate_koneczny_metrics(mock_llm_mixture)
    assert res_mix["ethical_coherence_score"] == 4.0
    assert res_mix["mixture_alert"] is True
    assert "MIESZANKA TRUJĄCA" in res_mix["generalia_diagnosis"]

def test_spirit_supremacy_aggregation():
    """Test 7: Spirit Supremacy score aggregation across 12 sub-indices."""
    mock_llm_data = {
        "legal_dualism_scores": {"ind1": {"score": 1.0}},
        "law_source_pluralism_scores": {"ind1": {"score": 0.8}},
        "aposteriori_apriori_scores": {"ind1": {"score": 0.9}},
        "organism_mechanism_scores": {"ind1": {"score": 0.7}},
        "personalism_scores": {"ind1": {"score": 1.0}},
        "family_law_autonomy_scores": {"ind1": {"score": 0.8}},
        "church_independence_scores": {"ind1": {"score": 0.9}},
        "property_rights_stability_scores": {"ind1": {"score": 0.7}},
        "inheritance_continuity_scores": {"ind1": {"score": 1.0}},
        "morality_supremacy_scores": {"ind1": {"score": 0.8}},
        "public_morality_totality_scores": {"ind1": {"score": 0.9}},
        "administrative_responsibility_scores": {"ind1": {"score": 0.7}}
    }
    result = calculate_koneczny_metrics(mock_llm_data)
    assert result["spirit_supremacy_score"] == 0.85

def test_unchecked_generalia_returns_negative_coherence():
    """Test 8: Unchecked/Missing generalia returns -1.0 for ethical_coherence_score."""
    mock_empty = {}
    result = calculate_koneczny_metrics(mock_empty)
    assert result["ethical_coherence_score"] == -1.0
    assert result["generalia_diagnosis"] == "Brak danych generaliów"

def test_quincunx_hegemony_penalty():
    """Test 9: Verify Hegemony Penalty applies when Goodness is lower than material categories."""
    mock_data = {
        "morality_supremacy_scores": {"ind1": {"score": 0.2}},  # Goodness D = 0.2
        "truth_science_scores": {"ind1": {"score": 0.9}},        # Truth P = 0.9
        "health_scores": {"ind1": {"score": 0.8}},               # Health Z = 0.8
        "work_ethos_scores": {"ind1": {"score": 0.9}},           # Prosperity Db = 0.9
        "beauty_art_scores": {"ind1": {"score": 0.8}}            # Beauty Pi = 0.8
    }
    result = calculate_koneczny_metrics(mock_data)
    assert result["quincunx_categories"]["good"] == 0.2
    assert "ZWICHNIĘCIE PIĘCIOMIANU" in result["quincunx_diagnosis"]

def test_analysis_history_persistence():
    """Test 10: Verify saving analysis runs and calculating cumulative historical averages."""
    from backend import history
    test_url = "https://pl.wikipedia.org/wiki/Test_Konecznego"
    
    # Save first run with Quincunx = 0.70
    mock_res_1 = {"quincunx_coherence_score": 0.70, "ethical_coherence_score": 5.0}
    history.save_analysis(test_url, "Test Title", mock_res_1)
    
    # Save second run with Quincunx = 0.90
    mock_res_2 = {"quincunx_coherence_score": 0.90, "ethical_coherence_score": 6.0}
    history.save_analysis(test_url, "Test Title", mock_res_2)
    
    runs = history.get_history_for_url(test_url)
    assert len(runs) >= 2
    
    stats = history.get_history_stats_for_url(test_url)
    assert stats["total_runs"] >= 2
    assert stats["avg_quincunx"] == 0.80  # (0.70 + 0.90) / 2

def test_civilizational_lie_index_calculation():
    """Test 11: Verify Civilizational Lie Index calculation for high vs low truth samples."""
    # Sample with low truth scores (high lie score)
    mock_totalitarian = {
        "spirit_supremacy_scores": {"ind1": {"score": 0.1}},
        "personalism_scores": {"ind1": {"score": 0.1}},
        "public_morality_totality_scores": {"ind1": {"score": 0.1}},
        "morality_supremacy_scores": {"ind1": {"score": 0.1}}
    }
    res_tot = calculate_koneczny_metrics(mock_totalitarian)
    assert res_tot["civilizational_lie_percentage"] >= 80.0
    assert "KŁAMSTWO FUNDAMENTALNE" in res_tot["civilizational_lie_diagnosis"]

    # Sample with high Latin personalist truth scores (low lie score)
    mock_latin = {
        "spirit_supremacy_scores": {"ind1": {"score": 0.9}},
        "personalism_scores": {"ind1": {"score": 1.0}},
        "public_morality_totality_scores": {"ind1": {"score": 0.9}},
        "morality_supremacy_scores": {"ind1": {"score": 1.0}}
    }
    res_lat = calculate_koneczny_metrics(mock_latin)
    assert res_lat["civilizational_lie_percentage"] <= 15.0
    assert "Civitas Dei" in res_lat["civilizational_lie_diagnosis"]



