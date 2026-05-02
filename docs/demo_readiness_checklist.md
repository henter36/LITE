# Marketing OS Lite — Demo Readiness Checklist

**Version:** 1.0  
**Date:** 2026-05-02  
**Run this checklist within 30 minutes of the demo.**

---

## How to Use

Work through each section in order. Every item marked **[REQUIRED]** must pass before the demo starts. Items marked **[RECOMMENDED]** are strongly advised. Items marked **[KNOWN LIMITATION]** are documented gaps — note them but do not block the demo.

Mark each item: ✅ Pass | ⚠️ Partial | ❌ Fail | — Skipped

---

## Section 1 — Environment & Server Health

| # | Check | Method | Expected | Status |
|---|-------|--------|----------|--------|
| 1.1 | API server is running | `GET /api/healthz` → `{"status":"ok"}` | HTTP 200 | |
| 1.2 | Frontend app loads | Open root URL in browser | Login page visible | |
| 1.3 | No workflow crash loops | Check server logs: no repeated `Error` entries within last 5 min | Clean logs | |
| 1.4 | Database is reachable | Login attempt succeeds (see Section 2) | Session established | |
| 1.5 | Session persistence | After login, refresh page — stays logged in | Still authenticated | |

**All [REQUIRED]. If 1.1–1.5 fail, do not proceed.**

---

## Section 2 — Authentication

| # | Check | Method | Expected | Status |
|---|-------|--------|----------|--------|
| 2.1 | Demo login works | `POST /api/auth/login` with `demo@marketingos.local / Demo12345!` | HTTP 200 + user object | |
| 2.2 | Session cookie is set | Check `Set-Cookie: mos.sid` in login response headers | `mos.sid` cookie present | |
| 2.3 | `auth/me` returns user | `GET /api/auth/me` after login | HTTP 200 + user object | |
| 2.4 | Unauthenticated access blocked | `GET /api/campaigns` without cookie | HTTP 401 | |
| 2.5 | Wrong password rejected | Login with incorrect password | HTTP 401 + error message | |
| 2.6 | Logout works | `POST /api/auth/logout` | Cookie cleared, 401 on `/me` | |
| 2.7 | Demo button on login page | "Try the Demo Account" button visible | Button present with credentials | |

**2.1–2.5 [REQUIRED]. 2.6–2.7 [RECOMMENDED].**

---

## Section 3 — Workspace Isolation

| # | Check | Method | Expected | Status |
|---|-------|--------|----------|--------|
| 3.1 | Demo user sees own workspace | `GET /api/campaigns?workspaceId=1` as demo user | Returns demo campaigns | |
| 3.2 | Demo user blocked from other workspace | `GET /api/campaigns?workspaceId=3` as demo user | HTTP 403 | |
| 3.3 | Alice login works | Login as `alice@test.local / AliceTest123!` | HTTP 200 + workspace 3 | |
| 3.4 | Alice blocked from demo campaigns | `GET /api/campaigns/1` as Alice | HTTP 403 | |
| 3.5 | Alice blocked from demo metrics | `GET /api/metrics?workspaceId=1` as Alice | HTTP 403 | |
| 3.6 | Switch-workspace blocked | `POST /auth/switch-workspace { workspaceId: 1 }` as Alice | HTTP 403 | |

**All [REQUIRED]. Workspace isolation is a core trust signal for multi-tenant demos.**

---

## Section 4 — Role Permissions

| # | Check | Method | Expected | Status |
|---|-------|--------|----------|--------|
| 4.1 | Owner can create campaign | `POST /api/campaigns` as demo user (owner) | HTTP 201 | |
| 4.2 | Owner can approve asset | `POST /api/approvals` with valid assetId | HTTP 201 | |
| 4.3 | Owner can update workspace | `PUT /api/workspaces/1` as demo user | HTTP 200 | |
| 4.4 | Missing workspaceId returns 400 | `GET /api/campaigns` (no workspaceId param) | HTTP 400 | |
| 4.5 | Non-member blocked on resource | `PUT /api/brand-profiles/1` as Alice | HTTP 403 | |

**All [REQUIRED].**

---

## Section 5 — Safety Guards (Mock-Only Mode)

| # | Check | Method | Expected | Status |
|---|-------|--------|----------|--------|
| 5.1 | Publish-live blocked | `POST /api/approvals { decision: "publish_live" }` | HTTP 403 + "disabled in MVP" message | |
| 5.2 | Mock banner visible on Connections page | Open Connections page | Yellow "Mock Integration Mode" alert visible | |
| 5.3 | Mock banner text is accurate | Read banner text | "simulated data only. No real ad APIs are called and no real spend occurs" | |
| 5.4 | Login page demo notice | Read footer on login page | "Demo Mode. No real ad spend or publishing occurs." | |
| 5.5 | Connections form works (mock) | Connect a new mock account via UI | Connection created, mock data generated | |
| 5.6 | Sync updates mock numbers | Sync an existing connection | Spend/impressions/clicks change | |

**All [REQUIRED]. These are the explicit guarantees to the customer.**

---

## Section 6 — Core Feature Smoke Tests

