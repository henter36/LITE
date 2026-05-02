# Marketing OS Lite — Feature Completion Roadmap

**Date:** 2026-05-02
**Based on:** Full codebase inspection — all routes, all pages, all DB schema, all middleware
**TypeScript status:** 0 errors
**Scope:** Controlled customer demo → pilot → first paying user

---

## 1. Implemented Capabilities

Everything below is confirmed **working end-to-end** in the current build. Each item cites where the implementation lives.

### Auth
**Status: Complete**
Session-based authentication using `express-session` + bcrypt. Routes: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`. Passwords hashed. Session secret loaded from `SESSION_SECRET` environment variable. Frontend `AuthContext` stores user, role, and active workspace. `ProtectedRoute` component guards all non-login pages.

### Workspace Isolation
**Status: Complete**
Every database table scoped by `workspaceId`. All API routes enforce workspace membership via `requireWorkspaceAccess` middleware before serving data. A user in Workspace A cannot read or modify data belonging to Workspace B. Multi-workspace in DB (a user can belong to multiple workspaces with different roles in each).

### Roles
**Status: Backend complete — frontend blind**
Role hierarchy `viewer < editor < admin < owner` enforced on every sensitive route via `requireWorkspaceRole(minRole)` middleware (`artifacts/api-server/src/middleware/auth.ts`). Content generation requires `editor+`, member management requires `admin+`, approve campaign requires `editor+`. The role system is real and enforced. **Gap: the frontend does not read user.role for UI adaptation (see §2).**

### Campaign Creation
**Status: Complete**
10-field creation form persisted to DB: name, objective, productService, audience, geography, budgetSuggestion, landingUrl, startDate, endDate, channels (multi-select). All fields validated with Zod. Campaign status lifecycle: `draft → approved → active → completed`.

### Campaign Flow Indicator
**Status: Complete (post UX fixes)**
4-step indicator (Create → Generate Ads → Mark Ready → Performance) with clickable navigation on active steps, accurate completion derived from real data (hasAssets, isApproved, hasMetrics), and next-action callout for the current step.

### Content Generation
**Status: Functionally complete as a demo — not real AI**
`POST /assets` generates ad content using `mockGenerate()` — a deterministic template engine using hard-coded headline arrays, CTA arrays, and hashtag sets. Output includes: headline, shortCaption, longCaption, cta, hashtags, videoScript, storyboardOutline. **The brand profile data (tone of voice, forbidden claims, visual notes) is fetched in the frontend but NOT passed to the generation endpoint. Generation is campaign-context only, not brand-context.** See §2 Gap 5 for details.

### Ad Approval (per-asset)
**Status: Complete (post UX fixes)**
Per-asset approval dialog with free-text feedback (`Request Edit` → modal), approve/reject actions with status tracking, toast confirmations, audit-log writes.

### Campaign Readiness Approval
**Status: Complete (post UX fixes)**
"Mark Campaign Ready" button in Campaign Detail header changes `campaign.status` via `useApproveCampaign`. Clearly distinct from per-asset approval. Tooltip + helper text explain the difference. Shows "Campaign Ready" badge once done.

### Tracking Links
**Status: Partially surfaced**
Full UTM builder at `/tracking-links` (legacy route, not in main nav): create, list by campaign filter, copy, delete, test link. Per-campaign read-only view in Campaign Detail > Tracking Links tab. **Gap: no inline creation from Campaign Detail, and the legacy /tracking-links page is not accessible from the main nav (see §2 Gap 1).**

### Demo Ad Connections
**Status: Complete**
5 platforms: Instagram, Snapchat, YouTube, X, TikTok. Mock connect (enter account name), disconnect, sync (refreshes mock data). Per-connection mock metrics (spend, impressions, clicks). Prominently labelled as demo-only. Available in Settings > Ad Platforms tab and legacy `/connections`.

### TikTok Mock
**Status: Data layer complete — UI incomplete**
TikTok listed as a platform in the connections UI. The `channelVariant()` function generates TikTok-specific content for every asset (CTA: "Follow for more", hashtags: `#tiktok #tiktokviral`), stored in `channelVariantsTable`. The `GET /assets/:id/variants` API endpoint returns all 5 channel variants. **Gap: the Content Studio only renders the base asset. The channel variants (including TikTok) are in the DB but never displayed (see §2 Gap 2).**

