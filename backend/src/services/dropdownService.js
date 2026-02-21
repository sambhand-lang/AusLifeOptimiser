/**
 * Suburbs Dropdown Service
 * Provides cached, fast lookups for suburb dropdowns with complete data
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'suburbs.db');

/**
 * Get all suburbs for dropdown with postcode, state, and SSC
 * Returns searchable list with all relevant identifiers
 */
function getAllSuburbsForDropdown(state = null) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      let query = `
        SELECT DISTINCT 
          s.ssc,
          s.suburb_name,
          s.state,
          s.postcode,
          sp.postcodes as all_postcodes
        FROM suburbs s
        LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
        WHERE s.ssc IS NOT NULL
      `;
      
      const params = [];
      if (state) {
        query += ` AND s.state = ?`;
        params.push(state.toUpperCase());
      }
      
      query += ` ORDER BY s.suburb_name, s.state`;
      
      db.all(query, params, (err, rows) => {
        db.close();
        if (err) return reject(err);
        
        // Transform to dropdown format
        const dropdownData = (rows || []).map(row => ({
          id: row.ssc,
          label: `${row.suburb_name}, ${row.state} ${row.postcode}`,
          suburb_name: row.suburb_name,
          state: row.state,
          postcode: row.postcode,
          all_postcodes: row.all_postcodes ? row.all_postcodes.split(',') : [row.postcode].filter(Boolean),
          ssc: row.ssc,
          searchText: `${row.suburb_name} ${row.state} ${row.postcode} ${row.all_postcodes || ''}`.toLowerCase()
        }));
        
        resolve(dropdownData);
      });
    });
  });
}

/**
 * Search suburbs by name/postcode
 */
function searchSuburbs(query, state = null) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      let sql = `
        SELECT DISTINCT
          s.ssc,
          s.suburb_name,
          s.state,
          s.postcode,
          sp.postcodes as all_postcodes
        FROM suburbs s
        LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
        WHERE s.ssc IS NOT NULL
        AND (
          UPPER(s.suburb_name) LIKE ? 
          OR s.postcode = ?
          OR sp.postcodes LIKE ?
        )
      `;
      
      const params = [
        `%${query.toUpperCase()}%`,
        query,
        `%${query}%`
      ];
      
      if (state) {
        sql += ` AND s.state = ?`;
        params.push(state.toUpperCase());
      }
      
      sql += ` ORDER BY s.suburb_name LIMIT 50`;
      
      db.all(sql, params, (err, rows) => {
        db.close();
        if (err) return reject(err);
        
        const results = (rows || []).map(row => ({
          id: row.ssc,
          label: `${row.suburb_name}, ${row.state} ${row.postcode}`,
          suburb_name: row.suburb_name,
          state: row.state,
          postcode: row.postcode,
          all_postcodes: row.all_postcodes ? row.all_postcodes.split(',') : [row.postcode].filter(Boolean),
          ssc: row.ssc
        }));
        
        resolve(results);
      });
    });
  });
}

/**
 * Get single suburb with all postcode options
 */
function getSuburbWithPostcodes(ssc) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      db.get(`
        SELECT 
          s.ssc,
          s.suburb_name,
          s.state,
          s.postcode,
          sp.postcodes as all_postcodes
        FROM suburbs s
        LEFT JOIN suburb_postcodes sp ON s.ssc = sp.ssc
        WHERE s.ssc = ? LIMIT 1
      `, [ssc], (err, row) => {
        db.close();
        if (err) return reject(err);
        
        if (!row) {
          return resolve(null);
        }
        
        resolve({
          ssc: row.ssc,
          suburb_name: row.suburb_name,
          state: row.state,
          postcode: row.postcode,
          all_postcodes: row.all_postcodes ? row.all_postcodes.split(',') : [row.postcode].filter(Boolean),
          display: `${row.suburb_name}, ${row.state} ${row.postcode}`
        });
      });
    });
  });
}

module.exports = {
  getAllSuburbsForDropdown,
  searchSuburbs,
  getSuburbWithPostcodes
};
