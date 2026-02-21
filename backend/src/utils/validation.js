/**
 * Validation Utility
 * Provides common validation functions for input data
 */

/**
 * Validate SSC (Statistical Subdivisions Code)
 * @param {string|number} ssc
 * @returns {boolean}
 */
function isValidSSC(ssc) {
  if (ssc === null || ssc === undefined || ssc === '') return false;
  const sscStr = String(ssc).trim();
  // SSC is typically 5 digits
  return sscStr.match(/^\d{5}$/) !== null;
}

/**
 * Validate suburb name
 * @param {string} suburbName
 * @returns {boolean}
 */
function isValidSuburbName(suburbName) {
  if (typeof suburbName !== 'string') return false;
  return suburbName.trim().length > 0 && suburbName.length < 100;
}

/**
 * Validate state code
 * @param {string} state
 * @returns {boolean}
 */
function isValidState(state) {
  const validStates = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT', 'NT'];
  return validStates.includes(state?.toUpperCase());
}

/**
 * Validate postcode
 * @param {string|number} postcode
 * @returns {boolean}
 */
function isValidPostcode(postcode) {
  const postcodeStr = String(postcode);
  return postcodeStr.match(/^\d{4}$/);
}

/**
 * Validate coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean}
 */
function isValidCoordinates(lat, lon) {
  return (
    typeof lat === 'number' &&
    typeof lon === 'number' &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Validate pagination parameters
 * @param {number} page
 * @param {number} limit
 * @returns {boolean}
 */
function isValidPagination(page, limit) {
  return (
    Number.isInteger(page) &&
    Number.isInteger(limit) &&
    page >= 1 &&
    limit >= 1 &&
    limit <= 100
  );
}

/**
 * Normalize suburb name input
 * @param {string} input
 * @returns {string}
 */
function normalizeSuburbName(input) {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

/**
 * Sanitize search query
 * @param {string} query
 * @returns {string}
 */
function sanitizeSearchQuery(query) {
  return query
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .substring(0, 100);
}

/**
 * Validate suburb data object
 * @param {object} data
 * @returns {object} {valid: boolean, errors: array}
 */
function validateSuburbData(data) {
  const errors = [];
  
  if (!data.suburb_name || !isValidSuburbName(data.suburb_name)) {
    errors.push('Invalid suburb name');
  }
  
  if (!data.state || !isValidState(data.state)) {
    errors.push('Invalid state code');
  }
  
  if (data.postcode && !isValidPostcode(data.postcode)) {
    errors.push('Invalid postcode');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate metrics object
 * @param {object} metrics
 * @returns {object} {valid: boolean, errors: array}
 */
function validateMetrics(metrics) {
  const errors = [];
  const requiredMetrics = [
    'population',
    'medianAge',
    'householdSize',
    'employmentRate',
    'medianIncome'
  ];
  
  for (const metric of requiredMetrics) {
    if (!metrics[metric]) {
      errors.push(`Missing metric: ${metric}`);
    } else if (!metrics[metric].value) {
      errors.push(`Invalid value for metric: ${metric}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  isValidSSC,
  isValidSuburbName,
  isValidState,
  isValidPostcode,
  isValidCoordinates,
  isValidPagination,
  normalizeSuburbName,
  sanitizeSearchQuery,
  validateSuburbData,
  validateMetrics
};
