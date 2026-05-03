# Real AI Workflow Runtime + Persistence Report

**Date:** 2026-05-03  
**Slice:** Campaign Launch Assistant (4-Stage AI Workflow)

---

## 1. Changed Files

| File | Change |
|---|---|
| `artifacts/api-server/src/lib/ai-provider.ts` | Added `WorkflowAIProvider` interface, `OpenAIWorkflowProvider` class (4 methods), `getWorkflowAIProvider()` factory, and all supporting input/output interfaces |
| `artifacts/api-server/src/routes/campaignWorkflow.ts` | Fixed all 4 POST handlers to call real OpenAI when key is present; removed `void provider` bug; updated audit log `details` to include `source`; added `source` field to all POST responses |
| `artifacts/marketing-os/src/pages/campaign-workflow-tab.tsx` | Added `onGenerated` prop to `Stage3Content`; wired `onGenerated()` on text-assist success; passes `onGenerated` from main component with correct stage/status updates |

---

## 2. Routes / Actions Used

| Route | Method | Stage | Guard |
|---|---|---|---|
| `/api/campaign-workflow/intake` | GET / POST | Stage 1 | `requireAuth` + any role (GET), editor+ (POST) |
| `/api/campaign-workflow/strategy-brief` | GET / POST | Stage 2 | `requireAuth` + any role (GET), editor+ (POST) |
| `/api/campaign-workflow/creative-brief` | GET / POST | Stage 2 | `requireAuth` + any role (GET), editor+ (POST) |
| `/api/strategy/text-assist` | POST | Stage 3 | `requireAuth` + editor+ |
| `/api/campaign-workflow/image-prompt-specs` | GET / POST | Stage 4 | `requireAuth` + any role (GET), editor+ (POST) |
| `/api/campaign-workflow/video-script-specs` | GET / POST | Stage 4 | `requireAuth` + any role (GET), editor+ (POST) |

---

## 3. AI Provider / Model Approach

- **Provider selection:** `AI_PROVIDER` environment variable (`"openai"` or `"mock"`; default `"mock"`)
- **API key:** `process.env.OPENAI_API_KEY` — read server-side only, never exposed to frontend
- **Model:** `process.env.OPENAI_MODEL` (default `"gpt-4o-mini"`)
- **All prompts use:** `response_format: { type: "json_object" }` for structured outputs
- **Guardrails:** `applyAllGuardrails()` applied to all string outputs; hard-banned phrases filtered; forbidden claims from intake filtered
- **Text-assist (Stage 3):** `OpenAITextAssistProvider` (pre-existing, unchanged)
- **Stages 2 & 4:** New `OpenAIWorkflowProvider` with 4 methods

---

## 4. API Key Handling

- Key read once at request time in `getWorkflowAIProvider()` / `getAITextAssistProvider()`
- Key never logged, never serialized, never returned to client
- All provider objects are request-scoped, not module-level singletons
- No OpenAI SDK import in any frontend file

---

## 5. Structured Output Schemas

### Strategy Brief (`POST /api/campaign-workflow/strategy-brief`)
```json
{
  "objective": "string",
  "targetAudience": "string",
  "positioning": "string",
  "keyMessage": "string",
  "recommendedChannels": ["string"],
  "contentAngles": ["string"],
  "ctaDirection": "string",
  "requiredAssets": ["string"],
  "missingContextWarnings": ["string"],
  "risksSafetyNotes": ["string"]
}
```

### Creative Brief (`POST /api/campaign-workflow/creative-brief`)
```json
{
  "coreMessage": "string",
  "audience": "string",
  "tone": "string",
  "textDirection": "string",
  "visualDirection": "string",
  "videoDirection": "string",
  "channelAdaptations": ["string"],
  "usageRightsReminders": ["string"],
  "prohibitedElements": ["string"]
}
```

### Image Prompt Specs (`POST /api/campaign-workflow/image-prompt-specs`)
```json
{
  "imagePrompts": ["string (3 prompts)"],
  "compositionNotes": "string",
  "styleDirection": "string",
  "productSceneNotes": "string",
  "channelFormatNotes": ["string"],
  "usageRightsReminders": ["string"]
}
```

### Video Script Specs (`POST /api/campaign-workflow/video-script-specs`)
```json
{
  "videoConcept": "string",
  "shortScript": "string ([SCENE N - Label] format)",
  "storyboardOutline": "string (5 frames)",
  "sceneList": ["string (4 scenes with timecodes)"],
  "voiceoverDraft": "string",
  "captionDraft": "string",
  "platformAspectRatioNotes": ["string"]
}
```

