-- RFC-0032: one semantic settlement is one Postgres transaction.
-- Existing Stage-0 rows are observational settlement only; this function never
-- fabricates their missing digest/state lineage.
-- Provenance: Notion Sprint 001 Hub + Loop 805 Slice X + Hash: pending-operator-apply

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.noema_world_heads
  ADD COLUMN IF NOT EXISTS canonicalization_version TEXT NOT NULL DEFAULT 'noema-jcs/1',
  ADD COLUMN IF NOT EXISTS canonical_state_json TEXT,
  ADD COLUMN IF NOT EXISTS ledger_head_digest TEXT;

ALTER TABLE public.noema_settled_events
  ADD COLUMN IF NOT EXISTS settlement_id TEXT,
  ADD COLUMN IF NOT EXISTS canonical_digest TEXT,
  ADD COLUMN IF NOT EXISTS previous_digest TEXT;

CREATE TABLE IF NOT EXISTS public.noema_canonical_settlements (
  settlement_id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  revision BIGINT NOT NULL CHECK (revision >= 0),
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  writer_generation TEXT NOT NULL,
  state_digest TEXT NOT NULL,
  ledger_head_event_id TEXT NOT NULL,
  ledger_head_digest TEXT NOT NULL,
  committed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (world_id, revision)
);

