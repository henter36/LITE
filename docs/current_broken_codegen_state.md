# Current Broken Codegen State

## 1. Current changed files

### git status output
`git --no-optional-locks status --short` returned no output.

### Files observed as changed / present in the broken recovery state
- `lib/api-spec/openapi.yaml` — source
- `lib/api-client-react/src/generated/api.ts` — generated
- `lib/api-client-react/src/generated/api.schemas.ts` — generated
- `lib/api-zod/src/index.ts` — generated/barrel
- `lib/api-client-react/src/compat.ts` — source
- `docs/generated_client_recovery_review.md` — docs
- `docs/current_broken_codegen_state.md` — docs

## 2. Exact current breakage

### `pnpm run typecheck`
Failed.

Exact error:
```text
lib/api-client-react/src/compat.ts:2:15 - error TS2305: Module '"./generated/api.schemas"' has no exported member 'UpdateMediaAssetBody'.

2 export type { UpdateMediaAssetBody as UpdateAssetBriefBody } from "./generated/api.schemas";
                ~~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:20:3 - error TS2305: Module '"./api.schemas"' has no exported member 'AddMemberBody'.

20   AddMemberBody,
     ~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:21:3 - error TS2305: Module '"./api.schemas"' has no exported member 'BrandProfile'.

21   BrandProfile,
     ~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:22:3 - error TS2305: Module '"./api.schemas"' has no exported member 'Campaign'.

22   Campaign,
     ~~~~~~~~

lib/api-client-react/src/generated/api.ts:23:3 - error TS2305: Module '"./api.schemas"' has no exported member 'CreateBrandProfileBody'.

23   CreateBrandProfileBody,
     ~~~~~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:24:3 - error TS2305: Module '"./api.schemas"' has no exported member 'CreateCampaignBody'.

24   CreateCampaignBody,
     ~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:25:3 - error TS2305: Module '"./api.schemas"' has no exported member 'CreateMediaAssetBody'.

25   CreateMediaAssetBody,
     ~~~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:26:3 - error TS2305: Module '"./api.schemas"' has no exported member 'CreateWorkspaceBody'.

26   CreateWorkspaceBody,
     ~~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:30:3 - error TS2305: Module '"./api.schemas"' has no exported member 'ListMediaAssetsParams'.

30   ListMediaAssetsParams,
     ~~~~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:31:3 - error TS2305: Module '"./api.schemas"' has no exported member 'MediaAsset'.

31   MediaAsset,
     ~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:32:3 - error TS2305: Module '"./api.schemas"' has no exported member 'UpdateMediaAssetBody'.

32   UpdateMediaAssetBody,
     ~~~~~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:33:3 - error TS2305: Module '"./api.schemas"' has no exported member 'UpdateMemberBody'.

33   UpdateMemberBody,
     ~~~~~~~~~~~~~~~~

lib/api-client-react/src/generated/api.ts:34:3 - error TS2305: Module '"./api.schemas"' has no exported member 'Workspace'.

34   Workspace,
     ~~~~~~~~

lib/api-client-react/src/generated/api.ts:35:3 - error TS2305: Module '"./api.schemas"' has no exported member 'WorkspaceMember'.

35   WorkspaceMember,
     ~~~~~~~~~~~~~~~

lib/api-zod/src/index.ts:1:15 - error TS2307: Cannot find module './generated/api' or its corresponding type declarations.

1 export * from "./generated/api";
                ~~~~~~~~~~~~~~~~~
```

### `pnpm --filter @workspace/api-spec run codegen`
Failed.

Exact error:
```text
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

## 3. Current OpenAPI media contamination

Remaining media-related entries in `lib/api-spec/openapi.yaml`:
- tag: `media-assets`
- path: `GET /media-assets`
- path: `POST /media-assets`
- path: `PATCH /media-assets/{id}`
- path: `DELETE /media-assets/{id}`
- schema: `MediaAssetType`
- schema: `MediaAssetStatus`
- schema: `MediaAsset`
- schema: `CreateMediaAssetBody`
- schema: `UpdateMediaAssetBody`

## 4. Generated file damage

- `lib/api-client-react/src/generated/api.ts` — **partially modified / inconsistent with OpenAPI**
- `lib/api-client-react/src/generated/api.schemas.ts` — **partially modified / missing exports / inconsistent with OpenAPI**
- `lib/api-zod/src/index.ts` — **missing exports / inconsistent with generated state**

## 5. Recovery options

Recommended option: **discard generated files and regenerate with `NODE_OPTIONS=--max-old-space-size=8192`**.

## Final output

- current risk level: **high**
- exact recommended next command: `NODE_OPTIONS=--max-old-space-size=8192 pnpm --filter @workspace/api-spec run codegen`
- do not make fixes
