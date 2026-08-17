# Tenant tester agent — play then debug

**Status:** approved for spec  
**Date:** 2026-08-17  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** The tester never mints `typ: admin-access`.  
**No `AGENT_PLAYER`.** The tester is a Controller for a Player inside a tenant.  
**Does not Recover Perihelion.** Isolated Recover stays the existing operator script.  
**Does not send or consume PLAY letters.**

Extends the existing headless harness ([AGENT-STAGE0](../../AGENT-STAGE0.md), `src/noema/harness/`). Device attach on the live tenant stays [CONNECT two doors](2026-08-17-connect-two-doors-design.md). Isolated attach stays `operator.env` + dual-auth.

## Problem

We cannot keep a Player in a tenant without a human watching, and when a turn fails we still do not know why. The harness already plays advertised acts. It does not switch into an in-room debug pass or write a fault report. Perihelion Reach is treated like it *is* Noema, so testers keep wiring themselves to the live world by default.

## Goal

One Controller, one tenant per run, two modes: **play** then **debug**. Isolated tenant by default. Perihelion only with an explicit live-tenant flag. A model may classify the fault and draft report prose. It may not choose a Player verb.

Success is binary:

- Default run never sends `POST /v1/command` to Perihelion.
- Play mode is deterministic (`FirstValidAffordanceAdapter`). No model call.
- Pinned smells enter debug. Quiet WAIT does not.
- Debug stays in the same room (A+). No MOVE / harvest / trade / repair in debug.
- After debug, a local report file is written. Model down → structured fields still write, classification `unclassified`.
- Model text that looks like a command is discarded. No extra `/v1/command`.
- No `AGENT_PLAYER` type exists after this work.

## Non-goals

- Making human PLAY `/v1/command` world-addressable (platform tenancy RFC; later).
- Hosted tester Durable Object / always-on Worker actor.
- Long-lived tester token per tenant (follow-on).
- Auto-approve `/connect` or skip human approve on Perihelion.
- Isolated Recover, Admin lifecycle, or Genesis from this loop.
- New Player verbs. Full Player toolkit in debug (rejected).
- Debug MOVE to hunt a fault (rejected).
- Mailing the report. Posting it into the world. Admin attention items.
- Browser `/play` DOM automation.

## Ontology (locked)

| Name | Role |
|------|------|
| **Noema** | Platform: gateway, world runtime, auth, Admin plane, harness. |
| **Tenant** | A world. Isolated `test.hosted-canonical.*` worlds are test tenants. |
| **Perihelion Reach** | First generated world. Already exists. Admin manages it as a tenant. Only **live** tenant today. |
| **Tester** | Player inside the chosen tenant. Controller → `POST /v1/command`. Designed to run against any tenant later. |

Admin manages the tenant. The tester does not.

Human PLAY stays on `DEFAULT_WORLD_ID`. This spec does not change that.

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| Job | One loop: play until a smell, then debug on the same Controller. |
| Where | Isolated tenant default. Perihelion only with explicit live-tenant flag. |
| Debug power | **A+**: in-room LOOK / INSPECT / OBSERVE; retry the failed command once if it was already look/inspect/wait; WAIT once. No MOVE, harvest, trade, or repair “to debug.” |
| Smell list | Hard fail + observation contradicts last command. Quiet WAIT stays play. |
| Brain | Deterministic play. Model only in debug, classify + draft prose. |
| Attach (this slice) | Isolated: `operator.env`. Perihelion: device enroll + human `/connect`. |
| Attach (follow-on) | Long-lived tester Controller per tenant. Not this slice. |
| Implementation | Extend `HeadlessHarness`. Not a Worker DO. Not a second process. |
| Report | Local file on the operator machine. No token, no `device_code`, no operator secret. |

## Loop

Turn cycle is unchanged: OBSERVE → compress → decide → validate → act → verify.

**Play.** `FirstValidAffordanceAdapter`: first advertised work; WAIT in a quiet room.

**Debug** starts only on:

