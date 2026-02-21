/**
 * ABS SA2 (Statistical Area 2) Validator
 * 
 * Validates suburbs against official ABS geographic boundaries (ASGS 2021).
 * SA2 is ABS's primary spatial unit for census data publication.
 * 
 * Validation Methodology:
 * - Source: ABS Australian Statistical Geography Standard (ASGS) 2021
 * - Reference: https://www.abs.gov.au/statistics/standards/australian-statistical-geography-standard-asgs
 * - Validation: Each suburb|state combination verified against official SA2 codes
 * - Data Year: 2021 Census allocation (ASGS 2021 vintage)
 * 
 * Data structure: SUBURB|STATE → SA2_CODE + SA2_NAME + isOfficial flag
 */

import fs from 'fs';
import path from 'path';

export interface SA2Boundary {
  code: string;           // Official ABS SA2 code (e.g., "10654") or pipe-delimited for multi-SA2 (e.g., "106541163|106541164")
  name: string;          // Official ABS SA2 name (e.g., "Bondi - Waverley") or pipe-delimited for multi-SA2
  state: string;         // State abbreviation (NSW, VIC, etc.)
  suburbs: string[];     // List of suburbs in this SA2
  isOfficial: boolean;   // true if from ABS official mappings, false if provisional
  dataYear: 2021;        // ASGS 2021 vintage
  source?: string;       // Data source reference
  sa2_codes?: Array<{    // Optional array of individual SA2 codes for multi-SA2 suburbs
    code: string;
    name: string;
    coveragePercent: number;
  }>;
}

export interface SA2Index {
  [key: string]: SA2Boundary; // "SUBURB|STATE" → SA2Boundary
}

let sa2Data: SA2Index | null = null;
let sa2VerificationLog: Map<string, { suburb: string; state: string; sa2Code: string; verified: boolean; validationMethod: string; }> = new Map();

/**
 * Load ABS SA2 official boundaries from data files
 * 
 * Source: ABS ASGS 2021 official register
 * Reference: https://www.abs.gov.au/ausstats/abs@.nsf/mf/1270.0.55.001
 * Format: { "SUBURB|STATE": { code, name, state, suburbs[...], isOfficial: true, dataYear: 2021 } }
 */
export function loadSA2Data(): SA2Index {
  if (sa2Data) return sa2Data;

  try {
    // Try primary ABS SA2 boundaries file
    const sa2Path = path.resolve(__dirname, '..', 'data', 'abs_sa2_boundaries.json');
    
    if (fs.existsSync(sa2Path)) {
      const raw = fs.readFileSync(sa2Path, 'utf8');
      sa2Data = JSON.parse(raw);
      console.info(`[SA2] ABS SA2 boundaries loaded from ASGS 2021, total mapped suburbs: ${Object.keys(sa2Data || {}).length}`);
      if (sa2Data) {
        logVerificationStats(sa2Data);
      }
      return sa2Data as SA2Index;
    }

    // Fallback: empty SA2 data (strict mode will reject all unverified suburbs)
    sa2Data = {};
    console.warn('[SA2] ABS SA2 boundaries file not found. Strict official-only mode will be enforced. No unmapped suburbs will be assigned data.');
    return sa2Data as SA2Index;
  } catch (e) {
    console.error('[SA2] Failed to load SA2 boundaries:', e);
    sa2Data = {};
    return sa2Data as SA2Index;
  }
}

/**
 * Log verification statistics on startup
 */
function logVerificationStats(data: SA2Index) {
  let officialCount = 0;
  let provisionalCount = 0;
  
  Object.values(data).forEach(boundary => {
    if (boundary.isOfficial) officialCount++;
    else provisionalCount++;
  });
  
  console.info(`[SA2] Official ABS mappings: ${officialCount} suburbs`);
  console.info(`[SA2] Provisional assignments: ${provisionalCount} suburbs`);
  console.info(`[SA2] Coverage: ${((officialCount / (officialCount + provisionalCount)) * 100).toFixed(1)}% official`);
}

/**
 * Check if an SA2 mapping object is an official ABS mapping.
 *
 * This function expects the SA2 mapping object (from `loadSA2Data()[key]`) and
 * returns true only when the mapping is explicitly marked as official.
 */
export type SA2Mapping = SA2Boundary | undefined | null;
export function isOfficialSA2(sa2: SA2Mapping): boolean {
  return sa2?.isOfficial === true;
}

/**
 * Get SA2 code for a suburb (for cross-referencing with ABS data)
 * 
 * Returns official ABS SA2 code (5-digit string, e.g., "10654" for Bondi-Waverley)
 * Null if suburb not found in ASGS 2021 register
 */
export function getSA2Code(suburbName: string, state: string): string | null {
  const data = loadSA2Data();
  const key = `${suburbName.toUpperCase()}|${state.toUpperCase()}`;
  
  const boundary = data[key];
  if (!boundary) return null;
  
  return boundary.code;
}

/**
 * Get official ABS SA2 name for a suburb (geographic area name)
 * 
 * Returns official ABS SA2 geographic name (e.g., "Bondi - Waverley")
 * Null if suburb not found in ASGS 2021 register
 */
export function getSA2Name(suburbName: string, state: string): string | null {
  const data = loadSA2Data();
  const key = `${suburbName.toUpperCase()}|${state.toUpperCase()}`;
  
  const boundary = data[key];
  return boundary?.name || null;
}

/**
 * Get detailed validation result for a suburb
 * 
 * Returns comprehensive validation details including:
 * - SA2 code and name
 * - Official status (ABS-verified or provisional)
 * - Data source and year
 * - Validation method used
 */
export function getDetailedSA2Validation(suburbName: string, state: string): {
  suburb: string;
  state: string;
  sa2Code: string | null;
  sa2Name: string | null;
  isOfficial: boolean;
  dataYear: number;
  validationMethod: string;
  source: string;
} {
  const data = loadSA2Data();
  const key = `${suburbName.toUpperCase()}|${state.toUpperCase()}`;
  const boundary = data[key];
  
  return {
    suburb: suburbName.toUpperCase(),
    state: state.toUpperCase(),
    sa2Code: boundary?.code || null,
    sa2Name: boundary?.name || null,
    isOfficial: boundary?.isOfficial === true && boundary?.dataYear === 2021,
    dataYear: boundary?.dataYear || 0,
    validationMethod: 'ABS ASGS 2021 register lookup',
    source: 'Australian Bureau of Statistics (ABS) ASGS 2021'
  };
}

/**
 * Validate all suburbs in a list against official SA2 boundaries
 */
export function validateSuburbsAsSA2(suburbs: Array<{ name: string; state: string }>): Array<{
  suburb: string;
  state: string;
  isOfficial: boolean;
  sa2Code?: string;
  sa2Name?: string;
}> {
  const data = loadSA2Data();
  return suburbs.map(({ name, state }) => {
    const key = `${name.toUpperCase()}|${state.toUpperCase()}`;
    const boundary = data[key];
    return {
      suburb: name,
      state,
      isOfficial: isOfficialSA2(boundary),
      sa2Code: boundary?.code || getSA2Code(name, state) || undefined,
      sa2Name: boundary?.name || getSA2Name(name, state) || undefined
    };
  });
}

export default {
  isOfficialSA2,
  getSA2Code,
  getSA2Name,
  validateSuburbsAsSA2,
  loadSA2Data
};
