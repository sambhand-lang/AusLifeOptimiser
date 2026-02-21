#!/usr/bin/env node

const Database = require('better-sqlite3');

console.log('\n=== REBUILD SUBURB_POSTCODES (SYNC) ===\n');

try {
  const db = new Database('./suburbs.db');

  console.log('Step 1: Clearing existing data...');
  db.exec('DELETE FROM suburb_postcodes');
  console.log('✓\n');

  console.log('Step 2: Building postcode map from suburbs table...');
  
  // Get all unique (ssc, postcode) combinations
  const postcodeMap = new Map();
  const stmt = db.prepare(`
    SELECT DISTINCT ssc, postcode
    FROM suburbs
    WHERE ssc IS NOT NULL
      AND postcode IS NOT NULL
      AND postcode != ''
    ORDER BY ssc, postcode
  `);

  for (const row of stmt.all()) {
    const key = row.ssc;
    if (!postcodeMap.has(key)) {
      postcodeMap.set(key, []);
    }
    postcodeMap.get(key).push(row.postcode);
  }

  console.log(`✓ Found ${postcodeMap.size} SSCs with postcodes\n`);

  // Insert all mappings
  console.log('Step 3: Inserting all postcode variants...');
  
  const insert = db.prepare(`
    INSERT INTO suburb_postcodes (ssc, postcode, is_primary)
    VALUES (?, ?, ?)
  `);

  let insertCount = 0;
  let primaryCount = 0;

  db.exec('BEGIN TRANSACTION');
  
  for (const [ssc, postcodes] of postcodeMap.entries()) {
    postcodes.forEach((pc, index) => {
      const isPrimary = index === 0 ? 1 : 0;
      insert.run(ssc, pc, isPrimary);
      if (isPrimary) primaryCount++;
      insertCount++;
    });
  }

  db.exec('COMMIT');

  console.log(`✓ Inserted ${insertCount} mappings (${primaryCount} primary, ${insertCount - primaryCount} secondary)\n`);

  // Verify
  console.log('Step 4: Verification...\n');

  const verify = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(DISTINCT ssc) as unique_ssc,
      SUM(CASE WHEN is_primary = 1 THEN 1 ELSE 0 END) as primary_count,
      SUM(CASE WHEN is_primary = 0 THEN 1 ELSE 0 END) as secondary_count
    FROM suburb_postcodes
  `);

  const result = verify.all()[0];
  console.log(`Total mappings: ${result.total}`);
  console.log(`Unique SSCs: ${result.unique_ssc}`);
  console.log(`Primary postcodes: ${result.primary_count}`);
  console.log(`Secondary postcodes: ${result.secondary_count}\n`);

  if (result.total > 18519) {
    console.log('✓ Multi-postcode suburbs successfully captured\n');
  }

  // Show multi-postcode examples
  console.log('Step 5: Multi-postcode suburb examples...\n');

  const examples = db.prepare(`
    SELECT 
      s.ssc,
      s.suburb_name,
      s.state,
      sp.postcode_count,
      sp.postcodes
    FROM (
      SELECT 
        ssc,
        COUNT(*) as postcode_count,
        GROUP_CONCAT(
          CASE WHEN is_primary = 1 THEN '[' || postcode || ']' ELSE postcode END,
          ', '
        ) as postcodes
      FROM suburb_postcodes
      GROUP BY ssc
      HAVING COUNT(*) > 1
      ORDER BY postcode_count DESC
      LIMIT 10
    ) sp
    INNER JOIN suburbs s ON s.ssc = sp.ssc
    LIMIT 10
  `);

  for (const row of examples.all()) {
    console.log(`${row.ssc} | ${row.state} | ${row.suburb_name.padEnd(25)} | ${row.postcode_count} postcodes`);
    console.log(`  → ${row.postcodes}\n`);
  }

  console.log('=== COMPLETE ===\n');
  console.log('suburb_postcodes normalization successful!');
  console.log('✓ Canonical SSC identity');
  console.log('✓ All postcode variants preserved');
  console.log('✓ Primary postcode marked\n');

  db.close();
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
