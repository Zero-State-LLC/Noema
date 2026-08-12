#!/usr/bin/env bash
# Reference agent E2E against Cloudflare Stage 0 gateway.
# Usage: BASE=https://noema-gateway.zer0state-noema.workers.dev ./scripts/agent_cf_e2e.sh
set -euo pipefail
BASE="${BASE:-https://noema-gateway.zer0state-noema.workers.dev}"
HANDLE="${HANDLE:-ref-agent}"

echo "==> health"
curl -sS "$BASE/health" | python3 -m json.tool

echo "==> mint agent controller token"
TOK_JSON=$(curl -sSX POST "$BASE/v1/auth/dev-token" \
  -H 'content-type: application/json' \
  -d "{\"handle\":\"$HANDLE\",\"controller_type\":\"agent\"}")
TOKEN=$(echo "$TOK_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["access_token"])')
PLAYER=$(echo "$TOK_JSON" | python3 -c 'import sys,json; print(json.load(sys.stdin)["player_id"])')
echo "player_id=$PLAYER"

auth() { curl -sSX POST "$BASE/v1/command" \
  -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' \
  -d "$1"; }

echo "==> ENTER_WORLD"
auth '{"request_id":"a1","idempotency_key":"ref-enter","command":"ENTER_WORLD","client":{"type":"agent","runtime":"curl"}}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("ok"), d; print(d["observation"]["location"]["name"], d["events"][0]["event_type"])'

echo "==> LOOK"
auth '{"request_id":"a2","idempotency_key":"ref-look","command":"LOOK"}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("ok"), d; print("seq", d["events"][0]["sequence"], "room", d["observation"]["location"]["room_id"])'

echo "==> MOVE east"
auth '{"request_id":"a3","idempotency_key":"ref-move","command":"MOVE","arguments":{"direction":"east"}}' \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("ok"), d; print(d["observation"]["location"]["name"])'

echo "==> unauth must 401"
code=$(curl -sS -o /dev/null -w '%{http_code}' -X POST "$BASE/v1/command" \
  -H 'content-type: application/json' \
  -d '{"request_id":"x","command":"LOOK"}')
test "$code" = "401"
echo "unauth=$code"

echo "AGENT_CF_E2E_OK $BASE player=$PLAYER"
