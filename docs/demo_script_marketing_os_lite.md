# Marketing OS Lite — Customer Demo Script

**Version:** 1.0  
**Date:** 2026-05-02  
**Duration:** 30–45 minutes  
**Audience:** Marketing managers, agency owners, growth leads  
**Presenter:** [Your name]  
**Environment:** Marketing OS Lite — Demo Mode (all ad data is simulated)

---

## Before You Begin

- Open the app at your Replit preview URL (or published domain).
- Open `docs/demo_readiness_checklist.md` and confirm all green items.
- Keep this script visible in a second tab or printed.
- Have a blank tab ready for the UTM link copy/paste demonstration.
- Tell the customer upfront: **"Everything you see today uses simulated data. No real ad accounts are connected. No money is spent."**

---

## Opening (2 min)

> "Today I'm going to walk you through Marketing OS Lite — a platform that brings your campaign planning, content, approvals, and performance reporting into one place. Everything is connected to a single workspace, so your whole team sees the same picture."

> "The data you'll see is simulated — we've pre-loaded realistic campaign metrics, content, and recommendations so you can evaluate the workflow without needing to connect a live ad account first."

---

## Step 1 — Login (2 min)

**Action:** Navigate to the app's root URL. The login page should be visible.

1. Point out the **"Demo Mode — No real ad spend or publishing occurs"** notice at the bottom of the page.
2. Click **"Try the Demo Account"** or enter manually:
   - Email: `demo@marketingos.local`
   - Password: `Demo12345!`
3. Click **Sign In**.

**What to say:**
> "In production, each customer gets their own workspace. Your team members get roles — viewer, editor, admin, or owner — so you control who can see what and who can make changes."

**What to show:** The dashboard loads immediately. Point out the workspace name "Bright & Bold Agency" in the sidebar or header.

---

## Step 2 — Dashboard Overview (3 min)

**Action:** The dashboard is the first screen after login.

1. Walk through the **headline KPI cards** at the top: Total Spend, Total Impressions, Clicks, Avg CTR, Avg CPC, Total Conversions.
2. Point to the **Daily Trend chart** — show the spend/click trend over 30 days.
3. Point to the **Best Channel** and **Worst Channel** summary.
4. Scroll down to the **Channel Comparison** section.

**What to say:**
> "This is your command centre. In one glance you can see which channel is performing, where spend is going, and what your overall return looks like."

> "Today this data is simulated across Instagram, Snapchat, YouTube, and X — but once you connect a real account, the same view fills with your actual numbers."

**Key message:** The layout and logic are production-ready. The data source switches from mock to real when you connect a live account.

---

## Step 3 — Brand Profile (3 min)

**Action:** Click **Brand Profile** in the sidebar.

1. Show the existing brand profile for "Bright & Bold."
2. Walk through the fields: **Tone of Voice**, **Target Audience**, **Products/Services**, **Forbidden Claims**, **Preferred Channels**, **Visual Notes**.

**What to say:**
> "The brand profile is the foundation of everything downstream. When you generate ad content, the AI uses this profile to make sure the copy matches your voice, targets the right audience, and never makes claims you've told it to avoid."

> "If you say 'do not claim guaranteed ROI' here, the generated content won't say it. This is your brand guardrail."

**Demo tip:** Read out the "Forbidden Claims" field to reinforce the governance angle.

---

## Step 4 — Campaign Creation (5 min)

**Action:** Click **Campaigns** → **New Campaign** (or the `+` button).

