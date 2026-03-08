const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const db = new sqlite3.Database(DB_PATH);

// Benchmarks from SuburbDetail.tsx (V2 scoring)
const benchmarks = {
  priceMin: 400000, priceMax: 2500000,
  incomeMin: 800, incomeMax: 4000,
  commuteMin: 15, commuteMax: 90,
  schoolMin: 0, schoolMax: 10,
  lifestyleMin: 0, lifestyleMax: 100
};

function normalizeDirect(value, min, max) {
  if (value == null) return 0;
  const score = ((value - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, score));
}

function normalizeInverse(value, min, max) {
  if (value == null) return 0;
  const score = 100 - (((value - min) / (max - min)) * 100);
  return Math.max(0, Math.min(100, score));
}

async function run() {
  console.log('Calculating overall scores for all suburbs...');
  
  const suburbs = await new Promise((resolve, reject) => {
    db.all(`
      SELECT SAL_ID, Suburb_Name, Population, Median_Income_Weekly, Median_House_Price, 
             Commute_Time_Mins, School_Count, Parks_Count, Cafe_Count, Restaurant_Count, 
             Gym_Count, Cinema_Count, Library_Count, Sports_Field_Count
      FROM suburbs
    `, [], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });

  const scored = suburbs.map(row => {
    // Affordability (25%)
    const affordability = row.Median_House_Price ? normalizeInverse(row.Median_House_Price, benchmarks.priceMin, benchmarks.priceMax) : 0;
    
    // Employment (20%) - Using Median Income as proxy
    const employment = row.Median_Income_Weekly ? normalizeDirect(row.Median_Income_Weekly, benchmarks.incomeMin, benchmarks.incomeMax) : 0;
    
    // Commute (20%)
    const commute = row.Commute_Time_Mins ? normalizeInverse(row.Commute_Time_Mins, benchmarks.commuteMin, benchmarks.commuteMax) : 0;
    
    // Schools (15%)
    const schools = row.School_Count ? normalizeDirect(row.School_Count, benchmarks.schoolMin, benchmarks.schoolMax) : 0;
    
    // Lifestyle (20%)
    const pop = row.Population || 0;
    const parkCount = row.Parks_Count || 0;
    const parkPer10k = (pop > 0) ? (parkCount / pop) * 10000 : 0;
    
    const cafes = row.Cafe_Count || 0;
    const restaurants = row.Restaurant_Count || 0;
    const recCount = (row.Gym_Count || 0) + (row.Cinema_Count || 0) + (row.Library_Count || 0) + (row.Sports_Field_Count || 0);
    const transit = 50; // default for lifestyle V2 for now if unknown
    
    const rawLifestyle = (parkPer10k * 0.4) + ((cafes + restaurants) * 0.3) + (recCount * 0.2) + (transit * 0.1);
    const lifestyle = normalizeDirect(rawLifestyle, benchmarks.lifestyleMin, benchmarks.lifestyleMax);
    
    const overallScore = Math.round(
      affordability * 0.25 + 
      employment * 0.20 + 
      commute * 0.20 + 
      schools * 0.15 + 
      lifestyle * 0.20
    );
    
    return { ...row, overallScore };
  });

  // Sort by score descending, then population as tiebreaker
  scored.sort((a, b) => (b.overallScore - a.overallScore) || (b.Population - a.Population));
  
  console.log(`Updating ${scored.length} records...`);
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE suburbs SET Overall_Score = ?, Rank = ? WHERE SAL_ID = ?");
    scored.forEach((s, index) => {
      stmt.run(s.overallScore, index + 1, s.SAL_ID);
    });
    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) console.error(err);
      else console.log('Update Complete!');
      db.close();
    });
  });
}

run();
