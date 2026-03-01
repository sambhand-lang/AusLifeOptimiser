// utils/metricUtils.ts
// Defensive helper for extracting value from Metric type

export type Metric = {
  value?: number;
  source?: string;
  datasetYear?: number;
  type?: 'official_dataset' | 'derived_metric';
};

/**
 * Safely extract the value from a Metric object.
 * Returns null if metric or value is missing/invalid.
 */
export function getMetricValue(metric?: Metric | null): number | null {
  if (!metric || typeof metric !== 'object') return null;
  if (typeof metric.value !== 'number') return null;
  return metric.value;
}
