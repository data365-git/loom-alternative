# QA_FLOWS.md — Browser Extension Audit

**Scope:** `apps/browser-extension/` + extension-facing web platform routes
**Step:** 1 of 6 — Product-logic completeness mapping
**Date:** 2026-06-16

---

## TABLE A — Platform Map

| Area | Screen / Route | Entity | Main user actions | Related screens | Risk |
|------|---------------|--------|-------------------|-----------------|------|
| Extension install page | `/extension/install` (web) | — | Read install instructions; links to `/dashboard/developers` | Callback, Dashboard | P1 — Both CTA buttons are `disabled`; no real install path exists. |
| Extension popup — not signed in | `popup.html` (no apiKey) | ExtensionSettings | "Sign in to Cap" opens callback tab; "Or paste API key" opens options page | Callback page, Options page | P0 — Blocking state for all users. Known sign-in bug lives here. |
| Extension popup — idle (non-Meet) | `popup.html` (signed in, idle) | ExtensionState | "Record Instruction" sends START_INSTRUCTION; closes popup | Options page, Offscreen | P0 — Only entry point to instruction recording. |
| Extension popup — idle (Meet tab) | `popup.html` (idle, Meet URL detected) | ExtensionState | "Record this Meeting" or "Record Instruction"; tap Settings link | Options page, Meet content script | P0 — Primary meeting recording trigger. |
| Extension popup — arming | `popup.html` (state.kind=arming) | ExtensionState | Shows "Starting recording..." text; NO cancel button | Offscreen recorder | P1 — No escape from arming state; user stuck until system picker appears. |
| Extension popup — recording | `popup.html` (state.kind=recording) | ExtensionState | Pause/Resume (Pause button); Stop | Offscreen recorder | P0 — Active recording controls. paused flag never persisted to storage. |
| Extension popup — uploading | `popup.html` (state.kind=uploading) | ExtensionState | View spinner + parts count; "Cancel upload" | SW upload pipeline | P1 — Cancel leaves orphaned S3 multipart. |
| Extension popup — error | `popup.html` (state.kind=error) | ExtensionState | "Retry" (sends RETRY — unhandled); "Dismiss" (sends CANCEL) | SW state machine | P0 — Retry button is silently broken. |
| Extension popup — onboarding | `popup.html` (capExtFirstRun not false) | chrome.storage | Read 3 consent bullets; "Got it" → proceed | Popup main UI | P2 — One-time flow; functional. |
| Options — Account section | `options.html` | ExtensionSettings, authApiKey | Edit Cap Server URL; show/hide API key; "Test connection" (hits /api/health); "Sign in with Cap" | Callback page | P0 — /api/health does not exist; test always fails. No sign-out/clear button. |
| Options — Recording section | `options.html` | ExtensionSettings | Select microphone; toggle camera overlay; choose capture mode | Offscreen recorder | P1 — micDeviceId, captureMode, cameraOverlay saved but never applied to recording flow. |
| Options — Google Meet section | `options.html` | ExtensionSettings | Toggle auto-record; countdown slider 3-10s; toggle notification sounds | Meet content script | P1 — Correctly wired and functional. |
| Options — About section | `options.html` | — | Links to Extension page, Cap Dashboard, Report issue | Install page (404), dashboard | P2 — "Extension page" link target (/extension/install) exists but has disabled CTAs. |
| Auth callback page | `/extension/callback` (web) | authApiKeys | Mint token; sendMessage to extension; fallback copy-key UI on failure | Login page, Options page | P0 — sendMessage fails when Railway URL not in externally_connectable; error UI misleading regardless of actual error cause. |
| Auth callback — unauthenticated | `/extension/callback` redirects to `/login?next=...` | User session | Login, redirect back with extensionId preserved | Callback page | P1 — Redirect preserves extensionId correctly. |
| Background service worker | `background.js` | ExtensionState, ExtensionSettings | Handles all messages; manages badge; startup recovery; alarm keepalive | All extension surfaces | P0 — No RETRY handler; no STATE_CHANGED broadcast; no RECORDING_STARTED to content scripts. |
| Offscreen recorder | `offscreen.html + recorder.ts` | MediaStream, MediaRecorder | START_CAPTURE (picker or silent-tab); STOP; PAUSE; RESUME | SW | P0 — silent-tab mode always throws (streamId never passed from SW); captureMode setting ignored. |
| Upload pipeline | SW + upload.ts | Video, S3 multipart | Chunked upload; retry queue; dead-letter queue; recordingComplete | Web API | P1 — recordingComplete returns 400 for extensionWeb; extension silently swallows it; no post-processing triggered. |
| Meet content script | `content.js` on meet.google.com | NudgeState | Detect call join/leave; show nudge (default/countdown/recording); "Record now", "Later", "Dismiss" | SW, Popup | P0 — Content script listens for RECORDING_STARTED from SW but SW never sends chrome.tabs.sendMessage with this event; pill overlay never shown. |
| Dashboard — Meeting Recordings | `/dashboard/meetings` | Video (extensionWeb/meeting) | List, delete single/bulk, paginate; keyboard shortcuts | Extension install page (empty state) | P1 — Correctly filters by extensionWeb + meeting context. |
| Dashboard — Account Settings | `/dashboard/settings/account` | authApiKeys (Gemini only) | Add/test/remove Gemini API key | — | P1 — ApiKeysSection manages Gemini keys only, NOT extension tokens. No UI to list or revoke extension auth tokens. |
| Dashboard — Developers page | `/dashboard/developers` | Developer apps | Create/manage developer apps and SDK keys | — | P2 — Install page directs users here but developer SDK keys are not extension auth tokens. Misleading onboarding docs. |

