# NOEMA

World Engine runtime for **NOEMA v0.1 — The Chamber**.

This repository implements the authoritative persistent MUD-style simulation specified by [`Zero-State-LLC/Noema-Specs`](https://github.com/Zero-State-LLC/Noema-Specs). It does **not** claim consciousness measurement. Evidence labels remain `OBSERVED`, `INFERRED`, `SPECULATIVE`, and `NOT_COMPUTABLE`.

## Spec compatibility

Pinned fixtures: **Noema-Specs `v0.1.0-rc1`** (`fixtures/v01-seed/`).

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest -q
noema-replay
```

Successful Chamber replay prints:

```text
status: EQUIVALENT
...
EQUIVALENT under v0.1 acceptance boundary
```

## What v0.1 proves

- Load a public seed world (≥3 rooms, infrastructure, resource node, default budgets)
- Append-only reduce of the closed 24-type event catalog
- Digest-chained ledger integrity
- Acceptance projection matches published final-state + observation digests

## Layout

```text
src/noema/world/     # state, pure reducers, digests
src/noema/replay/    # fixture runner
src/noema/cli/       # noema-replay entrypoint
fixtures/v01-seed/   # Chamber acceptance package (from specs)
tests/               # equivalence gate
```

## Design notes

- Modular monolith (see specs `docs/ENGINEERING.md`)
- Reducers are pure: `(WorldState, WorldEvent) -> WorldState`
- Private agent cognition is never requested or stored
- Fixture digests are part of the acceptance contract; corrections require a specs RFC/update

## License

Apache-2.0


## License

Copyright © 2026 Zero State LLC. All Rights Reserved. Licensed under the Zero State Proprietary License v1.0. See [`LICENSE`](LICENSE).

Third-party components remain subject to their respective licenses.
