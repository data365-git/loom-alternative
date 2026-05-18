# CLAUDE.md

This file provides comprehensive guidance to Claude Code when working with code in this repository.

## Pre-Generation Invariants (read BEFORE writing any code)

These rules are enforced by CI (`cargo clippy -D warnings`, Biome). Fixing violations after the fact is wasted effort — emit code in the correct shape the FIRST time. Every CI failure tied to a rule below means this section was not respected.

### Zero-tolerance rules
- **Default to no code comments. Add a comment only after solving a bug or working through a complex issue, and only when it captures non-obvious context that a future investigator or reviewer genuinely needs.** Good cases: why a fix looks the way it does, the upstream/platform bug being worked around, a non-obvious invariant or trade-off chosen after investigation, a link to the PR/issue that explains the decision. Bad cases that remain banned: narrating what the code does, restating types, JSDoc that paraphrases parameter names, "TODO: refactor" or "this should be cleaner" notes, and any comment explaining the change you are currently making. When in doubt, prefer better naming/types over a comment. Applies to every language: Rust, TS, JS, Python, shell, SQL, TOML, etc.
- **Never edit generated files**: `**/tauri.ts`, `**/queries.ts`, `apps/desktop/src-tauri/gen/**`, `packages/ui-solid/src/auto-imports.d.ts`.
- **Never start additional dev servers** (`pnpm dev`, `pnpm dev:web`, `pnpm dev:desktop`, Docker). Assume the developer has them running.

### Post-edit gates (required before declaring any task complete)
These match CI. `cargo check` / `tsc` alone are NOT substitutes.

- Rust edits → `cargo fmt --all` **and** `cargo clippy -p <crate> --all-targets -- -D warnings` (use `--workspace` for multi-crate changes).
- TS / JS / JSON / CSS / MD edits → `pnpm format` **and** `pnpm lint`. For type changes also `pnpm typecheck`.
- DB schema edits → `pnpm db:generate` before relying on it.

### Rust — write the clippy-clean form the FIRST time
All patterns below are `deny` in the workspace `[workspace.lints]` in `Cargo.toml`. Do not emit the left column; emit the right column.

| ❌ Don't write | ✅ Write instead | Lint |
|---|---|---|
| `dbg!(x)` | `tracing::debug!(?x)` (or delete) | `dbg_macro` |
| `let _ = async_fn();` | `async_fn().await;` or `tokio::spawn(async_fn());` | `let_underscore_future` |
| `a - b` for `Duration`/`Instant` | `a.saturating_sub(b)` | `unchecked_time_subtraction` |
| `if a { if b { … } }` | `if a && b { … }` | `collapsible_if` |
| `x.clone()` when `x: Copy` | `x` | `clone_on_copy` |
| `iter.map(\|x\| foo(x))` | `iter.map(foo)` | `redundant_closure` |
| `fn f(v: &Vec<T>)` / `fn f(s: &String)` | `fn f(v: &[T])` / `fn f(s: &str)` | `ptr_arg` |
| `v.len() == 0` / `v.len() > 0` | `v.is_empty()` / `!v.is_empty()` | `len_zero` |
| `let _ = unit_returning();` | `unit_returning();` | `let_unit_value` |
| `opt.unwrap_or_else(\|\| 42)` (cheap default) | `opt.unwrap_or(42)` | `unnecessary_lazy_evaluations` |
| `for i in 0..v.len() { v[i] … }` | `for item in &v { … }` or `.iter().enumerate()` | `needless_range_loop` |
| `value.min(max).max(min)` | `value.clamp(min, max)` | `manual_clamp` |

`unused_must_use = "deny"` also applies: every `Result`, `Option`, `#[must_use]` value must be explicitly handled. `let _ = …;` is only valid for `Result`-returning calls you consciously discard (e.g. `let _ = tx.send(msg);`); it is NOT valid for unit-returning calls — see `let_unit_value`.

### TypeScript / JavaScript — write the Biome-clean form the FIRST time
`biome.json` at the repo root is the source of truth. When generating TS/JS/JSON/CSS:

- **Indent: tab.** Not two spaces, not four spaces.
- **Quotes: double.** `"foo"`, never `'foo'`, in JS/TS.
- **`organizeImports: on`** — group/sort imports naturally and drop unused ones.
- **Recommended lint ruleset on**, with only `suspicious.noShadowRestrictedNames` disabled. Unused vars, `noExplicitAny`, dead code, etc. are all enforced.
- Desktop (`apps/desktop/**`) has a11y rules off; everywhere else they apply.
- CSS overrides: `noUnknownAtRules`, `noUnknownTypeSelector`, `noDescendingSpecificity` off for `**/*.css`.
- Avoid `any`. Use `unknown` + narrowing, or existing shared types from `@cap/utils`, `@cap/web-domain`, generated bindings, etc.
- Do not introduce `@ts-expect-error` / `@ts-ignore` / `// biome-ignore` without a real reason. Prefer fixing the underlying type or pattern.

## Project Overview

