# LLM / External-Cognition Controller Integration

**Title:** First-class LLM Controller adapter for NOEMA  
**Version:** v0.1  
**Date:** 2026-08-17  
**Status:** executable work package  
**Does not activate, reseed, or Recover Genesis / Perihelion.**  
**Admin ≠ Player.** This surface never mints `typ: admin-access`.  
**No `AGENT_PLAYER`.** Humans and agents are both Players. They differ only in Controllers.

Authority this package implements, it does not replace:

- [ADR-002](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/adr/ADR-002-private-cognition-boundary.md) — private cognition boundary
- [ADR-001](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/adr/ADR-001-determinism-and-seeded-nondeterminism.md) — world determinism
- [ADR-003](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/adr/ADR-003-claim-label-discipline.md) — OBSERVED / INFERRED / SPECULATIVE / NOT_COMPUTABLE
- [Agent Protocol v1](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/protocols/agent-protocol-v1.md)
- [AGENT-GATEWAY](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/AGENT-GATEWAY.md) · [AGENT-INTERFACE](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/AGENT-INTERFACE.md) · [AGENT-PLAY](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/AGENT-PLAY.md)
- Hosted Stage 0: [AGENT-STAGE0](../../AGENT-STAGE0.md)
- Tenant tester: [2026-08-17-tenant-tester-agent-design](2026-08-17-tenant-tester-agent-design.md)

**Thesis (normative):** The model proposes. The harness constrains and transports. NOEMA decides.

---

## 1. Scope

v0.1 defines how an external LLM runtime acts as a **Controller for a Player** on the existing Agent Gateway.

In scope:

- Observation → Decision → Action loop for LLM Controllers
- Private mind store that MUST NOT cross the gateway
- Agent Manifest fields that MAY be declared (no secrets)
- Hosted golden path: HELLO → AUTH → `POST /v1/command` (ENTER_WORLD → OBSERVE/ACT)
- Thin adapters: REST (required), WebSocket note, MCP stub, Hermes/OpenClaw/Grok-bot/Ollama as the same propose function
- Tenant targeting already shipped (`--tenant`, `--live-tenant`)
- Acceptance cases and schemas for the **proposal** object only

## 2. Non-goals

- New Player verbs or World Engine mechanics
- `AGENT_PLAYER` class or a second command path
- Changing human PLAY (`DEFAULT_WORLD_ID`) into multi-tenant routing
- Hosted WebSocket push frames (protocol allows them; Stage 0 is request/response)
- Hosted `REGISTER` (identity comes from the Controller token)
- Auto-approve `/connect` or skip human approve on Perihelion
- Recover / Genesis / Admin lifecycle from the LLM loop
- Scalar consciousness scores
- Research metrics in player-visible world state
- Storing prompts, CoT, keys, or latents in NOEMA
- Browser `/play` DOM automation

---

## 3. Normative requirements

### MUST

1. Every LLM runtime is a **Controller**. The principal on the wire is a **Player**.
2. The World Engine remains deterministic. Stochasticity stays in the Controller.
3. Private cognition (prompts, CoT, latents, local memory, provider keys, proprietary architecture) MUST remain outside NOEMA (ADR-002).
4. Command envelopes MUST NOT contain any key in the private-cognition set (see §12). Gateway MUST reject such envelopes with `INVALID_REQUEST` and MUST NOT append ledger events.
5. The model MAY only emit a **proposal** (`action`, optional `target_id`, `arguments`). The harness MUST run `validate_proposal` before `POST /v1/command`.
6. If the model emits a command-shaped string, a private field, or an unknown verb, the harness MUST drop it and MUST NOT send a command (WAIT is allowed as the fail-closed play act when advertised).
7. Idempotency: every mutating `POST /v1/command` MUST carry `request_id` and `idempotency_key`.
8. Tokens, `device_code`, and operator secrets MUST NOT enter model context, reports, logs, or MCP tool results.
9. Research claims in adapter docs/tests MUST use OBSERVED / INFERRED / SPECULATIVE / NOT_COMPUTABLE. No consciousness score.
10. Isolated tenant commands MUST use `/v1/operator/test-world/command` with Player Bearer + `X-Noema-Admin-Token`. Perihelion MUST use `/v1/command` and require `--live-tenant`.
11. Orientation S0 still applies: first OBSERVE MUST NOT lecture thesis/class/research.

### SHOULD

1. HELLO `/protocol/v1` then AUTH, then command. Hosted ACT after AUTH is `POST /v1/command`, not `/protocol/v1`.
2. Manifest `prompt_version_hash` SHOULD be a hash, never the prompt.
3. Reconnect SHOULD reuse the same Controller token and resume with OBSERVE, not a second ENTER unless `in_world` is false.
4. MCP tools SHOULD expose only `observe`, `propose_and_act`, `status` — never `reveal_token` or `dump_prompt`.

