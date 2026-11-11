# 📋 Specyfikacja Scenariuszy Testowych – Algorytm Konecznego

Dokument definiuje pełny rejestr scenariuszy testowych dla projektu **Algorytm Konecznego**, zorganizowany według zasad **Piramidy Testów** oraz technik projektowania testów standardu **ISTQB** (Analiza Wartości Brzegowych, Klasy Równoważności, Tabele Decyzyjne, Testowanie Przejść Stanów, Przypadki Użycia).

---

## 🏛️ Architektura Piramidy Testów

```
                     ┌─────────────────────────────┐
                     │       🔝 E2E / UI (5)       │  Playwright (Chromium)
                     │  Kluczowe Use Cases & Smoke │  Czas: ~15-30s
                     ├─────────────────────────────┤
                     │ ⚖️ Integracja / API (22)    │  FastAPI TestClient + SQLite + RAG
                     │ Tabele Decyzyjne, Kontrakty │  Czas: ~2-5s
                     ├─────────────────────────────┤
                     │   🧱 Testy Jednostkowe (57) │  Pytest: BVA, EP, Quincunx Math
                     │  100% Izolacji, Offline     │  Czas: ~5s
                     └─────────────────────────────┘
```

---

## 1. 🌐 Scenariusze Testowe API (`/api/*`)

Weryfikacja kontraktu HTTP, walidacji wejść (BVA/EP) oraz kodów statusu bez konieczności uruchamiania przeglądarki.

| ID | Nazwa Scenariusza | Endpoint / Metoda | Technika ISTQB | Dane Wejściowe | Oczekiwany Rezultat | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | Health Check Status | `GET /api/health` | Smoke / State | Brak parametrów | `200 OK`, JSON: `{"status": "ok", "indices_count": 27, ...}` | `tests/unit/test_backend_unit.py` |
| **API-02** | Puste ciało żądania | `POST /api/analyze` | BVA (Wartość pusta) | `{}` | `400 Bad Request`, `"Tekst wejściowy nie może być pusty"` | `tests/unit/test_mantis_decision_table.py` |
| **API-03** | Tekst z samych białych znaków | `POST /api/analyze` | BVA / Klasy Równoważności | `{"text": "   \n\t "}` | `400 Bad Request`, `"Tekst wejściowy nie może być pusty"` | `tests/unit/test_mantis_decision_table.py` |
| **API-04** | Brak klucza API Gemini | `POST /api/analyze` | Bezpieczeństwo / EP | `{"text": "Sample"}`, brak env/header | `401 Unauthorized`, `"Brak klucza API Gemini"` | `tests/unit/test_mantis_decision_table.py` |
| **API-05** | Klucz API w nagłówku HTTP | `POST /api/analyze` | Walidacja Kontraktu | Header `X-Gemini-API-Key: AIza...` | `200 OK`, autoryzacja z nagłówka priorytetowa nad brakiem w body | Do wdrożenia |
| **API-06** | Jawny tryb Mantis (`jmantis`) | `POST /api/analyze` | Tabela Decyzyjna | `{"text": "...", "mode": "jmantis"}` | `200 OK`, `mode="jmantis"`, obecność listy `mantis_gates` (6 bramek) | `tests/unit/test_backend_unit.py` |
| **API-07** | Jawny tryb Pełny (`full`) | `POST /api/analyze` | Tabela Decyzyjna | `{"text": "...", "mode": "full"}` | `200 OK`, obliczone wszystkie indeksy Quincunxa i Praw Dziejowych | `tests/unit/test_backend_unit.py` |
| **API-08** | Jawny tryb Szybki (`lite`) | `POST /api/analyze` | Tabela Decyzyjna | `{"text": "...", "mode": "lite"}` | `200 OK`, `mode="lite"`, redukcja tokenów do kluczowych indeksów | `tests/unit/test_backend_unit.py` |
| **API-09** | Selektywne target_indices | `POST /api/analyze` | Klasy Równoważności | `{"target_indices": ["sacrality"]}` | `200 OK`, wyliczenie tylko wskazanego indeksu | `tests/unit/test_wikipedia_scenarios.py` |
| **API-10** | Status indeksu książek RAG | `GET /api/rag-status` | Kontrakt API | Brak | `200 OK`, JSON ze statystykami `indexed_files` i `total_chunks` | `tests/unit/test_backend_unit.py` |
| **API-11** | Uruchomienie indeksowania w tle | `POST /api/index-books` | Asynchroniczność / State | `{"force": false}` | `200 OK`, zadanie uruchomione w `BackgroundTasks` | Manualny / Backend |
| **API-12** | Serwowanie atlasu diagramów | `GET /preview` | Static Serving / Smoke | Brak | `200 OK`, `Content-Type: text/html`, pełny atlas diagramów HTML | `tests/unit/test_backend_unit.py` |

---

