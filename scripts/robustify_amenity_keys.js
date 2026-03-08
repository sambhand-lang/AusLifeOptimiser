const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname, '../netlify/functions');
const FILES = ['schools.json', 'commute_times.json', 'parks.json', 'public_transport_stops.json'];

async function robustify() {
  console.log('--- ROBUSTIFY AMENITY KEYS ---');

  FILES.forEach(filename => {
    const filePath = path.join(DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filename}`);
        return;
    }

    console.log(`Processing ${filename}...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const newData = { ...data };

    Object.keys(data).forEach(key => {
      // key is like "BURWOOD (NSW)|NSW"
      const parts = key.split('|');
      const name = parts[0];
      const state = parts[1] || 'Unknown';
      
      const cleanName = name.replace(/\s*\(.*\)$/, '').trim();
      
      if (cleanName !== name) {
        newData[`${cleanName}|${state}`] = data[key];
        newData[cleanName] = data[key];
      }
    });

    fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
    console.log(`✅ Robustified ${filename} (${Object.keys(newData).length - Object.keys(data).length} new keys)`);
  });

  console.log('--- ROBUSTIFY COMPLETE ---');
}

robustify();
