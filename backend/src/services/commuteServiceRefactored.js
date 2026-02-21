import axios from 'axios';
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 86400 });

const haversine = (a, b) => {
  const toRad = (v) => (v * Math.PI) / 180.0;
  const R = 6371; // km
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const aa = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1-aa));
  return R * c;
}

export async function getCommuteTime(origin, destination) {
  const cacheKey = `${origin.lon},${origin.lat}-${destination.lon},${destination.lat}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  // Try OpenRouteService if API key is available; otherwise fall back to estimate
  try {
    if (process.env.OPENROUTESERVICE_API_KEY) {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car',
        { coordinates: [[origin.lon, origin.lat], [destination.lon, destination.lat]] },
        { headers: { Authorization: process.env.OPENROUTESERVICE_API_KEY } }
      );

      const duration = Math.round(response.data.routes[0].summary.duration / 60);
      const value = { value: duration, source: 'OpenRouteService', datasetYear: new Date().getFullYear(), type: 'derived_metric' };
      cache.set(cacheKey, value);
      return value;
    }
    throw new Error('No ORS key');
  } catch (err) {
    // fallback estimate using haversine distance and assumed speed
    try {
      const distKm = haversine(origin, destination);
      const minutes = Math.round((distKm / 50) * 60);
      const value = { value: minutes, source: 'estimate_haversine', datasetYear: new Date().getFullYear(), type: 'derived_metric' };
      cache.set(cacheKey, value);
      return value;
    } catch (e) {
      const value = { value: null, source: 'OpenRouteService unavailable', type: 'unavailable' };
      cache.set(cacheKey, value);
      return value;
    }
  }
}
