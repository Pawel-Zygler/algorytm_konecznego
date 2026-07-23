document.addEventListener('DOMContentLoaded', () => {
  const backendUrlInput = document.getElementById('backendUrl');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  // Load configuration
  chrome.storage.local.get(['backendUrl', 'apiKey'], (res) => {
    backendUrlInput.value = res.backendUrl || 'http://localhost:8000';
    apiKeyInput.value = res.apiKey || '';
    checkServerHealth(backendUrlInput.value);
  });

  // Save button event handler
  saveBtn.addEventListener('click', () => {
    const url = backendUrlInput.value.trim() || 'http://localhost:8000';
    const key = apiKeyInput.value.trim();

    chrome.storage.local.set({
      backendUrl: url,
      apiKey: key
    }, () => {
      saveBtn.innerText = 'Zapisano!';
      saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      setTimeout(() => {
        saveBtn.innerText = 'Zapisz ustawienia';
        saveBtn.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)';
      }, 1500);
      checkServerHealth(url);
    });
  });

  // Check server health function
  async function checkServerHealth(url) {
    statusDot.className = 'status-dot';
    statusText.innerText = 'Sprawdzanie...';

    try {
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        // prevent long hangs
        signal: AbortSignal.timeout(3000) 
      });

      if (response.ok) {
        statusDot.className = 'status-dot connected';
        statusText.innerText = 'Połączono';
      } else {
        statusDot.className = 'status-dot error';
        statusText.innerText = 'Błąd statusu';
      }
    } catch (e) {
      statusDot.className = 'status-dot error';
      statusText.innerText = 'Brak połączenia';
    }
  }
});
