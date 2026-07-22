import requests
import json
import os

api_key = os.environ.get("GEMINI_API_KEY")

for model in ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-1.0-pro"]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    data = {
        "contents": [{"parts": [{"text": "Hello"}]}]
    }
    res = requests.post(url, headers=headers, json=data)
    print(f"Model: {model}, Status: {res.status_code}")

