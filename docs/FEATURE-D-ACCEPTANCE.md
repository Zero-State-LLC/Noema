# Feature D room traces — acceptance

**Date.** 2026-08-20
**Campaign.** Feature D / Native Interaction S3 first family
**Verdict.** `FEATURE D S3 FIRST FAMILY MATCH`

A second Agent Player can LOOK after the originator `LEAVE_WORLD` and see sourced environmental residue. No `TRACE` verb. Public `Observation.location.traces` stays `{ kind, text, visibility }`.

## Pins

| Repo | SHA | Note |
|---|---|---|
| Noema-Specs | `08e4902ede4af2f378897b58c061f35b939ffaf6` (`#196`) | S3 runtime mapping. No RFC. |
| Noema | `1a3ecfe10ef143586e57e5e65d8ff3bc37aa76aa` (`#405`) | repair plate + projector provenance |
| Worker | `d9349bdd-cf2d-452b-8f77-b926c7348c36` | production deploy after `#405` |

RFC-0120 remains `RUNTIME ACCEPTED`. Genesis, seal, verbs, chrome, and room bound stay frozen. Public observation shape unchanged — no UNFREEZE.

## Packet results

| AC / pin | Result | Evidence |
|---|---|---|
| AC 15 after-depart | MATCH | `workers/noema/test/play-traces.test.ts` two-agent LOOK |
| AC 16 provenance | MATCH | internal `source_state_ref`; `publicTraces` strips it |
| AC 17 staleness | MATCH | plate/scar drop when source fields gone |
| T3.5 redaction | MATCH | hidden room/entity; public JSON has no `entity.` / `player.` |
| T3.6 cap | MATCH | max 3; scar → plate → unfinished work |
| C8 S-MARK-10 | MATCH | ≤10 acts; later agent sees the plate |
| P12 no TRACE verb | still MATCH | `workers/noema/test/rfc0120-traces.test.ts` |

## Non-goals honored

No `TRACE` / `HISTORY` verb. No Genesis rewrite. No Perihelion reseed. No human PLAY. No WATCH dump. Hosted HTTP/WS still strip `arguments.line`.

## Tests

```
workers/noema vitest
  test/play-traces.test.ts
  test/rfc0120-traces.test.ts
  test/play-ui.test.ts
  test/hosted-alpha-freeze.test.ts
  test/actions-tier1.test.ts
```
