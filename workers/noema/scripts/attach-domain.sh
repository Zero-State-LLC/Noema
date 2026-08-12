#!/usr/bin/env bash
# Attach noema.guru (and www) to Worker noema-gateway once the zone exists on Cloudflare.
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="${1:-noema.guru}"
WWW="www.${DOMAIN}"
ACCOUNT="${CLOUDFLARE_ACCOUNT_ID:-315fb44b61212825452aad0ca566ea42}"
WORKER="${WORKER_NAME:-noema-gateway}"
WORKERS_HOST="${WORKERS_DEV_HOST:-noema-gateway.zer0state-noema.workers.dev}"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  CLOUDFLARE_API_TOKEN=$(python3 -c "
import re, pathlib
p=pathlib.Path.home()/'.config/.wrangler/config/default.toml'
if not p.is_file():
  raise SystemExit(0)
t=p.read_text()
m=re.search(r'oauth_token\s*=\s*\"([^\"]+)\"', t)
print(m.group(1) if m else '')
")
  export CLOUDFLARE_API_TOKEN
fi
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "No Cloudflare token. Run: npx wrangler login"
  exit 1
fi

api() {
  local method="$1" path="$2"
  shift 2
  curl -sS -X "$method" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    "https://api.cloudflare.com/client/v4${path}" \
    "$@"
}

echo "==> account=${ACCOUNT} domain=${DOMAIN} worker=${WORKER}"

ZJSON=$(api GET "/zones?name=${DOMAIN}&account.id=${ACCOUNT}")
python3 -c "
import json,sys
d=json.loads(sys.argv[1])
print('list_success', d.get('success'), 'errors', d.get('errors'))
zs=d.get('result') or []
if not zs:
  print('ZONE_MISSING')
else:
  z=zs[0]
  print('ZONE_ID', z.get('id'))
  print('STATUS', z.get('status'))
  print('NS', ' '.join(z.get('name_servers') or []))
" "$ZJSON"

ZONE_ID=$(python3 -c "import json,sys; r=json.loads(sys.argv[1]).get('result') or []; print(r[0]['id'] if r else '')" "$ZJSON")

if [ -z "$ZONE_ID" ]; then
  echo "==> attempting zone create"
  CJSON=$(api POST "/zones" --data "{\"name\":\"${DOMAIN}\",\"account\":{\"id\":\"${ACCOUNT}\"},\"type\":\"full\"}")
  python3 -c "
import json,sys
d=json.loads(sys.argv[1])
print('create_success', d.get('success'))
print('errors', d.get('errors'))
r=d.get('result') or {}
print('ZONE_ID', r.get('id') or '')
print('STATUS', r.get('status') or '')
print('NS', ' '.join(r.get('name_servers') or []))
" "$CJSON"
  ZONE_ID=$(python3 -c "import json,sys; r=json.loads(sys.argv[1]).get('result') or {}; print(r.get('id') or '')" "$CJSON")
fi

if [ -z "$ZONE_ID" ]; then
  echo ""
  echo "BLOCKER: zone not present and create denied (need zone.create / dashboard Add site)."
  echo ""
  echo "Manual path:"
  echo "  1) Open https://dash.cloudflare.com/${ACCOUNT}/add-site"
  echo "  2) Enter ${DOMAIN} → Free plan → continue"
  echo "  3) Copy the two Cloudflare nameservers"
  echo "  4) Namecheap → Domain List → Manage → ${DOMAIN} → Nameservers → Custom DNS"
  echo "     Paste both CF nameservers → Save (propagation 5 min–48 h)"
  echo "  5) When zone Status=Active, re-run: ./scripts/attach-domain.sh ${DOMAIN}"
  echo ""
  echo "Fallback without CF zone (www only; apex limited at Namecheap):"
  echo "  CNAME www → ${WORKERS_HOST}"
  echo "  Apex: URL Redirect to https://www.${DOMAIN} or ALIAS if available"
  echo "  Note: Worker Custom Domain SSL requires zone on Cloudflare for full apex support."
  exit 2
fi

echo "==> attaching custom domains"
for host in "$DOMAIN" "$WWW"; do
  RESP=$(api PUT "/accounts/${ACCOUNT}/workers/domains" \
    --data "{\"hostname\":\"${host}\",\"service\":\"${WORKER}\",\"environment\":\"production\"}")
  python3 -c "
import json,sys
d=json.loads(sys.argv[1])
print(sys.argv[2], 'success', d.get('success'), 'errors', d.get('errors'))
r=d.get('result') or {}
if r: print('  hostname', r.get('hostname'), 'service', r.get('service'))
" "$RESP" "$host"
done

echo "==> worker domains"
api GET "/accounts/${ACCOUNT}/workers/domains" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print([(x.get('hostname'), x.get('service')) for x in d.get('result') or []])
print('errors', d.get('errors'))
"

echo "==> HTTP checks"
for u in "https://${DOMAIN}/health" "https://${WWW}/health"; do
  code=$(curl -sS -o /tmp/noema_h.json -w "%{http_code}" --connect-timeout 20 "$u" || echo "000")
  echo "$u → $code"
  if [ "$code" = "200" ]; then python3 -m json.tool < /tmp/noema_h.json | head -10; fi
done
code=$(curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 20 -X POST "https://${DOMAIN}/v1/command" \
  -H 'content-type: application/json' -d '{}' || echo "000")
echo "POST /v1/command → $code (expect 401 when live)"
echo "DONE zone_id=$ZONE_ID"
