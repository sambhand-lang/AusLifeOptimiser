/**
 * Multi-SA2 Weighted Aggregation Implementation Guide
 * 
 * This document defines the aggregation logic for suburbs spanning multiple SA2s.
 * Current Status: Infrastructure in place, awaiting SA2-level metric data
 * 
 * When SA2-level metrics become available in abs_census_by_sa2.json,
 * implement these functions to properly aggregate metrics.
 * 
 * Usage: Convert this to TypeScript in externalDataService.ts
 */

// =============================================================================
// 1. AGGREGATION FORMULAS BY METRIC TYPE
// =============================================================================

/**
 * Population Aggregation: SUM
 * Logic: Population is additive across SA2s
 * Example: Chatswood East 17,590 + Chatswood West 12,530 = 30,120 total
 */
function aggregatePopulation(sa2Metrics) {
  return sa2Metrics.reduce((sum, s) => sum + (s.population || 0), 0);
}

/**
 * Median Age: WEIGHTED AVERAGE
 * Weights: Population of each SA2 (older population has more weight)
 * Example: 
 *   East: 35 years, 17,590 pop, coverage 58.4%
 *   West: 31 years, 12,530 pop, coverage 41.6%
 *   Weighted: (35 * 17590 + 31 * 12530) / (17590 + 12530) ≈ 33.3 years
 */
function aggregateMedianAge(sa2Metrics) {
  let weightedSum = 0;
  let totalWeight = 0;
  
  sa2Metrics.forEach(s => {
    const weight = s.population || 0;
    weightedSum += (s.medianAge || 0) * weight;
    totalWeight += weight;
  });
  
  return totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : 0;
}

/**
 * Household Size: WEIGHTED AVERAGE by Dwelling Count
 * Weights: Number of dwellings in each SA2
 * This is more accurate than population weighting for household metrics
 * Example:
 *   East: 2.7 size, 7,843 dwellings
 *   West: 2.4 size, 5,221 dwellings
 *   Weighted: (2.7 * 7843 + 2.4 * 5221) / (7843 + 5221) ≈ 2.6
 */
function aggregateHouseholdSize(sa2Metrics) {
  let weightedSum = 0;
  let totalDwellings = 0;
  
  sa2Metrics.forEach(s => {
    const dwellingWeight = s.dwellingCount || (s.population / s.householdSize) || 0;
    weightedSum += (s.householdSize || 0) * dwellingWeight;
    totalDwellings += dwellingWeight;
  });
  
  return totalDwellings > 0 ? Math.round((weightedSum / totalDwellings) * 10) / 10 : 0;
}

/**
 * Employment Rate (Employed as % of Labour Force): WEIGHTED AVERAGE
 * Formula: Employed / Labour Force (NOT working-age population)
 * ABS Definition: Percentage of labour force that is employed
 * ⚠️  NOT "Labour Force Participation Rate" (that's Labour Force / working-age population)
 * Weights: Population of each SA2
 * Example:
 *   East: 72% employment (employed/labour force), 17,590 pop
 *   West: 68% employment (employed/labour force), 12,530 pop
 *   Weighted: (72 * 17590 + 68 * 12530) / 30120 ≈ 70.5%
 * Source: ABS Census 2021 Labour Force
 */
function aggregateEmploymentRate(sa2Metrics) {
  let weightedSum = 0;
  let totalPopulation = 0;
  
  sa2Metrics.forEach(s => {
    const weight = s.population || 0;
    weightedSum += (s.employmentRate || 0) * weight;
    totalPopulation += weight;
  });
  
  return totalPopulation > 0 ? Math.round((weightedSum / totalPopulation) * 10) / 10 : 0;
}

/**
 * Median Income: WEIGHTED AVERAGE
 * Weights: Population of each SA2
 * Logic: Income is person-based like employment
 * Example:
 *   East: $85,000, 17,590 pop
 *   West: $50,000, 12,530 pop
 *   Weighted: (85000 * 17590 + 50000 * 12530) / 30120 ≈ $70,200
 */
function aggregateMedianIncome(sa2Metrics) {
  let weightedSum = 0;
  let totalPopulation = 0;
  
  sa2Metrics.forEach(s => {
    const weight = s.population || 0;
    weightedSum += (s.medianIncome || 0) * weight;
    totalPopulation += weight;
  });
  
  return totalPopulation > 0 ? Math.round(weightedSum / totalPopulation) : 0;
}

