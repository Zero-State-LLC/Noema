# tests/test_gate_b_preflight.py

- clean_repo · function · L8-L10 — def clean_repo(tmp_path)
- candidate · function · L13-L26 — def candidate(**overrides)
- test_preflight_is_deterministic_and_open_when_all_gates_pass · function · L29-L35 — def test_preflight_is_deterministic_and_open_when_all_gates_pass(tmp_path)
- test_preflight_blocks_missing_population_and_approval · function · L38-L42 — def test_preflight_blocks_missing_population_and_approval(tmp_path)
- test_preflight_redacts_secrets_and_blocks_unhealthy_worker · function · L45-L53 — def test_preflight_redacts_secrets_and_blocks_unhealthy_worker(tmp_path)
- test_preflight_blocks_incident_world_and_dirty_repository · function · L56-L61 — def test_preflight_blocks_incident_world_and_dirty_repository(tmp_path)
- test_preflight_blocks_incident_health_even_when_world_is_active · function · L63-L69 — def test_preflight_blocks_incident_health_even_when_world_is_active(tmp_path)
- test_preflight_blocks_incomplete_canonical_head · function · L72-L75 — def test_preflight_blocks_incomplete_canonical_head(tmp_path)
- test_preflight_blocks_missing_participant_reconnect_evidence · function · L78-L83 — def test_preflight_blocks_missing_participant_reconnect_evidence(tmp_path)
- test_preflight_blocks_duplicate_participant_and_receipt_records · function · L86-L90 — def test_preflight_blocks_duplicate_participant_and_receipt_records(tmp_path)
