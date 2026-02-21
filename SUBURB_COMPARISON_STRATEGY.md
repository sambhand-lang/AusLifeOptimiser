# Suburb Comparison & Data Quality Strategy

**Date:** February 20, 2026  
**Objective:** Implement full multi-SA2 aggregation, verify NSW suburbs, automate QA, and design national rollout

---

## 1. FULL MULTI-SA2 AGGREGATION

### Current State
- Chatswood marked as multi-SA2 (106541163|106541164)
- Coverage percentages stored (58.4%, 41.6%)
- Infrastructure in place but using suburb-level data

### Implementation Requirements

#### A. Data Layer: SA2-Level Metrics Needed
```
For each SA2 code, need:
- Population (for weighting)
- Median Age
- Household Size (need dwelling count for weighting)
- Employment Rate
- Median Income
- Dwelling count (for household size weighting)
```

#### B. Aggregation Formula by Metric Type
```
Population:           SUM(sa2_populations)
Median Age:           WEIGHTED_AVG(ages, populations)
Household Size:       WEIGHTED_AVG(sizes, dwelling_counts)
Employment Rate:      WEIGHTED_AVG(rates, populations)
Median Income:        WEIGHTED_AVG(incomes, populations)
```

#### C. ABS Data Source Strategy
- Current: `abs_census_by_suburb.json` (suburb-level only)
- Target: Create `abs_census_by_sa2.json` from raw ABS data
- Method: Use ABS ASGS 2021 / Census 2021 API or DataPacks

#### D. Implementation Steps
1. Augment ABS data with SA2-level metrics from official source
2. Modify `getAbsMetrics()` to use SA2-level data when available
3. Implement weighted aggregation in service layer
4. Add aggregation logging/tracing for transparency

---

## 2. NSW SUBURB VERIFICATION (Priority: State-by-State Rollout)

### Database Analysis Required
- Total suburbs in database
- NSW-specific suburbs count
- Official vs provisional SA2 mappings
- Unmapped suburbs

### Verification Checklist
```
For each NSW suburb:
☐ Suburb exists in official ABS ASGS 2021
☐ SA2 code(s) valid format (8-9 digits)
☐ Coverage percentages match ABS (if multi-SA2)
☐ Data source documented (ABS, estimation, provisional)
☐ Verification date recorded (for maintenance)
☐ Metadata complete (isOfficial, dataYear)
```

### NSW Regional Grouping Strategy
```
By Statistical Division:
- Sydney Metro (most official SA2s)
- Regional NSW (mix of official/provisional)
- Remote NSW (limited coverage)

Priority order for full SA2 mapping:
1. Greater Sydney (highest population, most economic impact)
2. Regional Centers (Newcastle, Wollongong, Canberra area)
3. Remote/Rural (lower priority, smaller populations)
```

---

## 3. AUTOMATED MAPPING VERIFICATION

### Pre-Commit Validation
```
Trigger: Any change to abs_sa2_boundaries.json
Check:
- Code format validation (8-9 digit)
- Coverage % sum to 100% (±1% tolerance)
- SA2 codes registered in ASGS 2021
- Duplicate entries not allowed
- Metadata completeness
```

### Continuous Monitoring
```
Weekly Schedule:
- Run verification against official ABS dataset
- Alert on unmapped suburbs
- Track data staleness (dates > 12 months old)
- Detect mapping drift from official ASGS updates
```

### Data Quality Metrics
```
Dashboard tracking:
- % of suburbs with official SA2 mapping
- % with verified coverage data
- Last verification date per suburb
- Code standard compliance (5-digit vs 8-9 digit)
- Pending migration count
```

---

## 4. NATIONAL ROLLOUT DESIGN

### Phase 1: Single State Perfection (NSW)
**Duration:** 4 weeks
**Scope:**
- Map 100% of NSW official SA2s to database suburbs
- Implement full aggregation for multi-SA2 suburbs
- Create NSW verification dashboard
- Document processes

**Deliverables:**
- NSW passing all verification checks
- API documentation for multi-SA2 queries
- Operator runbook (how to maintain mappings)

### Phase 2: Expand to Metro Centers (VIC, Qld, WA)
**Duration:** 3 weeks per state
**Scope:**
- Focus on capital cities first (Sydney done, Melbourne, Brisbane, Perth)
- Apply NSW processes
- Build state-level verification

### Phase 3: Full National Coverage
**Duration:** 6 weeks
**Scope:**
- All remaining suburbs nationally
- SA, NT, ACT, TAS regional centers
- Implement fallback rules for unmapped areas

### Phase 4: Maintenance & Updates
**Duration:** Ongoing
**Scope:**
- Annual ABS ASGS update cycle
- Semi-annual verification runs
- Incident response for mapping errors

---

## 5. TECHNICAL IMPLEMENTATION ROADMAP

