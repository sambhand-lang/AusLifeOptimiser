import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'suburbs.db');

// Enable verbose mode for debugging
sqlite3.verbose();

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    db.run('PRAGMA foreign_keys = ON');
  }
});

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

export const query = (text: string, params?: any[]): Promise<QueryResult> => {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    if (text.trim().toUpperCase().startsWith('SELECT')) {
      db.all(text, params || [], (err, rows) => {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          const duration = Date.now() - start;
          console.log('Executed query', { duration, rows: (rows || []).length });
          resolve({ rows: rows || [], rowCount: (rows || []).length });
        }
      });
    } else {
      db.run(text, params || [], function (err) {
        if (err) {
          console.error('Query error:', err);
          reject(err);
        } else {
          const duration = Date.now() - start;
          console.log('Executed query', { duration, changes: this.changes });
          resolve({ rows: [], rowCount: this.changes });
        }
      });
    }
  });
};

export const execMultiple = (sql: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        console.error('Exec error:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const closeDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        reject(err);
      } else {
        console.log('Database connection closed');
        resolve();
      }
    });
  });
};

export default db;