### Performance Dashboard
**Status: Complete**
Channel comparison bar chart (Recharts), daily metrics table (date, platform, spend, impressions, clicks, CTR, CPC, conversions), campaign filter, CSV export (client-side, fully functional). Route: `/reports`.

### Budget Pacing
**Status: Complete**
Simulated pacing computed from campaign dates and budget. Formula: simulated spend = expected × 0.92. Three verdict states: On Pace / Underspending / Overspending (thresholds: ±15%). Progress bar with day counter. Displayed in Campaign Detail. Clearly labelled "Simulated pacing — demo data only."

### Brand Profile Attribution
**Status: UI complete — generation not wired**
Full brand profile form in Settings > Brand Profile: brandName, toneOfVoice, targetAudience, productsServices, forbiddenClaims, preferredChannels, visualNotes. Warning shown in Content Studio when no profile exists. Guardrail count displayed. **Gap: the brand profile is not passed to or used by the generation backend (see §2 Gap 5).**

### Recommendations
**Status: Functional as rule engine — low sophistication**
Three rule-based recommendations generated on POST `/recommendations/generate` from simulated metrics:
1. CTR < 1.5% → "Improve your hook or headline" (priority: high)
2. CPC > $3 → "Narrow your audience targeting" (priority: medium)
3. Conversions < 5 with clicks > 50 → "Review your landing page experience" (priority: high)
4. Best platform by CTR → "Focus more on [platform]" (priority: low)

Stored in DB. Dashboard shows top-priority rec as "Today's Action". **Gap: triggered manually, not automatically. Three static rules have no learning component.**

### Audit Log
**Status: Complete**
All major actions write to `auditLogsTable`: content_generated, campaign_approved, member_added, asset_approved, etc. With actor (user name), entityType, entityId, details. Searchable by free text. Available in Settings > Activity Log tab and legacy `/audit-log`. 50-item limit with debounced search.

### Settings Consolidation
**Status: Complete**
Single `/settings` page with 4 tabs: Brand Profile, Ad Platforms, Activity Log, Account (workspace name, businessType, country, language, currency + workspace create/edit). Legacy routes still accessible but no longer in main navigation.

---

## 2. Missing or Incomplete Agreed Capabilities

### Gap 1 — Tracking Links not creatable from Campaign Detail
**Where:** `artifacts/marketing-os/src/pages/campaign-detail.tsx`, Tracking Links tab
**What's missing:** The Campaign Detail > Tracking Links tab shows existing links (read-only copy button) but has no inline creation form. The empty-state CTA links to `/settings` which doesn't have a tracking links section. The creation form at `/tracking-links` is not reachable from the main nav or settings.
**Impact:** A user working inside a campaign cannot create UTM links without knowing about the legacy URL.
**Required:** Inline "Generate Link" mini-form in the Tracking Links tab, pre-populated with the current campaign.

### Gap 2 — Channel variant UI tab (TikTok + all channels)
**Where:** `artifacts/marketing-os/src/pages/content-studio.tsx`
**What's missing:** The backend generates 5 channel-specific variants for every asset (stored in `channelVariantsTable`). The `GET /assets/:id/variants` API endpoint returns them. The frontend never calls this endpoint and only renders the base asset. TikTok-specific content (CTA, hashtags, video script format) exists in the DB but is invisible to the user.
**Impact:** The TikTok differentiation story — a key demo selling point — is completely absent from the UI. Users never see that their copy has been adapted per platform.
**Required:** Channel variant tabs or expandable rows per asset showing platform-specific headline, caption, CTA, and hashtags.

### Gap 3 — Role-based UI permissions
**Where:** All page components — no component reads `user.role`
**What's missing:** Backend enforces roles (viewer/editor/admin/owner) correctly on every route. Frontend is completely role-blind. A "viewer" account sees "New Campaign", "Mark Campaign Ready", "Generate Ads", "Approve This Ad" buttons identically to an "admin". They get 403 errors from the API, but no UI feedback explains why actions are unavailable.
**Impact:** Confusing for pilot users who are invited as viewers. Undermines the role concept for buyers evaluating team permissions.
**Required:** Hide or disable write-action buttons (New Campaign, Generate Ads, Mark Ready, Approve) when `user.role === "viewer"`. Show a short tooltip or inline note ("Ask an Admin to make changes").

