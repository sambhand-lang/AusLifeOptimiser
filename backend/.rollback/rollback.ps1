#!/usr/bin/env pwsh
# Rollback Script - Restore Stable 9-Metrics Implementation
# This script restores the system to the last known good state

param(
    [switch]$Confirm = $false
)

$backupDir = "c:\Sameer\Projects\AusFinanceTools\backend\.rollback\stable-9-metrics"
$srcDir = "c:\Sameer\Projects\AusFinanceTools\backend"

Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         ROLLBACK TO STABLE 9-METRICS IMPLEMENTATION           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Verify backup exists
if (-not (Test-Path $backupDir)) {
    Write-Host "❌ ERROR: Backup directory not found at $backupDir" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Backup Location: $backupDir" -ForegroundColor Yellow
Write-Host "`nFiles to be restored:" -ForegroundColor Yellow
@(
    "src/externalDataService.ts",
    "src/routes/suburbs.ts", 
    "generateTransportAndParksData.js",
    "public_transport_stops.json",
    "parks.json",
    "dist/"
) | ForEach-Object { Write-Host "  ✓ $_" -ForegroundColor Gray }

if (-not $Confirm) {
    Write-Host "`n⚠️  WARNING: This will overwrite current backend files!" -ForegroundColor Yellow
    $response = Read-Host "Continue with rollback? (yes/no)"
    if ($response -ne "yes") {
        Write-Host "❌ Rollback cancelled" -ForegroundColor Red
        exit 0
    }
}

Write-Host "`n⏳ Starting rollback..." -ForegroundColor Cyan

try {
    # Restore TypeScript service files
    Copy-Item -Path "$backupDir\externalDataService.ts" -Destination "$srcDir\src\" -Force
    Write-Host "✓ Restored externalDataService.ts" -ForegroundColor Green
    
    Copy-Item -Path "$backupDir\suburbs.ts" -Destination "$srcDir\src\routes\" -Force
    Write-Host "✓ Restored routes/suburbs.ts" -ForegroundColor Green
    
    # Restore data generation script
    Copy-Item -Path "$backupDir\generateTransportAndParksData.js" -Destination "$srcDir\" -Force
    Write-Host "✓ Restored generateTransportAndParksData.js" -ForegroundColor Green
    
    # Restore data files
    Copy-Item -Path "$backupDir\public_transport_stops.json" -Destination "$srcDir\" -Force
    Write-Host "✓ Restored public_transport_stops.json" -ForegroundColor Green
    
    Copy-Item -Path "$backupDir\parks.json" -Destination "$srcDir\" -Force
    Write-Host "✓ Restored parks.json" -ForegroundColor Green
    
    # Restore compiled dist folder
    if (Test-Path "$srcDir\dist") {
        Remove-Item "$srcDir\dist" -Recurse -Force
    }
    Copy-Item -Path "$backupDir\dist" -Destination "$srcDir\" -Recurse -Force
    Write-Host "✓ Restored dist/ (compiled backend)" -ForegroundColor Green
    
    Write-Host "`n✅ Rollback completed successfully!" -ForegroundColor Green
    Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
    Write-Host "  1. npm run build   (in c:\Sameer\Projects\AusFinanceTools\backend)" -ForegroundColor Gray
    Write-Host "  2. npm run dev     (to restart backend)" -ForegroundColor Gray
    Write-Host "  3. Test API: curl http://localhost:5001/api/suburbs/1131/details" -ForegroundColor Gray
    
} catch {
    Write-Host "`n❌ Rollback failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n" -ForegroundColor Green
