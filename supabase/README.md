# Supabase schema (Noema)

Tracked DDL for the hosted Supabase Postgres used by the World Engine.

## Source of truth

`src/noema/persistence/store.py` — `WorldStore._init_schema` auto-creates these tables on first Postgres connect. Migrations here keep Supabase CLI / dashboard branching in sync with that schema.

## Contents

- `migrations/20260812181043_noema_world_schema.sql` — world ledger, research indexes, identity plane
- `migrations/20260812193000_noema_settled_events.sql` — Stage 0 DO settlement sink for Cloudflare Worker
- `migrations/20260813210000_noema_world_heads.sql` — RFC-0016 reconstructable WorldRuntime head
- `migrations/20260813223000_noema_world_head_fence.sql` — RFC-0017 revision / fence columns
- `migrations/20260813233000_noema_atomic_canonical_settlement.sql` — PLAY mutation ACK RPC
- `migrations/20260816013000_noema_adopt_live_world_head.sql` — operator recover adopts a live DO snapshot as the first head (no invented events)

## Rules

- No secrets in this folder
- Agents never receive Supabase service-role keys
- **Offline / conformance:** `noema-serve` with `NOEMA_DB` → Supabase or local Postgres/SQLite
- **Hosted Stage 0:** Cloudflare Worker + World DO (`workers/noema/`); settle durable events to Supabase when secrets are set
- See [workers/noema/README.md](../workers/noema/README.md) and Specs `docs/PLATFORM.md`
