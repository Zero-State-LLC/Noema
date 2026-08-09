# v0.1 Minimum Seed World

Concrete Chamber seed for NOEMA v0.1 acceptance (`docs/v0.1-ACCEPTANCE.md`, ADR-005).

## Contents

| File | Role |
|------|------|
| `world-seed.json` | Genesis state: 4 rooms, connected exits, infrastructure relay, resource node, obsolete archive (Deep Time flavor), default budgets |
| `sample-trajectory.jsonl` | Ordered World Events covering **all 24** closed catalog types |
| `equivalence-boundary.json` | Mandatory v0.1 equivalence profile |
| `expected-final-state.json` | Canonical post-trajectory state snapshot used for digesting |
| `expected-final-state-digest.txt` | Final WorldState digest |
| `expected-observation-digests.json` | Focal-agent observation digests |
| `expected-event-digests.jsonl` | Ordered event digests for replay comparison |

## Acceptance exercise coverage

Trajectory includes at minimum: `LOOK`, successful `MOVE`, `MOVE_REJECTED`, `BUDGET_EXCEEDED`, `OBSERVATION_GENERATED`, `MESSAGE` / `ORG_CREATE`, plus the full closed catalog for schema and reducer-contract exercise.

## How implementations use this

1. Load `world-seed.json` as initial WorldState.
2. Append and reduce each event in `sample-trajectory.jsonl` in sequence order.
3. Compare under `equivalence-boundary.json`:
   - ordered event digests vs `expected-event-digests.jsonl`
   - final WorldState digest vs `expected-final-state-digest.txt`
   - observation digests vs `expected-observation-digests.json` at declared observation points

Digests in this package are content-addressed over the fixture artifacts. A conforming World Engine MUST reproduce the same digests when applying the published reducers to this seed, or publish a versioned superseding fixture via RFC if a legitimate reducer correction is required.

## Catalog coverage

Event types present (24/24):

- `AGENT_ENTERED_WORLD`
- `AGENT_LEFT_WORLD`
- `BUDGET_CONSUMED`
- `BUDGET_EXCEEDED`
- `ENTITY_CREATE`
- `ENTITY_DESTROY`
- `ENTITY_UPDATE`
- `INSPECT`
- `LOOK`
- `MESSAGE`
- `MESSAGE_DELIVERED`
- `MOVE`
- `MOVE_REJECTED`
- `NOISE_APPLIED`
- `OBSERVATION_GENERATED`
- `ORG_CREATE`
- `ORG_MEMBER_ADD`
- `ORG_MEMBER_REMOVE`
- `RESOURCE_TRANSFER`
- `SITUATION_INJECTED`
- `TRADE_ACCEPTED`
- `TRADE_PROPOSED`
- `TRADE_REJECTED`
- `WAIT`
