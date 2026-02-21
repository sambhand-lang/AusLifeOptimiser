import { Handler } from '@netlify/functions';
import path from 'path';
import fs from 'fs';

// Get database path from Lambda environment or local
const getDbPath = () => {
  // Prefer a bundled DB next to the function; fallback to the repo backend path
  const bundled = path.join(__dirname, './suburbs.db');
  const fallback = path.join(__dirname, '../../backend/suburbs.db');
  if (fs.existsSync(bundled)) return bundled;
  return fallback;
};

// Load JSON datasets exported at deploy time
const loadJson = (name: string) => {
  const p = path.join(__dirname, `${name}.json`);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
      console.error('Failed to parse', p, e);
      return [];
    }
  }
  return [];
};

const suburbsData = () => loadJson('suburbs');
const demographicsData = () => loadJson('suburb_demographics');

const handler: Handler = async (event) => {
  const pathStr = event.path;
  const method = event.httpMethod;

  try {
    // GET /api/v2/suburbs/:ssc/details
    if (method === 'GET' && /\/api\/v2\/suburbs\/(\d+)\/details/.test(pathStr)) {
      const sscMatch = pathStr.match(/\/api\/v2\/suburbs\/(\d+)\/details/);
      const ssc = sscMatch?.[1];

      if (!ssc) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'SSC code required' }),
        };
      }

      const suburbs = suburbsData();
      const suburb = suburbs.filter((s: any) => String(s.ssc) === String(ssc));

      if (!suburb.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Suburb not found' }),
        };
      }

      const demographicsAll = demographicsData();
      const demographics = demographicsAll.find((d: any) => String(d.ssc) === String(ssc)) || null;

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...suburb[0],
          demographics,
        }),
      };
    }

    // GET /api/dropdowns/suburbs
    if (method === 'GET' && pathStr.includes('/api/dropdowns/suburbs')) {
      const state = event.queryStringParameters?.state;
      const query = event.queryStringParameters?.q?.toLowerCase();

      let suburbs = suburbsData();
      if (state) suburbs = suburbs.filter((s: any) => s.state === state);
      if (query) suburbs = suburbs.filter((s: any) => String(s.suburb_name).toLowerCase().includes(query));
      suburbs = suburbs.slice(0, 100).map((s: any) => ({ ssc: s.ssc, suburb_name: s.suburb_name, state: s.state }));

      return { statusCode: 200, body: JSON.stringify(suburbs) };
    }

    // GET /api/suburbs/states
    if (method === 'GET' && pathStr.includes('/api/suburbs/states')) {
      const suburbs = suburbsData();
      const states = Array.from(new Set(suburbs.map((s: any) => s.state))).sort();
      return { statusCode: 200, body: JSON.stringify(states) };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Endpoint not found' }),
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

export { handler };
