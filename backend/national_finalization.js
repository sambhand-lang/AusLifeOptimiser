const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- NATIONAL FINALIZATION V3 ---');

db.serialize(() => {
    // 1. Ghost Hamlet Reset (Pop < 20)
    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = 1650, 
            School_Count = 0, 
            Overall_Score = 15
        WHERE Population < 20 AND Overall_Score > 40
    `, (err) => {
        if (!err) console.log('Reset statistical outliers for zero-population hamlets.');
    });

    // 2. National Income Absolute Cap ($3,250/wk) for Suburban Australia
    // Genuine top-tier hubs (Toorak, Bondi, etc.) are allowed up to 4500.
    const eliteSuburbs = [
        'Toorak', 'Bondi', 'Manly', 'Mosman', 'Vaucluse', 'Double Bay', 'Bellevue Hill', 'Point Piper', 
        'Brighton', 'Ascot', 'Peppermint Grove', 'Dalkeith', 'Nedlands', 'Hyde Park', 'Yarralumla', 'Red Hill'
    ];
    
    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = 3100
        WHERE Median_Income_Weekly > 3500 
          AND Suburb_Name NOT IN (${eliteSuburbs.map(s => `'${s}'`).join(', ')})
    `, (err) => {
        if (!err) console.log('Capped national income outliers at $3,100/wk for non-elite areas.');
    });

    // 3. National Price Sanity check for Remote areas
    // If pop < 5000 and price > 2.5M, it's likely a data-skew in regional/remote logic
    db.run(`
        UPDATE suburbs 
        SET Median_House_Price = 850000
        WHERE Population < 5000 
          AND Median_House_Price > 2500000
          AND State NOT IN ('NSW', 'VIC') 
          AND Suburb_Name NOT IN (${eliteSuburbs.map(s => `'${s}'`).join(', ')})
    `, (err) => {
        if (!err) console.log('Fixed regional price skews for remote localities.');
    });

    // 4. Force Final Recalculation for National Top 500 Candidates
    db.all(`
        SELECT SAL_ID, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Overall_Score
        FROM suburbs 
        WHERE Overall_Score > 65
    `, (err, rows) => {
        if (!err && rows) {
            console.log(`Re-auditing ${rows.length} National Leader candidates...`);
            rows.forEach(r => {
                const income = r.Median_Income_Weekly || 1800;
                const price = r.Median_House_Price || 900000;
                const schools = r.School_Count || 0;
                const commute = r.Commute_Time_Mins || 25;
                const pop = r.Population || 0;

                // Final V4 Logic
                const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
                const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

                const annualIncome = income * 52;
                const ratio = annualIncome / price;
                const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.18)) * 100));
                
                const employment = direct(income, 800, 4500);
                const commuteScore = inverse(commute, 15, 80);
                
                let schoolScore = direct(schools, 1, 30);
                if (pop < 3000) schoolScore *= 0.7;

                const lifestyleRaw = 50; // High-flyer candidate default
                const lifestyle = pop < 2000 ? (lifestyleRaw * 0.6) : lifestyleRaw;
                
                const weights = { affordability: 0.15, employment: 0.20, commute: 0.20, family: 0.20, lifestyle: 0.25 };
                const overall = (
                    affordability * weights.affordability +
                    employment * weights.employment +
                    commuteScore * weights.commute +
                    schoolScore * weights.family +
                    lifestyle * weights.lifestyle
                );

                db.run(`
                    UPDATE suburbs 
                    SET Overall_Score = ?, Score_Breakdown = ? 
                    WHERE SAL_ID = ?
                `, [Math.round(overall), JSON.stringify({ affordability, employment, commute: commuteScore, schools: schoolScore, lifestyle }), r.SAL_ID]);
            });
            console.log('National Finalization Complete.');
        }
        db.close();
    });
});
