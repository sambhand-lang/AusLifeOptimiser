import { Handler } from '@netlify/functions';
import sqlite3 from 'sqlite3';
import path from 'path';

const getDbPath = () => {
  const bundled = path.join(__dirname, './suburbs.db');
  const fallback = path.join(__dirname, '../../backend/suburbs.db');
  if (fs.existsSync(bundled)) return bundled;
  return fallback;
};

const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const db = new sqlite3.Database(getDbPath(), sqlite3.OPEN_READONLY);

      const getCount = (table: string): Promise<number> => {
        return new Promise((resolve, reject) => {
          db.get(`SELECT COUNT(*) as count FROM ${table}`, (err, row: any) => {
            if (err) reject(err);
            else resolve(row?.count || 0);
          });
        });
      };

      const suburbsCount = await getCount('suburbs');
      const demographicsCount = await getCount('suburb_demographics');
      const postcodesCount = await getCount('suburb_postcodes');

      db.close();

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'healthy',
          database: 'connected',
          tables: {
            suburbs: suburbsCount,
            suburb_demographics: demographicsCount,
            suburb_postcodes: postcodesCount,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Health check failed' }),
    };
  }
};

export { handler };
