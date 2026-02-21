export function validateMetricStructure(metric) {
  if (!metric) return false;
  if (metric.value === undefined) return false;
  if (!metric.type) return false;
  if (!metric.source) return false;
  return true;
}

export function validateMetricsObject(metrics) {
  for (const key in metrics) {
    if (!validateMetricStructure(metrics[key])) {
      console.warn(`Invalid metric structure: ${key}`);
    }
  }
}
function normalizeSuburbName(s) {
  if (!s) return '';
  return s.toString().trim().toUpperCase();
}
export { normalizeSuburbName };
