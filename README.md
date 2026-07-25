# Algorytm Konecznego

Cyfrowe narzędzie analityczne i wtyczka przeglądarkowa wdrażająca historiozoficzny **Algorytm Konecznego** do analizy cywilizacyjnej i etycznej tekstów w locie.

![Screenshot z działania wtyczki](extension/screenshot.png)
![Screenshot z analizy artykułu Wikipedia](extension/screenshot2.png)

---

## 🏛️ Struktura Indeksów Analitycznych

Algorytm analizuje tekst chronologicznie w 5 krokach historiozoficznych Feliksa Konecznego:

1. **Krok 1: Indeks Sakralności (Przemiana Cywilizacyjna)**:
   - Mierzy stopień uświęcenia prawa i państwa oraz odrzucenie statolatrii i cezaropapizmu (13 wskaźników).

2. **Krok 2: Supremacja Ducha** (Agregacja 12 pod-indeksów):
   - Mierzy dominację sił duchowych nad fizyczną przymusowością w 12 obszarach:
     - **Dualizm Prawny** (`LEGAL_DUALISM_INDEX`)
     - **Pluralizm Źródeł Prawa** (`LAW_SOURCE_PLURALISM_INDEX`)
     - **Prawo Aposterioryczne vs Apriori** (`APOSTERIORI_APRIORI_INDEX`)
     - **Organizm vs Mechanizm** (`ORGANISM_MECHANISM_INDEX`)
     - **Personalizm** (`PERSONALISM_INDEX`)
     - **Autonomia Rodziny** (`FAMILY_LAW_AUTONOMY_INDEX`)
     - **Niezależność Kościoła** (`CHURCH_INDEPENDENCE_INDEX`)
     - **Stabilność Własności** (`PROPERTY_RIGHTS_STABILITY_INDEX`)
     - **Ciągłość Dziedziczenia** (`INHERITANCE_CONTINUITY_INDEX`)
     - **Supremacja Moralności** (`MORALITY_SUPREMACY_INDEX`)
     - **Totalność Moralności Publicznej** (`PUBLIC_MORALITY_TOTALITY_INDEX`)
     - **Odpowiedzialność Urzędnicza** (`ADMINISTRATIVE_RESPONSIBILITY_INDEX`)

3. **Krok 3: Szereg Personalistyczny (Generalia Etyki - Siedem Niewiadomych)**:
   - Wylicza wskaźnik spójności etycznej (`ethical_coherence_score`) oraz diagnozuje **Szereg Personalistyczny** (Cywilizacja Łacińska) vs **Szereg Gromadnościowy** vs **⚠️ Mieszankę Trującą** (stan acywilizacyjny).
   - Zawiera 7 pod-indeksów etycznych:
     - **Personalistyczne Źródło Obowiązku** (`duty_source` - 13 wskaźników)
     - **Motywacja i Bezinteresowność** (`motivation` - 14 wskaźników)
     - **Natura Sprawiedliwości** (`justice_nature` - 16 wskaźników)
     - **Status Sumienia: Autonomia vs Heteronomia** (`conscience_status` - 15 wskaźników)
     - **Opanowanie Czasu i Historyzm** (`time_mastery` - 15 wskaźników)
     - **Ethos Pracy i Uświęcenie** (`work_ethos` - 14 wskaźników)

4. **Krok 4: Chyżość Historyczna (Wydajność Cywilizacyjna)**:
   - Mierzy zdolność społeczności do **kapitalizowania i oszczędzania czasu** dla przyszłych pokoleń (zamiast powracania do stanu początkowego *ab ovo*).

5. **Krok 5: Współmierność Pięciomianu Bytu (QUINCUNX_COHERENCE_INDEX)**:
   - Badanie harmonijnej spójności 5 sfer bytu (Dobro, Prawda, Zdrowie, Dobrobyt, Piękno) wyliczane za pomocą średniej geometrycznej $\sqrt[5]{D \cdot P \cdot Z \cdot Db \cdot Pi}$ oraz mnożnika spójności $Consistency\_Factor$.

---

## ⚡ Przyspieszenie Dewelopmentu i Testowania (Dev Speedup)

Projekt zawiera wbudowane narzędzia zapewniające natychmiastowy feedback i kontrolę testów:

### 1. Testy Pytest: Mocked Unit Tests vs. Live API Tests
- **Szybkie testy jednostkowe (0.7s, koszt $0)**:
  ```bash
  python3 -m pytest tests/unit/
  ```
  Testują całą matematykę backendową, wyliczanie wskaźników, ostrzeżenia o mieszance trujące i struktury JSON bez wykonywania połączeń sieciowych.

- **Testy integracyjne z live Gemini API**:
  ```bash
  python3 -m pytest tests/live/
  ```
  Testują rzeczywiste odpowiedzi modelu Gemini i automatyczną atrybucję nagłówków wiadomości ze świata.

### 2. Wybór Indeksów we Wtyczce za pomocą Checkboxów
Wybór badanych indeksów odbywa się bezpośrednio z poziomu interfejsu graficznego wtyczki Chrome za pomocą dynamicznych pól zaznaczenia (checkboxów), bez konieczności edycji kodu.

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

### Krok 2: Konfiguracja klucza API w backendzie (Opcjonalnie)
Skopiuj plik szablonu zmiennych środowiskowych i dodaj swój klucz do API Google Gemini:
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

### Krok 5: Konfiguracja klucza API bezpośrednio we wtyczce Chrome
1. Kliknij ikonę wtyczki **Analiza Konecznego** na pasku narzędzi przeglądarki Chrome.
2. Wklej swój **Klucz Gemini API** (lub TON API) w polu tekstowym *Gemini API Key*.
3. Zaznacz wybrane indeksy analityczne za pomocą checkboxów.
4. Kliknij przycisk **Zapisz Ustawienia**. Wtyczka połączy się z backendem i zapisze Twoje preferencje.