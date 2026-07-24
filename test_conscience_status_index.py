import requests

BASE_URL = "http://127.0.0.1:8005"

def test_conscience_status_index():
    sample_text = """
    W Izraelu toczy się zacięta debata nad rolą ustaw zasadniczych oraz autonomią sumienia sędziów.
    W państwie Izrael etyka i prawo ścierają się na tle krytyki ustawy o państwie narodowym.
    Obywatele Izraela żądają prymatu autonomicznego sumienia nad państwowym okólnikiem,
    odrzucając statolatrię oraz rozkazy naruszające uniwersalne prawa człowieka.
    """
    
    payload = {
        "text": sample_text,
        "target_indices": ["conscience_status"]
    }
    
    print("Testing /api/analyze with CONSCIENCE_STATUS_INDEX (Israel sample text)...")
    res = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    
    data = res.json()
    conscience_scores = data.get("raw_ratings", {}).get("conscience_status_scores", {})
    print("Conscience Status Scores Count:", len(conscience_scores))
    
    for key, val in list(conscience_scores.items())[:3]:
        print(f"  [{key}] News Examples: {val.get('news_examples')}")
    
    assert len(conscience_scores) >= 13, f"Expected at least 13-15 indicators, got {len(conscience_scores)}"
    print("✅ TEST CONSCIENCE STATUS INDEX WITH ISRAEL ENTITY ATTRIBUTION PASSED!")

if __name__ == "__main__":
    test_conscience_status_index()
