"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const db_1 = require("../db");
// Example ABS SSC API endpoint (replace with actual endpoint if available)
const ABS_SSC_API = 'https://example.abs.gov.au/api/ssc';
async function fetchSuburbData() {
    // Fetch suburb/locality data from ABS API
    const response = await axios_1.default.get(ABS_SSC_API);
    return response.data; // Adjust based on actual API response structure
}
async function importSuburbs() {
    try {
        const suburbs = await fetchSuburbData();
        if (!Array.isArray(suburbs))
            throw new Error('Unexpected data format');
        // Build SQL for bulk insert
        let sql = 'BEGIN TRANSACTION;\n';
        for (const suburb of suburbs) {
            // Adjust field names based on actual API response
            sql += `INSERT INTO suburbs (suburb_name, postcode, state, city, latitude, longitude) VALUES ('${suburb.name.replace(/'/g, "''")}', '${suburb.postcode}', '${suburb.state}', '${suburb.city}', ${suburb.latitude || 'NULL'}, ${suburb.longitude || 'NULL'});\n`;
        }
        sql += 'COMMIT;';
        await (0, db_1.execMultiple)(sql);
        console.log(`Imported ${suburbs.length} suburbs from ABS API.`);
    }
    catch (err) {
        console.error('Error importing suburbs from ABS API:', err);
    }
}
importSuburbs();
//# sourceMappingURL=importAbsSuburbs.js.map