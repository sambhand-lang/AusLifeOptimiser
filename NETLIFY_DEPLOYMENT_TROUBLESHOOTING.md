# Netlify Deployment Troubleshooting

---

## Build Failures

### "Build command failed"

**Common Causes:**
1. Wrong build command in netlify.toml
2. Missing dependencies
3. TypeScript errors

**Solutions:**
```bash
# Rebuild locally
cd c:\Sameer\Projects\AusFinanceTools\app
npm install
npm run build

# Check for errors
npm run lint
```

### "Cannot find module 'sqlite3'"

Add to netlify.toml:
```toml
[build.environment]
  NODE_MODULES_CACHE = "false"
```

This forces fresh npm install.

---

## API Endpoints Not Working

### 404 on /.netlify/functions/api

**Check:**
1. **Function files exist:** `netlify/functions/api.ts` should exist
2. **Correct naming:** Must be `api.ts` not `api.js` for TypeScript
3. **netlify.toml redirect:** Should match function name

**Verify redirect:**
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api:splat"
  status = 200
```

**Redeploy:**
```bash
netlify deploy --prod --build
```

### "CORS error" or "failed to fetch"

**Frontend issue - check:**
1. API URL is correct
2. CORS headers in response
3. Content-Type is application/json

**Check frontend code:**
```typescript
// Should use environment variable
const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

fetch(`${API_URL}/api/dropdowns/suburbs`)
```

### Database file not found

**Error:** "Error: ENOENT: no such file or directory, open '/app/suburbs.db'"

**Solutions:**

Step 1 - Verify file exists locally:
```bash
ls -la backend/suburbs.db
```

Step 2 - Ensure it's committed to Git:
```bash
git add backend/suburbs.db
git commit -m "Add database file"
git push
```

Step 3 - Update netlify.toml to copy DB:
```toml
[build]
  command = "cp backend/suburbs.db . && cd app && npm run build"
```

Step 4 - Redeploy:
```bash
netlify deploy --prod --build
```

---

## Frontend Not Loading

### Blank page or "Cannot GET /"

**Likely causes:**
1. Build output (app/dist) is empty
2. netlify.toml publish directory is wrong
3. index.html is missing

**Check:**
```bash
cd app
npm run build
ls -la dist/
cat dist/index.html | head -20
```

**If dist is empty:**
```bash
npm install
npm run build
```

**Verify netlify.toml:**
```toml
[build]
  publish = "app/dist"
```

### CSS/JS not loading (404 errors)

**Problem:** Assets deployed with wrong paths

**Solution:** Check Vite config:

```typescript
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
})
```

### Page works but API calls fail

**Frontend receives 404 or 405**

Step 1 - Check browser Network tab:
- Request URL should be: `https://yourdomain.netlify.app/.netlify/functions/api/...`
- Status should be 200, not 404

Step 2 - Check netlify.toml redirects:
```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api:splat"
  status = 200
```

Step 3 - Check function logs:
- Netlify Dashboard → Functions → Click deploy
- View function execution logs

---

## Database Issues

### Database corrupted or out of sync

**Symptoms:**
- Queries return wrong data
- Some suburbs missing
- Demographics not loading

**Solutions:**

1. **Check database locally:**
   ```bash
   sqlite3 backend/suburbs.db "SELECT COUNT(*) FROM suburbs;"
   ```

2. **Re-generate from backend:**
   ```bash
   cd backend
   node populate_demographics_from_census.js
   node verify_demographics_population.js
   ```

3. **Commit updated database:**
   ```bash
   git add backend/suburbs.db
   git commit -m "Update database with latest census data"
   git push
   ```

4. **Redeploy:**
   ```bash
   netlify deploy --prod
   ```

### Database too large (> 100MB)

If suburbs.db > 100MB:

**Option 1 - Use Git LFS:**
```bash
git lfs install
git lfs track "backend/suburbs.db"
git add .gitattributes backend/suburbs.db
git commit -m "Track database with Git LFS"
git push
```

**Option 2 - Use external database service:**
- PostgreSQL (e.g., Heroku Postgres, Railway)
- MongoDB Atlas
- Supabase

---

## Performance Issues

### Slow API responses

**Check traffic logs:**
- Netlify Dashboard → Analytics

**Optimize queries:**
1. Add database indexes for frequently queried fields
2. Cache results with serverless function response headers

**Update function cache:**
```typescript
return {
  statusCode: 200,
  headers: {
    'Cache-Control': 'public, max-age=3600', // 1 hour
  },
  body: JSON.stringify(data),
};
```

### Function timeout (> 26 seconds)

Netlify's free tier has 26s timeout limit.

**Solution:** Optimize function or upgrade to Pro/Business plan.

---

## Deployment Log Examples

### Successful build
```
5:32:11 PM: Build started from the main branch
5:32:15 PM: Cloning repository...
5:32:18 PM: Preparing cache...
5:32:20 PM: Installing dependencies
5:32:35 PM: Building site from app directory...
5:32:45 PM: Tsc check successful
5:32:50 PM: Vite build completed
5:33:02 PM: Publishing to main site
5:33:05 PM: Site is live ✓
```

### Common errors

**Error: "npm ERR! 404"**
- Missing package in package.json
- Fix: Add package and push

**Error: "EACCES: permission denied"**
- File permission issue
- Fix: Use absolute paths in functions

**Error: "timeout"**
- Build taking > 15 min
- Fix: Optimize build process or split into smaller steps

---

## Testing Locally Before Deploy

### Test everything locally first

```bash
# 1. Install all dependencies
cd c:\Sameer\Projects\AusFinanceTools
npm install
cd app && npm install && cd ..
cd backend && npm install && cd ..

# 2. Build frontend
cd app
npm run build
cd ..

# 3. Verify build output
ls -la app/dist/

# 4. Test database
sqlite3 backend/suburbs.db "SELECT COUNT(*) FROM suburbs;"

# 5. Run local backend (optional)
cd backend
npm run dev

# 6. In another terminal, serve frontend locally
cd app
npm run preview
```

### Simulate Netlify build

```bash
# Use Netlify CLI to test build
netlify build

# Check build output
ls -la app/dist/
```

---

## Enable Debug Logging

### In netlify.toml

```toml
[build.environment]
  DEBUG = "*"
```

### In functions

```typescript
const handler: Handler = async (event) => {
  console.log('Incoming request:', {
    path: event.path,
    method: event.httpMethod,
    query: event.queryStringParameters,
  });
  
  // ... rest of function
};
```

### View logs

1. Netlify Dashboard → Functions → Logs
2. Or: `netlify functions:invoke api --debug`

---

## Rollback to Previous Deploy

If current deploy has issues:

1. Go to Netlify Dashboard
2. Deploys → Click previous successful deploy
3. Click "Publish deploy"

Everything rolls back instantly.

---

## Contact Support

**Need help?**

- **Netlify Support:** https://support.netlify.com
- **Discord:** Netlify community
- **Documentation:** https://docs.netlify.com

---

## Quick Debugging Checklist

- [ ] Frontend builds locally: `npm run build` ✓
- [ ] Database exists: `ls backend/suburbs.db` ✓
- [ ] Functions created: `netlify/functions/api.ts` ✓
- [ ] netlify.toml exists and is valid
- [ ] Environment variables set in Netlify dashboard
- [ ] Build logs show no errors
- [ ] API endpoints respond with 200
- [ ] Frontend connects to API
- [ ] Data displays correctly

---

