# Marketing OS Lite

## Overview

A full-stack marketing campaign management platform (MVP) that helps small businesses plan, generate, approve, and monitor marketing campaigns across Instagram, Snapchat, YouTube, and X/Twitter — all from one dashboard.

**IMPORTANT:** This is a Lite MVP. All ad platform integrations are mock/simulated by default. No real ad budget is spent, no live ads are published. Meta/Instagram read-only data access is available when credentials are configured (see Phase 3 below).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **Frontend**: React + Vite + TypeScript (`artifacts/marketing-os`)
- **Backend**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- **Build**: esbuild (CJS bundle)
- **Styling**: Tailwind CSS + shadcn/ui

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run seed` — seed demo data into the database

## Architecture

### Frontend (`artifacts/marketing-os/`)

Pages (sidebar navigation):
- `/` — Dashboard: KPI cards, daily trend chart, channel comparison, active campaigns, recommendations
- `/workspaces` — Workspace management (create/edit)
- `/brand-profile` — Brand profile configuration
- `/campaigns` — Campaign list + create/detail (5-step flow: Create → Generate Ads → Approve → Publish → Performance)
- `/content-studio` — AI content generation (mock) + approval workflow + creative brief editor per asset
- `/tracking-links` — UTM link generator
- `/connections` — Mock ad platform connections (Instagram, Snapchat, YouTube, X)
- `/reports` — Performance reports + CSV export
- `/audit-log` — Searchable action history

### Backend (`artifacts/api-server/src/routes/`)

- `workspaces.ts` — CRUD for workspaces + member management (list/add/update-role/remove)
- `brandProfiles.ts` — Brand profile management
- `campaigns.ts` — Campaign CRUD + approve + manual-publish + summary (auto-triggers recommendations on approve)
- `assets.ts` — Mock content generation + channel variants + PATCH creative brief fields
- `approvals.ts` — Approval decisions (approve/reject/request changes)
- `connections.ts` — Mock ad platform connections with safety guards against real API calls
- `trackingLinks.ts` — UTM tracking link generation
- `metrics.ts` — Daily metrics + dashboard aggregates + channel comparison
- `recommendations.ts` — Rules-based recommendation engine + PATCH /:id to mark as read
- `auditLogs.ts` — Full audit log with search + pagination
- `lib/generate-recommendations.ts` — Shared recommendation generation helper (all rules)

### Database (`lib/db/src/schema/`)

Tables: `workspaces`, `brand_profiles`, `campaigns`, `generated_assets`, `channel_variants`, `approval_decisions`, `platform_connections`, `sync_jobs`, `tracking_links`, `ad_metrics_daily`, `recommendations`, `audit_logs`

**Phase 4 additions:**
- `campaigns`: `published_at`, `published_by`, `published_channels` columns
- `generated_assets`: `image_brief`, `video_brief`, `asset_reference` columns

### Seed Data

1 demo workspace, 1 brand profile, 3 campaigns, 4 mock platform connections, 30 days of mock metrics, 10 recommendations, 15 audit log entries.

## Asset Library Foundation — Slice 1 (completed)

- **`lib/db/src/schema/media-assets.ts`** — `mediaAssetsTable` extended with `sourceType` (uploaded/external_url/generated_later) and `usageRightsNotes` (required for approved assets). New columns added via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
- **`artifacts/api-server/src/routes/mediaAssets.ts`** — `GET/POST /media-assets`, `PATCH/DELETE /media-assets/:id`. Workspace isolation, role enforcement (editor to create/update, admin to delete), approved-asset deletion blocked, usage rights notes required for approved status. Full audit log.
- **`lib/api-spec/openapi.yaml`** — Added `media-assets` tag, paths (`/media-assets`, `/media-assets/{id}`), schemas (`MediaAsset`, `CreateMediaAssetBody`, `UpdateMediaAssetBody`). Codegen re-run clean with `NODE_OPTIONS=--max-old-space-size=8192`.
- **`artifacts/marketing-os/src/pages/asset-library.tsx`** — Full Asset Library UI page at `/asset-library`: asset cards with type/source/status badges, create/edit/approve/reject/delete actions, campaign link picker, usage rights notes field (required to approve).
- **`artifacts/marketing-os/src/pages/campaign-detail.tsx`** — New "Creative Assets" tab: shows all media assets linked to the campaign, inline approve/revoke actions, link to Asset Library.
- **`artifacts/marketing-os/src/App.tsx`** — Route `/asset-library` added.
- **`artifacts/marketing-os/src/components/layout/sidebar-layout.tsx`** — "Asset Library" nav item added (Library icon, between Strategy and Performance).
- No binary upload, no AI generation, no auto-publishing, no media AI API calls.

See `docs/asset_library_foundation_slice_1_report.md` for full details.

## Phase 4 Campaign Publish Cycle (completed)

Full Create → Generate Creative → Approve → Manual Publish → Performance loop.

### New API Endpoints
- **`POST /campaigns/:id/manual-publish`** — Marks an approved campaign as published (active). Body: `{ channels: string[], notes?: string }`. Guards: campaign must be `approved` status, at least one channel required, editor+ role. Sets `publishedAt`, `publishedBy`, `publishedChannels`, `status="active"`. Writes audit log `campaign_published`. Returns updated Campaign.
- **`PATCH /assets/:id`** — Updates creative brief fields on a generated asset. Body: `{ imageBrief?, videoBrief?, assetReference? }`. Editor+ role required.

### DB Schema Changes (direct SQL ALTER TABLE)
- `campaigns`: `published_at TIMESTAMPTZ`, `published_by TEXT`, `published_channels TEXT` (JSON array)
- `generated_assets`: `image_brief TEXT`, `video_brief TEXT`, `asset_reference TEXT`

### Frontend Changes
- **`campaign-detail.tsx`**: Updated from 4-step to 5-step flow stepper (Create → Generate Ads → Approve → Publish → Performance). Added "Publish" tab with Publish Checklist card (shows pre-flight checks, publish confirmation dialog, published-at/by/channels after publish). Publish button (green) appears on header for approved-but-not-yet-published campaigns.
- **`content-studio.tsx`**: Added collapsible "Creative Brief" panel on each asset card — image brief, video brief, and asset reference (URL/notes) fields. Saved via `PATCH /assets/:id`. "Added" badge shown when brief content exists.

### Safety
- No real ad creation, budget spend, or platform API calls. All publish actions are demo-only, clearly labeled with FlaskConical icon and disclaimer text.
- `published_at` field drives the `isPublished` state (status=active AND publishedAt set) — prevents false positives from manual status changes.

## Phase 3 Meta Read-only Integration (completed)

- **`artifacts/api-server/src/lib/meta-provider.ts`** — `MetaAdsProvider` interface, `MockMetaAdsProvider` (seeded demo data), `MetaReadOnlyProvider` (Meta Graph API v20.0 — GET only), `getMetaProvider()` factory with graceful fallback, `assertNoForbiddenOp()` guard
- **Provider selection:** `META_PROVIDER` env var (`"mock"` default, `"real"` to activate live read-only). Falls back to mock if `META_ACCESS_TOKEN` is missing.
- **API routes (`artifacts/api-server/src/routes/meta.ts`):**
  - `GET /meta/status` — provider mode + credentials state (auth + workspace access required)
  - `GET /meta/accounts` — list ad accounts, source-labeled (auth + workspace access required)
  - `POST /meta/sync` — fetch accounts/campaigns/metrics, write audit log (auth + editor role minimum)
- **Data labeling:** every record carries `source: "mock" | "meta_readonly"`. Real and demo data are never mixed unlabeled.
- **Audit log:** `meta_readonly_sync_started`, `meta_readonly_sync_completed`, `meta_readonly_sync_failed` — all include workspaceId, actor, provider, fallback status
- **UI:** `MetaReadonlyPanel` component in Settings > Ad Platforms — shows Demo Mode (yellow) or Meta Read-only (blue) badge, sync results with source label, "Sync Read-only" button (editor+ only), footer: "Read-only — no publishing, budget changes, or payments"
- **No token in frontend:** `META_ACCESS_TOKEN` read server-side only — never in any HTTP response or frontend code
- **Forbidden operations blocked:** `publishAd`, `createCampaign`, `changeBudget`, `editCampaign`, `pauseCampaign`, `connectPaymentMethod` → HTTP 403

To activate live Meta read-only: add `META_ACCESS_TOKEN` to Replit Secrets + set `META_PROVIDER=real` in shared env vars. No code changes required.

See `docs/phase_3_meta_readonly_report.md` and `docs/meta_readonly_guardrails.md` for full details.

## AI Workflow Runtime + Persistence (completed)

The 4-stage Campaign Launch Assistant AI Workflow (مساعد إطلاق الحملة) uses real server-side AI calls and database persistence.

- **Provider:** `AI_PROVIDER=openai` + `OPENAI_API_KEY` (server-side only) → `OpenAIWorkflowProvider`. Default `mock` mode uses template builders.
- **Stage 1 (فهم الحملة):** Intake form → upsert to `campaign_workflow_intakes`. No AI call.
- **Stage 2 (بناء الاستراتيجية):** Calls `generateStrategyBrief()` + `generateCreativeBrief()` → persists to `campaign_strategy_briefs` / `campaign_creative_briefs`. Both reload on refresh (GET routes).
- **Stage 3 (تجهيز المحتوى):** Calls `/api/strategy/text-assist` (OpenAI text provider) → transient (not persisted; gap documented).
- **Stage 4 (المواصفات الإبداعية):** Calls `generateImagePromptSpecs()` + `generateVideoScriptSpecs()` → persists to `campaign_image_prompt_specs` / `campaign_video_script_specs`. Both reload on refresh.
- **Missing-key:** All POST routes return 503 + `source: "unavailable"` + draft body. No mock output shown as success.
- **All outputs draft-only.** No approval, no publish, no status change, no budget change via AI.
- **Role guards:** Editor+ to generate; viewer read-only. Workspace scoping enforced on all routes.
- **Audit log:** All generation events recorded with `source: "real" | "mock"`.

See `docs/real_ai_workflow_runtime_persistence_report.md` for full details.

To activate real AI: add `OPENAI_API_KEY` to Replit Secrets + set `AI_PROVIDER=openai` in shared env vars.

## Phase 2 AI Provider Layer (completed)

- **`artifacts/api-server/src/lib/ai-provider.ts`** — `AIProvider` interface, `MockAIProvider`, `OpenAIProvider` (reads `OPENAI_API_KEY` server-side only), `getAIProvider()` factory with two-layer graceful fallback
- **Provider selection:** `AI_PROVIDER` env var (`"mock"` default, `"openai"` to activate). Falls back to mock silently if key missing or API call fails.
- **Brand-safe generation:** all 6 brand profile fields (brandName, toneOfVoice, targetAudience, forbiddenClaims, preferredChannels, visualNotes) fed into both mock templates and OpenAI system prompt
- **Guardrails:** hard-banned phrase list (guaranteed sales, instant results, etc.) + workspace-level forbidden claims filter applied pre- and post-generation
- **Metadata:** `generated_assets` table now has `ai_provider`, `ai_model`, `prompt_version`, `ai_fallback_used` columns
- **Audit log:** every `content_generated` entry records provider, model, prompt version, fallback status, campaignId, workspaceId, actor
- **No API key in frontend:** `OPENAI_API_KEY` is server-side only — confirmed zero frontend references
- **Prompt version:** `v1.0` — increment in `ai-provider.ts` when prompt changes materially

To activate OpenAI: add `OPENAI_API_KEY` to Replit Secrets + set `AI_PROVIDER=openai` in shared env vars. No code changes required.

## Phase 1 UX/Product Improvements (completed)

- **Settings → Members tab**: Full team management UI — list members, invite by email, change roles, remove. Admin/owner only for mutations.
- **Dashboard recommendations**: `isRead` filtering (only unread shown), Dismiss button marks rec as read via PATCH endpoint.
- **Campaigns → New Campaign**: Removed confusing "Step 1 of 4" progress indicator.
- **Reports**: PDF export button using jsPDF + autoTable.
- **Production hardening**: Helmet security headers, express-rate-limit on auth routes, pino-http request logging, global ErrorBoundary in React.
- **Auto-trigger recommendations**: Approving a campaign automatically regenerates workspace recommendations.

## Safety & Governance

Backend guards reject any API requests that try to:
- Publish live ads (rejectRealOps guard in connections.ts)
- Change live budget
- Connect payment methods

A visible "MOCK MODE" warning banner is displayed throughout the UI. All publish actions include explicit "demo only" disclaimers.

## Future-Ready Architecture

The connector architecture (`connections.ts`) is designed so real API integrations can be added later by replacing mock logic with actual OAuth + platform API calls.

See `references/pnpm-workspace` for workspace structure and TypeScript setup.
