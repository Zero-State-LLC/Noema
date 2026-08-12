-- Noema world schema (from src/noema/persistence/store.py _init_schema)
-- Mirrors WorldStore._init_schema in src/noema/persistence/store.py

CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  sequence INTEGER PRIMARY KEY,
  cycle INTEGER NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  digest TEXT NOT NULL,
  previous_digest TEXT,
  envelope_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS snapshots (
  snapshot_id TEXT PRIMARY KEY,
  cycle INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  state_digest TEXT NOT NULL,
  state_json TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  principal_id TEXT NOT NULL,
  role TEXT NOT NULL,
  agent_id TEXT,
  last_request_id TEXT,
  epoch INTEGER NOT NULL DEFAULT 1,
  data_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_trajectories (
  trajectory_id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  from_cycle INTEGER NOT NULL,
  to_cycle INTEGER NOT NULL,
  content_digest TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_frontier_audit (
  digest TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  record_index INTEGER NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_frontier_plans (
  plan_id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL,
  plan_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_observatory_runs (
  analysis_run_id TEXT PRIMARY KEY,
  run_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_observatory_candidates (
  candidate_id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  analysis_run_id TEXT NOT NULL,
  candidate_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_observatory_audit (
  digest TEXT PRIMARY KEY,
  analysis_run_id TEXT NOT NULL,
  record_index INTEGER NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_lab_experiments (
  experiment_id TEXT PRIMARY KEY,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_lab_results (
  lab_result_id TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_lab_audit (
  digest TEXT PRIMARY KEY,
  experiment_id TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_compiler_results (
  compiler_result_id TEXT PRIMARY KEY,
  compile_id TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_captured_tests (
  captured_test_id TEXT PRIMARY KEY,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_compiler_audit (
  digest TEXT PRIMARY KEY,
  compile_id TEXT NOT NULL,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_learn_behaviors (
  behavior_id TEXT PRIMARY KEY,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_learn_edges (
  edge_id TEXT PRIMARY KEY,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS research_learn_graphs (
  graph_digest TEXT PRIMARY KEY,
  record_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS id_accounts (
  account_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  external_auth_subject TEXT,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS id_players (
  player_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  handle TEXT NOT NULL,
  display_name TEXT,
  agent_id TEXT,
  status TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS id_controllers (
  controller_id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT,
  metadata_json TEXT NOT NULL,
  created_at BIGINT NOT NULL,
  revoked_at BIGINT
);

CREATE TABLE IF NOT EXISTS id_credentials (
  credential_id TEXT PRIMARY KEY,
  controller_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  fingerprint TEXT NOT NULL,
  issued_at BIGINT NOT NULL,
  expires_at BIGINT,
  revoked_at BIGINT
);

CREATE TABLE IF NOT EXISTS id_device_codes (
  device_code TEXT PRIMARY KEY,
  user_code TEXT NOT NULL,
  scopes_json TEXT NOT NULL,
  metadata_json TEXT NOT NULL,
  status TEXT NOT NULL,
  player_id TEXT,
  controller_id TEXT,
  created_at BIGINT NOT NULL,
  expires_at BIGINT NOT NULL,
  interval_sec INTEGER NOT NULL DEFAULT 5,
  payload_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_id_accounts_subject ON id_accounts(external_auth_subject);
CREATE INDEX IF NOT EXISTS idx_id_players_account ON id_players(account_id);
CREATE INDEX IF NOT EXISTS idx_id_controllers_player ON id_controllers(player_id);
CREATE INDEX IF NOT EXISTS idx_id_credentials_fp ON id_credentials(fingerprint);
CREATE INDEX IF NOT EXISTS idx_id_device_user ON id_device_codes(user_code);
