document.addEventListener('DOMContentLoaded', () => {
  const keywordsInput = document.getElementById('keywords');
  const quantityInput = document.getElementById('quantity');
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');
  const reloadMinInput = document.getElementById('reload-min');
  const reloadMaxInput = document.getElementById('reload-max');

  // Load saved keywords, quantity, reload intervals and state
  chrome.storage.sync.get(['keywords', 'quantity', 'reloadIntervalMin', 'reloadIntervalMax', 'isActive'], (data) => {
    if (data.keywords) keywordsInput.value = data.keywords;
    if (data.quantity) quantityInput.value = data.quantity;
    if (data.reloadIntervalMin) reloadMinInput.value = data.reloadIntervalMin;
    if (data.reloadIntervalMax) reloadMaxInput.value = data.reloadIntervalMax;
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

  reloadMinInput.addEventListener('change', () => {
    chrome.storage.sync.set({ reloadIntervalMin: parseInt(reloadMinInput.value, 10) });
  });
  reloadMaxInput.addEventListener('change', () => {
    chrome.storage.sync.set({ reloadIntervalMax: parseInt(reloadMaxInput.value, 10) });
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