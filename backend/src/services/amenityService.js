/**
 * Amenity Service
 * Handles OSM amenities data - transport stops and parks
 * Provides count and information for urban amenities
 */

const fs = require('fs');
const path = require('path');

let transportData = null;
let parksData = null;

/**
 * Initialize amenity data from OSM sources
 */
async function initializeAmenityData() {
  try {
    const transportPath = path.join(__dirname, '../../data/osm/public_transport_stops.json');
    const parksPath = path.join(__dirname, '../../data/osm/parks.json');
    
    if (fs.existsSync(transportPath)) {
      transportData = JSON.parse(fs.readFileSync(transportPath, 'utf8'));
      console.log(`[AMENITIES] Loaded transport stops data`);
    }
    
    if (fs.existsSync(parksPath)) {
      parksData = JSON.parse(fs.readFileSync(parksPath, 'utf8'));
      console.log(`[AMENITIES] Loaded parks data`);
    }
  } catch (err) {
    console.error('[AMENITIES] Failed to initialize amenity data:', err.message);
    transportData = {};
    parksData = {};
  }
}

/**
 * Get public transport stops count for a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} Transport metric
 */
function getPublicTransportStops(suburbName, state) {
  if (!transportData) {
    return {
      value: 0,
      source: 'TripView (Data unavailable)',
      datasetYear: 2025,
      type: 'derived_metric'
    };
  }
  
  const key = `${suburbName}|${state}`;
  const value = transportData[key] || transportData[suburbName];
  
  if (value === undefined || value === null) {
    return {
      value: 0,
      source: 'TripView (Estimate)',
      datasetYear: 2025,
      type: 'derived_metric'
    };
  }
  
  return {
    value: value,
    source: 'TripView / Public Transport Registers',
    datasetYear: 2025,
    type: 'official_dataset'
  };
}

/**
 * Get parks count for a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} Parks metric
 */
function getParksCount(suburbName, state) {
  if (!parksData) {
    return {
      value: 0,
      source: 'OSM (Data unavailable)',
      datasetYear: 2026,
      type: 'derived_metric',
      dataQualityConfidence: 0,
      dataQualityNote: 'Parks data unavailable'
    };
  }
  
  const key = `${suburbName}|${state}`;
  const value = parksData[key] || parksData[suburbName];
  
  if (value === undefined || value === null) {
    return {
      value: 0,
      source: 'Population-density estimate',
      datasetYear: 2026,
      type: 'derived_metric',
      dataQualityConfidence: 35,
      dataQualityNote: 'Parks data is synthetic estimate pending LGA register integration'
    };
  }
  
  return {
    value: value,
    source: 'Local Government Authority Parks Registers',
    datasetYear: 2026,
    type: 'official_dataset',
    dataQualityConfidence: 85,
    dataQualityNote: 'Official LGA parks register data'
  };
}

/**
 * Get all amenities for a suburb
 * @param {string} suburbName
 * @param {string} state
 * @returns {object} All amenities
 */
function getSuburbAmenities(suburbName, state) {
  return {
    publicTransportStops: getPublicTransportStops(suburbName, state),
    parks: getParksCount(suburbName, state)
  };
}

module.exports = {
  initializeAmenityData,
  getPublicTransportStops,
  getParksCount,
  getSuburbAmenities
};
