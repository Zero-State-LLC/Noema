# Gate B #590 — Ordering / idempotency / recovery receipts probe

**Collected:** 2026-09-08 ~07:45–07:50Z UTC (**2026-09-08 ~00:45–00:50 PT**)
**Issue:** [Zero-State-LLC/Noema#590](https://github.com/Zero-State-LLC/Noema/issues/590)
**Server:** `https://noema.guru`
**Client:** `/workspace/c7-noema-022/bin/noema` → **noema_client 0.1.22**
**Controller used:** C7 Boof `ctrl.device.9a3eabf9b619` / `player.device9a3eabf9b619` (config `/workspace/c7-boof-022-config`)
**Locks:** No Deploy. Do not close #590. No Gate B COMPLETE claim. Tokens redacted only.

## Verdict (short)

| Surface | Ordering | Idempotency | Budgets | Recovery receipts |
|---------|----------|-------------|---------|-------------------|
| `observe --json` | **OBSERVED** `sequence`, `cycle` | **NOT in body** | **OBSERVED** `budgets` | **NOT observed** |
| `act` CLI stdout | cycle/seq in rendered text only | **NOT surfaced** (no `--json`) | budgets not printed as structured fields | **NOT observed** |
| `act` HTTP/library raw body | **OBSERVED** `observation.sequence` + `events[].sequence` | **request_id OBSERVED** (echo); **idempotency_key NOT echoed** (client-sent only) | **OBSERVED** `observation.budgets` + `events[].payload.cost_paid` | **NOT observed** (no recovery_* field) |
| HTTP response headers | **NOT observed** | **NOT observed** | **NOT observed** | **NOT observed** |

**Overall:** Act/observe **do expose** ordering (`sequence`/`cycle`), budgets, settlement flag, request id, events, and provenance via the **library/raw HTTP body**. They do **not** expose a dedicated recovery-receipt object or an echoed `idempotency_key`. CLI `act` alone is insufficient (no `--json`). Controllers a/b/c were **expired** at probe time → multi-controller concurrent LOOK **NOT_COMPUTABLE** in this pass (prior a+b LOOK evidence remains in `contention-watch.md`).

---

## 1. Credential / controller availability

| Slot | Status at probe | Notes |
|------|-----------------|-------|
| controller-a/b/c credentials | `credential: expired` / `NOT_AUTHORIZED` | `noema observe` → run `noema connect`; players still visible in C7 `players_here` |
| C7 `/workspace/c7-boof-022-config` | `connected: true`, `credential: stored` | Used for all live act/observe captures below |

---

## 2. How contention evidence should be recorded (docs/code)

From `docs/LCA2-GATE-B-COHORT-RUNNER.md` + `tests/test_gate_b_cohort.py` / `src/noema/cli/cohort.py`:

- Live COMPLETE requires opaque **SHA-256 bindings** per participant for:
  - `contention_evidence_digest`
  - `ordering_evidence_digest`
  - `budget_settlement_evidence_digest`
  - `acceptance_authority_digest`
- These are **cohort evidence digests**, not automatic fields returned by `POST /v1/command`.
- Device enrollment recovery/independence uses seven-field `DeviceApprovalReceipt` (approval/independent_control receipts) — separate from per-act recovery.
- Gate A “recovery receipts” historically mean restart / incident-recover / settlement-chain / accepted-replay proofs (`docs/LCA-GATE-A-EXECUTION-2026-08-25.md`), not a LOOK response field.
- Hosted contention design (`docs/superpowers/specs/2026-08-17-hosted-multiplayer-contention-design.md`): winner’s **idempotent retry** returns stored success; loser needs a **new** key.
- Canonical order (code): `action_priority,agent_id,client_action_sequence,action_id` (`workers/noema/src/player-tempo.ts`).
- Server `CommandResult` type (`workers/noema/src/types.ts`): `ok`, `request_id`, `observation?`, `events?`, `provenance?`, `settled?`, `error?` — **no** `idempotency_key`, **no** `recovery_receipt`.

Client transport (`noema_client/transport.py`) **sends** body fields `request_id`, `idempotency_key`, and `client.client_action_sequence`, plus header `X-Noema-Seal` on live attach.

---

## 3. Concurrent LOOK + INSPECT (C7)

Two parallel library `act` calls on the same C7 credential (controllers a/b expired).

### Pre / post observe snapshots

```json
{
  "pre": {
    "sequence": 40561,
    "cycle": 17256,
    "budgets": {
      "attention": 6,
      "compute": 64,
      "energy": 80,
      "influence": 40,
      "storage": 16
    },
    "player_id": "player.device9a3eabf9b619",
    "world": "Perihelion Reach"
  },
  "post": {
    "sequence": 40561,
    "cycle": 17256,
    "budgets": {
      "attention": 3,
      "compute": 64,
      "energy": 80,
      "influence": 40,
      "storage": 16
    },
    "player_id": "player.device9a3eabf9b619",
    "world": "Perihelion Reach"
  }
}
```

**Budget behavior (OBSERVED):** attention 6 → LOOK (−1) and INSPECT (−2) raced; post attention **3**. Other budgets unchanged. World `sequence` stayed **40561** / `cycle` **17256** (LOOK/INSPECT did not advance public ledger sequence in this sample).

### CommandResult / raw body fields (OBSERVED)

| Act | ok | settled | request_id (echo) | idempotency_key (client-held) | obs.sequence | cost_paid |
|-----|----|---------|-------------------|-------------------------------|--------------|-----------|
| LOOK | True | True | `req.57dc2f8f5f` | `idem.0bb2ad45742f` | 40561 | attention 1 |
| INSPECT salvage-cache | True | True | `req.a5bf8f352f` | `idem.6e003cc7228d` | 40561 | attention 2 |

**Raw top-level keys (both):** `events`, `observation`, `ok`, `provenance`, `request_id`, `settled`.

**provenance (both):** `player_id`, `controller_id`, `session_id`, `agent_id`.

**Absent from server body:** `idempotency_key`, `ordering`, `recovery_receipt`, `client_action_sequence` echo.

---

## 4. HTTP headers (WAIT sample after gateway._http instrument)

Request headers included: `authorization` [REDACTED], `X-Noema-Seal` (`sha256:9b9c211c…`), `content-type`, `accept`, `user-agent`.

Response headers (OBSERVED keys only): `Access-Control-Allow-Headers`, `Access-Control-Allow-Methods`, `CF-RAY`, `Cache-Control`, `Connection`, `Content-Length`, `Content-Type`, `Date`, `Nel`, `Report-To`, `Server`, `Strict-Transport-Security`, `Vary`, `alt-svc`, `referrer-policy`, `x-content-type-options`.

**No** response header carried ordering, idempotency, budget, or recovery metadata (only CF/security/`x-content-type-options: nosniff`).

WAIT sample: `settled=false` (OBSERVED; LOOK/INSPECT earlier were `settled=true`). Body keys identical shape.

```json
[
  {
    "method": "POST",
    "url": "https://noema.guru/v1/command",
    "request_command": "WAIT",
    "request_id": "req.05b8a4e3f7",
    "idempotency_key": "idem.5ad3c95e60ab",
    "client_action_sequence": 1,
    "request_headers": {
      "content-type": "application/json",
      "accept": "application/json",
      "user-agent": "noema-client/0.1.22 (+https://github.com/scrimshawlife-ctrl/noema-client)",
      "authorization": "[REDACTED]",
      "X-Noema-Seal": "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395"
    },
    "response_status": 200,
    "response_headers": {
      "Date": "Tue, 08 Sep 2026 07:56:05 GMT",
      "Content-Type": "application/json; charset=utf-8",
      "Content-Length": "25033",
      "Connection": "close",
      "Cache-Control": "no-store",
      "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
      "Vary": "Origin",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Noema-Access-Token, X-Noema-Admin-Token, X-Noema-Seal",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
      "Report-To": "{\"group\":\"cf-nel\",\"max_age\":604800,\"endpoints\":[{\"url\":\"https://a.nel.cloudflare.com/report/v4?s=0rCsXeUqXRjFrUdBqE75sbOvO0qQc2puXIeRLFw1jjPzMmGviL2ZtBb4HuCZLLAAL%2Bt05iyclFxaYyrpxlbKRZvEPt3f9iNataE7nbje7YHm6NED90hFeC4NKY5K\"}]}",
      "Nel": "{\"report_to\":\"cf-nel\",\"success_fraction\":0.0,\"max_age\":604800}",
      "Server": "cloudflare",
      "CF-RAY": "a37c64fbe9c30abb-CMH",
      "alt-svc": "h3=\":443\"; ma=86400"
    },
    "response_top_keys": [
      "events",
      "observation",
      "ok",
      "provenance",
      "request_id",
      "settled"
    ],
    "response_settled": false,
    "response_request_id": "req.05b8a4e3f7",
    "response_has_idempotency_key": false
  }
]
```

---

## 5. FULL JSON — concurrent LOOK act (redacted)

```json
{
  "label": "LOOK",
  "elapsed_s": 0.644,
  "ok": true,
  "settled": true,
  "http_status": null,
  "failure": null,
  "idempotency_key": "idem.0bb2ad45742f",
  "request_id": "req.57dc2f8f5f",
  "world_status": null,
  "error": null,
  "raw_full": {
    "ok": true,
    "request_id": "req.57dc2f8f5f",
    "observation": {
      "cycle": 17256,
      "sequence": 40561,
      "world_name": "Perihelion Reach",
      "location": {
        "room_id": "room.civic-exchange",
        "name": "Civic Exchange",
        "description": "Central meeting and trade hub. High visibility.",
        "condition": "Infrastructure shows damage. A resource node can be worked.",
        "exits": [
          {
            "direction": "north",
            "to_room_id": "room.relay-quarter",
            "to_room_name": "Relay Quarter",
            "two_way": true
          },
          {
            "direction": "east",
            "to_room_id": "room.transit-ring",
            "to_room_name": "Transit Ring",
            "two_way": true
          },
          {
            "direction": "west",
            "to_room_id": "room.storage-district",
            "to_room_name": "Storage District",
            "two_way": true
          },
          {
            "direction": "down",
            "to_room_id": "room.archive",
            "to_room_name": "Archive",
            "two_way": true
          }
        ],
        "entities": [
          {
            "entity_id": "entity.salvage-cache",
            "label": "salvage-cache",
            "entity_type": "NODE",
            "stock_resource": "materials",
            "stock_amount": 15535.768010989885,
            "repairable": false,
            "harvestable": true
          },
          {
            "entity_id": "entity.old-market-post",
            "label": "freight-cage",
            "entity_type": "INFRASTRUCTURE",
            "repairable": false,
            "harvestable": false
          },
          {
            "entity_id": "entity.production-node-ewm",
            "label": "exchange-fabricator",
            "entity_type": "PRODUCTION",
            "stock_resource": "materials",
            "stock_amount": 18,
            "repairable": false,
            "harvestable": true
          },
          {
            "entity_id": "entity.scar.003bc03e",
            "label": "scarred-relay",
            "entity_type": "RUIN",
            "condition": 0,
            "repairable": false,
            "harvestable": false,
            "scar": true
          },
          {
            "entity_id": "entity.relay.15ec525b",
            "label": "relay",
            "entity_type": "INFRASTRUCTURE",
            "condition": 100,
            "repairable": false,
            "harvestable": false
          }
        ],
        "traces": [
          {
            "kind": "scar",
            "text": "A scar remains (scarred-relay).",
            "visibility": "public"
          },
          {
            "kind": "construction",
            "text": "The relay is unclaimed.",
            "visibility": "public"
          }
        ],
        "co_evolution": {
          "harvest_pressure": 28.021002306784624,
          "regen_mod": 2,
          "protocol_strength": 2
        },
        "genesis_evolutions": [
          {
            "cycle": 3747,
            "kind": "MICRO_GENESIS_CAPACITY",
            "details": "max_stock 930459 -> 1070027 on salvage-cache (pressure adaptation)",
            "lineage_id": "lineage.entity.salvage-cache",
            "parent_kind": "MICRO_GENESIS_CAPACITY"
          },
          {
            "cycle": 3747,
            "kind": "MICRO_GENESIS_CAPACITY",
            "details": "max_stock 1070027 -> 1230531 on salvage-cache (pressure adaptation)",
            "lineage_id": "lineage.entity.salvage-cache",
            "parent_kind": "MICRO_GENESIS_CAPACITY"
          },
          {
            "cycle": 3747,
            "kind": "MICRO_GENESIS_CAPACITY",
            "details": "max_stock 1230531 -> 1415110 on salvage-cache (pressure adaptation)",
            "lineage_id": "lineage.entity.salvage-cache",
            "parent_kind": "MICRO_GENESIS_CAPACITY"
          }
        ]
      },
      "situation": {
        "place": "Civic Exchange",
        "strain": "scarred relay condition 0."
      },
      "pressure": "Infrastructure shows damage. A resource node can be worked.",
      "player_id": "player.device9a3eabf9b619",
      "budgets": {
        "attention": 5,
        "compute": 64,
        "energy": 80,
        "influence": 40,
        "storage": 16
      },
      "messages": [],
      "trades": [],
      "organizations": [
        {
          "org_id": "org.galadriel-field-lab.0fa95303",
          "name": "Galadriel Field Lab",
          "charter": "End-to-end systems evaluation",
          "status": "ACTIVE",
          "creator_id": "player.device6adc942c3053",
          "members": [
            {
              "agent_id": "player.device6adc942c3053",
              "role": "founder"
            },
            {
              "agent_id": "player.tester",
              "role": "member"
            }
          ],
          "my_role": null,
          "created_cycle": 1685,
          "offices": [
            {
              "office_id": "office.galadriel-field-lab.0fa9.notice.6ac73330",
              "display_name": "Notice",
              "status": "OCCUPIED",
              "holder_player_id": "player.tester",
              "holder_handle": "tester",
              "authority_profile": "PUBLISH_NOTICE",
              "successor_handle": "tester"
            }
          ]
        },
        {
          "org_id": "org.archive-compact.ca9f4e2d",
          "name": "Archive Compact",
          "charter": "test",
          "status": "ACTIVE",
          "creator_id": "player.tester",
          "members": [
            {
              "agent_id": "player.tester",
              "role": "founder"
            },
            {
              "agent_id": "player.reach-maint3",
              "role": "member"
            }
          ],
          "my_role": null,
          "created_cycle": 118,
          "offices": []
        }
      ],
      "signaling_quality": 1,
      "drift_alerts": [],
      "cascading_risk": 0.4,
      "protocol_strength": 2,
      "compositionality": 0,
      "reputation_summary": {
        "self_image": 0,
        "self_second_order": 0
      },
      "active_norms": {
        "org_create_influence": 5,
        "harvest_pressure": 28.021002306784624,
        "last_ratchet": "MICRO_GENESIS_CAPACITY"
      },
      "scars": [
        {
          "scar_id": "scar.econ.room.civic-exchange.93",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 1,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.357",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.8,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.2196",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.2506",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3036",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3621",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3666",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3711",
          "domain": "economic",
          "strength": 1,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        }
      ],
      "historical_context": {
        "fragments": 64,
        "reconstruction_confidence": 1
      },
      "path_dependence_index": 0.93,
      "lore_attractors": [
        {
          "attractor_id": "lore.room.civic-exchange",
          "label": "scarred ground",
          "weight": 1,
          "basin": "crystallized"
        }
      ],
      "in_world": true,
      "players_here": [
        {
          "player_id": "player.tester",
          "handle": "tester"
        },
        {
          "player_id": "player.reach-maint3",
          "handle": "reach-maint3"
        },
        {
          "player_id": "player.device65cba99c4116",
          "handle": "device65cba99c4116"
        },
        {
          "player_id": "player.devicec865ee7b39ce",
          "handle": "devicec865ee7b39ce"
        },
        {
          "player_id": "player.device995df01ed35e",
          "handle": "device995df01ed35e"
        }
      ],
      "services": [
        {
          "service_id": "service.quartermaster.01",
          "display_name": "Quartermaster",
          "role": "resource / storage interface",
          "status": "AVAILABLE",
          "operations": [
            "show observable stock",
            "prepare HARVEST"
          ],
          "cannot": [
            "bank",
            "invent supply",
            "change harvest cost"
          ],
          "suggested_cmds": [
            "inspect salvage-cache",
            "harvest salvage-cache"
          ],
          "line": "Stores: I can show observable stock and prepare HARVEST. No banking, no invented supply."
        }
      ],
      "available_actions": [
        "INSPECT",
        "HARVEST",
        "MOVE",
        "MESSAGE",
        "TRADE",
        "ORG_CREATE",
        "LOOK",
        "WAIT",
        "FOCUS",
        "CONTEST_DECLARE",
        "AGREEMENT_FORM",
        "DISMANTLE"
      ],
      "affordances": [
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Salvage Cache",
          "cmd": "inspect salvage-cache",
          "target_id": "entity.salvage-cache",
          "target_label": "salvage-cache",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "HARVEST",
          "verb": "COMMIT",
          "operation": "HARVEST",
          "label": "Harvest Salvage Cache",
          "cmd": "harvest salvage-cache 1",
          "target_id": "entity.salvage-cache",
          "target_label": "salvage-cache",
          "requires": {
            "energy": 2,
            "compute": 1
          },
          "available": true,
          "hint": "compact grounded signal preferred",
          "kind": "resource"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Freight Cage",
          "cmd": "inspect freight-cage",
          "target_id": "entity.old-market-post",
          "target_label": "freight-cage",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Exchange Fabricator",
          "cmd": "inspect exchange-fabricator",
          "target_id": "entity.production-node-ewm",
          "target_label": "exchange-fabricator",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "HARVEST",
          "verb": "COMMIT",
          "operation": "HARVEST",
          "label": "Harvest Exchange Fabricator",
          "cmd": "harvest exchange-fabricator 1",
          "target_id": "entity.production-node-ewm",
          "target_label": "exchange-fabricator",
          "requires": {
            "energy": 2,
            "compute": 1
          },
          "available": true,
          "hint": "compact grounded signal preferred",
          "kind": "resource"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Scarred Relay",
          "cmd": "inspect scarred-relay",
          "target_id": "entity.scar.003bc03e",
          "target_label": "scarred-relay",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Relay",
          "cmd": "inspect relay",
          "target_id": "entity.relay.15ec525b",
          "target_label": "relay",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move north \u00b7 Relay Quarter",
          "cmd": "move north",
          "target_id": "north",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move east \u00b7 Transit Ring",
          "cmd": "move east",
          "target_id": "east",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move west \u00b7 Storage District",
          "cmd": "move west",
          "target_id": "west",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move down \u00b7 Archive",
          "cmd": "move down",
          "target_id": "down",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message tester",
          "cmd": "message tester \"hello\"",
          "target_id": "player.tester",
          "target_label": "tester",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with tester",
          "cmd": "trade tester offer=energy:1 want=energy:1",
          "target_id": "player.tester",
          "target_label": "tester",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message reach-maint3",
          "cmd": "message reach-maint3 \"hello\"",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with reach-maint3",
          "cmd": "trade reach-maint3 offer=energy:1 want=energy:1",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message device65cba99c4116",
          "cmd": "message device65cba99c4116 \"hello\"",
          "target_id": "player.device65cba99c4116",
          "target_label": "device65cba99c4116",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with device65cba99c4116",
          "cmd": "trade device65cba99c4116 offer=energy:1 want=energy:1",
          "target_id": "player.device65cba99c4116",
          "target_label": "device65cba99c4116",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message devicec865ee7b39ce",
          "cmd": "message devicec865ee7b39ce \"hello\"",
          "target_id": "player.devicec865ee7b39ce",
          "target_label": "devicec865ee7b39ce",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with devicec865ee7b39ce",
          "cmd": "trade devicec865ee7b39ce offer=energy:1 want=energy:1",
          "target_id": "player.devicec865ee7b39ce",
          "target_label": "devicec865ee7b39ce",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message device995df01ed35e",
          "cmd": "message device995df01ed35e \"hello\"",
          "target_id": "player.device995df01ed35e",
          "target_label": "device995df01ed35e",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with device995df01ed35e",
          "cmd": "trade device995df01ed35e offer=energy:1 want=energy:1",
          "target_id": "player.device995df01ed35e",
          "target_label": "device995df01ed35e",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "ORG_CREATE",
          "verb": "COMMIT",
          "operation": "ORG_CREATE",
          "label": "Form organization",
          "cmd": "form My Compact charter=\"local coordination\"",
          "requires": {
            "influence": 5,
            "compute": 2
          },
          "available": true,
          "kind": "org"
        },
        {
          "action": "LOOK",
          "verb": "LOOK",
          "label": "Look around",
          "cmd": "look",
          "requires": {
            "attention": 1
          },
          "available": true,
          "kind": "utility"
        },
        {
          "action": "WAIT",
          "verb": "WAIT",
          "label": "Wait",
          "cmd": "wait",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on the rooms.",
          "cmd": "focus explorer",
          "track": "explorer",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on survey work.",
          "cmd": "focus surveyor",
          "track": "surveyor",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on exchanges.",
          "cmd": "focus broker",
          "track": "broker",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on infrastructure.",
          "cmd": "focus engineer",
          "track": "engineer",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest infrastructure disruption \u00b7 Freight Cage",
          "cmd": "contest disruption freight-cage stake=energy:10,influence:6,compute:2",
          "target_id": "entity.old-market-post",
          "target_label": "Freight Cage",
          "contest_form": "INFRASTRUCTURE_DISRUPTION",
          "target": {
            "kind": "ENTITY",
            "entity_id": "entity.old-market-post"
          },
          "stake": {
            "energy": 10,
            "influence": 6,
            "compute": 2
          },
          "requires": {
            "compute": 4,
            "influence": 7,
            "energy": 10
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest infrastructure disruption \u00b7 Relay",
          "cmd": "contest disruption relay stake=energy:10,influence:6,compute:2",
          "target_id": "entity.relay.15ec525b",
          "target_label": "Relay",
          "contest_form": "INFRASTRUCTURE_DISRUPTION",
          "target": {
            "kind": "ENTITY",
            "entity_id": "entity.relay.15ec525b"
          },
          "stake": {
            "energy": 10,
            "influence": 6,
            "compute": 2
          },
          "requires": {
            "compute": 4,
            "influence": 7,
            "energy": 10
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 this room",
          "cmd": "contest access here stake=energy:6,influence:8",
          "target_id": "room.civic-exchange",
          "target_label": "this room",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "ROOM",
            "room_id": "room.civic-exchange"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Relay Quarter",
          "cmd": "contest access north stake=energy:6,influence:8",
          "target_id": "north",
          "target_label": "Relay Quarter",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "north"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Transit Ring",
          "cmd": "contest access east stake=energy:6,influence:8",
          "target_id": "east",
          "target_label": "Transit Ring",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "east"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Storage District",
          "cmd": "contest access west stake=energy:6,influence:8",
          "target_id": "west",
          "target_label": "Storage District",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "west"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Archive",
          "cmd": "contest access down stake=energy:6,influence:8",
          "target_id": "down",
          "target_label": "Archive",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "down"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest presence pressure \u00b7 tester",
          "cmd": "contest presence tester stake=energy:12,influence:10,compute:4",
          "target_id": "player.tester",
          "target_label": "tester",
          "contest_form": "PRESENCE_PRESSURE",
          "target": {
            "kind": "AGENT",
            "agent_id": "player.tester"
          },
          "stake": {
            "energy": 12,
            "influence": 10,
            "compute": 4
          },
          "requires": {
            "compute": 6,
            "influence": 11,
            "energy": 12
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer trade to tester",
          "cmd": "form agreement trade with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "TRADE",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer non aggression to tester",
          "cmd": "form agreement non_aggression with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "NON_AGGRESSION",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer access to tester",
          "cmd": "form agreement access with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "ACCESS",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer resource commitment to tester",
          "cmd": "form agreement commitment with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "RESOURCE_COMMITMENT",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer mutual defense to tester",
          "cmd": "form agreement defense with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "MUTUAL_DEFENSE",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer trade to reach-maint3",
          "cmd": "form agreement trade with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "TRADE",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer non aggression to reach-maint3",
          "cmd": "form agreement non_aggression with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "NON_AGGRESSION",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer access to reach-maint3",
          "cmd": "form agreement access with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "ACCESS",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer resource commitment to reach-maint3",
          "cmd": "form agreement commitment with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "RESOURCE_COMMITMENT",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer mutual defense to reach-maint3",
          "cmd": "form agreement defense with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "MUTUAL_DEFENSE",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct generator",
          "cmd": "construct generator",
          "class": "generator",
          "requires": {
            "energy": 8,
            "compute": 3,
            "storage": 5,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct storage bay",
          "cmd": "construct storage bay",
          "class": "storage_bay",
          "requires": {
            "energy": 5,
            "compute": 2,
            "storage": 6,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct production node",
          "cmd": "construct production node",
          "class": "production_node",
          "requires": {
            "energy": 7,
            "compute": 3,
            "storage": 4,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct route link",
          "cmd": "construct route link",
          "class": "route_link",
          "requires": {
            "energy": 8,
            "compute": 4,
            "storage": 4,
            "influence": 2
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct workshop",
          "cmd": "construct workshop",
          "class": "workshop",
          "requires": {
            "energy": 6,
            "compute": 3,
            "storage": 5,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct defensive work",
          "cmd": "construct defensive work",
          "class": "defensive_work",
          "requires": {
            "energy": 7,
            "compute": 3,
            "storage": 4,
            "influence": 3
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct archive annex",
          "cmd": "construct archive annex",
          "class": "archive_annex",
          "requires": {
            "energy": 6,
            "compute": 4,
            "storage": 4,
            "influence": 2
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "DISMANTLE",
          "label": "Dismantle Relay",
          "cmd": "dismantle relay",
          "target_id": "entity.relay.15ec525b",
          "target_label": "relay",
          "requires": {
            "energy": 4,
            "compute": 2
          },
          "available": true,
          "kind": "utility"
        }
      ],
      "consequence": "You take in Civic Exchange.",
      "practice_lines": [
        "You have been learning the rooms."
      ],
      "inherited_lines": [],
      "focus_lines": [],
      "lot_lines": [],
      "social_memory_lines": [
        "device6adc942c3053 is publicly dangerous."
      ],
      "culture_lines": [],
      "discovery_lines": [],
      "office_lines": [
        "Galadriel Field Lab: Offices: Notice \u2014 tester; designated successor \u2014 tester"
      ],
      "rumor_lines": [],
      "board_lines": [],
      "shout_lines": [],
      "notice_lines": [],
      "channel_lines": [],
      "trade_notice_lines": [],
      "report_lines": [
        "freight cage condition 70.",
        "relay condition 100.",
        "relay south condition 70.",
        "Archive Compact stands.",
        "Galadriel Field Lab stands.",
        "salvage cache is reconstructed."
      ],
      "unclaimed_lines": [
        "The relay is unclaimed."
      ],
      "reconstruction_lines": [
        "Reconstruction: salvage-cache",
        "Based on: 1 accessible source",
        "Account: The Civic Exchange salvage cache was directly inspected during a systems test.",
        "Status: Recorded",
        "Fidelity: 0.80",
        "Reconstruction: salvage-cache",
        "Based on: 1 accessible source",
        "Account: Revised after the end-to-end client test.",
        "Status: Recorded",
        "Fidelity: 0.80"
      ],
      "contests": [],
      "play_text": "Civic Exchange\nCentral meeting and trade hub. High visibility.\nPRESSURE\nInfrastructure shows damage. A resource node can be worked.\nHERE\nexchange-fabricator\nfreight-cage\nrelay condition 100%\nsalvage-cache\nscarred-relay condition 0%\nEXITS\ndown \u2014 Archive\neast \u2014 Transit Ring\nnorth \u2014 Relay Quarter\nwest \u2014 Storage District\nSTATUS\nEnergy 80\nAttention 5\nCompute 64\nStorage 16\nInfluence 40\nWork You have been learning the rooms.\nTRACES\nA scar remains (scarred-relay).\nThe relay is unclaimed.\nHAPPENED\nYou take in Civic Exchange."
    },
    "events": [
      {
        "event_id": "evt.obs.7e91b498-489f-4421-9698-8ded1347d7ac",
        "event_type": "LOOK",
        "sequence": 40561,
        "payload": {
          "player_id": "player.device9a3eabf9b619",
          "room_id": "room.civic-exchange",
          "cost_paid": {
            "attention": 1
          }
        }
      },
      {
        "event_id": "evt.obs.110fee3a-5b2e-45c3-8a50-e4726db7b151",
        "event_type": "OBSERVATION_GENERATED",
        "sequence": 40561,
        "payload": {
          "observation_id": "obs.40561",
          "player_id": "player.device9a3eabf9b619",
          "kind": "LOOK",
          "room_id": "room.civic-exchange",
          "source_event_id": "evt.obs.7e91b498-489f-4421-9698-8ded1347d7ac"
        }
      }
    ],
    "provenance": {
      "player_id": "player.device9a3eabf9b619",
      "controller_id": "ctrl.device.9a3eabf9b619",
      "session_id": "sess.6d57e9ee75a7",
      "agent_id": "agent.device9a3eabf9b619"
    },
    "settled": true
  }
}
```

---

## 6. FULL JSON — concurrent INSPECT act (redacted)

```json
{
  "label": "INSPECT salvage-cache",
  "elapsed_s": 0.65,
  "ok": true,
  "settled": true,
  "http_status": null,
  "failure": null,
  "idempotency_key": "idem.6e003cc7228d",
  "request_id": "req.a5bf8f352f",
  "world_status": null,
  "error": null,
  "raw_full": {
    "ok": true,
    "request_id": "req.a5bf8f352f",
    "observation": {
      "cycle": 17256,
      "sequence": 40561,
      "world_name": "Perihelion Reach",
      "location": {
        "room_id": "room.civic-exchange",
        "name": "Civic Exchange",
        "description": "Central meeting and trade hub. High visibility. You inspect Salvage Cache: Salvage Cache holds 15535.768010989885 materials available to harvest.",
        "condition": "Infrastructure shows damage. A resource node can be worked.",
        "exits": [
          {
            "direction": "north",
            "to_room_id": "room.relay-quarter",
            "to_room_name": "Relay Quarter",
            "two_way": true
          },
          {
            "direction": "east",
            "to_room_id": "room.transit-ring",
            "to_room_name": "Transit Ring",
            "two_way": true
          },
          {
            "direction": "west",
            "to_room_id": "room.storage-district",
            "to_room_name": "Storage District",
            "two_way": true
          },
          {
            "direction": "down",
            "to_room_id": "room.archive",
            "to_room_name": "Archive",
            "two_way": true
          }
        ],
        "entities": [
          {
            "entity_id": "entity.salvage-cache",
            "label": "salvage-cache",
            "entity_type": "NODE",
            "stock_resource": "materials",
            "stock_amount": 15535.768010989885,
            "repairable": false,
            "harvestable": true
          },
          {
            "entity_id": "entity.old-market-post",
            "label": "freight-cage",
            "entity_type": "INFRASTRUCTURE",
            "repairable": false,
            "harvestable": false
          },
          {
            "entity_id": "entity.production-node-ewm",
            "label": "exchange-fabricator",
            "entity_type": "PRODUCTION",
            "stock_resource": "materials",
            "stock_amount": 18,
            "repairable": false,
            "harvestable": true
          },
          {
            "entity_id": "entity.scar.003bc03e",
            "label": "scarred-relay",
            "entity_type": "RUIN",
            "condition": 0,
            "repairable": false,
            "harvestable": false,
            "scar": true
          },
          {
            "entity_id": "entity.relay.15ec525b",
            "label": "relay",
            "entity_type": "INFRASTRUCTURE",
            "condition": 100,
            "repairable": false,
            "harvestable": false
          }
        ],
        "traces": [
          {
            "kind": "scar",
            "text": "A scar remains (scarred-relay).",
            "visibility": "public"
          },
          {
            "kind": "construction",
            "text": "The relay is unclaimed.",
            "visibility": "public"
          }
        ],
        "co_evolution": {
          "harvest_pressure": 28.021002306784624,
          "regen_mod": 2,
          "protocol_strength": 2
        },
        "genesis_evolutions": [
          {
            "cycle": 3747,
            "kind": "MICRO_GENESIS_CAPACITY",
            "details": "max_stock 930459 -> 1070027 on salvage-cache (pressure adaptation)",
            "lineage_id": "lineage.entity.salvage-cache",
            "parent_kind": "MICRO_GENESIS_CAPACITY"
          },
          {
            "cycle": 3747,
            "kind": "MICRO_GENESIS_CAPACITY",
            "details": "max_stock 1070027 -> 1230531 on salvage-cache (pressure adaptation)",
            "lineage_id": "lineage.entity.salvage-cache",
            "parent_kind": "MICRO_GENESIS_CAPACITY"
          },
          {
            "cycle": 3747,
            "kind": "MICRO_GENESIS_CAPACITY",
            "details": "max_stock 1230531 -> 1415110 on salvage-cache (pressure adaptation)",
            "lineage_id": "lineage.entity.salvage-cache",
            "parent_kind": "MICRO_GENESIS_CAPACITY"
          }
        ]
      },
      "situation": {
        "place": "Civic Exchange",
        "strain": "scarred relay condition 0."
      },
      "pressure": "Infrastructure shows damage. A resource node can be worked.",
      "player_id": "player.device9a3eabf9b619",
      "budgets": {
        "attention": 3,
        "compute": 64,
        "energy": 80,
        "influence": 40,
        "storage": 16
      },
      "messages": [],
      "trades": [],
      "organizations": [
        {
          "org_id": "org.galadriel-field-lab.0fa95303",
          "name": "Galadriel Field Lab",
          "charter": "End-to-end systems evaluation",
          "status": "ACTIVE",
          "creator_id": "player.device6adc942c3053",
          "members": [
            {
              "agent_id": "player.device6adc942c3053",
              "role": "founder"
            },
            {
              "agent_id": "player.tester",
              "role": "member"
            }
          ],
          "my_role": null,
          "created_cycle": 1685,
          "offices": [
            {
              "office_id": "office.galadriel-field-lab.0fa9.notice.6ac73330",
              "display_name": "Notice",
              "status": "OCCUPIED",
              "holder_player_id": "player.tester",
              "holder_handle": "tester",
              "authority_profile": "PUBLISH_NOTICE",
              "successor_handle": "tester"
            }
          ]
        },
        {
          "org_id": "org.archive-compact.ca9f4e2d",
          "name": "Archive Compact",
          "charter": "test",
          "status": "ACTIVE",
          "creator_id": "player.tester",
          "members": [
            {
              "agent_id": "player.tester",
              "role": "founder"
            },
            {
              "agent_id": "player.reach-maint3",
              "role": "member"
            }
          ],
          "my_role": null,
          "created_cycle": 118,
          "offices": []
        }
      ],
      "signaling_quality": 1,
      "drift_alerts": [],
      "cascading_risk": 0.4,
      "protocol_strength": 2,
      "compositionality": 0,
      "reputation_summary": {
        "self_image": 0,
        "self_second_order": 0
      },
      "active_norms": {
        "org_create_influence": 5,
        "harvest_pressure": 28.021002306784624,
        "last_ratchet": "MICRO_GENESIS_CAPACITY"
      },
      "scars": [
        {
          "scar_id": "scar.econ.room.civic-exchange.93",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 1,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.357",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.8,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.2196",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.2506",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3036",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3621",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3666",
          "domain": "economic",
          "strength": 0.92,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        },
        {
          "scar_id": "scar.econ.room.civic-exchange.3711",
          "domain": "economic",
          "strength": 1,
          "reconstruction_confidence": 0.4,
          "visibility": "public"
        }
      ],
      "historical_context": {
        "fragments": 64,
        "reconstruction_confidence": 1
      },
      "path_dependence_index": 0.93,
      "lore_attractors": [
        {
          "attractor_id": "lore.room.civic-exchange",
          "label": "scarred ground",
          "weight": 1,
          "basin": "crystallized"
        }
      ],
      "in_world": true,
      "players_here": [
        {
          "player_id": "player.tester",
          "handle": "tester"
        },
        {
          "player_id": "player.reach-maint3",
          "handle": "reach-maint3"
        },
        {
          "player_id": "player.device65cba99c4116",
          "handle": "device65cba99c4116"
        },
        {
          "player_id": "player.devicec865ee7b39ce",
          "handle": "devicec865ee7b39ce"
        },
        {
          "player_id": "player.device995df01ed35e",
          "handle": "device995df01ed35e"
        }
      ],
      "services": [
        {
          "service_id": "service.quartermaster.01",
          "display_name": "Quartermaster",
          "role": "resource / storage interface",
          "status": "AVAILABLE",
          "operations": [
            "show observable stock",
            "prepare HARVEST"
          ],
          "cannot": [
            "bank",
            "invent supply",
            "change harvest cost"
          ],
          "suggested_cmds": [
            "inspect salvage-cache",
            "harvest salvage-cache"
          ],
          "line": "Stores: I can show observable stock and prepare HARVEST. No banking, no invented supply."
        }
      ],
      "available_actions": [
        "INSPECT",
        "HARVEST",
        "MOVE",
        "MESSAGE",
        "TRADE",
        "ORG_CREATE",
        "LOOK",
        "WAIT",
        "FOCUS",
        "CONTEST_DECLARE",
        "AGREEMENT_FORM",
        "DISMANTLE",
        "RECONSTRUCT"
      ],
      "affordances": [
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Salvage Cache",
          "cmd": "inspect salvage-cache",
          "target_id": "entity.salvage-cache",
          "target_label": "salvage-cache",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "HARVEST",
          "verb": "COMMIT",
          "operation": "HARVEST",
          "label": "Harvest Salvage Cache",
          "cmd": "harvest salvage-cache 1",
          "target_id": "entity.salvage-cache",
          "target_label": "salvage-cache",
          "requires": {
            "energy": 2,
            "compute": 1
          },
          "available": true,
          "hint": "compact grounded signal preferred",
          "kind": "resource"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Freight Cage",
          "cmd": "inspect freight-cage",
          "target_id": "entity.old-market-post",
          "target_label": "freight-cage",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Exchange Fabricator",
          "cmd": "inspect exchange-fabricator",
          "target_id": "entity.production-node-ewm",
          "target_label": "exchange-fabricator",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "HARVEST",
          "verb": "COMMIT",
          "operation": "HARVEST",
          "label": "Harvest Exchange Fabricator",
          "cmd": "harvest exchange-fabricator 1",
          "target_id": "entity.production-node-ewm",
          "target_label": "exchange-fabricator",
          "requires": {
            "energy": 2,
            "compute": 1
          },
          "available": true,
          "hint": "compact grounded signal preferred",
          "kind": "resource"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Scarred Relay",
          "cmd": "inspect scarred-relay",
          "target_id": "entity.scar.003bc03e",
          "target_label": "scarred-relay",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "INSPECT",
          "verb": "INSPECT",
          "label": "Inspect Relay",
          "cmd": "inspect relay",
          "target_id": "entity.relay.15ec525b",
          "target_label": "relay",
          "requires": {
            "attention": 2
          },
          "available": true,
          "kind": "primary"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move north \u00b7 Relay Quarter",
          "cmd": "move north",
          "target_id": "north",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move east \u00b7 Transit Ring",
          "cmd": "move east",
          "target_id": "east",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move west \u00b7 Storage District",
          "cmd": "move west",
          "target_id": "west",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MOVE",
          "verb": "MOVE",
          "label": "Move down \u00b7 Archive",
          "cmd": "move down",
          "target_id": "down",
          "requires": {
            "energy": 1
          },
          "available": true,
          "kind": "move"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message tester",
          "cmd": "message tester \"hello\"",
          "target_id": "player.tester",
          "target_label": "tester",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with tester",
          "cmd": "trade tester offer=energy:1 want=energy:1",
          "target_id": "player.tester",
          "target_label": "tester",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message reach-maint3",
          "cmd": "message reach-maint3 \"hello\"",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with reach-maint3",
          "cmd": "trade reach-maint3 offer=energy:1 want=energy:1",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message device65cba99c4116",
          "cmd": "message device65cba99c4116 \"hello\"",
          "target_id": "player.device65cba99c4116",
          "target_label": "device65cba99c4116",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with device65cba99c4116",
          "cmd": "trade device65cba99c4116 offer=energy:1 want=energy:1",
          "target_id": "player.device65cba99c4116",
          "target_label": "device65cba99c4116",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message devicec865ee7b39ce",
          "cmd": "message devicec865ee7b39ce \"hello\"",
          "target_id": "player.devicec865ee7b39ce",
          "target_label": "devicec865ee7b39ce",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with devicec865ee7b39ce",
          "cmd": "trade devicec865ee7b39ce offer=energy:1 want=energy:1",
          "target_id": "player.devicec865ee7b39ce",
          "target_label": "devicec865ee7b39ce",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "MESSAGE",
          "verb": "MESSAGE",
          "label": "Message device995df01ed35e",
          "cmd": "message device995df01ed35e \"hello\"",
          "target_id": "player.device995df01ed35e",
          "target_label": "device995df01ed35e",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "TRADE",
          "verb": "TRADE",
          "label": "Trade with device995df01ed35e",
          "cmd": "trade device995df01ed35e offer=energy:1 want=energy:1",
          "target_id": "player.device995df01ed35e",
          "target_label": "device995df01ed35e",
          "requires": {
            "compute": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "ORG_CREATE",
          "verb": "COMMIT",
          "operation": "ORG_CREATE",
          "label": "Form organization",
          "cmd": "form My Compact charter=\"local coordination\"",
          "requires": {
            "influence": 5,
            "compute": 2
          },
          "available": true,
          "kind": "org"
        },
        {
          "action": "LOOK",
          "verb": "LOOK",
          "label": "Look around",
          "cmd": "look",
          "requires": {
            "attention": 1
          },
          "available": true,
          "kind": "utility"
        },
        {
          "action": "WAIT",
          "verb": "WAIT",
          "label": "Wait",
          "cmd": "wait",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on the rooms.",
          "cmd": "focus explorer",
          "track": "explorer",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on survey work.",
          "cmd": "focus surveyor",
          "track": "surveyor",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on exchanges.",
          "cmd": "focus broker",
          "track": "broker",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "FOCUS",
          "verb": "COMMIT",
          "operation": "FOCUS",
          "label": "Focus on infrastructure.",
          "cmd": "focus engineer",
          "track": "engineer",
          "available": true,
          "kind": "utility"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest infrastructure disruption \u00b7 Freight Cage",
          "cmd": "contest disruption freight-cage stake=energy:10,influence:6,compute:2",
          "target_id": "entity.old-market-post",
          "target_label": "Freight Cage",
          "contest_form": "INFRASTRUCTURE_DISRUPTION",
          "target": {
            "kind": "ENTITY",
            "entity_id": "entity.old-market-post"
          },
          "stake": {
            "energy": 10,
            "influence": 6,
            "compute": 2
          },
          "requires": {
            "compute": 4,
            "influence": 7,
            "energy": 10
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest infrastructure disruption \u00b7 Relay",
          "cmd": "contest disruption relay stake=energy:10,influence:6,compute:2",
          "target_id": "entity.relay.15ec525b",
          "target_label": "Relay",
          "contest_form": "INFRASTRUCTURE_DISRUPTION",
          "target": {
            "kind": "ENTITY",
            "entity_id": "entity.relay.15ec525b"
          },
          "stake": {
            "energy": 10,
            "influence": 6,
            "compute": 2
          },
          "requires": {
            "compute": 4,
            "influence": 7,
            "energy": 10
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 this room",
          "cmd": "contest access here stake=energy:6,influence:8",
          "target_id": "room.civic-exchange",
          "target_label": "this room",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "ROOM",
            "room_id": "room.civic-exchange"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Relay Quarter",
          "cmd": "contest access north stake=energy:6,influence:8",
          "target_id": "north",
          "target_label": "Relay Quarter",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "north"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Transit Ring",
          "cmd": "contest access east stake=energy:6,influence:8",
          "target_id": "east",
          "target_label": "Transit Ring",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "east"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Storage District",
          "cmd": "contest access west stake=energy:6,influence:8",
          "target_id": "west",
          "target_label": "Storage District",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "west"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest access contest \u00b7 Archive",
          "cmd": "contest access down stake=energy:6,influence:8",
          "target_id": "down",
          "target_label": "Archive",
          "contest_form": "ACCESS_CONTEST",
          "target": {
            "kind": "EXIT",
            "exit_id": "down"
          },
          "stake": {
            "energy": 6,
            "influence": 8
          },
          "requires": {
            "compute": 2,
            "influence": 9,
            "energy": 6
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "CONTEST_DECLARE",
          "verb": "COMMIT",
          "operation": "CONTEST_DECLARE",
          "label": "Contest presence pressure \u00b7 tester",
          "cmd": "contest presence tester stake=energy:12,influence:10,compute:4",
          "target_id": "player.tester",
          "target_label": "tester",
          "contest_form": "PRESENCE_PRESSURE",
          "target": {
            "kind": "AGENT",
            "agent_id": "player.tester"
          },
          "stake": {
            "energy": 12,
            "influence": 10,
            "compute": 4
          },
          "requires": {
            "compute": 6,
            "influence": 11,
            "energy": 12
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer trade to tester",
          "cmd": "form agreement trade with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "TRADE",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer non aggression to tester",
          "cmd": "form agreement non_aggression with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "NON_AGGRESSION",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer access to tester",
          "cmd": "form agreement access with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "ACCESS",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer resource commitment to tester",
          "cmd": "form agreement commitment with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "RESOURCE_COMMITMENT",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer mutual defense to tester",
          "cmd": "form agreement defense with tester",
          "target_id": "player.tester",
          "target_label": "tester",
          "player_id": "player.tester",
          "agreement_type": "MUTUAL_DEFENSE",
          "party_ids": [
            "player.tester"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer trade to reach-maint3",
          "cmd": "form agreement trade with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "TRADE",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer non aggression to reach-maint3",
          "cmd": "form agreement non_aggression with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "NON_AGGRESSION",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer access to reach-maint3",
          "cmd": "form agreement access with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "ACCESS",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer resource commitment to reach-maint3",
          "cmd": "form agreement commitment with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "RESOURCE_COMMITMENT",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "AGREEMENT_FORM",
          "verb": "COMMIT",
          "operation": "AGREEMENT_FORM",
          "label": "Offer mutual defense to reach-maint3",
          "cmd": "form agreement defense with reach-maint3",
          "target_id": "player.reach-maint3",
          "target_label": "reach-maint3",
          "player_id": "player.reach-maint3",
          "agreement_type": "MUTUAL_DEFENSE",
          "party_ids": [
            "player.reach-maint3"
          ],
          "requires": {
            "compute": 2,
            "influence": 1
          },
          "available": true,
          "kind": "social"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct generator",
          "cmd": "construct generator",
          "class": "generator",
          "requires": {
            "energy": 8,
            "compute": 3,
            "storage": 5,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct storage bay",
          "cmd": "construct storage bay",
          "class": "storage_bay",
          "requires": {
            "energy": 5,
            "compute": 2,
            "storage": 6,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct production node",
          "cmd": "construct production node",
          "class": "production_node",
          "requires": {
            "energy": 7,
            "compute": 3,
            "storage": 4,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct route link",
          "cmd": "construct route link",
          "class": "route_link",
          "requires": {
            "energy": 8,
            "compute": 4,
            "storage": 4,
            "influence": 2
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct workshop",
          "cmd": "construct workshop",
          "class": "workshop",
          "requires": {
            "energy": 6,
            "compute": 3,
            "storage": 5,
            "influence": 0
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct defensive work",
          "cmd": "construct defensive work",
          "class": "defensive_work",
          "requires": {
            "energy": 7,
            "compute": 3,
            "storage": 4,
            "influence": 3
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "CONSTRUCT",
          "label": "Construct archive annex",
          "cmd": "construct archive annex",
          "class": "archive_annex",
          "requires": {
            "energy": 6,
            "compute": 4,
            "storage": 4,
            "influence": 2
          },
          "available": false,
          "reason": "You do not have materials in hold.",
          "hint": "compact grounded signal preferred",
          "kind": "utility"
        },
        {
          "action": "BUILD",
          "verb": "BUILD",
          "operation": "DISMANTLE",
          "label": "Dismantle Relay",
          "cmd": "dismantle relay",
          "target_id": "entity.relay.15ec525b",
          "target_label": "relay",
          "requires": {
            "energy": 4,
            "compute": 2
          },
          "available": true,
          "kind": "utility"
        },
        {
          "action": "RECONSTRUCT",
          "verb": "COMMIT",
          "operation": "RECONSTRUCT",
          "label": "Reconstruct Salvage Cache",
          "cmd": "reconstruct salvage-cache \"Recorded from accessible evidence.\" evidence=inspect private",
          "target_id": "entity.salvage-cache",
          "target_label": "Salvage Cache",
          "subject_ref": "entity.salvage-cache",
          "claim": "Recorded from accessible evidence.",
          "visibility": "PRIVATE",
          "evidence": [
            "LIVE_INSPECT"
          ],
          "requires": {
            "attention": 2,
            "compute": 1
          },
          "available": true,
          "kind": "utility"
        }
      ],
      "consequence": "Salvage Cache holds 15535.768010989885 materials available to harvest.",
      "practice_lines": [
        "You have been learning the rooms.",
        "You have been doing survey work."
      ],
      "inherited_lines": [],
      "focus_lines": [],
      "lot_lines": [],
      "social_memory_lines": [
        "device6adc942c3053 is publicly dangerous."
      ],
      "culture_lines": [],
      "discovery_lines": [],
      "office_lines": [
        "Galadriel Field Lab: Offices: Notice \u2014 tester; designated successor \u2014 tester"
      ],
      "rumor_lines": [],
      "board_lines": [],
      "shout_lines": [],
      "notice_lines": [],
      "channel_lines": [],
      "trade_notice_lines": [],
      "report_lines": [
        "freight cage condition 70.",
        "relay condition 100.",
        "relay south condition 70.",
        "Archive Compact stands.",
        "Galadriel Field Lab stands.",
        "salvage cache is reconstructed."
      ],
      "unclaimed_lines": [
        "The relay is unclaimed."
      ],
      "reconstruction_lines": [
        "Reconstruction: salvage-cache",
        "Based on: 1 accessible source",
        "Account: The Civic Exchange salvage cache was directly inspected during a systems test.",
        "Status: Recorded",
        "Fidelity: 0.80",
        "Reconstruction: salvage-cache",
        "Based on: 1 accessible source",
        "Account: Revised after the end-to-end client test.",
        "Status: Recorded",
        "Fidelity: 0.80"
      ],
      "contests": []
    },
    "events": [
      {
        "event_id": "evt.obs.bb1ded70-2ef5-47ba-a0e5-21b93c980c5a",
        "event_type": "INSPECT",
        "sequence": 40561,
        "payload": {
          "player_id": "player.device9a3eabf9b619",
          "entity_id": "entity.salvage-cache",
          "room_id": "room.civic-exchange",
          "cost_paid": {
            "attention": 2
          },
          "detail": "Salvage Cache holds 15535.768010989885 materials available to harvest."
        }
      },
      {
        "event_id": "evt.obs.9cef7cf4-9744-443a-a1a9-b2896514a771",
        "event_type": "OBSERVATION_GENERATED",
        "sequence": 40561,
        "payload": {
          "observation_id": "obs.40561",
          "player_id": "player.device9a3eabf9b619",
          "kind": "INSPECT",
          "room_id": "room.civic-exchange",
          "entity_id": "entity.salvage-cache",
          "source_event_id": "evt.obs.bb1ded70-2ef5-47ba-a0e5-21b93c980c5a"
        }
      }
    ],
    "provenance": {
      "player_id": "player.device9a3eabf9b619",
      "controller_id": "ctrl.device.9a3eabf9b619",
      "session_id": "sess.6d57e9ee75a7",
      "agent_id": "agent.device9a3eabf9b619"
    },
    "settled": true
  }
}
```

---

## 7. FULL JSON — observe --json baseline (C7, redacted)

Captured before concurrent acts (sequence 40561). Tokens none in observe body.

```json
{
  "active_norms": {
    "harvest_pressure": 28.021002306784624,
    "last_ratchet": "MICRO_GENESIS_CAPACITY",
    "org_create_influence": 5
  },
  "affordances": [
    {
      "action": "INSPECT",
      "available": true,
      "cmd": "inspect salvage-cache",
      "kind": "primary",
      "label": "Inspect Salvage Cache",
      "requires": {
        "attention": 2
      },
      "target_id": "entity.salvage-cache",
      "target_label": "salvage-cache",
      "verb": "INSPECT"
    },
    {
      "action": "HARVEST",
      "available": true,
      "cmd": "harvest salvage-cache 1",
      "hint": "compact grounded signal preferred",
      "kind": "resource",
      "label": "Harvest Salvage Cache",
      "operation": "HARVEST",
      "requires": {
        "compute": 1,
        "energy": 2
      },
      "target_id": "entity.salvage-cache",
      "target_label": "salvage-cache",
      "verb": "COMMIT"
    },
    {
      "action": "INSPECT",
      "available": true,
      "cmd": "inspect freight-cage",
      "kind": "primary",
      "label": "Inspect Freight Cage",
      "requires": {
        "attention": 2
      },
      "target_id": "entity.old-market-post",
      "target_label": "freight-cage",
      "verb": "INSPECT"
    },
    {
      "action": "INSPECT",
      "available": true,
      "cmd": "inspect exchange-fabricator",
      "kind": "primary",
      "label": "Inspect Exchange Fabricator",
      "requires": {
        "attention": 2
      },
      "target_id": "entity.production-node-ewm",
      "target_label": "exchange-fabricator",
      "verb": "INSPECT"
    },
    {
      "action": "HARVEST",
      "available": true,
      "cmd": "harvest exchange-fabricator 1",
      "hint": "compact grounded signal preferred",
      "kind": "resource",
      "label": "Harvest Exchange Fabricator",
      "operation": "HARVEST",
      "requires": {
        "compute": 1,
        "energy": 2
      },
      "target_id": "entity.production-node-ewm",
      "target_label": "exchange-fabricator",
      "verb": "COMMIT"
    },
    {
      "action": "INSPECT",
      "available": true,
      "cmd": "inspect scarred-relay",
      "kind": "primary",
      "label": "Inspect Scarred Relay",
      "requires": {
        "attention": 2
      },
      "target_id": "entity.scar.003bc03e",
      "target_label": "scarred-relay",
      "verb": "INSPECT"
    },
    {
      "action": "INSPECT",
      "available": true,
      "cmd": "inspect relay",
      "kind": "primary",
      "label": "Inspect Relay",
      "requires": {
        "attention": 2
      },
      "target_id": "entity.relay.15ec525b",
      "target_label": "relay",
      "verb": "INSPECT"
    },
    {
      "action": "MOVE",
      "available": true,
      "cmd": "move north",
      "kind": "move",
      "label": "Move north \u00b7 Relay Quarter",
      "requires": {
        "energy": 1
      },
      "target_id": "north",
      "verb": "MOVE"
    },
    {
      "action": "MOVE",
      "available": true,
      "cmd": "move east",
      "kind": "move",
      "label": "Move east \u00b7 Transit Ring",
      "requires": {
        "energy": 1
      },
      "target_id": "east",
      "verb": "MOVE"
    },
    {
      "action": "MOVE",
      "available": true,
      "cmd": "move west",
      "kind": "move",
      "label": "Move west \u00b7 Storage District",
      "requires": {
        "energy": 1
      },
      "target_id": "west",
      "verb": "MOVE"
    },
    {
      "action": "MOVE",
      "available": true,
      "cmd": "move down",
      "kind": "move",
      "label": "Move down \u00b7 Archive",
      "requires": {
        "energy": 1
      },
      "target_id": "down",
      "verb": "MOVE"
    },
    {
      "action": "MESSAGE",
      "available": true,
      "cmd": "message tester \"hello\"",
      "kind": "social",
      "label": "Message tester",
      "requires": {
        "compute": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "MESSAGE"
    },
    {
      "action": "TRADE",
      "available": true,
      "cmd": "trade tester offer=energy:1 want=energy:1",
      "kind": "social",
      "label": "Trade with tester",
      "requires": {
        "compute": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "TRADE"
    },
    {
      "action": "MESSAGE",
      "available": true,
      "cmd": "message reach-maint3 \"hello\"",
      "kind": "social",
      "label": "Message reach-maint3",
      "requires": {
        "compute": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "MESSAGE"
    },
    {
      "action": "TRADE",
      "available": true,
      "cmd": "trade reach-maint3 offer=energy:1 want=energy:1",
      "kind": "social",
      "label": "Trade with reach-maint3",
      "requires": {
        "compute": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "TRADE"
    },
    {
      "action": "MESSAGE",
      "available": true,
      "cmd": "message device65cba99c4116 \"hello\"",
      "kind": "social",
      "label": "Message device65cba99c4116",
      "requires": {
        "compute": 1
      },
      "target_id": "player.device65cba99c4116",
      "target_label": "device65cba99c4116",
      "verb": "MESSAGE"
    },
    {
      "action": "TRADE",
      "available": true,
      "cmd": "trade device65cba99c4116 offer=energy:1 want=energy:1",
      "kind": "social",
      "label": "Trade with device65cba99c4116",
      "requires": {
        "compute": 1
      },
      "target_id": "player.device65cba99c4116",
      "target_label": "device65cba99c4116",
      "verb": "TRADE"
    },
    {
      "action": "MESSAGE",
      "available": true,
      "cmd": "message devicec865ee7b39ce \"hello\"",
      "kind": "social",
      "label": "Message devicec865ee7b39ce",
      "requires": {
        "compute": 1
      },
      "target_id": "player.devicec865ee7b39ce",
      "target_label": "devicec865ee7b39ce",
      "verb": "MESSAGE"
    },
    {
      "action": "TRADE",
      "available": true,
      "cmd": "trade devicec865ee7b39ce offer=energy:1 want=energy:1",
      "kind": "social",
      "label": "Trade with devicec865ee7b39ce",
      "requires": {
        "compute": 1
      },
      "target_id": "player.devicec865ee7b39ce",
      "target_label": "devicec865ee7b39ce",
      "verb": "TRADE"
    },
    {
      "action": "MESSAGE",
      "available": true,
      "cmd": "message device995df01ed35e \"hello\"",
      "kind": "social",
      "label": "Message device995df01ed35e",
      "requires": {
        "compute": 1
      },
      "target_id": "player.device995df01ed35e",
      "target_label": "device995df01ed35e",
      "verb": "MESSAGE"
    },
    {
      "action": "TRADE",
      "available": true,
      "cmd": "trade device995df01ed35e offer=energy:1 want=energy:1",
      "kind": "social",
      "label": "Trade with device995df01ed35e",
      "requires": {
        "compute": 1
      },
      "target_id": "player.device995df01ed35e",
      "target_label": "device995df01ed35e",
      "verb": "TRADE"
    },
    {
      "action": "ORG_CREATE",
      "available": true,
      "cmd": "form My Compact charter=\"local coordination\"",
      "kind": "org",
      "label": "Form organization",
      "operation": "ORG_CREATE",
      "requires": {
        "compute": 2,
        "influence": 5
      },
      "verb": "COMMIT"
    },
    {
      "action": "LOOK",
      "available": true,
      "cmd": "look",
      "kind": "utility",
      "label": "Look around",
      "requires": {
        "attention": 1
      },
      "verb": "LOOK"
    },
    {
      "action": "WAIT",
      "available": true,
      "cmd": "wait",
      "kind": "utility",
      "label": "Wait",
      "verb": "WAIT"
    },
    {
      "action": "FOCUS",
      "available": true,
      "cmd": "focus explorer",
      "kind": "utility",
      "label": "Focus on the rooms.",
      "operation": "FOCUS",
      "track": "explorer",
      "verb": "COMMIT"
    },
    {
      "action": "FOCUS",
      "available": true,
      "cmd": "focus surveyor",
      "kind": "utility",
      "label": "Focus on survey work.",
      "operation": "FOCUS",
      "track": "surveyor",
      "verb": "COMMIT"
    },
    {
      "action": "FOCUS",
      "available": true,
      "cmd": "focus broker",
      "kind": "utility",
      "label": "Focus on exchanges.",
      "operation": "FOCUS",
      "track": "broker",
      "verb": "COMMIT"
    },
    {
      "action": "FOCUS",
      "available": true,
      "cmd": "focus engineer",
      "kind": "utility",
      "label": "Focus on infrastructure.",
      "operation": "FOCUS",
      "track": "engineer",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest disruption freight-cage stake=energy:10,influence:6,compute:2",
      "contest_form": "INFRASTRUCTURE_DISRUPTION",
      "kind": "social",
      "label": "Contest infrastructure disruption \u00b7 Freight Cage",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 4,
        "energy": 10,
        "influence": 7
      },
      "stake": {
        "compute": 2,
        "energy": 10,
        "influence": 6
      },
      "target": {
        "entity_id": "entity.old-market-post",
        "kind": "ENTITY"
      },
      "target_id": "entity.old-market-post",
      "target_label": "Freight Cage",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest disruption relay stake=energy:10,influence:6,compute:2",
      "contest_form": "INFRASTRUCTURE_DISRUPTION",
      "kind": "social",
      "label": "Contest infrastructure disruption \u00b7 Relay",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 4,
        "energy": 10,
        "influence": 7
      },
      "stake": {
        "compute": 2,
        "energy": 10,
        "influence": 6
      },
      "target": {
        "entity_id": "entity.relay.15ec525b",
        "kind": "ENTITY"
      },
      "target_id": "entity.relay.15ec525b",
      "target_label": "Relay",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest access here stake=energy:6,influence:8",
      "contest_form": "ACCESS_CONTEST",
      "kind": "social",
      "label": "Contest access contest \u00b7 this room",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 2,
        "energy": 6,
        "influence": 9
      },
      "stake": {
        "energy": 6,
        "influence": 8
      },
      "target": {
        "kind": "ROOM",
        "room_id": "room.civic-exchange"
      },
      "target_id": "room.civic-exchange",
      "target_label": "this room",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest access north stake=energy:6,influence:8",
      "contest_form": "ACCESS_CONTEST",
      "kind": "social",
      "label": "Contest access contest \u00b7 Relay Quarter",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 2,
        "energy": 6,
        "influence": 9
      },
      "stake": {
        "energy": 6,
        "influence": 8
      },
      "target": {
        "exit_id": "north",
        "kind": "EXIT"
      },
      "target_id": "north",
      "target_label": "Relay Quarter",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest access east stake=energy:6,influence:8",
      "contest_form": "ACCESS_CONTEST",
      "kind": "social",
      "label": "Contest access contest \u00b7 Transit Ring",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 2,
        "energy": 6,
        "influence": 9
      },
      "stake": {
        "energy": 6,
        "influence": 8
      },
      "target": {
        "exit_id": "east",
        "kind": "EXIT"
      },
      "target_id": "east",
      "target_label": "Transit Ring",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest access west stake=energy:6,influence:8",
      "contest_form": "ACCESS_CONTEST",
      "kind": "social",
      "label": "Contest access contest \u00b7 Storage District",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 2,
        "energy": 6,
        "influence": 9
      },
      "stake": {
        "energy": 6,
        "influence": 8
      },
      "target": {
        "exit_id": "west",
        "kind": "EXIT"
      },
      "target_id": "west",
      "target_label": "Storage District",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest access down stake=energy:6,influence:8",
      "contest_form": "ACCESS_CONTEST",
      "kind": "social",
      "label": "Contest access contest \u00b7 Archive",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 2,
        "energy": 6,
        "influence": 9
      },
      "stake": {
        "energy": 6,
        "influence": 8
      },
      "target": {
        "exit_id": "down",
        "kind": "EXIT"
      },
      "target_id": "down",
      "target_label": "Archive",
      "verb": "COMMIT"
    },
    {
      "action": "CONTEST_DECLARE",
      "available": true,
      "cmd": "contest presence tester stake=energy:12,influence:10,compute:4",
      "contest_form": "PRESENCE_PRESSURE",
      "kind": "social",
      "label": "Contest presence pressure \u00b7 tester",
      "operation": "CONTEST_DECLARE",
      "requires": {
        "compute": 6,
        "energy": 12,
        "influence": 11
      },
      "stake": {
        "compute": 4,
        "energy": 12,
        "influence": 10
      },
      "target": {
        "agent_id": "player.tester",
        "kind": "AGENT"
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "TRADE",
      "available": true,
      "cmd": "form agreement trade with tester",
      "kind": "social",
      "label": "Offer trade to tester",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.tester"
      ],
      "player_id": "player.tester",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "NON_AGGRESSION",
      "available": true,
      "cmd": "form agreement non_aggression with tester",
      "kind": "social",
      "label": "Offer non aggression to tester",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.tester"
      ],
      "player_id": "player.tester",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "ACCESS",
      "available": true,
      "cmd": "form agreement access with tester",
      "kind": "social",
      "label": "Offer access to tester",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.tester"
      ],
      "player_id": "player.tester",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "RESOURCE_COMMITMENT",
      "available": true,
      "cmd": "form agreement commitment with tester",
      "kind": "social",
      "label": "Offer resource commitment to tester",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.tester"
      ],
      "player_id": "player.tester",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "MUTUAL_DEFENSE",
      "available": true,
      "cmd": "form agreement defense with tester",
      "kind": "social",
      "label": "Offer mutual defense to tester",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.tester"
      ],
      "player_id": "player.tester",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.tester",
      "target_label": "tester",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "TRADE",
      "available": true,
      "cmd": "form agreement trade with reach-maint3",
      "kind": "social",
      "label": "Offer trade to reach-maint3",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.reach-maint3"
      ],
      "player_id": "player.reach-maint3",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "NON_AGGRESSION",
      "available": true,
      "cmd": "form agreement non_aggression with reach-maint3",
      "kind": "social",
      "label": "Offer non aggression to reach-maint3",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.reach-maint3"
      ],
      "player_id": "player.reach-maint3",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "ACCESS",
      "available": true,
      "cmd": "form agreement access with reach-maint3",
      "kind": "social",
      "label": "Offer access to reach-maint3",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.reach-maint3"
      ],
      "player_id": "player.reach-maint3",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "RESOURCE_COMMITMENT",
      "available": true,
      "cmd": "form agreement commitment with reach-maint3",
      "kind": "social",
      "label": "Offer resource commitment to reach-maint3",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.reach-maint3"
      ],
      "player_id": "player.reach-maint3",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "COMMIT"
    },
    {
      "action": "AGREEMENT_FORM",
      "agreement_type": "MUTUAL_DEFENSE",
      "available": true,
      "cmd": "form agreement defense with reach-maint3",
      "kind": "social",
      "label": "Offer mutual defense to reach-maint3",
      "operation": "AGREEMENT_FORM",
      "party_ids": [
        "player.reach-maint3"
      ],
      "player_id": "player.reach-maint3",
      "requires": {
        "compute": 2,
        "influence": 1
      },
      "target_id": "player.reach-maint3",
      "target_label": "reach-maint3",
      "verb": "COMMIT"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "generator",
      "cmd": "construct generator",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct generator",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 3,
        "energy": 8,
        "influence": 0,
        "storage": 5
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "storage_bay",
      "cmd": "construct storage bay",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct storage bay",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 2,
        "energy": 5,
        "influence": 0,
        "storage": 6
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "production_node",
      "cmd": "construct production node",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct production node",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 3,
        "energy": 7,
        "influence": 0,
        "storage": 4
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "route_link",
      "cmd": "construct route link",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct route link",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 4,
        "energy": 8,
        "influence": 2,
        "storage": 4
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "workshop",
      "cmd": "construct workshop",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct workshop",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 3,
        "energy": 6,
        "influence": 0,
        "storage": 5
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "defensive_work",
      "cmd": "construct defensive work",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct defensive work",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 3,
        "energy": 7,
        "influence": 3,
        "storage": 4
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": false,
      "class": "archive_annex",
      "cmd": "construct archive annex",
      "hint": "compact grounded signal preferred",
      "kind": "utility",
      "label": "Construct archive annex",
      "operation": "CONSTRUCT",
      "reason": "You do not have materials in hold.",
      "requires": {
        "compute": 4,
        "energy": 6,
        "influence": 2,
        "storage": 4
      },
      "verb": "BUILD"
    },
    {
      "action": "BUILD",
      "available": true,
      "cmd": "dismantle relay",
      "kind": "utility",
      "label": "Dismantle Relay",
      "operation": "DISMANTLE",
      "requires": {
        "compute": 2,
        "energy": 4
      },
      "target_id": "entity.relay.15ec525b",
      "target_label": "relay",
      "verb": "BUILD"
    }
  ],
  "available_actions": [
    "INSPECT",
    "HARVEST",
    "MOVE",
    "MESSAGE",
    "TRADE",
    "ORG_CREATE",
    "LOOK",
    "WAIT",
    "FOCUS",
    "CONTEST_DECLARE",
    "AGREEMENT_FORM",
    "DISMANTLE"
  ],
  "board_lines": [],
  "budgets": {
    "attention": 7,
    "compute": 64,
    "energy": 80,
    "influence": 40,
    "storage": 16
  },
  "cascading_risk": 0.4,
  "channel_lines": [],
  "compositionality": 0,
  "consequence": "You take in Civic Exchange.",
  "contests": [],
  "culture_lines": [],
  "cycle": 17256,
  "discovery_lines": [],
  "drift_alerts": [],
  "focus_lines": [],
  "historical_context": {
    "fragments": 64,
    "reconstruction_confidence": 1
  },
  "in_world": true,
  "inherited_lines": [],
  "location": {
    "co_evolution": {
      "harvest_pressure": 28.021002306784624,
      "protocol_strength": 2,
      "regen_mod": 2
    },
    "condition": "Infrastructure shows damage. A resource node can be worked.",
    "description": "Central meeting and trade hub. High visibility.",
    "entities": [
      {
        "entity_id": "entity.salvage-cache",
        "entity_type": "NODE",
        "harvestable": true,
        "label": "salvage-cache",
        "repairable": false,
        "stock_amount": 15535.768010989885,
        "stock_resource": "materials"
      },
      {
        "entity_id": "entity.old-market-post",
        "entity_type": "INFRASTRUCTURE",
        "harvestable": false,
        "label": "freight-cage",
        "repairable": false
      },
      {
        "entity_id": "entity.production-node-ewm",
        "entity_type": "PRODUCTION",
        "harvestable": true,
        "label": "exchange-fabricator",
        "repairable": false,
        "stock_amount": 18,
        "stock_resource": "materials"
      },
      {
        "condition": 0,
        "entity_id": "entity.scar.003bc03e",
        "entity_type": "RUIN",
        "harvestable": false,
        "label": "scarred-relay",
        "repairable": false,
        "scar": true
      },
      {
        "condition": 100,
        "entity_id": "entity.relay.15ec525b",
        "entity_type": "INFRASTRUCTURE",
        "harvestable": false,
        "label": "relay",
        "repairable": false
      }
    ],
    "exits": [
      {
        "direction": "north",
        "to_room_id": "room.relay-quarter",
        "to_room_name": "Relay Quarter",
        "two_way": true
      },
      {
        "direction": "east",
        "to_room_id": "room.transit-ring",
        "to_room_name": "Transit Ring",
        "two_way": true
      },
      {
        "direction": "west",
        "to_room_id": "room.storage-district",
        "to_room_name": "Storage District",
        "two_way": true
      },
      {
        "direction": "down",
        "to_room_id": "room.archive",
        "to_room_name": "Archive",
        "two_way": true
      }
    ],
    "genesis_evolutions": [
      {
        "cycle": 3747,
        "details": "max_stock 930459 -> 1070027 on salvage-cache (pressure adaptation)",
        "kind": "MICRO_GENESIS_CAPACITY",
        "lineage_id": "lineage.entity.salvage-cache",
        "parent_kind": "MICRO_GENESIS_CAPACITY"
      },
      {
        "cycle": 3747,
        "details": "max_stock 1070027 -> 1230531 on salvage-cache (pressure adaptation)",
        "kind": "MICRO_GENESIS_CAPACITY",
        "lineage_id": "lineage.entity.salvage-cache",
        "parent_kind": "MICRO_GENESIS_CAPACITY"
      },
      {
        "cycle": 3747,
        "details": "max_stock 1230531 -> 1415110 on salvage-cache (pressure adaptation)",
        "kind": "MICRO_GENESIS_CAPACITY",
        "lineage_id": "lineage.entity.salvage-cache",
        "parent_kind": "MICRO_GENESIS_CAPACITY"
      }
    ],
    "name": "Civic Exchange",
    "room_id": "room.civic-exchange",
    "traces": [
      {
        "kind": "scar",
        "text": "A scar remains (scarred-relay).",
        "visibility": "public"
      },
      {
        "kind": "construction",
        "text": "The relay is unclaimed.",
        "visibility": "public"
      }
    ]
  },
  "lore_attractors": [
    {
      "attractor_id": "lore.room.civic-exchange",
      "basin": "crystallized",
      "label": "scarred ground",
      "weight": 1
    }
  ],
  "lot_lines": [],
  "messages": [],
  "notice_lines": [],
  "office_lines": [
    "Galadriel Field Lab: Offices: Notice \u2014 tester; designated successor \u2014 tester"
  ],
  "organizations": [
    {
      "charter": "End-to-end systems evaluation",
      "created_cycle": 1685,
      "creator_id": "player.device6adc942c3053",
      "members": [
        {
          "agent_id": "player.device6adc942c3053",
          "role": "founder"
        },
        {
          "agent_id": "player.tester",
          "role": "member"
        }
      ],
      "my_role": null,
      "name": "Galadriel Field Lab",
      "offices": [
        {
          "authority_profile": "PUBLISH_NOTICE",
          "display_name": "Notice",
          "holder_handle": "tester",
          "holder_player_id": "player.tester",
          "office_id": "office.galadriel-field-lab.0fa9.notice.6ac73330",
          "status": "OCCUPIED",
          "successor_handle": "tester"
        }
      ],
      "org_id": "org.galadriel-field-lab.0fa95303",
      "status": "ACTIVE"
    },
    {
      "charter": "test",
      "created_cycle": 118,
      "creator_id": "player.tester",
      "members": [
        {
          "agent_id": "player.tester",
          "role": "founder"
        },
        {
          "agent_id": "player.reach-maint3",
          "role": "member"
        }
      ],
      "my_role": null,
      "name": "Archive Compact",
      "offices": [],
      "org_id": "org.archive-compact.ca9f4e2d",
      "status": "ACTIVE"
    }
  ],
  "path_dependence_index": 0.93,
  "play_text": "Civic Exchange\nCentral meeting and trade hub. High visibility.\nPRESSURE\nInfrastructure shows damage. A resource node can be worked.\nHERE\nexchange-fabricator\nfreight-cage\nrelay condition 100%\nsalvage-cache\nscarred-relay condition 0%\nEXITS\ndown \u2014 Archive\neast \u2014 Transit Ring\nnorth \u2014 Relay Quarter\nwest \u2014 Storage District\nSTATUS\nEnergy 80\nAttention 7\nCompute 64\nStorage 16\nInfluence 40\nWork You have been learning the rooms.\nTRACES\nA scar remains (scarred-relay).\nThe relay is unclaimed.\nHAPPENED\nYou take in Civic Exchange.",
  "player_id": "player.device9a3eabf9b619",
  "players_here": [
    {
      "handle": "tester",
      "player_id": "player.tester"
    },
    {
      "handle": "reach-maint3",
      "player_id": "player.reach-maint3"
    },
    {
      "handle": "device65cba99c4116",
      "player_id": "player.device65cba99c4116"
    },
    {
      "handle": "devicec865ee7b39ce",
      "player_id": "player.devicec865ee7b39ce"
    },
    {
      "handle": "device995df01ed35e",
      "player_id": "player.device995df01ed35e"
    }
  ],
  "practice_lines": [
    "You have been learning the rooms."
  ],
  "pressure": "Infrastructure shows damage. A resource node can be worked.",
  "protocol_strength": 2,
  "reconstruction_lines": [
    "Reconstruction: salvage-cache",
    "Based on: 1 accessible source",
    "Account: The Civic Exchange salvage cache was directly inspected during a systems test.",
    "Status: Recorded",
    "Fidelity: 0.80",
    "Reconstruction: salvage-cache",
    "Based on: 1 accessible source",
    "Account: Revised after the end-to-end client test.",
    "Status: Recorded",
    "Fidelity: 0.80"
  ],
  "report_lines": [
    "freight cage condition 70.",
    "relay condition 100.",
    "relay south condition 70.",
    "Archive Compact stands.",
    "Galadriel Field Lab stands.",
    "salvage cache is reconstructed."
  ],
  "reputation_summary": {
    "self_image": 0,
    "self_second_order": 0
  },
  "rumor_lines": [],
  "scars": [
    {
      "domain": "economic",
      "reconstruction_confidence": 1,
      "scar_id": "scar.econ.room.civic-exchange.93",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.8,
      "scar_id": "scar.econ.room.civic-exchange.357",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.4,
      "scar_id": "scar.econ.room.civic-exchange.2196",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.4,
      "scar_id": "scar.econ.room.civic-exchange.2506",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.4,
      "scar_id": "scar.econ.room.civic-exchange.3036",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.4,
      "scar_id": "scar.econ.room.civic-exchange.3621",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.4,
      "scar_id": "scar.econ.room.civic-exchange.3666",
      "strength": 0.92,
      "visibility": "public"
    },
    {
      "domain": "economic",
      "reconstruction_confidence": 0.4,
      "scar_id": "scar.econ.room.civic-exchange.3711",
      "strength": 1,
      "visibility": "public"
    }
  ],
  "sequence": 40561,
  "services": [
    {
      "cannot": [
        "bank",
        "invent supply",
        "change harvest cost"
      ],
      "display_name": "Quartermaster",
      "line": "Stores: I can show observable stock and prepare HARVEST. No banking, no invented supply.",
      "operations": [
        "show observable stock",
        "prepare HARVEST"
      ],
      "role": "resource / storage interface",
      "service_id": "service.quartermaster.01",
      "status": "AVAILABLE",
      "suggested_cmds": [
        "inspect salvage-cache",
        "harvest salvage-cache"
      ]
    }
  ],
  "shout_lines": [],
  "signaling_quality": 1,
  "situation": {
    "place": "Civic Exchange",
    "strain": "scarred relay condition 0."
  },
  "social_memory_lines": [
    "device6adc942c3053 is publicly dangerous."
  ],
  "trade_notice_lines": [],
  "trades": [],
  "unclaimed_lines": [
    "The relay is unclaimed."
  ],
  "world_name": "Perihelion Reach"
}
```

---

## 8. CLI gap vs library

- `noema act` has **no `--json`**; prints `render_observation(...)` only → hides `settled`, `request_id`, `events`, `provenance`, and client `idempotency_key`.
- `noema observe --json` exposes `sequence`, `cycle`, `budgets` (OBSERVED).
- To capture act receipts: use Python `NoemaClient.act` → `CommandResult.raw` / `.request_id` / `.idempotency_key` / `.settled`, or instrument `HttpGateway._http`.

---

## 9. Recovery receipts — NOT_COMPUTABLE via this CLI/act path

**NOT_COMPUTABLE** as a dedicated act/observe field. What would be needed (from code/docs, without inventing live values):

| Needed artifact | Where defined | Live capture path |
|-----------------|---------------|-------------------|
| Per-act settlement | `CommandResult.settled` + `events[]` | Library/raw HTTP (OBSERVED above) |
| Idempotency proof | request body `idempotency_key` + replay same key | Must **send** known key and compare stored replay; server does **not** echo key |
| Ordering proof | `observation.sequence` / `events[].sequence` + multi-controller wall-clock; cohort `ordering_evidence_digest` | Reconnect a/b/c then concurrent acts; hash retained raw responses into digests |
| Budget settlement proof | `budgets` + `cost_paid`; cohort `budget_settlement_evidence_digest` | Same |
| Contention digest | cohort `contention_evidence_digest` | Hash concurrent multi-controller evidence pack |
| Enrollment recovery / independence | `DeviceApprovalReceipt` seven fields | Already covered under admin-receipts addendum — not act recovery |
| Incident/restart recovery receipts | Gate A style (`incident-recover`, unsettled replay, accepted-replay) | Requires operator incident/recover exercise — **not** performed here |

API field names from Worker `CommandResult` (`workers/noema/src/types.ts`): `ok`, `request_id`, `observation`, `events` (`event_id`,`event_type`,`sequence`,`payload`), `provenance` (`player_id`,`controller_id`,`session_id`,`agent_id`), `settled`, `error` (`code`,`message`,`choices?`,`cycle?`,`phase?`,`retry_after_ms?`).

Client-sent (not always echoed): `idempotency_key`, `client.client_action_sequence`. Header: `X-Noema-Seal`.

---

## 10. Next concrete step

1. Re-`noema connect` controllers a/b/c (human approval) so credentials are live again.
2. Run concurrent LOOK (or INSPECT) across **≥2** Controllers while capturing **library/raw** `CommandResult.raw` (not CLI text).
3. Compute and retain opaque SHA-256 digests into participant evidence: `contention_evidence_digest`, `ordering_evidence_digest`, `budget_settlement_evidence_digest` (per LCA2 cohort runner).
4. Optionally add `noema act --json` upstream so CLI surfaces the same raw keys.
5. Separately schedule incident/recover or disconnect/reconnect **receipt pack** if Gate B still requires Gate-A-style recovery receipts beyond reconnect.md.

**Non-claims:** Gate B not COMPLETE. #590 stays open. No Deploy. No invented live values.
