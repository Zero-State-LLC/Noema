# ADR-0004: Dedicated SQLite-Backed Durable Object (`StudyAdminDO`) for RFC-0131

Date: 2026-11-24
Status: Accepted (operator-selected during `/grill-with-docs`)

## Context

`RFC-0131` (`Zero-State-LLC/Noema-Specs#396`, `#424`) introduces single-role `study-admin` invites, single-use invite acceptance, superseding pending re-invites, immediate pending/active revocation, and an append-only audit log (`study_admin_audit_log`). We needed to choose between persisting this state in Cloudflare D1 or a dedicated SQLite-backed Durable Object (`StudyAdminDO`).

## Decision

Persist `study_admin_invites`, `study_admin_grants`, and `study_admin_audit_log` in a dedicated SQLite-backed Durable Object (`StudyAdminDO`), behind the `STUDY_ADMIN_UI_ENABLED` feature flag (default `false`).

## Trade-offs & Consequences

- **Single-writer linearizability**: Single-use invite acceptance and superseding re-invites execute inside a single-writer DO turn, eliminating double-accept races without distributed locks.
- **World-DO isolation**: Study administration traffic and storage remain completely isolated from the live world Durable Object (`world.perihelion-reach-3`).
- **Rollback safety**: Toggling `STUDY_ADMIN_UI_ENABLED=false` halts new invites/accepts while preserving `study_admin_audit_log` intact; revoking grants never touches global Admin privileges.
- **Cost**: Ad-hoc cross-study analytics queries are less direct than D1, which is acceptable for v1 single-role study administration.
