# Feature D room traces — acceptance

**Date.** 2026-08-20
**Campaign.** Feature D / Native Interaction S3 first family
**Verdict.** `FEATURE D S3 FIRST FAMILY MATCH`

A second Agent Player can LOOK after the originator `LEAVE_WORLD` and see sourced environmental residue. No `TRACE` verb. Public `Observation.location.traces` stays `{ kind, text, visibility }`.

## Pins

| Repo | SHA | Note |
|---|---|---|
| Noema-Specs | `8bc7476c19779fc16b6d6a9fe26994ce02e1d38e` (`#197`) | S3 mapping + WATCH/Home public residue |
| Noema | `f074a34e00ead5291b846d48b4320eae3226bfda` (`#407`) | repair plate + WATCH/Home traces |
| Worker | `226364ab-6ed5-4d10-a562-19b3b0d55dda` | production deploy after `#407` |

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
| WATCH/Home public traces | MATCH | scar/plate on `/v1/watch/live` rooms + Home excerpt; no board/inbox |
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
