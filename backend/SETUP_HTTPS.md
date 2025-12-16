# Setting Up HTTPS on VPS

## Option 1: Self-Signed Certificate (Quick Fix - Works Immediately)

This will allow HTTPS but browsers will show a security warning (you can click "Advanced" → "Proceed anyway").

### Step 1: Install OpenSSL (if not already installed)
```bash
sudo apt install openssl -y
```

### Step 2: Generate Self-Signed Certificate
```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/84.247.136.87.key \
  -out /etc/nginx/ssl/84.247.136.87.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=84.247.136.87"
```

### Step 3: Update Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/cardtrack-backend
```

Replace the content with:
```nginx
# WebSocket upgrade map
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

server {
    listen 80;
    server_name 84.247.136.87;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 84.247.136.87;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/84.247.136.87.crt;
    ssl_certificate_key /etc/nginx/ssl/84.247.136.87.key;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Increase body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header Sec-WebSocket-Extensions $http_sec_websocket_extensions;
        proxy_set_header Sec-WebSocket-Key $http_sec_websocket_key;
        proxy_set_header Sec-WebSocket-Version $http_sec_websocket_version;
        
        # Timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# WebSocket upgrade map (add this before the server blocks)
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}
}
```

### Step 4: Test and Restart Nginx
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Update Frontend Environment Variables
In Vercel, update:
- `VITE_API_URL=https://84.247.136.87/api`
- `VITE_SOCKET_URL=https://84.247.136.87`

Then redeploy the frontend.

---

## Option 2: Free Domain with Let's Encrypt (Recommended for Production)

### Step 1: Get a Free Domain
You can get a free domain from:
- **Freenom** (freenom.com) - Free .tk, .ml, .ga, .cf domains
- **No-IP** (noip.com) - Free dynamic DNS
- **DuckDNS** (duckdns.org) - Free subdomain

Or use a subdomain service like:
- **Cloudflare** - Free domain with SSL

### Step 2: Point Domain to Your VPS IP
In your domain's DNS settings, add an A record:
```
Type: A
Name: @ (or api, backend, etc.)
Value: 84.247.136.87
TTL: 3600
```

### Step 3: Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Step 4: Get SSL Certificate
```bash
# Replace 'yourdomain.com' with your actual domain
sudo certbot --nginx -d yourdomain.com
```

Follow the prompts. Certbot will automatically:
- Get the SSL certificate
- Update Nginx configuration
- Set up auto-renewal

### Step 5: Update Frontend Environment Variables
In Vercel, update:
- `VITE_API_URL=https://yourdomain.com/api`
- `VITE_SOCKET_URL=https://yourdomain.com`

Then redeploy the frontend.

### Step 6: Verify Auto-Renewal
```bash
sudo certbot renew --dry-run
```

---

## Option 3: Cloudflare Tunnel (Easiest - No Domain Needed)

### Step 1: Sign up for Cloudflare (Free)
Go to https://cloudflare.com and create an account.

### Step 2: Install Cloudflared
```bash
# Download Cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 3: Create Tunnel
```bash
cloudflared tunnel login
cloudflared tunnel create cardtrack-backend
```

### Step 4: Configure Tunnel
```bash
cloudflared tunnel route dns cardtrack-backend your-subdomain.your-domain.workers.dev
```

### Step 5: Run Tunnel
```bash
cloudflared tunnel run cardtrack-backend
```

This will give you an HTTPS URL automatically.

---

## Quick Test After Setup

```bash
# Test HTTPS endpoint
curl -k https://84.247.136.87/api/health

# Or with domain
curl https://yourdomain.com/api/health
```

---

## Troubleshooting

### If Nginx fails to start:
```bash
sudo nginx -t  # Check configuration
sudo tail -f /var/log/nginx/error.log  # Check error logs
```

### If SSL certificate issues:
```bash
# Check certificate
sudo openssl x509 -in /etc/nginx/ssl/84.247.136.87.crt -text -noout

# Check Nginx SSL configuration
sudo nginx -T | grep ssl
```

### Firewall must allow HTTPS:
```bash
sudo ufw allow 443/tcp
sudo ufw status
```

