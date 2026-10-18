.PHONY: start run stop test

start:
	@echo "🏛️ Uruchamianie backendu Algorytmu Konecznego na porcie 8005..."
	@python3 -m uvicorn backend.main:app --port 8005 --reload --log-config backend/log_config.json

run: start

stop:
	@echo "🛑 Zatrzymywanie backendu Algorytmu Konecznego na porcie 8005..."
	@PIDS=$$(lsof -ti :8005); \
	if [ -n "$$PIDS" ]; then \
		echo "$$PIDS" | xargs kill -9 2>/dev/null; \
		echo "✅ Zatrzymano serwer (PID: $$(echo $$PIDS | tr '\n' ' '))."; \
	else \
		echo "ℹ️ Brak aktywnego serwera na porcie 8005."; \
	fi

test:
	@pytest tests/unit/

