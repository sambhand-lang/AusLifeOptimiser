import fs from 'fs';
import * as turf from '@turf/turf';

let schoolsCache = null;

function loadSchools() {
  if (schoolsCache) return schoolsCache;
  try {
    const raw = fs.readFileSync('./data/nsw/schools.json', 'utf8');
    schoolsCache = JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load schools data:', err.message);
    schoolsCache = [];
  }
  return schoolsCache;
}

export function countSchools(suburbPolygon) {
  if (!suburbPolygon) return { value: null, type: 'polygon_required' };

  const schools = loadSchools();
  if (!Array.isArray(schools)) return { value: 0, source: 'schools_not_array', type: 'unavailable' };

  const normalizedSchools = schools.map(s => ({
    lon: s.lon || s.longitude || s.x,
    lat: s.lat || s.latitude || s.y
  }));

  const count = normalizedSchools.filter(school =>
    turf.booleanPointInPolygon([school.lon, school.lat], suburbPolygon)
  ).length;

  return { value: count, source: 'NSW Schools Open Data', datasetYear: 2025, type: 'official_dataset' };
}