### Gap 4 — Account/member management UI
**Where:** `artifacts/marketing-os/src/pages/settings.tsx`, Account tab
**What's missing:** The backend has full member CRUD API (GET list, POST add by email, PATCH change role, DELETE remove). The Settings > Account tab only manages workspace settings (name, businessType, etc.). There is no member management panel: no member list, no invite-by-email, no role assignment UI.
**Impact:** In a multi-user pilot, there is no way to add a second team member from the UI. An admin must do it via raw API. This blocks any collaborative demo use-case.
**Required:** "Team Members" section in Account tab: list current members with roles, invite-by-email form (admin only), role selector, remove button.

### Gap 5 — Brand profile not wired into content generation
**Where:** `artifacts/api-server/src/routes/assets.ts`, `mockGenerate()` function
**What's missing:** This is the most significant functional gap. The `mockGenerate()` function accepts only `{ name, objective, productService, audience }` from the campaign. It uses hard-coded `MOCK_HEADLINES`, `MOCK_CTAS`, `MOCK_HASHTAGS` arrays. The brand profile's `toneOfVoice`, `forbiddenClaims`, `preferredChannels`, and `visualNotes` are stored in the DB but never read by the generation backend.
**Impact:** "Brand voice" is the primary value proposition of the product. The current system generates identical-quality output whether or not a brand profile exists — the same templates, the same hashtags, the same CTA options. Every demo claim about "AI that follows your brand guidelines" is misleading until this is fixed.
**For demo phase (without real LLM):** At minimum, use brand profile data to: (a) include brandName in headlines, (b) inject tone-of-voice terms into captions, (c) filter out forbidden claim keywords, (d) prefer the brand's preferredChannels in generation.
**For pilot and beyond:** Replace `mockGenerate()` with a real LLM call that receives brand profile as system context.

### Gap 6 — Real AI provider layer
**Where:** `artifacts/api-server/src/routes/assets.ts`, line 1 of `mockGenerate()`
**What's missing:** No LLM API call exists in the codebase. The generation is deterministic template-based. No API key for any AI provider is wired up.
**Impact:** The product does not use AI. This is acceptable for a controlled demo where quality expectations are managed, but it will be immediately obvious to any marketing professional in a self-serve trial.
**Required before first paying user:** Replace `mockGenerate()` with an LLM call (e.g., OpenAI GPT-4o or Claude 3.5) with brand profile as system prompt and campaign brief as user message.
**Note:** This requires adding an AI integration — Replit AI Integrations support OpenAI, Anthropic, and Gemini without needing a user API key.

### Gap 7 — Meta/Instagram read-only integration
**Where:** All platform connection logic is mock-only
**What's missing:** No real OAuth flow, no real API calls to Facebook Marketing API. All "Connected" statuses are stored as mock account names with randomly assigned mock metrics.
**Impact:** Cannot show real campaign data from an active Meta account. Blocks any real account owner from seeing their own numbers.
**For demo:** Current mock is acceptable and clearly labelled.
**For pilot:** Needs real OAuth if any pilot account wants to see their actual Meta data.

### Gap 8 — CSV export (done) / PDF export (missing)
**Where:** `artifacts/marketing-os/src/pages/reports.tsx`
**What's present:** Full CSV export of daily metrics rows via `handleExportCSV()` — client-side blob download, fully functional.
**What's missing:** PDF export. No PDF generation library is installed. The "Export" button only downloads CSV.
**Impact:** Minor — CSV is sufficient for most use cases. PDF report would be valuable for agency client presentations.

### Gap 9 — Notifications / digest
**Where:** Not implemented anywhere
**What's missing:** No in-app notification panel, no email digest, no "you have a new recommendation" alert system.
**Impact:** Users must actively open the dashboard to discover recommendations. In a busy agency context, passive notification is expected.

