-- Hosted durable world head (RFC-0016). Reconstructable copy of WorldRuntime.
-- DO remains live ordering. This row is the Postgres recoverability record.

CREATE TABLE IF NOT EXISTS noema_world_heads (
  world_id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL DEFAULT 0,
  cycle INTEGER NOT NULL DEFAULT 0,
  genesis_id TEXT,
  status TEXT NOT NULL DEFAULT 'DEMO_SEED',
  settlement_health TEXT NOT NULL DEFAULT 'HEALTHY',
  state_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
