/**
 * Census Service
 * Handles ABS Census data operations
 * Loads and provides access to demographic metrics
 */

const fs = require('fs');
const path = require('path');

let censusData = null;
let commuteData = null;

/**
 * Initialize census data - load from JSON files
 */
async function initializeCensusData() {
  try {
    const censusPath = path.join(__dirname, '../../data/abs/abs_census_by_suburb_expanded.json');
    const commutePath = path.join(__dirname, '../../data/abs/commute_times.json');
    
    if (fs.existsSync(censusPath)) {
      censusData = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
      console.log(`[CENSUS] Loaded census data for ${Object.keys(censusData).length || censusData.length} records`);
    }
    
    if (fs.existsSync(commutePath)) {
      commuteData = JSON.parse(fs.readFileSync(commutePath, 'utf8'));
      console.log(`[CENSUS] Loaded commute times for ${Object.keys(commuteData).length} suburbs`);
    }
  } catch (err) {
    console.error('[CENSUS] Failed to initialize census data:', err.message);
    censusData = [];
    commuteData = {};
  }
}

/**
 * Get census metric for a specific suburb
 * @param {string} suburbName - Suburb name
 * @param {string} state - State code (NSW, VIC, etc)
 * @param {string} metricKey - Metric key (population, median_age, etc)
 * @returns {object|null} Metric object with value, source, year, type
 */
function getCensusMetric(suburbName, state, metricKey) {
  if (!censusData) return null;
  
  // Handle both array and object formats
  let suburb;
  
  if (Array.isArray(censusData)) {
    suburb = censusData.find(
      (s) =>
        s.suburb_name?.toUpperCase() === suburbName.toUpperCase() &&
        s.state === state
    );
  } else {
    const key = `${suburbName}|${state}`;
    suburb = censusData[key];
  }
  
  if (!suburb || suburb[metricKey] == null) {
    return null;
  }
  
  const metricConfigs = {
    population: {
      source: 'ABS Census (Population estimate)',
      year: 2021,
      type: 'official_dataset'
    },
    median_age: {
      source: 'ABS Census (Demographics)',
      year: 2021,
      type: 'official_dataset'
    },
    household_size: {
      source: 'ABS Census (Housing)',
      year: 2021,
      type: 'official_dataset'
    },
    employment_rate: {
      source: 'ABS Census (Employment)',
      year: 2021,
      type: 'official_dataset'
    },
    median_income: {
      source: 'ABS Census (Income)',
      year: 2021,
      type: 'official_dataset'
    }
  };
  
  const config = metricConfigs[metricKey] || {
    source: 'ABS Census',
    year: 2021,
    type: 'official_dataset'
  };
  
  return {
    value: suburb[metricKey],
    source: config.source,
    datasetYear: config.year,
    type: config.type
  };
}

/**
 * Get all census metrics for a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} All metrics
 */
function getSuburbCensusData(suburbName, state) {
  return {
    population: getCensusMetric(suburbName, state, 'population'),
    medianAge: getCensusMetric(suburbName, state, 'median_age'),
    householdSize: getCensusMetric(suburbName, state, 'household_size'),
    employmentRate: getCensusMetric(suburbName, state, 'employment_rate'),
    medianIncome: getCensusMetric(suburbName, state, 'median_income')
  };
}

/**
 * Get base commute time for a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object|null} Commute time object
 */
function getCommuteTime(suburbName, state) {
  if (!commuteData) return null;
  
  const key = `${suburbName}|${state}`;
  const minutes = commuteData[key];
  
  if (!minutes) return null;
  
  return {
    drivingTimeMinutes: {
      value: minutes,
      source: 'OpenStreetMap / Route calculation',
      datasetYear: 2024,
      type: 'official_dataset'
    }
  };
}

module.exports = {
  initializeCensusData,
  getCensusMetric,
  getSuburbCensusData,
  getCommuteTime
};
