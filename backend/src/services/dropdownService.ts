console.log("DB ABSOLUTE PATH:", require("path").resolve("suburbs.db"));
console.log("CWD:", process.cwd());
// --- BEGIN DEBUG LOGGING ---
console.log('dropdownService.ts: module load started');
try {
  require('fs').appendFileSync('test.log', 'dropdownService.ts: module load started\n');
} catch (e) {
  console.error('dropdownService.ts: failed to write test.log:', e);
}
// --- END DEBUG LOGGING ---
console.log('dropdownService.ts: DB absolute path:', dbPath);
// TEST LOGGING: This should appear in console and file if this file is loaded at all
try {
  require('fs').appendFileSync('test.log', 'DROPDOWN SERVICE MODULE LOADED\n');
  console.log('DROPDOWN SERVICE MODULE LOADED');
} catch (e) {
  console.error('Failed to write test.log:', e);
}
// src/services/dropdownService.ts
/**
 * Suburbs Dropdown Service
 * Provides cached, fast lookups for suburb dropdowns with complete data
 */

console.log('dropdownService.ts: importing sqlite3 and path');
let sqlite3, path;
try {
  sqlite3 = require('sqlite3');
  path = require('path');
  require('fs').appendFileSync('test.log', 'dropdownService.ts: imported sqlite3 and path\n');
} catch (e) {
  console.error('dropdownService.ts: failed to import sqlite3 or path:', e);
}

let dbPath, logPath, logMsg;
try {
  dbPath = path.resolve(__dirname, '../suburbs.db');
  console.log('DROPDOWN SERVICE: Using suburbs.db at:', dbPath);
  logPath = path.resolve(__dirname, '../logs/backend.log');
  logMsg = `[DROPDOWN SERVICE] Using suburbs.db at: ${dbPath}\nDB PATH: ${dbPath}`;
  console.log(logMsg);
  require('fs').mkdirSync(path.dirname(logPath), { recursive: true });
  require('fs').appendFileSync(logPath, logMsg + '\n');
  require('fs').appendFileSync('test.log', 'dropdownService.ts: resolved dbPath and logPath\n');
} catch (e) {
  console.error('dropdownService.ts: failed to resolve dbPath/logPath or write logs:', e);
}
try {
  if (!require('fs').existsSync(dbPath)) {
    console.error('ERROR: suburbs.db file does not exist at resolved path:', dbPath);
    require('fs').appendFileSync('test.log', 'dropdownService.ts: suburbs.db file does not exist at resolved path\n');
  }
} catch (e) {
  console.error('dropdownService.ts: error checking suburbs.db existence:', e);
}

// TypeScript types
export interface SuburbRow {
  SAL_ID: string;
  Suburb_Name: string;
  State: string;
  Postcode: string;
  Population: number;
  Median_Age: number;
  Median_Income_Weekly: number;
  Median_House_Price: number;
  One_Year_Growth_Pct: number;
  Median_Rent_Weekly: number;
  School_Count: number;
  Commute_Time_Mins: number;
  Parks_Count: number;
  Rental_Yield_Pct: number;
}

export interface DropdownItem {
  id: string;
  label: string;
  suburb_name: string;
  state: string;
  postcode: string;
  population: number;
  median_age: number;
  median_income: number;
  median_house_price: number;
  one_year_growth: number;
  median_rent: number;
  school_count: number;
  commute_time: number;
  parks_count: number;
  rental_yield: number;
  all_postcodes: string[];
  ssc: string;
  searchText?: string;
}

/**
 * Get all suburbs for dropdown
 */
export function getAllSuburbsForDropdown(state?: string): Promise<DropdownItem[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, err => {
      if (err) return reject(err);

      let sql = `
        SELECT DISTINCT
          s.SAL_ID,
          s.Suburb_Name,
          s.State,
          s.Postcode,
          s.Population,
          s.Median_Age,
          s.Median_Income_Weekly,
          s.Median_House_Price,
          s.One_Year_Growth_Pct,
          s.Median_Rent_Weekly,
          s.School_Count,
          s.Commute_Time_Mins,
          s.Parks_Count,
          s.Rental_Yield_Pct
        FROM suburbs s
        WHERE s.SAL_ID IS NOT NULL
      `;
      const params: string[] = [];
      if (state) {
        sql += ` AND s.State = ?`;
        params.push(state.toUpperCase());
      }
      sql += ` ORDER BY s.Suburb_Name, s.State`;

      db.all(sql, params, (err, rows: SuburbRow[]) => {
        db.close();
        if (err) return reject(err);

        const dropdownData: DropdownItem[] = (rows || []).map(row => ({
          id: row.SAL_ID,
          label: `${row.Suburb_Name}, ${row.State} ${row.Postcode}`,
          suburb_name: row.Suburb_Name,
          state: row.State,
          postcode: row.Postcode,
          population: row.Population,
          median_age: row.Median_Age,
          median_income: row.Median_Income_Weekly,
          median_house_price: row.Median_House_Price,
          one_year_growth: row.One_Year_Growth_Pct,
          median_rent: row.Median_Rent_Weekly,
          school_count: row.School_Count,
          commute_time: row.Commute_Time_Mins,
          parks_count: row.Parks_Count,
          rental_yield: row.Rental_Yield_Pct,
          all_postcodes: [row.Postcode].filter(Boolean),
          ssc: row.SAL_ID,
          searchText: `${row.Suburb_Name} ${row.State} ${row.Postcode}`.toLowerCase()
        }));

        resolve(dropdownData);
      });
    });
  });
}

