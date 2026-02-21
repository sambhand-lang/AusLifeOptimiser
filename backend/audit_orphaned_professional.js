#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

console.log('\n=== PROFESSIONAL ORPHAN AUDIT ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Query 1: Are orphans just duplicate postcode rows of already-matched suburbs?
console.log('Query 1: Orphans that share (suburb_name, state) with valid SSC rows...\n');

db.get(`
  SELECT COUNT(*) as duplicate_postcode_orphans
  FROM suburbs s
  WHERE s.ssc IS NULL
    AND EXISTS (
      SELECT 1
      FROM suburbs s2
      WHERE s2.suburb_name = s.suburb_name
        AND s2.state = s.state
        AND s2.ssc IS NOT NULL
    )
`, (err, result1) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  const dupCount = result1.duplicate_postcode_orphans;
  console.log(`  Orphans with matching SSC suburb: ${dupCount} of 26,858\n`);
  
  if (dupCount > 20000) {
    console.log('  ✓ These are DUPLICATE POSTCODE ROWS (safe to collapse later)\n');
  } else if (dupCount > 1000) {
    console.log('  ⚠ Mixed situation: Some are duplicates, some truly unmatched\n');
  } else {
    console.log('  ❌ Most orphans are NOT duplicates → real matching problem\n');
  }

  // Query 2: How many truly unique suburb identities failed SSC match?
  console.log('Query 2: Unique suburb identities in orphaned records...\n');

  db.get(`
    SELECT COUNT(DISTINCT TRIM(UPPER(suburb_name)) || '|' || state) as unique_unmatched_identities
    FROM suburbs
    WHERE ssc IS NULL
  `, (err, result2) => {
    if (err) {
      console.error('Error:', err);
      db.close();
      return;
    }

    const uniqueCount = result2.unique_unmatched_identities;
    console.log(`  Truly unique suburb identities (NULL SSC): ${uniqueCount}\n`);

    if (uniqueCount < 200) {
      console.log('  ✓ SMALL NUMBER - These are likely naming issues\n');
    } else if (uniqueCount < 1000) {
      console.log('  ⚠ MODERATE - Worth investigating\n');
    } else {
      console.log('  🔥 LARGE NUMBER - Mapping logic problem\n');
    }

    // Query 3: Sample of truly unmatched identities
    console.log('Sample of unmatched suburb identities (first 20):\n');

    db.all(`
      SELECT DISTINCT 
        TRIM(UPPER(suburb_name)) as normalized_name,
        state,
        COUNT(*) as copies
      FROM suburbs
      WHERE ssc IS NULL
      GROUP BY TRIM(UPPER(suburb_name)), state
      ORDER BY copies DESC
      LIMIT 20
    `, (err, samples) => {
      if (samples && samples.length > 0) {
        samples.forEach(s => {
          console.log(`  - ${s.state} | ${s.normalized_name.padEnd(40)} | copies: ${s.copies}`);
        });
      }

      console.log('\n=== ANALYSIS ===\n');
      console.log(`Total orphaned records: 26,858`);
      console.log(`  - Duplicates of matched suburbs: ${dupCount}`);
      console.log(`  - Truly unique unmatched identities: ${uniqueCount}`);
      console.log(`\nConclusion:\n`);

      if (dupCount > 20000) {
        console.log('  The 26,858 orphans are primarily DUPLICATE POSTCODE ROWS.');
        console.log('  They will naturally collapse during normalization.');
        console.log('  Action: DO NOT DELETE. Build suburb_postcodes table instead.\n');
      } else if (uniqueCount < 500) {
        console.log('  Most orphans are naming/formatting issues.');
        console.log('  Action: FIX matching logic, then rerun migration.\n');
      } else {
        console.log('  Significant mapping problem detected.');
        console.log('  Action: Investigate source data quality first.\n');
      }

      // Query 4: Show distribution of records by postcode status
      console.log('Query 3: Records by SSC and postcode status:\n');

      db.all(`
        SELECT 
          CASE 
            WHEN ssc IS NOT NULL THEN 'With SSC'
            ELSE 'Without SSC'
          END as status,
          CASE 
            WHEN postcode IS NOT NULL AND postcode != '' THEN 'With postcode'
            ELSE 'NULL/empty postcode'
          END as postcode_status,
          COUNT(*) as count
        FROM suburbs
        GROUP BY 
          CASE WHEN ssc IS NOT NULL THEN 'With SSC' ELSE 'Without SSC' END,
          CASE WHEN postcode IS NOT NULL AND postcode != '' THEN 'With postcode' ELSE 'NULL/empty postcode' END
        ORDER BY status, postcode_status
      `, (err, distribution) => {
        if (distribution) {
          distribution.forEach(d => {
            console.log(`  ${d.status.padEnd(15)} | ${d.postcode_status.padEnd(25)} | ${d.count}`);
          });
        }

        console.log('\n=== PROFESSIONAL RECOMMENDATION ===\n');
        console.log('Current Status:');
        console.log(`  ✓ 18,526 records: WITH SSC (canonical suburbs)`);
        console.log(`  ❌ 26,858 records: WITHOUT SSC (need investigation)\n`);

        if (dupCount > 25000) {
          console.log('Action Plan:');
          console.log('  1. DO NOT DELETE orphans');
          console.log('  2. They are multipostcode variants of canonical suburbs');
          console.log('  3. Build suburb_postcodes normalization:');
          console.log('     - One row per SSC (canonical suburb)');
          console.log('     - Array of postcodes for that SSC');
          console.log('  4. Then you can safely deduplicate\n');
        } else {
          console.log('Action Plan:');
          console.log('  1. Investigate the ' + uniqueCount + ' unmatched identities');
          console.log('  2. Check for: whitespace, case, abbreviations');
          console.log('  3. Update mapping logic');
          console.log('  4. Rerun migration\n');
        }

        db.close();
      });
    });
  });
});
