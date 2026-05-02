# Marketing OS Lite — Customer Demo Script

**Version:** 1.1 (Updated 2026-05-02 — Track A UX improvements applied)  
**Duration:** 30–45 minutes  
**Audience:** Marketing managers, agency owners, growth leads  
**Presenter:** [Your name]  
**Environment:** Marketing OS Lite — Demo Mode (all ad data is simulated)

---

## What Changed in v1.1

| # | Change | Where to see it |
|---|--------|----------------|
| 1 | Budget pacing panel on every campaign | Campaign detail → Configuration card |
| 2 | Brand profile attribution on generated assets | Content Studio → blue banner + asset footer |
| 3 | TikTok added as fifth mock connection | Connections page |

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

> "Today this data is simulated across Instagram, Snapchat, YouTube, X, and TikTok — but once you connect a real account, the same view fills with your actual numbers."

**Key message:** The layout and logic are production-ready. The data source switches from mock to real when you connect a live account.

---

## Step 3 — Brand Profile (3 min)

**Action:** Click **Brand Profile** in the sidebar.

1. Show the existing brand profile for "Bright & Bold."
2. Walk through the fields: **Tone of Voice**, **Target Audience**, **Products/Services**, **Forbidden Claims**, **Preferred Channels**, **Visual Notes**.

**What to say:**
> "The brand profile is the foundation of everything downstream. When you generate ad content, the system uses this profile to make sure the copy matches your voice, targets the right audience, and never makes claims you've told it to avoid."

> "If you say 'do not claim guaranteed ROI' here, the generated content won't include it. This is your brand guardrail — and you'll see it confirmed in the Content Studio."

**Demo tip:** Read out the "Forbidden Claims" field. Then say: "In the next step, you'll see this profile referenced on every asset that gets generated."

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

## Step 4b — Budget Pacing (NEW — 1 min, inline with Campaign Detail)

**Action:** Click into the campaign you just created (or **Summer Brand Awareness 2025** for a pre-seeded example). Look at the **Configuration** card on the right.

Point to the **Budget Pacing** panel inside the Configuration card.

**What to say:**
> "See this pacing panel. It shows you today's simulated spend against where the budget should be given how many days have elapsed. 'Day 30 of 60 — $2,300 spent — expected $2,500 — On Pace.'"

> "Right now this runs on simulated data. When a live ad account is connected, the spend figure comes directly from the platform. The calculation and display are identical."

Point to the small **flask icon and 'Simulated pacing'** note at the bottom of the panel:
> "We always label simulated data clearly so there's no ambiguity. That label disappears when real data is flowing."

**Key message:** Budget pacing answers the most common daily question — 'are we on track?' — without opening four different ad dashboards.

---

## Step 5 — Content Generation (5 min)

**Action:** Click **Content Studio** in the sidebar. Select **Summer Brand Awareness 2025** from the campaign dropdown. Then click **Generate Content**.

**Before clicking Generate — point to the blue banner:**

> "See this banner at the top? It says: 'Using brand profile: Bright & Bold — Tone: Confident, energetic — 2 guardrails applied.' The system is telling you exactly which brand rules it's working from before it even generates a word."

**After generation — point to the asset footer:**

> "And down here at the bottom of every asset — the same confirmation. Brand profile used, guardrails active. If someone on your team asks 'did this follow our brand guidelines?' — the answer is right here, with a timestamp."

Walk through the asset content:
1. **Headline**, **Short Copy**, **Long Copy**, **CTA**, **Hashtags**
2. Point to the right panel: **Video Script** and **Storyboard**

**What to say:**
> "Right now this uses a simulated generator so the workflow is clear. The production version connects to the AI model of your choice — we're provider-agnostic. The brand profile and guardrail logic are the same regardless of which model generates the output."

**Key message:** The brand governance layer is built and visible. The AI provider is a swappable component underneath it.

---

## Step 6 — Asset Approval / Rejection (3 min)

**Action:** On the asset you just generated, click **Approve** or **Request Changes**.

1. Show the **decision buttons** — Reject, Revise, Approve.
2. Submit an approval.
3. Show how the **asset status badge** changes (Draft → Approved).

**What to say:**
> "Every asset goes through a review gate before it moves forward. You decide who can approve — only editors and above. Viewers can see but not approve."

> "There's also a hard guard: 'Publish Live' is disabled in this environment. Even if someone tries to push an asset directly to an ad platform, the system blocks it at the API level."

**Key message:** Approval workflow + role gates mean nothing goes live without the right eyes on it.

---

## Step 7 — Tracking Link Generation (4 min)

**Action:** Click **Tracking Links** in the sidebar. Select the `Summer Brand Awareness 2025` campaign.

