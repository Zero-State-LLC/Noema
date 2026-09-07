# P2 candidate suite baseline — `main` tip after C5

**Recorded:** 2026-09-07T23:49:43Z  
**Verdict:** Worker typecheck and vitest **OBSERVED GREEN** on current `main` tip  
**Changes nothing in production.** No pin, contract, Worker source, world, enrollment, email, spend, or Deploy action.

This receipt records a local candidate-suite measurement on Noema `main` after
C5 public WATCH. It does **not** close Gate B, enroll Controllers, send email,
or authorize Deploy.

Companion queue: [CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md](CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md).  
Pin table: [SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md](SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md) §2 ([#640](https://github.com/Zero-State-LLC/Noema/pull/640)).  
C5 WATCH (unchanged): [WATCH-C5-ACCEPTANCE-2026-09-07.md](WATCH-C5-ACCEPTANCE-2026-09-07.md).

## Gate B is not claimed

This packet does **not** claim Gate B, Gate C, or later gates. Local suites
are not enrollment, not three independent external Controllers, and not live
acceptance.

## Pins (OBSERVED)

| Field | Value |
|---|---|
| Tip tested | `d90fc450b8417a98f459f8bdbe8ee07c3b7fff11` (`docs: C5 WATCH acceptance on Worker 04ef6ecb (#642)`) |
| Worktree | clean checkout of that tip; `npm ci` in `workers/noema` immediately before the suite |
| Live Worker | `04ef6ecb-65b9-430e-b0fd-141a2cc7179f` (from `spec-compat.json` `hosted_live`) |
| Live source | `9c25603581992da0440b2dd733a554aca98adef0` |
| `hosted_live.official_client` | `noema-client==0.1.21` |
| Node | `v22.14.0` (`/exec-daemon/node`) |
| npm | `10.9.7` (`/home/ubuntu/.nvm/versions/node/v22.22.2/bin/npm`) |
| Python (client clone only) | `3.12.3` / pytest `9.1.1` |

`docs/AGENT-GOTCHAS.md` records that CI pins Node 24. This turn used the
environment default Node 22. That difference is **OBSERVED**, not a suite
failure.

## 1. Worker typecheck (OBSERVED)

Command, independently after `npm ci`:

```bash
cd workers/noema && npm run typecheck
```

**Exit code: 0.** `wrangler types` wrote `worker-configuration.d.ts`; `tsc --noEmit`
then succeeded. The working tree stayed clean (generated types matched git).

Last ~40 lines:

```text
 ⛅️ wrangler 4.123.0
────────────────────
Generating project types...

interface __BaseEnv_Env {
	ADMIN_MAIL: SendEmail;
	CF_VERSION: WorkerVersionMetadata;
	ASSETS: Fetcher;
	NOEMA_ENV: "production";
	NOEMA_PROTOCOL_VERSION: "1";
	DEFAULT_WORLD_ID: "world.perihelion-reach-3";
	WORLD_DO: DurableObjectNamespace<import("./src/index").NoemaWorldDO>;
}
declare namespace Cloudflare {
	interface GlobalProps {
		mainModule: typeof import("./src/index");
		durableNamespaces: "NoemaWorldDO";
	}
	interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
type StringifyValues<EnvType extends Record<string, unknown>> = {
	[Binding in keyof EnvType]: EnvType[Binding] extends string ? EnvType[Binding] : string;
};
declare namespace NodeJS {
	interface ProcessEnv extends StringifyValues<Pick<Cloudflare.Env, "NOEMA_ENV" | "NOEMA_PROTOCOL_VERSION" | "DEFAULT_WORLD_ID">> {}
}

Generating runtime types...

Runtime types generated.


✨ Types written to worker-configuration.d.ts

📖 Read about runtime types
https://developers.cloudflare.com/workers/languages/typescript/#generate-types
📣 Remember to rerun 'wrangler types' after you change your wrangler.toml file.
```

## 2. Worker vitest (OBSERVED)

Command, independently after typecheck (same `node_modules`, no test edits):

```bash
cd workers/noema && npm test
```

**Exit code: 0.** No failing suite names.

| Count | Value |
|---|---|
| Test files | **231 passed**, **2 skipped**, 233 total |
| Tests | **1673 passed**, **21 skipped**, 1694 total |
| Failed | **0** |
| Duration | 20.81s (Start at 23:49:09 UTC) |

Entire-file skips (2 files, 11 tests):

| File | Skipped tests |
|---|---|
| `test/rfc-0129-crime-conformance.test.ts` | 8 |
| `test/slice-catalog.test.ts` | 3 |

Partial skips (10 tests) in otherwise passing files:

| File | Skipped tests |
|---|---|
| `test/closed-catalog.test.ts` | 5 |
| `test/specs-pin-currency.test.ts` | 2 |
| `test/watch-entity-update-census.test.ts` | 1 |
| `test/gc4-s8-governance.test.ts` | 1 |
| `test/forbidden-projection.test.ts` | 1 |

Skip reason (OBSERVED from `workers/noema/test/specs-checkout.ts` and the
`it.skipIf(!have)` / `describe.skipIf(!have)` guards): this workspace is a
bare Noema clone. Cross-repo suites that read Noema-Specs artifacts skip
locally when those files are absent. That is expected local behavior, not a
disabled test. Those 21 cases were **not** executed and are **not** claimed
as pass. In CI the same missing artifacts fail closed instead of skipping.

Tests were not edited to force green.

## 3. Live source vs current `main` (OBSERVED)

Compare live deploy source `9c25603581992da0440b2dd733a554aca98adef0`
(Worker `04ef6ecb…`) to tip `d90fc450b8417a98f459f8bdbe8ee07c3b7fff11`.

**ahead_by: 4**

| SHA | Message |
|---|---|
| `9576208` `957620894a2c45810d3f20aa53c65d9fbf5f0d5b` | chore: pin live Worker 04ef6ecb-65b9-430e-b0fd-141a2cc7179f (#639) |
| `407e1e2` `407e1e214c1828640557583c0f96e40b8eb1d241` | docs: refresh SPECS-RUNTIME gap-closure observed baseline (post-deploy) (#640) |
| `0a2234b` `0a2234bcf4db31055c47f65d79d6172dcda14c26` | docs: refresh continuation dispositions after Deploy 04ef6ecb (#641) |
| `d90fc45` `d90fc450b8417a98f459f8bdbe8ee07c3b7fff11` | docs: C5 WATCH acceptance on Worker 04ef6ecb (#642) |

`git diff --name-only 9c25603..d90fc45` changed only:

- `spec-compat.json`
- `docs/evidence/CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md`
- `docs/evidence/SPECS-RUNTIME-GAP-CLOSURE-2026-09-07.md`
- `docs/evidence/WATCH-C5-ACCEPTANCE-2026-09-07.md`
- `docs/evidence/assets/c5-2026-09-07/*`

`workers/noema/src` is **IDENTICAL** to the live deploy source
(`git diff --quiet 9c25603..d90fc45 -- workers/noema/src`).

**Classification:** after the deploy, only docs / evidence / `spec-compat`
moved. Worker *source* did not change. Current `main` Worker src does **not**
trail live; it matches live. Deploy is **not** recommended from this receipt.

## 4. Official client pin and offline unit suite

Pin (OBSERVED from `spec-compat.json` `hosted_live.official_client`):
`noema-client==0.1.21`.

Live enroll, discover/doctor against production, act/refuse/resync/reconnect:
**not run**. C7 enrollment-bound acceptance remains **UNRUN**.

Optional offline clone (no production traffic):

| Field | Value |
|---|---|
| Clone | `https://github.com/scrimshawlife-ctrl/noema-client.git` tag `v0.1.21` |
| Commit | `0a20e2e94b087d3cdc6da7e8b46a67f008fe80a3` (detached HEAD at the tag) |
| Command | `python3 -m pytest -q` with isolated `PYTHONPATH` (source + local target deps) |
| Result | **165 passed**, 0 skipped, 0 failed, 16.28s, exit 0 |

The first source-only run failed one metadata identity test
(`test_installed_and_generated_metadata_match_authoritative_version`) because
`importlib.metadata` and `src/noema_client.egg-info/PKG-INFO` were absent.
Installing the exact tag into `/tmp/client-deps` and generating setuptools
egg-info made that test GREEN. No client source, test, or fixture was edited.
This is an exact-tag local suite, **not** proof of the published PyPI wheel,
and **not** C7.

## 5. Surfaces not measured this turn

| Surface | Label | Note |
|---|---|---|
| Offline Python / Chamber suite | NOT_COMPUTABLE | Not in this P2 verification slice |
| Cohort local E2E (`tests/test_gate_b_cohort_local_e2e.py`) | NOT_COMPUTABLE | Not run |
| C2 settlement / sender-domain preflight | NOT_COMPUTABLE | Not inspected |
| Live `/ready` / `/version` re-probe | NOT_COMPUTABLE | Not re-fetched; C5 + pin table remain the last public probes |
| C7 live client path | NOT_COMPUTABLE | Enrollment and production doctor/enroll forbidden this turn |
| C8 / Gate B | OWNER_BLOCKED | Unchanged. Not claimed. |

## Not claimed

This packet does **not** claim:

- Gate B, Gate C, or later gates
- C2 complete (settlement inspection, sender-domain verification, live `/ready`
  re-probe, and repository-clean deploy-readiness remain outside this slice)
- C6 controlled email
- C7 official-client enrollment / act / refuse / resync / reconnect
- C8 three independent external Controllers
- Deploy, pin change, or a need to republish the Worker
- That the 21 Specs-artifact skips executed or passed
- PyPI wheel identity for `noema-client==0.1.21`
