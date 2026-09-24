.PHONY: start run test

start:
	@echo "🏛️ Uruchamianie backendu Algorytmu Konecznego na porcie 8005..."
	@python3 -m uvicorn backend.main:app --port 8005 --reload --log-config backend/log_config.json

run: start

test:
	@pytest tests/unit/
