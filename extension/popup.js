document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_BACKEND_URL = 'http://localhost:8005';
  
  const backendUrlInput = document.getElementById('backendUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const settingsForm = document.getElementById('settingsForm');
  const saveBtn = document.getElementById('saveBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const versionTag = document.getElementById('versionTag');

  const btnTabMantis = document.getElementById('btnTabMantis');
  const btnTabLite = document.getElementById('btnTabLite');
  const btnTabFull = document.getElementById('btnTabFull');
  const tabContentMantis = document.getElementById('tabContentMantis');
  const tabContentLite = document.getElementById('tabContentLite');
  const tabContentFull = document.getElementById('tabContentFull');

  let activeMode = 'mantis';

  if (versionTag && typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
    const ver = chrome.runtime.getManifest()?.version;
    if (ver) versionTag.textContent = `v${ver}`;
  }

  function switchTab(mode) {
    activeMode = (mode === 'jmantis') ? 'mantis' : mode;
    [btnTabMantis, btnTabLite, btnTabFull].forEach(btn => {
      if (btn) {
        if (btn.dataset.tab === activeMode || (btn.dataset.tab === 'mantis' && activeMode === 'jmantis')) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });

    if (tabContentMantis) tabContentMantis.style.display = (activeMode === 'jmantis' || activeMode === 'mantis') ? 'block' : 'none';
    if (tabContentLite) tabContentLite.style.display = activeMode === 'lite' ? 'block' : 'none';
    if (tabContentFull) tabContentFull.style.display = activeMode === 'full' ? 'block' : 'none';
  }

  if (btnTabMantis) btnTabMantis.addEventListener('click', () => switchTab('mantis'));
  if (btnTabLite) btnTabLite.addEventListener('click', () => switchTab('lite'));
  if (btnTabFull) btnTabFull.addEventListener('click', () => switchTab('full'));

  // Load configuration from Chrome local storage
  chrome.storage.local.get(['backendUrl', 'apiKey', 'selectedIndices', 'analysisMode'], (res) => {
    let url = res?.backendUrl || DEFAULT_BACKEND_URL;
    if (url.includes(':8000')) {
      url = url.replace(':8000', ':8005');
      chrome.storage.local.set({ backendUrl: url });
    }
    backendUrlInput.value = url;
    apiKeyInput.value = res?.apiKey || '';

    const savedMode = res?.analysisMode || 'mantis';
    switchTab(savedMode);

    const savedIndices = (res && Array.isArray(res.selectedIndices))
      ? res.selectedIndices
      : ['duty_source', 'motivation', 'justice_nature', 'conscience_status', 'time_mastery', 'work_ethos', 'quincunx', 'health', 'truth_science', 'beauty_art'];
    const checkboxes = document.querySelectorAll('input[name="selectedIndices"]');
    checkboxes.forEach(cb => {
      cb.checked = savedIndices.includes(cb.value);
    });

    checkServerHealth(url);
  });

  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('input[name="selectedIndices"]').forEach(cb => cb.checked = true);
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      document.querySelectorAll('input[name="selectedIndices"]').forEach(cb => cb.checked = false);
    });
  }

  // Handle form submission with state class modifiers
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = backendUrlInput.value.trim() || DEFAULT_BACKEND_URL;
    const key = apiKeyInput.value.trim();

    const checkedBoxes = document.querySelectorAll('input[name="selectedIndices"]:checked');
    const selectedIndices = Array.from(checkedBoxes).map(cb => cb.value);

    chrome.storage.local.set({
      backendUrl: url,
      apiKey: key,
      selectedIndices: selectedIndices,
      analysisMode: activeMode
    }, () => {
      saveBtn.textContent = 'Zapisano!';
      saveBtn.classList.add('btn-saved');

      setTimeout(() => {
        saveBtn.textContent = 'Zapisz';
        saveBtn.classList.remove('btn-saved');
      }, 1500);

      checkServerHealth(url);
    });
  });

  // Async server health check
  async function checkServerHealth(url) {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Sprawdzanie...';

    let cleanUrl = (url || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, '');

    try {
      let response;
      try {
        response = await fetch(`${cleanUrl}/api/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
      } catch (err) {
        if (cleanUrl.includes('localhost')) {
          const fallbackUrl = cleanUrl.replace('localhost', '127.0.0.1');
          response = await fetch(`${fallbackUrl}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
        } else if (cleanUrl.includes('127.0.0.1')) {
          const fallbackUrl = cleanUrl.replace('127.0.0.1', 'localhost');
          response = await fetch(`${fallbackUrl}/api/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });
        } else {
          throw err;
        }
      }

      if (!response || !response.ok) {
        statusDot.classList.add('error');
        statusText.textContent = 'Błąd statusu';
        return;
      }

      statusDot.classList.add('connected');
      statusText.textContent = 'Połączono';
    } catch {
      statusDot.classList.add('error');
      statusText.textContent = 'Brak połączenia';
    }
  }
});