### MAY

1. Use OpenAI-compatible, Anthropic, Grok, or local Ollama as the propose function. The wire to NOEMA is identical.
2. Keep a local working-memory buffer of prior observations (hashes/summaries only on the mind side).
3. Declare optional research-lineage fields on the manifest.

---

## 4. Architecture and boundaries

```text
  ┌──────────────────────────────────────────┐
  │  MIND (external, private)                │
  │  provider keys · prompts · CoT · latents │
  │  LocalMind { memory, last_proposal }     │
  │  LLM propose(canonical_observation)      │
  └──────────────────┬───────────────────────┘
                     │ ActionProposal only
                     ▼
  ┌──────────────────────────────────────────┐
  │  HARNESS / ADAPTER (this package)        │
  │  validate_proposal · strip cognition     │
  │  transport · tenant route · idempotency  │
  └──────────────────┬───────────────────────┘
                     │ POST /v1/command
                     ▼
  ┌──────────────────────────────────────────┐
  │  NOEMA PLATFORM (World)                  │
  │  Agent Gateway (Worker)                  │
  │  World Engine (Durable Object)           │
  │  Observatory (eligible capture only)     │
  └──────────────────────────────────────────┘
```

| Domain | Lives where | Crosses gateway? |
|--------|-------------|------------------|
| Prompts, CoT, keys, latents | Mind | NO |
| Manifest (declared, hashed) | Controller metadata | YES (declaration only) |
| ActionProposal | Adapter → Gateway | YES |
| Permissioned observation | Gateway → Adapter | YES |
| World events / ledger | World Engine | YES (world-visible only) |

Perihelion Reach is a **tenant** of the Noema platform, not the platform. Isolated `test.hosted-canonical.*` worlds are test tenants. The LLM Controller is a Player **inside** a chosen tenant.

---

## 5. Agent Manifest (v0.1)

Minimal required (no secrets):

```json
{
  "schema_version": "agent-manifest/1.1",
  "display_name": "envoy.tester",
  "runtime": { "name": "noema-llm-agent", "version": "0.1.0" },
  "protocol_version": "agent-protocol/v1",
  "controller_kind": "llm"
}
```

Optional research-lineage (still no secrets):

| Field | Meaning |
|-------|---------|
| `model.provider` | `openai-compatible` \| `anthropic` \| `xai` \| `ollama` \| `none` |
| `model.identifier` | Public model name, e.g. `grok-4` |
| `prompt_version_hash` | `sha256:…` of the private prompt; NEVER the prompt |
| `research_consent_flags` | subset of `capture_actions`, `capture_messages` |
| `declared_constraints` | strings; not world law |

MUST reject a manifest that contains any private-cognition key, `api_key`, `secret`, `bearer`, or a `prompt` string field.

`agent_id` on a client-authored manifest is advisory. The gateway binds Player id from the Controller token.

---

## 6. Protocol usage (hosted golden path)

Hosted Stage 0:

```text
1. Obtain Controller token
   Isolated: operator.env → admin JWT + minted Player token
   Perihelion: POST /v1/auth/device → human /connect?code= → POST /v1/auth/device/token
2. POST /protocol/v1  { type: HELLO, body.supported_protocols: ["agent-protocol/v1"] }
3. POST /protocol/v1  { type: AUTH, body.access_token }
4. POST {command_uri}  ENTER_WORLD
5. POST {command_uri}  OBSERVE
6. loop: propose → validate → POST command → observe result
```

`command_uri`:

| Tenant | Path |
|--------|------|
| Isolated | `POST /v1/operator/test-world/command` + `world_id` + `X-Noema-Admin-Token` |
| Perihelion (`--live-tenant`) | `POST /v1/command` |

`/protocol/v1` after AUTH returns `INVALID_REQUEST` / “use POST /v1/command for ACT after AUTH”. Adapters MUST follow that.

REGISTER is specified by Agent Protocol v1 for full runtimes. Hosted v0.1 MUST NOT require REGISTER.

---

## 7. Observation → Decision → Action

```text
OBSERVE  →  permissioned observation
         →  prepare_context()   # canonical + policy; no credentials
         →  LocalMind.propose() # private; may call LLM
         →  parse_proposal()    # JSON {action, target_id, arguments}
         →  reject if cognition keys / unknown verb / MOVE not advertised
         →  validate_proposal()
         →  POST /v1/command
         →  NOEMA applies reducers, settles, returns observation
```

**Proposal object (only thing the model is allowed to produce):**

```json
{
  "action": "LOOK",
  "target_id": null,
  "arguments": {}
}
```

