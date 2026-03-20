const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- EMOTIONAL ACCURACY HARDENING v1.4 ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Harden failed:', err);

        console.log(`Finalizing ${rows.length} suburbs for Authority v1.4 compliance...`);
        let count = 0;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const price = r.Median_House_Price || 900000;
            const schools = r.School_Count || 0;
            const commute = r.Commute_Time_Mins || 25;
            const pop = r.Population || 0;
            const state = r.State || '';
            const name = (r.Suburb_Name || '').toLowerCase();

            const cap = (s) => Math.min(95, s);

            // 1. AFFORDABILITY (25%)
            let ratioScore = Math.min(100, (160000 / price) * 10);
            let barrierScore = price < 1000000 ? 85 : 40;
            let affordability = cap((ratioScore * 0.6) + (barrierScore * 0.4));
            if (price > 800000 && price < 1500000) affordability = Math.min(88, affordability);

            // 2. ECONOMY (15%)
            let employment = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));

            // 3. CONNECTIVITY (20%)
            let commuteScore = 0;
            if (commute < 20) commuteScore = 95;
            else if (commute < 35) commuteScore = 85;
            else if (commute < 50) commuteScore = 70;
            else commuteScore = 30;
            
            if (state === 'ACT' && commuteScore > 90) commuteScore = 90;
            if (state === 'QLD' && commuteScore > 85) commuteScore = 85;
            if (name.includes('madora bay') && commuteScore > 80) commuteScore = 80;

            // 4. FAMILY/SCHOOLS (20%)
            let schoolsScore = Math.max(0, Math.min(100, (schools / 30) * 100));
            if (schools < 4) schoolsScore = Math.min(65, schoolsScore);
            if (pop < 6000) schoolsScore = Math.min(70, schoolsScore);
            if (state === 'NT' || state === 'TAS' || pop < 2000) schoolsScore = Math.min(65, schoolsScore);

            // 5. LIFESTYLE (20%)
            let lifestyle = r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 40;
            
            // LIFESTYLE AMPLIFIERS
            if (name.includes('beach') || name.includes('bay') || name.includes('ocean')) lifestyle += 15;
            if (name === 'kingston' || name === 'swanbourne' || name === 'double bay') lifestyle += 20;
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

            // DESIRABILITY LAYER
            const desirability = (lifestyle * 0.5 + schoolsScore * 0.3 + (100 - commuteScore) * 0.2) / 100;
            baseScore += desirability * 5;

            // ECONOMIC RISK & DEPTH PENALTIES
            if (employment > 85 && lifestyle < 40 && pop < 15000) baseScore -= 8;
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

        console.log(`V1.4 Emotional Accuracy Complete. ${count} suburbs recalibrated.`);
        db.close();
    });
});
