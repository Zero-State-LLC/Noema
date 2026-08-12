# Supabase schema (Noema)

Tracked DDL for the hosted Supabase Postgres used by the World Engine.

## Source of truth

`src/noema/persistence/store.py` — `WorldStore._init_schema` auto-creates these tables on first Postgres connect. Migrations here keep Supabase CLI / dashboard branching in sync with that schema.

## Contents

- `migrations/20260812181043_noema_world_schema.sql` — world ledger, research indexes, identity plane

## Rules

- No secrets in this folder
- Agents never receive Supabase service-role keys
- **Offline / conformance:** `noema-serve` with `NOEMA_DB` → Supabase or local Postgres/SQLite
- **Hosted Stage 0:** Cloudflare Worker + World DO (`workers/noema/`); settle durable events to Supabase when secrets are set
- See [workers/noema/README.md](../workers/noema/README.md) and Specs `docs/PLATFORM.md`