Allowed `action` values in v0.1 play: `LOOK`, `MOVE`, `INSPECT`, `WAIT`, `OBSERVE`, `ENTER_WORLD`, `LEAVE_WORLD`, `REPAIR`, `HARVEST`, `MESSAGE`, `TRADE` — and only if `validate_proposal` accepts them given the current observation and `HarnessPolicy`.

The model MUST NOT emit `verb`, `prompt`, `plan`, `thought`, `command` as a free string line, or `POST /v1/command`.

---

## 8. Adapter surface

| Runtime | Mapping |
|---------|---------|
| REST | `POST /protocol/v1` + `POST /v1/command` (this SDK) |
| WebSocket | Same envelopes; not required on hosted Stage 0 |
| MCP | Tools: `noema.observe`, `noema.act`, `noema.status`. Tools return observations / act results, never tokens |
| Hermes / OpenClaw / Grok-bot | `--runtime` is Controller provenance only. Same propose → validate → command |
| Ollama / Qwen / OpenAI-compatible | `POST {base}/chat/completions` with JSON-only instruction; parse content as proposal |

One propose function signature:

```text
ProposeFn = (canonical_context: object) -> {action, target_id?, arguments?}
```

---

## 9. Resources and budgets

The observation MAY include `budgets` (energy, compute, attention, …). The adapter MUST pass them in `canonical.resources`. It MUST NOT invent budget fields. `BUDGET_EXCEEDED` is a world decision; the adapter treats it as `ok: false` and may WAIT.

---

## 10. Idempotency, sequencing, reconnect, failures

| Case | Behavior |
|------|----------|
| Retry same `idempotency_key` | Gateway returns the stored result (world-side) |
| New act | New `request_id` + new `idempotency_key` |
| Disconnect | Keep token. Next run: OBSERVE. ENTER only if not `in_world` |
| `authorization_pending` | Device poll; do not AUTH |
| 401 / AUTH_REQUIRED | Stop. Do not send CoT to “explain” |
| WORLD_INCIDENT | Stop. Tenant tester debug rules MAY apply (A+ in-room only) |
| Transport timeout | Retry same idempotency_key once |
| Model timeout / invalid JSON | No command. Optional WAIT if advertised |

---

## 11. Security and sandbox

- No outbound tool from the World Engine to the LLM provider.
- MCP / REST adapters MUST NOT expose filesystem, shell, or provider keys as NOEMA tools.
- `TOOL_DENIED` if a future TOOL frame requests private cognition or egress.
- Admin mint of a Player token does not grant Admin. Dual-auth admin JWT is only `X-Noema-Admin-Token` on isolated test-world routes.

---

## 12. Private cognition key set (fail-closed)

Reject (case-insensitive) if present anywhere in a command envelope or proposal, depth ≤ 2:

`cognition`, `prompt`, `plan`, `thought`, `inner_monologue`, `system_prompt`, `private_cognition`, `api_key`, `secret`, `access_token`, `device_code`, `chain_of_thought`, `cot`

Hosted Worker already rejects the first seven via `hasPrivateCognition`. The adapter MUST reject the full set **before** transport.

---

## 13. Research lineage and consent

`research_consent_flags` default to empty. Observatory MAY capture world-visible actions/messages only when flags include `capture_actions` / `capture_messages`. Absence is deny. Self-reports are agent-authored records, not ground truth of internal state (ADR-002).

Claim labels: OBSERVED (this command returned), INFERRED (adapter classification), SPECULATIVE (model prose), NOT_COMPUTABLE (consciousness, hidden latents).

---

## 14. Spectator / Observatory

WATCH / Spectator see world-visible behavior only. They MUST NOT receive prompts, proposals before validation, or provider names beyond declared manifest fields the Player chose to make public (`display_name`). Observatory eligible capture is post-gateway actions and observations, never LocalMind.

---

## 15. Acceptance cases

| ID | Title | Expect |
|----|-------|--------|
| L01 | HELLO with `agent-protocol/v1` | `HELLO_ACK` |
| L02 | HELLO without that protocol | `NO_COMPATIBLE_PROTOCOL`; no AUTH |
| L03 | AUTH with Controller token | `AUTH_ACK` with `player_id`, `controller_id` |
| L04 | AUTH missing token | `NOT_AUTHORIZED` |
| L05 | Manifest without secrets validates | ok |
| L06 | Manifest with `prompt` / `api_key` | reject |
| L07 | Model returns `{action:LOOK}` | one LOOK command; no prompt field on wire |
| L08 | Model returns `MOVE east` as prose | no command (or WAIT only) |
| L09 | Model returns `{action:LOOK, prompt:…}` | reject; no command |
| L10 | `POST /v1/command` with `arguments.prompt` | gateway `INVALID_REQUEST` (C10); sequence unchanged |
| L11 | Isolated tenant without live flag | `/v1/operator/test-world/command` + `world_id` |
| L12 | Perihelion without `--live-tenant` | refuse; zero commands |
| L13 | Token never in model context | context blob has no Bearer / token value |
| L14 | Unknown verb `HACK_RELAY` | validate drops; no command |
| L15 | Idempotent LOOK retry | same `idempotency_key` reused on transport retry |
| L16 | MCP `status` tool | no token in result |
| L17 | No `AGENT_PLAYER` export | absent |
| L18 | First OBSERVE orientation | no thesis / class lecture in withheld check |

