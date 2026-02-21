import { Handler } from '@netlify/functions';
import path from 'path';
import fs from 'fs';

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

const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const suburbs = loadJson('suburbs');
      const demographics = loadJson('suburb_demographics');
      const postcodes = loadJson('suburb_postcodes');

      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'healthy',
          database: 'json-bundled',
          tables: {
            suburbs: suburbs.length,
            suburb_demographics: demographics.length,
            suburb_postcodes: postcodes.length,
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
