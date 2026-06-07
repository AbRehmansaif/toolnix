#!/bin/bash
# ToolNix Quick Update Script
# Use after: git pull
# Run from the project root: bash deploy/update.sh

set -e

echo "========================================="
echo "  ToolNix Quick Update"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"
echo "[INFO] Working from: $PROJECT_ROOT"

# ── Detect volume name ────────────────────────────────────────────────────────
COMPOSE_PROJECT=$(docker volume ls --format '{{.Name}}' | grep '_frontend_dist$' | head -1 | sed 's/_frontend_dist$//')
if [ -z "$COMPOSE_PROJECT" ]; then
  COMPOSE_PROJECT=$(basename "$PROJECT_ROOT")
fi

VOLUME_NAME="${COMPOSE_PROJECT}_frontend_dist"
echo "[INFO] Volume: $VOLUME_NAME"

# ── Step 1: Rebuild frontend ───────────────────────────────────────────────────
echo ""
echo "[1/4] Rebuilding frontend (no cache)..."
docker-compose build --no-cache frontend_builder
docker-compose run --rm frontend_builder

# ── Step 2: Rebuild & restart backend ─────────────────────────────────────────
echo ""
echo "[2/4] Rebuilding and restarting backend..."
docker-compose build --no-cache backend
docker-compose up -d backend

# ── Step 3: Copy new dist to Nginx root ───────────────────────────────────────
echo ""
echo "[3/4] Copying new frontend build to Nginx root..."
mkdir -p /var/www/toolnix.pro/html
rm -rf /var/www/toolnix.pro/html/*

docker run --rm \
  -v "${VOLUME_NAME}:/dist:ro" \
  -v "/var/www/toolnix.pro/html:/host" \
  alpine sh -c "cp -r /dist/. /host/ && echo 'Copy OK'"

# Verify
if [ ! -f /var/www/toolnix.pro/html/index.html ]; then
  echo "[ERROR] index.html missing after copy. Volume contents:"
  docker run --rm -v "${VOLUME_NAME}:/dist" alpine ls -la /dist
  exit 1
fi

echo "[INFO] $(ls /var/www/toolnix.pro/html | wc -l) files deployed."

# ── Step 4: Reload Nginx ──────────────────────────────────────────────────────
echo ""
echo "[4/4] Reloading Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "========================================="
echo "  Update complete! Check https://toolnix.pro"
echo "========================================="