Cap is the open source alternative to Loom. It's a Turborepo monorepo with a Tauri v2 desktop app (Rust + SolidStart) and a Next.js web app. The Next.js app at `apps/web` is the main web application for sharing and management; the desktop app at `apps/desktop` is the cross‑platform recorder/editor (macOS and Windows).

### Product Context
- **Core Purpose**: Screen recording with instant sharing capabilities
- **Target Users**: Content creators, developers, product managers, support teams
- **Key Features**: Instant recording, studio mode, AI-generated captions, collaborative comments
- **Business Model**: Freemium SaaS with usage-based pricing

## File Location Patterns & Key Directories

### Core Applications
- `apps/web/` — Next.js web application (sharing, management, dashboard)
- `apps/desktop/` — Tauri desktop app (recording, editing)
- `apps/discord-bot/` — Discord integration bot
- `apps/storybook/` — UI component documentation

### Shared Packages
- `packages/database/` — Drizzle ORM, auth, email templates
- `packages/ui/` — React components for web app
- `packages/ui-solid/` — SolidJS components for desktop
- `packages/utils/` — Shared utilities, types, constants
- `packages/env/` — Environment variable validation
- `packages/web-*` — Effect-based web API layers

### Rust Crates
- `crates/media*/` — Video/audio processing pipeline
- `crates/recording/` — Core recording functionality
- `crates/rendering/` — Video rendering and effects
- `crates/camera*/` — Cross-platform camera handling
- `crates/scap-*/` — Screen capture implementations

### Important File Patterns
- `**/tauri.ts` — Auto-generated IPC bindings (DO NOT EDIT)
- `**/queries.ts` — Auto-generated query bindings (DO NOT EDIT)
- `apps/web/actions/**/*.ts` — Server Actions ("use server")
- `packages/database/schema.ts` — Database schema definitions
- `*.config.*` — Configuration files (Next.js, Tailwind, etc.)

## Key Commands

### Development
```bash
pnpm dev:web             # Start Next.js dev server (apps/web only)
pnpm run dev:desktop     # Start Tauri desktop dev (apps/desktop)
pnpm build               # Build all packages/apps via Turbo
pnpm lint                # Lint with Biome across the repo
pnpm format              # Format with Biome
pnpm typecheck           # TypeScript project references build
```

### Database Operations
```bash
pnpm db:generate         # Generate Drizzle migrations
pnpm db:push             # Push schema changes to MySQL
pnpm db:studio           # Open Drizzle Studio
pnpm --dir packages/database db:check  # Verify database schema
```

### App-Specific Commands
```bash
# Web app (apps/web)
cd apps/web && pnpm dev          # Start Next.js dev server

# Desktop (apps/desktop)
cd apps/desktop && pnpm dev      # Start SolidStart + Tauri dev
pnpm tauri:build                 # Build desktop app (release)
```

## Production Deployment (Railway)

- **Fork**: `data365-git/loom-alternative` (forked from `CapSoftware/Cap`)
- **Railway project**: `data365-cap`
- **Production URL**: https://cap-web-production-4817.up.railway.app
- **Auto-deploy**: every push to `main` on `data365-git/loom-alternative` triggers a Railway build (~3–5 min to live)
- **Branding**: internally branded as "data365" (layout.tsx title, metadata, OG tags)

### Railway services

| Service | Type | Notes |
|---------|------|-------|
| `cap-web` | GitHub → Dockerfile (`apps/web/Dockerfile`) | Listens on `$PORT=8080`; domain targets port 8080 |
| `MySQL` | `mysql:8` image | Volume-backed; `MYSQL_ROOT_PASSWORD` baked in at first init — changing after init requires volume reset |
| `minio` | `minio/minio` image | S3-compatible storage; use `minio/minio`, NOT `bitnami/minio` |
| `media-server` | `ghcr.io/capsoftware/cap-media-server:latest` | Prebuilt image; do NOT build from source (Rust workspace issue) |

### Deployment gotchas
- **Env vars**: always use `variableCollectionUpsert` with `skipDeploys: true` to batch-set vars, then trigger one deploy. Setting vars one-by-one triggers a build per var (deploy storm).
- **After deploy**: `curl -sL <url>` to verify — a SUCCESS status with HTTP 502 means the app crashed on startup; check runtime logs (not build logs).
- **MySQL password**: baked in at first container init. Overriding `MYSQL_ROOT_PASSWORD` after the volume is populated does nothing; must delete the volume and redeploy (data loss).

---

## Development Environment Guidelines

### Server Management
- Do not start additional development servers or localhost services unless explicitly asked. Assume the developer already has the environment running and focus on code changes.
- Prefer `pnpm dev:web` or `pnpm run dev:desktop` when you only need one app. Avoid starting multiple overlapping servers.
- Avoid running Docker or external services yourself unless requested; root workflows handle them as needed.
- **Database**: MySQL via Docker Compose; schema managed through Drizzle migrations
- **Storage**: S3-compatible (AWS, Cloudflare R2, etc.) for video/audio files

