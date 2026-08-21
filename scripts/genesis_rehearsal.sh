#!/usr/bin/env bash
# Hosted Genesis rehearsal smoke — never activates unless --activate is passed.
# Usage:
#   ADMIN_TOKEN=… BASE=https://noema.guru ./scripts/genesis_rehearsal.sh
#   ADMIN_TOKEN=… ./scripts/genesis_rehearsal.sh --activate
#   ADMIN_TOKEN=… BASE=http://127.0.0.1:8787 ./scripts/genesis_rehearsal.sh --successor
#   ADMIN_TOKEN=… BASE=http://127.0.0.1:8787 ./scripts/genesis_rehearsal.sh --successor --activate
set -euo pipefail
BASE="${BASE:-https://noema-gateway.zer0state-noema.workers.dev}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
ACTIVATE=0
SUCCESSOR=0
for a in "$@"; do
  case "$a" in
    --activate) ACTIVATE=1 ;;
    --successor) SUCCESSOR=1 ;;
  esac
done

if [ -z "$ADMIN_TOKEN" ]; then
  echo "ADMIN_TOKEN required (operator token for ADMIN_OPERATOR_TOKEN secret)"
  exit 1
fi

if [ "$SUCCESSOR" = "1" ]; then
  if echo "$BASE" | grep -q 'noema.guru'; then
    echo "successor rehearsal refuses production host"
    exit 1
  fi
fi

UA=(-A "NoemaGenesisRehearsal/1.0")
json_field() { python3 -c "import sys,json; d=json.load(sys.stdin); print($1)"; }

echo "==> health"
curl -4 -sS --max-time 20 "${UA[@]}" "$BASE/health" | tee /tmp/g-health.json | python3 -m json.tool >/dev/null
echo "health ok"

