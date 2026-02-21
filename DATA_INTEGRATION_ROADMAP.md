# Data Integration Roadmap

## Current Status (Phase 1: Estimates)

The Australian Financial Tools website currently uses **postcode-based demographic estimates** to provide suburb comparison data across 4,778 suburbs:

- **Sydney**: 3,475 suburbs (postcodes 2000-2599)
- **Melbourne**: 1,303 suburbs (postcodes 3000-3399)

### Data Sources by Metric

| Metric | Current Source | Type | Accuracy |
|--------|----------------|------|----------|
| Population | Postcode-based estimate | Derived | ~70-80% realistic |
| Median Age | Postcode-based estimate | Derived | ~70-80% realistic |
| Household Size | Postcode-based estimate | Derived | ~70-80% realistic |
| Employment Rate | Postcode-based estimate | Derived | ~70-80% realistic |
| Median Income | Postcode-based estimate | Derived | ~70-80% realistic |
| Commute Time | OpenRouteService API (or hardcoded fallback) | Derived | ~90% accurate (routing-based) |
| School Count | Population-derived estimate | Derived | ~60% accurate (formula-based) |

### Data Tagging in UI

Metrics now display colored badges indicating data quality:
- 🟢 **✓ Census** (Green): Official ABS Census 2021 data
- 🟡 **⚠ Est.** (Amber): Postcode-based or estimated data
- 🔵 **ⓘ Derived** (Blue): Calculated metrics (commute routes, density estimates)

---

## Phase 2: Official Data Integration (Planned)

### Task 1: ABS QuickStats API Integration

**Goal**: Replace postcode-based demographic estimates with official ABS Census 2021 data for available suburbs.

**API Details**:
- **Service**: ABS Census Data API
- **Endpoint**: https://api.abs.gov.au
- **Coverage**: ~2,000+ suburbs with official 2021 Census data
- **Metrics Available**: Population, age distribution, household composition, employment, income quartiles

**Implementation Steps**:
1. Register for ABS API access (free, requires account)
2. Create `absQuickstatsService.ts` wrapper for API calls
3. Implement caching layer (24-48 hour TTL for Census data)
4. Batch API requests (max 100 suburbs per request)
5. Fallback to estimates for suburbs without official data
6. Update metric type to 'official_dataset' for Census-sourced metrics

**Priority**: HIGH (provides most visibility improvement)

**Effort**: 2-3 days (API integration + testing + caching)

---

### Task 2: OpenRouteService Caching & Routing Optimization

**Goal**: Improve commute time accuracy and reduce API costs through intelligent caching.

**Current Issues**:
- Most commute times use hardcoded fallback values (outdated)
- No caching mechanism for computed routes
- OpenRouteService API key optional (limits coverage)

**Implementation Steps**:
1. Set up Redis/SQLite caching for OpenRouteService results
2. Pre-compute routes for high-traffic suburbs (top 500 by population)
3. Implement cache warming on backend startup
4. Add cache hit/miss logging for optimization
5. Support multiple destination CBDs (Sydney, Melbourne, Brisbane variants)

**Data Structure**:
```typescript
interface CachedRoute {
  originSuburb: string;
  originState: string;
  destinationCBD: string;
  drivingTimeMinutes: number;
  distance_km: number;
  lastUpdated: Date;
  confidence: 'official_route' | 'estimated' | 'fallback';
}
```

**Priority**: MEDIUM (improves data freshness)

**Effort**: 2 days (caching + pre-computation)

---

### Task 3: Education Data API Integration

**Goal**: Replace population-derived school estimates with official school location data.

**API Options**:

#### Option A: MySchools.co.au (Preferred)
- **Endpoint**: https://www.myschools.edu.au/api/v3/schools
- **Coverage**: All Australian schools (13,000+)
- **Data**: School name, location, type (primary/secondary), enrollments
- **Rate Limits**: 100 req/min

#### Option B: Government Education Open Data
- **Source**: Department of Education datasets
- **Coverage**: State-based school registers
- **Data**: School locations, enrollments, types

**Implementation Steps**:
1. Create `educationService.ts` for school data fetching
2. Implement school location proximity search (radius-based)
3. Count schools within suburb boundaries (from postcode coordinates)
4. Cache results for 30-day TTL
5. Include school type distribution (primary, secondary, combined)

