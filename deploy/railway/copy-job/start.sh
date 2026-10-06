#!/usr/bin/env bash
set -euo pipefail
if [[ -s "$PGDATA/PG_VERSION" ]]; then
  python3 /job/check_marker.py
  unset SOURCE_DB_PASSWORD PGPASSWORD
fi
exec /usr/local/bin/docker-entrypoint.sh "$@"
