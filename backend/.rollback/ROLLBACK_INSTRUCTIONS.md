# Rollback Instructions - Polygon Implementation

If the polygon-based implementation doesn't work as expected, follow these steps to restore the stable 9-metrics system.

## Quick Rollback (3 steps)

### Step 1: Stop all Node processes
```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
```

### Step 2: Run the rollback script
```powershell
cd c:\Sameer\Projects\AusFinanceTools\backend
.\rollback.ps1
```

### Step 3: Restart the servers
```powershell
# Terminal 1 - Backend
cd c:\Sameer\Projects\AusFinanceTools\backend
npm run build
npm run dev

# Terminal 2 - Frontend  
cd c:\Sameer\Projects\AusFinanceTools\app
npm run dev
```

## What Gets Restored

The rollback script restores these critical files from the stable backup:
- `src/externalDataService.ts` - Backend service with working metrics
- `src/routes/suburbs.ts` - API route configuration
- `generateTransportAndParksData.js` - Data generation script
- `public_transport_stops.json` - Transport stops data
- `parks.json` - Parks data
- `dist/` folder - Compiled backend code

## Verify Rollback Success

Test the API to confirm everything is restored:
```powershell
curl http://localhost:5001/api/suburbs/1131/details
```

Expected: Response should include all 9 metrics with `publicTransportStops` and `parks` fields.

## Backup Location

Stable snapshot stored at:
```
c:\Sameer\Projects\AusFinanceTools\backend\.rollback\stable-9-metrics\
```

This backup is your safety net - the system was fully tested and working before attempting the polygon implementation.

---

**Date Created**: February 18, 2026  
**Status**: Stable 9-metrics version with zone-based data generation  
**Tested**: ✅ API verified, Frontend running, All 4,778 suburbs with metrics
