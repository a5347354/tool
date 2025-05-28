(function() {
  let lastPath = null;

  // 等待 selector 出現並自動點擊，最多 maxWait 毫秒
  function waitAndClick(selector, maxWait = 10000, interval = 300) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) {
          el.click();
          clearInterval(timer);
          resolve(true);
        } else if (Date.now() - start > maxWait) {
          clearInterval(timer);
          resolve(false);
        }
      }, interval);
    });
  }

  function handleRoute() {
    chrome.storage.sync.get(['isActive', 'keywords', 'personalInfo'], (data) => {
      if (!data.isActive) return;

      const url = new URL(window.location.href);
      const pathname = url.pathname;
      if (pathname === lastPath) return; // 路徑沒變就不重複執行
      lastPath = pathname;

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
        case /\/booking\/([\w-]+)/.test(pathname): {
          matchedRoute = 'booking';
          eventId = pathname.match(/\/booking\/([\w-]+)/)[1];
          console.log('Matched route: booking.html (agree), eventId:', eventId);
          // TODO: Implement logic to auto-click agree/continue
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
  }

  setInterval(handleRoute, 500); // 每 500ms 檢查一次
})(); 