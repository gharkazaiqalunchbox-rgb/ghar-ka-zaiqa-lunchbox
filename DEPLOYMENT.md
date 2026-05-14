# Backend Deployment Guide

Your backend is now ready to deploy. Choose one of these options:

## Option 1: Deploy to Your VPS (Best for Full Control)

If you have your own VPS server, this is the most cost-effective option.

👉 **See [DEPLOYMENT_VPS.md](DEPLOYMENT_VPS.md) for complete VPS setup instructions**

This option gives you:

- Full control over your server
- No vendor lock-in
- Better performance (usually)
- Ability to run multiple projects

---

## Option 2: Deploy to Render.com (Recommended - No Server Management)

### Step 1: Prepare Your Repository

1. Push your code to GitHub (Render needs a Git repository):

   ```bash
   git init
   git add .
   git commit -m "Initial commit - Ghar Ka Zaiqa backend"
   git remote add origin https://github.com/YOUR_USERNAME/lunchbox.git
   git push -u origin main
   ```

2. Ensure `.env` is in `.gitignore` (already done) so secrets aren't exposed

### Step 2: Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (recommended)
3. Click "New +"

### Step 3: Deploy Web Service

1. Select **"Web Service"**
2. Connect your GitHub repository (`lunchbox`)
3. Fill in the details:
   - **Name**: `ghar-ka-zaiqa-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (scroll down to see it)

4. Click **"Advanced"** and add **Environment Variables**:

   ```
   PORT=3000
   JWT_SECRET=GharKaZaiqaSecret2026!
   ```

   (Add email vars if you want email functionality)

5. Click **"Create Web Service"**

6. Wait 2-3 minutes for deployment. You'll see a URL like:
   ```
   https://ghar-ka-zaiqa-backend.render.com
   ```

### Step 4: Update Frontend

1. In your project, edit `assets/js/config.js`
2. Change this line:

   ```javascript
   backendUrl: window.location.protocol === "file:"
     ? "http://localhost:3000"
     : "http://localhost:3000"; // CHANGE THIS
   ```

3. To:

   ```javascript
   backendUrl: window.location.protocol === "file:"
     ? "http://localhost:3000"
     : "https://ghar-ka-zaiqa-backend.render.com"; // Your Render URL
   ```

4. Save and push to Netlify:

   ```bash
   git add assets/js/config.js
   git commit -m "Update backend URL for production"
   git push
   ```

5. Your Netlify site will auto-redeploy with the new backend URL

---

## Option 3: Deploy to Railway.app (Alternative)

### Step 1: Connect Repository

1. Go to [Railway.app](https://railway.app)
2. Click "Create New Project"
3. Select "Deploy from GitHub"
4. Choose your `lunchbox` repository

### Step 2: Add Environment Variables

1. Click the **Variables** tab
2. Add:
   - `PORT` = `3000`
   - `JWT_SECRET` = `GharKaZaiqaSecret2026!`

### Step 3: Deploy

1. Railway auto-deploys
2. Your backend URL will be something like:

   ```
   https://your-app-name.up.railway.app
   ```

3. Update `config.js` with this URL (same as Step 4 above)

---

## Option 4: Deploy to Heroku (Free Tier Ending Soon)

Heroku's free tier is being phased out. Use Render or Railway instead.

---

## Testing Your Deployment

### Local Testing (Before Deployment)

1. Start your backend:

   ```bash
   npm start
   ```

2. Open [http://localhost:3000/api/gallery](http://localhost:3000/api/gallery)
   - Should see your gallery data as JSON

3. Open your frontend (Netlify URL or localhost)
   - Check browser console for errors
   - Gallery should load
   - Admin panel should work

### Production Testing

1. Check your backend URL directly:

   ```
   https://your-deployed-url.com/api/gallery
   ```

   - Should return JSON

2. Visit your Netlify site
   - Check browser console (F12 > Console tab)
   - Should NOT see 404 errors for API calls
   - Gallery should display
   - Admin features should work

---

## Troubleshooting

### "Cannot find module" errors

- Make sure all `dependencies` in `package.json` are listed
- Run `npm install` locally and commit `package-lock.json`

### Backend won't start

- Check environment variables are set correctly
- Look at deployment logs in Render/Railway dashboard
- Try running locally: `npm start`

### API calls still show 404

- Verify `config.js` has the correct backend URL
- Check it's `https://` not `http://` (Netlify requires https)
- Clear browser cache and hard refresh (Ctrl+Shift+R)

### "Cannot read property of undefined" in console

- Make sure `config.js` loads before `gharka.js`
- Check that `window.__CONFIG.backendUrl` exists in console

---

## Environment Variables Reference

| Variable   | Example                   | Notes                                        |
| ---------- | ------------------------- | -------------------------------------------- |
| PORT       | 3000                      | Server port (Render sets this automatically) |
| JWT_SECRET | GharKaZaiqaSecret2026!    | Keep this secret!                            |
| EMAIL_HOST | smtp.gmail.com            | For sending emails (optional)                |
| EMAIL_PORT | 587                       | Usually 587 or 465                           |
| EMAIL_USER | your-email@gmail.com      | Your email address                           |
| EMAIL_PASS | your-app-password         | Gmail app password (16 chars)                |
| EMAIL_FROM | noreply@ghar-ka-zaiqa.com | Sender email                                 |

---

## Next Steps

1. ✅ Create `.env` file (done)
2. ✅ Update frontend code (done)
3. ⬜ Choose deployment option:
   - **VPS**: See [DEPLOYMENT_VPS.md](DEPLOYMENT_VPS.md)
   - **Render/Railway**: Follow Option 2/3 below
4. ⬜ Update `config.js` with your backend URL
5. ⬜ Redeploy frontend on Netlify
6. ⬜ Test everything works

---

## Questions?

- **Backend logs**: Check Render/Railway dashboard
- **Frontend errors**: Open browser DevTools (F12) > Console tab
- **API not responding**: Verify backend URL in `config.js`
