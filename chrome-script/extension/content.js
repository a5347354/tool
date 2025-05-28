// 在註冊頁面自動搶票的主函數
function runSniper(keywords, ticketCount, autoSubmit = true, reverseOrder = false, memberSerial = '', snipeLeftOne = false) {
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
        // 只有當 snipeLeftOne 為 false 時，才跳過剩 1 張票
        if (!snipeLeftOne && ticketCount > 1) {
          const leftOne = unit.querySelector('.help-inline.danger, .mobile-capacity-notice.help-inline.danger');
          if (leftOne && /剩\s*1\s*張票/.test(leftOne.innerText)) {
            return; // 跳過這個票種
          }
        }
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
  
    // 新增：填入會員序號
    if (memberSerial) {
      document.querySelectorAll('.ticket-unit').forEach(unit => {
        // 只針對已選張數的票種
        const qtyInput = unit.querySelector('.ticket-quantity input[type="text"][ng-model="ticketModel.quantity"]');
        if (qtyInput && parseInt(qtyInput.value, 10) > 0) {
          // 找到 .ticket-unit 內第一個 input[type=text]，且不是張數的 input
          const textInputs = Array.from(unit.querySelectorAll('input[type="text"]'));
          const serialInput = textInputs.find(inp => inp !== qtyInput && inp.value === '');
          if (serialInput) {
            serialInput.value = memberSerial;
            serialInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
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
      }, 50); // 延遲 0.5 秒送出
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
  function startSniper(keywords, ticketCount, autoSubmit = true, reverseOrder = false, memberSerial = '', snipeLeftOne = false) {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      if (shouldRun()) runSniper(keywords, ticketCount, autoSubmit, reverseOrder, memberSerial, snipeLeftOne);
    }, 50); // 每 0.1 秒執行一次
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
  chrome.storage.local.get(['sniperActive', 'keywords', 'ticketCount', 'autoSubmit', 'reverseOrder', 'memberSerial', 'snipeLeftOne', 'autoRefreshNoTickets', 'reloadIntervalMin', 'reloadIntervalMax'], (data) => {
    if (data.sniperActive) {
      // 若在活動頁則自動導向註冊頁
      if (goToRegistrationIfOnEventPage()) return;
      if (shouldRun()) {
        startSniper(data.keywords || [], data.ticketCount || 1, data.autoSubmit !== false, !!data.reverseOrder, data.memberSerial || '', !!data.snipeLeftOne);
      } else {
        stopSniper();
      }
    } else {
      stopSniper();
    }
    // 新增：自動刷新無票頁面
    if (data.autoRefreshNoTickets) {
      startAutoRefreshNoTickets(data.reloadIntervalMin, data.reloadIntervalMax);
    } else {
      stopAutoRefreshNoTickets();
    }
  });
  
  let autoRefreshNoTicketsTimeoutId = null;
  function startAutoRefreshNoTickets(reloadIntervalMin = 500, reloadIntervalMax = 1000) {
    stopAutoRefreshNoTickets();
    function tryRefresh() {
      if (!shouldRun()) {
        autoRefreshNoTicketsTimeoutId = setTimeout(tryRefresh, 200);
        return;
      }
      const noTicketsTexts = [
        '目前沒有任何可以購買的票券',
        '目前沒有任何票券',
        '目前沒有任何可以購買的票',
        '目前沒有任何票',
        '目前沒有票券',
        '目前沒有票',
      ];
      const bodyText = document.body.innerText;
      const allSoldOutOrUnavailable = Array.from(document.querySelectorAll('.ticket-unit')).length > 0 &&
        Array.from(document.querySelectorAll('.ticket-unit')).every(unit =>
          unit.innerText.includes('已售完') || unit.innerText.includes('暫無票券')
        );
      if (noTicketsTexts.some(txt => bodyText.includes(txt)) || allSoldOutOrUnavailable) {
        const min = typeof reloadIntervalMin === 'number' ? reloadIntervalMin : 500;
        const max = typeof reloadIntervalMax === 'number' ? reloadIntervalMax : 1000;
        const interval = Math.floor(Math.random() * (max - min + 1)) + min;
        console.log('[AutoRefreshNoTickets] No tickets or all tickets unavailable, will reload in', interval, 'ms');
        setTimeout(() => window.location.reload(), interval);
      } else {
        // 若沒觸發 reload，立刻下一輪
        autoRefreshNoTicketsTimeoutId = setTimeout(tryRefresh, 0);
      }
    }
    tryRefresh();
  }
  function stopAutoRefreshNoTickets() {
    if (autoRefreshNoTicketsTimeoutId) clearTimeout(autoRefreshNoTicketsTimeoutId);
    autoRefreshNoTicketsTimeoutId = null;
  }
  
  // 監聽 popup 狀態變化（啟動/停止）
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      chrome.storage.local.get(['sniperActive', 'keywords', 'ticketCount', 'autoSubmit', 'reverseOrder', 'memberSerial', 'snipeLeftOne', 'autoRefreshNoTickets', 'reloadIntervalMin', 'reloadIntervalMax'], (data) => {
        if (data.sniperActive && shouldRun()) {
          startSniper(data.keywords || [], data.ticketCount || 1, data.autoSubmit !== false, !!data.reverseOrder, data.memberSerial || '', !!data.snipeLeftOne);
        } else {
          stopSniper();
        }
        // 新增：自動刷新無票頁面
        if (data.autoRefreshNoTickets) {
          startAutoRefreshNoTickets(data.reloadIntervalMin, data.reloadIntervalMax);
        } else {
          stopAutoRefreshNoTickets();
        }
      });
    }
  });