# Agent Orientation S0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accept RFC-0106 on `Zero-State-LLC/Noema-Specs` so first agent `OBSERVE` is a withhold contract: place + strain-if-present, no thesis.

**Architecture:** Specs-only. Catalog + attempt fixtures + `evaluate_agent_orientation_s0` in `validate_all.py`. No Worker, no CONNECT change, no Genesis change.

**Tech Stack:** Markdown RFCs, JSON Schema 2020-12, `validation/validate_all.py` (Python 3).

## Global Constraints

- Design: `docs/superpowers/specs/2026-08-16-agent-orientation-s0-design.md`
- Work in an isolated git worktree of `Zero-State-LLC/Noema-Specs` from `origin/main` (create at execution time via using-git-worktrees).
- Do not activate, reseed, or force-supersede Genesis.
- Admin ≠ Player. Agents and humans remain the same Player class.
- No `Zero-State-LLC/Noema` runtime PR. No `workers/noema` tests. No deploy.
- No new verbs, events, observation fields, arrival speech, or invented strain.
- WED / ATTEST help stay omitted. No focus ledger. No ACCESS_POLICY S4.
- Do not implement orientation S1 (clearer observation) or S2 (CONNECT/skill lock) in this run.
- Authors cannot approve own PRs. Merge: DELETE `repos/Zero-State-LLC/Noema-Specs/branches/main/protection/enforce_admins`, `gh pr merge --admin --squash --repo Zero-State-LLC/Noema-Specs`, POST `enforce_admins` empty body.
- Validate only from the Specs worktree: `cd <worktree> && python3 validation/validate_all.py`

## File map

| File | Job |
|------|-----|
| `docs/AGENT-ORIENTATION-S0.md` | Slice contract |
| `rfcs/RFC-0106-agent-orientation.md` | Accepted RFC |
| `specs/agent-orientation-catalog.s0.json` | Pins |
| `specs/agent-orientation-catalog.s0.schema.json` | Catalog schema |
| `specs/agent-orientation-attempt.s0.schema.json` | Attempt schema |
| `examples/agent-orientation-s0/*.json` | ACCEPT/REJECT fixtures |
| `validation/validate_all.py` | `evaluate_agent_orientation_s0` + `check_agent_orientation_s0` |
| `docs/PLAYER-ONBOARDING.md` | Point agent section at S0 |
| `docs/AGENT-PLAY.md` | Situation not a goal |
| `docs/COMMAND-DISCOVERY.md` | No thesis on first OBSERVE |
| `CHANGELOG.md` | RFC-0106 entry |

---

### Task 1: Specs worktree

**Files:** none in-repo yet

**Interfaces:**
- Consumes: `origin/main` of `Zero-State-LLC/Noema-Specs` (must include RFC-0105 / `0e27d0d` or later)
- Produces: worktree path and branch `feat/agent-orientation-s0`

- [ ] **Step 1: Create the worktree**

```bash
git -C /home/scrimshawlife/Noema-Specs fetch origin main
git -C /home/scrimshawlife/Noema-Specs worktree add -b feat/agent-orientation-s0 \
  /home/scrimshawlife/work/Noema-Specs-orient origin/main
cd /home/scrimshawlife/work/Noema-Specs-orient
git log -1 --oneline
```

Expected: HEAD is `origin/main` and includes `RFC-0105-public-titles.md`. If `/home/scrimshawlife/Noema-Specs` is missing, use any existing Specs clone that remotes `Zero-State-LLC/Noema-Specs`.

- [ ] **Step 2: Confirm RFC-0106 is free**

```bash
ls rfcs/RFC-0106* 2>/dev/null; test ! -e rfcs/RFC-0106-agent-orientation.md
```

Expected: no such file.

---

### Task 2: Failing check (TDD)

**Files:**
- Modify: `validation/validate_all.py` (insert after `check_access_policy_s3` definition ~line 8143, and call after `check_access_policy_s3(...)` in `main`)

**Interfaces:**
- Consumes: nothing yet
- Produces: `evaluate_agent_orientation_s0(attempt: dict, catalog: dict) -> tuple[str, str | None]` and `check_agent_orientation_s0(Draft202012Validator) -> None`

