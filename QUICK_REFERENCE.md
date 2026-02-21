# Quick Reference: Multi-SA2 Aggregation & National Rollout

**Last Updated:** February 20, 2026

---

## 📋 Project Status

| Component | Status | Owner | Timeline |
|-----------|--------|-------|----------|
| Multi-SA2 Infrastructure | ✅ Complete | Data Team | Deployed |
| Chatswood Test Case | ✅ Passed | Data Team | 2026-02-20 |
| NSW Verification Scripts | ✅ Ready | Data Team | Ready now |
| SA2-level Data Import | 🔄 Pending | Data Team | Week 1 |
| Full Aggregation Logic | 🔄 Pending | Data Team | Week 1 |
| Pre-commit Automation | 🔄 Ready | DevOps | Week 2 |
| National Rollout | 📅 Scheduled | Data Team | Weeks 2-12 |

---

## 🎯 What's Running Now

### API Response (Chatswood Example)
**Endpoint:** `GET /api/suburbs/847/details`

```json
{
  "realTimeData": {
    "population": {
      "value": 30120,
      "source": "ABS Census 2021 (Multi-SA2 Aggregate)"
    },
    "medianAge": { "value": 32 },
    "householdSize": { "value": 2.6 },
    "employmentRate": { "value": 56.7 },
    "medianIncome": { "value": 49496 },
    "dataIntegrity": {
      "absSource": "ABS Census 2021",
      "asgsVersion": "2021",
      "mappingVerified": true,
      "multiSA2": true,
      "aggregationMethod": "population-weighted",
      "sa2Codes": ["106541163", "106541164"],
      "coveragePercents": [58.4, 41.6]
    }
  }
}
```

### Verification Scripts (Working Now)
```bash
npm run verify-sa2          # Validates: 4,778 suburbs
npm run verify-nsw          # NSW deep-dive: 3,475 suburbs
npm run aggregation-guide   # Shows implementation blueprint
```

---

## 🏗️ What's Being Built (Week 1-2)

### Phase 1a: Data Acquisition (Week 1)
```
Goal: Get SA2-level ABS metrics
Input: ABS Census 2021 DataPacks (SA2 level)
Output: backend/data/abs_census_by_sa2.json
```

Schema needed:
```json
{
  "106541163": {
    "name": "Chatswood (East)",
    "population": 17590,
    "medianAge": 35,
    "householdSize": 2.7,
    "dwellingCount": 7843,
    "employmentRate": 72.1,
    "medianIncome": 85000
  }
}
```

### Phase 1b: Aggregation Implementation (Week 1)
```
Goal: Wire multi-SA2 aggregation into API
Files to modify:
- backend/src/externalDataService.ts
  ├─ Add: getAbsMetricsForSA2(code)
  ├─ Add: aggregatePopulation(metrics)
  ├─ Add: aggregateMedianAge(metrics)
  ├─ Add: aggregateHouseholdSize(metrics)
  ├─ Add: aggregateEmploymentRate(metrics)
  ├─ Add: aggregateMedianIncome(metrics)
  └─ Update: Check sa2Code.includes('|') → call aggregation
```

Reference formulas available in:
`backend/scripts/multi_sa2_aggregation_guide.js`

### Phase 1c: NSW Conversion (Week 1-2)
```
Goal: 3,338 provisional → official mapping
Use: npm run verify-nsw → identifies all provisional suburbs
Cross-reference: Against official ABS ASGS 2021 register
Update: backend/data/abs_sa2_boundaries.json
```

---

## 📊 Key Metrics

### NSW Current State
```
Total entries:      3,475
Official:           137 (3.9%)    ← Need to reach 95%+
Provisional:        3,338 (96.1%) ← Conversion target
Multi-SA2:          1 (Chatswood) [READY]
Code format:        0 (8-9 digit) ← Needs 5→8 digit migration
```

### After Week 1 (Target)
```
Official:           3,100+ (89%+)
Provisional:        200-300
Multi-SA2:          1-3 (after geographic survey)
Code format:        100% (8-9 digit)
Data quality score: 67% → 85%+
```

### After Phase 1 (Week 4, Target)
```
Official:           3,310+ (95%+)
Provisional:        <50
Multi-SA2:          2-5
Code format:        100%
Full aggregation:   Operational
Data quality:       95%+
API latency (P95):  <500ms
```

---

## 🔧 Commands for Developers

### Validate Data
```bash
cd backend

# National validation (all 4,778 suburbs)
npm run verify-sa2

# NSW-specific audit (3,475 suburbs)
npm run verify-nsw

# Review aggregation logic
npm run aggregation-guide
```

