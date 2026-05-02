# Marketing OS Lite — Demo Feedback Analysis

**Version:** 1.0  
**Date:** 2026-05-02  
**Analyst:** Product / Engineering  
**Input source:** `docs/customer_feedback_questions.md`

---

## Methodology Note — Pre-Demo Synthesis

**No customer demo has been conducted yet.** The feedback questions document (`docs/customer_feedback_questions.md`) contains blank response fields. This document is therefore a **pre-demo synthesis**, not a post-session transcript analysis.

**What this document is:**
A rigorous projection of likely customer responses, grounded in three inputs:
1. The platform's actual built state — every feature, limitation, and UX decision verified in the current codebase
2. The target customer profile — marketing managers, agency owners, and growth leads evaluating a marketing operations platform
3. Known evaluation patterns for marketing software — how this category of buyer responds to workflow tools, mock integrations, and AI-generated content

**How to use it:**
- Before the first demo: treat every finding as a hypothesis to test
- After the first real session: return here and annotate each section with actual responses, updating the final decision accordingly
- Where actual responses contradict this analysis, the actual responses win

---

## 1. What the Customer Will Understand Clearly

### 1.1 Dashboard KPIs — Immediate Recognition

The headline metrics — Total Spend, Impressions, Clicks, CTR, CPC, Conversions — are the universal language of paid advertising. Any marketing manager who has ever exported a Meta Ads or Google Ads report will recognise these fields within seconds.

The channel comparison chart (Instagram vs Snapchat vs YouTube vs X, side by side) maps directly to a decision these customers make every week: *where should I put the next dollar?* The "Best Channel / Worst Channel" summary names the answer without requiring interpretation.

**Expected reaction:** Instant comprehension, likely nodding. This is the first moment the platform feels familiar rather than foreign.

### 1.2 Approval Workflow — Maps to Existing Pain

Most small and mid-size marketing teams currently run creative reviews over Slack threads, email chains, or shared Notion/Google Drive comments. The approval modal (Approve / Reject / Request Changes + reason field, producing a timestamped audit trail) is a structured version of what they already do informally.

**Expected reaction:** "We actually do this over Slack — this would be much cleaner." Recognition of a real operational pain, not just a nice-to-have.

### 1.3 Tracking Links — Known Concept, New Convenience

UTM parameters are understood by anyone who has used Google Analytics. The insight the demo communicates — that UTM links are currently generated inconsistently across tools, with no campaign-level record — is a real source of frustration. Pasting the generated URL into a browser tab and showing the structured parameters makes the value immediately tangible.

**Expected reaction:** "Oh, this is just UTM generation" followed by "...but I wish we had this centrally stored." The second reaction is the more important one.

### 1.4 Audit Log — Trusted Governance Signal

Marketing managers at agencies in particular carry direct accountability for spend decisions. The audit log — append-only, workspace-scoped, showing every approval and creation event — communicates "this platform is serious about accountability." This is not a feature they were necessarily looking for, but it earns trust.

**Expected reaction:** Quiet appreciation rather than excitement. Mentally checking a box: "This is something I could show a client."

### 1.5 Campaign Brief as a Structured Record

The campaign creation form asking for audience, geography, objective, channels, and budget before any creative work begins mirrors how disciplined agencies brief their copywriters. For teams currently starting campaigns as a Slack message or a bullet point in a spreadsheet, this structure resonates.

**Expected reaction:** "This is basically a brief template." Understood immediately.

---

## 2. What Will Confuse the Customer

### 2.1 Brand Profile → Content Generation: The Connection Is Invisible

**This is the most significant UX gap in the current demo.**

The brand profile contains tone of voice, forbidden claims, target audience, and preferred channels. Content generation produces copy. But in the current interface, there is no visible moment where the two connect. The customer fills in a brand profile on one screen, navigates to a campaign, clicks "Generate Content," and gets output — with no indication that the brand profile was consulted.

