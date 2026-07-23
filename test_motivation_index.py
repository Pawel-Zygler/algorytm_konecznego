import requests

BASE_URL = "http://127.0.0.1:8005"

def test_motivation_index():
    sample_text = """
    W cywilizacji łacińskiej szukamy Prawdy dla niej samej, kierując się bezinteresowną dążnością do Dobra i Piękna.
    Res sacra miser – cierpiący jest rzeczą świętą, co nakazuje bezinteresowne wsparcie bez kalkulacji zysku.
    Służba publiczna jest pełniona dla ideału dobra wspólnego, a nie dla osobistego łupu.
    Odrzucamy utylitaryzm transakcyjny oraz traktowanie człowieka jako środka do celu.
    """
    
    payload = {
        "text": sample_text,
        "target_indices": ["motivation"]
    }
    
    print("Testing /api/analyze with MOTIVATION_INDEX (target_indices=['motivation'])...")
    res = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    
    data = res.json()
    print("Response keys:", list(data.keys()))
    print("Raw ratings keys:", list(data.get("raw_ratings", {}).keys()))
    
    motivation_scores = data.get("raw_ratings", {}).get("motivation_scores", {})
    print("Motivation Scores Count:", len(motivation_scores))
    print("Motivation Scores:", motivation_scores)
    
    assert len(motivation_scores) == 14, f"Expected 14 indicators, got {len(motivation_scores)}"
    print("✅ TEST MOTIVATION INDEX PASSED!")

if __name__ == "__main__":
    test_motivation_index()