// =============================================================================
// 2. ORCHESTRATION: MULTI-SA2 AGGREGATION IMPLEMENTATION
// =============================================================================

/**
 * Main aggregation coordinator for multi-SA2 suburbs
 * Called when sa2Mapping.code.includes('|')
 */
async function aggregateMultiSA2Metrics(sa2Mapping) {
  // Step 1: Extract individual SA2 codes
  const sa2Codes = sa2Mapping.code.split('|').map(c => c.trim());
  
  // Step 2: Fetch metrics for each SA2 from abs_census_by_sa2.json
  const sa2Metrics = await Promise.all(
    sa2Codes.map(code => fetchSA2Metrics(code))
  );
  
  // Step 3: Apply aggregation formulas
  const aggregatedMetrics = {
    population: aggregatePopulation(sa2Metrics),
    medianAge: aggregateMedianAge(sa2Metrics),
    householdSize: aggregateHouseholdSize(sa2Metrics),
    employmentRate: aggregateEmploymentRate(sa2Metrics),
    medianIncome: aggregateMedianIncome(sa2Metrics),
    
    // Metadata about aggregation
    _aggregationInfo: {
      componentSA2s: sa2Codes,
      componentMetrics: sa2Metrics,
      weights: sa2Mapping.sa2_codes.map(s => ({
        code: s.code,
        name: s.name,
        coveragePercent: s.coveragePercent,
        population: sa2Metrics[sa2Codes.indexOf(s.code)]?.population
      })),
      aggregatedAt: new Date().toISOString()
    }
  };
  
  return aggregatedMetrics;
}

// =============================================================================
// 3. DATA SOURCE SCHEMA: abs_census_by_sa2.json
// =============================================================================

/**
 * Expected structure when SA2-level data is available:
 * 
 * {
 *   "106541163": {
 *     "name": "Chatswood (East)",
 *     "population": 17590,
 *     "medianAge": 35,
 *     "householdSize": 2.7,
 *     "dwellingCount": 7843,
 *     "employmentRate": 72.1,
 *     "medianIncome": 85000,
 *     "dataYear": 2021,
 *     "source": "ABS Census 2021 SA2 DataPacks"
 *   },
 *   "106541164": {
 *     "name": "Chatswood (West)",
 *     "population": 12530,
 *     "medianAge": 31,
 *     "householdSize": 2.4,
 *     "dwellingCount": 5221,
 *     "employmentRate": 68.0,
 *     "medianIncome": 50000,
 *     "dataYear": 2021,
 *     "source": "ABS Census 2021 SA2 DataPacks"
 *   }
 * }
 */

// =============================================================================
// 4. IMPLEMENTATION CHECKLIST: From Current to Full Aggregation
// =============================================================================

const implementationSteps = [
  {
    priority: 1,
    title: "Obtain SA2-level ABS data",
    description: "Download ABS Census 2021 SA2 DataPacks",
    effort: "Medium",
    timeline: "Week 1",
    steps: [
      "Visit: https://www.abs.gov.au/census/",
      "Download DataPacks for each state",
      "Extract SA2-level metrics (G01-G10 tables)",
      "Create abs_census_by_sa2.json with structure above",
      "Validate: 2,310 SA2 codes ✓ all required metrics"
    ]
  },
  {
    priority: 2,
    title: "Implement SA2-level data retrieval",
    description: "Create getAbsMetricsForSA2() function",
    effort: "Small",
    timeline: "Day 1",
    steps: [
      "Add function in externalDataService.ts",
      "Load abs_census_by_sa2.json on startup",
      "Implement caching for performance",
      "Add error handling for missing SA2 codes"
    ]
  },
  {
    priority: 3,
    title: "Implement aggregation logic",
    description: "Convert functions above to TypeScript",
    effort: "Small",
    timeline: "Day 1",
    steps: [
      "Add all 5 aggregation functions to service",
      "Unit test with known Chatswood data",
      "Verify formulas match expected results",
      "Add aggregation logging/tracing"
    ]
  },
  {
    priority: 4,
    title: "Update getSuburbRealData() flow",
    description: "Call aggregation when multi-SA2 detected",
    effort: "Medium",
    timeline: "Day 2",
    steps: [
      "Check if sa2Code.includes('|')",
      "If true: call aggregateMultiSA2Metrics()",
      "If false: use existing single-SA2 path",
      "Populate dataIntegrity._aggregationInfo",
      "Test both code paths"
    ]
  },
  {
    priority: 5,
    title: "Add transparency metadata",
    description: "Surface component SA2s in API response",
    effort: "Small",
    timeline: "Day 2",
    steps: [
      "Add componentSA2s to dataIntegrity",
      "Include weights breakdown",
      "Add aggregationTimestamp",
      "Document in API schema"
    ]
  },
  {
    priority: 6,
    title: "Performance optimization",
    description: "Cache aggregated results",
    effort: "Small",
    timeline: "Day 3",
    steps: [
      "Implement result caching (24h TTL)",
      "Pre-warm cache on startup",
      "Monitor query performance",
      "Optimize SA2-level lookups"
    ]
  }
];

