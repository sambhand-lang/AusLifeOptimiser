const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- FINAL LAUNCH HARDENING v1.3 ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Harden failed:', err);

        console.log(`Finalizing ${rows.length} suburbs for v1.3 Launch...`);
        let count = 0;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const price = r.Median_House_Price || 900000;
            const schools = r.School_Count || 0;
            const commute = r.Commute_Time_Mins || 25;
            const pop = r.Population || 0;
            const state = r.State || '';

            const cap = (s) => Math.min(95, s);

            // 1. AFFORDABILITY (25%)
            let ratioScore = Math.min(100, (160000 / price) * 10); // Rough ratio proxy
            let barrierScore = price < 1000000 ? 85 : 40;
            
            let affordability = cap((ratioScore * 0.6) + (barrierScore * 0.4));
            if (price > 800000 && price < 1500000) affordability = Math.min(90, affordability);

            // 2. ECONOMY (15%)
            let employment = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));

            // 3. CONNECTIVITY (20%)
            let commuteScore = 0;
            if (commute < 20) commuteScore = 95;
            else if (commute < 35) commuteScore = 85;
            else if (commute < 50) commuteScore = 70;
            else commuteScore = 30;
            
            if (state === 'QLD' && commuteScore > 85) commuteScore = 85;
            if (state === 'ACT' && commuteScore > 88) commuteScore = 88;

            // 4. FAMILY/SCHOOLS (20%)
            let schoolsScore = Math.max(0, Math.min(100, (schools / 30) * 100));
            if (schools < 3) schoolsScore = Math.min(60, schoolsScore);
            if (pop < 5000) schoolsScore = Math.min(65, schoolsScore);

            // 5. LIFESTYLE (20%)
            let lifestyle = r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 40;
            
            // LIFESTYLE AMPLIFIER
            if (r.Suburb_Name.toLowerCase().includes('beach')) lifestyle += 15;
            if (income > 3000 && price > 1500000) lifestyle += 10;
            
            lifestyle = cap(lifestyle);
            if (pop < 800 && pop > 0) lifestyle *= (0.4 + 0.6 * (pop / 800));

            // FINAL WEIGHTS
            const weights = { affordability: 0.25, employment: 0.15, commute: 0.20, education: 0.20, lifestyle: 0.20 };
            
            let baseScore = (
                affordability * weights.affordability +
                employment * weights.employment +
                commuteScore * weights.commute +
                schoolsScore * weights.education +
                lifestyle * weights.lifestyle
            );

            // MINING RISK ADJUSTMENT
            if (employment > 80 && lifestyle < 40 && pop < 20000) {
                baseScore -= 8;
            }

            // DEPTH PENALTY
            if (pop < 3000) baseScore -= 5;

            const overall = Math.max(10, Math.round(baseScore));
            const breakdown = { affordability, employment, commute: commuteScore, schools: schoolsScore, lifestyle };

            db.run(`
                UPDATE suburbs 
                SET Overall_Score = ?, Score_Breakdown = ? 
                WHERE SAL_ID = ?
            `, [overall, JSON.stringify(breakdown), r.SAL_ID]);
            count++;
        });

        console.log(`V1.3 Launch Hardening Complete. ${count} suburbs recalibrated.`);
        db.close();
    });
});
