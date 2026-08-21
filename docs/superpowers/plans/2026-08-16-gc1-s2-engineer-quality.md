# GC1-S2 Engineer Quality Implementation Plan

> **For agentic workers:** Inline execution. Isolated worktrees from `origin/main`. Specs first, then Worker. Admin-squash from `--repo`. Deploy Worker only.

**Goal:** Recognized Engineers restore +20 (15+5) on a repeat `REPAIR` of an asset they already repaired.

**Architecture:** Derived practice cache already stores engineer `entity_id`s. S2 is a delta on the existing `REPAIR` success write. Specs RFC-0040 pins magnitudes. No new verbs or catalog events.

**Tech Stack:** Noema-Specs (RFC, catalog, `check_gc1_s2`) + workers/noema (`practice.ts`, `world-actions.ts`, vitest).

## Global Constraints

- Same-asset procedure; not a level percent.
- +5 bonus (total +20), cap 100.
- Any prior successful REPAIR by this Player counts, including before recognition.
- Personal or `acting_for` OPERATE_NAMED_ASSET; evidence is the acting Player.
- No WATCH titles, no decay, no other tracks, no Perihelion as test world_id.
- No Genesis reseed. ADMIN ≠ Player.

---

### Task 1: Specs RFC-0040 + check_gc1_s2

**Files:** Specs worktree from `origin/main`.

- Create: `rfcs/RFC-0040-engineer-quality.md`
- Create: `docs/GC1-S2-ENGINEER-QUALITY.md`
- Create: `specs/mastery-catalog.gc1-s2.json` + schema + attempt fixtures
- Modify: `validation/validate_all.py` add `check_gc1_s2`
- Modify: RFC README, CHANGELOG, MASTERY still-open (S2 magnitudes closed), GC1-S1 pointer

- [ ] Catalog: `benefits_enabled: true`, `repair_base: 15`, `repeat_bonus: 5`, `cap: 100`, engineer-only.
- [ ] Fixtures: first-on-asset 15; repeat 20; unrecognized 15.
- [ ] `python3 validation/validate_all.py` PASS including `check_gc1_s2`.

### Task 2: Hosted tests then REPAIR delta

**Files:** Noema worktree from `origin/main`.

- Modify: `workers/noema/src/practice.ts` — `repairConditionDelta(state, entityId)`
- Modify: `workers/noema/src/world-actions.ts` — use delta; `quality_bonus` on event; PLAY line
- Test: `workers/noema/test/gc1-s2.test.ts`

```ts
export function repairConditionDelta(state: PracticeState | undefined, entityId: string): {
  delta: 15 | 20;
  bonus: 0 | 5;
} {
  const snap = ensurePractice(state);
  const rec = snap.recognition?.["track.engineer.01"] || [];
  const recognized = rec.length >= 3;
  const prior = rec.includes(entityId);
  if (recognized && prior) return { delta: 20, bonus: 5 };
  return { delta: 15, bonus: 0 };
}
```

- [ ] Isolated tests: 3 assets then repeat → +20; new asset → +15; acting_for uses holder history.
- [ ] `npx vitest run test/gc1-s2.test.ts test/practice.test.ts` PASS.

### Task 3: Ship

- [ ] Specs PR + admin-squash.
- [ ] Noema PR + admin-squash + `NOEMA_ENV=production npm run deploy`.
- [ ] `GET https://noema.guru/ready` ACTIVE/HEALTHY, genesis unchanged.