### Auto-generated Bindings (Desktop)
- **NEVER EDIT**: `tauri.ts`, `queries.ts` (auto-generated on app load)
- **NEVER EDIT**: Files under `apps/desktop/src-tauri/gen/`
- **Icons**: Auto-imported in desktop app; do not import manually
- **Regeneration**: These files update automatically when Rust types change

### Common Development Pain Points
- **Node Version**: Must use Node 20 (specified in package.json engines)
- **PNPM Version**: Locked to 10.5.2 for consistency
- **Turbo Cache**: May need clearing if builds behave unexpectedly (`rm -rf .turbo`)
- **Database Migrations**: Always run `pnpm db:generate` before `pnpm db:push`
- **Desktop Icons**: Use `unplugin-icons` auto-import instead of manual imports

## Architecture Overview

### Monorepo Structure
- `apps/web` — Next.js 14 (App Router) web application
- `apps/desktop` — Tauri v2 desktop app with SolidStart (SolidJS)
- `packages/database` — Drizzle ORM (MySQL) + auth utilities
- `packages/ui` — React UI components for the web
- `packages/ui-solid` — SolidJS UI components for desktop
- `packages/utils` — Shared utilities and types
- `packages/env` — Zod-validated build/server env modules
- `crates/*` — Rust crates for media, rendering, recording, camera, etc.

### Technology Stack
- **Package Manager**: pnpm (`pnpm@10.5.2`)
- **Build System**: Turborepo
- **Frontend (Web)**: React 19 + Next.js 14.2.x (App Router)
- **Desktop**: Tauri v2, Rust 2024, SolidStart
- **Styling**: Tailwind CSS (web consumes `@cap/ui/tailwind`)
- **Server State**: TanStack Query v5 on web; `@tanstack/solid-query` on desktop
- **Database**: MySQL (PlanetScale) with Drizzle ORM
- **AI Integration**: Groq preferred, OpenAI fallback; invoked in Next.js Server Actions
- **Analytics**: PostHog
- **Payments**: Stripe

### Critical Architectural Decisions
1. **AI on the Server**: All Groq/OpenAI calls execute in Server Actions under `apps/web/actions`. Never call AI from client components.
2. **Authentication**: NextAuth with a custom Drizzle adapter. Session handling via NextAuth cookies; API keys are supported for certain endpoints.
3. **API Surface**: Prefer Server Actions. When routes are necessary, implement under `app/api/*` (Hono-based utilities present), set proper CORS, and revalidate precisely.
4. **Desktop IPC**: Use `tauri_specta` for strongly typed commands/events; do not modify generated bindings.

#### Desktop event pattern
Rust (emit):
```rust
use specta::Type;
use tauri_specta::Event;

#[derive(Serialize, Type, tauri_specta::Event, Debug, Clone)]
pub struct UploadProgress {
    progress: f64,
    message: String,
}

UploadProgress { progress: 0.0, message: "Starting upload...".to_string() }
    .emit(&app)
    .ok();
```

Frontend (listen; generated bindings):
```ts
import { events } from "./tauri"; // auto-generated
await events.uploadProgress.listen((event) => {
  // update UI with event.payload
});
```

## Development Workflow & Best Practices

### Code Organization Principles
1. **Follow Local Patterns**: Study neighboring files and shared packages first
2. **Database Changes**: Always `pnpm db:generate` → `pnpm db:push` → test
3. **Strict Typing**: Use existing types; validate config via `@cap/env`
4. **Component Consistency**: Use `@cap/ui` (React) or `@cap/ui-solid` (Solid)
5. **No Manual Edits**: Never touch auto-generated bindings or schemas

### Key Implementation Patterns

#### Server Actions (Web App)
```typescript
"use server";

import { db } from "@cap/database";
import { getCurrentUser } from "@cap/database/auth/session";

export async function updateVideo(data: FormData) {
  const user = await getCurrentUser();
  if (!user?.id) throw new Error("Unauthorized");

  // Database operations with Drizzle
  return await db().update(videos).set({ ... }).where(eq(videos.id, id));
}
```

#### Desktop IPC Commands
```rust
// Rust side - emit events
UploadProgress { progress: 0.5, message: "Uploading...".to_string() }
  .emit(&app)
  .ok();
```

```typescript
// Frontend side - listen to events (auto-generated)
import { events, commands } from "./tauri";

// Call commands
await commands.startRecording({ ... });

// Listen to events
await events.uploadProgress.listen((event) => {
  setProgress(event.payload.progress);
});
```

#### React Query Patterns
```typescript
// Queries with Server Actions
const { data, isLoading } = useQuery({
  queryKey: ["videos", userId],
  queryFn: () => getUserVideos(),
  staleTime: 5 * 60 * 1000,
});

// Mutations with cache updates
const updateMutation = useMutation({
  mutationFn: updateVideo,
  onSuccess: (updated) => {
    queryClient.setQueryData(["video", updated.id], updated);
  },
});
```

## Environment Variables

