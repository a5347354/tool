document.addEventListener('DOMContentLoaded', () => {
  const keywordsInput = document.getElementById('keywords');
  const quantityInput = document.getElementById('quantity');
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');

  // Load saved keywords, quantity and state
  chrome.storage.sync.get(['keywords', 'quantity', 'isActive'], (data) => {
    if (data.keywords) keywordsInput.value = data.keywords;
    if (data.quantity) quantityInput.value = data.quantity;
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
  quantityInput.addEventListener('change', () => {
    chrome.storage.sync.set({ quantity: quantityInput.value });
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