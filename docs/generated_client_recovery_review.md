# Generated Client Recovery Review

## 1. Current changed files

### Source files
- `lib/api-spec/openapi.yaml`

### Generated files
- `lib/api-client-react/src/generated/api.ts`
- `lib/api-client-react/src/generated/api.schemas.ts`
- `lib/api-zod/src/index.ts`

### Docs
- `docs/media_asset_foundation_slice_2_report.md`
- `docs/media_asset_foundation_slice_2_recovery_review.md`
- `docs/media_slice_2_codegen_recovery_report.md` (requested, not present)
- `docs/generated_client_recovery_review.md`

## 2. Current failure

### Exact command that fails
`pnpm --filter @workspace/api-spec run codegen`

### Exact error message
`FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`

### Failure source
- OpenAPI spec: **yes**, because the media OpenAPI changes triggered the regeneration attempt
- api-client generated files: **yes**, they are left in a partial refresh state after the failed run
- api-zod generated files: **yes**, the zod generation step did not complete
- barrel exports: **yes**, `lib/api-zod/src/index.ts` is a barrel file involved in the mismatch state
- package exports: **no direct evidence** from the current failure alone
- TypeScript project references: **not the root cause** of the current failure

## 3. HealthCheckResponse mismatch

- Imported from: `artifacts/api-server/src/routes/health.ts` via `@workspace/api-zod`
- Should be exported from: `lib/api-zod/src/generated/api.ts`, then re-exported by `lib/api-zod/src/index.ts`
- Missing because of: **stale/generated-state mismatch**, not a source-only code change

## 4. Media partial changes

### Remaining media OpenAPI/source changes
- `lib/api-spec/openapi.yaml` still contains media asset paths and schemas:
  - `GET /media-assets`
  - `POST /media-assets`
  - `PATCH /media-assets/{id}`
  - `DELETE /media-assets/{id}`
  - `MediaAssetType`
  - `MediaAssetStatus`
  - `MediaAsset`
  - `CreateMediaAssetBody`
  - `UpdateMediaAssetBody`

### Recommendation
- **Revert** if clean trusted build is the priority today.
- Keep only if a separate, smaller recovery pass can stabilize generation.

## 5. Recovery options

**Recommended:** restore last known good generated artifacts.

## 6. Safety check

Confirmed no changes were made to:
- live publishing
- payments
- budget changes
- autonomous optimization
- Meta read-only safety
- AI fallback safety

## Final output

- **broken files:** `lib/api-client-react/src/generated/api.ts`, `lib/api-client-react/src/generated/api.schemas.ts`, `lib/api-zod/src/index.ts`, and the media additions in `lib/api-spec/openapi.yaml`
- **exact root cause:** partial OpenAPI/codegen refresh left generated artifacts inconsistent after an OOM failure
- **recommended recovery command:** revert `lib/api-spec/openapi.yaml` media additions, then restore/regenerate generated client artifacts from the last known good state
- **do not make fixes yet**
