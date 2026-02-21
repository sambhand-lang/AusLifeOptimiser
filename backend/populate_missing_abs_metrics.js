/**
 * Script: Populate Missing ABS Demographics from Parent SA2s
 * Purpose: For suburbs without direct ABS metrics, inherit from their parent SA2
 * 
 * Process:
 * 1. Read suburb→SA2 mapping from suburb-sa2-mapping.js
 * 2. Read SA2 metrics from abs_census_by_sa2.json
 * 3. For each unique SSC in suburbs table:
 *    - Find its suburb_name and state
 *    - Look up parent SA2 code
 *    - Fetch SA2 metrics
 *    - Create/update suburb_demographics record (flagged as imputed)
 * 4. Generate report showing coverage and inheritance stats
 * 
 * Run: node populate_missing_abs_metrics.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Load mappings and data files
console.log('📚 Loading suburb→SA2 mappings and ABS census data...\n');

const suburbSA2Mapping = require('./data/suburb-sa2-mapping.js');
const absCensusBySA2 = JSON.parse(fs.readFileSync('./data/abs_census_by_sa2.json', 'utf-8'));

console.log(`✓ Loaded ${Object.keys(suburbSA2Mapping).length} suburb→SA2 mappings`);
console.log(`✓ Loaded ${Object.keys(absCensusBySA2).length} SA2 census records\n`);

// Connect to database
const db = new sqlite3.Database('./suburbs.db', (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to suburbs.db\n');
});

let stats = {
  totalProcessed: 0,
  inserted: 0,
  updated: 0,
  skipped: 0,
  missingMapping: 0,
  missingSA2Data: 0,
  errorCount: 0,
  inheritedRecords: []
};

db.serialize(() => {
  console.log('🔍 Fetching all unique suburbs from database...\n');

  // Get all unique SSCs with suburb_name and state
  db.all(
    `SELECT DISTINCT ssc, suburb_name, state 
     FROM suburbs 
     WHERE ssc IS NOT NULL 
     ORDER BY suburb_name, state`,
    (err, rows) => {
      if (err) {
        console.error('❌ Query error:', err.message);
        process.exit(1);
      }

      console.log(`📊 Found ${rows.length} unique suburbs to process\n`);
      console.log('Processing suburbs...\n');

      db.run('BEGIN TRANSACTION;');

      // Process each suburb
      let processedCount = 0;
      for (const row of rows) {
        const { ssc, suburb_name, state } = row;
        const suburbKey = `${suburb_name.toUpperCase()}|${state}`;

        stats.totalProcessed++;

        // Find parent SA2
        const sa2Code = suburbSA2Mapping[suburbKey];
        if (!sa2Code) {
          console.log(`  ⚠️  ${suburbKey}: No SA2 mapping found`);
          stats.missingMapping++;
          continue;
        }

        // Get SA2 metrics
        const sa2Data = absCensusBySA2[sa2Code];
        if (!sa2Data) {
          console.log(`  ⚠️  ${suburbKey}: SA2 ${sa2Code} data not found in census file`);
          stats.missingSA2Data++;
          continue;
        }

        // Convert case and prepare metrics
        const metrics = {
          population: sa2Data.population || 10000,
          medianAge: sa2Data.medianAge || 38,
          householdSize: sa2Data.householdSize || 2.6,
          medianIncome: sa2Data.medianIncome || 75000,
          employmentRate: (sa2Data.employmentRate || 65) / 100, // convert percentage to decimal
          source: `SA2:${sa2Code}`,
          imputed: true
        };

        // Insert or replace in suburb_demographics
        const sql = `
          INSERT OR REPLACE INTO suburb_demographics 
          (ssc, suburb_name, state, population, median_age, household_size, 
           median_income, employment_rate, source, imputed, last_updated)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;

        db.run(
          sql,
          [ssc, suburb_name, state, metrics.population, metrics.medianAge, 
           metrics.householdSize, metrics.medianIncome, metrics.employmentRate,
           metrics.source, metrics.imputed ? 1 : 0],
          function (err) {
            if (err) {
              console.error(`  ❌ Error processing ${suburbKey}:`, err.message);
              stats.errorCount++;
            } else {
              if (this.changes > 0) {
                // Determine if inserted or updated
                db.get('SELECT COUNT(*) as count FROM suburb_demographics WHERE ssc = ?', [ssc], (err, result) => {
                  if (!err && result.count === 1) {
                    stats.inserted++;
                    console.log(`  ✓ ${suburbKey} (${ssc}): Inherited metrics from SA2 ${sa2Code}`);
                    stats.inheritedRecords.push({
                      ssc,
                      suburb: suburbKey,
                      parentSA2: sa2Code,
                      population: metrics.population,
                      medianAge: metrics.medianAge
                    });
                  }
                });
              }
            }

            processedCount++;
            if (processedCount % 100 === 0) {
              console.log(`  ... processed ${processedCount}/${rows.length}`);
            }

            // After all records processed, commit transaction
            if (processedCount === rows.length) {
              setTimeout(() => {
                db.run('COMMIT;', (err) => {
                  if (err) {
                    console.error('❌ Transaction commit failed:', err.message);
                  } else {
                    console.log('\n✅ Transaction committed!\n');
                    printSummaryReport();
                  }
                });
              }, 500);
            }
          }
        );
      }
    }
  );
});

function printSummaryReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 POPULATION SUMMARY REPORT');
  console.log('='.repeat(70) + '\n');

  console.log(`Total suburbs processed:        ${stats.totalProcessed}`);
  console.log(`Successfully inserted:          ${stats.inserted}`);
  console.log(`Successfully updated:           ${stats.updated}`);
  console.log(`Skipped (no mapping):           ${stats.missingMapping}`);
  console.log(`Skipped (missing SA2 data):     ${stats.missingSA2Data}`);
  console.log(`Errors:                         ${stats.errorCount}`);
  console.log('\n' + '-'.repeat(70) + '\n');

  // Show sample inherited records
  console.log('✨ Sample inherited metrics:\n');
  const samples = stats.inheritedRecords.slice(0, 5);
  for (const record of samples) {
    console.log(`  ${record.suburb}`);
    console.log(`    ├─ SSC: ${record.ssc}`);
    console.log(`    ├─ Parent SA2: ${record.parentSA2}`);
    console.log(`    ├─ Population: ${record.population.toLocaleString()}`);
    console.log(`    └─ Median Age: ${record.medianAge}\n`);
  }

  console.log('\n📊 Database verification:\n');
  db.get('SELECT COUNT(*) as total FROM suburb_demographics', (err, row) => {
    if (!err) {
      console.log(`  Total records in suburb_demographics: ${row.total}`);
    }
    db.get(
      'SELECT COUNT(*) as imputed FROM suburb_demographics WHERE imputed = 1',
      (err, row) => {
        if (!err) {
          console.log(`  Records flagged as imputed:        ${row.imputed}`);
        }
        db.close((err) => {
          if (err) console.error('Error closing database:', err.message);
          console.log('\n✅ Complete!\n');
        });
      }
    );
  });
}
