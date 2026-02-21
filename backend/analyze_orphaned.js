#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

console.log('\n=== ANALYZING ORPHANED RECORDS (59.2% without SSC) ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Identify orphaned records
db.all(`
  SELECT 
    COUNT(*) as total_orphaned,
    COUNT(CASE WHEN postcode IS NULL THEN 1 END) as null_postcode,
    COUNT(CASE WHEN postcode = '' THEN 1 END) as empty_postcode,
    COUNT(CASE WHEN postcode IS NOT NULL AND postcode != '' THEN 1 END) as has_postcode
  FROM suburbs
  WHERE ssc IS NULL
`, (err, orphaned) => {
  if (orphaned && orphaned[0]) {
    const o = orphaned[0];
    console.log(`Total orphaned records: ${o.total_orphaned}`);
    console.log(`  - With NULL postcode: ${o.null_postcode}`);
    console.log(`  - With empty '' postcode: ${o.empty_postcode}`);
    console.log(`  - With postcode value: ${o.has_postcode}\n`);
  }

  // Sample orphaned records with postcodes (these should have been matched!)
  db.all(`
    SELECT state, suburb_name, postcode, COUNT(*) as copies
    FROM suburbs
    WHERE ssc IS NULL AND postcode IS NOT NULL AND postcode != ''
    GROUP BY state, suburb_name, postcode
    ORDER BY copies DESC
    LIMIT 10
  `, (err, samples) => {
    if (samples && samples.length > 0) {
      console.log('Orphaned records with valid postcodes (should\'ve matched):\n');
      samples.forEach(s => {
        console.log(`  ${s.state} | ${s.suburb_name.padEnd(30)} | ${s.postcode} | copies: ${s.copies}`);
      });
      console.log('\nThese suggest case-sensitivity or whitespace issues in suburb names.\n');
    }

    // Check for NULL/empty postcodes by state
    db.all(`
      SELECT 
        state,
        COUNT(*) as without_ssc,
        COUNT(CASE WHEN postcode IS NULL OR postcode = '' THEN 1 END) as invalid_postcode
      FROM suburbs
      WHERE ssc IS NULL
      GROUP BY state
      ORDER BY state
    `, (err, byState) => {
      if (byState && byState.length > 0) {
        console.log('Orphaned records by state:\n');
        byState.forEach(s => {
          const pct = ((s.invalid_postcode / s.without_ssc) * 100).toFixed(1);
          console.log(`  ${s.state}: ${s.without_ssc} orphaned (${pct}% have invalid postcode)`);
        });
      }

      console.log('\n=== RECOMMENDATION ===\n');
      console.log('Two categories of orphaned records:\n');
      console.log('1. Records with invalid/missing postcodes: DELETE (can\'t canonicalize)');
      console.log('2. Records with valid postcodes: FIX (case/whitespace mismatch in suburb names)\n');
      console.log('Next: Review and clean these before finalizing migration.\n');

      db.close();
    });
  });
});