Fill in the form:
| Field | Value to enter |
|-------|----------------|
| Campaign Name | `Live Demo Campaign` |
| Objective | `Leads` |
| Product/Service | `Marketing OS Lite` |
| Target Audience | `Marketing managers at SMBs, 28–45` |
| Geography | `United States` |
| Budget Suggestion | `4000` |
| Start Date | [today's date] |
| End Date | [+60 days] |
| Channels | Select `Instagram`, `YouTube` |
| Landing URL | `https://example.com/demo` |

Click **Create Campaign**.

**What to say:**
> "This is where a campaign brief becomes a structured record. Every field feeds into content generation — the audience field, the objective, the channels. Notice we're not building creative yet. This is the brief."

> "The status starts as 'Draft.' It moves to 'Approved' when a team member with the right role signs off."

**Key message:** Structured briefs prevent the classic chaos of campaigns starting as a Slack message and ending up half-built in five different places.

---

## Step 5 — Content Generation (5 min)

**Action:** Open the campaign you just created (or click **Summer Brand Awareness 2025** for a pre-seeded example with more data). Click **Generate Content**.

1. Watch the generation run — a set of assets is created: **Headline**, **Short Caption**, **Long Caption**, **CTA**, **Hashtags**, **Video Script**, **Storyboard Outline**.
2. Click into one asset to expand it.
3. Click the **Variants** tab to show channel-specific versions: Instagram caption, Snapchat copy, YouTube description, X thread.

**What to say:**
> "Content generation uses your brand profile plus the campaign brief. It produces a full asset pack — everything from a short social caption to a video script outline."

> "Each channel gets its own variant. Instagram gets 'tap the link in bio.' Snapchat gets 'swipe up.' YouTube gets a subscribe-oriented CTA. The platform-specific language is handled automatically."

> "Right now this uses a fast mock generator so you can evaluate the workflow. The production version connects to the AI model of your choice — we're provider-agnostic."

**Key message:** The workflow is defined. AI is a pluggable component, not the product.

---

## Step 6 — Asset Approval / Rejection (3 min)

**Action:** On the asset you just generated (or the pre-seeded asset), click **Approve** or **Request Changes**.

1. Show the **decision modal** — approve, reject, or request changes with a reason field.
2. Submit an approval.
3. Show how the **asset status** changes (Draft → Approved).
4. Navigate to the existing approved asset to show the full approval history.

**What to say:**
> "Every asset goes through a review gate before it moves forward. You decide who can approve — only editors and above. Viewers can see but not approve."

> "There's also a hard guard: 'Publish Live' is disabled in this environment. Even if someone tries to push an asset directly to an ad platform, the system blocks it. Publishing requires a real integration to be set up by an admin."

**Key message:** Approval workflow + role gates mean nothing goes live without the right eyes on it.

---

## Step 7 — Tracking Link Generation (4 min)

**Action:** Click **Tracking Links** in the sidebar. Select the `Summer Brand Awareness 2025` campaign (or your demo campaign).

1. Click **New Tracking Link**.
2. Fill in:
   - Channel: `Instagram`
   - Source: `instagram`
   - Medium: `paid_social`
   - Campaign: `summer-awareness-demo`
   - Content: `carousel_v1`
   - Final URL: `https://example.com/landing`
3. Click **Generate**.
4. Show the generated UTM URL in the result.
5. Copy it — open a blank tab and paste the URL to show what a tagged link looks like.

**What to say:**
> "Tracking links are UTM-parameterised URLs generated from your campaign metadata. The campaign name, source, and medium flow in automatically — you just add the content variant and the destination URL."

> "Every link is stored against the campaign, so your team always knows which URLs belong to which campaign. No more 'where did that UTM link come from?' moments."

**Key message:** Structured UTM management, scoped to campaigns and workspaces.

---

## Step 8 — Mock Ad Connections (3 min)

**Action:** Click **Connections** in the sidebar.

1. Show the four connected mock accounts: Instagram, Snapchat, YouTube, X.
2. Point out the mock spend, impressions, and click numbers on each card.
3. Click **Sync** on one account — show the numbers update.
4. Click **Connect Account** — show the connection form (platform + account name).

**What to say:**
> "In this demo, all four platforms are connected as simulations. The account names, spend figures, and click counts are representative of what real data looks like."

Point to the yellow **Mock Integration Mode** banner:
> "This banner is always visible in demo environments. It says: 'No real ad APIs are called and no real spend occurs.' In a production integration, this banner disappears and a live sync indicator replaces it."

> "The connection architecture supports Meta, Snapchat, YouTube, and X. The integration layer is the same for all — once we connect one, the pattern replicates to the others."

**Key message:** The plumbing is designed. Connecting a live platform is a configuration step, not a rebuild.

---

## Step 9 — Performance Reports (4 min)

**Action:** Click **Reports** (or **Performance**) in the sidebar.

1. Walk through the **spend trend** chart over the last 30 days.
2. Show the **channel breakdown** — spend and CTR by platform.
3. Point out the **best and worst performing channel** summary cards.
4. If available, show a per-campaign metric view.

**What to say:**
> "Reports pull from the same metrics data that feeds the dashboard. Here you can drill into specific date ranges, filter by platform, and compare channels side by side."

> "These 150 data points were generated with realistic variance — CTR around 2–4% depending on the channel, CPC matching real-world averages for awareness campaigns. The structure is identical to what you'd see with live data."

**Key message:** The reporting layer is ready. Real data slots in when the integration is active.

---

## Step 10 — Recommendations (3 min)

**Action:** Click **Recommendations** in the sidebar.

1. Walk through the list — show a mix of `High`, `Medium`, and `Low` priority items.
2. Click into a High priority recommendation (e.g. "Test a stronger headline hook" or "Narrow Snapchat audience targeting").
3. Show that recommendations are campaign-linked and include specific rationale.
4. Mark one as read.

**What to say:**
> "Recommendations are generated from your metrics. When a channel's CTR drops below benchmark, or CPC spikes above target, the system surfaces a specific action with the reason."

> "In this demo they're pre-seeded. In production, they update as performance data refreshes. The goal is to surface the one or two things that will move the needle — not a report you have to interpret yourself."

**Key message:** Actionable intelligence, not just data.

---

## Step 11 — Audit Log (2 min)

**Action:** Click **Audit Log** in the sidebar.

1. Show the log entries — campaign created, content generated, asset approved, connections synced.
2. Point out the **actor**, **timestamp**, **action**, and **entity** columns.
3. Note that the audit log is workspace-scoped — you only see activity from your own workspace.

**What to say:**
> "Every significant action is logged — who did what, to which object, and when. This is non-negotiable for any platform that touches ad spend. If a campaign goes out with wrong copy, you can trace exactly who approved it and when."

> "The audit log is read-only and append-only. Nobody can delete entries — including admins."

**Key message:** Full accountability chain for every action in the workspace.

---

## Closing (2 min)

**Summary points to hit:**

1. **Single workspace** — campaigns, content, approvals, tracking, reporting, and audit in one place.
2. **Role-based access** — viewer, editor, admin, owner. Nothing goes live without the right approvals.
3. **Mock-to-real path is clear** — the workflow is identical whether data is simulated or live. Connecting a real account is a configuration step, not a redesign.
4. **No surprises** — every guard rail is visible. Live publishing is blocked. No real spend occurs until you explicitly enable it.

**Hand off to Q&A and feedback collection.**

> "Before we wrap up, I'd love to get your honest reaction to a few things — I have a short set of feedback questions. They'll take about 5 minutes and will directly shape what we build next."

---

## Demo Credentials (Reference)

| Account | Email | Password | Workspace | Role |
|---------|-------|----------|-----------|------|
| Demo User | `demo@marketingos.local` | `Demo12345!` | Bright & Bold Agency | Owner |
| Isolation Test | `alice@test.local` | `AliceTest123!` | Alice's Agency | Owner |

> Note: Alice's account can be used live to demonstrate workspace isolation — log in as Alice and show that she cannot see any of Demo User's campaigns, assets, or data.

---

## Presenter Reminders

- Never claim real ad spend is happening. The mock banner is always visible.
- Do not promise a specific platform integration date.
- If asked about pricing — "we're working through pricing models and your feedback today will inform that directly."
- If the app throws an error — refresh and log in again. Sessions are persistent across refreshes.
- If asked about AI model — "we're model-agnostic; the content layer connects to the model of your choice."
