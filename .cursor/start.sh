#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="sideline-dev"
PORT=43147
TMUX="tmux -f /exec-daemon/tmux.portal.conf"
URL="http://127.0.0.1:${PORT}/"

if curl -sf -o /dev/null --connect-timeout 2 "$URL"; then
  exit 0
fi

if $TMUX has-session -t "=$SESSION_NAME" 2>/dev/null; then
  $TMUX kill-session -t "=$SESSION_NAME" 2>/dev/null || true
fi

$TMUX new-session -d -s "$SESSION_NAME" -c "/workspace" -- "${SHELL:-bash}" -l -c "npm run dev"

for _ in $(seq 1 30); do
  if curl -sf -o /dev/null --connect-timeout 2 "$URL"; then
    exit 0
  fi
  sleep 1
done

echo "Sideline dev server did not become ready on port ${PORT}" >&2
exit 1