The expected question: *"Does the content actually use what I put in the brand profile, or is it just generating random text?"*

This doubt is corrosive. If the customer can't see the connection, they won't trust the output — regardless of whether the connection is technically real.

**Severity:** High. This undermines the platform's central value proposition.

### 2.2 Mock Content Quality Cannot Be Evaluated

The mock content generator produces templated output: `"Unlock Your Brand's Full Potential This Summer: Marketing OS Lite"`. The headline structure is formulaic, the copy is generic, and it is visually obvious that this did not come from a real language model. 

A customer evaluating a content generation feature needs to answer one question: *will this save me time on creative work?* Templated filler text cannot answer that question. The customer will correctly conclude that they cannot evaluate the feature at all, which means the demo's longest step (5 minutes) produces the weakest impression.

**Severity:** High. The step occupies 14% of demo time and delivers the least proof of value.

### 2.3 "Workspace" Terminology

"Workspace" is a concept from productivity tools (Slack, Notion). Marketing managers think in terms of "account," "client," or "brand." When the sidebar shows "Bright & Bold Agency" and the presenter says "your workspace," there is a terminology friction that requires a beat of translation.

**Severity:** Low. One explanation resolves it, but it signals that the UI language was designed by engineers rather than marketers.

### 2.4 Recommendations Are Pre-Seeded — The Mechanics Are Opaque

The recommendations page shows 10 items at various priority levels. They are compelling. But the customer will immediately ask: *"How does it know to recommend this? Will it update on its own? Do I have to do something to trigger this?"*

The current demo has no good answer to this. The script says "they're pre-seeded in demo mode" and "they update as performance data refreshes in production" — but without showing the trigger mechanism, this feels hand-wavy.

**Severity:** Medium. The recommendations are a strong feature; the demo undersells them by not showing when and how they generate.

### 2.5 Two-Step Campaign → Asset Flow Requires Explanation

A user naturally expects: create campaign → manage campaign, with content as a sub-component of campaign management. In the current flow, content generation is a separate top-level action, and assets are fetched by `campaignId`. The navigation between campaign detail and asset detail is not self-evident.

**Severity:** Medium. Requires one explanation to navigate, but creates a momentary "where do I click?" pause that undermines perceived polish.

### 2.6 The "Channels" Field in Campaign Creation Has No Visible Effect

During campaign creation, the user selects Instagram and YouTube as channels. During content generation, variants are produced for all four platforms (Instagram, Snapchat, YouTube, X) regardless of what was selected. The channel selection in the brief does not filter the variant output. This inconsistency will be noticed by an attentive customer.

**Severity:** Medium. Looks like incomplete feature wiring, not a design choice.

---

## 3. Whether the Workflow Felt Valuable

### Predicted value ratings per feature (1–5, where 5 = "I need this now"):

| Feature | Predicted Score | Reasoning |
|---------|----------------|-----------|
| Dashboard / reporting | **4.5** | Replaces manual cross-platform report compilation |
| Approval workflow | **4.0** | Directly replaces Slack/email review chaos |
| Recommendations | **4.0** | Actionable, not just informational |
| Tracking links | **3.5** | Useful; customers who already use UTMs will value this most |
| Audit log | **3.5** | Trust signal; critical for agencies, less so for solo marketers |
| Campaign creation | **3.0** | Good structure; feels like administrative overhead without integration payoff |
| Brand profile | **2.5** | Purpose unclear unless content generation visibly uses it |
| Content generation | **2.0** | Hard to evaluate quality with mock output |

### Overall workflow value assessment

**The platform is strongest as a reporting and governance tool.** The dashboard, recommendations, approval workflow, and audit log form a coherent product that a marketing manager would use daily. These features work without a live integration.

**The platform is weakest as an AI content tool.** This is the feature most likely to generate curiosity in the demo and the least equipped to answer that curiosity. If the presenter spends 5 minutes on content generation, 3 of those minutes will create scepticism rather than excitement.

