# AI Text Backend Runtime Verification Report

## 1. Changed files
- artifacts/api-server/src/lib/ai-provider.ts
- artifacts/api-server/src/routes/strategy.ts

## 2. Backend AI runtime
- Runtime location: `artifacts/api-server/src/lib/ai-provider.ts`
- Route: `POST /api/strategy/text-assist` in `artifacts/api-server/src/routes/strategy.ts`
- Provider reuse: yes. The route uses the existing server AI provider pattern via `getAITextAssistProvider()` and shares the same guardrail helpers and env selection pattern as the existing AI runtime.
- Output schema: structured JSON with
  - hooks
  - adCopyVariants
  - captions
  - ctas
  - improvementNotes
  - missingContextWarnings
  - safetyNotes

## 2b. Route security
- Auth guard: yes, the route uses `requireAuth`.
- Role guard: yes, the route requires `editor` or above via `getMemberRole()` + `hasMinRole(role, "editor")`.
- Workspace/campaign scoping: yes, the route loads the campaign by id and rejects requests when `campaign.workspaceId !== workspaceId`.
- Mock fallback behavior: mock is only used through the shared provider selector; the route blocks mock-as-success in production.
- Production missing-key behavior: if `OPENAI_API_KEY` is missing, the route returns a safe structured `AI_TEXT_UNAVAILABLE` response instead of crashing or pretending success.

## 3. API key safety
- `OPENAI_API_KEY` is read only from `process.env.OPENAI_API_KEY`
- no API key is hardcoded
- no API key is exposed to frontend code
- no frontend/browser AI provider call exists for this runtime
- no key is logged

## 4. Missing-key behavior
- The app does not crash when `OPENAI_API_KEY` is missing.
- The route returns a safe structured unavailable response with:
  - `error`
  - `code: AI_TEXT_UNAVAILABLE`
  - `output` containing empty arrays and safety warnings
- That response is usable by future UI because it preserves the final output shape.

## 5. Governance
The runtime cannot:
- approve content
- mark campaign ready
- publish
- modify budget
- update assets
- change readiness state
- bypass manual publish guards

## 6. Existing campaign completion
- Campaign Detail UI was not touched in this verification turn.
- Manual publish guard remains unchanged.
- Viewer restrictions remain unchanged.
- Campaign Completion Wiring remains unchanged.

## 7. Verification
- TypeScript diagnostics: no errors found for the edited backend files.
- API server build: passes.
- No OpenAPI/generated client changes were made.
- No image generation.
- No video generation.
- No upload.
- No live publishing.
- No new standalone pages.

## 8. Documentation
- This report exists at `docs/ai_text_backend_runtime_report.md`.
- It includes changed files, API key handling, missing-key behavior, output schema, governance, verification, remaining gaps, and readiness decision.

## Remaining gaps
- The text-assist route is backend-only and returns draft output; no UI consumes it yet.
- The unavailable response is intentionally conservative and can be expanded later if the UI needs richer fallback guidance.

## Readiness decision
- Backend runtime: ready.
- User-facing AI text workflow: not yet complete until a UI consumer is added.