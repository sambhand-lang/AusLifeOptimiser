import fs from 'fs';

let censusData = null;

function loadCensusData() {
  if (censusData !== null) return censusData;
  try {
    const raw = fs.readFileSync('./data/abs/abs_census_by_suburb_expanded.json', 'utf8');
    censusData = JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load census data:', err.message);
    censusData = {};
  }
  return censusData;
}

export function getCensusData(suburbName) {
  const data = loadCensusData();
  if (!data) return null;
  
  // Try exact match first
  const key = suburbName.toUpperCase();
  if (data[key]) return data[key];
  
  // Try with state suffix (e.g., PARRAMATTA|NSW)
  const keyWithState = `${key}|NSW`;
  if (data[keyWithState]) return data[keyWithState];
  
  // Search through keys for case-insensitive match
  for (const k of Object.keys(data)) {
    if (k.split('|')[0].toLowerCase() === suburbName.toLowerCase()) {
      return data[k];
    }
  }
  
  return null;
}
