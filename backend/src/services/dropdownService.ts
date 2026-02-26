// src/services/dropdownService.ts
import sqlite3 from 'sqlite3';
import path from 'path';

// --- DB Setup ---
const dbPath = path.resolve(__dirname, '../../suburbs.db'); // correct relative path
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err: Error | null) => {
  if (err) {
    console.error('Failed to connect to SQLite DB at', dbPath, err);
  } else {
    console.log('Connected to SQLite DB at', dbPath);
  }
});

// --- TypeScript type for suburb row ---
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

// --- Fetch suburbs by query ---
export function searchSuburbs(query: string): Promise<SuburbRow[]> {
  const sql = `
    SELECT DISTINCT *
    FROM suburbs
    WHERE SAL_ID IS NOT NULL
      AND (UPPER(Suburb_Name) LIKE ? OR Postcode = ?)
    ORDER BY Suburb_Name
    LIMIT 50
  `;
  const qParam = `%${query.toUpperCase()}%`;
  return new Promise((resolve, reject) => {
    db.all(sql, [qParam, query], (err: Error | null, rows: SuburbRow[]) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

// --- Fetch all suburbs ---
export function getAllSuburbsForDropdown(): Promise<SuburbRow[]> {
  const sql = `
    SELECT DISTINCT *
    FROM suburbs
    WHERE SAL_ID IS NOT NULL
    ORDER BY Suburb_Name
  `;
  return new Promise((resolve, reject) => {
    db.all(sql, [], (err: Error | null, rows: SuburbRow[]) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}