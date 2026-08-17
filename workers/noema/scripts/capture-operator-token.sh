#!/usr/bin/env bash
# One-time silent capture of ADMIN_OPERATOR_TOKEN into ~/.config/noema/operator.env
# Secret is read from the TTY and never echoed. Do not pass it as an argument.
set -euo pipefail
dest="${NOEMA_OPERATOR_ENV:-$HOME/.config/noema/operator.env}"
mkdir -p "$(dirname "$dest")"
chmod 700 "$(dirname "$dest")"
if [ ! -t 0 ]; then
  echo "error: run this in a real terminal (needs a TTY). Do not pipe the secret." >&2
  exit 2
fi
printf "ADMIN_OPERATOR_TOKEN (input hidden): "
# shellcheck disable=SC2162
read -s token
printf "\n"
if [ "${#token}" -lt 8 ]; then
  echo "error: token too short" >&2
  exit 2
fi
umask 077
printf 'ADMIN_OPERATOR_TOKEN=%s\n' "$token" > "$dest"
chmod 600 "$dest"
echo "wrote $dest mode 600 len=${#token}"
echo "then: cd workers/noema && node scripts/isolated-ack.mjs"
