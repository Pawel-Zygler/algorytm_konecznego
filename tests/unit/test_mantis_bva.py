"""
Unit Tests applying ISTQB Test Design Techniques:
- Boundary Value Analysis (BVA)
- Equivalence Partitioning (EP)

Specifically targeted at the decision thresholds in Mantis AI (Pareto 80/20 decision tree)
in backend.analyzer.analyze_sample_jmantis.
"""

import pytest
from backend import analyzer

def _mock_analyze_sample_with_scores(sac_score=0.0, dual_score=0.0, church_score=0.5, conscience_score=0.5, pers_score=0.5, pub_moral_score=0.5):
    """Helper returning a mock analyze_sample dict with specific scores."""
    return {
        "sacrality_score": sac_score,
        "legal_dualism_score": dual_score,
        "church_independence_score": church_score,
        "conscience_status_score": conscience_score,
        "personalism_score": pers_score,
        "public_morality_totality_score": pub_moral_score,
        "raw_ratings": {},
        "history_stats": {}
    }


class TestMantisBVA:
    """Test suite applying Boundary Value Analysis (BVA) to Mantis classification thresholds."""

    @pytest.mark.unit
    @pytest.mark.parametrize("sac_score,expected_decision_fragment,expected_sacral_flag", [
        # BVA: Threshold is 0.40
        (0.39, "Ścieżka Świecko-Rozumowa", False),
        (0.40, "Ścieżka Sakralna", True),
        (0.41, "Ścieżka Sakralna", True),
        (0.00, "Ścieżka Świecko-Rozumowa", False),
        (1.00, "Ścieżka Sakralna", True),
    ])
    def test_bva_gate_1_sacrality_threshold(self, monkeypatch, sac_score, expected_decision_fragment, expected_sacral_flag):
        """BVA: Tests exact boundary around sacrality_score >= 0.40."""
        mock_data = _mock_analyze_sample_with_scores(sac_score=sac_score, dual_score=0.50)
        monkeypatch.setattr(analyzer, "analyze_sample", lambda *args, **kwargs: mock_data.copy())

        res = analyzer.analyze_sample_jmantis("Tekst testowy", api_key="dummy_key")
        gate_1 = next(g for g in res["mantis_gates"] if g["gate"] == 1)

        assert expected_decision_fragment in gate_1["decision"]
        assert gate_1["score"] == sac_score
        if expected_sacral_flag:
            assert res["primary_civilization"] in ["Arabska / Sakralna", "Żydowska", "Bramińska"]
        else:
            assert res["primary_civilization"] in ["Łacińska", "Bizantyńska", "Turańska", "Chińska"]

    @pytest.mark.unit
    @pytest.mark.parametrize("dual_score,expected_civ,expected_decision_fragment", [
        # BVA on Secular branch: Threshold is dual_score >= 0.48
        (0.47, "Bizantyńska", "Monizm Prawny"),
        (0.48, "Łacińska", "Dualizm Prawny"),
        (0.49, "Łacińska", "Dualizm Prawny"),
        (0.00, "Bizantyńska", "Monizm Prawny"),
        (1.00, "Łacińska", "Dualizm Prawny"),
    ])
    def test_bva_gate_2_legal_dualism_threshold(self, monkeypatch, dual_score, expected_civ, expected_decision_fragment):
        """BVA: Tests exact boundary around legal_dualism_score >= 0.48 on secular branch."""
        # sac_score=0.20 ensures secular path
        mock_data = _mock_analyze_sample_with_scores(sac_score=0.20, dual_score=dual_score, pers_score=0.50, church_score=0.50)
        monkeypatch.setattr(analyzer, "analyze_sample", lambda *args, **kwargs: mock_data.copy())

        res = analyzer.analyze_sample_jmantis("Praworządność i kodeksy", api_key="dummy_key")
        assert res["primary_civilization"] == expected_civ
        gate_2 = next(g for g in res["mantis_gates"] if g["gate"] == 2)
        assert expected_decision_fragment in gate_2["decision"]

    @pytest.mark.unit
    @pytest.mark.parametrize("dual_score,expected_decision_text", [
        # BVA on Sacral branch Gate 5: Threshold is dual_score < 0.35
        (0.34, "Całkowity brak dualizmu świeckiego — Czysty Monizm Teokratyczny"),
        (0.35, "Szczątkowy Dualizm"),
        (0.36, "Szczątkowy Dualizm"),
    ])
    def test_bva_gate_5_sacral_dualism_threshold(self, monkeypatch, dual_score, expected_decision_text):
        """BVA: Tests threshold for theocratic monism vs residual dualism (dual_score < 0.35)."""
        mock_data = _mock_analyze_sample_with_scores(sac_score=0.85, dual_score=dual_score)
        monkeypatch.setattr(analyzer, "analyze_sample", lambda *args, **kwargs: mock_data.copy())

        res = analyzer.analyze_sample_jmantis("Szariat i teokracja", api_key="dummy_key")
        gate_5 = next(g for g in res["mantis_gates"] if g["gate"] == 5)
        assert gate_5["decision"] == expected_decision_text

    @pytest.mark.unit
    @pytest.mark.parametrize("pers_score,church_score,expected_civ", [
        # BVA for Camp Regime (Turanian civilization):
        # is_camp_regime = (pers_score >= 0 and pers_score < 0.25) or (church_score >= 0 and church_score < 0.20 and pers_score < 0.30)
        (0.24, 0.50, "Turańska"),
        (0.25, 0.50, "Bizantyńska"),
        (0.26, 0.50, "Bizantyńska"),
        # church_score condition: church < 0.20 and pers < 0.30
        (0.29, 0.19, "Turańska"),
        (0.29, 0.20, "Bizantyńska"),
        (0.30, 0.19, "Bizantyńska"),
    ])
    def test_bva_turanian_camp_regime_threshold(self, monkeypatch, pers_score, church_score, expected_civ):
        """BVA: Tests exact boundary conditions for Turanian camp regime (ustrój obozowy)."""
        mock_data = _mock_analyze_sample_with_scores(
            sac_score=0.10,
            dual_score=0.30,  # monism
            pers_score=pers_score,
            church_score=church_score
        )
        monkeypatch.setattr(analyzer, "analyze_sample", lambda *args, **kwargs: mock_data.copy())

        res = analyzer.analyze_sample_jmantis("Dyscyplina wojskowa i wódz", api_key="dummy_key")
        assert res["primary_civilization"] == expected_civ


class TestMantisEquivalencePartitioning:
    """Test suite applying Equivalence Partitioning (EP) to civilizational input classes."""

    @pytest.mark.unit
    @pytest.mark.parametrize("missing_score_value", [-1.0, -999.0])
    def test_ep_missing_indicators_handling(self, monkeypatch, missing_score_value):
        """EP (Invalid / Missing partition): Missing scores (-1.0) must not cause runtime crash."""
        mock_data = _mock_analyze_sample_with_scores(
            sac_score=missing_score_value,
            dual_score=missing_score_value,
            church_score=missing_score_value,
            conscience_score=missing_score_value,
            pers_score=missing_score_value
        )
        monkeypatch.setattr(analyzer, "analyze_sample", lambda *args, **kwargs: mock_data.copy())

        # Should fall gracefully into secular / default path without throwing exceptions
        res = analyzer.analyze_sample_jmantis("Tekst bez wskaźników", api_key="dummy_key")
        assert "primary_civilization" in res
        assert len(res["mantis_gates"]) >= 5

