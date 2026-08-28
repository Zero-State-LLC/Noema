# LCA-2 cohort lifecycle runner

`noema-lca cohort` owns process lifecycle and redacted evidence for exactly three
independent official-client processes. It does not implement a client, choose or
rank actions, coordinate outcomes, share private observations, automate a
browser, enroll a production Controller, deploy the Worker, or claim Gate B.

The governing acceptance boundary is Noema-Specs
`docs/LIVING-ALPHA-ACCEPTANCE.md` Gate B. Isolated and simulated evidence can
exercise the runner, but can never establish external participation or produce
`COMPLETE`.

## Commands

```text
noema-lca cohort prepare
noema-lca cohort run isolated
noema-lca cohort run live
noema-lca cohort status
noema-lca cohort stop
noema-lca cohort verify
noema-lca cohort report
```

Evidence uses only these lifecycle verdicts:

- `PREPARATION`: validated files and private boundaries were created.
- `OPEN`: execution may proceed, or a live execution awaits verification.
- `BLOCKED`: required human approvals, receipts, credentials, or evidence are missing.
- `COMPLETE`: live-only verification passed every fail-closed check.
- `NOT_COMPUTABLE`: an isolated or simulated run cannot establish Gate B.
- `REJECTED`: a safety boundary, binding, receipt, process, pin, head, or health check failed.

## Safety boundaries

Preparation accepts exactly three injected commands. Every command must invoke
the public `noema play` surface directly, use either the exact `noema` PATH
command or an absolute executable path, and exactly bind the configured server.
Each process receives a distinct:

- working directory
- XDG config directory
- private official-client credential directory
- model-context directory
- action-history directory
- idempotency directory and namespace
- evidence directory
- bounded metadata-log directory

Participant labels, decision-context identifiers, rendered commands, and any
environment-variable source names must also be distinct. Admin, service-role,
human-session, operator, prompt, plan, cognition, memory, private-observation,
literal token, email, device-code, and browser-automation inputs are rejected.
The orchestrator passes no observation from one process to another.

Child stdout and stderr are consumed but not retained. Per-process logs contain
only byte counts, SHA-256 digests, exit status, and bounded lifecycle metadata.
Opaque approval and independence receipts are emitted only as digests.

Before spawning, the runner calls `noema.cli.preflight.build_preflight` and
rejects unhealthy state, dirty candidate source, failed tests or typecheck,
missing or disagreeing pins, and incomplete canonical-head evidence.
The canonical prepared-manifest digest is stored in `state.json` and checked on
every manifest load. Editing `manifest.json` after preparation fails closed.
Isolated mode categorically rejects `https://noema.guru`.

## Non-secret configuration

Run directories should be outside the candidate repository. The configuration
contains no credentials or private strategy.

```json
{
  "schema_version": "noema-lca2-cohort-config/1.0",
  "server": "http://127.0.0.1:8787",
  "world_id": "test.hosted-canonical.cohort-001",
  "repository": "/path/to/clean/Noema",
  "max_log_bytes": 65536,
  "process_timeout_seconds": 900,
  "preflight": {
    "pins": {
      "worker_source": "<commit>",
      "worker_version": "<worker-version>",
      "specs_commit": "<specs-commit>"
    },
    "worker": {
      "source_pin": "<commit>",
      "version_pin": "<worker-version>"
    },
    "world": {
      "world_id": "test.hosted-canonical.cohort-001",
      "genesis": "<genesis>",
      "seal": "<seal>",
      "room": "<room-bound>",
      "status": "ACTIVE"
    },
    "health": {
      "status": "HEALTHY",
      "settlement_health": "HEALTHY"
    },
    "test_evidence": {
      "worker_tests": "green",
      "worker_typecheck": "green"
    },
    "canonical_head": {
      "sequence": 1,
      "digest": "sha256:<digest>"
    }
  },
  "participants": [
    {
      "label": "controller-a",
      "decision_context": "decision-a",
      "argv": ["noema", "--server", "{server}", "--config-dir", "{credential_dir}", "--isolated", "--world-id", "{world_id}", "play", "--max-actions", "8"]
    },
    {
      "label": "controller-b",
      "decision_context": "decision-b",
      "argv": ["noema", "--server", "{server}", "--config-dir", "{credential_dir}", "--isolated", "--world-id", "{world_id}", "play", "--max-actions", "8"]
    },
    {
      "label": "controller-c",
      "decision_context": "decision-c",
      "argv": ["noema", "--server", "{server}", "--config-dir", "{credential_dir}", "--isolated", "--world-id", "{world_id}", "play", "--max-actions", "8"]
    }
  ]
}
```

Available placeholders are `{server}`, `{world_id}`, `{run_id}`, `{label}`,
`{mode}`, `{idempotency_namespace}`, and every generated path key recorded in
`manifest.json`.

## Isolated workflow

