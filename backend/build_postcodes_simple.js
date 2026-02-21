#!/usr/bin/env node

// Simple synchronous suburb_postcodes builder
// No async, no promises - just direct sequential operations

console.log('\n=== BUILDING SUBURB_POSTCODES (SIMPLE) ===\n');

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Prepare SQL statements
const sqlStatements = `
-- Step 1: Clear existing
DELETE FROM suburb_postcodes;

-- Step 2: Get all unique (ssc, postcode) combinations  
-- and mark first (alphabetically) as primary
INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
SELECT DISTINCT
  ssc,
  postcode,
  CASE 
    WHEN postcode = (
      SELECT MIN(pc) 
      FROM (SELECT postcode as pc FROM suburbs WHERE ssc = outer.ssc AND postcode IS NOT NULL AND postcode != '' ORDER BY postcode LIMIT 1)
    ) THEN 1
    ELSE 0
  END as is_primary
FROM (
  SELECT DISTINCT ssc, postcode
  FROM suburbs
  WHERE ssc IS NOT NULL AND postcode IS NOT NULL AND postcode != ''
) outer;

-- Verification
SELECT 
  'Total mappings:   ' || COUNT(*) ||
  ' | SSCs: ' || COUNT(DISTINCT ssc) ||
  ' | Primary: ' || SUM(CASE WHEN is_primary=1 THEN 1 ELSE 0 END) ||
  ' | Secondary: ' || SUM(CASE WHEN is_primary=0 THEN 1 ELSE 0 END)
FROM suburb_postcodes;
`;

// Don't need temp file - just execute directly
console.log('Executing SQL...\n');

try {
  // Build commands as an array for Windows
  const commands = sqlStatements.split('\n').filter(line => line.trim() && !line.trim().startsWith('--'));
  const fullSQL = commands.join('\n');

  // Use echo with pipe to sqlite3
  const output = execSync(`echo "${fullSQL.replace(/"/g, '\\"')}" | sqlite3 suburbs.db`, {
    encoding: 'utf-8',
    maxBuffer: 1024 * 1024 * 10,
    shell: true
  });

  console.log(output);

  // Additional verification using Node.js SQLite
  console.log('Verification query...\n');

  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./suburbs.db');

  db.get(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ssc) as unique_ssc,
      SUM(CASE WHEN is_primary=1 THEN 1 ELSE 0 END) as primary_count,
      SUM(CASE WHEN is_primary=0 THEN 1 ELSE 0 END) as secondary_count
    FROM suburb_postcodes
  `, (err, row) => {
    if (row) {
      console.log('✓ Total postcode mappings:', row.total);
      console.log('✓ Unique SSCs:', row.unique_ssc);
      console.log('✓ Primary postcodes:', row.primary_count);
      console.log('✓ Secondary (multi-postcode):', row.secondary_count);
      console.log('');
    }

    // Show multi-postcode examples
    db.all(`
      SELECT s.ssc, s.suburb_name, s.state, COUNT(*) as cnt
      FROM suburb_postcodes sp
      INNER JOIN suburbs s ON sp.ssc = s.ssc
      GROUP BY sp.ssc
      HAVING COUNT(*) > 1
      ORDER BY cnt DESC LIMIT 5
    `, (err, rows) => {
      if (rows) {
        console.log('Multi-postcode suburbs:\n');
        rows.forEach(r => {
          console.log(`  ${r.ssc} | ${r.state} | ${r.suburb_name} (${r.cnt} postcodes)`);
        });
      }
      console.log('\n✓ COMPLETE\n');
      db.close();
    });
  });

} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
