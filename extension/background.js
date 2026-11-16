/**
 * Chrome Extension MV3 Service Worker for Standalone Koneczny Civilization Analysis.
 * Orchestrates prompts -> Gemini REST API -> Koneczny math engine -> local history storage.
 */

import { buildTasksForAnalysis } from './services/prompts.js';
import { runTasksWithConcurrency, fetchPdfAsPart } from './services/geminiClient.js';
import { calculateKonecznyMetrics, applyMantisGates } from './services/konecznyEngine.js';
import { recordAndGetHistoryStats } from './services/historyStorage.js';

async function handleAnalyzeText(payload, apiKey, onLog = null) {
  const log = (level, message) => {
    const prefix = '[Koneczny SW]';
    if (level === 'error') console.error(prefix, message);
    else if (level === 'warn') console.warn(prefix, message);
    else console.log(prefix, message);
    if (typeof onLog === 'function') onLog(level, message);
  };

  const { text, pdf_url: pdfUrl, url, title, mode = 'mantis', target_indices: targetIndices } = payload || {};

  const isPdf = Boolean(pdfUrl && !text);
  if (!isPdf && (!text || text.trim().length < 50)) {
    throw new Error('Niewystarczająca ilość tekstu na stronie do analizy.');
  }

  const normalizedMode = (mode || 'mantis').toLowerCase();
  const isPartial = Array.isArray(targetIndices) && targetIndices.length > 0;
  const tasks = buildTasksForAnalysis(text || '', normalizedMode, targetIndices, isPdf);

  if (tasks.length === 0) {
    throw new Error('Brak wybranych indeksów do analizy.');
  }

  log('info', `Start analizy: tryb=${normalizedMode}, typ=${isPdf ? 'PDF' : 'HTML'}, zadań=${tasks.length}`);

  const pdfPart = isPdf ? await fetchPdfAsPart(pdfUrl, apiKey, log) : null;
  const llmData = await runTasksWithConcurrency(tasks, apiKey, 2, pdfPart, log);

  log('info', `Zebrano odpowiedzi dla ${Object.keys(llmData).length}/${tasks.length} sekcji. Liczę metryki Konecznego...`);
  let result = calculateKonecznyMetrics(llmData);

  if (!isPartial && (normalizedMode === 'mantis' || normalizedMode === 'jmantis')) {
    result = applyMantisGates(text || title || '', result);
  } else {
    result.mode = normalizedMode;
  }

  result.raw_ratings = llmData;
  result.history_stats = await recordAndGetHistoryStats(url, result.quincunx_coherence_score);
  result.source_url = url || '';
  result.title = title || '';
  result.analyzed_via = 'chrome-direct';

  log('info', `Analiza zakończona: cywilizacja=${result.primary_civilization || 'brak'}, quincunx=${result.quincunx_coherence_score}`);
  return result;
}

if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onConnect) {
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'koneczny-analyze') return;

    let disconnected = false;
    let keepaliveTimer = null;

    port.onDisconnect.addListener(() => {
      disconnected = true;
      if (keepaliveTimer) clearInterval(keepaliveTimer);
    });

    port.onMessage.addListener((message) => {
      if (!message || message.action !== 'ANALYZE_TEXT') return;

      keepaliveTimer = setInterval(() => {
        if (!disconnected) {
          try {
            port.postMessage({ type: 'KEEPALIVE' });
          } catch {
            // Ignore if port already closed
          }
        }
      }, 10000);

      const emitLog = (level, msgText) => {
        if (!disconnected) {
          try {
            port.postMessage({ type: 'LOG', level, message: msgText });
          } catch {
            // Ignore if port already closed
          }
        }
      };

      handleAnalyzeText(message.payload, message.apiKey, emitLog)
        .then((data) => {
          if (!disconnected) {
            port.postMessage({ type: 'RESULT', ok: true, data });
          }
        })
        .catch((err) => {
          if (!disconnected) {
            port.postMessage({
              type: 'RESULT',
              ok: false,
              error: err?.message || 'Nieznany błąd analizy w trybie Chrome.',
            });
          }
        })
        .finally(() => {
          if (keepaliveTimer) clearInterval(keepaliveTimer);
        });
    });
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (message.action === 'HEALTH_CHECK') {
    sendResponse({ ok: true, status: 'ready', mode: 'direct' });
    return false;
  }

  if (message.action === 'ANALYZE_TEXT') {
    handleAnalyzeText(message.payload, message.apiKey)
      .then((data) => sendResponse({ ok: true, data }))
      .catch((err) => sendResponse({ ok: false, error: err?.message || 'Nieznany błąd analizy w trybie Chrome.' }));
    return true; // Keep message channel open for async response
  }

  return false;
});