---

## TABLE B — Entity Lifecycle Matrix

| Entity | Create | Read/List | Edit | Delete/Archive/Disable | Manage/Configure | Missing logic | Priority |
|--------|--------|-----------|------|------------------------|------------------|---------------|----------|
| **ExtensionSettings** | ✅ Defaults on first read | ✅ Options page loads all | ✅ Options page saves on blur/change | ❌ No reset-to-defaults | ⚠️ micDeviceId, captureMode, cameraOverlay saved but never applied by recording flow | captureMode and micDeviceId are dead settings; cameraOverlay toggle has no overlay rendering; no sign-out/clear API key button | P0 |
| **ExtensionState** | ✅ Defaults idle on first read | ✅ GET_STATE message | ❌ Transitions via message handlers only | ⚠️ CANCEL resets to idle; RETRY sends unhandled message | ⚠️ No STATE_CHANGED broadcast to popup; popup only updates on open; paused flag never persisted | RETRY message unhandled by SW; STATE_CHANGED never emitted; paused state wrong after close/reopen popup | P0 |
| **authApiKey** (extension token) | ✅ Auto-minted by mintExtensionToken() on each callback visit | ❌ No list UI in dashboard | ❌ No rename or label | ⚠️ Only bulk-delete via "Sign out all devices"; no individual revoke | ❌ No per-key management; no last-used; no device label | 5-key hard limit with no individual revoke UI; misleading error message when limit hit; every callback visit mints a new key (no check for existing valid key) | P0 |
| **Video (extensionWeb/instruction)** | ✅ Created via createVideo() API during recording | ✅ Appears in main Caps dashboard | ✅ Rename, share via dashboard | ✅ Delete (dashboard) | ⚠️ No post-processing triggered | recordingComplete returns 400 for extensionWeb; extension silently swallows it; no thumbnail, no transcription, no AI title | P0 |
| **Video (extensionWeb/meeting)** | ✅ Created during recording | ✅ Appears in Meetings dashboard | ✅ Rename, share | ✅ Delete | ⚠️ Same — no post-processing | Same 400 gap; pill overlay in Meet never activates during recording | P0 |
| **RetryQueueItem** | ✅ Created on upload failure | ❌ No UI to inspect | ❌ No edit | ❌ No UI to clear or force-retry | ❌ After MAX_ATTEMPTS(6) moves to dead-letter; no recovery path | Dead-letter queue grows silently; user can never recover permanently-failed recordings; no link to partially-uploaded video | P1 |
| **DeadLetterQueueItem** | ✅ After 6 failures | ❌ No UI | ❌ No edit | ❌ No clear/retry | ❌ One Chrome notification then permanently stuck | Notification says "saved locally as fallback" which is false — no local file is written; queue accumulates forever | P1 |
| **NudgeState** (content script, in-memory) | ✅ Hidden on load | ✅ Rendered in Shadow DOM | ✅ Transitions on meeting events | ✅ Cleared when call ends | ⚠️ dismissed and laterUntil are in-memory only; reset on page reload | SW never sends RECORDING_STARTED/STOPPED/PAUSED/RESUMED to content script via tabs.sendMessage; pill overlay broken by design | P0 |
| **KeepAlive alarm** | ✅ Started on recording begin | ✅ isKeepAliveAlarm() check | N/A | ✅ Stopped on recording end | N/A | Alarm handler reads capExtState but does nothing — adequate for keep-alive only | P2 |
| **User session** (web platform) | ✅ NextAuth | ✅ getCurrentUser() | ✅ Profile settings | ✅ "Sign out all devices" | N/A (for extension scope) | Extension has no awareness of web logout; API key remains valid after web sign-out until explicitly revoked | P1 |

