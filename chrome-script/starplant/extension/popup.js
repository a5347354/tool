document.addEventListener('DOMContentLoaded', () => {
  const keywordsInput = document.getElementById('keywords');
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');

  // Load saved keywords and state
  chrome.storage.sync.get(['keywords', 'isActive'], (data) => {
    if (data.keywords) keywordsInput.value = data.keywords;
    updateButtons(data.isActive);
  });

  function updateButtons(isActive) {
    if (isActive) {
      startBtn.disabled = true;
      stopBtn.disabled = false;
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  }

  keywordsInput.addEventListener('change', () => {
    chrome.storage.sync.set({ keywords: keywordsInput.value });
  });

  startBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ isActive: true }, () => {
      updateButtons(true);
    });
  });

  stopBtn.addEventListener('click', () => {
    chrome.storage.sync.set({ isActive: false }, () => {
      updateButtons(false);
    });
  });
}); 