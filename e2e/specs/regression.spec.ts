import { test, expect } from '../fixtures/extension.fixture';
import path from 'path';
import fs from 'fs';

test.describe('Regression Suite: Zaawansowane Scenariusze Cywilizacyjne i Interfejsowe', () => {

  test('Scenariusz 1: German Confederation - weryfikacja profilu bizantyńskiego, radaru Quincunx i interaktywnych popoverów cytatów', async ({ page }) => {
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

    // 5. Asercja UI: dominująco bizantyńska
    await expect(dashboard).toContainText('Bizantyńska');
    const quincunxBox = dashboard.locator('.quincunx-radar-box');
    await expect(quincunxBox).toContainText('DOMINACJA');
    await expect(quincunxBox).toContainText('Bizantyńska');

    // 6. Asercja przycisków informacyjnych (ℹ) w sekcjach analitycznych
    const infoTriggers = dashboard.locator('.section-info-trigger');
    await expect(infoTriggers.first()).toBeVisible({ timeout: 5000 });
    await expect(dashboard.locator('.section-info-trigger[data-section="civ"]').first()).toBeVisible();
    await expect(dashboard.locator('.section-info-trigger[data-section="legal"]').first()).toBeVisible();
    await expect(dashboard.locator('.section-info-trigger[data-section="rel"]').first()).toBeVisible();
    await expect(dashboard.locator('.section-info-trigger[data-section="goal"]').first()).toBeVisible();
    await expect(dashboard.locator('.section-info-trigger[data-section="fam"]').first()).toBeVisible();

    // 7. Test wywołania popovera dla Sekcji 1: Cywilizacja Bizantyńska (NotebookLM style cytaty)
    const civChipInfoBtn = dashboard.locator('.chip-info-trigger[data-section="civ"]');
    await expect(civChipInfoBtn).toBeVisible();
    await civChipInfoBtn.click();

    const popover = page.locator('#koneczny-section-info-popover');
    await expect(popover).toBeVisible({ timeout: 5000 });
    await expect(popover).toContainText('Cywilizacja');
    await expect(popover).toContainText('Bizantyńska');
    await expect(popover).toContainText('Uzasadnienie klasyfikacji (Koneczny)');
    await expect(popover).toContainText('2 przykłady z analizowanego tekstu (dowody)');

    // Weryfikacja obecności dokładnie 2 ponumerowanych przykładów cytatów
    const examples = popover.locator('.example-item');
    await expect(examples).toHaveCount(2);
    await expect(examples.nth(0).locator('.example-num')).toContainText('1');
    await expect(examples.nth(1).locator('.example-num')).toContainText('2');

    // 8. Test wywołania popovera dla innej sekcji (Prawo)
    const legalHeaderInfoBtn = dashboard.locator('.header-info-trigger[data-section="legal"]');
    await legalHeaderInfoBtn.click();
    await expect(popover).toBeVisible();
    await expect(popover).toContainText('Prawo');
    await expect(popover).toContainText('Monizm Prawa Publicznego');
    await expect(popover.locator('.example-item')).toHaveCount(2);

    // 9. Zamknięcie popovera przyciskiem ✕
    const closePopoverBtn = popover.locator('.popover-close-btn');
    await closePopoverBtn.click();
    await expect(popover).not.toBeVisible();
  });

  test('Scenariusz 2: Weryfikacja zaawansowanej nawigacji po 5 zakładkach systematyki i relacji do czasu', async ({ page }) => {
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

    const decisionTree = page.locator('#decision-tree-container');
    await expect(decisionTree).toBeVisible();

    // Weryfikacja obecności wszystkich 5 zakładek
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="mantis"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny_reverse"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny_time"]')).toBeVisible();
    await expect(page.locator('.tree-subtab-btn[data-tree-tab="koneczny_pillar"]')).toBeVisible();

    // Przełączenie na zakładkę 4 (Stosunek do czasu)
    const timeTabBtn = page.locator('.tree-subtab-btn[data-tree-tab="koneczny_time"]');
    await timeTabBtn.click();
    await expect(page.locator('text=Dla przykładu dorysujmy sobie jeszcze tabelkę według stosunku do czasu').first()).toBeVisible();

    // Przełączenie na zakładkę 5 (Systematyka - Pion Łaciński)
    const pillarTabBtn = page.locator('.tree-subtab-btn[data-tree-tab="koneczny_pillar"]');
    await pillarTabBtn.click();
    await expect(page.locator('text=PION WZORCOWY (ODNIESIENIE)').first()).toBeVisible();
    await expect(page.locator('text=Matryca Syntetyczna: Zestawienie 7 Cywilizacji').first()).toBeVisible();
  });

});
