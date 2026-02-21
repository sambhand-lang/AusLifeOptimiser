const CORE_OFFICIAL_ONLY = [
  "population",
  "medianAge",
  "avgHouseholdSize",
  "employmentRate",
  "medianIncome"
];

export function enforceIntegrity(metrics) {
  for (const key of CORE_OFFICIAL_ONLY) {
    if (!metrics[key]) continue;
    if (metrics[key].type !== "official_dataset") {
      metrics[key] = {
        value: null,
        source: "Unavailable",
        datasetYear: null,
        type: "unavailable"
      };
    }
  }
  return metrics;
}
