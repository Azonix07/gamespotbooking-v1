# 🚂 Railway Deployment Setup Guide

## Problem
The root `nixpacks.toml` and `railway.toml` were causing conflicts, leading to build failures (503 registry errors).

## ✅ Solution: Separate Backend and Frontend Services

### Step 1: Create Backend Service

1. Go to Railway Dashboard
2. Click **"New Service"** → **"GitHub Repo"**
3. Select repository: `Azonix07/gamespotbooking-v1`
4. Configure:
   - **Name**: `gamespot-backend`
   - **Root Directory**: `/backend`
   - **Build Method**: Auto-detect (will use `backend/Dockerfile`)
   - **Start Command**: Leave empty (uses Dockerfile CMD)

5. Add Environment Variables:
   ```
   SECRET_KEY=your-secret-key-here
   DB_HOST=your-railway-mysql-host
   DB_USER=root
   DB_PASSWORD=your-db-password
   DB_NAME=gamespot_booking
   DB_PORT=3306
   GEMINI_API_KEY=your-gemini-key (optional)
   ```

### Step 2: Create Frontend Service

1. Click **"New Service"** → **"GitHub Repo"** (same repo)
2. Configure:
   - **Name**: `gamespot-frontend`
   - **Root Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`

3. Add Environment Variables:
   ```
   REACT_APP_API_URL=https://your-backend-url.railway.app
   ```

### Step 3: Create MySQL Database

1. Click **"New Service"** → **"Database"** → **"Add MySQL**"
2. Railway will automatically create and connect the database
3. Get connection details from the database service variables

### Step 4: Connect Services

1. Backend service → Environment Variables → Add:
   - Use MySQL database variables (auto-populated)
   
2. Frontend service → Environment Variables → Add:
   - `REACT_APP_API_URL` = Backend service public URL

### Step 5: Deploy

1. Both services will auto-deploy on GitHub push
2. Backend will be at: `https://gamespot-backend-xxx.railway.app`
3. Frontend will be at: `https://gamespot-frontend-xxx.railway.app`

## 📝 Important Notes

- Root `nixpacks.toml` and `railway.toml` are now **disabled** (commented out)
- Each service uses its own configuration:
  - Backend: `/backend/Dockerfile` or `/backend/nixpacks.toml`
  - Frontend: `/frontend/Procfile` or auto-detected package.json
  
- The 503 registry error was caused by Railway trying to build both services from root
- Separate services = cleaner architecture + independent scaling

## 🔧 Current Configuration Status

- ✅ Root configs disabled to prevent conflicts
- ✅ Backend has its own Dockerfile + Procfile + nixpacks.toml
- ✅ Frontend has its own Procfile + server.js
- ⏳ **Action Required**: Create separate Railway services following steps above

## 🚀 After Setup

Once you create the separate services in Railway dashboard:
1. Update frontend `.env` with backend URL
2. Push any code changes → auto-deploys both services
3. Monitor logs separately for each service
