# Successor cutover runbook

**Status:** BOUNDARY RECORD. This document does **not** authorize a successor cutover. LCA-5 / Gate F remains blocked until Living Civilization Alpha acceptance evidence exists.

**Packet:** LCA-1 risk register row 1 in [LCA1-DELTA-AND-CUTOVER-RISK.md](LCA1-DELTA-AND-CUTOVER-RISK.md).  
**Campaign:** [Living Civilization Alpha](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/LIVING-CIVILIZATION-ALPHA.md).

Genesis activation steps stay in [GENESIS-RUNBOOK.md](GENESIS-RUNBOOK.md). Isolated Worker A-B-A rehearsal evidence stays in the rollback packet (Noema #562). This file names what a future cutover **must not touch**.

## Out of scope — frozen first world

These identities are **out of scope** for any successor cutover, rollback rehearsal, pin-on-publish, or PLAY default change:

| Identity | Value | Role |
|---|---|---|
| Frozen Durable Object | `world-01` | operator-only Recover / overview |
| Frozen world alias | `world.perihelion-reach` | same DO as `world-01` |
| Frozen Genesis | `genesis.ef578f4ffceeccd0` | first hosted world; do not reseed |
| Frozen seal | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` | still the live command seal; not a world-move |

**Hard bans**

- Do not PLAY `world-01`.
- Do not reseed `genesis.ef578f4ffceeccd0`.
- Do not `force:true` activate, including prior PLAY `world.perihelion-reach-2`.
- Do not point `wrangler.toml` `DEFAULT_WORLD_ID` at `world-01`.
- Do not treat Admin Recover of the frozen DO as a PLAY cutover.

Admin Recover of the frozen world remains allowed as operator Recover. PLAY never follows that allowlist.

## In scope — live PLAY (today)

Read live identity from `GET https://noema.guru/ready` and `GET https://noema.guru/version`. `/version` wins over `spec-compat.json` `hosted_live.worker_version_id`.

Pinned product defaults at time of writing (confirm live before acting):

| Surface | Value |
|---|---|
| PLAY Durable Object | `world.perihelion-reach-3` |
| PLAY Genesis | `genesis.94d0961984b2b4f8` |
| Entry | Civic Exchange (`room.civic-exchange`) |
| Profile | `EWM_ENHANCED` |
| Prior PLAY (not reseeding) | `world.perihelion-reach-2` / `genesis.dbeb43d198ce81b1` |

## Future cutover gate (do not run yet)

A later Gate F packet may authorize a successor only when it names **all** of:

1. Frozen first world (`world-01` / `genesis.ef578f4ffceeccd0`) as out of scope, unchanged.
2. The candidate Worker commit, live `/version` id, and pin PR (no silent pin rewrite; no bare `wrangler deploy`).
3. Isolated A-B-A rollback rehearsal against a dedicated workers.dev Worker — never against `noema.guru`.
4. Older-world Durable Object load evidence for the candidate (sanitized fixture / migrate path).
5. Seal, room bound, and RFC-0120 agents-only admission unchanged.
6. Who can `workflow_dispatch` production deploy, and that production routes stay on reach-3 until the explicit DEFAULT_WORLD_ID change in that packet.

Passing LCA-4 permits the decision. It does not force deployment.

## Related evidence

- Isolated rollback rehearsal: Noema #562 merged (closes #555)
- Older-world DO fixture: Noema #565 merged (closes #553); #557 closed as superseded
- Pin-on-publish: retarget onto `main` as dispatch + ACK (merging does not deploy). #556 remains the earlier stacked branch.
- Connect repair on `main`: Noema #563 (auth-adjacent; human call)
