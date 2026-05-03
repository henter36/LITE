# Recovery Playbook

This playbook covers the most common breakage patterns in the Marketing OS
monorepo and the exact steps to diagnose and fix each one.

---

## 1. Restore a missing or incomplete OpenAPI path

**Symptom:** A backend route exists but has no generated React Query hook, or the
TypeScript compiler reports an unknown hook name on import.

**Steps:**

1. Locate the route in `artifacts/api-server/src/routes/`.
2. Note the HTTP method, path (convert `:param` → `{param}`), request body schema
   name, and response schema name.
3. Open `lib/api-spec/openapi.yaml` and add the path under `paths:`.
   - Every method block **must** have a unique `operationId`.
   - Reference existing schemas from `components/schemas` or add new ones.
4. Run the parity check to confirm there are no remaining gaps:
   ```sh
   pnpm --filter @workspace/scripts run check-openapi-parity
   ```
5. Regenerate the client (see section 2).

---

## 2. Regenerate the API client

**When to run:** After any change to `lib/api-spec/openapi.yaml`.

```sh
pnpm --filter @workspace/api-spec run codegen
```

This will:
- Regenerate `lib/api-client-react/src/generated/api.ts` and `api.schemas.ts`.
- Regenerate `lib/api-zod/src/generated/`.
- Run `pnpm run typecheck:libs` automatically.

**Verify freshness** (confirms the committed spec and generated files are in sync):

```sh
pnpm --filter @workspace/scripts run check-codegen-fresh
```

**Commit the generated files** together with the OpenAPI spec change. Never commit
a spec change without the matching generated files.

---

## 3. Validate that a specific hook exists

After running codegen, confirm the hook is exported:

```sh
grep "useUpdateAssetBrief\|useListMediaAssets" \
  lib/api-client-react/src/generated/api.ts
```

If the grep returns nothing, the `operationId` in the OpenAPI spec does not match
what Orval would produce (Orval camel-cases the operationId and prepends `use`).
Check the operationId casing in the YAML and rerun codegen.

---

## 4. Restore a truncated critical page

**Symptom:** `App.tsx` reports "has no default export" for a page, or a page
renders blank / shows only imports in the source.

**Steps:**

1. Check the file size:
   ```sh
   wc -l artifacts/marketing-os/src/pages/content-studio.tsx
   ```
2. If the count is suspiciously low (e.g. < 50 for a page that previously had
   hundreds of lines), restore from git:
   ```sh
   git show HEAD~1:artifacts/marketing-os/src/pages/content-studio.tsx \
     > artifacts/marketing-os/src/pages/content-studio.tsx
   ```
   Adjust the commit ref (`HEAD~1`, `HEAD~2`, …) until you find the last good
   version. Use `git log --oneline -- <file>` to browse the history.
3. Update only the specific import or usage that triggered the edit that caused
   the truncation — prefer targeted `edit` operations over full rewrites.
4. Typecheck the frontend to confirm the restore is clean:
   ```sh
   PORT=23624 BASE_PATH=/ pnpm --filter @workspace/marketing-os run typecheck
   ```

---

## 5. Verify critical pages end-to-end

Run the full workspace typecheck:

```sh
pnpm run typecheck
```

Expected output: all four artifact typechecks complete with exit 0.

Manually verify in the browser (log in with `demo@marketingos.local / Demo12345!`):

| Page | URL | Key elements |
|------|-----|-------------|
| Content Studio | `/content` | Ad variant cards, platform tabs, creative brief panel, approve/edit dialogs |
| Campaign Detail | `/campaigns/:id` | Campaign summary, status badge, publish tab |
| Dashboard | `/` | Metrics cards, recommendations |

---

## 6. Stability guards reference

| Guard | Command | Trigger |
|-------|---------|---------|
| OpenAPI parity | `pnpm --filter @workspace/scripts run check-openapi-parity` | Before adding a new route |
| Codegen freshness | `pnpm --filter @workspace/scripts run check-codegen-fresh` | After editing openapi.yaml |
| Large-file shrinkage | runs automatically on `git commit` | Prevents accidental truncation |
| Full typecheck | `pnpm run typecheck` | Before every merge |
