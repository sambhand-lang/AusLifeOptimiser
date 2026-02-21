#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('\n=== SSC MIGRATION STATUS CHECK ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Check what we have so far
db.all(`
  SELECT state, COUNT(*) as total, COUNT(ssc) as with_ssc, COUNT(CASE WHEN ssc IS NULL THEN 1 END) as missing
  FROM suburbs
  GROUP BY state
  ORDER BY state
`, (err, stats) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }

  console.log('Current Migration Status:\n');
  let totalAll = 0, totalSSC = 0;
  stats.forEach(s => {
    const pct = ((s.with_ssc / s.total) * 100).toFixed(1);
    console.log(`  ${s.state}: ${s.with_ssc}/${s.total} (${pct}%) - ${s.missing} missing`);
    totalAll += s.total;
    totalSSC += s.with_ssc;
  });

  const totalPct = ((totalSSC / totalAll) * 100).toFixed(1);
  console.log(`\n  TOTAL: ${totalSSC}/${totalAll} (${totalPct}%)`);
  console.log(`  Missing: ${totalAll - totalSSC}\n`);

  // Find which suburbs don't have SSC yet
  db.all(`
    SELECT DISTINCT state, suburb_name, postcode
    FROM suburbs
    WHERE ssc IS NULL
    LIMIT 5
  `, (err, missing) => {
    if (missing && missing.length > 0) {
      console.log('Sample missing suburbs:\n');
      missing.forEach(m => {
        console.log(`  - ${m.state} | ${m.suburb_name} | ${m.postcode}`);
      });
      console.log('\nTo resume: Check canonical_suburbs_with_ssc.json for matches\n');
    }

    db.close();
  });
});
