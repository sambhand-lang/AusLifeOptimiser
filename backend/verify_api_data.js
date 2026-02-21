const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./suburbs.db');

db.all(`
  SELECT sd.ssc, sd.suburb_name, sd.population, sd.median_age, sd.median_income, sd.employment_rate, sd.source,
         s.postcode
  FROM suburb_demographics sd
  LEFT JOIN suburbs s ON sd.ssc = s.ssc
  WHERE sd.ssc IN ('13610', '13804', '10570')
  GROUP BY sd.ssc
  ORDER BY sd.ssc
`, (err, rows) => {
  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }
  
  console.log('\n✅ DATA VERIFICATION: NORTH PARRAMATTA, PARRAMATTA, BONDI\n');
  
  rows.forEach(r => {
    console.log(`${r.suburb_name} (${r.postcode}, NSW):`);
    console.log(`  Population:    ${r.population.toLocaleString()}`);
    console.log(`  Median Age:    ${r.median_age} years`);
    console.log(`  Income:        $${r.median_income.toLocaleString()}`);
    console.log(`  Employment:    ${(r.employment_rate * 100).toFixed(1)}%`);
    console.log(`  Source:        ${r.source} ✓`);
    console.log('');
  });
  
  db.close();
});
