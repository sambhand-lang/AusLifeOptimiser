const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- PROPERTY MARKET HYDRATION v2.1 ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Population, Median_House_Price, Median_Unit_Price, House_Percentage
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Hydration failed:', err);

        console.log(`Analyzing ${rows.length} suburbs for market split...`);
        let count = 0;

        // Start transaction for speed
        db.run("BEGIN TRANSACTION");

        rows.forEach(r => {
            // SKIP IF ALREADY HYDRATED (like Parramatta/Parklea)
            if (r.House_Percentage !== null && r.Median_Unit_Price !== null) return;

            const name = (r.Suburb_Name || '').toLowerCase();
            const pop = r.Population || 0;
            const housePrice = r.Median_House_Price || 950000;
            const state = r.State || '';

            // 1. INFER MARKET SPLIT (Density Logic)
            let housePercent = 85;
            let unitPercent = 15;

            if (pop > 25000) { housePercent = 40; unitPercent = 60; } // High Density
            else if (pop > 15000) { housePercent = 60; unitPercent = 40; } // Mixed
            else if (pop > 5000) { housePercent = 80; unitPercent = 20; } // Suburban
            else { housePercent = 95; unitPercent = 5; } // Low Density / Regional

            // Override for Sydney/Metro hubs if name suggests urbanity
            if (name.includes('central') || name.includes('cbd') || name.includes('inner')) {
                housePercent = Math.max(30, housePercent - 20);
                unitPercent = 100 - housePercent;
            }

            // 2. INFER UNIT PRICE
            let unitMultiplier = 0.75; // Default units are 75% of house price
            if (['NSW', 'VIC', 'QLD'].includes(state)) unitMultiplier = 0.65; // Metro gap is larger
            
            const unitPrice = r.Median_Unit_Price || Math.round(housePrice * unitMultiplier);

            // 3. INFER RENTS (Approx yields)
            const houseRent = Math.round((housePrice * 0.034) / 52); // ~3.4% yield
            const unitRent = Math.round((unitPrice * 0.051) / 52); // ~5.1% yield

            db.run(`
                UPDATE suburbs 
                SET House_Percentage = ?, Unit_Percentage = ?, 
                    Median_Unit_Price = ?, 
                    House_Rent_Weekly = ?, Unit_Rent_Weekly = ?
                WHERE SAL_ID = ?
            `, [housePercent, unitPercent, unitPrice, houseRent, unitRent, r.SAL_ID]);
            count++;
        });

        db.run("COMMIT", (err) => {
            if (err) console.error("Commit failed:", err);
            else console.log(`Hydration Complete. ${count} suburbs updated with Intelligent Market Inference.`);
            db.close();
        });
    });
});