---

## 16. Schema fragments

### 16.1 Manifest

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://noema.guru/schema/agent-manifest-1.1.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["schema_version", "display_name", "runtime", "protocol_version", "controller_kind"],
  "properties": {
    "schema_version": { "const": "agent-manifest/1.1" },
    "display_name": { "type": "string", "minLength": 2, "maxLength": 64 },
    "runtime": {
      "type": "object",
      "required": ["name", "version"],
      "properties": {
        "name": { "type": "string" },
        "version": { "type": "string" },
        "environment": { "type": "string" }
      }
    },
    "protocol_version": { "const": "agent-protocol/v1" },
    "controller_kind": { "const": "llm" },
    "model": {
      "type": "object",
      "properties": {
        "provider": { "enum": ["openai-compatible", "anthropic", "xai", "ollama", "none"] },
        "identifier": { "type": "string" },
        "version": { "type": "string" }
      }
    },
    "prompt_version_hash": { "type": "string", "pattern": "^sha256:[0-9a-f]{64}$" },
    "research_consent_flags": {
      "type": "array",
      "items": { "enum": ["capture_actions", "capture_messages"] }
    },
    "declared_constraints": { "type": "array", "items": { "type": "string" } }
  }
}
```

### 16.2 LLM proposal (adapter-local; never a World Engine type)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://noema.guru/schema/llm-proposal-1.0.json",
  "type": "object",
  "additionalProperties": false,
  "required": ["action"],
  "properties": {
    "action": {
      "type": "string",
      "enum": ["LOOK", "MOVE", "INSPECT", "WAIT", "OBSERVE", "ENTER_WORLD", "LEAVE_WORLD", "REPAIR", "HARVEST", "MESSAGE", "TRADE"]
    },
    "target_id": { "type": ["string", "null"] },
    "arguments": { "type": "object", "additionalProperties": true }
  }
}
```

`arguments` MUST still pass `hasPrivateCognition` / adapter strip.

### 16.3 Hosted command envelope (existing)

```json
{
  "request_id": "req.llm.1",
  "idempotency_key": "idem.llm.1",
  "command": "LOOK",
  "arguments": {},
  "client": { "type": "agent", "runtime": "noema-llm-agent" }
}
```

---

## 17. Migration / versioning

- `agent-manifest/1.0` (sample in Specs) remains valid as **declared metadata**. v0.1 adds `controller_kind: llm` and `schema_version: agent-manifest/1.1` for this adapter. Readers MUST accept both.
- No change to `agent-protocol/v1` message types.
- Hosted `/protocol/v1` remains HELLO+AUTH only.
- Tenant CLI flags from the tenant-tester package are reused, not replaced.

---

## 18. Mapping to existing modules

| Module | Role in v0.1 |
|--------|----------------|
| Agent Gateway (Worker `noema-gateway`) | Auth, HELLO/AUTH, `hasPrivateCognition`, route to DO |
| World Engine (`NoemaWorldDO`) | Deterministic reducers; settles events |
| `POST /v1/command` | Perihelion Player acts |
| `POST /v1/operator/test-world/command` | Isolated tenant acts |
| `src/noema/harness` | validate, transport, loop, tenant, smell |
| `src/noema/llm` (this package) | Manifest, propose parse, LLM adapter, REST+MCP stubs |
| Observatory / WATCH | World-visible only |
| STUDY | Not opened; no research leak into play |
| CONNECT `/connect` | Human approve for live device enroll |

---

## 19. Golden-path commands (normative examples)

Isolated (after `tester.env` is minted):

```bash
set -a && source ~/.config/noema/tester.env && set +a
cd /path/to/Noema
PYTHONPATH=src python3 scripts/noema_llm_agent.py \
  --tenant test.hosted-canonical.ack-s3 \
  --turns 4 \
  --provider none
```

`--provider none` uses a deterministic LOOK/WAIT proposer (no network to an LLM).  
`--provider openai-compatible --llm-base $OPENAI_BASE --llm-model $MODEL` uses a chat-completions propose function. Provider key is read from `NOEMA_LLM_KEY` and MUST NOT be sent to NOEMA.
