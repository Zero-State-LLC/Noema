# Feature D Room Traces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close Feature D / Native Interaction S3 so a second Agent Player can LOOK in a room after the originating Agent Player has left and see sourced environmental residue — without a `TRACE` verb, without human PLAY, and without reopening Genesis, seal, or the verb freeze.

**Architecture:** Keep the existing read-only projector `projectRoomTraces` in `workers/noema/src/play-traces.ts`. Do not invent history. Extend it with (1) internal `source_state_ref` for AC 16, stripped from the public `ObservationTrace` wire; (2) a repair-plate family derived from durable entity fields stamped on existing `ENTITY_UPDATE` during `COMMIT/REPAIR`. Public observation shape stays `{ kind, text, visibility }`. Tests use two Agent Players. Hosted HTTP/WS still strip `arguments.line`.

**Tech Stack:** Cloudflare Worker world reducer (`applyWorldCommand`), Vitest, existing `Observation` / `PlayerPrincipal` types, Noema-Specs Feature D text already on `origin/main`.

## Global Constraints

- Specs pin: `Zero-State-LLC/Noema-Specs` `origin/main` `ae2e56a` (RFC-0120 Accepted).
- Runtime pin at plan time: `Zero-State-LLC/Noema` `origin/main` `8000908` / Worker `1345b8f6`. Work from a fresh branch off `origin/main`, not the detached local HEAD.
- Only agents are Players. Humans watch / connect / study / admin. No human PLAY UX. No minting human Player credentials.
- No `TRACE` verb. No `HISTORY` verb. No `AGENT_PLAYER` class. No Genesis rewrite. No Perihelion reseed. No new canonical Player verbs.
- No canonical event created solely for presentation.
- Public `ObservationTrace` remains `{ kind: "scar" | "construction" | "notice"; text: string; visibility: "public" }`. Do not add IDs, player_id, or entity_id to the public wire.
- Hosted inhabit is structured commands only (`arguments.line` stripped).
- Parser / Chamber / HELP / aliases stay NON-CANONICAL DEV TOOLING.
- WATCH stays a public spectator projection. This plan does not expand WATCH into a trace dump (S6 is a later packet).
- Frozen: Genesis `genesis.ef578f4ffceeccd0`, seal `sha256:9b9c211c156a9b49…`, verbs, 10-room bound, chrome Home/Manifesto/Watch/Connect.
- UNFREEZE is required only if freeze tests fail or the public observation contract changes. This plan is designed not to need it.
- Copy of this plan may be saved at execution time to `Noema/docs/superpowers/plans/2026-08-20-feature-d-room-traces.md`.

---

## Current state (do not rewrite)

S3 already exists and is PARTIAL:

| Piece | File | Status |
|---|---|---|
| Public trace type | `workers/noema/src/types.ts` `ObservationTrace` | MATCH |
| Projector | `workers/noema/src/play-traces.ts` `projectRoomTraces` | scars, `in_progress`, board/shout/notices; **no provenance refs; no repair plate** |
| LOOK wiring | `workers/noema/src/world-actions.ts` `buildObservation` | MATCH |
| Feature B TRACES section | `workers/noema/src/play-ui.ts` `roomPresentationModel` | DEV TOOLING; keep working |
| Unit tests | `workers/noema/test/play-traces.test.ts` | scar + hidden + cap-3 + LOOK on seeded scar |
| P12 no TRACE verb | `workers/noema/test/rfc0120-traces.test.ts` | MATCH — do not reopen |
| REPAIR reducer | `workers/noema/src/world-actions.ts` ~L2791 | sets `last_steward_cycle` for owners only; no public plate |
| LEAVE_WORLD | `world-actions.ts` L1438 | `entered = false`; player record (handle) remains |

**AC 15 gap:** current LOOK test seeds a scar. It does not prove “after the originating Player departs.” REPAIR currently leaves a condition delta on the entity, not a Feature D plate. C8 rank 1 wants the plate.

**AC 16 gap:** public traces have no internal `source_state_ref`. Spec allows public output to omit IDs if tests can still verify refs.

**AC 17:** already MATCH for scars (projector is current-state; gone entity → gone trace). Extend the same rule to plates.

**Spec example to hit:**

```text
The gantry bears a fresh weld over an older fracture.
A maintenance plate names Sable as the last repairer.
```

