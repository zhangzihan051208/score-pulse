#!/usr/bin/env bash
# Run on a schedule (cron, GitHub Actions, etc.). Set BASE_URL and optional SYNC_SECRET.
set -euo pipefail
BASE_URL="${BASE_URL:-http://127.0.0.1:43147}"
AUTH=()
if [[ -n "${SYNC_SECRET:-}" ]]; then
  AUTH=(-H "Authorization: Bearer ${SYNC_SECRET}")
fi

echo "==> fixtures (schedules/scores)"
curl -fsS "${AUTH[@]}" "${BASE_URL}/api/sync/fixtures" || true

echo "==> enrich (rosters)"
curl -fsS "${AUTH[@]}" "${BASE_URL}/api/sync/enrich" || true
