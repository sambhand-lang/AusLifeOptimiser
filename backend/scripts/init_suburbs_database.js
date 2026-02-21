#!/usr/bin/env node

/**
 * Initialize suburbs database with all ABS suburbs
 * This script:
 * 1. Loads all 9,471 ABS suburbs from the census data
 * 2. Creates the suburbs table if it doesn't exist
 * 3. Populates it with all suburbs
 * 4. Validates data coverage (census, schools, commutes, etc.)
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', 'suburbs.db');

// Setup database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Database error:', err);
    process.exit(1);
  }
  console.log('✓ Connected to suburbs.db');
  db.run('PRAGMA foreign_keys = ON');
});

// Helper to run query
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    } else {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this.changes, lastID: this.lastID });
      });
    }
  });
}

async function main() {
  try {
    console.log('\n📊 Suburbs Database Initialization\n');
    console.log('Step 1: Creating suburbs table...');
    
    // Create suburbs table
    await runQuery(`
      CREATE TABLE IF NOT EXISTS suburbs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suburb_name TEXT NOT NULL UNIQUE,
        postcode TEXT,
        state TEXT NOT NULL,
        city TEXT,
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Suburbs table ready');

    // Load data sources
    console.log('\nStep 2: Loading data sources...');
    const absPath = path.join(__dirname, '..', 'data', 'abs_census_by_suburb_expanded.json');
    const coordinatesPath = path.join(__dirname, '..', 'coordinates.json');
    const suburbMappingPath = path.join(__dirname, '..', 'data', 'suburb-sa2-mapping.js');

    let absData = {};
    let coordinatesData = {};
    let suburbMapping = {};

    if (fs.existsSync(absPath)) {
      absData = JSON.parse(fs.readFileSync(absPath, 'utf8'));
      console.log(`✓ Loaded ABS data: ${Object.keys(absData).length} entries`);
    }

    if (fs.existsSync(coordinatesPath)) {
      coordinatesData = JSON.parse(fs.readFileSync(coordinatesPath, 'utf8'));
      console.log(`✓ Loaded coordinates: ${Object.keys(coordinatesData).length} entries`);
    }

    // Load optional suburb mapping for city names
    if (fs.existsSync(suburbMappingPath)) {
      try {
        const mapContent = fs.readFileSync(suburbMappingPath, 'utf8');
        // Try to extract the mapping, it's likely a JS file with exports
        // For now, we'll just note it exists
        console.log('✓ Found suburb-SA2 mapping file');
      } catch (e) {
        console.log('⚠ Could not parse suburb mapping');
      }
    }

    // Load schools and commute data to check coverage
    const schoolsPath = path.join(__dirname, '..', 'schools.json');
    const commutePath = path.join(__dirname, '..', 'commute_times.json');
    const parksPath = path.join(__dirname, '..', 'parks.json');
    const transportPath = path.join(__dirname, '..', 'public_transport_stops.json');

    const schoolsData = fs.existsSync(schoolsPath) ? JSON.parse(fs.readFileSync(schoolsPath, 'utf8')) : {};
    const commuteData = fs.existsSync(commutePath) ? JSON.parse(fs.readFileSync(commutePath, 'utf8')) : {};
    const parksData = fs.existsSync(parksPath) ? JSON.parse(fs.readFileSync(parksPath, 'utf8')) : {};
    const transportData = fs.existsSync(transportPath) ? JSON.parse(fs.readFileSync(transportPath, 'utf8')) : {};

    console.log(`✓ Loaded schools data: ${Object.keys(schoolsData).length} entries`);
    console.log(`✓ Loaded commute data: ${Object.keys(commuteData).length} entries`);
    console.log(`✓ Loaded parks data: ${Object.keys(parksData).length} entries`);
    console.log(`✓ Loaded transport data: ${Object.keys(transportData).length} entries`);

    // Parse ABS suburbs and populate database
    console.log('\nStep 3: Populating database with suburbs...');
    const suburbs = Object.keys(absData).map(key => {
      const parts = key.split('|');
      let suburbName = parts[0];
      let state = parts[1] || 'NSW';

      // Get coordinates if available
      const coordKey = key;
      const coords = coordinatesData[coordKey] || {};

      return {
        suburban_name: suburbName.trim(),
        state: state.trim(),
        coords: coords
      };
    });

    // Track coverage statistics
    let insertCount = 0;
    let skipCount = 0;
    let schoolsCovered = 0;
    let commutesCovered = 0;
    let parksCovered = 0;
    let transportCovered = 0;

    // Insert suburbs (skip duplicates)
    for (const suburb of suburbs) {
      const { suburban_name, state, coords } = suburb;
      try {
        await runQuery(
          `INSERT INTO suburbs (suburb_name, state, latitude, longitude)
           VALUES (?, ?, ?, ?)`,
          [
            suburban_name,
            state,
            coords.lat || null,
            coords.lon || null
          ]
        );
        insertCount++;

        // Check data coverage
        const stateKey = `${suburban_name.toUpperCase()}|${state}`;
        const nameKey = suburban_name.toUpperCase();

        if (schoolsData[stateKey] || schoolsData[nameKey]) schoolsCovered++;
        if (commuteData[stateKey] || commuteData[nameKey]) commutesCovered++;
        if (parksData[stateKey] || parksData[nameKey]) parksCovered++;
        if (transportData[stateKey] || transportData[nameKey]) transportCovered++;
      } catch (err) {
        // Likely duplicate key error, skip
        skipCount++;
      }
    }

    console.log(`✓ Inserted ${insertCount} suburbs`);
    if (skipCount > 0) {
      console.log(`⚠ Skipped ${skipCount} duplicates`);
    }

    // Display coverage statistics
    console.log('\n📈 Data Coverage Report:\n');
    const total = insertCount;
    const schoolsPercent = ((schoolsCovered / total) * 100).toFixed(1);
    const commutesPercent = ((commutesCovered / total) * 100).toFixed(1);
    const parksPercent = ((parksCovered / total) * 100).toFixed(1);
    const transportPercent = ((transportCovered / total) * 100).toFixed(1);

    console.log(`Total suburbs in database: ${total}`);
    console.log(`Schools data coverage: ${schoolsCovered}/${total} (${schoolsPercent}%)`);
    console.log(`Commute data coverage: ${commutesCovered}/${total} (${commutesPercent}%)`);
    console.log(`Parks data coverage: ${parksCovered}/${total} (${parksPercent}%)`);
    console.log(`Transport data coverage: ${transportCovered}/${total} (${transportPercent}%)`);

    // Check for specific suburb (Chatswood)
    console.log('\nStep 4: Validating Chatswood...');
    const chatswood = await runQuery(
      `SELECT * FROM suburbs WHERE suburb_name = ? AND state = ?`,
      ['CHATSWOOD', 'NSW']
    );

    if (chatswood.length > 0) {
      console.log('✓ Chatswood found in database');
      const chatswood = chatswood[0];
      console.log(`  - ID: ${chatswood.id}`);
      console.log(`  - Coords: ${chatswood.latitude}, ${chatswood.longitude}`);
      console.log(`  - State: ${chatswood.state}`);

      // Check detailed data availability
      console.log('\n  Detailed data availability:');
      const stateKey = 'CHATSWOOD|NSW';
      const nameKey = 'CHATSWOOD';

      console.log(`  - Schools: ${schoolsData[stateKey] ? '✓ ' + schoolsData[stateKey] + ' schools' : schoolsData[nameKey] ? '✓ ' + schoolsData[nameKey] + ' schools' : '✗ No data'}`);
      console.log(`  - Commute: ${commuteData[stateKey] ? '✓ ' + commuteData[stateKey] + ' min' : commuteData[nameKey] ? '✓ ' + commuteData[nameKey] + ' min' : '✗ No data'}`);
      console.log(`  - Parks: ${parksData[stateKey] ? '✓ ' + parksData[stateKey] + ' parks' : parksData[nameKey] ? '✓ ' + parksData[nameKey] + ' parks' : '✗ No data'}`);
      console.log(`  - Transport: ${transportData[stateKey] ? '✓ ' + transportData[stateKey] + ' stops' : transportData[nameKey] ? '✓ ' + transportData[nameKey] + ' stops' : '✗ No data'}`);
    } else {
      console.log('✗ Chatswood not found in database');
    }

    console.log('\n✅ Database initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev (in backend directory)');
    console.log('2. Test the API: http://localhost:5001/api/suburbs/search?query=CHATSWOOD');
    console.log('3. The detailed data will be fetched from the preloaded JSON files');

  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