**Strategic implication:** The demo script should front-load the reporting and governance story, treat content generation as a roadmap item, and not let mock output stand as the primary creative demonstration.

---

## 4. Mock-to-Real Transition Trust

### Predicted trust score: **3 / 5**

**What earns trust:**
- The mock banner is prominent, honest, and persistent — it does not try to hide the simulation
- The workspace isolation demo (logging in as Alice and seeing nothing) proves the security model is real
- The approval workflow and audit log are fully functional with real database persistence
- The session persists across refreshes — the platform feels technically stable

**What undermines trust:**
- There is no proof that a real API call has ever been made from this platform to Meta, Google, Snapchat, or X
- The content generation output is visually indistinguishable from a `lorem ipsum` substitute
- The recommendations are hard-coded rows in a database, not derived from the metrics they reference
- The metrics themselves are randomly generated; a customer who inspects the numbers will notice suspiciously round distributions

**The core credibility gap:**
The presenter claims: *"Connecting a real account is a configuration step."* This is the most important claim in the demo. It currently has zero supporting evidence. The customer has no reason to disbelieve it, but also no reason to believe it. It reads as a promise, not a demonstration.

**What would push trust to 4–5:**
A single real read-only API call — fetching the customer's Meta campaign names and approximate spend, displayed live — would transform this claim from a promise to a proof. Nothing else in the current feature set would have more impact per hour of engineering.

---

## 5. Preferred First Real Integration

### Verdict: **Meta / Instagram — clear first choice**

**Evidence basis:**

| Platform | SMB Ad Spend Share (est.) | Demo Audience Match | Integration Complexity |
|----------|--------------------------|---------------------|----------------------|
| Meta / Instagram | ~40–50% | Very high | Medium (Marketing API is well-documented) |
| YouTube / Google Ads | ~25–30% | High (e-commerce, SaaS) | Medium-High (Google Ads API is complex) |
| Snapchat | ~5–10% | Medium (younger demographics, specific verticals) | Low-Medium |
| X (formerly Twitter) | ~5–8% | Low (declining SMB adoption) | Medium (API policy instability) |
| TikTok (not in current demo) | ~15–20% (growing fast) | High for brands targeting under-35 | Medium |

**Meta wins because:**
1. The widest install base among the demo audience — most marketing managers currently run at least one Meta campaign
2. The Meta Marketing API is mature, well-documented, and has broad community support
3. A read-only pull (campaigns list + spend + impressions) requires only the `ads_read` permission scope — no write access needed for a first integration
4. Instagram is included in the Meta integration — two platforms for the price of one

**TikTok is the notable omission.** For any customer whose audience skews under 35, TikTok will be brought up in Section C of the feedback questions. Its absence from even the mock integrations list is a signal that will weaken credibility with youth-focused brands. Adding TikTok as a fifth mock connection (no integration needed) would remove this objection.

**Recommendation:** Build Meta read-only integration first. Add TikTok as a mock connection in the same sprint.

---

## 6. Preferred Business Model

### Predicted split: **Hybrid 50% / Self-serve 35% / Managed 15%**

**Self-serve SaaS appeal:**
- In-house marketing managers at SMBs with 1–3 person teams who currently use multiple disconnected tools
- Founders/growth leads who run ads themselves
- These customers want control and transparency; they will use the platform daily

**Managed mode appeal:**
- Very small businesses with no in-house marketing function
- Owners who outsource everything to an agency today and want visibility without involvement
- These customers want outcomes, not workflows; they will disengage if the platform requires regular login

**Hybrid appeal (dominant):**
- Agency owners who want to run the platform themselves but want access to execution support
- In-house marketing teams at 10–50 person companies who have a strategist but no ad buyer
- These customers want the approval workflow and reporting for themselves, but want someone else to set up integrations, manage bid strategies, and handle platform-specific execution
- This is the highest-value customer segment — they will pay more and engage more deeply

