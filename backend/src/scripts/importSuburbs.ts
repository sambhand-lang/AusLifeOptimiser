import axios from 'axios';
import { query, execMultiple } from '../db';

// Mapping of postcodes to city names
const postcodeToCity: { [key: string]: string } = {
  // Sydney postcodes
  '2000': 'Sydney', '2001': 'Sydney', '2002': 'Sydney', '2003': 'Sydney',
  '2004': 'Sydney', '2005': 'Sydney', '2006': 'Sydney', '2007': 'Sydney',
  '2008': 'Sydney', '2009': 'Sydney', '2010': 'Sydney', '2011': 'Sydney',
  '2012': 'Sydney', '2013': 'Sydney', '2014': 'Sydney', '2015': 'Sydney',
  '2016': 'Sydney', '2017': 'Sydney', '2018': 'Sydney', '2019': 'Sydney',
  '2020': 'Sydney', '2021': 'Sydney', '2022': 'Sydney', '2023': 'Sydney',
  '2024': 'Sydney', '2025': 'Sydney', '2026': 'Sydney', '2027': 'Sydney',
  '2028': 'Sydney', '2029': 'Sydney', '2030': 'Sydney', '2031': 'Sydney',
  '2032': 'Sydney', '2033': 'Sydney', '2034': 'Sydney', '2035': 'Sydney',
  '2036': 'Sydney', '2037': 'Sydney', '2038': 'Sydney', '2039': 'Sydney',
  '2040': 'Sydney', '2041': 'Sydney', '2042': 'Sydney', '2043': 'Sydney',
  '2044': 'Sydney', '2045': 'Sydney', '2046': 'Sydney', '2047': 'Sydney',
  '2048': 'Sydney', '2049': 'Sydney', '2050': 'Sydney', '2051': 'Sydney',
  '2052': 'Sydney', '2053': 'Sydney', '2054': 'Sydney', '2055': 'Sydney',
  '2056': 'Sydney', '2057': 'Sydney', '2058': 'Sydney', '2059': 'Sydney',
  '2060': 'Sydney', '2061': 'Sydney', '2062': 'Sydney', '2063': 'Sydney',
  '2064': 'Sydney', '2065': 'Sydney', '2066': 'Sydney', '2067': 'Sydney',
  '2068': 'Sydney', '2069': 'Sydney', '2070': 'Sydney', '2071': 'Sydney',
  '2072': 'Sydney', '2073': 'Sydney', '2074': 'Sydney', '2075': 'Sydney',
  '2076': 'Sydney', '2077': 'Sydney', '2078': 'Sydney', '2079': 'Sydney',
  '2080': 'Sydney', '2081': 'Sydney', '2082': 'Sydney', '2083': 'Sydney',
  '2084': 'Sydney', '2085': 'Sydney', '2086': 'Sydney', '2087': 'Sydney',
  '2088': 'Sydney',
  // Melbourne postcodes (3000-3999)
  '3000': 'Melbourne', '3001': 'Melbourne', '3002': 'Melbourne', '3003': 'Melbourne',
  '3004': 'Melbourne', '3005': 'Melbourne', '3006': 'Melbourne', '3008': 'Melbourne',
  '3050': 'Melbourne', '3051': 'Melbourne', '3052': 'Melbourne', '3053': 'Melbourne',
  '3054': 'Melbourne', '3055': 'Melbourne', '3056': 'Melbourne', '3057': 'Melbourne',
  '3058': 'Melbourne', '3060': 'Melbourne', '3064': 'Melbourne', '3065': 'Melbourne',
  '3066': 'Melbourne', '3067': 'Melbourne', '3068': 'Melbourne', '3070': 'Melbourne',
  '3071': 'Melbourne', '3072': 'Melbourne', '3073': 'Melbourne', '3074': 'Melbourne',
  '3075': 'Melbourne', '3076': 'Melbourne', '3077': 'Melbourne', '3078': 'Melbourne',
  '3081': 'Melbourne', '3082': 'Melbourne', '3083': 'Melbourne', '3084': 'Melbourne',
  '3085': 'Melbourne', '3088': 'Melbourne', '3121': 'Melbourne', '3122': 'Melbourne',
  '3123': 'Melbourne', '3124': 'Melbourne', '3125': 'Melbourne', '3126': 'Melbourne',
  '3127': 'Melbourne', '3128': 'Melbourne', '3129': 'Melbourne', '3130': 'Melbourne',
  '3131': 'Melbourne', '3132': 'Melbourne', '3133': 'Melbourne', '3134': 'Melbourne',
  '3141': 'Melbourne', '3142': 'Melbourne', '3143': 'Melbourne', '3144': 'Melbourne',
  '3145': 'Melbourne', '3146': 'Melbourne', '3147': 'Melbourne', '3148': 'Melbourne',
  '3149': 'Melbourne', '3150': 'Melbourne', '3151': 'Melbourne', '3152': 'Melbourne',
  '3153': 'Melbourne', '3154': 'Melbourne', '3155': 'Melbourne', '3156': 'Melbourne',
  '3158': 'Melbourne', '3162': 'Melbourne', '3163': 'Melbourne', '3165': 'Melbourne',
  '3167': 'Melbourne', '3168': 'Melbourne', '3169': 'Melbourne', '3170': 'Melbourne',
  '3171': 'Melbourne', '3172': 'Melbourne', '3175': 'Melbourne', '3177': 'Melbourne',
  '3179': 'Melbourne', '3181': 'Melbourne', '3182': 'Melbourne', '3183': 'Melbourne',
  '3184': 'Melbourne', '3185': 'Melbourne', '3186': 'Melbourne', '3187': 'Melbourne',
  '3191': 'Melbourne', '3192': 'Melbourne', '3193': 'Melbourne', '3194': 'Melbourne',
  '3195': 'Melbourne', '3196': 'Melbourne', '3197': 'Melbourne', '3198': 'Melbourne',
  '3199': 'Melbourne',
  // Brisbane postcodes (4000-4999)
  '4000': 'Brisbane', '4001': 'Brisbane', '4002': 'Brisbane', '4003': 'Brisbane',
  '4005': 'Brisbane', '4006': 'Brisbane', '4007': 'Brisbane', '4008': 'Brisbane',
  '4010': 'Brisbane', '4011': 'Brisbane', '4012': 'Brisbane', '4014': 'Brisbane',
  '4017': 'Brisbane', '4018': 'Brisbane', '4019': 'Brisbane', '4020': 'Brisbane',
  '4021': 'Brisbane', '4022': 'Brisbane', '4023': 'Brisbane', '4024': 'Brisbane',
  '4025': 'Brisbane', '4026': 'Brisbane', '4027': 'Brisbane', '4028': 'Brisbane',
  '4029': 'Brisbane', '4030': 'Brisbane', '4031': 'Brisbane', '4032': 'Brisbane',
  '4034': 'Brisbane', '4035': 'Brisbane', '4036': 'Brisbane', '4037': 'Brisbane',
  '4038': 'Brisbane', '4039': 'Brisbane', '4040': 'Brisbane', '4051': 'Brisbane',
  '4052': 'Brisbane', '4053': 'Brisbane', '4054': 'Brisbane', '4055': 'Brisbane',
  '4056': 'Brisbane', '4057': 'Brisbane', '4058': 'Brisbane', '4059': 'Brisbane',
  '4060': 'Brisbane', '4061': 'Brisbane', '4062': 'Brisbane', '4064': 'Brisbane',
  '4066': 'Brisbane', '4068': 'Brisbane', '4069': 'Brisbane', '4070': 'Brisbane',
  '4072': 'Brisbane', '4074': 'Brisbane', '4075': 'Brisbane', '4076': 'Brisbane',
  '4077': 'Brisbane', '4078': 'Brisbane', '4079': 'Brisbane',
  // Perth postcodes (6000-6999)
  '6000': 'Perth', '6001': 'Perth', '6002': 'Perth', '6003': 'Perth',
  '6004': 'Perth', '6005': 'Perth', '6006': 'Perth', '6007': 'Perth',
  '6008': 'Perth', '6009': 'Perth', '6010': 'Perth', '6011': 'Perth',
  '6012': 'Perth', '6013': 'Perth', '6014': 'Perth', '6015': 'Perth',
  '6016': 'Perth', '6017': 'Perth', '6018': 'Perth', '6019': 'Perth',
  '6020': 'Perth', '6021': 'Perth', '6022': 'Perth', '6023': 'Perth',
  '6024': 'Perth', '6025': 'Perth', '6026': 'Perth', '6027': 'Perth',
  '6100': 'Perth', '6101': 'Perth', '6102': 'Perth', '6103': 'Perth',
  '6104': 'Perth', '6105': 'Perth', '6106': 'Perth', '6107': 'Perth',
  '6108': 'Perth', '6109': 'Perth', '6110': 'Perth', '6111': 'Perth',
  '6112': 'Perth',
  // Adelaide postcodes (5000-5999)
  '5000': 'Adelaide', '5001': 'Adelaide', '5002': 'Adelaide', '5003': 'Adelaide',
  '5005': 'Adelaide', '5006': 'Adelaide', '5007': 'Adelaide', '5008': 'Adelaide',
  '5009': 'Adelaide', '5010': 'Adelaide', '5011': 'Adelaide', '5012': 'Adelaide',
  '5013': 'Adelaide', '5014': 'Adelaide', '5015': 'Adelaide', '5016': 'Adelaide',
  '5017': 'Adelaide', '5018': 'Adelaide', '5019': 'Adelaide', '5020': 'Adelaide',
  '5021': 'Adelaide', '5022': 'Adelaide', '5024': 'Adelaide', '5031': 'Adelaide',
  '5032': 'Adelaide', '5033': 'Adelaide', '5034': 'Adelaide', '5035': 'Adelaide',
  '5036': 'Adelaide', '5037': 'Adelaide', '5038': 'Adelaide', '5039': 'Adelaide',
  '5040': 'Adelaide', '5041': 'Adelaide', '5042': 'Adelaide', '5043': 'Adelaide',
  '5044': 'Adelaide', '5045': 'Adelaide', '5046': 'Adelaide', '5047': 'Adelaide',
  '5048': 'Adelaide', '5049': 'Adelaide', '5050': 'Adelaide', '5051': 'Adelaide',
  '5052': 'Adelaide', '5061': 'Adelaide', '5062': 'Adelaide', '5063': 'Adelaide',
  '5064': 'Adelaide', '5065': 'Adelaide', '5066': 'Adelaide', '5067': 'Adelaide',
  '5068': 'Adelaide', '5069': 'Adelaide', '5070': 'Adelaide', '5071': 'Adelaide',
  '5072': 'Adelaide', '5073': 'Adelaide', '5074': 'Adelaide', '5075': 'Adelaide',
  '5076': 'Adelaide', '5081': 'Adelaide', '5082': 'Adelaide', '5083': 'Adelaide',
  '5084': 'Adelaide', '5085': 'Adelaide', '5086': 'Adelaide',
  // Hobart postcodes (7000-7999)
  '7000': 'Hobart', '7001': 'Hobart', '7002': 'Hobart', '7003': 'Hobart',
  '7004': 'Hobart', '7005': 'Hobart', '7006': 'Hobart', '7007': 'Hobart',
  '7008': 'Hobart', '7009': 'Hobart', '7010': 'Hobart', '7011': 'Hobart',
  '7012': 'Hobart', '7014': 'Hobart', '7015': 'Hobart', '7016': 'Hobart',
  '7017': 'Hobart', '7018': 'Hobart', '7019': 'Hobart', '7020': 'Hobart',
  '7021': 'Hobart', '7022': 'Hobart', '7023': 'Hobart', '7024': 'Hobart',
  '7025': 'Hobart', '7026': 'Hobart', '7027': 'Hobart', '7028': 'Hobart',
  '7029': 'Hobart', '7030': 'Hobart', '7031': 'Hobart', '7032': 'Hobart',
  '7050': 'Hobart', '7052': 'Hobart',
  // Canberra postcodes (2600-2699)
  '2600': 'Canberra', '2601': 'Canberra', '2602': 'Canberra', '2603': 'Canberra',
  '2604': 'Canberra', '2605': 'Canberra', '2606': 'Canberra', '2607': 'Canberra',
  '2608': 'Canberra', '2609': 'Canberra', '2610': 'Canberra', '2611': 'Canberra',
  '2612': 'Canberra', '2614': 'Canberra', '2615': 'Canberra', '2616': 'Canberra',
  '2617': 'Canberra', '2618': 'Canberra', '2619': 'Canberra', '2620': 'Canberra',
  '2621': 'Canberra', '2900': 'Canberra',
  // Darwin postcodes (0800-0900)
  '0800': 'Darwin', '0801': 'Darwin', '0802': 'Darwin', '0803': 'Darwin',
  '0804': 'Darwin', '0805': 'Darwin', '0806': 'Darwin', '0807': 'Darwin',
  '0808': 'Darwin', '0810': 'Darwin', '0811': 'Darwin', '0812': 'Darwin',
  '0813': 'Darwin', '0814': 'Darwin', '0820': 'Darwin', '0821': 'Darwin',
  '0822': 'Darwin', '0830': 'Darwin', '0831': 'Darwin',
};

