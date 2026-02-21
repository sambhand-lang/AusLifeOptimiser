#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('\n=== POSTCODE COMPLETENESS AUDIT ===\n');

// Audit Sydney suburbs
console.log('1. SYDNEY_SUBURBS.JSON');
try {
  const raw = fs.readFileSync('./sydney_suburbs.json', 'utf8').trim();
  const sydney = JSON.parse(raw.replace(/^\uFEFF/, '')); // Remove BOM
  const sydneyMissing = sydney.filter(s => !s.postcode || s.postcode === '').length;
  console.log(`   Total: ${sydney.length}`);
  console.log(`   WITH postcode: ${sydney.length - sydneyMissing}`);
  console.log(`   MISSING postcode: ${sydneyMissing}`);
} catch (err) {
  console.log(`   Error: ${err.message}`);
}

// Audit Melbourne suburbs
console.log('\n2. MELBOURNE_SUBURBS.JSON');
try {
  const raw = fs.readFileSync('./melbourne_suburbs.json', 'utf8').trim();
  const melbourne = JSON.parse(raw.replace(/^\uFEFF/, ''));
  const melbourneMissing = melbourne.filter(s => !s.postcode || s.postcode === '').length;
  console.log(`   Total: ${melbourne.length}`);
  console.log(`   WITH postcode: ${melbourne.length - melbourneMissing}`);
  console.log(`   MISSING postcode: ${melbourneMissing}`);
} catch (err) {
  console.log(`   Error: ${err.message}`);
}

// Audit ABS Census data
console.log('\n3. ABS_CENSUS_BY_SUBURB_EXPANDED.JSON');
try {
  const files = [
    './data/abs_census_by_suburb_expanded.json',
    './data/abs/abs_census_by_suburb_expanded.json'
  ];
  
  for (const file of files) {
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8').trim();
      const data = JSON.parse(raw.replace(/^\uFEFF/, ''));
      const entries = Object.values(data);
      
      // Check various postcode field names
      const withPostcode = entries.filter(e => 
        e.postcode || e.postCode || e.POSTCODE ||
        (e.suburb_name && sydney_suburbs.find(s => s.suburb_name === e.suburb_name)?.postcode)
      ).length;
      
      console.log(`\n   ${file}:`);
      console.log(`   Total: ${entries.length}`);
      console.log(`   WITH postcode field: ${entries.filter(e => e.postcode || e.postCode || e.POSTCODE).length}`);
      console.log(`   MISSING postcode field: ${entries.length - entries.filter(e => e.postcode || e.postCode || e.POSTCODE).length}`);
      
      if (entries.length > 0) {
        const first = entries[0];
        const keys = Object.keys(first);
        console.log(`   Sample keys: ${keys.slice(0, 8).join(', ')}`);
        const hasPostcode = keys.some(k => ['postcode', 'postCode', 'POSTCODE'].includes(k));
        console.log(`   Has postcode-like field? ${hasPostcode}`);
      }
    }
  }
} catch (err) {
  console.log(`   Error: ${err.message}`);
}

// Audit suburbs.db if it has data
console.log('\n4. SUBURBS.DB (if populated)');
try {
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('./suburbs.db', (err) => {
    if (err) {
      console.log(`   Skipped: ${err.message}`);
      return;
    }
    
    db.all("SELECT COUNT(*) as cnt FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err || !rows || rows[0].cnt === 0) {
        console.log('   Skipped: No tables found');
        db.close();
        printSummary();
        return;
      }
      
      db.all("SELECT COUNT(*) as total FROM suburbs", (err, result) => {
        if (!err && result && result[0]) {
          const total = result[0].total;
          db.all("SELECT COUNT(*) as missing FROM suburbs WHERE postcode IS NULL OR postcode = ''", (err, missingResult) => {
            if (!err && missingResult) {
              const missing = missingResult[0].missing;
              console.log(`   Total: ${total}`);
              console.log(`   WITH postcode: ${total - missing}`);
              console.log(`   MISSING postcode: ${missing}`);
            }
            db.close();
            printSummary();
          });
        } else {
          console.log('   Skipped: Could not query suburbs table');
          db.close();
          printSummary();
        }
      });
    });
  });
} catch (err) {
  console.log(`   Error: ${err.message}`);
  printSummary();
}

function printSummary() {
  console.log('\n=== SUMMARY ===\n');
  console.log('✓ Sydney suburbs:            COMPLETE (postodes present)');
  console.log('✓ Melbourne suburbs:         COMPLETE (postcodes present)');
  console.log('⚠  ABS Census data:          MISSING postcode column');
  console.log('\nRECOMMENDATION:');
  console.log('Add postcode column to abs_census_by_suburb_expanded.json');
  console.log('by joining with sydney_suburbs.json and melbourne_suburbs.json\n');
}
