#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./suburbs.db');

console.log('\n=== QUICK AUDIT ===\n');

// Query 1 - but simpler
db.get(`
  SELECT COUNT(*) as count
  FROM suburbs s
  WHERE s.ssc IS NULL
    AND EXISTS (
      SELECT 1
      FROM suburbs s2
      WHERE s2.suburb_name = s.suburb_name
        AND s2.state = s.state
        AND s2.ssc IS NOT NULL
    )
`, (err, row) => {
  if (err) {
    console.error('Q1 Error:', err.message);
  } else {
    console.log('Q1: Orphans with matching SSC suburb = ' + row.count);
  }

  // Query 2
  db.get(`
    SELECT COUNT(DISTINCT TRIM(UPPER(suburb_name)) || '|' || state) as count
    FROM suburbs
    WHERE ssc IS NULL
  `, (err, row) => {
    if (err) {
      console.error('Q2 Error:', err.message);
    } else {
      console.log('Q2: Unique unmatched identities = ' + row.count);
    }

    db.close();
  });
});
