# System Admin Slice A Cleanup Report

## Final decision
**Clean with warning**

## Status summary
- API typecheck: pass
- Frontend typecheck: pass
- OpenAPI parity: pass
- Codegen freshness: pass
- Broken system admin route: disabled
- Auth middleware: restored

## Warning
`lib/db/src/schema/system-admin-users.ts` still exists on disk.
- It is **not exported**.
- It is **not used** by the API server.
- It must be either reused in **Slice A1** or removed before production.

## Cleanup result
- Broken Slice A runtime wiring has been removed from the API server.
- System admin route registration was removed.
- Auth middleware was restored to workspace-only behavior.
- Schema exports no longer expose the system admin table.

## Remaining risk
The on-disk schema file can confuse future work unless it is intentionally picked up in Slice A1 or deleted before production.
