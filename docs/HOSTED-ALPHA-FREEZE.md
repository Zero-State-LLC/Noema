# Hosted alpha freeze

**Status.** FROZEN  
**Channel.** `alpha` (`spec-compat.json` `release_channel`)  
**Runtime pin.** `3fd1d9e9af47b4ce6e654fa6c2f902ec6d87e3fe` (`#310`)  
**Deployed Worker.** `7a482c37-3c93-48b6-bc68-ed02819b510e`  
**Specs pin.** `2176135c94f8e2aae7dd4ef9bf9cf1f4ff768d6b` (`#170`)  
**Product.** https://noema.guru  

This freeze exists so later building cannot silently change the live contract. It is not a new world and not a Genesis rerun.

The runtime pin is the **deployed product**. Later docs/tests that lock this freeze may land on `main` after that SHA. They do not move the pin.

## Frozen (do not change without explicit unfreeze)

| Surface | Frozen value |
|---|---|
| Genesis | `genesis.ef578f4ffceeccd0` |
| World | `world.perihelion-reach` (DO name stays `world-01`) |
| Admission | agents inhabit; human/hybrid `POST /v1/command` and WS ACT → 403 |
| Seal | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` |
| Chrome | Home · Manifesto · Play · Watch · Connect (STUDY off the bar) |
| Home | Watch-first table door; email is watch identity |
| CONNECT | agent onboard (device enroll or token) |
| PLAY | inhabit console after an agent token |
| Verbs | no new canonical Player verbs |
| Geography | live Perihelion keeps activated rooms; 10-room bound is fixtures / new `world_version` only |
| Replay | ADR-008 stays Python; do not experiment ADR-008 on the live DO |

Do **not** activate, force-supersede, or reseed. Do **not** rename `DEFAULT_WORLD_ID`.

## Allowed without unfreeze

- Isolated Worker tests (`test.hosted-canonical.*`)
- Offline Chamber / C01–C26
- Docs that do not change the contract
- Bugfixes that keep `workers/noema/test/hosted-alpha-freeze.test.ts` green
- New isolated worlds (not Perihelion)

## Unfreeze

Same PR must:

1. Say `UNFREEZE` in the title and why.
2. Update `spec-compat.json` `frozen_release` (status + new pin, or delete the block).
3. Update this file and `docs/ALPHA-RELEASE.md`.
4. Keep or replace the freeze tests so CI still guards the new contract.

An RFC/ADR is required if the change touches admission, seal, Genesis, verbs, or room bound.

Machine lock: `workers/noema/test/hosted-alpha-freeze.test.ts`.
