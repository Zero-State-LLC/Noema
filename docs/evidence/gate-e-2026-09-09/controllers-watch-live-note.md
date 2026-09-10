# `/v1/watch/live` `controllers` is not a trio census

**Issue:** [Zero-State-LLC/Noema#682](https://github.com/Zero-State-LLC/Noema/issues/682)
**Candidate:** `lca5-gate-e-endurance`

**This note does not claim Gate E COMPLETE, Phase A PASS, or Phase B PASS.**
Do not close #682. No Deploy. No Controller reconnect.

## Field meaning (code)

Public `GET /v1/watch/live` field `controllers` is **reconstruction corroboration**, not a LUDUS / ADVERSARY / VECTOR census.

Code default at `workers/noema/src/watch-live.ts:751`:

```text
input.controllers ?? publicReconstruction?.controllers ?? 1
```

Comment immediately above (`workers/noema/src/watch-live.ts:743–746`) cites **RFC-0024 / GC6-S1**: WATCH may project only public reconstructions; missing public evidence keeps the existing `0` / `1` defaults.

A live value of `1` is therefore the **fallback default** when no explicit input and no public reconstruction `controllers` count is present. It does **not** mean one connected Controller, and it does **not** enumerate the endurance trio.

## Census source

Trio census (LUDUS / ADVERSARY / VECTOR Connected, not idle WAIT, in-world observe) remains **Admin / Controller-log only**.

From public surfaces (`/v1/watch/live` `controllers`, `players_present`, `/ready` `players`) the trio census is **NOT_COMPUTABLE**.

See also [repin-2026-09-10.md](repin-2026-09-10.md) fail-closed mark 1 (#702 already on `main`).
