const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../backend/suburbs.db');
const OVERPASS_INSTANCES = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];
let currentInstanceIndex = 0;

const db = new sqlite3.Database(DB_PATH);

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchCountsFromOSM(suburbName, state) {
    let areaId = null;
    let bbox = null;
    
    // Step 1: Resolve Suburb to OSM ID via Nominatim (Tested reliable)
    try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(suburbName + ',' + state + ',Australia')}&format=json&limit=1`;
        const nRes = await axios.get(nominatimUrl, { headers: { 'User-Agent': 'AusLifeOptimiser/1.0' }, timeout: 10000 });
        if (nRes.data && nRes.data.length > 0) {
            const first = nRes.data[0];
            if (first.osm_type === 'relation') areaId = 3600000000 + first.osm_id;
            else if (first.osm_type === 'way') areaId = 2400000000 + first.osm_id;
            bbox = first.boundingbox; // [minlat, maxlat, minlon, maxlon]
            console.log(`  Resolved ${suburbName} to OSM ${first.osm_type} ${first.osm_id}`);
        }
    } catch (e) {
        console.warn(`  Nominatim lookup failed for ${suburbName}: ${e.message}`);
    }

    if (!areaId && !bbox) return null;

    // Step 2: Query Overpass for specialized counts (fastest possible query)
    // We use "out tags" for nodes only to avoid timeout.
    const filters = '["amenity"~"cafe|restaurant|gym|cinema|library|pub|bar|park"]';
    const leisure = '["leisure"~"fitness_centre|pitch|park|sport_centre"]';
    
    const overpassQuery = areaId 
        ? `[out:json][timeout:30];area(${areaId})->.a;(node(area.a)${filters};node(area.a)${leisure};);out tags;`
        : `[out:json][timeout:30];(node(${bbox[0]},${bbox[2]},${bbox[1]},${bbox[3]})${filters};node(${bbox[0]},${bbox[2]},${bbox[1]},${bbox[3]})${leisure};);out tags;`;

    for (let retry = 0; retry < OVERPASS_INSTANCES.length; retry++) {
        const url = OVERPASS_INSTANCES[currentInstanceIndex];
        try {
            const response = await axios.get(`${url}?data=${encodeURIComponent(overpassQuery)}`, {
                headers: { 'User-Agent': 'AusLifeOptimiser/1.0' },
                timeout: 25000
            });
            const elements = response.data.elements || [];
            const counts = { cafes: 0, restaurants: 0, gyms: 0, cinemas: 0, libraries: 0, pitches: 0 };
            elements.forEach(el => {
                const t = el.tags || {};
                if (t.amenity === 'cafe') counts.cafes++;
                if (t.amenity === 'restaurant') counts.restaurants++;
                if (t.leisure === 'fitness_centre' || t.amenity === 'gym' || t.leisure === 'sport_centre') counts.gyms++;
                if (t.amenity === 'cinema') counts.cinemas++;
                if (t.amenity === 'library') counts.libraries++;
                if (t.leisure === 'pitch') counts.pitches++;
            });
            return counts;
        } catch (e) {
            console.error(`  Overpass ${url} failed: ${e.code || e.message}`);
            currentInstanceIndex = (currentInstanceIndex + 1) % OVERPASS_INSTANCES.length;
            await sleep(2000);
        }
    }
    return null;
}

async function enrich() {
    console.log('--- GLOBAL OSM ENRICHMENT v4 ---');
    console.log('Target: All suburbs with Population > 1000 and counts at 0');
    
    // Get all valid candidate suburbs
    const suburbs = await new Promise((resolve, reject) => {
        db.all('SELECT SAL_ID, Suburb_Name, State FROM suburbs WHERE Cafe_Count = 0 AND Population > 1000 ORDER BY Population DESC', (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });

    console.log(`Total suburbs to process: ${suburbs.length}`);
    let processed = 0;
    let successful = 0;

    for (const suburb of suburbs) {
        processed++;
        const percent = ((processed / suburbs.length) * 100).toFixed(1);
        const cleanName = suburb.Suburb_Name.replace(/\s*\(.*\)$/, '').trim();
        
        console.log(`\n[${percent}%] (${processed}/${suburbs.length}) > ${cleanName}, ${suburb.State}`);
        
        const counts = await fetchCountsFromOSM(cleanName, suburb.State); // Changed from fetchCountsWithRetry to fetchCountsFromOSM to maintain functionality
        
        if (counts) {
            successful++;
            console.log(`  📊 Results: Cafes: ${counts.cafes}, Restos: ${counts.restaurants}, Gyms: ${counts.gyms}`);
            await new Promise((resolve, reject) => {
                db.run(`UPDATE suburbs SET Cafe_Count=?, Restaurant_Count=?, Gym_Count=?, Cinema_Count=?, Library_Count=?, Sports_Field_Count=? WHERE SAL_ID=?`,
                    [counts.cafes, counts.restaurants, counts.gyms, counts.cinemas, counts.libraries, counts.pitches, suburb.SAL_ID],
                    (err) => err ? reject(err) : resolve()
                );
            });
        } else {
            console.warn(`  ⚠️ Failed to fetch results for ${cleanName}. Skipping.`);
        }
        
        // Dynamic wait to avoid IP bans: 3-5 seconds
        const waitTime = 3000 + Math.random() * 2000;
        await sleep(waitTime); 
    }
    db.close();
    console.log(`\n--- GLOBAL ENRICHMENT COMPLETE ---`);
    console.log(`Total processed: ${processed}`);
    console.log(`Successfully enriched: ${successful}`);
}

enrich();