1. Command `ok: false`, or HTTP 4xx / 5xx.
2. `WORLD_INCIDENT` or auth death (`AUTH_REQUIRED` / 401 / 403 on the Controller).
3. Settlement `NONCONTIGUOUS_SEQUENCE` or `DUPLICATE_EVENT_CONFLICT`.
4. Observation contradicts the last command: after MOVE, `location.room_id` is still the previous room; after INSPECT, the named target is absent from the observation.

Auth death: write the report immediately. No A+ probes (the Controller cannot OBSERVE).  
`WORLD_INCIDENT`: one OBSERVE if the token still works, then report, then stop. No MOVE.

Budget: existing `--turns` cap. Smell → A+ debug (when allowed) → report → **stop**. Cap hit with no smell → report `classification=ok` → stop.

## Attach

The tester never mints Admin and never consumes PLAY letters.

| Tenant | Controller |
|--------|------------|
| Isolated `test.hosted-canonical.*` | Existing `operator.env` dual-auth / isolated ACK. No `/connect`. |
| Perihelion (`world.perihelion-reach` or alias `perihelion`) | `POST /v1/auth/device` + human `/connect` approve (`?code=`). |

Refuse before enroll when the tenant is Perihelion and the live-tenant flag is unset.

CLI flags (fixed):

```text
noema-agent --tenant test.hosted-canonical.<suffix> run
noema-agent --tenant perihelion --live-tenant run
```

`--tenant` is required unless `NOEMA_TENANT` is set.  
`perihelion` is an alias for `world.perihelion-reach`.  
Perihelion without `--live-tenant` (and without `NOEMA_LIVE_TENANT=1`) → refuse before enroll.  
Missing tenant and missing env → refuse. Never fall back to `DEFAULT_WORLD_ID`.

## Report

Written after debug (or after a clean turn-cap stop) as a local file beside the run. Not mailed. Not written into the tenant.

Required fields:

- `tenant_id`
- `live` (boolean)
- `mode_at_stop` (`play` / `debug`)
- `last_command`
- `error_code` or `contradiction`
- `cycle`, `sequence`, `room_id`
- `probes` (A+ commands actually sent)
- `classification` (enum below)
- `summary` (model prose or empty)

**Classification enum:** `command_rejected` | `settlement` | `incident` | `auth` | `contradiction` | `ok` | `unclassified`.

The model sees only redacted turn context (last command, error, observation excerpts, probes). If it is missing or fails: `classification=unclassified`, structured fields still written. If it emits a command-shaped string (`MOVE east`, `POST /v1/command`, `export TOKEN=`): discard the verb; keep at most a sanitized summary; send no extra command.

## Error handling

| Case | Behavior |
|------|----------|
| Perihelion, no live flag | Refuse. Zero commands. |
| Isolated Recover / Admin lifecycle / Genesis | Not callable from this loop. |
| Debug proposes MOVE / harvest / trade / repair | Validator drops it. |
| Model proposes a verb | Discard. No command. |
| Model down | Report writes `unclassified`. |
| Auth death / INCIDENT | Stop. Report. No hunt. |
| Orientation S0 | First OBSERVE still withholds thesis / class / research lecture. |

## Testing

Harness pytest (and Worker tests only if a tiny CLI/env parse lands there):

- Default tenant is isolated; Perihelion without `--live-tenant` never calls `/v1/command`.
- Play mode: quiet room WAIT; zero model calls.
- `ok: false` and “MOVE said east, still in the old room” both enter debug.
- Quiet WAIT does not enter debug.
- Debug sends at most in-room LOOK / INSPECT / same-command retry / one WAIT; assert no MOVE.
- Model down → report exists, `unclassified`.
- Model returns `MOVE east` → ignored; command count unchanged.
- `AGENT_PLAYER` is not an exported type.

## Out of scope leftovers

- Long-lived tester token per tenant.
- Platform RFC: human PLAY addresses a tenant id.
- Always-on hosted tester.
- Isolated operator ACK replacement (it stays the isolated attach).
- Gameplay leftovers after GC1-S8 (still closed unless a new RFC).
