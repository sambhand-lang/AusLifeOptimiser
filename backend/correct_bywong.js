const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

// Scoring logic (simplified version of suburbScoring.ts for server-side use)
function calculateBreakdown(sub) {
    const benchmarks = {
        priceMin: 400000, priceMax: 5000000,
        incomeMin: 800, incomeMax: 4500,
        commuteMin: 15, commuteMax: 80,
        schoolMin: 1, schoolMax: 50
    };
    
    // Normalize logic
    const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

    // Affordability ratio
    const annualIncome = sub.income * 52;
    const ratio = annualIncome / sub.price;
    const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.20 - 0.02)) * 100));

    const employment = direct(sub.income, benchmarks.incomeMin, benchmarks.incomeMax);
    const commute = inverse(sub.commute, benchmarks.commuteMin, benchmarks.commuteMax);
    const schools = direct(sub.schools, benchmarks.schoolMin, benchmarks.schoolMax);
    const lifestyle = sub.lifestyle_existing || 10; // Keeping existing lifestyle or low default for rural

    const weights = { affordability: 0.15, employment: 0.20, commute: 0.20, family: 0.20, lifestyle: 0.25 };
    const overall = (
        affordability * weights.affordability +
        employment * weights.employment +
        commute * weights.commute +
        schools * weights.family +
        lifestyle * weights.lifestyle
    );

    return {
        overall: Math.round(overall),
        breakdown: {
            affordability,
            employment,
            commute,
            schools,
            lifestyle
        }
    };
}

const db = new sqlite3.Database(dbPath);

console.log('--- CORRECTING BYWONG NSW ---');

db.serialize(() => {
    // 1. Update the raw metrics
    const income = 1950; // User estimate: 1800-2200
    const schools = 3;   // User estimate: 2-4
    const commute = 35;  // User estimate: 30-35km from Canberra
    const price = 800000; // User confirmed

    console.log(`Setting: Income=${income}, Schools=${schools}, Commute=${commute}`);

    db.run(`
        UPDATE suburbs 
        SET Median_Income_Weekly = ?, 
            School_Count = ?, 
            Commute_Time_Mins = ?
        WHERE Suburb_Name = 'Bywong' AND State = 'NSW'
    `, [income, schools, commute]);

    // 2. Fetch it back to re-calculate score
    db.get(`
        SELECT * FROM suburbs WHERE Suburb_Name = 'Bywong' AND State = 'NSW'
    `, (err, row) => {
        if (err || !row) {
            console.error('Failed to fetch Bywong record after update.');
            return;
        }

        const scoring = calculateBreakdown({
            income: income,
            price: price,
            commute: commute,
            schools: schools,
            lifestyle_existing: row.Score_Breakdown ? JSON.parse(row.Score_Breakdown).lifestyle : 8
        });

        console.log(`New Overall Score: ${scoring.overall}`);
        console.log('Breakdown:', JSON.parse(JSON.stringify(scoring.breakdown)));

        db.run(`
            UPDATE suburbs 
            SET Overall_Score = ?, 
                Score_Breakdown = ?
            WHERE Suburb_Name = 'Bywong'
        `, [scoring.overall, JSON.stringify(scoring.breakdown)], (err) => {
            if (err) console.error('Error updating scores:', err);
            else console.log('Successfully updated Bywong scores.');
            db.close();
        });
    });
});
