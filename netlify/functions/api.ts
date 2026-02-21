import { Handler } from '@netlify/functions';
import sqlite3 from 'sqlite3';
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

// Helper to run DB queries
const dbQuery = (query: string, params: any[] = []): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(getDbPath(), sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        reject(err);
        return;
      }

      db.all(query, params, (err, rows) => {
        db.close();
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  });
};

const handler: Handler = async (event) => {
  const path = event.path;
  const method = event.httpMethod;

  try {
    // GET /api/v2/suburbs/:ssc/details
    if (method === 'GET' && /\/api\/v2\/suburbs\/(\d+)\/details/.test(path)) {
      const sscMatch = path.match(/\/api\/v2\/suburbs\/(\d+)\/details/);
      const ssc = sscMatch?.[1];

      if (!ssc) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'SSC code required' }),
        };
      }

      const suburb = await dbQuery(
        `SELECT ssc, suburb_name, state, postcode, 
                latitude, longitude, area_km2 FROM suburbs WHERE ssc = ?`,
        [ssc]
      );

      if (!suburb.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Suburb not found' }),
        };
      }

      const demographics = await dbQuery(
        `SELECT population, median_age, median_income, employment_rate, 
                household_size, data_source FROM suburb_demographics WHERE ssc = ?`,
        [ssc]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...suburb[0],
          demographics: demographics[0] || null,
        }),
      };
    }

    // GET /api/dropdowns/suburbs
    if (method === 'GET' && path.includes('/api/dropdowns/suburbs')) {
      const state = event.queryStringParameters?.state;
      const query = event.queryStringParameters?.q?.toLowerCase();

      let sql = `SELECT ssc, suburb_name, state FROM suburbs WHERE 1=1`;
      const params: any[] = [];

      if (state) {
        sql += ` AND state = ?`;
        params.push(state);
      }

      if (query) {
        sql += ` AND LOWER(suburb_name) LIKE ?`;
        params.push(`%${query}%`);
      }

      sql += ` LIMIT 100`;

      const suburbs = await dbQuery(sql, params);

      return {
        statusCode: 200,
        body: JSON.stringify(suburbs),
      };
    }

    // GET /api/suburbs/states
    if (method === 'GET' && path.includes('/api/suburbs/states')) {
      const states = await dbQuery(
        `SELECT DISTINCT state FROM suburbs ORDER BY state`
      );

      return {
        statusCode: 200,
        body: JSON.stringify(states.map((s: any) => s.state)),
      };
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
