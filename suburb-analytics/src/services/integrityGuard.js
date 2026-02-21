import fs from 'fs';

export function ensureData() {
  const missing = [];
  const candidates = [
    new URL('../../data/abs/abs_census_by_suburb_expanded.json', import.meta.url).pathname,
    new URL('../../data/nsw/schools.json', import.meta.url).pathname
  ];
  for (const p of candidates) {
    if (!fs.existsSync(p)) missing.push(p);
  }
  return missing;
}
