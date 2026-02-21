/**
 * Demographic Derivation Algorithm - 4-Step Hierarchy
 * 
 * Implements ABS geographic hierarchy for demographic data:
 * STEP 1: Direct SSC Census Match (abs_census_by_ssc.json)
 * STEP 2: SA2 Inheritance (abs_census_by_sa2.json)
 * STEP 3: SA3 Inheritance (abs_census_by_sa3.json - if available)
 * STEP 4: State Average Fallback
 * 
 * Run: node derive_demographics_by_hierarchy.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('\n' + '='.repeat(80));
console.log('🏗️  DEMOGRAPHIC DERIVATION ALGORITHM - ABS GEOGRAPHIC HIERARCHY');
console.log('='.repeat(80) + '\n');

// Load data files
console.log('📚 Loading ABS geographic data files...\n');

const absCensusSuburb = JSON.parse(fs.readFileSync('./data/abs_census_by_suburb.json', 'utf-8'));
const absCensusSA2 = JSON.parse(fs.readFileSync('./data/abs_census_by_sa2.json', 'utf-8'));
const suburbSA2Mapping = require('./data/suburb-sa2-mapping.js');

// Try to load SSC and SA3 data if they exist
let absCensusSSC = {};
let absCensusSA3 = {};

try {
  if (fs.existsSync('./data/abs_census_by_ssc.json')) {
    absCensusSSC = JSON.parse(fs.readFileSync('./data/abs_census_by_ssc.json', 'utf-8'));
    console.log(`✓ Loaded abs_census_by_ssc.json (${Object.keys(absCensusSSC).length} records)`);
  } else {
    console.log('⚠️  abs_census_by_ssc.json not found (Step 1 will be skipped)');
  }
} catch (e) {
  console.log('⚠️  Could not load abs_census_by_ssc.json:', e.message);
}

try {
  if (fs.existsSync('./data/abs_census_by_sa3.json')) {
    absCensusSA3 = JSON.parse(fs.readFileSync('./data/abs_census_by_sa3.json', 'utf-8'));
    console.log(`✓ Loaded abs_census_by_sa3.json (${Object.keys(absCensusSA3).length} records)`);
  } else {
    console.log('⚠️  abs_census_by_sa3.json not found (Step 3 will be skipped)');
  }
} catch (e) {
  console.log('⚠️  Could not load abs_census_by_sa3.json');
}

console.log(`✓ Loaded suburb-sa2-mapping.js (${Object.keys(suburbSA2Mapping).length} mappings)`);
console.log(`✓ Loaded abs_census_by_suburb.json (${Object.keys(absCensusSuburb).length} records)`);
console.log(`✓ Loaded abs_census_by_sa2.json (${Object.keys(absCensusSA2).length} records)\n`);

// Connect to database
const db = new sqlite3.Database('./suburbs.db', (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
});

let stats = {
  totalProcessed: 0,
  step1_direct_SSC: 0,
  step2_SA2_inherited: 0,
  step3_SA3_inherited: 0,
  step4_state_average: 0,
  errors: 0,
  derivationChain: []
};

db.serialize(() => {
  console.log('🔍 Processing all unique suburbs...\n');

  db.all(
    `SELECT DISTINCT ssc, suburb_name, state FROM suburbs WHERE ssc IS NOT NULL ORDER BY suburb_name, state`,
    (err, rows) => {
      if (err) {
        console.error('❌ Query error:', err.message);
        process.exit(1);
      }

      console.log(`Found ${rows.length} unique suburbs to process\n`);

      // Create or replace temp results table
      db.run(`
        CREATE TABLE IF NOT EXISTS demographic_derivation_results (
          ssc VARCHAR(5) PRIMARY KEY,
          suburb_name VARCHAR(255),
          state VARCHAR(3),
          population INTEGER,
          median_age REAL,
          household_size REAL,
          median_income INTEGER,
          employment_rate REAL,
          data_source VARCHAR(50),
          geography_level VARCHAR(20),
          inherited BOOLEAN,
          inherited_from VARCHAR(50),
          derivation_step INTEGER,
          chain_description VARCHAR(255),
          processed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run('BEGIN TRANSACTION;');

      let processedCount = 0;

      rows.forEach((row) => {
        const { ssc, suburb_name, state } = row;
        const suburbKey = `${suburb_name.toUpperCase()}|${state}`;
        let metrics = null;
        let derivation = {
          ssc,
          suburb_name,
          state,
          step: 0,
          chain: [],
          dataSource: null,
          geographyLevel: null,
          inherited: false,
          inheritedFrom: null
        };

        // STEP 1: Direct SSC Match
        if (metrics === null && Object.keys(absCensusSSC).length > 0) {
          if (absCensusSSC[ssc]) {
            metrics = absCensusSSC[ssc];
            derivation.step = 1;
            derivation.chain.push('STEP 1: Direct SSC census match found');
            derivation.dataSource = 'ABS_CENSUS_2021';
            derivation.geographyLevel = 'SSC';
            derivation.inherited = false;
            derivation.inheritedFrom = ssc;
            stats.step1_direct_SSC++;
          }
        }

        // STEP 2: SA2 Inheritance
        if (metrics === null) {
          const sa2Code = suburbSA2Mapping[suburbKey];
          if (sa2Code && absCensusSA2[sa2Code]) {
            const sa2Data = absCensusSA2[sa2Code];
            metrics = {
              population: sa2Data.population || 10000,
              medianAge: sa2Data.medianAge || 38,
              householdSize: sa2Data.householdSize || 2.6,
              medianIncome: sa2Data.medianIncome || 75000,
              employmentRate: (sa2Data.employmentRate || 65) / 100
            };
            derivation.step = 2;
            derivation.chain.push(`STEP 2: SA2 ${sa2Code} lookup successful`);
            derivation.dataSource = 'ABS_CENSUS_2021';
            derivation.geographyLevel = 'SA2';
            derivation.inherited = true;
            derivation.inheritedFrom = `SA2_${sa2Code}`;
            stats.step2_SA2_inherited++;
          }
        }

        // STEP 3: SA3 Inheritance (if available and SA2 failed)
        if (metrics === null && Object.keys(absCensusSA3).length > 0) {
          // Note: Would need SA2→SA3 mapping or SSC→SA3 mapping for this
          // For now, this is a placeholder
          derivation.chain.push('STEP 3: SA3 lookup not implemented (no SSC→SA3 mapping)');
        }

        // STEP 4: State Average Fallback
        if (metrics === null) {
          // Use pre-calculated state average
          const stateAverages = {
            NSW: { population: 20082, medianAge: 35.8, householdSize: 2.5, medianIncome: 76023, employmentRate: 0.696 },
            VIC: { population: 17206, medianAge: 34, householdSize: 2.2, medianIncome: 76053, employmentRate: 0.712 },
            QLD: { population: 30057, medianAge: 35.6, householdSize: 2.4, medianIncome: 71995, employmentRate: 0.705 },
            WA: { population: 28197, medianAge: 36.5, householdSize: 2.4, medianIncome: 75130, employmentRate: 0.698 },
            SA: { population: 23851, medianAge: 37.8, householdSize: 2.2, medianIncome: 66787, employmentRate: 0.653 },
            TAS: { population: 30678, medianAge: 41, householdSize: 2.3, medianIncome: 58335, employmentRate: 0.645 },
            ACT: { population: 61901, medianAge: 37.5, householdSize: 2.6, medianIncome: 80500, employmentRate: 0.738 },
            NT: { population: 27012, medianAge: 34, householdSize: 2.7, medianIncome: 66000, employmentRate: 0.662 }
          };

          const stateAvg = stateAverages[state] || stateAverages['NSW'];
          metrics = stateAvg;
          derivation.step = 4;
          derivation.chain.push(`STEP 4: No ABS data found - using ${state} state average`);
          derivation.dataSource = 'STATE_AVERAGE';
          derivation.geographyLevel = 'STATE';
          derivation.inherited = true;
          derivation.inheritedFrom = state;
          stats.step4_state_average++;
        }

        if (!metrics) {
          console.error(`  ❌ ${suburbKey}: Could not derive metrics`);
          stats.errors++;
          return;
        }

        // Insert into results table
        const sql = `
          INSERT OR REPLACE INTO demographic_derivation_results
          (ssc, suburb_name, state, population, median_age, household_size, 
           median_income, employment_rate, data_source, geography_level, 
           inherited, inherited_from, derivation_step, chain_description)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.run(
          sql,
          [
            ssc, suburb_name, state,
            metrics.population, metrics.medianAge, metrics.householdSize,
            metrics.medianIncome, metrics.employmentRate,
            derivation.dataSource, derivation.geographyLevel,
            derivation.inherited ? 1 : 0, derivation.inheritedFrom,
            derivation.step,
            derivation.chain.join(' → ')
          ],
          (err) => {
            if (err) {
              console.error(`  ❌ Error processing ${suburbKey}:`, err.message);
              stats.errors++;
            }
          }
        );

        stats.derivationChain.push(derivation);
        processedCount++;

        if (processedCount % 2000 === 0) {
          console.log(`  Progress: ${processedCount}/${rows.length}`);
        }

        if (processedCount === rows.length) {
          setTimeout(() => {
            db.run('COMMIT;', (err) => {
              if (err) {
                console.error('❌ Transaction commit failed:', err.message);
                process.exit(1);
              }
              console.log('\n✅ Derivation complete! Results in demographic_derivation_results table\n');
              printSummaryReport();
            });
          }, 500);
        }
      });
    }
  );
});

function printSummaryReport() {
  console.log('='.repeat(80));
  console.log('📊 DEMOGRAPHIC DERIVATION SUMMARY');
  console.log('='.repeat(80) + '\n');

  const totalDerived = stats.step1_direct_SSC + stats.step2_SA2_inherited + stats.step3_SA3_inherited + stats.step4_state_average;

  console.log('Step Distribution:');
  console.log(`  STEP 1 (Direct SSC Match):    ${stats.step1_direct_SSC.toLocaleString()} suburbs (${((stats.step1_direct_SSC / totalDerived) * 100).toFixed(1)}%)`);
  console.log(`  STEP 2 (SA2 Inherited):       ${stats.step2_SA2_inherited.toLocaleString()} suburbs (${((stats.step2_SA2_inherited / totalDerived) * 100).toFixed(1)}%)`);
  console.log(`  STEP 3 (SA3 Inherited):       ${stats.step3_SA3_inherited.toLocaleString()} suburbs`);
  console.log(`  STEP 4 (State Average):       ${stats.step4_state_average.toLocaleString()} suburbs (${((stats.step4_state_average / totalDerived) * 100).toFixed(1)}%)`);
  console.log(`  Errors:                       ${stats.errors}\n`);

  console.log('Data Quality Notes:');
  console.log(`  ✓ ${stats.step1_direct_SSC.toLocaleString()} suburbs have TRUE census data at SSC level`);
  console.log(`  ✓ ${stats.step2_SA2_inherited.toLocaleString()} suburbs inherit from parent SA2 (geographically valid)`);
  console.log(`  ⚠️  ${stats.step4_state_average.toLocaleString()} suburbs use state averages (flag for review)\n`);

  // Show sample derivations
  console.log('Sample Derivation Chains:\n');
  const sampleIndices = [0, Math.floor(stats.derivationChain.length / 5), Math.floor(stats.derivationChain.length / 2), Math.floor(stats.derivationChain.length * 0.75)];
  
  sampleIndices.forEach(idx => {
    if (stats.derivationChain[idx]) {
      const d = stats.derivationChain[idx];
      console.log(`${d.suburb_name}, ${d.state} (SSC ${d.ssc})`);
      console.log(`  Source: ${d.dataSource} | Level: ${d.geographyLevel} | Inherited: ${d.inherited}`);
      console.log(`  ${d.chain.join(' → ')}\n`);
    }
  });

  console.log('Next Steps:');
  console.log('  1. Review demographic_derivation_results table');
  console.log('  2. Identify suburbs in STEP 4 (state average) for manual review');
  console.log('  3. Source missing SSC-level or SA3 data from ABS');
  console.log('  4. Import results into suburb_demographics table when ready\n');

  console.log('='.repeat(80) + '\n');

  db.close();
}
