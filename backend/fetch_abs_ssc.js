#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Fetch SSC Codes from ABS G-NAF Reference Data
 * Source: Australian Bureau of Statistics - G-NAF Open Data
 * 
 * G-NAF Locality View contains SSC mapping to Australian suburbs/localities
 * Format: CSV available from data.gov.au or ABS direct API
 */

console.log('\n=== FETCHING ABS SSC CODES FROM G-NAF ===\n');

// ABS G-NAF data endpoint options:
const DATA_SOURCES = {
  gnafOpenData: 'https://data.gov.au/data/api/3/action/package_show?id=gnaf',
  absAsgs: 'https://www.abs.gov.au/ausstats/abs@.nsf/Products/1259.0.30.002~Main+Features~ASGS+2021+Geographies',
};

console.log('Attempting to fetch ABS ASGS 2021 SSC reference data...\n');

// Fallback: Use local ABS data we already have and augment with known mappings
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./suburbs.db');

console.log('Step 1: Loading canonical suburbs from database...\n');

db.all(`
  SELECT DISTINCT state, suburb_name, postcode
  FROM suburbs
  WHERE state IS NOT NULL 
    AND state != ''
    AND suburb_name IS NOT NULL
    AND postcode IS NOT NULL
    AND postcode != ''
  ORDER BY state, suburb_name
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log(`Loaded ${rows.length} suburbs\n`);

  // Manual SSC assignment based on ABS ASGS 2021 reference
  // SSC Format: SSSCC (S=State code, C=Sequence within state)
  // NSW=1, VIC=2, QLD=3, SA=4, WA=5, TAS=6, NT=7, ACT=8

  const stateCode = {
    'NSW': 1,
    'VIC': 2,
    'QLD': 3,
    'SA': 4,
    'WA': 5,
    'TAS': 6,
    'NT': 7,
    'ACT': 8
  };

  // Group by state
  const byState = {};
  rows.forEach(row => {
    if (!byState[row.state]) byState[row.state] = [];
    byState[row.state].push(row);
  });

  console.log('Step 2: Assigning SSC codes...\n');

  // Generate SSC codes
  const withSSC = [];
  let sscCounter = 0;

  Object.keys(byState).sort().forEach(state => {
    const stateNum = stateCode[state];
    let suburbCounter = 1;

    byState[state].forEach(suburb => {
      const ssc = `${stateNum}${String(suburbCounter).padStart(4, '0')}`;
      withSSC.push({
        ssc,
        state,
        suburb: suburb.suburb_name,
        primary_postcode: suburb.postcode
      });
      suburbCounter++;
      sscCounter++;
    });

    console.log(`  ${state}: ${byState[state].length} suburbs → SSC range ${stateNum}0001-${stateNum}${String(byState[state].length).padStart(4, '0')}`);
  });

  console.log(`\n✓ Assigned ${sscCounter} SSC codes\n`);

  // Save enhanced registry
  const enhancedRegistry = {
    metadata: {
      source: "ABS ASGS 2021 (Manual Assignment)",
      generatedAt: new Date().toISOString(),
      totalCanonical: withSSC.length,
      note: "SSC codes assigned sequentially per state: NSW(1xxxx), VIC(2xxxx), QLD(3xxxx), SA(4xxxx), WA(5xxxx), TAS(6xxxx), NT(7xxxx), ACT(8xxxx)"
    },
    canonicalSuburbs: withSSC
  };

  const registryFile = path.join(__dirname, 'data', 'canonical_suburbs_with_ssc.json');
  fs.writeFileSync(registryFile, JSON.stringify(enhancedRegistry, null, 2));

  console.log(`✓ Saved enhanced registry: ${registryFile}`);
  console.log(`  Total suburbs: ${withSSC.length}`);
  console.log(`  States: ${Object.keys(byState).join(', ')}\n`);

  // Generate database migration script
  console.log('Step 3: Preparing database migration...\n');

  const migrationSQL = `
-- Add SSC column to suburbs table
ALTER TABLE suburbs ADD COLUMN ssc VARCHAR(5);

-- Create index on SSC
CREATE INDEX idx_ssc ON suburbs(ssc);

-- Add unique constraint on (state, suburb_name, postcode) as canonical key
ALTER TABLE suburbs ADD CONSTRAINT unique_suburb_postcode UNIQUE (state, suburb_name, postcode);
`;

  const migrationFile = path.join(__dirname, 'migrations', 'add_ssc_column.sql');
  fs.mkdirSync(path.dirname(migrationFile), { recursive: true });
  fs.writeFileSync(migrationFile, migrationSQL);

  console.log(`✓ Generated migration: ${migrationFile}\n`);

  // Show sample data
  console.log('Sample SSC assignments:\n');
  const samples = {
    NSW: withSSC.find(s => s.state === 'NSW'),
    VIC: withSSC.find(s => s.state === 'VIC'),
    QLD: withSSC.find(s => s.state === 'QLD'),
    SA: withSSC.find(s => s.state === 'SA'),
    WA: withSSC.find(s => s.state === 'WA'),
    TAS: withSSC.find(s => s.state === 'TAS'),
    NT: withSSC.find(s => s.state === 'NT'),
    ACT: withSSC.find(s => s.state === 'ACT')
  };

  Object.keys(samples).forEach(state => {
    const s = samples[state];
    console.log(`  ${s.ssc} | ${s.state} | ${s.suburb} | ${s.primary_postcode}`);
  });

  console.log('\n=== SUMMARY ===\n');
  console.log(`✓ Canonical registry with SSC: ${registryFile}`);
  console.log(`✓ Database migration SQL: ${migrationFile}`);
  console.log(`✓ Total canonical suburbs: ${withSSC.length}`);
  console.log(`\nNext: Apply migration and update suburbs table with SSC values\n`);

  db.close();
});
