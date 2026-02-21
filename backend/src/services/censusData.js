const fs = require('fs');
const path = require('path');

let censusData = null;

function loadData() {
  if (censusData) return censusData;
  const candidates = [
    path.resolve(__dirname, '../../data/abs_census_by_suburb_expanded.json'),
    path.resolve(__dirname, '../../data/abs/abs_census_by_suburb_expanded.json'),
    path.resolve(__dirname, '../../data/abs/abs_census_by_suburb.json'),
    path.resolve(__dirname, '../../data/abs/census_2021.json'),
    path.resolve(__dirname, '../../data/abs/abs_census_by_suburb.json'),
  ];

  for (const filePath of candidates) {
    try {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf8');
      censusData = JSON.parse(raw);
      return censusData;
    } catch (err) {
      console.warn('Failed to load census data from', filePath, err.message || err);
      continue;
    }
  }

  censusData = [];
  return censusData;
}

function getCensusData(suburbName) {
  if (!suburbName) return null;
  const data = loadData();
  const up = String(suburbName).toUpperCase();

  // If data is an object map keyed by 'SUBURB|STATE' or 'SUBURB'
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    // try key with NSW, then plain
    if (data[`${up}|NSW`]) return data[`${up}|NSW`];
    if (data[up]) return data[up];
    // try matching by prefix (e.g. 'SUBURB|')
    const foundKey = Object.keys(data).find((k) => k.split('|')[0] === up);
    if (foundKey) return data[foundKey];
    return null;
  }

  // else data is an array
  const target = String(suburbName).toLowerCase();
  return (
    data.find((s) => {
      const name = (s.suburb || s.suburb_name || s.name || s.locality || '').toString().toLowerCase();
      return name === target;
    }) || null
  );
}

module.exports = {
  getCensusData,
  loadData,
};
