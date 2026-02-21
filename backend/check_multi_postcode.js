#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

console.log('\n=== CHECKING FOR MULTI-POSTCODE SUBURBS ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Check: Do any (state, suburb_name) have multiple postcodes in the raw data?
db.all(`
  SELECT 
    state,
    suburb_name,
    COUNT(DISTINCT postcode) as postcode_count,
    GROUP_CONCAT(DISTINCT postcode) as postcodes
  FROM suburbs
  WHERE postcode IS NOT NULL AND postcode != ''
  GROUP BY state, suburb_name
  HAVING COUNT(DISTINCT postcode) > 1
  ORDER BY postcode_count DESC
  LIMIT 20
`, (err, multis) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Suburbs with multiple postcodes in raw data:\n');
  
  if (multis && multis.length > 0) {
    console.log(`Found: ${multis.length} suburbs with multiple postcodes\n`);
    multis.slice(0, 10).forEach(m => {
      console.log(`  ${m.state} | ${m.suburb_name.padEnd(30)} | ${m.postcode_count} postcodes`);
      console.log(`    → ${m.postcodes}\n`);
    });

    console.log('✓ This confirms some suburbs DO span multiple postcodes');
    console.log('✓ We need to rebuild suburb_postcodes to capture ALL variants\n');
  } else {
    console.log('No suburbs with multiple postcodes found');
    console.log('✓ Current setup is correct - each suburb has one postcode\n');
  }

  // Get count
  db.get(`
    SELECT COUNT(*) as multi_postcode_count
    FROM (
      SELECT state, suburb_name
      FROM suburbs
      WHERE postcode IS NOT NULL AND postcode != ''
      GROUP BY state, suburb_name
      HAVING COUNT(DISTINCT postcode) > 1
    )
  `, (err, result) => {
    if (result) {
      console.log(`Total multi-postcode suburb identities: ${result.multi_postcode_count}\n`);
    }

    db.close();
  });
});
