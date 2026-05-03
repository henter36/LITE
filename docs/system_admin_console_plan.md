# System Admin Console Plan — Marketing OS Lite

## Objective
Define a separate, platform-level administration area for Marketing OS Lite that is distinct from customer/workspace settings and does not change runtime behavior yet.

## 1. Separation model

### Customer Account Settings
Used by workspace members to manage their own workspace-scoped configuration:
- brand profile
- workspace members
- campaign preferences
- Meta read-only connection state
- demo-safe operational settings

### System Admin Console
Used only by platform operators to manage global, tenant-independent configuration:
- AI provider configuration
- global integrations
- feature flags
- safety controls
- provider health and audit visibility

These areas must remain separate in UI, routing, permissions, and data access.

## 2. Admin role model

### Workspace roles
- `owner`
- `admin`
- `editor`
- `viewer`

### Platform roles
- `system_admin`
- `super_admin`

### Role intent
- Workspace roles only affect a single workspace.
- `system_admin` can manage global platform settings but not user identity or infrastructure.
- `super_admin` can manage all platform settings, all workspaces, and security-critical controls.

## 3. Console sections

### AI Providers
- configured/not configured state only
- enabled provider list
- model availability
- fallback status
- no raw credentials in UI

### Ad Integrations
- global integration status
- read-only health indicators
- mock/demo vs live mode labels
- no customer-managed credential editing

### Feature Flags
- global feature flag list
- target audience / rollout scope
- read-only by default in early slices
- no customer workspace override unless explicitly designed later

### Safety Controls
- policy toggles for platform safety
- fallback enforcement status
- content guardrail state
- approval and publish guardrails visibility

### Audit & Health
- provider change audit log
- integration health checks
- recent failures
- operational status history

## 4. Security guardrails

- Never show raw API keys.
- Secrets stay server-side only.
- UI may show only `configured` / `not configured` / `healthy` / `degraded` / `failed` states.
- Every provider setting change must be audited.
- Customer workspaces must never be able to affect global configuration.
- Route protection must enforce platform role checks server-side.
- No secret values may be returned to the frontend.
- No feature should weaken auth, workspace isolation, roles, audit logs, AI fallback, Meta read-only behavior, decision scoring, or safety guards.

## 5. Data model gaps

Likely missing or incomplete data structures:
- `global_roles` or `system_admin_users`
- `provider_config`
- `feature_flags`
- `integration_health_checks`
- `provider_audit_logs`

These should be modeled separately from workspace tables to preserve tenant isolation.

## 6. Implementation slices

### Slice A: global role model + route protection
- Add platform role model
- Add server-side authorization guards
- Protect admin routes separately from workspace routes

### Slice B: read-only System Admin page
- Add a separate console shell and navigation entry
- Render only status summaries
- No editing actions yet

### Slice C: provider status + feature flags
- Display provider configured status
- Show feature flag state
- Keep editing disabled or server-controlled only

### Slice D: audit and health
- Show provider audit logs
- Show integration health checks
- Surface recent changes and failures

### Slice E: controlled provider config editing
- Add limited server-side editing flows
- Persist changes with audit logs
- Validate inputs and never expose secrets

## 7. Risks and decisions

### Before production
- Finalize platform role lifecycle and assignment path
- Define which users can become `super_admin`
- Confirm audit retention policy
- Confirm disaster recovery for provider configuration
- Validate that all secret storage stays server-side

### Deferred
- Fine-grained feature flag targeting
- Automated provider remediation
- Multi-environment console rollout workflows
- Self-service customer overrides for global settings

### Must never be exposed to customer workspaces
- raw provider keys
- secret values
- global integration credentials
- platform-only feature controls
- platform audit internals beyond allowed summaries

## Final decision
This is a **planned architecture only**. No implementation yet.

## Recommended next step
Start with **Slice A: global role model + route protection** so platform-only access is enforced before any UI is built.
