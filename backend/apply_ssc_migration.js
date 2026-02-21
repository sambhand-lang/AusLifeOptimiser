#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('\n=== APPLYING SSC MIGRATION ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Step 1: Check current schema
console.log('Step 1: Checking current schema...\n');

db.all("PRAGMA table_info(suburbs)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  const hasSSC = columns.some(c => c.name === 'ssc');
  console.log(`Columns: ${columns.map(c => c.name).join(', ')}`);
  console.log(`Has SSC column: ${hasSSC ? '✓' : '✗ (will add)'}\n`);

  // Step 2: Add SSC column if missing
  if (!hasSSC) {
    console.log('Step 2: Adding SSC column...\n');
    db.run('ALTER TABLE suburbs ADD COLUMN ssc VARCHAR(5)', (err) => {
      if (err) {
        console.error('Error adding column:', err);
        db.close();
        return;
      }
      console.log('✓ SSC column added\n');
      populateSSC();
    });
  } else {
    console.log('Step 2: SSC column already exists\n');
    populateSSC();
  }
});

function populateSSC() {
  // Load canonical registry with SSC
  const registryFile = path.join(__dirname, 'data', 'canonical_suburbs_with_ssc.json');
  const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));

  console.log('Step 3: Populating SSC values...\n');

  const suburbs = registry.canonicalSuburbs;
  let updated = 0;
  let skipped = 0;

  // Process each suburb
  const processSuburbs = (index) => {
    if (index >= suburbs.length) {
      console.log(`\n✓ Populated ${updated} records with SSC`);
      console.log(`✓ Skipped ${skipped} records (already have SSC)\n`);
      
      // Step 4: Add constraints
      console.log('Step 4: Creating indexes...\n');
      db.run('CREATE INDEX IF NOT EXISTS idx_ssc ON suburbs(ssc)', (err) => {
        if (err) console.error('Index error:', err);
        else console.log('✓ Created index on ssc\n');

        // Step 5: Create unique constraint on canonical key
        console.log('Step 5: Adding canonical key constraint...\n');
        db.run(`
          CREATE UNIQUE INDEX IF NOT EXISTS unique_suburb_key 
          ON suburbs(state, suburb_name, postcode)
        `, (err) => {
          if (err) console.error('Constraint error:', err);
          else console.log('✓ Created unique constraint on (state, suburb_name, postcode)\n');

          // Final stats
          console.log('Step 6: Final statistics...\n');
          db.all(`
            SELECT state, COUNT(*) as total, COUNT(ssc) as with_ssc
            FROM suburbs
            GROUP BY state
            ORDER BY state
          `, (err, stats) => {
            if (stats) {
              console.log('SSC Population by State:\n');
              let totalAll = 0, totalSSC = 0;
              stats.forEach(s => {
                const pct = ((s.with_ssc / s.total) * 100).toFixed(1);
                console.log(`  ${s.state}: ${s.with_ssc}/${s.total} (${pct}%)`);
                totalAll += s.total;
                totalSSC += s.with_ssc;
              });
              const totalPct = ((totalSSC / totalAll) * 100).toFixed(1);
              console.log(`\nTotal: ${totalSSC}/${totalAll} (${totalPct}%)\n`);
            }

            console.log('=== MIGRATION COMPLETE ===\n');
            console.log('Next steps:');
            console.log('  1. Remove duplicate (suburb_name, postcode) combinations');
            console.log('  2. Verify data integrity');
            console.log('  3. Delete orphaned postcode combinations (keep only first for each suburb)\n');

            db.close();
          });
        });
      });
    } else {
      const sub = suburbs[index];

      // Check if already populated
      db.get(
        'SELECT ssc FROM suburbs WHERE state = ? AND suburb_name = ? AND postcode = ? LIMIT 1',
        [sub.state, sub.suburb, sub.primary_postcode],
        (err, row) => {
          if (row && row.ssc) {
            skipped++;
            processSuburbs(index + 1);
          } else {
            db.run(
              'UPDATE suburbs SET ssc = ? WHERE state = ? AND suburb_name = ? AND postcode = ?',
              [sub.ssc, sub.state, sub.suburb, sub.primary_postcode],
              function(err) {
                if (err) {
                  console.error(`Error updating ${sub.state}|${sub.suburb}: ${err}`);
                } else {
                  updated += this.changes;
                }
                processSuburbs(index + 1);
              }
            );
          }
        }
      );
    }
  };

  processSuburbs(0);
}
