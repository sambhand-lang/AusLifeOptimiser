const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

const urbanFixes = [
    { name: 'Chatswood', state: 'NSW', housePrice: 3200000, income: 2600 },
    { name: 'Glenwood (NSW)', state: 'NSW', housePrice: 1450000, income: 2450 },
    { name: 'Parramatta', state: 'NSW', housePrice: 1600000, income: 2100 },
    { name: 'Box Hill (Vic.)', state: 'VIC', housePrice: 1750000, income: 1950 },
    { name: 'Chermside', state: 'QLD', housePrice: 1050000, income: 1800 },
    { name: 'Ryde', state: 'NSW', housePrice: 2200000, income: 2300 }
];

db.serialize(() => {
    console.log('--- CORRECTING URBAN CENTER PRICE SKEWS ---');

    urbanFixes.forEach(f => {
        db.run(`
            UPDATE suburbs 
            SET Median_House_Price = ?, 
                Median_Income_Weekly = ? 
            WHERE Suburb_Name = ? AND (State = ? OR State IS NULL)
        `, [f.housePrice, f.income, f.name, f.state], (err) => {
            if (!err) console.log(`Fixed ${f.name} Hub: Price=$${f.housePrice}, Income=$${f.income}`);
        });
    });

    // National Logic Pass: Re-calculate scores for all major state-leaders
    db.all(`
        SELECT SAL_ID, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Overall_Score
        FROM suburbs 
        WHERE Suburb_Name IN ('Chatswood', 'Glenwood (NSW)', 'Parramatta', 'Box Hill (Vic.)', 'Ryde')
    `, (err, rows) => {
        if (!err && rows) {
            rows.forEach(r => {
                const income = r.Median_Income_Weekly;
                const price = r.Median_House_Price;
                const schools = r.School_Count || 5;
                const commute = r.Commute_Time_Mins || 20;

                // V4 Weights
                const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
                const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

                const annualIncome = income * 52;
                const ratio = annualIncome / price;
                const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.18)) * 100));
                
                const employment = direct(income, 800, 4500);
                const commuteScore = inverse(commute, 15, 80);
                const schoolScore = direct(schools, 1, 30);
                
                const lifestyle = 85; // High-flyer urban hubs have highest lifestyle/amenity availability
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
            console.log('Urban Hub Recalculation Complete.');
        }
        db.close();
    });
});
