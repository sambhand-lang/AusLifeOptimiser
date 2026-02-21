/**
 * Generate public transport stops and parks data for Australian suburbs
 * Data is estimated based on suburb population and location type
 * 
 * - Public Transport Stops: Estimated based on population density and urban area
 * - Parks: Estimated based on population and area size
 */

const fs = require('fs');
const path = require('path');

// Load existing generated suburb data
const absPath = path.join(__dirname, 'data', 'abs_census_by_suburb_expanded.json');
const coordPath = path.join(__dirname, 'coordinates.json');

if (!fs.existsSync(absPath)) {
  console.error('abs_census_by_suburb_expanded.json not found. Run generateSuburbData_v2.js first.');
  process.exit(1);
}

const absData = JSON.parse(fs.readFileSync(absPath, 'utf8'));
const coordinates = fs.existsSync(coordPath) ? JSON.parse(fs.readFileSync(coordPath, 'utf8')) : {};

console.log('Generating public transport and parks data...');

// Define transport density by postcode zone
// Sydney postcodes
const sydneyZones = {
  '2000-2011': { name: 'CBD', transportPerCapita: 8, parksPerCapita: 2 },      // Inner Sydney - high transport
  '2012-2069': { name: 'Inner', transportPerCapita: 5, parksPerCapita: 2 },    // Inner suburbs
  '2070-2173': { name: 'West', transportPerCapita: 3, parksPerCapita: 1.5 },   // Western suburbs
  '2190-2289': { name: 'South', transportPerCapita: 3, parksPerCapita: 1.5 },  // Southern suburbs
  '2400-2455': { name: 'Outer', transportPerCapita: 2, parksPerCapita: 1 },    // Outer suburbs
  '2500-2599': { name: 'Far', transportPerCapita: 1.5, parksPerCapita: 0.8 }   // Far outer
};

// Melbourne postcodes
const melbourneZones = {
  '3000-3011': { name: 'CBD', transportPerCapita: 8, parksPerCapita: 2 },
  '3012-3068': { name: 'Inner', transportPerCapita: 5, parksPerCapita: 2 },
  '3070-3145': { name: 'Middle', transportPerCapita: 3, parksPerCapita: 1.5 },
  '3150-3199': { name: 'Outer', transportPerCapita: 2, parksPerCapita: 1 },
  '3200-3399': { name: 'Far', transportPerCapita: 1.5, parksPerCapita: 0.8 }
};

function getZoneConfig(postcode, state) {
  const pc = parseInt(postcode);
  
  if (state === 'NSW') {
    for (const [range, config] of Object.entries(sydneyZones)) {
      const [min, max] = range.split('-').map(Number);
      if (pc >= min && pc <= max) return config;
    }
    return { name: 'Other NSW', transportPerCapita: 1, parksPerCapita: 0.5 };
  } else if (state === 'VIC') {
    for (const [range, config] of Object.entries(melbourneZones)) {
      const [min, max] = range.split('-').map(Number);
      if (pc >= min && pc <= max) return config;
    }
    return { name: 'Other VIC', transportPerCapita: 1, parksPerCapita: 0.5 };
  }
  
  // Other states - lower density
  return { name: 'Other', transportPerCapita: 0.8, parksPerCapita: 0.5 };
}

const publicTransportStops = {};
const parksData = {};

let processed = 0;
let skipped = 0;

for (const [key, record] of Object.entries(absData)) {
  // key format: "SUBURB|STATE" or just "SUBURB"
  let suburb = '';
  let state = '';
  let postcode = '';

  if (key.includes('|')) {
    [suburb, state] = key.split('|');
  } else {
    suburb = key;
    state = record.state || 'Unknown';
  }

  postcode = record.postcode || '0000';
  const population = record.population || 0;

  if (population === 0 || !suburb) {
    skipped++;
    continue;
  }

  const zoneConfig = getZoneConfig(postcode, state);
  
  // Calculate transport stops: base + population-based
  // Urban areas (CBD/Inner): more stops per capita
  const baseTransportStops = {
    'CBD': 15,
    'Inner': 12,
    'Middle': 8,
    'West': 5,
    'South': 5,
    'Outer': 3,
    'Far': 2,
    'Other': 1,
    'Other NSW': 1,
    'Other VIC': 1
  }[zoneConfig.name] || 1;

  const transportStops = Math.max(2, Math.round(
    baseTransportStops + (population * zoneConfig.transportPerCapita / 10000)
  ));

  // Calculate parks: based on area and population
  // Suburban areas tend to have more parks per capita
  const baseParks = {
    'CBD': 3,      // Smaller areas but more parks
    'Inner': 8,
    'Middle': 12,
    'West': 10,
    'South': 10,
    'Outer': 8,
    'Far': 6,
    'Other': 2,
    'Other NSW': 2,
    'Other VIC': 2
  }[zoneConfig.name] || 2;

  const parks = Math.max(1, Math.round(
    baseParks + (population * zoneConfig.parksPerCapita / 50000)
  ));

  // Store with both key formats for lookup compatibility
  publicTransportStops[key] = transportStops;
  parksData[key] = parks;

  if (!key.includes('|')) {
    const keyWithState = `${suburb}|${state}`;
    publicTransportStops[keyWithState] = transportStops;
    parksData[keyWithState] = parks;
  }

  processed++;
}

// Write files
const transportOutPath = path.join(__dirname, 'public_transport_stops.json');
const parksOutPath = path.join(__dirname, 'parks.json');

fs.writeFileSync(transportOutPath, JSON.stringify(publicTransportStops, null, 2), 'utf8');
fs.writeFileSync(parksOutPath, JSON.stringify(parksData, null, 2), 'utf8');

console.log(`✅ Generated public transport and parks data`);
console.log(`   Public Transport Stops: ${transportOutPath} (${Object.keys(publicTransportStops).length} entries)`);
console.log(`   Parks: ${parksOutPath} (${Object.keys(parksData).length} entries)`);
console.log(`   Suburbs processed: ${processed}`);
console.log(`   Suburbs skipped: ${skipped}`);

// Sample output
console.log('\n📊 Sample Data:');
const sampleKeys = Object.keys(publicTransportStops).slice(0, 3);
sampleKeys.forEach(key => {
  console.log(`   ${key}: Transport=${publicTransportStops[key]}, Parks=${parksData[key]}`);
});