---

## TABLE C — Flow Inventory (execution list for Step 3)

Gap types:  
A = Missing management action | B = Incomplete CRUD | C = Broken journey/dead end  
D = Missing state sync | G = Missing automation control | H = Missing feedback/error handling  
I = UI looks interactive but isn't

| # | Flow | Trigger | Steps | Expected result | Edge cases | Gap type | Critical? | Smoke? |
|---|------|---------|-------|----------------|------------|----------|-----------|--------|
| 1 | Extension loads for first time (onboarding) | Fresh install, first popup open | Install → open popup → onboarding shown → "Got it" → capExtFirstRun=false saved → main popup renders | Onboarding shown once; thereafter sign-in screen | capExtFirstRun never set (storage cleared); user closes before "Got it" | — | YES | YES |
| 2 | Sign in via callback (happy path) | Click "Sign in to Cap" in popup (platform session active) | Popup opens callback tab with extensionId → platform sees session → mintExtensionToken() → sendMessage(extensionId, CAP_EXTENSION_TOKEN) → SW onMessageExternal saves apiKey → popup re-renders signed-in | apiKey stored; popup shows recording UI | SW dormant; externally_connectable mismatch; 5-key limit; window closed mid-flow | C, D, H | YES | YES |
| 3 | Sign in — externally_connectable URL mismatch | Deployed at URL not in manifest's externally_connectable list | Steps 1-4 same → sendMessage silently fails → error UI shown | Error state with copy-key fallback | Most likely root cause of known bug; verify manifest URL matches deployed Railway URL exactly | H | YES | YES |
| 4 | Sign in — SW dormant during callback | User takes >30s to log in | SW terminates → sendMessage to SW fails after user authenticates → error shown | Error UI with copy-key fallback | MV3 SWs terminate without alarms; no keep-alive active during sign-in | C, H | YES | NO |
| 5 | Sign in — 5-key limit hit | User already has 5 extension API keys | mintExtensionToken() throws specific error → callback error UI shows status.token="" | Error shown; copy button copies empty string | No UI in dashboard to list/revoke extension keys; user fully stranded | B, C, H | YES | NO |
| 6 | Sign in — manual API key paste (options fallback) | Click "Or paste API key"; or copy from error UI | Options page opens → user pastes key → tabs away (blur) → saveSettings({apiKey}) → popup re-renders signed-in | Key stored; popup shows signed-in | Trailing whitespace included in key; blank key clears auth silently; user closes tab without triggering blur | H | YES | NO |
| 7 | Test connection in Options page | Click "Test connection" | Fetch {apiBaseUrl}/api/health → check res.ok | Success/fail status | /api/health does NOT exist (returns 404); correct endpoint is /api/status; test always fails | C, H | YES | YES |
| 8 | Sign out / clear API key | User wants to disconnect extension from account | No sign-out button in popup or options page | — | Must manually clear API key field in options; no server-side revocation; no confirmation | A | YES | NO |
| 9 | Record instruction (happy path, picker mode) | Click "Record Instruction" in popup | START_INSTRUCTION → SW sets arming → offscreen created → START_CAPTURE mode:picker → getDisplayMedia shows system picker → user picks → RECORDER_STARTED → initializeUpload() calls createVideo() API → state=recording → keepalive starts | Popup shows recording UI; badge "REC" | User cancels picker (RECORDER_ERROR); mic permission denied; API call fails (401, no network) | H, D | YES | YES |
| 10 | Popup does not update in real time | Popup kept open when recording starts | STATE_CHANGED never broadcast from SW | Popup shows current state on init (works); stays frozen after | STATE_CHANGED never emitted; timer freezes; user sees stale idle view if popup was open before recording started | D | YES | NO |
| 11 | Pause and Resume recording | Click Pause/Resume in popup | PAUSE → SW → PAUSE_CAPTURE offscreen → recorder.pause(); RESUME → RESUME_CAPTURE → recorder.resume() | Button label toggles; recording paused/resumed | state.paused never written to storage; if popup closed and reopened, "Pause" shown instead of "Resume"; badge unchanged during pause | D | NO | NO |
| 12 | Stop recording and upload | Click "Stop" in popup | STOP → SW → offscreen → recorder.stop() → RECORDER_STOPPED → setState(uploading) → closeOffscreenDocument() → finalizeUpload() → completeMultipart() → recordingComplete() → setState(idle) | Video uploaded; popup idle; badge cleared | SW killed mid-upload (Chrome kills SW after ~5min idle); inMemoryBuffer data lost; partial upload resumes from retry queue only | H | YES | YES |
| 13 | recordingComplete always 400 for extension videos | finalizeUpload() calls recordingComplete() | POST /api/upload/recording-complete/ with videoId | Video marked complete; post-processing triggered | Endpoint checks video.source.type !== 'desktopSegments' → 400 for extensionWeb; extension silently swallows 400 at api.ts:132; no thumbnail/transcription/AI title ever triggered | B, G | YES | NO |
| 14 | Cancel upload in progress | Click "Cancel upload" in uploading state | CANCEL → SW → sendToOffscreen(STOP_CAPTURE) (throws, swallowed) → closeOffscreenDocument() → setState(idle) | State idle | Already-uploaded S3 parts not aborted; multipart not completed/aborted; video row remains in DB — permanent storage leak | A, B | NO | NO |
| 15 | Error recovery — Retry button broken | Recording fails; user sees error state; clicks "Retry" | sendMsg({type:"RETRY"}) → SW default case → {ok:false, error:"unknown message type: RETRY"} | Should restart recording; actually does nothing | Error state persistent; user must click Dismiss and start over from scratch | A, C | YES | NO |
| 16 | SW restart recovery (browser restart mid-recording) | Browser restarted during state=recording | onStartup fires → notification shown → state transitions to uploading → keepalive started → retryPendingUploads() | Partial recording uploaded from retry queue | inMemoryBuffer lost at restart (data since last 5MB flush gone permanently); retryPendingUploads only called on onStartup, not periodically | H | NO | NO |
| 17 | Meet call detection — nudge shown | User joins Google Meet with extension active | Content script detects [aria-label="Leave call"] in DOM → MEET_CALL_STARTED → SW checks autoRecordOnMeet → default or countdown nudge shown in shadow DOM | Nudge visible in bottom-right corner | Meet UI localizes aria-labels; DOM selector may not match; extension not installed | H | YES | YES |
| 18 | Recording pill overlay never shown in Meet | Recording active on Meet tab | SW should send RECORDING_STARTED to content script tab via chrome.tabs.sendMessage | Pill with timer and Stop button visible in Meet tab | SW never calls chrome.tabs.sendMessage; pill never shown; RECORDING_STOPPED/PAUSED/RESUMED also never sent | D, G | YES | NO |
| 19 | Auto-record countdown — cancel | autoRecordOnMeet=true; user joins Meet | Countdown nudge shown → user clicks "Cancel" or "Don't auto-record" → MEET_NUDGE_DISMISS → dismissed=true | No recording; nudge hidden for session | Countdown fires before user clicks; countdown in-memory only — page reload re-shows | H | NO | NO |
| 20 | Auto-record countdown — reaches zero | 5-second countdown completes | MEET_NUDGE_RECORD_NOW sent at countdown=0 → recording starts | Recording starts; sound chime plays | SW dormant; user not signed in → initializeUpload throws "apiKey is not configured" | H | NO | NO |
| 21 | Meet call ends — recording auto-stops | User leaves Google Meet during recording | Content script detects leave → MEET_CALL_ENDED with meetingId → SW checks if recording + meeting matches → STOP_CAPTURE | Recording stopped; upload begins | meetingId mismatch; user navigated away without leaving; SW dormant | — | NO | NO |
| 22 | SPA navigation in Meet | User navigates between Meet rooms | setInterval polling + popstate/hashchange → maybeShow() called | Nudge resets for new meeting ID; dismissed state cleared | 1-second polling delay; race with MutationObserver (500ms debounce) | — | NO | NO |
| 23 | Options — microphone selector | Open Options page | getUserMedia({audio:true}) → enumerateDevices() → select populated | Mic list shown; user can select | Mic permission denied; no mics; CRITICAL: selected micDeviceId never passed to recorder (dead setting) | I, B | NO | NO |
| 24 | Options — capture mode: silent-tab | User selects "Quick-record current tab" | Setting saved as captureMode:"silent-tab" | Should capture current tab silently | SW always sends mode:"picker"; captureMode never read; silent-tab also needs streamId from chrome.tabCapture which is never called | I, B | YES | NO |
| 25 | Options — camera overlay toggle | User enables "Camera overlay" | Setting saved as cameraOverlay:true | Camera pip overlay during recording | No camera capture code anywhere in extension; cameraOverlay is a stored-only setting | I, B | NO | NO |
| 26 | Retry queue — upload failure and retry | Network error during part upload | addToRetryQueue() → exponential backoff → retryPendingUploads() on onStartup | Part retried up to 6 times | retryPendingUploads() only called on onStartup — failed parts may wait until browser restart; no periodic retry | G | NO | NO |
| 27 | Dead letter queue — permanently failed upload | 6 retry attempts exhausted | moveToDeadLetter() → Chrome notification fired | User notified "Upload failed — recording saved locally as fallback" | "Saved locally as fallback" is false — no local file written; queue accumulates; no UI to view or clear | H | NO | NO |
| 28 | Extension install page — disabled CTAs | User visits /extension/install | Page renders | Both buttons disabled; no install path | User cannot install extension from this page — dead end | C | YES | NO |
| 29 | Dashboard meetings empty state links to dead install page | No meeting recordings | Empty state: "Install Extension" button → /extension/install | User lands on install page with disabled CTAs — double dead end | C | NO | NO |
| 30 | Popup re-opened during upload | User closes and reopens popup mid-upload | getStateFromSW() returns uploading → renderUploading() shown | Parts count shown (static) | Parts count not live-updated (STATE_CHANGED never broadcast); cancel leaves orphaned S3 multipart | D | NO | NO |
| 31 | API key revoked from platform side | Admin/user revokes key via platform | Next API call → 401 → upload fails | Extension shows signed-in (key in storage) but all calls fail; no re-auth prompt; no 401 detection | D, H | YES | NO |
| 32 | Token sent to wrong extension ID | Extension reloaded between click "Sign in" and login completion | Extension ID changes; callback still has old extensionId | sendMessage targets dead extension ID; Chrome silently rejects; must sign in again | H | NO | NO |
| 33 | Multiple simultaneous recordings prevented | Recording already active; user triggers another | SW checks state.kind !== "idle" → {ok:false, error:"already active"} | Second recording blocked | Error returned to caller but popup has no visible indication of rejection | H | NO | NO |
| 34 | Recording interrupted by OS stop-sharing | User uses system stop-sharing button | videoTracks[0].onended fires → recorder.stop() → RECORDER_STOPPED → upload flow | Upload begins automatically | inMemoryBuffer may have unsent chunks; race between onended and STOP_CAPTURE message | — | NO | NO |
| 35 | Extension used with no organization | User authenticated but has no org | createVideo() → /api/desktop/video/create → no valid org → {error:"no_valid_org", 403} | Video creation fails; upload never starts; state stuck in arming | User stuck in arming state with no error visible — error only thrown inside initializeUpload which is called after RECORDER_STARTED | H, C | NO | NO |
| 36 | Options page opened before SW active | Opened immediately after install | sendMessage(GET_ALL_SETTINGS) → SW wakes → settings loaded | Settings loaded normally | SW cold start delay; on failure loadSettings() rejects → init() errors silently | H | NO | NO |
| 37 | Popup state poll fails (SW dead) | Popup opened when SW dormant | getStateFromSW() → SW wakes → responds | SW wakes and responds; fallback resolves with idle | SW may take time to wake; fallback masks real state (e.g. mid-upload) | D | NO | YES |
| 38 | Sound playback in content script | Call joined with soundEnabled:true | AudioContext created; sine tones played | Sounds play | Browser tab muted; AudioContext suspended (autoplay policy) | H | NO | NO |
| 39 | Extension on non-HTTPS page | User opens popup on HTTP page | Popup renders; getDisplayMedia requires secure context | Recording attempt should fail gracefully | getDisplayMedia throws "Not a secure context"; RECORDER_ERROR fired; error state shown | H | NO | NO |
| 40 | No feedback after recording completes | Upload finalizes; state returns to idle | Popup shows idle UI | User should see link or confirmation | Zero confirmation: no "View recording" link, no shareable URL, no notification; user must find video in dashboard manually | C, H | YES | NO |

