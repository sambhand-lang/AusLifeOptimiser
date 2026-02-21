const axios = require('axios');
const path = require('path');

// Prefer node-cache if available, otherwise fall back to a tiny Map-based TTL cache.
let CacheClass;
try {
  CacheClass = require('node-cache');
} catch (err) {
  CacheClass = null;
}

let cache;
if (CacheClass) {
  cache = new CacheClass({ stdTTL: 86400 });
} else {
  const map = new Map();
  cache = {
    has: (k) => map.has(k) && map.get(k).expires > Date.now(),
    get: (k) => {
      const v = map.get(k);
      return v && v.expires > Date.now() ? v.value : undefined;
    },
    set: (k, value, ttlSeconds = 86400) => map.set(k, { value, expires: Date.now() + ttlSeconds * 1000 }),
  };
}

function haversineKm(a, b) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const aa = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
  return R * c;
}

async function callOpenRoute(origin, destination) {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) throw new Error('OPENROUTESERVICE_API_KEY not set');

  const url = 'https://api.openrouteservice.org/v2/directions/driving-car';
  const body = { coordinates: [[origin.lon, origin.lat], [destination.lon, destination.lat]] };

  const res = await axios.post(url, body, {
    headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
    timeout: 10_000,
  });

  if (!res || !res.data || !res.data.routes || !res.data.routes[0]) {
    throw new Error('Unexpected OpenRouteService response');
  }

  const durationSec = res.data.routes[0].summary.duration;
  return Math.round(durationSec / 60);
}

/**
 * origin/destination: { lon, lat }
 * Returns driving time in minutes (integer).
 * Caches results by origin->destination key. Falls back to distance estimate when API unavailable.
 */
async function getCommuteTime(origin, destination) {
  if (!origin || !destination) throw new Error('origin and destination required');
  const cacheKey = `${origin.lon},${origin.lat}->${destination.lon},${destination.lat}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  try {
    const minutes = await callOpenRoute(origin, destination);
    cache.set(cacheKey, minutes);
    return minutes;
  } catch (err) {
    // Graceful fallback: estimate by straight-line distance assuming 50 km/h average
    try {
      const km = haversineKm(origin, destination);
      const estimateMins = Math.max(1, Math.round((km / 50) * 60));
      cache.set(cacheKey, estimateMins);
      return estimateMins;
    } catch (err2) {
      console.error('Commute estimate failed', err.message || err, err2 && err2.message);
      return 0;
    }
  }
}

module.exports = {
  getCommuteTime,
};
