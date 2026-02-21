import { Handler } from '@netlify/functions';

// Load JSON datasets directly as modules
const suburbsRaw: any[] = require('./suburbs.json');
const demographicsRaw: any[] = require('./suburb_demographics.json');
const schoolsRaw: any = require('./schools.json');
const commuteRaw: any = require('./commute_times.json');
const parksRaw: any = require('./parks.json');
const transportRaw: any = require('./public_transport_stops.json');

const suburbsData = () => suburbsRaw;
const demographicsData = () => demographicsRaw;
const schoolsData = () => schoolsRaw;
const commuteData = () => commuteRaw;
const parksData = () => parksRaw;
const transportData = () => transportRaw;

const handler: Handler = async (event) => {
  let pathStr = event.path || event.rawUrl || '';
  // Normalize Netlify dev rewritten function paths that may omit a slash (e.g. /.netlify/functions/apisuburbs/...)
  if (pathStr.includes('/.netlify/functions/api') && !pathStr.includes('/.netlify/functions/api/')) {
    pathStr = pathStr.replace('/.netlify/functions/api', '/.netlify/functions/api/');
  }
  // Remove function base path for route matching
  pathStr = pathStr.replace(/^\/.netlify\/functions\/api/, '') || '/' + (event.queryStringParameters?.['*'] || '');
  
  const method = event.httpMethod;
  console.log('API Route:', method, pathStr);

  try {
    // Helper function to get a metric with source info
    const getMetricData = (value: any) => {
      if (value === null || value === undefined) return null;
      return { value, source: 'Dataset', type: 'derived_metric' };
    };

    // GET /api/v2/suburbs/:ssc/details
    if (method === 'GET' && /\/v2\/suburbs\/(\d+)\/details|v2\/suburbs\/(\d+)\/details/.test(pathStr)) {
      const match = pathStr.match(/\/v2\/suburbs\/(\d+)\/details|v2\/suburbs\/(\d+)\/details/);
      const ssc = match?.[1] || match?.[2];

      if (!ssc) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'SSC code required' }),
        };
      }

      const suburbs = suburbsData();
      const suburbArr = suburbs.filter((s: any) => String(s.ssc) === String(ssc));

      if (!suburbArr.length) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: 'Suburb not found' }),
        };
      }

      const s = suburbArr[0];
      const demographicsAll = demographicsData();
      const demographics = demographicsAll.find((d: any) => String(d.ssc) === String(ssc)) || null;

      // Get additional metrics
      const suburb_name = String(s.suburb_name).toUpperCase();
      const state = s.state || (demographics && demographics.state) || 'NSW';
      const key = `${suburb_name}|${state}`;
      
      const schools = schoolsData();
      const commute = commuteData();
      const parks = parksData();
      const transport = transportData();

      // Apply postcode correction for known mismatch (HURSTVILLE ssc 12364)
      let postcodeVal = s.postcode || s.postcodes || null;
      if (String(s.ssc) === '12364' && postcodeVal === '1493') postcodeVal = '2220';

      const result = {
        ...s,
        postcode: postcodeVal,
        state: state,
        demographics,
        amenities: {
          commute_minutes: commute[key] || null,
          schools: schools[key] || null,
          parks: parks[key] || null,
          public_transport_stops: transport[key] || null,
        },
      };

      return {
        statusCode: 200,
        body: JSON.stringify(result),
      };
    }

    // GET /api/dropdowns/suburbs
    if (method === 'GET' && (pathStr.includes('dropdowns/suburbs') || pathStr.includes('/api/dropdowns/suburbs'))) {
      const state = event.queryStringParameters?.state;
      const query = event.queryStringParameters?.q?.toLowerCase();

      let suburbs = suburbsData();
      if (state) suburbs = suburbs.filter((s: any) => s.state === state);
      if (query) suburbs = suburbs.filter((s: any) => String(s.suburb_name).toLowerCase().includes(query));
      suburbs = suburbs.slice(0, 100).map((s: any) => {
        let postcode = s.postcode || s.postcodes || null;
        // Apply postcode correction for known mismatch (HURSTVILLE ssc 12364)
        if (String(s.ssc) === '12364' && postcode === '1493') postcode = '2220';
        return { ssc: s.ssc, suburb_name: s.suburb_name, postcode, state: s.state };
      });

      return { statusCode: 200, body: JSON.stringify(suburbs) };
    }

    // GET /api/suburbs/states
    if (method === 'GET' && (pathStr.includes('/suburbs/states') || pathStr.includes('suburbs/states') || pathStr === '/api/suburbs/states')) {
      const suburbs = suburbsData();
      const states = Array.from(new Set(suburbs.map((s: any) => s.state))).sort();
      return { statusCode: 200, body: JSON.stringify(states) };
    }

    // GET /api/suburbs/:id/details (frontend expects this)
    if (method === 'GET' && (/\/suburbs\/(\d+)\/details|suburbs\/(\d+)\/details/.test(pathStr))) {
      const match = pathStr.match(/\/suburbs\/(\d+)\/details|suburbs\/(\d+)\/details/);
      const id = match?.[1] || match?.[2];
      if (!id) return { statusCode: 400, body: JSON.stringify({ error: 'id required' }) };

      const suburbs = suburbsData();
      const suburb = suburbs.find((s: any) => String(s.id) === String(id) || String(s.ssc) === String(id));
      if (!suburb) return { statusCode: 404, body: JSON.stringify({ error: 'Suburb not found' }) };

      const demographicsAll = demographicsData();
      const demographics = demographicsAll.find((d: any) => String(d.ssc) === String(suburb.ssc)) || null;

      const formatMetric = (key: string, srcObj: any) => {
        if (!srcObj || srcObj[key] == null) return null;
        const value = srcObj[key];
        const source = srcObj.source || null;
        // Prefer a year derived from the data source (e.g. ABS_CENSUS_2021 or imputed state averages)
        let datasetYear: number | null = null;
        if (source && /CENSUS[_-]?2021/i.test(source)) {
          datasetYear = 2021;
        } else if (source && source.startsWith('STATE_AVERAGE')) {
          datasetYear = 2021; // imputed from state averages based on 2021 census
        } else if (srcObj.last_updated) {
          datasetYear = Number((srcObj.last_updated || '').slice(0,4));
        }
        return { value, source, datasetYear, type: 'official_dataset' };
      };

      const realTimeData: any = {};
      if (demographics) {
        realTimeData.population = formatMetric('population', demographics);
        realTimeData.medianAge = formatMetric('median_age', demographics);
        realTimeData.householdSize = formatMetric('household_size', demographics);
        realTimeData.employmentRate = formatMetric('employment_rate', demographics);
        realTimeData.medianIncome = formatMetric('median_income', demographics);
      }

      // Postcode/state cleanup: prefer suburb-level values, but apply known corrections
      let postcodeVal = suburb.postcode || suburb.postcodes || null;
      // Quick fix: HURSTVILLE (ssc 12364) should use postcode 2220 when an incorrect 1493 is present
      if (String(suburb.ssc) === '12364' && postcodeVal === '1493') {
        postcodeVal = '2220';
      }

      const result = {
        id: suburb.id || null,
        ssc: suburb.ssc || null,
        suburb_name: suburb.suburb_name,
        postcode: postcodeVal,
        state: suburb.state || (demographics && demographics.state) || null,
        city: suburb.city || null,
        latitude: suburb.latitude || null,
        longitude: suburb.longitude || null,
        realTimeData,
      };

      return { statusCode: 200, body: JSON.stringify(result) };
    }

    // GET /api/suburbs/search
    if (method === 'GET' && (pathStr.includes('/suburbs/search') || pathStr.includes('suburbs/search'))) {
      const q = (event.queryStringParameters?.query || '').toLowerCase();
      if (!q || q.length < 1) return { statusCode: 200, body: JSON.stringify({ data: [] }) };
      const suburbs = suburbsData();
      const results = suburbs
        .filter((s: any) => String(s.suburb_name).toLowerCase().includes(q) || String((s.postcode||'')).startsWith(q))
        .slice(0, 50)
        .map((s: any) => {
          let postcode = s.postcode || s.postcodes || null;
          // Apply postcode correction for known mismatch (HURSTVILLE ssc 12364)
          if (String(s.ssc) === '12364' && postcode === '1493') postcode = '2220';
          return { id: s.id || s.ssc, ssc: s.ssc, suburb_name: s.suburb_name, postcode, state: s.state };
        });
      return { statusCode: 200, body: JSON.stringify({ data: results }) };
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
