# Chrome Web Store Submission Guide

Ten plik zawiera gotowe teksty do skopiowania w formularzu **Google Chrome Web Store Developer Dashboard** podczas publikacji wtyczki.

---

## 1. Store Listing (Dane podstawowe)

- **Item name (Nazwa wtyczki):**
  `Koneczny Civilization Analyzer`

- **Summary (Krótki opis - max 132 znaki):**
  `Narzędzie badawczo-edukacyjne oparte na historyczno-filozoficznej metodzie porównawczej prof. Feliksa Konecznego (1862–1949).`

- **Detailed description (Szczegółowy opis w sklepie):**
```markdown
Koneczny Civilization Analyzer to cyfrowe narzędzie badawczo-edukacyjne oparte na historyczno-filozoficznej metodzie porównawczej prof. Feliksa Konecznego (1862–1949).

Wtyczka umożliwia analizę tekstów źródłowych (artykułów naukowych, aktów prawnych, konstytucji oraz dokumentów historycznych i publicznych) pod kątem klasycznych kategorii historiozoficznych:
- Dwoistości prawa (prywatnego i publicznego),
- Pięciomianu bytu społecznego (Quincunx: Dobro, Prawda, Zdrowie, Dobrobyt, Piękno),
- Statusu i suwerenności autokrytyki sumienia oraz personalizmu,
- Indeksu sakralności porządku prawnego i supremacji ducha.

Główne cechy:
- Działa bezpośrednio w przeglądarce (Direct Chrome Mode z użyciem klucza Google Gemini API).
- Wspiera analizę stron HTML oraz dokumentów PDF.
- Interaktywny panel z wykresami (radar Quincunxa, szczeble zrzeszenia cywilizacyjnego, drzewo mantis).
- Eksport pełnych wyników badań i diagnozy do ustrukturyzowanego formatu JSON.

Uwaga metodologiczna: Narzędzie służy wyłącznie do celów edukacyjnych, akademickich i badawczych. Klasyfikacje odnoszą się ściśle do struktur systemów prawnych i normatywnych opisanych w dziełach prof. Konecznego.
```

- **Category (Kategoria):**
  `Productivity` lub `Education / Academic`

---

## 2. Privacy Practices & Permissions Justification (Uzasadnienia uprawnień)

### A. Single Purpose (Jednolity cel rozszerzenia)
> `Educational and research text analysis of public web pages and documents using the comparative historiosophical model of Feliks Koneczny.`

### B. Uzasadnienie uprawnienia: `<all_urls>` (Host Permissions)
> `The extension injects a floating on-page analysis trigger across web pages (such as Wikipedia, educational portals, and online PDF documents) so that users can request on-demand civilizational textual analysis on any informational document they are browsing.`

### C. Uzasadnienie uprawnienia: `storage`
> `Required to store the user-provided Google Gemini API key securely on the local device, as well as to keep local analysis history and cached indicators without using any external analytics server.`

### D. Uzasadnienie uprawnienia: `activeTab`
> `Allows the extension to read the text content and document title of the currently focused tab when the user initiates analysis.`

---

## 3. Data Usage & Limited Use Declarations (Deklaracje danych)

W sekcji **User Data Privacy** w Chrome Web Store Dashboard zaznacz:

1. **Website Content:**
   - Zaznacz: **Yes** (Czytana treść strony jest przesyłana wyłącznie do oficjalnego API Google Gemini w celu wygenerowania analizy na żądanie użytkownika).
2. **Authentication Information:**
   - Zaznacz: **Yes** (Klucz API użytkownika jest przechowywany w lokalnej pamięci podręcznej przeglądarki `chrome.storage.local`).
3. **Limited Use Certification:**
   - Potwierdź, że dane nie są sprzedawane osobom trzecim, nie są używane do celów reklamowych, scoringu kredytowego ani pożyczkowego.
4. **Privacy Policy Link:**
   - Wklej publiczny URL do pliku `PRIVACY_POLICY.md` (np. `https://github.com/<twoj-username>/algorytm_konecznego/blob/main/PRIVACY_POLICY.md`).
