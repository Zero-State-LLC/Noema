# HISTORICAL — isolated A-B-A r1 FAIL

Box run against Worker `noema-rollback-rehearsal-gatef-75d468c7-20260920`. Phase A deploy OK; genesis/preview HTTP 500 before DO warm. Digests NOT_COMPUTABLE.

Root cause (INFERRED, OBSERVED corroboration): cold Durable Object race. Fixed for r2 by waiting `GET /ready` after deploy before genesis (Noema [#719](https://github.com/Zero-State-LLC/Noema/pull/719)).

Not Gate F `GO`. Production remained `ac6813da`.
