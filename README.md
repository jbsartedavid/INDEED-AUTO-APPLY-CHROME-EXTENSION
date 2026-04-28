<div align="center">

# Application Assist

**A smart, privacy-first Chrome extension that fills job application forms from a saved profile — only when you say so.**

[![Chrome MV3](https://img.shields.io/badge/Chrome-Manifest%20V3-4285F4?logo=googlechrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/version-0.1.0-006d77)](https://github.com/jbsartedavid/INDEED-AUTO-APPLY-CHROME-EXTENSION/releases)
[![License](https://img.shields.io/badge/license-MIT-teal)](LICENSE)
[![Contact](https://img.shields.io/badge/email-jbsartedavid%40gmail.com-red?logo=gmail&logoColor=white)](mailto:jbsartedavid@gmail.com)

</div>

---

## What is Application Assist?

Filling out job applications is repetitive. The same name, email, phone number, city, and summary appear on dozens of application forms. Application Assist eliminates that friction.

Open the popup, save your profile once, navigate to any application page, inspect the detected fields, pick exactly which ones to fill, and click one button. The form is pre-filled. You review it. You submit it.

**You stay in control at every step.** The extension never submits forms for you, never uploads files silently, and stops immediately if it detects a CAPTCHA or robot-check.

---

## Features at a glance

| Feature | Details |
|---|---|
| **Saved profile** | Name, email, phone, city, summary, resume URL, and resume filename stored in Chrome sync storage |
| **Page inspection** | Scans the current tab and maps recognized fields to your profile |
| **Selective fill** | Checkboxes per detected field — fill only what you approve |
| **Resume guidance** | Identifies file upload fields and reminds you to upload manually |
| **CAPTCHA halt** | Detects robot-check signals and freezes the assistant immediately |
| **Badge indicator** | Extension badge shows `ON` or `STOP` at a glance |
| **No auto-submit** | Submission is always a deliberate manual action |
| **No tracking** | Zero analytics, zero external data transmission |

---

## How it works

```
┌─────────────────────────────────────────────────────────┐
│                     Extension Popup                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Save Profile│  │Inspect Fields│  │  Fill Fields  │  │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘  │
└─────────────────────────── │ ────────────────│──────────┘
                             │                 │
                  chrome.scripting.executeScript()
                             │                 │
┌────────────────────────────┼─────────────────┼──────────┐
│            Active Tab Page │                 │          │
│  ┌─────────────────────────▼─────────────────▼───────┐  │
│  │  robot-detector.js → page-assistant.js            │  │
│  │  1. Scan for CAPTCHA signals → halt if found      │  │
│  │  2. Find form fields → map to profile keys        │  │
│  │  3. Fill only user-selected fields                │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                             │
          ┌──────────────────▼──────────────────┐
          │      service-worker.js               │
          │  Manages halt state + badge updates  │
          └──────────────────────────────────────┘
```

---

## Getting started

### Option 1 — Load unpacked (local use, no build required)

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (toggle in the top right).
4. Click **Load unpacked**.
5. Select the root folder of this project.
6. The extension icon appears in your toolbar immediately.

> **Tip:** On the extension details page, enable **Allow access to file URLs** if you want to test against the local HTML pages included in `test-pages/`.

### Option 2 — Package as a zip for distribution

Run the included PowerShell packaging script:

```powershell
cd C:\path\to\INDEEDAUTOAPPLY
.\scripts\package-extension.ps1 -Version 0.1.0
```

A distributable zip is created at `dist/application-assist-0.1.0.zip`. This file can be attached to a GitHub release or submitted to the Chrome Web Store developer dashboard.

### Option 3 — Chrome Web Store

Before submitting publicly, prepare:

- Final branded icons (replace placeholders in `assets/icons/`)
- Store listing screenshots (min. 1280×800 or 640×400)
- Store listing description (short + long)
- Finalized privacy policy — see `PRIVACY.md`
- Support email in the listing (use `jbsartedavid@gmail.com`)

---

## Usage walkthrough

**1. Save your profile**

Open the extension popup. Fill in your name, email, phone, city, and summary. Add a resume URL and optionally pick a local resume file so it can remind you of the filename during uploads. Click **Save profile**.

**2. Navigate to an application page**

Go to any job application form — on Indeed or elsewhere.

**3. Inspect the page**

Click **Inspect fields** in the popup. The extension scans the page and lists all supported fields with checkboxes. Each field shows what profile value it maps to.

**4. Select what to fill**

Uncheck any fields you want to leave alone. Resume upload fields are shown but are always marked manual-only.

**5. Fill and review**

Click **Fill reviewed fields**. Only the checked fields are updated on the page. Review everything before submitting.

**6. Submit manually**

The submit button is always yours to click. The extension never submits for you.

---

## Safety and halt behavior

If Application Assist detects any of the following on the active page it **immediately stops** and updates the badge to `STOP`:

- CAPTCHA elements or iframes
- Text containing "are you a robot", "verify you are human", or "security check"
- Common CAPTCHA class/id patterns (`g-recaptcha`, `hcaptcha`, `cf-challenge`)

The popup displays the halt reason and an explicit **Resume after halt** button so you can reset the state once the page is safe.

---

## Project structure

```
INDEEDAUTOAPPLY/
├── assets/
│   └── icons/                  # Extension icons (16, 32, 48, 128px)
├── scripts/
│   └── package-extension.ps1   # Packaging script for release zips
├── src/
│   ├── background/
│   │   └── service-worker.js   # Halt state management + badge updates
│   ├── page/
│   │   ├── page-assistant.js   # Field detection, mapping, and fill logic
│   │   └── robot-detector.js   # CAPTCHA / robot-check signal detection
│   └── popup/
│       ├── popup.html          # Extension popup UI
│       ├── popup.css           # Popup styles
│       └── popup.js            # Popup interaction logic
├── test-pages/
│   ├── sample-application.html # Local form for testing fill behavior
│   └── robot-check.html        # Local page for testing halt behavior
├── manifest.json               # Chrome MV3 extension manifest
├── PRIVACY.md                  # Privacy policy for distribution
└── README.md
```

---

## Permissions explained

| Permission | Why it's needed |
|---|---|
| `activeTab` | Operate on the current tab only after user interaction |
| `tabs` | Identify the active tab from the popup |
| `storage` | Save profile data and assistant pause state |
| `scripting` | Inject page assistant and robot detector when needed |
| `cookies` | Reserved for session-awareness; no identity spoofing |

---

## Manual test checklist

Use the local test pages included in the `test-pages/` directory.

- [ ] Load the extension unpacked in Chrome
- [ ] Enable Allow access to file URLs
- [ ] Open `test-pages/sample-application.html`
- [ ] Save a profile from the popup and confirm the saved status message
- [ ] Click Inspect fields and confirm the field list appears with checkboxes
- [ ] Uncheck one field, click Fill reviewed fields, confirm only checked fields update
- [ ] Confirm resume upload fields are listed as manual-only
- [ ] Open `test-pages/robot-check.html`
- [ ] Confirm the badge changes to `STOP` and the popup shows the halt message
- [ ] Click Resume after halt and confirm the badge returns to `ON`

---

## Roadmap

- [ ] Richer field matching patterns for more application sites
- [ ] Field preview showing the exact value before filling
- [ ] Profile export and import (JSON)
- [ ] Popup activity log for easier debugging
- [ ] Branded icon set

---

## Contributing

Pull requests are welcome. For significant changes please open an issue first.

---

## Contact

Questions, feedback, or issues — reach out at [jbsartedavid@gmail.com](mailto:jbsartedavid@gmail.com)

---

## License

MIT — see `LICENSE` for details.
