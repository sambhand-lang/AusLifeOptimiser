const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- REGIONAL HUB CALIBRATION (SHEPPARTON REGION) ---');

db.serialize(() => {
    // 1. Correct the Income for 3631 region
    // Official ABS 2021 Postcode 3631 medians: ~$1,962/wk
    const targetIncome = 1962;

    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = ? 
        WHERE Postcode = '3631' AND (Median_Income_Weekly > 2100 OR Median_Income_Weekly IS NULL)
    `, [targetIncome], (err) => {
        if (!err) console.log('Normalized Postcode 3631 income to $1,962/wk.');
    });

    // 2. Adjust school weighting for regional hubs to prevent 'radius-overcount'
    // If pop < 5,000, we'll cap the school count at 8 strictly to keep it local.
    db.run(`
        UPDATE suburbs 
        SET School_Count = 8
        WHERE Population < 3000 AND School_Count > 8 AND State = 'VIC' AND Postcode LIKE '3%'
          AND Suburb_Name LIKE 'Shepparton%'
    `, (err) => {
        if (!err) console.log('Calibrated local school counts for regional growth corridors.');
    });

    // 3. Recalculate Overall Scores for the whole region
    // Using a refined V4 internal logic
    db.all(`
        SELECT SAL_ID, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Population
        FROM suburbs 
        WHERE Postcode = '3631' OR (Suburb_Name LIKE 'Shepparton%')
    `, (err, rows) => {
        if (!err && rows) {
            rows.forEach(r => {
                const income = r.Median_Income_Weekly || targetIncome;
                const price = r.Median_House_Price || 580000;
                const schools = r.School_Count || 0;
                const commute = r.Commute_Time_Mins || 20;
                
                // Simplified recalculation to update Overall_Score column
                const annualIncome = income * 52;
                const ratio = annualIncome / price;
                const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.18)) * 100));
                
                const employment = Math.max(0, Math.min(100, ((income - 800) / 3200) * 100));
                const commuteScore = Math.max(0, Math.min(100, ((80 - commute) / 65) * 100));
                const schoolScore = Math.max(0, Math.min(100, (schools / 25) * 100));
                
                const lifestyle = 35; // Basic regional lifestyle default
                const weights = { affordability: 0.15, employment: 0.20, commute: 0.20, family: 0.20, lifestyle: 0.25 };
                
                const overall = (
                    affordability * weights.affordability +
                    employment * weights.employment +
                    commuteScore * weights.commute +
                    schoolScore * weights.family +
                    lifestyle * weights.lifestyle
                );

                const finalScore = Math.round(overall);
                const breakdown = { affordability, employment, commute: commuteScore, schools: schoolScore, lifestyle };

                db.run(`
                    UPDATE suburbs 
                    SET Overall_Score = ?, Score_Breakdown = ? 
                    WHERE SAL_ID = ?
                `, [finalScore, JSON.stringify(breakdown), r.SAL_ID]);
            });
            console.log(`Re-calculated scores for ${rows.length} regional suburbs.`);
        }
        db.close();
    });
});
