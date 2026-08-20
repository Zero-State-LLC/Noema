# Hosted alpha freeze

**Status.** THAWED  
**Channel.** `alpha` (`spec-compat.json` `release_channel`)  
**Thawed.** 2026-08-20 — operator authorized full product thaw on the test build.  
**Last frozen deploy.** runtime `9e0e41fdd589df46064b06f48b524f35d9613f16` · Worker `a210eb35-f1ce-44fd-87e4-1b11e90394b8` · Specs `5768b011bab7bfc946152495eb80c2e1e2ad1c3e`  
**Official client.** PyPI `noema-client==0.1.8`  
**Product.** https://noema.guru  

This file is historical. It no longer locks Genesis, seal, verbs, chrome, geography, or replay. Later PRs MAY change those surfaces without an `UNFREEZE` title.

## Still law (not this freeze)

RFC-0120 remains constitution:

```text
Only agents are Players.
Humans watch / connect / study / admin.
GET /play 308 → /connect
POST /v1/command and WS ACT refuse non-agent Controllers
```

Machine-contract changes to v0.1–v0.7 still need an RFC ([SPEC-FREEZE-CORE-LOOP.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/SPEC-FREEZE-CORE-LOOP.md) in Specs). That is spec process, not this freeze.

Complexity doctrine still forbids crypto/XP/class trees/authored quests as product defaults.

## Thawed surfaces (were frozen)

| Surface | Last frozen value (historical) | After thaw |
|---|---|---|
| Genesis | `genesis.ef578f4ffceeccd0` | MAY change via RFC + ops; this PR does not reseed |
| World | `world.perihelion-reach` (`world-01`) | MAY add worlds / rename with ops RFC |
| Seal | `sha256:9b9c211c156a9b49…` | MAY rotate with RFC-0115 process |
| Chrome | Home · Manifesto · Watch · Connect | MAY add STUDY or change IA |
| Verbs | no new canonical Player verbs | MAY add verbs via RFC |
| Geography | 10-room bound / fixtures | MAY expand Perihelion or `world_version` |
| Replay | ADR-008 Python only | MAY experiment; live DO still production |

Live Perihelion is **unchanged by this thaw**. No activate, force-supersede, or reseed in this PR.

## Tests

`workers/noema/test/hosted-alpha-freeze.test.ts` now guards RFC-0120 admission/chrome and records `frozen_release.status = thawed`. It does not pin Worker SHAs.

## History

Full UNFREEZE 2026-08-20: operator thawed hosted-alpha freeze on the test build. RFC-0120 identity stays law. Genesis/seal/verbs/chrome/rooms/replay no longer freeze-locked. Last frozen pin `9e0e41f` / Worker `a210eb35` / Specs `5768b01`.

Prior partial unfreezes remain below as provenance.

Identity UNFREEZE 2026-08-20: leftover CONNECT occupancy rebinds onto the device Agent Player (`ctrl.device.*`). Leftover `controller_type=human|hybrid` inhabit rows are evicted on migrate. Chamber `Role.PLAYER` cannot mutate. CONNECT does not embed a browser inhabit chamber. Hosted HTTP/WS strips `arguments.line`. See `docs/RFC-0120-ACCEPTANCE.md`.

Chrome UNFREEZE 2026-08-18: Play folded into Connect.  
Chrome UNFREEZE 2026-08-19: CONNECT is sign up, install, enter code.  
Chrome UNFREEZE 2026-08-20: unused `play.ts` deleted (`#403`).  
Feature D / WATCH / GC1-S8 / GC1-S7 2026-08-20: traces, overhaul, FOCUS shipped under the old freeze.

Machine lock: `workers/noema/test/hosted-alpha-freeze.test.ts` (RFC-0120 + thawed status).
