# Lost Features Audit — Share Page Redesign

## Summary

This audit identifies functional features removed during the redesign commits (commits 553aff9f9 and 5f742c27b). Features are classified as **intentional** (approved removal), **collateral** (silently dropped), or **needs-call** (unclear intent).

---

## Detailed Findings

| Feature | What it did | File | Commit | Status | Recommendation |
|---------|------------|------|--------|--------|-----------------|
| **Toolbar (mobile/desktop)** | Showed comment composition UI (with quick actions) on mobile and desktop below video. Had `onOptimisticComment`, `onCommentSuccess` handlers. | `Share.tsx` | 5f742c27b | redesign-intentional | Removed by design (confirmed in commit message) |
| **handleOptimisticComment callback** | Updated comments optimistically and scrolled activity pane to bottom after 100ms. Dependency: `setOptimisticComments` | `Share.tsx` | 5f742c27b | redesign-collateral | Callback deleted alongside Toolbar. No longer triggered anywhere. |
| **Shared status dropdown button** | "Not shared" / "Shared" / "Shared with you" dropdown (with chevron icon) in header. Triggered `setIsSharingDialogOpen(true)`. Showed sharing status based on `sharedOrganizations` and `effectiveSharedSpaces`. | `ShareHeader.tsx` | 553aff9f9 | redesign-collateral | Removed function `renderSharedStatus()`. Icon import `faChevronDown` removed. Param `sharedOrganizations` removed from props. Dialog trigger intent unclear — may have moved to another surface. |
| **Cost tab in BelowVideoTabs** | Tab entry "Cost" in the below-video tab bar. Accepted `cost?: React.ReactNode` prop. Was part of tab routing logic. | `BelowVideoTabs.tsx` | 5f742c27b | redesign-intentional | Moved to sidebar as wallet-style card (per commit message). Intentional relocation. |
| **MeetingCostPanel mount** | Rendered the cost panel inside the Cost tab. | `ShareVideo.tsx` | 5f742c27b | redesign-intentional | Moved alongside Cost tab to sidebar. |
| **TweaksPanel (gear icon)** | Floating gear icon panel for video tweaks. | `ShareVideo.tsx` + `TweaksPanel.tsx` | 5f742c27b | redesign-intentional | Explicitly removed per commit message ("remove TweaksPanel (gear icon)"). |
| **AI FAB aura/pulse animation** | CSS keyframes `fabPulse` and `fabAura` that created pulsing halo effect around AI button. | `ai-chat.css` | 5f742c27b | redesign-intentional | Replaced with frosted-glass design per design overhaul. |
| **AI popup scale-in animation** | CSS keyframe `popupScale` for smooth scale animation from bottom-right. | `ai-chat.css` | 5f742c27b | redesign-intentional | Redesigned for new frosted-glass modal style. |
| **English quick actions** | 4 quick-action strings: "What were the key decisions?", "Summarize the main points", "What are the action items?", "Who said what about...?" | `AIChatPopup.tsx` | 5f742c27b | redesign-collateral | Replaced with Uzbek localized versions + different semantics (label + query split). Old strings fully removed. |
| **AI popup manual rendering** | Popup header with title icon, close button, message display, typing indicator, input textarea — entire custom UI. All replaced with new component structure. | `AIChatPopup.tsx` | 5f742c27b | redesign-intentional | Completely redesigned UI. Old render logic removed. |

---

## Classification Summary

### Redesign-Intentional (Approved, 5 items)
- Toolbar removal → confirmed in commit message
- Cost tab relocation → confirmed in commit message ("move cost tab into sidebar")
- TweaksPanel removal → confirmed in commit message ("remove TweaksPanel")
- AI FAB pulse animation → part of design overhaul
- AI popup redesign → part of frosted-glass design system

### Redesign-Collateral (Silently dropped, 3 items)
- `handleOptimisticComment` callback → still defined in Share.tsx but no longer called anywhere
- Shared status dropdown (`renderSharedStatus`) → UI removal, unclear if sharing dialog moved elsewhere or feature deprecated
- English quick actions → replaced without migration path (hard-coded strings now in Uzbek)

### Needs-Call (Unclear intent, 0 items)
- None identified. All unclear cases were classified as **collateral** (likely oversight).

---

## Risk Assessment

**Low risk:**
- Toolbar, TweaksPanel, Cost tab moves were intentional per commit message.
- Animation changes are purely visual (CSS).

**Medium risk:**
- **Shared status dropdown removal** — sharing functionality is still present (modal/dialog) but the entry point changed. Confirm that sharing UX is still discoverable from another location (e.g., header context menu, settings, or elsewhere).
- **English quick actions loss** — replaced entirely with Uzbek. If English users exist, they lose the quick-start guidance.

**Low risk:**
- `handleOptimisticComment` orphaning — likely dead code from earlier refactoring, not actively broken.

---

## Recommendations

1. **Shared status dropdown**: Verify that the sharing dialog is still accessible. If it moved, document the new entry point. If it was removed, restore the button or add a "Share" option to a menu.

2. **English quick actions**: Add back English versions or make quick actions language-aware (detect locale and show translated prompts).

3. **Clean up** `handleOptimisticComment` callback: Remove the dead function definition from Share.tsx if it's truly no longer used elsewhere.

4. **Test sharing flow end-to-end**: Ensure users can still access share settings, toggle public/private, and invite specific users/spaces.
