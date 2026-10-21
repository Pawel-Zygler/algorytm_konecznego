# Algorytm Konecznego

Teoria cywilizacji Feliksa Konecznego w formie aplikacji i wtyczki do przeglądarki.

![Analiza Algorytmem Konecznego - Dashboard i Szczebel Cywilizacyjny](extension/dasz4.png)
![Analiza Algorytmem Konecznego - Drzewo Decyzyjne Mantis i Profil Cywilizacyjny](extension/dasz9.png)
![Analiza Algorytmem Konecznego - Schemat Klasyczny Konecznego (German Confederation)](extension/germian_confederation.png)
![Analiza Algorytmem Konecznego - Panel Analityczny i Aura Silnika](extension/dasz13.png)

<details>
<summary><b>Szybki start (Instalacja i uruchomienie)</b></summary>

### 1. Backend
```bash
git clone https://github.com/Pawel-Zygler/algorytm_konecznego.git
cd algorytm_konecznego
pip install -r backend/requirements.txt
cp backend/.env.template backend/.env  # wpisz GEMINI_API_KEY z Google AI Studio
make start                            # serwer: http://127.0.0.1:8005 (stop: make stop)
```

### 2. Wtyczka Chrome / Edge
1. Otwórz `chrome://extensions/` i włącz **Tryb dewelopera**.
2. Kliknij **Załaduj rozpakowane** i wskaż folder `extension/`.
3. Kliknij ikonę wtyczki, wpisz klucz API i zapisz.
4. Kliknij portret profesora w rogu strony, aby zbadać tekst.

</details>

<details>
<summary><b>5 Kroków Historiozoficznych (Indeksy)</b></summary>

1. **Sakralność:** sacrum vs profanum (świeckość a teokracja).
2. **Supremacja Ducha:** prymat etyki, dualizm prawny, wolność rodziny i własności.
3. **Generalia Etyki:** 7 kategorii moralnych (Szereg Personalistyczny).
4. **Chyżość Historyczna:** zdolność akumulacji dorobku pokoleń.
5. **Quincunx (Pięciomian Bytu):** współmierność sfer: Dobro, Prawda, Zdrowie, Dobrobyt, Piękno.

</details>

<details>
<summary><b>Tryby Silnika: Mantis, Lite i Full</b></summary>

### 1. 🦗 Mantis AI (Reguła Pareto 80/20)
Szybka klasyfikacja przez 6 sekwencyjnych bramek decyzyjnych:

```mermaid
flowchart TD
    Start([📄 Badany tekst]) --> B1{1. Sakralność vs Świeckość\nSACRALITY_INDEX}
    
    B1 -- "Wysoka (>= 0.40)\nŚcieżka Sakralna" --> B6{6. Moralność Publiczna\nPUBLIC_MORALITY_TOTALITY}
    B1 -- "Niska (< 0.40)\nŚcieżka Świecka" --> B2{2. Dualizm Prawny\nLEGAL_DUALISM_INDEX}
    
    B2 -- "Dualizm Prawny\nAutonomia prawa prywatnego" --> CivLatin["🏛️ CYWILIZACJA ŁACIŃSKA"]
    B2 -- "Monizm Prawny\nWładza pochłania prawo" --> B3{3. Władza - Religia - Duch\nCHURCH_INDEPENDENCE}
    
    B3 -- "Cezaropapizm / Etatyzm\nBiurokracja" --> B4{4. Status Sumienia\nCONSCIENCE_STATUS}
    B3 -- "Monizm Siły / Wodza\nWładca właścicielem wszystkiego" --> B5{5. Podmiotowość Jednostki\nPERSONALISM_INDEX}
    B3 -- "Areligijność / Kult Przodków\nUstrój Rodowy" --> CivChina["☯️ CYWILIZACJA CHIŃSKA"]
    
    B4 -- "Dwoistość Sumienia\n(Etyka prywatna vs racja stanu)" --> CivByz["👑 CYWILIZACJA BIZANTYŃSKA"]
    B5 -- "Ustrój Obozowy\nBrak własności prywatnej" --> CivTur["🏹 CYWILIZACJA TURAŃSKA"]
    
    B6 -- "Monizm Sakralny (Umma)\nPowszechna teokracja" --> CivArab["🌙 CYWILIZACJA ARABSKA"]
    B6 -- "Etyka Podwójna\nPartykularyzm rodowo-sakralny" --> CivJew["📜 CYWILIZACJA ŻYDOWSKA"]
```

- **Sakralność:** cywilizacje sakralne vs świecko-rozumowe.
- **Dualizm prawny:** prymat etyki i autonomia prawa prywatnego (Łacina).
- **Niezależność Kościoła:** etatyzm vs siła vs kult rodu vs wolność sumienia.
- **Status sumienia:** jedność etyczna vs podwójna moralność.
- **Personalizm:** wolna osoba vs narzędzie władzy.
- **Moralność publiczna:** monizm sakralny vs etyka rodowa.

---

### 2. ⚡ Lite Scan
Szybki skan (1-3 prompty) kluczowych indeksów dający wstępny profil w parę sekund.

---

### 3. ✨ Full Kosmos
Pełna synteza: 27 indeksów, 352 pytania, radar Quincunxa i Szereg Personalistyczny.

</details>

<details>
<summary><b>Testy automatyczne (Playwright E2E & Unit)</b></summary>

Automatyzacja w TypeScript (`e2e/`) zintegrowana z CI/CD:
- **Powtarzalność:** czyste profile tymczasowe bez blokad.
- **Wznawianie:** `make test-resume` (wznawia tylko nieudane testy).
- **Diagnostyka:** logi ze znacznikami czasu, zrzuty ekranu, HTML Shadow DOM i trace.
- **Polecenia:**
  - `make test-smoke` – szybki test wtyczki (domyślny)
  - `make test-logs` – uruchomienie z logami zdarzeń na żywo
  - `make test-resume` – wznowienie od błędu (`--last-failed`)
  - `make test-repeat` – 3 cykle powtórzeń (stabilność)
  - `make test-ui` – interfejs graficzny Playwright
  - `make test-trace` – generowanie `trace.zip`
  - `make test-report` – raport HTML
  - `make test-all` – testy jednostkowe + E2E

Szczegóły: [e2e/README.md](e2e/README.md).

</details>