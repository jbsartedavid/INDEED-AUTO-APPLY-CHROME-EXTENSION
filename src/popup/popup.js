const PROFILE_KEY = 'applicationProfile';

const form = document.querySelector('#profile-form');
const inspectButton = document.querySelector('#inspect-page');
const fillButton = document.querySelector('#fill-page');
const resumeButton = document.querySelector('#resume');
const resumeFileInput = document.querySelector('#resume-file');
const statusNode = document.querySelector('#status');
const fieldResults = document.querySelector('#field-results');
let latestFields = [];

init().catch((error) => {
  renderStatus(`Failed to initialize popup: ${error.message}`, true);
});

async function init() {
  const [{ [PROFILE_KEY]: profile }, { assistantState }] = await Promise.all([
    chrome.storage.sync.get([PROFILE_KEY]),
    chrome.runtime.sendMessage({ type: 'get-assistant-state' }),
  ]);

  populateForm(profile ?? {});
  renderAssistantState(assistantState);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const payload = Object.fromEntries(new FormData(form).entries());
  await chrome.storage.sync.set({ [PROFILE_KEY]: payload });
  renderStatus('Profile saved locally to Chrome sync storage.');
});

resumeFileInput.addEventListener('change', () => {
  const [file] = resumeFileInput.files ?? [];
  if (!file) {
    return;
  }

  form.elements.namedItem('resumeFileName').value = file.name;
  renderStatus('Resume file name captured for manual upload reference.');
});

inspectButton.addEventListener('click', async () => {
  renderStatus('Inspecting the current tab for supported fields...');
  const result = await runAssistantAction('inspect');
  renderFieldResults(result?.fields ?? []);
});

fillButton.addEventListener('click', async () => {
  const selectedFieldIds = getSelectedFieldIds();
  if (!selectedFieldIds.length) {
    renderStatus('Select at least one detected field before filling.', true);
    return;
  }

  renderStatus('Filling reviewed fields on the current page. Submission remains manual.');
  const result = await runAssistantAction('fill', { selectedFieldIds });
  renderFieldResults(result?.fields ?? []);
});

resumeButton.addEventListener('click', async () => {
  await chrome.runtime.sendMessage({ type: 'resume-assistant' });
  renderStatus('Extension resumed. You can inspect the page again.');
  renderAssistantState({ paused: false, pauseReason: '' });
});

async function runAssistantAction(mode, extra = {}) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error('No active tab found.');
  }

  const [{ [PROFILE_KEY]: profile }] = await Promise.all([
    chrome.storage.sync.get([PROFILE_KEY]),
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['src/page/robot-detector.js'],
    }),
  ]);

  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['src/page/page-assistant.js'],
  });

  const [{ result: actionResult }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    args: [{ mode, profile: profile ?? {}, ...extra }],
    func: (payload) => window.__APPLICATION_ASSIST__.run(payload),
  });

  if (actionResult?.halted) {
    renderStatus(actionResult.message ?? 'Execution halted because a robot check was detected.', true);
  } else if (actionResult?.message) {
    renderStatus(actionResult.message);
  }

  return actionResult;
}

function populateForm(profile) {
  for (const element of form.elements) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) {
      continue;
    }
    element.value = profile[element.name] ?? '';
  }
}

function renderFieldResults(fields) {
  latestFields = fields;
  fieldResults.textContent = '';
  if (!fields.length) {
    const item = document.createElement('li');
    item.className = 'field-item';
    item.textContent = 'No supported form fields found on the current page.';
    fieldResults.append(item);
    fillButton.disabled = true;
    return;
  }

  for (const field of fields) {
    const item = document.createElement('li');
    item.className = 'field-item';

    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = field.id;
    checkbox.checked = Boolean(field.canFill && field.status !== 'manual upload required');
    checkbox.disabled = !field.canFill;

    const text = document.createElement('span');
    text.textContent = field.label;
    label.append(checkbox, text);

    const meta = document.createElement('div');
    meta.className = 'field-meta';
    meta.textContent = `${field.profileKey ?? 'manual'} - ${field.status}`;

    item.append(label, meta);
    fieldResults.append(item);
  }

  fillButton.disabled = !fields.some((field) => field.canFill);
}

function getSelectedFieldIds() {
  return [...fieldResults.querySelectorAll('input[type="checkbox"]:checked')].map((input) => input.value);
}

function renderAssistantState(state) {
  if (state?.paused) {
    renderStatus(state.pauseReason || 'Assistant is paused.', true);
    return;
  }
  renderStatus('Ready');
}

function renderStatus(message, halted = false) {
  statusNode.textContent = message;
  statusNode.classList.toggle('halted', halted);
}
