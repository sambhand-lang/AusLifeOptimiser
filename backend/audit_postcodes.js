#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('\n=== POSTCODE COMPLETENESS AUDIT ===\n');

// Try database first
const dbPath = './database.db';
if (fs.existsSync(dbPath)) {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.log('Database audit skipped (connection error)');
      auditJsonFiles();
      return;
    }
    
    db.all(`
      SELECT 
        COUNT(*) as total_suburbs,
        SUM(CASE WHEN postcode IS NOT NULL AND TRIM(postcode) != '' THEN 1 ELSE 0 END) as with_postcode,
        SUM(CASE WHEN postcode IS NULL OR TRIM(postcode) = '' THEN 1 ELSE 0 END) as missing_postcode
      FROM suburbs
    `, (err, rows) => {
      if (err) {
        console.log('Database query failed:', err.message);
        db.close();
        auditJsonFiles();
        return;
      }
      
      const stat = rows[0];
      const missingCount = stat.missing_postcode || 0;
      const withCount = stat.with_postcode || 0;
      const totalCount = stat.total_suburbs || 0;
      const completeness = totalCount > 0 ? ((withCount / totalCount) * 100).toFixed(2) : 0;
      
      console.log(`Total suburbs in database:    ${totalCount}`);
      console.log(`Suburbs WITH postcode:       ${withCount} (${completeness}%)`);
      console.log(`Suburbs MISSING postcode:    ${missingCount}`);
      
      if (missingCount > 0) {
        console.log('\n⚠️  Incomplete postcode coverage detected\n');
        
        // Show sample of missing
        db.all(`
          SELECT suburb_name, state 
          FROM suburbs 
          WHERE postcode IS NULL OR TRIM(postcode) = ''
          LIMIT 10
        `, (err, samples) => {
          if (!err && samples) {
            console.log('Sample of suburbs missing postcodes:');
            samples.forEach((s, i) => {
              console.log(`  ${i+1}. ${s.suburb_name} (${s.state})`);
            });
            
            if (missingCount > 10) {
              console.log(`  ... and ${missingCount - 10} more`);
            }
          }
          
          // Break down by state
          db.all(`
            SELECT 
              state,
              COUNT(*) as missing_count
            FROM suburbs
            WHERE postcode IS NULL OR TRIM(postcode) = ''
            GROUP BY state
            ORDER BY missing_count DESC
          `, (err, byState) => {
            if (!err && byState) {
              console.log('\nMissing postcodes by state:');
              byState.forEach(row => {
                console.log(`  ${row.state}: ${row.missing_count} missing`);
              });
            }
            
            db.close();
            auditJsonFiles();
          });
        });
      } else {
        console.log('\n✅ All suburbs have postcodes!\n');
        db.close();
        auditJsonFiles();
      }
    });
  });
} else {
  console.log('Database file not found, checking JSON files only...\n');
  auditJsonFiles();
}

function auditJsonFiles() {
  console.log('\n=== JSON DATA FILES AUDIT ===\n');
  
  const jsonFiles = [
    './data/abs_census_by_suburb_expanded.json',
    './data/abs/abs_census_by_suburb_expanded.json'
  ];
  
  for (const file of jsonFiles) {
    if (fs.existsSync(file)) {
      try {
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        const entries = Array.isArray(data) ? data : Object.values(data);
        
        const withpc = entries.filter(e => e.postcode || e.postCode).length;
        const missingpc = entries.length - withpc;
        
        console.log(`${file}:`);
        console.log(`  Total entries: ${entries.length}`);
        console.log(`  WITH postcode: ${withpc}`);
        console.log(`  MISSING: ${missingpc}`);
        
        if (missingpc > 0 && missingpc <= 5) {
          console.log(`  Missing examples: ${entries.filter(e => !e.postcode && !e.postCode).map(e => e.suburb_name || e.SUBURB).slice(0, 3).join(', ')}`);
        }
        console.log();
      } catch (err) {
        console.log(`${file}: Error reading - ${err.message}`);
      }
    }
  }
}
