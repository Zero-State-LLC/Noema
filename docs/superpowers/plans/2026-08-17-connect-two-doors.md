# CONNECT two doors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/connect` first paint is two equal doors (Approve a code / Use a token) with no lecture or curl.

**Architecture:** Same `connectHtml()` route. Hide unused door after pick. `?code=` opens Approve and lookups. Device APIs unchanged.

**Tech Stack:** Worker HTML/JS in `workers/noema/src/connect.ts`. Vitest. Python enroll announce only.

## Global Constraints

- No Genesis reseed/activate.
- Admin ≠ Player. Page never mints `typ: admin-access`.
- Production `/v1/auth/dev-token` stays 403.
- Opening `/connect` does not approve.
- PLAY session required to approve.
- No new Player verbs. No `AGENT_PLAYER`.
- No `.innerHTML` assignment.
- Isolated `operator.env` ACK is out of scope.

---

### Task 1: First-paint tests then two-door HTML

**Files:**
- Modify: `workers/noema/test/product-surface.test.ts`
- Modify: `workers/noema/src/connect.ts`
- Modify: `src/noema/harness/auth.py` (announce `?code=`)
- Modify: `docs/AGENT-STAGE0.md` (curl stays here)

- [x] Update product-surface connect tests to first-paint two doors
- [x] Rewrite `connectHtml()` first paint + doors
- [x] `cd workers/noema && npx vitest run test/product-surface.test.ts test/agent-orientation-s2.test.ts test/brand-visual-qa.test.ts test/device-enrollment.test.ts`
- [ ] Commit + deploy after review
