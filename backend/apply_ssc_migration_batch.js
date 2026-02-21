#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('\n=== APPLYING SSC MIGRATION (BATCH SQL) ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Step 1: Check if SSC column exists
db.all("PRAGMA table_info(suburbs)", (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  const hasSSC = columns.some(c => c.name === 'ssc');
  console.log(`Current columns: ${columns.map(c => c.name).join(', ')}`);
  console.log(`SSC column exists: ${hasSSC ? 'YES' : 'NO (adding...)'}\n`);

  const steps = [];

  if (!hasSSC) {
    steps.push({
      name: 'Add SSC column',
      sql: 'ALTER TABLE suburbs ADD COLUMN ssc VARCHAR(5)'
    });
  }

  // Step 2: Load canonical SSC mappings and generate UPDATE statements
  const registryFile = path.join(__dirname, 'data', 'canonical_suburbs_with_ssc.json');
  const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
  const suburbs = registry.canonicalSuburbs;

  console.log(`Loaded ${suburbs.length} SSC mappings\n`);

  // Generate batch UPDATE - can't use VALUES in SQLite, so we'll use individual UPDATEs
  // But batch them together
  steps.push({
    name: 'Populate SSC values',
    batch: true,
    updates: suburbs.map(s => ({
      state: s.state,
      suburb: s.suburb,
      postcode: s.primary_postcode,
      ssc: s.ssc
    }))
  });

  steps.push({
    name: 'Create SSC index',
    sql: 'CREATE INDEX IF NOT EXISTS idx_ssc ON suburbs(ssc)'
  });

  steps.push({
    name: 'Create canonical key index',
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS idx_canonical_key 
        ON suburbs(state, suburb_name, postcode)`
  });

  // Execute steps sequentially
  const executeSteps = (stepIndex) => {
    if (stepIndex >= steps.length) {
      console.log('\n=== VERIFICATION ===\n');
      
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
          console.log(`\n  TOTAL: ${totalSSC}/${totalAll} (${totalPct}%)`);
        }

        db.all(`
          SELECT COUNT(*) as total_records,
                 COUNT(DISTINCT state, suburb_name, postcode) as canonical_count,
                 COUNT(DISTINCT ssc) as unique_ssc
          FROM suburbs
        `, (err, summary) => {
          if (summary && summary[0]) {
            console.log(`\n=== FINAL STATUS ===\n`);
            console.log(`Total records in DB: ${summary[0].total_records}`);
            console.log(`Canonical suburbs (unique key): ${summary[0].canonical_count}`);
            console.log(`Unique SSC codes: ${summary[0].unique_ssc}`);
            console.log(`\nReduction: 45,384 → ${summary[0].total_records} records`);
            console.log(`(Still has duplicates for multi-postcode suburbs)\n`);
          }

          console.log('✓ Migration complete\n');
          db.close();
        });
      });
      return;
    }

    const step = steps[stepIndex];
    console.log(`Step ${stepIndex + 1}: ${step.name}...`);

    if (step.batch) {
      // Execute batch updates
      const updates = step.updates;
      let completed = 0;

      const executeBatch = (batchIndex) => {
        if (batchIndex >= updates.length) {
          console.log(`✓ Updated ${updates.length} records with SSC\n`);
          executeSteps(stepIndex + 1);
          return;
        }

        const u = updates[batchIndex];
        db.run(
          'UPDATE suburbs SET ssc = ? WHERE state = ? AND suburb_name = ? AND postcode = ?',
          [u.ssc, u.state, u.suburb, u.postcode],
          function(err) {
            if (err) console.error(`Error: ${err}`);
            if (++completed % 1000 === 0) console.log(`  ... ${completed} records processed`);
            executeBatch(batchIndex + 1);
          }
        );
      };

      executeBatch(0);
    } else {
      // Execute single SQL statement
      db.run(step.sql, (err) => {
        if (err) {
          console.error(`✗ Error: ${err}`);
        } else {
          console.log('✓\n');
        }
        executeSteps(stepIndex + 1);
      });
    }
  };

  executeSteps(0);
});
