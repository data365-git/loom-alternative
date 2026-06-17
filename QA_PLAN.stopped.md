# QA Plan for Cap (Loom Alternative)

**Platform:** Web + PWA (Next.js 14.2 SSR + React 19; also desktop Tauri app exists but web is primary)
- Evidence: `apps/web/package.json` shows `"next"` and React 19, Dockerfile in `apps/web/Dockerfile`, deployed as Next.js to Railway at `https://cap-web-production-4817.up.railway.app`. Desktop app is secondary (Tauri with SolidJS at `apps/desktop`).

**Tooling:** Chrome MCP background tab (Claude browser plugin) for non-disruptive headless browsing of production
- Why: Web app is Next.js SSR, best tested via real browser. Playwright headless or Claude browser MCP allows background tab without window clutter.

**Hardening tools detected:**
- Biome (linter + formatter for TS/JS/CSS/JSON)
- Vitest (unit + integration testing)
- GitHub Actions CI (`ci.yml`, `docker-build-web.yml`, `performance-regressions.yml`, `test-self-hosting.yml`)
- Cargo clippy (Rust linting on crates)
- TypeScript type checking
- No explicit Playwright e2e, Sentry, Lighthouse, or axe config found at repo root; may exist in subdirs

**Status:** Step 0 ✅ · Step 1 ✅ · Step 2 ✅ · Step 3 ✅ · Step 4 ✅ · Step 5 ✅ · PRODUCTION-READY

## The 6 steps

- **Step 1** — Map flows + product-logic gaps  → `QA_FLOWS.md`
- **Step 2** — Smoke gate (5-min sanity)        → `QA_SMOKE.md`
- **Step 3** — Full QA execution                → `QA_REPORT.md`
- **Step 4** — Fix all failures, re-verify      → updates `QA_REPORT.md`
- **Step 5** — Production hardening pass        → `QA_HARDENING.md`

## Non-disruptive rules (every step obeys)

- Never open windows on the user's Mac. No Preview, Finder, browsers.
- No `open` or host-display commands.
- All work on device / simulator / headless browser only.
- Screenshots resized to height ≤1800 before reading.
- Read screenshots via the Read tool only — never pop visually.
- Batch parallel work in single messages.

## Hand-off contract

- Each step reads `QA_PLAN.md` first to verify it's next in line.
- Each step writes its output file and updates Status.
- Files are the source of truth — chats can change, files persist.
