"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const db_1 = require("../db");
const csvFilePath = path_1.default.join(__dirname, '../../data/australian_postcodes.csv');
async function importCSV() {
    const suburbs = [];
    return new Promise((resolve, reject) => {
        fs_1.default.createReadStream(csvFilePath)
            .pipe((0, csv_parser_1.default)())
            .on('data', (row) => {
            suburbs.push(row);
        })
            .on('end', async () => {
            try {
                let sql = 'BEGIN TRANSACTION;\n';
                for (const suburb of suburbs) {
                    // Adjust field names as per CSV columns
                    sql += `INSERT INTO suburbs (suburb_name, postcode, state, latitude, longitude) VALUES ('${suburb.locality.replace(/'/g, "''")}', '${suburb.postcode}', '${suburb.state}', ${suburb.latitude || 'NULL'}, ${suburb.longitude || 'NULL'});\n`;
                }
                sql += 'COMMIT;';
                await (0, db_1.execMultiple)(sql);
                console.log(`Imported ${suburbs.length} suburbs from CSV.`);
                resolve();
            }
            catch (err) {
                reject(err);
            }
        })
            .on('error', reject);
    });
}
importCSV().catch((err) => {
    console.error('Error importing CSV:', err);
});
//# sourceMappingURL=importLocalCSV.js.map