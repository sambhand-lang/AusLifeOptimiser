import { Handler } from '@netlify/functions';

// Load JSON datasets directly as modules
const suburbsRaw: any[] = require('./suburbs.json');
const demographicsRaw: any[] = require('./suburb_demographics.json');
const postcodesRaw: any[] = require('./suburb_postcodes.json');

const handler: Handler = async (event) => {
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const suburbs = suburbsRaw as any[];
      const demographics = demographicsRaw as any[];
      const postcodes = postcodesRaw as any[];

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
