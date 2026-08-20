# RFC-0120 agent-only Player identity — acceptance

**Date.** 2026-08-20  
**Campaign.** `noema-agent-only-player-identity`  
**Verdict.** `RFC-0120 RUNTIME ACCEPTED`

Identity UNFREEZE 2026-08-20: leftover CONNECT occupancy rebinds onto the device Agent Player; leftover human/hybrid inhabit rows are evicted; Chamber `Role.PLAYER` cannot mutate. Genesis, seal, verbs, and room bound stay frozen.

## Pins

| Repo | `origin/main` at close | Note |
|---|---|---|
| Noema-Specs | `93b6963b50326c01118c3a0a338bafbf9323f94a` | `#193` RFC-0120 Accepted |
| Noema | this commit on `main` | Worker identity + observation + credentials |

Hosted alpha freeze (`docs/HOSTED-ALPHA-FREEZE.md`) still owns Genesis, seal, chrome, and `DEFAULT_WORLD_ID`. The RFC-0120 identity unfreeze is **landed**. Further identity changes need a new `UNFREEZE` PR.

## Packet results

| Packet | Result | Evidence |
|---|---|---|
| P0 specs | MATCH | Specs `#193` |
| P1 principal split | MATCH | `HumanPrincipal` vs `PlayerPrincipal`; `workers/noema/test/rfc0120-principal.test.ts` |
| P2 human JWT de-Playerization | MATCH | Supabase / magic-link → HumanPrincipal; no `player_id` |
| P3 agent-only live mint | MATCH | Admin mint refuses human/hybrid |
| P4 CONNECT + credentials | MATCH | New enrollments allocate Agent Player from device; revoke/rotate on enrollment DO bag `#396` |
| P5 HTTP/WS/DO admission | MATCH | `requireAgentPlayer` on `/v1/command`, WS ACT, DO `/command` `#395` |
| P6 leftover `controller_type` | MATCH | human/hybrid access tokens are HumanPrincipal; not rewritten on the ledger |
| P7 observation | MATCH | WHERE/HERE/EXITS/STATUS/AVAILABLE ACTIONS `#397` |
| P8 structured discovery | MATCH | affordance `target_id` for MOVE/INSPECT/COMMIT |
| P9 client/harness | MATCH | `ActionProposal` forbids free-form `line` |
| P10 Chamber tooling | MATCH | `can_mutate_world()` is Role.AGENT only. Role.PLAYER is refused in every env |
| P11 admin/researcher ≠ Player | MATCH | Admin session is not an access token; STUDY does not mint Player |
| P12 Deep Time traces | MATCH | No `TRACE` verb. Agent `MOVE` is a durable ledger event. Chamber ingest is RESEARCHER/ADMIN and `mutates_world: false` |
| P13 WATCH | MATCH | Public projection; no inbox, affordances, situation, practice_lines |
| P14 this closeout | MATCH | this file |

## Residuals (not blockers)

```text
Hosted GET /play 308 → /connect. Chamber PLAY HTML remains in play.ts for
offline tests. Hosted CONNECT does not embed the inhabit chamber.
Hosted HTTP/WS strips arguments.line; structured commands only.
```

## Non-goals honored

No Perihelion reseed. No Genesis rewrite. No new Player verbs. No `AGENT_PLAYER` wire class. No historical `controller_type` rewrite.

## Tests

```
workers/noema vitest (rfc0120-* including traces)
tests/test_rfc0120_chamber_isolation.py
tests/test_rfc0120_deep_time.py
clients/noema-llm-agent tests/test_protocol.py::test_rfc0120_structured_action_has_no_human_line
```
