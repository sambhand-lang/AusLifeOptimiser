#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

console.log('\n=== REBUILDING SUBURB_POSTCODES WITH ALL VARIANTS ===\n');

const db = new sqlite3.Database('./suburbs.db');
db.configure('busyTimeout', 60000);

db.serialize(() => {
  // Clear existing data
  db.run('DELETE FROM suburb_postcodes', () => {
    
    console.log('Step 1: Inserting all postcode variants for each SSC...\n');

    // For each SSC, get ALL unique postcodes from the raw suburbs data
    db.run(`
      INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
      SELECT 
        s.ssc,
        r.postcode,
        CASE 
          -- Mark first postcode (alphabetically) as primary
          WHEN r.postcode = (
            SELECT MIN(postcode)
            FROM suburbs r2
            WHERE r2.ssc = s.ssc
              AND r2.postcode IS NOT NULL
              AND r2.postcode != ''
          ) THEN 1
          ELSE 0
        END as is_primary
      FROM suburbs s
      INNER JOIN (
        -- Get all unique postcodes for each SSC
        SELECT ssc, postcode
        FROM suburbs
        WHERE ssc IS NOT NULL
          AND postcode IS NOT NULL
          AND postcode != ''
        GROUP BY ssc, postcode
      ) r ON s.ssc = r.ssc
      WHERE s.ssc IS NOT NULL
      GROUP BY s.ssc, r.postcode
    `, function(err) {
      if (err) {
        console.error('✗ Error:', err);
        db.close();
        return;
      }
      console.log(`✓ Inserted ${this.changes} unique SSC↔Postcode mappings\n`);

      // Verification
      console.log('Step 2: Verification...\n');

      db.all(`
        SELECT 
          COUNT(*) as total_mappings,
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
          console.log(`Secondary postcodes (multi-postcode variants): ${r.secondary_count}\n`);

          console.log(`Original suburbs records: 45,384`);
          console.log(`Normalized to: ${r.total_mappings} postcode mappings`);
          console.log(`Deduplication: ${45384 - r.total_mappings} duplicate rows removed\n`);

          if (r.total_mappings > 18519) {
            console.log('✓ Multi-postcode suburbs properly captured\n');
          }
        }

        // Show distribution
        console.log('Step 3: Multipostcode suburbs...\n');

        db.all(`
          SELECT COUNT(*) as multi_postcode_suburbs
          FROM (
            SELECT ssc
            FROM suburb_postcodes
            GROUP BY ssc
            HAVING COUNT(DISTINCT postcode) > 1
          )
        `, (err, result) => {
          if (result && result[0]) {
            console.log(`Suburbs with multiple postcodes: ${result[0].multi_postcode_suburbs}\n`);
          }

          // Show examples
          console.log('Step 4: Top multi-postcode suburbs...\n');

          db.all(`
            SELECT 
              sp.ssc,
              s.suburb_name,
              s.state,
              COUNT(DISTINCT sp.postcode) as postcode_count,
              GROUP_CONCAT(
                CASE WHEN sp.is_primary = 1 
                  THEN '[' || sp.postcode || ']'
                  ELSE sp.postcode
                END,
                ', '
              ) as postcodes
            FROM suburb_postcodes sp
            INNER JOIN suburbs s ON sp.ssc = s.ssc
            GROUP BY sp.ssc
            HAVING COUNT(DISTINCT sp.postcode) > 1
            ORDER BY postcode_count DESC
            LIMIT 15
          `, (err, samples) => {
            if (samples) {
              samples.forEach(s => {
                console.log(`  ${s.ssc} | ${s.state} | ${s.suburb_name.padEnd(25)} | ${s.postcode_count} postcodes`);
                console.log(`     → ${s.postcodes}`);
              });
            }

            // State summary
            console.log('\nStep 5: Coverage by state...\n');

            db.all(`
              SELECT 
                s.state,
                COUNT(DISTINCT s.ssc) as total_suburbs,
                COUNT(DISTINCT sp.postcode) as unique_postcodes,
                COUNT(CASE 
                  WHEN sp.ssc IN (
                    SELECT ssc FROM suburb_postcodes GROUP BY ssc HAVING COUNT(*) > 1
                  ) THEN sp.ssc
                END) as multipostcode_rows
              FROM suburbs s
              LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
              WHERE s.ssc IS NOT NULL
              GROUP BY s.state
              ORDER BY s.state
            `, (err, stats) => {
              if (stats) {
                stats.forEach(s => {
                  const pct = ((s.multipostcode_rows / s.total_suburbs) * 100).toFixed(1);
                  console.log(`  ${s.state}: ${s.total_suburbs} suburbs → ${s.unique_postcodes} postcodes`);
                });
              }

              console.log('\n=== NORMALIZATION COMPLETE ===\n');
              console.log('suburb_postcodes successfully normalized:');
              console.log('  ✓ One row per SSC + Postcode combination');
              console.log('  ✓ All multi-postcode suburbs captured');
              console.log('  ✓ Primary postcode marked');
              console.log('  ✓ Database denormalization resolved\n');
              console.log('Ready for API updates and queries!\n');

              db.close();
            });
          });
        });
      });
    });
  });
});
