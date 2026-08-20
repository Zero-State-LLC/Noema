# Hosted alpha freeze

**Status.** FROZEN  
**Channel.** `alpha` (`spec-compat.json` `release_channel`)  
**Runtime pin.** `f192045f24a5b7234196abe548a116e0a7ad08d8` (`#399` identity UNFREEZE)  
**Deployed Worker.** `bc61bc3f-05db-4288-950c-2c04d309d1b6`  
**Specs pin.** `ae2e56afb5bfed0335e2760c856a3723ffc4ed27` (`#195` remap governance close)  
**Official client.** PyPI `noema-client==0.1.8`  
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
| CONNECT | Sign up with a watch link first; then official client from PyPI (`pipx install noema-client` / `noema connect`); enter the short code. Token / git install are Advanced. Inhabit is `noema play`, not a browser chamber. |
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

Identity UNFREEZE 2026-08-20: leftover CONNECT occupancy rebinds onto the device Agent Player (`ctrl.device.*`). Leftover `controller_type=human|hybrid` inhabit rows are evicted on migrate. Chamber `Role.PLAYER` cannot mutate. CONNECT does not embed a browser inhabit chamber. Hosted HTTP/WS strips `arguments.line`. Genesis, seal, verbs, and room bound stay frozen. See `docs/RFC-0120-ACCEPTANCE.md`.

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
Play UNFREEZE 2026-08-19: settlement races reject the actor, not world INCIDENT. Pin refreshed to `3b50276` / Worker `bcec8cb5`.  
Client UNFREEZE 2026-08-19: official Controller `noema-client==0.1.4` resumes after Close and settlement races. Worker pin unchanged.  
Play UNFREEZE 2026-08-19: lockout WAIT rest (RFC-0117). Pin refreshed to `fbb6174` / Worker `63881572` / Specs `1a764da`.  
Play UNFREEZE 2026-08-20: work consumes cargo (RFC-0118). Pin refreshed to `6659b86` / Worker `633f6c44` / Specs `335a9cb`.  
Play UNFREEZE 2026-08-20: BUILD remainder UPGRADE/REPURPOSE/RESTORE consume cargo. Pin refreshed to `81f7e04` / Worker `6b9b310b` / Specs `0a54ae8`.  
Play UNFREEZE 2026-08-20: RESOURCE-ECONOMY harvest debit honesty. Worker pin unchanged. Specs `4331070`.  
Client UNFREEZE 2026-08-20: official Controller `noema-client==0.1.5` spends cargo when harvest is blocked by a full hold. Worker pin unchanged.  
Client UNFREEZE 2026-08-20: official Controller `noema-client==0.1.6` retries SETTLEMENT_RESYNC once with the same keys. Worker pin unchanged.  
Play UNFREEZE 2026-08-20: WAIT burns cargo for energy (RFC-0119). Pin refreshed to `35e7e33` / Worker `b69cde3e` / Specs `978e199`.  
Play UNFREEZE 2026-08-20: R0 STATUS glance and four-beat HAPPENED. Pin refreshed to `f4d7a7d` / Worker `416e6e5a` / Specs `978e199`.  
Play UNFREEZE 2026-08-20: PIXEL pulses current snapshot after TEXT polls. Pin refreshed to `1bac149` / Worker `0e6fdfce` / Specs `978e199`.  
Play UNFREEZE 2026-08-20: R1 MOVE dest orientation without LOOK attention. Pin refreshed to `8930f41` / Worker `a54f35e0` / Specs `978e199`.  
Client UNFREEZE 2026-08-20: official Controller `noema-client==0.1.7` preference-layer aliases and bounded macros (Feature E / S4). Worker pin unchanged.  
Play UNFREEZE 2026-08-20: S7 Home live excerpt from WATCH-safe projection. Pin refreshed to `2bcc27c` / Worker `4145615c` / Specs `978e199`.  
Play UNFREEZE 2026-08-20: CONNECT pipx upgrade + official Controller `noema-client==0.1.8`. Pin refreshed to `ac2b2b2` / Worker `375096fc` / Specs `978e199`.  
Identity UNFREEZE 2026-08-20: remap leftover CONNECT occupancy to device Agent Players; Chamber Role.PLAYER cannot mutate. Pin refreshed to `f192045` / Worker `bc61bc3f` / Specs `ae2e56a`. Genesis, seal, verbs, chrome, rooms stay frozen.  
Chrome UNFREEZE 2026-08-20: CONNECT drops the browser inhabit chamber; hosted HTTP/WS strips `arguments.line`; leftover event `player_id` rewrites on occupancy rebind.

Machine lock: `workers/noema/test/hosted-alpha-freeze.test.ts`.
