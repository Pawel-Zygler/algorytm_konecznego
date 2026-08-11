# Changelog - Algorytm Konecznego

Wszystkie znaczące zmiany w projekcie **Algorytm Konecznego** (metoda historiozoficzna badania cywilizacji) będą dokumentowane w tym pliku.

Format opiera się na zasadach [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/).

## [1.4.0] - 2026-08-11

### Zmienione (Changed)
- **Rozszerzone okno popupu bez przewijania (No-scroll UI)**: Poszerzono okno wtyczki z `26rem` do `35rem` (560px) oraz usunięto limity wysokości `max-height`, sprawiając że wszystkie opcje są widoczne od razu bez paska przewijania.
- **Kroki Algorytmu Konecznego na początku listy**: Zreorganizowano checkboxy wtyczki, umieszczając najpierw 5 Głównych Kroków Algorytmu (Krok 1 - Krok 5), a pod nimi pod-indeksy w dwukolumnowym układzie grid.
- **Poprawione zachowanie przycisku 'Czystość'**: Naprawiono zapamiętywanie pustego wyboru checkboxów w Chrome Storage po kliknięciu przycisku 'Czystość'.

---

## [1.3.9] - 2026-08-11

### Dodane (Added)
- **Opis limitów Quota 429 dla Gemini API i sekcja instrukcji Ollama w README.md**: Sprecyzowano, że limity zapytań Quota 429 dotyczą darmowej wersji API Google Gemini oraz dodano osobną, rozwiniętą sekcję wyjaśniającą bezpłatną, lokalną analizę za pomocą narzędzia Ollama.

---

## [1.3.8] - 2026-08-11

### Dodane (Added)
- **Opis historiozoficzny w sekcji głównej (README.md)**: Zaktualizowano opis główny projektu na stronie głównej o sformułowanie charakteryzujące cyfrowe narzędzie jako praktyczny pomost od monografij do metody indukcyjnej badania quincunxa, trójprawa oraz ścierania się cywilizacyj i etyk w tekstach.

---

## [1.3.7] - 2026-08-11

### Zmienione (Changed)
- **Klucz API Label i Czystość Interfejsu**: Zmieniono etykietę w ustawieniach wtyczki na „Klucz API”, rozwinięto domyślnie zwinięte sekcje w dokumentacji `README.md` oraz usunięto zbędne dekoracyjne ikonki/emoji z interfejsu i dokumentacji.

---

## [1.3.6] - 2026-08-10

### Dodane (Added)
- **Obsługa Lokalnego Dostawcy LLM Ollama z Modelami GLM-5.2 / GLM-4 / Llama 3**: Dodano pełne wsparcie dla lokalnego wywoływania modeli LLM (bez limitów tokenów i zapytań 429) poprzez integrację REST API Ollama (`http://localhost:11434`), z możliwością wyboru modelu `glm-5.2` poprzez zmienną środowiskową `OLLAMA_MODEL` lub klucz `ollama:glm-5.2` we wtyczce.

---

## [1.3.5] - 2026-08-10

### Dodane (Added)
- **Eksport i Pobieranie Raportów Wyników w Formacie JSON**: Dodano przycisk `📥 Pobierz JSON` w nagłówku oraz stopce panelu wtyczki, pozwalający wyeksportować pełne wyniki analizy cywilizacyjnej wraz z metadanymi i surowymi ocenami do pliku `.json`.

---

## [1.3.4] - 2026-08-06

### Dodane (Added)
- **Scenariusz 5: Test negatywny dla Francji 2026 (Laïcité)**: Wdrożono test negatywny weryfikujący niski wskaźnik sakralności (`sacrality_score <= 0.20`) dla współczesnej świeckiej Republiki Francuskiej w 2026 r.

---

## [1.3.3] - 2026-08-06

### Dodane (Added)
- **Tabelaryczny podział testów w CI na kroki i oczekiwane rezultaty**: Zbudowano czytelne podsumowanie GitHub Actions podzielone na numerowane kroki z osobnymi kolumnami dla opisu operacji, oczekiwanego rezultatu oraz statusu.

---

## [1.3.2] - 2026-08-06

### Dodane (Added)
- **Scenariusze testowe PDF i Obrazka OCR (Polona2.pl)**: Wdrożono testy automatyczne dla pliku PDF z Senatu RP (Konstytucja RP) oraz transkrypcji OCR ze zbiorów cyfrowych Polona2.pl wraz ze szczegółową inspekcją API w CI.

---

## [1.3.1] - 2026-08-06

### Dodane (Added)
- **Prezentacja API Body i Result w wynikach CI**: Rozbudowano opisy scenariuszy oraz dodano sekcje JSON z pełną treścią zapytania (Request Body) i wyniku (Response Result) w podsumowaniu GitHub CI i konsoli testów.

---

## [1.3.0] - 2026-08-06

### Poprawione (Fixed)
- **Bezpieczna weryfikacja klucza API w CI**: Zabezpieczono ekstraktację klucza API w backendzie oraz scenariuszowych testach CI przed pustymi zmiennymi środowiskowymi `GEMINI_API_KEY=""`.

---

## [1.2.9] - 2026-08-06

### Dodane (Added)
- **Automatyzacja CI/CD i Scenariusze API**: Wdrożono automatyczne testy integracyjne API w pytest i GitHub Actions dla 2 scenariuszy (Happy Path Polska na Wikipedii vs Talibowie teokracja) z prezentacją wyników w GitHub Step Summary.

---

## [1.2.8] - 2026-08-02

### Poprawione (Fixed)
- **MIME types i nazwy plików podglądu offline**: Zmieniono rozszerzenia stylów z `.php` na `.css` i skorygowano nazwy ścieżek na czytelne dla CDN, co przywróciło pełne stylizowanie Wikipedii w podglądzie offline.

---

## [1.2.7] - 2026-08-02

### Poprawione (Fixed)
- **Izolacja CSS w podglądzie offline**: Przywrócono powłokę Shadow DOM w plikach raportów offline z automatyczną hydratacją JS, eliminując nakładanie się stylów wtyczki na oryginalne strony Wikipedia.

---

## [1.2.6] - 2026-08-02

### Poprawione (Fixed)
- **Renderowanie podglądu offline**: Rozwinięto znaleziska w plikach HTML z wyciszonego `<template shadowrootmode="open">` na bezpośrednio widoczny element z automatyczną interaktywnością zakładek i kart.

---

## [1.2.5] - 2026-08-02

### Zmienione (Changed)
- **Otwieranie raportów w nowej karcie**: Przekształcono linki w README.md na tagi HTML `target="_blank"` wraz z usugą `htmlpreview`, pozwalając otwierać wyrenderowane strony wyników w nowej karcie przeglądarki.

---

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