| # | Check | Method | Expected | Status |
|---|-------|--------|----------|--------|
| 6.1 | Dashboard loads with metrics | Navigate to Dashboard | KPI cards, trend chart, channel comparison visible | |
| 6.2 | Brand profile visible | Navigate to Brand Profile | Profile for "Bright & Bold" loaded | |
| 6.3 | Campaigns list loads | Navigate to Campaigns | At least 3 campaigns visible | |
| 6.4 | Campaign detail loads | Click Summer Brand Awareness 2025 | Campaign detail view renders | |
| 6.5 | Content generation works | Click Generate Content on a campaign | At least one asset created | |
| 6.6 | Asset variants visible | Open an asset | Channel variants tab shows Instagram/Snapchat/YouTube/X | |
| 6.7 | Tracking link creates UTM | Create tracking link | Generated URL has `utm_source`, `utm_medium`, `utm_campaign` params | |
| 6.8 | Connections page loads | Navigate to Connections | 4 mock accounts visible | |
| 6.9 | Reports/metrics load | Navigate to Reports | Charts render with data | |
| 6.10 | Recommendations load | Navigate to Recommendations | At least 5 recommendations, mix of high/medium/low | |
| 6.11 | Audit log loads | Navigate to Audit Log | At least 10 entries visible | |

**6.1–6.11 [REQUIRED]. If any fails, run `node --enable-source-maps ./dist/seed.mjs` from `artifacts/api-server` to re-seed.**

---

## Section 7 — No Real Integration Verification

| # | Check | Verify | Expected | Status |
|---|-------|--------|----------|--------|
| 7.1 | No real Meta API calls | Check server logs for `graph.facebook.com` or `api.instagram.com` | No such requests | |
| 7.2 | No real Snapchat API calls | Check server logs for `adsapi.snapchat.com` | No such requests | |
| 7.3 | No real Google/YouTube API calls | Check server logs for `googleapis.com` or `ads.google.com` | No such requests | |
| 7.4 | No real X API calls | Check server logs for `api.x.com` or `ads-api.twitter.com` | No such requests | |
| 7.5 | No payment integration present | Check codebase/UI | No Stripe, PayPal, or billing UI | |
| 7.6 | No autonomous budget changes | Check codebase | No code path that submits spend changes to real APIs | |

**All [REQUIRED]. These are absolute constraints — non-negotiable before any customer-facing session.**

---

## Section 8 — Presentation Environment

| # | Check | Action | Expected | Status |
|---|-------|--------|----------|--------|
| 8.1 | Browser is modern (Chrome/Firefox/Edge) | Check version | Chrome 120+, Firefox 120+, Edge 120+ | |
| 8.2 | Browser zoom at 100% | Cmd/Ctrl + 0 | No layout breaks | |
| 8.3 | Screen resolution ≥ 1280×720 | Check display settings | Sidebar and content both visible | |
| 8.4 | No browser extensions interfering | Test in incognito or clean profile | No ad blockers, no console errors | |
| 8.5 | Second tab open for UTM paste demo | Open blank tab | Ready for tracking link demonstration | |
| 8.6 | Demo script open in second window/monitor | Open this script | Presenter can reference without switching app tabs | |
| 8.7 | Feedback questions doc ready | Open `docs/customer_feedback_questions.md` | Ready for post-demo Q&A | |

**8.1–8.4 [REQUIRED]. 8.5–8.7 [RECOMMENDED].**

---

## Section 9 — Known Limitations (Document, Don't Block)

These items are acknowledged gaps. They do not prevent the demo but should be proactively disclosed if the topic comes up.

| # | Limitation | Customer-Facing Explanation |
|---|------------|-----------------------------|
| L-01 | No real ad platform integration | "The integration layer is architected and tested. Connecting a live account is a configuration step — we can do that with you in a follow-on session." |
| L-02 | AI content generation uses a mock generator | "In production this connects to the AI model of your choice. The workflow and prompt architecture are in place — the provider is pluggable." |
| L-03 | No rate limiting on auth endpoints | Internal — do not disclose. |
| L-04 | No email-based password reset | "Password reset via email isn't in the MVP. Admin can reset credentials directly." |
| L-05 | No multi-factor authentication | "MFA is on the roadmap for production. For demo environments, standard username/password is used." |
| L-06 | Metrics data is pre-seeded, not streaming | "In production, metrics refresh on a configurable schedule — hourly, daily, or on-demand sync." |
| L-07 | No cross-campaign budget allocation tool | "Budget allocation across campaigns is a planned feature post-MVP." |
| L-08 | Single workspace per demo user | "Multi-workspace views (agency parent accounts) are on the roadmap." |
| L-09 | No CSV/PDF export for reports | "Export is on the short-term roadmap. You can view all data in the UI today." |
| L-10 | No mobile app | "The platform is responsive on mobile browsers, but a dedicated mobile app is post-MVP." |

---

## Pre-Demo Sign-Off

| Role | Name | Confirmed | Time |
|------|------|-----------|------|
| Presenter | | | |
| Technical lead | | | |

**Do not start the demo until both sign-off lines are completed.**
