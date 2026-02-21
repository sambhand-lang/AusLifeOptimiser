# 🚀 Netlify Deployment - Quick Start

**Complete step-by-step guide to deploy AusFinanceTools to Netlify**

---

## What Gets Deployed

| Component | Platform | Details |
|-----------|----------|---------|
| **Frontend** | Netlify Static | React/Vite app (app/dist/) |
| **API** | Netlify Functions | Express routes → Serverless functions |
| **Database** | Bundled SQLite | suburbs.db (bundled with deployment) |
| **Domain** | Netlify/Custom | Auto HTTPS, CDN, DDoS protection |

---

## Prerequisites (5 minutes)

- [ ] Netlify account (free at https://netlify.com)
- [ ] GitHub account with repository
- [ ] Local machine with Node.js 20+
- [ ] Git CLI installed

---

## Phase 1: Local Preparation (10 minutes)

### Step 1.1: Clean Up Repository

```bash
cd c:\Sameer\Projects\AusFinanceTools

# Remove temporary directories
rm -r tmpclaude-* 2>/dev/null || true

# Check what will be committed
git status
```

### Step 1.2: Install Dependencies

```bash
# Root install
npm install

# Frontend
cd app && npm install && cd ..

# Backend
cd backend && npm install && cd ..

echo "✓ All dependencies installed"
```

### Step 1.3: Test Build Locally

```bash
# Frontend build
cd app
npm run build
cd ..

# Verify output
ls -lah app/dist/
echo "✓ Frontend builds successfully"
```

### Step 1.4: Verify Database

```bash
# Check database exists
ls -lah backend/suburbs.db

# Quick validation
sqlite3 backend/suburbs.db "SELECT COUNT(*) FROM suburbs;" | head -1
echo "✓ Database is valid and contains data"
```

---

## Phase 2: GitHub Setup (5 minutes)

### Step 2.1: Commit Changes

```bash
cd c:\Sameer\Projects\AusFinanceTools

git add .
git commit -m "Setup Netlify deployment configuration

- Add netlify.toml with build configuration
- Create Netlify Functions for API endpoints
- Add deployment guides and scripts
- Configure environment variables"

git push origin main
```

### Step 2.2: Verify Repository

Visit your GitHub repository:
```
https://github.com/YOUR_USERNAME/AusFinanceTools
```

Verify:
- ✅ netlify.toml exists in root
- ✅ netlify/functions/ directory with api.ts and health.ts
- ✅ app/package.json has build script
- ✅ backend/suburbs.db is committed

---

## Phase 3: Netlify Setup (10 minutes)

### Step 3.1: Connect Repository

1. Go to https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose platform: **GitHub**
4. Authorize Netlify to access your GitHub
5. Select repository: **AusFinanceTools**

### Step 3.2: Configure Build Settings

Should auto-detect, but verify:

| Setting | Value |
|---------|-------|
| **Build command** | `node scripts/prepare-netlify-deployment.js && cd app && npm run build` |
| **Publish directory** | `app/dist` |
| **Base directory** | (leave empty) |
| **Node version** | `20.x` |

### Step 3.3: Set Environment Variables

Click **"Edit settings"** or go to **Site Settings → Build & Deploy → Environment**

Add these variables:

```
NODE_ENV = production
DATABASE_PATH = ./suburbs.db
VITE_API_URL = /.netlify/functions
```

Click **"Save"**

### Step 3.4: Deploy

Click **"Deploy site"**

Wait for build to complete (should take 2-3 minutes):

```
✓ Install dependencies  
✓ Build frontend  
✓ Deploy to CDN  
✓ Site is live at: https://YOUR_SITE_NAME.netlify.app
```

---

## Phase 4: Verification (10 minutes)

### Step 4.1: Visit Your Site

```
https://YOUR_SITE_NAME.netlify.app
```

Should see the AusFinanceTools interface loading.

### Step 4.2: Check Build Logs

1. Go to Netlify dashboard
2. Click your site
3. **Deploys** → Latest deploy
4. Scroll down to view build log

Look for:
- ✅ "Build completed successfully"
- ✅ "Frontend build successful"  
- ✅ "Published to main site"

### Step 4.3: Test API Endpoints

```bash
# Health check
curl https://YOUR_SITE_NAME.netlify.app/.netlify/functions/health

# Expected response:
# {"status":"healthy","database":"connected","tables":{"suburbs":18519,...}}
```

### Step 4.4: Test in Browser

1. Open browser DevTools (F12)
2. Go to Console tab
3. Visit any page with suburb search
4. Check that:
   - ✅ API calls succeed (Network tab: 200 status)
   - ✅ Data loads and displays
   - ✅ No errors in console

---

## Phase 5: Post-Deployment (Optional)

### Step 5.1: Custom Domain

1. **Site Settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., ausfinancetools.com.au)
4. Netlify provides DNS instructions
5. Update your domain registrar DNS settings
6. Wait 24-48 hours for propagation

### Step 5.2: Configure Analytics