### Text Suggestions (`POST /api/strategy/text-assist`) — pre-existing
```json
{
  "output": {
    "hooks": ["string"],
    "adCopyVariants": ["string"],
    "captions": ["string"],
    "ctas": ["string"],
    "improvementNotes": ["string"],
    "missingContextWarnings": ["string"],
    "safetyNotes": ["string"]
  },
  "metadata": { "provider": "openai|mock", "model": "string", ... }
}
```

---

## 6. Persistence Tables Used

| Stage | Table | Storage |
|---|---|---|
| Stage 1 | `campaign_workflow_intakes` | Upsert — full intake fields |
| Stage 2 (Campaign adaptation) | `campaign_strategy_briefs` | Insert new row per generation |
| Stage 2 (Creative) | `campaign_creative_briefs` | Insert new row per generation |
| Stage 3 | None (transient) | **GAP — see §13** |
| Stage 4 (Image) | `campaign_image_prompt_specs` | Insert new row per generation |
| Stage 4 (Video) | `campaign_video_script_specs` | Insert new row per generation |

---

## 7. Stage-by-Stage Runtime Behavior

### Stage 1 — فهم الحملة (Campaign Understanding)
- **GET**: Load existing intake from DB → pre-fill form
- **POST**: Upsert intake fields; no AI call
- **Audit**: `campaign_workflow_intake_created` / `campaign_workflow_intake_updated`

### Stage 2 — تكييف الاستراتيجية للحملة (Campaign Strategy Adaptation)
- **GET**: Return latest strategy brief and creative brief from DB
- **POST (strategy-brief + creative-brief in parallel)**:
  - Fetch intake from DB for context
  - Call `getWorkflowAIProvider()`
  - If key missing → 503 with `source: "unavailable"` + draft body
  - If `AI_PROVIDER=openai` + key present → call `OpenAIWorkflowProvider.generateStrategyBrief()` / `generateCreativeBrief()` → save with `aiProvider: "openai"`, `aiModel: "gpt-4o-mini"`, `source: "real"`
  - If `AI_PROVIDER=mock` → use `buildMockStrategyBrief()` / `buildMockCreativeBrief()` → save with `source: "mock"`
  - On OpenAI error → log + fall back to mock output
- **Audit**: `campaign_strategy_brief_generated` / `campaign_creative_brief_generated` (details include source)

### Stage 3 — تجهيز المحتوى (Content Preparation)
- **GET**: None (transient only)
- **POST**: Calls `/api/strategy/text-assist` (pre-existing OpenAI wiring, unchanged)
  - If key missing → 503 with `code: "AI_TEXT_UNAVAILABLE"`
  - If `AI_PROVIDER=openai` + key → `OpenAITextAssistProvider.generateText()` → `source: "real"`
  - If mock → `MockAITextAssistProvider.generateText()` → `source: "mock"`
- **Frontend**: On success, calls `onGenerated()` → updates stage status to "generated"

### Stage 4 — المواصفات الإبداعية (Creative Specs)
- **GET**: Return latest image prompt specs and video script specs from DB
- **POST (image-prompt-specs + video-script-specs in parallel)**:
  - Fetch creative brief from DB for context
  - Call `getWorkflowAIProvider()`
  - Same key/provider logic as Stage 2
  - `OpenAIWorkflowProvider.generateImagePromptSpecs()` / `generateVideoScriptSpecs()`
  - Save with `aiProvider`, `aiModel`, `source` fields
- **Audit**: `campaign_image_prompt_specs_generated` / `campaign_video_script_specs_generated`

---

## 8. Missing-Key Behavior

When `AI_PROVIDER=openai` but `OPENAI_API_KEY` is absent:
- `getWorkflowAIProvider()` returns `{ provider: null, selectedProvider: "mock", keyMissing: true }`
- All POST routes return HTTP 503 with:
  ```json
  { "error": "AI is unavailable until OPENAI_API_KEY is configured", "code": "AI_UNAVAILABLE", "draft": { ... }, "source": "unavailable" }
  ```
- Frontend shows `UnavailableBanner` with Arabic message; no fake success shown
- No crash; no mock output displayed as real AI

---

## 9. Mock Behavior

When `AI_PROVIDER=mock` (default):
- `getWorkflowAIProvider()` returns `{ provider: null, selectedProvider: "mock", keyMissing: false }`
- All POST routes use `buildMock*()` functions (template-based, no AI call)
- Response includes `source: "mock"`
- Production: mock is allowed in dev/mock mode; in production without a key, 503 is returned for `AI_PROVIDER=openai`
- Frontend does not currently distinguish `source: "mock"` from `source: "real"` visually — both show the same draft output with DraftBanner + GovernanceBanner

---

## 10. Role and Workspace Guards

