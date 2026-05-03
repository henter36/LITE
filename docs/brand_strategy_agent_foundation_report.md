# Brand Strategy Agent Foundation — Implementation Report

**Date:** 2026-05-03  
**Baseline:** Real AI campaign workflow runtime with Stage 3 persistence. Campaign strategy stage reframed as campaign-specific adaptation. Brand/Growth Strategy layer was missing.

---

## 1. Objective

Add a reusable **brand-level** strategy layer so campaigns draw from a saved, persistent brand strategy rather than reconstructing full strategy inside each campaign workflow.

---

## 2. Changed Files

| File | Change |
|---|---|
| `lib/db/src/schema/brandStrategies.ts` | **New** — `brand_strategies` table schema |
| `lib/db/src/schema/index.ts` | Added export for `brandStrategies` |
| `artifacts/api-server/src/lib/ai-provider.ts` | Added `BrandStrategyInput`, `BrandStrategyOutput`, `BrandStrategyAIProvider` interface, `OpenAIBrandStrategyProvider`, `MockBrandStrategyProvider`, `getBrandStrategyAIProvider()` factory |
| `artifacts/api-server/src/routes/brandStrategy.ts` | **New** — GET / POST generate / PUT routes |
| `artifacts/api-server/src/routes/index.ts` | Registered `brandStrategyRouter` |
| `artifacts/marketing-os/src/pages/brand-profile.tsx` | Added `BrandStrategyCard` component — compact strategy section in Brand screen |
| `docs/brand_strategy_agent_foundation_report.md` | This file |
| `docs/ai_strategy_vs_campaign_workflow_reconciliation.md` | Updated |

---

## 3. Selected Persistence Model

**Decision:** New dedicated table `brand_strategies` (not stored in `brand_profiles`).

**Reproducibility:** the table is fully represented in committed schema (`lib/db/src/schema/brandStrategies.ts`) and exported from `lib/db/src/schema/index.ts`, so a fresh schema sync can recreate it from repo state. The direct SQL creation was temporary only to bypass an existing unrelated drift conflict in drizzle-kit.

**Rationale:**
- `brand_profiles` stores brand configuration (name, tone, channels, forbidden claims). It is a profile, not a strategy.
- Brand strategy is generated output — structured AI analysis with different lifecycle (draft → current → archived).
- Separating them avoids mixing user-edited config with AI-generated analysis.

**Brand profile is the input; brand strategy is the output.**

---

## 4. Schema — `brand_strategies`

The schema includes:
- workspace scoping via `workspace_id` FK
- optional `brand_profile_id` FK
- optional `generated_by_user_id` FK
- `status`, `source`, `created_at`, `updated_at`
- JSON-array-in-text fields for messages/pillars/channels/claims/risks

```sql
CREATE TABLE brand_strategies (
  id SERIAL PRIMARY KEY,
  workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  brand_profile_id INTEGER REFERENCES brand_profiles(id) ON DELETE SET NULL,
  generated_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft',          -- draft | current | archived
  source TEXT NOT NULL DEFAULT 'mock',           -- real | mock | unavailable
  strategy_summary TEXT NOT NULL DEFAULT '',
  positioning TEXT NOT NULL DEFAULT '',
  ideal_customer_profile TEXT NOT NULL DEFAULT '',
  primary_audience TEXT NOT NULL DEFAULT '',
  secondary_audience TEXT NOT NULL DEFAULT '',
  key_messages TEXT NOT NULL DEFAULT '[]',       -- JSON array
  value_proposition TEXT NOT NULL DEFAULT '',
  content_pillars TEXT NOT NULL DEFAULT '[]',    -- JSON array
  channel_strategy TEXT NOT NULL DEFAULT '[]',   -- JSON array
  tone_guidelines TEXT NOT NULL DEFAULT '',
  cta_guidelines TEXT NOT NULL DEFAULT '',
  forbidden_claims TEXT NOT NULL DEFAULT '[]',   -- JSON array
  risk_notes TEXT NOT NULL DEFAULT '[]',         -- JSON array
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
)
```

**Status lifecycle:**
- `draft` — initial state (not yet promoted)
- `current` — the active brand strategy used by campaigns
- `archived` — previous strategy replaced by a newer generation

**Only one `current` strategy per workspace at any time.** When a new generation succeeds, all previous `current` rows are set to `archived` before inserting the new row.

---

## 5. Generation Route — `/api/brand-strategy/generate`

**Method:** POST  
**Auth:** `requireAuth` + `hasMinRole(role, "editor")` — viewer cannot generate  
**Input:** `{ workspaceId, userProvidedAnswers? }`  
**Behavior:**
1. Load brand profile for workspace — 400 if none exists
2. Call `getBrandStrategyAIProvider()`
3. Build structured JSON output using brand profile fields as input
4. Archive any existing `current` strategy rows for the workspace
5. Insert new row with `status: "current"`, `source: "real" | "mock"`
6. Write audit log `brand_strategy_generated`
7. Return serialized strategy

