/**
 * ABS Census 2021 SSC Data Parser
 * 
 * Purpose: Convert ABS TableBuilder CSV exports to abs_census_by_ssc.json
 * 
 * Steps to use:
 * 1. Visit: https://www.abs.gov.au/census/find-census-data/datapacks
 * 2. Download: Census 2021 - TableBuilder DataPack (or use TableBuilder tool)
 * 3. Export required fields by SSC code:
 *    - Statistical Small Area (SSC) Code 2021
 *    - Total Population
 *    - Median Age
 *    - Median Household Income
 *    - Employment Rate (%)
 *    - Average Household Size
 * 4. Save as CSV: census_2021_ssc_export.csv
 * 5. Run: node parse_abs_ssc_data.js
 * 
 * Input CSV format expected:
 * SSC_CODE_2021,Suburb_Name,State,Population,Median_Age,Median_Income,Employment_Rate,Household_Size
 * 13610,North Parramatta,NSW,37890,35,67500,72.1,2.4
 * 13804,Parramatta,NSW,28450,37,72000,68.3,2.8
 * 10570,Bondi,NSW,15150,35,85000,71.5,2.2
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(80));
console.log('📊 ABS CENSUS 2021 SSC DATA PARSER');
console.log('='.repeat(80) + '\n');

// Configuration
const INPUT_FILE = './census_2021_ssc_export.csv';
const OUTPUT_FILE = './data/abs_census_by_ssc.json';
const REQUIRED_FIELDS = ['SSC_CODE_2021', 'Population', 'Median_Age', 'Median_Income', 'Employment_Rate', 'Household_Size'];

// Check if input file exists
if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Input file not found: ${INPUT_FILE}`);
  console.error('\nTo use this parser:');
  console.error('1. Download Census 2021 data from ABS TableBuilder');
  console.error('2. Export by SSC with columns: SSC_CODE_2021, Population, Median_Age, Median_Income, Employment_Rate, Household_Size');
  console.error('3. Save as: census_2021_ssc_export.csv');
  console.error('4. Run this script again\n');
  process.exit(1);
}

console.log(`📂 Reading input file: ${INPUT_FILE}\n`);

// Read CSV
const csvData = fs.readFileSync(INPUT_FILE, 'utf-8');
const lines = csvData.trim().split('\n');
const header = lines[0].split(',').map(h => h.trim());

console.log(`Detected columns: ${header.join(', ')}\n`);

// Validate header
const missingFields = REQUIRED_FIELDS.filter(f => !header.includes(f));
if (missingFields.length > 0) {
  console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
  console.error(`\nExpected columns: ${REQUIRED_FIELDS.join(', ')}\n`);
  process.exit(1);
}

// Parse CSV to JSON
const result = {};
let successCount = 0;
let errorCount = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue; // Skip empty lines

  try {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    
    header.forEach((col, idx) => {
      row[col] = values[idx];
    });

    const sscCode = row['SSC_CODE_2021'];
    
    if (!sscCode) {
      console.warn(`⚠️  Line ${i + 1}: Missing SSC code, skipping`);
      errorCount++;
      continue;
    }

    // Parse numeric fields
    const population = parseInt(row['Population'].replace(/,/g, ''), 10);
    const medianAge = parseFloat(row['Median_Age']);
    const medianIncome = parseInt(row['Median_Income'].replace(/,/g, ''), 10);
    const employmentRate = parseFloat(row['Employment_Rate']) / 100; // Convert % to decimal
    const householdSize = parseFloat(row['Household_Size']);

    // Validate numbers
    if (isNaN(population) || isNaN(medianAge) || isNaN(medianIncome) || isNaN(employmentRate) || isNaN(householdSize)) {
      console.warn(`⚠️  Line ${i + 1}: Invalid numeric values, skipping`);
      errorCount++;
      continue;
    }

    // Store record
    result[sscCode] = {
      population,
      medianAge,
      medianIncome,
      employmentRate,
      householdSize,
      datasetYear: 2021
    };

    successCount++;
  } catch (err) {
    console.warn(`⚠️  Line ${i + 1}: ${err.message}`);
    errorCount++;
  }
}

console.log(`✅ Parsed ${successCount} SSC records`);
console.log(`⚠️  Skipped ${errorCount} records\n`);

// Create metadata
const metadata = {
  version: '1.0',
  source: 'Australian Bureau of Statistics',
  dataset: 'Census 2021 - SSC Level Data',
  downloadDate: new Date().toISOString(),
  totalRecords: successCount,
  fields: {
    population: 'Total population (persons)',
    medianAge: 'Median age (years)',
    medianIncome: 'Median household income (AUD)',
    employmentRate: 'Employment rate (0.0-1.0)',
    householdSize: 'Average household size (persons)',
    datasetYear: 'Census data year'
  }
};

// Save output
const output = {
  metadata,
  data: result
};

// Create directory if needed
const outputDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

console.log(`📁 Output saved: ${OUTPUT_FILE}\n`);
console.log('Summary:');
console.log(`  Total SSC records: ${successCount}`);
console.log(`  File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB\n`);

// Sample records
console.log('Sample records (first 3):\n');
const sampleSSCs = Object.keys(result).slice(0, 3);
sampleSSCs.forEach(ssc => {
  const data = result[ssc];
  console.log(`SSC ${ssc}:`);
  console.log(`  Population: ${data.population.toLocaleString()}`);
  console.log(`  Median Age: ${data.medianAge} years`);
  console.log(`  Median Income: $${data.medianIncome.toLocaleString()}`);
  console.log(`  Employment Rate: ${(data.employmentRate * 100).toFixed(1)}%`);
  console.log(`  Household Size: ${data.householdSize}`);
  console.log('');
});

console.log('✅ Parser complete!\n');
console.log('Next step: Use derive_demographics_by_hierarchy.js to populate suburb_demographics\n');
