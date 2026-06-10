#!/bin/sh
set -e

cleanup() {
  echo ""
  echo "[proxy] shutting down..."
  kill $PROXY_PID 2>/dev/null || true
  kill $PB_PID 2>/dev/null || true
  wait $PB_PID 2>/dev/null || true
  wait $PROXY_PID 2>/dev/null || true
  echo "[proxy] shutdown complete"
}
trap cleanup TERM INT QUIT

PB_DATA_DIR="${PB_DATA_DIR:-/pb_data}"
LISTEN_PORT="${PORT:-8080}"
PB_INTERNAL_PORT="${PB_INTERNAL_PORT:-8090}"

echo ""
echo "============================================"
echo "  PocketBase Instant Backend"
echo "============================================"
echo ""

# ── Pre-flight System Checks ────────────────────────────────

echo "  System Check"
echo "  ------------"

# Railway environment
if [ -n "${RAILWAY_SERVICE_ID}" ] || [ -n "${RAILWAY_ENV}" ]; then
  echo "  [OK] Railway Environment"
else
  echo "  [--] Local Environment (not Railway)"
fi

# PORT
echo "  [OK] Port: ${LISTEN_PORT}"

# Data directory
mkdir -p "${PB_DATA_DIR}"
echo "  [OK] Data Directory: ${PB_DATA_DIR}"

# PocketBase binary
if [ -x "/usr/local/bin/pocketbase" ]; then
  echo "  [OK] PocketBase Binary"
else
  echo "  [FAIL] PocketBase Binary Missing"
  exit 1
fi

# Persistent storage
if mountpoint -q "${PB_DATA_DIR}" 2>/dev/null; then
  echo "  [OK] Persistent Storage: Connected"
  echo "connected" > /tmp/pb_storage_status
else
  echo "  [WARN] Persistent Storage Not Detected"
  echo "         Data may be lost after redeployment."
  echo "         Add a Railway Volume at ${PB_DATA_DIR}"
  echo "missing" > /tmp/pb_storage_status
fi

echo ""
echo "  System Ready"
echo ""

# ── Admin Account ───────────────────────────────────────────

if [ -n "${PB_ADMIN_EMAIL}" ] && [ -n "${PB_ADMIN_PASSWORD}" ]; then
  if /usr/local/bin/pocketbase superuser create "${PB_ADMIN_EMAIL}" "${PB_ADMIN_PASSWORD}" \
       --dir="${PB_DATA_DIR}" 2>/dev/null; then
    echo "[admin] account created: ${PB_ADMIN_EMAIL}"
  else
    echo "[admin] account already exists"
  fi
fi

# Detect admin status
if /usr/local/bin/pocketbase superuser list --dir="${PB_DATA_DIR}" 2>/dev/null | grep -q "@"; then
  echo "[admin] admin configured"
  echo "configured" > /tmp/pb_admin_status
else
  echo "[admin] no admin account — create one at /_/"
  echo "missing" > /tmp/pb_admin_status
fi

# ── Start Services ──────────────────────────────────────────

# Start PocketBase internally (not exposed directly)
if [ -n "${PB_ENCRYPTION_KEY}" ]; then
  /usr/local/bin/pocketbase serve \
    --http="127.0.0.1:${PB_INTERNAL_PORT}" \
    --dir="${PB_DATA_DIR}" \
    --encryptionEnv=PB_ENCRYPTION_KEY &
else
  /usr/local/bin/pocketbase serve \
    --http="127.0.0.1:${PB_INTERNAL_PORT}" \
    --dir="${PB_DATA_DIR}" &
fi
PB_PID=$!

# Start proxy on public port
node /app/healthcheck/index.mjs &
PROXY_PID=$!

echo ""
echo "  PocketBase  →  127.0.0.1:${PB_INTERNAL_PORT} (internal)"
echo "  Proxy       →  0.0.0.0:${LISTEN_PORT} (public)"
echo "  Admin Panel →  /_/"
echo "  System Page →  /system"
echo "  Health      →  /health"
echo ""

wait $PB_PID