### Build/Client (selected)
- `NEXT_PUBLIC_WEB_URL`
- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_DOCKER_BUILD` (enables Next.js standalone output)

### Server (selected)
- Core: `DATABASE_URL`, `WEB_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- S3: `CAP_AWS_BUCKET`, `CAP_AWS_REGION`, `CAP_AWS_ACCESS_KEY`, `CAP_AWS_SECRET_KEY`, optional `CAP_AWS_ENDPOINT`, `CAP_AWS_BUCKET_URL`
- AI: `GROQ_API_KEY`, `OPENAI_API_KEY`
- Email/Analytics: `RESEND_API_KEY`, `RESEND_FROM_DOMAIN`, `POSTHOG_PERSONAL_API_KEY`, `DUB_API_KEY`, `DEEPGRAM_API_KEY`
- OAuth: `GOOGLE_CLIENT_ID/SECRET`, `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`
- Stripe: `STRIPE_SECRET_KEY_TEST`, `STRIPE_SECRET_KEY_LIVE`, `STRIPE_WEBHOOK_SECRET`
- CDN signing: `CLOUDFRONT_KEYPAIR_ID`, `CLOUDFRONT_KEYPAIR_PRIVATE_KEY`
- Optional S3 endpoints: `S3_PUBLIC_ENDPOINT`, `S3_INTERNAL_ENDPOINT`

## Testing & Build Optimization

### Testing Strategy
- **Package-Specific**: Check each `package.json` for test commands
- **Web App**: Uses Vitest for utilities, no comprehensive frontend tests yet
- **Desktop**: Vitest for SolidJS components in some packages
- **Tasks Service**: Jest for API endpoint testing
- **Rust**: Standard Cargo test framework for crates

### Build Performance
- **Turborepo Caching**: Aggressive caching across all packages
- **Cache Invalidation**: Prefer targeted `--filter` over global rebuilds
- **Docker Builds**: `NEXT_PUBLIC_DOCKER_BUILD=true` enables standalone output
- **Development**: Incremental builds via TypeScript project references

### Performance Monitoring
- **Bundle Analysis**: Check Next.js bundle size regularly
- **Database Queries**: Monitor with Drizzle Studio
- **S3 Operations**: Watch for excessive uploads/downloads
- **Desktop Memory**: Rust crates handle heavy media processing

## Troubleshooting Common Issues

### Build Failures
- **"Cannot find module"**: Check workspace dependencies in package.json
- **TypeScript errors**: Run `pnpm typecheck` to see project-wide issues
- **Turbo cache issues**: Clear with `rm -rf .turbo`
- **Node version mismatch**: Ensure Node 20 is active

### Database Issues
- **Migration failures**: Check `packages/database/migrations/meta/`
- **Connection errors**: Verify Docker containers are running
- **Schema drift**: Run `pnpm --dir packages/database db:check`

### Desktop App Issues
- **IPC binding errors**: Restart dev server to regenerate `tauri.ts`
- **Rust compile errors**: Check Cargo.toml dependencies
- **Permission issues**: macOS/Windows may require app permissions
- **Recording failures**: Verify screen capture permissions

### Web App Issues
- **Auth failures**: Check NextAuth configuration and database
- **S3 upload errors**: Verify AWS credentials and bucket policies
- **Server Action errors**: Check network tab for detailed error messages
- **Hot reload issues**: Restart Next.js dev server

## React/Next.js Coding Standards

### Data Fetching & Server State
- Use TanStack Query v5 for all client-side server state and fetching.
- Use Server Components for initial data when possible; pass `initialData` to client components and let React Query take over.
- Mutations should call Server Actions directly and perform precise cache updates (`setQueryData`/`setQueriesData`) rather than broad invalidations.

Basic query pattern:
```tsx
import { useQuery } from "@tanstack/react-query";

function Example() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["items"],
    queryFn: fetchItems,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState onRetry={() => { /* refetch */ }} />;
  return <List items={data} />;
}
```

Server Action mutation with targeted cache updates:
```tsx
"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateItem } from "@/actions/items"; // 'use server'

function useUpdateItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateItem,
    onSuccess: (updated) => {
      qc.setQueriesData({ queryKey: ["items"] }, (old: any[] | undefined) =>
        old?.map((it) => (it.id === updated.id ? { ...it, ...updated } : it))
      );
      qc.setQueryData(["item", updated.id], updated);
    },
  });
}
```

Minimize `useEffect` usage: compute during render, handle logic in event handlers, and ensure cleanups for any subscriptions/timers.

### Next.js App Router
- Prefer Server Components for SEO/initial rendering; hydrate interactivity in client components.
- Co-locate feature components, keep components focused, and use Suspense boundaries for long fetches.

### UI/UX Guidelines
- Styling: Tailwind CSS only; stay consistent with spacing and tokens.
- Loading: Use static skeletons that mirror content; no bouncing animations.
- Performance: Memoize expensive work; code-split naturally; use Next/Image for remote assets.

## Effect Patterns

