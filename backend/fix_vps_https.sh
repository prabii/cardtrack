#!/bin/bash

# Comprehensive VPS HTTPS and WebSocket Fix Script
# Run this on your VPS: bash fix_vps_https.sh

set -e

echo "🔧 Starting VPS HTTPS and WebSocket Fix..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Step 1: Pull latest code
echo -e "${YELLOW}Step 1: Pulling latest code...${NC}"
cd ~/cardtrack/backend
git pull

# Step 2: Regenerate SSL certificate with SAN
echo -e "${YELLOW}Step 2: Regenerating SSL certificate with SAN...${NC}"
sudo mkdir -p /etc/nginx/ssl
sudo rm -f /etc/nginx/ssl/84.247.136.87.crt /etc/nginx/ssl/84.247.136.87.key

sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/84.247.136.87.key \
  -out /etc/nginx/ssl/84.247.136.87.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=84.247.136.87" \
  -addext "subjectAltName=IP:84.247.136.87,DNS:84.247.136.87"

echo -e "${GREEN}✅ SSL certificate regenerated${NC}"

# Step 3: Add WebSocket map to nginx.conf
echo -e "${YELLOW}Step 3: Adding WebSocket map to nginx.conf...${NC}"

# Check if map already exists
if ! grep -q "map \$http_upgrade \$connection_upgrade" /etc/nginx/nginx.conf; then
    # Add map directive after http { line
    sudo sed -i '/^http {/a\    map $http_upgrade $connection_upgrade {\n        default upgrade;\n        '\'''\'' close;\n    }' /etc/nginx/nginx.conf
    echo -e "${GREEN}✅ WebSocket map added to nginx.conf${NC}"
else
    echo -e "${YELLOW}⚠️  WebSocket map already exists in nginx.conf${NC}"
fi

# Step 4: Update site configuration
echo -e "${YELLOW}Step 4: Updating Nginx site configuration...${NC}"

sudo tee /etc/nginx/sites-available/cardtrack-backend > /dev/null <<'EOF'
server {
    listen 80;
    server_name 84.247.136.87;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 84.247.136.87;

    ssl_certificate /etc/nginx/ssl/84.247.136.87.crt;
    ssl_certificate_key /etc/nginx/ssl/84.247.136.87.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket headers
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo -e "${GREEN}✅ Nginx site configuration updated${NC}"

# Step 5: Enable site if not already enabled
if [ ! -L /etc/nginx/sites-enabled/cardtrack-backend ]; then
    echo -e "${YELLOW}Step 5: Enabling Nginx site...${NC}"
    sudo ln -s /etc/nginx/sites-available/cardtrack-backend /etc/nginx/sites-enabled/
    echo -e "${GREEN}✅ Site enabled${NC}"
fi

# Step 6: Test Nginx configuration
echo -e "${YELLOW}Step 6: Testing Nginx configuration...${NC}"
if sudo nginx -t; then
    echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
    echo -e "${RED}❌ Nginx configuration test failed!${NC}"
    exit 1
fi

# Step 7: Restart Nginx
echo -e "${YELLOW}Step 7: Restarting Nginx...${NC}"
sudo systemctl restart nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"

# Step 8: Restart backend
echo -e "${YELLOW}Step 8: Restarting backend...${NC}"
pm2 restart cardtrack-backend
echo -e "${GREEN}✅ Backend restarted${NC}"

# Step 9: Test HTTPS endpoint
echo -e "${YELLOW}Step 9: Testing HTTPS endpoint...${NC}"
sleep 2
if curl -k -s https://localhost/api/health | grep -q "success"; then
    echo -e "${GREEN}✅ HTTPS endpoint is working!${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS endpoint test returned unexpected result${NC}"
fi

# Step 10: Check firewall
echo -e "${YELLOW}Step 10: Checking firewall...${NC}"
if sudo ufw status | grep -q "443/tcp.*ALLOW"; then
    echo -e "${GREEN}✅ Port 443 is allowed${NC}"
else
    echo -e "${YELLOW}⚠️  Allowing port 443 in firewall...${NC}"
    sudo ufw allow 443/tcp
fi

echo ""
echo -e "${GREEN}🎉 All fixes applied!${NC}"
echo ""
echo "Next steps:"
echo "1. Update Vercel environment variables:"
echo "   - VITE_API_URL=https://84.247.136.87/api"
echo "   - VITE_SOCKET_URL=https://84.247.136.87"
echo "2. Redeploy your frontend on Vercel"
echo "3. Test the application"
echo ""
echo "To test from VPS:"
echo "  curl -k https://84.247.136.87/api/health"
echo ""