### Gap 10 — Recommendation engine quality
**Where:** `artifacts/api-server/src/routes/recommendations.ts`
**What's present:** 3 hard-coded threshold rules applied to simulated metrics. Manually triggered only.
**What's missing:** (a) Automatic generation after campaign approve or on a schedule, (b) trend analysis (improving vs. deteriorating over time), (c) cross-campaign benchmarking, (d) read/dismiss state shown in UI, (e) any explanation of why a rule fired.
**Impact:** Recommendations feel static and generic. In demo context, acceptable. For a paying user, low value.

### Gap 11 — Campaign wizard enforcement
**Where:** `artifacts/marketing-os/src/pages/campaigns-new.tsx`
**What's missing:** All 10 fields are shown simultaneously on one screen with no visual separation between required and optional fields. The flow indicator says "Step 1 of 4" but only step 1 has a UI. Steps 2–4 don't exist as interactive screens.
**Impact:** Cognitive overload for new users. The "Step 1 of 4" label creates an expectation of a wizard that doesn't exist.
**Required:** Either (a) remove the "Step 1 of 4" label and show a clean single-page form, or (b) implement a 2-step wizard: "Core Brief" (name, objective, product, audience, channels) → "Details" (budget, dates, geography, URL).

### Gap 12 — TikTok variant UI tab
**Where:** `artifacts/marketing-os/src/pages/content-studio.tsx` (connected to Gap 2)
**What's missing:** No channel-specific content view. TikTok's video script and storyboard outline are generated by the backend (`videoScript`, `storyboardOutline` fields) and stored but never displayed.
**Required:** Channel tabs per variant card showing platform-adapted content (TikTok: video script + storyboard; Instagram: caption + hashtags; YouTube: long description; X: condensed copy).

### Gap 13 — Production hardening
**What's missing:**
- No rate limiting on auth endpoints (brute-force risk on login)
- No CSRF token (session cookies exist but no double-submit pattern)
- No email verification on registration
- No error boundary pages (React errors crash the whole app)
- No unhandled promise rejection logging to an external service
- No request-level access logging with IP
- No `helmet` HTTP security headers
**Impact:** Acceptable for demo environment. Must be addressed before any production deployment with real user data.

---

## 3. Prioritization

### Classification Key
- **Must before pilot** — Without this, the controlled pilot will produce confusion or embarrassment
- **Should before first paying user** — Expected baseline for someone paying for a real product
- **Later** — Valuable but not blocking
- **Reject for now** — Out of scope per product guardrails

---

| # | Feature | Priority | Complexity | Dependencies |
|---|---|---|---|---|
| G1 | Tracking link creation from Campaign Detail | Must before pilot | S | None |
| G2 | Channel variant UI tabs (TikTok + all channels) | Must before pilot | M | API already exists |
| G3 | Role-based UI permissions (viewer hide/disable) | Must before pilot | S | user.role in AuthContext |
| G4 | Member management UI (invite, role, remove) | Should before first paying user | M | Members API already exists |
| G5a | Brand profile wired into mock generation | Must before pilot | S | DB schema ready |
| G5b | Real LLM replacing mockGenerate() | Should before first paying user | M | AI integration required |
| G6 | Real AI provider layer | Should before first paying user | M | G5b |
| G7 | Meta/Instagram read-only integration | Later | L | Real OAuth, API keys, compliance |
| G8 | PDF export | Later | S | PDF library |
| G9 | Notifications/digest | Later | L | Email provider, notification schema |
| G10 | Recommendation auto-trigger + quality | Should before first paying user | M | Scheduler or hook on approve |
| G11 | Campaign wizard enforcement | Should before first paying user | S | UI only |
| G12 | TikTok variant UI tab | Must before pilot | M | Same as G2 |
| G13 | Production hardening | Should before first paying user | M | Multiple concerns |

---

## 4. Feature Detail Cards

---

