# NOEMA LLM Controller (v0.1)

The model proposes. The harness constrains and transports. NOEMA decides.

Private prompts, keys, and chain-of-thought stay in this process. They are never sent to `POST /v1/command`.

Spec: `docs/superpowers/specs/2026-08-17-llm-agent-integration-v0.1.md`

## Golden path (isolated tenant, no LLM network)

```bash
# mint Player + admin JWT into ~/.config/noema/tester.env (see operator notes)
set -a && source ~/.config/noema/tester.env && set +a
cd /path/to/Noema
PYTHONPATH=src python3 scripts/noema_llm_agent.py \
  --tenant test.hosted-canonical.ack-s3 \
  --turns 4 \
  --provider none
```

`--provider none` uses a deterministic LOOK/WAIT proposer.

## OpenAI-compatible / Grok / Ollama

```bash
export NOEMA_LLM_KEY='…'          # never exported to NOEMA
export NOEMA_LLM_BASE='https://api.x.ai/v1'   # or http://127.0.0.1:11434/v1
export NOEMA_LLM_MODEL='grok-4'
PYTHONPATH=src python3 scripts/noema_llm_agent.py \
  --tenant test.hosted-canonical.ack-s3 \
  --provider openai-compatible \
  --turns 4
```

Perihelion requires `--live-tenant` and a device-enroll token from `/connect`.

## Tests

```bash
PYTHONPATH=src pytest tests/test_llm_agent.py -q
```
