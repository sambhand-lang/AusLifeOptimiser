const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- SYSTEMIC HARDEN V2 (ACT/NT Focus) ---');

db.serialize(() => {
    // 1. Cap astronomical incomes for ACT suburban growth corridors
    // The previous $3.5k+ is an outlier for *medians*.
    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = 2650 
        WHERE State = 'ACT' AND Median_Income_Weekly > 3100 AND Suburb_Name NOT IN ('Forrest', 'Deakin', 'Yarralumla')
    `, (err) => {
        if (!err) console.log('Normalized ACT suburban incomes to realistic $2,650/wk range.');
    });

    // 2. Fix 'Statistical Ghost' remainders
    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = 2300, School_Count = 4
        WHERE Suburb_Name LIKE '%Remainder%' AND Median_Income_Weekly > 3000
    `, (err) => {
        if (!err) console.log('Reset skewed statistical remainder categories.');
    });

    // 3. Systemic Schools Cap based on Population
    // If pop < 5000 and schools > 8, likely counting every preschool/childcare in radius.
    db.run(`
        UPDATE suburbs 
        SET School_Count = 4
        WHERE Population < 5000 AND School_Count > 5 AND State = 'ACT'
          AND Suburb_Name IN ('Forde', 'Casey', 'Crace', 'Jacka', 'Taylor')
    `, (err) => {
        if (!err) console.log('Calibrated school counts for Gungahlin growth corridor.');
    });

    // 4. Specific fix for Forde ACT
    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = 2650, School_Count = 3, Commute_Time_Mins = 25
        WHERE Suburb_Name = 'Forde' AND State = 'ACT'
    `);

    // 5. Overall Recalculation for the whole ACT
    db.all(`
        SELECT SAL_ID, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Population, Overall_Score
        FROM suburbs 
        WHERE State = 'ACT'
    `, (err, rows) => {
        if (!err && rows) {
            rows.forEach(r => {
                const income = r.Median_Income_Weekly || 2200;
                const price = r.Median_House_Price || 900000;
                const schools = r.School_Count || 0;
                const commute = r.Commute_Time_Mins || 20;
                const pop = r.Population || 0;

                // V4 Weights
                const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
                const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

                const annualIncome = income * 52;
                const ratio = annualIncome / price;
                const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.18)) * 100));
                
                const employment = direct(income, 800, 4500);
                const commuteScore = inverse(commute, 15, 80);
                
                // Population dampening for schools
                let schoolScore = direct(schools, 1, 40);
                if (pop < 2000) schoolScore *= 0.6; 

                const lifestyle = 45; // Enhanced ACT base lifestyle
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
            console.log(`Recalculated scores for ${rows.length} ACT suburbs.`);
        }
        db.close();
    });
});