1. **Site Settings** → **Analytics**
2. Enable Netlify Analytics (optional, paid feature)
3. Or use Google Analytics integration

### Step 5.3: Set Up Continuous Deployment

Already enabled! Every push to main branch auto-deploys.

To disable:
1. **Site Settings** → **Build & deploy** → **Continuous deployment**
2. Click **"Disable**" if needed

---

## Complete Checklist

### Pre-Deployment
- [ ] Repository cleaned (no tmpclaude-* files)
- [ ] All dependencies installed
- [ ] Frontend builds: `npm run build` ✓
- [ ] Database verified: `ls backend/suburbs.db` ✓
- [ ] netlify.toml exists in root
- [ ] Netlify functions created
- [ ] Changes committed to GitHub
- [ ] Pushed to main branch

### Deployment
- [ ] Repository connected to Netlify
- [ ] Build settings configured
- [ ] Environment variables set
- [ ] First deploy succeeded (check logs)
- [ ] Site is live at netlify URL

### Post-Deployment
- [ ] Frontend loads without errors
- [ ] API endpoints respond (health check: 200)
- [ ] Suburb search works
- [ ] Data displays correctly
- [ ] No console errors
- [ ] Custom domain configured (optional)

---

## Troubleshooting

### Build Fails: "Cannot find module"

```bash
# Rebuild locally first
cd app && npm install && npm run build && cd ..

# Check if netlify.toml is correct
cat netlify.toml | head -20
```

### 404 on API endpoints

1. Check Functions in Netlify dashboard
2. Verify function files exist: `netlify/functions/api.ts`
3. Redeploy: `git push` (or manual deploy button in Netlify)

### Database file not found

1. Verify file exists: `git lfs ls-files | grep suburbs.db` or `ls backend/suburbs.db`
2. Ensure committed: `git log --follow backend/suburbs.db | head -5`
3. Redeploy with: `netlify deploy --prod --build`

### API URL errors in browser

Check that `VITE_API_URL = /.netlify/functions` is set in Netlify environment.

**For detailed troubleshooting:** See [NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md](./NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md)

---

## Deployment Commands Reference

```bash
# Deploy via CLI (after netlify login)
netlify deploy --prod --build

# Just deploy pre-built dist (if build already done)
netlify deploy --prod --dir=app/dist

# Test build locally
netlify build

# Check site status
netlify status

# View logs
netlify functions:invoke health --debug
```

---

## What's Deployed

### Frontend
```
✓ React app
✓ All UI components
✓ Styling (Tailwind CSS)
✓ Static assets
```

### API (Serverless Functions)
```
✓ GET /api/v2/suburbs/:ssc/details
✓ GET /api/dropdowns/suburbs
✓ GET /api/suburbs/states
✓ GET /health (status check)
```

### Database
```
✓ 18,519 suburbs
✓ Demographics data
✓ Postcode mappings
✓ Geographic data
```

### Infrastructure
```
✓ Global CDN (Netlify Edge Network)
✓ Automatic HTTPS/SSL
✓ DDoS protection
✓ Continuous deployment
✓ Auto scaling
```

---

## Performance & Limits

| Feature | Netlify Free | Limits |
|---------|--------------|--------|
| Build minutes | 300/month | Plenty! |
| Serverless functions | Unlimited | 26s timeout |
| Bandwidth | Unlimited | For normal use |
| Concurrent connections | Unlimited | 100 per function |
| Database | ~100 MB SQLite | No additional cost |

---

## Monitoring & Maintenance

### Weekly Checks ✓
```bash
# Check function execution logs
# In Netlify dashboard: Functions → Logs

# Monitor errors
# In Netlify dashboard: Analytics → Errors
```

### Monthly Tasks ✓
1. Update dependencies: `npm update`
2. Rebuild database: `node backend/populate_demographics.js`
3. Test API endpoints
4. Review deployment logs

### Quarterly Tasks ✓
1. Database optimization: `VACUUM` SQLite command
2. Audit security settings
3. Update SSL certificate (auto-renewed)

---

## Support & Help

**Getting Help:**
1. Check **[NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md](./NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md)**
2. View build logs in Netlify dashboard
3. Netlify support: https://support.netlify.com
4. Documentation: https://docs.netlify.com

---

## Success! 🎉

Your site is now live!

**Website:** https://YOUR_SITE_NAME.netlify.app (or custom domain)

**Next:**
- Share with users
- Monitor performance
- Collect feedback
- Plan enhancements

---

## Quick Command Reference

```bash
# Preparation (one-time)
npm install
cd app && npm install && cd ..
cd backend && npm install && cd ..

# Build locally (test before deploy)
cd app && npm run build && cd ..

# Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Your changes"
git push origin main

# Manual deploy via CLI
netlify deploy --prod --build

# Check deployment
curl https://YOUR_SITE_NAME.netlify.app/.netlify/functions/health

# View logs
netlify functions:invoke health --debug
```

---

**Ready?** Start with Phase 1! ⬆️

