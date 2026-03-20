const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- NATIONAL HARDENING V4 (REALITY LAYER) ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown
        FROM suburbs 
        WHERE Overall_Score IS NOT NULL
    `, (err, rows) => {
        if (err || !rows) return console.error('Harden failed:', err);

        console.log(`Auditing ${rows.length} suburbs for reality layer constraints...`);
        let correctedCount = 0;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const price = r.Median_House_Price || 900000;
            const schools = r.School_Count || 0;
            const commute = r.Commute_Time_Mins || 25;
            const pop = r.Population || 0;

            // V4 Logic
            const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
            const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

            const annualIncome = income * 52;
            const ratio = annualIncome / price;
            const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.18)) * 100));
            
            const employment = direct(income, 800, 4500);
            
            // 1. Commute Constraint
            let commuteScore = inverse(commute, 15, 80);
            if (commute > 40) commuteScore = Math.min(85, commuteScore);
            if (commute > 60) commuteScore = Math.min(65, commuteScore);

            // 2. Schools Constraint
            let schoolsScore = direct(schools, 1, 30);
            if (schools <= 2) schoolsScore = Math.min(65, schoolsScore);
            if (pop < 5000) schoolsScore = Math.min(80, schoolsScore);

            // 3. Lifestyle (Dampened for small towns)
            let baseLifestyle = r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 40;
            if (pop < 1000) baseLifestyle *= (0.4 + 0.6 * (pop / 1000));

            const weights = { affordability: 0.15, employment: 0.20, commute: 0.20, family: 0.20, lifestyle: 0.25 };
            const overall = (
                affordability * weights.affordability +
                employment * weights.employment +
                commuteScore * weights.commute +
                schoolsScore * weights.family +
                baseLifestyle * weights.lifestyle
            );

            const finalScore = Math.round(overall);
            const breakdown = { affordability, employment, commute: commuteScore, schools: schoolsScore, lifestyle: baseLifestyle };

            // Update if changed
            if (finalScore !== r.Overall_Score) {
                db.run(`
                    UPDATE suburbs 
                    SET Overall_Score = ?, Score_Breakdown = ? 
                    WHERE SAL_ID = ?
                `, [finalScore, JSON.stringify(breakdown), r.SAL_ID]);
                correctedCount++;
            }
        });

        console.log(`Hardening Complete. ${correctedCount} suburbs updated with Reality Layer.`);
        db.close();
    });
});
