import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { query } from './db';

// External official/open sources
const OPENROUTESERVICE_BASE_URL = 'https://api.openrouteservice.org/v2';
const MYSCHOOL_BASE_URL = 'https://www.myschool.edu.au/api/v3';
const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
// (Numbeo integration removed per user request)

// Simple cache maps
const routeCache = new Map<string, { value: any; expiresAt: number }>();
const schoolCache = new Map<string, { value: any; expiresAt: number }>();

const cacheGet = (cache: Map<string, { value: any; expiresAt: number }>, key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
};

const cacheSet = (cache: Map<string, { value: any; expiresAt: number }>, key: string, value: any, ttlMs = 24 * 60 * 60 * 1000) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

interface Metric {
  value: number;
  source: string;
  datasetYear: number;
  type: 'official_dataset' | 'derived_metric';
}

export interface SuburbRealData {
  population?: Metric | null;
  medianAge?: Metric | null;
  householdSize?: Metric | null;
  employmentRate?: Metric | null;
  medianIncome?: Metric | null;
  commute?: { drivingTimeMinutes?: Metric | null } | null;
  schools?: { count?: Metric | null } | null;
  publicTransportStops?: Metric | null;
  parks?: Metric | null;
}

// Preload ABS census JSON file (must be provided separately)
let absIndex: Record<string, any> | null = null;
let suburbCoordinates: Record<string, { lat: number; lon: number }> | null = null;
let suburbSchools: Record<string, number> | null = null;
let suburbCommutes: Record<string, number> | null = null;
let suburbPublicTransport: Record<string, number> | null = null;
let suburbParks: Record<string, number> | null = null;

try {
  const absPath = path.resolve(__dirname, '..', 'data', 'abs_census_by_suburb_expanded.json');
  if (fs.existsSync(absPath)) {
    const raw = fs.readFileSync(absPath, 'utf8');
    absIndex = JSON.parse(raw);
    console.info('ABS census preload loaded, entries:', Object.keys(absIndex as object).length);
  } else {
    console.warn('ABS census preload file not found at', absPath);
    // Fall back to original file if expanded not found
    const fallbackPath = path.resolve(__dirname, '..', 'data', 'abs_census_by_suburb.json');
    if (fs.existsSync(fallbackPath)) {
      const raw = fs.readFileSync(fallbackPath, 'utf8');
      absIndex = JSON.parse(raw);
      console.info('Fallback ABS census preload loaded, entries:', Object.keys(absIndex as object).length);
    }
  }
} catch (e) {
  console.error('Failed to load ABS preload', e);
}

// Load coordinates
try {
  const coordPath = path.resolve(__dirname, '..', 'coordinates.json');
  if (fs.existsSync(coordPath)) {
    const raw = fs.readFileSync(coordPath, 'utf8');
    suburbCoordinates = JSON.parse(raw);
    console.info('Suburb coordinates loaded, entries:', Object.keys(suburbCoordinates as object).length);
  }
} catch (e) {
  console.error('Failed to load coordinates', e);
}

// Load school counts
try {
  const schoolPath = path.resolve(__dirname, '..', 'schools.json');
  if (fs.existsSync(schoolPath)) {
    const raw = fs.readFileSync(schoolPath, 'utf8');
    suburbSchools = JSON.parse(raw);
    console.info('Suburb schools loaded, entries:', Object.keys(suburbSchools as object).length);
  }
} catch (e) {
  console.error('Failed to load schools', e);
}

// Load commute times
try {
  const commutePath = path.resolve(__dirname, '..', 'commute_times.json');
  if (fs.existsSync(commutePath)) {
    const raw = fs.readFileSync(commutePath, 'utf8');
    suburbCommutes = JSON.parse(raw);
    console.info('Suburb commute times loaded, entries:', Object.keys(suburbCommutes as object).length);
  }
} catch (e) {
  console.error('Failed to load commute times', e);
}

