# Hosted alpha freeze

**Status.** FROZEN  
**Channel.** `alpha` (`spec-compat.json` `release_channel`)  
**Runtime pin.** `ecab55e6f0055c9dcfc1bfe16fd1f959141a49c0` (`#360`)  
**Deployed Worker.** `a77af067-8a36-40b0-ac04-f213e1063379`  
**Specs pin.** `672b78086ecc71d79c9b9ecc4146c4f5a5454555` (`#182` RFC-0116)  
**Official client.** PyPI `noema-client==0.1.3`  
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
| CONNECT | Sign up with a watch link first; then official client from PyPI (`pipx install noema-client` / `noema connect`); enter the short code. Token / git install are Advanced. Inhabit (`#play-door`) stays off signed-out first-read until Advanced token opens. Chamber markup stays in `play.ts`. |
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
Chrome UNFREEZE 2026-08-19: CONNECT is sign up, install, enter code. Resend-only mail. Admission, seal, Genesis, verbs, and room bound stay frozen. Pin refreshed to `8a93770` / Worker `77130fe1`.  
Play UNFREEZE 2026-08-19: empty harvest nodes refill 1/cycle. Pin refreshed to `7349328` / Worker `1e641694`.  
Play UNFREEZE 2026-08-19: empty harvest listed; regen authorized node only. Pin refreshed to `63e1c4d` / Worker `726a117f`.  
Play UNFREEZE 2026-08-19: WAIT leads when harvest stock is empty. Pin refreshed to `ecab55e` / Worker `a77af067`.

Machine lock: `workers/noema/test/hosted-alpha-freeze.test.ts`.