**Strategic implication:**
The current platform is built for self-serve SaaS. The most common customer will want hybrid. The gap is not a feature gap — it is a support model and onboarding gap. The product does not need to change; the go-to-market does. 

**Specific additions that would serve the hybrid customer:**
- An onboarding flow that assigns a "customer success" contact during account setup
- A "handoff to execution" button on approved assets (even if it just sends an email for now)
- A "setup integration for me" request form on the Connections page

---

## 7. Minimum Dashboard Value They Would Pay For

### The single daily number: **Cost per conversion by channel**

When asked "if you could only see one number every morning," the answer for most marketers managing paid acquisition is: *which channel is generating conversions at what cost, right now?*

The current dashboard shows spend, impressions, clicks, CTR, and CPC — but not conversions by channel in a single view. The dashboard does show `totalConversions` in a KPI card, but it is not broken out by channel in the channel comparison view.

**Minimum viable daily dashboard:**
1. Channel conversion rate and CPA (cost per acquisition) side by side
2. Budget pacing: `$X spent of $Y budget — Z days remaining at current rate` 
3. Top 1 recommendation (highest priority, one line)

**None of these require a real integration to display in demo mode.** They require adjusting what the mock data shows and how it is surfaced.

### Pricing signal (projected)

| Team size | Predicted max monthly willingness | Context |
|-----------|----------------------------------|---------|
| 1–3 people (founder/solo) | $49–99 | Competes with individual platform dashboards |
| 3–5 people (small team) | $149–249 | Replaces 2–3 tool subscriptions |
| 6–15 people (agency/growth) | $299–499 | Competes with Sprout Social, Databox, HubSpot |

**The floor is set by what they already pay** for the combination of tools this platform would replace: a reporting tool ($49–99), a project management tool ($50–150), and the time cost of manual UTM management ($0 explicit, but significant). The ceiling is set by what category leaders charge.

---

## 8. Weekly-Use Triggers

**Predicted responses to "what would make you check this weekly?":**

The platform currently has no push mechanism — no email digests, no in-app notifications, no anomaly alerts. Without a trigger to return, the platform becomes a destination, not a habit. Destinations are visited when users remember them; habits are driven by events.

### Trigger hierarchy (most to least powerful):

| Rank | Trigger | Current state | Engineering cost |
|------|---------|---------------|-----------------|
| 1 | "Your CPC on Instagram spiked 40% vs last week" | Not built | Medium |
| 2 | "3 assets are awaiting your approval" | Not built (no notifications) | Low |
| 3 | "Weekly performance summary: best channel, spend vs budget" | Not built | Low |
| 4 | "New recommendation: [action]" | Not built | Low |
| 5 | "Your campaign ends in 7 days" | Not built | Low |

**The highest-leverage investment is a weekly email digest.** It requires no UI work, no real-time integration, and no complex infrastructure — just a scheduled job that reads existing metrics and sends an HTML email. A customer who receives a useful weekly email will return to the platform every time they want to act on what they read.

**Without any trigger mechanism, weekly retention is unlikely regardless of demo quality.**

---

## 9. Missing Must-Have Data

The following data categories will be raised by customers but are currently absent from the platform:

### 9.1 TikTok — Critical gap

TikTok Ads is the fastest-growing ad platform in the SMB segment. Any brand targeting audiences under 35 will ask about it. Not having it in the mock connections list signals that the product team is behind the market. **Cost to add as mock: trivial (one entry in the connections list, mock spend data).** Cost to add as real integration: medium (TikTok Marketing API is accessible but less mature than Meta).

### 9.2 Budget Pacing — High demand

"Am I on track to spend my budget at the right rate?" is a question every marketer asks weekly. The current platform has `budgetSuggestion` on campaigns and `mockSpend` on connections, but no derived metric that answers this question. A simple `dailyBudgetRemaining` calculation (budget ÷ campaign days × days elapsed vs actual spend) would answer it.

### 9.3 Conversion and ROAS Data

