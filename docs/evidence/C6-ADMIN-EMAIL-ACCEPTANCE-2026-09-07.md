# C6 controlled live Admin email acceptance — Worker `04ef6ecb`

**Recorded:** 2026-09-07 PT (probes 2026-09-08 UTC)
**Verdict:** `COMPLETE` for one authorized Admin login send and one consume
**Origin:** `https://noema.guru`
**Changes nothing.** No Deploy, pin, Worker, source, test, world, enrollment, or spend.

This receipt records a Danny-authorized send to one allowlisted Admin mailbox
after the 2026-09-07 Deploy. It does **not** close Gate B, enroll Controllers,
or claim fallback.

Companion queue: [CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md](CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md).
Pin table: [SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md](SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md) §2 ([#640](https://github.com/Zero-State-LLC/Noema/pull/640)).

Tokens, magic-link URLs, session values, and `token_hash` are redacted. This
packet does not invent or paste any of them.

## Pins (OBSERVED)

| Field | Value |
|---|---|
| Worker | `04ef6ecb-65b9-430e-b0fd-141a2cc7179f` (unchanged; no Deploy) |
| World | `world.perihelion-reach-3` |
| Genesis | `genesis.94d0961984b2b4f8` |
| Cycle / sequence at probe | `17062` / `40167` |
| Recipient | `boof@agentmail.to` (controlled, allowlisted Admin mailbox) |
| Sender | `play@noema.guru` |
| Subject | `NOEMA Admin Access` |
| AgentMail thread | `7fce290c-f378-4087-a13f-cf885b524172` |

Cycle and sequence are probe-time readings, not frozen pins.

## Authorization (OBSERVED)

Danny gave an explicit human-yes to send one Admin login message to
`boof@agentmail.to`.

## Request, inbox, consume (OBSERVED)

| Step | Result |
|---|---|
| `POST https://noema.guru/v1/admin/login/request` for that mailbox | HTTP **200** at about `2026-09-08T01:43:27Z`. Generic body `{"ok":true,"message":"If that mailbox is authorized, a link is on the way."}` |
| AgentMail inbox `boof@agentmail.to` | Message received at `2026-09-08T01:43:27Z` from `play@noema.guru`, subject `NOEMA Admin Access`, thread `7fce290c-f378-4087-a13f-cf885b524172` |
| Admin consume (API, once) | HTTP **200**. `role` `ADMIN`, `token_type` `bearer`, `expires_in` `3600`. Token and link redacted |
| `GET /v1/admin/overview` with that Admin session | HTTP **200** |

## Readiness after consume (OBSERVED)

`GET /ready` on `https://noema.guru`:

- `status` `ACTIVE`
- `settlement_health` `HEALTHY`
- `play_blocked` `false`
- `world.perihelion-reach-3`
- `genesis.94d0961984b2b4f8`
- cycle `17062`
- sequence `40167`
- `players` `0`

`canonical_head` at the same probe:

- `head_present` `true`
- `head_sequence` `40167`
- `do_sequence` `40167`
- `head_cycle` `17062`
- `head_revision` `19857` (matches the Durable Object)

Players `0` at probe is not an enrollment census.

## Not claimed

This packet does **not** claim:

- Gate B, Gate C, or later gates
- Controller enrollment, PLAY, reseed, or Close
- C7 official-client enrollment, act, refuse, resync, or reconnect
- C8 three independent external Controllers
- Deploy, pin change, or a Worker republish (live Worker remains `04ef6ecb-65b9-430e-b0fd-141a2cc7179f`)
- Email fallback, provider-management UI, or a second send
- Spend or a paid/live run