### G1 — Tracking link creation inline in Campaign Detail
**Priority:** Must before pilot
**Complexity:** S (~3 hours)
**User value:** A user working on a campaign can generate UTM links without leaving the campaign context. Currently impossible without knowing the legacy `/tracking-links` URL.
**Implementation risk:** Low — the creation API and all form components already exist. Copy the mini-form from the tracking-links page into a Dialog triggered from the Campaign Detail Tracking Links tab.
**Dependency:** None
**Acceptance criteria:**
- Campaign Detail > Tracking Links tab has a "Generate Link" button
- Clicking opens a dialog with the campaign pre-selected and locked
- After submission, the new link appears in the tab immediately
- Existing links are still shown with copy/delete actions
**Why now:** The Tracking Links tab is the only place campaign-contextual UTM creation makes sense. Without it, a key workflow step has no obvious path.

---

### G2 + G12 — Channel variant UI tabs in Content Studio
**Priority:** Must before pilot
**Complexity:** M (~1 day)
**User value:** Users can see how their ad copy has been adapted for each platform (TikTok video script, Instagram caption, X condensed copy). This is the primary demonstration of platform intelligence.
**Implementation risk:** Low — `GET /assets/:id/variants` returns all 5 variants. Only frontend work required.
**Dependency:** None (API + DB data already exists for every generated asset)
**Acceptance criteria:**
- Each ad variant card in Content Studio has channel tabs: Instagram, Snapchat, YouTube, X, TikTok
- Each tab shows the channel-specific headline, caption, CTA, and hashtags
- TikTok tab shows the video script and storyboard outline
- Default tab is the "Base" or the brand's primary preferredChannel
- No new API calls required (use existing `/assets/:id/variants` endpoint)
**Why now:** The TikTok differentiation is currently invisible. The DB already has the data. This is a display-only change that turns a hidden feature into a demo showstopper.

---

### G3 — Role-based UI permissions
**Priority:** Must before pilot
**Complexity:** S (~4 hours)
**User value:** Viewers can use the product without hitting confusing 403 errors. Admins can demonstrate the role-permission model to prospective buyers.
**Implementation risk:** Low — `user.role` is already in AuthContext. The change is conditional rendering only.
**Dependency:** None (roles already enforced backend, just needs frontend awareness)
**Acceptance criteria:**
- "viewer" role: New Campaign, Generate Ads, Approve This Ad, Mark Campaign Ready buttons are hidden or disabled with tooltip "Ask an Admin to make changes"
- "editor" role: all content actions visible; member management and workspace settings hidden
- "admin" role: full access
- Role badge shown in sidebar footer or Account tab ("You are an Editor")
- No backend changes required
**Why now:** A pilot with multiple users (client + agency) requires role clarity to function.

---

### G4 — Member management UI
**Priority:** Should before first paying user
**Complexity:** M (~1 day)
**User value:** An admin can invite team members, assign roles, and remove users from the workspace directly from Settings. Currently impossible without direct API calls.
**Implementation risk:** Low — backend has complete CRUD. Need React Query hooks generated for the members API.
**Dependency:** OpenAPI spec must include member routes → codegen → hooks
**Acceptance criteria:**
- Settings > Account tab has "Team Members" section
- Lists current members with name, email, role, join date
- "Invite Member" button (admin only): enter email + role → calls POST /workspaces/:id/members
- Error shown if email not registered ("No user found with that email address" from backend)
- Role selector dropdown for existing members (admin only)
- Remove button with confirmation (cannot remove owner)
**Why not before pilot:** A solo-user controlled demo doesn't need this. First paying customer (agency context) will.

---

### G5a — Brand profile wired into mock generation
**Priority:** Must before pilot
**Complexity:** S (~2 hours)
**User value:** Generated ad copy reflects the brand's tone, name, and forbidden claims. The brand profile is not just stored — it actually influences output.
**Implementation risk:** Low — no AI required. Update `mockGenerate()` to accept brandProfile as a parameter and apply it to: (a) include brandName in headline, (b) inject toneOfVoice descriptor in caption, (c) use brand's preferredChannels for channel variant ordering.
**Dependency:** The `/assets` POST endpoint must accept a `brandProfileId` or `workspaceId` to look up the profile
**Acceptance criteria:**
- Generated headlines include the brand name (e.g. "Bright & Bold — Discover the Difference Today")
- Short caption mentions the tone of voice descriptor
- Forbidden claims do not appear in any generated text (simple string filter)
- Visual notes appear as a note field on the storyboard outline
- Content Studio's brand profile strip is visually consistent with actual output
**Why now:** The product's core promise is brand-safe AI. Without this, every demo is technically false advertising.

