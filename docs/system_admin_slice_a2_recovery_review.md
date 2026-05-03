# System Admin Slice A2 Recovery Review

## 1. Files changed so far
- `artifacts/api-server/src/middleware/auth.ts` — **partial / blocked**
- `lib/db/src/schema/system-admin-users.ts` — **complete**
- `lib/db/src/schema/index.ts` — **complete**
- `docs/system_admin_slice_a1_schema_report.md` — **complete**
- `docs/system_admin_slice_a2_auth_guards_report.md` — **partial / not accepted**
- `docs/system_admin_slice_a2_recovery_review.md` — **complete**

## 2. Exact TypeScript error
`src/middleware/auth.ts:2:37 - error TS2305: Module '"@workspace/db"' has no exported member 'systemAdminUsersTable'.`

## 3. Whether auth middleware is currently broken
**Yes, partially.** The file contains the A2 guard code, but the API server typecheck is blocked by the `systemAdminUsersTable` export resolution issue.

## 4. Whether DB export exists in source but not visible to API server
**Yes.** The schema export exists in source under `lib/db/src/schema/index.ts`, but the API server typecheck still does not see `systemAdminUsersTable` through `@workspace/db`.

## 5. Whether package rebuild is needed
**Yes.** The DB package likely needs a rebuild/re-export refresh, or the import path needs adjustment so the API server picks up the schema export correctly.

## 6. Recommended recovery
**Split into A2a export verification / A2b guards.**
- A2a: verify the DB export path is visible through `@workspace/db`
- A2b: keep or reapply the guards once the export is confirmed

## Final output
- **current risk:** API server auth middleware is blocked on a stale or unseen DB export
- **broken files:** `artifacts/api-server/src/middleware/auth.ts`
- **recommended next action:** split into A2a export verification / A2b guards
