import { test, expect } from '../fixtures/extension.fixture';
import path from 'path';
import fs from 'fs';

test.describe('Regression Suite: Pełna Weryfikacja Cywilizacyjna na Wikipedii', () => {

  test('Krok 1: Weryfikacja załadowania wtyczki i obecności pływającego portretu Konecznego', async ({ page }) => {
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
    // 1. Wczytanie deterministycznego payloadu analizy Polski (izolacja od sieci i limitów API Gemini)
    const mockFixturePath = path.resolve(__dirname, '../fixtures/mock_polska_result.json');
    const mockData = JSON.parse(fs.readFileSync(mockFixturePath, 'utf-8'));

    // 2. Mockowanie żądania backendu (/api/analyze) dla 100% stabilności i szybkości
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    // 3. Wejście na stronę Wikipedii Polski
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

    // Asercja: polska nie jest sakralna - wtedy pass (wskaźnik sakralności < 0.40 i aktywny węzeł niskiej sakralności)
    const sacralityScore = mockData.pełne_dane_wynikowe?.sacrality_score ?? mockData.klasyfikacja_dashboard?.sakralność;
    expect(sacralityScore, 'Polska nie jest sakralna (wskaźnik sakralności musi być < 0.40)').toBeLessThan(0.40);
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
    const mockFixturePath = path.resolve(__dirname, '../fixtures/mock_polska_result.json');
    const mockData = JSON.parse(fs.readFileSync(mockFixturePath, 'utf-8'));

    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

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
  });

  test('Krok 4: Asercja historiozoficzna: polska nie jest sakralna - wtedy pass', async ({ page }) => {
    const mockFixturePath = path.resolve(__dirname, '../fixtures/mock_polska_result.json');
    const mockData = JSON.parse(fs.readFileSync(mockFixturePath, 'utf-8'));

    // 1. Sprawdzenie wskaźnika sakralności (dla Polski wynosi ~0.069, czyli zdecydowanie < 0.40)
    const sacralityScore = mockData.pełne_dane_wynikowe?.sacrality_score ?? mockData.klasyfikacja_dashboard?.sakralność;
    expect(sacralityScore, 'Polska nie jest cywilizacją sakralną - wskaźnik sakralności < 0.40').toBeLessThan(0.40);

    // 2. Weryfikacja na UI
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    await page.goto('https://pl.wikipedia.org/wiki/Polska', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 15000 });
    await konecznyTrigger.click();

    const dashboard = page.locator('.koneczny-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // 3. Weryfikacja aktywnego węzła niskiej sakralności w Mantis
    await expect(dashboard.locator('text=Sakralność Niska (<0.40)').first()).toBeVisible();
    await expect(dashboard).toContainText('Hegemonia Etyki');
    await expect(dashboard).not.toContainText('Sakralizm (Religia ponad etyką)');
  });

  test('Krok 5: Happy path: German Confederation - weryfikacja dominacji cywilizacji bizantyńskiej', async ({ page }) => {
    // 1. Wczytanie fixture mocka analizy German Confederation
    const mockFixturePath = path.resolve(__dirname, '../fixtures/mock_german_confederation_result.json');
    const mockData = JSON.parse(fs.readFileSync(mockFixturePath, 'utf-8'));

    // 2. Mockowanie żądania backendu (/api/analyze)
    await page.route('**/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockData),
      });
    });

    // 3. Wejście na stronę Wikipedii German Confederation
    await page.goto('https://en.wikipedia.org/wiki/German_Confederation', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // 4. Uruchomienie analizy i otwarcie panelu
    const konecznyTrigger = page.locator('#koneczny-trigger');
    await expect(konecznyTrigger).toBeVisible({ timeout: 15000 });
    await konecznyTrigger.click();

    const panel = page.locator('#koneczny-panel');
    await expect(panel).toHaveClass(/open/, { timeout: 10000 });

    const dashboard = page.locator('.koneczny-dashboard');
    await expect(dashboard).toBeVisible({ timeout: 15000 });

    // 5. Asercja: dominująco bizantyńska
    await expect(dashboard).toContainText('Bizantyńska');
    const quincunxBox = dashboard.locator('.quincunx-radar-box');
    await expect(quincunxBox).toContainText('DOMINACJA');
    await expect(quincunxBox).toContainText('Bizantyńska');
  });

});