---

### G5b + G6 — Real LLM replacing mockGenerate()
**Priority:** Should before first paying user
**Complexity:** M (~1 day)
**User value:** Genuinely useful, non-repetitive ad copy that a marketing professional would actually consider using. The current template output is immediately recognizable as generic.
**Implementation risk:** Medium — needs AI provider setup (Replit AI Integrations supports OpenAI/Anthropic/Gemini without user API keys). Output quality is non-deterministic — may require prompt tuning.
**Dependency:** G5a should be done first so brand profile format is established before LLM prompt design
**Acceptance criteria:**
- `POST /assets` calls an LLM with a structured prompt: system = brand profile (tone, forbidden claims, channel preferences), user = campaign brief
- Output is parsed and stored in the same schema (headline, shortCaption, longCaption, cta, hashtags, videoScript, storyboardOutline)
- Generation fails gracefully (falls back to G5a enhanced template) if API is unavailable
- No prompt or API key is visible in client-side code
- Audit log notes that LLM was used
**Why not before pilot:** Template generation is acceptable for a controlled demo where the salesperson explains the AI roadmap. Rushing LLM integration before pilot risks unreliable output.

---

### G7 — Meta/Instagram read-only integration
**Priority:** Later
**Complexity:** L (~3 days + compliance review)
**User value:** A real agency pilot account can see their actual Meta campaign data instead of mock metrics.
**Implementation risk:** High — requires Facebook app approval, OAuth token management, API rate limits, user data consent, and compliance review. Cannot be demo-ed without a real advertising account.
**Dependency:** G13 (production hardening) must be completed first; real user data means real security obligations
**Why later:** Current mock is clearly labelled and works for demos. Real integration is a product-market fit question, not a demo readiness question.

---

### G8 — PDF export
**Priority:** Later
**Complexity:** S (~4 hours)
**User value:** Agency account managers can export a PDF performance summary to share with clients.
**Implementation risk:** Low — client-side PDF from existing table data using a library like `jspdf` or `react-pdf`
**Dependency:** None
**Why later:** CSV is sufficient. PDF is a quality-of-life improvement, not a blocker.

---

### G9 — Notifications / digest
**Priority:** Later
**Complexity:** L (~3 days)
**User value:** Users receive an email or in-app alert when a new recommendation is generated, an ad is approved/rejected, or a campaign approaches its end date.
**Implementation risk:** High — requires email provider setup (transactional email), notification schema, delivery queue, preference management
**Dependency:** G10 (auto-trigger recommendations) should be done first
**Why later:** For a controlled pilot with a salesperson involved, passive notifications are unnecessary. Needed for self-serve.

---

### G10 — Recommendation auto-trigger and quality
**Priority:** Should before first paying user
**Complexity:** M (~1 day)
**User value:** Recommendations appear automatically when a campaign is approved and metrics exist, not only when an admin calls the endpoint manually.
**Implementation risk:** Low (auto-trigger on campaign status change) to Medium (quality improvements)
**Dependency:** G5b (real metrics from LLM output) helps but not required
**Acceptance criteria:**
- Recommendations are automatically generated when a campaign is marked approved
- Existing recommendations can be dismissed ("mark as read") from the dashboard
- At minimum, add a 5th rule: "Campaign ending soon — review performance" (7 days before end date)
- Recommendation cards in dashboard show which campaign they refer to, with a direct link
**Why should:** The three static threshold rules add zero value beyond the initial demo. For any repeat user, they become noise.

---

### G11 — Campaign wizard / form clarity
**Priority:** Should before first paying user
**Complexity:** S (~4 hours)
**User value:** New users can create a campaign without being overwhelmed. The "Step 1 of 4" indicator is honest about the experience.
**Implementation risk:** Low — UI only, no schema changes
**Acceptance criteria (Option A — remove wizard framing):** Remove the "Step 1 of 4" label. Rename to "New Campaign". Visually separate required fields (Name, Objective, What you're promoting, Who it's for, Channels) from optional fields (Budget, Dates, Location, URL) with a divider and label.
**Acceptance criteria (Option B — 2-step wizard):** Step 1: Name, Objective, Product, Audience, Channels. Step 2: Budget, Start/End Date, Geography, Landing URL. Back/Next navigation with per-step validation.
**Why should:** The current "Step 1 of 4" heading creates an expectation of 3 more screens that never appear. This is a credibility issue for any new user.

