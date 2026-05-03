# Codegen Clean Recovery Report

## Files changed

### Source (edited)
- `lib/api-spec/openapi.yaml` — rewritten to clean state; all media paths/schemas removed; full component schemas restored (was corrupted with `# ... existing schemas unchanged ...` placeholder)
- `lib/api-client-react/src/compat.ts` — cleared; previously re-exported media types that no longer exist after clean codegen

### Generated (overwritten by codegen)
- `lib/api-client-react/src/generated/api.ts` — regenerated clean; no media hooks
- `lib/api-client-react/src/generated/api.schemas.ts` — regenerated clean; no media types
- `lib/api-zod/src/generated/api.ts` — regenerated clean; `HealthCheckResponse` Zod schema present
- `lib/api-zod/src/index.ts` — barrel re-export restored by codegen postscript

### Docs (created)
- `docs/codegen_clean_recovery_report.md` — this file

---

## Codegen result

**PASSED**

Command: `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @workspace/api-spec run codegen`

Output:
```
🎉 api-client-react - Your OpenAPI spec has been converted into ready to use orval!
🎉 zod - Your OpenAPI spec has been converted into ready to use orval!
typecheck:libs passed
EXIT:0
```

---

## Typecheck result

- `lib` typecheck: **PASSED**
- `artifacts/api-server` typecheck: **PASSED**
- `artifacts/marketing-os` typecheck: **FAILED (pre-existing)**

The frontend typecheck errors are pre-existing mismatches between the frontend pages and the OpenAPI schema. They were present before the media contamination was introduced, and are not caused by this recovery. Examples of pre-existing errors:

- `getGetChannelComparisonQueryKey` not exported (hook never in the spec)
- `Campaign.objective`, `Campaign.channels`, `Campaign.landingUrl` — fields the frontend expects but not in the spec schema
- `BrandProfile.brandName`, `BrandProfile.targetAudience` — same pattern
- `Workspace.businessType`, `Workspace.country` — same pattern
- `settings.tsx` `editor` role — not in the `UpdateMemberBodyRole` enum

None of these errors were introduced by this recovery.

---

## HealthCheckResponse export

**RESTORED**

- `lib/api-zod/src/generated/api.ts` exports `HealthCheckResponse` as a Zod schema
- `lib/api-zod/src/index.ts` re-exports it via `export * from "./generated/api"`
- `artifacts/api-server/src/routes/health.ts` imports `HealthCheckResponse` from `@workspace/api-zod` — this now resolves correctly

---

## No media types in generated files

Confirmed: grep for `MediaAsset`, `CreateMediaAssetBody`, `UpdateMediaAssetBody`, `MediaAssetType`, `MediaAssetStatus` across all three generated files returns zero matches.

---

## Backend status

**RUNNING**

- Build succeeded in 459ms
- Server listening on port 8080
- Session store table ready

---

## Frontend status

**RUNNING**

- Vite dev server started
- Runtime errors are pre-existing hook mismatches (not caused by this recovery)

---

## Safety check

Confirmed no changes made to:
- live publishing
- payments
- budget changes
- autonomous optimization
- Meta read-only safety
- AI fallback safety

---

## Remaining risks

1. **Frontend typecheck pre-existing failures** — the marketing-os frontend imports many hooks and schema fields that do not exist in the OpenAPI spec. These pre-date this recovery and need a separate, scoped fix per page.
2. **`compat.ts` cleared** — the file previously re-exported media types as compat aliases. It is now empty. If any consumer was relying on `UpdateAssetBriefBody` from `compat.ts`, that import will fail at typecheck time. No such consumer was found in the current codebase.
3. **`--max-old-space-size=8192` required** — codegen OOMs at default heap. The `codegen` npm script does not set this flag. Any future codegen run should use `NODE_OPTIONS=--max-old-space-size=8192` or the script should be updated to include it.

---

## Clean-state decision

**Clean with warnings**

- Codegen: clean
- Backend: clean and running
- `HealthCheckResponse`: restored
- Media types: fully removed from spec and generated files
- Frontend typecheck: pre-existing failures unrelated to this recovery
