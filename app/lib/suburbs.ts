import { database } from './db';

export function getSuburbBySlug(slug: string) {
  const stmt = database.prepare(`
    SELECT suburb_name, state, slug, overallScore, medianIncome, employmentRate, commuteTime, schoolsCount
    FROM suburbs WHERE slug = ? LIMIT 1
  `);
  return stmt.get(slug);
}

export function getAllSuburbSlugs() {
  const stmt = database.prepare(`SELECT slug FROM suburbs`);
  return stmt.all().map((row: { slug: string }) => row.slug);
}

export function getTopRankedSuburbs(limit: number) {
  const stmt = database.prepare(`
    SELECT suburb_name, state, slug, overallScore, medianIncome, employmentRate, commuteTime, schoolsCount
    FROM suburbs WHERE overallScore IS NOT NULL
    ORDER BY overallScore DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

export function getSuburbsForComparison(slugs: string[]) {
  if (!slugs.length) return [];
  const placeholders = slugs.map(() => '?').join(',');
  const stmt = database.prepare(`
    SELECT suburb_name, state, slug, overallScore, medianIncome, employmentRate, commuteTime, schoolsCount
    FROM suburbs WHERE slug IN (${placeholders})
  `);
  return stmt.all(...slugs);
}
