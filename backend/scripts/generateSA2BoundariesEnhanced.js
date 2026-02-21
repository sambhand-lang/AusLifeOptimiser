/**
 * Enhanced SA2 Boundaries Generator with Official ABS Suburb Mappings
 * 
 * This script creates accurate suburb-to-SA2 mappings using official
 * Australian Bureau of Statistics (ABS) data from ASGS 2021.
 */

const fs = require('fs');
const path = require('path');

/**
 * Official ABS suburb-to-SA2 mappings
 * Built from: ABS ASGS 2021, ABS Census 2021, and ABS QuickStats
 * Reference: https://www.abs.gov.au/
 * 
 * This is expanded with comprehensive suburb mappings
 */
const suburbMappingModule = require('../data/suburb-sa2-mapping.js');
const SUBURB_SA2_MAPPINGS = suburbMappingModule;

/**
 * Load census data to map suburbs
 */
function loadCensusData() {
  const censusPath = path.join(__dirname, '../data/abs_census_by_suburb_expanded.json');
  try {
    const data = JSON.parse(fs.readFileSync(censusPath, 'utf8'));
    return data;
  } catch (error) {
    console.error(`Failed to load census data: ${error.message}`);
    return {};
  }
}

/**
 * Build SA2 boundaries with smart suburb assignment
 */
function buildSA2BoundariesEnhanced() {
  const censusData = loadCensusData();
  const sa2Map = {};
  
  const suurbsProcessed = new Set();
  const mappedCount = { official: 0, assigned: 0, unassigned: 0 };
  
  console.log(`Processing suburbs from census data...`);
  
  // First pass: use official mappings
  Object.keys(censusData).forEach(key => {
    if (!key.includes('|')) return; // Skip non-state-keyed entries
    
    const [suburb, state] = key.split('|');
    const mapKey = `${suburb}|${state}`;
    
    if (suurbsProcessed.has(mapKey)) return;
    suurbsProcessed.add(mapKey);
    
    // Check if we have an official mapping
    if (SUBURB_SA2_MAPPINGS[mapKey]) {
      const sa2Code = SUBURB_SA2_MAPPINGS[mapKey];
      
      sa2Map[mapKey] = {
        code: sa2Code,
        name: `SA2 ${sa2Code}`,
        state: state,
        suburbs: [suburb],
        isOfficial: true,
        dataYear: 2021,
        source: "ABS ASGS 2021"
      };
      
      mappedCount.official++;
    } else {
      // Second pass: assign to state default or regional center
      const stateDefault = getDefaultSA2ForState(state);
      
      sa2Map[mapKey] = {
        code: stateDefault.code,
        name: stateDefault.name,
        state: state,
        suburbs: [suburb],
        isOfficial: false,
        dataYear: 2021,
        source: "ABS ASGS 2021 (Provisional Assignment)",
        warning: "Suburb-to-SA2 assignment is provisional. Verify against ABS regional data."
      };
      
      mappedCount.unassigned++;
    }
  });
  
  return { map: sa2Map, counts: mappedCount };
}

/**
 * Get default SA2 for state (usually capital city)
 */
function getDefaultSA2ForState(state) {
  const defaults = {
    "NSW": { code: "10635", name: "Sydney - East" },
    "VIC": { code: "20101", name: "Melbourne" },
    "QLD": { code: "30101", name: "Brisbane" },
    "SA": { code: "40101", name: "Adelaide" },
    "WA": { code: "50101", name: "Perth - Inner" },
    "TAS": { code: "60101", name: "Hobart" },
    "NT": { code: "70101", name: "Darwin" },
    "ACT": { code: "80101", name: "Canberra" }
  };
  
  return defaults[state] || { code: "99999", name: "Unknown" };
}

/**
 * Write SA2 boundaries to JSON file
 */
function writeSA2Boundaries(sa2Map) {
  const outputPath = path.join(__dirname, '../data/abs_sa2_boundaries.json');
  
  try {
    fs.writeFileSync(
      outputPath,
      JSON.stringify(sa2Map, null, 2),
      'utf8'
    );
    
    return { success: true, path: outputPath };
  } catch (error) {
    console.error(`Failed to write SA2 boundaries: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main execution
 */
function main() {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Enhanced SA2 Boundaries Generator (ASGS 2021)');
  console.log('═══════════════════════════════════════════════════════\n');
  
  const { map: sa2Map, counts } = buildSA2BoundariesEnhanced();
  const result = writeSA2Boundaries(sa2Map);
  
  if (result.success) {
    console.log(`✅ Generated SA2 boundaries mapping\n`);
    console.log(`   Official mappings: ${counts.official} suburbs`);
    console.log(`   Provisional assignments: ${counts.unassigned} suburbs`);
    console.log(`   Total suburbs mapped: ${counts.official + counts.unassigned}`);
    console.log(`\n   Output: ${result.path}`);
    console.log('\n📊 DATASET STATUS:');
    console.log(`   ✅ Official vs Provisional: ${counts.official} / ${counts.unassigned}`);
    console.log(`   Coverage: ${Math.round((counts.official / (counts.official + counts.unassigned)) * 100)}% official`);
    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Review provisional suburb assignments');
    console.log('   2. Cross-reference with ABS QuickStats for unmatched suburbs');
    console.log('   3. Update SUBURB_SA2_MAPPINGS with verified entries');
    console.log('\n📍 DATA SOURCE:');
    console.log('   Australian Bureau of Statistics (ABS) ASGS 2021');
    console.log('   https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs\n');
  } else {
    console.error(`❌ Failed: ${result.error}`);
    process.exit(1);
  }
}

main();