### Managed Runtimes
- `apps/web/lib/server.ts` builds a `ManagedRuntime` from `Layer.mergeAll` so database, S3, policy, and tracing services are available to every request. Always run server-side effects through `EffectRuntime.runPromise`/`runPromiseExit` from this module so cookie-derived context and `VideoPasswordAttachment` are attached automatically.
- `apps/web/lib/EffectRuntime.ts` exposes a browser runtime that merges the RPC client and tracing layers. Client code should lean on `useEffectQuery`, `useEffectMutation`, and `useRpcClient`; never call `ManagedRuntime.make` yourself inside components.

### API Route Construction
- Next.js API folders under `apps/web/app/api/*` wrap Effect handlers with `@effect/platform`'s `HttpApi`/`HttpApiBuilder`. Follow the existing pattern: declare a contract class via `HttpApi.make`, configure groups/endpoints with `Schema`, and only export the `handler` returned by `apiToHandler(ApiLive)`.
- Inside `HttpApiBuilder.group` blocks, acquire services (e.g., `Videos`, `S3Buckets`) with `yield*` inside `Effect.gen`. Provide layers using `Layer.provide` rather than manual `provideService` calls so dependencies stay declarative.
- Map domain-level errors to transport errors with `HttpApiError.*`. Keep error translation exhaustive (`Effect.catchTags`, `Effect.tapErrorCause(Effect.logError)`) to preserve observability.
- Use `HttpAuthMiddleware` for required auth and `provideOptionalAuth` when guests are allowed. The middleware/utility already hydrate `CurrentUser`, so avoid duplicating session lookups in route handlers.
- Shared HTTP contracts that power the desktop app live in `packages/web-api-contract-effect`; update them alongside route changes to keep schemas in sync.

### Server Components & Effects
- Server components that need Effect services should call `EffectRuntime.runPromise(effect.pipe(provideOptionalAuth))`. This keeps request cookies, tracing spans, and optional auth consistent with the API layer.
- Prefer lifting Drizzle queries or other async work into `Effect.gen` blocks and reusing domain services (`Videos`, `VideosPolicy`, etc.) rather than writing ad-hoc logic.

### Client Integration
- React Query hooks should wrap Effect workflows with `useEffectQuery`/`useEffectMutation` from `apps/web/lib/EffectRuntime.ts`; these helpers surface Fail/Die causes consistently and plug into tracing/span metadata.
- When a mutation or query needs the RPC transport, resolve it through `useRpcClient()` and invoke the strongly-typed procedures exposed by `packages/web-domain` instead of reaching into fetch directly.

## Desktop (Solid + Tauri) Patterns
- Data fetching: `@tanstack/solid-query` for server state.
- IPC: Call generated `commands` and `events` from `tauri_specta`. Listen directly to generated events and prefer the typed interfaces.
- Windowing/permissions are handled in Rust; keep UI logic in Solid and avoid mixing IPC with rendering logic.

## Conventions
- Directory naming: lower-case-dashed.
- Components: PascalCase; hooks: camelCase starting with `use`; Rust modules snake_case; crates kebab-case.
- Biome formats and lints TS/JS/JSON/CSS (tab indent, double quotes, organizeImports). rustfmt + the workspace clippy lints handle Rust.

The comments policy, the denied clippy patterns, and the Biome style invariants all live in **Pre-Generation Invariants** at the top of this file — that section is authoritative.

## Rust Clippy Rules (Workspace Lints)

See the **Pre-Generation Invariants** section at the top of this file — it is the single source of truth for the denied workspace lints (`[workspace.lints]` in `Cargo.toml`) and the clippy-clean forms to emit. Keeping only one copy avoids the two lists drifting apart.

## Security & Privacy Considerations

### Data Handling
- **Video Storage**: S3-compatible storage with signed URLs
- **Database**: MySQL with connection pooling via PlanetScale
- **Authentication**: NextAuth with custom Drizzle adapter
- **API Security**: CORS policies, rate limiting via Hono middleware

### Privacy Controls
- **Recording Permissions**: Platform-specific (macOS Screen Recording, Windows)
- **Data Retention**: User-controlled deletion of recordings
- **Sharing Controls**: Password protection, expiry dates on shared links
- **Analytics**: PostHog with privacy-focused configuration

## AI & Processing Pipeline

### AI Integration Points
- **Transcription**: Deepgram API for captions generation
- **Metadata Generation**: Groq (primary) + OpenAI (fallback) for titles/descriptions
- **Processing Location**: All AI calls in Next.js Server Actions only
- **Privacy**: Transcripts stored in database, audio sent to external APIs

### Media Processing Flow
```
Desktop Recording → Local Files → Upload to S3 →
Background Processing (tasks service) →
Transcription/AI Enhancement → Database Storage
```

## References & Documentation

### Core Technologies
- **TanStack Query**: https://tanstack.com/query/latest
- **React Patterns**: https://react.dev/learn/you-might-not-need-an-effect
- **Tauri v2**: https://github.com/tauri-apps/tauri
- **tauri_specta**: https://github.com/oscartbeaumont/tauri-specta
- **Drizzle ORM**: https://orm.drizzle.team/
- **SolidJS**: https://solidjs.com/