```bash
noema-lca cohort prepare \
  --mode isolated \
  --config cohort-isolated.json \
  --run-dir "$HOME/.local/state/noema/lca2-isolated"

noema-lca cohort run isolated --run-dir "$HOME/.local/state/noema/lca2-isolated"
noema-lca cohort status --run-dir "$HOME/.local/state/noema/lca2-isolated"
noema-lca cohort verify --run-dir "$HOME/.local/state/noema/lca2-isolated"
noema-lca cohort report \
  --run-dir "$HOME/.local/state/noema/lca2-isolated" \
  --output lca2-isolated-report.json
```

A successful isolated process run has internal status `SIMULATED` and evidence
verdict `NOT_COMPUTABLE`. Verification intentionally exits nonzero.

### Genuine local Worker + official-client E2E

`tests/test_gate_b_cohort_local_e2e.py` is the smallest process-level proof of
the isolated path. It starts `wrangler dev` on loopback with throwaway local
signing/operator values, mints three distinct local agent credentials, and runs
exactly three processes through `run_cohort`. Every process is the real
`noema` console script from an official `noema-client` checkout, not a fixture
with the same basename.

```bash
NOEMA_OFFICIAL_CLIENT_REPO=/path/to/noema-client \
  pytest -q tests/test_gate_b_cohort_local_e2e.py
```

The checkout must have its development environment installed at
`.venv/bin/noema`. The test verifies that this console script imports the
package from that checkout. A test-only `sitecustomize` observer records only
digests and command metadata into each cohort-provided model-context and
action-history directory. This proves separate processes, credentials, Player
and Controller ids, model-context boundaries, request ids, idempotency keys,
and action histories without retaining observations or secrets.

The signed local Admin session is injected only by the test harness because
the official client's isolated operator endpoint requires dual auth. The
runner's production safety rule that rejects Admin inputs is unchanged. This
test never targets production, never automates enrollment, and must finish as
`SIMULATED` / `NOT_COMPUTABLE` with external independence `NOT_CLAIMED`. It is
not Gate B evidence.

## Live human-approval pause

Live preparation is pinned to `https://noema.guru` and omits `--isolated` and
`--world-id` from every official-client command. It writes
`human-approval-required.json` plus three `approvals/<label>.request.json`
files, then stops at `AWAITING_HUMAN_APPROVAL`. It never opens a browser.

A designated human runs each printed `noema connect` command and approves each
short code through the normal CONNECT UI. Each resulting private
`credential.json` must remain mode `0600`. The human records one non-secret
`approvals/<label>.json` receipt:

```json
{
  "schema_version": "noema-lca2-human-approval/1.0",
  "run_id": "<prepared-run-id>",
  "label": "controller-a",
  "approved": true,
  "enrollment_status": "COMPLETE",
  "approval_receipt": "<opaque-distinct-receipt>",
  "independent_control_receipt": "<opaque-distinct-receipt>",
  "credential_binding_digest": "sha256:<private-credential-file-digest>",
  "controller_binding_digest": "sha256:<opaque-controller-reference-digest>"
}
```

All three approvals, receipt pairs, credential/controller bindings, and
credential files must be present, correlated, and distinct where applicable.
`PARTIAL` enrollment is `BLOCKED`. `DUPLICATE` or `EXPIRED`, including when
`approved` is false,
enrollment, duplicate receipts, shared credential content, or malformed binding
is `REJECTED`.

Only after those three human approvals may an operator explicitly run:

```bash
noema-lca cohort run live \
  --run-dir "$HOME/.local/state/noema/lca2-live" \
  --ack I_ACKNOWLEDGE_LIVE_AGENT_MUTATION
```

This repository change does not execute that command or perform the approvals.

## Narrow participant receipts

`verify` may read `participants/<label>/evidence/participant.json`. The file may
contain opaque controller references, reconnect status, world binding, and
narrow orchestration receipts. It must not contain observations, transcripts,
prompts, plans, motives, or strategy.

Receipt cases have deterministic expected classifications:

| Case | Expected classification |
|---|---|
| `partial_enrollment` | `BLOCKED` |
| `duplicate_enrollment` | `REJECTED` |
| `expired_enrollment` | `REJECTED` |
| `wrong_world` | `REJECTED` |
| `malformed_action` | `REJECTED` |
| `unauthorized_action` | `REJECTED` |
| `duplicate_action` | `REJECTED` |
| `accepted_action` | `COMPLETE` |
| `reconnect` | `COMPLETE` |

A live `COMPLETE` verdict requires three successful processes, three distinct
observed controller and independence receipts, matching world bindings,
reconnect evidence, the required negative-case receipts, an `OPEN` final
preflight, and no rejected classification. Each participant must also provide
opaque SHA-256 bindings for contention, ordering, budget settlement, and the
shared acceptance authority. Credential and controller bindings must correlate
with the human approval receipt. These are required receipt fields, not a claim
that production execution occurred. This verdict is evidence for the
bounded cohort run only. It does not claim Gate B, Gate C, endurance, hosted
STUDY, successor readiness, or deployment authority.
