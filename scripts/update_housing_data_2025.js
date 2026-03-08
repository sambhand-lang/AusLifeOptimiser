const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const db = new sqlite3.Database(DB_PATH);

async function run() {
  console.log('Applying 2024/2025 Housing Data Adjustments...');

  // State-specific growth factors based on 2024-Feb 2025 research
  // We use these multipliers to shift the current synthetic data closer to reality
  const growthMap = {
    'NSW': 1.05, // Sydney +4.9% 2024
    'VIC': 0.98, // Melbourne -1.3% 2024
    'QLD': 1.12, // Brisbane +11.2% 2024
    'SA': 1.13,  // Adelaide +13.1% 2024
    'WA': 1.19,  // Perth +19.1% 2024
    'TAS': 1.00, // Hobart flat
    'ACT': 1.02, // Canberra flat/+2%
    'NT': 1.01   // Darwin +1%
  };

  const suburbs = await new Promise((resolve, reject) => {
    db.all(`SELECT SAL_ID, Suburb_Name, State, Median_House_Price, One_Year_Growth_Pct FROM suburbs`, (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });

  console.log(`Processing ${suburbs.length} suburbs...`);

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE suburbs SET Median_House_Price = ?, One_Year_Growth_Pct = ? WHERE SAL_ID = ?");

    suburbs.forEach(s => {
      const state = s.State || 'NSW';
      const factor = growthMap[state] || 1.05;
      
      // Calculate new median based on state performance
      let newMedian = Math.round(s.Median_House_Price * factor);
      
      // Cap at realistic 2025 levels for high end
      // Top suburbs in Sydney/Melbourne now hit $4M - $10M
      // Our database was strictly capped at $2.5M
      if (newMedian > 2500000) {
          // Allow some to exceed the previous cap if they are in NSW/VIC/WA
          if (state === 'NSW' || state === 'VIC' || state === 'WA') {
              newMedian = Math.min(6500000, newMedian + (Math.random() * 500000));
          }
      }

      // One year growth alignment
      const growthPct = (factor - 1) * 100 + (Math.random() * 2 - 1); // Add some local variance
      
      stmt.run(newMedian, parseFloat(growthPct.toFixed(2)), s.SAL_ID);
    });

    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) console.error(err);
      else console.log('Housing Data Update Complete!');
      db.close();
    });
  });
}

run();
