import sqlite3 from 'sqlite3';
declare const db: sqlite3.Database;
export interface QueryResult {
    rows: any[];
    rowCount: number;
}
export declare const query: (text: string, params?: any[]) => Promise<QueryResult>;
export declare const execMultiple: (sql: string) => Promise<void>;
export declare const closeDB: () => Promise<void>;
export default db;
//# sourceMappingURL=db.d.ts.map