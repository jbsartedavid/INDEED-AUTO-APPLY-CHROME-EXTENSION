# Application Assist

Application Assist is a Chrome Manifest V3 extension for assisted job application workflows. It helps a user inspect a page, review supported fields, and fill selected values from a saved profile only after explicit confirmation.

The project is intentionally designed around user control, reviewability, and safe extension behavior. It does not auto-submit forms, attempt to bypass site protections, or impersonate a real user session.

## Why this project exists

Many job application flows repeat the same profile details across multiple forms. The goal here is to reduce repetitive typing while keeping the final decision and submission step with the user.

Application Assist focuses on:

- reusable profile data stored in Chrome sync storage
- page inspection before any fill action happens
- per-field review so the user can decide exactly what gets filled
- immediate halt behavior when robot-check or CAPTCHA signals appear
- manual handling for resume uploads and final submission

## Core capabilities

### Profile management

- Saves full name, email, phone, city, summary, resume link, and resume file label.
- Uses Chrome sync storage so the profile can follow the signed-in browser session.
- Keeps the resume file itself out of storage and only remembers its label for manual upload guidance.

### Page inspection

- Scans the current tab for supported input, textarea, select, and resume-upload patterns.
- Maps recognizable labels and attributes to saved profile values.
- Presents detected fields in the popup for review before filling.

### Selective fill flow

- Lets the user opt in field by field with checkboxes.
- Fills only checked, supported fields.
- Leaves unsupported or missing values untouched.
- Treats resume file inputs as manual-only and surfaces that clearly in the popup.

### Safety and halt logic

- Detects visible robot-check and CAPTCHA-related signals on the page.
- Immediately pauses the assistant if those signals are found.
- Updates the extension badge to `STOP` so the state is obvious.
- Requires an explicit resume action from the popup before any further use.

## What this extension does not do

- It does not auto-apply to jobs.
- It does not auto-submit forms.
- It does not bypass CAPTCHA or anti-bot systems.
- It does not spoof headers, browser fingerprints, cookies, or IP identity.
- It does not upload files silently.

## Project structure

```text
.
|-- .github/
|-- manifest.json
|-- src/
|   |-- background/
|   |   `-- service-worker.js
|   |-- page/
|   |   |-- page-assistant.js
|   |   `-- robot-detector.js
|   `-- popup/
|       |-- popup.html
|       |-- popup.css
|       `-- popup.js
`-- test-pages/
	|-- robot-check.html
	`-- sample-application.html
```

## Architecture overview

### Manifest

The extension uses Manifest V3 with a service worker background script, a popup UI, and dynamic script execution through `chrome.scripting`.

### Background service worker

The service worker manages assistant state and badge updates. When a CAPTCHA or robot-check is detected, it stores the halted state and updates the browser action badge.

### Popup UI

The popup is the control center. It lets the user:

- save and update profile data
- inspect the active page for supported fields
- choose exactly which fields to fill
- resume the assistant after a halt

### Page assistant

The injected page assistant analyzes the current page, identifies supported fields, applies selected values, and reports the result back to the popup.

### Robot detector

The robot detector runs before fill actions and looks for common CAPTCHA and robot-check indicators in page text and DOM attributes.

## Permissions

- `activeTab`: allows the extension to operate on the current page after user interaction
- `tabs`: allows the popup to identify the current active tab
- `storage`: stores profile data and assistant state
- `scripting`: injects the page assistant and robot detector when needed
- `cookies`: reserved for session-awareness scenarios, though the current implementation does not spoof or alter identity-related behavior

## Load in Chrome

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project folder.
5. Open the extension details page and enable Allow access to file URLs if you want to use the local test pages.

## How to use it

1. Open a supported application page.
2. Open the popup and save your profile.
3. Optionally choose a local resume file so the popup can remember its file name.
4. Click Inspect fields.
5. Review the detected fields.
6. Keep only the checkboxes for fields you want filled.
7. Click Fill reviewed fields.
8. Upload your resume manually if the page requires a file input.
9. Review the completed form and submit it yourself.

## Local test pages

Two local test pages are included to make validation easier without depending on a live website.

### `test-pages/sample-application.html`

Use this page to verify:

- profile save behavior
- field detection
- per-field checkbox review
- selective fill behavior
- manual resume upload reminders

### `test-pages/robot-check.html`

Use this page to verify:

- robot-check detection
- halt behavior
- badge update to `STOP`
- resume-after-halt flow

## Manual test checklist

1. Load the extension unpacked in Chrome.
2. Enable access to file URLs in the extension settings.
3. Open `test-pages/sample-application.html`.
4. Save a sample profile from the popup.
5. Run Inspect fields and confirm the detected list appears.
6. Uncheck one field and confirm only the remaining checked fields are filled.
7. Confirm the resume upload field is reported as manual-only.
8. Open `test-pages/robot-check.html`.
9. Confirm the assistant halts and the badge changes to `STOP`.
10. Use Resume after halt and confirm the badge changes back to `ON`.

## Current status

This repository contains a working MV3 extension scaffold with:

- popup profile management
- page inspection and selective fill
- robot-check detection and halt state
- local test fixtures for manual verification

## Next improvements

- richer field matching for more application sites
- explicit field preview of the value that will be filled
- optional export and import for saved profile data
- popup activity log for clearer test diagnostics

## Development notes

- The workspace is intentionally lightweight and does not require a build step.
- The extension is loaded unpacked directly from the repository folder.
- Manual testing in Chrome is the primary validation path for now.
