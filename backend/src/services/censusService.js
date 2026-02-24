/**
 * Census Service
 * Handles ABS Census data operations
 * Loads and provides access to demographic metrics
 */


const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../suburbs.db');
let db = null;

/**
 * Initialize census data - load from JSON files
 */
async function initializeCensusData() {
  try {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('[CENSUS] Failed to connect to suburbs.db:', err.message);
      } else {
        console.log('[CENSUS] Connected to suburbs.db');
      }
    });
  } catch (err) {
    console.error('[CENSUS] Failed to initialize census db:', err.message);
    db = null;
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
  return new Promise((resolve, reject) => {
    if (!db) return resolve(null);
    const query = `SELECT population, median_age, household_size, employment_rate, median_income FROM suburbs WHERE Suburb_Name = ? AND State = ?`;
    db.get(query, [suburbName, state], (err, row) => {
      if (err) {
        return resolve(null);
      }
      if (!row || row[metricKey] == null) {
        return resolve(null);
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
      resolve({
        value: row[metricKey],
        ...metricConfigs[metricKey]
      });
    });
  });
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
  return new Promise((resolve, reject) => {
    if (!db) return resolve(null);
    const query = `SELECT population, median_age, household_size, employment_rate, median_income FROM suburbs WHERE Suburb_Name = ? AND State = ?`;
    db.get(query, [suburbName, state], (err, row) => {
      if (err || !row) {
        return resolve(null);
      }
      resolve({
        population: row.population,
        medianAge: row.median_age,
        householdSize: row.household_size,
        employmentRate: row.employment_rate,
        medianIncome: row.median_income
      });
    });
  });
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
