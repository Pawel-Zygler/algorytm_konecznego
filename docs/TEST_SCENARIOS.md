# Specyfikacja Scenariuszy Testowych – Algorytm Konecznego

Dokument definiuje pełny rejestr scenariuszy testowych dla projektu **Algorytm Konecznego**, zorganizowany według zasad **Piramidy Testów** oraz technik projektowania testów standardu **ISTQB** (Analiza Wartości Brzegowych, Klasy Równoważności, Tabele Decyzyjne, Testowanie Przejść Stanów, Kontrakty API, Przypadki Użycia).

---

## Architektura Piramidy Testów

```
                     ┌─────────────────────────────┐
                     │         E2E / UI (5)        │  Playwright (Chromium)
                     │  Kluczowe Use Cases & Smoke │  Czas: ~15-30s
                     ├─────────────────────────────┤
                     │     Integracja / API (22)   │  FastAPI TestClient + SQLite + RAG
                     │ Tabele Decyzyjne, Kontrakty │  Czas: ~2-5s
                     ├─────────────────────────────┤
                     │    Testy Jednostkowe (87)   │  Pytest: BVA, EP, 5 Zakładek (3 linki)
                     │  100% Izolacji, Offline     │  Czas: ~6s
                     └─────────────────────────────┘
```

---

## 1. Scenariusze Testowe API (/api/*)

Weryfikacja kontraktu HTTP, walidacji wejść (BVA/EP) oraz kodów statusu bez konieczności uruchamiania przeglądarki.

| ID | Scenariusz | Endpoint / Metoda | Dane Wejściowe | Oczekiwany Rezultat | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | Health Check Status | `GET /api/health` | Brak parametrów | 200 OK, JSON: `{"status": "ok", "indices_count": 27, ...}` | `tests/unit/test_backend_unit.py` |
| **API-02** | Puste ciało żądania | `POST /api/analyze` | `{}` | 400 Bad Request, komunikat o braku tekstu wejściowego | `tests/unit/test_mantis_decision_table.py` |
| **API-03** | Tekst z białych znaków | `POST /api/analyze` | `{"text": "   \n\t "}` | 400 Bad Request, komunikat o pustym tekście wejściowym | `tests/unit/test_mantis_decision_table.py` |
| **API-04** | Brak klucza API Gemini | `POST /api/analyze` | `{"text": "Sample"}`, brak env/header | 401 Unauthorized, komunikat o braku klucza API | `tests/unit/test_mantis_decision_table.py` |
| **API-05** | Klucz API w nagłówku | `POST /api/analyze` | Header `X-Gemini-API-Key: AIza...` | 200 OK, autoryzacja z nagłówka priorytetowa nad brakiem w body | `tests/unit/test_backend_unit.py` |
| **API-06** | Jawny tryb Mantis (jmantis) | `POST /api/analyze` | `{"text": "...", "mode": "jmantis"}` | 200 OK, mode=jmantis, obecność 6 bramek mantis_gates | `tests/unit/test_backend_unit.py` |
| **API-07** | Jawny tryb Pełny (full) | `POST /api/analyze` | `{"text": "...", "mode": "full"}` | 200 OK, mode=full, obliczone wszystkie indeksy Quincunxa | `tests/unit/test_backend_unit.py` |
| **API-08** | Jawny tryb Szybki (lite) | `POST /api/analyze` | `{"text": "...", "mode": "lite"}` | 200 OK, mode=lite, redukcja tokenów do kluczowych indeksów | `tests/unit/test_backend_unit.py` |
| **API-09** | Selektywne target_indices | `POST /api/analyze` | `{"target_indices": ["sacrality"]}` | 200 OK, wyliczenie tylko wskazanego indeksu | `tests/unit/test_wikipedia_scenarios.py` |
| **API-10** | Status indeksu książek RAG | `GET /api/rag-status` | Brak parametrów | 200 OK, JSON ze statystykami indexed_files i total_chunks | `tests/unit/test_backend_unit.py` |
| **API-11** | Indeksowanie w tle | `POST /api/index-books` | `{"force": false}` | 200 OK, zadanie uruchomione asynchronicznie w tle | `tests/unit/test_backend_unit.py` |
| **API-12** | Atlas diagramów HTML | `GET /preview` | Brak parametrów | 200 OK, Content-Type: text/html, pełny atlas diagramów | `tests/unit/test_backend_unit.py` |

---

## 2. Scenariusze Testowe Integracyjne

Weryfikacja współpracy komponentów wewnętrznych: bazy SQLite (`history.py`), silnika PDF (`fitz`), bazy wektorowej (`rag.py`), rotacji modeli LLM oraz drzewa decyzyjnego Mantis.

