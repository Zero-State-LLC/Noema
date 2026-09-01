# C7 client-pin promotion evidence — partial

**Recorded:** 2026-08-31
**Question:** may `spec-compat.json` `hosted_live.official_client` advance from `noema-client==0.1.15`?
**Verdict:** **NOT YET.** The four checks that do not require enrollment pass. Three that do require it are unrun.
**This packet does not promote the pin.** It changes no pin, contract, or runtime.

## Why this exists

[The continuation plan](CONTINUATION_PLAN_spec-directed-runtime-2026-08-31.md) C7 says:

> Do not change `hosted_live.official_client` solely because `0.1.20` exists.

and lists six checks. `0.1.20` has been released (GH release and PyPI, 2026-08-31), while
the live pin still names `0.1.15`. That mismatch is registered as `A10` in the Specs
gap register: a Gate B packet must record `controller_versions`, so it will record a
Controller version the live pin does not name. This runs the half of C7 that needs no
human, so the promotion decision is ready when the enrollment half is.

## Boundary

The live Worker is `34f4b0dc-85c6-4adb-8fd8-9ccffae73b99`, built from source
`a68f5d8d`. C7 requires evidence that applies to **the current Worker**, so the
cross-repo check below is run against that exact source commit, not against
Worker `main` — `main` is ahead of the live build.

Nothing here mutated the live world. `doctor` issues `GET /health` plus
discovery; no credential existed in the environment that ran it.

## Checks that pass — OBSERVED

### 1. Release identity

| Fact | Value |
|---|---|
| Tag `v0.1.20` | `af19d16` |
| `origin/main` | `af19d16` — **identical** |
| Version source | single `_version.py` attr, `0.1.20` |

Tag and main naming the same commit is the specific defect `noema-client#32`
repaired, where `v0.1.19` and PyPI `0.1.19` were different builds under one
version string. It holds for `0.1.20`.

### 2. Wheel identity against PyPI

A wheel built from the `v0.1.20` tag was compared file-by-file with the wheel
PyPI serves for `0.1.20`, hashing each member and ignoring `.dist-info`:

```text
published files: 28   built-from-tag files: 28
only in published: none
only in built:     none
content differs:   none
```

**The published artifact is byte-identical in source content to the tag.** An
operator installing `noema-client==0.1.20` gets the code in this repository.

### 3. Clean suite at the tag

`165 passed` from a fresh clone of the tag in a clean 3.12 environment.

`ruff` reports 36 findings. These are **pre-existing and ungated** — the client
CI workflows run `pytest` only, and the count was 38 at `0.1.18`. Not a
regression and not a promotion blocker.

### 4. Live discovery and `doctor` — against production, read-only

```text
server: https://noema.guru
reachability: ok
discovery: agent-protocol/v1
seal: required
credential: missing
```

`credential: missing` is the expected and correct result: no enrollment was
performed.

### 5. Cross-repo command/affordance contract, against the live build

Every `cmd:` template the Worker emits was re-derived from source and compared
with the contract fixture shipped in client `0.1.20`:

| Compared against | Templates | Result |
|---|---|---|
| **live build `a68f5d8d`** | 42 vs 42 | exact — none added, none removed |
| Worker `main` `9fd16cb` | 42 vs 42 | exact |

So `0.1.20`'s advertised-command contract matches the Worker actually serving
production, which is the form C7 asks for.

## Checks that remain — NOT_COMPUTABLE without a human

| C7 item | Why it cannot run here |
|---|---|
| authorized enrollment / connect path | Approval requires an authenticated human principal; agents cannot approve a device |
| observe / act / rejection / resync / reconnect | Requires an enrolled credential, and acting mutates the live world |
| bounded session with receipts | Same; also produces live world state |

These are the same principal-bound steps that block Gate B, so they are best run
inside the Gate B enrollment rather than as a separate live exercise.

## What would follow

If the enrollment-bound checks pass against Worker `34f4b0dc`, C7 is satisfied
and `hosted_live.official_client` may advance to `noema-client==0.1.20`, closing
`A10`. Until then the pin stays at `0.1.15` and any Gate B packet should record
the mismatch explicitly, as `A10` requires.

Promoting the pin because `0.1.20` exists remains a forbidden fill.
