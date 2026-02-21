#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('\n=== BUILDING SUBURB_POSTCODES TABLE ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Step 1: Clear existing
db.run('DELETE FROM suburb_postcodes', (err) => {
  if (err) {
    console.error('Error deleting:', err);
    db.close();
    return;
  }
  console.log('Step 1: Cleared existing data\n');

  // Step 2: Insert with primary marking
  const sql = `
    INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
    SELECT 
      s.ssc,
      s.postcode,
      CASE 
        WHEN s.postcode = (
          SELECT MIN(postcode)
          FROM suburbs s2
          WHERE s2.ssc = s.ssc
            AND s2.postcode IS NOT NULL
            AND s2.postcode != ''
        ) THEN 1
        ELSE 0
      END as is_primary
    FROM (
      SELECT DISTINCT ssc, postcode
      FROM suburbs
      WHERE ssc IS NOT NULL
        AND postcode IS NOT NULL
        AND postcode != ''
      ORDER BY ssc, postcode
    ) s
  `;

  console.log('Step 2: Inserting all postcode variants...\n');

  db.run(sql, function(err) {
    if (err) {
      console.error('Error inserting:', err);
      db.close();
      return;
    }

    console.log(`✓ Inserted ${this.changes} postcode mappings\n`);

    // Step 3: Verify counts
    console.log('Step 3: Verification metrics\n');

    const queries = [
      { label: 'TOTAL MAPPINGS', sql: 'SELECT COUNT(*) as val FROM suburb_postcodes' },
      { label: 'UNIQUE SSCs', sql: 'SELECT COUNT(DISTINCT ssc) as val FROM suburb_postcodes' },
      { label: 'PRIMARY POSTCODES', sql: 'SELECT SUM(CASE WHEN is_primary=1 THEN 1 ELSE 0 END) as val FROM suburb_postcodes' },
      { label: 'SECONDARY POSTCODES', sql: 'SELECT SUM(CASE WHEN is_primary=0 THEN 1 ELSE 0 END) as val FROM suburb_postcodes' },
      { label: 'MULTI-POSTCODE SUBURBS', sql: 'SELECT COUNT(DISTINCT ssc) as val FROM (SELECT ssc FROM suburb_postcodes GROUP BY ssc HAVING COUNT(*) > 1)' }
    ];

    let completed = 0;

    queries.forEach(q => {
      db.get(q.sql, (err, row) => {
        if (row) {
          console.log(`  ${q.label.padEnd(30)}: ${row.val}`);
        }
        if (++completed === queries.length) {
          showSamples();
        }
      });
    });

    function showSamples() {
      console.log('\nStep 4: Multi-postcode suburb examples\n');

      db.all(`
        SELECT 
          s.ssc,
          s.suburb_name,
          s.state,
          GROUP_CONCAT(CASE WHEN sp.is_primary=1 THEN '[' || sp.postcode || ']' ELSE sp.postcode END, ', ') as postcodes,
          COUNT(sp.postcode) as postcode_count
        FROM suburbs s
        INNER JOIN suburb_postcodes sp ON s.ssc = sp.ssc
        GROUP BY s.ssc
        HAVING COUNT(sp.postcode) > 1
        ORDER BY postcode_count DESC
        LIMIT 10
      `, (err, rows) => {
        if (rows) {
          rows.forEach(r => {
            console.log(`  ${r.ssc} | ${r.state} | ${r.suburb_name.padEnd(25)} | ${r.postcode_count} postcodes`);
            console.log(`      → ${r.postcodes}\n`);
          });
        }

        console.log('=== SUBURB_POSTCODES TABLE COMPLETE ===\n');
        console.log('✓ Denormalized postcode mapping created');
        console.log('✓ Primary postcodes marked');
        console.log('✓ Multi-postcode suburbs preserved\n');

        // Summary stats by state
        db.all(`
          SELECT 
            s.state,
            COUNT(DISTINCT s.ssc) as suburbs,
            COUNT(DISTINCT sp.postcode) as unique_postcodes,
            COUNT(CASE WHEN sp.ssc IN (SELECT ssc FROM suburb_postcodes GROUP BY ssc HAVING COUNT(*)>1) THEN sp.ssc END) as multipostcode_rows
          FROM suburbs s
          LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
          WHERE s.ssc IS NOT NULL
          GROUP BY s.state
          ORDER BY s.state
        `, (err, stats) => {
          if (stats) {
            console.log('Coverage by state:\n');
            stats.forEach(s => {
              console.log(`  ${s.state}: ${s.suburbs} suburbs → ${s.unique_postcodes} postcodes`);
            });
          }

          console.log('\nNext: Update API endpoints to use SSC + suburb_postcodes\n');
          db.close();
        });
      });
    }
  });
});
