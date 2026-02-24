/**
 * Geo Service
 * Handles geographic operations and coordinate data
 * Provides distance calculations and location utilities
 */


const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, '../suburbs.db');
let db = null;

/**
 * Initialize coordinate data
 */
async function initializeGeoData() {
  try {
    db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('[GEO] Failed to connect to suburbs.db:', err.message);
      } else {
        console.log('[GEO] Connected to suburbs.db');
      }
    });
  } catch (err) {
    console.error('[GEO] Failed to initialize geo db:', err.message);
    db = null;
  }
}

/**
 * Calculate Haversine distance between two coordinates (in km)
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get suburb centroid coordinates
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} Coordinate object {lat, lon}
 */
function getSuburbCentroid(suburbName, state) {
  return new Promise((resolve, reject) => {
    if (!db) return resolve({ lat: -33.8688, lon: 151.2093 });
    const query = `SELECT Latitude, Longitude FROM suburbs WHERE Suburb_Name = ? AND State = ?`;
    db.get(query, [suburbName, state], (err, row) => {
      if (err || !row) {
        return resolve({ lat: -33.8688, lon: 151.2093 });
      }
      resolve({ lat: row.Latitude, lon: row.Longitude });
    });
  });
}

/**
 * Calculate distance between two suburbs
 * @param {string} suburb1
 * @param {string} state1
 * @param {string} suburb2
 * @param {string} state2
 * @returns {number} Distance in kilometers
 */
function getDistanceBetweenSuburbs(suburb1, state1, suburb2, state2) {
  const coords1 = getSuburbCentroid(suburb1, state1);
  const coords2 = getSuburbCentroid(suburb2, state2);
  
  return haversineDistance(
    coords1.lat,
    coords1.lon,
    coords2.lat,
    coords2.lon
  );
}

/**
 * Estimate driving time based on distance (rough 2min per km)
 * @param {number} distanceKm
 * @returns {number} Estimated driving time in minutes
 */
function estimateDrivingTime(distanceKm) {
  return Math.round(distanceKm * 2);
}

/**
 * Get estimated commute time to a destination
 * @param {string} suburbName
 * @param {string} state
 * @param {object} destinationCoords - {lat, lon}
 * @returns {number} Estimated driving time in minutes
 */
function getEstimatedCommuteTime(suburbName, state, destinationCoords = null) {
  const centroid = getSuburbCentroid(suburbName, state);
  
  const destination = destinationCoords || {
    lat: -33.8688,
    lon: 151.2093
  }; // Sydney CBD default
  
  const distance = haversineDistance(
    centroid.lat,
    centroid.lon,
    destination.lat,
    destination.lon
  );
  
  return estimateDrivingTime(distance);
}

/**
 * Generate a complete metrics object for a suburb (convenience wrapper)
 * Uses existing services to assemble a unified metrics response
 * @param {string} suburbName
 * @param {string} state (optional) default 'NSW'
 */
async function generateSuburbMetrics(suburbName, state = 'NSW') {
  const name = (suburbName || '').toUpperCase();
  const st = (state || 'NSW').toUpperCase();

  // Census metrics
  const census = censusService.getSuburbCensusData(name, st) || {};

  // Commute (require dynamically to avoid circular dependency at module load)
  let commute;
  try {
    const commuteServiceLocal = require('./commuteService');
    commute = commuteServiceLocal.getSuburbCommuteTime(name, st);
  } catch (e) {
    commute = null;
  }
  if (!commute) {
    commute = {
      drivingTimeMinutes: { value: getEstimatedCommuteTime(name, st), source: 'Coordinate-based distance estimate', datasetYear: new Date().getFullYear(), type: 'derived_metric' }
    };
  }

  // Schools
  const schools = schoolService.countSchoolsInSuburb(name, st) || { value: 0, source: 'NSW School Locations (Data not available)', datasetYear: 2025, type: 'derived_metric' };

  // Amenities
  const amenities = amenityService.getSuburbAmenities(name, st) || { publicTransportStops: { value: 0 }, parks: { value: 0 } };

  return {
    suburb: name,
    state: st,
    precision: coordinateData ? 'coordinate-based' : 'unknown',
    metrics: {
      population: census.population || null,
      medianAge: census.medianAge || null,
      householdSize: census.householdSize || null,
      employmentRate: census.employmentRate || null,
      medianIncome: census.medianIncome || null,
      commute,
      schools,
      publicTransportStops: amenities.publicTransportStops || { value: 0 },
      parks: amenities.parks || { value: 0 }
    }
  };
}

module.exports = {
  initializeGeoData,
  haversineDistance,
  getSuburbCentroid,
  getDistanceBetweenSuburbs,
  estimateDrivingTime,
  getEstimatedCommuteTime
  ,
  generateSuburbMetrics
};
