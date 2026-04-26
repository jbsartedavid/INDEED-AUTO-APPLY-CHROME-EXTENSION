(() => {
  const robotSignals = [
    'captcha',
    'g-recaptcha',
    'hcaptcha',
    'cf-challenge',
    'are you a robot',
    'verify you are human',
    'security check',
  ];

  function collectSignals() {
    const matches = new Set();
    const bodyText = document.body?.innerText?.toLowerCase() ?? '';

    for (const signal of robotSignals) {
      if (bodyText.includes(signal)) {
        matches.add(signal);
      }
      if (document.querySelector(`[id*="${signal}" i], [class*="${signal}" i], iframe[src*="${signal}" i]`)) {
        matches.add(signal);
      }
    }

    return [...matches];
  }

  const signals = collectSignals();
  if (!signals.length) {
    return;
  }

  chrome.runtime.sendMessage({
    type: 'captcha-detected',
    payload: {
      signals,
      pageUrl: window.location.href,
    },
  });
})();
