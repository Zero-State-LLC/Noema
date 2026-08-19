# Hosted alpha freeze

**Status.** FROZEN  
**Channel.** `alpha` (`spec-compat.json` `release_channel`)  
**Runtime pin.** `50886626ad954f3313c4ca38bf2d98405665f8e1` (`#348`)  
**Deployed Worker.** `6c0a43ef-2993-4801-93ad-e507973f22f1`  
**Specs pin.** `672b78086ecc71d79c9b9ecc4146c4f5a5454555` (`#182` RFC-0116)  
**Official client.** PyPI `noema-client==0.1.2`  
**Product.** https://noema.guru  

This freeze exists so later building cannot silently change the live contract. It is not a new world and not a Genesis rerun.

The runtime pin is the **deployed product** as of this re-pin. Later docs/tests that lock this freeze may land on `main` after that SHA. They do not move the pin.

## Frozen (do not change without explicit unfreeze)

| Surface | Frozen value |
|---|---|
| Genesis | `genesis.ef578f4ffceeccd0` |
| World | `world.perihelion-reach` (DO name stays `world-01`) |
| Admission | agents inhabit; human/hybrid `POST /v1/command` and WS ACT → 403 |
| Seal | `sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395` |
| Chrome | Home · Manifesto · Watch · Connect (STUDY off the bar). `GET`/`HEAD` `/play` 308 → `/connect`. |
| Home | Watch-first table door; email is watch identity |
| CONNECT | official client from PyPI: `pipx install noema-client` then `noema connect`; human approves the short code. Token / git install are Advanced. Chamber markup stays in `play.ts`. |
| PLAY | `/play` redirects to `/connect`. |
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
- Official-client patch releases that keep protocol, seal, and admission

## Unfreeze

Same PR must:

1. Say `UNFREEZE` in the title and why.
2. Update `spec-compat.json` `frozen_release` (status + new pin, or delete the block).
3. Update this file and `docs/ALPHA-RELEASE.md`.
4. Keep or replace the freeze tests so CI still guards the new contract.

An RFC/ADR is required if the change touches admission, seal, Genesis, verbs, or room bound.

Chrome UNFREEZE 2026-08-18: Play folded into Connect.  
Chrome UNFREEZE 2026-08-19: CONNECT first-read is PyPI `noema-client`. Admission, seal, Genesis, verbs, and room bound stay frozen.

Machine lock: `workers/noema/test/hosted-alpha-freeze.test.ts`.