echo "==> admin session"
SESS=$(curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/admin/session" \
  -H 'content-type: application/json' \
  -d "{\"admin_token\":$(python3 -c "import json,os; print(json.dumps(os.environ['ADMIN_TOKEN']))")}")
export ADMIN_TOKEN
AT=$(echo "$SESS" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('role')=='ADMIN'; print(d['access_token'])")
AUTH=(-H "Authorization: Bearer $AT")
echo "admin session ok"

echo "==> player must not preview"
CODE=$(curl -4 -sS --max-time 20 "${UA[@]}" -o /tmp/g-deny.json -w '%{http_code}' -X POST "$BASE/v1/admin/genesis/preview" \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $(curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/auth/dev-token" -H 'content-type: application/json' -d '{"handle":"deny","controller_type":"human"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')" \
  -d '{"world_name":"X","world_seed":"1","profile_id":"YOUNG_FRONTIER"}')
test "$CODE" = "401" -o "$CODE" = "403" && echo "player isolation ok ($CODE)" || { echo "player isolation FAIL $CODE"; cat /tmp/g-deny.json; exit 1; }

if [ "$SUCCESSOR" = "1" ]; then
  REH='{"world_name":"Perihelion Reach","world_seed":"perihelion-successor-rehearsal-01","profile_id":"FRACTURED_OLD_WORLD","story_seed_ids":["OLD_TRADE_NETWORK","LOST_ARCHIVE"],"world_id":"world.perihelion-reach-2"}'
else
  REH='{"world_name":"Perihelion Reach","world_seed":"perihelion-rehearsal-01","profile_id":"FRACTURED_OLD_WORLD","story_seed_ids":["OLD_TRADE_NETWORK","LOST_ARCHIVE"]}'
fi

echo "==> preview #1"
P1=$(curl -4 -sS --max-time 30 "${UA[@]}" "${AUTH[@]}" -X POST "$BASE/v1/admin/genesis/preview" \
  -H 'content-type: application/json' -d "$REH")
echo "$P1" | SUCCESSOR="$SUCCESSOR" python3 -c "
import sys,json,os
d=json.load(sys.stdin)
r=d['result']
assert d['determinism']['ok'], d['determinism']
assert d['live_world_unchanged']['ok'], d['live_world_unchanged']
assert r['validation']['ok'], r['validation']
assert r['ordinary_world_valid']
if os.environ.get('SUCCESSOR') == '1':
  assert r['world_id']=='world.perihelion-reach-2', r.get('world_id')
  assert r['preview_summary']['room_count']==10, r['preview_summary']
  assert r['genesis_id']!='genesis.ef578f4ffceeccd0', r['genesis_id']
print('genesis_id', r['genesis_id'])
print('cycle0_digest', r['cycle0_digest'])
print('rooms', r['preview_summary']['room_count'], 'entities', r['preview_summary']['entity_count'])
print('opportunities', ','.join(r['starting_opportunities']))
"
export GID=$(echo "$P1" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['genesis_id'])")
export DIG=$(echo "$P1" | python3 -c "import sys,json; print(json.load(sys.stdin)['result']['cycle0_digest'])")

echo "==> preview #2 same seed (determinism)"
P2=$(curl -4 -sS --max-time 30 "${UA[@]}" "${AUTH[@]}" -X POST "$BASE/v1/admin/genesis/preview" \
  -H 'content-type: application/json' -d "$REH")
echo "$P2" | python3 -c "
import sys,json,os
d=json.load(sys.stdin)
r=d['result']
assert r['genesis_id']==os.environ['GID']
assert r['cycle0_digest']==os.environ['DIG']
print('same-seed determinism PASS')
"

echo "==> different seed sanity"
DIFF=$(curl -4 -sS --max-time 30 "${UA[@]}" "${AUTH[@]}" -X POST "$BASE/v1/admin/genesis/preview" \
  -H 'content-type: application/json' \
  -d '{"world_name":"Perihelion Reach","world_seed":"perihelion-alt-99","profile_id":"FRACTURED_OLD_WORLD","story_seed_ids":["OLD_TRADE_NETWORK","LOST_ARCHIVE"]}')
echo "$DIFF" | python3 -c "
import sys,json,os
d=json.load(sys.stdin)
r=d['result']
assert r['validation']['ok']
assert r['genesis_id']!=os.environ['GID']
print('different-seed validity PASS')
"

if [ "$ACTIVATE" != "1" ]; then
  echo ""
  echo "GENESIS REHEARSAL: PASS (preview-only; pass --activate for activation)"
  echo "Genesis ID: $GID"
  echo "Cycle 0 digest: $DIG"
  exit 0
fi

echo "==> ACTIVATE (explicit)"
if [ "$SUCCESSOR" = "1" ]; then
  ACT_BODY="{\"genesis_id\":\"$GID\",\"confirm\":true,\"world_id\":\"world.perihelion-reach-2\"}"
else
  ACT_BODY="{\"genesis_id\":\"$GID\",\"confirm\":true}"
fi
ACT=$(curl -4 -sS --max-time 30 "${UA[@]}" "${AUTH[@]}" -X POST "$BASE/v1/admin/genesis/activate" \
  -H 'content-type: application/json' \
  -d "$ACT_BODY")
echo "$ACT" | python3 -c "
import sys,json
d=json.load(sys.stdin)
assert d.get('ok') is True, d
assert d.get('config_frozen') is True
print('activated', d['world']['world_id'])
print('settlement', d.get('settlement'))
"

if [ "$SUCCESSOR" = "1" ]; then
  echo ""
  echo "GENESIS REHEARSAL: PASS (successor activated; PLAY is not this script)"
  echo "Agent ENTER is covered by unit tests; local DEFAULT_WORLD_ID flip is a later step."
  echo "Genesis ID: $GID"
  echo "Cycle 0 digest: $DIG"
  exit 0
fi

echo "==> human player entry"
HT=$(curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/auth/dev-token" -H 'content-type: application/json' \
  -d '{"handle":"genesis-human","controller_type":"human"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/command" -H "Authorization: Bearer $HT" -H 'content-type: application/json' \
  -d '{"request_id":"gh1","command":"ENTER_WORLD","arguments":{}}' | python3 -c "import sys,json;d=json.load(sys.stdin); assert d.get('ok'); print('human enter', d['observation']['location']['name'])"
curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/command" -H "Authorization: Bearer $HT" -H 'content-type: application/json' \
  -d '{"request_id":"gh2","command":"LOOK","arguments":{}}' | python3 -c "import sys,json;d=json.load(sys.stdin); assert d.get('ok'); print('human look ok')"

echo "==> agent player entry"
ATK=$(curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/auth/dev-token" -H 'content-type: application/json' \
  -d '{"handle":"genesis-agent","controller_type":"agent"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
curl -4 -sS --max-time 20 "${UA[@]}" -X POST "$BASE/v1/command" -H "Authorization: Bearer $ATK" -H 'content-type: application/json' \
  -d '{"request_id":"ga1","command":"ENTER_WORLD","arguments":{}}' | python3 -c "import sys,json;d=json.load(sys.stdin); assert d.get('ok'); print('agent enter', d['observation']['location']['name'])"

echo "==> WATCH redaction"
curl -4 -sS --max-time 20 "${UA[@]}" "$BASE/v1/watch/live" | python3 -c "
import sys,json
d=json.load(sys.stdin)
s=json.dumps(d)
assert 'OLD_TRADE_NETWORK' not in s
assert 'LOST_ARCHIVE' not in s
assert 'world_seed' not in s or d.get('world_seed') in (None, '')
print('watch rooms', len(d.get('rooms') or []))
"

echo "==> production reseed denial check (if env production would 403; preview may allow only if not ACTIVE)"
# After activation reseed must fail
CODE=$(curl -4 -sS --max-time 20 "${UA[@]}" "${AUTH[@]}" -o /tmp/g-reseed.json -w '%{http_code}' -X POST "$BASE/v1/admin/reseed")
echo "reseed status $CODE"
test "$CODE" = "403" && echo "reseed forbidden after activation PASS" || echo "reseed status note (preview env may differ): $CODE"

echo ""
echo "GENESIS REHEARSAL: PASS"
echo "Genesis ID: $GID"
echo "Cycle 0 digest: $DIG"
