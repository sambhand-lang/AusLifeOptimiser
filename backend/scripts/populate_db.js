#!/usr/bin/env node

/**
 * Quick database populator for suburbs
 * Loads all ABS suburbs into the SQLite database
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(process.cwd(), 'suburbs.db');
const absPath = path.join(__dirname, '..', 'data', 'abs_census_by_suburb_expanded.json');

const db = new sqlite3.Database(dbPath);

console.log('Populating suburbs database...\n');

// Load ABS data
const absData = JSON.parse(fs.readFileSync(absPath, 'utf8'));
const suburbs = Object.keys(absData).map(key => {
  const parts = key.split('|');
  return {
    name: parts[0].trim(),
    state: parts[1] ? parts[1].trim() : 'NSW'
  };
});

// Create table
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS suburbs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suburb_name TEXT NOT NULL,
      state TEXT NOT NULL,
      UNIQUE(suburb_name, state)
    )
  `, (err) => {
    if (err) {
      console.error('Table error:', err);
      db.close();
      return;
    }
    
    console.log(`Inserting ${suburbs.length} suburb records...\n`);
    
    let inserted = 0;
    let processed = 0;
    
    // Use transaction for faster inserts
    db.run('BEGIN TRANSACTION');
    
    const stmt = db.prepare('INSERT OR IGNORE INTO suburbs (suburb_name, state) VALUES (?, ?)');
    
    suburbs.forEach((suburb, idx) => {
      stmt.run([suburb.name, suburb.state], function(err) {
        processed++;
        if (!err && this.changes > 0) inserted++;
        
        // Show progress every 1000 suburbs
        if (processed % 1000 === 0) {
          process.stdout.write(`Processing: ${processed}/${suburbs.length}...` + String.fromCharCode(13));
        }
        
        // When done
        if (processed === suburbs.length) {
          stmt.finalize();
          db.run('COMMIT', (err) => {
            if (err) console.error('Commit error:', err);
            
            console.log(`\n✓ Inserted: ${inserted} suburbs`);
            console.log(`⚠ Skipped: ${suburbs.length - inserted} (duplicates)`);
            console.log(`\n✅ Database populated! Suburbs are now searchable.`);
            console.log('\nChatswood should now be findable via:');
            console.log('  http://localhost:5001/api/suburbs/search?query=CHATSWOOD');
            
            db.close();
          });
        }
      });
    });
  });
});
