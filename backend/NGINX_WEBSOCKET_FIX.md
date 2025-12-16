# Fix Nginx Configuration for WebSocket and SSL Certificate

## Issue 1: SSL Certificate Error (ERR_CERT_COMMON_NAME_INVALID)

The self-signed certificate needs to be regenerated with proper Subject Alternative Names (SAN).

**On your VPS, run:**

```bash
# Remove old certificate
sudo rm /etc/nginx/ssl/84.247.136.87.crt /etc/nginx/ssl/84.247.136.87.key

# Generate new certificate with SAN
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/84.247.136.87.key \
  -out /etc/nginx/ssl/84.247.136.87.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=84.247.136.87" \
  -addext "subjectAltName=IP:84.247.136.87,DNS:84.247.136.87"

# Restart Nginx
sudo nginx -t
sudo systemctl restart nginx
```

## Issue 2: WebSocket Connection Failing

Update Nginx configuration to properly handle WebSocket upgrades.

**On your VPS, run:**

```bash
sudo nano /etc/nginx/sites-available/cardtrack-backend
```

**Replace the entire file with:**

```nginx
# WebSocket upgrade map (must be at http level)
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

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
```

**Note:** If the `map` directive gives an error, you may need to add it to `/etc/nginx/nginx.conf` in the `http` block instead.

**Then:**

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Alternative: Add map to nginx.conf

If the map directive doesn't work in the site config, add it to the main nginx.conf:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add this inside the `http {` block (before the `include` directives):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
```

Then restart:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Test After Fixes

```bash
# Test HTTPS endpoint
curl -k https://84.247.136.87/api/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check if WebSocket port is accessible
curl -k -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" https://84.247.136.87/socket.io/
```