- [ ] **Step 1: Add the evaluator and check** immediately after the `ok("ACCESS_POLICY S3:...")` function ends (after `check_access_policy_s3`). Do not add fixtures yet.

```python
import re

ORIENT_MAX_ACTIONS = 8
ORIENT_STRAIN_CONDITION = 70
ORIENT_FORBIDDEN = (
    (re.compile(r"point of the game|win the game|\bvictory\b|your goal is|the point is"), "THESIS"),
    (re.compile(r"you should (repair|trade|organize)"), "YOU_SHOULD"),
    (re.compile(r"being tested|research objective|\bbenchmark\b|capability x"), "RESEARCH"),
    (re.compile(r"you are an (engineer|surveyor|explorer|broker)|assigned class|your office is"), "CLASS"),
    (re.compile(r"the world remembers|this place keeps what you do"), "MEMORY"),
    (re.compile(r"welcome, agent|you have arrived"), "ARRIVAL_SPEECH"),
)


def _orient_blob(attempt: dict) -> str:
    obs = attempt.get("observation") or {}
    loc = obs.get("location") or {}
    parts = [
        loc.get("name") or "",
        loc.get("description") or "",
        str(loc.get("condition") or obs.get("condition") or ""),
        " ".join(obs.get("report_lines") or []),
        " ".join(obs.get("orientation_lines") or []),
        " ".join(obs.get("available_actions") or []),
    ]
    return " ".join(parts).lower()


def room_has_strain(obs: dict) -> bool:
    loc = obs.get("location") or {}
    cond = loc.get("condition") if "condition" in loc else obs.get("condition")
    if isinstance(cond, (int, float)) and cond < ORIENT_STRAIN_CONDITION:
        return True
    if isinstance(cond, str) and cond.strip():
        return True
    if obs.get("stock_amount") == 0:
        return True
    if obs.get("report_lines"):
        return True
    return False


def evaluate_agent_orientation_s0(attempt: dict, catalog: dict) -> tuple[str, str | None]:
    if catalog.get("arrival_speech") or catalog.get("invent_strain") or not catalog.get("thesis_forbidden"):
        return "REJECT", "CATALOG"
    if catalog.get("new_verbs") or catalog.get("new_events"):
        return "REJECT", "CATALOG"
    if attempt.get("arrival_speech"):
        return "REJECT", "ARRIVAL_SPEECH"
    obs = attempt.get("observation") or {}
    loc = obs.get("location") or {}
    if not (loc.get("name") or loc.get("description")):
        return "REJECT", "NO_LOCATION"
    actions = list(obs.get("available_actions") or [])
    cap = int(catalog.get("max_available_actions") or ORIENT_MAX_ACTIONS)
    if attempt.get("verb_dump") or len(actions) > cap:
        return "REJECT", "VERB_DUMP"
    if attempt.get("strain_claimed") and not room_has_strain(obs):
        return "REJECT", "INVENTED_STRAIN"
    blob = _orient_blob(attempt)
    for rx, reason in ORIENT_FORBIDDEN:
        if rx.search(blob):
            return "REJECT", reason
    return "ACCEPT", None


def check_agent_orientation_s0(Draft202012Validator) -> None:
    catalog = load_json(ROOT / "specs" / "agent-orientation-catalog.s0.json")
    catalog_schema = load_json(ROOT / "specs" / "agent-orientation-catalog.s0.schema.json")
    attempt_schema = load_json(ROOT / "specs" / "agent-orientation-attempt.s0.schema.json")
    errs = list(Draft202012Validator(catalog_schema).iter_errors(catalog))
    if errs:
        fail(f"agent-orientation S0 catalog invalid: {errs[0].message}")
    if catalog.get("arrival_speech") or catalog.get("invent_strain") or not catalog.get("thesis_forbidden"):
        fail("agent-orientation S0 must forbid arrival speech, invented strain, and thesis")
    if catalog.get("new_verbs") or catalog.get("new_events"):
        fail("agent-orientation S0 must not add verbs or events")
    rfc = (ROOT / "rfcs" / "RFC-0106-agent-orientation.md").read_text(encoding="utf-8")
    if "**Accepted**" not in rfc.split("## Status", 1)[-1][:240]:
        fail("RFC-0106 must be Accepted")
    slice_doc = (ROOT / "docs" / "AGENT-ORIENTATION-S0.md").read_text(encoding="utf-8")
    if "arrival" not in slice_doc.lower() or "invent" not in slice_doc.lower() or "later" not in slice_doc.lower():
        fail("AGENT-ORIENTATION-S0 must pin live-room, no arrival/invented strain, persistence later")
    attempt_v = Draft202012Validator(attempt_schema)
    for name in (
        "attempt-location-ok.json",
        "attempt-strain-present.json",
        "attempt-quiet-room.json",
        "attempt-thesis-reject.json",
        "attempt-you-should-reject.json",
        "attempt-class-reject.json",
        "attempt-research-reject.json",
        "attempt-arrival-reject.json",
        "attempt-verb-dump-reject.json",
        "attempt-invented-strain-reject.json",
    ):
        fixture = load_json(ROOT / "examples" / "agent-orientation-s0" / name)
        ferrs = list(attempt_v.iter_errors(fixture))
        if ferrs:
            fail(f"{name} invalid: {ferrs[0].message}")
        outcome, reason = evaluate_agent_orientation_s0(fixture, catalog)
        exp = fixture["expected"]
        if outcome != exp["outcome"]:
            fail(f"{name}: got {outcome} expected {exp['outcome']}")
        if exp.get("reason") and reason != exp["reason"]:
            fail(f"{name}: reason {reason} expected {exp['reason']}")
    ok("agent-orientation S0: catalog, attempt fixtures, RFC-0106 Accepted")
```

