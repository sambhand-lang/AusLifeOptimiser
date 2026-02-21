/**
 * Generate SSC → Postcode mapping for NSW
 * Creates ssc_postcodes_nsw.json from suburb_postcodes table
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbFile = './suburbs.db';

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to suburbs.db\n');
});

db.serialize(() => {
  // Query: Get SSC → postcode mapping for NSW suburbs
  // Take first postcode if multiple are available (comma-separated)
  db.all(`
    SELECT DISTINCT
      sp.ssc,
      SUBSTR(sp.postcodes, 1, INSTR(sp.postcodes || ',', ',') - 1) as postcode
    FROM suburb_postcodes sp
    INNER JOIN suburbs s ON sp.ssc = s.ssc
    WHERE s.state = 'NSW' AND sp.postcodes IS NOT NULL
    ORDER BY sp.ssc
  `, (err, rows) => {
    if (err) {
      console.error('Query error:', err.message);
      db.close();
      process.exit(1);
    }

    console.log(`📊 Found ${rows.length} NSW SSC → postcode mappings\n`);

    // Build mapping object
    const mapping = {};
    rows.forEach(row => {
      mapping[row.ssc] = parseInt(row.postcode, 10);
    });

    // Show sample
    console.log('📋 Sample mappings:');
    Object.entries(mapping)
      .slice(0, 10)
      .forEach(([ssc, postcode]) => {
        console.log(`  SSC ${ssc} → ${postcode}`);
      });

    // Write to file
    const outputFile = path.join(__dirname, 'ssc_postcodes_nsw.json');
    fs.writeFileSync(outputFile, JSON.stringify(mapping, null, 2));
    console.log(`\n✓ Wrote mapping to ${outputFile}`);
    console.log(`  Total mappings: ${Object.keys(mapping).length}`);

    db.close();
  });
});
