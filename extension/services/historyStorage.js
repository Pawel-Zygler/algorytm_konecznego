/**
 * Local analysis history stored in chrome.storage.local (replaces SQLite backend history).
 */

const HISTORY_STORAGE_KEY = 'koneczny_history';
const MAX_URL_ENTRIES = 200;
const MAX_RUNS_PER_URL = 50;

function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return 'unknown';
  try {
    const u = new URL(rawUrl);
    return `${u.origin}${u.pathname}`.replace(/\/+$/, '') || u.origin;
  } catch {
    return rawUrl.split('#')[0].split('?')[0];
  }
}

function getStorageArea() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([HISTORY_STORAGE_KEY], (res) => {
        resolve(res?.[HISTORY_STORAGE_KEY] || {});
      });
    } else {
      resolve({});
    }
  });
}

function setStorageArea(historyObj) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: historyObj }, resolve);
    } else {
      resolve();
    }
  });
}

/**
 * Records an analysis run for the given URL and returns aggregated stats { total_runs, avg_quincunx }.
 */
export async function recordAndGetHistoryStats(rawUrl, quincunxScore) {
  const key = normalizeUrl(rawUrl);
  const history = await getStorageArea();
  const entries = Array.isArray(history[key]) ? history[key] : [];

  if (typeof quincunxScore === 'number' && quincunxScore >= 0) {
    entries.push({
      quincunx_score: quincunxScore,
      timestamp: Date.now(),
    });
    if (entries.length > MAX_RUNS_PER_URL) {
      entries.splice(0, entries.length - MAX_RUNS_PER_URL);
    }
    history[key] = entries;

    // Keep storage bounded
    const keys = Object.keys(history);
    if (keys.length > MAX_URL_ENTRIES) {
      delete history[keys[0]];
    }
    await setStorageArea(history);
  }

  const validScores = entries
    .map((e) => e.quincunx_score)
    .filter((s) => typeof s === 'number' && s >= 0);

  const totalRuns = entries.length || 1;
  const avgQuincunx = validScores.length > 0
    ? Math.round((validScores.reduce((a, b) => a + b, 0) / validScores.length) * 100) / 100
    : (typeof quincunxScore === 'number' && quincunxScore >= 0 ? Math.round(quincunxScore * 100) / 100 : -1.0);

  return {
    total_runs: totalRuns,
    avg_quincunx: avgQuincunx,
  };
}

