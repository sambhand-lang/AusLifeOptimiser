import Database from 'better-sqlite3';
import path from 'path';

// Only run on server-side
if (typeof window !== 'undefined') {
  throw new Error('lib/db.ts should only be imported server-side');
}

// Singleton pattern
let db: Database.Database | undefined;

function getDbInstance() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'suburbs.db');
    db = new Database(dbPath, { readonly: false });
  }
  return db;
}

export const database = getDbInstance();
