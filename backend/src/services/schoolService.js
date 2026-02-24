/**
 * School Service
 * Handles NSW school data operations
 * Provides school counting and information
 */


const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../suburbs.db');
let db = null;

/**
 * Initialize school data
 */
async function initializeSchoolData() {
  try {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('[SCHOOLS] Failed to connect to suburbs.db:', err.message);
      } else {
        console.log('[SCHOOLS] Connected to suburbs.db');
      }
    });
  } catch (err) {
    console.error('[SCHOOLS] Failed to initialize school db:', err.message);
    db = null;
  }
}

/**
 * Count schools in a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} School count metric
 */
function countSchoolsInSuburb(suburbName, state) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve({ value: 0, source: 'NSW School Locations (Data not available)', datasetYear: 2025, type: 'derived_metric' });
    const query = `SELECT School_Count FROM suburbs WHERE Suburb_Name = ? AND State = ?`;
    db.get(query, [suburbName, state], (err, row) => {
      if (err || !row) {
        return resolve({ value: 0, source: 'NSW School Locations (Data not available)', datasetYear: 2025, type: 'derived_metric' });
      }
      resolve({
        value: row.School_Count,
        source: 'NSW School Locations (ABS Suburb Registers)',
        datasetYear: 2025,
        type: 'official_dataset'
      });
    });
  });
}

/**
 * Get schools in a suburb with details
 * @param {string} suburbName
 * @returns {array} Array of school objects
 */
function getSchoolsInSuburb(suburbName) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve([]);
    const query = `SELECT School_Details FROM suburbs WHERE Suburb_Name = ?`;
    db.get(query, [suburbName], (err, row) => {
      if (err || !row || !row.School_Details) {
        return resolve([]);
      }
      try {
        const details = JSON.parse(row.School_Details);
        resolve(Array.isArray(details) ? details : []);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

module.exports = {
  initializeSchoolData,
  countSchoolsInSuburb,
  getSchoolsInSuburb
};
