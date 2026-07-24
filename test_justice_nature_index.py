import requests

BASE_URL = "http://127.0.0.1:8005"

def test_justice_nature_index():
    sample_text = """
    Poczucie słuszności i etyki wyprzedza literę przepisu prawnego. Sędzia orzeka na podstawie sumienia,
    a nie jako bezduszna maszynka do stosowania paragrafów. Prawo wywodzi się z powszechnej etyki,
    a ustawy podlegają wyższym normom moralnym. Odrzucamy formalizm Shylocka, sakralną kazuistykę oraz statolatrię.
    Prawo musi wyrastać aposteriorycznie z doświadczenia społecznego, z zachowaniem ścisłego dualizmu prawnego
    i pełnej niezawisłości sędziów. Odrzucamy turańskie prawo obozowe i wstrętny kolektywizm socjalistyczny.
    """
    
    payload = {
        "text": sample_text,
        "target_indices": ["justice_nature"]
    }
    
    print("Testing /api/analyze with JUSTICE_NATURE_INDEX (target_indices=['justice_nature'])...")
    res = requests.post(f"{BASE_URL}/api/analyze", json=payload)
    print(f"Status Code: {res.status_code}")
    assert res.status_code == 200, f"Expected 200 OK, got {res.status_code}"
    
    data = res.json()
    print("Response keys:", list(data.keys()))
    print("Raw ratings keys:", list(data.get("raw_ratings", {}).keys()))
    
    justice_scores = data.get("raw_ratings", {}).get("justice_nature_scores", {})
    print("Justice Nature Scores Count:", len(justice_scores))
    print("Justice Nature Scores:", justice_scores)
    
    assert len(justice_scores) >= 14, f"Expected at least 14-16 indicators, got {len(justice_scores)}"
    print("✅ TEST JUSTICE NATURE INDEX PASSED!")

if __name__ == "__main__":
    test_justice_nature_index()
