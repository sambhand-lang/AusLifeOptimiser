const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

function calculateBreakdown(metrics) {
    const benchmarks = {
        priceMin: 400000, priceMax: 5000000,
        incomeMin: 800, incomeMax: 4500,
        commuteMin: 15, commuteMax: 80,
        schoolMin: 1, schoolMax: 50
    };
    
    const direct = (v, min, max) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
    const inverse = (v, min, max) => Math.max(0, Math.min(100, ((max - v) / (max - min)) * 100));

    // Affordability ratio
    const annualIncome = metrics.income * 52;
    const ratio = annualIncome / metrics.price;
    const affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / (0.20 - 0.02)) * 100));

    const employment = direct(metrics.income, benchmarks.incomeMin, benchmarks.incomeMax);
    const commute = inverse(metrics.commute, benchmarks.commuteMin, benchmarks.commuteMax);
    const schools = direct(metrics.schools, benchmarks.schoolMin, benchmarks.schoolMax);
    const lifestyle = metrics.lifestyle || 10;

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
        breakdown: { affordability, employment, commute, schools, lifestyle }
    };
}

const db = new sqlite3.Database(dbPath);

const corrections = [
    { name: 'Bywong', state: 'NSW', income: 1950, schools: 3, commute: 35, price: 800000, lifestyle: 8 },
    { name: 'Royalla', state: 'NSW', income: 2100, schools: 2, commute: 32, price: 1100000, lifestyle: 12 },
    { name: 'Garran', state: 'ACT', income: 2600, schools: 5, commute: 18, price: 1350000, lifestyle: 45 }, // Schools 14 -> 5 realistic locally
    { name: 'ACT Remainder - Jerrabomberra', state: 'ACT', income: 2200, schools: 2, commute: 35, price: 950000, lifestyle: 15 },
    { name: 'Nhulunbuy', state: 'NT', income: 2150, schools: 4, commute: 18, price: 600000, lifestyle: 25 }
];

db.serialize(() => {
    corrections.forEach(c => {
        console.log(`Processing correction for: ${c.name}, ${c.state}...`);
        
        const scoring = calculateBreakdown(c);
        
        db.run(`
            UPDATE suburbs 
            SET Median_Income_Weekly = ?, 
                School_Count = ?, 
                Commute_Time_Mins = ?,
                Overall_Score = ?,
                Score_Breakdown = ?
            WHERE Suburb_Name = ? AND (State = ? OR State IS NULL)
        `, [
            c.income, c.schools, c.commute, 
            scoring.overall, JSON.stringify(scoring.breakdown),
            c.name, c.state
        ], (err) => {
            if (err) console.error(`Error correcting ${c.name}:`, err);
            else console.log(`Successfully updated ${c.name}. New Overall: ${scoring.overall}`);
        });
    });
});