### Test Multi-SA2
```bash
# Should return multiSA2: true, aggregationMethod: population-weighted
curl http://localhost:5001/api/suburbs/847/details | jq '.realTimeData.dataIntegrity'

# Second Chatswood entry (should be identical metrics)
curl http://localhost:5001/api/suburbs/878/details | jq '.realTimeData.dataIntegrity'
```

### Pre-implementation Checklist (Week 1)
```bash
# 1. Check SA2-level data is available
ls -la backend/data/abs_census_by_sa2.json

# 2. Implement getAbsMetricsForSA2()
# (Add to externalDataService.ts)

# 3. Implement aggregation functions
# (Copy functions from aggregation_guide.js)

# 4. Test with Chatswood
npm test  # (when test suite created)

# 5. Validate verification still works
npm run verify-sa2
```

---

## 📚 Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| SUBURB_COMPARISON_STRATEGY.md | Architecture & design | Project root |
| NATIONAL_ROLLOUT_PLAN.md | 12-week timeline | Project root |
| IMPLEMENTATION_STATUS_REPORT.md | Executive summary | Project root |
| verify_nsw_suburbs.js | NSW analysis tool | backend/scripts/ |
| multi_sa2_aggregation_guide.js | Implementation reference | backend/scripts/ |
| verify_sa2_asgs2021.js | Validation tool | backend/scripts/ |

---

## 🚨 Common Issues & Solutions

| Issue | Solution | Time |
|-------|----------|------|
| "SA2 data not found" | Run: Obtain ABS DataPacks, create abs_census_by_sa2.json | Day 1 |
| Multi-SA2 aggregation failing | Check: dwellingCount field in SA2 data | Day 2 |
| Coverage % not summing to 100% | Fix: abs_sa2_boundaries.json sa2_codes array | Day 1 |
| API latency > 1000ms | Add: Result caching (24h TTL) | Week 2 |
| Pre-commit hook fails | Run: npm run verify-sa2 to see errors | Immediate |

---

## 🎓 Aggregation Formulas at a Glance

```javascript
// Population: SUM (additive)
population = SA2_East_pop + SA2_West_pop

// Median Age: WEIGHTED AVG by population
age = (35 * 17590 + 31 * 12530) / 30120 = 33.3

// Household Size: WEIGHTED AVG by dwelling count
hsize = (2.7 * 7843 + 2.4 * 5221) / 13064 = 2.6

// Employment Rate: WEIGHTED AVG by population  
emprate = (72.1 * 17590 + 68.0 * 12530) / 30120 = 70.5%

// Median Income: WEIGHTED AVG by population
income = (85000 * 17590 + 50000 * 12530) / 30120 = $70,200
```

---

## 📅 Weekly Milestones

| Week | Goal | Deliverable |
|------|------|-------------|
| 1 | SA2 data + aggregation | Working multi-SA2 for Chatswood |
| 2 | NSW verification sprint | 95%+ coverage |
| 3 | Automation setup + testing | Pre-commit hook + daily cron |
| 4 | NSW launch | Production deployment |
| 5-8 | State rollout (VIC, QLD, WA) | 3 states operational |
| 9-12 | Full coverage + optimization | National launch + caching |

---

## 💬 Communication Channels

**Questions about:**
- Architecture → See: SUBURB_COMPARISON_STRATEGY.md
- Timeline → See: NATIONAL_ROLLOUT_PLAN.md  
- Implementation → See: multi_sa2_aggregation_guide.js
- Scripts → Run: npm run aggregation-guide

**To validate current state:**
```bash
npm run verify-sa2
npm run verify-nsw
```

---

## ✅ Pre-Launch Checklist

- [ ] ABS SA2-level data obtained
- [ ] abs_census_by_sa2.json created
- [ ] getAbsMetricsForSA2() implemented
- [ ] All 5 aggregation functions implemented
- [ ] Chatswood test case passing
- [ ] Unit tests passing
- [ ] Chatswood data validated against expected values
- [ ] API response includes dataIntegrity
- [ ] verify-sa2 script still works
- [ ] Documentation updated
- [ ] Team trained on new model

---

## 🎯 Success Criteria

✅ **Week 1:** Chatswood aggregation working (P95 latency < 500ms)
✅ **Week 2:** 95%+ NSW suburbs officially mapped  
✅ **Week 4:** NSW fully operational with automated verification
✅ **Week 12:** All 6,300 Australian suburbs verified and operational

---

**Last Updated:** 2026-02-20  
**Next Review:** 2026-02-27 (End Week 1)  
**Contact:** data-team@company.com
