const DEFAULT_STATE = {
  paused: false,
  pauseReason: '',
  lastCaptchaAt: null,
  detectedSignals: [],
};

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await chrome.storage.local.get(['assistantState']);
  if (!existing.assistantState) {
    await chrome.storage.local.set({ assistantState: DEFAULT_STATE });
  }
  await updateBadge(DEFAULT_STATE);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    return false;
  }

  if (message.type === 'captcha-detected') {
    void handleCaptchaDetected(message.payload ?? {}, sender).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === 'get-assistant-state') {
    void chrome.storage.local.get(['assistantState']).then((result) => {
      sendResponse({ assistantState: result.assistantState ?? DEFAULT_STATE });
    });
    return true;
  }

  if (message.type === 'resume-assistant') {
    void resumeAssistant().then(() => sendResponse({ ok: true }));
    return true;
  }

  return false;
});

async function handleCaptchaDetected(payload, sender) {
  const assistantState = {
    paused: true,
    pauseReason: 'CAPTCHA or robot-check detected',
    lastCaptchaAt: new Date().toISOString(),
    detectedSignals: payload.signals ?? [],
    pageUrl: sender.tab?.url ?? payload.pageUrl ?? null,
  };

  await chrome.storage.local.set({ assistantState });
  await updateBadge(assistantState);
}

async function resumeAssistant() {
  await chrome.storage.local.set({ assistantState: DEFAULT_STATE });
  await updateBadge(DEFAULT_STATE);
}

async function updateBadge(state) {
  const isPaused = Boolean(state?.paused);
  await chrome.action.setBadgeBackgroundColor({ color: isPaused ? '#b42318' : '#0f766e' });
  await chrome.action.setBadgeText({ text: isPaused ? 'STOP' : 'ON' });
}
