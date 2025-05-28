(function() {
  let lastPath = null;
  let intervalId = null;

  // 等待 selector 出現並自動點擊，支援自訂條件
  function waitAndClick(selector, maxWait = 10000, interval = 300, matchFn) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        try {
          const els = Array.from(document.querySelectorAll(selector));
          const el = matchFn ? els.find(matchFn) : els[0];
          if (el) {
            el.click();
            clearInterval(timer);
            resolve(true);
          } else if (Date.now() - start > maxWait) {
            clearInterval(timer);
            resolve(false);
          }
        } catch (e) {
          clearInterval(timer);
          resolve(false);
        }
      }, interval);
    });
  }

  // 找到最有可能的 scrollable div
  function findScrollableDiv() {
    return Array.from(document.querySelectorAll('div')).find(div => {
      const style = window.getComputedStyle(div);
      return (
        (style.overflowY === 'auto' || style.overflowY === 'scroll') &&
        div.scrollHeight > div.clientHeight + 10
      );
    });
  }

  // robust scroll to bottom 並觸發 scroll 事件
  function scrollToBottomWithEvent(scroller) {
    return new Promise(resolve => {
      if (!scroller) return resolve(false);
      let tries = 0;
      function doScroll() {
        scroller.scrollTop = scroller.scrollHeight;
        scroller.dispatchEvent(new Event('scroll', { bubbles: true }));
        if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) {
          resolve(true);
        } else if (tries++ < 20) {
          setTimeout(doScroll, 100);
        } else {
          resolve(false);
        }
      }
      doScroll();
    });
  }

  function handleRoute() {
    try {
      chrome.storage.sync.get(['isActive', 'keywords', 'personalInfo'], (data) => {
        if (!data.isActive) return;

        const url = new URL(window.location.href);
        const pathname = url.pathname;
        // lastPath = pathname; // 不再判斷路徑是否變化，讓自動化每次都執行

        const keywords = (data.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
        const personalInfo = data.personalInfo || {};
        let eventId = null;
        let matchedRoute = null;

        switch (true) {
          case /\/events\/([\w-]+)/.test(pathname): {
            matchedRoute = 'events';
            eventId = pathname.match(/\/events\/([\w-]+)/)[1];
            console.log('Matched route: events.html, eventId:', eventId);
            waitAndClick('#bmsportal-book').then(clicked => {
              if (clicked) {
                console.log('Auto-clicked Buy Now button');
              } else {
                console.log('Buy Now button not found after waiting');
              }
            });
            break;
          }
          case /\/booking\/([\w-]+)\/quantity/.test(pathname): {
            matchedRoute = 'quantity';
            eventId = pathname.match(/\/booking\/([\w-]+)/)[1];
            console.log('Matched route: quantity.html, eventId:', eventId);
            // TODO: Implement logic to select ticket quantity based on keywords
            break;
          }
          case /\/booking\/([\w-]+)\/seats/.test(pathname): {
            matchedRoute = 'seats';
            eventId = pathname.match(/\/booking\/([\w-]+)/)[1];
            console.log('Matched route: seats.html, eventId:', eventId);
            // TODO: Implement logic to select seat based on keywords
            break;
          }
          case /\/booking\/([\w-]+)/.test(pathname): {
            matchedRoute = 'booking';
            eventId = pathname.match(/\/booking\/([\w-]+)/)[1];
            console.log('Matched route: booking.html (agree), eventId:', eventId);

            // 1. robust scroll to bottom
            const scroller = findScrollableDiv();
            scrollToBottomWithEvent(scroller).then(() => {
              // 2. 找到唯一可見且 className 含 primary 的主按鈕
              waitAndClick(
                'button',
                10000,
                300,
                btn => {
                  const style = window.getComputedStyle(btn);
                  return (
                    style.display !== 'none' &&
                    style.visibility !== 'hidden' &&
                    !btn.disabled &&
                    btn.offsetParent !== null &&
                    (
                      btn.className.includes('primary') ||
                      btn.className.includes('bigtix-button--primary')
                    )
                  );
                }
              ).then(clicked => {
                if (clicked) {
                  console.log('Auto-clicked agreement button');
                } else {
                  console.log('Agreement button not found after waiting');
                }
              });
            });
            break;
          }
          case /\/checkout$/.test(pathname): {
            matchedRoute = 'checkout';
            console.log('Matched route: checkout.html');
            // TODO: Implement logic to proceed to patron info
            break;
          }
          case /\/checkout\/patron$/.test(pathname): {
            matchedRoute = 'patron';
            console.log('Matched route: patron.html');
            // TODO: Autofill personal info
            break;
          }
          case /\/checkout\/payment$/.test(pathname): {
            matchedRoute = 'payment';
            console.log('Matched route: payment.html');
            // TODO: Optionally auto-submit or fill payment info
            break;
          }
          default:
            console.log('No matching route for', pathname);
            break;
        }
      });
    } catch (e) {
      console.error('Extension context invalidated, clearing interval.', e);
      if (intervalId) clearInterval(intervalId);
    }
  }

  intervalId = setInterval(handleRoute, 500);
  window.addEventListener('unload', () => {
    if (intervalId) clearInterval(intervalId);
  });
})(); 