interface SuburbRecord {
  postcode: string;
  suburb: string;
  state: string;
  lat?: number;
  lon?: number;
}

async function initializeDatabase() {
  try {
    console.log('Creating suburbs table...');

    await execMultiple(`
      DROP TABLE IF EXISTS suburbs;

      CREATE TABLE suburbs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        suburb_name VARCHAR(255) NOT NULL,
        postcode VARCHAR(10),
        state VARCHAR(3) NOT NULL,
        city VARCHAR(100),
        latitude REAL,
        longitude REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_state ON suburbs(state);
      CREATE INDEX idx_suburb_name ON suburbs(suburb_name);
      CREATE INDEX idx_city ON suburbs(city);
    `);

    console.log('✓ Suburbs table created successfully');
  } catch (err) {
    console.error('Error creating table:', err);
    throw err;
  }
}

async function importSuburbs() {
  try {
    console.log('Fetching suburb data from GitHub...');

    const response = await axios.get(
      'https://raw.githubusercontent.com/michalsn/australian-suburbs/master/json/suburbs.json'
    );

    const suburbs: SuburbRecord[] = response.data;
    console.log(`✓ Fetched ${suburbs.length} suburbs`);

    let inserted = 0;

    for (const suburb of suburbs) {
      const city = postcodeToCity[suburb.postcode] || 'Unknown';
      const stateCode = suburb.state.toUpperCase();

      await query(
        `INSERT INTO suburbs (suburb_name, postcode, state, city, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          suburb.suburb,
          suburb.postcode,
          stateCode,
          city,
          suburb.lat || null,
          suburb.lon || null,
        ]
      );

      inserted++;

      if (inserted % 500 === 0) {
        console.log(`Inserted ${inserted}/${suburbs.length} suburbs...`);
      }
    }

    console.log(`✓ Successfully inserted ${inserted} suburbs`);

    // Verify counts by state
    console.log('\nSummary by state:');
    const stateResult = await query(
      `SELECT state, COUNT(*) as count FROM suburbs GROUP BY state ORDER BY state`
    );

    for (const row of stateResult.rows) {
      console.log(`  ${row.state}: ${row.count} suburbs`);
    }

    // Verify counts by city
    console.log('\nSummary by city:');
    const cityResult = await query(
      `SELECT city, COUNT(*) as count FROM suburbs GROUP BY city ORDER BY count DESC LIMIT 10`
    );

    for (const row of cityResult.rows) {
      console.log(`  ${row.city}: ${row.count} suburbs`);
    }
  } catch (err) {
    console.error('Error importing suburbs:', err);
    throw err;
  }
}

async function main() {
  try {
    console.log('Starting suburb data import...\n');
    await initializeDatabase();
    await importSuburbs();
    console.log('\n✓ Import completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
}

main();
