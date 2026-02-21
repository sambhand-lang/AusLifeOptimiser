/**
 * SSC Resolution Service
 * Provides utilities to resolve SSCs to suburb details and vice versa
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'suburbs.db');

/**
 * Get suburb details by SSC
 * Returns the canonical record for an SSC
 */
function getSuburbDetailsBySSC(ssc) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      db.get(
        `SELECT rowid, suburb_name, state, postcode, ssc FROM suburbs WHERE ssc = ? LIMIT 1`,
        [ssc],
        (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  });
}

/**
 * Get SSC by suburb name and state (for backward compatibility)
 */
function getSSCBySuburbAndState(suburb_name, state) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      db.all(
        `SELECT DISTINCT ssc FROM suburbs 
         WHERE UPPER(suburb_name) = UPPER(?) AND UPPER(state) = UPPER(?) 
         AND ssc IS NOT NULL 
         ORDER BY ssc LIMIT 1`,
        [suburb_name, state],
        (err, rows) => {
          db.close();
          if (err) return reject(err);
          if (rows && rows.length > 0) {
            resolve(rows[0].ssc);
          } else {
            resolve(null);
          }
        }
      );
    });
  });
}

/**
 * Get all postcodes for an SSC
 */
function getPostcodesBySSC(ssc) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      db.all(
        `SELECT postcode FROM suburb_postcodes WHERE ssc = ? ORDER BY is_primary DESC, postcode`,
        [ssc],
        (err, rows) => {
          db.close();
          if (err) return reject(err);
          resolve(rows ? rows.map(r => r.postcode) : []);
        }
      );
    });
  });
}

/**
 * Validate SSC exists in canonical registry
 */
function isValidSSC(ssc) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      
      db.get(
        `SELECT COUNT(*) as count FROM suburbs WHERE ssc = ? LIMIT 1`,
        [ssc],
        (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row && row.count > 0);
        }
      );
    });
  });
}

module.exports = {
  getSuburbDetailsBySSC,
  getSSCBySuburbAndState,
  getPostcodesBySSC,
  isValidSSC
};
