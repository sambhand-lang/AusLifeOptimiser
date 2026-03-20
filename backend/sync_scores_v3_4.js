/**
 * sync_scores_v3_4.js
 * 
 * Recalculates Overall_Score + Score_Breakdown for EVERY suburb in the DB
 * using the EXACT same logic as app/src/utils/suburbScoring.ts (v3.4).
 * 
 * This ensures Homepage chips, Rankings page, and Detail page all show
 * the same numbers.
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'suburbs.db');
console.log('DB:', dbPath);

// --- Benchmarks (must match DEFAULT_BENCHMARKS in suburbScoring.ts) ---
const B = {
  priceMin: 400000, priceMax: 5000000,
  incomeMin: 800,   incomeMax: 4500,
  commuteMin: 15,   commuteMax: 80,
  schoolMin: 0,     schoolMax: 12,
  lifestyleMin: 0,  lifestyleMax: 100
};

function normD(v, min, max) { if (v==null) return 0; if (v<=min) return 0; if (v>=max) return 100; return ((v-min)/(max-min))*100; }
function normI(v, min, max) { if (v==null) return 0; if (v<=min) return 100; if (v>=max) return 0; return ((max-v)/(max-min))*100; }
const cap = s => Math.min(95, s);

function score(r) {
  const income     = r.Median_Income_Weekly;
  const housePrice = r.Median_House_Price;
  const commute    = r.Commute_Time_Mins;
  const schools    = r.School_Count;
  const pop        = r.Population || 0;
  const effPop     = Math.max(800, pop);
  const state      = r.State || '';

  // 1  AFFORDABILITY
  let aff = 0;
  if (housePrice && income && housePrice > 0) {
    const ratio = housePrice / (income * 52);
    const rs = ratio<6?100 : ratio<8?80 : ratio<10?60 : ratio<12?40 : 20;
    const bs = housePrice<600000?100 : housePrice<1e6?80 : housePrice<2e6?60 : housePrice<3e6?40 : housePrice<5e6?25 : 10;
    aff = cap(rs*0.6 + bs*0.4);
    if (housePrice>800000 && housePrice<1400000) aff = Math.min(85, aff);
  }

  // 2  EMPLOYMENT
  const incM = income != null ? normD(income, B.incomeMin, B.incomeMax) : 0;
  let emp = cap(incM);

  // 3  COMMUTE
  let com = commute != null ? normI(commute, B.commuteMin, B.commuteMax) : 0;
  if (commute && commute<20)       com = 95;
  else if (commute && commute<35)  com = Math.min(85, com);
  else if (commute && commute<50)  com = Math.min(75, com);
  else if (commute)                com = Math.min(25, com);
  if (state==='ACT' && com>88)     com = 88;
  if (state==='QLD' && com>82)     com = 82;

  // 4  FAMILY / SCHOOLS
  let sch = schools != null ? normD(schools, B.schoolMin, B.schoolMax) : 0;
  sch = Math.min(90, sch);
  if (schools != null && schools<4)      sch = Math.min(65, sch);
  if (pop>0 && pop<5000)                 sch = Math.min(65, sch);
  const parkCount = r.Parks_Count || 0;
  const parkS = Math.min(100, (parkCount / effPop) * 60000);
  const fam = cap(sch*0.75 + parkS*0.25);

  // 5  LIFESTYLE
  const cafeTotal = (r.Cafe_Count||0) + (r.Restaurant_Count||0);
  const recTotal  = (r.Gym_Count||0) + (r.Cinema_Count||0) + (r.Sports_Field_Count||0) + (r.Library_Count||0);
  let life = 0;
  if (cafeTotal>0 || recTotal>0) {
    const ad = Math.min(100, (cafeTotal/effPop)*12500);
    const rc = Math.min(100, (recTotal/effPop)*5000);
    let lb = ad*0.7 + rc*0.3;
    const name = (r.Suburb_Name||'').toLowerCase();
    if (name.includes('beach')||name.includes('ocean')) lb += 15;
    if (incM>85 && housePrice>1600000) lb += 10;
    if ((name.includes('swanbourne')||name.includes('cottesloe')) && lb<82) lb = 82;
    life = cap(lb);
    if (pop<800 && pop>0) life *= (0.4 + 0.6*(pop/800));
  }

  // Weighted total  (balanced persona)
  const w = { lifestyle:0.20, family:0.20, commute:0.20, employment:0.15, affordability:0.25 };
  let base = life*w.lifestyle + fam*w.family + com*w.commute + emp*w.employment + aff*w.affordability;

  // Boosts & penalties
  if (life>=90)                              base += 2.5;
  if (housePrice>1800000 && life>75 && sch>75) base += 3.5;
  const mining = (emp>85 && life<40 && pop<15000);
  if (mining) base -= 5;
  if (pop>0 && pop<3000) base -= 5;

  // Stretch
  let s = base;
  if (base>75) s += (base-75)*0.5;
  if (base<70) s -= (70-base)*0.3;

  // Prestige floor
  if (fam>88 && life>45 && s<78) s = 78 + (s/100);

  const overall = Math.round(Math.max(10, Math.min(95, s)));

  return {
    overall,
    breakdown: {
      affordability: Math.round(aff),
      employment:    Math.round(emp),
      commute:       Math.round(com),
      schools:       Math.round(fam),
      lifestyle:     Math.round(life)
    }
  };
}

// --- Main ---
(async () => {
  const db = new sqlite3.Database(dbPath);

  const rows = await new Promise((res, rej) =>
    db.all('SELECT * FROM suburbs', [], (e, r) => e ? rej(e) : res(r))
  );
  console.log(`Loaded ${rows.length} suburbs`);

  const stmt = db.prepare('UPDATE suburbs SET Overall_Score = ?, Score_Breakdown = ? WHERE SAL_ID = ?');

  let changed = 0;
  for (const r of rows) {
    const { overall, breakdown } = score(r);
    const bdStr = JSON.stringify(breakdown);
    stmt.run(overall, bdStr, r.SAL_ID);
    changed++;
  }

  await new Promise((res) => stmt.finalize(res));

  // Rebuild ranks
  const ranked = await new Promise((res, rej) =>
    db.all('SELECT SAL_ID FROM suburbs ORDER BY Overall_Score DESC', [], (e, r) => e ? rej(e) : res(r))
  );
  const rstmt = db.prepare('UPDATE suburbs SET Rank = ? WHERE SAL_ID = ?');
  ranked.forEach((r, i) => rstmt.run(i + 1, r.SAL_ID));
  await new Promise((res) => rstmt.finalize(res));

  // Verify key suburbs
  const verify = await new Promise((res, rej) =>
    db.all("SELECT Suburb_Name, Overall_Score, Score_Breakdown, Rank FROM suburbs WHERE Suburb_Name IN ('Parramatta','Baulkham Hills','Kellyville','Vermont South','Richmond','North Beach','Bowen Hills') ORDER BY Overall_Score DESC", [], (e, r) => e ? rej(e) : res(r))
  );
  console.log('\n=== VERIFICATION ===');
  verify.forEach(v => console.log(`${v.Suburb_Name}: Score=${v.Overall_Score}  Rank=#${v.Rank}  ${v.Score_Breakdown}`));

  console.log(`\nDone. Updated ${changed} suburbs. Ranks rebuilt.`);
  db.close();
})();
