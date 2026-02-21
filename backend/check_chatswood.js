const fs = require('fs');
const path = require('path');

const schools = JSON.parse(fs.readFileSync('schools.json', 'utf8'));
const commutes = JSON.parse(fs.readFileSync('commute_times.json', 'utf8'));
const parks = JSON.parse(fs.readFileSync('parks.json', 'utf8'));
const transport = JSON.parse(fs.readFileSync('public_transport_stops.json', 'utf8'));

console.log('\n🔍 Data Status for Chatswood NSW:\n');
console.log(`Schools:    ${schools['CHATSWOOD|NSW'] || schools['CHATSWOOD'] ? 'YES ' + (schools['CHATSWOOD|NSW'] || schools['CHATSWOOD']) + ' schools' : 'NO'}`);
console.log(`Commute:    ${commutes['CHATSWOOD|NSW'] || commutes['CHATSWOOD'] ? 'YES ' + (commutes['CHATSWOOD|NSW'] || commutes['CHATSWOOD']) + ' min' : 'NO'}`);
console.log(`Parks:      ${parks['CHATSWOOD|NSW'] || parks['CHATSWOOD'] ? 'YES ' + (parks['CHATSWOOD|NSW'] || parks['CHATSWOOD']) + ' parks' : 'NO'}`);
console.log(`Transport:  ${transport['CHATSWOOD|NSW'] || transport['CHATSWOOD'] ? 'YES ' + (transport['CHATSWOOD|NSW'] || transport['CHATSWOOD']) + ' stops' : 'NO'}`);

// Count total coverage
const absPath = path.join(__dirname, 'data', 'abs_census_by_suburb_expanded.json');
const absData = JSON.parse(fs.readFileSync(absPath, 'utf8'));
const totalSuburbs = Object.keys(absData).length;

let schoolsCovered = 0, commutesCovered = 0;
for (const key of Object.keys(absData)) {
  if (schools[key]) schoolsCovered++;
  if (commutes[key]) commutesCovered++;
}

console.log(`\n📊 Overall Coverage (out of ${totalSuburbs} suburbs):`);
console.log(`Schools:    ${schoolsCovered}/${totalSuburbs} (${((schoolsCovered/totalSuburbs)*100).toFixed(1)}%)`);
console.log(`Commutes:   ${commutesCovered}/${totalSuburbs} (${((commutesCovered/totalSuburbs)*100).toFixed(1)}%)`);