// Load public transport stops
try {
  const transportPath = path.resolve(__dirname, '..', 'public_transport_stops.json');
  if (fs.existsSync(transportPath)) {
    const raw = fs.readFileSync(transportPath, 'utf8');
    suburbPublicTransport = JSON.parse(raw);
    console.info('Suburb public transport stops loaded, entries:', Object.keys(suburbPublicTransport as object).length);
  }
} catch (e) {
  console.debug('Public transport data not loaded (will use estimates)', e);
}

// Load parks data
try {
  const parksPath = path.resolve(__dirname, '..', 'parks.json');
  if (fs.existsSync(parksPath)) {
    const raw = fs.readFileSync(parksPath, 'utf8');
    suburbParks = JSON.parse(raw);
    console.info('Suburb parks data loaded, entries:', Object.keys(suburbParks as object).length);
  }
} catch (e) {
  console.debug('Parks data not loaded (will use estimates)', e);
}

// Hardcoded school counts for major suburbs (fallback when API unavailable)
const SUBURB_SCHOOL_COUNTS: Record<string, number> = {
  'PARRAMATTA': 42, 'BONDI': 18, 'SYDNEY': 25, 'MANLY': 32, 'CRONULLA': 16, 'NEWTOWN': 14, 'SURRY HILLS': 12, 'PADDINGTON': 10, 'CHATSWOOD': 21,
  'DOUBLE BAY': 14, 'NEUTRAL BAY': 11, 'CROWS NEST': 9, 'NORTH SYDNEY': 19, 'MOSMAN': 16, 'WILLOUGHBY': 19, 'LANE COVE': 15, 'HORNSBY': 26,
  'EPPING': 17, 'RYDE': 20, 'MIRANDA': 18, 'WOLLONGONG': 42, 'WOOLLAHRA': 8, 'GLEBE': 9, 'REDFERN': 11, 'ALEXANDRIA': 12,
  'BRONTE': 6, 'COOGEE': 10, 'MAROUBRA': 14, 'RANDWICK': 12, 'BALMAIN': 8, 'MARRICKVILLE': 13, 'ASHFIELD': 11, 'BURWOOD': 9, 'DRUMMOYNE': 10,
  'AUBURN': 24, 'STRATHFIELD': 18, 'CAMPSIE': 16, 'EASTWOOD': 22, 'RYDALMERE': 12, 'CABRAMATTA': 28, 'LIVERPOOL': 35, 'PENRITH': 38, 'CAMPBELLTOWN': 32, 'NEWCASTLE': 48,
  'SOUTH YARRA': 8, 'PRAHRAN': 7, 'RICHMOND': 6, 'FITZROY': 5, 'COLLINGWOOD': 7, 'CARLTON': 8, 'BRUNSWICK': 12, 'FITZROY NORTH': 5,
  'EAST MELBOURNE': 4, 'SOUTH MELBOURNE': 8, 'WEST MELBOURNE': 4, 'DOCKLANDS': 10, 'SOUTHBANK': 9,
  'EAST BRISBANE': 7, 'FORTITUDE VALLEY': 6, 'SOUTH BANK': 5, 'WEST END': 8, 'STONES CORNER': 7, 'MOUNT GRAVATT': 13, 'INDOOROOPILLY': 11, 'TARINGA': 6,
  'FREMANTLE': 8, 'SUBIACO': 9, 'NEDLANDS': 7, 'COTTESLOE': 4, 'MOUNT LAWLEY': 8,
  'NORTH ADELAIDE': 6, 'EAST ADELAIDE': 4, 'SOUTH ADELAIDE': 5, 'RUNDLE STREET': 3,
  'LAUNCESTON': 18, 'GLENORCHY': 10, 'PALMERSTON': 14, 'BELCONNEN': 28,
  'LAKES ENTRANCE': 5, 'BRISBANE': 145, 'MELBOURNE': 128, 'PERTH': 95, 'ADELAIDE': 68, 'HOBART': 38, 'DARWIN': 24, 'CANBERRA': 72
};