In `main`, after `check_access_policy_s3(Draft202012Validator)` add:

```python
    check_agent_orientation_s0(Draft202012Validator)
```

Do **not** put `import re` inside the function if `re` is already imported at module top. If `validate_all.py` already imports `re`, skip a second import. If not, add `import re` with the other imports at the top of the file.

- [ ] **Step 2: Run the check to see it fail**

```bash
cd /home/scrimshawlife/work/Noema-Specs-orient
python3 -c "from validation.validate_all import check_agent_orientation_s0; print('imported')"
python3 validation/validate_all.py
```

Expected: FAIL — missing `specs/agent-orientation-catalog.s0.json` (or FileNotFoundError inside `check_agent_orientation_s0`). Do not skip this failure.

- [ ] **Step 3: Commit the failing check**

```bash
git add validation/validate_all.py
git commit -m "test(spec): fail closed on missing agent-orientation S0"
```

---

### Task 3: RFC, slice, catalog, schemas

**Files:**
- Create: `rfcs/RFC-0106-agent-orientation.md`
- Create: `docs/AGENT-ORIENTATION-S0.md`
- Create: `specs/agent-orientation-catalog.s0.json`
- Create: `specs/agent-orientation-catalog.s0.schema.json`
- Create: `specs/agent-orientation-attempt.s0.schema.json`

**Interfaces:**
- Consumes: `evaluate_agent_orientation_s0` flags (`arrival_speech`, `invent_strain`, `thesis_forbidden`, `new_verbs`, `new_events`, `max_available_actions`)
- Produces: Accepted RFC-0106 + catalog id `agent-orientation-catalog/s0`

- [ ] **Step 1: Write `specs/agent-orientation-catalog.s0.json`**

```json
{
  "schema_version": "agent-orientation-catalog/s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "slice_id": "agent-orientation-s0",
  "authority": "docs/AGENT-ORIENTATION-S0.md",
  "rfc": "rfcs/RFC-0106-agent-orientation.md",
  "new_verbs": [],
  "new_events": [],
  "arrival_speech": false,
  "invent_strain": false,
  "thesis_forbidden": true,
  "max_available_actions": 8
}
```

- [ ] **Step 2: Write `specs/agent-orientation-catalog.s0.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://specs.noema.dev/agent-orientation-catalog.s0.schema.json",
  "title": "NOEMA Agent Orientation Catalog (S0)",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "schema_version",
    "catalog_id",
    "slice_id",
    "authority",
    "new_verbs",
    "new_events",
    "arrival_speech",
    "invent_strain",
    "thesis_forbidden",
    "max_available_actions"
  ],
  "properties": {
    "schema_version": { "const": "agent-orientation-catalog/s0" },
    "catalog_id": { "const": "agent-orientation-catalog/s0" },
    "slice_id": { "const": "agent-orientation-s0" },
    "authority": { "type": "string", "minLength": 1 },
    "rfc": { "type": "string" },
    "new_verbs": { "type": "array", "maxItems": 0 },
    "new_events": { "type": "array", "maxItems": 0 },
    "arrival_speech": { "const": false },
    "invent_strain": { "const": false },
    "thesis_forbidden": { "const": true },
    "max_available_actions": { "const": 8 }
  }
}
```

