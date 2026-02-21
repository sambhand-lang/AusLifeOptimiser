import { Handler } from '@netlify/functions';
import path from 'path';
import fs from 'fs';

const loadJson = (name: string) => {
  const candidates = [
    path.join(__dirname, `${name}.json`),
    // Netlify Edge Functions paths
    path.join(__dirname, '..', `${name}.json`),
    path.join(__dirname, '..', '..', 'app', 'dist', `${name}.json`),
    // Runtime resolution
    path.join(process.cwd(), 'netlify', 'functions', `${name}.json`),
    path.join(process.cwd(), 'app', 'dist', `${name}.json`),
    path.join(process.cwd(), 'netlify', `${name}.json`),
    // Absolute paths for Netlify build environment
    path.join('/', 'opt', 'build', 'repo', 'netlify', 'functions', `${name}.json`),
    path.join('/', 'opt', 'build', 'repo', 'app', 'dist', `${name}.json`),
  ];
  
  console.log(`Loading ${name}...`);
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        console.log(`Loaded ${name} from ${p}: ${Promise.resolve(data).then(() => Array.isArray(data) ? data.length : 0)} items`);
        return data;
      } catch (e) {
        console.error('Failed to parse', p, e);
      }
    }
  }
  console.warn(`Could not find ${name}`);
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
