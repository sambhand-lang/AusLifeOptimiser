import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { execMultiple } from '../db';

const csvFilePath = path.join(__dirname, '../../data/australian_postcodes.csv');

async function importCSV() {
  const suburbs: any[] = [];

  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvFilePath)
      .pipe(csv())
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
          await execMultiple(sql);
          console.log(`Imported ${suburbs.length} suburbs from CSV.`);
          resolve();
        } catch (err) {
          reject(err);
        }
      })
      .on('error', reject);
  });
}

importCSV().catch((err) => {
  console.error('Error importing CSV:', err);
});
