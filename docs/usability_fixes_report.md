# Usability Fixes Report — Marketing OS Lite

**Date:** 2026-05-02
**Build:** post-fix commit (5 issues resolved)
**TypeScript status:** 0 errors across all packages
**Changed files:** 2 frontend pages (`campaign-detail.tsx`, `content-studio.tsx`)
**Backend changes:** none

---

## Summary

All 5 issues identified in `docs/usability_test_analysis.md` have been fixed. Changes are confined to two frontend page files. No backend modifications were made, no new APIs were added, and no real ad publishing or payment features were introduced.

---

## Fix 1 — Content Studio campaign context

### Before
Clicking **Generate Ads** in Campaign Detail navigated to `/content-studio` with no campaign information. The user arrived at a blank dropdown and had to manually re-select the campaign they were just looking at — a ~45-second stall in a live demo.

```jsx
// OLD
<Link href="/content-studio">
  <Button>Generate Ads</Button>
</Link>
```

### After
The campaign ID is passed as a URL query parameter. Content Studio reads it on mount and pre-selects the campaign automatically.

```jsx
// campaign-detail.tsx — all "Generate Ads" / "Review in Content Page" links
<Link href={`/content-studio?campaignId=${campaignId}`}>

// content-studio.tsx — reads param on mount
const search = useSearch();
const preselectedId = new URLSearchParams(search).get("campaignId") ?? "";
const [selectedCampaignId, setSelectedCampaignId] = useState<string>(preselectedId);
```

When arriving from a campaign, the Content Studio page shows a full-bleed header:
```
Generating ad content for
[Campaign Name]  [objective] campaign · [channels]
                                      [Generate Ads button]
```
A **Back to [Campaign Name]** button is also rendered so the user can return without losing context. The campaign picker dropdown is hidden when a campaign was pre-selected from the URL.

**Verification:** Navigate to any Campaign Detail → click "Generate Ads" → Content Studio opens with the correct campaign pre-loaded and the header clearly states which campaign is being worked on.

---

## Fix 2 — Request Edit dialog

### Before
Clicking "Request Edit" on an ad variant immediately fired the API call with a hardcoded reason (`"Please revise tone"`) and no user input. The user had no way to specify what they wanted changed.

```tsx
// OLD — fires immediately, no input
onClick={() => handleDecision(asset.id, "changes_requested")}
// ...
reason: decision === "changes_requested" ? "Please revise tone" : "",
```

### After
Clicking "Request Edit" opens a modal dialog with a required textarea. The mutation does not fire until the user clicks "Submit Feedback". The dialog can be dismissed with Cancel at any time.

```tsx
// Opens dialog
onClick={() => { setEditDialogAssetId(asset.id); setEditReason(""); }}

// Dialog: Textarea → Submit → calls handleDecision with actual reason
const handleSubmitEdit = () => {
  handleDecision(editDialogAssetId, "changes_requested", editReason.trim() || "Please revise");
  setEditDialogAssetId(null);
  setEditReason("");
};
```

Dialog copy:
- **Title:** "Request Changes"
- **Description:** "Describe what you'd like changed in this ad. Your notes will be saved with the revision request."
- **Placeholder:** "e.g. Make the tone more casual, remove the price mention, shorten the headline…"
- **Footer note:** "The ad will be marked as 'edits requested' so you can track its status."
- Buttons: Cancel (dismisses, clears state) · Submit Feedback (fires mutation)

Success and error toasts are shown for both outcomes. `handleDecision` now accepts an optional `reason` string instead of hardcoding one.

**Verification:** Click "Request Edit" on any variant → dialog opens → enter feedback text → click Submit → toast shows "Edit request submitted" → dialog closes.

---

## Fix 3 — Brand Profile missing warning

### Before
If no Brand Profile was configured, the Content Studio silently generated generic ads with no explanation. The brand context strip was hidden with no fallback message.

```tsx
// OLD — silently undefined, no warning
const brandProfile = brandProfiles?.[0]; // undefined if not set up
```

### After
When a campaign is selected but no brand profile exists, a prominent amber `Alert` appears above the generate button:

> **No brand profile set up**
> Without brand guidelines, generated ads will be generic and may not match your voice.
> [Set up your Brand Profile in Settings] ← clickable link to /settings

The Generate Ads button remains functional (not blocked) so users can still demo the flow, but the warning makes the impact clear. When a brand profile **does** exist, the positive confirmation strip is shown instead:

> ✓ Brand voice: [Brand Name] · N guardrails active

**Verification:** Log in to a workspace with no Brand Profile → navigate to Content → select a campaign → amber warning with Settings link appears. With a Brand Profile configured, the green confirmation strip appears instead.

---

## Fix 4 — Approval action clarity

### Before
Two separate buttons both used the word "Approve":
- "Approve Campaign" (header of Campaign Detail) — changes campaign.status via `useApproveCampaign`
- "Approve" (per-ad in Content Studio) — creates an approval record via `useCreateApproval`

No explanation existed for either. Users reliably asked "what's the difference?"

### After

**Campaign-level button (Campaign Detail header):**
- Renamed from "Approve Campaign" → **"Mark Campaign Ready"**
- Wrapped in a `<Tooltip>` with content: "Confirms the whole campaign is reviewed and ready to run. Different from approving individual ads in the Content page."
- Small helper text rendered below the button: "Approve individual ads first in the Content page"
- When the campaign is already approved, the button is replaced by a "Campaign Ready" badge (green check, no action available)

**Ad-level button (Content Studio):**
- Renamed from "Approve" → **"Approve This Ad"** (green, per-variant)
- "Request Edit" button retained as-is (now opens dialog per Fix 2)
- A contextual help strip added beneath all ad variants: "Once you've reviewed all variants, go back to [Campaign Name] and click Mark Campaign Ready to confirm it's ready to run."

