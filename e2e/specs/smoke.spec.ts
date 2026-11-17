import { test, expect, mockHtmlFixture, mockAnalyzeFixture } from '../fixtures/extension.fixture';

test.describe('Smoke Suite: Inicjalizacja Wtyczki i Dashboardu na Wikipedii', () => {

  test('Krok 1: Weryfikacja załadowania wtyczki i obecności pływającego portretu Konecznego', async ({ page }) => {
    await mockHtmlFixture(page, 'https://pl.wikipedia.org/wiki/Polska', 'mock_polska.html');

    await page.goto('https://pl.wikipedia.org/wiki/Polska', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Weryfikacja obecności wstrzykniętego roota wtyczki
    const extensionRoot = page.locator('#koneczny-extension-root');
    await expect(extensionRoot).toBeAttached({ timeout: 15000 });

    // Weryfikacja widoczności pływającego portretu Konecznego (FAB trigger)
    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 10000 });
  });

  test('Krok 2: Uruchomienie analizy, otwarcie panelu bocznego i weryfikacja 5 zakładek metodologicznych', async ({ page }) => {
    // 1. Mockowanie strony Wikipedii i odpowiedzi backendu (/api/analyze) dla 100% stabilności offline
    await mockHtmlFixture(page, 'https://pl.wikipedia.org/wiki/Polska', 'mock_polska.html');
    await mockAnalyzeFixture(page, 'mock_polska_result.json');

    // 2. Wejście na stronę Wikipedii Polski
    await page.goto('https://pl.wikipedia.org/wiki/Polska', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 4. Kliknięcie portretu Konecznego w celu wywołania analizy i otwarcia panelu
    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 15000 });
    await konecznyTrigger.click();

    // 5. Weryfikacja czy panel otrzymał klasę .open
    const panel = page.locator('#koneczny-panel');
    await expect(panel).toHaveClass(/open/, { timeout: 10000 });

    // 6. Weryfikacja wyrenderowania Dashboardu Algorytmu Konecznego i diagnozy dla Polski
    const dashboard = page.locator('.koneczny-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 15000 });
    await expect(dashboard).toContainText('Łacińska');
    await expect(dashboard).toContainText('Dominacja norm personalistycznych');

    // Weryfikacja UI: aktywny węzeł niskiej sakralności (<0.40) dla Polski i brak sakralizmu
    await expect(dashboard.locator('text=Sakralność Niska (<0.40)').first()).toBeVisible();
    await expect(dashboard).not.toContainText('Sakralizm (Religia ponad etyką)');

    // Asercja 1: ZAAWANSOWANIE CYWILIZACYJNE ZRZESZENIA dla Polski
    const timelineBox = dashboard.locator('.civ-timeline-box');
    await expect(timelineBox).toBeVisible();
    await expect(timelineBox).toContainText('ZAAWANSOWANIE CYWILIZACYJNE ZRZESZENIA');
    await expect(timelineBox).toContainText('Trójkątne schody wspinaczki od gromadztwa po naród');
    await expect(timelineBox.locator('#civ-stage-badge')).toContainText('Stage #05');
    await expect(timelineBox.locator('button.civ-stage-btn[data-stage="4"]')).toContainText('POZIOM 05');
    await expect(timelineBox.locator('button.civ-stage-btn[data-stage="4"]')).toContainText('Personalizm');
    await expect(timelineBox.locator('button.civ-stage-btn[data-stage="4"]')).toContainText('OBECNY POZIOM');
    await expect(timelineBox.locator('#civ-stage-details-container')).toContainText('05. Personalizm (Emancypacja Osoby Ludzkiej)');
    await expect(timelineBox.locator('#civ-stage-details-container')).toContainText('Dualizm Prawny (Rozdzielność prawa prywatnego i publicznego)');
    await expect(timelineBox.locator('#civ-stage-details-container')).toContainText('Prymat Etyki nad Ustawą');

    // Asercja 2: PAJĘCZYNA QUINCUNXA (5 SFER BYTU) dla Polski
    const quincunxBox = dashboard.locator('.quincunx-radar-box');
    await expect(quincunxBox).toBeVisible();
    await expect(quincunxBox).toContainText('PAJĘCZYNA QUINCUNXA (5 SFER BYTU)');
    await expect(quincunxBox).toContainText('PAJĘCZYNA QUINCUNXA (5 SFER)');
    await expect(quincunxBox).toContainText('Dobro');
    await expect(quincunxBox).toContainText('Prawda');
    await expect(quincunxBox).toContainText('Zdrowie');
    await expect(quincunxBox).toContainText('Dobrobyt');
    await expect(quincunxBox).toContainText('Piękno');
    await expect(quincunxBox).toContainText('DOMINACJA');
    await expect(quincunxBox).toContainText('Łacińska');
    await expect(quincunxBox).toContainText('TRÓJPRAWO');
    await expect(quincunxBox).toContainText('Dualizm (Prawo Prywatne / Publiczne)');
    await expect(quincunxBox).toContainText('ETYKA');
    await expect(quincunxBox).toContainText('Hegemonia Etyki (Etyka ponad prawem)');
    await expect(quincunxBox).toContainText('KATEGORIA CZASU');
    await expect(quincunxBox).toContainText('Linearny / Progresywny (Planowanie pokoleniowe)');
    await expect(quincunxBox).toContainText('OSOBA / KLAN');
    await expect(quincunxBox).toContainText('Personalizm (Godność osoby ludzkiej)');
    await expect(quincunxBox).toContainText('CZYSTOŚĆ METODY');
    await expect(quincunxBox).toContainText('89%');

    // 7. Moduł drzewa decyzyjnego
    const decisionTree = page.locator('#decision-tree-container');
    await expect(decisionTree).toBeVisible();

    // 8. Obecność wszystkich 5 zakładek metodologicznych
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="mantis"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny_reverse"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny_time"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny_pillar"]')).toBeVisible();

    // 9. Sprawdzenie interaktywnego przełączenia na zakładkę 4 (Stosunek do czasu)
    const timeTabBtn = page.locator('.tree-subtab-btn[data-tree-tab="koneczny_time"]');
    await timeTabBtn.click();
    await expect(page.locator('text=Dla przykładu dorysujmy sobie jeszcze tabelkę według stosunku do czasu').first()).toBeVisible();

    // 10. Sprawdzenie przełączenia na zakładkę 5 (Systematyka - Pion Łaciński)
    const pillarTabBtn = page.locator('.tree-subtab-btn[data-tree-tab="koneczny_pillar"]');
    await pillarTabBtn.click();
    await expect(page.locator('text=PION WZORCOWY (ODNIESIENIE)').first()).toBeVisible();
    await expect(page.locator('text=Matryca Syntetyczna: Zestawienie 7 Cywilizacji').first()).toBeVisible();
  });

  test('Krok 3: Weryfikacja kontrolek nagłówka i przycisku eksportu raportu JSON', async ({ page }) => {
    await mockHtmlFixture(page, 'https://pl.wikipedia.org/wiki/Polska', 'mock_polska.html');
    await mockAnalyzeFixture(page, 'mock_polska_result.json');

    await page.goto('https://pl.wikipedia.org/wiki/Polska', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 15000 });
    await konecznyTrigger.click();

    // Weryfikacja przycisku pobierania JSON w nagłówku
    const downloadBtn = page.locator('#koneczny-download-header');
    await expect(downloadBtn).toBeVisible({ timeout: 15000 });

    // Weryfikacja sekundnika w nagłówku (licznik czasu ładowania i analizy)
    const timerHeader = page.locator('#koneczny-header-timer');
    await expect(timerHeader).toBeVisible({ timeout: 15000 });
    await expect(timerHeader).toContainText('⏱️');

    // Weryfikacja przycisku trybu pełnoekranowego (Fullscreen) obok 'Zapisz wyniki'
    const fullscreenBtn = page.locator('#koneczny-fullscreen-header');
    await expect(fullscreenBtn).toBeVisible({ timeout: 15000 });
    await expect(fullscreenBtn).toContainText('Pełny ekran');

    // Test wejścia i wyjścia z trybu fullscreen
    const panel = page.locator('#koneczny-panel');
    await fullscreenBtn.click();
    await expect(panel).toHaveClass(/fullscreen/);
    await expect(fullscreenBtn).toContainText('Zwiń ekran');

    await fullscreenBtn.click();
    await expect(panel).not.toHaveClass(/fullscreen/);
    await expect(fullscreenBtn).toContainText('Pełny ekran');
  });

  test('Krok 4: Weryfikacja przełącznika językowego UK (wersja angielska dashboardu i nagłówka)', async ({ page }) => {
    await mockHtmlFixture(page, 'https://pl.wikipedia.org/wiki/Polska', 'mock_polska.html');
    await mockAnalyzeFixture(page, 'mock_polska_result.json');

    await page.goto('https://pl.wikipedia.org/wiki/Polska', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 15000 });
    await konecznyTrigger.click();

    // 1. Sprawdzenie obecności przycisku językowego z flagą UK w nagłówku
    const langBtn = page.locator('#koneczny-lang-header');
    await expect(langBtn).toBeVisible({ timeout: 15000 });
    await expect(langBtn.locator('#lang-btn-flag')).toContainText('🇬🇧');
    await expect(langBtn.locator('#lang-btn-text')).toContainText('EN');

    // Weryfikacja domyślnych polskich napisów w nagłówku i dashboardzie
    const headerTitle = page.locator('.header-title');
    await expect(headerTitle).toContainText('Analiza Algorytmem Konecznego');
    const dashboard = page.locator('.koneczny-dashboard');
    await expect(dashboard).toContainText('Cywilizacja');
    await expect(dashboard).toContainText('Prawo');

    // 2. Kliknięcie w celu przełączenia na język angielski
    await langBtn.click();

    // Weryfikacja flagi i tekstu na przycisku po przełączeniu (ikona PL)
    await expect(langBtn.locator('#lang-btn-flag')).toContainText('🇵🇱');
    await expect(langBtn.locator('#lang-btn-text')).toContainText('PL');

    // Weryfikacja nagłówka po angielsku
    await expect(headerTitle).toContainText('Koneczny Algorithm Analysis');
    const dlHeaderBtn = page.locator('#koneczny-download-header');
    await expect(dlHeaderBtn).toContainText('Export JSON');

    // Weryfikacja przetłumaczonego dashboardu
    await expect(dashboard).toContainText('Civilization');
    await expect(dashboard).toContainText('Law');
    await expect(dashboard).toContainText('Religion');
    await expect(dashboard).toContainText('Societal Goals');
    await expect(dashboard).toContainText('Family Emancipation');

    // Weryfikacja pajęczyny Quincunxa po angielsku
    const quincunxBox = dashboard.locator('.quincunx-radar-box');
    await expect(quincunxBox).toContainText('QUINCUNX RADAR (5 SPHERES OF BEING)');
    await expect(quincunxBox).toContainText('Goodness');
    await expect(quincunxBox).toContainText('Truth');

    // Weryfikacja schodów zaawansowania cywilizacyjnego po angielsku
    const timelineBox = dashboard.locator('.civ-timeline-box');
    await expect(timelineBox).toContainText('CIVILIZATIONAL ADVANCEMENT OF ASSOCIATION');
    await expect(timelineBox).toContainText('Current Stage:');

    // 3. Ponowne kliknięcie - powrót do języka polskiego
    await langBtn.click();
    await expect(langBtn.locator('#lang-btn-flag')).toContainText('🇬🇧');
    await expect(langBtn.locator('#lang-btn-text')).toContainText('EN');
    await expect(headerTitle).toContainText('Analiza Algorytmem Konecznego');
    await expect(dashboard).toContainText('Cywilizacja');
    await expect(dashboard).toContainText('Prawo');
  });

  test('Krok 5: Przełączenie języka w trakcie ładowania analizy nie przerywa loader\'a i nie wstawia pustego dashboardu', async ({ page }) => {
    await mockHtmlFixture(page, 'https://pl.wikipedia.org/wiki/Polska', 'mock_polska.html');

    // Opóźniona odpowiedź backendu (1.5 sekundy), aby sprawdzić zachowanie przycisku EN w trakcie ładowania
    await page.route('**/api/analyze', async (route) => {
      await new Promise(r => setTimeout(r, 1200));
      const mockResultPath = require('path').resolve(__dirname, '../fixtures/mock_polska_result.json');
      const mockResult = JSON.parse(require('fs').readFileSync(mockResultPath, 'utf-8'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResult),
      });
    });

    await page.goto('https://pl.wikipedia.org/wiki/Polska', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 15000 });
    await konecznyTrigger.click();

    // Weryfikacja że loader jest aktywny
    const loader = page.locator('.loader');
    await expect(loader).toBeVisible({ timeout: 5000 });

    // W trakcie trwania analizy przełączamy język na EN
    const langBtn = page.locator('#koneczny-lang-header');
    await langBtn.click();

    // Loader wciąż musi być widoczny (nie został przerwany przez przedwczesny fałszywy render dashboardu)
    await expect(loader).toBeVisible();
    await expect(page.locator('.koneczny-dashboard')).not.toBeVisible();

    // Po zakończeniu analizy dashboard pojawia się automatycznie w języku angielskim
    const dashboard = page.locator('.koneczny-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 15000 });
    await expect(dashboard).toContainText('Civilization');
    await expect(dashboard).toContainText('Law');
  });

});
