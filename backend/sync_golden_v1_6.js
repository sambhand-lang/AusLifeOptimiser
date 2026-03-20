const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- GOLDEN SYNC v1.6 ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins, Score_Breakdown, parks_count
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Sync failed:', err);

        console.log(`Syncing ${rows.length} suburbs with Frontend Engine...`);
        let count = 0;

        rows.forEach(r => {
            const income = r.Median_Income_Weekly || 1600;
            const housePrice = r.Median_House_Price || 900000;
            const schools = r.School_Count || 0;
            const commute = r.Commute_Time_Mins || 25;
            const population = r.Population || 0;
            const state = r.State || '';
            const name = (r.Suburb_Name || '').toLowerCase();
            const parks = r.parks_count || 0;

            const cap = (s) => Math.min(95, s);

            // 1. AFFORDABILITY
            const annualIncome = income * 52;
            const ratio = housePrice / annualIncome;
            let ratioScore = ratio < 6 ? 100 : ratio < 8 ? 80 : ratio < 10 ? 60 : ratio < 12 ? 40 : 20;
            let barrierScore = housePrice < 600000 ? 100 : housePrice < 1000000 ? 80 : housePrice < 2000000 ? 60 : housePrice < 3000000 ? 40 : housePrice < 5000000 ? 25 : 10;
            let affordability = cap((ratioScore * 0.6) + (barrierScore * 0.4));
            if (housePrice > 800000 && housePrice < 1400000) affordability = Math.min(85, affordability);

            // 2. ECONOMY
            let employment = cap(Math.max(0, Math.min(100, ((income - 800) / 3700) * 100)));

            // 3. CONNECTIVITY 
            let commuteScore = 0;
            if (commute < 20) commuteScore = 95;
            else if (commute < 35) commuteScore = 85;
            else if (commute < 50) commuteScore = 70;
            else commuteScore = 25;
            
            if (state === 'ACT' && commuteScore > 88) commuteScore = 88;
            if (state === 'QLD' && commuteScore > 82) commuteScore = 82;

            // 4. FAMILY/SCHOOLS (Schools + Parks)
            let schoolsScore = Math.min(90, Math.max(0, Math.min(100, (schools / 30) * 100)));
            if (schools < 4) schoolsScore = Math.min(65, schoolsScore);
            if (population < 5000) schoolsScore = Math.min(65, schoolsScore);

            const effectivePop = Math.max(800, population);
            const parkScore = Math.min(100, (parks / effectivePop) * 40000);
            const familyScore = cap((schoolsScore * 0.6) + (parkScore * 0.4));

            // 5. LIFESTYLE
            let lifestyleBase = r.Score_Breakdown ? (JSON.parse(r.Score_Breakdown).lifestyle || 40) : 40;
            if (name.includes('beach') || name.includes('ocean')) lifestyleBase += 15;
            if (income > 3000 && housePrice > 1600000) lifestyleBase += 10;
            if ((name.includes('swanbourne') || name.includes('cottesloe')) && lifestyleBase < 82) lifestyleBase = 82;
            let lifestyleFinal = cap(lifestyleBase);

            // WEIGHTS
            const weights = { affordability: 0.25, family: 0.20, commute: 0.20, employment: 0.15, lifestyle: 0.20 };
            let baseOverall = (
                lifestyleFinal * weights.lifestyle + 
                familyScore * weights.family + 
                commuteScore * weights.commute + 
                employment * weights.employment + 
                affordability * weights.affordability
            );

            // SPECIAL TUNING
            if (lifestyleFinal >= 90) baseOverall += 2.5;
            if (housePrice > 1800000 && lifestyleFinal > 75 && schoolsScore > 75) baseOverall += 3.5;

            // PENALTIES
            if (employment > 85 && lifestyleFinal < 40 && population < 15000) baseOverall -= 5;
            if (population > 0 && population < 3000) baseOverall -= 5;

            // SCORE EXPANSION
            let stretchedScore = baseOverall;
            if (baseOverall > 75) stretchedScore += (baseOverall - 75) * 0.4;
            if (baseOverall < 70) stretchedScore -= (70 - baseOverall) * 0.4;

            const overall = Math.round(Math.max(10, Math.min(95, stretchedScore)));
            
            // Sync breakdown with SuburbPage expected keys
            const breakdown = {
                affordability,
                employment,
                commute: commuteScore,
                schools: familyScore,
                lifestyle: lifestyleFinal
            };

            db.run(`
                UPDATE suburbs 
                SET Overall_Score = ?, Score_Breakdown = ? 
                WHERE SAL_ID = ?
            `, [overall, JSON.stringify(breakdown), r.SAL_ID]);
            count++;
        });

        console.log(`Golden Sync Complete. ${count} suburbs synchronized with Frontend logic.`);
        db.close();
    });
});
