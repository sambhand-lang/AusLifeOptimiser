const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- MARKET AUTHORITY HARDENING v1.2 ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Harden failed:', err);

        console.log(`Auditing ${rows.length} suburbs for Authority v1.2 compliance...`);
        let count = 0;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const price = r.Median_House_Price || 900000;
            const schools = r.School_Count || 0;
            const commute = r.Commute_Time_Mins || 25;
            const pop = r.Population || 0;

            const cap = (s) => Math.min(95, s);

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

            let affordability = cap((ratioScore * 0.6) + (barrierScore * 0.4));
            
            // 2. ECONOMY (15%)
            let employment = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));

            // 3. CONNECTIVITY (20%) - ACCESS FOCUS
            let commuteScore = 0;
            if (commute < 20) commuteScore = 95;
            else if (commute < 35) commuteScore = 85;
            else if (commute < 45) commuteScore = 75;
            else if (commute < 60) commuteScore = 60;
            else commuteScore = 35;
            
            // Hard Rules
            if (commute > 45) commuteScore = Math.min(70, commuteScore);
            if (commute > 75) commuteScore = Math.min(35, commuteScore);

            // Explicit Outlier Fixes
            if (r.Suburb_Name === 'Garran') commuteScore = Math.min(90, commuteScore);
            if (['Cameron Park', 'Henley Brook', 'Ironbark', 'Wakerley'].includes(r.Suburb_Name)) commuteScore = Math.min(70, commuteScore);

            // 4. FAMILY/SCHOOLS (20%)
            let schoolsScore = Math.max(0, Math.min(100, (schools / 30) * 100));
            if (schools < 3) schoolsScore = Math.min(60, schoolsScore);
            if (pop < 5000) schoolsScore = Math.min(65, schoolsScore);
            
            // Explicit Outlier Fixes
            if (['Port Hedland', 'Wickham', 'Ironbark'].includes(r.Suburb_Name)) schoolsScore = Math.min(65, schoolsScore);

            // 5. LIFESTYLE (20%)
            let lifestyle = r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 40;
            if (r.Suburb_Name.toLowerCase().includes('beach')) lifestyle += 10;
            if (pop < 800 && pop > 0) lifestyle *= (0.4 + 0.6 * (pop / 800));
            lifestyle = cap(lifestyle);

            // FINAL WEIGHTS
            const weights = { affordability: 0.25, employment: 0.15, commute: 0.20, family: 0.20, lifestyle: 0.20 };
            
            let baseScore = (
                affordability * weights.affordability +
                employment * weights.employment +
                commuteScore * weights.commute +
                schoolsScore * weights.family +
                lifestyle * weights.lifestyle
            );

            // DEPTH PENALTY
            if (pop < 3000) baseScore -= 5;
            if (pop < 800) baseScore -= 5;

            // REALITY PENALTY: Limit "Near-Perfect" suburbs
            const perfectMetrics = [affordability, lifestyle, schoolsScore, commuteScore, employment].filter(x => x >= 94).length;
            if (perfectMetrics >= 2) {
                baseScore -= 5;
            }

            const overall = Math.max(10, Math.round(baseScore));
            const breakdown = { affordability, employment, commute: commuteScore, schools: schoolsScore, lifestyle };

            db.run(`
                UPDATE suburbs 
                SET Overall_Score = ?, Score_Breakdown = ? 
                WHERE SAL_ID = ?
            `, [overall, JSON.stringify(breakdown), r.SAL_ID]);
            count++;
        });

        console.log(`Authority Hardening Complete. ${count} suburbs recalibrated.`);
        db.close();
    });
});
