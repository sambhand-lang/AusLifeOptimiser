# Netlify Deployment Guide

**Status:** Complete step-by-step instructions for deploying AusFinanceTools to Netlify

---

## Overview

This guide covers deploying a full-stack React/Express app to Netlify using:
- **Frontend:** Vite + React (deployed as static HTML/JS)
- **Backend:** Express API → Netlify Functions
- **Database:** SQLite (bundled with deployment)

---

## Prerequisites

1. **GitHub Account** - Repository with code
2. **Netlify Account** - Free tier available at netlify.com
3. **Git CLI** - For pushing code
4. **Node.js 20+** - For local testing

---

## Step 1: Prepare Your Repository

### 1.1 Create/Update .gitignore

```bash
# Make sure sensitive files are not committed
echo "
*.env
*.env.local
.env.production.local
node_modules/
dist/
build/
.DS_Store
tmpclaude-*/
" >> .gitignore
```

### 1.2 Clean Up Temporary Files

```bash
# Remove temporary directories
rm -r tmpclaude-* nul
git status
```

### 1.3 Update Root package.json

```bash
cd c:\Sameer\Projects\AusFinanceTools
```

Create/verify root `package.json` includes:

```json
{
  "name": "ausfinancetools",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "install-all": "npm install && cd app && npm install && cd ../backend && npm install",
    "build": "cd app && npm run build"
  }
}
```

### 1.4 Verify netlify.toml Exists

```bash
# Check if netlify.toml exists in root
ls -la netlify.toml

# Should output the configuration file with build commands
```

---

## Step 2: Configure Environment Variables

### 2.1 Create .env.example

**File:** `backend/.env.example`

```env
NODE_ENV=production
PORT=5000
DATABASE_PATH=./suburbs.db
FRONTEND_URL=https://yourdomain.netlify.app
```

### 2.2 Set Up in Netlify Dashboard

When you connect to Netlify:
1. Go to **Site Settings → Build & Deploy → Environment**
2. Add these variables:
   ```
   NODE_ENV = production
   DATABASE_PATH = /tmp/app/backend/suburbs.db
   ```

---

## Step 3: Update Frontend Configuration

### 3.1 Update Vite Config

**File:** `app/vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

### 3.2 Update API Client

**File:** `app/src/services/api.ts` (or similar)

```typescript
// Use process.env.VITE_API_URL set in netlify.toml
const BASE_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export const fetchSuburbDetails = async (ssc: string) => {
  const response = await fetch(`${BASE_URL}/api/v2/suburbs/${ssc}/details`);
  return response.json();
};
```

---

## Step 4: Database Deployment

### 4.1 Bundle SQLite Database

The `suburbs.db` file should be:
- ✅ Included in Git (if < 100 MB)
- ✅ Located in `backend/suburbs.db`
- ✅ Read-only in production

### 4.2 Create Database Copy Script

**File:** `scripts/prepare-db.js`

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Copy database to root netlify directory
const sourceDb = path.join(__dirname, '../backend/suburbs.db');
const targetDb = path.join(__dirname, '../suburbs.db');

if (fs.existsSync(sourceDb)) {
  fs.copyFileSync(sourceDb, targetDb);
  console.log('✓ Database prepared for deployment');
} else {
  console.error('✗ Database not found at:', sourceDb);
  process.exit(1);
}
```

### 4.3 Add to netlify.toml

Update the build command:

```toml
[build]
  command = "node scripts/prepare-db.js && cd app && npm run build"
```

---

## Step 5: Deploy to Netlify

### Option A: Connect GitHub (Recommended)

1. **Push to GitHub**
   ```bash
   cd c:\Sameer\Projects\AusFinanceTools
   git add .
   git commit -m "Setup Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select GitHub → Authorize → Choose repository
   - Runtime: Node.js 20.x
   - Build command: (should auto-detect from netlify.toml)
   - Publish directory: `app/dist`

3. **Set Environment Variables**
   - Site Settings → Build & Deploy → Environment
   - Add variables (if not in netlify.toml)

4. **Deploy**
   - Netlify auto-deploys on push to main branch

### Option B: Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd c:\Sameer\Projects\AusFinanceTools
netlify deploy --prod --dir=app/dist

# Or with build
netlify deploy --prod --build
```

