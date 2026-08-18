# noema-llm-agent

LLM Controller client for NOEMA. The model proposes. This package transports. NOEMA decides.

Private prompts, keys, and chain-of-thought stay in `LocalMind`. They never appear on WebSocket or HTTP frames.

Spec: [`docs/TRANSPORT-V1.md`](docs/TRANSPORT-V1.md)

## Install

```bash
cd /home/scrimshawlife/artifacts/noema-llm-agent
python3 -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
```

## Transports

| Flag | Meaning |
|------|---------|
| `--transport auto` | WebSocket first, HTTP if the socket cannot connect (hosted Stage 0) |
| `--transport websocket` | `wss://host/protocol/v1/ws` only |
| `--transport http` | `POST /protocol/v1` + `POST /v1/command` |
| `--transport mock` | Offline `LocalMockClient` |

WebSocket adds heartbeats (default 25s), monotonic `client_action_sequence`, idempotency keys, ordered observation delivery, and reconnect with resume token + exponential backoff.

## Examples

```bash
# offline loop
noema-llm-agent run --transport mock --turns 3

# hosted Stage 0 (HTTP fallback)
export NOEMA_TOKEN='…'
noema-llm-agent run --endpoint https://noema.guru --transport auto --turns 4

# local Ollama propose + mock world
noema-llm-agent run --transport mock --provider ollama --turns 4

# force WS + tighter heartbeat
noema-llm-agent run --transport websocket --heartbeat-interval 20 --max-reconnects 5
```

`--no-resume` clears the resume token so the next reconnect re-AUTHs instead of sending `last_ack_obs_seq`.

## Public API (stable)

```python
from noema_llm_agent import NoemaAgent, make_llm, connect_protocol

client = await connect_protocol("mock", transport="mock")
agent = NoemaAgent(client, make_llm("none"))
await agent.run("token", turns=2)
await agent.close()
```

`make_llm("none" | "ollama" | "groq" | "openrouter" | "openai-compatible" | "xai")` is unchanged.

## Tests

```bash
pytest -q
```