**Campaign Detail Ad Content tab:**
- When ads exist, a footer note reads: "To approve or request edits on individual ads, use the Content page." with a direct link to `/content-studio?campaignId=X`.

**Verification:** Campaign Detail header shows "Mark Campaign Ready" (tooltip visible on hover). Content Studio per-variant buttons show "Approve This Ad" and "Request Edit". The contextual help strip below ads explains the connection between the two approval levels.

---

## Fix 5 — Campaign flow steps: clickable and accurate

### Before
- All 4 flow step pills were non-interactive `<div>` elements with no affordance for action
- Step 4 "Performance" was hardcoded `false` — never completed even for active campaigns with metrics
- No guidance was shown about what the current step required

```tsx
// OLD — static div, never clickable
<div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ...`}>
// ...
const completedSteps = [true, hasAssets, isApproved, false]; // ← always false
```

### After

**Clickable active steps:**
Each step now has an optional `href`. When a step is the current active step **and** has an href, it renders as a `<Link>` with a small `→` arrow, making it visually and functionally clickable:

| Step | Label | Href when active |
|---|---|---|
| 1 | Create Campaign | — (already done) |
| 2 | Generate Ads | `/content-studio?campaignId=X` |
| 3 | Mark Ready | — (action is the button above) |
| 4 | Performance | `/reports` |

**Next-action callout:**
Below the flow indicator, a contextual hint for the current step:
- Step 2: "Generate your ad content →" (clickable link)
- Step 3: "Review ads, then click 'Mark Campaign Ready' above" (info text)
- Step 4: "View demo performance data →" (clickable link)

**Step 4 completion:**
Step 4 now completes when `useListMetrics` returns data. The demo account has seeded metrics for active campaigns, so step 4 correctly shows as complete (green check) for any campaign that has been approved.

```tsx
// NEW — step 4 driven by real metric data
const { data: metrics } = useListMetrics({ campaignId }, { ... });
const hasMetrics = (metrics?.length ?? 0) > 0;
const completedSteps = [true, hasAssets, isApproved, hasMetrics];
```

**Verification:** On a campaign with assets and approved status → all 4 steps show green checks (since demo metrics exist). On a draft campaign → step 2 pill shows as active and is a clickable link to Content Studio. Step 3 shows next-action text pointing to the "Mark Campaign Ready" button.

---

## Verification Checklist

| Requirement | Status |
|---|---|
| Campaign Detail → Content Studio retains campaign context | ✓ |
| "Generating ad content for: [Campaign Name]" shown on Content page | ✓ |
| User can request edits with written notes | ✓ |
| Request Edit fires only after user submits feedback | ✓ |
| Brand Profile status visible before generating content | ✓ |
| Warning shown when no Brand Profile is configured | ✓ |
| Link to Settings/Brand Profile in warning | ✓ |
| "Approve Campaign" and "Approve [ad]" are clearly distinct | ✓ |
| "Mark Campaign Ready" has tooltip explaining difference | ✓ |
| Helper text connects ad approval to campaign readiness | ✓ |
| Flow steps are navigable (clickable) when actionable | ✓ |
| Step 4 Performance can show as complete | ✓ |
| Next action is shown for each active step | ✓ |
| Auth, workspace isolation, roles, audit logs still work | ✓ (no auth code changed) |
| No wording implies real ads are running | ✓ ("Demo mode · No real ads are running" banner unchanged) |
| TypeScript: 0 errors | ✓ |
| Backend unchanged | ✓ |

---

## Remaining UX Gaps (not in scope for this fix)

These were not in the five prioritised issues and have not been changed:

| Gap | Severity | Notes |
|---|---|---|
| New Campaign form has 10 fields on one screen with no progressive disclosure | MEDIUM | Consider a two-step form: "core brief" → "targeting details" in a future iteration |
| No social-media mock-up of generated ad content | LOW | Users see text-only cards; a channel-specific ad preview would improve trust in generated copy |
| "Demo Spend" KPI label initially reads as real spend | LOW | Consider renaming to "Projected Spend" and moving the "simulated" qualifier closer to the number |
| Tracking Links not surfaced in global navigation | LOW | Only accessible from Campaign Detail → Tracking Links tab; no global management view |
| Dashboard "Today's Action" silently absent with no recommendations | LOW | Add a static fallback card ("Create your first campaign") when recommendations are empty |

---

## Pilot Readiness Decision

### Verdict: Ready for controlled pilot

The three issues that were most likely to stall a live demo have been resolved:

1. Content Studio no longer drops campaign context — the primary flow (Campaign Detail → Generate Ads → review → return) now works without any re-selection or backtracking.
2. Request Edit is a real feedback mechanism — the salesperson can demonstrate collecting revision notes, which shows actual workflow value.
3. Brand Profile status is always visible — the connection between brand setup and ad quality is now explicit before a single click is made.

The two approval actions are now clearly labelled with different names, different helper text, and different positions in the UI. The flow indicator is live — it accurately reflects campaign progress and provides direct navigation shortcuts.

**Recommended next steps before full self-serve pilot:**
- Run one moderated session (30 min) with a real non-technical user to validate the five fixes land as expected
- Address the "New Campaign form overload" gap (MEDIUM, ~2h effort) before any pilot where users create campaigns independently

The platform is ready for **salesperson-accompanied demo sessions** and **controlled pilot accounts where onboarding support is provided**.

---

*Report generated after applying all 5 fixes. Two files changed: `artifacts/marketing-os/src/pages/campaign-detail.tsx`, `artifacts/marketing-os/src/pages/content-studio.tsx`. TypeScript: 0 errors. No backend changes.*
