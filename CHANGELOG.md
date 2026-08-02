# Changelog - Algorytm Konecznego

Wszystkie znaczące zmiany w projekcie **Algorytm Konecznego** (metoda historiozoficzna badania cywilizacji) będą dokumentowane w tym pliku.

Format opiera się na zasadach [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

## [1.2.4] - 2026-08-02

### Dodane (Added)
- **Sekcja Trybu Offline w README.md**: Dodano bezpośrednie odnośniki do 6 gotowych raportów analitycznych HTML dla szybkiego podglądu działania bez instalacji.

---

## [1.2.3] - 2026-08-02

### Dodane (Added)
- **Przykłady offline w repozytorium**: Rozpakowano i udostępniono bez pakowania zbiór gotowych raportów analitycznych HTML dla Imperium Rzymskiego w folderze `examples/`.

---

## [1.2.2] - 2026-08-02

### Zmienione (Changed)
- **Rozmiary okien wtyczki**: Zwiększono szerokość panelu i okienka popup o 30% (panel z 600px na 780px, popup z 20rem na 26rem) oraz wysokość o 15% (max-height do 94vh).

---

## [1.2.1] - 2026-08-02

### Poprawione (Fixed)
- **Czytelność czcionek**: Usunięto zamazany text-shadow w loaderze, poprawiono kontrast czcionek i ustawiono stos fontów systemowych z antyaliasingiem.
- **Domyślne zakładki po analizie**: Zaimplementowano automatyczne przełączanie zakładek na wyliczony lub pierwszy wybrany indeks zaraz po zakończeniu analizy.
- **Status połączenia w popupie**: Dodano fallback IPv6/IPv4 (`localhost` vs `127.0.0.1`), czyszczenie URL oraz wydłużony timeout zapytań stanu serwera.
- **Obsługa Polona.pl i serwisów OCR**: Dodano analizę zaznaczonego tekstu (`window.getSelection()`), selektory OCR/transkrypcji dla archiwów cyfrowych oraz bezpieczne parsowanie JSON odpowiedzi Gemini API.

---

## [1.4.0] - 2026-07-28

### Dodane (Added)
- **Wskaźnik Kłamstwa Cywilizacyjnego (Civilizational Lie Index)**: Dodano eksperymentalny meta-indeks detekcji kłamstwa (na bazie punktu odniesienia *Civitas Dei*) z 5 wektorami składowymi i wykresem radarowym. Zintegrowano obsługę z poziomu checkboxa w UI.
- **Krok 4 Algorytmu (Chyżość Historyczna / Wydajność Cywilizacyjna)**: Zaimplementowano miarę zdolności badanej społeczności do kapitalizowania czasu (vs powrót *ab ovo*).
- **Krok 5 Algorytmu (Współmierność Quincunxa)**: Zrestrukturyzowano logikę harmonijnej spójności 5 sfer bytu poprzez wprowadzenie nowej, zaawansowanej formuły syntezy geometrycznej oraz wbudowano historię / pamięć analiz tekstu.
- **Alternatywne Warianty Interfejsu Graficznego (Mockupy)**: Zaprojektowano 6 gotowych, unikalnych koncepcji UI panelu wyników (w tym Mroczny Glassmorphism, Brutalizm Akademicki, Neumorfizm, Hacker HUD) z nowym wykresem półkolistym SVG (*semi-circle gauge*).
- **Skrypty Wydawnicze i Dystrybucyjne**: Stworzono skrypt `scripts/build_release.sh` oraz filtry `.gitattributes` drastycznie ułatwiające pakowanie i pobieranie czystej wersji wtyczki (pozbawionej testów i plików developerskich) z serwerów GitHuba. W README.md zawarto przykładowy pakiet analityczny offline (Imperium Rzymskie).

### Zmienione (Changed)
- Zastąpiono animację loadera (oczekiwania na odpowiedź) – z żartobliwej wizualizacji czołgu na elegancki, zarysowujący się portret Profesora.
- Poprawiono logikę i polaryzację ocen (naprawa błędu inwersji) dla Indeksu Sakralności.

### Usunięte (Removed)
- Wyrzucono z repozytorium przestarzałe "sieroty kodu" (martwe pliki `Score`, `isPersonalisticRow`, `Generalia_enum`) oraz odpowiadające im odwołania w backendzie.
- Oskubano plik instalacyjny `README.md` ze zbyt technicznej sekcji dla programistów (Dev Speedup).

## [1.3.0] - 2026-07-23

### Dodane (Added)
- **Krok 3 Algorithmu (Generalia Binarne)**: Zaimplementowano ocenę 7 binarnej niewiadomych etyki (0.0 = Szereg Gromadnościowy, 1.0 = Szereg Personalistyczny / Łaciński):
  1. `DUTY_SOURCE_PERSONALISTIC_INDEX` (Źródło Obowiązku: Etyka przed prawem vs Zewnętrzny przymus)
  2. `MOTIVATION_INDEX` (Motywacja: Bezinteresowność vs Utylitaryzm)
  3. `RESPONSIBILITY_TYPE_INDEX` (Rodzaj Odpowiedzialności: Osobista vs Zbiorowa)
  4. `JUSTICE_NATURE_INDEX` (Natura Sprawiedliwości: Słuszność etyczna vs Legalizm / Strictum ius)
  5. `CONSCIENCE_STATUS_INDEX` (Status Sumienia: Autonomia vs Heteronomia / litera)
  6. `TIME_MASTERY_INDEX` (Opanowanie Czasu: Historyzm / era vs Wegetacja)
  7. `WORK_ETHOS_INDEX` (Ethos Pracy: Uświęcenie / godność vs Przymus / jarzmo)
- **Nowy Plik Indeksu**: Utworzono [JUSTICE_NATURE_INDEX](file:///Users/pawelzygler/Documents/programowanie/algorytm_konecznego/indices/JUSTICE_NATURE_INDEX) z 16 pytaniami metodycznymi.
- **Alert Mieszanki Trującej (`MIXTURE_ALERT`)**: Wdrożono detekcję stanu acywilizacyjnego (kołobłędu etycznego) przy wyniku spójności `2.5 – 5.5`, informującym o zderzeniu etyk i paraliżu kultury czynu.
- **Interfejs Wtyczki (Zakładka #3)**: Dodano zakładkę **„Szereg Personalistyczny”** prezentującą `ethical_coherence_score` (0.0 - 7.0), diagnostyczny nagłówek oraz karty 7 generaliów.

### Zmienione (Changed)
- **Zaktualizowano [Generalia_enum](file:///Users/pawelzygler/Documents/programowanie/algorytm_konecznego/Generalia_enum)**: Ujednolicono nazwę `TIME_MASTERY_INDEX_v2` do `TIME_MASTERY_INDEX`.
- **Większa Spójność Pytaniowa**: Przekształcono pytania w plikach z folderu `indices/` na jednoznacznie dodatnią polaryzację.

---

## [1.2.0] - 2026-07-23

### Dodane (Added)
- **Animowany Loader Czołgu Konecznego (SVG Laser Arena)**: 
  - Zamieniono animację kręcącej się głowy na czołg z Profesorem Konecznym wyłaniającym się z włazu.
  - Zaimplementowano dynamiczny celownik lufy czołgu oraz laserowe pociski SVG strzelające i niszczące obcinające cywilizację przeszkody (`💥 GROMADNOŚĆ`, `💥 MECHANIZM`, `💥 STATOLATRIA`).
  - Zaimplementowano wchłanianie zielonych pojęć cywilizacyjnych (`⚡ PERSONALIZM`, `⚡ DUALIZM PRAWNY`, `⚡ ETYKA`).
- **Płynna Animacja Przycisków UI**: Główna ikona wtyczki (FAB) obraca się w czasie trwania zapytania RAG/LLM.

### Zaktualizowane (Updated)
- **Kolejność Modeli Gemini (`config.py`)**: Skorygowano listę `GEMINI_MODELS` do aktywnych aliasów (`gemini-2.0-flash`, `gemini-1.5-flash-latest`, `gemini-1.5-pro-latest`), eliminując 20-sekundowy opóźniający fallback błędu 404.

---

## [1.1.0] - 2026-07-22

### Dodane (Added)
- **Krok 2 Algorytmu (Supremacja Ducha - 12 Indeksów Składowych)**:
  - Zagregowano 12 indeksów: *Dualizm Prawny*, *Pluralizm Źródeł Prawa*, *Aposterioryzm*, *Organizm*, *Personalizm*, *Autonomia Rodziny*, *Niezależność Kościoła*, *Trwałość Własności*, *Ciągłość Dziedziczenia*, *Nadrzędność Moralności*, *Totalność Moralności Publicznej*, *Odpowiedzialność Urzędnicza*.
  - Utworzono kartę Hero Supremacji Ducha oraz Zakładkę #2 we wtyczce.

---

## [1.0.0] - 2026-07-10

### Dodane (Added)
- **Krok 1 Algorytmu (Indeks Sakralności - 13 Wskaźników)**: Mierzący czy porządek zrzeszenia posiada charakter sakralny czy świecko-etyczny.
- **Backend FastAPI i Wyszukiwanie RAG**: Wykorzystanie bazy wektorowej ChromaDB (51 plików z dziełami Konecznego, 18 612 fragmentów).
- **Chrome Extension UI**: Nakładka kontenerowa w postaci panelu bocznego (Shadow DOM) dla przeglądarki Chrome.
