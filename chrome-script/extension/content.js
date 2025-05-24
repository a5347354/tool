function runSniper(keywords, ticketCount, autoSubmit = true) {
    // === Your original logic, adapted to use keywords/ticketCount ===
    let selected = false;
    let ticketsSelected = 0;
    document.querySelectorAll('.ticket-unit').forEach(unit => {
      if (ticketsSelected >= ticketCount) return;
      const name = unit.querySelector('.ticket-name')?.innerText.trim() || '';
      const plusBtn = unit.querySelector('button.plus');
      const input = unit.querySelector('input[type="text"]');
      const statusText = unit.innerText;
      if (
        keywords.some(keyword => name.includes(keyword)) &&
        plusBtn && !plusBtn.disabled &&
        input && !input.disabled &&
        !statusText.includes('尚未開賣') &&
        !statusText.includes('已售完')
      ) {
        const canSelect = ticketCount - ticketsSelected;
        for (let i = 0; i < canSelect; i++) plusBtn.click();
        ticketsSelected += canSelect;
        if (canSelect > 0) selected = true;
      }
    });
  
    const agreeCheckbox = document.querySelector('#person_agree_terms');
    if (agreeCheckbox && !agreeCheckbox.checked) agreeCheckbox.click();
  
    if (selected && autoSubmit) {
      setTimeout(() => {
        const submitBtn = document.querySelector('.register-new-next-button-area button');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          console.log('已自動送出！');
        } else {
          console.log('找不到可用的送出按鈕或按鈕被禁用');
        }
      }, 500);
    } else if (!selected) {
      console.log('沒有符合條件的票種可搶');
    }
  }
  
  function shouldRun() {
    return window.location.pathname.includes('registrations/new');
  }
  
  let intervalId = null;
  
  function startSniper(keywords, ticketCount, autoSubmit = true) {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (shouldRun()) runSniper(keywords, ticketCount, autoSubmit);
    }, 1000); // Run every second
  }
  
  function stopSniper() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }
  
  function goToRegistrationIfOnEventPage() {
    // Only run if on an events page but not on registrations/new
    const path = window.location.pathname;
    if (path.includes('/events/') && !path.includes('/registrations/new')) {
      // Find the '下一步' button (should be an <a> with class 'btn-point' and text '下一步')
      const nextBtn = Array.from(document.querySelectorAll('a.btn-point')).find(
        el => el.textContent.trim() === '下一步'
      );
      if (nextBtn && nextBtn.href) {
        // Navigate to the registration page
        window.location.href = nextBtn.href;
        return true;
      }
    }
    return false;
  }
  
  chrome.storage.local.get(['sniperActive', 'keywords', 'ticketCount', 'autoSubmit'], (data) => {
    if (data.sniperActive) {
      // If on event page, go to registration page
      if (goToRegistrationIfOnEventPage()) return;
      if (shouldRun()) {
        startSniper(data.keywords || [], data.ticketCount || 1, data.autoSubmit !== false);
      } else {
        stopSniper();
      }
    } else {
      stopSniper();
    }
  });
  
  // Listen for changes (start/stop from popup)
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      chrome.storage.local.get(['sniperActive', 'keywords', 'ticketCount', 'autoSubmit'], (data) => {
        if (data.sniperActive && shouldRun()) {
          startSniper(data.keywords || [], data.ticketCount || 1, data.autoSubmit !== false);
        } else {
          stopSniper();
        }
      });
    }
  });