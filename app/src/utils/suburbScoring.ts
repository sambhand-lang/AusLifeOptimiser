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
  const income = getMetricValue(suburb.realTimeData?.medianIncome) || ((suburb as any).median_income) || ((suburb as any).median_income_weekly);
  const housePrice = getMetricValue(suburb.realTimeData?.medianHousePrice) || ((suburb as any).median_house_price);
  const commute = getMetricValue(suburb.realTimeData?.commute?.drivingTimeMinutes);
  const schools = getMetricValue(suburb.realTimeData?.schools?.count);
  const population = getMetricValue(suburb.realTimeData?.population) || 0;
  const effectivePop = Math.max(800, population);

  // 1. Affordability (15%)
  let affordability = 0;
  if (housePrice != null && income != null && housePrice > 0) {
    const annualIncome = income * 52;
    const ratio = annualIncome / housePrice;
    const ratioMin = 0.02;
    const ratioMax = 0.20;
    affordability = ((ratio - ratioMin) / (ratioMax - ratioMin)) * 100;
    affordability = Math.max(0, Math.min(100, affordability));
  } else if (housePrice != null) {
    affordability = normalizeInverse(housePrice, benchmarks.priceMin, benchmarks.priceMax);
  }
  
  // 2. Economy (20%)
  const employmentScore = income != null
    ? normalizeDirect(income, benchmarks.incomeMin, benchmarks.incomeMax)
    : 0;

  // 3. Connectivity (20%)
  const commuteScore = commute != null
    ? normalizeInverse(commute, benchmarks.commuteMin, benchmarks.commuteMax)
    : 0;

  // 4. Family/Schools (20%)
  const schoolsScore = schools != null
    ? normalizeDirect(schools, benchmarks.schoolMin, benchmarks.schoolMax)
    : 0;
  const parkCount = getMetricValue(suburb.realTimeData?.parks) || 0;
  const parkDensity = (parkCount / effectivePop) * 10000;
  const parkScore = Math.min(100, parkDensity * 4);
  const familyScore = (schoolsScore * 0.6) + (parkScore * 0.4);

  // 5. Lifestyle (25%) - V4 Weighted Density Model
  const cafes = getMetricValue((suburb.realTimeData as any)?.cafes) || 0;
  const restaurants = getMetricValue((suburb.realTimeData as any)?.restaurants) || 0;
  const recreation = getMetricValue((suburb.realTimeData as any)?.recreation) || 0;
  const cafeCount = cafes + restaurants;
  const cafeDensity = (cafeCount / effectivePop) * 1000;
  const amenityDensityScore = Math.min(100, cafeDensity * 12.5);
  const absoluteBonus = Math.min(20, (cafeCount / 40) * 20);
  
  const recScore = Math.min(100, (recreation / effectivePop) * 5000);
  let lifestyleBase = (amenityDensityScore * 0.7) + (recScore * 0.3) + absoluteBonus;
  lifestyleBase = Math.min(100, lifestyleBase);

  // Small suburb dampener
  let lifestyleFinal = lifestyleBase;
  if (population < 800 && population > 0) {
      lifestyleFinal *= (0.5 + (0.5 * population / 800));
  } else if (population === 0) {
      lifestyleFinal = 0;
  }

  // Final Overall Weighted Score (V4)
  const overallScore = Math.round(
    lifestyleFinal * 0.25 + 
    familyScore * 0.20 + 
    commuteScore * 0.20 + 
    employmentScore * 0.20 + 
    affordability * 0.15
  );

  return {
    ...suburb,
    overallScore,
    scoreBreakdown: {
      affordability,
      employment: employmentScore,
      commute: commuteScore,
      schools: familyScore,
      lifestyle: lifestyleFinal,
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
