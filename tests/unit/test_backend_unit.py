import pytest
from backend.analyzer import calculate_koneczny_metrics

def test_calculate_koneczny_metrics_mock():
    # Mock LLM response dictionary
    mock_llm_data = {
        "conscience_status_scores": {
            "no_statutory_morality_only": {"score": 1.0, "explanation": "Test explanation", "news_examples": ["Ex 1", "Ex 2", "Ex 3"]},
            "conscience_as_supreme_judge": {"score": 0.8, "explanation": "Test explanation", "news_examples": ["Ex 1", "Ex 2", "Ex 3"]}
        },
        "justice_nature_scores": {
            "equity_over_letter": {"score": 0.9, "explanation": "Test", "news_examples": ["Ex 1", "Ex 2", "Ex 3"]}
        }
    }

    result = calculate_koneczny_metrics(mock_llm_data)

    assert "raw_ratings" in result
    assert result["raw_ratings"]["conscience_status_scores"]["no_statutory_morality_only"]["score"] == 1.0
    assert result["conscience_autonomous_score"] == 0.9
    assert result["justice_equity_score"] == 0.9
    assert "ethical_coherence_score" in result
    print("✅ Unit test calculate_koneczny_metrics passed in <1ms!")
