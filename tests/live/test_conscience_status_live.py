import pytest
import requests

BASE_URL = "http://127.0.0.1:8005"

@pytest.mark.live
def test_conscience_status_index_live():
    sample_text = """
    W Izraelu toczy się zacięta debata nad rolą ustaw zasadniczych oraz autonomią sumienia sędziów.
    W państwie Izrael etyka i prawo ścierają się na tle krytyki ustawy o państwie narodowym.
    Obywatele Izraela żądają prymatu autonomicznego sumienia nad państwowym okólnikiem.
    """
    
    payload = {
        "text": sample_text,
        "target_indices": ["conscience_status"]
    }
    
    res = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    
    data = res.json()
    conscience_scores = data.get("raw_ratings", {}).get("conscience_status_scores", {})
    assert len(conscience_scores) >= 10, f"Expected at least 10 indicators, got {len(conscience_scores)}"