// Hardcoded commute times to CBD (minutes) for major suburbs
const SUBURB_COMMUTE_TIMES: Record<string, number> = {
  'PARRAMATTA': 28, 'BONDI': 15, 'SYDNEY': 3, 'MANLY': 32, 'CRONULLA': 45, 'NEWTOWN': 18, 'SURRY HILLS': 8, 'PADDINGTON': 12, 'CHATSWOOD': 18,
  'DOUBLE BAY': 12, 'NEUTRAL BAY': 8, 'CROWS NEST': 5, 'NORTH SYDNEY': 8, 'MOSMAN': 15, 'WILLOUGHBY': 16, 'LANE COVE': 14, 'HORNSBY': 30,
  'EPPING': 25, 'RYDE': 20, 'MIRANDA': 35, 'WOLLONGONG': 90, 'WOOLLAHRA': 10, 'GLEBE': 6, 'REDFERN': 8, 'ALEXANDRIA': 7,
  'BRONTE': 12, 'COOGEE': 18, 'MAROUBRA': 25, 'RANDWICK': 20, 'BALMAIN': 9, 'MARRICKVILLE': 14, 'ASHFIELD': 16, 'BURWOOD': 18, 'DRUMMOYNE': 10,
  'AUBURN': 35, 'STRATHFIELD': 28, 'CAMPSIE': 32, 'EASTWOOD': 30, 'RYDALMERE': 42, 'CABRAMATTA': 55, 'LIVERPOOL': 65, 'PENRITH': 75, 'CAMPBELLTOWN': 65, 'NEWCASTLE': 120,
  'SOUTH YARRA': 6, 'PRAHRAN': 8, 'RICHMOND': 4, 'FITZROY': 2, 'COLLINGWOOD': 3, 'CARLTON': 2, 'BRUNSWICK': 8, 'FITZROY NORTH': 5,
  'EAST MELBOURNE': 3, 'SOUTH MELBOURNE': 5, 'WEST MELBOURNE': 4, 'DOCKLANDS': 4, 'SOUTHBANK': 5,
  'EAST BRISBANE': 3, 'FORTITUDE VALLEY': 2, 'SOUTH BANK': 4, 'WEST END': 6, 'STONES CORNER': 8, 'MOUNT GRAVATT': 20, 'INDOOROOPILLY': 15, 'TARINGA': 12,
  'FREMANTLE': 25, 'SUBIACO': 12, 'NEDLANDS': 14, 'COTTESLOE': 22, 'MOUNT LAWLEY': 10,
  'NORTH ADELAIDE': 8, 'EAST ADELAIDE': 5, 'SOUTH ADELAIDE': 8, 'RUNDLE STREET': 3,
  'LAUNCESTON': 5, 'GLENORCHY': 20, 'PALMERSTON': 25, 'BELCONNEN': 20,
  'LAKES ENTRANCE': 180, 'BRISBANE': 5, 'MELBOURNE': 8, 'PERTH': 15, 'ADELAIDE': 12, 'HOBART': 10, 'DARWIN': 12, 'CANBERRA': 25
};

