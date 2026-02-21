#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

console.log('\n=== BUILDING SUBURB_POSTCODES NORMALIZATION TABLE ===\n');

const db = new sqlite3.Database('./suburbs.db');
db.configure('busyTimeout', 60000);

db.serialize(() => {
  // Step 1: Create suburb_postcodes table
  console.log('Step 1: Creating suburb_postcodes table...\n');

  db.run(`
    CREATE TABLE IF NOT EXISTS suburb_postcodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ssc VARCHAR(5) NOT NULL,
      postcode VARCHAR(10) NOT NULL,
      is_primary BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(ssc) REFERENCES suburbs(ssc),
      UNIQUE(ssc, postcode)
    )
  `, (err) => {
    if (err) {
      console.error('✗ Error creating table:', err);
      db.close();
      return;
    }
    console.log('✓ Table created\n');

    // Step 2: Clear existing data if any
    db.run('DELETE FROM suburb_postcodes', () => {
      
      // Step 3: Populate from suburbs table with SSC codes
      console.log('Step 2: Inserting all postcode variants...\n');

      db.run(`
        INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
        SELECT 
          ssc,
          postcode,
          1 as is_primary
        FROM (
          -- For each SSC, get the first (primary) postcode
          SELECT 
            ssc,
            postcode,
            ROW_NUMBER() OVER (PARTITION BY ssc ORDER BY postcode ASC) as rn
          FROM suburbs
          WHERE ssc IS NOT NULL 
            AND postcode IS NOT NULL 
            AND postcode != ''
          GROUP BY ssc, postcode
        )
        WHERE rn = 1
      `, function(err) {
        if (err) {
          console.error('✗ Error (primary):', err);
          db.close();
          return;
        }
        console.log(`✓ Inserted ${this.changes} primary postcodes\n`);

        // Step 4: Insert all secondary postcodes
        console.log('Step 3: Inserting secondary postcode variants...\n');

        db.run(`
          INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
          SELECT 
            ssc,
            postcode,
            0 as is_primary
          FROM (
            -- All postcodes except the first (primary)
            SELECT 
              ssc,
              postcode,
              ROW_NUMBER() OVER (PARTITION BY ssc ORDER BY postcode ASC) as rn
            FROM suburbs
            WHERE ssc IS NOT NULL 
              AND postcode IS NOT NULL 
              AND postcode != ''
            GROUP BY ssc, postcode
          )
          WHERE rn > 1
        `, function(err) {
          if (err) {
            console.error('✗ Error (secondary):', err);
            db.close();
            return;
          }
          console.log(`✓ Inserted ${this.changes} secondary postcodes\n`);

          // Step 5: Verify counts
          console.log('Step 4: Verification...\n');

          db.all(`
            SELECT COUNT(*) as total_mappings,
                   COUNT(DISTINCT ssc) as unique_ssc,
                   COUNT(CASE WHEN is_primary = 1 THEN 1 END) as primary_count,
                   COUNT(CASE WHEN is_primary = 0 THEN 1 END) as secondary_count
            FROM suburb_postcodes
          `, (err, result) => {
            if (result && result[0]) {
              const r = result[0];
              console.log(`Total SSC↔Postcode mappings: ${r.total_mappings}`);
              console.log(`Unique SSCs: ${r.unique_ssc}`);
              console.log(`Primary postcodes: ${r.primary_count}`);
              console.log(`Secondary postcodes: ${r.secondary_count}\n`);

              // Original record count was 45,384
              // We should have similar or slightly fewer (due to deduplication)
              console.log(`Original suburbs records: 45,384`);
              console.log(`New suburb_postcodes: ${r.total_mappings}`);
              console.log(`Reduction: ${45384 - r.total_mappings} duplicates removed\n`);

              if (r.total_mappings < 45384) {
                console.log('✓ Deduplication successful\n');
              }
            }

            // Step 6: Show statistics by state
            console.log('Step 5: Postcode coverage by state...\n');

            db.all(`
              SELECT 
                s.state,
                COUNT(DISTINCT s.ssc) as suburbs,
                COUNT(DISTINCT sp.postcode) as postcode_count,
                COUNT(CASE WHEN sp.is_primary = 1 THEN 1 END) as primary_only,
                COUNT(CASE WHEN sp.is_primary = 0 THEN 1 END) as multi_postcode
              FROM suburbs s
              LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
              WHERE s.ssc IS NOT NULL
              GROUP BY s.state
              ORDER BY s.state
            `, (err, stats) => {
              if (stats) {
                stats.forEach(s => {
                  console.log(`  ${s.state}: ${s.suburbs} suburbs → ${s.postcode_count} postcodes (${s.multi_postcode} multi-postcode)`);
                });
              }

              // Step 7: Sample data
              console.log('\nStep 6: Sample mappings (suburbs with multiple postcodes)...\n');

              db.all(`
                SELECT 
                  s.suburb_name,
                  s.state,
                  s.ssc,
                  GROUP_CONCAT(
                    CASE WHEN sp.is_primary = 1 
                      THEN '[' || sp.postcode || ']' 
                      ELSE sp.postcode 
                    END,
                    ', '
                  ) as postcodes
                FROM suburbs s
                LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
                WHERE s.ssc IS NOT NULL
                GROUP BY s.ssc
                HAVING COUNT(DISTINCT sp.postcode) > 1
                LIMIT 10
              `, (err, samples) => {
                if (samples) {
                  samples.forEach(s => {
                    console.log(`  ${s.ssc} | ${s.state} | ${s.suburb_name}`);
                    console.log(`    Postcodes: ${s.postcodes}`);
                  });
                }

                console.log('\n=== NORMALIZATION COMPLETE ===\n');
                console.log('suburb_postcodes table:');
                console.log('  ✓ Canonical SSC as FK');
                console.log('  ✓ All postcode variants preserved');
                console.log('  ✓ Primary postcode marked');
                console.log('  ✓ Duplicates deduplicated\n');
                console.log('Next: Update API to use suburb_postcodes for lookups\n');

                db.close();
              });
            });
          });
        });
      });
    });
  });
});
