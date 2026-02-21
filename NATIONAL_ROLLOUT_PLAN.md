# National Suburb Data Quality Rollout Plan

**Version:** 1.0  
**Date:** February 20, 2026  
**Status:** Ready for Implementation  
**Scope:** Australia-wide suburb verification and multi-SA2 aggregation

---

## Executive Summary

This document outlines a phased approach to implement full multi-SA2 aggregation, verify all suburbs against official ABS ASGS 2021 boundaries, and establish automated quality assurance for the Australian suburbs database.

**Timeline:** 12 weeks (3 phases)  
**States:** 8 (NSW, VIC, QLD, WA, SA, NT, TAS, ACT)  
**Total Suburbs:** ~6,300  
**Current Focus:** NSW (Priority 1)

---

## Phase 1: Foundation & NSW (Weeks 1-4)

### Objectives
- ✅ Implement full multi-SA2 aggregation logic
- ✅ Verify 100% of NSW suburbs
- ✅ Establish automated verification pipeline
- ✅ Document processes and runbooks

### Week 1: Data Acquisition & Single Suburb Validation

**Items:**
- [ ] Obtain ABS Census 2021 SA2-level DataPacks
- [ ] Create `abs_census_by_sa2.json` with SA2-level metrics
- [ ] Implement `getAbsMetricsForSA2()` function
- [ ] Implement all 5 aggregation formulas
- [ ] Unit test with Chatswood real data

**Deliverable:** Working aggregation for multi-SA2 suburbs (Chatswood validated)

**Commands to Run:**
```bash
npm run aggregation-guide          # Review aggregation logic
npm run verify-nsw                 # Check current NSW status
```

---

### Week 1-2: NSW Suburb Verification

**Steps:**
1. Run: `npm run verify-nsw` to get current NSW breakdown
2. For each provisional suburb in output:
   - Cross-reference against official ABS ASGS 2021 register
   - Update `abs_sa2_boundaries.json` with official codes
   - Run `npm run verify-sa2` to validate

**Validation Rules:**
```
For each suburb:
✓ SA2 code format: 8-9 digits (must validate)
✓ Suburb exists: In official ASGS 2021 register
✓ Coverage %: Sums to 100% (±1% tolerance) if multi-SA2
✓ Metadata: isOfficial, dataYear, verifiedDate populated
```

**Expected Output:**
- Provisional to Official conversion: ~90% of NSW suburbs
- Official coverage: From 3.6% to 95%+
- Multi-SA2 ready for aggregation

---

### Week 2-3: NSW Data Quality Dashboard

**Create Dashboard Metrics:**
- Official mapping percentage (target: >95%)
- Mean age of verification data (target: <12 months)  
- Unmapped suburb count (target: <50)
- Code standard compliance

**Automation:**
- Pre-commit hook: `npm run verify-sa2`
- Daily cron: Automated verification
- Weekly report: Dashboard update

---

### Week 3-4: NSW Documentation & Testing

**Documentation:**
- [ ] NSW-specific runbook (how to maintain mappings)
- [ ] Troubleshooting guide (common mapping issues)
- [ ] Data update procedures
- [ ] Emergency rollback steps

**Test Cases:**
- [ ] Multi-SA2 aggregation: Chatswood (known good data)
- [ ] Single-SA2 suburbs: Random sample of 10
- [ ] Unofficial suburbs: Proper handling
- [ ] Error cases: Missing data, mismatched codes

**Result:** NSW ready for production, Phase 2 ready to start

---

## Phase 2: Metro Centers (Weeks 5-8)

### State Rollout Sequence

**Week 5-6: Victoria (Melbourne)**
- Focus: Greater Melbourne + regional centers
- Est. suburbs: ~2,500
- Resources: NSW processes reusable

**Week 6-7: Queensland (Brisbane)**  
- Focus: Greater Brisbane + Gold Coast
- Est. suburbs: ~1,800
- Resources: NSW processes reusable

**Week 7-8: Western Australia (Perth)**
- Focus: Greater Perth + regional centers
- Est. suburbs: ~800
- Resources: NSW processes reusable

### Per-State Workflow

```
Week Start (e.g., Monday)
├─ Load SA2 boundaries for state
├─ Run: npm run verify-sa2 --state=VIC
├─ Analyze: Official vs Provisional
├─ Convert: Update with official codes
├─ Test: Sample suburbs + multi-SA2
├─ Deploy: Pre-prod validation
└─ Go-live: Prod deployment by EOW

Validation: All state-specific suburbs must pass verify-sa2
```

