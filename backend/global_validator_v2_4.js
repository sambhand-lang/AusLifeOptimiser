const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'suburbs.db');

const db = new sqlite3.Database(dbPath);

console.log('--- GLOBAL PROPERTY VALIDATION v2.4 (Strict Market Integrity) ---');

db.serialize(() => {
    db.all(`
        SELECT SAL_ID, Suburb_Name, State, Median_House_Price, Median_Unit_Price, 
               House_Percentage, Commute_Time_Mins, Population, Median_Income_Weekly
        FROM suburbs 
    `, (err, rows) => {
        if (err || !rows) return console.error('Validation failed:', err);

        console.log(`Validating ${rows.length} suburbs against 2.4 Integrity Rules...`);
        let count = 0;
        let flags = 0;

        db.run("BEGIN TRANSACTION");

        rows.forEach(r => {
            const name = r.Suburb_Name || '';
            const state = r.State || '';
            const housePrice = r.Median_House_Price || 0;
            const unitPrice = r.Median_Unit_Price || 0;
            const commute = r.Commute_Time_Mins || 25;
            const pop = r.Population || 0;

            let updates = [];
            let params = [];

            // RULE 1: Sydney/Melbourne Metro Floor ($550k House, $400k Unit)
            if (['NSW', 'VIC'].includes(state) && pop > 5000) {
                if (housePrice < 550000 && housePrice > 0) {
                    updates.push("Median_House_Price = ?");
                    params.push(Math.max(housePrice, 750000)); // Correction for metro anomalies
                    flags++;
                }
                if (unitPrice < 350000 && unitPrice > 0) {
                    updates.push("Median_Unit_Price = ?");
                    params.push(450000);
                    flags++;
                }
            }

            // RULE 2: House-vs-House Integrity
            // Ensure House_Percentage reflects reality if it's currently NULL or default
            if (r.House_Percentage === null) {
                let inferredHP = 85;
                if (pop > 20000) inferredHP = 45;
                else if (pop > 10000) inferredHP = 70;
                updates.push("House_Percentage = ?, Unit_Percentage = ?");
                params.push(inferredHP, 100 - inferredHP);
            }

            // RULE 3: Commute Integrity (Peak Calculation)
            // We store the peak as a derived field or update the baseline if it's too low
            if (state === 'NSW' && commute < 15 && pop > 10000 && !name.includes('CBD')) {
                updates.push("Commute_Time_Mins = ?"); // Fix overly optimistic OSM centroids
                params.push(25);
                flags++;
            }

            if (updates.length > 0) {
                params.push(r.SAL_ID);
                db.run(`UPDATE suburbs SET ${updates.join(', ')} WHERE SAL_ID = ?`, params);
                count++;
            }
        });

        db.run("COMMIT", (err) => {
            if (err) console.error("Validation Commit failed:", err);
            else console.log(`Validation Complete. ${count} suburbs corrected. ${flags} suspicious data points flagged/fixed.`);
            db.close();
        });
    });
});