### Immediate (This Sprint)
- [ ] Create `abs_census_by_sa2.json` from ABS DataPacks
- [ ] Implement SA2-level aggregation in externalDataService.ts
- [ ] Add aggregation logging/transparency
- [ ] NSW suburb audit script

### Short-term (2 weeks)
- [ ] Automated pre-commit validation
- [ ] NSW verification dashboard
- [ ] Update documentation

### Medium-term (1 month)
- [ ] VIC/QLD/WA mapping completion
- [ ] Weekly automated verification cron job
- [ ] Data staleness alerts

### Long-term (Ongoing)
- [ ] Maintain ASGS alignment
- [ ] Quarterly data audits
- [ ] National coverage expansion

---

## 6. DATA ARCHITECTURE: Multi-SA2 Aggregation

### Updated Data Flow
```
API Request (/api/suburbs/:id/details)
    ↓
getSuburbRealData(suburName, state)
    ↓
Check if multi-SA2 → Load SA2 list
    ↓
Yes: Fetch SA2-level metrics individually
    ↓
Apply weighted aggregation formulas
    ↓
Build dataIntegrity metadata with:
   - componentSA2s: [...]
   - weights: [...]
   - aggregationTimestamp: ...
    ↓
Return aggregated metrics + dataIntegrity
```

### File Changes Required
```
New/Modified:
1. backend/data/abs_census_by_sa2.json (NEW)
   - SA2 code → metrics mapping
   
2. backend/src/externalDataService.ts (MODIFY)
   - Add getAbsMetricsForSA2(sa2Code)
   - Implement weightedAggregation()
   - Update dataIntegrity.componentSA2s
   
3. backend/scripts/verify_sa2_nsw.js (NEW)
   - State-specific verification
   
4. backend/scripts/migrate_5digit_to_8digit.js (NEW)
   - Bulk migration of legacy codes
```

---

## 7. SUCCESS METRICS

### Technical KPIs
- [ ] 100% NSW suburbs verified (target: Week 2)
- [ ] 95%+ with official ASGS 2021 mapping (target: Week 4)
- [ ] Multi-SA2 aggregation operational (target: This week)
- [ ] Zero unmapped official suburbsNational scope

### Data Quality KPIs
- [ ] Code format compliance: 100% (5-digit → 0%, 8+ digit → 100%)
- [ ] Coverage % accuracy: ±0.5% from official
- [ ] Metadata completeness: 100% for official suburbs
- [ ] Verification audit trail: All changes logged with timestamps

### Operational KPIs
- [ ] Automated verification run daily
- [ ] Mean time to detect mapping error: < 24 hours
- [ ] Mean time to fix mapping: < 1 business day
- [ ] Verification script coverage: All 6295 suburbs

---

## 8. Dependencies & Blockers

### Data Dependencies
- [ ] ABS Census 2021 SA2-level DataPacks (need to obtain)
- [ ] ASGS 2021 official SA2 code register (for validation)
- [ ] Dwelling count data by SA2 (for household size weighting)

### Technical Dependencies
- [ ] SA2-level metrics ingestion system
- [ ] Cron job infrastructure for automated verification
- [ ] Alerting system for data quality issues

### Process Dependencies
- [ ] Data governance policy for mapping updates
- [ ] Approval process for provisional → official transitions
- [ ] Documentation standards for metadata

---

## 9. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| ABS data unavailable | Medium | High | Use pre-computed SA2 rollups + fallback to suburb-level |
| Dwelling count missing | Medium | Medium | Use population as proxy weight (with notation) |
| Validation false positives | Low | Medium | Implement manual review queue for edge cases |
| Performance degradation | Low | High | Cache aggregated results, implement warming |
| Mapping drift from ABS updates | Medium | Medium | Quarterly reconciliation, version tracking |

---

## 10. Governance & Maintenance

### Change Control
```
Process:
1. SA2 mapping change proposed
2. Run verification script (pre-commit check)
3. Multi-SA2 coverage validates to 100% ± 1%
4. Merge to main with verification timestamp
5. CI/CD deploys within hours
6. Automated re-verification after 24h
```

### Audit Trail
```
Schema:
{
  "timestamp": "2026-02-20T12:30:00Z",
  "changedBy": "data-team",
  "changes": [
    {
      "suburb": "CHATSWOOD|NSW",
      "oldCode": "10635",
      "newCode": "106541163|106541164",
      "reason": "Official ABS ASGS 2021 mapping",
      "verifiedDate": "2026-02-18"
    }
  ]
}
```

### Maintenance Schedule
```
Daily:   Automated verification run
Weekly:  Data quality dashboard review
Monthly: Unmapped suburb audit + planning
Quarterly: ABS ASGS alignment check + bulk updates
Annually: Full national re-mapping verification
```

---

**Status:** Ready for implementation  
**Next Step:** Create verification scripts for NSW suburbs  
**Contact:** data-team