Scar family already covers the weld/fracture when `entity.scar === true`. Repair plate is the missing family.

---

## File map

| File | Responsibility |
|---|---|
| `Noema-Specs/docs/MUD-NATIVE-INTERACTION-TASKS.md` | Mark S3 runtime mapping; no new RFC |
| `Noema-Specs/docs/MUD-PLAY-CRAFT-CLOSEOUT.md` | One paragraph: Feature D first family closes via projector, not a TRACE verb |
| `Noema/workers/noema/src/play-traces.ts` | Projector + internal provenance + repair-plate text |
| `Noema/workers/noema/src/actions.ts` | `EntityRuntime` + `enrichEntity` pass-through for `last_repair_cycle` / `last_repair_handle` |
| `Noema/workers/noema/src/world-actions.ts` | Stamp plate fields on successful REPAIR; pass them into `projectRoomTraces` |
| `Noema/workers/noema/src/types.ts` | Do **not** change public `ObservationTrace`. Optional comment only. |
| `Noema/workers/noema/test/play-traces.test.ts` | All new tests (provenance, plate, after-depart, redaction, S-MARK-10) |
| `Noema/docs/FEATURE-D-ACCEPTANCE.md` | Runtime closeout table (same shape as RFC-0120-ACCEPTANCE) |

No new Worker routes. No schema migration. No Postgres rewrite.

---

## Interfaces (locked for later tasks)

```ts
// play-traces.ts — internal, never copied onto Observation.location.traces
export type TraceSourceRef =
  | { kind: "entity"; entity_id: string; field: "scar" | "in_progress" | "last_repair" }
  | { kind: "room"; room_id?: string; field: "board" | "shout" | "institution_notice" | "trade_notice" };

export type ProjectedTrace = {
  kind: "scar" | "construction" | "notice";
  text: string;
  visibility: "public";
  source_state_ref: TraceSourceRef; // stripped before Observation
};

export type TraceEntity = {
  entity_id?: string;
  label?: string;
  scar?: boolean;
  hidden?: boolean;
  in_progress?: boolean;
  last_repair_cycle?: number;
  last_repair_handle?: string;
};

export function projectRoomTraces(room: TraceRoom | null | undefined): ProjectedTrace[];
export function publicTraces(traces: ProjectedTrace[]): ObservationTrace[];
```

Public wire (`types.ts` — unchanged):

```ts
export interface ObservationTrace {
  kind: "scar" | "construction" | "notice";
  text: string;
  visibility: "public";
}
```

Repair stamp (entity durable state, not a new event type):

```ts
entity.last_repair_cycle = w.cycle;
entity.last_repair_handle = publicHandle(pl.handle, principal.player_id);
// ENTITY_UPDATE payload (existing event) also carries:
//   last_repair_cycle, last_repair_handle
```

Plate copy (deterministic, no LLM):

```ts
`A maintenance plate names ${handle} as the last repairer.`
```

Handle sanitization: trim, collapse whitespace, max 32 chars, drop if empty or if it matches `/player\.|entity\.|ctrl\./i`. Fallback handle: do **not** invent a display name from `player_id`. If no safe handle, skip the plate (condition delta remains on the entity / HAPPENED).

Priority (cap 3, unchanged): scar → construction plate (`last_repair_*`) → `in_progress` → notices.

---

### Task 1: Specs mapping (no RFC)

**Files:**
- Modify: `Noema-Specs/docs/MUD-NATIVE-INTERACTION-TASKS.md` (S3 section)
- Modify: `Noema-Specs/docs/MUD-PLAY-CRAFT-CLOSEOUT.md` (runtime out-of-scope / A6 note)

**Interfaces:**
- Consumes: Feature D text already on `origin/main` (`MUD-NATIVE-INTERACTION-AND-WORLD-PRESENCE.md` Feature D; AC 15–17)
- Produces: S3 marked as runtime-mapped; last_repair fields named as durable state on existing `ENTITY_UPDATE`

- [ ] **Step 1: Under S3 in TASKS.md, add a Runtime mapping subsection** (do not delete T3.1–T3.6)

