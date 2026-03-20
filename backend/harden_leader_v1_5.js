const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- CATEGORY LEADER HARDENING v1.5 ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Harden failed:', err);

        console.log(`Auditing ${rows.length} suburbs for Category Leader v1.5 compliance...`);
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
            let ratioScore = Math.min(100, (160000 / price) * 10);
            let barrierScore = price < 1000000 ? 85 : 40;
            let affordability = cap((ratioScore * 0.6) + (barrierScore * 0.4));
            
            // Growth Corridor Penalty
            if (price > 800000 && price < 1400000) affordability = Math.min(85, affordability);

            // 2. ECONOMY (15%)
            let employment = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));

            // 3. CONNECTIVITY (20%) - 25km/40km Rules
            let commuteScore = 0;
            if (commute < 20) commuteScore = 95;
            else if (commute < 35) commuteScore = 85;
            else if (commute < 50) commuteScore = 70;
            else commuteScore = 30;
            
            // Hard Distance Proxies
            if (commute > 35) commuteScore = Math.min(85, commuteScore);
            if (commute > 50) commuteScore = Math.min(75, commuteScore);
            
            if (state === 'ACT' && commuteScore > 88) commuteScore = 88;
            if (state === 'QLD' && commuteScore > 85) commuteScore = 85;

            // 4. FAMILY/SCHOOLS (20%) - 90 POINT CEILING
            let schoolsScore = Math.min(90, Math.max(0, Math.min(100, (schools / 30) * 100)));
            if (schools < 4) schoolsScore = Math.min(65, schoolsScore);
            if (pop < 5000) schoolsScore = Math.min(65, schoolsScore);

            // 5. LIFESTYLE (20%)
            let lifestyle = r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 40;
            if (r.Suburb_Name.toLowerCase().includes('beach')) lifestyle += 15;
            if (income > 3000 && price > 1600000) lifestyle += 10;
            lifestyle = cap(lifestyle);

            // FINAL WEIGHTS
            const weights = { affordability: 0.25, employment: 0.15, commute: 0.20, education: 0.20, lifestyle: 0.20 };
            let baseScore = (
                affordability * weights.affordability +
                employment * weights.employment +
                commuteScore * weights.commute +
                schoolsScore * weights.education +
                lifestyle * weights.lifestyle
            );

            // PREMIUM ESTABLISHED BOOST
            if (price > 1800000 && lifestyle > 75 && schoolsScore > 75) {
                baseScore += 3.5;
            }

            // PENALTIES
            if (employment > 85 && lifestyle < 40 && pop < 15000) baseScore -= 8;
            if (pop < 3000) baseScore -= 5;

            // SCORE EXPANSION: Range Stretch
            let finalOverall = baseScore;
            if (baseScore > 75) finalOverall += (baseScore - 75) * 0.5;
            if (baseScore < 70) finalOverall -= (70 - baseScore) * 0.5;

            const overall = Math.round(Math.max(10, Math.min(95, finalOverall)));
            const breakdown = { affordability, employment, commute: commuteScore, schools: schoolsScore, lifestyle };

            db.run(`
                UPDATE suburbs 
                SET Overall_Score = ?, Score_Breakdown = ? 
                WHERE SAL_ID = ?
            `, [overall, JSON.stringify(breakdown), r.SAL_ID]);
            count++;
        });

        console.log(`Category Leader v1.5 Complete. ${count} suburbs recalibrated.`);
        db.close();
    });
});
