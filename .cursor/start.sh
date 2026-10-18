#!/usr/bin/env bash
set -euo pipefail

SESSION_NAME="sideline-dev"
TMUX="tmux -f /exec-daemon/tmux.portal.conf"

if ! $TMUX has-session -t "=$SESSION_NAME" 2>/dev/null; then
  $TMUX new-session -d -s "$SESSION_NAME" -c "/workspace" -- "${SHELL:-bash}" -l -c "npm run dev"
fi
