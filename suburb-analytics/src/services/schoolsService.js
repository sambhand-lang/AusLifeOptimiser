import fs from 'fs';
import * as turf from '@turf/turf';

const schools = JSON.parse(fs.readFileSync('./data/nsw/schools.json'));

export function countSchools(suburbPolygon) {
  if (!suburbPolygon) return { value: null, type: "polygon_required" };

  const normalizedSchools = schools.map(s => ({
    lon: s.lon || s.longitude || s.x,
    lat: s.lat || s.latitude || s.y
  }));

  const count = normalizedSchools.filter(school =>
    turf.booleanPointInPolygon([school.lon, school.lat], suburbPolygon)
  ).length;

  return { value: count, source: "NSW Schools Open Data", datasetYear: 2025, type: "official_dataset" };
}
