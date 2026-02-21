import fs from 'fs';
import path from 'path';
import { query, execMultiple } from '../db';

// Simple CSV importer for property data
// Expected CSV headers (case-insensitive): suburb,postcode,state,median_house_price,median_rent,source
// Or ATO format: Postcode, ..., Median net rent

async function ensureTable() {
  await execMultiple(`
    CREATE TABLE IF NOT EXISTS property_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      suburb_name VARCHAR(255),
      postcode VARCHAR(10),
      state VARCHAR(10),
      median_house_price INTEGER,
      median_rent INTEGER,
      source VARCHAR(255),
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_property_postcode ON property_data(postcode);
    CREATE INDEX IF NOT EXISTS idx_property_suburb ON property_data(suburb_name);
  `);
}

function parseCsv(content: string) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const rows: any[] = [];

  if (headers[0] === 'postcode' && headers.includes('median net rent')) {
    // ATO format
    const rentIndex = headers.indexOf('median net rent');
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length <= rentIndex) continue;
      const obj: any = {};
      obj.postcode = cols[0];
      obj.median_rent = cols[rentIndex];
      obj.source = 'ATO 2021-22';
      rows.push(obj);
    }
  } else {
    // Original format
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim());
      if (cols.length < 2) continue;
      const obj: any = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = cols[j] || '';
      }
      rows.push(obj);
    }
  }
  return rows;
}

async function upsertRow(r: any) {
  let suburb = (r.suburb || r.suburb_name || '').trim();
  let postcode = (r.postcode || '').trim();
  let state = (r.state || '').trim().toUpperCase();
  const house = r.median_house_price || r.medianhouseprice || r.medianHousePrice || r.median_house || '';
  const rent = r.median_rent || r.medianrent || r.medianRent || '';
  const source = r.source || 'imported';

  // If no suburb but have postcode, lookup from suburbs table
  if (!suburb && postcode) {
    const suburbRes = await query('SELECT suburb_name, state FROM suburbs WHERE postcode = ? LIMIT 1', [postcode]);
    if (suburbRes.rows.length > 0) {
      suburb = suburbRes.rows[0].suburb_name;
      state = suburbRes.rows[0].state;
    }
  }

  // Normalize numeric fields
  const houseNum = house ? parseInt(String(house).replace(/[^0-9]/g, ''), 10) || null : null;
  const rentNum = rent ? parseInt(String(rent).replace(/[^0-9]/g, ''), 10) || null : null;

  // Use INSERT OR REPLACE pattern keyed by suburb+postcode (unique constraint not present, so do a simple upsert)
  // Try update first, if 0 changes then insert
  const updateSql = `UPDATE property_data SET median_house_price = ?, median_rent = ?, state = ?, source = ?, updated_at = CURRENT_TIMESTAMP WHERE UPPER(suburb_name) = ? OR postcode = ?`;
  const updateRes = await query(updateSql, [houseNum, rentNum, state, source, suburb.toUpperCase(), postcode]);
  if (updateRes.rowCount === 0) {
    await query(`INSERT INTO property_data (suburb_name, postcode, state, median_house_price, median_rent, source) VALUES (?, ?, ?, ?, ?, ?)`,
      [suburb, postcode, state, houseNum, rentNum, source]);
  }
}

async function importCsv(filePath: string) {
  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath);
    process.exit(1);
  }

  await ensureTable();

  const content = fs.readFileSync(filePath, 'utf8');
  const rows = parseCsv(content);
  console.log(`Parsed ${rows.length} rows from ${filePath}`);

  let processed = 0;
  for (const r of rows) {
    try {
      await upsertRow(r);
      processed++;
      if (processed % 200 === 0) console.log(`Processed ${processed}/${rows.length}`);
    } catch (err) {
      console.warn('Failed to import row:', r, err);
    }
  }

  console.log(`Import complete: ${processed}/${rows.length} rows processed.`);
}

async function main() {
  const arg = process.argv[2];
  if (!arg) {
    console.error('Usage: node importPropertyData.js <path-to-csv>');
    process.exit(1);
  }

  const filePath = path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg);
  await importCsv(filePath);
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
