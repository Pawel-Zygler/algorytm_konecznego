# algorytm_konecznego
algorytm badawczy feliksa konecznego

## Jak to wygląda?
Poniżej znajduje się zrzut ekranu pokazujący działanie wtyczki podczas analizowania tekstu ze strony internetowej w locie:

![Screenshot z działania wtyczki](extension/screenshot.png)

## Instalacja

Aby uruchomić projekt lokalnie, musisz pobrać całe to repozytorium (zawiera ono zarówno serwer backendowy, jak i kod wtyczki przeglądarkowej).

### Krok 1: Klonowanie repozytorium i instalacja zależności
Pobierz kod i zainstaluj wymagane biblioteki Pythona dla backendu:
```bash
git clone https://github.com/Pawel-Zygler/algorytm_konecznego.git
cd algorytm_konecznego
pip install -r backend/requirements.txt
```

### Krok 2: Konfiguracja klucza API
Skopiuj plik szablonu zmiennych środowiskowych i dodaj swój własny klucz do API Google Gemini:
```bash
cp backend/.env.template backend/.env
```
Otwórz utworzony plik `backend/.env` i podmień wartość `GEMINI_API_KEY` na swój własny, działający klucz.

### Krok 3: Uruchomienie serwera backendowego
Z poziomu głównego folderu uruchom serwer FastAPI:
```bash
python3 -m backend.main
```
Serwer powinien wystartować pod adresem `http://127.0.0.1:8000`. Backend musi działać w tle, aby wtyczka miała się z czym komunikować.

### Krok 4: Instalacja wtyczki w przeglądarce (Chrome/Edge)
1. Otwórz w przeglądarce stronę zarządzania wtyczkami: `chrome://extensions/` (lub `edge://extensions/`).
2. Włącz **Tryb dewelopera** (prawy górny róg).
3. Kliknij **"Załaduj rozpakowane"** ("Load unpacked").
4. Wybierz folder `extension/` z pobranego repozytorium `algorytm_konecznego`.