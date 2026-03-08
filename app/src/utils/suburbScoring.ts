// utils/suburbScoring.ts
import { getMetricValue, type Metric } from './metricUtils';
import { normalizeDirect, normalizeInverse } from './normalization';

// Minimal SuburbData type for scoring
export type SuburbData = {
  realTimeData?: {
    medianIncome?: Metric | null;
    medianHousePrice?: Metric | null;
    medianRent?: Metric | null;
    oneYearGrowth?: Metric | null;
    employmentRate?: Metric | null;
    commute?: { drivingTimeMinutes?: Metric | null } | null;
    schools?: { count?: Metric | null } | null;
    parks?: Metric | null;
    population?: Metric | null;
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
  priceMin: number;
  priceMax: number;
  incomeMin: number;
  incomeMax: number;
  commuteMin: number;
  commuteMax: number;
  schoolMin: number;
  schoolMax: number;
  lifestyleMin: number;
  lifestyleMax: number;
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
  const housePrice = getMetricValue(suburb.realTimeData?.medianHousePrice) || ((suburb as any).median_house_price);
  
  const commute = getMetricValue(suburb.realTimeData?.commute?.drivingTimeMinutes);
  const schools = getMetricValue(suburb.realTimeData?.schools?.count);

  // Normalized scores (0–100)
  const affordability = housePrice != null
    ? normalizeInverse(housePrice, benchmarks.priceMin, benchmarks.priceMax)
    : 0;
  
  const employmentScore = income != null
    ? normalizeDirect(income, benchmarks.incomeMin, benchmarks.incomeMax)
    : 0;

  const commuteScore = commute != null
    ? normalizeInverse(commute, benchmarks.commuteMin, benchmarks.commuteMax)
    : 0;

  const schoolsScore = schools != null
    ? normalizeDirect(schools, benchmarks.schoolMin, benchmarks.schoolMax)
    : 0;

  // 5. Lifestyle (v2)
  const population = getMetricValue(suburb.realTimeData?.population);
  const parkCount = getMetricValue(suburb.realTimeData?.parks);
  const parkPer10k = (parkCount != null && population != null && population > 0)
    ? (parkCount / population) * 10000
    : 0;

  // Additional lifestyle metrics from data or 0 fallback
  const cafes = getMetricValue((suburb.realTimeData as any)?.cafes) || 0;
  const restaurants = getMetricValue((suburb.realTimeData as any)?.restaurants) || 0;
  const recreation = getMetricValue((suburb.realTimeData as any)?.recreation) || 0;
  const transitScore = getMetricValue((suburb.realTimeData as any)?.transitScore) || 
                       getMetricValue((suburb.realTimeData as any)?.publicTransportStops) || 0;

  const rawLifestyle = (parkPer10k * 0.4) + ((cafes + restaurants) * 0.3) + (recreation * 0.2) + (transitScore * 0.1);
  const lifestyleScore = normalizeDirect(rawLifestyle, benchmarks.lifestyleMin, benchmarks.lifestyleMax);

  // Overall Weighted Score (v2)
  const overallScore = Math.round(
    affordability * 0.25 +   // 25% Affordability
    employmentScore * 0.20 + // 20% Employment
    commuteScore * 0.20 +    // 20% Commute
    schoolsScore * 0.15 +    // 15% Schools
    lifestyleScore * 0.20    // 20% Lifestyle
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
      lifestyle: lifestyleScore,
    },
  };
}
export function getSuburbInsights(scoredSuburb: SuburbData) {
  const breakdown = scoredSuburb.scoreBreakdown;
  if (!breakdown) return { strengths: [], weaknesses: [] };

  const scores = [
    { label: 'Affordability', value: breakdown.affordability || 0 },
    { label: 'Employment', value: breakdown.employment || 0 },
    { label: 'Commute', value: breakdown.commute || 0 },
    { label: 'Schools', value: breakdown.schools || 0 },
    { label: 'Lifestyle', value: breakdown.lifestyle || 0 },
  ];

  // Sort scores to find strengths and weaknesses
  const sorted = [...scores].sort((a, b) => b.value - a.value);

  // Strengths are scores > 70
  const strengths = sorted.filter(s => s.value >= 70).slice(0, 2);
  
  // Weaknesses are scores < 50
  const weaknesses = sorted.reverse().filter(s => s.value < 50).slice(0, 2);

  return { strengths, weaknesses };
}
