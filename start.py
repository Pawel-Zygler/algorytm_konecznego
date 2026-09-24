import uvicorn
from datetime import datetime
from backend.logging_config import get_uvicorn_log_config, setup_logging

if __name__ == "__main__":
    setup_logging()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"{now_str} [INFO] 🏛️ Uruchamianie backendu Algorytmu Konecznego na porcie 8005...")
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8005, reload=True, log_config=get_uvicorn_log_config())
