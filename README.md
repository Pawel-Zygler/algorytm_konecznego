# algorytm_konecznego
algorytm badawczy feliksa konecznego

## Jak to wygląda?
Poniżej znajduje się zrzut ekranu pokazujący działanie wtyczki podczas analizowania tekstu ze strony internetowej w locie:

![Screenshot z działania wtyczki](extension/screenshot.png)

## Instalacja
1. Odpal serwer backendowy:
```bash
cd /Users/pawelzygler/Documents/programowanie/algorytm_konecznego
python3 -m backend.main
```
2. Załaduj wtyczkę w przeglądarce (np. Chrome/Edge):
   - Wejdź w `chrome://extensions/`
   - Włącz tryb dewelopera ("Developer mode")
   - Kliknij "Load unpacked" i wybierz folder `extension/` z tego repozytorium.