---

## Gap Summary by Type

| Gap type | Count | Flows |
|----------|-------|-------|
| A — Missing management action | 3 | 8, 14, 15 |
| B — Incomplete CRUD / feature | 7 | 5, 13, 14, 23, 24, 25, 26 |
| C — Broken journey / dead end | 8 | 3, 4, 5, 7, 15, 28, 35, 40 |
| D — Missing state sync | 7 | 2, 10, 11, 18, 30, 31, 37 |
| G — Missing automation control | 2 | 13, 26 |
| H — Missing feedback/error | 14 | 4, 5, 6, 7, 16, 19, 20, 27, 31, 32, 33, 35, 38, 40 |
| I — UI looks interactive but isn't | 3 | 23, 24, 25 |

**Total flows: 40 | Critical: 16 | Smoke: 8 | Unique gap instances: 44**

### Top P0 bugs confirmed from code

1. `/api/health` endpoint does not exist — options page "Test connection" always fails (flow 7). Fix: change to `/api/status`.
2. `RETRY` message has no handler in sw.ts — Retry button in error state silently does nothing (flow 15). Fix: add handler.
3. SW never broadcasts `STATE_CHANGED` — popup freezes at open-time state; recording/upload transitions invisible (flow 10).
4. `state.paused` never written to storage — pause/resume not reflected on popup close/reopen (flow 11).
5. `captureMode`, `micDeviceId`, `cameraOverlay` saved but never applied — three dead settings (flows 23, 24, 25).
6. No individual API key revoke — 5-key limit leaves user stranded (flows 5, 8). Fix: add revoke UI.
7. Zero post-upload feedback — user cannot access or share recording from within extension (flow 40).
8. `CANCEL` during upload orphans server-side video + S3 multipart (flow 14).
9. Recording pill in Meet content script never shown — SW never sends `RECORDING_STARTED` to the tab (flow 18).
10. `externally_connectable` excludes staging/preview origins — confirmed root cause of known sign-in bug (flow 3).
11. `recordingComplete` returns 400 for `extensionWeb` — no post-processing (thumbnail, transcript, AI title) ever triggered (flow 13).

**Ready for Step 2.**
