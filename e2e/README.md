# 🎭 Algorytm Konecznego – Playwright E2E Automation Framework

Kompleksowy framework testów automatycznych End-to-End dla wtyczki Chromium i Dashboardu **Algorytmu Konecznego** napisany w TypeScript w oparciu o silnik Playwright.

Zaprojektowany według 4 fundamentalnych filarów inżynierii testów automatycznych:
1. **Repeatability (Powtarzalność)**
2. **Easy Resumption (Łatwe Wznawianie)**
3. **Diagnosis & Debugging Data (Diagnostyka i Logi)**
4. **Ease of Use (Łatwość Użycia)**

---

## 🏛️ 4 Filary Architektury Frameworka

### 1. Repeatability (Powtarzalność)
> *Każde uruchomienie testu musi być w 100% czyste, bez potrzeby jakichkolwiek manualnych czynności sprzątających przed kolejnym wciśnięciem `<ENTER>`.*

- **Efemeryczne profile Chromium:** Każdy test tworzy dedykowany, tymczasowy katalog profilu przeglądarki w katalogu tymczasowym systemu (`os.tmpdir()/pw-koneczny-profile-*`).
- **Automatyczny Teardown:** Blok `finally` we fixture zamyka kontekst i bezwzględnie usuwa profil (`fs.rmSync(userDataDir, { recursive: true, force: true })`).
- **Brak kolizji i blokad:** Zero problemów z `SingletonLock`, wyciekami cookies czy sesjami `chrome.storage`.
- **Weryfikacja powtarzalności:**
  ```bash
  make test-repeat
  # lub
  npm run test:repeat
  ```
  *(Wykonuje 3 pełne powtórzenia każdego przypadku testowego = 9 testów z rzędu w izolowanych środowiskach).*

---

### 2. Easy Resumption (Łatwe Wznawianie)
> *Gdy zestaw testów wyłoży się w połowie, tester nie traci czasu na powtarzanie testów, które już przeszły – wznawia dokładnie od miejsca błędu.*

- **Pamięć ostatniego uruchomienia:** Playwright automatycznie rejestruje status i identyfikatory niespełnionych asercji w pliku `.last-run.json`.
- **Wznawianie jednym poleceniem:**
  ```bash
  make test-resume
  # lub
  npm run test:resume
  ```
  *(Uruchamia wyłącznie te przypadki testowe, które zgłosiły błąd w poprzednim przebiegu).*
- **Granularność testów:** Przypadki testowe w `e2e/specs/` są podzielone na niezależne jednostki (np. Krok 1: Inicjalizacja, Krok 2: Analiza i Zakładki, Krok 3: Eksport JSON). Awaria w Kroku 3 pozwala po poprawce wznowić tylko Krok 3 w czasie poniżej 6 sekund.

---

### 3. Diagnosis & Debugging Data (Dane Diagnostyczne)
> *W momencie wystąpienia błędu framework automatycznie gromadzi pełny zestaw artefaktów diagnostycznych ze znacznikami czasu.*

Gdy jakikolwiek test nie przejdzie, w katalogu `test-results/` oraz w raporcie HTML automatycznie dołączane są:

1. **`browser-console.log`**: Wszystkie komunikaty konsoli przeglądarki (`console.log`, `warn`, `error`) opatrzone precyzyjnymi znacznikami czasu ISO 8601 (`[2026-10-21T15:00:23.123Z]`).
2. **`network-failures.json`**: Strukturalny zrzut wszystkich nieudanych żądań sieciowych HTTP z metodą, URL-em i powodem błędu sieci.
3. **`extension-shadow-dom-dump.html`**: Pełny zrzut kodu HTML drzewa Shadow DOM wstrzykniętej wtyczki (`#koneczny-extension-root.shadowRoot`).
4. **Zrzuty ekranu (`screenshot`)**: Automatyczny screenshot stanu strony w milisekundzie awarii asercji.
5. **Nagranie wideo (`video`)**: Odtwarzalny zapis wideo całej sesji testowej.
6. **Playwright Trace (`trace.zip`)**: Kompletny interaktywny ślad wykonania ze zrzutami DOM przed/po każdej akcji, siecią i czasem trwania (`playwright show-trace`).

---

### 4. Ease of Use (Łatwość Użycia)
> *Framework jest gotowy do uruchomienia od ręki przez każdego członka zespołu za pomocą prostych, standardowych poleceń.*

#### Podstawowa ściągawka poleceń:

| Zadanie | Makefile | NPM Script |
|---|---|---|
| **Smoke Suite (Kroki 1, 2, 3)** | `make test-smoke` | `npm test` lub `npm run test:smoke` |
| **Regression Suite (Kroki 1, 2, 3, 4, 5)** | `make test-regression` | `npm run test:regression` lub `npm run test:e2e` |
| **Uruchomienie z logami zdarzeń na żywo** | `make test-logs` | `npm run test:logs` |
| **Uruchomienie z wewnętrznymi logami API silnika** | `make test-api-logs` | `npm run test:api-logs` |
| **Wznowienie po poprawce błędu** | `make test-resume` | `npm run test:resume` |
| **Weryfikacja powtarzalności (x3)** | `make test-repeat` | `npm run test:repeat` |
| **Wymuszenie zapisu trace.zip** | `make test-trace` | `npm run test:trace` |
| **Interaktywny UI Runner z podglądem** | `make test-ui` | `npm run test:ui` |
| **Krokowe debugowanie (Inspector)** | `make test-debug` | `npm run test:debug` |
| **Podgląd raportu i artefaktów HTML** | `make test-report` | `npm run test:report` |
| **Wszystkie testy (Unit + Playwright)** | `make test-all` | – |

---

## 📁 Struktura Katalogów

```
e2e/
├── fixtures/
│   ├── extension.fixture.ts                     # Zarządzanie profilem, izolacja, logi i zrzuty
│   ├── mock_polska_result.json                  # Deterministyczny payload analizy Polski (Cyw. Łacińska)
│   └── mock_german_confederation_result.json    # Deterministyczny payload German Confederation (Cyw. Bizantyńska)
├── specs/
│   ├── smoke.spec.ts                            # Smoke Scope (Kroki 1, 2, 3)
│   └── regression.spec.ts                       # Regression Scope (Kroki 1, 2, 3, 4, 5)
└── README.md                                    # Niniejsza dokumentacja
```
