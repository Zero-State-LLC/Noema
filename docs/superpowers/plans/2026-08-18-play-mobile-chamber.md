# PLAY Mobile Chamber Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On a phone, PLAY Chamber shows only room + command; HERE/exits/acts/status live in one closed Here sheet.

**Architecture:** Reuse `#play-chamber .ch-rail` as a fixed bottom sheet at `max-width:900px`. Desktop ≥901px stays a two-column side rail. One Here button under the command form opens the sheet; backdrop, ×, and Escape close it and return focus to `#cmd`.

**Tech Stack:** Worker HTML/CSS/JS in `play.ts` extra CSS + chamber markup + existing client bundle. Vitest in `workers/noema/test/play-chamber.test.ts`.

## Global Constraints

- No Genesis reseed/activate. No Recover Perihelion.
- Admin ≠ Player. Text-first PLAY. No new verbs. No `AGENT_PLAYER`.
- Same `/v1/command`. Same rail ids. No new routes.
- Keep 44px targets, 16px command, sticky composer, `overflow-x:clip`, reduced-motion.

**Files:**
- Modify: `workers/noema/src/play.ts`
- Modify: `workers/noema/test/play-chamber.test.ts`

Spec: `docs/superpowers/specs/2026-08-18-play-mobile-chamber-design.md`

---

### Task 1: Phone contract tests

**Files:**
- Modify: `workers/noema/test/play-chamber.test.ts`

- [ ] Add tests for Here control, closed sheet, phone hint, desktop rail, Escape focus, trail clip.

```ts
it("phone Chamber is room + command; Here sheet closed", () => {
  expect(chamber).toContain('id="here-open"');
  expect(chamber).toContain('id="here-close"');
  expect(chamber).toContain('id="here-sheet"');
  expect(chamber).toContain('aria-expanded="false"');
  expect(chamber).toMatch(/aria-controls="here-sheet"/);
  expect(html).toMatch(/@media\(max-width:900px\)[\s\S]*#here-open\{[^}]*display:block/);
  expect(html).toMatch(/@media\(min-width:901px\)[\s\S]*#here-open\{[^}]*display:none/);
  expect(html).toMatch(/\.hint-more/);
  expect(html).toMatch(/@media\(max-width:900px\)[\s\S]*\.hint-more\{[^}]*display:none/);
  expect(html).toContain("trade nacre");
  expect(html).toMatch(/#trail li:nth-child\(n\+6\)/);
  expect(html).toContain('Escape');
  expect(html).toMatch(/\$\("cmd"\)\.focus/);
});
```

- [ ] Run `cd workers/noema && npx vitest run test/play-chamber.test.ts` — new test fails.
- [ ] Implement Task 2 until it passes.

### Task 2: Markup, CSS, sheet JS

**Files:**
- Modify: `workers/noema/src/play.ts`

- [ ] Wrap extra hint verbs in `<span class="hint-more">`.
- [ ] Add `#here-open` under the form, `#here-close` in a `.here-head` on `.ch-rail`, set rail `id="here-sheet"`.
- [ ] CSS: phone hides mast extras + strip + `#look-exits`; rail is fixed sheet closed unless `.is-open`; desktop hides Here chrome.
- [ ] JS `setHereOpen` + Escape.
- [ ] Re-run play-chamber + brand-baseline tests.

---
