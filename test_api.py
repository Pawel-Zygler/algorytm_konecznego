import requests
import json
import time

url = "http://localhost:8000/api/analyze"
headers = {"Content-Type": "application/json", "X-Gemini-API-Key": ""} # Will use env var if empty

data = {
    "text": "W Polsce prawo prywatne jest niezależne od państwa, a własność prywatna jest chroniona."
}

try:
    res = requests.post(url, headers=headers, json=data)
    res.raise_for_status()
    task_id = res.json()["task_id"]
    print(f"Task ID: {task_id}")

    while True:
        status_res = requests.get(f"http://localhost:8000/api/analyze/status/{task_id}")
        status_data = status_res.json()
        print(f"Status: {status_data['status']}, Completed: {len(status_data['completed'])}/13")
        
        if status_data["status"] == "COMPLETED":
            print(json.dumps(status_data["results"], indent=2, ensure_ascii=False))
            break
        time.sleep(2)

except requests.exceptions.RequestException as e:
    print(f"Connection error: {e}")
    if e.response is not None:
        print(e.response.text)