---

### G13 — Production hardening
**Priority:** Should before first paying user
**Complexity:** M (~1 day total across items)
**User value:** User data is secure. The app does not crash on unexpected input.
**Acceptance criteria:**
- Rate limiting on `/api/auth/login` (max 10 attempts per IP per 15 minutes)
- React `ErrorBoundary` wrapper around each main page with a fallback UI
- HTTP security headers via `helmet` middleware
- Email verification step during registration (or marked as known deferred risk)
- Request logging includes IP and workspace ID for audit purposes
**Why should:** Controlled demo is low risk. Any account with real customer data or financial information requires baseline security hardening.

---

## 5. Guardrails — Confirmed Forbidden

The following capabilities are **explicitly out of scope** for this codebase and must remain so until a deliberate product decision changes them. No sprint, task, or subtask should touch these.

| Guardrail | Status | Where confirmed |
|---|---|---|
| Live ad publishing | Forbidden | All platform connections use mock-only data. No publish endpoint exists. |
| Budget changes | Forbidden | `budgetSuggestion` is read-only after creation. No budget update mutation exists in the API. |
| Payment handling | Forbidden | No payment route, no Stripe integration, no billing schema in the DB. |
| Autonomous optimization | Forbidden | Recommendations are read-only suggestions. No auto-apply, no auto-pause, no bid changes. |
| Connecting all ad platforms simultaneously | Forbidden | Each connection is independently mock-only. No unified publisher or batch API caller exists. |
| Real user financial data | Forbidden | All spend figures are labelled "Simulated · no real spend" throughout the UI. |

The sidebar banner "Demo mode · No real ads are running" (with FlaskConical icon, muted style) must remain in every build.

---

## 6. Recommended Next Sprint

**One focused sprint. Maximum 5 items. Target: 3–4 working days.**

**Theme: Make the existing data visible and the existing model honest.**

All 5 items are pure frontend or lightweight backend — no new schema migrations, no third-party integrations, no new major features.

---

### Sprint Item 1 — Wire brand profile into mock generation (backend)
**Effort:** 2 hours
**File:** `artifacts/api-server/src/routes/assets.ts`
**Change:** Update `POST /assets` to accept `workspaceId`, look up the brand profile, pass `brandProfile.brandName`, `brandProfile.toneOfVoice`, and `brandProfile.forbiddenClaims` into `mockGenerate()`. Update `mockGenerate()` signature to use them: brandName in headline prefix, toneOfVoice as an adjective in caption, forbiddenClaims as a word-filter over generated text.
**Acceptance:** Generated headline includes brand name. Caption has a tone-appropriate phrase. No forbidden keyword appears in output.

---

### Sprint Item 2 — Channel variant tabs in Content Studio (frontend)
**Effort:** 4 hours
**File:** `artifacts/marketing-os/src/pages/content-studio.tsx`
**Change:** For each rendered asset card, add a channel tab strip (Instagram, Snapchat, YouTube, X, TikTok). On tab select, call `GET /assets/:id/variants` (hook: `useListAssetVariants` or inline fetch) and display the channel-specific headline, caption, CTA, hashtags. TikTok tab also shows `videoScript` and `storyboardOutline`. Add a React Query hook for this endpoint if not already generated.
**Acceptance:** Every ad variant shows platform tabs. TikTok tab shows video script. Switching tabs does not trigger regeneration. "Approve This Ad" still applies to the base asset.

---

### Sprint Item 3 — Inline tracking link creation in Campaign Detail
**Effort:** 3 hours
**File:** `artifacts/marketing-os/src/pages/campaign-detail.tsx`
**Change:** In the Tracking Links tab, add a "Generate Link" button that opens a Dialog containing a condensed version of the UTM form from `/tracking-links`. Pre-populate campaignId (locked to current campaign). On success, invalidate the tracking links query and show the new link in the tab.
**Acceptance:** User can create a UTM tracking link without leaving the Campaign Detail page. Campaign field is pre-filled and cannot be changed.

