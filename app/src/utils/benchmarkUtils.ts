// utils/benchmarkUtils.ts
import type { SuburbData } from './suburbScoring';
import { getMetricValue } from './metricUtils';

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
 * Generate min/max benchmarks for scoring from a list of suburbs.
 * Ignores suburbs with missing values for each metric.
 */
export function generateBenchmarks(suburbs: SuburbData[]): SuburbScoreBenchmarks {
  const incomes: number[] = [];
  const prices: number[] = [];
  const commutes: number[] = [];
  const schools: number[] = [];
  const lifestyles: number[] = [];

  for (const suburb of suburbs) {
    const income = getMetricValue(suburb.realTimeData?.medianIncome);
    if (income != null) incomes.push(income);
    
    const price = getMetricValue(suburb.realTimeData?.medianHousePrice) || ((suburb as any).median_house_price);
    if (price != null) prices.push(price);
    
    const commute = getMetricValue(suburb.realTimeData?.commute?.drivingTimeMinutes);
    if (commute != null) commutes.push(commute);
    
    const schoolCount = getMetricValue(suburb.realTimeData?.schools?.count);
    if (schoolCount != null) schools.push(schoolCount);

    // Lifestyle calculation for benchmarks
    const population = getMetricValue(suburb.realTimeData?.population);
    const parkCount = getMetricValue(suburb.realTimeData?.parks);
    const parkPer10k = (parkCount != null && population != null && population > 0)
      ? (parkCount / population) * 10000
      : 0;
    
    const cafes = getMetricValue((suburb.realTimeData as any)?.cafes) || 0;
    const restaurants = getMetricValue((suburb.realTimeData as any)?.restaurants) || 0;
    const recreation = getMetricValue((suburb.realTimeData as any)?.recreation) || 0;
    const transitScore = getMetricValue((suburb.realTimeData as any)?.transitScore) || 
                         getMetricValue((suburb.realTimeData as any)?.publicTransportStops) || 0;

    const rawLifestyle = (parkPer10k * 0.4) + ((cafes + restaurants) * 0.3) + (recreation * 0.2) + (transitScore * 0.1);
    lifestyles.push(rawLifestyle);
  }

  return {
    priceMin: prices.length ? Math.min(...prices) : 400000,
    priceMax: prices.length ? Math.max(...prices) : 2500000,
    incomeMin: incomes.length ? Math.min(...incomes) : 800,
    incomeMax: incomes.length ? Math.max(...incomes) : 3000,
    commuteMin: commutes.length ? Math.min(...commutes) : 0,
    commuteMax: commutes.length ? Math.max(...commutes) : 90,
    schoolMin: schools.length ? Math.min(...schools) : 0,
    schoolMax: schools.length ? Math.max(...schools) : 10,
    lifestyleMin: lifestyles.length ? Math.min(...lifestyles) : 0,
    lifestyleMax: lifestyles.length ? Math.max(...lifestyles) : 100,
  };
}