// Hardcoded coordinates for major suburbs
const SUBURB_COORDINATES: Record<string, { lon: number; lat: number }> = {
  'PARRAMATTA': { lon: 151.0048, lat: -33.8171 },
  'BONDI': { lon: 151.2741, lat: -33.8895 },
  'SYDNEY': { lon: 151.2093, lat: -33.8688 },
  'MANLY': { lon: 151.2903, lat: -33.7806 },
  'CRONULLA': { lon: 151.1622, lat: -34.0286 },
  'NEWTOWN': { lon: 151.1752, lat: -33.8978 },
  'SURRY HILLS': { lon: 151.2158, lat: -33.8848 },
  'PADDINGTON': { lon: 151.2260, lat: -33.8943 },
  'DOUBLE BAY': { lon: 151.2848, lat: -33.8780 },
  'NEUTRAL BAY': { lon: 151.2253, lat: -33.8403 },
  'CROWS NEST': { lon: 151.2084, lat: -33.8302 },
  'NORTH SYDNEY': { lon: 151.2155, lat: -33.8382 },
  'MOSMAN': { lon: 151.2402, lat: -33.8251 },
  'CHATSWOOD': { lon: 151.1926, lat: -33.7962 },
  'WILLOUGHBY': { lon: 151.2043, lat: -33.8003 },
  'LANE COVE': { lon: 151.1716, lat: -33.8163 },
  'HORNSBY': { lon: 151.0358, lat: -33.7997 },
  'EPPING': { lon: 151.0524, lat: -33.7810 },
  'RYDE': { lon: 151.0969, lat: -33.8475 },
  'MIRANDA': { lon: 151.0278, lat: -34.0110 },
  'WOLLONGONG': { lon: 150.8927, lat: -34.4208 },
  'WOOLLAHRA': { lon: 151.2417, lat: -33.8943 },
  'GLEBE': { lon: 151.1833, lat: -33.8757 },
  'REDFERN': { lon: 151.2075, lat: -33.8901 },
  'ALEXANDRIA': { lon: 151.1924, lat: -33.9087 },
  'BRONTE': { lon: 151.2767, lat: -33.8937 },
  'COOGEE': { lon: 151.2637, lat: -33.9142 },
  'MAROUBRA': { lon: 151.2386, lat: -33.9474 },
  'RANDWICK': { lon: 151.2360, lat: -33.9239 },
  'BALMAIN': { lon: 151.2016, lat: -33.8611 },
  'MARRICKVILLE': { lon: 151.1482, lat: -33.9099 },
  'ASHFIELD': { lon: 151.1221, lat: -33.8823 },
  'BURWOOD': { lon: 151.1041, lat: -33.8995 },
  'DRUMMOYNE': { lon: 151.1805, lat: -33.8538 },
  'AUBURN': { lon: 151.0063, lat: -33.8487 },
  'STRATHFIELD': { lon: 151.0847, lat: -33.8771 },
  'CAMPSIE': { lon: 151.0953, lat: -33.8979 },
  'EASTWOOD': { lon: 151.0731, lat: -33.8646 },
  'RYDALMERE': { lon: 151.0229, lat: -33.8644 },
  'CABRAMATTA': { lon: 150.8147, lat: -33.9745 },
  'LIVERPOOL': { lon: 150.9252, lat: -33.9084 },
  'PENRITH': { lon: 150.7069, lat: -33.7455 },
  'CAMPBELLTOWN': { lon: 150.7870, lat: -34.0710 },
  'NEWCASTLE': { lon: 151.7781, lat: -32.9270 },
  'LAKES ENTRANCE': { lon: 147.9877, lat: -37.8709 },
  'BRISBANE': { lon: 153.0251, lat: -27.4679 },
  'MELBOURNE': { lon: 144.9631, lat: -37.8136 },
  'PERTH': { lon: 115.8605, lat: -31.9505 },
  'ADELAIDE': { lon: 138.5976, lat: -34.9285 },
  'HOBART': { lon: 147.3272, lat: -42.8826 },
  'DARWIN': { lon: 130.8353, lat: -12.6500 },
  'CANBERRA': { lon: 149.1244, lat: -35.2809 },
  'SOUTH YARRA': { lon: 145.0028, lat: -37.8416 },
  'PRAHRAN': { lon: 145.0075, lat: -37.8553 },
  'RICHMOND': { lon: 145.0244, lat: -37.8234 },
  'FITZROY': { lon: 145.0149, lat: -37.8047 },
  'COLLINGWOOD': { lon: 145.0309, lat: -37.8099 },
  'CARLTON': { lon: 145.0038, lat: -37.7960 },
  'BRUNSWICK': { lon: 145.0464, lat: -37.7585 },
  'FITZROY NORTH': { lon: 145.0226, lat: -37.7838 },
  'EAST MELBOURNE': { lon: 145.0272, lat: -37.8106 },
  'SOUTH MELBOURNE': { lon: 144.9658, lat: -37.8336 },
  'WEST MELBOURNE': { lon: 144.9506, lat: -37.8090 },
  'DOCKLANDS': { lon: 144.9519, lat: -37.8186 },
  'SOUTHBANK': { lon: 144.9737, lat: -37.8253 },
  'EAST BRISBANE': { lon: 153.0498, lat: -27.4923 },
  'FORTITUDE VALLEY': { lon: 153.0361, lat: -27.4515 },
  'SOUTH BANK': { lon: 153.0212, lat: -27.5006 },
  'WEST END': { lon: 153.0068, lat: -27.4844 },
  'STONES CORNER': { lon: 153.0389, lat: -27.5277 },
  'MOUNT GRAVATT': { lon: 153.0944, lat: -27.5509 },
  'INDOOROOPILLY': { lon: 152.9868, lat: -27.4813 },
  'TARINGA': { lon: 152.9617, lat: -27.4903 },
  'FREMANTLE': { lon: 115.7597, lat: -32.0577 },
  'SUBIACO': { lon: 115.8158, lat: -31.9767 },
  'NEDLANDS': { lon: 115.8139, lat: -31.9917 },
  'COTTESLOE': { lon: 115.7539, lat: -31.9952 },
  'MOUNT LAWLEY': { lon: 115.8614, lat: -31.9412 },
  'NORTH ADELAIDE': { lon: 138.5969, lat: -34.9149 },
  'EAST ADELAIDE': { lon: 138.6341, lat: -34.9238 },
  'SOUTH ADELAIDE': { lon: 138.6022, lat: -34.9475 },
  'RUNDLE STREET': { lon: 138.6145, lat: -34.9283 },
  'LAUNCESTON': { lon: 147.1405, lat: -41.4318 },
  'GLENORCHY': { lon: 147.1877, lat: -42.8265 },
  'PALMERSTON': { lon: 130.9931, lat: -12.6069 },
  'BELCONNEN': { lon: 149.0404, lat: -35.2400 }
};

