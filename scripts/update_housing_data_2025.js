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
    db.all(`SELECT SAL_ID, Suburb_Name, State, Postcode, Median_House_Price, One_Year_Growth_Pct FROM suburbs`, (err, rows) => {
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
      
      // APPLY METRO FLOORS (2025 REALISM)
      // Many synthetic values are in the $400k-$700k range for Sydney/Melbourne, which is impossible.
      const pc = parseInt(s.Postcode);
      if (state === 'NSW' && pc >= 2000 && pc <= 2234) {
          if (newMedian < 1200000) newMedian = 1250000 + (Math.random() * 200000); // Sydney Floor
      }
      if (state === 'VIC' && pc >= 3000 && pc <= 3207) {
          if (newMedian < 800000) newMedian = 850000 + (Math.random() * 150000); // Melbourne Floor
      }
      if (state === 'QLD' && pc >= 4000 && pc <= 4179) {
          if (newMedian < 750000) newMedian = 800000 + (Math.random() * 120000); // Brisbane Floor
      }

      // Coastal & Regional Hubs
      if (state === 'NSW') {
        if (pc >= 2481 && pc <= 2483 && newMedian < 1400000) newMedian = 1500000 + (Math.random() * 400000); // Byron Shire
        if (pc >= 2250 && pc <= 2263 && newMedian < 800000) newMedian = 850000 + (Math.random() * 100000); // Central Coast
        if (pc >= 2500 && pc <= 2530 && newMedian < 850000) newMedian = 900000 + (Math.random() * 150000); // Wollongong/Illawarra
        if (pc >= 2264 && pc <= 2308 && newMedian < 800000) newMedian = 850000 + (Math.random() * 150000); // Newcastle
      }
      
      if (state === 'QLD') {
        if (pc >= 4210 && pc <= 4230 && newMedian < 900000) newMedian = 950000 + (Math.random() * 200000); // Gold Coast
        if (pc >= 4550 && pc <= 4575 && newMedian < 850000) newMedian = 900000 + (Math.random() * 150000); // Sunshine Coast
      }
      
      if (state === 'VIC') {
        if (pc >= 3220 && pc <= 3233 && newMedian < 800000) newMedian = 850000 + (Math.random() * 150000); // Surf Coast / Geelong
        if (pc >= 3926 && pc <= 3944 && newMedian < 1000000) newMedian = 1100000 + (Math.random() * 300000); // Mornington Peninsula
      }

      // Cap at realistic 2025 levels for high end
      if (newMedian > 2500000) {
          if (state === 'NSW' || state === 'VIC' || state === 'WA') {
              newMedian = Math.min(12000000, newMedian + (Math.random() * 1000000));
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
