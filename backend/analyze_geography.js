#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

console.log('\n=== STEP 1: IDENTIFY MIXED GEOGRAPHY LEVELS IN 45,384 RECORDS ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Query 1: STATE BREAKDOWN
console.log('1. BREAKDOWN BY STATE:\n');
db.all(`
  SELECT state, COUNT(*) as count
  FROM suburbs
  GROUP BY state
  ORDER BY count DESC
`, (err, rows) => {
  if (rows) {
    rows.forEach(r => {
      console.log(`  ${r.state || 'NULL'}: ${r.count}`);
    });
  }
  
  // Query 2: DUPLICATES
  console.log('\n2. DUPLICATE SUBURB NAMES (same state):\n');
  db.all(`
    SELECT state, suburb_name, COUNT(*) as cnt
    FROM suburbs
    WHERE state IS NOT NULL AND state != ''
    GROUP BY state, suburb_name
    HAVING cnt > 1
    LIMIT 10
  `, (err, dupes) => {
    if (dupes && dupes.length > 0) {
      console.log(`Found ${dupes.length} duplicate combinations:\n`);
      dupes.forEach(d => {
        console.log(`  ${d.state}|${d.suburb_name}: ${d.cnt} records`);
      });
    } else {
      console.log('✓ No duplicate suburb names found');
    }
    
    // Query 3: POSTCODE STATUS
    console.log('\n3. POSTCODE COMPLETION STATUS:\n');
    db.all(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN postcode IS NOT NULL AND postcode != '' THEN 1 END) as with_postcode,
        COUNT(CASE WHEN postcode IS NULL OR postcode = '' THEN 1 END) as missing_postcode
      FROM suburbs
    `, (err, stats) => {
      if (stats && stats[0]) {
        const s = stats[0];
        const pct = ((s.with_postcode / s.total) * 100).toFixed(1);
        console.log(`  Total records: ${s.total}`);
        console.log(`  WITH postcode: ${s.with_postcode} (${pct}%)`);
        console.log(`  MISSING postcode: ${s.missing_postcode}`);
      }
      
      // Query 4: POSTCODE BY STATE
      console.log('\n4. POSTCODE COVERAGE BY STATE:\n');
      db.all(`
        SELECT 
          state,
          COUNT(*) as total,
          COUNT(CASE WHEN postcode IS NOT NULL AND postcode != '' THEN 1 END) as with_pc,
          COUNT(CASE WHEN postcode IS NULL OR postcode = '' THEN 1 END) as missing_pc
        FROM suburbs
        GROUP BY state
        ORDER BY total DESC
      `, (err, bystateStats) => {
        if (bystateStats) {
          bystateStats.forEach(row => {
            const pct = ((row.with_pc / row.total) * 100).toFixed(0);
            console.log(`  ${row.state || 'NULL'}: ${row.with_pc}/${row.total} (${pct}%)`);
          });
        }
        
        // Query 5: SAMPLE OF CODE-LIKE NAMES
        console.log('\n5. CHECKING FOR SA2/LGA-LIKE PATTERNS:\n');
        db.all(`
          SELECT DISTINCT suburb_name
          FROM suburbs
          WHERE suburb_name LIKE '% SA2 %'
             OR suburb_name LIKE '% LGA %'
             OR suburb_name LIKE '% SSC %'
          LIMIT 5
        `, (err, patterns) => {
          if (patterns && patterns.length > 0) {
            console.log('⚠️  Found potential SA2/LGA/SSC entries:');
            patterns.forEach(p => console.log(`  - ${p.suburb_name}`));
          } else {
            console.log('✓ No SA2/LGA/SSC patterns found in names');
          }
          
          // Query 6: SAMPLE SUBURBS
          console.log('\n6. SAMPLE SUBURBS (NSW, VIC, QLD):\n');
          db.all(`
            SELECT state, suburb_name, postcode
            FROM suburbs
            WHERE state IN ('NSW', 'VIC', 'QLD')
            LIMIT 6
          `, (err, samples) => {
            if (samples) {
              let currentState = null;
              samples.forEach(s => {
                if (s.state !== currentState) {
                  console.log(`\n  ${s.state}:`);
                  currentState = s.state;
                }
                console.log(`    - ${s.suburb_name} (${s.postcode || 'NULL'})`);
              });
            }
            
            console.log('\n\n=== ANALYSIS SUMMARY ===\n');
            console.log('This reveals the structure of the 45,384 records:');
            console.log('  - Distribution across states');
            console.log('  - Postcode coverage by state');
            console.log('  - Duplicate suburb names');
            console.log('  - Mixed geography levels (suburbs, SA2s, LGAs)\n');
            console.log('Next: Design canonical SSC-based national suburban registry\n');
            
            db.close();
          });
        });
      });
    });
  });
});
