/**
 * Fix Invalid Postcodes - Parramatta & North Parramatta
 * Corrects mismatched postcodes caused by data migration
 */

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./suburbs.db', (err) => {
  if (err) {
    console.error('Failed to open DB:', err.message);
    process.exit(1);
  }
  console.log('✓ Connected to suburbs.db\n');
});

db.serialize(() => {
  console.log('📍 Starting postcode correction transaction...\n');
  
  db.run('BEGIN TRANSACTION;');

  // Define corrections: SSC → correct postcode
  const corrections = {
    '13610': 2151,  // NORTH PARRAMATTA: 1750 → 2151
    '13804': 2150,  // PARRAMATTA: 1740 → 2150
    '13805': 2150,  // PARRAMATTA: 1741 → 2150
    '13806': 2150,  // PARRAMATTA: 2123 → 2150 (alternative)
    '13807': 2150   // PARRAMATTA: 2124 → 2150 (alternative)
  };

  let totalUpdated = 0;

  // 1. Fix suburbs table
  console.log('Fixing suburbs table...');
  Object.entries(corrections).forEach(([ssc, correctPostcode]) => {
    const sql = `UPDATE suburbs SET postcode = ? WHERE ssc = ?`;
    db.run(sql, [correctPostcode, ssc], function(err) {
      if (err) {
        console.error(`  ❌ Error for SSC ${ssc}:`, err.message);
      } else if (this.changes > 0) {
        console.log(`  ✓ SSC ${ssc}: Updated ${this.changes} record(s) to postcode ${correctPostcode}`);
        totalUpdated += this.changes;
      }
    });
  });

  // 2. Fix suburb_postcodes table
  console.log('\nFixing suburb_postcodes table...');
  Object.entries(corrections).forEach(([ssc, correctPostcode]) => {
    const sql = `UPDATE suburb_postcodes SET postcodes = ? WHERE ssc = ?`;
    db.run(sql, [String(correctPostcode), ssc], function(err) {
      if (err) {
        console.error(`  ❌ Error for SSC ${ssc}:`, err.message);
      } else if (this.changes > 0) {
        console.log(`  ✓ SSC ${ssc}: Corrected mapping to ${correctPostcode}`);
      }
    });
  });

  // Commit transaction
  setTimeout(() => {
    db.run('COMMIT;', (err) => {
      if (err) {
        console.error('\n❌ Commit failed:', err.message);
        process.exit(1);
      }
      console.log(`\n✅ Transaction committed!`);
      console.log(`📊 Total records corrected: ${totalUpdated}\n`);

      // Verification
      console.log('📋 Verification - Final state:');
      db.all(
        `SELECT ssc, suburb_name, postcode FROM suburbs 
         WHERE UPPER(suburb_name) IN ('PARRAMATTA', 'NORTH PARRAMATTA') 
         GROUP BY ssc ORDER BY suburb_name, ssc`,
        (err, rows) => {
          if (!err) {
            rows.forEach(row => {
              console.log(`  ${row.suburb_name} (SSC ${row.ssc}): ${row.postcode}`);
            });
          }
          db.close();
        }
      );
    });
  }, 100);
});
