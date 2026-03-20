const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- GOLD STANDARD SCORING v1.0 MIGRATION ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Migration failed:', err);

        console.log(`Migrating ${rows.length} suburbs to Gold Standard v1.0...`);
        let count = 0;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const price = r.Median_House_Price || 900000;
            const schools = r.School_Count || 0;
            const commute = r.Commute_Time_Mins || 25;
            const pop = r.Population || 0;

            // 1. AFFORDABILITY (25%)
            const annualIncome = income * 52;
            const ratio = price / annualIncome;
            let ratioScore = 0;
            if (ratio < 6) ratioScore = 100;
            else if (ratio < 8) ratioScore = 80;
            else if (ratio < 10) ratioScore = 60;
            else if (ratio < 12) ratioScore = 40;
            else ratioScore = 20;

            let barrierScore = 0;
            if (price < 600000) barrierScore = 100;
            else if (price < 1000000) barrierScore = 80;
            else if (price < 2000000) barrierScore = 60;
            else if (price < 3000000) barrierScore = 40;
            else if (price < 5000000) barrierScore = 25;
            else barrierScore = 10;

            const affordability = (ratioScore * 0.6) + (barrierScore * 0.4);

            // 2. ECONOMY (15%)
            const employment = Math.max(0, Math.min(100, ((income - 800) / 3700) * 100));

            // 3. CONNECTIVITY (20%)
            let commuteScore = 0;
            if (commute < 20) commuteScore = 100;
            else if (commute < 35) commuteScore = 80;
            else if (commute < 50) commuteScore = 60;
            else if (commute < 70) commuteScore = 40;
            else commuteScore = 20;
            
            if (commute > 40) commuteScore = Math.min(85, commuteScore);

            // 4. FAMILY/SCHOOLS (20%)
            let schoolsScore = Math.max(0, Math.min(100, (schools / 30) * 100));
            if (schools < 3) schoolsScore = Math.min(65, schoolsScore);
            if (pop < 5000) schoolsScore = Math.min(70, schoolsScore);
            
            const family = schoolsScore; // Simplified for DB-wide pass

            // 5. LIFESTYLE (20%)
            let lifestyle = r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 40;
            if (r.Suburb_Name.toLowerCase().includes('beach')) lifestyle += 10;
            if (pop < 800 && pop > 0) lifestyle *= (0.4 + 0.6 * (pop / 800));
            lifestyle = Math.min(100, lifestyle);

            // Weights Configuration
            const weights = { affordability: 0.25, employment: 0.15, commute: 0.20, education: 0.20, lifestyle: 0.20 };
            
            const overall = (
                affordability * weights.affordability +
                employment * weights.employment +
                commuteScore * weights.commute +
                family * weights.education +
                lifestyle * weights.lifestyle
            );

            const breakdown = { affordability, employment, commute: commuteScore, schools: family, lifestyle };

            db.run(`
                UPDATE suburbs 
                SET Overall_Score = ?, Score_Breakdown = ? 
                WHERE SAL_ID = ?
            `, [Math.round(overall), JSON.stringify(breakdown), r.SAL_ID]);
            count++;
        });

        console.log(`Migration Complete. ${count} suburbs updated to v1.0.`);
        db.close();
    });
});
