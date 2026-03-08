const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');

async function populate() {
  console.log('--- DB AMENITY POPULATOR ---');
  
  const db = new sqlite3.Database(DB_PATH);

  const suburbs = await new Promise((resolve, reject) => {
    db.all('SELECT SAL_ID, Suburb_Name, Population FROM suburbs', (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });

  console.log(`Processing ${suburbs.length} suburbs...`);

  const majorCenters = ['SYDNEY', 'MELBOURNE', 'BRISBANE', 'PERTH', 'ADELAIDE', 'CANBERRA', 'HOBART', 'DARWIN', 'PARRAMATTA', 'BONDI', 'SURRY HILLS', 'RICHMOND', 'ST KILDA', 'BURWOOD', 'CHATSWOOD'];

  db.serialize(() => {
    const stmt = db.prepare('UPDATE suburbs SET Cafe_Count=?, Restaurant_Count=?, Gym_Count=?, Cinema_Count=?, Library_Count=?, Sports_Field_Count=? WHERE SAL_ID=?');

    suburbs.forEach((s, idx) => {
      const pop = s.Population || 0;
      const rawName = (s.Suburb_Name || '').toUpperCase();
      const cleanName = rawName.replace(/\s*\(.*\)$/, '').trim();
      
      let densityFactor = 1.0;
      if (majorCenters.includes(cleanName)) {
        densityFactor = 2.5;
      } else if (pop > 15000) {
        densityFactor = 1.5;
      } else if (pop < 1000) {
        densityFactor = 0.5;
      }

      const cafeCount = Math.max(0, Math.floor((pop / 700) * densityFactor + (Math.random() * 2)));
      const restaurantCount = Math.max(0, Math.floor((pop / 450) * densityFactor + (Math.random() * 3)));
      const gymCount = Math.max(0, Math.floor((pop / 2500) * densityFactor + (Math.random() * 1)));
      const cinemaCount = Math.max(0, Math.floor((pop / 15000) * densityFactor));
      const libraryCount = Math.max(0, Math.floor((pop / 12000) * densityFactor + (pop > 2000 ? 1 : 0)));
      const sportsFieldCount = Math.max(0, Math.floor((pop / 1000) * densityFactor + 2));

      stmt.run([cafeCount, restaurantCount, gymCount, cinemaCount, libraryCount, sportsFieldCount, s.SAL_ID]);

      if ((idx + 1) % 1000 === 0) {
        console.log(`  Processed ${idx + 1} / ${suburbs.length}...`);
      }
    });

    stmt.finalize();
  });

  await new Promise((resolve) => db.close(resolve));
  console.log('--- DB POPULATION COMPLETE ---');
}

populate();
