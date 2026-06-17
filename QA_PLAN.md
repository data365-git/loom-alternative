# QA Plan for Cap — Browser Extension/Plugin

## Scope
This QA is focused exclusively on the browser extension/plugin and its integration
with the web platform. Key areas:
- Extension authentication (sign-in flow, session sync with platform)
- Video recording from extension (instruction mode + Google Meet meeting mode)
- Meeting detection popup (Google Meet content script)
- Extension UI/UX (popup, options page)
- Extension ↔ platform communication (externally_connectable, chrome.runtime.sendMessage)

## Known Issue
User cannot sign into the plugin even when logged into the platform.

**Platform:** Chrome Extension (Manifest V3) — `apps/browser-extension/manifest.json`
confirms `manifest_version: 3`, service worker background (`background.js`), offscreen
document for `USER_MEDIA`, `tabCapture`/`desktopCapture` permissions, and
`externally_connectable` restricted to three hard-coded origins.

**Tooling:** Chrome MCP (headless background tab) — extension is a browser-only
artifact; Chrome MCP drives the web platform at the production URL without opening any
native macOS windows. Extension internals (popup auth flow, options page) are exercised
via JavaScript evaluation in the MCP tab and inspection of `chrome.storage.local` state.
No Playwright install required; no native windows opened.

**Hardening tools detected:** Biome (lint + format, `biome.json` at root), TypeScript
(`tsconfig.json`), Turborepo build caching, GitHub Actions CI (`ci.yml` — typecheck,
Biome, Clippy, build), Vitest (unit tests in `apps/web`), Sentry (desktop app only).
No e2e test framework, no axe, no Lighthouse config, no Sentry in browser extension.

**Status:** Step 0 ✅ · Step 1 ✅ · Step 2 ✅ · Step 3 ⏭️ skipped · Step 4 ✅ · Step 5 ✅ PRODUCTION-READY

## The 6 steps
- Step 1 — Map extension flows + product-logic gaps  → QA_FLOWS.md
- Step 2 — Smoke gate (5-min sanity)                  → QA_SMOKE.md
- Step 3 — Full QA execution                          → QA_REPORT.md
- Step 4 — Fix all failures, re-verify                → updates QA_REPORT.md
- Step 5 — Production hardening pass                  → QA_HARDENING.md

## Non-disruptive rules (every step obeys)
- Never open windows on the user's Mac. No Preview, Finder, browsers.
- No `open` or host-display commands.
- All work on device / simulator / headless browser only.
- Screenshots resized to height ≤1800 before reading.
- Read screenshots via the Read tool only — never pop visually.
- Batch parallel work in single messages.

## Hand-off contract
- Each step reads QA_PLAN.md first to verify it's next in line.
- Each step writes its output file and updates Status.
- Files are the source of truth — chats can change, files persist.

## Key file map (for subsequent steps)

| Concern | File |
|---------|------|
| Extension manifest + permissions | `apps/browser-extension/manifest.json` |
| Sign-in button (opens callback tab) | `apps/browser-extension/src/popup/popup.ts` |
| Callback page (server — auth guard) | `apps/web/app/extension/callback/page.tsx` |
| Callback client (mints token, sends to ext) | `apps/web/app/extension/callback/CallbackClient.tsx` |
| Token minting server action | `apps/web/actions/extension/mint-token.ts` |
| External message listener | `apps/browser-extension/src/background/sw.ts` |
| Settings / API key storage | `apps/browser-extension/src/background/state.ts` |
| Options page (paste-key fallback) | `apps/browser-extension/src/options/options.ts` |
| Extension → platform API calls | `apps/browser-extension/src/background/api.ts` |
| Meet content script | `apps/browser-extension/src/content/meet-detect.ts` |
| Offscreen recorder | `apps/browser-extension/src/offscreen/` |
| Extension install page | `apps/web/app/(site)/extension/install/` |

## Sign-in flow (as designed)
1. User clicks "Sign in to Cap" in extension popup.
2. Popup opens `{apiBaseUrl}/extension/callback?extensionId={chrome.runtime.id}`.
3. If not logged in, web redirects to `/login?next=…` (login-wall).
4. After login, `CallbackClient` calls `mintExtensionToken()` server action.
5. Server action creates an `authApiKeys` row and returns `{token, email}`.
6. `CallbackClient` calls `chrome.runtime.sendMessage(extensionId, {type:"CAP_EXTENSION_TOKEN", token, apiBaseUrl})`.
7. `onMessageExternal` in background SW receives the token and calls `setSettings({apiKey: token})`.
8. Popup re-renders as signed-in.

## Suspected root causes (to verify in Steps 1–2)
1. **`externally_connectable` origin mismatch** — manifest hard-codes three origins.
   If the actual deployed URL differs (different Railway domain, HTTP vs HTTPS,
   wrong subdomain), Chrome silently drops `sendMessage`; callback shows the
   error-state with manual paste as fallback.
2. **Extension ID mismatch** — callback URL contains `extensionId` from popup;
   if extension was reloaded/reinstalled between clicking "Sign in" and completing
   login, IDs diverge and `sendMessage` rejects.
3. **`apiBaseUrl` hard-coded to Railway URL** — `state.ts` defaults to
   `https://cap-web-production-4817.up.railway.app`. If a different deployment is
   in use, API calls after sign-in hit the wrong host.
4. **5-key limit** — `mintExtensionToken` throws if user already has ≥ 5 keys.
   Error message in callback UI says "Couldn't reach the extension" (misleading).
5. **Service worker dormancy** — MV3 SWs terminate after ~30 s of inactivity.
   If the user takes time to log in, the background SW may be dead when
   `onMessageExternal` fires, causing `sendMessage` to error silently.
