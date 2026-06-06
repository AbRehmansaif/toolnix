#!/bin/bash
# ToolNix VPS Deployment Script

echo "Starting ToolNix Deployment..."

# 1. Build and run docker containers
docker-compose up -d --build

# 2. Setup Nginx directories
sudo mkdir -p /var/www/toolnix.pro/html
sudo mkdir -p /var/www/toolnix.pro/media

# 3. Copy frontend build files from the Docker volume to Nginx root
# (Find the exact volume name with 'docker volume ls', usually foldername_frontend_dist)
PROJECT_DIR_NAME=$(basename "$PWD")
VOLUME_NAME="${PROJECT_DIR_NAME}_frontend_dist"
sudo docker run --rm -v ${VOLUME_NAME}:/dist -v /var/www/toolnix.pro/html:/host alpine cp -r /dist/. /host/

# 4. Copy backend media volume to Nginx root (for direct serving)
MEDIA_VOLUME_NAME="${PROJECT_DIR_NAME}_backend_media"
sudo docker run --rm -v ${MEDIA_VOLUME_NAME}:/media -v /var/www/toolnix.pro/media:/host alpine cp -r /media/. /host/ || true

# 5. Copy Nginx configuration
sudo cp deploy/toolnix.pro.conf /etc/nginx/sites-available/
sudo ln -sf /etc/nginx/sites-available/toolnix.pro.conf /etc/nginx/sites-enabled/

# 6. Test and reload Nginx
sudo nginx -t && sudo systemctl reload nginx

# 7. (Optional) Run Certbot for SSL if not already done
# sudo certbot --nginx -d toolnix.pro -d www.toolnix.pro

echo "Deployment complete! Your site should be live at http://toolnix.pro"
