"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeDB = exports.execMultiple = exports.query = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const dbPath = path_1.default.join(process.cwd(), 'suburbs.db');
// Enable verbose mode for debugging
sqlite3_1.default.verbose();
const db = new sqlite3_1.default.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    }
    else {
        console.log('Connected to SQLite database');
        db.run('PRAGMA foreign_keys = ON');
    }
});
const query = (text, params) => {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        if (text.trim().toUpperCase().startsWith('SELECT')) {
            db.all(text, params || [], (err, rows) => {
                if (err) {
                    console.error('Query error:', err);
                    reject(err);
                }
                else {
                    const duration = Date.now() - start;
                    console.log('Executed query', { duration, rows: (rows || []).length });
                    resolve({ rows: rows || [], rowCount: (rows || []).length });
                }
            });
        }
        else {
            db.run(text, params || [], function (err) {
                if (err) {
                    console.error('Query error:', err);
                    reject(err);
                }
                else {
                    const duration = Date.now() - start;
                    console.log('Executed query', { duration, changes: this.changes });
                    resolve({ rows: [], rowCount: this.changes });
                }
            });
        }
    });
};
exports.query = query;
const execMultiple = (sql) => {
    return new Promise((resolve, reject) => {
        db.exec(sql, (err) => {
            if (err) {
                console.error('Exec error:', err);
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
};
exports.execMultiple = execMultiple;
const closeDB = () => {
    return new Promise((resolve, reject) => {
        db.close((err) => {
            if (err) {
                reject(err);
            }
            else {
                console.log('Database connection closed');
                resolve();
            }
        });
    });
};
exports.closeDB = closeDB;
exports.default = db;
//# sourceMappingURL=db.js.map