### Cap-Specific
- **Self-hosting**: https://cap.so/docs/self-hosting
- **API Documentation**: Generated from TypeScript contracts
- **Architecture Decisions**: See individual package READMEs

### Development Resources
- **Monorepo Guide**: Turborepo documentation
- **Effect System**: Used in web-backend packages
- **Media Processing**: FFmpeg documentation for Rust bindings

## Code Formatting & Lint Gates

Before declaring any task complete, run the appropriate gate for every file type that was touched. These are the same gates CI runs; skipping them will push broken work.

- **Rust**: `cargo fmt --all` **and** `cargo clippy -p <crate> --all-targets -- -D warnings` (`--workspace` for multi-crate changes). `cargo check` does NOT run the denied clippy lints and is not a substitute.
- **TypeScript / JavaScript / JSON / CSS / MD**: `pnpm format` **and** `pnpm lint`. If types changed, also `pnpm typecheck`.
- If a gate fails, fix the violation in the source code (see the "write X instead of Y" tables in **Pre-Generation Invariants** at the top of this file). Do not paper over clippy/Biome failures with `#[allow(...)]`, `// biome-ignore`, or `any` unless explicitly approved.

---

## Template Propagation

This file (`~/secondbrain/CLAUDE-md template.md`) is the **master template**. After any edit to it:
- **Existing projects** — update the Rules section in every CLAUDE.md under `~/secondbrain`, preserving each project's sections 1–7.
- **New projects** — if a subfolder under `~/secondbrain` has code but no CLAUDE.md, create one by reading the project and filling in sections 1–7, then appending the full Rules section from this template.

Do both automatically, in parallel, without being asked.

---

## Keeping This File Current

Update CLAUDE.md when something **structurally meaningful** changes:
- New feature area or major dependency added
- Folder structure or naming convention changed
- New required environment variable
- Deployment process changed

**Do NOT update for:** bug fixes, style changes, copy tweaks, or anything that wouldn't matter to someone reading the project for the first time.

---

## Working in Parallel

**Default to parallel for ALL coding and planning work.** Before starting any multi-step task, decompose it into independent units and spawn one subagent per unit — fire ALL Task tool calls in a **single message** so they run simultaneously. Never serialize work that can run in parallel.

Sequential execution is only allowed when one task genuinely depends on another's output (e.g. step 2 needs the file step 1 created). For everything else — multi-file edits, multi-project changes, exploration + implementation, doc updates across files — parallelize.

Rule of thumb: if you catch yourself running tasks one after another, stop and ask "could these have run at the same time?" If yes, that's the wrong default.

---

## Pre-Push Sync Check (MANDATORY — runs BEFORE any commit/push/deploy)

<!-- Fill in team size. If solo project, remove this section. -->

Multiple developers may push to `main` between sessions. Local can fall behind silently. Claude must always sync with origin BEFORE any commit/push/deploy workflow — otherwise local work overwrites teammates' commits or push gets rejected and Claude force-resolves it the wrong way.

### Sequence (run in order, always)

**1. Refresh remote refs without merging:**
```bash
git fetch origin --prune
```

**2. Check if local is behind origin:**
```bash
git log HEAD..origin/main --oneline
git diff HEAD origin/main --stat
```

**3. If step 2 prints NOTHING** → local is current. Proceed to push.

**4. If step 2 prints any commits** → STOP. Do this:
- Print the commit list to the user verbatim ("origin/main has these N new commits from teammates: …").
- If there are uncommitted local changes:
  - Move them to a feature branch first: `git checkout -b sync-<timestamp>`, then `git add <specific files>`, then `git commit -m "WIP"`. **NEVER `git add -A`.**
- Rebase local onto origin/main:
  ```bash
  git pull --rebase origin main
  ```
- If rebase succeeds clean → proceed to push.
- If rebase produces conflicts → **STOP.** List each conflicted file. Ask the user how to resolve. **NEVER auto-pick "ours" or "theirs" without explicit instruction.**

**5. After conflict resolution**, verify the merged tree compiles before pushing:
```bash
npm run build   # or equivalent for this project
```

### Hard rules

- **NEVER `git push --force` or `--force-with-lease` to `main`/`master`.** If push is rejected, re-fetch and re-rebase — never force.
- **NEVER `git reset --hard origin/main` while uncommitted changes exist.** That deletes the user's work.
- **NEVER `git checkout .` or `git restore .`** to "clean up" — same risk.
- **NEVER rebase or merge silently when conflicts exist.** Resolution requires the user's input.
- **When in doubt, stop and ask.** A 30-second clarification beats a force-push that loses an hour of someone else's work.

### When this runs

- **Triggers on:** `deploy`, `push`, `merge to main`, `ship`, `git-shipper` agent invocation, `deployer` agent invocation, any prompt mentioning push-to-production.
- **Skipped only when:** the user explicitly says "skip sync check" or "just push, I already pulled".

---

## Model & Impact Routing