### Multi-SA2 Identification Strategy

**For each state, identify suburbs spanning multiple SA2s:**
1. Check SA2 boundaries shapefile
2. Find suburb polygons that intersect multiple SA2s
3. Calculate intersection percentages (coverage %)
4. Add to `abs_sa2_boundaries.json` with coverage data
5. Update dataIntegrity in API response

**Expected multi-SA2 suburbs per state:**
```
NSW: 1-2 (Chatswood done)
VIC: 2-4 (likely Melbourne CBD area)
QLD: 1-2 (likely Brisbane CBD area)
WA: 0-1 (Perth less fragmented)
SA/NT/TAS: 0 (smaller regions, less fragmentation)
```

---

## Phase 3: Regional & Full Coverage (Weeks 9-12)

### State Rollout Sequence (Continued)

**Week 9: South Australia & ACT**
- Est. combined: 1,000 suburbs
- Focus: Adelaide, Canberra

**Week 10: Northern Territory**
- Est. suburbs: 150
- Focus: Darwin, Alice Springs

**Week 11: Tasmania**
- Est. suburbs: 300
- Focus: Hobart, Launceston

**Week 12: Verification & Optimization**
- National audit run
- Performance optimization (caching strategy)
- Documentation finalization
- Training & handoff

### National Summit

**Week 12 Deliverables:**
- [ ] 100% of 6,300 suburbs officially mapped (or documented as provisional)
- [ ] Multi-SA2 aggregation tested for all state combinations
- [ ] Automated verification running daily
- [ ] Data quality dashboard live
- [ ] Team training completed

---

## Technical Architecture: Automated Verification Pipeline

### Pre-Commit Validation

```
File: .git/hooks/pre-commit

Trigger: Any commit to abs_sa2_boundaries.json
Steps:
1. Run: npm run verify-sa2
2. Check: Code format (8-9 digit)
3. Check: Coverage % (±1% tolerance)
4. Check: Metadata completeness
5. Block: If any check fails
6. Allow: If all pass + tests green
```

### Daily Automated Verification (Cron)

```
Schedule: 02:00 UTC daily
Script: backend/scripts/daily_verification.js

Steps:
1. Load latest SA2 boundaries
2. Load latest ABS official register
3. Cross-check each suburb:
   - Code still valid in ASGS 2021?
   - Coverage % stable?
   - Overdue for re-verification?
4. Generate report:
   - New issues detected (alert)
   - Data staleness warnings (notice)
   - Compliance score
5. Email: data-team with summary
```

### Data Quality Dashboard (Weekly)

```
Metrics Tracked:
┌─────────────────────────────────────┐
│ National Status (Updated Weekly)    │
├─────────────────────────────────────┤
│ Official Mapping:        95.2% ↑    │
│ Provisional Count:       200 ↓      │
│ Multi-SA2 Suburbs:       8 (ready)  │
│ Data Age (mean):         185 days   │
│ Code Compliance:         100% ✓     │
│ Last Full Audit:         2026-02-14 │
└─────────────────────────────────────┘

By State Breakdown:
NSW     97%  │ VIC     92%  │ QLD   88%
WA      85%  │ SA      83%  │ NT    70%
TAS     75%  │ ACT     95%  │
```

### Incident Response Process

```
When verify-sa2 detects issue:

SEVERITY 1 (Critical):
- Code format invalid
- Coverage % missing multi-SA2
- Duplicate suburbs detected
Action: Block deploy, alert on-call, 1h fix SLA

SEVERITY 2 (High):
- Provisional suburb matches official
- Data age > 12 months
- Metadata field missing
Action: Alert team, 1 day review SLA

SEVERITY 3 (Medium):
- Code style inconsistent
- Verification date old but valid
- Comment clarification needed
Action: Note in report, next sprint SLA
```

---

## Data Architecture

### Source Files

```
backend/data/
├── abs_sa2_boundaries.json (4,778 entries)
│   ├── SUBURB|STATE → SA2 code mapping
│   ├── isOfficial: boolean
│   ├── sa2_codes: [{code, name, coveragePercent}]
│   └── verifiedDate: ISO timestamp
│
├── abs_census_by_sa2.json (2,310 SA2s) [NEW]
│   ├── SA2_CODE → metrics
│   ├── population, medianAge, householdSize
│   ├── employmentRate, medianIncome
│   └── dwellingCount (for household weighting)
│
└── abs_census_by_suburb.json (backup)
    └── Suburb-level aggregates (fallback if SA2 unavailable)
```

