// utils/rankingPipeline.ts
import type { SuburbData } from './suburbScoring';
import { generateBenchmarks } from './benchmarkUtils';
import { calculateSuburbScore } from './suburbScoring';

/**
 * Score and rank suburbs by overallScore.
 * Returns a new array, sorted descending, with only suburbs that have sufficient data.
 */
export function scoreAndRankSuburbs(suburbs: SuburbData[]): SuburbData[] {
  // 1. Generate benchmarks
  const benchmarks = generateBenchmarks(suburbs);

  // 2. Calculate score for each suburb (do not mutate original)
  const scored = suburbs.map(suburb => calculateSuburbScore(suburb, benchmarks));

  // 3. Filter out suburbs with insufficient data (overallScore === 0)
  const filtered = scored.filter(s => typeof s.overallScore === 'number' && s.overallScore > 0);

  // 4. Sort descending by overallScore
  const ranked = filtered.sort((a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0));

  // 5. Return ranked array
  return ranked;
}
