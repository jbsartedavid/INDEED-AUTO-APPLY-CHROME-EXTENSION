(() => {
  const FIELD_SELECTORS = [
    'input',
    'textarea',
    'select',
  ];

  const PROFILE_MATCHERS = [
    { key: 'fullName', patterns: ['full name', 'name'] },
    { key: 'email', patterns: ['email', 'e-mail'] },
    { key: 'phone', patterns: ['phone', 'mobile', 'telephone'] },
    { key: 'city', patterns: ['city', 'location'] },
    { key: 'summary', patterns: ['summary', 'cover letter', 'about you'] },
    { key: 'resumeLink', patterns: ['resume link', 'resume url', 'portfolio url', 'linkedin url', 'personal website'] },
  ];

  function getAssistant() {
    return {
      async run({ mode, profile, selectedFieldIds = [] }) {
        const detectedSignals = detectRobotSignals();
        if (detectedSignals.length) {
          chrome.runtime.sendMessage({
            type: 'captcha-detected',
            payload: { signals: detectedSignals, pageUrl: window.location.href },
          });
          return {
            halted: true,
            message: 'CAPTCHA or robot-check detected. Filling was stopped.',
            fields: [],
          };
        }

        const fields = findSupportedFields();
        if (mode === 'inspect') {
          return {
            halted: false,
            message: `Found ${fields.length} supported field${fields.length === 1 ? '' : 's'}.`,
            fields: fields.map(toFieldResult),
          };
        }

        const selectedFields = fields.filter((field) => selectedFieldIds.includes(field.id));
        const results = fillFields(selectedFields, profile);
        return {
          halted: false,
          message: `Filled ${results.filter((field) => field.status === 'filled').length} field${results.length === 1 ? '' : 's'}. Review before submitting.`,
          fields: results,
        };
      },
    };
  }

  function detectRobotSignals() {
    const tokens = ['captcha', 'are you a robot', 'verify you are human', 'security check'];
    const text = document.body?.innerText?.toLowerCase() ?? '';
    return tokens.filter((token) => text.includes(token));
  }

  function findSupportedFields() {
    const standardFields = [...document.querySelectorAll(FIELD_SELECTORS.join(','))]
      .filter((element) => isEditable(element))
      .map((element) => createFieldDescriptor(element, matchProfileKey(element), false))
      .filter((field) => field.profileKey);

    const resumeUploads = [...document.querySelectorAll('input[type="file"]')]
      .filter((element) => isResumeFileInput(element))
      .map((element) => createFieldDescriptor(element, 'resumeFileName', true));

    return [...standardFields, ...resumeUploads];
  }

  function fillFields(fields, profile) {
    return fields.map((field) => {
      if (field.manualOnly) {
        return {
          id: field.id,
          label: field.label,
          profileKey: field.profileKey,
          canFill: false,
          status: profile.resumeFileName ? `manual upload required (${profile.resumeFileName})` : 'manual upload required',
        };
      }

      const value = profile[field.profileKey];
      if (!value) {
        return {
          id: field.id,
          label: field.label,
          profileKey: field.profileKey,
          canFill: true,
          status: 'skipped: no profile value',
        };
      }

      applyValue(field.element, value);
      return {
        id: field.id,
        label: field.label,
        profileKey: field.profileKey,
        canFill: true,
        status: 'filled',
      };
    });
  }

  function createFieldDescriptor(element, profileKey, manualOnly) {
    return {
      id: getFieldId(element),
      element,
      label: getFieldLabel(element),
      profileKey,
      manualOnly,
      canFill: !manualOnly,
    };
  }

  function toFieldResult(field) {
    return {
      id: field.id,
      label: field.label,
      profileKey: field.profileKey,
      canFill: field.canFill,
      status: field.manualOnly ? 'manual upload required' : 'ready for review',
    };
  }

  function isEditable(element) {
    if (!(element instanceof HTMLElement)) {
      return false;
    }
    if (element instanceof HTMLInputElement) {
      return !['hidden', 'submit', 'button', 'file', 'checkbox', 'radio'].includes(element.type);
    }
    return true;
  }

  function isResumeFileInput(element) {
    const accept = element.getAttribute('accept')?.toLowerCase() ?? '';
    const hints = [getFieldLabel(element), element.getAttribute('name'), element.getAttribute('id')]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return hints.includes('resume') || hints.includes('cv') || accept.includes('pdf') || accept.includes('doc');
  }

  function getFieldLabel(element) {
    const ariaLabel = element.getAttribute('aria-label');
    const placeholder = element.getAttribute('placeholder');
    const labelledBy = element.getAttribute('aria-labelledby');
    const labelNode = element.id ? document.querySelector(`label[for="${element.id}"]`) : null;
    const labelledNode = labelledBy ? document.getElementById(labelledBy) : null;

    return ariaLabel || labelNode?.textContent?.trim() || labelledNode?.textContent?.trim() || placeholder || element.getAttribute('name') || 'Unnamed field';
  }

  function matchProfileKey(element) {
    const haystack = [
      getFieldLabel(element),
      element.getAttribute('name'),
      element.getAttribute('id'),
      element.getAttribute('autocomplete'),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    for (const matcher of PROFILE_MATCHERS) {
      if (matcher.patterns.some((pattern) => haystack.includes(pattern))) {
        return matcher.key;
      }
    }

    return null;
  }

  function getFieldId(element) {
    if (!element.dataset.applicationAssistId) {
      const parts = [element.tagName.toLowerCase(), element.getAttribute('name') || 'anon', element.getAttribute('id') || 'no-id'];
      const siblingIndex = [...document.querySelectorAll(element.tagName)].indexOf(element);
      element.dataset.applicationAssistId = `${parts.join(':')}:${siblingIndex}`;
    }

    return element.dataset.applicationAssistId;
  }

  function applyValue(element, value) {
    element.focus();

    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
      element.value = value;
    } else if (element instanceof HTMLSelectElement) {
      const option = [...element.options].find((entry) => entry.text.toLowerCase() === String(value).toLowerCase());
      if (option) {
        element.value = option.value;
      }
    }

    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.blur();
  }

  window.__APPLICATION_ASSIST__ = getAssistant();
})();
