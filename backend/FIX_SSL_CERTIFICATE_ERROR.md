# Fix SSL Certificate Error (ERR_CERT_AUTHORITY_INVALID)

## The Problem

Browsers block self-signed certificates by default for security. You'll see `ERR_CERT_AUTHORITY_INVALID` until the certificate is accepted.

## Solution 1: Accept Certificate in Browser (Quick Fix)

**For Chrome/Edge:**
1. When you see the error, click "Advanced"
2. Click "Proceed to 84.247.136.87 (unsafe)"
3. The certificate will be accepted for this session

**For Firefox:**
1. Click "Advanced"
2. Click "Accept the Risk and Continue"

**Note:** You'll need to do this once per browser/device.

## Solution 2: Use a Domain with Let's Encrypt (Recommended for Production)

This gives you a trusted certificate that browsers accept automatically.

### Step 1: Get a Free Domain
- **Freenom** (freenom.com) - Free .tk, .ml, .ga, .cf domains
- **No-IP** (noip.com) - Free dynamic DNS
- **DuckDNS** (duckdns.org) - Free subdomain

### Step 2: Point Domain to Your VPS
In your domain's DNS settings:
```
Type: A
Name: @ (or api, backend)
Value: 84.247.136.87
TTL: 3600
```

### Step 3: Get Let's Encrypt Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
```

### Step 4: Update Frontend
In Vercel, set:
- `VITE_API_URL=https://yourdomain.com/api`
- `VITE_SOCKET_URL=https://yourdomain.com`

## Solution 3: Cloudflare Tunnel (No Domain Needed)

Cloudflare Tunnel provides HTTPS with a trusted certificate automatically.

### Step 1: Sign up for Cloudflare (Free)
Go to https://cloudflare.com

### Step 2: Install Cloudflared on VPS
```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Step 3: Create Tunnel
```bash
cloudflared tunnel login
cloudflared tunnel create cardtrack-backend
```

### Step 4: Configure and Run
```bash
cloudflared tunnel route dns cardtrack-backend your-subdomain.your-domain.workers.dev
cloudflared tunnel run cardtrack-backend
```

This gives you an HTTPS URL automatically.

## Solution 4: Temporary Workaround - Allow HTTP for Testing Only

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

If you need to test immediately, you can temporarily allow HTTP:

1. Update Nginx to serve HTTP on port 80 (don't redirect to HTTPS)
2. Update frontend to use `http://84.247.136.87/api`
3. **Remember to switch back to HTTPS before production!**

## Current Status

Your setup is correct - the certificate error is expected with self-signed certificates. The browser needs to accept it once, or you need a proper domain with Let's Encrypt.

## Quick Test

After accepting the certificate in your browser, test:
```bash
# From VPS
curl -k https://84.247.136.87/api/health

# Should return JSON with "success": true
```

