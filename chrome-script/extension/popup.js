document.getElementById('startBtn').onclick = async () => {
    const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
    const keywords = document.getElementById('keywords').value.split(',').map(s => s.trim()).filter(Boolean);
    const ticketCount = parseInt(document.getElementById('ticketCount').value, 10) || 1;
    const autoSubmit = document.getElementById('autoSubmit').checked;
    const reverseOrder = document.getElementById('reverseOrder').checked;
    const memberSerial = document.getElementById('memberSerial').value.trim();
    chrome.storage.local.set({sniperActive: true, keywords, ticketCount, autoSubmit, reverseOrder, memberSerial});
    chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: () => window.location.reload()
    });
    document.getElementById('status').innerText = 'Sniper started!';
  };
  
  document.getElementById('stopBtn').onclick = () => {
    chrome.storage.local.set({sniperActive: false});
    document.getElementById('status').innerText = 'Sniper stopped!';
  };
  
  // Load current settings
  chrome.storage.local.get(['keywords', 'ticketCount', 'sniperActive', 'autoSubmit', 'reverseOrder', 'memberSerial'], (data) => {
    if (data.keywords) document.getElementById('keywords').value = data.keywords.join(', ');
    if (data.ticketCount) document.getElementById('ticketCount').value = data.ticketCount;
    document.getElementById('status').innerText = data.sniperActive ? 'Sniper started!' : 'Sniper stopped!';
    document.getElementById('autoSubmit').checked = data.autoSubmit !== false;
    document.getElementById('reverseOrder').checked = !!data.reverseOrder;
    if (data.memberSerial) document.getElementById('memberSerial').value = data.memberSerial;
  });