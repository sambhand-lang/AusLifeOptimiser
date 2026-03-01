// scripts/testSuburbScoring.ts
import fs from 'fs';
import path from 'path';
import { scoreAndRankSuburbs } from '../app/src/utils/rankingPipeline';
import { SuburbData } from '../app/src/utils/suburbScoring';

// Load dataset (expects JSON array of SuburbData)
const DATA_PATH = path.resolve(__dirname, '../sites.json');
let suburbs: SuburbData[] = [];
try {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  suburbs = JSON.parse(raw);
} catch (err) {
  console.error('Failed to load dataset:', err);
  process.exit(1);
}

// Run scoring and ranking
const ranked = scoreAndRankSuburbs(suburbs);

// Output top 5
console.log('--- Top 5 Suburbs ---');
ranked.slice(0, 5).forEach((s, i) => {
  console.log(
    `${i + 1}. ${s.suburb_name} (${s.state}) | Score: ${s.overallScore}`
  );
});

// Output bottom 3
console.log('\n--- Bottom 3 Suburbs ---');
ranked.slice(-3).forEach((s, i) => {
  const idx = ranked.length - 3 + i + 1;
  console.log(
    `${idx}. ${s.suburb_name} (${s.state}) | Score: ${s.overallScore}`
  );
});