CREATE OR REPLACE FUNCTION public.noema_commit_canonical_settlement(
  p_settlement_id TEXT,
  p_world_id TEXT,
  p_expected_revision BIGINT,
  p_writer_generation TEXT,
  p_genesis_id TEXT,
  p_status TEXT,
  p_settlement_health TEXT,
  p_state_json JSONB,
  p_canonical_state_json TEXT,
  p_state_digest TEXT,
  p_events JSONB,
  p_allow_bootstrap BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_head public.noema_world_heads%ROWTYPE;
  v_event JSONB;
  v_index INTEGER := 0;
  v_last_sequence INTEGER;
  v_last_event_id TEXT;
  v_last_digest TEXT;
  v_expected_previous TEXT;
  v_existing public.noema_canonical_settlements%ROWTYPE;
  v_existing_event public.noema_settled_events%ROWTYPE;
BEGIN
  IF p_settlement_id IS NULL OR p_settlement_id = '' OR p_writer_generation IS NULL OR p_writer_generation = '' THEN
    RAISE EXCEPTION 'INVALID_SETTLEMENT';
  END IF;
  IF p_state_digest <> 'sha256:' || encode(extensions.digest(convert_to(p_canonical_state_json, 'UTF8'), 'sha256'::text), 'hex') THEN
    RAISE EXCEPTION 'STATE_DIGEST_MISMATCH';
  END IF;
  SELECT * INTO v_existing FROM public.noema_canonical_settlements WHERE settlement_id = p_settlement_id;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'revision', v_existing.revision, 'sequence', v_existing.sequence);
  END IF;
  SELECT * INTO v_head FROM public.noema_world_heads WHERE world_id = p_world_id FOR UPDATE;
  IF NOT FOUND THEN
    IF NOT p_allow_bootstrap THEN RAISE EXCEPTION 'MISSING_CANONICAL_HEAD'; END IF;
    IF p_expected_revision <> 0 THEN RAISE EXCEPTION 'STALE_HEAD'; END IF;
    v_expected_previous := NULL;
    v_last_sequence := -1;
  ELSE
    IF v_head.revision <> p_expected_revision THEN RAISE EXCEPTION 'STALE_HEAD'; END IF;
    IF v_head.writer_generation <> p_writer_generation THEN RAISE EXCEPTION 'STALE_FENCE'; END IF;
    v_expected_previous := v_head.ledger_head_digest;
    v_last_sequence := v_head.sequence;
  END IF;
  IF jsonb_typeof(p_events) <> 'array' OR jsonb_array_length(p_events) = 0 THEN RAISE EXCEPTION 'EMPTY_SETTLEMENT'; END IF;
  FOR v_event IN SELECT value FROM jsonb_array_elements(p_events) LOOP
    v_index := v_index + 1;
    IF coalesce(v_event->>'event_id', '') = '' OR coalesce(v_event->>'event_type', '') = '' OR coalesce(v_event->>'digest', '') = '' THEN
      RAISE EXCEPTION 'INVALID_EVENT';
    END IF;
    IF (v_event->>'sequence')::INTEGER <> v_last_sequence + 1 THEN RAISE EXCEPTION 'NONCONTIGUOUS_SEQUENCE'; END IF;
    IF coalesce(v_event->>'previous_digest', '') <> coalesce(v_expected_previous, '') THEN RAISE EXCEPTION 'DIGEST_LINEAGE_MISMATCH'; END IF;
    SELECT * INTO v_existing_event FROM public.noema_settled_events WHERE event_id = v_event->>'event_id';
    IF FOUND AND (
      v_existing_event.world_id <> p_world_id OR
      coalesce(v_existing_event.settlement_id, '') <> p_settlement_id OR
      coalesce(v_existing_event.canonical_digest, '') <> v_event->>'digest' OR
      coalesce(v_existing_event.previous_digest, '') <> coalesce(v_event->>'previous_digest', '')
    ) THEN
      RAISE EXCEPTION 'DUPLICATE_EVENT_CONFLICT';
    END IF;
    INSERT INTO public.noema_settled_events(event_id,event_type,sequence,cycle,world_id,player_id,controller_id,session_id,payload,settlement_id,canonical_digest,previous_digest)
    VALUES (v_event->>'event_id',v_event->>'event_type',(v_event->>'sequence')::INTEGER,(v_event->>'cycle')::INTEGER,p_world_id,v_event->>'player_id',nullif(v_event->>'controller_id',''),nullif(v_event->>'session_id',''),coalesce(v_event->'payload','{}'::jsonb),p_settlement_id,v_event->>'digest',nullif(v_event->>'previous_digest',''))
    ON CONFLICT (event_id) DO NOTHING;
    v_last_sequence := (v_event->>'sequence')::INTEGER;
    v_last_event_id := v_event->>'event_id';
    v_last_digest := v_event->>'digest';
    v_expected_previous := v_last_digest;
  END LOOP;
  INSERT INTO public.noema_world_heads(world_id,sequence,cycle,genesis_id,status,settlement_health,state_json,revision,ledger_head_event_id,state_digest,writer_generation,canonicalization_version,canonical_state_json,ledger_head_digest)
  VALUES (p_world_id,v_last_sequence,(p_events->-1->>'cycle')::INTEGER,p_genesis_id,p_status,p_settlement_health,p_state_json,p_expected_revision + 1,v_last_event_id,p_state_digest,p_writer_generation,'noema-jcs/1',p_canonical_state_json,v_last_digest)
  ON CONFLICT (world_id) DO UPDATE SET sequence=excluded.sequence,cycle=excluded.cycle,genesis_id=excluded.genesis_id,status=excluded.status,settlement_health=excluded.settlement_health,state_json=excluded.state_json,revision=excluded.revision,ledger_head_event_id=excluded.ledger_head_event_id,state_digest=excluded.state_digest,writer_generation=excluded.writer_generation,canonicalization_version=excluded.canonicalization_version,canonical_state_json=excluded.canonical_state_json,ledger_head_digest=excluded.ledger_head_digest,updated_at=now();
  INSERT INTO public.noema_canonical_settlements(settlement_id,world_id,revision,sequence,writer_generation,state_digest,ledger_head_event_id,ledger_head_digest)
  VALUES (p_settlement_id,p_world_id,p_expected_revision + 1,v_last_sequence,p_writer_generation,p_state_digest,v_last_event_id,v_last_digest);
  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'revision', p_expected_revision + 1, 'sequence', v_last_sequence);
END;
$$;

REVOKE ALL ON FUNCTION public.noema_commit_canonical_settlement(TEXT,TEXT,BIGINT,TEXT,TEXT,TEXT,TEXT,JSONB,TEXT,TEXT,JSONB,BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.noema_commit_canonical_settlement(TEXT,TEXT,BIGINT,TEXT,TEXT,TEXT,TEXT,JSONB,TEXT,TEXT,JSONB,BOOLEAN) TO service_role;