export class ExternalDataService {
  // Lookup ABS data from preloaded ABS JSON.
  static getAbsRecord(suburbName: string, state: string): any {
    if (!absIndex) return null;
    const key = `${suburbName.toUpperCase()}|${(state || '').toUpperCase()}`;
    return absIndex[key] || absIndex[suburbName.toUpperCase()] || null;
  }

  // Get key ABS metrics for a suburb
  static async getAbsMetrics(suburbName: string, state: string): Promise<{
    population?: number;
    medianAge?: number;
    householdSize?: number;
    employmentRate?: number;
    medianIncome?: number;
  }> {
    try {
      const rec = this.getAbsRecord(suburbName, state);
      if (!rec) return {};
      return {
        population: rec.population ?? undefined,
        medianAge: rec.medianAge ?? undefined,
        householdSize: rec.householdSize ?? undefined,
        employmentRate: rec.employmentRate ?? undefined,
        medianIncome: rec.medianIncome ?? undefined
      };
    } catch (err) {
      console.error('getAbsMetrics error', err);
      return {};
    }
  }

  // Use hardcoded suburb coordinates instead of dynamic geocoding for reliability

  // Get school count from preloaded data or fallback hardcoded data
  static async getSchoolCount(suburbName: string, state: string): Promise<number | null> {
    try {
      const suburbKey = suburbName.toUpperCase();
      const stateKey = `${suburbKey}|${(state || '').toUpperCase()}`;
      
      // Try to get from loaded JSON first
      if (suburbSchools) {
        if (suburbSchools[stateKey] != null) return suburbSchools[stateKey];
        if (suburbSchools[suburbKey] != null) return suburbSchools[suburbKey];
      }

      // Fall back to hardcoded data
      if (SUBURB_SCHOOL_COUNTS[suburbKey]) {
        return SUBURB_SCHOOL_COUNTS[suburbKey];
      }

      // If suburb not in our data, return null
      return null;
    } catch (err) {
      console.error('[SCHOOLS] Error:', (err as any)?.message || err);
      return null;
    }
  }

