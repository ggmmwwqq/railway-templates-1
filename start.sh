#!/bin/sh
set -e

cleanup() {
  echo ""
  echo "[pocketbase] shutting down..."
  kill $PB_PID 2>/dev/null || true
  kill $SIDECAR_PID 2>/dev/null || true
  wait $PB_PID 2>/dev/null || true
  wait $SIDECAR_PID 2>/dev/null || true
  echo "[pocketbase] shutdown complete"
}
trap cleanup TERM INT QUIT

PB_DATA_DIR="${PB_DATA_DIR:-/pb_data}"
PB_PORT="${PORT:-8080}"
SIDECAR_PORT="${SIDECAR_PORT:-8090}"

echo "============================================"
echo "  PocketBase on Railway"
echo "============================================"
echo ""
echo "  Port:         ${PB_PORT}"
echo "  Data dir:     ${PB_DATA_DIR}"
echo "  Sidecar port: ${SIDECAR_PORT}"
echo ""

mkdir -p "${PB_DATA_DIR}"

# --- Auto-create admin if credentials provided ---
if [ -n "${PB_ADMIN_EMAIL}" ] && [ -n "${PB_ADMIN_PASSWORD}" ]; then
  if /usr/local/bin/pocketbase superuser create "${PB_ADMIN_EMAIL}" "${PB_ADMIN_PASSWORD}" \
       --dir="${PB_DATA_DIR}" 2>/dev/null; then
    echo "[pocketbase] admin user created: ${PB_ADMIN_EMAIL}"
  else
    echo "[pocketbase] admin user already exists"
  fi
fi

# Start health sidecar first so it's ready when Railway checks
node /app/healthcheck/index.mjs &
SIDECAR_PID=$!

# Start PocketBase
if [ -n "${PB_ENCRYPTION_KEY}" ]; then
  /usr/local/bin/pocketbase serve \
    --http="0.0.0.0:${PB_PORT}" \
    --dir="${PB_DATA_DIR}" \
    --encryptionEnv=PB_ENCRYPTION_KEY &
else
  /usr/local/bin/pocketbase serve \
    --http="0.0.0.0:${PB_PORT}" \
    --dir="${PB_DATA_DIR}" &
fi
PB_PID=$!

echo ""
echo "[pocketbase] server starting on 0.0.0.0:${PB_PORT}"
echo "[pocketbase] data directory: ${PB_DATA_DIR}"
echo "[pocketbase] admin panel: http://your-app.railway.app/_/"
echo ""

wait $PB_PID