/**
 * Search suburbs by name or postcode with optional state
 */
export async function searchSuburbs(query: string, state?: string): Promise<DropdownItem[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);

      const normalizedQuery = query.trim().toUpperCase();

      let sql = `
        SELECT DISTINCT
          s.SAL_ID,
          s.Suburb_Name,
          s.State,
          s.Postcode,
          s.Population,
          s.Median_Age,
          s.Median_Income_Weekly,
          s.Median_House_Price,
          s.One_Year_Growth_Pct,
          s.Median_Rent_Weekly,
          s.School_Count,
          s.Commute_Time_Mins,
          s.Parks_Count,
          s.Rental_Yield_Pct
        FROM suburbs s
        WHERE s.SAL_ID IS NOT NULL
          AND (
            UPPER(s.Suburb_Name) LIKE ?
            OR UPPER(s.Postcode) = ?
          )
      `;

      const params: string[] = [`%${normalizedQuery}%`, normalizedQuery];

      if (state) {
        sql += ` AND s.State = ?`;
        params.push(state.toUpperCase());
      }

      sql += ` ORDER BY s.Suburb_Name LIMIT 50`;

      db.all(sql, params, (err, rows: SuburbRow[]) => {
        db.close();
        if (err) return reject(err);

        const results: DropdownItem[] = (rows || []).map(row => ({
          id: row.SAL_ID,
          label: `${row.Suburb_Name}, ${row.State} ${row.Postcode}`,
          suburb_name: row.Suburb_Name,
          state: row.State,
          postcode: row.Postcode,
          population: row.Population,
          median_age: row.Median_Age,
          median_income: row.Median_Income_Weekly,
          median_house_price: row.Median_House_Price,
          one_year_growth: row.One_Year_Growth_Pct,
          median_rent: row.Median_Rent_Weekly,
          school_count: row.School_Count,
          commute_time: row.Commute_Time_Mins,
          parks_count: row.Parks_Count,
          rental_yield: row.Rental_Yield_Pct,
          all_postcodes: [row.Postcode].filter(Boolean),
          ssc: row.SAL_ID
        }));

        resolve(results);
      });
    });
  });
}

/**
 * Get single suburb with all postcode options
 */
export function getSuburbWithPostcodes(ssc: string): Promise<DropdownItem & { display: string, all_postcodes: string[] } | null> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, err => {
      if (err) return reject(err);

      db.get(`
        SELECT 
          s.SAL_ID AS ssc,
          s.Suburb_Name AS suburb_name,
          s.State AS state,
          s.Postcode AS postcode,
          sp.postcodes AS all_postcodes
        FROM suburbs s
        LEFT JOIN suburb_postcodes sp ON s.SAL_ID = sp.ssc
        WHERE s.SAL_ID = ? LIMIT 1
      `, [ssc], (err, row: any) => {
        db.close();
        if (err) return reject(err);
        if (!row) return resolve(null);

        resolve({
          id: row.ssc,
          label: `${row.suburb_name}, ${row.state} ${row.postcode}`,
          suburb_name: row.suburb_name,
          state: row.state,
          postcode: row.postcode,
          population: row.population ?? 0,
          median_age: row.median_age ?? 0,
          median_income: row.median_income ?? 0,
          median_house_price: row.median_house_price ?? 0,
          one_year_growth: row.one_year_growth ?? 0,
          median_rent: row.median_rent ?? 0,
          school_count: row.school_count ?? 0,
          commute_time: row.commute_time ?? 0,
          parks_count: row.parks_count ?? 0,
          rental_yield: row.rental_yield ?? 0,
          all_postcodes: row.all_postcodes ? row.all_postcodes.split(',') : [row.postcode].filter(Boolean),
          ssc: row.ssc,
          display: `${row.suburb_name}, ${row.state} ${row.postcode}`,
          searchText: `${row.suburb_name} ${row.state} ${row.postcode}`.toLowerCase(),
        });
      });
    });
  });
}