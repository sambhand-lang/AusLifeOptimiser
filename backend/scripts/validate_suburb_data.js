#!/usr/bin/env node

/**
 * Simple suburb data validator and database populator
 * Validates what data exists for suburbs like Chatswood
 */

const fs = require('fs');
const path = require('path');

console.log('\n📊 Suburb Data Coverage Validator\n');

// Load all data sources
const absPath = path.join(__dirname, '..', 'data', 'abs_census_by_suburb_expanded.json');
const schoolsPath = path.join(__dirname, '..', 'schools.json');
const commutePath = path.join(__dirname, '..', 'commute_times.json');
const parksPath = path.join(__dirname, '..', 'parks.json');
const transportPath = path.join(__dirname, '..', 'public_transport_stops.json');

console.log('Loading data sources...\n');

let absData = {};
let schoolsData = {};
let commuteData = {};
let parksData = {};
let transportData = {};

try {
  absData = JSON.parse(fs.readFileSync(absPath, 'utf8'));
  console.log(`✓ ABS census data: ${Object.keys(absData).length} entries`);
} catch (e) {
  console.log('✗ Failed to load ABS data');
}

try {
  schoolsData = JSON.parse(fs.readFileSync(schoolsPath, 'utf8'));
  console.log(`✓ Schools data: ${Object.keys(schoolsData).length} entries`);
} catch (e) {
  console.log('✗ Failed to load schools data');
}

try {
  commuteData = JSON.parse(fs.readFileSync(commutePath, 'utf8'));
  console.log(`✓ Commute data: ${Object.keys(commuteData).length} entries`);
} catch (e) {
  console.log('✗ Failed to load commute data');
}

try {
  parksData = JSON.parse(fs.readFileSync(parksPath, 'utf8'));
  console.log(`✓ Parks data: ${Object.keys(parksData).length} entries`);
} catch (e) {
  console.log('✗ Failed to load parks data');
}

try {
  transportData = JSON.parse(fs.readFileSync(transportPath, 'utf8'));
  console.log(`✓ Transport data: ${Object.keys(transportData).length} entries`);
} catch (e) {
  console.log('✗ Failed to load transport data');
}

// Count coverage statistics
console.log('\n📈 Data Coverage Analysis\n');
const totalSuburbs = Object.keys(absData).length;
let schoolsCovered = 0;
let commutesCovered = 0;
let parksCovered = 0;
let transportCovered = 0;

for (const key of Object.keys(absData)) {
  if (schoolsData[key]) schoolsCovered++;
  if (commuteData[key]) commutesCovered++;
  if (parksData[key]) parksCovered++;
  if (transportData[key]) transportCovered++;
}

console.log(`Total suburbs (from ABS): ${totalSuburbs}`);
console.log(`  Schools:    ${schoolsCovered} (${((schoolsCovered/totalSuburbs)*100).toFixed(1)}%)`);
console.log(`  Commutes:   ${commutesCovered} (${((commutesCovered/totalSuburbs)*100).toFixed(1)}%)`);
console.log(`  Parks:      ${parksCovered} (${((parksCovered/totalSuburbs)*100).toFixed(1)}%)`);
console.log(`  Transport:  ${transportCovered} (${((transportCovered/totalSuburbs)*100).toFixed(1)}%)`);

// Check Chatswood specifically
console.log('\n🔍 Checking Chatswood (NSW)...\n');
const chatswoodKeys = ['CHATSWOOD|NSW', 'CHATSWOOD', 'CHATSWOOD NSW'];
let found = false;

for (const key of chatswoodKeys) {
  if (absData[key]) {
    console.log(`✓ Found in ABS: ${key}`);
    const data = absData[key];
    console.log(`  - Population: ${data.population}`);
    console.log(`  - Median age: ${data.medianAge}`);
    console.log(`  - Household size: ${data.householdSize}`);
    console.log(`  - Employment: ${data.employmentRate}%`);
    console.log(`  - Median income: $${data.medianIncome}`);
    found = true;
    break;
  }
}

if (!found) {
  console.log('✗ Chatswood not found in ABS data');
}

// Check detailed metrics
console.log('\nDetailed data availability for Chatswood:');
let hasSchools = false;
let hasCommute = false;
let hasParks = false;
let hasTransport = false;
let schoolValue, commuteValue, parksValue, transportValue;

for (const key of chatswoodKeys) {
  if (schoolsData[key]) {
    hasSchools = true;
    schoolValue = schoolsData[key];
    break;
  }
}

for (const key of chatswoodKeys) {
  if (commuteData[key]) {
    hasCommute = true;
    commuteValue = commuteData[key];
    break;
  }
}

for (const key of chatswoodKeys) {
  if (parksData[key]) {
    hasParks = true;
    parksValue = parksData[key];
    break;
  }
}

for (const key of chatswoodKeys) {
  if (transportData[key]) {
    hasTransport = true;
    transportValue = transportData[key];
    break;
  }
}

console.log(`  - Schools:   ${hasSchools ? `✓ ${schoolValue} schools` : '✗ Missing'}`);
console.log(`  - Commute:   ${hasCommute ? `✓ ${commuteValue} minutes to CBD` : '✗ Missing'}`);
console.log(`  - Parks:     ${hasParks ? `✓ ${parksValue} parks` : '✗ Missing'}`);
console.log(`  - Transport: ${hasTransport ? `✓ ${transportValue} stops` : '✗ Missing'}`);

// Summary
console.log('\n' + '='.repeat(50));
console.log('SUMMARY');
console.log('='.repeat(50) + '\n');

if (schoolsCovered === totalSuburbs && commutesCovered === totalSuburbs) {
  console.log('✅ All suburbs have basic data (ABS, Schools, Commutes)');
} else {
  console.log('⚠️  Some suburbs missing data:');
  console.log(`  - Schools missing for: ${totalSuburbs - schoolsCovered} suburbs`);
  console.log(`  - Commutes missing for: ${totalSuburbs - commutesCovered} suburbs`);
}

if (hasSchools && hasCommute) {
  console.log('✅ Chatswood has complete basic data');
} else {
  console.log('⚠️  Chatswood missing:');
  if (!hasSchools) console.log('  - Schools data');
  if (!hasCommute) console.log('  - Commute data');
}

console.log('\n📝 Note: Data is served from:');
console.log('  1. Local JSON files (schools.json, commute_times.json, etc.)');
console.log('  2. Backend externalDataService.ts loads these files at startup');
console.log('  3. API endpoint /api/suburbs/:id/details returns the data');
console.log('\nIf you still see missing data:');
console.log('  1. Restart the backend server');
console.log('  2. Check browser console for API errors');
console.log('  3. Verify backend is running on http://localhost:5001\n');