Before executing, declare in **one line** at the top of your reply:
> 🤖 `<haiku|sonnet|opus>` · 🎯 `<🟢low | 🟡med | 🔴high>` · ⚙️ `<one-line reason>`

**Model selection (cheapest tier that fits):**

| Use | For |
|-----|-----|
| **haiku** | Reads, greps, status checks, deploys, git workflows, env edits, find/replace, "continue"/"go" signals |
| **sonnet** | Code generation, debugging, multi-file features, refactors, plan decomposition |
| **opus** | Cross-system architecture, novel design, security-critical tradeoffs (rare) |

Rule: when unsure, use the cheaper tier. Escalate only if it struggles.

**Impact level (state blast radius for 🔴):**

| Tag | Means | Examples |
|-----|-------|----------|
| 🟢 low | Read-only / trivially undone | Read, Grep, status, Q&A |
| 🟡 med | Single-file / local config | Bug fix, doc edit, env var |
| 🔴 high | Multi-file / prod / irreversible | Deploy, merge to main, delete, secret rotation, 3+ files |

For 🔴 tasks: **list affected files/services before acting.**

---

## Expert Mode

Every task has a domain. Before responding, identify it — then think and respond as the most senior practitioner in that domain would. Do not mention this process, just embody it.

**What this means in practice:**
- Use the real frameworks and vocabulary of that domain, not generic assistant language
- Apply the quality bar of someone who has done this at the highest level — ask "would a principal-level practitioner sign off on this?"
- Ask the ONE question a real expert would ask before diving in (not five — one)
- Push back the way they would: directly, briefly, with a better direction
- If a task spans multiple domains, split your thinking per domain — don't blend into mush

**Domain-specific instincts to always apply:**

| Domain | What a world-class practitioner actually does differently |
|--------|----------------------------------------------------------|
| **Design / UX** | Solves confusion before beauty. Asks "what decision does the user need to make here?" Catches hierarchy and flow problems before pixel details. |
| **Product** | Ties every feature to a user problem and a measurable outcome. Rejects solutions without a clear success metric. |
| **Engineering** | Thinks failure modes, rollback, and observability — not just "does it work." Flags scale and maintenance cost upfront. |
| **DevOps / Infra** | Asks about blast radius before touching prod. Never ships without a health check and a rollback plan. |
| **Marketing / Growth** | Anchors every decision to conversion or retention. Challenges vanity metrics. |
| **Strategy / Leadership** | Thinks in systems and second-order effects, not just immediate outputs. |

For any domain not listed above: find the equivalent senior practitioner instinct and apply it.

---

## Multi-Language / i18n Rule

If the project has more than one interface language (check for `/locales`, `/i18n`, `/translations`, `i18next`, `next-intl`, or any `*.json` / `*.po` translation files):

**Every UI string change touches ALL languages — no exceptions.**

- When adding a new label, button, error, tooltip, or any user-facing text → add it to **every** locale file in the same commit
- When editing an existing string → update the matching key in **every** locale
- When deleting a string → remove it from **every** locale
- The current/default interface language (usually `en` or whatever is configured as `defaultLocale`) is where you write the source-of-truth copy first — then translate to all others
- For translations, write them properly in each target language — not English placeholders. Use the actual translated text, even if rough; mark uncertain ones with a `// TRANSLATE` comment so the user can refine

**Never leave a key missing in one locale.** That causes the UI to fall back to the key name (`"common.submit"`) or break entirely.

If unsure which languages the project supports, list the locale files first and confirm with the user before adding strings.

---

## Behavioral Guidelines

These rules reduce common LLM coding mistakes. They bias toward caution — use judgment on trivial tasks.

### 1. Think Before Coding

**Don't assume. Surface tradeoffs. Ask when unclear.**

- State your assumptions explicitly before implementing.
- If multiple interpretations exist, name them — don't pick silently.
- If a simpler approach exists, say so and push back.
- If something is genuinely unclear, stop and ask. Don't guess.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "extensibility" that wasn't requested.
- No error handling for scenarios that can't happen.
- If you wrote 200 lines and it could be 50, rewrite it.

> Ask: "Would a senior engineer call this overcomplicated?" If yes — simplify.

### 3. Surgical Changes

**Touch only what you must.**

When editing existing code:
- Don't improve adjacent code, comments, or formatting unless asked.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you spot unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports, variables, and functions that **your** changes made unused.
- Don't remove pre-existing dead code unless explicitly asked.

> Test: every changed line should trace directly to the user's request.

### 4. Verify Before Reporting Done

**Define success criteria upfront. Loop until verified.**

For multi-step tasks, state a brief plan first:
```
1. [What] → verify: [how to confirm it worked]
2. [What] → verify: [how to confirm it worked]
3. [What] → verify: [how to confirm it worked]
```

Run the check before saying "done." If you can't verify (e.g. needs a browser), say so explicitly and describe what the user should check.

**"Build succeeded" ≠ "app works."** Always hit the actual URL / run the real flow before declaring success. A green CI badge with a 502 in production is still a failure.

### 5. Don't Drift From the Stated Goal

