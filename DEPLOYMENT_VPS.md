# VPS Deployment Guide

You can run your backend directly on your VPS. This is more cost-effective and gives you full control.

## Prerequisites

- VPS running Linux (Ubuntu 20.04+ recommended)
- SSH access to your VPS
- Domain name (optional but recommended)
- Your repository pushed to GitHub

## Step 1: Connect to Your VPS

```bash
ssh root@YOUR_VPS_IP
```

Replace `YOUR_VPS_IP` with your actual VPS IP address.

---

## Step 2: Install Node.js and npm

```bash
# Update system packages
apt update && apt upgrade -y

# Install Node.js 18+ (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 3: Install Git and Clone Your Repository

```bash
# Install Git
apt install -y git

# Navigate to a suitable directory
cd /var/www

# Clone your repository
git clone https://github.com/YOUR_USERNAME/lunchbox.git
cd lunchbox
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 4: Install Dependencies and Create .env File

```bash
# Install Node dependencies
npm install

# Create .env file
nano .env
```

Paste this (press Ctrl+X, then Y, then Enter to save):

```
PORT=3000
JWT_SECRET=GharKaZaiqaSecret2026!

# Email Configuration (optional)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
# EMAIL_FROM=your-email@gmail.com
```

---

## Step 5: Install PM2 (Process Manager)

PM2 keeps your app running, restarts it on crashes, and auto-starts on server reboot.

```bash
# Install PM2 globally
npm install -g pm2

# Start your backend with PM2
pm2 start server.js --name "lunchbox-backend"

# Make it start on system reboot
pm2 startup
pm2 save
```

Verify it's running:

```bash
pm2 status
```

You should see something like:

```
id │ name               │ namespace   │ version │ mode    │ pid      │ status    │ restart
0  │ lunchbox-backend   │ default     │ 1.0.0   │ fork    │ 12345    │ online    │ 0
```

---

## Step 6: Set Up Nginx as Reverse Proxy (Recommended)

This allows you to run multiple sites, handle SSL, and improves security.

> If your Next.js app already has an Nginx config, you should edit that existing config rather than creating a new server block. Use the same `server` block and add a `location /api/` proxy rule for the backend.
>
> If you want the backend on a separate domain or subdomain, then a separate site config is fine.

```bash
# Install Nginx
apt install -y nginx

# Create or edit Nginx config
nano /etc/nginx/sites-available/lunchbox
```

Paste this (replace `YOUR_VPS_IP_OR_DOMAIN` with your actual IP or domain):

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP_OR_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Save with Ctrl+X, Y, Enter.

Enable the config:

```bash
# Enable the site
ln -s /etc/nginx/sites-available/lunchbox /etc/nginx/sites-enabled/

# Test Nginx config
nginx -t

# Restart Nginx
systemctl restart nginx

# Enable Nginx to start on reboot
systemctl enable nginx
```

---

## Step 7: Set Up SSL/HTTPS (FREE with Let's Encrypt)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d YOUR_VPS_IP_OR_DOMAIN
```

Follow the prompts. Certbot will auto-configure Nginx for HTTPS.

Verify SSL works:

- Visit `https://YOUR_VPS_IP_OR_DOMAIN/api/gallery`
- Should show your gallery data as JSON

---

## Step 8: Update Frontend Configuration

Once your backend is running on your VPS, update the frontend:

1. Edit `assets/js/config.js`:

```javascript
window.__CONFIG = {
  backendUrl:
    window.location.protocol === "file:"
      ? "http://localhost:3000"
      : "https://YOUR_VPS_IP_OR_DOMAIN", // Your VPS URL
};
```

2. Push to GitHub:

```bash
git add assets/js/config.js
git commit -m "Update backend URL to VPS"
git push
```

3. Netlify auto-redeploys ✅

---

## Step 9: Update Backend When Needed

When you make changes to your backend code:

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Navigate to project
cd /var/www/lunchbox

# Pull latest code
git pull origin main

# Restart backend
pm2 restart lunchbox-backend

# Check if restarted successfully
pm2 status
```

---

## Useful PM2 Commands

```bash
# View logs
pm2 logs lunchbox-backend

# View real-time status
pm2 monit

# Stop the app
pm2 stop lunchbox-backend

# Restart the app
pm2 restart lunchbox-backend

# Delete from PM2
pm2 delete lunchbox-backend

# List all apps
pm2 list
```

---

## Troubleshooting

### App won't start

```bash
pm2 logs lunchbox-backend
```

Check the error message.

### Port 3000 already in use

```bash
lsof -i :3000
kill -9 PID
```

(Replace PID with the process ID)

### Nginx shows "502 Bad Gateway"

1. Check if app is running: `pm2 status`
2. Check app logs: `pm2 logs lunchbox-backend`
3. Restart: `pm2 restart lunchbox-backend`

### SSL certificate issues

```bash
# Check certificate status
certbot certificates

# Renew manually
certbot renew
```

### Can't connect to VPS

- Check VPS provider firewall rules (allow ports 22, 80, 443)
- Check SSH key permissions: `chmod 600 ~/.ssh/your_key`

---

## Quick Reference

| Task             | Command                        |
| ---------------- | ------------------------------ |
| SSH into VPS     | `ssh root@YOUR_VPS_IP`         |
| View app logs    | `pm2 logs lunchbox-backend`    |
| Restart app      | `pm2 restart lunchbox-backend` |
| Pull latest code | `git pull origin main`         |
| Check Nginx      | `systemctl status nginx`       |
| Check SSL cert   | `certbot certificates`         |

---

## Deployment Checklist

- [ ] SSH into VPS
- [ ] Install Node.js & npm
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Create `.env` file
- [ ] Install PM2
- [ ] Start app with PM2
- [ ] Install & configure Nginx
- [ ] Set up SSL certificate
- [ ] Update `assets/js/config.js` with VPS URL
- [ ] Verify backend is working (`https://YOUR_URL/api/gallery`)
- [ ] Redeploy frontend on Netlify

---

## Quick Test

After setup, test everything works:

```bash
# On your local machine
curl https://YOUR_VPS_IP_OR_DOMAIN/api/gallery
```

Should output your gallery data as JSON (not an error).

Then visit your Netlify site and check:

- Gallery loads ✓
- Admin login works ✓
- No 404 errors in console ✓
