# Marketing OS Lite

## Overview

A full-stack marketing campaign management platform (MVP) that helps small businesses plan, generate, approve, and monitor marketing campaigns across Instagram, Snapchat, YouTube, and X/Twitter — all from one dashboard.

**IMPORTANT:** This is a Lite MVP. All ad platform integrations are mock/simulated. No real ad budget is spent, no live ads are published, and no real APIs are connected.

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
- `/campaigns` — Campaign list + create/detail
- `/content-studio` — AI content generation (mock) + approval workflow
- `/tracking-links` — UTM link generator
- `/connections` — Mock ad platform connections (Instagram, Snapchat, YouTube, X)
- `/reports` — Performance reports + CSV export
- `/audit-log` — Searchable action history

### Backend (`artifacts/api-server/src/routes/`)

- `workspaces.ts` — CRUD for workspaces
- `brandProfiles.ts` — Brand profile management
- `campaigns.ts` — Campaign CRUD + approval + summary
- `assets.ts` — Mock content generation + channel variants
- `approvals.ts` — Approval decisions (approve/reject/request changes)
- `connections.ts` — Mock ad platform connections with safety guards against real API calls
- `trackingLinks.ts` — UTM tracking link generation
- `metrics.ts` — Daily metrics + dashboard aggregates + channel comparison
- `recommendations.ts` — Rules-based recommendation engine
- `auditLogs.ts` — Full audit log with search + pagination

### Database (`lib/db/src/schema/`)

Tables: `workspaces`, `brand_profiles`, `campaigns`, `generated_assets`, `channel_variants`, `approval_decisions`, `platform_connections`, `sync_jobs`, `tracking_links`, `ad_metrics_daily`, `recommendations`, `audit_logs`

### Seed Data

1 demo workspace, 1 brand profile, 3 campaigns, 4 mock platform connections, 30 days of mock metrics, 10 recommendations, 15 audit log entries.

## Safety & Governance

Backend guards reject any API requests that try to:
- Publish live ads
- Change live budget
- Connect payment methods

A visible "MOCK MODE" warning banner is displayed throughout the UI.

## Future-Ready Architecture

The connector architecture (`connections.ts`) is designed so real API integrations can be added later by replacing mock logic with actual OAuth + platform API calls.

See `references/pnpm-workspace` for workspace structure and TypeScript setup.
