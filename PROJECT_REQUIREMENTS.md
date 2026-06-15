# Project Requirements — Cap (data365 internal fork)

> Source of truth for what this app IS. Update on real changes, not bug fixes.
> Last updated: 01-06-2026

---

## 1. Summary

Cap is an open-source Loom alternative for screen recording, instant sharing, async video collaboration, and AI-generated transcripts/summaries. This is data365's internal fork (`data365-git/loom-alternative`), branded as "data365", deployed to Railway at https://cap-web-production-4817.up.railway.app. The desktop app (Tauri v2 + SolidStart / Rust) records and edits screen, camera, and microphone locally, then uploads to S3-compatible storage; the Next.js web app hosts the share pages, dashboard, team workspaces, comments, transcripts, viewer analytics, and the public marketing site. Target users: content creators, product managers, support teams, and engineers who need fast screen-to-link workflows with full data ownership — no Loom lock-in.

---

## 2. Tech stack

| Layer | Choice | Version |
|---|---|---|
| Language (web) | TypeScript | ^5.8.3 |
| Language (desktop) | Rust 2024 edition | 1.88+ |
| Build system | Turborepo | ^2.3.4 |
| Package manager | pnpm | 10.5.2 |
| Framework (web) | Next.js App Router | 14.2.x |
| Framework (desktop) | Tauri v2 + SolidStart (SolidJS) | Tauri v2 |
| Desktop IPC | tauri_specta (strongly typed bindings) | — |
| Styling | Tailwind CSS | — |
| Server state (web) | TanStack Query v5 | — |
| Server state (desktop) | @tanstack/solid-query | — |
| Effect system | Effect + @effect/platform | — |
| Database | MySQL 8 (PlanetScale / Docker) | — |
| ORM | Drizzle ORM | — |
| Auth | NextAuth v5 with custom Drizzle adapter | — |
| S3-compatible storage | AWS S3, Cloudflare R2, Backblaze B2, MinIO, Wasabi, Google Drive | — |
| AI — transcription | Deepgram API | — |
| AI — metadata/summaries | Groq (primary), OpenAI (fallback) | — |
| Email | Resend | — |
| Analytics | PostHog + Tinybird | — |
| Payments | Stripe | — |
| SSO | WorkOS | — |
| CDN signing | CloudFront | — |
| URL shortening | Dub | — |
| Discord integration | discord.js | — |
| Media processing (web) | cap-media-server (`ghcr.io/capsoftware/cap-media-server`) | — |
| Desktop screen capture | ScreenCaptureKit (macOS), Direct3D / MediaFoundation (Windows) | — |
| Desktop encoding | AVFoundation (macOS), MediaFoundation / FFmpeg (Windows) | — |
| Desktop rendering | WGPU + Skia | — |
| Deployment (web) | Railway (Docker Compose; `apps/web/Dockerfile`) | — |
| Deployment (infra) | SST (infra/ config) | — |
| Min Node version | 20 | — |

---

## 3. Features

Status: ✅ Live · 🚧 Building · 📋 Planned · 🗑 Removed