**Data Structure**:
```typescript
interface SuburbSchools {
  totalCount: number;
  primary: number;
  secondary: number;
  combined: number;
  dataSource: 'myschools_official' | 'government_register' | 'estimate';
  lastUpdated: Date;
}
```

**Priority**: MEDIUM (educational relevance for families)

**Effort**: 2 days (API integration + boundary logic)

---

### Task 4: Data Quality Dashboard

**Goal**: Create transparency around data sources and confidence levels.

**Features**:
- Data source attribution for each suburb (% official vs estimated)
- Confidence scoring per metric (0-100%)
- Last updated timestamps
- Known issues/limitations per suburb
- "Report Data Issue" button for user feedback

**Implementation**:
1. Add `dataQuality` endpoint to backend
2. Track data source mix per suburb
3. Calculate composite confidence score
4. Create admin dashboard for data audits

**Priority**: LOW (visibility improvement only)

**Effort**: 2-3 days (dashboard + scoring logic)

---

## Phase 3: Continuous Improvement (Post-Launch)

### Data Validation Pipeline
- Monthly validation against ABS census updates
- Annual Census refreshes (2026, 2031, etc.)
- Quarterly school enrollment updates from official sources

### User Feedback Loop
- Allow users to flag inaccurate data
- Collect crowdsourced corrections
- Weight corrections by user credibility

### Advanced Metrics (Future)
- Crime statistics (from public crime data)
- Property price trends (from real estate APIs)
- Public transport accessibility scores
- Green space/outdoor recreation metrics

---

## Integration Priority Matrix

```
Impact vs. Effort:

          HIGH IMPACT
          ↑
EFFORT    │  ABS QuickStats (HIGH/MEDIUM)
HIGH      │
          │  School Data (MEDIUM/LOW)
MEDIUM    │  
          │  Data Dashboard (LOW/LOW)
LOW       │
          │
          └─────────────────────────→ EFFORT LOW
```

**Recommended Implementation Order**:
1. **Week 1**: ABS QuickStats API integration (biggest user impact)
2. **Week 2**: School data integration (complement population data)
3. **Week 3**: OpenRouteService caching optimization (data freshness)
4. **Week 4**: Data quality dashboard (transparency & trust)

---

## API Keys Required

| Service | Key | Status | Cost |
|---------|-----|--------|------|
| ABS Census API | To be obtained | Not yet registered | Free (with registration) |
| OpenRouteService | To be set in `.env` | Optional | Free tier: 40 req/min, $0.50/1000 after |
| MySchools API | Not required | Public access | Free |

---

## Testing & Validation

### Phase 1 Validation (Current)
- ✅ Data generation script produces realistic suburb distributions
- ✅ Suburb coverage: 4,778/4,778 (100%)
- ✅ 7 metrics per suburb: 100% completion
- ✅ UI displays accurate badge types

### Phase 2 Validation Required
- [ ] ABS API returns data for 80%+ of target suburbs
- [ ] Cache hit rate >90% for commute queries
- [ ] School count accuracy within 20% of real counts
- [ ] No API rate limiting issues

### Phase 3 Validation
- [ ] User-reported data accuracy >95%
- [ ] Monthly update pipeline fully automated

---

## Migration Path

### For Existing Implementations
Old (estimated) data will remain in database as fallback. New data will be prioritized by this order:

```
Official ABS Census 2021 > Postcode-based Estimate > Hardcoded Fallback > NULL
```

### For UI
Current badge system supports all three data types:
```
Badge: 'official' | 'estimate' | 'derived'
Color: Green | Amber | Blue
```

No UI migrations required - existing code handles all data types.

---

## Success Criteria

**Phase 1 (Current)**: ✅ Complete
- Realistic data coverage for all suburbs
- Proper data source tagging
- User-transparent badge system

**Phase 2**: Target completion within 4 weeks
- 80%+ suburbs have official Census data
- OpenRouteService caching fully implemented
- School count accuracy improved to 80%+

**Phase 3**: Ongoing
- Monthly data freshness checks
- Zero user-reported critical data errors
- 95%+ data quality score across metrics

---

## Contact & Questions

**Data Issues**: Report via app "Report Issue" button (future)
**API Questions**: Refer to official documentation
- [ABS API Docs](https://api.abs.gov.au)
- [OpenRouteService](https://openrouteservice.org)
- [MySchools](https://www.myschools.edu.au)

Last Updated: 2024
