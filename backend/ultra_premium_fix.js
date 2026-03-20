const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- ULTRA-PREMIUM CALIBRATION (V5) ---');

const premiumSuburbs = [
    { name: 'Bellevue Hill', state: 'NSW', housePrice: 8500000, income: 3800, lifestyle: 92 },
    { name: 'Vaucluse', state: 'NSW', housePrice: 7900000, income: 3600, lifestyle: 88 },
    { name: 'Point Piper', state: 'NSW', housePrice: 12000000, income: 4500, lifestyle: 85 },
    { name: 'Double Bay', state: 'NSW', housePrice: 6200000, income: 3400, lifestyle: 96 },
    { name: 'Bronte', state: 'NSW', housePrice: 5100000, income: 3200, lifestyle: 94 },
    { name: 'Rose Bay', state: 'NSW', housePrice: 4800000, income: 3200, lifestyle: 89 },
    { name: 'Bondi Beach', state: 'NSW', housePrice: 3950000, income: 2800, lifestyle: 98 },
    { name: 'Toorak', state: 'VIC', housePrice: 5800000, income: 3800, lifestyle: 92 },
    { name: 'South Yarra', state: 'VIC', housePrice: 2400000, income: 2200, lifestyle: 95 },
    { name: 'Brighton', state: 'VIC', housePrice: 3400000, income: 3100, lifestyle: 90 },
    { name: 'Peppermint Grove', state: 'WA', housePrice: 4200000, income: 3600, lifestyle: 85 },
    { name: 'Ascot', state: 'QLD', housePrice: 2300000, income: 2800, lifestyle: 88 }
];

db.serialize(() => {
    premiumSuburbs.forEach(s => {
        // Recalculate Affordability with absolute barrier
        const ratio = (s.income * 52) / s.housePrice;
        let affordability = Math.max(0, Math.min(100, ((ratio - 0.02) / 0.18) * 100));
        
        // Final absolute barriers for reality
        if (s.housePrice > 2000000) affordability = Math.min(40, affordability);
        if (s.housePrice > 3500000) affordability = Math.min(25, affordability);
        if (s.housePrice > 5500000) affordability = Math.min(15, affordability);
        
        const employment = Math.max(0, Math.min(100, ((s.income - 800) / 3700) * 100));
        const commute = 95; // Premium hubs are almost always CBD-adjacent
        const schools = 85; // Reliable high-quality private/public schools in these areas
        
        const weights = { affordability: 0.15, employment: 0.20, commute: 0.20, family: 0.20, lifestyle: 0.25 };
        const overall = (
            affordability * weights.affordability +
            employment * weights.employment +
            commute * weights.commute +
            schools * weights.family +
            s.lifestyle * weights.lifestyle
        );

        db.run(`
            UPDATE suburbs 
            SET Median_House_Price = ?, 
                Median_Income_Weekly = ?,
                Overall_Score = ?,
                Score_Breakdown = ?
            WHERE Suburb_Name = ? AND State = ?
        `, [s.housePrice, s.income, Math.round(overall), JSON.stringify({
            affordability, employment, commute, schools, lifestyle: s.lifestyle
        }), s.name, s.state]);
    });

    // Outer Hub Calibration (Commute Hardening)
    db.run(`
        UPDATE suburbs 
        SET Commute_Time_Mins = 42 
        WHERE Suburb_Name = 'Park Orchards' AND State = 'VIC'
    `);

    console.log('Premium Suburb Strategy Deployed.');
    db.close();
});
