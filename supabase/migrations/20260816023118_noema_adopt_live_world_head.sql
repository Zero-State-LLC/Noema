-- Operator recover: persist a live DO snapshot as the first canonical head.
-- Does not invent ledger events 0..n. Refuses when a head already exists.
-- Provenance: INCIDENT + BLOCKING + HEAD_PRESENT false while the DO is coherent.

CREATE OR REPLACE FUNCTION public.noema_adopt_live_world_head(
  p_settlement_id TEXT,
  p_world_id TEXT,
  p_writer_generation TEXT,
  p_genesis_id TEXT,
  p_status TEXT,
  p_settlement_health TEXT,
  p_state_json JSONB,
  p_canonical_state_json TEXT,
  p_state_digest TEXT,
  p_sequence INTEGER,
  p_cycle INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_head public.noema_world_heads%ROWTYPE;
  v_existing public.noema_canonical_settlements%ROWTYPE;
BEGIN
  IF p_settlement_id IS NULL OR p_settlement_id = '' OR p_writer_generation IS NULL OR p_writer_generation = '' THEN
    RAISE EXCEPTION 'INVALID_SETTLEMENT';
  END IF;
  IF p_world_id IS NULL OR p_world_id = '' THEN
    RAISE EXCEPTION 'INVALID_WORLD';
  END IF;
  IF p_sequence IS NULL OR p_sequence < 0 OR p_cycle IS NULL OR p_cycle < 0 THEN
    RAISE EXCEPTION 'INVALID_SEQUENCE';
  END IF;
  IF p_state_json IS NULL OR jsonb_typeof(p_state_json->'rooms') <> 'object' OR p_state_json->'rooms' = '{}'::jsonb THEN
    RAISE EXCEPTION 'UNUSABLE_LIVE_WORLD';
  END IF;
  IF p_state_digest <> 'sha256:' || encode(extensions.digest(convert_to(p_canonical_state_json, 'UTF8'), 'sha256'::text), 'hex') THEN
    RAISE EXCEPTION 'STATE_DIGEST_MISMATCH';
  END IF;
  SELECT * INTO v_existing FROM public.noema_canonical_settlements WHERE settlement_id = p_settlement_id;
  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'idempotent', true, 'revision', v_existing.revision, 'sequence', v_existing.sequence);
  END IF;
  SELECT * INTO v_head FROM public.noema_world_heads WHERE world_id = p_world_id FOR UPDATE;
  IF FOUND THEN
    RAISE EXCEPTION 'HEAD_ALREADY_PRESENT';
  END IF;
  INSERT INTO public.noema_world_heads(
    world_id, sequence, cycle, genesis_id, status, settlement_health, state_json,
    revision, ledger_head_event_id, state_digest, writer_generation,
    canonicalization_version, canonical_state_json, ledger_head_digest
  ) VALUES (
    p_world_id, p_sequence, p_cycle, p_genesis_id, p_status, p_settlement_health, p_state_json,
    1, p_settlement_id, p_state_digest, p_writer_generation,
    'noema-jcs/1', p_canonical_state_json, p_state_digest
  );
  INSERT INTO public.noema_canonical_settlements(
    settlement_id, world_id, revision, sequence, writer_generation,
    state_digest, ledger_head_event_id, ledger_head_digest
  ) VALUES (
    p_settlement_id, p_world_id, 1, p_sequence, p_writer_generation,
    p_state_digest, p_settlement_id, p_state_digest
  );
  RETURN jsonb_build_object('ok', true, 'idempotent', false, 'revision', 1, 'sequence', p_sequence);
END;
$$;

REVOKE ALL ON FUNCTION public.noema_adopt_live_world_head(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,TEXT,TEXT,INTEGER,INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.noema_adopt_live_world_head(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,JSONB,TEXT,TEXT,INTEGER,INTEGER) TO service_role;
