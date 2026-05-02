# Meta Read-only Guardrails

**Project:** Marketing OS Lite  
**Scope:** Phase 3 — Meta/Instagram read-only integration  
**Status:** Active

---

## Environment Variables

| Variable | Required | Values | Description |
|----------|----------|--------|-------------|
| `META_PROVIDER` | Yes | `mock` (default) · `real` | Selects provider. `mock` uses seeded demo data. `real` activates `MetaReadOnlyProvider` (requires `META_ACCESS_TOKEN`). |
| `META_ACCESS_TOKEN` | Only when `META_PROVIDER=real` | Long-lived user access token or system user token | Must have `ads_read` permission on the target ad accounts. Never placed in any frontend code or HTTP response. |

### How to activate live read-only access

1. Obtain a long-lived Meta access token with `ads_read` permission.
2. Add `META_ACCESS_TOKEN` as a Replit Secret (via the Secrets tab — never in source code).
3. Change `META_PROVIDER` from `"mock"` to `"real"` in shared env vars.
4. Restart the API server workflow.

No code changes are required. No frontend changes are required.

---

## Provider Architecture

```
getMetaProvider()
│
├─ META_PROVIDER = "mock"  (default)
│   └─→  MockMetaAdsProvider
│         • Returns seeded demo data
│         • source: "mock" on all records
│         • No network calls
│         • fallbackUsed: false
│
├─ META_PROVIDER = "real" | "meta_readonly"
│   ├─ META_ACCESS_TOKEN present
│   │   └─→  MetaReadOnlyProvider
│   │         • Calls Meta Graph API v20.0
│   │         • source: "meta_readonly" on all records
│   │         • Read-only HTTP GET requests only
│   │         • fallbackUsed: false
│   │
│   └─ META_ACCESS_TOKEN missing
│       └─→  MockMetaAdsProvider  (fallback)
│             • source: "mock" on all records
│             • fallbackUsed: true
│             • Logged at WARN level: "META_ACCESS_TOKEN not set"
│             • No crash — graceful degradation
│
└─ Runtime error during MetaReadOnlyProvider call
    └─→  Route handler returns 502
          • meta_readonly_sync_failed audit log entry written
          • Error detail logged server-side (never exposed to client)
```

### MetaAdsProvider interface

All providers implement:

```typescript
interface MetaAdsProvider {
  listAdAccounts(): Promise<MetaAdAccount[]>;
  listCampaigns(accountId: string): Promise<MetaCampaign[]>;
  fetchMetrics(accountId: string, since: string, until: string): Promise<MetaMetricsSummary>;
}
```

---

## Read-only Scope

### Permitted (read-only)

| Operation | Endpoint | Scope |
|-----------|----------|-------|
| Get provider status | `GET /api/meta/status` | Auth + workspace access |
| List ad accounts | `GET /api/meta/accounts` | Auth + workspace access |
| Sync campaigns + metrics | `POST /api/meta/sync` | Auth + editor role minimum |

### Meta Graph API calls (when `META_PROVIDER=real`)

| Call | HTTP Method | Endpoint |
|------|-------------|----------|
| List ad accounts | GET | `/v20.0/me/adaccounts?fields=id,name,currency` |
| List campaigns | GET | `/v20.0/act_{id}/campaigns?fields=id,name,status,objective` |
| Fetch metrics | GET | `/v20.0/act_{id}/insights?fields=spend,impressions,clicks,reach,ctr` |

All calls are read-only HTTP GET requests against the Meta Graph API. No POST, PUT, PATCH, or DELETE requests are made to Meta.

---

## Forbidden Operations

The following operations are explicitly prohibited and will never be implemented:

| Operation | Status |
|-----------|--------|
| Create campaign on Meta | FORBIDDEN |
| Edit existing campaign | FORBIDDEN |
| Change ad budget | FORBIDDEN |
| Publish or activate an ad | FORBIDDEN |
| Pause or deactivate a campaign | FORBIDDEN |
| Connect a payment method | FORBIDDEN |
| Access pixel data or custom audiences | FORBIDDEN |
| Read user PII from Meta | FORBIDDEN |

Enforcement layers:

1. **`assertNoForbiddenOp(op)`** — throws immediately if a forbidden operation name is passed; called at every entry point.
2. **`rejectWriteOps(req, res)`** in `meta.ts` — HTTP 403 if any forbidden operation key appears in the request body.
3. **No route exists** for any write operation — the router only defines GET and the read-only POST /sync.
4. **`MetaReadOnlyProvider`** only issues HTTP GET calls — no POST/PUT/PATCH/DELETE to Meta Graph API.
5. **Safety guard check** — existing `rejectRealOps()` in `connections.ts` also blocks `publishLive`, `changeBudget`, `connectPayment`.

---

## Fallback Behavior

| Scenario | Result |
|----------|--------|
| `META_PROVIDER=mock` | MockMetaAdsProvider used, `fallbackUsed: false` |
| `META_PROVIDER=real`, token present | MetaReadOnlyProvider used, `fallbackUsed: false` |
| `META_PROVIDER=real`, token missing | MockMetaAdsProvider used, `fallbackUsed: true`, WARN logged |
| `META_PROVIDER=real`, token present, API call fails | 502 returned, `meta_readonly_sync_failed` audit logged |
| No `META_PROVIDER` set | Treated as `mock` |

**No crash occurs in any fallback path.** The app remains fully functional with demo data when credentials are absent.

---

## Data Labeling Rules

Every data record returned from the Meta provider layer carries a `source` field:

| Value | Meaning |
|-------|---------|
| `"mock"` | Seeded demo data — no real Meta credentials used |
| `"meta_readonly"` | Live data fetched from Meta Graph API (read-only) |

Rules:

1. All records in a sync result share the same `source` — mixing is not permitted.
2. The `MetaSyncResult.provider` field at the envelope level also indicates source.
3. `MetaSyncResult.fallbackUsed: true` indicates that `META_PROVIDER=real` was requested but mock was substituted due to missing credentials.
4. The UI displays a source badge on all synced data — never shows mixed or unlabeled data.
5. Demo data is never presented as live data, and live data is never presented as demo data.

---

## Audit Log Events

All Meta sync activity is written to the `audit_logs` table.

| Action | When | Details field includes |
|--------|------|----------------------|
| `meta_readonly_sync_started` | Before provider call | provider, fallback status, date range, workspaceId |
| `meta_readonly_sync_completed` | After successful sync | provider, fallback status, account count, campaign count, workspaceId |
| `meta_readonly_sync_failed` | On provider error | provider, error message (truncated), workspaceId |

All events include: `workspaceId`, `actor` (logged-in user name/email), `entityType: "meta_sync"`.

---

## Security Properties

| Property | Enforcement |
|----------|------------|
| `META_ACCESS_TOKEN` never in frontend | Token read only via `process.env` server-side; never in any HTTP response, React state, or Vite build env |
| `META_PROVIDER` env var not exposed to client | Server-side only; client receives `{ provider: "mock"|"meta_readonly" }` — the token value is never transmitted |
| Auth required on all Meta endpoints | `requireAuth` middleware on every route |
| Workspace isolation on all Meta endpoints | `requireWorkspaceAccess` middleware on status + accounts; `requireWorkspaceRole("editor")` on sync |
| Viewer cannot trigger sync | `requireWorkspaceRole("editor")` blocks viewers on `POST /api/meta/sync` |
| No foreign workspace access | `workspaceId` validated against session membership before any operation |
| Read-only API surface | No HTTP write methods exposed to Meta Graph API |
