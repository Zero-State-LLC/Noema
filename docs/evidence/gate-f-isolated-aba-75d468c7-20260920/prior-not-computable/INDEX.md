# Gate F isolated A-B-A rehearsal — 2026-09-20

**Issue:** [Zero-State-LLC/Noema#715](https://github.com/Zero-State-LLC/Noema/issues/715)
**Candidate:** `lca6-gate-f-successor-decision`
**Successor source:** `75d468c750aeb04490969f33d2cc13ad7e85a3a5` ([#717](https://github.com/Zero-State-LLC/Noema/pull/717) sharp override)
**Live baseline (must stay unchanged):** Worker `ac6813da-1e0a-4f0c-8566-d9346b4baed5` / source `630652e6772d4fbc340cf155a33fd628163709d9`
**Pattern:** [ISOLATED-ROLLBACK-REHEARSAL.md](../../ISOLATED-ROLLBACK-REHEARSAL.md) / [#562](https://github.com/Zero-State-LLC/Noema/pull/562) (closes #555). Historical receipts are not substitute evidence.

**Overall verdict: `NOT_COMPUTABLE`.** Isolated deploy did not start. Cloudflare auth is missing on this Cloud Agent.

This packet is not Gate F `GO`. It does not score the successor-decision packet. It does not authorize Deploy. #715 stays open.

## Files

| File | Contents |
|------|----------|
| [ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.md](ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.md) | Human receipt: auth stop, intended Worker, production GET identity, honesty labels |
| [ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json](ISOLATED-ROLLBACK-REHEARSAL-717-EVIDENCE.json) | Machine receipt. No secrets. No invented digests |
| [workers-noema-630652e6-75d468c7.diff](workers-noema-630652e6-75d468c7.diff) | `git diff 630652e6..75d468c7 -- workers/noema` (package.json override + lockfile) |

## Verdicts

| Check | Verdict | Why |
|---|---|---|
| Isolated A-B-A rollback continuity | `NOT_COMPUTABLE` | `npx wrangler whoami` → not authenticated. No isolated Worker was created |
| Gate F dual-SHA digest compare (`630652e6` A′ vs `75d468c7` B′) | `NOT_COMPUTABLE` | Not measured. Stock `rehearse:rollback` is same-tree metadata A/B only |
| Production identity unchanged | **OBSERVED** | GET `/version` stayed `ac6813da-1e0a-4f0c-8566-d9346b4baed5` before and after. No production write |

## Missing auth (exact)

These were checked. None is present:

| Surface | Result |
|---|---|
| `CLOUDFLARE_API_TOKEN` | UNSET |
| `CLOUDFLARE_ACCOUNT_ID` | UNSET |
| `~/.wrangler` | absent |
| `~/.config/.wrangler/config/default.toml` | absent |
| Cloudflare MCP (`Cloudflare-bindings`, `Cloudflare-builds`, `Cloudflare-docs`, `Cloudflare-observability`) | `needsAuth` |
| Cloud Agent secret names | `GITHUB_TOKEN` only |
| `npx wrangler@4.123.0 whoami` | `You are not authenticated. Please run wrangler login.` |

`wrangler login` and MCP OAuth are interactive. This environment cannot complete them.

Repo Actions still holds `secrets.CLOUDFLARE_API_TOKEN` for pin-on-publish. That workflow was not dispatched. It is not an isolated-rehearsal path.

## Production (GET-only)

Observed `2026-09-20T23:27:46Z` and again `2026-09-20T23:28:25Z`. Both equal:

```text
GET https://noema.guru/version
  worker_version_id = ac6813da-1e0a-4f0c-8566-d9346b4baed5
  world_id          = world.perihelion-reach-3
  deployed_at       = 2026-09-20T20:26:54.009622Z

GET https://noema.guru/ready
  genesis_id        = genesis.94d0961984b2b4f8
  status            = ACTIVE
  settlement_health = HEALTHY
  cycle             = 21948
  sequence          = 59599
  players           = 0
```

No `POST` / deploy / rollback / secret / route / domain change was sent to `noema.guru` or `noema-gateway`.

## Explicit non-claims

- Not Gate F COMPLETE
- Not `GO` / `NO-GO`
- Not Deploy / pin-on-publish
- Not a dual-SHA Worker digest matrix
- Not a rollback-continuity PASS
- Not PLAY on `world-01` or any perihelion world
- #562 / #555 receipts stay historical
