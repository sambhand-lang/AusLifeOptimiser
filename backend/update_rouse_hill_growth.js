const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- ROUSE HILL GROWTH CORRIDOR UPDATE ---');

const corridorData = [
  { name: 'Rouse Hill', price: 1650000 },
  { name: 'Kellyville', price: 1850000 },
  { name: 'North Kellyville', price: 1720000 },
  { name: 'Beaumont Hills', price: 1680000 },
  { name: 'Box Hill', price: 1350000 },
  { name: 'Nelson', price: 2100000 },
  { name: 'The Ponds', price: 1580000 },
  { name: 'Riverstone', price: 1050000 },
  { name: 'Schofields', price: 1080000 }
];

db.serialize(() => {
    corridorData.forEach(item => {
        db.run(`
            UPDATE suburbs 
            SET Median_House_Price = ? 
            WHERE Suburb_Name = ? AND State = 'NSW'
        `, [item.price, item.name]);
        console.log(`Updated ${item.name} (NSW) to ${item.price}`);
    });

    console.log('--- RECALIBRATING SCORES FOR ALL SUBURBS ---');
    
    // RE-RUN ULTIMATE SYNC (Simplified inline for safety)
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Cafe_Count, Restaurant_Count, parks_count
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const housePrice = r.Median_House_Price || 900000;
            const population = r.Population || 0;
            const name = (r.Suburb_Name || '').toLowerCase();
            const parks = r.parks_count || 0;
            const schools = r.School_Count || 0;
            const state = r.State || '';
            const commute = r.Commute_Time_Mins || 25;
            const cafes = r.Cafe_Count || 0;
            const restaurants = r.Restaurant_Count || 0;
            const cap = (s) => Math.min(95, s);

            const ratio = housePrice / (income * 52);
            let rs = ratio < 6 ? 100 : ratio < 8 ? 80 : ratio < 10 ? 60 : ratio < 12 ? 40 : 20;
            let bs = housePrice < 600000 ? 100 : housePrice < 1000000 ? 80 : housePrice < 2000000 ? 60 : 25;
            let aff = cap((rs * 0.6) + (bs * 0.4));
            if (housePrice > 800000 && housePrice < 1400000) aff = Math.min(85, aff);

            let emp = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));
            
            let conn = commute < 20 ? 95 : commute < 35 ? 85 : commute < 50 ? 70 : 25;
            if (state === 'ACT' && conn > 88) conn = 88;
            if (state === 'QLD' && conn > 82) conn = 82;

            let ss = Math.min(90, (schools / 30) * 100);
            if (schools < 4 || population < 5000) ss = Math.min(65, ss);
            let fam = cap((ss * 0.6) + (Math.min(100, (parks / Math.max(800, population)) * 40000) * 0.4));

            let lb = ((Math.min(100, (cafes+restaurants) / Math.max(800, population) * 12500) * 0.7) + (Math.min(100, parks / Math.max(800, population) * 5000) * 0.3));
            if (name.includes('beach')) lb += 15;
            if (income > 3000 && housePrice > 1600000) lb += 10;
            let life = cap(lb);

            let overall = (life * 0.2 + fam * 0.2 + conn * 0.2 + emp * 0.15 + aff * 0.25);
            if (life >= 90) overall += 2.5;
            if (housePrice > 1800000 && life > 75 && ss > 75) overall += 3.5;
            if (emp > 85 && life < 40 && population < 15000) overall -= 5;
            if (population < 3000) overall -= 5;

            let stretched = overall;
            if (overall > 75) stretched += (overall - 75) * 0.4;
            if (overall < 70) stretched -= (70 - overall) * 0.4;

            const breakdown = { affordability: aff, employment: emp, commute: conn, schools: fam, lifestyle: life };
            db.run(`UPDATE suburbs SET Overall_Score = ?, Score_Breakdown = ? WHERE SAL_ID = ?`, [Math.round(Math.max(10, Math.min(95, stretched))), JSON.stringify(breakdown), r.SAL_ID]);
        });
        console.log('Recalibration complete.');
        db.close();
    });
});
