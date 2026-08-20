# 🏛️ DESIGN DOCUMENT: ALGORYTM KONECZNEGO
### *Cyfrowe Narzędzie Analizy Historiozoficznej i Komparatystyki Cywilizacyjnej*

---

## 1. Wprowadzenie i Cel Systemu

**Algorytm Konecznego** to zaawansowany system analityczny oparty na metodzie historiozoficznej profesora Feliksa Konecznego (1862–1949). Narzędzie przekształca teoretyczne monografie badacza w indukcję cyfrową: analizuje dowolny tekst źródłowy (artykuły, ustawy, konstytucje, orzeczenia sądowe, manifesty, transkrypcje) i określa jego profil cywilizacyjny, stopień sakralizacji, supremację ducha, spójność etyczną (Siedem Niewiadomych), wydajność historyczną, współmierność Pięciomianu Bytu (Quincunx) oraz obecność kłamstwa cywilizacyjnego.

---

## 2. Architektura Wysokiego Poziomu (High-Level Architecture)

System składa się z trzech ściśle zintegrowanych warstw:
1. **Warstwa Klienta (Extension / Frontend Overlay)** – Rozszerzenie przeglądarki Chrome działające w izolowanym Shadow DOM, generujące interaktywny dashboard i wizualizacje.
2. **Warstwa Logiki i Serwera (FastAPI Backend Engine)** – Asynchroniczny silnik w Pythonie parsujący tekst, orchestrator zapytań LLM, walidator schematów Pydantic oraz moduł wyliczania metryk Konecznego.
3. **Warstwa Modelu Językowego i Pamięci (LLM & Data Tier)** – Integracja z Gemini API / Ollama / mockami deterministycznymi oraz baza ClickHouse / SQLite dla statystyk i pamiątek dziejowych.

```mermaid
graph TD
    User([Użytkownik / Przeglądarka]) -->|Zaznaczenie tekstu / Cała strona| Ext[Chrome Extension Content Script]
    Ext -->|Shadow DOM Isolation| UI[Panel Nakładki UI]
    
    Ext -->|POST /analyze JSON payload| Backend[FastAPI Backend Engine :8005]
    
    subgraph Backend Engine
        Parser[Text Extractor & Sanitizer] --> Chunk[Chunker & Prompt Builder]
        Chunk --> Orchestrator[LLM Multi-Prompt Orchestrator]
        Orchestrator --> LLM[Google Gemini API / Ollama Local]
        LLM --> Validator[JSON Schema & Pydantic Validator]
        Validator --> Metrics[Koneczny Historiosophy Math Engine]
        Metrics --> Cache[(ClickHouse / SQLite Cache)]
    end

    Metrics -->|Pełny raport JSON| Ext
    UI -->|Renderowanie| Dash[Dashboard & Quincunx Radar & Stepper Timeline]
    UI -->|Pobierz raport| Download[Eksport JSON]
```

---

## 3. Potok Przetwarzania Historiozoficznego (5 Kroków Metody Indukcyjnej)

Przetwarzanie tekstu w silniku analitycznym realizowane jest ściśle według założeń naukowej metody Konecznego:

```mermaid
flowchart LR
    Input([Tekst Źródłowy]) --> Step1[Krok 1: Indeks Sakralności\n13 wskaźników]
    Step1 --> Step2[Krok 2: Supremacja Ducha\n12 indeksów]
    Step2 --> Step3[Krok 3: Szereg Personalistyczny\n7 Generaliów Etycznych]
    Step3 --> Step4[Krok 4: Oponowanie Czasu\nChyżość Historyczna]
    Step4 --> Step5[Krok 5: Quincunx Bytu\nWspółmierność 5 Sfer]
    Step5 --> Step6[Krok 6: Test Kłamstwa\n5 Wektorów Rozkładu]
    Step6 --> Synthesis[Synteza Dziejowa & Klasyfikacja]
```

### Szczegółowa specyfikacja kroków:

