#!/usr/bin/env node

console.log('\n=== BUILDING SUBURB_POSTCODES TABLE ===\n');

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./suburbs.db');
db.configure('busyTimeout', 120000);

// Execute in order: delete, insert, verify
db.serialize(() => {
  console.log('Step 1: Clearing existing data...');
  db.run('DELETE FROM suburb_postcodes');

  console.log('Step 2: Inserting all postcode variants...');
  
  // Build the insert statement inline
  const insertSQL = `
    INSERT OR IGNORE INTO suburb_postcodes (ssc, postcode, is_primary)
    WITH ranked_postcodes AS (
      SELECT 
        ssc,
        postcode,
        ROW_NUMBER() OVER (PARTITION BY ssc ORDER BY postcode ASC) as rn
      FROM (
        SELECT DISTINCT ssc, postcode
        FROM suburbs
        WHERE ssc IS NOT NULL 
          AND postcode IS NOT NULL 
          AND postcode != ''
      )
    )
    SELECT 
      ssc,
      postcode,
      CASE WHEN rn = 1 THEN 1 ELSE 0 END as is_primary
    FROM ranked_postcodes
  `;

  db.run(insertSQL, function(err) {
    if (err) {
      console.error('Insert error:', err.message);
      // Try simpler approach without WITH clause
      const simpleInsert = `
        INSERT OR IGNORE INTO suburb_postcodes (ssc, postcode, is_primary)
        SELECT DISTINCT
          ssc,
          postcode,
          0 as is_primary
        FROM suburbs
        WHERE ssc IS NOT NULL 
          AND postcode IS NOT NULL 
          AND postcode != ''
      `;
      db.run(simpleInsert, function(err2) {
        if (!err2) console.log(`✓ Inserted with simple method: ${this.changes} rows`);
        markPrimary();
      });
    } else {
      console.log(`✓ Inserted: ${this.changes} rows`);
      markPrimary();
    }
  });

  function markPrimary() {
    console.log('Step 3: Marking primary postcodes...');
    
    db.run(`
      UPDATE suburb_postcodes
      SET is_primary = 1
      WHERE (ssc, postcode) IN (
        SELECT ssc, MIN(postcode)
        FROM suburb_postcodes
        GROUP BY ssc
      )
    `, function(err) {
      if (!err) {
        console.log(`✓ Updated primary markers: ${this.changes} rows`);
      }
      verify();
    });
  }

  function verify() {
    console.log('\nStep 4: Verification\n');
    
    db.all(`
      SELECT 
        COUNT(*) as total_mappings,
        COUNT(DISTINCT ssc) as unique_ssc,
        SUM(CASE WHEN is_primary=1 THEN 1 ELSE 0 END) as primary_count,
        SUM(CASE WHEN is_primary=0 THEN 1 ELSE 0 END) as secondary_count
      FROM suburb_postcodes
    `, (err, rows) => {
      if (rows && rows[0]) {
        const r = rows[0];
        console.log('Total mappings:        ', r.total_mappings);
        console.log('Unique SSCs:           ', r.unique_ssc);
        console.log('Primary postcodes:     ', r.primary_count);
        console.log('Secondary postcodes:   ', r.secondary_count);
        console.log('');
        
        if (r.secondary_count > 0) {
          console.log('✓ Multi-postcode suburbs detected: ' + r.secondary_count + ' secondary mappings');
        }
      }

      // Show examples
      db.all(`
        SELECT 
          s.ssc,
          s.suburb_name,
          s.state,
          GROUP_CONCAT(CASE WHEN sp.is_primary=1 THEN '['||sp.postcode||']' ELSE sp.postcode END, ', ') as postcodes,
          COUNT(*) as postcode_count
        FROM suburb_postcodes sp
        INNER JOIN suburbs s ON sp.ssc = s.ssc
        GROUP BY sp.ssc
        HAVING COUNT(*) > 1
        ORDER BY postcode_count DESC
        LIMIT 5
      `, (err, examples) => {
        if (examples && examples.length > 0) {
          console.log('\nMulti-postcode examples:\n');
          examples.forEach(e => {
            console.log(`  ${e.ssc} | ${e.state} | ${e.suburb_name} (${e.postcode_count} postcodes)`);
            console.log(`    → ${e.postcodes}\n`);
          });
        }

        console.log('=== SUBURB_POSTCODES TABLE COMPLETE ===\n');
        db.close();
      });
    });
  }
});
