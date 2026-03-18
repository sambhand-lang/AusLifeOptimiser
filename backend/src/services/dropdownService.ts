import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

let dbPath = path.resolve(__dirname, '../../suburbs.db');
let logPath = path.resolve(__dirname, '../logs/backend.log');
let logMsg: string;

console.log('dropdownService.ts: DB absolute path:', dbPath);
try {
  dbPath = path.resolve(__dirname, '../../suburbs.db');
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

// --- TypeScript type for suburb row ---
export interface SuburbRow {
  SAL_ID: string;
  Suburb_Name: string;
  SAL_CODE_2021: string;
  State: string;
  Postcode: string;
  Population: number;
  Median_Age: number;
  Median_Income_Weekly: number;
  Median_House_Price: number;
  One_Year_Growth_Pct: number;
  Median_Rent_Weekly: number;
  HH_Size: number;

  School_Count: number;
  Commute_Time_Mins: number;
  Parks_Count: number;
  Rental_Yield_Pct: number;
}

export interface DropdownItem {
  id: string;
  label: string;
  suburb_name: string;
  sal_code_2021: string;
  state: string;
  postcode: string;
  population: number;
  median_age: number;
  median_income: number;
  median_house_price: number;
  one_year_growth: number;
  median_rent: number;
  hh_size: number;
  employment_rate: number;
  school_count: number;
  commute_time: number;
  parks_count: number;
  rental_yield: number;
  all_postcodes: string[];
  ssc: string;
  overall_score?: number;
  rank?: number;
  total_suburbs?: number;
  searchText?: string;
}

/**
 * Get all suburbs for dropdown
 */
export function getAllSuburbsForDropdown(state?: string): Promise<DropdownItem[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);

      let sql = `
        SELECT DISTINCT
          SAL_ID,
          Suburb_Name,
          SAL_CODE_2021,
          State,
          Postcode,
          Population,
          Median_Age,
          Median_Income_Weekly,
          Median_House_Price,
          One_Year_Growth_Pct,
          Median_Rent_Weekly,
          HH_Size,
          School_Count,
          Commute_Time_Mins,
          Parks_Count,
          Rental_Yield_Pct
        FROM suburbs
        WHERE SAL_ID IS NOT NULL
      `;
      const params: string[] = [];
      if (state) {
        sql += ` AND State = ?`;
        params.push(state.toUpperCase());
      }
      sql += ` ORDER BY Suburb_Name, State`;

      db.all(sql, params, (err, rows: SuburbRow[]) => {
        db.close();
        if (err) return reject(err);

        const dropdownData: DropdownItem[] = (rows || []).map(row => ({
          id: row.SAL_ID,
          label: `${row.Suburb_Name}, ${row.State} ${row.Postcode}`,
          suburb_name: row.Suburb_Name,
          sal_code_2021: row.SAL_CODE_2021,
          state: row.State,
          postcode: row.Postcode,
          population: row.Population,
          median_age: row.Median_Age,
          median_income: row.Median_Income_Weekly,
          median_house_price: row.Median_House_Price,
          one_year_growth: row.One_Year_Growth_Pct,
          median_rent: row.Median_Rent_Weekly,
          hh_size: row.HH_Size,
          employment_rate: 0, // Not in suburbs table
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
          SAL_ID,
          Suburb_Name,
          SAL_CODE_2021,
          State,
          Postcode,
          Population,
          Median_Age,
          Median_Income_Weekly,
          Median_House_Price,
          One_Year_Growth_Pct,
          Median_Rent_Weekly,
          HH_Size,
          School_Count,
          Commute_Time_Mins,
          Parks_Count,
          Rental_Yield_Pct
        FROM suburbs
        WHERE SAL_ID IS NOT NULL
          AND (
            UPPER(Suburb_Name) LIKE ?
            OR UPPER(Postcode) = ?
          )
      `;

      const params: string[] = [`%${normalizedQuery}%`, normalizedQuery];

      if (state) {
        sql += ` AND State = ?`;
        params.push(state.toUpperCase());
      }

      sql += ` ORDER BY Suburb_Name LIMIT 50`;

      db.all(sql, params, (err, rows: SuburbRow[]) => {
        db.close();
        if (err) return reject(err);

        const results: DropdownItem[] = (rows || []).map(row => ({
          id: row.SAL_ID,
          label: `${row.Suburb_Name}, ${row.State} ${row.Postcode}`,
          suburb_name: row.Suburb_Name,
          sal_code_2021: row.SAL_CODE_2021,
          state: row.State,
          postcode: row.Postcode,
          population: row.Population,
          median_age: row.Median_Age,
          median_income: row.Median_Income_Weekly,
          median_house_price: row.Median_House_Price,
          one_year_growth: row.One_Year_Growth_Pct,
          median_rent: row.Median_Rent_Weekly,
          hh_size: row.HH_Size,
          employment_rate: 0, // Not in suburbs table
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
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);

      db.get(`
        SELECT 
          SAL_ID AS ssc,
          Suburb_Name AS suburb_name,
          SAL_CODE_2021 AS sal_code_2021,
          State AS state,
          Postcode AS postcode,
          Population AS population,
          Median_Age AS median_age,
          Median_Income_Weekly AS median_income,
          Median_House_Price AS median_house_price,
          One_Year_Growth_Pct AS one_year_growth,
          Median_Rent_Weekly AS median_rent,
          HH_Size AS hh_size,
          School_Count AS school_count,
          Commute_Time_Mins AS commute_time,
          Parks_Count AS parks_count,
          Rental_Yield_Pct AS rental_yield,
          Overall_Score AS overall_score,
          Rank AS rank,
          (SELECT COUNT(*) FROM suburbs WHERE Overall_Score IS NOT NULL) AS total_suburbs
        FROM suburbs
        WHERE SAL_ID = ? LIMIT 1
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
          hh_size: row.hh_size ?? 0,
          employment_rate: 0, // Not in suburbs table
          school_count: row.school_count ?? 0,
          commute_time: row.commute_time ?? 0,
          parks_count: row.parks_count ?? 0,
          rental_yield: row.rental_yield ?? 0,
          sal_code_2021: row.sal_code_2021 ?? '',
          all_postcodes: [row.postcode].filter(Boolean),
          overall_score: row.overall_score ?? 0,
          rank: row.rank ?? 0,
          total_suburbs: row.total_suburbs ?? 0,
          ssc: row.ssc,
          display: `${row.suburb_name}, ${row.state} ${row.postcode}`,
          searchText: `${row.suburb_name} ${row.state} ${row.postcode}`.toLowerCase(),
        });
      });
    });
  });
}

