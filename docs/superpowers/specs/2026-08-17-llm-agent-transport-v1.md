# noema-llm-agent Transport v1

**Version:** 1.0  
**Package:** `noema-llm-agent`  
**Compatible with:** Agent Protocol v1 envelopes  
**Does not change World Engine verbs.**  
**Private cognition never crosses the wire (ADR-002).**

The model proposes. This client transports. NOEMA decides.

## Transport selection

| Mode | Behavior |
|------|----------|
| `websocket` | Connect `ws://` / `wss://` only. Fail if handshake cannot complete. |
| `http` | `POST /protocol/v1` for HELLO/AUTH; `POST /v1/command` for ENTER/OBSERVE/ACT. |
| `auto` (default) | Prefer WebSocket. On connect/handshake failure, fall back to HTTP once and stay on HTTP for that session. |

Endpoint mapping:

- `https://host` → try `wss://host/protocol/v1/ws`, HTTP `https://host`
- `wss://host/path` → WebSocket only unless `auto` then HTTP origin `https://host`
- `http://host` → try `ws://host/protocol/v1/ws`

Hosted Stage 0 (`noema.guru`) is HTTP-only for protocol. `auto` MUST fall back cleanly.

## Lifecycle

```text
connect → HELLO → AUTH → REGISTER (optional) → ENTER_WORLD → loop
loop:    PING/PONG · OBSERVE pull · OBSERVE push · ACT → ACT_RESULT
close:   DISCONNECT → DISCONNECT_ACK
```

REGISTER is sent when the client has a manifest. Hosted Stage 0 MAY reply `INVALID_REQUEST`; client MUST continue (identity is the Controller token).

## Envelope

```json
{
  "protocol": "agent-protocol/v1",
  "type": "ACT",
  "request_id": "req.01HZX…",
  "idempotency_key": "idem.sess.000007",
  "agent_id": "player.tester",
  "world_id": "world.perihelion-reach",
  "schema_version": "agent-action/1.0",
  "body": {}
}
```

Mutating types (`REGISTER`, `ENTER_WORLD`, `ACT`, `MESSAGE`, `TOOL`) MUST include `idempotency_key` and `body.action.client_action_sequence` (monotonic per session epoch).

Forbidden keys anywhere in outbound envelopes (case-insensitive, depth ≤ 2):  
`cognition`, `prompt`, `plan`, `thought`, `inner_monologue`, `system_prompt`, `private_cognition`, `api_key`, `secret`, `access_token`, `device_code`, `chain_of_thought`, `cot`, `reason`.

If present: do not send. Raise `PrivateCognitionError`.

## Sequences and idempotency

- `client_action_sequence` starts at 1 after AUTH, increments on each mutating send.
- `idempotency_key = idem.{session_epoch}.{sequence}` unless the caller supplies one.
- Retry of the same ACT reuses the same key and sequence. The server returns the stored result.
- Observation sequence `obs_seq` is server-assigned. Client acks the highest contiguous `obs_seq`.

## Heartbeat

- Default interval: **25s**. Configurable `--heartbeat-interval`.
- Client sends `PING`. Expect `PONG` within `2 * interval`.
- Missing PONG → treat socket as dead → reconnect path.

## Reconnect and resume

On drop:

1. Status `reconnecting`.
2. Backoff `min(15, 0.4 * 2**attempt) + U(0, 0.25)` seconds.
3. Stop after `--max-reconnects` (default 8). Status `failed`.
4. New socket. HELLO body includes `resume_token` (from last AUTH_ACK) and `last_ack_obs_seq`.
5. If server sends `RESUME_ACK`: replay only **observations** with `obs_seq > last_ack_obs_seq`. Do **not** replay ACTs.
6. If resume rejected (`RESUME_POSITION_EXPIRED` / `RESUME_POSITION_INVALID`): re-AUTH with the same Controller token, reset action sequence, OBSERVE pull. Do not double-ENTER if `in_world`.
7. Status `resumed`.

Identity (`agent_id`, `controller_id`, token) is preserved in process memory. Token is never logged.

## Observation delivery

- **Push (WS):** `OBSERVE` frames. Buffer by `obs_seq`, deliver in order. Gaps wait up to 2s then skip-forward with a warning.
- **Pull (HTTP or explicit):** client `OBSERVE` request.
- Agent loop uses `next_observation()` which reads the ordered queue or pulls.

## ACT correlation

- Each ACT has unique `request_id`.
- WS: wait for `ACT_RESULT` / `ERROR` with that `request_id` (timeout 30s).
- HTTP: the POST response is the result.
- Out-of-order results are matched by `request_id`, never by arrival order.

## Errors and retry

| Code | Retry | Action |
|------|-------|--------|
| `NO_COMPATIBLE_PROTOCOL` | no | abort |
| `NOT_AUTHORIZED` | no | abort |
| `FORBIDDEN` | no | surface to loop |
| `PRIVATE_COGNITION_FORBIDDEN` | no | abort send |
| `INVALID_SCHEMA` | no | surface |
| `BUDGET_EXCEEDED` | no | surface |
| `CONFLICT` | no | return stored / surface |
| `RESUME_POSITION_EXPIRED` | n/a | re-AUTH |
| `WORLD_INCIDENT` | no | stop loop |
| HTTP 429 / `RATE_LIMITED` | yes | honor `Retry-After` or 1s, 2s, 4s |
| transport timeout | yes | same idempotency_key once, then reconnect |

## Backpressure

- In-flight ACT cap: 1 (loop is turn-based).
- Observation queue cap: 256. If full, drop oldest with log `backpressure_drop`.
- 429 pauses new ACTs.

## Security

- Bearer token only in `AUTH` body or HTTP `Authorization`. Never in logs, traces, or observation dumps.
- LLM keys stay in `make_llm` / env. Never in protocol frames.
- `reason` / CoT fields from the model stay in `LocalMind`. Strip before `act()`.

## Acceptance

| ID | Case |
|----|------|
| T01 | WS handshake HELLO→AUTH→ENTER succeeds |
| T02 | First ACT correlates to ACT_RESULT |
| T03 | Socket drop → reconnect → RESUME_ACK |
| T04 | Replayed ACT uses same idempotency_key |
| T05 | Missing PONG closes and reconnects |
| T06 | `auto` falls back to HTTP when WS refused |
| T07 | LocalMock HELLO/ACT still works |
| T08 | Envelope with `prompt` is not sent |
| T09 | Observations delivered in `obs_seq` order |
| T10 | 429 delays next ACT |
| T11 | DISCONNECT is sent on shutdown |
| T12 | Token value absent from log text |
