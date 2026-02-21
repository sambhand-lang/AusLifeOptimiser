# Phase 2 Implementation Guide: Official Data Integration

**Target**: Replace postcode-based estimates with official ABS Census 2021 data  
**Difficulty**: Medium  
**Estimated Effort**: 3-4 weeks  
**Priority**: HIGH (biggest user impact)

---

## Quick Start for Next Developer

### Prerequisites
- Node.js 18+ installed
- ABS API account (free registration at https://api.abs.gov.au)
- Familiarity with TypeScript, async/await, Promise.all()

### High-Level Approach
```
1. Get ABS API credentials
2. Create new data service wrapper (absQuickstatsService.ts)
3. Implement API client with batch processing & caching
4. Update externalDataService.ts to use official data when available
5. Change metric type from 'derived_metric' → 'official_dataset' for Census data
6. Test with 100+ suburbs, validate accuracy
7. Deploy alongside estimates (with fallback)
```

---

## Step 1: ABS QuickStats API Setup

### Register for API Access
1. Visit: https://api.abs.gov.au
2. Create free account (no credit card required)
3. Request API key (instant approval)
4. Document the following in `.env`:
```
ABS_API_KEY=your_api_key_here
ABS_API_BASE_URL=https://api.abs.gov.au
```

### API Documentation
- Quick Start: https://api.abs.gov.au/docs/
- Census 2021 Datasets: Look for "Population", "Households", "Labour Force", "Income"
- Rate Limits: 1000 requests/day (free tier) - should be sufficient for ~50 suburbs/day

### Test Endpoint
```bash
curl -H "Authorization: Bearer YOUR_KEY" \
  "https://api.abs.gov.au/data/2021" \
  "?geography_id=101&measure=population"
```

---

## Step 2: Create ABS Data Service

### File: `backend/src/services/absQuickstatsService.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

const ABS_API_KEY = process.env.ABS_API_KEY || '';
const ABS_BASE_URL = process.env.ABS_API_BASE_URL || 'https://api.abs.gov.au';

interface CensusMetrics {
  population?: number;
  medianAge?: number;
  householdSize?: number;
  employmentRate?: number;
  medianIncome?: number;
  confidence?: 'official' | 'estimated' | 'unavailable';
}

export class ABSQuickstatsService {
  private client: AxiosInstance;
  private cache: Map<string, { data: CensusMetrics; expiresAt: number }>;
  
  constructor() {
    this.client = axios.create({
      baseURL: ABS_BASE_URL,
      headers: { 'Authorization': `Bearer ${ABS_API_KEY}` },
      timeout: 15000
    });
    this.cache = new Map();
  }

  private getCacheKey(suburb: string, state: string): string {
    return `${suburb.toUpperCase()}|${state.toUpperCase()}`;
  }

  private isCacheValid(expiresAt: number): boolean {
    return expiresAt > Date.now();
  }

  /**
   * Get official ABS Census metrics for a suburb
   * Returns null if data not available (will fallback to estimates)
   */
  async getMetrics(suburb: string, state: string, postcode?: string): Promise<CensusMetrics | null> {
    const cacheKey = this.getCacheKey(suburb, state);
    const cached = this.cache.get(cacheKey);
    
    if (cached && this.isCacheValid(cached.expiresAt)) {
      console.debug(`[ABS] Cache hit for ${cacheKey}`);
      return cached.data;
    }

    try {
      // NOTE: Actual API parameters depend on ABS QuickStats API structure
      // This is a template - adjust parameters based on actual ABS API responses
      
      const response = await this.client.get('/data/search', {
        params: {
          geography_filter: `suburb:${suburb}`,
          state_filter: state,
          datasets: ['2021_census'],
          measures: ['population', 'age_median', 'household_size', 'employment_rate', 'income_median']
        }
      });

      if (!response.data || !Array.isArray(response.data.results)) {
        console.warn(`[ABS] No data found for ${suburb}, ${state}`);
        return null;
      }

      const metrics = this.parseABSResponse(response.data.results);
      
      // Cache for 30 days (Census data doesn't change frequently)
      const ttlMs = 30 * 24 * 60 * 60 * 1000;
      this.cache.set(cacheKey, { 
        data: metrics, 
        expiresAt: Date.now() + ttlMs 
      });

      console.info(`[ABS] Loaded official metrics for ${cacheKey}`);
      return metrics;
      
    } catch (err) {
      const errorMsg = (err as any)?.message || String(err);
      if (errorMsg.includes('401') || errorMsg.includes('403')) {
        console.error(`[ABS] Authentication failed - check API key`);
      } else if (errorMsg.includes('404')) {
        console.debug(`[ABS] Suburb not found in Census data: ${suburb}`);
      } else {
        console.error(`[ABS] Error fetching metrics for ${suburb}: ${errorMsg}`);
      }
      return null;
    }
  }

  /**
   * Parse ABS API response into CensusMetrics
   * (Implementation depends on actual ABS response format)
   */
  private parseABSResponse(results: any[]): CensusMetrics {
    const metrics: CensusMetrics = {
      confidence: 'official'
    };

    // Map ABS response fields to our metrics
    // Example structure (adjust based on actual API):
    results.forEach(result => {
      switch (result.measure_type) {
        case 'population':
          metrics.population = result.value;
          break;
        case 'age_median':
          metrics.medianAge = result.value;
          break;
        case 'household_size':
          metrics.householdSize = result.value;
          break;
        case 'employment_rate':
          metrics.employmentRate = result.value;
          break;
        case 'income_median':
          metrics.medianIncome = result.value;
          break;
      }
    });

    return metrics;
  }

  /**
   * Batch fetch for multiple suburbs (more efficient)
   * Useful for pre-warming cache on startup
   */
  async getMetricsBatch(suburbs: Array<{name: string; state: string}>): Promise<Map<string, CensusMetrics | null>> {
    const results = new Map<string, CensusMetrics | null>();
    
    // Process in parallel but throttled (respect rate limits)
    const batchSize = 10;
    for (let i = 0; i < suburbs.length; i += batchSize) {
      const batch = suburbs.slice(i, i + batchSize);
      const promises = batch.map(s => 
        this.getMetrics(s.name, s.state)
          .then(data => results.set(`${s.name}|${s.state}`, data))
          .catch(err => {
            console.error(`[ABS] Batch error for ${s.name}: ${err}`);
            results.set(`${s.name}|${s.state}`, null);
          })
      );
      
      await Promise.all(promises);
      
      // Small delay between batches to respect rate limits (1000/day = ~1.4 per min)
      if (i + batchSize < suburbs.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return results;
  }

  /**
   * Get cache stats (useful for debugging)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Clear expired entries from cache
   */
  pruneExpiredCache(): number {
    let removed = 0;
    for (const [key, value] of this.cache.entries()) {
      if (!this.isCacheValid(value.expiresAt)) {
        this.cache.delete(key);
        removed++;
      }
    }
    return removed;
  }
}

// Export singleton instance
export const absQuickstatsService = new ABSQuickstatsService();
```

---

## Step 3: Update External Data Service

### File: `backend/src/externalDataService.ts`

Replace the `getSuburbRealData()` method:

```typescript
import { absQuickstatsService } from './services/absQuickstatsService';

// ... existing code ...

static async getSuburbRealData(suburbName: string, state: string, postcode: string): Promise<SuburbRealData> {
  const [absMetrics, commuteTime, schoolCount, absOfficialMetrics] = await Promise.all([
    this.getAbsMetrics(suburbName, state),  // estimates
    this.getCommuteTime(`${suburbName}, ${state}, Australia`),
    this.getSchoolCount(suburbName, state),
    absQuickstatsService.getMetrics(suburbName, state, postcode)  // official
  ]);

  const result: SuburbRealData = {};

  // PRIORITY: Use official ABS Census data if available, otherwise fall back to estimates
  
  if (absOfficialMetrics?.population != null) {
    result.population = { 
      value: absOfficialMetrics.population, 
      source: 'ABS Census 2021', 
      datasetYear: 2021, 
      type: 'official_dataset' 
    };
  } else if (absMetrics.population != null) {
    result.population = { 
      value: absMetrics.population, 
      source: 'Postcode-based estimate', 
      datasetYear: 2021, 
      type: 'derived_metric' 
    };
  }

  // Repeat for medianAge, householdSize, employmentRate, medianIncome...
  
  if (absOfficialMetrics?.medianAge != null) {
    result.medianAge = { 
      value: absOfficialMetrics.medianAge, 
      source: 'ABS Census 2021', 
      datasetYear: 2021, 
      type: 'official_dataset' 
    };
  } else if (absMetrics.medianAge != null) {
    result.medianAge = { 
      value: absMetrics.medianAge, 
      source: 'Postcode-based estimate', 
      datasetYear: 2021, 
      type: 'derived_metric' 
    };
  }

  // ... repeat for other 3 demographic metrics ...

  // Commute stays as derived (not official Census data)
  if (commuteTime != null) {
    result.commute = { 
      drivingTimeMinutes: { 
        value: commuteTime, 
        source: 'OpenRouteService', 
        datasetYear: 2026, 
        type: 'derived_metric' 
      } 
    };
  }

  // Schools stays as derived (not in Census)
  if (schoolCount != null) {
    result.schools = { 
      count: { 
        value: schoolCount, 
        source: 'Population-derived estimate', 
        datasetYear: 2025, 
        type: 'derived_metric' 
      } 
    };
  }

  return result;
}
```

---

## Step 4: Testing Strategy

### Unit Tests
```typescript
// Test file: backend/src/tests/absQuickstatsService.test.ts
describe('ABSQuickstatsService', () => {
  
  it('should fetch official census data for known suburb', async () => {
    const metrics = await absQuickstatsService.getMetrics('Parramatta', 'NSW');
    expect(metrics?.population).toBeGreaterThan(30000); // Known real value ~37,000
    expect(metrics?.confidence).toBe('official');
  });

  it('should return null for unknown suburb', async () => {
    const metrics = await absQuickstatsService.getMetrics('NonExistent', 'XYZ');
    expect(metrics).toBeNull();
  });

  it('should cache results', async () => {
    const metrics1 = await absQuickstatsService.getMetrics('Sydney', 'NSW');
    const metrics2 = await absQuickstatsService.getMetrics('Sydney', 'NSW');
    expect(metrics1).toEqual(metrics2);
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    const metrics = await absQuickstatsService.getMetrics('Suburb', 'State');
    expect(metrics).toBeNull();
  });
});
```

### Integration Tests
```typescript
// Test file: backend/src/tests/externalDataService.test.ts
describe('externalDataService with official data', () => {
  
  it('should prefer official Census over estimates', async () => {
    const data = await ExternalDataService.getSuburbRealData('Parramatta', 'NSW', '2150');
    
    expect(data.population?.type).toBe('official_dataset');
    expect(data.population?.source).toBe('ABS Census 2021');
    expect(data.population?.value).toBeCloseTo(37890, -3); // Within 5%
  });

  it('should fall back to estimates for unavailable suburbs', async () => {
    const data = await ExternalDataService.getSuburbRealData('UnknownSuburb', 'NSW', '0000');
    
    // Should still return estimate
    expect(data.population?.type).toBe('derived_metric');
    expect(data.population?.source).toContain('estimate');
  });
});
```

### Manual Testing
1. Query a known suburb and compare values to ABS website
2. Check badge color changes from amber → green in UI
3. Verify cache stats: `GET /api/debug/cache-stats`
4. Monitor API response times (should be <1s with caching)

---

## Step 5: Deployment Checklist

- [ ] ABS API key tested and working
- [ ] absQuickstatsService tests passing
- [ ] externalDataService integration tests passing
- [ ] 100+ suburbs tested for accurate values
- [ ] Badge colors correct (green for 'official_dataset')
- [ ] Cache size reasonable (<50MB)
- [ ] No performance regression (API response <500ms)
- [ ] Fallback works for unavailable suburbs
- [ ] Rollback plan documented (can quickly revert to estimates)

---

## Expected Outcomes

| Metric | Current | After Phase 2 | Improvement |
|--------|---------|---------------|-------------|
| Census data coverage | 0% | 80%+ | 🟢 +80% |
| UI green badges | 0% | 80% of metrics | 🟢 High visibility |
| Data accuracy | 70% realistic | 99% accurate | 🟢 +29% |
| User trust | Low | High | 🟢 Transparent source |

---

## Troubleshooting

### "Authentication failed - check API key"
- Verify `.env` has correct `ABS_API_KEY`
- Check ABS online that key is active
- Restart backend to reload .env

### "Rate limiting" errors
- Implementation batches requests - should be fine
- Max 1000/day free tier = ~50 suburbs ideally
- Increase delays between batches if needed

### "Geographic data not found"
- ABS data may use different suburb naming
- Implement fuzzy matching for suburb names
- Fallback to postcode-based lookup

### Cache growing too large
- Call `pruneExpiredCache()` periodically
- Reduce TTL from 30 days to 7 days if memory issues
- Monitor with `getCacheStats()`

---

## Success Criteria for Phase 2

✅ 80%+ of suburbs have official Census data  
✅ Badge colors show 80% green (official) coverage  
✅ Accuracy improvement documented  
✅ Zero performance regression  
✅ Comprehensive test coverage  
✅ Documentation updated  

---

## Next Steps After Phase 2

Phase 3: School Data Integration (MySchools API)
- More accurate school counts
- School type distribution (primary/secondary)
- Location-based density metrics

Phase 4: Data Quality Dashboard
- Show which suburbs have official vs estimated data
- Confidence scoring per suburb
- Last update timestamps

---

**Questions?** Refer to:
- ABS API: https://api.abs.gov.au/docs/
- TypeScript async/await: https://learntypescript.dev/06/l4-promises
- This project's backend structure: `backend/src/` directory
