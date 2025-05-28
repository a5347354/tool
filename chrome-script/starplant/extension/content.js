(function() {
  // Route patterns from route.txt
  const routePatterns = [
    /\/events\/([\w-]+)/,
    /\/booking\/([\w-]+)/,
    /\/booking\/([\w-]+)\/quantity/,
    /\/booking\/([\w-]+)\/seats/,
    /\/checkout$/,
    /\/checkout\/patron$/,
    /\/checkout\/payment$/
  ];

  function getEventIdFromUrl(url) {
    for (const pattern of routePatterns) {
      const match = url.pathname.match(pattern);
      if (match) return match[1];
    }
    return null;
  }

  function getCurrentRouteIndex(url) {
    for (let i = 0; i < routePatterns.length; i++) {
      if (url.pathname.match(routePatterns[i])) return i;
    }
    return -1;
  }

  chrome.storage.sync.get(['isActive', 'keywords', 'personalInfo'], (data) => {
    if (!data.isActive) return; // Not active, do nothing

    const url = new URL(window.location.href);
    const eventId = getEventIdFromUrl(url);
    const routeIdx = getCurrentRouteIndex(url);
    const keywords = (data.keywords || '').split(',').map(k => k.trim()).filter(Boolean);
    const personalInfo = data.personalInfo || {};

    // Route-based actions
    switch (routeIdx) {
      case 0: // events.html
        // TODO: Implement logic to auto-click or select based on keywords
        break;
      case 1: // booking.html (agree)
        // TODO: Implement logic to auto-click agree/continue
        break;
      case 2: // quantity.html (select ticket quantity)
        // TODO: Implement logic to select ticket quantity based on keywords
        break;
      case 3: // seats.html (select seat)
        // TODO: Implement logic to select seat based on keywords
        break;
      case 4: // checkout.html
        // TODO: Implement logic to proceed to patron info
        break;
      case 5: // patron.html
        // TODO: Autofill personal info
        break;
      case 6: // payment.html
        // TODO: Optionally auto-submit or fill payment info
        break;
      default:
        // Not a handled route
        break;
    }
  });
})(); 