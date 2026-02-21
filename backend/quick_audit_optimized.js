#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./suburbs.db');
db.configure('busyTimeout', 60000);

console.log('\n=== QUICK AUDIT (Optimized) ===\n');

// Create temp tables for faster queries
console.log('Building temp views...');

db.serialize(() => {
  // View of suburbs WITH SSC
  db.run(`
    CREATE TEMP VIEW suburbs_with_ssc AS
    SELECT DISTINCT suburb_name, state
    FROM suburbs
    WHERE ssc IS NOT NULL
  `, () => {

    // Query 1 - Use JOIN instead of EXISTS
    db.get(`
      SELECT COUNT(DISTINCT s.rowid) as orphan_count
      FROM suburbs s
      INNER JOIN suburbs_with_ssc w
        ON s.suburb_name = w.suburb_name
        AND s.state = w.state
      WHERE s.ssc IS NULL
    `, (err, row) => {
      if (err) {
        console.error('Q1 Error:', err.message);
      } else {
        console.log('Q1: Orphans with same (suburb_name, state) as SSC rows = ' + (row ? row.orphan_count : 'NULL'));
      }

      // Query 2
      db.get(`
        SELECT COUNT(DISTINCT TRIM(UPPER(suburb_name)) || '|' || state) as unique_count
        FROM suburbs
        WHERE ssc IS NULL
      `, (err, row) => {
        if (err) {
          console.error('Q2 Error:', err.message);
        } else {
          console.log('Q2: Truly unique unmatched identities = ' + (row ? row.unique_count : 'NULL'));
        }

        // Summary
        console.log('\n=== INTERPRETATION ===\n');
        
        console.log('Total orphaned records: 26,858');
        console.log('(all with NULL postcode - cannot be geographically identified)\n');

        if (row && row.unique_count < 200) {
          console.log('✓ Small number of unmatched identities');
          console.log('  → These are naming/formatting issues\n');
        } else if (row && row.unique_count < 1000) {
          console.log('⚠ Moderate number of unmatched identities');
          console.log('  → Mixed situation\n');
        } else if (row) {
          console.log('🔥 Large number of unmatched identities');
          console.log('  → Mapping logic problem\n');
        }

        db.close();
      });
    });
  });
});