```markdown
### Runtime mapping (Feature D first family)

Production inhabit is Agent Player only (RFC-0120). S3 is a **read-only projector**
(`projectRoomTraces`) over existing residue. No `TRACE` verb.

| Family | Canonical source | Public kind | After originator `LEAVE_WORLD` |
|--------|------------------|-------------|-------------------------------|
| Scar | `entity.scar` (GC10 dismantle leftover) | `scar` | yes |
| Repair plate | `ENTITY_UPDATE` operation=REPAIR stamps `last_repair_cycle` + `last_repair_handle` | `construction` | yes |
| Unfinished work | `entity.in_progress` | `construction` | yes |
| Public notices | existing room `board` / `shout` / `institution_notice` / `trade_notice` | `notice` | yes, until expiry |

Internal `source_state_ref` is test/debug only. Public `Observation.location.traces`
stays `{ kind, text, visibility }`. Hidden rooms/entities never project. Cap 3.
WATCH is not this slice.
```

- [ ] **Step 2: In MUD-PLAY-CRAFT-CLOSEOUT.md, add under runtime sequencing A6**

```markdown
A6 Feature D first family: repair plate + scar projector provenance.
No TRACE verb. Cite MUD-NATIVE-INTERACTION-TASKS.md S3 runtime mapping.
```

- [ ] **Step 3: Commit on a specs branch off `origin/main`**

```bash
cd /home/scrimshawlife/Noema-Specs
git checkout -B spec/feature-d-s3-mapping origin/main
git add docs/MUD-NATIVE-INTERACTION-TASKS.md docs/MUD-PLAY-CRAFT-CLOSEOUT.md
git commit -m "docs(spec): map Feature D S3 to repair-plate projector (no TRACE verb)"
```

Merge this PR before or with the runtime PR. Runtime may cite the specs SHA in `FEATURE-D-ACCEPTANCE.md`. Do not wait on a new RFC number.

---

### Task 2: Failing tests for provenance, plate, after-depart

**Files:**
- Test: `Noema/workers/noema/test/play-traces.test.ts`
- Reuse: `enrichEntity`, `applyWorldCommand`, `PlayerPrincipal` from existing file

**Interfaces:**
- Consumes: current `projectRoomTraces` (will fail new assertions)
- Produces: red tests that Task 3–5 turn green

- [ ] **Step 1: Add tests to the existing describe block** (keep the four current tests)

Use **agent** principals only (`controller_type: "agent"`). Do not add a human inhabit path.

```ts
function agent(id: string, handle: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function repairWorld(): WorldRuntime {
  // Copy fixtureWorld() from actions-tier1.test.ts: scarred-conduit at 35%,
  // budgets via ENTER_WORLD defaults. Set players[player.sable].handle = "Sable"
  // after ENTER, or pass handle through ensurePlayer by setting it on the
  // world after first command if ensurePlayer copies principal only.
}

it("public traces omit source refs and entity ids (AC 16 public wire)", () => {
  const traces = projectRoomTraces({
    entities: [{ entity_id: "entity.scar.1", label: "scarred-conduit", scar: true }],
  });
  const pub = publicTraces(traces);
  expect(pub[0]).toEqual({
    kind: "scar",
    text: "A scar remains (scarred-conduit).",
    visibility: "public",
  });
  expect(JSON.stringify(pub)).not.toMatch(/entity\.|source_state_ref|player\./);
  expect(traces[0].source_state_ref).toEqual({
    kind: "entity",
    entity_id: "entity.scar.1",
    field: "scar",
  });
});

it("projects a repair plate from last_repair_* and drops it when cleared (AC 17)", () => {
  const traces = projectRoomTraces({
    entities: [
      {
        entity_id: "entity.relay-7",
        label: "scarred-conduit",
        last_repair_cycle: 4,
        last_repair_handle: "Sable",
      },
    ],
  });
  expect(traces.some((t) => t.kind === "construction" && t.text === "A maintenance plate names Sable as the last repairer.")).toBe(true);
  expect(traces[0].source_state_ref).toEqual({
    kind: "entity",
    entity_id: "entity.relay-7",
    field: "last_repair",
  });
  expect(projectRoomTraces({ entities: [{ label: "scarred-conduit" }] })).toEqual([]);
});

it("does not plate a handle that looks like an id", () => {
  expect(
    projectRoomTraces({
      entities: [
        {
          entity_id: "entity.relay-7",
          label: "relay",
          last_repair_cycle: 1,
          last_repair_handle: "player.sable",
        },
      ],
    }).filter((t) => t.kind === "construction" && t.text.includes("maintenance plate")),
  ).toEqual([]);
});

it("AC 15: second agent sees the plate after the originator leaves", async () => {
  const w = repairWorld();
  const sable = agent("sable", "Sable");
  const rhea = agent("rhea", "Rhea");
  expect((await run(w, sable, "ENTER_WORLD")).ok).toBe(true);
  w.players[sable.player_id].handle = "Sable";
  const repaired = await run(w, sable, "COMMIT", {
    operation: "REPAIR",
    entity_id: "entity.relay-7",
  });
  expect(repaired.ok).toBe(true);
  expect((await run(w, sable, "LEAVE_WORLD")).ok).toBe(true);
  expect(w.players[sable.player_id].entered).toBe(false);

  expect((await run(w, rhea, "ENTER_WORLD")).ok).toBe(true);
  const look = await run(w, rhea, "LOOK");
  expect(look.ok).toBe(true);
  const traces = look.observation?.location?.traces || [];
  expect(traces.some((t) => t.text === "A maintenance plate names Sable as the last repairer.")).toBe(true);
  expect(JSON.stringify(traces)).not.toMatch(/player\.sable|entity\.relay-7|source_state_ref/);
  expect(look.observation?.players_here?.some((p) => p.player_id === sable.player_id && /* entered */ true)).toBeFalsy();
});

it("S-MARK-10: ≤10 acts, REPAIR residue legible to a later agent", async () => {
  // Same world. Count ENTER, COMMIT REPAIR, LEAVE for sable (3).
  // Rhea: ENTER, LOOK (2). Total 5 ≤ 10.
  // Pass if plate or scar or condition-band HAPPENED on sable plus plate on rhea LOOK.
});
```