  // Use OpenRouteService to get driving time (official dataset if returned)
  static async getCommuteTime(origin: string, destination: string = 'Sydney Town Hall'): Promise<number | null> {
    try {
      const suburbKey = origin.split(',')[0].trim().toUpperCase();
      
      // Try preloaded commute times first
      if (suburbCommutes) {
        const stateMatch = origin.includes('NSW') ? '|NSW' : origin.includes('VIC') ? '|VIC' : '';
        const lookupKey = stateMatch ? `${suburbKey}${stateMatch}` : suburbKey;
        if (suburbCommutes[lookupKey] != null) {
          console.debug(`[COMMUTE] Using preloaded commute time for ${lookupKey}: ${suburbCommutes[lookupKey]} minutes`);
          return suburbCommutes[lookupKey];
        }
        if (suburbCommutes[suburbKey] != null) {
          console.debug(`[COMMUTE] Using preloaded commute time for ${suburbKey}: ${suburbCommutes[suburbKey]} minutes`);
          return suburbCommutes[suburbKey];
        }
      }

      // Try hardcoded fallback
      if (SUBURB_COMMUTE_TIMES[suburbKey]) {
        console.debug(`[COMMUTE] Using fallback commute time for ${suburbKey}: ${SUBURB_COMMUTE_TIMES[suburbKey]} minutes`);
        return SUBURB_COMMUTE_TIMES[suburbKey];
      }

      // If no API key and no preloaded data, try ORS API if available
      if (!OPENROUTESERVICE_API_KEY) {
        console.warn('OpenRouteService API key missing and no preloaded commute time available for', suburbKey);
        return null;
      }

      const cacheKey = `ors|${origin}|${destination}`;
      const cached = cacheGet(routeCache, cacheKey);
      if (cached != null) return cached as number;

      // Extract suburb name and look up coordinates
      const originCoords = suburbCoordinates ? suburbCoordinates[suburbKey] : SUBURB_COORDINATES[suburbKey];
      if (!originCoords) {
        console.warn(JSON.stringify({ step: 'commute-suburb-not-found', suburb: suburbKey }));
        return null;
      }

      // Use hardcoded Sydney Town Hall coordinates
      const destCoords = { lon: 151.2093, lat: -33.8688 };

      // Call directions API with coordinates
      const response = await axios.get(`${OPENROUTESERVICE_BASE_URL}/directions/driving-car`, {
        timeout: 10000,
        params: {
          api_key: OPENROUTESERVICE_API_KEY,
          start: `${originCoords.lon},${originCoords.lat}`,
          end: `${destCoords.lon},${destCoords.lat}`,
          format: 'geojson'
        }
      });

      if (response.data && response.data.features && response.data.features[0]) {
        const duration = response.data.features[0].properties.segments[0].duration;
        const minutes = Math.round(duration / 60);
        // Sanity check
        if (minutes < 1 || minutes > 180) {
          console.error(JSON.stringify({ step: 'commute-sanity-fail', origin, destination, minutes }));
          return null;
        }
        cacheSet(routeCache, cacheKey, minutes, 24 * 60 * 60 * 1000);
        return minutes;
      }
      return null;
    } catch (err) {
      console.error('[COMMUTE] Error:', (err as any)?.message || err);
      return null;
    }
  }

  // Get public transport stops from preloaded data
  static async getPublicTransportStops(suburbName: string, state: string): Promise<number | null> {
    try {
      const suburbKey = suburbName.toUpperCase();
      const stateKey = `${suburbKey}|${(state || '').toUpperCase()}`;
      
      // Try to get from loaded JSON first
      if (suburbPublicTransport) {
        console.debug(`[TRANSPORT] Looking for keys: [${stateKey}] or [${suburbKey}]`);
        if (suburbPublicTransport[stateKey] != null) {
          console.debug(`[TRANSPORT] Found transport stops for ${stateKey}: ${suburbPublicTransport[stateKey]}`);
          return suburbPublicTransport[stateKey];
        }
        if (suburbPublicTransport[suburbKey] != null) {
          console.debug(`[TRANSPORT] Found transport stops for ${suburbKey}: ${suburbPublicTransport[suburbKey]}`);
          return suburbPublicTransport[suburbKey];
        }
      } else {
        console.debug(`[TRANSPORT] suburbPublicTransport data not loaded`);
      }

      // If suburb not in our data, return null
      return null;
    } catch (err) {
      console.error('[TRANSPORT] Error:', (err as any)?.message || err);
      return null;
    }
  }