```mermaid
classDiagram
    class Krok1_Sakralnosc {
        +Float religious_law_supremacy
        +Float theocratic_authority
        +Float dogmatic_jurisprudence
        +Float fatalism_vs_causality
        +Float sacral_monism
        +Score 0.0 - 1.0 (Niski: Łacińska, Wysoki: Arabska/Żydowska)
    }

    class Krok2_Supremacja_Ducha {
        +Float legal_dualism
        +Float conscience_autonomy
        +Float official_accountability
        +Float private_property_security
        +Score 0.0 - 1.0 (Wysoki: Łacińska, Niski: Turańska/Bizantyńska)
    }

    class Krok3_Siedem_Niewiadomych {
        +Duty (Obowiązek)
        +Disinterestedness (Bezinteresowność)
        +Responsibility (Odpowiedzialność)
        +Justice (Sprawiedliwość)
        +Conscience (Sumienie)
        +TimeCategory (Kategoria Czasu)
        +WorkEthos (Etos Pracy)
        +CoherenceScore 0.0 - 7.0
    }

    class Krok4_Chyzosc_Historyczna {
        +Float time_mastery
        +Float generational_planning
        +Float historic_awareness
        +Score 0.0 - 1.0
    }

    class Krok5_Quincunx {
        +Float dobro (Moralność)
        +Float prawda (Nauka/Poznanie)
        +Float zdrowie (Fizyczność)
        +Float dobrobyt (Ekonomia)
        +Float piekno (Estetyka)
        +CoherenceScore (Współmierność)
    }

    Krok1_Sakralnosc --> Krok2_Supremacja_Ducha
    Krok2_Supremacja_Ducha --> Krok3_Siedem_Niewiadomych
    Krok3_Siedem_Niewiadomych --> Krok4_Chyzosc_Historyczna
    Krok4_Chyzosc_Historyczna --> Krok5_Quincunx
```

---

## 4. Architektura UI Dashboardu i Modułów Wizualnych

Dashboard w nakładce Chrome (`extension/content.js`) jest podzielony na ergonomiczne sekcje informacyjne:

```mermaid
graph TD
    Root[Panel Nakładki Algorytmu Konecznego v1.4.6]
    
    Root --> Header[Górny Pasek: Tytuł + Wersja + 💾 Zapisz Wyniki + Zamknij]
    Root --> Dash[Koneczny Dashboard]
    Root --> Tabs[Nawigacja Zakładkowa 1-6]
    Root --> Details[Widoki Szczegółowe Zakładek z Kartami Akordeonowymi]

    subgraph Dashboard Podsumowujący
        Dash --> R1[Rząd 1: Cywilizacja\nChipy + Spektrum Wpływów + Zaawansowanie Zrzeszenia]
        Dash --> R2[Rząd 2: Prawo\nDualizm vs Monizm Państwowy/Prywatny/Sakralny]
        Dash --> R3[Rząd 3: Religia\nUniwersalna / Plemienna / Sakralna / Kastowa / Świecka]
        Dash --> R4[Rząd 4: Cele Społeczeństwa\nSpoza Walki o Byt / Ustrój Obozowy / Machina / Formalizm]
        Dash --> R5[Rząd 5: Emancypacja Rodziny\nMonogamia i Własność / Ustrój Rodowy / Poligamia / Statolatria]
        Dash --> Kpi[5 Boksów KPI Kroków 1-5]
        Dash --> Radar[Pajęczyna Quincunxa 5 Sfer + 6 Kart Statusu]
    end

    subgraph Zaawansowanie Cywilizacyjne Zrzeszenia - Mountain Climber Steps
        R1 --> M6[Poziom 06: Naród Organiczny - 100%]
        R1 --> M5[Poziom 05: Personalizm i Dualizm - 91%]
        R1 --> M4[Poziom 04: Emancypacja Rodziny - 82%]
        R1 --> M3[Poziom 03: Pętla Monizmu - 73%]
        R1 --> M2[Poziom 02: Ród Imienny - 64%]
        R1 --> M1[Poziom 01: Gromadztwo Bezimienne - 55%]
        R1 --> SDetail[Interaktywny Panel Szczegółów Szczebla]
    end
```

---

## 5. Matryca Klasyfikacji Cywilizacji i Ustrojów

Poniższa tabela przedstawia zasady indukcyjnej kategoryzacji tekstu przez algorytm:

