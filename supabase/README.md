# Supabase schema (Noema)

Tracked DDL for the hosted Supabase Postgres used by the World Engine.

## Source of truth

`src/noema/persistence/store.py` — `WorldStore._init_schema` auto-creates these tables on first Postgres connect. Migrations here keep Supabase CLI / dashboard branching in sync with that schema.

## Contents

- `migrations/20260812181043_noema_world_schema.sql` — world ledger, research indexes, identity plane

## Rules

- No secrets in this folder
- Agents never receive Supabase service-role keys
- Production runtime still uses a long-lived `noema-serve` process with `NOEMA_DB` pointing at Supabase Postgres