## 2. ⚖️ Scenariusze Testowe Integracyjne

Weryfikacja współpracy komponentów wewnętrznych: bazy SQLite (`history.py`), silnika PDF (`fitz`), bazy wektorowej (`rag.py`), rotacji modeli LLM oraz drzewa decyzyjnego Mantis.

| ID | Nazwa Scenariusza | Komponenty Integracji | Technika ISTQB | Dane Testowe / Warunki | Oczekiwany Rezultat | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **INT-01** | Pobieranie i parsowanie zdalnego PDF | `main.py` + `fitz` + `requests.Session` | Integracja Wejść | Mock PDF w strumieniu z tekstem Konstytucji RP | Prawidłowa ekstrakcja tekstu ze stron PDF i przekazanie do analizy | `tests/unit/test_wikipedia_scenarios.py` |
| **INT-02** | Błąd pobrania pliku PDF | `main.py` + `requests.Session` | BVA / Obsługa Błędów | Nieprawidłowy URL (404 lub timeout) | `400 Bad Request` z czytelnym komunikatem błędu | `tests/unit/test_backend_unit.py` |
| **INT-03** | PDF bez warstwy tekstowej (skan bez OCR) | `main.py` + `fitz` | Klasy Równoważności | PDF zawierający wyłącznie pustą stronę graficzną | `400 Bad Request`, komunikat o braku warstwy tekstowej | `tests/unit/test_backend_unit.py` |
| **INT-04** | Zapis historii analiz w bazie SQLite | `analyzer.py` + `history.py` | Przejścia Stanów | Analiza próbki z parametrem `url` | Zapis rekordu do `backend/history.db`, zwrot statystyk `total_runs >= 1` | `tests/unit/test_backend_unit.py` |
| **INT-05** | Inkrementacja licznika powtórzeń URL | `history.py` (tabela SQLite) | Przejścia Stanów | Powtórna analiza tego samego `url` | `total_runs` zwiększa się o 1, aktualizacja znacznika `last_analyzed_at` | `tests/unit/test_backend_unit.py` |
| **INT-06** | **Tabela Decyzyjna: 7 Cywilizacji Mantis** | `analyzer.py` (Mantis AI Gate Engine) | **Tabele Decyzyjne** | Matryca 7 kombinacji wskaźników (Łacińska, Bizantyńska, Turańska, Chińska, Arabska, Żydowska, Bramińska) | 100% zgodności diagnozy i klasyfikacji cywilizacyjnej dla wszystkich 7 reguł | `tests/unit/test_mantis_decision_table.py` |
| **INT-07** | **BVA: Wartości Brzegowe Bramek Mantis** | `analyzer.py` | **Analiza Wartości Brzegowych** | Progi: sakralność (`0.39`, `0.40`, `0.41`), dualizm (`0.47`, `0.48`), ustrój obozowy (`0.24`, `0.25`) | Precyzyjne przejście do właściwej gałęzi decyzyjnej dokładnie na progu | `tests/unit/test_mantis_bva.py` |
| **INT-08** | **EP: Obsługa brakujących wskaźników (-1.0)** | `analyzer.py` | **Klasy Równoważności** | Wskaźniki o wartości `-1.0` lub brakujące pola w payloadzie | Bezpieczny fallback bez rzucania wyjątków `KeyError` / `ValueError` | `tests/unit/test_mantis_bva.py` |
| **INT-09** | Fallback RAG przy braku bazy książek | `rag.py` + `analyzer.py` | Graceful Degradation | Brak katalogu `books/` lub pusta ChromaDB | `retrieve_relevant_passages()` zwraca `[]`, prompt generuje się z pustym kontekstem RAG | `tests/unit/test_backend_unit.py` |
| **INT-10** | Rotacja modeli LLM przy błędzie sieci/limitu | `analyzer.py` (`call_gemini_api`) | Odporność na Awarie (Fault Tolerance) | Symulacja błędu 429/503 na modelu podstawowym | Automatyczne przejście na kolejny model z listy zapasowej | `tests/unit/test_backend_unit.py` |

---

## 3. 🎭 Scenariusze Testowe End-to-End (E2E / Playwright)

Weryfikacja wtyczki w rzeczywistej przeglądarce Chromium (User Journeys), integracji z DOM stron trzecich (Wikipedia), paneli bocznych i eksportu danych.