The dashboard shows CTR and CPC — click-focused metrics. Most marketers making real budget decisions care about conversions and ROAS (return on ad spend). `conversions` exists in the data model but is not prominently surfaced in the channel comparison view. CPA (cost per acquisition) and ROAS are not computed or displayed at all.

### 9.4 Landing Page / Post-Click Performance

The tracking links feature generates UTM-tagged URLs, but there is no data on what happens after the click. Bounce rate, time on page, and conversion rate from the landing page are the metrics that determine whether the ad creative is actually working. This requires a Google Analytics or similar integration, but even showing a "landing page performance" placeholder would signal awareness of the full funnel.

### 9.5 Competitor Benchmarking Context

Marketers want to know not just whether their CTR is 2.1%, but whether 2.1% is good. Industry-average CTR benchmarks by platform and objective are publicly available. Overlaying a benchmark line on the channel comparison chart — even if it's a static industry average — would make the data significantly more interpretable.

---

## 10. Top 5 Changes Before the Next Demo

These are ranked by impact-per-effort: changes that require minimal engineering but substantially improve the demo's persuasiveness.

---

### Change 1 — Replace Mock Content Generator with Real AI Output *(High impact / Medium effort)*

**Problem:** The mock content generator produces visibly templated text. Five minutes of demo time are spent on a feature whose quality cannot be evaluated. The customer leaves unconvinced.

**Change:** Connect the content generation endpoint to a real language model. The OpenAI integration skill is available in this workspace. A single call to `gpt-4o-mini` with the brand profile + campaign brief as context, generating headline / short caption / CTA / hashtags, would produce output that is immediately, visibly different from a template. The customer could read the output and ask "could I use this?" instead of "is this real?"

**Acceptance criterion:** Generated headline and short caption are clearly brand-specific, not template filler. Tone of voice from the brand profile is perceptible in the copy.

---

### Change 2 — Add Budget Pacing to Campaign Detail *(High impact / Low effort)*

**Problem:** The dashboard shows total spend but not whether you're on track. The single data point most marketers check daily is missing.

**Change:** Add a budget pacing section to the campaign detail view. Using `budgetSuggestion`, `startDate`, `endDate`, and total `mockSpend` across connections, compute:
- % of budget used
- Days elapsed / total days
- Simple verdict: "On pace" / "Underspending" / "Overspending"

No new data model changes required. This is a frontend calculation on existing fields.

**Acceptance criterion:** Campaign detail shows "Spent $2,840 of $5,000 budget (57%) — 18 of 30 days elapsed (60%) — Slightly underspending."

---

### Change 3 — Show Brand Profile Attribution During Content Generation *(Medium impact / Low effort)*

**Problem:** The connection between the brand profile and generated content is invisible. Customers doubt whether it is actually used.

**Change:** During and after content generation, display a small attribution note: `"Generated using Brand Profile: Bright & Bold — Tone: Confident, energetic · Forbidden claims: 2 applied"`. This does not require changing the generation logic — it only requires reading and displaying the brand profile that was used.

Additionally, if the campaign's `workspaceId` brand profile has a "forbidden claims" entry, and any generated copy would have triggered it, surface a note: `"1 phrase avoided based on brand guardrails."` This is a powerful governance demonstration.

**Acceptance criterion:** After generation, the UI shows which brand profile was applied and how many guardrails were active.

---

### Change 4 — Add TikTok as a Fifth Mock Connection *(Medium impact / Very low effort)*

**Problem:** TikTok's absence from the connections list is a visible signal that the product is behind the market. It will be raised in feedback Section C and there is currently no answer.

**Change:** Add `tiktok` as a fifth platform option in the connections list. Mock account name, mock spend (~$1,200), mock impressions (~95,000), mock clicks (~3,800). No API integration required. Seed data addition only.

**Acceptance criterion:** Connections page shows 5 platforms: Instagram, Snapchat, YouTube, X, TikTok. TikTok account can be connected and synced (mock).

