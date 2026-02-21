/**
 * School Service
 * Handles NSW school data operations
 * Provides school counting and information
 */

const fs = require('fs');
const path = require('path');

let schoolData = null;

/**
 * Initialize school data
 */
async function initializeSchoolData() {
  try {
    const schoolPath = path.join(__dirname, '../../data/nsw/schools.json');
    
    if (fs.existsSync(schoolPath)) {
      schoolData = JSON.parse(fs.readFileSync(schoolPath, 'utf8'));
      console.log(`[SCHOOLS] Loaded school data`);
    }
  } catch (err) {
    console.error('[SCHOOLS] Failed to initialize school data:', err.message);
    schoolData = {};
  }
}

/**
 * Count schools in a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} School count metric
 */
function countSchoolsInSuburb(suburbName, state) {
  if (!schoolData || !schoolData[suburbName]) {
    return {
      value: 0,
      source: 'NSW School Locations (Data not available)',
      datasetYear: 2025,
      type: 'derived_metric'
    };
  }
  
  const schools = schoolData[suburbName] || [];
  const count = Array.isArray(schools) ? schools.length : 0;
  
  return {
    value: count,
    source: 'NSW School Locations (ABS Suburb Registers)',
    datasetYear: 2025,
    type: 'official_dataset'
  };
}

/**
 * Get schools in a suburb with details
 * @param {string} suburbName
 * @returns {array} Array of school objects
 */
function getSchoolsInSuburb(suburbName) {
  if (!schoolData || !schoolData[suburbName]) {
    return [];
  }
  
  const schools = schoolData[suburbName];
  return Array.isArray(schools) ? schools : [];
}

module.exports = {
  initializeSchoolData,
  countSchoolsInSuburb,
  getSchoolsInSuburb
};