| ID | Nazwa Scenariusza | Ścieżka Użytkownika (Use Case) | Zakres | Kroki Testowe | Oczekiwany Rezultat | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **E2E-01** | **Wstrzyknięcie Wtyczki i FAB** | Użytkownik wchodzi na stronę www | **Smoke** | 1. Otwarcie strony Wikipedii<br>2. Oczekiwanie na skrypt wtyczki | Wstrzyknięcie `#koneczny-extension-root`, widoczny pływający portret `#koneczny-trigger` | `e2e/specs/smoke.spec.ts` |
| **E2E-02** | **Uruchomienie Analizy i Dashboard** | Kliknięcie portretu Profesora | **Smoke** | 1. Kliknięcie `#koneczny-trigger`<br>2. Zamockowana odpowiedź `/api/analyze`<br>3. Weryfikacja panelu bocznego | Klasa `.open` na panelu, render `.koneczny-dashboard`, widoczna diagnoza i karty wyników | `e2e/specs/smoke.spec.ts` |
| **E2E-03** | **Kontrolki Nagłówka i Eksport JSON** | Pobranie raportu analitycznego | **Smoke** | 1. Otwarcie panelu<br>2. Kliknięcie `#koneczny-download-header` | Wywołanie zdarzenia pobrania pliku `.json` z kompletnym zrzutem danych analizy | `e2e/specs/smoke.spec.ts` |
| **E2E-04** | **Tryb Pełnoekranowy (Fullscreen Toggle)** | Przełączenie widoku dashboardu | **Smoke** | 1. Kliknięcie `#koneczny-fullscreen-header`<br>2. Ponowne kliknięcie | Panel otrzymuje klasę `.fullscreen` (100% szerokości ekranu), zmiana etykiety na `Zwiń ekran` i powrót | `e2e/specs/smoke.spec.ts` |
| **E2E-05** | **Weryfikacja Profilu Bizantyńskiego (German Confederation)** | Analiza historycznego państwa o profilu etatystycznym | **Regression** | 1. Wejście na Wikipedię Związku Niemieckiego<br>2. Załadowanie mocka German Confederation<br>3. Otwarcie panelu | Dashboard i radar Quincunxa wskazują dominację Cywilizacji Bizantyńskiej | `e2e/specs/regression.spec.ts` |
| **E2E-06** | **Popovery Cytatów (NotebookLM style)** | Sprawdzenie dowodów źródłowych klasyfikacji | **Regression** | 1. Kliknięcie ikony `(ℹ)` przy sekcji Cywilizacja<br>2. Weryfikacja treści popovera<br>3. Zamknięcie przyciskiem `[✕]` | Otwarcie okna `#koneczny-section-info-popover`, widoczne dokładnie 2 cytaty z tekstu, poprawne zamknięcie | `e2e/specs/regression.spec.ts` |
| **E2E-07** | **Nawigacja po 5 Zakładkach Metodologicznych** | Badanie różnych schematów historiozoficznych | **Regression** | 1. Kliknięcie zakładki 4 (Stosunek do czasu)<br>2. Kliknięcie zakładki 5 (Pion Łaciński) | Wyrenderowanie tabeli aczasowości/czasu linearnego oraz matrycy syntetycznej 7 cywilizacji | `e2e/specs/regression.spec.ts` |
| **E2E-08** | **Weryfikacja Radaru Quincunxa (SVG)** | Wizualizacja Pięciomianu Bytu | **Regression** | 1. Przegląd sekcji pajęczyny Quincunxa | Wyrenderowany wielokąt SVG z 5 osiami (Dobro, Prawda, Zdrowie, Dobrobyt, Piękno) oraz % czystości | `e2e/specs/smoke.spec.ts` / `regression.spec.ts` |
| **E2E-09** | **Aura Silnika (Mantis vs Lite vs Full)** | Zmiana trybu silnika analitycznego | **Regression** | 1. Wybór trybu analizy w popupie | Portret otrzymuje odpowiednią pulsującą aurę CSS (zielona Mantis, niebieska Lite, złota Full) | UI Mockups / Manualny |
| **E2E-10** | **Obsługa Błędu Serwera (Error Banner)** | Brak połączenia z serwerem lub błąd 500 | **Unhappy Path** | 1. Mockowanie `/api/analyze` ze statusem 500 | Wyświetlenie w panelu czytelnego alertu z instrukcją uruchomienia backendu (`make start`) | Do wdrożenia |

---

## 4. 🚀 Instrukcja Uruchamiania Zestawów Testowych

Wszystkie scenariusze można uruchamiać za pomocą standardowych poleceń `Makefile` lub `npm`:

```bash
# 1. Uruchomienie wszystkich 57 szybkich testów jednostkowych i integracyjnych (< 6s)
make test
# lub: pytest tests/unit/

# 2. Uruchomienie testów Playwright Smoke Suite (E2E-01, E2E-02, E2E-03, E2E-04)
make test-smoke

# 3. Uruchomienie zaawansowanego zestawu Playwright Regression Suite (E2E-05, E2E-06, E2E-07)
make test-regression

# 4. Wznowienie nieudanych testów od miejsca błędu
make test-resume

# 5. Uruchomienie interaktywnego interfejsu graficznego Playwright UI
make test-ui

# 6. Pełna weryfikacja projektu (Unit + Integration + Playwright Smoke)
make test-all
```
