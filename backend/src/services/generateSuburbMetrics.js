const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

const censusData = require('./censusData');
const schoolsData = require('./schoolsData');
const commuteData = require('./commuteData');

let boundariesCache = null;

function loadBoundaries() {
  if (boundariesCache) return boundariesCache;
  const filePath = path.resolve(__dirname, '../../data/abs/suburb_boundaries.geojson');
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    boundariesCache = JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load suburb boundaries from', filePath, err.message || err);
    boundariesCache = { features: [] };
  }
  return boundariesCache;
}

function loadCoordinates() {
  const candidates = [
    path.resolve(__dirname, '../../data/abs/coordinates.json'),
    path.resolve(__dirname, '../../coordinates.json'),
    path.resolve(__dirname, '../../data/coordinates.json'),
  ];

  for (const coordsPath of candidates) {
    try {
      if (!fs.existsSync(coordsPath)) continue;
      const raw = fs.readFileSync(coordsPath, 'utf8');
      const parsed = JSON.parse(raw);
      // Normalize to object map
      if (Array.isArray(parsed)) {
        // convert array of {suburb, lat, lon} to map
        const map = {};
        for (const e of parsed) {
          const key = (e.key || e.suburb || e.suburb_name || '').toString().toUpperCase();
          if (!key) continue;
          map[key] = { lat: parseFloat(e.lat ?? e.latitude), lon: parseFloat(e.lon ?? e.longitude ?? e.lng ?? e.x) };
        }
        return map;
      }
      return parsed;
    } catch (err) {
      console.warn('Coordinates file not readable at', coordsPath, err.message || err);
      continue;
    }
  }
  return {};
}

async function generateSuburbMetrics(suburbName) {
  if (!suburbName) throw new Error('suburbName required');

  const boundaries = loadBoundaries();

  let feature = (boundaries.features || []).find((f) => {
    if (!f || !f.properties) return false;
    const props = f.properties;
    const names = [props.suburb, props.suburb_name, props.name, props.locality, props.SA2_NAME];
    return names.some((n) => !!n && n.toString().toLowerCase() === suburbName.toString().toLowerCase());
  });

  let polygon = null;
  let centroidCoords = null;

  if (feature) {
    polygon = feature.geometry || feature;
    try {
      const cent = turf.centroid(feature);
      centroidCoords = cent.geometry.coordinates;
    } catch (err) {
      console.warn('Failed to compute centroid, falling back to bbox center', err.message || err);
      const bbox = turf.bbox(feature);
      centroidCoords = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
    }
  } else {
    // Fallback: try coordinates.json to get centroid only
    const coords = loadCoordinates();
    const coordsMap = loadCoordinates();
    const up = suburbName.toString().toUpperCase();
    // try exact with NSW suffix, then exact, then match by splitting keys
    let entry = coordsMap[`${up}|NSW`] || coordsMap[up];
    if (!entry) {
      // search keys like 'SUBURB|STATE'
      const foundKey = Object.keys(coordsMap).find((k) => k.split('|')[0] === up);
      if (foundKey) entry = coordsMap[foundKey];
    }

    if (!entry) {
      throw new Error('Suburb not found in boundaries or coordinates');
    }

    const lon = parseFloat(entry.lon ?? entry.longitude ?? entry.x ?? entry.lng ?? entry.LON ?? entry.Longitude);
    const lat = parseFloat(entry.lat ?? entry.latitude ?? entry.y ?? entry.Lat ?? entry.Latitude ?? entry.LAT);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      throw new Error('Invalid coordinates for suburb in coordinates.json');
    }

    centroidCoords = [lon, lat];
    // create a small buffer (0.5 km) around the centroid to act as a polygon for point-in-polygon checks
    try {
      const pt = turf.point(centroidCoords);
      const buffered = turf.buffer(pt, 2.0, { units: 'kilometers' });
      polygon = buffered;
      console.log('Generated buffer polygon around centroid', centroidCoords.slice(0,2));
    } catch (err) {
      console.warn('Failed to create buffer polygon from centroid, continuing without polygon', err.message || err);
      polygon = null;
    }
  }

  const census = censusData.getCensusData(suburbName) || {};

  const population = census.population ?? null;
  const medianAge = census.median_age ?? census.medianAge ?? null;
  const medianIncome = census.median_income ?? census.medianIncome ?? null;

  let schoolCount = 0;
  try {
    if (typeof schoolsData.getSchoolCount === 'function') {
      schoolCount = schoolsData.getSchoolCount(suburbName, polygon);
    } else {
      schoolCount = schoolsData.countSchools(polygon);
    }
  } catch (err) {
    console.error('Error counting schools for', suburbName, err.message || err);
    schoolCount = 0;
  }

  let commuteMinutes = null;
  try {
    commuteMinutes = await commuteData.getCommuteTime(
      { lon: centroidCoords[0], lat: centroidCoords[1] },
      { lon: 151.2093, lat: -33.8688 }
    );
  } catch (err) {
    console.error('Commute lookup failed', err.message || err);
    commuteMinutes = null;
  }

  return {
    suburb: suburbName,
    metrics: {
      population: { value: population, source: 'ABS Census 2021', type: 'official_dataset' },
      medianAge: { value: medianAge, source: 'ABS Census 2021', type: 'official_dataset' },
      medianIncome: { value: medianIncome, source: 'ABS Census 2021', type: 'official_dataset' },
      schoolCount: { value: schoolCount, source: 'NSW Schools Open Data', type: 'official_dataset' },
      commuteMinutes: { value: commuteMinutes, source: 'OpenRouteService', type: 'derived_metric' },
    },
    precision: (feature && feature.properties && feature.properties.precision) ? feature.properties.precision : (feature ? 'polygon' : 'centroid'),
  };
}

module.exports = {
  generateSuburbMetrics,
};
