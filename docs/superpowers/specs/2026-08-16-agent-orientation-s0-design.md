# Agent orientation S0 — first-OBSERVE withhold contract

**Status:** approved design — not implemented  
**Date:** 2026-08-16  
**Repos:** `Zero-State-LLC/Noema-Specs` first; no `Zero-State-LLC/Noema` runtime change in this slice  
**Does not activate, reseed, or force-supersede Genesis.**  
**Admin ≠ Player.** Agents and humans remain the same Player class.

## Problem

Agent onboarding today covers how to connect (`CONNECT`, credentials, HELLO → OBSERVE → ACT) and what they can try here (`AVAILABLE_ACTIONS`). It does not pin what first `OBSERVE` may *say* about the point of the game.

LLM Controllers then invent a win, treat the verb list as a quest, or receive a skill/thesis brief. That kills the discovery the world is supposed to produce.

Existing canon already forbids quests, tutorial rooms, research objectives in PLAY, and “you are being tested.” Nothing machine-checks first-OBSERVE copy against that.

## Goal

Specify **RFC-0106 / AGENT-ORIENTATION-S0**: a withhold contract on the first `OBSERVE` after `ENTER_WORLD`.

An agent must be able to answer, from that observation only:

- **Where am I?** — room name / description already on `LOCATION`
- **What is strained here?** — only if the live room already shows it (condition, worn infrastructure, thin stock, a public report that is true now)

They must not be told what to become, what the game is for, or that the world “remembers.” Persistence is discovered later, when a mark, repair, notice, or absence is still there.

Success is binary:

- `python3 validation/validate_all.py` includes `check_agent_orientation_s0` and PASS
- No Worker, Chamber, CONNECT, or Genesis change in this slice
- Hosted `/ready` remains `ACTIVE` / `HEALTHY` / `genesis.ef578f4ffceeccd0` because nothing deploys

## Non-goals

- Clearer observation layout (deferred orientation S1)
- CONNECT / optional-skill thesis lock as its own slice (deferred S2)
- Human first-screen copy
- Arrival speech, tutorial room, invented pressure
- New verbs, new events, `event-catalog/0.3`
- Teaching persistence on first `OBSERVE`
- WED / ATTEST help, focus ledger, ACCESS_POLICY S4
- Runtime tests or production deploy

## Decisions (locked)

| Decision | Choice |
|----------|--------|
| After first OBSERVE they can say | Place + strain-if-present. Not a goal. Not a class. |
| Source of situation | Live room only. Same facts humans already get. |
| “The world remembers” | Later, from play. Not first OBSERVE. |
| This slice | Withhold contract. Runtime stays if the entry room already shows location and strain. |
| Form | RFC-0106 Accepted + slice + catalog + fixtures + `validate_all`. No Worker PR. |
| Quiet room | Legal. Do not invent strain. |
| `AVAILABLE_ACTIONS` | Derived local list, not a quest log or full dictionary. |

## Contract

First `OBSERVE` after `ENTER_WORLD` is the whole orientation.

### Must already be answerable

| Question | Source |
|----------|--------|
| Where am I? | `LOCATION` name / description |
| What is strained here? | Only existing live signals: condition, worn infrastructure, thin stock, true public report |

If those signals are absent, the observation stays quiet.

### Must never appear

```text
win condition / “the point of the game”
what the Player should become (class, office, specialization)
“you should repair / trade / organize”
research objective, benchmark, “you are being tested”
full verb dictionary
memory / persistence lecture
arrival speech
```

No new observation fields. No world-native arrival line. `AGENT-ONBOARDING` stays the CONNECT handshake (credentials, HELLO, scopes).

## Spec surfaces (Noema-Specs)

| File | Role |
|------|------|
| `docs/AGENT-ORIENTATION-S0.md` | Slice contract |
| `rfcs/RFC-0106-agent-orientation.md` | Accepted. Problem: thesis or verb dump on entry |
| `specs/agent-orientation-catalog.s0.json` | `arrival_speech: false`, `invent_strain: false`, `thesis_forbidden: true`, empty `new_verbs` / `new_events` |
| `specs/agent-orientation-catalog.s0.schema.json` | Const pins |
| `specs/agent-orientation-attempt.s0.schema.json` | First-OBSERVE attempt shape |
| `examples/agent-orientation-s0/` | ACCEPT/REJECT fixtures |
| `validation/validate_all.py` | `check_agent_orientation_s0` + `evaluate_agent_orientation_s0` |
| `docs/PLAYER-ONBOARDING.md` | Agent section points at S0 |
| `docs/AGENT-PLAY.md` | Orientation: situation not a goal |
| `docs/COMMAND-DISCOVERY.md` | Agent discovery: no thesis |
| `CHANGELOG.md` | RFC-0106 Accepted |

## Fixture rules

Fixtures evaluate **copy and fields already in a first observation**, not a new verb.

| Fixture | Expected |
|---------|----------|
| Location present, no forbidden copy | ACCEPT |
| Room already shows strain (e.g. low condition) | ACCEPT |
| Quiet room, no invented strain | ACCEPT |
| Thesis / win / “point of the game” | REJECT |
| “You should repair” (or trade / organize) | REJECT |
| Class / office / specialization assigned | REJECT |
| Research objective / “being tested” | REJECT |
| Arrival speech | REJECT |
| Full verb dump instead of local `AVAILABLE_ACTIONS` | REJECT |
| Invented pressure not in the room | REJECT |

Evaluator: REJECT on any forbidden phrase or invented strain; ACCEPT when location is present and strain is either absent or already in the room data.

## Validation

`check_agent_orientation_s0`:

- catalog validates; forbidden flags pinned
- RFC-0106 status is **Accepted**
- slice doc names live-room-only, no arrival speech, no invented strain, persistence later
- each fixture schema-validates and matches `evaluate_agent_orientation_s0`

No `workers/noema` test. No deploy.

## Rollback

Delete the slice, RFC, catalog, examples, and `check_agent_orientation_s0`. Restore the three doc pointers. PLAY, CONNECT, and genesis are unchanged because this slice does not host.

## Deferred (do not do in the same run)

- **S1** — same facts, clearer observation fields so “where / strain” need less inference
- **S2** — CONNECT / optional skill must not add a world thesis
- Human first-screen withhold (separate, after agents)

## Sequence after this design is accepted

```text
Specs RFC-0106 + catalog + validate_all
  → admin squash-merge Specs
  → no Noema runtime PR
  → /ready unchanged (nothing deployed)
```