| # | Feature | Status | Owner screen(s) | Notes |
|---|---|---|---|---|
| 1 | Instant Mode recording (upload-while-record; link ready on stop) | ✅ | Desktop: main window / in-progress-recording | Desktop + web recorder |
| 2 | Studio Mode recording (local-first; open editor after stop) | ✅ | Desktop: main window → editor | Separate recording pipeline |
| 3 | Web-based recorder (browser MediaRecorder, no desktop install required) | ✅ | Dashboard → caps → web-recorder-dialog | Screen + cam + mic in browser |
| 4 | Screen + camera + microphone capture | ✅ | Desktop: main window device selectors | macOS ScreenCaptureKit; Windows D3D/MF |
| 5 | System audio capture | ✅ | Desktop: main window | Toggle per recording |
| 6 | Target selection (window, screen, area) | ✅ | Desktop: target-select-overlay / capture-area | Area = drag-to-select |
| 7 | Studio editor — background customisation (gradients, wallpapers, solid colours, blur) | ✅ | Desktop: editor ConfigSidebar | Brand colors, presets |
| 8 | Studio editor — zoom/pan effects timeline | ✅ | Desktop: editor Timeline/ZoomTrack | Keyframe-based |
| 9 | Studio editor — text overlays | ✅ | Desktop: editor TextOverlay / TextTrack | Positioned on timeline |
| 10 | Studio editor — captions track (auto-generated) | ✅ | Desktop: editor CaptionsTab / CaptionsTrack | Deepgram-sourced |
| 11 | Studio editor — caption editing (word-level edit) | ✅ | Desktop: editor TranscriptPage | |
| 12 | Studio editor — keyboard highlight (keystroke visualisation) | ✅ | Desktop: editor KeyboardTab / KeyboardTrack | |
| 13 | Studio editor — scene / clip trimming | ✅ | Desktop: editor Timeline / SceneTrack / ClipTrack | |
| 14 | Studio editor — mask overlay | ✅ | Desktop: editor MaskOverlay / MaskTrack | |
| 15 | Studio editor — shadow & aspect-ratio controls | ✅ | Desktop: editor ShadowSettings, AspectRatioSelect | |
| 16 | Studio editor — gradient editor | ✅ | Desktop: editor GradientEditor | |
| 17 | Studio editor — brand colors presets dropdown | ✅ | Desktop: editor BrandColorsDropdown / PresetsDropdown | Pulls org brand |
| 18 | Video export (MP4 / GIF) | ✅ | Desktop: editor ExportPage | enc-avfoundation / enc-ffmpeg / enc-gif |
| 19 | Screenshot capture and editor | ✅ | Desktop: screenshot-editor | OCR, annotation layers, shapes, text |
| 20 | Screenshot editor — annotation tools (arrows, shapes, text, freehand) | ✅ | Desktop: screenshot-editor AnnotationTools | |
| 21 | Screenshot editor — OCR selection overlay | ✅ | Desktop: screenshot-editor OcrSelectionOverlay | |
| 22 | Screenshot editor — aspect ratio, border, padding, rounding, shadow popovers | ✅ | Desktop: screenshot-editor popovers | |
| 23 | Share link generation (instant after recording) | ✅ | Desktop: ShareButton / server create-for-processing | /s/[videoId] on web |
| 24 | Public share page with video playback | ✅ | Web: /s/[videoId] | Password-protected option |
| 25 | Video embed (iframe / SDK) | ✅ | Web: /embed/[videoId] | sdk-embed package |
| 26 | Comments on share page (text + emoji, timestamped) | ✅ | Web: /s/[videoId] Activity tab | Threaded replies |
| 27 | Emoji reactions on share page | ✅ | Web: /s/[videoId] | |
| 28 | Transcript display on share page | ✅ | Web: /s/[videoId] | Toggle via org/video settings |
| 29 | AI-generated title, summary, chapters | ✅ | Web: video AI action (Groq/OpenAI) | Auto-triggered post-upload |
| 30 | AI captions (Deepgram) | ✅ | Web: /api/video/transcribe/status | Deepgram transcription job |
| 31 | Transcript translation | ✅ | Web: actions/videos/translate-transcript | Multi-language |
| 32 | Transcript editing (word-level) | ✅ | Web: /s/[videoId]/edit | save-edits server action |
| 33 | Viewer analytics (per-video: views, watch duration, location) | ✅ | Web: /s/[videoId] + dashboard analytics | Tinybird backend |
| 34 | Dashboard analytics overview (all videos, charts, table) | ✅ | Web: /dashboard/analytics | Tinybird pipes |
| 35 | Video management dashboard (grid, pagination) | ✅ | Web: /dashboard/caps | Cap cards with thumbnails |
| 36 | Folder organisation | ✅ | Web: /dashboard/caps + /dashboard/folder/[id] | Nested folders, color labels |
| 37 | Spaces (team sub-namespaces inside an org) | ✅ | Web: /dashboard/spaces + /dashboard/spaces/[spaceId] | Browse, join, manage |
| 38 | Team workspaces (organisations) | ✅ | Web: /dashboard/settings/organization | Owner/admin/member roles |
| 39 | Organisation member management (invite, remove, role change) | ✅ | Web: settings/organization/members | Email invite flow |
| 40 | Pro seat assignment per member | ✅ | Web: settings/organization/members | toggle-pro-seat action |
| 41 | Custom domain for share pages | ✅ | Web: settings/organization | DNS CNAME verification |
| 42 | Custom org icon & shareable-link icon | ✅ | Web: settings/organization | shareable-link-icon action |
| 43 | Custom S3 bucket per org (BYOB — Bring Your Own Bucket) | ✅ | Desktop: settings/integrations/s3-config; Web: org settings storage | Encrypted credentials in DB |
| 44 | Google Drive storage integration | ✅ | Desktop: settings/integrations/google-drive-config | OAuth flow, quota cache |
| 45 | Cap Cloud storage (default) | ✅ | All | S3 bucket operated by Cap |
| 46 | Local-only storage option | ✅ | Desktop: settings | No upload to cloud |
| 47 | Video password protection | ✅ | Web: share page PasswordDialog, actions/videos/password | Encrypted password in DB |
| 48 | Per-video settings (disable summary, captions, chapters, reactions, transcript, comments) | ✅ | Web: caps SettingsDialog | settings JSON column |
| 49 | Per-org video feature flags (same as above) | ✅ | Web: org settings preferences | settings JSON column |
| 50 | Notifications system (comments, replies, views, reactions) | ✅ | Web: dashboard Navbar Notifications panel | Read/unread, filter by type |
| 51 | Notification preferences (pause/resume per type) | ✅ | Web: notifications settings dropdown | |
| 52 | Loom import (import existing Loom videos) | ✅ | Web: /dashboard/import/loom, web-backend Loom/ImportVideo | Fetch Loom share URL |
| 53 | File upload import | ✅ | Web: /dashboard/import/file | Local video file to Cap |
| 54 | Video title / date editing | ✅ | Web: actions/videos/edit-title, edit-date | Shown on share page |
| 55 | Video deletion | ✅ | Web: /api/video/delete, actions/developers/delete-video | Cascades S3 delete |
| 56 | Bulk video operations (select multiple caps) | ✅ | Web: caps SelectedCapsBar | Move, delete, share |
| 57 | Video sharing dialog (copy link, toggle public/private) | ✅ | Web: caps SharingDialog | |
| 58 | Recordings overlay (quick access to past recordings) | ✅ | Desktop: recordings-overlay route | |
| 59 | In-progress recording bar (floating HUD during recording) | ✅ | Desktop: in-progress-recording route | Pause, stop, cancel |
| 60 | Desktop settings — general, hotkeys, recordings, screenshots, transcription | ✅ | Desktop: settings/* | Tauri store-persisted |
| 61 | Desktop settings — changelog viewer | ✅ | Desktop: settings/changelog | Fetches from web /api/changelog |
| 62 | Desktop settings — feedback submission | ✅ | Desktop: settings/feedback | POST /api/desktop/feedback |
| 63 | Desktop settings — experimental flags | ✅ | Desktop: settings/experimental | Feature-flag toggles |
| 64 | Desktop settings — license management | ✅ | Desktop: settings/license | Commercial license activation |
| 65 | Desktop onboarding flow | ✅ | Desktop: (window-chrome)/onboarding.tsx | First-run wizard |
| 66 | Desktop update / upgrade prompts | ✅ | Desktop: update.tsx, upgrade.tsx | Tauri updater + Stripe upsell |
| 67 | Desktop mode selection (Instant / Studio) | ✅ | Desktop: mode-select.tsx | |
| 68 | Desktop camera preview window (floating) | ✅ | Desktop: camera.tsx route | PiP bubble during recording |
| 69 | Web onboarding flow | ✅ | Web: /onboarding/[...steps] | Multi-step wizard |
| 70 | Authentication (email magic link, Google OAuth, WorkOS SSO) | ✅ | Web: /login, /signup, /verify-otp | NextAuth |
| 71 | Stripe billing (subscriptions, guest checkout, usage) | ✅ | Web: settings/organization/billing | Webhook-driven status |
| 72 | Developer portal (apps, API keys, domains, credits) | ✅ | Web: /dashboard/developers/* | SDK + REST v1 API |
| 73 | Developer SDK embed + recorder | ✅ | packages/sdk-embed, packages/sdk-recorder | Third-party embedding |
| 74 | Playlist API | ✅ | Web: /api/playlist | Returns ordered video list |
| 75 | Cap AI chat assistant (CapAIBox dialog in navbar) | ✅ | Web: Navbar/CapAIBox, CapAIDialog | |
| 76 | Messenger (Millie AI agent; human takeover) | ✅ | Web: /messenger/[id] | Live agent mode |
| 77 | Admin: replace video | ✅ | Web: /admin/replace-video | Internal admin action |
| 78 | Referral programme | ✅ | Web: /dashboard/refer | invite quota tracked per user |
| 79 | Self-hosting (Docker Compose, Railway, Coolify) | ✅ | docker-compose.yml, docker-compose.coolify.yml | Full stack self-host |
| 80 | Marketing site (home, pricing, about, features, blog, download, SEO landing pages) | ✅ | Web: (site)/* | Next.js App Router SSR |
| 81 | Docs site (MDX, sidebar, search, breadcrumbs, TOC) | ✅ | Web: (docs)/docs/[[...slug]] | |
| 82 | SEO landing pages (loom-alternative, screen-recorder, free-screen-recorder, etc.) | ✅ | Web: (site)/(seo)/* | 20+ pages |
| 83 | Solution pages (agencies, daily standup, employee onboarding, online classroom, remote teams) | ✅ | Web: (site)/(seo)/solutions/* | |
| 84 | Free web video tools (convert formats, trim, loom-downloader, speed controller) | ✅ | Web: (site)/tools/* | Client-side WASM/FFmpeg |
| 85 | Desktop app download page (platform-specific) | ✅ | Web: /download, /download/[platform] | Auto-detects OS |
| 86 | Tauri updater endpoint | ✅ | Web: /api/releases/tauri/[version]/[target]/[arch] | |
| 87 | Changelog API (plain + status) | ✅ | Web: /api/changelog, /api/changelog/status | |
| 88 | Storybook UI component docs | ✅ | apps/storybook | Internal only |
| 89 | Discord bot integration | ✅ | apps/discord-bot | Notifications / commands |
| 90 | Cron: developer storage usage aggregation | ✅ | Web: /api/cron/developer-storage | Scheduled via cron |
| 91 | Analytics: PostHog + Tinybird event tracking | ✅ | Web: /api/analytics/track | All user events |
| 92 | Student discount page | ✅ | Web: /student-discount | |
| 93 | DPA / Privacy / Terms legal pages | ✅ | Web: /dpa, /privacy, /terms | |
| 94 | OSS friends page | ✅ | Web: /oss-friends | |
| 95 | License deactivation page | ✅ | Web: /deactivate-license | Commercial license mgmt |
| 96 | Testimonials page | ✅ | Web: /testimonials | |
| 97 | FAQ page | ✅ | Web: /faq | |
| 98 | Self-hosting landing page | ✅ | Web: /self-hosting | |
| 99 | API health / status endpoint | ✅ | Web: /api/status | Returns 200 ok |
| 100 | Upload progress webhook (media-server → web) | ✅ | Web: /api/webhooks/media-server/progress | Processing pipeline |

---

## 4. Screen map

### Web App (Next.js — apps/web)

| Screen | Route | Enters from | Exits to | Primary actions | Overlays / sheets |
|---|---|---|---|---|---|
| Home / Landing | / | Direct / nav | /login, /signup, /download, /pricing | CTA → sign up or download | — |
| Login | /login | / , any auth guard | /dashboard/caps, /onboarding | Email magic link, Google OAuth, WorkOS SSO | — |
| Signup | /signup | / , login | /onboarding | Email, Google, WorkOS | — |
| OTP Verify | /verify-otp | /signup, /login | /dashboard/caps | Enter OTP code | — |
| Onboarding | /onboarding/[...steps] | First login | /dashboard/caps | Welcome → org setup → custom domain → invite team → download | — |
| Dashboard — Caps | /dashboard/caps | Navbar | /s/[videoId], /dashboard/folder/[id] | Record, upload, import, filter, paginate, select, delete, share | Web recorder dialog, SettingsDialog, SharingDialog, PasswordDialog, NewFolderDialog |
| Dashboard — Caps Record | /dashboard/caps/record | Caps page | /dashboard/caps | Full-screen in-browser record | — |
| Dashboard — Folder | /dashboard/folder/[id] | Caps page / folder list | /dashboard/caps, /s/[videoId] | View folder contents, move videos | FoldersDropdown |
| Dashboard — Analytics | /dashboard/analytics | Navbar | — | Date filter, video picker, chart view, table card | — |
| Dashboard — Spaces Browse | /dashboard/spaces/browse | Navbar / SpacesList | /dashboard/spaces/[spaceId] | Join a space | — |
| Dashboard — Space | /dashboard/spaces/[spaceId] | Navbar / SpacesList | /dashboard/spaces/[spaceId]/folder/[folderId] | Manage space caps, folders | SpaceDialog |
| Dashboard — Space Folder | /dashboard/spaces/[spaceId]/folder/[folderId] | Space page | /dashboard/spaces/[spaceId] | View folder videos | — |
| Dashboard — Settings Account | /dashboard/settings/account | Navbar settings | — | Update name, avatar, delete account | — |
| Dashboard — Settings Org | /dashboard/settings/organization | Navbar settings | — | Update org name, allowed domain, icon | CustomDomainDialog |
| Dashboard — Settings Org Billing | /dashboard/settings/organization/billing | Org settings | — | Subscribe, manage, seat quantity, view invoices | — |
| Dashboard — Settings Org Members | /dashboard/settings/organization/members | Org settings | — | Invite, remove, update role, toggle pro seat | — |
| Dashboard — Settings Org Preferences | /dashboard/settings/organization/preferences | Org settings | — | Toggle feature flags for all org videos | — |
| Dashboard — Settings Org Integrations | /dashboard/settings/organization/integrations | Org settings | — | Add/remove Google Drive, S3 integrations | — |
| Dashboard — Settings Workspace | /dashboard/settings/workspace | Navbar settings | — | Workspace config | — |
| Dashboard — Import Loom | /dashboard/import/loom | Caps page ImportLoomButton | /dashboard/caps | Paste Loom URL, trigger import | — |
| Dashboard — Import File | /dashboard/import/file | Caps page UploadCapButton | /dashboard/caps | Upload local video file | — |
| Dashboard — Refer | /dashboard/refer | Navbar | — | Share referral link, view invite quota | — |
| Dashboard — Developers Apps | /dashboard/developers/apps | Navbar | /dashboard/developers/apps/[appId]/* | Create app, list apps | CreateAppDialog |
| Dashboard — Developer App API Keys | /dashboard/developers/apps/[appId]/api-keys | App layout | — | Generate, revoke API keys | ApiKeyDisplay |
| Dashboard — Developer App Domains | /dashboard/developers/apps/[appId]/domains | App layout | — | Add, remove allowed domains | — |
| Dashboard — Developer App Settings | /dashboard/developers/apps/[appId]/settings | App layout | — | Update app name, delete app | — |
| Dashboard — Developer App Videos | /dashboard/developers/apps/[appId]/videos | App layout | — | List SDK-uploaded videos, delete | — |
| Dashboard — Developer Credits | /dashboard/developers/credits | Navbar | — | View balance, transaction history, top-up | — |
| Dashboard — Developer Usage | /dashboard/developers/usage | Navbar | — | API usage stats | — |
| Invite Accept | /invite/[inviteId] | Email link | /dashboard/caps | Accept or decline org invite | — |
| Video Share Page | /s/[videoId] | Share link / dashboard | — | Watch video, comment, react, read transcript, view chapters | Password gate sheet |
| Video Share Page Edit | /s/[videoId]/edit | Share page (owner) | /s/[videoId] | Edit transcript words | — |
| Video Embed | /embed/[videoId] | iframe | — | Watch video | — |
| Dev Video Preview | /dev/[videoId] | Dev workflow | — | Development preview | — |
| Messenger | /messenger/[id] | Support widget | — | Chat with Millie AI / agent | — |
| Admin Replace Video | /admin/replace-video | Internal | — | Replace video source file | — |
| Docs | /docs/[[...slug]] | Nav | — | Read docs, search, breadcrumb nav | Mobile menu |
| Marketing Home | / (site) | External | /login, /signup, /download | Hero, features, social proof | — |
| Marketing About | /about | Nav | — | Company info | — |
| Marketing Blog | /blog | Nav | /blog/[slug] | Browse posts | — |
| Marketing Blog Post | /blog/[slug] | Blog | /blog | Read post | — |
| Marketing Pricing | /pricing | Nav | /signup | Select plan | — |
| Marketing Download | /download | Nav | /download/[platform] | Download desktop app | — |
| Marketing Download Platform | /download/[platform] | /download | — | Platform-specific installer | — |
| Marketing Download Versions | /download/versions | /download | — | Past versions | — |
| Marketing Features Instant Mode | /features/instant-mode | Nav | — | Feature explainer | — |
| Marketing Features Studio Mode | /features/studio-mode | Nav | — | Feature explainer | — |
| Marketing Self-Hosting | /self-hosting | Nav | — | Docker Compose, Railway guide | — |
| Marketing FAQ | /faq | Nav | — | Q&A list | — |
| Marketing Testimonials | /testimonials | Nav | — | Customer quotes | — |
| Marketing OSS Friends | /oss-friends | Nav | — | Partner list | — |
| Marketing Student Discount | /student-discount | Nav | — | Discount form | — |
| Marketing DPA | /dpa | Footer | — | Legal doc | — |
| Marketing Privacy | /privacy | Footer | — | Privacy policy | — |
| Marketing Terms | /terms | Footer | — | Terms of service | — |
| Marketing Deactivate License | /deactivate-license | Email / settings | — | Deactivate commercial licence | — |
| SEO: Loom Alternative | /loom-alternative | Search | / | SEO landing | — |
| SEO: Best Screen Recorder | /best-screen-recorder | Search | / | SEO landing | — |
| SEO: Free Screen Recorder | /free-screen-recorder | Search | / | SEO landing | — |
| SEO: Screen Recorder | /screen-recorder | Search | / | SEO landing | — |
| SEO: Screen Recorder Mac | /screen-recorder-mac | Search | / | SEO landing | — |
| SEO: Screen Recorder Windows | /screen-recorder-windows | Search | / | SEO landing | — |
| SEO: Screen Recording | /screen-recording | Search | / | SEO landing | — |
| SEO: Screen Recording Software | /screen-recording-software | Search | / | SEO landing | — |
| SEO: How To Screen Record | /how-to-screen-record | Search | / | SEO landing | — |
| SEO: Record Screen | /record-screen | Search | / | SEO landing | — |
| SEO: Video Recording Software | /video-recording-software | Search | / | SEO landing | — |
| SEO: Self-Hosted Screen Recording | /self-hosted-screen-recording | Search | / | SEO landing | — |
| SEO: Open Source Screen Recorder | /open-source-screen-recorder | Search | / | SEO landing | — |
| SEO: OBS Alternative | /obs-alternative | Search | / | SEO landing | — |
| SEO: Mac Screen Recording w/ Audio | /mac-screen-recording-with-audio | Search | / | SEO landing | — |
| SEO: HIPAA Compliant Screen Recording | /hipaa-compliant-screen-recording | Search | / | SEO landing | — |
| SEO: Developer Documentation Videos | /developer-documentation-videos | Search | / | SEO landing | — |
| SEO: Async Video Code Reviews | /async-video-code-reviews | Search | / | SEO landing | — |
| SEO: Solution — Agencies | /solutions/agencies | Search | / | Solution page | — |
| SEO: Solution — Daily Standup | /solutions/daily-standup-software | Search | / | Solution page | — |
| SEO: Solution — Employee Onboarding | /solutions/employee-onboarding-platform | Search | / | Solution page | — |
| SEO: Solution — Online Classroom | /solutions/online-classroom-tools | Search | / | Solution page | — |
| SEO: Solution — Remote Teams | /solutions/remote-team-collaboration | Search | / | Solution page | — |
| Tools — Convert Index | /tools/convert | Nav/search | /tools/convert/[path] | Choose conversion type | — |
| Tools — Convert Dynamic | /tools/convert/[conversionPath] | Convert index | — | Upload + convert video in browser | — |
| Tools — AVI to MP4 | /tools/convert/avi-to-mp4 | Nav/search | — | Convert AVI to MP4 | — |
| Tools — MKV to MP4 | /tools/convert/mkv-to-mp4 | Nav/search | — | Convert MKV to MP4 | — |
| Tools — MOV to MP4 | /tools/convert/mov-to-mp4 | Nav/search | — | Convert MOV to MP4 | — |
| Tools — MP4 to GIF | /tools/convert/mp4-to-gif | Nav/search | — | Convert MP4 to GIF | — |
| Tools — MP4 to MP3 | /tools/convert/mp4-to-mp3 | Nav/search | — | Extract audio | — |
| Tools — MP4 to WebM | /tools/convert/mp4-to-webm | Nav/search | — | Convert MP4 to WebM | — |
| Tools — WebM to MP4 | /tools/convert/webm-to-mp4 | Nav/search | — | Convert WebM to MP4 | — |
| Tools — Loom Downloader | /tools/loom-downloader | Nav/search | — | Paste Loom URL, download MP4 | — |
| Tools — Trim | /tools/trim | Nav/search | — | Trim video in browser | — |
| Tools — Video Speed Controller | /tools/video-speed-controller | Nav/search | — | Adjust playback speed | — |

### Desktop App (Tauri v2 + SolidStart — apps/desktop)

| Screen | Route | Enters from | Exits to | Primary actions |
|---|---|---|---|---|
| Main window (new-main) | (window-chrome)/new-main | App launch / recording stop | editor, mode-select | Select target, camera, mic, system audio; Start recording |
| Mode select | mode-select | Main window toggle | main window | Switch Instant / Studio mode |
| In-progress recording HUD | in-progress-recording | Recording start | main window / editor | Pause, stop, cancel recording |
| Camera preview (PiP) | camera | Recording start | — | Floating camera bubble |
| Capture area selection | capture-area | Area recording mode | main window | Drag to select region |
| Target select overlay | target-select-overlay | Main window | main window | Click window / screen to capture |
| Recordings overlay | recordings-overlay | System tray / hotkey | editor | Recent recordings list |
| Notifications window | notifications | System tray | — | Recent app notifications |
| Editor | editor/index | Studio recording stop | — | Full editor with timeline |
| Editor — Config Sidebar | editor/ConfigSidebar | Editor | — | Background, camera, audio controls |
| Editor — Timeline | editor/Timeline | Editor | — | Clip, zoom, captions, text, mask, keyboard tracks |
| Editor — Export page | editor/ExportPage | Editor toolbar | — | Format, resolution, bitrate, export |
| Editor — Transcript page | editor/TranscriptPage | Editor toolbar | — | Word-level caption editing |
| Screenshot editor | screenshot-editor | Screenshot capture | — | Annotate, crop, export screenshot |
| Settings | (window-chrome)/settings | Main window cog | — | Tabbed settings |
| Settings — General | settings/general | Settings | — | App behaviour, startup, theme |
| Settings — Hotkeys | settings/hotkeys | Settings | — | Keyboard shortcut customisation |
| Settings — Recordings | settings/recordings | Settings | — | Storage path, quality, format |
| Settings — Screenshots | settings/screenshots | Settings | — | Screenshot format, storage |
| Settings — Transcription | settings/transcription | Settings | — | Transcription model, language |
| Settings — Integrations | settings/integrations | Settings | — | S3, Google Drive config |
| Settings — S3 Config | settings/integrations/s3-config | Integrations | — | AWS/R2/B2 credentials |
| Settings — Google Drive | settings/integrations/google-drive-config | Integrations | — | Google OAuth connect |
| Settings — License | settings/license | Settings | — | Activate / deactivate licence |
| Settings — Changelog | settings/changelog | Settings | — | App version history |
| Settings — Feedback | settings/feedback | Settings | — | Submit feedback form |
| Settings — Experimental | settings/experimental | Settings | — | Feature flags |
| Desktop onboarding | (window-chrome)/onboarding | First launch | main window | Account connect, permissions grant |
| Update prompt | (window-chrome)/update | Tauri updater | — | Install update |
| Upgrade prompt | (window-chrome)/upgrade | Pro feature gate | — | Stripe subscription CTA |
| Debug window | debug | Dev only | — | Internal diagnostics |

---

## 5. User journeys

### J1. Record a Cap in Instant Mode (desktop)
- **Trigger:** User opens desktop app, selects Instant Mode.
- **Steps:**
  1. Main window opens: user picks screen/window target, toggles camera, mic, system audio.
  2. Clicks Start Recording → capture-area or target-select-overlay if area mode.
  3. In-progress recording HUD appears (floating).
  4. Cap uploads to S3 in real-time while recording.
  5. User clicks Stop in HUD.
  6. Desktop displays share link immediately (upload was ongoing).
  7. Link copied to clipboard; notification shown.
- **Success:** Share URL is live at /s/[videoId] within seconds of stopping.
- **Failure:** Upload error → retry dialog; offline → falls back to local backup.

### J2. Record and Edit a Cap in Studio Mode (desktop)
- **Trigger:** User selects Studio Mode on main window.
- **Steps:**
  1. User configures target, camera, mic.
  2. Clicks Start Recording → records locally.
  3. Clicks Stop → editor opens automatically.
  4. User adjusts background, adds text overlays, trims clips, applies zoom effects, edits captions.
  5. User clicks Share → uploads to S3, gets share link OR clicks Export → saves MP4/GIF locally.
- **Success:** Share URL live or file saved.
- **Failure:** Upload failure → retry; export failure → error screen with logs.

### J3. Record from the browser (web recorder)
- **Trigger:** User clicks Record button on /dashboard/caps without desktop app.
- **Steps:**
  1. Web recorder dialog opens; user grants screen/camera/mic permissions.
  2. Selects recording mode (screen + cam, screen only, cam only).
  3. Clicks Record → browser MediaRecorder starts; segments spooled to S3 via recording-spool.
  4. In-progress bar appears at top of page.
  5. User clicks Stop → final chunk uploaded.
  6. Share link appears; video enters processing pipeline.
- **Success:** /s/[videoId] is accessible.
- **Failure:** Permission denied → instructional fallback; upload failure → local backup recovery via recovered-recording-cache.

### J4. View and comment on a shared Cap
- **Trigger:** Recipient receives share link /s/[videoId].
- **Steps:**
  1. Page loads; if password-protected → password prompt sheet.
  2. User enters password → video unlocked.
  3. User watches video; timestamped comments can be added.
  4. User types comment, clicks post → POST /api/video/comment; notification sent to owner.
  5. User adds emoji reaction.
  6. User reads AI-generated transcript / chapters / summary.
- **Success:** Comment persists; owner receives email notification (if not paused).
- **Failure:** Auth error → login redirect (for private videos); comment 429 → throttle message.

### J5. Import Loom videos
- **Trigger:** User clicks Import from Loom on /dashboard/import/loom.
- **Steps:**
  1. User pastes Loom share URL.
  2. Server action calls web-backend Loom/ImportVideo.ts → fetches Loom video metadata + download URL.
  3. Video downloaded server-side; uploaded to org's S3 bucket.
  4. Video record created in DB with metadata; processing triggered.
  5. AI title + transcript generated.
  6. Video appears on /dashboard/caps.
- **Success:** Loom video migrated and available in Cap.
- **Failure:** Loom URL invalid → error toast; download fails → retry with progress indicator (TODO: upload progress not yet wired).

### J6. Set up a custom domain for share pages
- **Trigger:** Org admin goes to Settings → Organization → domain section.
- **Steps:**
  1. Enters desired domain in CustomDomainDialog.
  2. Server runs check-domain action → queries DNS for CNAME record.
  3. User adds CNAME in their DNS provider pointing to Cap.
  4. User clicks Verify → domain-utils validates; domainVerified timestamp set.
  5. Share pages now load at `https://custom-domain/s/[videoId]`.
- **Success:** domainVerified set; org.customDomain stored.
- **Failure:** DNS not propagated → verification fails; user retries.

### J7. Invite team members to an organisation
- **Trigger:** Org owner/admin goes to Settings → Organization → Members → Invite.
- **Steps:**
  1. Enters email(s) + role (admin/member) in invite form.
  2. send-invites server action creates organizationInvites records; sends Resend email.
  3. Recipient clicks link → /invite/[inviteId] page.
  4. Recipient logs in (if not already).
  5. POST /api/invite/accept → organizationMembers record created; invite status set to accepted.
- **Success:** Member appears in members list.
- **Failure:** Invite expired → re-invite; user already in org → error; POST /api/invite/decline → status set declined.

### J8. Subscribe to a paid plan
- **Trigger:** User clicks Upgrade in desktop app or visits /dashboard/settings/organization/billing.
- **Steps:**
  1. User selects plan tier.
  2. POST /api/settings/billing/subscribe → Stripe checkout session created; user redirected.
  3. User completes Stripe checkout.
  4. Stripe webhook POST /api/webhooks/stripe → updates user.stripeSubscriptionStatus, plan.
  5. Desktop upgrade prompt clears; pro features unlocked.
- **Success:** stripeSubscriptionStatus = "active"; Pro features available.
- **Failure:** Payment declined → Stripe handles; webhook fails → retry queue.

### J9. Connect custom S3 bucket (BYOB)
- **Trigger:** Org admin opens Desktop → Settings → Integrations → S3 Config.
- **Steps:**
  1. Enters bucket name, region, access key, secret key, optional endpoint.
  2. Desktop command → POST /api/desktop/s3/config/test → validates credentials against S3.
  3. If valid → POST /api/desktop/s3/config/ → saves encrypted credentials to s3Buckets table.
  4. Future recordings for org uploaded to custom bucket.
- **Success:** GET /api/desktop/s3/config/get returns config; uploads route to custom bucket.
- **Failure:** Bad credentials → 400 from test endpoint; user corrects.

### J10. Generate AI title, summary, chapters for a Cap
- **Trigger:** Video finishes uploading and processing pipeline completes.
- **Steps:**
  1. Media server webhook POST /api/webhooks/media-server/progress triggers processing.
  2. Server action trigger-processing.ts calls Deepgram for transcription.
  3. When transcription completes, GET /api/video/ai (Groq/OpenAI) generates title, summary, chapters.
  4. DB updated with metadata; share page shows AI content.
  5. User can edit transcript on /s/[videoId]/edit.
- **Success:** Share page displays title, summary, chapters, timestamped transcript.
- **Failure:** Groq fails → OpenAI fallback; both fail → metadata remains null; retry via /api/videos/[videoId]/retry-ai.

### J11. Export / download a Cap
- **Trigger:** User clicks Download on share page or Export in desktop editor.
- **Steps (web):**
  1. GET /api/download → returns signed S3 URL or streams file.
  2. Browser downloads MP4.
- **Steps (desktop export):**
  1. User configures format/resolution in ExportPage.
  2. Rust export crate renders final video (WGPU/Skia pipeline + enc-avfoundation or enc-ffmpeg).
  3. File saved to configured local path.
- **Success:** File downloaded / saved.
- **Failure:** S3 URL expired → regenerated; export crash → error screen with log link.

### J12. Use developer SDK to embed recorder
- **Trigger:** Third-party dev integrates sdk-recorder into their web app.
- **Steps:**
  1. Dev creates a Cap App in /dashboard/developers/apps → gets API key.
  2. Adds allowed domain in /dashboard/developers/apps/[appId]/domains.
  3. Embeds sdk-recorder script; recorder opens in iframe.
  4. On record stop → POST /api/developer/sdk/v1/[...route] (video-create, upload, finalise).
  5. Credit deducted from developer account.
  6. Dev fetches video status via GET /api/developer/v1/videos/:id/status.
- **Success:** Video appears in /dashboard/developers/apps/[appId]/videos.
- **Failure:** API key invalid → 401; domain not allowed → 403; credits exhausted → 402.

### J13. Desktop onboarding (first launch)
- **Trigger:** App opened for first time after install.
- **Steps:**
  1. Onboarding screen shows → prompts to connect Cap account (web login).
  2. User signs in via browser → token passed to desktop via deep link.
  3. Screen recording + microphone permissions requested.
  4. User shown recording mode selector.
  5. Guided first recording.
- **Success:** Main window ready; user makes first Cap.
- **Failure:** Permission denied → permissions instructions shown; auth fails → retry login.

### J14. View analytics for a video
- **Trigger:** Owner clicks Analytics tab on /s/[videoId] or views /dashboard/analytics.
- **Steps:**
  1. Page loads; Tinybird pipe queried for viewer events (views, watch time, location).
  2. Chart + table rendered showing per-view data.
  3. Per-video analytics show on CapCardAnalytics on dashboard.
- **Success:** Charts display real viewer data.
- **Failure:** Tinybird auth missing → empty state; no views yet → empty state with placeholder.

### J15. Manage team spaces
- **Trigger:** Org admin or member visits /dashboard/spaces.
- **Steps:**
  1. SpacesList shows existing spaces; user clicks Create space → SpaceDialog.
  2. create-space server action → spaces table record.
  3. User adds videos, sets space icon, manages members.
  4. Members browse spaces at /dashboard/spaces/browse.
  5. Videos organised inside /dashboard/spaces/[spaceId]/folder/[folderId].
- **Success:** Space visible to org members with correct permissions.
- **Failure:** Unauthorised user tries to access private space → 403.

### J16. Self-host Cap
- **Trigger:** DevOps engineer clones repo and runs Docker Compose.
- **Steps:**
  1. `git clone` + `docker compose up -d`.
  2. cap-web starts on port 3000; MySQL, MinIO, media-server start.
  3. Engineer sets CAP_URL, S3 env vars for production.
  4. Login links appear in `docker compose logs cap-web`.
  5. Optional: set Resend, Groq/OpenAI, Stripe keys for full feature set.
  6. Desktop pointed to self-hosted URL via Settings → Cap Server URL.
- **Success:** All services healthy; share pages load at configured domain.
- **Failure:** MySQL password baked at first init — must delete volume to reset; PORT env overrides Next.js listen port.

---

## 6. Backend endpoint inventory

### Next.js API Routes (apps/web/app/api)

| Path | Method | Purpose | Status | Used by screen |
|---|---|---|---|---|
| /api | GET, POST, HEAD, OPTIONS | Effect HttpApi catch-all (web-backend HttpLive) | ✅ | All Effect RPC clients |
| /api/analytics | GET | Fetch video analytics (Tinybird) | ✅ | Share page analytics tab |
| /api/analytics/track | POST | Track user events (PostHog / Tinybird) | ✅ | All pages |
| /api/auth/[...nextauth] | GET, POST | NextAuth authentication | ✅ | Login, signup, OTP |
| /api/changelog | GET | Fetch changelog posts | ✅ | Desktop settings/changelog |
| /api/changelog/status | GET | Get changelog unread status | ✅ | Desktop navbar |
| /api/cron/developer-storage | GET | Aggregate developer storage usage (cron) | ✅ | Scheduled cron |
| /api/dashboard/analytics | GET | Dashboard analytics (all videos) | ✅ | /dashboard/analytics |
| /api/desktop/[...route] | GET, POST, DELETE, PATCH | Desktop Hono API (see sub-routes below) | ✅ | Desktop app IPC → web |
| /api/desktop/logs | POST | Submit desktop diagnostic logs | ✅ | Desktop debug |
| /api/desktop/feedback | POST | Submit user feedback | ✅ | Desktop settings/feedback |
| /api/desktop/org-custom-domain | GET | Get org custom domain info | ✅ | Desktop settings |
| /api/desktop/plan | GET | Get user's current subscription plan | ✅ | Desktop upgrade prompt |
| /api/desktop/organizations | GET | Get orgs for current user | ✅ | Desktop org selector |
| /api/desktop/organizations/:orgId/branding | PATCH | Update org branding from desktop | ✅ | Desktop settings |
| /api/desktop/subscribe | POST | Get Stripe subscribe URL from desktop | ✅ | Desktop upgrade |
| /api/desktop/video/create | POST | Create video record (pre-upload) | ✅ | Desktop recording start |
| /api/desktop/video/delete | DELETE | Delete video from desktop | ✅ | Desktop recordings overlay |
| /api/desktop/video/progress | POST | Report upload/processing progress | ✅ | Desktop upload |
| /api/desktop/session/request | GET | Request auth session token for desktop | ✅ | Desktop auth |
| /api/desktop/s3/config | POST | Save custom S3 config | ✅ | Desktop settings/integrations |
| /api/desktop/s3/config/delete | DELETE | Remove custom S3 config | ✅ | Desktop settings |
| /api/desktop/s3/config/get | GET | Retrieve S3 config for org | ✅ | Desktop settings |
| /api/desktop/s3/config/test | POST | Test S3 credentials | ✅ | Desktop settings |
| /api/desktop/storage (protected routes) | GET, POST, DELETE | Storage integrations (Google Drive, etc.) | ✅ | Desktop settings |
| /api/desktop/google-drive/callback | GET | Google Drive OAuth callback | ✅ | Desktop Google Drive auth |
| /api/developer/credits/checkout | POST | Stripe checkout for developer credits | ✅ | /dashboard/developers/credits |
| /api/developer/sdk/v1/[...route] (video-create) | POST | SDK: create video record | ✅ | sdk-recorder |
| /api/developer/sdk/v1/[...route] (upload init) | POST | SDK: initiate multipart upload | ✅ | sdk-recorder |
| /api/developer/sdk/v1/[...route] (upload part) | POST | SDK: upload part | ✅ | sdk-recorder |
| /api/developer/sdk/v1/[...route] (upload complete) | POST | SDK: complete multipart upload | ✅ | sdk-recorder |
| /api/developer/v1/[...route]/videos | GET | Developer API: list videos | ✅ | Developer v1 REST |
| /api/developer/v1/[...route]/videos/:id | GET | Developer API: get video by ID | ✅ | Developer v1 REST |
| /api/developer/v1/[...route]/videos/:id | DELETE | Developer API: delete video | ✅ | Developer v1 REST |
| /api/developer/v1/[...route]/videos/:id/status | GET | Developer API: video processing status | ✅ | Developer v1 REST |
| /api/developer/v1/[...route]/usage | GET | Developer API: usage stats | ✅ | /dashboard/developers/usage |
| /api/download | GET | Download / stream video file (signed S3 URL) | ✅ | Share page download |
| /api/email/new-comment | POST | Send new-comment email notification | ✅ | Comment submission |
| /api/erpc | GET, POST | Effect RPC handler | ✅ | Client RPC calls |
| /api/invite/accept | POST | Accept organisation invite | ✅ | /invite/[inviteId] |
| /api/invite/decline | POST | Decline organisation invite | ✅ | /invite/[inviteId] |
| /api/notifications | GET | Fetch notifications for current user | ✅ | Dashboard navbar notifications |
| /api/notifications/preferences | GET, POST | Get/update notification preferences | ✅ | Notifications settings |
| /api/playlist | GET | Get ordered video playlist | ✅ | Playlist consumer |
| /api/releases/tauri/[version]/[target]/[arch] | GET | Tauri updater endpoint | ✅ | Desktop auto-updater |
| /api/settings/billing/guest-checkout | POST | Guest Stripe checkout | ✅ | Pricing page |
| /api/settings/billing/manage | POST | Stripe customer portal redirect | ✅ | Billing settings |
| /api/settings/billing/subscribe | POST | Create Stripe subscription checkout | ✅ | Billing settings |
| /api/settings/billing/usage | GET | Fetch current billing usage | ✅ | Billing settings |
| /api/settings/user/name | POST | Update user display name | ✅ | Account settings |
| /api/status | GET | Health check — returns 200 | ✅ | Monitoring |
| /api/storage/object | GET | Proxy / serve private storage object | ✅ | Private video playback |
| /api/thumbnail | GET | Serve video thumbnail image | ✅ | Cap cards, share page |
| /api/tools/loom-download | GET | Download Loom video by URL | ✅ | /tools/loom-downloader |
| /api/upload/[...route] | GET, POST, DELETE | Multipart upload coordination (S3) | ✅ | Desktop + web recorder |
| /api/video/ai | GET | Generate AI title/summary/chapters | ✅ | Post-processing pipeline |
| /api/video/comment | POST, GET | Post or list video comments | ✅ | Share page comments |
| /api/video/comment/delete | DELETE | Delete a comment | ✅ | Share page comments |
| /api/video/delete | DELETE | Delete video + S3 objects | ✅ | Dashboard, share page |
| /api/video/domain-info | GET | Get domain config for video share page | ✅ | Share page server |
| /api/video/metadata | PUT | Update video metadata | ✅ | Desktop post-upload |
| /api/video/og | GET | Generate OG image for share page | ✅ | Share page metadata |
| /api/video/preview | GET | Stream video preview (HLS / MP4) | ✅ | Share page player |
| /api/video/transcribe/status | GET | Get transcription job status | ✅ | Share page, dashboard |
| /api/videos/[videoId]/retry-ai | POST | Retry AI generation for a video | ✅ | Dashboard admin |
| /api/videos/[videoId]/retry-transcription | POST | Retry transcription for a video | ✅ | Dashboard admin |
| /api/webhooks/media-server/progress | POST | Media server processing progress webhook | ✅ | Internal — media-server → web |
| /api/webhooks/stripe | POST | Stripe event webhook | ✅ | Stripe → subscription updates |

### Effect HttpApi routes (via /api catch-all — web-backend)

| Group | Endpoint | Method | Path | Purpose |
|---|---|---|---|---|
| video | getTranscribeStatus | GET | /api/video/transcribe/status | Transcription job status |
| video | delete | DELETE | /api/video/delete | Delete video |
| video | getAnalytics | GET | /api/video/analytics | Per-video analytics |
| desktop-public | getChangelogPosts | GET | /api/changelog | Changelog list |
| desktop-public | getChangelogStatus | GET | /api/changelog/status | Unread status |
| desktop-protected | submitFeedback | POST | /api/desktop/feedback | Submit feedback |
| desktop-protected | getUserPlan | GET | /api/desktop/plan | Get subscription plan |
| desktop-protected | getS3Config | GET | /api/desktop/s3/config/get | Get S3 config |
| desktop-protected | setS3Config | POST | /api/desktop/s3/config | Save S3 config |
| desktop-protected | deleteS3Config | DELETE | /api/desktop/s3/config/delete | Remove S3 config |
| desktop-protected | testS3Config | POST | /api/desktop/s3/config/test | Test S3 credentials |
| desktop-protected | getProSubscribeURL | POST | /api/desktop/subscribe | Stripe subscribe URL |
| desktop-protected | getOrgCustomDomain | GET | /api/org-custom-domain | Custom domain info |
| license | activateCommercialLicense | POST | /api/commercial/activate | Activate licence key |
| license | checkoutCommercialLicense | POST | /api/commercial/checkout | Purchase licence |

---

## 7. Non-goals

- Real-time collaborative editing of recordings (async only — no Google Docs-style live co-edit).
- Native mobile app (iOS / Android) — web and desktop only.
- Live streaming to external platforms (Twitch, YouTube) — recording and upload only.
- Built-in video hosting CDN (relies on S3-compatible storage; CloudFront for signing).
- Full LMS / course platform features (chapters exist but no enrolment, quizzes, grading).
- End-to-end video encryption at rest beyond S3 server-side encryption.
- Native Windows ARM desktop build (x64 Windows only at time of writing).
- Audio-only podcast-style recording without video.
- Mobile web recording (MediaRecorder API limited on iOS Safari).

---

## 8. Known broken / TODO list

All items sourced from `grep -rn "TODO|FIXME|HACK"` across the codebase:

| File | Line | Severity | Description |
|---|---|---|---|
| `apps/web/actions/video/upload.ts` | 129 | Low | `supportsUploadProgress` flag — TODO: Remove once stability confirmed |
| `apps/desktop/src/global.d.ts` | 168, 199, 277, 278, 307, 391, 398, 1803 | Low | Incomplete TypeScript type stubs for native platform APIs (dts-gen artifacts) |
| `apps/desktop/src/routes/editor/ConfigSidebar.tsx` | 3361, 3566 | Low | Hardcoded values in editor config that should be dynamic |
| `crates/recording/src/feeds/camera.rs` | 554 | Low | `BuildStreamCrashed` error variant — TODO: possible rename |
| `crates/media-info/src/lib.rs` | 75 | Low | Buffer size not yet context-aware for media info reads |
| `crates/api/src/lib.rs` | 3 | Med | `apps/desktop/src-tauri/upload.rs` not yet migrated to `crates/api` (auth model pending) |
| `apps/desktop/src-tauri/src/upload.rs` | 178 | Low | Image upload progress not reported (only video upload progress reported) |
| `apps/desktop/src-tauri/src/api.rs` | 1 | Low | Desktop API not generated from OpenAPI — manual maintenance |
| `apps/desktop/src-tauri/src/platform/macos/delegates.rs` | 1 | Med | All macOS delegates code should migrate from `objc` to `objc2` crates |
| `apps/desktop/src-tauri/src/platform/macos/delegates.rs` | 28, 29 | Low | RTL display language not respected; height not updated for hidden system buttons in screen-share |
| `packages/database/schema.ts` | 49 | Low | `nanoId` custom type to be replaced by `nanoIdRequired` (tracked in PR #1105) |
| `packages/database/crypto.ts` | 1 | Low | Crypto module not yet ported to Effect |
| `packages/database/auth/domain-utils.ts` | 22, 41 | Low | Email + hostname validation using polyfills; should migrate to Zod v4 native validators |
| `packages/web-backend/src/Loom/ImportVideo.ts` | 139 | Med | Loom import upload progress not connected to UI (progress events not wired) |

---

## 9. Decisions log

Append-only. One line per decision. Newest at top.

- **01-06-2026** — Regenerated PROJECT_REQUIREMENTS.md exhaustively from full codebase scan — source-of-truth refresh
- **01-06-2026** — Production deployment branded as "data365" on Railway at cap-web-production-4817.up.railway.app — internal fork identity
- **01-06-2026** — Desktop API uses Hono (apps/web/app/api/desktop/[...route]) rather than Effect HttpApi — desktop auth flows differ from web
- **01-06-2026** — Effect HttpApi + @effect/platform used for main web-backend API surface (/api catch-all) — type-safe RPC across desktop and web
- **01-06-2026** — All AI calls (Groq/OpenAI/Deepgram) run in Next.js Server Actions only — never client-side, avoids key exposure
- **01-06-2026** — NextAuth with custom Drizzle adapter chosen over Clerk/Auth.js cloud — full DB control, self-hostable
- **01-06-2026** — Turborepo monorepo with pnpm workspaces — shared packages across web, desktop, SDK, infra
- **01-06-2026** — Tauri v2 + SolidStart for desktop (not Electron) — smaller binary, native Rust media pipeline
- **01-06-2026** — MySQL (PlanetScale-compatible) chosen over Postgres — upstream Cap team decision; Drizzle ORM abstraction
- **01-06-2026** — S3-compatible storage abstraction (not hard-coded AWS) — enables BYOB, Cloudflare R2, MinIO self-host
- **01-06-2026** — media-server deployed as prebuilt image (ghcr.io/capsoftware/cap-media-server) — Rust workspace cross-compile issues prevent building from source in Railway
- **01-06-2026** — Railway env vars set via variableCollectionUpsert with skipDeploys:true + single deploy — avoids deploy storms from per-var triggers
