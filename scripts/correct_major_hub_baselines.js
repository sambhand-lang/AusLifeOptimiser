const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const db = new sqlite3.Database(DB_PATH);

async function run() {
  console.log('Applying 2024/2025 Major Hub House Price Corrections...');

  // 2025 Market Baselines for High-Profile Suburbs (Major Correction)
  // These represent the ACTUAL median house prices (not units) to ensure the data is trustworthy.
  const corrections = [
    // --- NSW High Profiles ---
    { name: 'Parramatta', state: 'NSW', price: 1690000, rent: 780 },
    { name: 'North Parramatta', state: 'NSW', price: 1650000, rent: 750 },
    { name: 'Chatswood', state: 'NSW', price: 3550000, rent: 1100 },
    { name: 'Bondi', state: 'NSW', price: 4500000, rent: 1800 },
    { name: 'Bondi Junction', state: 'NSW', price: 3200000, rent: 1400 },
    { name: 'Bondi Beach', state: 'NSW', price: 5100000, rent: 2200 },
    { name: 'Surry Hills', state: 'NSW', price: 2350000, rent: 1100 },
    { name: 'Pyrmont', state: 'NSW', price: 2150000, rent: 1050 },
    { name: 'Burwood (NSW)', state: 'NSW', price: 2450000, rent: 850 },
    { name: 'Blacktown', state: 'NSW', price: 1150000, rent: 620 },
    { name: 'Manly', state: 'NSW', price: 4200000, rent: 1900 },
    { name: 'Vaucluse', state: 'NSW', price: 8500000, rent: 4500 },
    
    // --- VIC High Profiles ---
    { name: 'Toorak', state: 'VIC', price: 5200000, rent: 1900 },
    { name: 'Richmond (Vic.)', state: 'VIC', price: 1450000, rent: 820 },
    { name: 'South Yarra', state: 'VIC', price: 2100000, rent: 950 },
    { name: 'St Kilda', state: 'VIC', price: 1750000, rent: 880 },
    { name: 'Carlton', state: 'VIC', price: 1620000, rent: 840 },
    { name: 'Burwood (Vic.)', state: 'VIC', price: 1550000, rent: 750 },

    // --- QLD High Profiles ---
    { name: 'Brisbane City', state: 'QLD', price: 1650000, rent: 850 },
    { name: 'New Farm', state: 'QLD', price: 2650000, rent: 1200 },
    { name: 'Ascot', state: 'QLD', price: 2350000, rent: 1100 },
    { name: 'Teneriffe', state: 'QLD', price: 3500000, rent: 1700 },

    // --- WA High Profiles ---
    { name: 'Subiaco', state: 'WA', price: 1650000, rent: 880 },
    { name: 'Dalkeith', state: 'WA', price: 3450000, rent: 1500 },
    { name: 'Cottesloe', state: 'WA', price: 3250000, rent: 1400 },
    { name: 'Peppermint Grove', state: 'WA', price: 5200000, rent: 2200 },

    // --- SA High Profiles ---
    { name: 'Toorak Gardens', state: 'SA', price: 2150000, rent: 950 },
    { name: 'Adelaide', state: 'SA', price: 1050000, rent: 720 },
    { name: 'Burnside', state: 'SA', price: 1550000, rent: 820 }
  ];

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE suburbs SET Median_House_Price = ?, Median_Rent_Weekly = ?, Rental_Yield_Pct = ? WHERE Suburb_Name = ? AND State = ?");

    corrections.forEach(c => {
      const yieldPct = (c.rent * 52 / c.price) * 100;
      stmt.run(c.price, c.rent, parseFloat(yieldPct.toFixed(2)), c.name, c.state);
      console.log(`  Fixed: ${c.name}, ${c.state} -> $${(c.price/1000000).toFixed(2)}M (Yield: ${yieldPct.toFixed(2)}%)`);
    });

    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) console.error(err);
      else console.log('✅ Major Hub corrections applied successfully!');
      db.close();
    });
  });
}

run();
