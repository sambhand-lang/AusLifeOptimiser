// utils/suburbScoring.ts
import { getMetricValue, Metric } from './metricUtils';
import { normalizeDirect, normalizeInverse } from './normalization';

// Minimal SuburbData type for scoring
export type SuburbData = {
  realTimeData?: {
    medianIncome?: Metric | null;
    employmentRate?: Metric | null;
    commute?: { drivingTimeMinutes?: Metric | null } | null;
    schools?: { count?: Metric | null } | null;
    parks?: Metric | null;
  } | null;
  overallScore?: number;
  scoreBreakdown?: {
    affordability?: number;
    employment?: number;
    commute?: number;
    schools?: number;
    lifestyle?: number;
  };
  // ...other fields
};

export type SuburbScoreBenchmarks = {
  incomeMin: number;
  incomeMax: number;
  employmentMin: number;
  employmentMax: number;
  commuteMin: number;
  commuteMax: number;
  schoolMin: number;
  schoolMax: number;
};

/**
 * Calculates suburb score and breakdown using realTimeData and benchmarks.
 * Returns a new SuburbData object with overallScore and scoreBreakdown populated.
 */
export function calculateSuburbScore(
  suburb: SuburbData,
  benchmarks: SuburbScoreBenchmarks
): SuburbData {
  // Defensive extraction
  const income = getMetricValue(suburb.realTimeData?.medianIncome);
  const employment = getMetricValue(suburb.realTimeData?.employmentRate);
  const commute = getMetricValue(suburb.realTimeData?.commute?.drivingTimeMinutes);
  const schools = getMetricValue(suburb.realTimeData?.schools?.count);
  const parks = getMetricValue(suburb.realTimeData?.parks);

  // Normalized scores (0–100)
  const affordability = income != null
    ? normalizeDirect(income, benchmarks.incomeMin, benchmarks.incomeMax)
    : 0;
  const employmentScore = employment != null
    ? normalizeDirect(employment, benchmarks.employmentMin, benchmarks.employmentMax)
    : 0;
  const commuteScore = commute != null
    ? normalizeInverse(commute, benchmarks.commuteMin, benchmarks.commuteMax)
    : 0;
  const schoolsScore = schools != null
    ? normalizeDirect(schools, benchmarks.schoolMin, benchmarks.schoolMax)
    : 0;
  const parksScore = parks != null
    ? normalizeDirect(parks, 0, 100) // Parks normalization: fallback 0–100
    : 0;

  // Weighted sum
  const overallScore = Math.round(
    affordability * 0.3 +
    employmentScore * 0.25 +
    commuteScore * 0.2 +
    schoolsScore * 0.15 +
    parksScore * 0.1
  );

  // Return new object (do not mutate input)
  return {
    ...suburb,
    overallScore,
    scoreBreakdown: {
      affordability,
      employment: employmentScore,
      commute: commuteScore,
      schools: schoolsScore,
      lifestyle: parksScore,
    },
  };
}