---

### Change 5 — Build Meta Read-Only Integration (Campaigns + Spend) *(Very high impact / High effort)*

**Problem:** The platform's central claim — "connecting a live account is a configuration step" — has zero supporting evidence. Without proof, it reads as a promise. One real API call transforms the entire trust dynamic.

**Change:** Implement a Meta Marketing API read-only connection that:
1. Accepts a Meta Ads `access_token` and `ad_account_id` from the user
2. Calls `GET /act_{ad_account_id}/campaigns?fields=name,status,spend_cap,daily_budget`
3. Displays real campaign names and budget data in the connections panel
4. Does NOT pull spend data (requires `ads_management` permission), only campaign structure (`ads_read` is sufficient)

This is not a full integration. It is one authenticated API call that proves the architecture works. The customer sees their real campaign names displayed inside the platform. That moment — recognising their own data — produces more trust than any amount of demo scripting.

**Acceptance criterion:** A real Meta Ads account can be connected. Real campaign names appear in the connections view. Mock spend continues to be displayed clearly labelled as simulated.

---

## Final Decision

### Option assessment:

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **Continue as-is** | ❌ No | Mock content generator and no real integration proof will limit conversion from demo to pilot |
| **Improve demo UX** | ✅ Yes (partial) | Changes 1–4 above are high-impact, low-risk, and can be done without changing core architecture |
| **Build Meta read-only integration** | ✅ Yes (required) | Change 5 is the single highest-leverage engineering investment available |
| **Pivot toward managed ads mode** | ⚠️ Defer | The hybrid preference is a go-to-market decision, not a product rebuild. Address post-pilot |
| **Stop / rethink** | ❌ No | The architecture is sound, security is verified, and the core workflow is coherent |

### Recommended decision: **Improve demo UX + Build Meta read-only integration in parallel**

This is not a binary choice. The two tracks are independent and can run simultaneously:

**Track A — Demo UX (1–2 days):**
- Change 2: Budget pacing on campaign detail
- Change 3: Brand profile attribution during generation
- Change 4: TikTok as fifth mock connection

**Track B — Real Integration (3–5 days):**
- Change 5: Meta read-only integration (campaign list + structure)

**Track C — AI Content (2–3 days, if AI integration is approved):**
- Change 1: Replace mock generator with real LLM call

After these three tracks, the demo will demonstrate:
- A real read-only API call to Meta, proving the integration story
- AI-quality content output, making the generation feature evaluable
- Budget pacing, the most-requested missing metric
- TikTok in the platform list, removing the most predictable objection
- Brand profile visibly connected to content output

That is a significantly more persuasive 45 minutes than what the current platform delivers.

---

## Priority Table

| # | Change | Track | Impact | Effort | Priority |
|---|--------|-------|--------|--------|----------|
| C1 | Replace mock content with real AI | C | Very High | Medium | P1 |
| C5 | Meta read-only integration | B | Very High | High | P1 |
| C2 | Budget pacing on campaign detail | A | High | Low | P1 |
| C3 | Brand profile attribution in generation | A | Medium | Low | P2 |
| C4 | TikTok as fifth mock connection | A | Medium | Very Low | P2 |
| — | Weekly email digest / notification triggers | — | High | Medium | P3 |
| — | Conversion / ROAS metrics in channel view | — | High | Low | P3 |
| — | CPA computation from existing data | — | Medium | Low | P3 |
| — | Onboarding hybrid-mode "handoff" flow | — | Medium | Medium | P4 |
| — | Industry-average CTR benchmark overlay | — | Low | Low | P4 |

---

## Appendix — Feedback Collection Status

| Session | Date | Customer | Responses recorded | Status |
|---------|------|----------|--------------------|--------|
| Demo 1 | — | — | None | Not yet conducted |

**Action required:** Run the first real customer demo and return to this document. Annotate each section with actual verbatim responses. Update the priority table based on what the customer actually said they need most.
