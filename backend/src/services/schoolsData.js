const fs = require('fs');
const path = require('path');
const turf = require('@turf/turf');

let schoolsCache = null;

function loadSchools() {
  if (schoolsCache) return schoolsCache;
  const candidates = [
    path.resolve(__dirname, '../../data/nsw/schools.json'),
    path.resolve(__dirname, '../../schools.json'),
    path.resolve(__dirname, '../../data/schools.json'),
    path.resolve(__dirname, '../../data/osm/schools.json'),
  ];

  for (const p of candidates) {
    try {
      if (!fs.existsSync(p)) continue;
      const raw = fs.readFileSync(p, 'utf8');
      const parsed = JSON.parse(raw);
      // Normalize to an array of { lon, lat } objects with optional properties
      if (parsed && parsed.features && Array.isArray(parsed.features)) {
        // GeoJSON FeatureCollection
        schoolsCache = parsed.features.map((f) => {
          const coords = (f.geometry && f.geometry.coordinates) || [];
          return Object.assign({}, f.properties || {}, { lon: coords[0], lat: coords[1] });
        });
      } else if (Array.isArray(parsed)) {
        schoolsCache = parsed.map((v) => {
          // normalize possible shapes
          if (v && v.geometry && Array.isArray(v.geometry.coordinates)) {
            return Object.assign({}, v.properties || {}, { lon: v.geometry.coordinates[0], lat: v.geometry.coordinates[1] });
          }
          return Object.assign({}, v, { lon: v.lon ?? v.longitude ?? v.lng ?? v.x, lat: v.lat ?? v.latitude ?? v.y });
        });
      } else if (parsed && typeof parsed === 'object') {
        // If object map, keep as map when values are numeric counts, otherwise convert entries
        const valsAreNumbers = Object.values(parsed).every((v) => typeof v === 'number');
        if (valsAreNumbers) {
          schoolsCache = parsed; // map: suburbKey -> count
        } else {
          schoolsCache = Object.keys(parsed).map((k) => {
            const v = parsed[k];
            return Object.assign({}, v, { lon: v.lon ?? v.longitude ?? v.lng ?? v.x, lat: v.lat ?? v.latitude ?? v.y });
          });
        }
      } else {
        schoolsCache = [];
      }

      const count = Array.isArray(schoolsCache) ? schoolsCache.length : (schoolsCache && typeof schoolsCache === 'object' ? Object.keys(schoolsCache).length : 0);
      console.log('Loaded schools data from', p, 'entries:', count);
      return schoolsCache;
    } catch (err) {
      console.warn('Failed to load/parse schools data from', p, err.message || err);
      continue;
    }
  }

  schoolsCache = [];
  return schoolsCache;
}

/**
 * Count schools whose point falls within the given GeoJSON polygon.
 * suburbPolygon should be a GeoJSON Polygon or MultiPolygon object.
 */
function countSchools(suburbPolygon) {
  if (!suburbPolygon) return 0;
  const schools = loadSchools();
  try {
    // If we loaded a numeric map of counts, return lookup
    if (schools && !Array.isArray(schools) && Object.keys(schools).length > 0 && typeof Object.values(schools)[0] === 'number') {
      const up = (suburbPolygon && suburbPolygon.properties && (suburbPolygon.properties.suburb || suburbPolygon.properties.name)) ? (suburbPolygon.properties.suburb || suburbPolygon.properties.name).toString().toUpperCase() : null;
      // fallback: caller should prefer passing suburb name, but when only polygon given, try to match by key using centroid lookup outside this function
      // In our usage we pass polygon only; caller can provide suburb name instead for direct map lookup. For now return 0 when map-based and no direct key.
      return 0;
    }

    return schools.filter((s) => {
      let lon;
      let lat;
      if (s && s.geometry && Array.isArray(s.geometry.coordinates)) {
        lon = parseFloat(s.geometry.coordinates[0]);
        lat = parseFloat(s.geometry.coordinates[1]);
      } else {
        lon = parseFloat(s.lon ?? s.longitude ?? s.LON ?? s.Longitude ?? s.x ?? s.lng);
        lat = parseFloat(s.lat ?? s.latitude ?? s.Lat ?? s.Latitude ?? s.y);
      }
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return false;
      const pt = turf.point([lon, lat]);
      return turf.booleanPointInPolygon(pt, suburbPolygon);
    }).length;
  } catch (err) {
    console.error('Error counting schools in polygon', err.message || err);
    return 0;
  }
}

/**
 * Get school count for a suburb by name or polygon.
 * If the loaded data is a numeric map (suburbKey -> count) this will return the map value by suburbName.
 * Otherwise, if array data is available, and a polygon is provided, it will perform a spatial count.
 */
function getSchoolCount(suburbName, suburbPolygon) {
  const schools = loadSchools();
  if (!schools) return 0;

  // If schools is a numeric map, try direct lookup
  if (!Array.isArray(schools) && Object.keys(schools).length > 0 && typeof Object.values(schools)[0] === 'number') {
    if (!suburbName) return 0;
    const up = suburbName.toString().toUpperCase();
    return schools[`${up}|NSW`] ?? schools[up] ?? 0;
  }

  // Otherwise fall back to polygon-based counting
  if (suburbPolygon) return countSchools(suburbPolygon);
  // As a last resort, try matching by suburbName property on entries (non-spatial)
  if (suburbName && Array.isArray(schools)) {
    const up = suburbName.toString().toUpperCase();
    const matched = schools.filter((s) => {
      const name = (s.suburb || s.suburb_name || s.name || s.locality || '').toString().toUpperCase();
      return name === up;
    });
    return matched.length;
  }

  return 0;
}

module.exports = {
  loadSchools,
  countSchools,
  getSchoolCount,
};
