#!/bin/bash
# Deploy AusFinanceTools to Netlify - Complete Script
# Copy and paste these commands, section by section

echo "🚀 AusFinanceTools - Netlify Deployment Script"
echo "=================================================="
echo ""

# ============================================================================
# PHASE 1: LOCAL PREPARATION
# ============================================================================

echo "📋 PHASE 1: LOCAL PREPARATION"
echo "Time: ~10 minutes"
echo ""

# Step 1.1: Navigate to project
echo "Step 1.1: Navigate to project root"
echo "$ cd c:\Sameer\Projects\AusFinanceTools"
cd c:\Sameer\Projects\AusFinanceTools

# Step 1.2: Clean up temporary files
echo "Step 1.2: Remove temporary directories"
echo "$ rm -r tmpclaude-* nul 2>/dev/null || true"
rm -r tmpclaude-* 2>/dev/null || true
if [ -f nul ]; then rm nul; fi

# Step 1.3: Check git status
echo "Step 1.3: Check what will be deployed"
echo "$ git status"
git status

# Step 1.4: Install all dependencies
echo ""
echo "Step 1.4: Installing dependencies..."
echo "$ npm install"
npm install
echo "$ cd app && npm install && cd .."
cd app && npm install && cd ..
echo "$ cd backend && npm install && cd .."
cd backend && npm install && cd ..

# Step 1.5: Build frontend
echo ""
echo "Step 1.5: Building frontend..."
echo "$ cd app && npm run build && cd .."
cd app && npm run build && cd ..

# Step 1.6: Verify database
echo ""
echo "Step 1.6: Verifying database..."
echo "$ ls -lah backend/suburbs.db"
ls -lah backend/suburbs.db
echo ""
echo "$ sqlite3 backend/suburbs.db \"SELECT COUNT(*) FROM suburbs;\""
sqlite3 backend/suburbs.db "SELECT COUNT(*) FROM suburbs;"

echo ""
echo "✅ PHASE 1 COMPLETE"
echo ""

# ============================================================================
# PHASE 2: GITHUB SETUP
# ============================================================================

echo "📝 PHASE 2: GITHUB SETUP"
echo "Time: ~5 minutes"
echo ""

echo "Step 2.1: Staging changes"
echo "$ git add ."
git add .

echo ""
echo "Step 2.2: Create commit"
echo "$ git commit -m \"Setup Netlify deployment\""
git commit -m "Setup Netlify deployment

- Add netlify.toml with build configuration
- Create Netlify Functions for API endpoints
- Add deployment guides and scripts
- Configure environment variables
- Add database bundling script"

echo ""
echo "Step 2.3: Push to GitHub"
echo "$ git push origin main"
git push origin main

echo ""
echo "✅ PHASE 2 COMPLETE"
echo ""
echo "⚠️  Next: Go to https://github.com/YOUR_USERNAME/AusFinanceTools"
echo "   Verify files are there:"
echo "   ✓ netlify.toml"
echo "   ✓ netlify/functions/api.ts"
echo "   ✓ netlify/functions/health.ts"
echo "   ✓ app/dist/ (built files)"
echo ""

# ============================================================================
# PHASE 3: NETLIFY SETUP (MANUAL)
# ============================================================================

echo "🌐 PHASE 3: NETLIFY SETUP (MANUAL IN BROWSER)"
echo "Time: ~10 minutes"
echo ""

echo "Instructions (manual steps in browser):"
echo ""
echo "1. Go to https://app.netlify.com"
echo "2. Click [Add new site] → [Import an existing project]"
echo "3. Choose [GitHub]"
echo "4. Authorize Netlify"
echo "5. Select repository: AusFinanceTools"
echo ""
echo "6. Configure build settings:"
echo "   Build command: node scripts/prepare-netlify-deployment.js && cd app && npm run build"
echo "   Publish directory: app/dist"
echo "   Node version: 20.x"
echo ""
echo "7. Set environment variables:"
echo "   NODE_ENV = production"
echo "   DATABASE_PATH = ./suburbs.db"
echo "   VITE_API_URL = /.netlify/functions"
echo ""
echo "8. Click [Deploy site]"
echo ""
echo "⏳ Wait 2-3 minutes for deployment..."
echo ""

# ============================================================================
# PHASE 4: VERIFICATION (CLI)
# ============================================================================

echo ""
echo "✅ PHASE 4: VERIFICATION"
echo "Time: ~5 minutes"
echo ""

echo "After deployment, run these tests:"
echo ""
echo "1. Check build logs in Netlify dashboard"
echo "   - Deploys → Click latest deploy"
echo "   - Scroll down to see build log"
echo ""
echo "2. Test API health endpoint:"
echo "   $ curl https://YOUR_SITE_NAME.netlify.app/.netlify/functions/health"
echo ""
echo "   Expected response:"
echo '   {"status":"healthy","database":"connected","tables":{"suburbs":18519,...}}'
echo ""
echo "3. Test suburb search:"
echo "   $ curl \"https://YOUR_SITE_NAME.netlify.app/.netlify/functions/api/dropdowns/suburbs?state=NSW\""
echo ""
echo "4. Visit site in browser:"
echo "   https://YOUR_SITE_NAME.netlify.app"
echo ""
echo "   Should see:"
echo "   ✓ AusFinanceTools interface"
echo "   ✓ Suburb search working"
echo "   ✓ Data loading from API"
echo "   ✓ No console errors"
echo ""

# ============================================================================
# PHASE 5: POST-DEPLOYMENT (OPTIONAL)
# ============================================================================

echo ""
echo "🎉 PHASE 5: POST-DEPLOYMENT (OPTIONAL)"
echo ""

echo "Optional advanced setup:"
echo ""
echo "1. Add custom domain:"
echo "   - Site Settings → Domain management"
echo "   - Add custom domain"
echo "   - Update DNS records (instructions provided)"
echo ""
echo "2. Enable Netlify Analytics:"
echo "   - Site Settings → Analytics"
echo "   - Enable (paid feature, optional)"
echo ""
echo "3. Setup monitoring:"
echo "   - Integrations → Add service"
echo "   - Sentry, DataDog, New Relic, etc."
echo ""

# ============================================================================
# FINAL STATUS
# ============================================================================

echo ""
echo "=================================================="
echo "🚀 DEPLOYMENT COMPLETE!"
echo "=================================================="
echo ""
echo "✅ Your site is live at:"
echo "   https://YOUR_SITE_NAME.netlify.app"
echo ""
echo "📚 Documentation:"
echo "   - Quick Start: DEPLOY_QUICK_START.md"
echo "   - Full Guide: NETLIFY_DEPLOYMENT_GUIDE.md"
echo "   - Troubleshooting: NETLIFY_DEPLOYMENT_TROUBLESHOOTING.md"
echo ""
echo "🔗 Useful links:"
echo "   - Dashboard: https://app.netlify.com"
echo "   - Docs: https://docs.netlify.com"
echo "   - Functions: https://docs.netlify.com/functions/overview/"
echo ""
echo "📊 Next steps:"
echo "   1. Share site with users"
echo "   2. Monitor performance"
echo "   3. Collect feedback"
echo "   4. Plan enhancements"
echo ""
