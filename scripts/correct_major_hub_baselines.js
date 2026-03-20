const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const db = new sqlite3.Database(DB_PATH);

async function run() {
  console.log('Applying 2024/2025 Major Hub House Price Corrections...');

  // 2025 Market Baselines for High-Profile Suburbs (Major Correction)
  // These represent the ACTUAL median house prices (not units) to ensure the data is trustworthy.
  const corrections = [
    // --- NSW High Profiles & Growth Corridors ---
    { name: 'Parramatta', state: 'NSW', price: 1690000, rent: 780 },
    { name: 'North Parramatta', state: 'NSW', price: 1650000, rent: 750 },
    { name: 'Chatswood', state: 'NSW', price: 3550000, rent: 1100 },
    { name: 'Bondi', state: 'NSW', price: 4500000, rent: 1800 },
    { name: 'Bondi Beach', state: 'NSW', price: 5100000, rent: 2200 },
    { name: 'Vaucluse', state: 'NSW', price: 8800000, rent: 4800 },
    { name: 'Mosman', state: 'NSW', price: 5600000, rent: 2500 },
    { name: 'Clontarf (NSW)', state: 'NSW', price: 6300000, rent: 2800 },
    { name: 'Seaforth (NSW)', state: 'NSW', price: 4850000, rent: 2200 },
    { name: 'Bellevue Hill', state: 'NSW', price: 9200000, rent: 5200 },
    { name: 'Double Bay', state: 'NSW', price: 6500000, rent: 3200 },
    { name: 'Byron Bay', state: 'NSW', price: 2200000, rent: 1100 },
    { name: 'Lennox Head', state: 'NSW', price: 1650000, rent: 900 },
    { name: 'Bronte', state: 'NSW', price: 5800000, rent: 2600 },
    { name: 'Kellyville', state: 'NSW', price: 1945000, rent: 950 },
    { name: 'Castle Hill', state: 'NSW', price: 2510000, rent: 1100 },
    { name: 'Baulkham Hills', state: 'NSW', price: 1950000, rent: 900 },
    { name: 'Bella Vista', state: 'NSW', price: 2400000, rent: 1100 },
    { name: 'Winston Hills', state: 'NSW', price: 1800000, rent: 850 },
    { name: 'Beaumont Hills', state: 'NSW', price: 1850000, rent: 950 },
    { name: 'Blacktown', state: 'NSW', price: 1140000, rent: 650 },
    { name: 'Penrith', state: 'NSW', price: 1080000, rent: 600 },
    { name: 'Liverpool', state: 'NSW', price: 1200000, rent: 620 },
    { name: 'Campbelltown', state: 'NSW', price: 1050000, rent: 580 },
    { name: 'Hornsby', state: 'NSW', price: 1850000, rent: 850 },
    { name: 'Cronulla', state: 'NSW', price: 3327500, rent: 1400 },
    { name: 'Ryde', state: 'NSW', price: 2350000, rent: 900 },
    { name: 'Epping', state: 'NSW', price: 2200000, rent: 880 },
    { name: 'Strathfield (NSW)', state: 'NSW', price: 3600000, rent: 1200 },
    { name: 'Northwood', state: 'NSW', price: 5400000, rent: 2400 },
    { name: 'Longueville', state: 'NSW', price: 5000000, rent: 2200 },
    { name: 'Greenwich', state: 'NSW', price: 3900000, rent: 1800 },
    { name: 'Woolwich', state: 'NSW', price: 6890000, rent: 3000 },
    { name: 'Lane Cove', state: 'NSW', price: 3100000, rent: 1400 },
    { name: 'Willoughby', state: 'NSW', price: 3700000, rent: 1600 },
    { name: 'Cammeray', state: 'NSW', price: 3200000, rent: 1450 },
    { name: 'Cremorne Point', state: 'NSW', price: 4900000, rent: 2100 },
    { name: 'Wahroonga', state: 'NSW', price: 3850000, rent: 1650 },
    { name: 'Killara', state: 'NSW', price: 3900000, rent: 1700 },

    // --- VIC High Profiles & Growth Corridors ---
    { name: 'Toorak', state: 'VIC', price: 5800000, rent: 2600 },
    { name: 'Brighton (Vic.)', state: 'VIC', price: 3950000, rent: 1800 },
    { name: 'South Yarra', state: 'VIC', price: 2300000, rent: 1100 },
    { name: 'Albert Park (Vic.)', state: 'VIC', price: 2450000, rent: 1200 },
    { name: 'Balwyn', state: 'VIC', price: 3100000, rent: 1300 },
    { name: 'Camberwell', state: 'VIC', price: 2750000, rent: 1200 },
    { name: 'Malvern', state: 'VIC', price: 3300000, rent: 1500 },
    { name: 'Portsea', state: 'VIC', price: 3800000, rent: 1600 },
    { name: 'Sorrento (Vic.)', state: 'VIC', price: 2200000, rent: 950 },
    { name: 'Flinders (Vic.)', state: 'VIC', price: 3400000, rent: 1250 },
    { name: 'Kew', state: 'VIC', price: 3200000, rent: 1350 },
    { name: 'Hawthorn (Vic.)', state: 'VIC', price: 2800000, rent: 1250 },
    { name: 'East Melbourne', state: 'VIC', price: 3600000, rent: 1500 },

    // --- ACT High Profiles ---
    { name: 'Yarralumla', state: 'ACT', price: 2200000, rent: 1100 },
    { name: 'Isaacs', state: 'ACT', price: 1400000, rent: 850 },
    { name: 'Mawson', state: 'ACT', price: 1200000, rent: 750 },
    { name: 'Barton', state: 'ACT', price: 1500000, rent: 800 },
    { name: 'Malvern (Vic.)', state: 'VIC', price: 3300000, rent: 1450 },
    { name: 'Balwyn', state: 'VIC', price: 2700000, rent: 1100 },
    { name: 'Forrest', state: 'ACT', price: 3800000, rent: 1600 },
    { name: 'Griffith', state: 'ACT', price: 2400000, rent: 1100 },
    { name: 'Red Hill (ACT)', state: 'ACT', price: 2600000, rent: 1200 },
    { name: 'Crestwood', state: 'ACT', price: 845000, rent: 450 },

    // --- QLD High Profiles ---
    { name: 'Brisbane City', state: 'QLD', price: 1650000, rent: 850 },
    { name: 'New Farm', state: 'QLD', price: 2650000, rent: 1200 },
    { name: 'Paddington (Qld)', state: 'QLD', price: 1850000, rent: 880 },
    { name: 'Carindale', state: 'QLD', price: 1775000, rent: 850 },
    { name: 'Chermside', state: 'QLD', price: 1050000, rent: 620 },
    { name: 'North Lakes', state: 'QLD', price: 980000, rent: 650 },

    // --- WA High Profiles ---
    { name: 'Peppermint Grove', state: 'WA', price: 5200000, rent: 2200 },
    { name: 'Dalkeith', state: 'WA', price: 3450000, rent: 1500 },
    { name: 'Scarborough', state: 'WA', price: 1450000, rent: 800 },
    { name: 'Joondalup', state: 'WA', price: 930000, rent: 650 },

    // --- SA High Profiles ---
    { name: 'Medindie', state: 'SA', price: 3300000, rent: 1200 },
    { name: 'Unley', state: 'SA', price: 1750000, rent: 850 },
    { name: 'Adelaide', state: 'SA', price: 1050000, rent: 720 },
    { name: 'Burnside', state: 'SA', price: 1550000, rent: 820 },
    { name: 'Toorak Gardens', state: 'SA', price: 2150000, rent: 950 },
    { name: 'Ascot', state: 'QLD', price: 2350000, rent: 1100 },
    { name: 'Teneriffe', state: 'QLD', price: 3500000, rent: 1700 },
    { name: 'Cottesloe', state: 'WA', price: 3250000, rent: 1400 },
    { name: 'Subiaco', state: 'WA', price: 1650000, rent: 880 }
  ];

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare(`
      UPDATE suburbs 
      SET Median_House_Price = ?, Median_Rent_Weekly = ?, Rental_Yield_Pct = ? 
      WHERE (UPPER(Suburb_Name) = UPPER(?) OR UPPER(Suburb_Name) LIKE UPPER(?) || ' (%)') 
      AND State = ?
    `);

    corrections.forEach(c => {
      const yieldPct = (c.rent * 52 / c.price) * 100;
      stmt.run(c.price, c.rent, parseFloat(yieldPct.toFixed(2)), c.name, c.name, c.state);
      console.log(`  Fixed: ${c.name}, ${c.state} -> $${(c.price/1000000).toFixed(2)}M`);
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
