// utils/benchmarkUtils.ts
import { SuburbData } from './suburbScoring';
import { getMetricValue } from './metricUtils';

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
 * Generate min/max benchmarks for scoring from a list of suburbs.
 * Ignores suburbs with missing values for each metric.
 */
export function generateBenchmarks(suburbs: SuburbData[]): SuburbScoreBenchmarks {
  const incomes: number[] = [];
  const employments: number[] = [];
  const commutes: number[] = [];
  const schools: number[] = [];

  for (const suburb of suburbs) {
    const income = getMetricValue(suburb.realTimeData?.medianIncome);
    if (income != null) incomes.push(income);
    const employment = getMetricValue(suburb.realTimeData?.employmentRate);
    if (employment != null) employments.push(employment);
    const commute = getMetricValue(suburb.realTimeData?.commute?.drivingTimeMinutes);
    if (commute != null) commutes.push(commute);
    const schoolCount = getMetricValue(suburb.realTimeData?.schools?.count);
    if (schoolCount != null) schools.push(schoolCount);
  }

  return {
    incomeMin: incomes.length ? Math.min(...incomes) : 0,
    incomeMax: incomes.length ? Math.max(...incomes) : 0,
    employmentMin: employments.length ? Math.min(...employments) : 0,
    employmentMax: employments.length ? Math.max(...employments) : 0,
    commuteMin: commutes.length ? Math.min(...commutes) : 0,
    commuteMax: commutes.length ? Math.max(...commutes) : 0,
    schoolMin: schools.length ? Math.min(...schools) : 0,
    schoolMax: schools.length ? Math.max(...schools) : 0,
  };
}