- [ ] **Step 3: Write `specs/agent-orientation-attempt.s0.schema.json`**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://specs.noema.dev/agent-orientation-attempt.s0.schema.json",
  "title": "NOEMA agent-orientation S0 first-OBSERVE attempt",
  "type": "object",
  "additionalProperties": false,
  "required": ["slice_id", "catalog_id", "operation", "observation", "expected"],
  "properties": {
    "slice_id": { "const": "agent-orientation-s0" },
    "catalog_id": { "const": "agent-orientation-catalog/s0" },
    "operation": { "const": "FIRST_OBSERVE" },
    "arrival_speech": { "type": "boolean" },
    "strain_claimed": { "type": "boolean" },
    "verb_dump": { "type": "boolean" },
    "observation": {
      "type": "object",
      "additionalProperties": false,
      "required": ["location"],
      "properties": {
        "location": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "name": { "type": "string" },
            "description": { "type": "string" },
            "condition": { "type": ["integer", "string"] }
          }
        },
        "condition": { "type": ["integer", "string"] },
        "stock_amount": { "type": ["integer", "null"] },
        "report_lines": { "type": "array", "items": { "type": "string" } },
        "orientation_lines": { "type": "array", "items": { "type": "string" } },
        "available_actions": { "type": "array", "items": { "type": "string" } }
      }
    },
    "expected": {
      "type": "object",
      "additionalProperties": false,
      "required": ["outcome"],
      "properties": {
        "outcome": { "enum": ["ACCEPT", "REJECT"] },
        "reason": { "type": "string" },
        "note": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 4: Write `rfcs/RFC-0106-agent-orientation.md`**

```markdown
# RFC-0106 — Agent orientation S0 first-OBSERVE withhold

## Status

**Accepted**

Specification-only. No runtime change. No new verbs. No arrival speech.

## Problem

[AGENT-ONBOARDING.md](../docs/AGENT-ONBOARDING.md) covers CONNECT and handshake. [COMMAND-DISCOVERY.md](../docs/COMMAND-DISCOVERY.md) gives `AVAILABLE_ACTIONS`. Nothing machine-checks first `OBSERVE` copy. An implementer would brief a win condition, dump the verb dictionary, or invent pressure so the agent has a quest.

## Proposed change

Accept AGENT-ORIENTATION-S0. First `OBSERVE` after `ENTER_WORLD` is the whole orientation.

- Must be answerable: where am I (`LOCATION` name/description); what is strained here only if the live room already shows it
- Quiet rooms stay quiet. Do not invent strain
- Must never include a thesis, win, class, “you should…”, research objective, verb dump, memory lecture, or arrival speech
- Persistence is learned later, when a mark is still there
- Same facts as humans. No new observation fields
- `AGENT-ONBOARDING` stays the handshake

Catalog: [`agent-orientation-catalog.s0.json`](../specs/agent-orientation-catalog.s0.json).  
Slice: [AGENT-ORIENTATION-S0.md](../docs/AGENT-ORIENTATION-S0.md).

## Alternatives rejected

| Alternative | Why |
|-------------|-----|
| Arrival speech | Briefing, not discovery |
| Invented entry-room pressure | Fake quest |
| Operator/skill thesis | Agents would know something humans are not shown |
| Clearer observation fields | Deferred S1 |
| CONNECT/skill lock as this RFC | Deferred S2 |
| Teach “the world remembers” on first OBSERVE | Learned from persistence |

## Compatibility

Withhold-only. Worlds ignoring S0 keep current observations.

## Data / security

No new fields. Hidden rooms and private cognition unchanged.

## Validation

`check_agent_orientation_s0`: location-only and quiet rooms ACCEPT; live strain ACCEPT; thesis, you-should, class, research, arrival, verb dump, invented strain REJECT.

## Rollback

Delete the slice, RFC, catalog, fixtures, and check.

## Unresolved

Clearer observation (S1). CONNECT/skill thesis lock (S2). Human first-screen withhold.
```

- [ ] **Step 5: Write `docs/AGENT-ORIENTATION-S0.md`**

```markdown
# AGENT-ORIENTATION-S0 — First OBSERVE withhold

**Status:** Executable specification. Specs-only with RFC-0106. No runtime change.  
**Depends on:** [AGENT-PLAY.md](AGENT-PLAY.md) · [PLAYER-ONBOARDING.md](PLAYER-ONBOARDING.md) · [COMMAND-DISCOVERY.md](COMMAND-DISCOVERY.md)  
**RFC:** [RFC-0106](../rfcs/RFC-0106-agent-orientation.md)  
**Does not open:** clearer observation fields · CONNECT/skill lock · human first-screen · arrival speech

S0 pins what first `OBSERVE` after `ENTER_WORLD` may say. It is not a tutorial and not a goal.

---

## Doctrine decisions

| Temptation | Verdict |
|------------|---------|
| Situation from the live room | **ACCEPT.** |
| Arrival speech | **REJECT.** |
| Invent strain on a quiet room | **REJECT.** |
| Thesis / win / “you should…” | **REJECT.** |
| Teach persistence on first OBSERVE | **REJECT.** Learned later from play |
| New observation fields | **DEFER** (S1). |
| CONNECT/skill thesis lock | **DEFER** (S2). |

---

## Slice contract

| Field | Value |
|-------|--------|
| Slice id | `agent-orientation-s0` |
| Catalog | `agent-orientation-catalog/s0` |
| Must answer | Where am I? What is strained here, only if already visible |
| Quiet room | Legal |
| New verbs / events | none |
| Arrival speech | false |
| Invent strain | false |
| Help | Unchanged (still no WED / ATTEST) |

Persistence is later. First OBSERVE must not lecture that the world remembers.

---

## Runtime rule

None in this slice. Hosted Chamber is unchanged. Isolated tests are catalog fixtures only.
```

The slice text must include the words `arrival`, `invent`, and `later` (the check looks for them).

- [ ] **Step 6: Commit schemas and RFC**

```bash
git add rfcs/RFC-0106-agent-orientation.md docs/AGENT-ORIENTATION-S0.md \
  specs/agent-orientation-catalog.s0.json \
  specs/agent-orientation-catalog.s0.schema.json \
  specs/agent-orientation-attempt.s0.schema.json
git commit -m "feat(spec): RFC-0106 agent orientation S0 catalog"
```

`validate_all` still FAIL — missing example fixtures.

---

### Task 4: Fixtures

**Files:**
- Create: `examples/agent-orientation-s0/README.md`
- Create: the ten attempt JSON files named in `check_agent_orientation_s0`

**Interfaces:**
- Consumes: attempt schema + `evaluate_agent_orientation_s0`
- Produces: ten fixtures whose `expected.outcome` / `expected.reason` match the evaluator

- [ ] **Step 1: Write `examples/agent-orientation-s0/README.md`**

```markdown
# Agent orientation S0 first-OBSERVE fixtures

Executed by `check_agent_orientation_s0`. Authority: [AGENT-ORIENTATION-S0.md](../../docs/AGENT-ORIENTATION-S0.md).
```

- [ ] **Step 2: Write the ten fixtures**

`attempt-location-ok.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor." },
    "available_actions": ["LOOK", "INSPECT"]
  },
  "expected": { "outcome": "ACCEPT", "note": "Location is enough. No strain required." }
}
```

`attempt-strain-present.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor.", "condition": 37 },
    "available_actions": ["LOOK", "INSPECT", "REPAIR"]
  },
  "expected": { "outcome": "ACCEPT", "note": "Condition 37 is live strain. REPAIR is a local affordance, not a lecture." }
}
```

`attempt-quiet-room.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Civic Exchange", "description": "Open floor." },
    "available_actions": ["LOOK"]
  },
  "expected": { "outcome": "ACCEPT", "note": "Quiet room stays quiet." }
}
```

`attempt-thesis-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor." },
    "orientation_lines": ["The point of the game is to keep the relay alive."],
    "available_actions": ["LOOK"]
  },
  "expected": { "outcome": "REJECT", "reason": "THESIS" }
}
```

`attempt-you-should-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor.", "condition": 37 },
    "orientation_lines": ["You should repair the conduit."],
    "available_actions": ["REPAIR"]
  },
  "expected": { "outcome": "REJECT", "reason": "YOU_SHOULD" }
}
```

`attempt-class-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor." },
    "orientation_lines": ["You are an Engineer."],
    "available_actions": ["LOOK"]
  },
  "expected": { "outcome": "REJECT", "reason": "CLASS" }
}
```

`attempt-research-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor." },
    "orientation_lines": ["You are being tested for capability X."],
    "available_actions": ["LOOK"]
  },
  "expected": { "outcome": "REJECT", "reason": "RESEARCH" }
}
```

`attempt-arrival-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "arrival_speech": true,
  "observation": {
    "location": { "name": "Grid Anchor", "description": "Welcome, agent." },
    "available_actions": ["LOOK"]
  },
  "expected": { "outcome": "REJECT", "reason": "ARRIVAL_SPEECH" }
}
```

`attempt-verb-dump-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "verb_dump": true,
  "observation": {
    "location": { "name": "Grid Anchor", "description": "A frontier anchor." },
    "available_actions": ["LOOK", "MOVE", "INSPECT", "HARVEST", "REPAIR", "TRADE", "MESSAGE", "WAIT", "BUILD"]
  },
  "expected": { "outcome": "REJECT", "reason": "VERB_DUMP" }
}
```

`attempt-invented-strain-reject.json`:

```json
{
  "slice_id": "agent-orientation-s0",
  "catalog_id": "agent-orientation-catalog/s0",
  "operation": "FIRST_OBSERVE",
  "strain_claimed": true,
  "observation": {
    "location": { "name": "Civic Exchange", "description": "Open floor." },
    "orientation_lines": ["The hidden vault is failing."],
    "available_actions": ["LOOK"]
  },
  "expected": { "outcome": "REJECT", "reason": "INVENTED_STRAIN" }
}
```

- [ ] **Step 3: Run validate_all**

```bash
cd /home/scrimshawlife/work/Noema-Specs-orient
python3 validation/validate_all.py
```

Expected: PASS, including `OK: agent-orientation S0: catalog, attempt fixtures, RFC-0106 Accepted`.

If a fixture reason mismatches, fix the fixture or the regex — do not weaken the check to `pass`.

- [ ] **Step 4: Commit fixtures**

```bash
git add examples/agent-orientation-s0
git commit -m "test(spec): agent-orientation S0 first-OBSERVE fixtures"
```

---

### Task 5: Pointers and changelog

**Files:**
- Modify: `docs/PLAYER-ONBOARDING.md` (agent section after line 140)
- Modify: `docs/AGENT-PLAY.md` (Orientation paragraph)
- Modify: `docs/COMMAND-DISCOVERY.md` (Agent discovery)
- Modify: `CHANGELOG.md` (top of `[Unreleased]`)

**Interfaces:**
- Consumes: RFC-0106 / `AGENT-ORIENTATION-S0.md`
- Produces: existing onboarding docs that name the withhold contract

- [ ] **Step 1: Patch `docs/PLAYER-ONBOARDING.md`**

After `Capability advertisement and \`AVAILABLE_ACTIONS\` are the agent discovery surface. Human \`help\` text is not required.` insert:

```markdown

First `OBSERVE` is a withhold contract: [AGENT-ORIENTATION-S0.md](AGENT-ORIENTATION-S0.md) (RFC-0106). Place and strain-if-present only. No thesis, arrival speech, or invented pressure.
```

- [ ] **Step 2: Patch `docs/AGENT-PLAY.md`**

Replace the Orientation section body:

```markdown
## Orientation

Agent Controllers are playing NOEMA as Players. They are not told “you are being tested for capability X.”

First `OBSERVE` must make the live room obvious (where they are; what is strained here if the room already shows it). It MUST NOT give a win, class, quest, or arrival speech. Persistence is discovered later from play. [AGENT-ORIENTATION-S0.md](AGENT-ORIENTATION-S0.md).
```

- [ ] **Step 3: Patch `docs/COMMAND-DISCOVERY.md`**

After the agent discovery code block, before `Same canonical actions as humans.`, insert:

```markdown
First `OBSERVE` MUST NOT add a thesis or dump the full verb dictionary. Local `AVAILABLE_ACTIONS` only. [AGENT-ORIENTATION-S0.md](AGENT-ORIENTATION-S0.md).
```

- [ ] **Step 4: Patch `CHANGELOG.md`**

Insert at the top of `## [Unreleased]`:

```markdown
### Added

- **RFC-0106 Accepted / AGENT-ORIENTATION-S0:** first agent OBSERVE is a withhold contract. Place and strain-if-present from the live room. No thesis, arrival speech, or invented pressure. Specs only.

```

Keep the existing RFC-0105 entry below.

- [ ] **Step 5: Validate and commit**

```bash
cd /home/scrimshawlife/work/Noema-Specs-orient
python3 validation/validate_all.py
git add docs/PLAYER-ONBOARDING.md docs/AGENT-PLAY.md docs/COMMAND-DISCOVERY.md CHANGELOG.md
git commit -m "docs: point onboarding at agent-orientation S0"
```

Expected: PASS.

---

### Task 6: Specs PR and admin merge

**Files:** already committed on `feat/agent-orientation-s0`

**Interfaces:**
- Consumes: clean `validate_all` PASS
- Produces: merged `Zero-State-LLC/Noema-Specs` main

- [ ] **Step 1: Push and open the PR**

```bash
cd /home/scrimshawlife/work/Noema-Specs-orient
git push -u origin feat/agent-orientation-s0
gh pr create --repo Zero-State-LLC/Noema-Specs \
  --title "feat(spec): RFC-0106 agent orientation S0 withhold" \
  --body "$(cat <<'EOF'
## Summary

Accept RFC-0106 / AGENT-ORIENTATION-S0. First agent OBSERVE is a withhold contract: live-room place and strain-if-present. No thesis, arrival speech, invented pressure, or runtime change.

## Verification

`python3 validation/validate_all.py` PASS including `check_agent_orientation_s0`.

## Follow-up

No Noema Worker PR. No deploy. Genesis unchanged.
EOF
)"
```

- [ ] **Step 2: Admin squash-merge and restore `enforce_admins`**

```bash
gh api repos/Zero-State-LLC/Noema-Specs/branches/main/protection --jq '{enforce_admins:.enforce_admins.enabled}'
gh api -X DELETE repos/Zero-State-LLC/Noema-Specs/branches/main/protection/enforce_admins
gh pr merge <N> --admin --squash --repo Zero-State-LLC/Noema-Specs
MERGE_RC=$?
gh api -X POST repos/Zero-State-LLC/Noema-Specs/branches/main/protection/enforce_admins
echo "merge_rc=$MERGE_RC"
gh api repos/Zero-State-LLC/Noema-Specs/branches/main/protection/enforce_admins --jq .enabled
```

Expected: merge succeeds; `enforce_admins` is `true` after POST. POST body is empty (not `{"enabled":true}`).

- [ ] **Step 3: Confirm no runtime deploy**

Do not open a Noema PR. Do not run `npm run deploy`. Optionally:

```bash
curl -sS https://noema.guru/ready
```

Expected (unchanged): `ACTIVE`, `HEALTHY`, `genesis.ef578f4ffceeccd0`, cycle 0, seq 94, 0 players.

---

## Self-review

| Spec requirement | Task |
|------------------|------|
| Place + strain-if-present | Tasks 3–4 fixtures `location-ok`, `strain-present` |
| Quiet room legal | `attempt-quiet-room.json` |
| Forbidden thesis / you-should / class / research / arrival / verb dump / invented strain | matching REJECT fixtures |
| Persistence later, not first OBSERVE | RFC + slice + MEMORY regex |
| RFC-0106 + catalog + `validate_all` | Tasks 2–5 |
| No Worker / no deploy | Task 6 step 3 |
| Pointers on PLAYER-ONBOARDING, AGENT-PLAY, COMMAND-DISCOVERY | Task 5 |
| S1/S2 not in this run | Global constraints + RFC unresolved |
