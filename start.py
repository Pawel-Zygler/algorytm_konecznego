import uvicorn

if __name__ == "__main__":
    print("🏛️ Uruchamianie backendu Algorytmu Konecznego na porcie 8005...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8005, reload=True)
