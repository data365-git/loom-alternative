# Runtime QA Plan — Cap Browser Extension

Real-world test driven via Claude-in-Chrome MCP. User loads unpacked extension; Claude drives all web pages and verification.

## Status
- [x] Build extension with all P0 fixes → `apps/browser-extension/dist/`
- [x] User loads unpacked extension in Chrome (Cap Recorder popup visible)
- [ ] Capture extension ID
- [ ] Sign-in flow E2E
- [ ] Tab recording flow E2E
- [ ] Google Meet detection flow E2E
- [ ] Popup state updates work live (STATE_CHANGED broadcast)
- [ ] Settings UI actually wired (captureMode, micDeviceId, cameraOverlay)
- [ ] Recording pill appears in Meet
- [ ] Popup sound plays on meeting detect
- [ ] Document all runtime failures
- [ ] Fix + rebuild + retest each failure
- [ ] Final verdict in QA_RUNTIME.md

## Method per flow
1. User clicks Sign in to Cap → new tab opens with `?extensionId=<id>`
2. Claude inspects that tab: URL params, console, network, DOM
3. Claude verifies the `chrome.runtime.sendMessage` external bridge fires
4. Claude checks platform behavior (auth state, redirects)
5. For recording: user starts via popup, Claude watches network for S3 PUT + /api/upload/recording-complete
6. For Meet: user opens meet.google.com, Claude inspects content script DOM injection

## Known gaps still expected to fail (from QA_FLOWS.md Step 1)
- Recording pill in Meet (sw never calls chrome.tabs.sendMessage RECORDING_STARTED)
- Popup state freeze (sw never broadcasts STATE_CHANGED)
- Dead settings (captureMode/micDeviceId/cameraOverlay never read by sw)
- Popup sound (not confirmed wired)

## Files of interest
- `apps/browser-extension/src/background/sw.ts` — message handler, state machine
- `apps/browser-extension/src/background/upload.ts` — S3 multipart + retry
- `apps/browser-extension/src/popup/popup.ts` — sign-in launcher
- `apps/browser-extension/src/content/meet-detect.ts` — Meet nudge
- `apps/web/app/extension/callback/CallbackClient.tsx` — sign-in bridge to extension