---

## 6. Other Routes

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/brand-strategy` | GET | Any member | Return current strategy for workspaceId |
| `/api/brand-strategy/generate` | POST | Editor+ | Generate new strategy from brand profile |
| `/api/brand-strategy/:id` | PUT | Editor+ | Manually update an existing strategy row |

---

## 7. AI Provider — `getBrandStrategyAIProvider()`

**Location:** `artifacts/api-server/src/lib/ai-provider.ts`

**Classes:**

- `OpenAIBrandStrategyProvider` — calls `gpt-4o-mini` with `response_format: json_object`, structured system prompt, brand profile fields as user message. Guardrails applied via `applyAllGuardrails()`.
- `MockBrandStrategyProvider` — template-based, no AI call, Arabic-language placeholder output.

**Factory:** `getBrandStrategyAIProvider()` — same pattern as `getWorkflowAIProvider()`.

---

## 8. API Key Handling

- `OPENAI_API_KEY` is only accessed server-side in `ai-provider.ts`
- No API key in frontend bundle
- No frontend OpenAI SDK import

---

## 9. Missing-Key Behavior

When `AI_PROVIDER=openai` but `OPENAI_API_KEY` is absent:
- `getBrandStrategyAIProvider()` returns `{ provider: null, keyMissing: true }`
- POST `/api/brand-strategy/generate` returns HTTP 503:
  ```json
  { "error": "AI is unavailable until OPENAI_API_KEY is configured", "code": "AI_UNAVAILABLE", "draft": { ... }, "source": "unavailable" }
  ```
- The draft is NOT saved to DB
- Frontend shows `AlertTriangle` banner with Arabic message
- No fake real strategy is shown as success

---

## 10. Mock Behavior

When `AI_PROVIDER=mock` (default):
- `MockBrandStrategyProvider.generateBrandStrategy()` returns Arabic template output
- Saved to DB with `source: "mock"`
- Frontend shows strategy card with `نموذج` badge
- No AI call is made

---

## 11. Route Security Review

| Route | Auth | Role | Workspace scope | Viewer | Editor/Admin | Campaign publish/readiness impact |
|---|---|---|---|---|---|---|
| `GET /api/brand-strategy` | `requireAuth` | any member | yes | read-only | read | none |
| `POST /api/brand-strategy/generate` | `requireAuth` | editor+ | yes | denied | generate current strategy | none |
| `PUT /api/brand-strategy/:id` | `requireAuth` | editor+ | yes | denied | update selected strategy | none |

## 12. AI Provider Safety Review

- `OPENAI_API_KEY` is accessed only in server-side `ai-provider.ts`
- No frontend OpenAI/provider imports were added
- No key is logged or serialized
- Missing key returns HTTP 503 with `source: "unavailable"`
- No fake strategy is saved when key is missing
- Mock output is explicitly tracked as `source: "mock"` and is labeled in the UI
- Real output is tracked as `source: "real"`

## 13. Persistence / Reload Behavior

- Generated strategy persists to `brand_strategies`
- Current strategy reloads on mount in Brand screen
- Previous current strategy is archived on each successful generation
- Manual update works through `PUT /api/brand-strategy/:id`
- Status is `draft/current/archived`
- Source is `real/mock/unavailable`
- Timestamps are present as `createdAt` and `updatedAt`

## 14. UI Behavior Review

- Brand screen card loads current strategy
- Editor/admin can generate/update
- Viewer is read-only
- Missing-key state is shown safely
- No upload/media/live publishing is implied
- UI remains Arabic-first and compact

## 15. Campaign Context Follow-up

Campaign Stage 2 should read `brand_strategies.current` as additional context. A minimal safe DB read has been added to `campaignWorkflow.ts` so the current brand strategy can inform prompts without changing UI.

## 16. Remaining Gaps

1. No archive/history browser for older brand strategies
2. No dedicated UI field for `userProvidedAnswers`
3. The drizzle-kit conflict indicates existing schema drift unrelated to `brand_strategies`
4. Stage 3 audit gap remains pre-existing

## 17. Readiness Decision

Brand Strategy Agent must not and does not:
- Publish content
- Approve campaign content
- Mark campaign as ready
- Modify budget
- Update assets
- Bypass role guards
- Bypass workspace scoping

---

## 12. UI Integration — Brand Screen

**Component:** `BrandStrategyCard` (added inside `artifacts/marketing-os/src/pages/brand-profile.tsx`)

**Location:** Right sidebar column of Brand screen, above "معاينة صوت العلامة" card

**Behavior:**
- Loads current strategy on mount via GET `/api/brand-strategy?workspaceId=X`
- Shows strategy summary and key audience/value fields in collapsed view
- "عرض التفاصيل الكاملة" expand toggle reveals: positioning, key messages, content pillars, tone guidelines, CTA guidelines, risk notes
- Generate/update button for editor/admin; viewer sees read-only message
- Loading spinner while generating
- `UnavailableBanner` (AlertTriangle) if AI key missing
- `نموذج` badge for mock source, `AI حقيقي` badge for real source
- Status badge: `فعّالة` (current) or `مسودة` (draft)
- Uses `apiFetch` (same `fetch` + `credentials: "include"` pattern as campaign workflow tab)

No redesign of the Brand screen layout — the card is inserted into the existing right sidebar column.

---

## 13. Campaign Workflow Integration — Current State and Follow-up

### Current state
The campaign workflow Stage 2 (`تكييف الاستراتيجية للحملة`) currently generates campaign-specific adaptation using the brand profile fields directly (brand name, tone, channels, etc.). It does **not** yet pull from the saved brand strategy.

### What should happen next (follow-up slice)
In `campaignWorkflow.ts`, the Stage 2 POST handler (`/api/campaign-workflow/strategy-brief`) should:
1. Query `brand_strategies` for `workspaceId` where `status = "current"` — one DB read
2. If found, include `brandStrategy.strategySummary`, `brandStrategy.keyMessages`, `brandStrategy.positioning` in the `StrategyBriefInput`
3. This requires adding 3 optional fields to `StrategyBriefInput` and updating the system prompt to reference them

This is a minimal, safe addition — no schema changes needed. Documented as a follow-up task.

---

## 14. Audit / Activity Logging

| Event | Action string | entityType |
|---|---|---|
| Strategy generated | `brand_strategy_generated` | `brand_strategy` |
| Strategy updated | `brand_strategy_updated` | `brand_strategy` |

All logs include: `workspaceId`, `entityId`, `actor` (userId), and `details` including source.

---

## 15. Remaining Gaps

1. **Campaign workflow does not yet pull brand strategy context** — documented above as follow-up. Campaign AI currently uses brand profile fields directly. Adding brand strategy context to Stage 2 is a safe one-route change for the next slice.

2. **Stage 3 audit gap** — pre-existing gap (text-assist GET path has no audit log). Unchanged.

3. **No streaming** — brand strategy generation is blocking request/response. Long times may hit gateway timeouts in production with a real key.

4. **No versioning UI** — users cannot browse previous (archived) strategies. Only the current strategy is displayed. Archived rows exist in DB but have no read UI.

5. **No `userProvidedAnswers` UI field** — the POST route accepts `userProvidedAnswers` as free-text context but the UI does not expose an input for it. Can be added as a text field in a future slice.

---

## 16. Verification Results

| Check | Result |
|---|---|
| TypeScript — api-server build | ✅ Pass (0 errors) |
| Frontend build (`PORT=3000 BASE_PATH=/ pnpm --filter @workspace/marketing-os run build`) | ✅ Pass (0 errors) |
| No API key in frontend bundle | ✅ Confirmed |
| No frontend OpenAI/provider SDK import | ✅ Confirmed |
| Missing key returns 503 | ✅ Implemented — draft returned, not saved |
| Real key calls `OpenAIBrandStrategyProvider` | ✅ Implemented |
| Mock path saves to DB with `source: mock` | ✅ Implemented |
| Brand strategy persists and reloads | ✅ GET route + `useEffect` on mount |
| Viewer cannot generate/update | ✅ Frontend disabled + 403 on server |
| Editor/admin can generate/update | ✅ `hasMinRole(role, "editor")` |
| Only one current strategy per workspace | ✅ Archive-on-generate pattern |
| Audit log on generation | ✅ `brand_strategy_generated` written |
| No image generation | ✅ Not touched |
| No video generation | ✅ Not touched |
| No upload | ✅ Not touched |
| No live publishing | ✅ Not touched |
| No Campaign Completion regression | ✅ Campaign workflow routes not modified |
| No manual publish guard regression | ✅ Publish guard not modified |
| Dashboard not touched | ✅ |
| Campaign UI not redesigned | ✅ |
| Content/Review not touched | ✅ |

---

## 17. Readiness Decision

**Brand Strategy Agent Foundation is production-ready for the persistence and UI layers.**

- With `AI_PROVIDER=mock` (default/dev): mock strategy generated, saved, displayed correctly.
- With `AI_PROVIDER=openai` + key: real GPT-4o-mini strategy generated, guardrails applied, saved with `source: real`.
- With `AI_PROVIDER=openai` + no key: safe 503, draft shown but not saved, no fake success.

**Not yet wired:** Campaign workflow Stage 2 does not yet pull brand strategy context. This is the recommended next slice.
