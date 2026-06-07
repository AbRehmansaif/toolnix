#!/bin/bash
# ToolNix VPS Deployment Script
# Run from the project root: bash deploy/deploy.sh

set -e  # Exit immediately on any error

echo "========================================="
echo "  ToolNix Full Deployment"
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"
echo "[INFO] Working from: $PROJECT_ROOT"

# ── 1. Build frontend (no cache to guarantee fresh build) ─────────────────────
echo ""
echo "[1/6] Building frontend Docker image (no cache)..."
docker-compose build --no-cache frontend_builder

echo "[1/6] Running frontend builder to generate dist..."
docker-compose run --rm frontend_builder

# ── 2. Detect the real volume name ────────────────────────────────────────────
echo ""
echo "[2/6] Detecting Docker volume name..."

# Docker Compose sets the project name from the folder containing docker-compose.yml
# If run from /var/www/toolnix/toolnix the project name is 'toolnix'
# Volume name = <project_name>_frontend_dist
COMPOSE_PROJECT=$(docker-compose config --format json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('name',''))" 2>/dev/null || true)

if [ -z "$COMPOSE_PROJECT" ]; then
  # Fallback: read the name directly from docker inspect on first available volume
  COMPOSE_PROJECT=$(docker volume ls --format '{{.Name}}' | grep '_frontend_dist$' | head -1 | sed 's/_frontend_dist$//')
fi

if [ -z "$COMPOSE_PROJECT" ]; then
  COMPOSE_PROJECT=$(basename "$PROJECT_ROOT")
fi

VOLUME_NAME="${COMPOSE_PROJECT}_frontend_dist"
MEDIA_VOLUME="${COMPOSE_PROJECT}_backend_media"

# Verify the volume actually exists
if ! docker volume inspect "$VOLUME_NAME" > /dev/null 2>&1; then
  echo "[ERROR] Volume '$VOLUME_NAME' not found."
  echo "        Available volumes:"
  docker volume ls | grep -E "frontend_dist|backend"
  echo ""
  echo "        Re-run with: COMPOSE_PROJECT=<correct_name> bash deploy/deploy.sh"
  exit 1
fi

echo "[INFO] Using frontend volume: $VOLUME_NAME"
echo "[INFO] Using media volume:    $MEDIA_VOLUME"

# ── 3. Prepare Nginx directories ──────────────────────────────────────────────
echo ""
echo "[3/6] Preparing Nginx directories..."
mkdir -p /var/www/toolnix.pro/html
mkdir -p /var/www/toolnix.pro/media

# ── 4. Copy frontend dist from Docker volume → Nginx root ─────────────────────
echo ""
echo "[4/6] Copying frontend dist to /var/www/toolnix.pro/html ..."

# Wipe old files first so removed pages don't linger
rm -rf /var/www/toolnix.pro/html/*

docker run --rm \
  -v "${VOLUME_NAME}:/dist:ro" \
  -v "/var/www/toolnix.pro/html:/host" \
  alpine sh -c "cp -r /dist/. /host/ && echo 'Copy OK' && ls /host | head -5"

# Verify copy succeeded
if [ ! -f /var/www/toolnix.pro/html/index.html ]; then
  echo "[ERROR] index.html not found after copy — something went wrong."
  echo "        Check the volume contents with:"
  echo "        docker run --rm -v ${VOLUME_NAME}:/dist alpine ls /dist"
  exit 1
fi

echo "[INFO] Frontend files copied successfully."

# ── 5. Copy backend media (non-fatal if empty) ────────────────────────────────
echo ""
echo "[5/6] Copying backend media..."
if docker volume inspect "$MEDIA_VOLUME" > /dev/null 2>&1; then
  docker run --rm \
    -v "${MEDIA_VOLUME}:/media:ro" \
    -v "/var/www/toolnix.pro/media:/host" \
    alpine sh -c "cp -r /media/. /host/ && echo 'Media copy OK'" || echo "[WARN] Media copy failed (non-fatal)."
else
  echo "[WARN] Media volume '$MEDIA_VOLUME' not found — skipping."
fi

# ── 6. Deploy Nginx config & reload ───────────────────────────────────────────
echo ""
echo "[6/6] Deploying Nginx config..."
cp "$SCRIPT_DIR/toolnix.pro.conf" /etc/nginx/sites-available/toolnix.pro.conf
ln -sf /etc/nginx/sites-available/toolnix.pro.conf /etc/nginx/sites-enabled/toolnix.pro.conf

nginx -t && systemctl reload nginx
echo "[INFO] Nginx reloaded."

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "========================================="
echo "  Deployment complete!"
echo "  Live at: https://toolnix.pro"
echo "========================================="