### API Response Structure

```json
{
  "realTimeData": {
    "population": {
      "value": 30120,
      "source": "ABS Census 2021 (Multi-SA2 Aggregated)"
    },
    "dataIntegrity": {
      "absSource": "ABS Census 2021",
      "asgsVersion": "2021",
      "mappingVerified": true,
      "multiSA2": true,
      "aggregationMethod": "population-weighted",
      "sa2Codes": ["106541163", "106541164"],
      "coveragePercents": [58.4, 41.6],
      "componentMetrics": [
        {
          "code": "106541163",
          "name": "Chatswood (East)",
          "population": 17590,
          "weight": 58.4
        },
        {
          "code": "106541164",
          "name": "Chatswood (West)",
          "population": 12530,
          "weight": 41.6
        }
      ],
      "aggregatedAt": "2026-02-20T12:30:00Z"
    }
  }
}
```

---

## Success Metrics & KPIs

### Technical KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Official Mapping % | 95%+ | Weekly dashboard |
| Multi-SA2 Aggregation | 100% accuracy | Unit test suite |
| Verification Time | < 2h per state | Cron job logs |
| Query Latency (P95) | < 500ms | APM monitoring |
| Code Standard Compliance | 100% | Pre-commit checks |

### Data Quality KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| Coverage % Accuracy | ±0.5% of official | Manual audits |
| Metadata Completeness | 100% for official | Query validation |
| Data Staleness | < 365 days mean | Verification reports |
| Unmapped Official Suburbs | 0 | State audits |
| Duplicate Prevention | 0 duplicates | Pre-commit validation |

### Operational KPIs

| Metric | Target | Measurement |
|--------|--------|-------------|
| MTTR (mean time to fix) | < 1 business day | Incident tracker |
| False Positive Rate | < 5% | Dashboard review |
| Scheduled Downtime | 0 hours | Deployment logs |
| Audit Trail Completeness | 100% | Git history |

---

## Risk Management

### Top Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| ABS data unavailable | Medium | High | Pre-cache all DataPacks, have fallback |
| Multi-SA2 edge cases | Medium | High | Test with 50+ known examples |
| Performance degradation | Low | High | Implement aggressive caching |
| Mapping errors during conversion | Medium | Medium | 2-person review + automated tests |
| Sync issues across databases | Low | Medium | Checksum validation, audit logs |

### Contingency Plans

**If ABS system down:**
- Use last known good data
- Mark affected suburbs as "data age > 12 months"
- Manual verification queue

**If multi-SA2 aggregation fails:**
- Fall back to suburb-level data
- Disable multi-SA2 response flag
- Alert page escalation

**If verification blocks deployment:**
- Rollback to last known good commit
- Review with 2 engineers
- Manual approval process

---

## Budget & Resources

### Team & Roles

```
Data Team (3 people):
├─ Lead: Oversee planning + execution
├─ Engineer: Implementation + testing
└─ QA: Validation + documentation

DevOps (1 person):
└─ Automation: CI/CD, cron jobs, monitoring

Estimated Hours: 240 hours (6 weeks of development, testing, validation)
Cost: ~$20,000-30,000 (dependent on hourly rate)
```

### Infrastructure

```
Compute: Minimal impact (query optimization may reduce load)
Storage: +50MB for SA2-level data files
Database: No schema changes required
```

---

## Communication & Handoff

### Stakeholders
- [ ] Data Team (primary)
- [ ] Platform Team (CI/CD support)
- [ ] Finance Team (business value: improved data accuracy)
- [ ] Customer Success (user communication)

### Updates Schedule
- Weekly: Status update to leadership
- Bi-weekly: Stakeholder demos
- End of Phase: Detailed retrospectives

### Documentation
- [ ] Runbooks for each state
- [ ] Troubleshooting playbooks
- [ ] API documentation updates
- [ ] Training videos (optional)

---

## Conclusion

This plan enables:
1. **Full transparency:** All suburbs have documented SA2 mappings
2. **Accurate aggregation:** Multi-SA2 suburbs use proper weighted formulas
3. **Automated QA:** Continuous verification prevents regression
4. **National scale:** Processes work uniformly across Australia

**Next Steps:**
1. Approve this plan
2. Schedule kickoff meeting (Week 1, Day 1)
3. Assign data team lead
4. Obtain ABS SA2-level DataPacks
5. Begin NSW implementation

**Contact:** data-team@company.com  
**Last Updated:** 2026-02-20
