import fs from 'fs';

let schoolsCache = null;

function loadSchools() {
  if (schoolsCache) return schoolsCache;
  const p = new URL('../../data/nsw/schools.json', import.meta.url).pathname;
  if (fs.existsSync(p)) {
    try {
      const raw = fs.readFileSync(p, 'utf8');
      schoolsCache = JSON.parse(raw);
      return schoolsCache;
    } catch (err) {
      console.warn('Failed to parse schools:', err.message);
    }
  }
  schoolsCache = {};
  return schoolsCache;
}

export function getSchoolCount(suburbName) {
  const map = loadSchools();
  if (!map) return 0;
  const key = suburbName.toString().toUpperCase();
  // if numeric map
  if (typeof map[key] === 'number') return map[key];
  if (typeof map[`${key}|NSW`] === 'number') return map[`${key}|NSW`];
  return 0;
}