export function getNearbySuburbs(id: string, postcode: string, state: string): Promise<DropdownItem[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);

      // 1. Get current suburb's coordinates
      db.get(`SELECT latitude, longitude FROM suburbs WHERE SAL_ID = ?`, [id], (err, current: any) => {
        if (err || !current || current.latitude == null) {
          // Fallback to postcode/state logic if no coordinates
          db.all(`
            SELECT SAL_ID AS ssc, Suburb_Name AS suburb_name, State AS state, Postcode AS postcode, Overall_Score AS overall_score
            FROM suburbs
            WHERE (Postcode = ? OR State = ?) AND SAL_ID != ?
            ORDER BY Overall_Score DESC LIMIT 5
          `, [postcode, state, id], (err, rows: any[]) => {
            db.close();
            if (err) return reject(err);
            resolve((rows || []).map(r => ({
              id: r.ssc,
              label: `${r.suburb_name}, ${r.state} ${r.postcode}`,
              suburb_name: r.suburb_name,
              state: r.state,
              postcode: r.postcode,
              overall_score: r.overall_score,
              ssc: r.ssc
            } as any)));
          });
          return;
        }

        const { latitude: lat1, longitude: lon1 } = current;
        // ~0.2 degrees is roughly 22km - this allows the index on (latitude, longitude) to be used effectively
        const delta = 0.2; 

        // 2. Fetch candidates in bounding box - Uses idx_suburb_location
        db.all(`
          SELECT SAL_ID AS ssc, Suburb_Name AS suburb_name, State AS state, Postcode AS postcode, 
                 Overall_Score AS overall_score, latitude, longitude
          FROM suburbs
          WHERE latitude BETWEEN ? AND ?
            AND longitude BETWEEN ? AND ?
            AND SAL_ID != ?
          LIMIT 50
        `, [lat1 - delta, lat1 + delta, lon1 - delta, lon1 + delta, id], (err, rows: any[]) => {
          db.close();
          if (err) return reject(err);

          // 3. Haversine distance calculation in JS (as SQLite default doesn't have math functions)
          const calculateDistance = (la1: number, lo1: number, la2: number, lo2: number) => {
            const R = 6371; // km
            const dLat = (la2 - la1) * Math.PI / 180;
            const dLon = (lo2 - lo1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(la1 * Math.PI / 180) * Math.cos(la2 * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
          };

          const nearby = (rows || [])
            .map(r => ({
              ...r,
              distance: calculateDistance(lat1, lon1, r.latitude, r.longitude)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5) // User requested top 5
            .map(r => ({
              id: r.ssc,
              label: `${r.suburb_name}, ${r.state} ${r.postcode}`,
              suburb_name: r.suburb_name,
              state: r.state,
              postcode: r.postcode,
              overall_score: r.overall_score,
              distance: parseFloat(r.distance.toFixed(1)), // Return as number with 1 decimal place
              ssc: r.ssc
            } as any));

          resolve(nearby);
        });
      });
    });
  });
}

/**
 * Get top ranked suburbs
 */
export function getTopRankings(limit: number = 10, state?: string): Promise<DropdownItem[]> {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('getTopRankings: failed to open DB:', err);
        return reject(err);
      }

      let sql = `
        SELECT SAL_ID AS ssc, Suburb_Name AS suburb_name, State AS state, Postcode AS postcode, 
               Overall_Score AS overall_score, Rank AS rank, Score_Breakdown AS score_breakdown
        FROM suburbs
        WHERE Overall_Score IS NOT NULL
      `;
      const params: any[] = [];
      if (state) {
        sql += ` AND State = ?`;
        params.push(state.toUpperCase());
      }
      sql += ` ORDER BY Overall_Score DESC LIMIT ?`;
      params.push(limit);

      db.all(sql, params, (err, rows: any[]) => {
        db.close();
        if (err) {
            console.error('getTopRankings: query failed:', err);
            return reject(err);
        }
        resolve((rows || []).map(r => ({
          id: r.ssc,
          label: `${r.suburb_name}, ${r.state} ${r.postcode}`,
          suburb_name: r.suburb_name,
          state: r.state,
          postcode: r.postcode,
          overall_score: r.overall_score,
          rank: r.rank,
          scoreBreakdown: r.score_breakdown ? JSON.parse(r.score_breakdown) : undefined,
          ssc: r.ssc
        } as any)));
      });
    });
  });
}