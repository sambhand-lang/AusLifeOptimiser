#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('\n=== SSC MIGRATION: COMPLETE ALL DUPLICATES ===\n');

const db = new sqlite3.Database('./suburbs.db');

// Load canonical registry
const registryFile = path.join(__dirname, 'data', 'canonical_suburbs_with_ssc.json');
const registry = JSON.parse(fs.readFileSync(registryFile, 'utf8'));
const suburbs = registry.canonicalSuburbs;

console.log(`Loaded ${suburbs.length} SSC mappings\n`);
console.log('Strategy: For each unique (state, suburb, postcode), update ALL matching rows\n');

// Create a map for faster lookup
const sscMap = {};
suburbs.forEach(s => {
  const key = `${s.state}|${s.suburb}|${s.primary_postcode}`;
  sscMap[key] = s.ssc;
});

console.log(`Built lookup map with ${Object.keys(sscMap).length} entries\n`);

// Now update ALL rows matching each key
const keys = Object.keys(sscMap);
let completed = 0;
let totalUpdated = 0;

const updateBatch = (keyIndex) => {
  if (keyIndex >= keys.length) {
    console.log(`\n✓ Total rows updated: ${totalUpdated}\n`);
    
    // Final verification
    console.log('=== FINAL STATUS ===\n');
    db.all(`
      SELECT state, COUNT(*) as total, COUNT(ssc) as with_ssc
      FROM suburbs
      GROUP BY state
      ORDER BY state
    `, (err, stats) => {
      if (stats) {
        let totalAll = 0, totalSSC = 0;
        stats.forEach(s => {
          const pct = ((s.with_ssc / s.total) * 100).toFixed(1);
          console.log(`  ${s.state}: ${s.with_ssc}/${s.total} (${pct}%)`);
          totalAll += s.total;
          totalSSC += s.with_ssc;
        });
        const totalPct = ((totalSSC / totalAll) * 100).toFixed(1);
        console.log(`\n  TOTAL: ${totalSSC}/${totalAll} (${totalPct}%)\n`);

        if (totalSSC === totalAll) {
          console.log('✓ ALL RECORDS HAVE SSC CODES\n');
        }
      }
      
      db.close();
    });
    return;
  }

  const key = keys[keyIndex];
  const [state, suburb, postcode] = key.split('|');
  const ssc = sscMap[key];

  db.run(
    'UPDATE suburbs SET ssc = ? WHERE state = ? AND suburb_name = ? AND postcode = ?',
    [ssc, state, suburb, postcode],
    function(err) {
      if (err) {
        console.error(`Error on key ${key}: ${err}`);
      } else {
        totalUpdated += this.changes;
        if (++completed % 1000 === 0) {
          console.log(`  ... ${completed}/${keys.length} canonical keys processed`);
        }
      }
      updateBatch(keyIndex + 1);
    }
  );
};

updateBatch(0);