---

### Sprint Item 4 — Role-aware UI rendering
**Effort:** 4 hours
**Files:** `artifacts/marketing-os/src/pages/campaigns.tsx`, `campaign-detail.tsx`, `content-studio.tsx`
**Change:** Read `user.role` from `useAuth()`. Wrap write-action buttons (New Campaign, Generate Ads, Mark Campaign Ready, Approve This Ad, Request Edit) with a `canEdit` check (`role !== "viewer"`). Show a small "Read-only access" badge in the sidebar footer when `role === "viewer"`.
**Acceptance:** A viewer-role user sees no action buttons that would result in a 403. An editor sees all content actions but not workspace/member settings. Tooltip on disabled buttons explains the access level.

---

### Sprint Item 5 — Dashboard empty-state fallback when no recommendations exist
**Effort:** 1 hour
**File:** `artifacts/marketing-os/src/pages/dashboard.tsx`
**Change:** Replace the conditional `{topRec && (...)}` with a guaranteed rendered block. When `topRec` is undefined, show a static fallback card: "Set up your first campaign to get AI-powered recommendations." with a "Create Campaign →" button. This ensures the dashboard always has a directive, not a silent gap.
**Acceptance:** Dashboard always shows the Today's Action card. With seeded data, it shows a real recommendation. Without data, it shows the "create your first campaign" fallback. The tagline "Here's what needs your attention today" is never a lie.

---

## Gap Summary

| Gap | Confirmed via | Severity | Sprint? |
|---|---|---|---|
| Tracking links not creatable from Campaign Detail | campaign-detail.tsx + tracking-links.tsx | HIGH | ✅ Sprint item 3 |
| Channel variants (TikTok) not shown in Content Studio | assets route + channelVariantsTable exist, no UI | HIGH | ✅ Sprint item 2 |
| Role-based UI permissions missing | AuthContext has role, no component reads it | MEDIUM | ✅ Sprint item 4 |
| Member management UI absent | Members API exists, no frontend hooks or UI | MEDIUM | Post-sprint |
| Brand profile ignored by generation backend | mockGenerate() args confirmed in routes/assets.ts | HIGH | ✅ Sprint item 1 |
| Real LLM not integrated | mockGenerate() uses hard-coded arrays only | HIGH | Post-sprint |
| Meta/Instagram read-only integration | All connections mock-only | MEDIUM | Later |
| PDF export missing (CSV exists) | reports.tsx confirmed CSV export works | LOW | Later |
| No notifications/digest | No schema, no email provider | LOW | Later |
| Recommendation auto-trigger missing | POST /recommendations/generate is manual only | MEDIUM | Post-sprint |
| Campaign form "Step 1 of 4" misleading | campaigns-new.tsx label vs single-screen form | MEDIUM | Post-sprint |
| Production hardening (rate limiting, CSRF, headers) | No helmet, no rate limiter, no error boundary | MEDIUM | Post-sprint |

---

## Priority Table

| Feature | Priority | Complexity | User Impact | Risk |
|---|---|---|---|---|
| Wire brand profile into generation | **Must before pilot** | S | Core promise | Low |
| Channel variant tabs (TikTok) | **Must before pilot** | M | Demo showstopper | Low |
| Role-based UI permissions | **Must before pilot** | S | Pilot multi-user | Low |
| Inline tracking link creation | **Must before pilot** | S | UX flow | Low |
| Dashboard empty-state fallback | **Must before pilot** | S | UX safety | Low |
| Member management UI | Should before first paying user | M | Team collaboration | Low |
| Real LLM generation | Should before first paying user | M | Core product value | Medium |
| Recommendation auto-trigger | Should before first paying user | M | Return-user value | Low |
| Campaign wizard / form clarity | Should before first paying user | S | Onboarding | Low |
| Production hardening | Should before first paying user | M | Security | Medium |
| PDF export | Later | S | Agency polish | Low |
| Meta/Instagram read-only OAuth | Later | L | Real data | High |
| Notifications / digest | Later | L | Engagement | High |

---

*Report produced by full codebase inspection. No features were implemented in the creation of this document.*
