document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_BACKEND_URL = 'http://localhost:8005';
  
  const backendUrlInput = document.getElementById('backendUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const settingsForm = document.getElementById('settingsForm');
  const saveBtn = document.getElementById('saveBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Load configuration from Chrome local storage
  chrome.storage.local.get(['backendUrl', 'apiKey'], (res) => {
    let url = res?.backendUrl || DEFAULT_BACKEND_URL;
    if (url.includes(':8000')) {
      url = url.replace(':8000', ':8005');
      chrome.storage.local.set({ backendUrl: url });
    }
    backendUrlInput.value = url;
    apiKeyInput.value = res?.apiKey || '';
    checkServerHealth(url);
  });

  // Handle form submission with state class modifiers
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const url = backendUrlInput.value.trim() || DEFAULT_BACKEND_URL;
    const key = apiKeyInput.value.trim();

    chrome.storage.local.set({ backendUrl: url, apiKey: key }, () => {
      saveBtn.textContent = 'Zapisano!';
      saveBtn.classList.add('btn-saved');

      setTimeout(() => {
        saveBtn.textContent = 'Zapisz ustawienia';
        saveBtn.classList.remove('btn-saved');
      }, 1500);

      checkServerHealth(url);
    });
  });

  // Async server health check with Guard Clauses
  async function checkServerHealth(url) {
    statusDot.className = 'status-dot';
    statusText.textContent = 'Sprawdzanie...';

    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });

      if (!response.ok) {
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
