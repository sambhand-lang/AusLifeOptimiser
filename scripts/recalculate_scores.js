const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const db = new sqlite3.Database(DB_PATH);

// Optimized 2025 Benchmarks for "Lifestyle Excellence"
const benchmarks = {
  priceMin: 400000, 
  priceMax: 5000000, 
  incomeMin: 800, 
  incomeMax: 4500,   
  commuteMin: 15, 
  commuteMax: 80,    
  schoolMin: 0, 
  schoolMax: 12      
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
  console.log('--- GLOBAL SUBURB SCORING ENGINE V4 (LIFESTYLE FOCUS) ---');
  
  const suburbs = await new Promise((resolve, reject) => {
    db.all(`
      SELECT SAL_ID, Suburb_Name, State, Population, Median_Age, Median_Income_Weekly, Median_House_Price, 
             Commute_Time_Mins, School_Count, Parks_Count, Cafe_Count, Restaurant_Count, 
             Gym_Count, Cinema_Count, Library_Count, Sports_Field_Count, latitude, longitude
      FROM suburbs
    `, [], (err, rows) => {
      if (err) reject(err); else resolve(rows);
    });
  });

  console.log(`Recalculating scores for ${suburbs.length} suburbs...`);

  const scored = suburbs.map(row => {
    const rawPop = row.Population || 0;
    const effectivePop = Math.max(800, rawPop); // Slightly higher floor for more stability
    
    // 1. Affordability (15%) - Weight reduced to favor quality
    const affordability = row.Median_House_Price ? normalizeInverse(row.Median_House_Price, benchmarks.priceMin, benchmarks.priceMax) : 0;
    
    // 2. Economy & Wealth (20%)
    const economy = row.Median_Income_Weekly ? normalizeDirect(row.Median_Income_Weekly, benchmarks.incomeMin, benchmarks.incomeMax) : 0;
    
    // 3. Connectivity & Proximity (20%)
    const connectivity = row.Commute_Time_Mins ? normalizeInverse(row.Commute_Time_Mins, benchmarks.commuteMin, benchmarks.commuteMax) : 0;
    
    // 4. Family & Greenery (20%)
    const schoolScore = normalizeDirect(row.School_Count || 0, benchmarks.schoolMin, benchmarks.schoolMax);
    const parkDensity = ((row.Parks_Count || 0) / effectivePop) * 10000; 
    const parkScore = Math.min(100, parkDensity * 4); // 25 parks per 10k residents = 100
    const family = (schoolScore * 0.6) + (parkScore * 0.4);
    
    // 5. Lifestyle, Dining & Recreation (25%) - Weight increased
    // Density calculation
    const cafeCount = (row.Cafe_Count || 0) + (row.Restaurant_Count || 0);
    const cafeDensity = (cafeCount / effectivePop) * 1000; // Venues per 1k people
    
    // Scoring for vibrant density: 8 venues per 1k = perfect score
    const amenityDensityScore = Math.min(100, cafeDensity * 12.5); 
    
    // Absolute vibrancy bonus (for major hubs)
    const absoluteBonus = Math.min(20, (cafeCount / 40) * 20); // 40+ venues gives +20 bonus to lifestyle raw
    
    const recCount = (row.Gym_Count || 0) + (row.Cinema_Count || 0) + (row.Library_Count || 0) + (row.Sports_Field_Count || 0);
    const recScore = Math.min(100, (recCount / effectivePop) * 5000); 
    
    let lifestyleBase = (amenityDensityScore * 0.7) + (recScore * 0.3) + absoluteBonus;
    lifestyleBase = Math.min(100, lifestyleBase);
    
    // Small suburb dampener (suburbs with < 800 people have "half" lifestyle reach)
    let lifestyleFinal = lifestyleBase;
    if (rawPop < 800) {
        lifestyleFinal *= (0.5 + (0.5 * rawPop / 800));
    }

    const overallScore = Math.round(
      lifestyleFinal * 0.25 + 
      family * 0.20 + 
      connectivity * 0.20 + 
      economy * 0.20 + 
      affordability * 0.15
    );
    
    return { 
      SAL_ID: row.SAL_ID, 
      overallScore,
      Population: rawPop
    };
  });

  // Sort by score descending, then tiebreaker
  scored.sort((a, b) => (b.overallScore - a.overallScore) || (b.Population - a.Population));
  
  console.log(`Applying V4 rankings to database...`);
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE suburbs SET Overall_Score = ?, Rank = ? WHERE SAL_ID = ?");
    scored.forEach((s, index) => {
      stmt.run(s.overallScore, index + 1, s.SAL_ID);
    });
    stmt.finalize();
    db.run("COMMIT", (err) => {
      if (err) console.error(err);
      else console.log('✅ Redo complete. Database is now in Lifestyle-First mode.');
      db.close();
    });
  });
}

run();
