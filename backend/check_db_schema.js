const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.log('Error:', err.message);
    process.exit(1);
  }
  
  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.log('Error getting tables:', err.message);
      db.close();
      return;
    }
    
    console.log('Tables in database:');
    rows.forEach(r => console.log('  -', r.name));
    
    // Check columns of first table if exists
    if (rows.length > 0) {
      const tableName = rows[0].name;
      console.log(`\nColumns in ${tableName}:`);
      
      db.all(`PRAGMA table_info(${tableName})`, (err, cols) => {
        if (!err && cols) {
          cols.forEach(col => console.log(`  - ${col.name} (${col.type})`));
        }
        
        // Sample data
        db.all(`SELECT * FROM ${tableName} LIMIT 2`, (err, sampleRows) => {
          if (!err && sampleRows) {
            console.log(`\nSample data (first row):`);
            if (sampleRows.length > 0) {
              const row = sampleRows[0];
              Object.entries(row).forEach(([k, v]) => {
                console.log(`  ${k}: ${v}`);
              });
            }
          }
          db.close();
        });
      });
    } else {
      db.close();
    }
  });
});
