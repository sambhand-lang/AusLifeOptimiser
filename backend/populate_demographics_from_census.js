/**
 * Script: Populate ABS Demographics from Census by Suburb
 * Purpose: Use abs_census_by_suburb.json to fill suburb_demographics with actual data
 * 
 * Process:
 * 1. Load abs_census_by_suburb.json (SUBURB|STATE format with metrics)
 * 2. For each suburb in the database, look up its metrics
 * 3. Insert/update suburb_demographics with actual census data
 * 4. For suburbs not in census file, use a simple state average fallback
 * 
 * Run: node populate_demographics_from_census.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('📚 Loading ABS census data by suburb...\n');

// Load suburb census data
const censusData = JSON.parse(fs.readFileSync('./data/abs_census_by_suburb.json', 'utf-8'));

console.log(`✓ Loaded ${Object.keys(censusData).length} suburb records from ABS census\n`);

// Connect to database
const db = new sqlite3.Database('./suburbs.db', (err) => {
  if (err) {
    console.error('❌ Failed to open database:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to suburbs.db\n');
});

let stats = {
  totalSuburbs: 0,
  insertedWithActualData: 0,
  insertedWithFallback: 0,
  errorCount: 0,
  stateAverages: {}
};

db.serialize(() => {
  // First pass: calculate state averages for fallback
  console.log('📊 Calculating state averages for fallback...\n');
  
  const stateMetrics = {};
  
  Object.entries(censusData).forEach(([key, data]) => {
    const [suburb, state] = key.split('|');
    if (!stateMetrics[state]) {
      stateMetrics[state] = {
        population: 0,
        medianAge: 0,
        householdSize: 0,
        medianIncome: 0,
        employmentRate: 0,
        count: 0
      };
    }
    
    stateMetrics[state].population += data.population || 10000;
    stateMetrics[state].medianAge += data.medianAge || 38;
    stateMetrics[state].householdSize += data.householdSize || 2.6;
    stateMetrics[state].medianIncome += data.medianIncome || 75000;
    stateMetrics[state].employmentRate += (data.employmentRate || 65);
    stateMetrics[state].count++;
  });
  
  // Calculate averages
  for (const state in stateMetrics) {
    const count = stateMetrics[state].count;
    stateMetrics[state] = {
      population: Math.round(stateMetrics[state].population / count),
      medianAge: Math.round(stateMetrics[state].medianAge / count * 10) / 10,
      householdSize: Math.round(stateMetrics[state].householdSize / count * 10) / 10,
      medianIncome: Math.round(stateMetrics[state].medianIncome / count),
      employmentRate: (stateMetrics[state].employmentRate / count) / 100
    };
    console.log(`  ${state}: Avg Pop=${stateMetrics[state].population}, Age=${stateMetrics[state].medianAge}, HS=${stateMetrics[state].householdSize}`);
  }
  
  console.log('\n📋 Processing all suburbs from database...\n');
  
  db.run('BEGIN TRANSACTION;');
  
  // Get all unique suburbs
  db.all(
    `SELECT DISTINCT ssc, suburb_name, state FROM suburbs WHERE ssc IS NOT NULL ORDER BY suburb_name, state`,
    (err, rows) => {
      if (err) {
        console.error('❌ Query error:', err.message);
        process.exit(1);
      }
      
      console.log(`Found ${rows.length} unique suburbs to process\n`);
      
      let processedCount = 0;
      const sql = `
        INSERT OR REPLACE INTO suburb_demographics 
        (ssc, suburb_name, state, population, median_age, household_size, 
         median_income, employment_rate, source, imputed, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      rows.forEach((row, idx) => {
        const { ssc, suburb_name, state } = row;
        const suburbKey = `${suburb_name.toUpperCase()}|${state}`;
        
        let metrics;
        let source;
        let imputed;
        
        // Try to find in census data
        if (censusData[suburbKey]) {
          const censusRecord = censusData[suburbKey];
          metrics = {
            population: censusRecord.population || 10000,
            medianAge: censusRecord.medianAge || 38,
            householdSize: censusRecord.householdSize || 2.6,
            medianIncome: censusRecord.medianIncome || 75000,
            employmentRate: (censusRecord.employmentRate || 65) / 100
          };
          source = 'ABS_CENSUS_2021';
          imputed = false;
          stats.insertedWithActualData++;
        } else {
          // Use state average as fallback
          const stateAvg = stateMetrics[state] || {
            population: 20000, medianaAge: 36, householdSize: 2.6, medianIncome: 70000, employmentRate: 0.68
          };
          metrics = stateAvg;
          source = `STATE_AVERAGE:${state}`;
          imputed = true;
          stats.insertedWithFallback++;
        }
        
        db.run(
          sql,
          [ssc, suburb_name, state, metrics.population, metrics.medianAge,
           metrics.householdSize, metrics.medianIncome, metrics.employmentRate,
           source, imputed ? 1 : 0],
          (err) => {
            if (err) {
              console.error(`❌ Error for ${suburbKey}:`, err.message);
              stats.errorCount++;
            }
            
            processedCount++;
            if (processedCount % 500 === 0) {
              console.log(`  Progress: ${processedCount}/${rows.length}`);
            }
            
            // Final callback after all processed
            if (processedCount === rows.length) {
              setTimeout(() => {
                db.run('COMMIT;', (err) => {
                  if (err) {
                    console.error('❌ Transaction commit failed:', err.message);
                    process.exit(1);
                  }
                  console.log('\n✅ Transaction committed!\n');
                  printFinalReport();
                });
              }, 1000);
            }
          }
        );
      });
    }
  );
});

function printFinalReport() {
  console.log('\n' + '='.repeat(70));
  console.log('📋 DEMOGRAPHICS POPULATION REPORT');
  console.log('='.repeat(70) + '\n');
  
  console.log(`Total suburbs processed:        ${stats.insertedWithActualData + stats.insertedWithFallback}`);
  console.log(`With actual census data:        ${stats.insertedWithActualData}`);
  console.log(`With state average (fallback):  ${stats.insertedWithFallback}`);
  console.log(`Errors:                         ${stats.errorCount}`);
  console.log('\n' + '-'.repeat(70) + '\n');
  
  // Verification queries
  console.log('📊 Database verification:\n');
  
  db.get('SELECT COUNT(*) as total FROM suburb_demographics', (err, row) => {
    if (!err) {
      console.log(`  Total records in suburb_demographics: ${row.total.toLocaleString()}`);
    }
    
    db.get(
      `SELECT COUNT(*) as with_real FROM suburb_demographics WHERE source LIKE 'ABS_%'`,
      (err, row) => {
        if (!err) {
          console.log(`  Records with ABS census data:       ${row.with_real.toLocaleString()}`);
        }
        
        db.get(
          `SELECT COUNT(*) as with_fallback FROM suburb_demographics WHERE imputed = 1`,
          (err, row) => {
            if (!err) {
              console.log(`  Records with fallback metrics:      ${row.with_fallback.toLocaleString()}`);
            }
            
            // Sample queries
            console.log('\n' + '-'.repeat(70) + '\n');
            console.log('📍 Sample records:\n');
            
            db.all(
              `SELECT suburb_name, state, population, median_age, employment_rate, source 
               FROM suburb_demographics 
               WHERE source LIKE 'ABS_%' 
               LIMIT 5`,
              (err, rows) => {
                if (!err) {
                  rows.forEach(r => {
                    console.log(`  ${r.suburb_name}, ${r.state}`);
                    console.log(`    Population: ${r.population.toLocaleString()}, Median Age: ${r.median_age}, Employment: ${Math.round(r.employment_rate * 100)}%`);
                    console.log(`    Source: ${r.source}\n`);
                  });
                }
                
                db.close((err) => {
                  if (err) console.error('Error closing database:', err.message);
                  console.log('\n✅ Complete!\n');
                });
              }
            );
          }
        );
      }
    );
  });
}