console.log('Multi-SA2 Aggregation Implementation Roadmap\n');
implementationSteps.forEach(step => {
  console.log(`${step.priority}. [${step.effort}] ${step.title} (${step.timeline})`);
  console.log(`   ${step.description}`);
});

// =============================================================================
// 5. VALIDATION TESTS
// =============================================================================

/**
 * Test case: Chatswood aggregation
 * 
 * Input SA2 metrics:
 *   106541163 (Chatswood East):
 *     - population: 17,590
 *     - medianAge: 35
 *     - householdSize: 2.7
 *     - dwellingCount: 7,843
 *     - employmentRate: 72.1
 *     - medianIncome: 85,000
 *     - coverage: 58.4%
 * 
 *   106541164 (Chatswood West):
 *     - population: 12,530
 *     - medianAge: 31
 *     - householdSize: 2.4
 *     - dwellingCount: 5,221
 *     - employmentRate: 68.0
 *     - medianIncome: 50,000
 *     - coverage: 41.6%
 * 
 * Expected aggregated output:
 *   - population: 30,120 (SUM)
 *   - medianAge: 33.3 (weighted by pop)
 *   - householdSize: 2.6 (weighted by dwellings)
 *   - employmentRate: 70.5% (weighted by pop)
 *   - medianIncome: $70,200 (weighted by pop)
 * 
 * Validation:
 *   ✓ Current API returns: population=30,120 (matches)
 *   ✓ Coverage sums to 100% (58.4 + 41.6)
 *   ✓ All formulas testable with this real suburb
 */

// =============================================================================
// 6. ROLLOUT SCHEDULE
// =============================================================================

const rolloutPlan = {
  phase: "Single Suburb Validation (Chatswood)",
  timeline: "1 week",
  steps: [
    "Week 1, Day 1: Obtain SA2-level ABS data",
    "Week 1, Day 1: Implement SA2 retrieval function",
    "Week 1, Day 2: Implement aggregation formulas",
    "Week 1, Day 2: Integrate into getSuburbRealData()",
    "Week 1, Day 3: Unit + integration testing",
    "Week 1, Day 4: Performance profiling & caching",
    "Week 1, Day 5: Staging deployment & validation",
    "Week 2, Day 1: Production deployment"
  ],
  successCriteria: [
    "Chatswood (847) returns correct aggregated metrics",
    "Chatswood West (878) returns identical aggregated metrics",
    "dataIntegrity shows all component SA2s",
    "P95 query latency < 500ms (with cache)",
    "Zero test failures"
  ]
};

console.log('\n\nRollout Plan: Chatswood Multi-SA2 Aggregation');
console.log(`Timeline: ${rolloutPlan.timeline}\n`);
rolloutPlan.steps.forEach(step => console.log(`  ${step}`));

console.log('\nSuccess Criteria:');
rolloutPlan.successCriteria.forEach(c => console.log(`  ✓ ${c}`));

// =============================================================================
// Export for use in actual implementation
// =============================================================================

module.exports = {
  aggregatePopulation,
  aggregateMedianAge,
  aggregateHouseholdSize,
  aggregateEmploymentRate,
  aggregateMedianIncome,
  aggregateMultiSA2Metrics,
  implementationSteps,
  rolloutPlan
};
