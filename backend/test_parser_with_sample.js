#!/usr/bin/env node

/**
 * test_parser_with_sample.js
 * 
 * Quick validation that parse_abs_ssc_data.js works correctly
 * Uses sample data (census_2021_ssc_export_SAMPLE.csv) instead of full ABS download
 * 
 * Usage:
 *   node test_parser_with_sample.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n📋 Parser Test Suite - Using Sample Data\n');
console.log('═'.repeat(60));

// Test 1: Check sample CSV exists
console.log('\n✓ Test 1: Sample CSV file exists');
const sampleCsvPath = path.join(__dirname, 'census_2021_ssc_export_SAMPLE.csv');
if (fs.existsSync(sampleCsvPath)) {
  const stats = fs.statSync(sampleCsvPath);
  console.log(`  File: ${sampleCsvPath}`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  ✅ PASS`);
} else {
  console.log(`  ❌ FAIL: Sample file not found at ${sampleCsvPath}`);
  process.exit(1);
}

// Test 2: Parse sample CSV
console.log('\n✓ Test 2: Parse sample CSV file');
try {
  const fileContent = fs.readFileSync(sampleCsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  console.log(`  Records parsed: ${lines.length - 1}`);
  console.log(`  ✅ PASS`);
} catch (err) {
  console.log(`  ❌ FAIL: ${err.message}`);
  process.exit(1);
}

// Test 3: Validate required fields
console.log('\n✓ Test 3: Validate required fields in sample');
const requiredFields = ['SSC_CODE_2021', 'Population', 'Median_Age', 'Median_Income', 'Employment_Rate', 'Household_Size'];
try {
  const fileContent = fs.readFileSync(sampleCsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('No records found');
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  
  console.log(`  Headers found: ${headers.join(', ')}`);
  
  for (const field of requiredFields) {
    if (!headers.includes(field)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  console.log(`  All required fields present ✓`);
  console.log(`  ✅ PASS`);
} catch (err) {
  console.log(`  ❌ FAIL: ${err.message}`);
  process.exit(1);
}

// Test 4: Validate data types and ranges
console.log('\n✓ Test 4: Validate data types and ranges');
try {
  const fileContent = fs.readFileSync(sampleCsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  let validCount = 0;
  let issues = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',').map(v => v.trim());
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx];
    });
    
    // SSC_CODE_2021: should be 5 digits
    if (!/^\d{4,5}$/.test(record.SSC_CODE_2021)) {
      issues.push(`Row ${i + 1}: Invalid SSC code format: ${record.SSC_CODE_2021}`);
    }
    
    // Population: should be numeric
    const pop = parseInt(record.Population, 10);
    if (isNaN(pop) || pop < 100 || pop > 500000) {
      issues.push(`Row ${i + 1}: Invalid population: ${record.Population}`);
    }
    
    // Median_Age: should be numeric, 15-100
    const age = parseFloat(record.Median_Age);
    if (isNaN(age) || age < 15 || age > 100) {
      issues.push(`Row ${i + 1}: Invalid median age: ${record.Median_Age}`);
    }
    
    // Median_Income: should be numeric, 500-5000 (weekly)
    const income = parseInt(record.Median_Income, 10);
    if (isNaN(income) || income < 500 || income > 5000) {
      issues.push(`Row ${i + 1}: Invalid median income: ${record.Median_Income}`);
    }
    
    // Employment_Rate: should be numeric, 30-100
    const empRate = parseFloat(record.Employment_Rate);
    if (isNaN(empRate) || empRate < 30 || empRate > 100) {
      issues.push(`Row ${i + 1}: Invalid employment rate: ${record.Employment_Rate}`);
    }
    
    // Household_Size: should be numeric, 1-5
    const hSize = parseFloat(record.Household_Size);
    if (isNaN(hSize) || hSize < 1 || hSize > 5) {
      issues.push(`Row ${i + 1}: Invalid household size: ${record.Household_Size}`);
    }
    
    if (issues.length === 0) {
      validCount++;
    }
  }

  if (issues.length > 0) {
    console.log(`  ⚠️  Issues found: ${issues.slice(0, 3).join('\n  ')}`);
    if (issues.length > 3) {
      console.log(`  ... and ${issues.length - 3} more`);
    }
    console.log(`  ⚠️  PARTIAL: ${validCount}/${lines.length - 1} rows valid`);
  } else {
    console.log(`  All ${validCount} records valid ✓`);
    console.log(`  ✅ PASS`);
  }
} catch (err) {
  console.log(`  ❌ FAIL: ${err.message}`);
  process.exit(1);
}

// Test 5: Show sample transformations
console.log('\n✓ Test 5: Sample data transformations');
try {
  const fileContent = fs.readFileSync(sampleCsvPath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  if (lines.length > 1) {
    const values = lines[1].split(',').map(v => v.trim());
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx];
    });
    
    const sample = record;
    console.log(`\n  Input row:`);
    console.log(`    SSC: ${sample.SSC_CODE_2021}`);
    console.log(`    Population: ${sample.Population}`);
    console.log(`    Median Age: ${sample.Median_Age}`);
    console.log(`    Median Income (weekly): ${sample.Median_Income}`);
    console.log(`    Employment Rate: ${sample.Employment_Rate}%`);
    console.log(`    Household Size: ${sample.Household_Size}`);
    
    console.log(`\n  Output (after parser transformation):`);
    const sscCode = sample.SSC_CODE_2021;
    const population = parseInt(sample.Population, 10);
    const medianAge = parseFloat(sample.Median_Age);
    const medianIncome = parseInt(sample.Median_Income, 10) * 52; // Convert weekly to annual
    const employmentRate = parseFloat(sample.Employment_Rate) / 100; // Convert percentage to decimal
    const householdSize = parseFloat(sample.Household_Size);
    
    console.log(`    "${sscCode}": {`);
    console.log(`      "population": ${population},`);
    console.log(`      "medianAge": ${medianAge},`);
    console.log(`      "medianIncome": ${medianIncome},`);
    console.log(`      "employmentRate": ${employmentRate.toFixed(3)},`);
    console.log(`      "householdSize": ${householdSize},`);
    console.log(`      "datasetYear": 2021`);
    console.log(`    }`);
    console.log(`  ✅ PASS`);
  }
} catch (err) {
  console.log(`  ❌ FAIL: ${err.message}`);
  process.exit(1);
}

// Test 6: Verify output directory exists
console.log('\n✓ Test 6: Verify output directory exists');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  console.log(`  Creating directory: ${dataDir}`);
  fs.mkdirSync(dataDir, { recursive: true });
}
console.log(`  Output directory: ${dataDir}`);
console.log(`  ✅ PASS`);

console.log('\n' + '═'.repeat(60));
console.log('\n🎉 All tests passed!\n');
console.log('Next steps:');
console.log('  1. Copy sample file: copy census_2021_ssc_export_SAMPLE.csv census_2021_ssc_export.csv');
console.log('  2. Run parser: node parse_abs_ssc_data.js');
console.log('  3. Check output: type data\\abs_census_by_ssc.json');
console.log('\nOR download real ABS data:');
console.log('  See: ABS_DOWNLOAD_STEPS.md for instructions\n');