1. Click **New Tracking Link**.
2. Fill in: Channel `Instagram`, Source `instagram`, Medium `paid_social`, Campaign `summer-awareness-demo`, Final URL `https://example.com/landing`.
3. Click **Generate**.
4. Copy the generated UTM URL and paste it in the blank tab.

**What to say:**
> "Tracking links are UTM-parameterised URLs generated from your campaign metadata. The campaign name, source, and medium flow in automatically — you just add the destination URL."

> "Every link is stored against the campaign, so your team always knows which URLs belong to which campaign."

**Key message:** Structured UTM management, scoped to campaigns and workspaces.

---

## Step 8 — Mock Ad Connections (3 min)

**Action:** Click **Connections** in the sidebar.

1. Show **five** connected mock accounts: Instagram, Snapchat, YouTube, X, **TikTok** (new).
2. Point out the mock spend, impressions, and click numbers on each card.
3. Click **Sync** on one account — show the numbers update.
4. Point to the TikTok card specifically.

**What to say:**
> "You'll notice we now have five platforms — Instagram, Snapchat, YouTube, X, and TikTok. All are running in simulation mode."

Point to the amber **Mock Integration Mode** banner:
> "This banner is always visible in the demo environment. It says: 'No real ad APIs are called and no real spend occurs.' In a production integration, this banner disappears and a live sync indicator replaces it."

> "TikTok is here as a mock connection because it's become a major channel, particularly for brands targeting under-35 audiences. The integration architecture supports it alongside the other four."

**Key message:** Five platforms, same integration pattern, clearly labelled as simulated.

---

## Step 9 — Performance Reports (4 min)

**Action:** Click **Reports** in the sidebar.

1. Walk through the **spend trend** chart over the last 30 days.
2. Show the **channel breakdown** — spend and CTR by platform.
3. Point out the **best and worst performing channel** summary cards.

**What to say:**
> "Reports pull from the same metrics data that feeds the dashboard. Here you can drill into specific date ranges, filter by platform, and compare channels side by side."

**Key message:** The reporting layer is ready. Real data slots in when the integration is active.

---

## Step 10 — Recommendations (3 min)

**Action:** Click **Recommendations** in the sidebar.

1. Walk through the list — show a mix of `High`, `Medium`, and `Low` priority items.
2. Click into a High priority recommendation.
3. Show campaign-linked rationale.
4. Mark one as read.

**What to say:**
> "Recommendations are generated from your metrics. When a channel's CTR drops below benchmark, or CPC spikes above target, the system surfaces a specific action with the reason."

**Key message:** Actionable intelligence, not just data.

---

## Step 11 — Audit Log (2 min)

**Action:** Click **Audit Log** in the sidebar.

1. Show the log entries — including the new TikTok connection entry.
2. Point out the **actor**, **timestamp**, **action**, and **entity** columns.

**What to say:**
> "Every significant action is logged — who did what, to which object, and when. If a campaign goes out with wrong copy, you can trace exactly who approved it and when. The log is append-only — nobody can delete entries, including admins."

**Key message:** Full accountability chain for every action in the workspace.

---

## Closing (2 min)

**Summary points to hit:**

1. **Single workspace** — campaigns, content, approvals, tracking, reporting, and audit in one place.
2. **Brand governance is visible** — every generated asset shows which profile was used and which guardrails were active.
3. **Budget pacing is live** — one glance tells you if you're on track without opening five dashboards.
4. **Five platforms** — Instagram, Snapchat, YouTube, X, TikTok. All mock today; same workflow when live.
5. **Mock-to-real path is clear** — simulated data is always labelled. The workflow is identical with real data.

**Hand off to Q&A and feedback collection.**

> "Before we wrap up, I'd love to get your honest reaction to a few things — I have a short set of feedback questions that will take about 5 minutes."

---

## Demo Credentials (Reference)

| Account | Email | Password | Workspace | Role |
|---------|-------|----------|-----------|------|
| Demo User | `demo@marketingos.local` | `Demo12345!` | Bright & Bold Agency | Owner |
| Isolation Test | `alice@test.local` | `AliceTest123!` | Alice's Agency | Owner |

---

## Presenter Reminders

- Never claim real ad spend is happening. The mock and flask labels are always visible.
- Do not promise a specific platform integration date.
- If asked about pricing — "we're working through pricing models and your feedback today will inform that directly."
- If the app throws an error — refresh and log in again. Sessions are persistent across refreshes.
- If asked about AI model — "we're model-agnostic; the content layer connects to the model of your choice."
- If asked why TikTok isn't integrated for real yet — "it's in our integration roadmap. The mock connection is here so you can see where it fits in the workflow."
