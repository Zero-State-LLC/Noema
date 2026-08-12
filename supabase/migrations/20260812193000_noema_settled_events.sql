-- Stage 0 Durable Object settlement sink (optional; Worker soft-fails if missing)
-- Spec: Noema-Specs docs/PLATFORM.md event settlement

CREATE TABLE IF NOT EXISTS noema_settled_events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  cycle INTEGER NOT NULL DEFAULT 0,
  world_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  controller_id TEXT,
  session_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_noema_settled_world_seq
  ON noema_settled_events (world_id, sequence);

CREATE INDEX IF NOT EXISTS idx_noema_settled_player
  ON noema_settled_events (player_id);
