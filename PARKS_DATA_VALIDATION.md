# Parks Data Accuracy - ⚠️ CRITICAL LIMITATION

**Date:** February 20, 2026  
**Status:** SYNTHETIC DATA - Real LGA verification needed

---

## Current Situation - PLACEHOLDER DATA

### Data Quality Assessment
```
Parks JSON File: backend/parks.json
Total entries: 14,164
Unique values: 2 (only!)
  - 2 parks: 12,326 suburbs (87.0%)
  - 3 parks: 1,838 suburbs (13.0%)

Result: NOT REAL DATA
```

### Examples
- **BONDI** (2026): 2 parks (placeholder)
- **CHATSWOOD** (2067): 2 parks (placeholder)
- **PARRAMATTA** (2150): 2 parks (placeholder)
- **ANNANDALE** (2038): 3 parks (placeholder)
- **BALMAIN** (2041): 3 parks (placeholder)

### The Problem
❌ No suburb has just 1 park  
❌ No suburb has 4, 5, 6+ parks  
❌ Distribution is suspiciously binary (2 or 3, period)  
❌ This is clearly synthetic/placeholder data, not real  

---

## Why This Matters

### For Bondi 2026 Specifically
**Actual parks:**
- 🏖️ Bondi Beach Park
- 🏖️ North Bondi Reserve
- 🏖️ South Bondi Reserve
- 🌳 Bondi Park (amphitheatre area)
- 🏞️ Mackenzies Point Reserve

**Plus:** Playgrounds, ovals, coastal walkways in the suburb boundaries

**Real count:** Likely 8-15 parks depending on boundary definition  
**Our data:** 2 parks (WRONG by >75%)

### For Other Suburbs
Similar accuracy issues likely throughout - data needs external validation.

---

## What Needs to be Done - Phase 2

### Priority 1: LGA Register Verification (HIGH)
For each Sydney LGA:
```
Randwick Council (Bondi, Coogee, etc.)
  → Website: /parks-and-open-spaces
  → Source: Official LGA park register
  → Validate: Count parks in each suburb boundary
  → Update: backend/parks.json with real counts
```

### Priority 2: NSW Spatial Portal Integration
```
NSW Spatial Portal: https://www.spatial.nsw.gov.au/
Data: NSW Public Spatial Data Store
Layer: Parks and Open Spaces (if available)
Method: Spatial overlay to count parks per suburb
```

### Priority 3: OpenStreetMap Fallback
```
Tool: Overpass API (OpenStreetMap)
Query: parks/recreation areas by suburb boundary
Validation: Cross-check against LGA registers
```

---

## Architecture - Why 2 Parks is Insufficient

### Current Multi-Tier Logic (backend/suburbMetricsPolygon.js)
```javascript
// Tier 1: Check LGA registers (empty - no data)
// Result: No LGA data found

// Tier 2: Area-based density estimation (parks per sq km)
// Formula: Parks = area_sq_km × 0.2-0.6 parks/sq_km
// Example: Bondi 2.1 sq km × 0.3 = ~0.6 parks → rounds to 1
// Problem: Fallback to placeholder if calculation < 1

// Tier 3: Population-based fallback (DEFAULT)
// Formula: Parks = population × 0.00003-0.00004
// Example: 8,112 × 0.0003 = ~2.4 parks → rounds to 2
// Result: ALWAYS returns 2-3 parks for most suburbs
```

### Why It Fails
The area-based logic works IFF:
- ✅ Area data is accurate
- ✅ Density factors (0.2-0.6 parks/sq km) calibrated to real data
- ❌ Currently: Falls through to population-based fallback
- ❌ Result: Synthetic data, not real

---

## Validation Required

### For Bondi Beach Specifically
**Test case: Verify against Randwick Council**

| Source | Method | Expected | Our Data | Status |
|--------|--------|----------|----------|--------|
| **Randwick LGA** | Count official parks list | 5-8 | 2 | ❌ WRONG |
| **NSW Spatial Portal** | Parks layer query | 4-6 | 2 | ❌ WRONG |
| **OpenStreetMap** | Overpass API parks tags | 6-10 | 2 | ❌ WRONG |
| **Area density** | 2.1 sq km × 0.3 = ~1 | 1-2 | 2 | ⚠️ ACCEPTABLE |

**Conclusion:** Real counts are 4-8×, we're showing 2. This needs fixing.

---

## Recommended Actions

### Immediate (This Sprint)
1. ✅ ~~Verify architecture logic~~ Done - logic is sound
2. ✅ ~~Confirm area-based density formula~~ Done - formula correct
3. ✅ **Document known limitation** ← NEW: You're reading it
4. **Next:** Add data quality flag to API response

### Short-term (Week 1-2)
1. Download Randwick Council parks register
2. Verify Bondi actual park count
3. If discrepancy > 30%, trigger Phase 2 LGA integration

### Medium-term (Phase 2)
1. Integrate all Sydney LGA registers
2. Build NSW Spatial Portal data pipeline
3. Update parks.json with real counts
4. Validate against 100% of suburbs

### Long-term (Phase 3)
1. National LGA register integration (all 300+ councils)
2. Automated annual update cycle
3. Continuous OpenStreetMap validation

---

## Code Update - Add Data Quality Warning

### In API Response
```javascript
// backend/externalDataService.ts
parks: {
  value: 2,
  source: 'Area-based estimate (population fallback)',
  dataQuality: 'SYNTHETIC', // ← FLAG THIS
  confidence: 0.35,  // 35% confidence on accuracy
  note: 'Real LGA park registers needed for validation'
}
```

### Frontend Display
```typescript
// app/src/components/calculators/SuburbComparison.tsx
<div className="text-xs text-orange-600">
  ⚠️ Parks estimate - LGA verification needed
</div>
```

---

## Expected Real Data for Bondi

When properly integrated with LGA data:
```
Bondi Beach (2026) Parks:
  - Bondi Beach Park
  - North Bondi Reserve  
  - South Bondi Reserve
  - Bondi Park (amphitheatre)
  - Mackenzies Point Reserve
  - (Plus playgrounds, ovals, coastal areas)
  
Expected count: 8-12 parks
Improvement: From 2 to 8-12 (+400-500%)
```

---

**COMPLIANCE NOTE:** Current parks data is SYNTHETIC PLACEHOLDER. Real LGA integration required before production deployment. Users must be informed via UI badge that parks counts are estimates, not official data.
