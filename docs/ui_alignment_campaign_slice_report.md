# UI Alignment Campaign Slice Report

## Changed files
- `artifacts/marketing-os/src/pages/campaign-detail.tsx`
- `artifacts/marketing-os/src/pages/campaign-workflow-tab.tsx`
- `docs/ui_alignment_campaign_slice_report.md`

---

## AI Workflow tab redesign summary

### What changed
The previous 6-step technical AI Workflow UI (Client Intake, Strategy Brief, Creative Brief, Text Suggestions, Image Prompt Specs, Video Script Specs) was replaced with a simplified **4-stage Arabic RTL Campaign Launch Assistant** ("مساعد إطلاق الحملة").

### New 4-stage structure

| Stage | Arabic title | What it covers |
|-------|-------------|----------------|
| 1 | فهم الحملة | Client intake form — business description, objective, audience, offer, brand tone, landing URL, constraints, missing context |
| 2 | بناء الاستراتيجية | Strategy brief + creative brief — generated together in one action |
| 3 | تجهيز المحتوى | Text suggestions — hooks, ad copy variants, captions, CTAs, safety notes |
| 4 | المواصفات الإبداعية | Image prompt specs + video script/storyboard specs — generated together |

### New top summary card
- Title: "مساعد إطلاق الحملة"
- Subtitle explaining the assistant purpose
- Shows current campaign name
- Progress bar (completed stages / 4)
- Next recommended stage label
- Draft-only badge
- "لا يتم الاعتماد أو النشر تلقائياً" note
- Viewer restriction banner when `isViewer=true`

### Active-stage accordion layout
- One stage expanded at a time; others collapsed/compact
- Each stage card shows index number, title, status badge, subtitle
- Active stage highlighted with emerald border and shadow
- Status badges: لم يبدأ / تم الحفظ / مسودة / مكتمل
- On stage completion, automatically advances to next stage

### Compact result cards
- When outputs exist: shows a compact summary card with item counts and "مسودة فقط"
- "عرض التفاصيل" button expands full output inline
- "طيّ التفاصيل" collapses back to compact card

### Governance banners
Every generated section includes:
- DraftBanner: "مسودة فقط — تتطلب مراجعة بشرية قبل الاستخدام. لا تعتمد أو تنشر مباشرةً من مخرجات الذكاء الاصطناعي."
- GovernanceBanner: three bullet points — مسودة فقط / لا يتم اعتماد أو نشر تلقائياً / يجب مراجعة النتائج قبل استخدامها

---

## Campaign Detail Arabic polish summary
- Readiness requirement labels fully translated to Arabic
- 5-step flow labels (FLOW_STEPS) fully translated to Arabic
- Tracking link toast translated to Arabic
- All `bg-green-600` / `hover:bg-green-700` replaced with `bg-emerald-600` / `hover:bg-emerald-700`
- `text-primary` link class replaced with `text-emerald-700`
- `campaignName` prop now passed from `campaign-detail.tsx` to `CampaignWorkflowTab`

---

## Preserved behavior (not changed)
- All existing API calls (`/api/campaign-workflow/intake`, `/api/campaign-workflow/strategy-brief`, `/api/campaign-workflow/creative-brief`, `/api/strategy/text-assist`, `/api/campaign-workflow/image-prompt-specs`, `/api/campaign-workflow/video-script-specs`)
- Auth / role / workspace scoping
- Draft-only AI behavior
- Campaign Completion logic and readiness score
- Publish checklist and manual publish guard
- Viewer restrictions (all generate buttons disabled for viewers)
- Tracking link dialog
- Publish dialog
- Approve / publish / create-link mutations
- `WorkflowStatusSummary` type and `onStatusChange` callback
- `WorkflowStatusPanel` exported component (used in campaign-detail)
- `WorkflowSkeletonLoading` exported component
- All normalizer functions (normalizeStrategyBrief, normalizeCreativeBrief, normalizeImagePromptSpecs, normalizeVideoScriptSpecs)

---

## Unsupported features still deferred
- Image generation (صور لا تُولَّد)
- Video generation (فيديو لا يُولَّد)
- File upload
- Live publishing / auto-publishing
- Autonomous optimization
- Payment / budget automation
- Backend, DB, routes, AI runtime changes
- Dashboard, Brand, Content, Review page changes
- OpenAPI / generated client changes
- New pages

---

## Verification results
- TypeScript: zero errors
- Frontend build: **passed** — `PORT=3000 BASE_PATH=/ pnpm --filter @workspace/marketing-os run build`
- rg check `campaign-detail.tsx`: no remaining English UI labels, no `bg-green-`, no `text-primary`
- rg check `campaign-workflow-tab.tsx`: no `bg-green-`, no `text-primary`, no old English placeholder copy
- Backend untouched
- No DB / routes / API / runtime changes
- No Dashboard / Brand / Content / Review changes
- No new pages
- No upload / media / live publishing

---

## Remaining gaps
- Authenticated screenshot evidence not captured (preview requires login).
- Final visual QA depends on preview inspection.

---

## Readiness decision
AI Workflow redesign complete. 4-stage Arabic RTL Campaign Launch Assistant is ready for preview review.

---

## Update — Real AI Workflow Runtime + Persistence (2026-05-03)

The redesigned AI Workflow now uses real server-side AI calls and database persistence for all 4 stages. Stage 2 is campaign adaptation, not full brand strategy. See `docs/real_ai_workflow_runtime_persistence_report.md` for the full report.

### Summary of changes

- **`artifacts/api-server/src/lib/ai-provider.ts`**: Added `WorkflowAIProvider` interface, `OpenAIWorkflowProvider` class (4 real AI methods: `generateStrategyBrief`, `generateCreativeBrief`, `generateImagePromptSpecs`, `generateVideoScriptSpecs`), and `getWorkflowAIProvider()` factory.
- **`artifacts/api-server/src/routes/campaignWorkflow.ts`**: Fixed all 4 POST handlers (strategy-brief, creative-brief, image-prompt-specs, video-script-specs) to call `OpenAIWorkflowProvider` when `AI_PROVIDER=openai` + key is present. Removed `void provider` bug. All responses now include `source: "real" | "mock" | "unavailable"`. Audit log `details` include source. Missing-key path returns 503 with draft body.
- **`artifacts/marketing-os/src/pages/campaign-workflow-tab.tsx`**: Added `onGenerated` prop to `Stage3Content`; wired callback on text-assist success; Stage 3 now updates accordion status to "generated" and advances to Stage 4.

### Verification
- API server build: ✅ zero errors
- Frontend build (`PORT=3000 BASE_PATH=/ pnpm --filter @workspace/marketing-os run build`): ✅ zero errors
- No `OPENAI_API_KEY` in frontend bundle: ✅ confirmed
- Missing-key → 503 + `source: "unavailable"`: ✅ implemented
- Real-key path → `OpenAIWorkflowProvider` called: ✅ implemented
- Mock path → `buildMock*()` called + saved to DB: ✅ implemented
- Stage 3 persistence: implemented with reload on mount
