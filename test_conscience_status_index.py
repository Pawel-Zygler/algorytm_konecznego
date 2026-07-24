import requests

BASE_URL = "http://127.0.0.1:8005"

def test_conscience_status_index():
    sample_text = """
    Sumienie jest suwerennym sędzią i autokrytyką moralną stojącą ponad ustawą.
    Odrzucamy pogląd, że moralność wywodzi się wyłącznie z braku kolizji z przepisem.
    Urzędnik i żołnierz mają prawo i obowiązek odmówić wykonania zbrodniczego rozkazu.
    Praktykujemy indywidualny rachunek sumienia i osobistą odpowiedzialność przed Bogiem,
    odrzucając wywłaszczenie sumienia przez sakralną kazuistykę, statolatrię oraz lęk przed gromadą.
    """
    
    payload = {
        "text": sample_text,
        "target_indices": ["conscience_status"]
    }
    
    print("Testing /api/analyze with CONSCIENCE_STATUS_INDEX (target_indices=['conscience_status'])...")
    res = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    
    data = res.json()
    print("Response keys:", list(data.keys()))
    print("Raw ratings keys:", list(data.get("raw_ratings", {}).keys()))
    
    conscience_scores = data.get("raw_ratings", {}).get("conscience_status_scores", {})
    print("Conscience Status Scores Count:", len(conscience_scores))
    print("Conscience Status Scores:", conscience_scores)
    
    assert len(conscience_scores) >= 13, f"Expected at least 13-15 indicators, got {len(conscience_scores)}"
    print("✅ TEST CONSCIENCE STATUS INDEX PASSED!")

if __name__ == "__main__":
    test_conscience_status_index()
