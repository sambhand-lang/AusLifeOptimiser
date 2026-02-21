// testSuburbMetricsPolygon.js
// Test script to validate the polygon-based metrics implementation

const { generateSuburbMetricsPolygon } = require('./suburbMetricsPolygon.js');
const fs = require('fs');

// Load transport and parks data if available
let suburbPublicTransport = {};
let suburbParks = {};

try {
  const transportData = JSON.parse(fs.readFileSync('./public_transport_stops.json'));
  suburbPublicTransport = transportData;
  console.log('✓ Loaded existing transport stops data');
} catch (e) {
  console.log('ℹ Transport data not found, will use estimation');
}

try {
  const parksData = JSON.parse(fs.readFileSync('./parks.json'));
  suburbParks = parksData;
  console.log('✓ Loaded existing parks data');
} catch (e) {
  console.log('ℹ Parks data not found, will use estimation');
}

// Make data available globally for the polygon module
global.suburbPublicTransport = suburbPublicTransport;
global.suburbParks = suburbParks;

// Test suburbs
const testSuburbs = [
  { name: 'PARRAMATTA', state: 'NSW', postcode: '2150' },
  { name: 'BONDI', state: 'NSW', postcode: '2026' },
  { name: 'CAMPBELLTOWN', state: 'NSW', postcode: '2560' },
  { name: 'SYDNEY', state: 'NSW', postcode: '2000' }
];

// Sydney CBD coordinates (for commute calculation)
const sydneyCBD = { lat: -33.8688, lon: 151.2093 };

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         POLYGON-BASED METRICS VALIDATION TEST                 ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

async function runTests() {
  for (const suburb of testSuburbs) {
    try {
      console.log(`\n📍 Testing: ${suburb.name}, ${suburb.state} (${suburb.postcode})`);
      console.log('─'.repeat(60));
      
      const results = await generateSuburbMetricsPolygon(
        suburb.name,
        suburb.state,
        suburb.postcode,
        sydneyCBD
      );

      console.log(`Precision Mode: ${results.precision}`);
      console.log('\nMetrics:');
      
      // Population
      if (results.metrics.population) {
        console.log(
          `  Population: ${results.metrics.population.value.toLocaleString()} (${results.metrics.population.source})`
        );
      }
      
      // Age
      if (results.metrics.medianAge) {
        console.log(
          `  Median Age: ${results.metrics.medianAge.value} years (${results.metrics.medianAge.source})`
        );
      }
      
      // Household Size
      if (results.metrics.householdSize) {
        console.log(
          `  Household Size: ${results.metrics.householdSize.value} persons (${results.metrics.householdSize.source})`
        );
      }
      
      // Employment
      if (results.metrics.employment) {
        console.log(
          `  Employment Rate: ${results.metrics.employment.value}% (${results.metrics.employment.source})`
        );
      }
      
      // Income
      if (results.metrics.income) {
        console.log(
          `  Median Income: $${results.metrics.income.value.toLocaleString()} (${results.metrics.income.source})`
        );
      }
      
      // Commute
      if (results.metrics.commute?.drivingTimeMinutes) {
        console.log(
          `  Commute Time: ${results.metrics.commute.drivingTimeMinutes.value} mins (${results.metrics.commute.drivingTimeMinutes.source})`
        );
      }
      
      // Schools
      if (results.metrics.schoolCount) {
        console.log(
          `  Schools: ${results.metrics.schoolCount.value} (${results.metrics.schoolCount.source})`
        );
      }
      
      // Transport
      if (results.metrics.transportStops) {
        console.log(
          `  Transport Stops: ${results.metrics.transportStops.value} (${results.metrics.transportStops.source})`
        );
      }
      
      // Parks
      if (results.metrics.parkCount) {
        console.log(
          `  Parks: ${results.metrics.parkCount.value} (${results.metrics.parkCount.source})`
        );
      }

      console.log('✅ Test passed');
    } catch (error) {
      console.error(`❌ Test failed: ${error.message}`);
      console.error(error.stack);
    }
  }
}

runTests().then(() => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUITE COMPLETE                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
});