  // Get parks count from preloaded data
  static async getParksCount(suburbName: string, state: string): Promise<number | null> {
    try {
      const suburbKey = suburbName.toUpperCase();
      const stateKey = `${suburbKey}|${(state || '').toUpperCase()}`;
      
      // Try to get from loaded JSON first
      if (suburbParks) {
        console.debug(`[PARKS] Looking for keys: [${stateKey}] or [${suburbKey}]`);
        if (suburbParks[stateKey] != null) {
          console.debug(`[PARKS] Found parks for ${stateKey}: ${suburbParks[stateKey]}`);
          return suburbParks[stateKey];
        }
        if (suburbParks[suburbKey] != null) {
          console.debug(`[PARKS] Found parks for ${suburbKey}: ${suburbParks[suburbKey]}`);
          return suburbParks[suburbKey];
        }
      } else {
        console.debug(`[PARKS] suburbParks data not loaded`);
      }

      // If suburb not in our data, return null
      return null;
    } catch (err) {
      console.error('[PARKS] Error:', (err as any)?.message || err);
      return null;
    }
  }

  // Numbeo integration removed.

  // Main method to get all real data for a suburb
  static async getSuburbRealData(suburbName: string, state: string, postcode: string): Promise<SuburbRealData> {
    const [absMetrics, commuteTime, schoolCount, transportStops, parksCount] = await Promise.all([
      this.getAbsMetrics(suburbName, state),
      this.getCommuteTime(`${suburbName}, ${state}, Australia`),
      this.getSchoolCount(suburbName, state),
      this.getPublicTransportStops(suburbName, state),
      this.getParksCount(suburbName, state)
    ]);

    const result: SuburbRealData = {};

    // NOTE: Current data is from postcode-based demographic estimates (not official ABS Census 2021)
    // This will be improved with ABS QuickStats API integration in future releases
    // Add all ABS metrics to result - marked as estimates until we integrate official ABS QuickStats
    if (absMetrics.population != null) {
      result.population = { value: absMetrics.population, source: 'Postcode-based estimate', datasetYear: 2021, type: 'derived_metric' };
    }

    if (absMetrics.medianAge != null) {
      result.medianAge = { value: absMetrics.medianAge, source: 'Postcode-based estimate', datasetYear: 2021, type: 'derived_metric' };
    }

    if (absMetrics.householdSize != null) {
      result.householdSize = { value: absMetrics.householdSize, source: 'Postcode-based estimate', datasetYear: 2021, type: 'derived_metric' };
    }

    if (absMetrics.employmentRate != null) {
      result.employmentRate = { value: absMetrics.employmentRate, source: 'Postcode-based estimate', datasetYear: 2021, type: 'derived_metric' };
    }

    if (absMetrics.medianIncome != null) {
      result.medianIncome = { value: absMetrics.medianIncome, source: 'Postcode-based estimate', datasetYear: 2021, type: 'derived_metric' };
    }

    if (commuteTime != null) {
      result.commute = { drivingTimeMinutes: { value: commuteTime, source: 'OpenRouteService', datasetYear: 2026, type: 'derived_metric' } };
    }

    if (schoolCount != null) {
      result.schools = { count: { value: schoolCount, source: 'Population-derived estimate', datasetYear: 2025, type: 'derived_metric' } };
    }

    if (transportStops != null) {
      result.publicTransportStops = { value: transportStops, source: 'TripView / Public transport registers', datasetYear: 2025, type: 'official_dataset' };
    }

    if (parksCount != null) {
      result.parks = { value: parksCount, source: 'Population-density estimate', datasetYear: 2026, type: 'derived_metric' };
    }

    return result;
  }
}