| ID | Scenariusz | Komponenty | Warunki Testowe | Oczekiwany Rezultat | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **INT-01** | Pobranie i parsowanie PDF | `main.py` + `fitz` + `requests` | Mock PDF w strumieniu z tekstem Konstytucji RP | Prawidłowa ekstrakcja tekstu ze stron PDF i analiza | `tests/unit/test_wikipedia_scenarios.py` |
| **INT-02** | Błąd pobrania pliku PDF | `main.py` + `requests` | Nieprawidłowy URL (kod 404 lub przekroczenie timeoutu) | 400 Bad Request z czytelnym komunikatem błędu | `tests/unit/test_backend_unit.py` |
| **INT-03** | PDF bez tekstu (skan bez OCR) | `main.py` + `fitz` | Plik PDF zawierający wyłącznie pustą stronę graficzną | 400 Bad Request, komunikat o braku warstwy tekstowej | `tests/unit/test_backend_unit.py` |
| **INT-04** | Zapis historii analiz w SQLite | `analyzer.py` + `history.py` | Analiza próbki tekstu z parametrem url | Zapis do backend/history.db, zwrot statystyk total_runs >= 1 | `tests/unit/test_backend_unit.py` |
| **INT-05** | Inkrementacja licznika URL | `history.py` (SQLite) | Powtórna analiza tego samego adresu url | Zwiększenie licznika total_runs o 1, aktualizacja znacznika czasu | `tests/unit/test_backend_unit.py` |
| **INT-06** | Tabela Decyzyjna: 7 Cywilizacji | `analyzer.py` (Mantis AI) | Matryca 7 kombinacji (Łacińska, Bizancjum, Turańska itd.) | 100% zgodności diagnozy cywilizacyjnej dla wszystkich 7 reguł | `tests/unit/test_mantis_decision_table.py` |
| **INT-07** | Wartości Brzegowe Bramek (BVA) | `analyzer.py` | Progi: sakralność (0.39/0.40), dualizm (0.47/0.48), obóz (0.24/0.25) | Precyzyjne przejście do właściwej gałęzi dokładnie na progu | `tests/unit/test_mantis_bva.py` |
| **INT-08** | Klasy Równoważności braków (-1.0) | `analyzer.py` | Wskaźniki o wartości -1.0 lub brakujące pola w payloadzie | Bezpieczny fallback bez wyjątków KeyError lub ValueError | `tests/unit/test_mantis_bva.py` |
| **INT-09** | Fallback RAG przy braku bazy | `rag.py` + `analyzer.py` | Brak katalogu books/ lub pusta baza wektorowa | Pusty kontekst RAG bez przerywania analizy tekstu | `tests/unit/test_backend_unit.py` |
| **INT-10** | Rotacja modeli LLM przy awarii | `analyzer.py` | Symulacja błędu sieci/limitu 429 na modelu podstawowym | Automatyczne przejście na kolejny model zapasowy z listy | `tests/unit/test_backend_unit.py` |

---

## 3. Scenariusze Testowe Kontraktu 5 Zakładek Dashboardu (Pytest Unit / Contract)

Weryfikacja kompletności kontraktu interfejsu wtyczki Chrome na istniejących fikturach (`mock_polska_result.json`, `mock_german_confederation_result.json`): obecność Karty Głównej (Hero Card), opisu co mierzy dany wskaźnik, kompletu pytań z odpowiedziami i uzasadnieniem oraz dowodów w postaci dokładnie 3 linków wyszukiwania per wskaźnik.

| ID | Zakładka / Kontrakt | Zakres Weryfikacji | Oczekiwany Rezultat i Wymogi Kontraktu | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- |
| **TAB-01** | Zakładka 1: Sakralność | Karta INDEKS SAKRALNOŚCI, opis wskaźnika, 13 pytań, dowody | Score %, status poziomu, opis metodologiczny, 13 pytań z odpowiedziami i 3 dowodami | `tests/unit/test_tabs_contract.py` |
| **TAB-02** | Zakładka 2: Supremacja Ducha | Karta SUPREMACJA DUCHA, opis wskaźnika, 12 podindeksów | Score %, status supremacji, opis, podbloki: Dualizm, Kościół, Personalizm, Sumienie, Moralność | `tests/unit/test_tabs_contract.py` |
| **TAB-03** | Zakładka 3: Personalizm | Karta SPÓJNOŚĆ GENERALIÓW ETYKI, opis, 7 generaliów | Wartość 7.0/7.0, opis Siedmiu Niewiadomych, 7 generaliów z ocenami i 3 dowodami per wskaźnik | `tests/unit/test_tabs_contract.py` |
| **TAB-04** | Zakładka 4: Chyżość | Karta CHYŻOŚĆ HISTORYCZNA, opis wydajności, 15 pytań czasu | Score %, diagnoza wydajności, opis oszczędzania czasu, 15 pytań z odpowiedziami i 3 dowodami | `tests/unit/test_tabs_contract.py` |
| **TAB-05** | Zakładka 5: Quincunx | Karta PIĘCIOMIAN BYTU, opis sfer bytu, 11 pytań Quincunxa | Score %, diagnoza współmierności, 11 pytań dla 5 sfer (Dobro, Prawda, Zdrowie, Dobrobyt, Piękno) | `tests/unit/test_tabs_contract.py` |
| **TAB-06** | Renderowanie HTML | Szablony DOM buildDarkHero oraz buildCardsGroup | Poprawny HTML: dark-hero-card, answer-card, explanation-text, news-item-link z linkiem do Google | `tests/unit/test_tabs_contract.py` |
| **TAB-07** | Synchronizacja z content.js | Audyt słowników metadanych w extension/content.js | Wszystkie klucze z fiktur zdefiniowane w SACRALITY_META, GENERALIA_META, TIME_MASTERY_META, QUINCUNX_META | `tests/unit/test_tabs_contract.py` |
| **TAB-08** | Ścisły wymóg 3 linków dowodów | Walidacja list news_examples dla wszystkich 133 wskaźników | Każdy wskaźnik we wszystkich 5 zakładkach ma zawsze dokładnie 3 linki dowodowe (>3 znaki) | `tests/unit/test_tabs_contract.py` |

