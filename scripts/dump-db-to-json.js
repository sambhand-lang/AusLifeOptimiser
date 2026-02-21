const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../backend/suburbs.db');
const outDir = path.join(__dirname, '../netlify/functions');

if (!fs.existsSync(dbPath)) {
  console.error('Database not found at', dbPath);
  process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Failed to open DB:', err);
    process.exit(1);
  }
});

const tables = {
  suburbs: 'SELECT * FROM suburbs',
  suburb_demographics: 'SELECT * FROM suburb_demographics',
  suburb_postcodes: 'SELECT * FROM suburb_postcodes',
};

const promises = Object.entries(tables).map(([name, sql]) => {
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err, rows) => {
      if (err) return reject(err);
      const out = path.join(outDir, `${name}.json`);
      fs.writeFileSync(out, JSON.stringify(rows || [], null, 2));
      console.log('Wrote', out, `(${(rows||[]).length} rows)`);
      resolve();
    });
  });
});

Promise.all(promises)
  .then(() => {
    db.close();
    console.log('Export complete');
  })
  .catch((err) => {
    console.error('Export error:', err);
    db.close();
    process.exit(1);
  });