**When the user states an explicit goal — execute that goal. Don't substitute "easier but different."**

If the user says "build a fresh project from scratch" and you see an existing similar project, do NOT silently switch to "use the existing one." That's drift, not pragmatism.

- Re-read the user's words before each major decision branch
- If a shortcut seems compelling, surface it explicitly and ask — don't take it silently
- "Full ownership" / "from scratch" / "rewrite cleanly" are explicit signals — respect them

### 6. Batch Side-Effect Operations

**When N API calls each trigger an expensive side effect (deploy, rebuild, restart), use the batch API or a "skip side-effect" flag — not a for-loop.**

Concrete pattern (Railway): setting 20 env vars one-by-one triggers 20 builds, all but the last get superseded and FAIL. Instead: `variableCollectionUpsert` with `skipDeploys: true`, then ONE manual deploy at the end.

General rule: before writing a loop that calls a mutation, ask "does each call trigger a deploy / rebuild / notification / charge?" If yes, find the batch endpoint or a skip-side-effect flag.

### 7. Read Failure Logs Before Iterating

**One minute reading the actual error beats five minutes guessing.**

When something fails:
1. Get the real log output (build log, runtime log, deployment diagnosis)
2. Quote the exact error in your next response
3. THEN form a hypothesis

Do NOT iterate on "let me try X" without seeing the error from the previous attempt. Each blind iteration wastes time AND user trust.

### 8. Respect User Pause Signals

**When the user says "stop," "wait," "you're slowing down," "let me check" — STOP all action and read carefully.**

The user usually sees a pattern (deploy storm, drift from goal, wrong direction) before you do. Their pause is data, not friction.

After a pause: summarize what happened, diagnose what went wrong, present a clean plan, ask for approval. Do not resume execution until they explicitly say go.

---

**These guidelines are working when:** diffs are clean, rewrites are rare, questions come before implementation — not after, and the user never has to hit the brakes mid-task.

---

## Railway-Specific Gotchas

These are real lessons from production Railway deployments. Apply when working on any Railway project.

### Deployment hygiene
- **NEVER call `variableUpsert` in a loop.** Use `variableCollectionUpsert` with `skipDeploys: true` for all env vars, then trigger ONE deploy at the end. Each `variableUpsert` without `skipDeploys: true` triggers a fresh build — running it 20 times creates a deploy storm where all but the last build get superseded and fail.
- **Always batch then deploy:** set ALL env vars / volumes / service config first, verify by reading back, THEN trigger deploy. Never the other way around.
- **A "FAILED" deploy completed in under 30 seconds** is almost always either (a) superseded by a newer deploy, (b) `service config at '/railway.toml' not found`, or (c) missing GitHub App access. Read logs to disambiguate.

### Image-based services (databases, MinIO, etc.)
- **MySQL `MYSQL_ROOT_PASSWORD` is baked in at FIRST init.** Overriding it after the volume is populated does NOT change the actual MySQL user password. Fix: delete the volume, redeploy, MySQL re-initializes with the current env var. (Lose all data — don't do this on a production DB.)
- **Same applies to Postgres, MongoDB, Redis** — first-init passwords are permanent unless you reset the data volume or run `ALTER USER` manually.
- **`minio/minio` and `bitnami/minio` are NOT drop-in compatible.** Different env var conventions, different start commands, different default paths. Pick one and use its documented config — don't mix.

### GitHub-sourced services
- **`railwayConfigFile: /railway.toml` requires that file to actually exist on the deployed branch.** If `railway.toml` is on `data365-patches` but you deploy `main`, you get `service config at '/railway.toml' not found`. Either (a) put railway.toml on the deployed branch, or (b) clear the `railwayConfigFile` setting and configure via API (`dockerfilePath`, `healthcheckPath`, etc.).
- **Setting `dockerfilePath` via API forces DOCKERFILE builder.** The `Builder` enum in GraphQL doesn't include `DOCKERFILE` — it's auto-detected from `dockerfilePath` being non-null.
- **Don't try to build a Rust workspace member with `rootDirectory: apps/<crate>`.** Cargo workspace members reference sibling crates at the repo root — cutting off the workspace breaks the build. For services you don't customize (e.g. media-server), use a prebuilt image (`ghcr.io/...`) instead.

### Networking
- **Next.js in Docker on Railway listens on `$PORT=8080` by default**, not the `EXPOSE 3000` from your Dockerfile. The Railway PORT env var wins. Set your public domain's `targetPort` to 8080, or override `PORT=3000` in env vars.
- **Internal service-to-service URLs use `${{<service-name>.RAILWAY_PRIVATE_DOMAIN}}`** in env vars. Use lowercase service names exactly as named in the dashboard. These resolve only inside Railway's private network.

### Verification
- **Always `curl -sL <url>` after deploy succeeds.** A SUCCESS status with HTTP 502 means the app crashed on startup — check runtime logs (not build logs) for the real error.
- **Read runtime logs via `deploymentLogs`** (not `buildLogs`) for crashes after the build phase.
