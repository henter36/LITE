# System Admin Slice A2a Recovery Review

## 1. Files changed so far
- `artifacts/api-server/src/middleware/auth.ts` — **partial / blocked**
- `lib/db/src/schema/system-admin-users.ts` — **complete**
- `lib/db/src/schema/index.ts` — **complete**
- `docs/system_admin_slice_a1_schema_report.md` — **complete**
- `docs/system_admin_slice_a2_auth_guards_report.md` — **partial / not accepted**
- `docs/system_admin_slice_a2_recovery_review.md` — **complete**
- `docs/system_admin_slice_a2a_db_export_report.md` — **not yet created**
- `docs/system_admin_slice_a2a_recovery_review.md` — **complete**

## 2. Exact TypeScript error
`src/middleware/auth.ts:2:37 - error TS2305: Module '"@workspace/db"' has no exported member 'systemAdminUsersTable'.`

## 3. Whether auth middleware is currently broken
**Yes.** The middleware still imports `systemAdminUsersTable`, and the API server typecheck fails on that import.

## 4. Whether DB export exists in source but not visible to API server
**Yes.** `lib/db/src/schema/index.ts` exports `./system-admin-users`, but the API server still cannot see `systemAdminUsersTable` through `@workspace/db`.

## 5. Whether package rebuild is needed
**Yes.** The DB package export graph likely needs a rebuild/refresh, or the import path needs to be adjusted so the API server resolves the symbol.

## 6. Recommended recovery
**Split into A2a export verification / A2b guards.**
- A2a: verify the DB export path is visible through `@workspace/db`
- A2b: only after that, reapply the guards

## Final output
- **current risk:** API auth middleware is blocked by a stale or unseen DB export
- **broken files:** `artifacts/api-server/src/middleware/auth.ts`
- **recommended next action:** split into A2a export verification / A2b guards
