// === 設定 ===
const keywords = ['身心障礙單日票10/24', '6/25單日票']; // 你要搶的票種關鍵字
const ticketCount = 2; // 你要搶的張數

// === 主流程 ===
(function() {


  // 2. 依序選票
  let selected = false;
  let ticketsSelected = 0; // 新增: 記錄已選的票數
  document.querySelectorAll('.ticket-unit').forEach(unit => {
    if (ticketsSelected >= ticketCount) return; // 若已達最大張數則跳過
    const name = unit.querySelector('.ticket-name')?.innerText.trim() || '';
    const plusBtn = unit.querySelector('button.plus');
    const input = unit.querySelector('input[type="text"]');
    // 票種區塊所有文字
    const statusText = unit.innerText;

    // 檢查票種名稱、按鈕可用、不可為尚未開賣/已售完
    if (
      keywords.some(keyword => name.includes(keyword)) &&
      plusBtn && !plusBtn.disabled &&
      input && !input.disabled &&
      !statusText.includes('尚未開賣') &&
      !statusText.includes('已售完')
    ) {
      // 計算本次最多可選幾張
      const canSelect = Math.min(ticketCount - ticketsSelected, ticketCount);
      for (let i = 0; i < canSelect; i++) plusBtn.click();
      ticketsSelected += canSelect;
      if (canSelect > 0) selected = true;
    }
  });

  // 3. 勾選同意條款
  const agreeCheckbox = document.querySelector('#person_agree_terms');
  if (agreeCheckbox && !agreeCheckbox.checked) agreeCheckbox.click();

  // 4. 自動送出
  if (selected) {
    setTimeout(() => {
      const submitBtn = document.querySelector('.register-new-next-button-area button');
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
        console.log('已自動送出！');
      } else {
        console.log('找不到可用的送出按鈕或按鈕被禁用');
      }
    }, 500);
  } else {
    console.log('沒有符合條件的票種可搶');
  }

// 1. 送出按鈕狀態檢查
const submitBtn = document.querySelector('.register-new-next-button-area button');
if (submitBtn) {
    const btnText = submitBtn.innerText.trim();
    if (btnText.includes('查詢中') || btnText.toLowerCase().includes('loading') || submitBtn.disabled) {
    console.log('送出按鈕為查詢中或不可用，暫停搶票');
    return;
    }
}
})();