Give `repairWorld` the same budgets path `actions-tier1` uses (`DEFAULT_BUDGETS` / ENTER). If REPAIR fails on cargo, copy the cargo setup from `actions-tier1.test.ts` around the successful REPAIR case (~L202).

- [ ] **Step 2: Run the new tests and confirm they fail**

```bash
cd /home/scrimshawlife/Noema/workers/noema
ln -sfn /home/scrimshawlife/Noema/workers/noema/node_modules node_modules 2>/dev/null || true
npx vitest run test/play-traces.test.ts
```

Expected: FAIL on `publicTraces` not defined and/or plate text missing and/or after-depart LOOK without plate.

- [ ] **Step 3: Do not implement yet.** Commit the failing tests only if the branch convention in this repo allows red tests; otherwise keep tests + implementation in the next commit on the same branch. Prefer one runtime branch `feat/feature-d-room-traces` off `origin/main`.

---

### Task 3: Projector provenance + plate + public strip

**Files:**
- Modify: `Noema/workers/noema/src/play-traces.ts`
- Modify: `Noema/workers/noema/src/world-actions.ts` `buildObservation` traces assignment (~L588)

**Interfaces:**
- Consumes: `TraceEntity.last_repair_*`
- Produces: `projectRoomTraces(): ProjectedTrace[]`, `publicTraces()`

- [ ] **Step 1: Rewrite `play-traces.ts` to the locked interfaces**

Keep `MAX_TRACES = 3`. Keep `publicText` 160-char cap.

```ts
export function publicTraces(traces: ProjectedTrace[]): ObservationTrace[] {
  return traces.map(({ kind, text, visibility }) => ({ kind, text, visibility }));
}

function safePlateHandle(raw: string | undefined): string | null {
  const h = String(raw || "").replace(/\s+/g, " ").trim().slice(0, 32);
  if (!h) return null;
  if (/(?:player|entity|ctrl)\./i.test(h)) return null;
  return h;
}
```

Plate add:

```ts
const plates = ents
  .filter((e) => e.last_repair_cycle != null && safePlateHandle(e.last_repair_handle))
  .sort((a, b) => String(a.label).localeCompare(String(b.label)));
for (const e of plates) {
  add(
    "construction",
    `A maintenance plate names ${safePlateHandle(e.last_repair_handle)} as the last repairer.`,
    { kind: "entity", entity_id: String(e.entity_id || ""), field: "last_repair" },
  );
}
```

Skip plate `add` when `entity_id` is empty (still no leak; just no AC 16 ref — tests always pass entity_id).

Update existing scar/in_progress/notice `add()` to take `source_state_ref`. Notices without room_id may use `{ kind: "room", field: "board" }`.

