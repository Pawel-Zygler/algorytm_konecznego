# Algorytm Konecznego

Cyfrowe narzędzie analityczne i wtyczka przeglądarkowa wdrażająca historiozoficzny **Algorytm Konecznego** do analizy cywilizacyjnej i etycznej tekstów w locie.

![Screenshot z działania wtyczki](extension/screenshot.png)

---

## 🏛️ Struktura Indeksów Analitycznych

Algorytm analizuje tekst w wymiarach cywilizacyjnych Feliksa Konecznego:

1. **7 Generaliów Etyki (Siedem Niewiadomych Etyki - Krok 3)**:
   - Wylicza wskaźnik spójności etycznej (`ethical_coherence_score`) oraz diagnozuje **Szereg Personalistyczny** (Cywilizacja Łacińska) vs **Szereg Gromadnościowy** vs **⚠️ Mieszankę Trującą** (stan acywilizacyjny).
   - Zawiera poszczególne pod-indeksy testowe:
     - **Personalistyczne Źródło Obowiązku** (`duty_source` - 13 wskaźników)
     - **Motywacja i Bezinteresowność** (`motivation` - 14 wskaźników)
     - **Natura Sprawiedliwości** (`justice_nature` - 16 wskaźników)
     - **Status Sumienia: Autonomia vs Heteronomia** (`conscience_status` - 15 wskaźników)

2. **Supremacja Ducha** (Agregacja 12 pod-indeksów):
   - Dualizm Prawny, Pluralizm Źródeł Prawa, Prawo Aposterioryczne, Organizm vs Mechanizm, Personalizm, Emancypacja Rodziny, Niezawisłość Kościoła, Stabilność Własności, Ciągłość Dziedziczenia, Supremacja Moralności, Totalność Moralności Publicznej, Odpowiedzialność Urzędnicza.

3. **Indeks Sakralności**:
   - Mierzy stopień uświęcenia prawa i państwa (odrzucenie statolatrii i cezaropapizmu).

---

## ⚡ Przyspieszenie Dewelopmentu i Testowania (Dev Speedup)

Projekt zawiera wbudowane narzędzia zapewniające natychmiastowy pętlowy feedback bez marnowania tokenów API:

### 1. Testy Pytest: Mocked Unit Tests vs. Live API Tests
- **Szybkie testy jednostkowe (0.7s, koszt $0)**:
  ```bash
  python3 -m pytest tests/unit/
  ```
  Testują całą matematykę backendową, wyliczanie wskaźników, ostrzeżenia o mieszance trującej i struktury JSON bez wykonywania połączeń sieciowych.

- **Testy integracyjne z live Gemini API**:
  ```bash
  python3 -m pytest tests/live/
  ```
  Testują rzeczywiste odpowiedzi modelu Gemini i automatyczną atrybucję nagłówków wiadomości ze świata (np. *"w Izraelu"*).

### 2. Parametryzacja Indeksów na Żądanie (`target_indices`)
Wysyłając zapytanie POST na `/api/analyze`, możesz przetestować dowolny pojedynczy indeks na żądanie bez modyfikowania kodu źródłowego:
```json
{
  "text": "Tekst do analizy...",
  "target_indices": ["conscience_status"]
}
```

### 3. Ciągła Integracja CI (GitHub Actions)
Każdy push i pull request do gałęzi `main` automatycznie wyzwala akcję w `.github/workflows/ci.yml`:
- Weryfikacja składni kodu Pythona (`backend/analyzer.py`, `backend/main.py`).
- Weryfikacja składni kodu JavaScript wtyczki (`extension/content.js`).
- Wykonanie szybkich testów jednostkowych `pytest tests/unit/`.

### 4. Watcher Składni Wtyczki Chrome
Uruchom dedykowany watcher, który przy każdej zapisanej zmianie w `extension/content.js` natychmiast sprawdza poprawność składni:
```bash
python3 scripts/watch_extension.py
```

### 5. Interaktywna Dokumentacja Swagger API (`/docs`)
Szybkie testowanie zapytań API z poziomu interfejsu graficznego w przeglądarce:
`http://127.0.0.1:8005/docs`

---

## 🛠️ Instalacja i Uruchomienie Lokalnie

### Krok 1: Klonowanie repozytorium i instalacja zależności
```bash
git clone https://github.com/Pawel-Zygler/algorytm_konecznego.git
cd algorytm_konecznego
pip install -r backend/requirements.txt
pip install pytest
```

### Krok 2: Konfiguracja klucza API
Skopiuj plik szablonu zmiennych środowiskowych i dodaj swój własny klucz do API Google Gemini:
```bash
cp backend/.env.template backend/.env
```
Otwórz plik `backend/.env` i uzupełnij:
```env
GEMINI_API_KEY=twój_działający_klucz_api
```

### Krok 3: Uruchomienie serwera backendowego
Z poziomu głównego folderu uruchom serwer FastAPI:
```bash
python3 -m uvicorn backend.main:app --port 8005 --reload
```
Backend wystartuje pod adresem `http://127.0.0.1:8005`.

### Krok 4: Instalacja wtyczki w przeglądarce (Chrome/Edge)
1. Otwórz w przeglądarce stronę zarządzania wtyczkami: `chrome://extensions/` (lub `edge://extensions/`).
2. Włącz **Tryb dewelopera** (prawy górny róg).
3. Kliknij **"Załaduj rozpakowane"** ("Load unpacked").
4. Wybierz folder `extension/` z pobranego repozytorium `algorytm_konecznego`.