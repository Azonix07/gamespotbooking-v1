# Deploy Next.js Frontend to Railway

## 📋 Prerequisites
- GitHub repository with the code pushed
- Railway account (sign up at https://railway.app)
- Your backend Flask API already deployed on Railway

## 🔐 Step 1: Push Code to GitHub

First, authenticate with GitHub and push your code:

```bash
# If you need to re-authenticate with GitHub
# Option 1: Use GitHub CLI
gh auth login

# Option 2: Use SSH instead of HTTPS
cd /Users/abhijithca/Documents/GitHub/gamespotweb
git remote set-url origin git@github.com:Azonix07/gamespotbooking-v1.git
git push origin main
```

**OR** manually push from GitHub Desktop or VS Code's Source Control panel.

---

## 🚂 Step 2: Deploy to Railway

### Method A: Deploy via Railway Dashboard (Recommended)

1. **Go to Railway Dashboard**
   - Visit https://railway.app
   - Log in with your GitHub account

2. **Create New Project**
   - Click **"New Project"**
   - Select **"Deploy from GitHub repo"**
   - Choose `Azonix07/gamespotbooking-v1`

3. **Configure Root Directory** ⚠️ **CRITICAL STEP**
   - After selecting the repo, Railway will try to build
   - **IMMEDIATELY** click **"Settings"** tab (before the build fails)
   - Scroll down to **"Service Settings"** section
   - Find **"Root Directory"** field
   - Enter: `next-frontend`
   - Click **"Update"** to save
   - Railway will automatically restart the build from the correct directory

4. **Add Environment Variables**
   - Go to **"Variables"** tab
   - Add these variables:

   ```
   NODE_ENV=production
   NEXT_PUBLIC_API_BASE_URL=https://gamespotbooking-v1-production.up.railway.app
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   PORT=3000
   ```

   **Important**: Replace `YOUR_GOOGLE_CLIENT_ID` with your actual Google OAuth client ID.

5. **Deploy**
   - Railway will automatically build and deploy
   - Wait 2-3 minutes for the build to complete
   - You'll get a URL like: `https://your-app-name.railway.app`

6. **Add Custom Domain (Optional)**
   - Go to **"Settings"** → **"Domains"**
   - Click **"Generate Domain"** for a Railway subdomain
   - Or add your custom domain `gamespotkdlr.com`:
     - Click **"Custom Domain"**
     - Enter `gamespotkdlr.com`
     - Add the CNAME record to your DNS provider:
       ```
       CNAME  @  your-app-name.railway.app
       ```

---

### Method B: Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize Railway project
cd /Users/abhijithca/Documents/GitHub/gamespotweb/next-frontend
railway init

# Link to existing project (if you already created one)
railway link

# Deploy
railway up
```

---

## 📁 Project Structure for Railway

Railway expects this structure:

```
gamespotweb/
├── backend/              # Your Flask backend (already deployed)
│   ├── app.py
│   ├── requirements.txt
│   └── ...
└── next-frontend/        # ← Railway should deploy THIS directory
    ├── package.json
    ├── next.config.js
    ├── .gitignore
    ├── src/
    │   └── app/
    └── public/
```

---

## ⚙️ Railway Configuration Files (Optional but Recommended)

### Create `railway.toml` in `next-frontend/`:

```toml
[build]
builder = "nixpacks"
buildCommand = "npm ci && npm run build"

[deploy]
startCommand = "npm start"
restartPolicyType = "always"
```

### Create `nixpacks.toml` in `next-frontend/`:

```toml
[phases.setup]
nixPkgs = ['nodejs_20']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm start'
```

---

## 🔧 Environment Variables for Railway

Add these in the Railway dashboard under **Variables**:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `NEXT_PUBLIC_API_BASE_URL` | `https://gamespotbooking-v1-production.up.railway.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Your Google OAuth Client ID |
| `PORT` | `3000` |

---

## 🌐 Update Google OAuth for Production

Once you get your Railway URL, update Google OAuth settings:

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Add **Authorized JavaScript origins**:
   ```
   https://your-app-name.railway.app
   https://gamespotkdlr.com
   ```
4. Add **Authorized redirect URIs**:
   ```
   https://your-app-name.railway.app/login
   https://gamespotkdlr.com/login
   ```

---

## 🔍 Verify Deployment

After deployment:

1. **Check Build Logs**
   - Go to Railway dashboard → **Deployments** tab
   - Click on the latest deployment
   - Check for errors in build/deploy logs

2. **Test Your Site**
   - Visit your Railway URL
   - Test homepage (should be fast, no scroll)
   - Test login with Google OAuth
   - Check browser console for errors

3. **Verify SEO**
   ```bash
   curl -I https://your-app-name.railway.app
   ```
   Should return `200 OK`

4. **Test Sitemap & Robots**
   - Visit `https://your-app-name.railway.app/sitemap.xml`
   - Visit `https://your-app-name.railway.app/robots.txt`

---

## 🚀 Automatic Deployments

Railway automatically redeploys on git push:

1. Make changes to `next-frontend/`
2. Commit and push to GitHub:
   ```bash
   cd /Users/abhijithca/Documents/GitHub/gamespotweb
   git add next-frontend/
   git commit -m "Update frontend"
   git push origin main
   ```
3. Railway will automatically detect the push and redeploy

---

## 🐛 Troubleshooting

### ❌ "No start command was found" Error

**Problem**: Railway is building from the root directory instead of `next-frontend/`

**Solution**:
1. Go to Railway dashboard
2. Click **"Settings"** tab
3. Scroll to **"Service Settings"**
4. Set **"Root Directory"** to: `next-frontend`
5. Click **"Update"**
6. Railway will automatically redeploy from the correct directory

### Build Fails
- Check Railway logs for specific error
- Ensure `package.json` has all dependencies
- Verify `NEXT_PUBLIC_*` env vars are set

### "Module not found" Error
- Make sure all imports use correct paths
- Check `tsconfig.json` paths are correct

### Google OAuth Not Working
- Verify `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set
- Update Google Console with Railway URL
- Check redirect URIs match exactly

### Images/Assets Not Loading
- Ensure images are in `public/` folder
- Check `next.config.js` image configuration
- Verify paths start with `/` (e.g., `/assets/images/logo.png`)

### API Calls Failing
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Check CORS settings on Flask backend
- Test API directly: `curl https://gamespotbooking-v1-production.up.railway.app/health`

---

## 📊 Performance Optimization

Your Next.js app is already optimized with:
- ✅ Dynamic imports for all pages
- ✅ Font optimization (next/font)
- ✅ Image optimization (next/image)
- ✅ Gaming-themed loading animation
- ✅ Deferred video loading
- ✅ Conditional Google OAuth Provider
- ✅ Static sitemap and robots.txt

Railway will handle:
- Automatic CDN for static assets
- HTTP/2 & Brotli compression
- Global edge network
- SSL certificates

---

## 💰 Railway Pricing

- **Free Trial**: $5 credit (enough for 1-2 weeks)
- **Hobby Plan**: $5/month per service
- **Pro Plan**: $20/month (better resources)

Your Next.js frontend should cost ~$5/month on the Hobby plan.

---

## 📝 Next Steps After Deployment

1. **Update DNS** to point `gamespotkdlr.com` to Railway
2. **Submit sitemap** to Google Search Console:
   - Add property for `https://gamespotkdlr.com`
   - Submit `https://gamespotkdlr.com/sitemap.xml`
3. **Replace SEO placeholders** in `src/app/page.tsx`:
   - Phone number: `+91-XXXXXXXXXX`
   - GPS coordinates: `10.2269, 76.1950`
   - Review count, address, etc.
4. **Add Google verification** code in `src/app/layout.tsx`
5. **Monitor performance** with Railway's built-in metrics

---

## 🎉 Done!

Your Next.js frontend will be live at:
- **Railway URL**: `https://your-app-name.railway.app`
- **Custom Domain**: `https://gamespotkdlr.com` (after DNS setup)

The site is now:
- ✅ SEO-optimized for `gamespotkdlr.com`
- ✅ No hydration errors
- ✅ Homepage fits in viewport (no scroll)
- ✅ Crisp console icons
- ✅ Fast loading with optimizations
- ✅ Ready for Google indexing