| Cywilizacja | Supremacja Ducha | Sakralność | Prawo | Religia | Rodzina i Majątek | Czas i Praca |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **Łacińska** | **Wysoka (>50%)** | **Niska (<30%)** | **Dualizm Prawny** (prywatne + publiczne) | Uniwersalna etyczna (autonomia sumienia) | Monogamia dożywotnia, pełna emancypacja, własność prywatna | Czas linearny, praca wolna i celowa |
| **Bizantyńska** | Niska (<45%) | Niska | **Monizm Prawa Publicznego** (państwowy) | Państwowa / Podporządkowana | Rodzina zdominowana przez biurokrację i etatyzm | Czas mechaniczny, praca regulowana ustawą |
| **Turańska** | Bardzo niska (<30%) | Niska | **Monizm Prawa Prywatnego** (władcy) | Areligijność / Formalizm | Rodzina w ustroju obozowym, brak stabilnej własności | Czas doraźny, praca przymusowa / wojenny podbój |
| **Arabska** | Średnia/Niska | **Bardzo wysoka (>60%)** | **Monizm Sakralny** (Szariat/Teokracja) | Państwowa / Sakralna | Poligamia dopuszczalna, brak pełnej emancypacji majątkowej | Fatalizm dziejowy, rytuał ponad pragmatykę |
| **Żydowska** | Specyficzna | **Wysoka (>50%)** | **Monizm Prawno-Sakralny** | Narodowa / Prawotwórcza | Silna tradycja rodowa, kazuistyka prawna | Czas mesjanistyczny, ścisły legalizm |
| **Bramińska** | Niska | Wysoka | **Monizm Kastowo-Rytualny** | Monolatria / Kastowa | Podział kastowy, ustrój rodowo-wielorodzinny | Reinkarnacja, bierność dziejowa |
| **Chińska** | Niska | Niska | **Monizm Etykietowo-Rodowy** | Areligijna (kult przodków) | Ustrój rodowy (klanowy), brak niezależności syna za życia ojca | Czas cykliczny, brak dogmatów |

---

## 6. Model Danych Wyjściowych (JSON Schema Export)

Przycisk **`💾 Zapisz wyniki`** w nagłówku eksportuje raport w poniższym formacie:

```json
{
  "meta": {
    "aplikacja": "Algorytm Konecznego - Analiza Cywilizacyjna",
    "metoda": "Historiozoficzna metoda Feliksa Konecznego",
    "wersja": "1.4.6",
    "data_analizy": "2026-08-20T17:45:00.000Z",
    "url": "https://pl.wikipedia.org/wiki/Rzeczpospolita",
    "tytuł_strony": "Rzeczpospolita Obojga Narodów"
  },
  "klasyfikacja_dashboard": {
    "cywilizacja_główna": "Łacińska",
    "diagnoza_cywilizacyjna": "Dominacja norm personalistycznych i dualizm prawny",
    "sakralność": 0.08,
    "supremacja_ducha": 0.88,
    "etyka_7_generaliów": 6.8,
    "chyżość_historyczna_oponowanie_czasu": 0.85,
    "quincunx_pięciomian_bytu": 0.92,
    "kłamstwo_cywilizacyjne_procent": 4.0
  },
  "spektrum_cywilizacyjne": [
    { "key": "latin", "label": "Łacińska", "color": "#10b981", "pct": 88 },
    { "key": "byzantine", "label": "Bizantyńska", "color": "#8b5cf6", "pct": 8 },
    { "key": "jewish", "label": "Żydowska", "color": "#ec4899", "pct": 4 }
  ],
  "kategorie_pięciomianu_quincunx": {
    "dobro": 0.95,
    "prawda": 0.92,
    "zdrowie": 0.84,
    "dobrobyt": 0.88,
    "piekno": 0.82
  },
  "surowe_oceny_indeksów": {
    "sacrality_scores": {},
    "spirit_scores": {},
    "generalia_scores": {},
    "chyznosc_scores": {},
    "quincunx_scores": {},
    "lie_scores": {}
  }
}
```

---

## 7. Testy i Walidacja Jakościowa

Projekt utrzymuje 100% pokrycia kluczowych scenariuszy historycznych testami jednostkowymi (`pytest tests/unit`):
- `test_poland_wikipedia_scenario`: Weryfikacja cywilizacji łacińskiej, wysokiej supremacji ducha i dualizmu prawnego dla tradycji Rzeczypospolitej.
- `test_taliban_wikipedia_scenario`: Weryfikacja monizmu sakralnego i cywilizacji arabsko-sakralnej dla teokracji szariatu.
- `test_prl_scenario`: Weryfikacja przypisania totalitarnego państwa komunistycznego do cywilizacji bizantyńsko-turańskiej i monizmu państwowego (zamiast łacińskiej).
- `test_france_2026_laicite_scenario`: Weryfikacja ustroju laickiego i rozdzielności prawa świeckiego.
- `test_polona_digital_library_scenario`: Test ekstrakcji i analizy druków ulotkowych i zdigitalizowanych zasobów dziedzictwa.