---

## Step 6: Verify Deployment

### 6.1 Check Build Logs
1. Go to Netlify dashboard
2. Site Settings → Deploys
3. Click latest deploy
4. Check build logs for errors

### 6.2 Test API Endpoints

```bash
# Health check
curl https://yourdomain.netlify.app/.netlify/functions/health

# Get suburbs dropdown
curl "https://yourdomain.netlify.app/.netlify/functions/api/dropdowns/suburbs?state=NSW"

# Get suburb details
curl "https://yourdomain.netlify.app/.netlify/functions/api/v2/suburbs/13610/details"
```

### 6.3 Test Frontend

1. Visit https://yourdomain.netlify.app
2. Check browser console for errors
3. Test suburb search functionality
4. Verify data loads from API

---

## Step 7: Post-Deployment Configuration

### 7.1 Custom Domain

1. Site Settings → Domain Management
2. Add custom domain or update DNS

### 7.2 Enable SSL

- Automatic with Netlify (Let's Encrypt)
- Already enabled by default

### 7.3 Set Up CI/CD

1. Site Settings → Build & Deploy → Continuous Deployment
2. Trigger deploys on:
   - Every push to main
   - Pull request preview builds

---

## Troubleshooting

### Build Fails: "Cannot find module '@netlify/functions'"

**Solution:**
```bash
npm install --save-dev @netlify/functions
```

### 404 on API Endpoints

**Check:**
- ✓ netlify.toml redirects are correct
- ✓ Function files are in `netlify/functions/`
- ✓ Functions are named correctly (api.ts, health.ts)

**Deploy again:**
```bash
netlify deploy --prod --build
```

### Database File Missing

**Check:**
- ✓ `backend/suburbs.db` exists and is committed
- ✓ File size < 100MB
- ✓ Git LFS not needed for this size

**Verify:**
```bash
ls -lh backend/suburbs.db
```

### Frontend Can't Connect to API

**Check environment:**
```javascript
console.log('API URL:', process.env.VITE_API_URL);
```

**Verify in netlify.toml:**
```toml
[build.environment]
  VITE_API_URL = "/.netlify/functions"
```

---

## Production Checklist

- [ ] Repository cleaned (no tmpclaude-* files)
- [ ] netlify.toml in root directory
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Netlify functions created (api.ts, health.ts)
- [ ] Database bundled and committed
- [ ] Environment variables set
- [ ] API endpoints tested locally
- [ ] .gitignore updated
- [ ] GitHub repository synced
- [ ] Netlify site connected
- [ ] Build logs show no errors
- [ ] API endpoints responding
- [ ] Frontend loading data
- [ ] Custom domain configured (optional)

---

## Useful Links

- **Netlify Dashboard:** https://app.netlify.com
- **Netlify Functions Docs:** https://docs.netlify.com/functions/overview/
- **Netlify CLI:** https://netlify.com/products/cli
- **Environment Variables:** https://docs.netlify.com/configure-builds/environment-variables/

---

## Next Steps

1. **Prepare Repository**
   ```bash
   cd c:\Sameer\Projects\AusFinanceTools
   git status
   rm -r tmpclaude-*
   ```

2. **Test Locally**
   ```bash
   npm run install-all
   npm run build
   ```

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for Netlify deployment"
   git push
   ```

4. **Connect to Netlify**
   - Visit https://app.netlify.com
   - Connect GitHub repository
   - Configure build settings
   - Deploy

5. **Verify**
   - Check build logs
   - Test API endpoints
   - Visit your site

---

## Quick Deploy (CLI)

```bash
cd c:\Sameer\Projects\AusFinanceTools

# Clean up
rm -r tmpclaude-*

# Build
cd app && npm run build && cd ..

# Deploy
netlify deploy --prod --dir=app/dist
```

---

**Issues?** Check [NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md](./NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md)

