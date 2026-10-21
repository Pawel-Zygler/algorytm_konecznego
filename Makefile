.PHONY: start run stop test test-smoke test-resume test-repeat test-ui test-debug test-trace test-logs test-api-logs test-report test-e2e test-all

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

test-smoke:
	@echo "🧪 Uruchamianie Playwright Smoke Test (Chromium + Extension)..."
	@npm run test:smoke

test-resume:
	@echo "🔄 Wznawianie testów od ostatniego błędu (--last-failed)..."
	@npm run test:resume

test-repeat:
	@echo "🔁 Powtórzenie testów x3 dla weryfikacji powtarzalności (Repeatability)..."
	@npm run test:repeat

test-ui:
	@echo "🖥️ Uruchamianie interaktywnego UI Runnera Playwright..."
	@npm run test:ui

test-debug:
	@echo "🐞 Uruchamianie Playwright Inspector do krokowego debugowania..."
	@npm run test:debug

test-trace:
	@echo "📸 Uruchamianie testów z wymuszonym generowaniem pełnego trace.zip..."
	@npm run test:trace

test-logs:
	@echo "📋 Uruchamianie testów z logami konsoli przeglądarki na żywo (stdout + test-results/browser-console.log)..."
	@npm run test:logs

test-api-logs:
	@echo "🔍 Uruchamianie testów z pełnymi logami API Playwright (pw:api)..."
	@npm run test:api-logs

test-report:
	@echo "📊 Otwieranie raportu diagnostycznego HTML..."
	@npm run test:report

test-e2e:
	@echo "🎭 Uruchamianie pełnego Playwright E2E Suite..."
	@npm run test:e2e

test-all: test test-smoke
	@echo "✅ Wszystkie testy (Unit + Playwright Smoke) zakończone sukcesem!"


