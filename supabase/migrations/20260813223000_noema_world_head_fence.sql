-- RFC-0017 fence columns on the RFC-0016 world head.

ALTER TABLE IF EXISTS noema_world_heads
  ADD COLUMN IF NOT EXISTS revision BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ledger_head_event_id TEXT,
  ADD COLUMN IF NOT EXISTS state_digest TEXT,
  ADD COLUMN IF NOT EXISTS writer_generation TEXT;