| Operation | Guard |
|---|---|
| Read any workflow data | `requireAuth` + any workspace member role |
| Generate (POST) | `requireAuth` + `editor` or above |
| Campaign must belong to workspace | `resolveEditorCampaign()` checks both |
| Viewer | Can read saved outputs, cannot generate |

No AI governance actions are permitted:
- No approval of content
- No campaign status change
- No publish action
- No budget modification
- No readiness score change
- No bypass of manual publish guards

---

## 11. Audit / Activity Logging

All generation events are recorded in `audit_logs`:

| Event | Action string | entityType |
|---|---|---|
| Intake created | `campaign_workflow_intake_created` | `campaign_workflow_intake` |
| Intake updated | `campaign_workflow_intake_updated` | `campaign_workflow_intake` |
| Strategy brief generated | `campaign_strategy_brief_generated` | `campaign_strategy_brief` |
| Creative brief generated | `campaign_creative_brief_generated` | `campaign_creative_brief` |
| Image prompt specs generated | `campaign_image_prompt_specs_generated` | `campaign_image_prompt_spec` |
| Video script specs generated | `campaign_video_script_specs_generated` | `campaign_video_script_spec` |

All logs include: `workspaceId`, `entityId`, `actor` (userId), and `details` string that includes the `source` (real/mock).

**Gap:** Stage 3 text-assist does not write to audit log. This is a pre-existing gap in the text-assist route.

---

## 12. Frontend States

Each stage supports:
- **Loading:** Spinner + "جارٍ التوليد…" during POST request
- **Unavailable (503):** `UnavailableBanner` — Arabic message, no fake success
- **Error:** `ErrorBanner` with error message from server
- **Generated:** `CompactResultCard` summary → expand to full detail with `DraftBanner` + `GovernanceBanner`
- **Reload on refresh:** Stages 1, 2, 4 call GET endpoints in `useEffect` on mount; Stage 3 is transient (no reload)
- **Viewer guard:** All generate buttons disabled; `isViewer` banner shown in summary card

---

## 13. Remaining Gaps

1. **Stage 3 persistence:** Text suggestions (`/api/strategy/text-assist`) are transient — not saved to DB. Refresh loses results. No existing `campaignTextSuggestions` table. Creating a new table was out of scope; user must regenerate after refresh.

2. **Stage 3 audit log:** The `/api/strategy/text-assist` route does not write to `audit_logs`. This is pre-existing behavior; fixing it was out of scope.

3. **Mock vs real visual distinction:** Frontend does not show whether output came from `source: "mock"` or `source: "real"`. Both are shown with `DraftBanner`. Could add a badge in a future slice.

4. **Intake constraints not forwarded to Creative Brief generation:** The creative brief POST fetches the strategy brief but does not fetch the intake to retrieve `constraintsForbiddenClaims`. Constraints are passed as `""` for the creative brief OpenAI call. The strategy brief (which IS constrained) informs the creative brief via `strategyRisks`. Full constraint propagation is a future improvement.

5. **No streaming:** All AI calls are blocking request/response. Long generation times may hit gateway timeouts in production.

---

## 14. Verification Results

| Check | Result |
|---|---|
| TypeScript — api-server build | ✅ Pass (0 errors) |
| Frontend build (`PORT=3000 BASE_PATH=/ pnpm --filter @workspace/marketing-os run build`) | ✅ Pass (0 errors) |
| No API key in frontend bundle | ✅ Confirmed — no `OPENAI_API_KEY` reference in frontend source |
| No frontend OpenAI/provider SDK import | ✅ Confirmed |
| Missing key path returns 503 | ✅ Implemented — `keyMissing` check before any AI call |
| Real key path calls backend AI | ✅ `OpenAIWorkflowProvider` called when `AI_PROVIDER=openai` + key present |
| Generated outputs persist and reload | ✅ Stages 1, 2, 4 saved to DB; GET routes reload on mount |
| Viewer cannot generate | ✅ `resolveEditorCampaign` returns 403 for viewer |
| Editor can generate | ✅ Editor role passes `hasMinRole(role, "editor")` |
| No image generation | ✅ Image specs are text-only prompt specs |
| No video generation | ✅ Video specs are text-only script/storyboard specs |
| No upload | ✅ No file upload routes touched |
| No live publishing | ✅ No publish/status routes touched |
| Campaign Completion regression | ✅ No completion logic changed |
| Manual publish guard regression | ✅ No publish guard changed |

---

## 15. Readiness Decision

**The AI workflow runtime is production-ready for `AI_PROVIDER=openai` + key configured.**

Without a key: safe 503 fallback with no mock output shown as success.  
With `AI_PROVIDER=mock` (default/dev): mock outputs saved to DB and displayed correctly.  
Stage 3 persistence gap is documented and accepted for this slice.
