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
            const buyBtn = document.querySelector('#bmsportal-book');
            if (buyBtn) {
              buyBtn.click();
              console.log('Auto-clicked Buy Now button');
            } else {
              console.log('Buy Now button not found, will reload soon');
              chrome.storage.sync.get(['reloadIntervalMin', 'reloadIntervalMax'], (data) => {
                const min = typeof data.reloadIntervalMin === 'number' && !isNaN(data.reloadIntervalMin) ? data.reloadIntervalMin : 500;
                const max = typeof data.reloadIntervalMax === 'number' && !isNaN(data.reloadIntervalMax) ? data.reloadIntervalMax : 1000;
                const interval = Math.floor(Math.random() * (max - min + 1)) + min;
                console.log('[AutoReload] Buy Now button not found, will reload in', interval, 'ms');
                setTimeout(() => window.location.reload(), interval);
              });
            }
            break;
          }
          case /\/booking\/([\w-]+)\/quantity/.test(pathname): {
            matchedRoute = 'quantity';
            eventId = pathname.match(/\/booking\/([\w-]+)/)[1];
            console.log('Matched route: quantity.html, eventId:', eventId);

            chrome.storage.sync.get(['quantity'], (data) => {
              const desired = parseInt(data.quantity, 10);
              if (!desired || isNaN(desired)) {
                console.log('No valid quantity set in extension UI');
                return;
              }
              // 找到 input, +, - 按鈕
              const input = document.querySelector('input[type="text"].bigtix-input-number');
              const plusBtn = document.querySelector('.bigtix-quantity-stepper__plus');
              const minusBtn = document.querySelector('.bigtix-quantity-stepper__minus');
              const confirmBtn = document.querySelector('#bigtix-booking-next-page');

              if (!input || !plusBtn || !minusBtn || !confirmBtn) {
                console.log('Some elements not found for quantity step');
                return;
              }

              let current = parseInt(input.value, 10);
              if (current === desired) {
                confirmBtn.click();
                console.log('Quantity already correct, confirmed');
                return;
              }

              // 點擊 + 或 - 直到正確
              let interval = setInterval(() => {
                current = parseInt(input.value, 10);
                if (current < desired) {
                  plusBtn.click();
                } else if (current > desired) {
                  minusBtn.click();
                }
                if (current === desired) {
                  clearInterval(interval);
                  setTimeout(() => {
                    confirmBtn.click();
                    console.log('Set quantity and confirmed');
                  }, 100); // 稍微等一下再點確認
                }
              }, 50);
            });
            break;
          }
          case /\/booking\/([\w-]+)\/seats/.test(pathname): {
            matchedRoute = 'seats';
            eventId = pathname.match(/\/booking\/([\w-]+)/)[1];
            console.log('Matched route: seats.html, eventId:', eventId);
            // Seat selection logic (keyword priority, real user click)
            const seatAreas = Array.from(document.querySelectorAll('.bigtix-overview-map__area'));
            const visibleAreas = seatAreas.filter(area => !area.classList.contains('bigtix-overview-map__area-hidden'));
            const lowerKeywords = keywords.map(k => k.toLowerCase());
            let matchArea = null;
            let matchedKeyword = null;
            for (const kw of lowerKeywords) {
              matchArea = visibleAreas.find(area => {
                const sectionName = (area.getAttribute('data-section-name') || '').toLowerCase();
                return sectionName.includes(kw);
              });
              if (matchArea) {
                matchedKeyword = kw;
                break;
              }
            }
            function simulateUserClick(el) {
              const event = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: window
              });
              el.dispatchEvent(event);
            }
            if (matchArea) {
              simulateUserClick(matchArea);
              console.log('Auto-selected seat area:', matchArea.id, matchArea.getAttribute('data-section-name'), matchArea.getAttribute('data-area-code'), 'matched keyword:', matchedKeyword);
              // 點擊確認按鈕
              setTimeout(() => {
                // 嘗試找到常見的確認按鈕
                const confirmBtn = document.querySelector('#bigtix-booking-next-page') ||
                  Array.from(document.querySelectorAll('button')).find(btn => {
                    const style = window.getComputedStyle(btn);
                    return (
                      style.display !== 'none' &&
                      style.visibility !== 'hidden' &&
                      !btn.disabled &&
                      btn.offsetParent !== null &&
                      (btn.className.includes('primary') || btn.className.includes('bigtix-button--primary'))
                    );
                  });
                if (confirmBtn) {
                  simulateUserClick(confirmBtn);
                  console.log('Auto-clicked seat confirm button');
                } else {
                  console.log('Confirm button not found after seat selection');
                }
              }, 300); // 稍微等一下讓動畫完成
            } else {
              console.log('No matching seat area found for keywords:', keywords);
            }
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
            // Auto-click the main checkout button (sticky or bottom nav)
            // 1. Try sticky checkout card button
            const stickyBtn = document.querySelector('.bigtix-checkout_shopping_cart_sticky_checkout_card_next_button');
            if (stickyBtn && !stickyBtn.disabled && stickyBtn.offsetParent !== null) {
              stickyBtn.click();
              console.log('Auto-clicked sticky checkout button');
              break;
            }
            // 2. Try bottom navigation checkout button
            const navBtn = document.querySelector('.bigtix-booking-pagenav-next');
            if (navBtn && !navBtn.disabled && navBtn.offsetParent !== null) {
              navBtn.click();
              console.log('Auto-clicked bottom nav checkout button');
              break;
            }
            // 3. Fallback: try any visible button with text '结帐'
            const btns = Array.from(document.querySelectorAll('button')).filter(btn => {
              const style = window.getComputedStyle(btn);
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                !btn.disabled &&
                btn.offsetParent !== null &&
                btn.textContent.trim() === '结帐'
              );
            });
            if (btns.length > 0) {
              btns[0].click();
              console.log('Auto-clicked fallback checkout button');
            } else {
              console.log('No checkout button found to click');
            }
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