import { test, expect } from '../fixtures/extension.fixture';
import path from 'path';
import fs from 'fs';

test.describe('Smoke Suite: Inicjalizacja Wtyczki i Dashboardu na Wikipedii', () => {

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

});
