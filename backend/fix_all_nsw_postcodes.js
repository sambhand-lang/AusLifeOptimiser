/**
 * Script: Bulk fix postcodes for all NSW suburbs using SSC mapping
 * Run in VS Code terminal: node fix_all_nsw_postcodes.js
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const dbFile = './suburbs.db'; // adjust if needed
const sscPostcodeFile = './ssc_postcodes_nsw.json'; // your SSC→postcode JSON

// Load SSC → postcode mapping
// Example format: { "10706": 2150, "10707": 2151, "10654": 2026, ... }
const sscPostcodes = JSON.parse(fs.readFileSync(sscPostcodeFile, 'utf-8'));

console.log(`📍 Loaded ${Object.keys(sscPostcodes).length} SSC mappings\n`);

const db = new sqlite3.Database(dbFile, (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to suburbs.db\n');
});

db.serialize(() => {
  db.run('BEGIN TRANSACTION;', (err) => {
    if (err) console.error('Transaction start error:', err);
  });

  let totalUpdated = 0;
  let processedCount = 0;
  let sscCount = Object.keys(sscPostcodes).length;

  Object.entries(sscPostcodes).forEach(([ssc, postcode]) => {
    const sql = `
      UPDATE suburbs
      SET postcode = ?
      WHERE ssc = ? AND state = 'NSW' AND (postcode IS NULL OR postcode = '');
    `;
    db.run(sql, [postcode, ssc], function (err) {
      processedCount++;
      
      if (err) {
        console.error(`❌ Error updating SSC ${ssc}:`, err.message);
      } else {
        if (this.changes > 0) {
          totalUpdated += this.changes;
          console.log(`  SSC ${ssc}: Updated ${this.changes} record(s) to postcode ${postcode}`);
        }
      }

      // When all are processed, commit
      if (processedCount === sscCount) {
        db.run('COMMIT;', (err) => {
          if (err) {
            console.error('\n❌ Commit failed:', err.message);
            process.exit(1);
          }
          console.log(`\n✅ Transaction committed!`);
          console.log(`📊 Total updates: ${totalUpdated} records`);
          
          // Final verification
          db.get('SELECT COUNT(*) as count FROM suburbs WHERE state = "NSW" AND (postcode IS NULL OR postcode = "")', (err, row) => {
            if (!err) {
              console.log(`✓ Remaining NSW suburbs without postcode: ${row.count}`);
            }
            db.close();
          });
        });
      }
    });
  });
});
