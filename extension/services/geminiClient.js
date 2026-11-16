/**
 * Direct Gemini REST API client for Chrome Extension Service Worker.
 * Supports model fallback on 429/500/503/404 and bounded concurrency to respect free-tier RPM limits.
 */

const GEMINI_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview',
  'gemini-3-pro-preview',
  'gemini-pro-latest',
];

const RETRYABLE_STATUSES = new Set([404, 429, 500, 503]);
const unavailableModels = new Set();
let preferredModel = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

/**
 * Downloads a PDF in the Service Worker and prepares a Gemini inlineData or fileData part.
 */
export async function fetchPdfAsPart(pdfUrl, apiKey, onLog = null) {
  const log = typeof onLog === 'function' ? onLog : () => {};
  log('info', `Pobieranie pliku PDF: ${pdfUrl}`);
  const response = await fetch(pdfUrl, {
    credentials: 'include',
    headers: { Accept: 'application/pdf,*/*' },
  });
  if (!response.ok) {
    throw new Error(`Nie udało się pobrać pliku PDF (HTTP ${response.status}).`);
  }
  const buffer = await response.arrayBuffer();
  if (!buffer || buffer.byteLength === 0) {
    throw new Error('Pobrany plik PDF jest pusty.');
  }

  const sizeKb = Math.round(buffer.byteLength / 1024);
  log('info', `Pobrano PDF (${sizeKb} KB). Przygotowywanie dla Gemini...`);

  // Use inlineData only for small PDFs (<= 1 MB); upload larger PDFs once via Files API
  // so 6-24 analysis tasks don't re-upload multi-megabyte base64 payloads repeatedly.
  if (buffer.byteLength <= 1024 * 1024) {
    log('info', `PDF <= 1 MB -> używam inlineData (${sizeKb} KB)`);
    return {
      inlineData: {
        mimeType: 'application/pdf',
        data: arrayBufferToBase64(buffer),
      },
    };
  }

  // For larger PDFs (>1 MB), upload once via Gemini Files API resumable/raw upload
  log('info', `PDF > 1 MB (${sizeKb} KB) -> jednorazowy upload do Gemini Files API...`);
  const trimmedKey = (apiKey || '').trim();
  const uploadRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${encodeURIComponent(trimmedKey)}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'raw',
        'X-Goog-Upload-Header-Content-Type': 'application/pdf',
        'Content-Type': 'application/pdf',
      },
      body: buffer,
    }
  );
  if (!uploadRes.ok) {
    const errBody = await uploadRes.json().catch(() => ({}));
    throw new Error(`Nie udało się przesłać dużego PDF do Gemini Files API (${errBody?.error?.message || uploadRes.status}).`);
  }
  const uploadData = await uploadRes.json();
  const fileUri = uploadData?.file?.uri;
  if (!fileUri) {
    throw new Error('Gemini Files API nie zwróciło URI dla przesłanego pliku PDF.');
  }
  log('info', `PDF wgrany do Gemini Files API: ${fileUri}`);
  return {
    fileData: {
      mimeType: 'application/pdf',
      fileUri,
    },
  };
}

/**
 * Calls Gemini generateContent endpoint with structured JSON output schema.
 */
export async function callGeminiStructured({ apiKey, systemInstruction, prompt, responseSchema, pdfPart = null, taskLabel = '', onLog = null }) {
  const log = typeof onLog === 'function' ? onLog : () => {};
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Brak klucza API Gemini. Wpisz klucz w ustawieniach wtyczki (popup).');
  }

  const trimmedKey = apiKey.trim();
  const parts = pdfPart ? [pdfPart, { text: prompt }] : [{ text: prompt }];
  const payload = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema,
    },
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let lastError = null;
  const candidateModels = [
    ...(preferredModel ? [preferredModel] : []),
    ...GEMINI_MODELS.filter((m) => m !== preferredModel && !unavailableModels.has(m)),
  ];
  const modelsToTry = candidateModels.length > 0 ? candidateModels : GEMINI_MODELS;

  for (let i = 0; i < modelsToTry.length; i += 1) {
    const model = modelsToTry[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(trimmedKey)}`;
    const t0 = Date.now();
    log('info', `${taskLabel ? `[${taskLabel}] ` : ''}Zapytanie do modelu ${model}...`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const apiMsg = errBody?.error?.message || `HTTP ${response.status}`;

        if (response.status === 400 || response.status === 401 || response.status === 403) {
          throw new Error(`Nieprawidłowy klucz API Gemini lub brak uprawnień (${apiMsg}).`);
        }

        if (response.status === 404) {
          unavailableModels.add(model);
          if (preferredModel === model) preferredModel = null;
          lastError = new Error(`Model ${model}: ${apiMsg}`);
          log('warn', `${taskLabel ? `[${taskLabel}] ` : ''}Model ${model} niedostępny (404), pomijam.`);
          continue;
        }

        if (RETRYABLE_STATUSES.has(response.status)) {
          lastError = new Error(`Model ${model}: ${apiMsg}`);
          log('warn', `${taskLabel ? `[${taskLabel}] ` : ''}Model ${model} zwrócił HTTP ${response.status} (${apiMsg}), próbuję kolejny...`);
          await sleep(response.status === 429 ? 1200 : 400);
          continue;
        }

        throw new Error(`Błąd Gemini API (${model}): ${apiMsg}`);
      }

      const data = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        lastError = new Error(`Model ${model} zwrócił pustą odpowiedź.`);
        log('warn', `${taskLabel ? `[${taskLabel}] ` : ''}Model ${model} zwrócił pustą odpowiedź.`);
        continue;
      }

      preferredModel = model;
      log('info', `${taskLabel ? `[${taskLabel}] ` : ''}OK (${model}, ${Date.now() - t0} ms)`);
      return JSON.parse(candidateText);
    } catch (err) {
      if (err.message && err.message.includes('Nieprawidłowy klucz API')) {
        throw err;
      }
      if (err.name === 'AbortError') {
        log('warn', `${taskLabel ? `[${taskLabel}] ` : ''}Model ${model} przekroczył limit czasu (35 s), próbuję kolejny...`);
      } else {
        log('warn', `${taskLabel ? `[${taskLabel}] ` : ''}Błąd sieci (${model}): ${err?.message || err}`);
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Wszystkie modele Gemini odrzuciły zapytanie (limit zapytań lub błąd sieci).');
}

/**
 * Executes an array of prompt tasks with bounded concurrency and merges results into llmData.
 */
export async function runTasksWithConcurrency(tasks, apiKey, maxConcurrency = 2, pdfPart = null, onLog = null) {
  const log = typeof onLog === 'function' ? onLog : () => {};
  const llmData = {};
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return llmData;
  }

  let cursor = 0;
  let firstError = null;

  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor;
      cursor += 1;
      const task = tasks[idx];
      try {
        const res = await callGeminiStructured({
          apiKey,
          systemInstruction: task.systemInstruction,
          prompt: task.prompt,
          responseSchema: task.responseSchema,
          pdfPart,
          taskLabel: `${idx + 1}/${tasks.length}:${task.indexId}`,
          onLog: log,
        });
        if (res && typeof res === 'object') {
          Object.assign(llmData, res);
        }
      } catch (err) {
        log('error', `Błąd zadania ${task.indexId}: ${err?.message || err}`);
        if (!firstError) firstError = err;
      }
    }
  }

  const workerCount = Math.min(maxConcurrency, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);

  if (Object.keys(llmData).length === 0 && firstError) {
    throw firstError;
  }

  return llmData;
}

