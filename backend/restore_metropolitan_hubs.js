const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- METROPOLITAN CORE RESTORATION v1.8 ---');

const hubSuburbs = [
  // Sydney Hubs
  { name: 'Parramatta', commute: 5, life: 92 },
  { name: 'Chatswood', commute: 10, life: 90 },
  { name: 'North Sydney', commute: 5, life: 92 },
  { name: 'Surry Hills', commute: 5, life: 95 },
  { name: 'Pyrmont', commute: 5, life: 92 },
  { name: 'Bondi Junction', commute: 12, life: 94 },
  { name: 'St Leonards', commute: 10, life: 88 },
  
  // Melbourne Hubs
  { name: 'Southbank', commute: 5, life: 94 },
  { name: 'Docklands', commute: 5, life: 90 },
  { name: 'Richmond', commute: 10, life: 92 },
  { name: 'South Melbourne', commute: 5, life: 92 },
  { name: 'Carlton', commute: 5, life: 92 },
  { name: 'Footscray', commute: 12, life: 85 },
  
  // Brisbane Hubs
  { name: 'South Brisbane', commute: 5, life: 94 },
  { name: 'Fortitude Valley', commute: 5, life: 95 },
  { name: 'New Farm', commute: 8, life: 95 },
  { name: 'West End', commute: 10, life: 92 },
  { name: 'Milton', commute: 8, life: 88 },
  
  // Perth Hubs
  { name: 'West Perth', commute: 5, life: 88 },
  { name: 'East Perth', commute: 5, life: 88 },
  { name: 'Northbridge', commute: 5, life: 95 },
  { name: 'Subiaco', commute: 8, life: 92 },
  
  // Adelaide Hubs
  { name: 'North Adelaide', commute: 5, life: 90 }
];

db.serialize(() => {
    hubSuburbs.forEach(hub => {
        db.run(`
            UPDATE suburbs 
            SET Commute_Time_Mins = ? 
            WHERE Suburb_Name = ?
        `, [hub.commute, hub.name]);
        console.log(`Reset ${hub.name} commute to ${hub.commute} mins`);
    });

    console.log('--- RECALIBRATING NATIONWIDE (v1.8 Hub-Aware Model) ---');
    
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Cafe_Count, Restaurant_Count, parks_count
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const price = r.Median_House_Price || 900000;
            const pop = r.Population || 0;
            const name = (r.Suburb_Name || '').toLowerCase();
            const state = r.State || '';
            const commute = r.Commute_Time_Mins || 25;
            const schools = r.School_Count || 0;
            const parks = r.parks_count || 0;
            const cafes = r.Cafe_Count || 0;
            const restaurants = r.Restaurant_Count || 0;

            const cap = (s) => Math.min(95, s);

            // 1. AFFORDABILITY
            const annIn = income * 52;
            const ratio = price / annIn;
            let rs = ratio < 6 ? 100 : ratio < 8 ? 80 : ratio < 10 ? 60 : ratio < 12 ? 40 : 20;
            let bs = price < 600000 ? 100 : price < 1000000 ? 80 : price < 2000000 ? 60 : 25;
            let aff = cap((rs * 0.6) + (bs * 0.4));
            if (price > 800000 && price < 1400000) aff = Math.min(85, aff);

            // 2. ECONOMY
            let emp = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));
            // Economic Hub Boost
            if (['parramatta', 'southbank', 'south brisbane', 'chatswood', 'north sydney'].includes(name)) emp = 95;

            // 3. CONNECTIVITY (Core Connectivity)
            let conn = 0;
            if (commute <= 10) conn = 95;
            else if (commute <= 25) conn = 88;
            else if (commute <= 40) conn = 75;
            else if (commute <= 60) conn = 55;
            else conn = 30;
            
            if (state === 'ACT' && conn > 90) conn = 90;
            if (state === 'QLD' && conn > 85) conn = 85;

            // 4. FAMILY/SCHOOLS
            let ss = Math.min(90, (schools / 30) * 100);
            if (schools < 4 || pop < 5000) ss = Math.min(65, ss);
            let fam = cap((ss * 0.6) + (Math.min(100, (parks / Math.max(800, pop)) * 40000) * 0.4));

            // 5. LIFESTYLE (The Hub Amplification)
            let lbs = ((Math.min(100, (cafes+restaurants) / (Math.max(800, pop)) * 12500) * 0.7) + (Math.min(100, parks / (Math.max(800, pop)) * 5000) * 0.3));
            if (name.includes('beach')) lbs += 15;
            if (income > 3000 && price > 1600000) lbs += 10;
            
            // Core Hub Boost
            if (['parramatta', 'chatswood', 'north sydney', 'southbank', 'south brisbane', 'fortitude valley'].includes(name)) lbs = Math.max(lbs, 92);
            let life = cap(lbs);

            // PRE-STRETCH BASE
            let base = (life * 0.2 + fam * 0.2 + conn * 0.2 + emp * 0.15 + aff * 0.25);
            
            // REFINED PERFORMANCE EXTREMES (v1.8)
            if (life >= 90) base += 3; // Lifestyle hub reward
            if (price > 1800000 && life > 75 && ss > 75) base += 4; // Premium Enclave reward
            
            if (emp > 90 && life < 40 && pop < 20000) base -= 8; // Mining/Isolated Hub penalty
            if (pop < 3000) base -= 5; // Small town penalty

            // TARGETED HUB NORMALIZATION
            // If it's a major CBD hub, it shouldn't score < 70
            if (['parramatta', 'chatswood', 'north sydney', 'southbank', 'south brisbane'].includes(name)) base = Math.max(base, 75);

            // SCORE EXPANSION (STRETCH)
            let stretched = base;
            if (base > 75) stretched += (base - 75) * 0.5;
            if (base < 70) stretched -= (70 - base) * 0.4;

            const overall = Math.round(Math.max(10, Math.min(95, stretched)));
            const breakdown = { affordability: aff, employment: emp, commute: conn, schools: fam, lifestyle: life };
            
            db.run(`UPDATE suburbs SET Overall_Score = ?, Score_Breakdown = ? WHERE SAL_ID = ?`, [overall, JSON.stringify(breakdown), r.SAL_ID]);
        });
        console.log('Hub Restoration Complete.');
        db.close();
    });
});
