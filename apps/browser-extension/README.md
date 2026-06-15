# Cap Browser Extension

Cap browser extension for screen recording and instant sharing.

## Build

```bash
pnpm --filter @cap/browser-extension build
```

## Development

Watch mode with auto-rebuild:

```bash
pnpm --filter @cap/browser-extension watch
```

## Load in Chrome

1. Open `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right)
3. Click **Load unpacked**
4. Select the `dist/` folder

## Package for Upload

Create a `.zip` file ready for Chrome Web Store submission:

```bash
pnpm --filter @cap/browser-extension package
```

Output: `cap-recorder.zip` (in the monorepo root)

## Consent & Privacy

- **Auto-record is OFF by default.** Users must explicitly enable it in extension settings.
- **Recording always shows a visible countdown** (5 seconds by default, configurable from 3 to 10 seconds) before starting.
- **The user can cancel during the countdown** — a prominent Cancel button is shown on the page itself, not just in the popup.
- **The extension never records without the user's knowledge.** Every recording requires either an explicit click or a visible countdown with cancel option.
- **All data goes to the configured Cap server only** (self-hosted or cap.so). No data is sent to third parties.
