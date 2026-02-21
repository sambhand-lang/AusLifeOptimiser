const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./suburbs.db');

const countSql = `SELECT COUNT(DISTINCT TRIM(UPPER(suburb_name))||'|'||state) AS unmatched_count
FROM suburbs s
WHERE NOT EXISTS (
  SELECT 1 FROM suburbs s2
  WHERE TRIM(UPPER(s2.suburb_name)) = TRIM(UPPER(s.suburb_name))
    AND s2.state = s.state
    AND s2.ssc IS NOT NULL
);`;

const sampleSql = `SELECT TRIM(UPPER(suburb_name)) AS suburb, state, COUNT(*) AS rows, GROUP_CONCAT(DISTINCT postcode) AS postcodes
FROM suburbs s
WHERE NOT EXISTS (
  SELECT 1 FROM suburbs s2
  WHERE TRIM(UPPER(s2.suburb_name)) = TRIM(UPPER(s.suburb_name))
    AND s2.state = s.state
    AND s2.ssc IS NOT NULL
)
GROUP BY TRIM(UPPER(suburb_name)), state
ORDER BY rows DESC
LIMIT 20;`;

function run() {
  db.get(countSql, (err, row) => {
    if (err) {
      console.error('Count query failed', err.message);
      process.exit(1);
    }
    console.log(JSON.stringify({ unmatched_count: row.unmatched_count }));

    db.all(sampleSql, (err2, rows) => {
      if (err2) {
        console.error('Sample query failed', err2.message);
        process.exit(1);
      }
      console.log(JSON.stringify({ sample: rows }, null, 2));
      db.close();
    });
  });
}

run();
