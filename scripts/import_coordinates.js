const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const CSV_PATH = path.resolve(__dirname, '../suburb_coordinates.csv');

const db = new sqlite3.Database(DB_PATH);

async function run() {
    console.log('--- Coordinates Import Start ---');
    
    // 1. Create temp table
    await new Promise((resolve, reject) => {
        db.run(`CREATE TABLE IF NOT EXISTS temp_suburb_coordinates (
            suburb TEXT,
            state TEXT,
            postcode TEXT,
            latitude REAL,
            longitude REAL
        )`, (err) => err ? reject(err) : resolve());
    });
    console.log('Created temporary table.');

    // 2. Read and parse CSV
    const content = fs.readFileSync(CSV_PATH, 'utf8');
    const lines = content.split('\n');
    const rows = [];
    
    // Header check: id,postcode,locality,state,long,lat,...
    // Skip header line
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple CSV parser for quoted fields
        const cols = [];
        let current = '';
        let inQuotes = false;
        for (let char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                cols.push(current.replace(/"/g, ''));
                current = '';
            } else {
                current += char;
            }
        }
        cols.push(current.replace(/"/g, ''));

        if (cols.length >= 6) {
            const postcode = cols[1];
            const suburb = cols[2];
            const state = cols[3];
            const longitude = parseFloat(cols[4]);
            const latitude = parseFloat(cols[5]);
            
            if (!isNaN(latitude) && !isNaN(longitude)) {
                rows.push([suburb, state, postcode, latitude, longitude]);
            }
        }
    }
    console.log(`Parsed ${rows.length} valid coordinate rows.`);

    // 3. Batch insert into temp table
    await new Promise((resolve, reject) => {
        db.serialize(() => {
            db.run("BEGIN TRANSACTION");
            const stmt = db.prepare("INSERT INTO temp_suburb_coordinates (suburb, state, postcode, latitude, longitude) VALUES (?, ?, ?, ?, ?)");
            rows.forEach(r => stmt.run(r));
            stmt.finalize();
            db.run("COMMIT", (err) => err ? reject(err) : resolve());
        });
    });
    console.log('Data imported to temporary table.');

    // 3.5 Create index on temp table
    await new Promise((resolve, reject) => {
        db.run(`CREATE INDEX idx_temp_suburb ON temp_suburb_coordinates (suburb, state)`, (err) => err ? reject(err) : resolve());
    });

    // 4. Update main suburbs table
    console.log('Updating suburbs table with coordinates...');
    await new Promise((resolve, reject) => {
        db.run(`
            UPDATE suburbs
            SET latitude = (
                SELECT latitude 
                FROM temp_suburb_coordinates sc 
                WHERE LOWER(sc.suburb) = LOWER(suburbs.Suburb_Name) 
                  AND sc.state = suburbs.State
                LIMIT 1
            ),
            longitude = (
                SELECT longitude 
                FROM temp_suburb_coordinates sc 
                WHERE LOWER(sc.suburb) = LOWER(suburbs.Suburb_Name) 
                  AND sc.state = suburbs.State
                LIMIT 1
            )
            WHERE latitude IS NULL
        `, (err) => err ? reject(err) : resolve());
    });

    // 5. Cleanup
    await new Promise((resolve, reject) => {
        db.run("DROP TABLE temp_suburb_coordinates", (err) => err ? reject(err) : resolve());
    });

    console.log('--- Coordinates Import Complete ---');
    db.close();
}

run().catch(console.error);