- [ ] **Step 2: `buildObservation` must pass public traces only**

```ts
traces: publicTraces(
  projectRoomTraces({
    hidden: room.hidden,
    entities,
    board: room.board,
    shout: room.shout,
    institution_notice: room.institution_notice,
    trade_notice: room.trade_notice,
  }),
),
```

Pass full entities (they already include more fields than the observation entity map). Do not put `last_repair_handle` on `ObservationEntity`.

- [ ] **Step 3: Run `npx vitest run test/play-traces.test.ts`**

Expected: provenance + plate unit tests PASS; after-depart still FAIL until Task 4.

---

### Task 4: Stamp plate fields on REPAIR

**Files:**
- Modify: `Noema/workers/noema/src/actions.ts` `EntityRuntime` (~L87) and `enrichEntity` (~L565)
- Modify: `Noema/workers/noema/src/world-actions.ts` REPAIR success path (~L2888–L2910)

**Interfaces:**
- Consumes: `pl.handle`, `w.cycle`, existing `pushEvent("ENTITY_UPDATE", …)`
- Produces: durable `last_repair_cycle` / `last_repair_handle` on the entity

- [ ] **Step 1: Add fields to `EntityRuntime` and `enrichEntity` pass-through**

```ts
/** Feature D. Public handle of last successful REPAIR. Never an id. */
last_repair_cycle?: number;
last_repair_handle?: string;
```

Mirror on the `enrichEntity` input type and return object next to `last_steward_cycle`. Do not copy onto observation entity mapping in `buildObservation`.

- [ ] **Step 2: After a successful condition write in REPAIR, stamp plate fields for every successful REPAIR** (not only owners — Feature D is residue of the act, distinct from GC2 `last_steward_cycle`)

```ts
const plateHandle = String(pl.handle || "")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 32);
if (plateHandle && !/(?:player|entity|ctrl)\./i.test(plateHandle)) {
  entity.last_repair_cycle = w.cycle;
  entity.last_repair_handle = plateHandle;
}
```

Add the same two keys onto the existing `ENTITY_UPDATE` payload (still operation `"REPAIR"`). Do not emit a second event.

If `ensurePlayer` does not set handle, set `w.players[id].handle` from a well-known test assignment (already in the after-depart test). For production agents, handle is already stored on `PlayerRuntime`.

- [ ] **Step 3: Re-run after-depart + S-MARK-10 tests**

```bash
npx vitest run test/play-traces.test.ts
```

Expected: PASS, including AC 15 two-agent LOOK.

If REPAIR fails in the fixture, copy cargo/budget setup from `test/actions-tier1.test.ts` successful REPAIR (do not weaken REPAIR costs).

- [ ] **Step 4: Regression**

```bash
npx vitest run test/rfc0120-traces.test.ts test/play-traces.test.ts test/play-ui.test.ts test/hosted-alpha-freeze.test.ts
```

Expected: PASS. `rfc0120-traces` still forbids `TRACE`. Freeze still green (public observation shape unchanged).

---

### Task 5: Redaction + cap + no duplication flood

**Files:**
- Modify: `Noema/workers/noema/src/play-traces.ts` only if a test fails
- Test: same `play-traces.test.ts`

**Interfaces:**
- Consumes: Task 3 projector
- Produces: T3.5 / T3.6 MATCH

- [ ] **Step 1: Tests (add if not already in Task 2)**

```ts
it("hidden room and hidden entity still project nothing", () => {
  expect(projectRoomTraces({
    hidden: true,
    entities: [{ label: "scarred-conduit", scar: true, last_repair_handle: "Sable", last_repair_cycle: 1 }],
  })).toEqual([]);
});

it("cap 3 prefers scar then plate then unfinished work", () => {
  const traces = projectRoomTraces({
    entities: [
      { entity_id: "e1", label: "a-scar", scar: true },
      { entity_id: "e2", label: "b-scar", scar: true },
      { entity_id: "e3", label: "c-work", last_repair_cycle: 1, last_repair_handle: "Sable" },
      { entity_id: "e4", label: "d-work", in_progress: true },
    ],
    shout: { text: "a shout", cycle: 2 },
  });
  expect(traces.map((t) => t.kind)).toEqual(["scar", "scar", "construction"]);
  expect(traces[2].text).toMatch(/maintenance plate/);
});
```

