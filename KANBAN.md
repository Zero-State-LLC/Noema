# Noema — scoped R4 evidence kanban

This board tracks the #780 follow-up frontier and its #733 parent, not the entire repository backlog. Snapshot base/main: `642d71bc8423e2533c4c4a9f55becff7c2a2e551`. **Local complete, published draft, merged and hosted accepted are different states.** This document does not change the canonical matrix or GitHub issue states.

External board: [Zero-State-LLC Project #18](https://github.com/orgs/Zero-State-LLC/projects/18), configured by [project-collaboration.yml](.github/workflows/project-collaboration.yml). Current operator CLI lacks Projects read permission; external cards were not read or moved. This file is an explicit repository fallback, not a verified Projects mirror. Collaboration automation may pass while warning that board access failed.

## In review — not shipped

| Work | Evidence | Remaining gate |
|---|---|---|
| P25-R — recipient departure/recycled-label numeric-pick safety | [#821](https://github.com/Zero-State-LLC/Noema/pull/821), head `5256315c690f502c31a18eb2868467aef46dcc5a`; three local cases | Draft PR landing requires eligible approval or a separately scoped administrator exception. |
| P25-S — numeric INSPECT target/seal/expiry safety | Same [#821](https://github.com/Zero-State-LLC/Noema/pull/821); three local cases | Same landing gate; no live rename/seal/scheduler authority proof. |

The combined six-case module is independently reviewed; 142 affected and 2,256 full passed/21 skipped. [CI42360586054](https://github.com/Zero-State-LLC/Noema/actions/runs/42360586054) passed build/Worker regression. MESSAGE mutation probes establish response-code discrimination, not independently an unauthorized-body-send mechanism. No production source changes.

## In progress — keep open

| Item | Completed bound | Still required |
|---|---|---|
| [#780 contextual discovery](https://github.com/Zero-State-LLC/Noema/issues/780) | [Landed packets #816–#820 and reviewed #821](docs/780-followup-evidence.md) | T2.1/T2.2 applicability; remaining T2.3/T2.4 variant fixtures; office/MOVE clarification materiality. |
| [#733 R4 parent](https://github.com/Zero-State-LLC/Noema/issues/733) | [Isolated hosted status](docs/ISOLATED-733-ACCEPTANCE-STATUS.md) remains separate | Broader row-specific acceptance gates; these local tests do not finish the parent. |

## Blocked / decision needed

| Gate | Blocker / boundary |
|---|---|
| Retained first-paint and mapping helpers | Owner applicability decision or maintained served caller; no retired human PLAY reconstruction. |
| Office revocation / movement-access clarification | Complete ambiguity→material-change→pick fixture and contract decision before any shared fingerprint change. |
| Broad producer/topic certification | Historical source census remains 4 PROBE_PASS/40 FIXTURE_GATE/2 SOURCE_ONLY, not whole-family behavioral acceptance. |
| External Projects card synchronization | Missing Projects read permission; scope expansion or an authorized existing board session needed. No interactive credential refresh was attempted. |

## Merged — bounded evidence, not hosted acceptance

| Packet | Bound |
|---|---|
| [#815](https://github.com/Zero-State-LLC/Noema/pull/815) | Historical source audit and five concrete probes. |
| [#816](https://github.com/Zero-State-LLC/Noema/pull/816) | Retained reconstruction publication repair. |
| [#817](https://github.com/Zero-State-LLC/Noema/pull/817) | Distant ATTEST availability repair preserving executor policy. |
| [#818](https://github.com/Zero-State-LLC/Noema/pull/818) | ATTEST boundary coverage. |
| [#819](https://github.com/Zero-State-LLC/Noema/pull/819) | Four BUILD/ACCESS example-copy repairs plus bounded tests. |
| [#820](https://github.com/Zero-State-LLC/Noema/pull/820) | Ten BUILD topic execution coverage cases. |

Full commit pins, exact evidence boundaries and remaining T2 rows are in [the follow-up report](docs/780-followup-evidence.md). All 49 matrix acceptance states and existing assignments remain unchanged. No new deployment, hosted campaign, issue closure or universal stale-choice certificate is implied.
