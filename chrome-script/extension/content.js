// 在註冊頁面自動搶票的主函數
function runSniper(keywords, ticketCount, autoSubmit = true, reverseOrder = false) {
    let selected = false;
    // 先加總所有已選票數
    let ticketsSelected = 0;
    (reverseOrder ? Array.from(document.querySelectorAll('.ticket-unit')).reverse() : document.querySelectorAll('.ticket-unit')).forEach(unit => {
      const input = unit.querySelector('.ticket-quantity input[type="text"][ng-model="ticketModel.quantity"]');
      if (input && !isNaN(parseInt(input.value, 10))) {
        ticketsSelected += parseInt(input.value, 10);
      }
    });
    // 按照 keywords 順序搶票
    for (const keyword of keywords) {
      if (ticketsSelected >= ticketCount) break;
      const ticketUnits = reverseOrder ? Array.from(document.querySelectorAll('.ticket-unit')).reverse() : document.querySelectorAll('.ticket-unit');
      ticketUnits.forEach(unit => {
        if (ticketsSelected >= ticketCount) return;
        const name = unit.querySelector('.ticket-name')?.innerText.trim() || '';
        const plusBtn = unit.querySelector('button.plus');
        const input = unit.querySelector('.ticket-quantity input[type="text"][ng-model="ticketModel.quantity"]');
        const statusText = unit.innerText;
        // 取得票價並去除逗號
        let priceText = '';
        const priceSpan = unit.querySelector('.ticket-price');
        if (priceSpan) {
          priceText = priceSpan.innerText.replace(/,/g, '');
        }
        if (
          (name.includes(keyword) || (priceText && priceText.includes(keyword))) &&
          plusBtn && !plusBtn.disabled &&
          input && !input.disabled &&
          !statusText.includes('尚未開賣') &&
          !statusText.includes('已售完')
        ) {
          const canSelect = ticketCount - ticketsSelected;
          for (let i = 0; i < canSelect; i++) {
            plusBtn.click();
            ticketsSelected++;
            if (ticketsSelected >= ticketCount) break;
          }
          if (canSelect > 0) selected = true;
        }
      });
    }
  
    // 勾選同意條款
    const agreeCheckbox = document.querySelector('#person_agree_terms');
    if (agreeCheckbox && !agreeCheckbox.checked) agreeCheckbox.click();
  
    // 若有選到票且自動送出，則自動點擊送出按鈕
    if (selected && autoSubmit) {
      setTimeout(() => {
        const submitBtn = document.querySelector('.register-new-next-button-area button');
        if (submitBtn && !submitBtn.disabled) {
          submitBtn.click();
          console.log('已自動送出！');
        } else {
          console.log('找不到可用的送出按鈕或按鈕被禁用');
        }
      }, 500); // 延遲 0.5 秒送出
    } else if (!selected) {
      console.log('沒有符合條件的票種可搶');
    }
  }
  
  // 判斷目前是否在註冊頁面
  function shouldRun() {
    return window.location.pathname.includes('registrations/new');
  }
  
  let intervalId = null;
  
  // 啟動搶票輪詢，每秒執行一次
  function startSniper(keywords, ticketCount, autoSubmit = true, reverseOrder = false) {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (shouldRun()) runSniper(keywords, ticketCount, autoSubmit, reverseOrder);
    }, 1000); // 每秒執行一次
  }
  
  // 停止搶票輪詢
  function stopSniper() {
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  }
  
  // 若在活動頁面自動導向註冊頁
  function goToRegistrationIfOnEventPage() {
    // 僅在活動頁但不在註冊頁時執行
    const path = window.location.pathname;
    if (path.includes('/events/') && !path.includes('/registrations/new')) {
      // 尋找「下一步」按鈕（class 為 btn-point 且文字為「下一步」的 <a>）
      const nextBtn = Array.from(document.querySelectorAll('a.btn-point')).find(
        el => el.textContent.trim() === '下一步'
      );
      if (nextBtn && nextBtn.href) {
        // 導向註冊頁
        window.location.href = nextBtn.href;
        return true;
      }
    }
    return false;
  }
  
  // 讀取 chrome 儲存的狀態，決定是否啟動搶票
  chrome.storage.local.get(['sniperActive', 'keywords', 'ticketCount', 'autoSubmit', 'reverseOrder'], (data) => {
    if (data.sniperActive) {
      // 若在活動頁則自動導向註冊頁
      if (goToRegistrationIfOnEventPage()) return;
      if (shouldRun()) {
        startSniper(data.keywords || [], data.ticketCount || 1, data.autoSubmit !== false, !!data.reverseOrder);
      } else {
        stopSniper();
      }
    } else {
      stopSniper();
    }
  });
  
  // 監聽 popup 狀態變化（啟動/停止）
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      chrome.storage.local.get(['sniperActive', 'keywords', 'ticketCount', 'autoSubmit', 'reverseOrder'], (data) => {
        if (data.sniperActive && shouldRun()) {
          startSniper(data.keywords || [], data.ticketCount || 1, data.autoSubmit !== false, !!data.reverseOrder);
        } else {
          stopSniper();
        }
      });
    }
  });