Existing “never leaks hidden / entity ids” test must still pass against `publicTraces(projectRoomTraces(...))` if the LOOK test compares observation traces.

- [ ] **Step 2: Run `npx vitest run test/play-traces.test.ts` — PASS**

T3.6: do not also append plate text onto `play_text` HERE. Feature B already has a TRACES section from `loc.traces`. Leave HERE as entities/players. No extra HERE lines.

---

### Task 6: Runtime acceptance + PR

**Files:**
- Create: `Noema/docs/FEATURE-D-ACCEPTANCE.md`
- Modify: only if freeze tests require a comment — do **not** edit `HOSTED-ALPHA-FREEZE.md` unless an UNFREEZE is actually required

**Interfaces:**
- Consumes: Tasks 1–5
- Produces: mergeable runtime PR

- [ ] **Step 1: Write `docs/FEATURE-D-ACCEPTANCE.md`**

```markdown
# Feature D room traces — acceptance

**Verdict.** FEATURE D S3 FIRST FAMILY MATCH
**Specs.** MUD-NATIVE-INTERACTION Feature D · AC 15–17 · TASKS S3 runtime mapping
**Constraints.** No TRACE verb. RFC-0120 agent-only. No Genesis/seal/verb thaw.

| AC | Result | Evidence |
| 15 | MATCH | play-traces after-depart two-agent LOOK |
| 16 | MATCH | internal source_state_ref; publicTraces strips it |
| 17 | MATCH | plate/scar drop when source fields gone |
| P12 | still MATCH | rfc0120-traces.test.ts |
```

- [ ] **Step 2: Full Worker test slice**

```bash
cd /home/scrimshawlife/Noema/workers/noema
npx vitest run test/play-traces.test.ts test/rfc0120-traces.test.ts test/play-ui.test.ts test/hosted-alpha-freeze.test.ts test/actions-tier1.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit and open PR against `origin/main`**

```bash
git checkout -B feat/feature-d-room-traces origin/main
git add workers/noema/src/play-traces.ts workers/noema/src/actions.ts \
  workers/noema/src/world-actions.ts workers/noema/test/play-traces.test.ts \
  docs/FEATURE-D-ACCEPTANCE.md
git commit -m "feat(play): Feature D repair-plate traces after originator leaves"
```

PR body cites specs mapping SHA, AC 15–17, RFC-0120 non-goals, and “no UNFREEZE: public ObservationTrace unchanged; no new verbs.”

Squash-merge with the existing code-owner process. Do not deploy unless freeze tests stay green and you explicitly want the plate on live Perihelion (next REPAIR will stamp; no reseed).

---

## Explicitly out of scope

- Human parser productization (S0)
- HELP / aliases / macros (S2, S4) — client 0.1.7 already has preference-layer aliases
- WATCH NOW/RECENTLY/WORLD (S6)
- Boards/SHOUT as a new social layer
- Deep Time Chamber ingest (P12 already MATCH)
- Postgres historical `player_id` rewrite
- GAME-COMPLETENESS-PLAN stale “human-controlled Players” sentence (separate docs hygiene)
- C2 extra agent observation wire fields
- New rooms, NPCs, combat, XP, quests

---

## Self-review

**Spec coverage**
- Feature D allowed families → first family is repair/construction/scar/notice (T3.1). Later families (insignia, memorials, rumor) deferred.
- Provenance required → Task 3 `source_state_ref`.
- No decorative UI history → projector is current-state only.
- No HISTORY/TRACE verb → P12 tests stay, no new verb.
- AC 15–17 → Tasks 2/4/5.
- RFC-0120 agent-only → two Agent Players; no human inhabit.
- C8 S-MARK-10 → folded into play-traces after-depart (≤10 acts).
- T3.6 bounded / no flood → cap 3, TRACES section only.

**Placeholders:** none.

**Type consistency:** `ProjectedTrace` / `publicTraces` / `last_repair_cycle` / `last_repair_handle` used under those names in every task.

---

## Execution notes

1. Specs PR can merge first (docs only).
2. Runtime is one PR, not a stack, unless code-owner review wants specs landed first.
3. Do not rest on the detached local `Noema` HEAD (`891d51d`). Branch from `origin/main` `8000908`.
4. Vitest in this repo needs `workers/noema/node_modules` visible in the worktree (symlink to the main checkout’s `node_modules` if isolated).
