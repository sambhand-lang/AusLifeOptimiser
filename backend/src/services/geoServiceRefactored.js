import fs from 'fs';
import * as turf from '@turf/turf';
import { getCensusData } from './censusService.js';
import { countSchools } from './schoolsService.js';
import { getCommuteTime } from './commuteService.js';

let boundaries = null;
try {
  boundaries = JSON.parse(fs.readFileSync('./data/abs/suburb_boundaries.geojson', 'utf8'));
} catch (e) {
  try {
    const fallback = new URL('../../data/abs/suburb_boundaries.geojson', import.meta.url);
    boundaries = JSON.parse(fs.readFileSync(fallback, 'utf8'));
  } catch (e2) {
    boundaries = null;
  }
}

export async function generateSuburbMetrics(suburbName, state = 'NSW') {
  let polygon = null;
  let centroid = null;

  // Try to find polygon from boundaries
  if (boundaries && Array.isArray(boundaries.features)) {
    const feature = boundaries.features.find(f => {
      const p = f && f.properties;
      if (!p) return false;
      const name = (p.suburb || p.Suburb || p.SA2_NAME || p.name || '').toString();
      return name.toLowerCase() === suburbName.toLowerCase();
    });

    if (feature) {
      polygon = feature.geometry || feature;
      try {
        const c = turf.centroid(feature);
        if (c && c.geometry && Array.isArray(c.geometry.coordinates)) {
          centroid = c.geometry.coordinates;
        }
      } catch (err) {
        centroid = null;
      }
    }
  }

  // Fallback to census centroid or hardcoded Sydney CBD
  const census = getCensusData(suburbName);
  if (!centroid && census && census.centroid && typeof census.centroid.lon === 'number') {
    const { lon, lat } = census.centroid;
    centroid = [lon, lat];
  }

  if (!centroid) {
    centroid = [151.2093, -33.8688];
    console.warn(`Using default Sydney CBD centroid for ${suburbName}`);
  }

  const commute = await getCommuteTime({ lon: centroid[0], lat: centroid[1] }, { lon: 151.2093, lat: -33.8688 });

  const metrics = {
    population: census ? { value: census.population, source: 'ABS Census 2021', datasetYear: 2021, type: 'official_dataset' } : null,
    medianAge: census ? { value: census.medianAge, source: 'ABS Census 2021', datasetYear: 2021, type: 'official_dataset' } : null,
    avgHouseholdSize: census ? { value: census.householdSize, source: 'ABS Census 2021', datasetYear: 2021, type: 'official_dataset' } : null,
    employmentRate: census ? { value: census.employmentRate, source: 'ABS Census 2021', datasetYear: 2021, type: 'official_dataset' } : null,
    medianIncome: census ? { value: census.medianIncome, source: 'ABS Census 2021', datasetYear: 2021, type: 'official_dataset' } : null,
    commuteMinutes: commute,
    schoolCount: polygon ? countSchools(polygon) : { value: 0, source: 'polygon_unavailable', type: 'unavailable' }
  };

  return {
    suburb: suburbName,
    state,
    metrics
  };
}
