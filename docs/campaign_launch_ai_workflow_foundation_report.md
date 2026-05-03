# Campaign Launch AI Workflow Foundation Report

## Changed files

### Backend
- `lib/db/src/schema/campaignWorkflowIntakes.ts` — new table
- `lib/db/src/schema/campaignStrategyBriefs.ts` — new table
- `lib/db/src/schema/campaignCreativeBriefs.ts` — new table
- `lib/db/src/schema/campaignImagePromptSpecs.ts` — new table
- `lib/db/src/schema/campaignVideoScriptSpecs.ts` — new table
- `lib/db/src/schema/index.ts` — exports new tables
- `artifacts/api-server/src/routes/campaignWorkflow.ts` — new route file
- `artifacts/api-server/src/routes/index.ts` — registers campaignWorkflowRouter

### Frontend
- `artifacts/marketing-os/src/pages/campaign-workflow-tab.tsx` — new component file
- `artifacts/marketing-os/src/pages/campaign-detail.tsx` — wires in workflow tab and status panel

## Workflow implemented

7-step campaign launch cockpit, all inside existing Campaign Detail as a new "AI Workflow" tab:

### Step 1 — Client Intake
- Form fields: business/product description, campaign objective, target audience, offer/value proposition, brand tone, landing URL, constraints/forbidden claims, available creative assets, missing information.
- Saved server-side to `campaign_workflow_intakes` table.
- GET/POST `/api/campaign-workflow/intake`.
- Viewers cannot save.

### Step 2 — Strategy Brief
- AI-generated draft from campaign context + intake data.
- Output: objective, target audience, positioning, key message, recommended channels, content angles, CTA direction, required assets, missing context warnings, risks/safety notes.
- Saved server-side to `campaign_strategy_briefs` table.
- POST `/api/campaign-workflow/strategy-brief`.
- GET `/api/campaign-workflow/strategy-brief`.

### Step 3 — Creative Brief
- Generated from campaign + strategy brief context.
- Output: core message, audience, tone, text direction, visual direction, video direction, channel adaptations, usage rights reminders, prohibited elements.
- Saved server-side to `campaign_creative_briefs` table.
- POST/GET `/api/campaign-workflow/creative-brief`.
- Not auto-approved.

### Step 4 — Text Suggestions
- Reuses existing `POST /api/strategy/text-assist`.
- Output: hooks, ad copy variants, captions, CTAs, improvement notes, missing context warnings, safety notes.

### Step 5 — Image Prompt Specs
- Generates prompt text and specs only. No images generated.
- Output: image prompts, composition notes, style direction, product/scene notes, channel format notes, usage rights reminders.
- Saved to `campaign_image_prompt_specs` table.
- POST/GET `/api/campaign-workflow/image-prompt-specs`.

### Step 6 — Video Script / Storyboard Specs
- Generates script and storyboard text only. No video generated.
- Output: video concept, short script, storyboard outline, scene list, voiceover draft, caption draft, platform/aspect ratio notes.
- Saved to `campaign_video_script_specs` table.
- POST/GET `/api/campaign-workflow/video-script-specs`.

## Customer Profile output (from Intake)
- businessDescription, campaignObjective, targetAudience, offerValueProposition, brandTone, selectedChannels, landingUrl, constraintsForbiddenClaims, availableCreativeAssets, missingInformation.

## Strategy brief output fields
- objective, targetAudience, positioning, keyMessage, recommendedChannels[], contentAngles[], ctaDirection, requiredAssets[], missingContextWarnings[], risksSafetyNotes[].

## Creative brief output fields
- coreMessage, audience, tone, textDirection, visualDirection, videoDirection, channelAdaptations[], usageRightsReminders[], prohibitedElements[].

## Text suggestions integration
- Reuses `POST /api/strategy/text-assist` — no duplication.
- Output: hooks[], adCopyVariants[], captions[], ctas[], improvementNotes[], missingContextWarnings[], safetyNotes[].

## Image prompt specs
- imagePrompts[], compositionNotes, styleDirection, productSceneNotes, channelFormatNotes[], usageRightsReminders[].
- No image generation. No upload. Specs only.

## Video script / storyboard specs
- videoConcept, shortScript, storyboardOutline, sceneList[], voiceoverDraft, captionDraft, platformAspectRatioNotes[].
- No video generation. No upload. Specs only.

## Server-side AI usage
- All AI generation calls happen server-side only.
- Routes use `getAITextAssistProvider()` from `ai-provider.ts`.
- Mock fallback is used in dev/test; production mock-as-success is blocked.
- Missing key returns `AI_UNAVAILABLE` code with safe draft fallback.

## API key safety
- `OPENAI_API_KEY` read only from `process.env.OPENAI_API_KEY` server-side.
- No key in frontend code.
- No frontend AI provider call.
- No key logged.

## Role restrictions
- All POST routes require `editor` role or above via `requireWorkspaceEditor()`.
- All GET routes allow any workspace role (viewer can read).
- Viewer cannot trigger AI generation from the UI (buttons disabled).
- Viewer can view previously generated drafts.
- No action changes campaign readiness, assets, approval, or publish state.

## Workspace scoping preservation
- All routes verify `campaign.workspaceId === workspaceId` before processing.
- `resolveEditorCampaign` and `resolveAnyRoleCampaign` helpers enforce scoping on every route.

## Campaign Completion preservation
- Campaign Completion panel untouched.
- Readiness score untouched.
- Missing requirements list untouched.
- Publish checklist untouched.
- Handler-level manual publish guard untouched.
- Viewer restrictions on publish/approve/mark-ready untouched.
- `WorkflowStatusPanel` added to Campaign Completion card to show AI workflow step progress.

## Governance
AI outputs cannot:
- approve content
- approve assets
- mark campaign ready
- publish
- modify budget
- update assets
- change readiness state
- bypass manual publish guards
- bypass role guards
- bypass workspace scoping

All AI outputs are marked as draft-only. Every step renders a DraftBanner UI component.

## Verification results

### TypeScript
- `pnpm --filter @workspace/api-server run build` — passed (zero errors)
- `pnpm --filter @workspace/marketing-os exec tsc --noEmit` — passed (zero errors)

### Frontend build
- Exact command: `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/marketing-os run build`
- `PORT` was required by the Vite config.
- Result: passed

### Security
- No API key in frontend code — verified by inspection.
- No frontend AI provider call — all calls go through fetch to `/api/…` routes.
- No image generation.
- No video generation.
- No upload.
- No live publishing.
- No new standalone pages — all new UI is inside the existing Campaign Detail "AI Workflow" tab.
- No broad OpenAPI/generated client changes.

## Remaining gaps
- Text Suggestions step does not persist result server-side (uses in-memory state only via existing text-assist route).
- Strategy/creative brief generation uses mock generator regardless of `AI_PROVIDER=openai` setting — OpenAI prompt integration for these steps is a follow-up task.
- No retry/backoff for any workflow step.
- Intake form does not pre-populate channel multi-select from campaign channels.

## Readiness decision
- Campaign Launch AI Workflow Foundation: ready.
- All six steps are functional, role-guarded, draft-only, and workspace-scoped.
- No governance constraints were weakened.
- Remaining gaps are noted above and do not block current workflow usage.