---

## 4. Scenariusze Testowe End-to-End (E2E / Playwright)

Weryfikacja wtyczki w rzeczywistej przeglądarce Chromium (User Journeys), integracji z DOM stron trzecich (Wikipedia), paneli bocznych i eksportu danych.

| ID | Scenariusz | Ścieżka Użytkownika | Kroki Testowe | Oczekiwany Rezultat | Plik Testowy |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E2E-01** | Wstrzyknięcie Wtyczki i FAB | Wejście na Wikipedię | Załadowanie strony Wikipedii, oczekiwanie na skrypt wtyczki | Wstrzyknięcie #koneczny-extension-root, widoczny FAB #koneczny-trigger | `e2e/specs/smoke.spec.ts` |
| **E2E-02** | Uruchomienie Analizy i Dashboard | Kliknięcie portretu | Kliknięcie #koneczny-trigger, zamockowany response /api/analyze | Klasa .open, render dashboardu, widoczna diagnoza i karty wyników | `e2e/specs/smoke.spec.ts` |
| **E2E-03** | Kontrolki Nagłówka i Eksport JSON | Pobranie raportu | Otwarcie panelu, kliknięcie #koneczny-download-header | Wywołanie zdarzenia pobrania pliku .json z pełnym zrzutem danych | `e2e/specs/smoke.spec.ts` |
| **E2E-04** | Tryb Pełnoekranowy (Fullscreen) | Przełączenie widoku | Kliknięcie #koneczny-fullscreen-header, powtórne kliknięcie | Klasa .fullscreen (100% szerokości ekranu), zmiana etykiety na Zwiń ekran | `e2e/specs/smoke.spec.ts` |
| **E2E-05** | Profil Bizantyński (Związek Niemiecki) | Analiza państwa etatystycznego | Załadowanie Wikipedii Związku Niemieckiego z mockiem German Confed | Dashboard i radar Quincunxa wskazują dominację Cywilizacji Bizantyńskiej | `e2e/specs/regression.spec.ts` |
| **E2E-06** | Popovery Cytatów (NotebookLM style) | Sprawdzenie dowodów źródłowych | Kliknięcie ikony (i) przy sekcji Cywilizacja, zamknięcie przyciskiem [X] | Otwarcie okna #koneczny-section-info-popover, widoczne 2 cytaty, czyste zamknięcie | `e2e/specs/regression.spec.ts` |
| **E2E-07** | Nawigacja po Zakładkach | Badanie schematów dziejowych | Kliknięcie zakładki 4 (Stosunek do czasu), potem zakładki 5 (Pion) | Wyrenderowanie tabeli aczasowości/czasu oraz matrycy syntetycznej | `e2e/specs/regression.spec.ts` |
| **E2E-08** | Radar Quincunxa (Wielokąt SVG) | Wizualizacja Pięciomianu Bytu | Sprawdzenie sekcji pajęczyny Quincunxa w panelu bocznym | Wyrenderowany wielokąt SVG z 5 osiami (Dobro, Prawda, Zdrowie, Dobrobyt, Piękno) | `e2e/specs/smoke.spec.ts` |
| **E2E-09** | Aura Silnika (Mantis / Lite / Full) | Zmiana trybu silnika | Wybór trybu analizy w popupie rozszerzenia | Pulsująca aura CSS portretu (zielona Mantis, niebieska Lite, złota Full) | UI Manualny |
| **E2E-10** | Obsługa Błędu Serwera (Banner 500) | Błąd połączenia / API | Mockowanie /api/analyze ze statusem błędu 500 | Wyświetlenie w panelu czytelnego alertu z instrukcją uruchomienia backendu | Do wdrożenia |

---

## 5. Instrukcja Uruchamiania Zestawów Testowych

Wszystkie scenariusze można uruchamiać za pomocą standardowych poleceń `Makefile` lub `npm`:

```bash
# 1. Uruchomienie wszystkich 87 szybkich testów jednostkowych i kontraktowych (< 6s)
make test
# lub: pytest tests/unit/
# lub tylko testy kontraktu zakładek: pytest tests/unit/test_tabs_contract.py -v

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
