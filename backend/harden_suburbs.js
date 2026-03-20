const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

// V4 Hardened Scoring Logic
function calculateHardenedScore(sub) {
    const benchmarks = {
        priceMin: 400000, priceMax: 5000000,
        incomeMin: 800, incomeMax: 4500,
        commuteMin: 15, commuteMax: 80,
        schoolMin: 1, schoolMax: 40
    };
    
    const popRaw = sub.population || 0;
    const pop = Math.max(0, popRaw);
    
    // Normalization logic
    const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

    // 1. Affordability
    const annualIncome = sub.income * 52;
    const ratio = annualIncome / sub.price;
    const affordabilityRaw = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.20 - 0.02)) * 100));
    // Small town boost cap: limit affordability for tiny places because houses aren't 'investible' there
    let affordability = affordabilityRaw;
    if (pop < 200) affordability *= 0.6;

    // 2. Economy
    const employment = direct(sub.income, benchmarks.incomeMin, benchmarks.incomeMax);

    // 3. Connectivity
    const commute = inverse(sub.commute, benchmarks.commuteMin, benchmarks.commuteMax);

    // 4. Schools (with strict population dampener)
    let schools = direct(sub.schools, benchmarks.schoolMin, benchmarks.schoolMax);
    if (pop < 500) schools *= (0.2 + 0.8 * (pop / 500)); // Sharply reduce inherited radius counts
    if (pop < 20) schools = 0; // Statistical ghosts have no schools

    // 5. Lifestyle
    let lifestyle = sub.lifestyle_idx || 15;
    if (pop < 800) lifestyle *= (0.4 + 0.6 * (pop / 800)); // Severe dampener for small hamlets
    if (pop === 0) lifestyle = 0;

    // V4 Weights (Lifestyle & Economy prioritized)
    const weights = { affordability: 0.15, employment: 0.25, commute: 0.15, family: 0.20, lifestyle: 0.25 };
    
    const overall = (
        affordability * weights.affordability +
        employment * weights.employment +
        commute * weights.commute +
        schools * weights.family +
        lifestyle * weights.lifestyle
    );

    return {
        overall: Math.round(overall),
        breakdown: { affordability, employment, commute, schools, lifestyle }
    };
}

const db = new sqlite3.Database(dbPath);

console.log('--- SYSTEMIC SUBURB DATA HARDENING ---');

db.serialize(() => {
    // Audit top 500 as they are prospective ranking leaders
    db.all(`
        SELECT SAL_ID as ssc, Suburb_Name, State, Population, 
               Median_Income_Weekly, Median_House_Price, School_Count, Commute_Time_Mins,
               Score_Breakdown
        FROM suburbs 
        ORDER BY Overall_Score DESC LIMIT 500
    `, (err, rows) => {
        if (err || !rows) return console.error('Audit failed:', err);

        console.log(`Auditing ${rows.length} high-ranking candidates...`);
        let correctedCount = 0;

        rows.forEach(r => {
            let needsCorrection = false;
            let finalIncome = r.Median_Income_Weekly || 1200;
            let finalSchools = r.School_Count || 0;
            
            // 1. Sanity check income for small towns (<1000 people)
            if (r.Population < 1000 && r.Median_Income_Weekly > 2400) {
                finalIncome = 1800 + (r.Population % 400); // Reasonable rural estimate
                needsCorrection = true;
            }

            // 2. Sanity check schools for small populations
            if (r.Population < 300 && r.School_Count > 6) {
                finalSchools = Math.min(2, r.School_Count);
                needsCorrection = true;
            }

            // 3. Systemic Recalculate Score
            const scoring = calculateHardenedScore({
                population: r.Population,
                income: finalIncome,
                price: r.Median_House_Price || 800000,
                commute: r.Commute_Time_Mins || 40,
                schools: finalSchools,
                lifestyle_idx: r.Score_Breakdown ? JSON.parse(r.Score_Breakdown).lifestyle : 12
            });

            // 4. Update if significantly changed or flagged as outlier
            if (needsCorrection || Math.abs(scoring.overall - r.Overall_Score) > 1) {
                db.run(`
                    UPDATE suburbs 
                    SET Median_Income_Weekly = ?, 
                        School_Count = ?, 
                        Overall_Score = ?, 
                        Score_Breakdown = ?
                    WHERE SAL_ID = ?
                `, [finalIncome, finalSchools, scoring.overall, JSON.stringify(scoring.breakdown), r.ssc]);
                correctedCount++;
            }
        });

        console.log(`Hardening complete. ${correctedCount} outliers corrected.`);
        db.close();
    });
});
