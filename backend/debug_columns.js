
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function run() {
  const dbPath = path.join(process.cwd(), 'backend', 'suburbs.db');
  console.log('Opening DB:', dbPath);
  const db = new sqlite3.Database(dbPath);
  
  const suburbs = await new Promise((resolve, reject) => {
    db.all("SELECT * FROM suburbs LIMIT 5", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  console.log(JSON.stringify(suburbs, null, 2));
  db.close();
}

run().catch(console.error);
