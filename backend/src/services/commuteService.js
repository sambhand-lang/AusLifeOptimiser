/**
 * Commute Service
 * Handles commute time calculations
 * Combines census data with geographic calculations
 */

const censusService = require('./censusService');
const geoService = require('./geoService');

/**
 * Get complete commute time data for a suburb
 * Uses precomputed times if available, falls back to estimation
 * @param {string} suburbName
 * @param {string} state
 * @param {object} destination - Optional {lat, lon} coordinates
 * @returns {object} Commute data object
 */
function getSuburbCommuteTime(suburbName, state, destination = null) {
  // Try to get precomputed commute time first
  const precomputed = censusService.getCommuteTime(suburbName, state);
  
  if (precomputed) {
    return precomputed;
  }
  
  // Fall back to estimated time based on distance
  const estimatedMinutes = geoService.getEstimatedCommuteTime(
    suburbName,
    state,
    destination
  );
  
  return {
    drivingTimeMinutes: {
      value: estimatedMinutes,
      source: 'Coordinate-based distance estimate',
      datasetYear: 2026,
      type: 'derived_metric'
    }
  };
}

/**
 * Get distance-based commute estimate
 * @param {string} suburbName
 * @param {string} state
 * @param {number} averageSpeedKmh - Average speed in km/h (default: 60)
 * @returns {number} Estimated time in minutes
 */
function estimateCommuteFromDistance(suburbName, state, averageSpeedKmh = 60) {
  // Default Sydney CBD
  const destination = {
    lat: -33.8688,
    lon: 151.2093
  };
  
  const centroid = geoService.getSuburbCentroid(suburbName, state);
  const distance = geoService.haversineDistance(
    centroid.lat,
    centroid.lon,
    destination.lat,
    destination.lon
  );
  
  // Simple calculation: distance / speed * 60 = minutes
  return Math.round((distance / averageSpeedKmh) * 60);
}

/**
 * Get commute time to custom destination
 * @param {string} suburbName
 * @param {string} state
 * @param {object} destination - {lat, lon}
 * @returns {number} Commute time in minutes
 */
function getCommuteToDestination(suburbName, state, destination) {
  return geoService.getEstimatedCommuteTime(suburbName, state, destination);
}

module.exports = {
  getSuburbCommuteTime,
  estimateCommuteFromDistance,
  getCommuteToDestination
};
