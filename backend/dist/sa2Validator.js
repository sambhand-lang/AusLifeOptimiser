"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOfficialSA2 = isOfficialSA2;
exports.getSA2Code = getSA2Code;
exports.getSA2Name = getSA2Name;
exports.getDetailedSA2Validation = getDetailedSA2Validation;
exports.validateSuburbsAsSA2 = validateSuburbsAsSA2;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
let sa2Data = null;
let sa2VerificationLog = new Map();
/**
 * Load ABS SA2 official boundaries from data files
 *
 * Source: ABS ASGS 2021 official register
 * Reference: https://www.abs.gov.au/ausstats/abs@.nsf/mf/1270.0.55.001
 * Format: { "SUBURB|STATE": { code, name, state, suburbs[...], isOfficial: true, dataYear: 2021 } }
 */
function loadSA2Data() {
    if (sa2Data)
        return sa2Data;
    try {
        // Try primary ABS SA2 boundaries file
        const sa2Path = path_1.default.resolve(__dirname, '..', 'data', 'abs_sa2_boundaries.json');
        if (fs_1.default.existsSync(sa2Path)) {
            const raw = fs_1.default.readFileSync(sa2Path, 'utf8');
            sa2Data = JSON.parse(raw);
            console.info(`[SA2] ABS SA2 boundaries loaded from ASGS 2021, total mapped suburbs: ${Object.keys(sa2Data || {}).length}`);
            if (sa2Data) {
                logVerificationStats(sa2Data);
            }
            return sa2Data;
        }
        // Fallback: empty SA2 data (strict mode will reject all unverified suburbs)
        sa2Data = {};
        console.warn('[SA2] ABS SA2 boundaries file not found. Strict official-only mode will be enforced. No unmapped suburbs will be assigned data.');
        return sa2Data;
    }
    catch (e) {
        console.error('[SA2] Failed to load SA2 boundaries:', e);
        sa2Data = {};
        return sa2Data;
    }
}
/**
 * Log verification statistics on startup
 */
function logVerificationStats(data) {
    let officialCount = 0;
    let provisionalCount = 0;
    Object.values(data).forEach(boundary => {
        if (boundary.isOfficial)
            officialCount++;
        else
            provisionalCount++;
    });
    console.info(`[SA2] Official ABS mappings: ${officialCount} suburbs`);
    console.info(`[SA2] Provisional assignments: ${provisionalCount} suburbs`);
    console.info(`[SA2] Coverage: ${((officialCount / (officialCount + provisionalCount)) * 100).toFixed(1)}% official`);
}
/**
 * Validate if a suburb belongs to an official ABS SA2 boundary
 *
 * Validation Steps:
 * 1. Normalize suburb/state to uppercase
 * 2. Lookup in ASGS 2021 register
 * 3. Verify isOfficial flag is true (not provisional)
 * 4. Confirm data year is 2021
 *
 * Returns: boolean - true only if suburb is in official ABS SA2 register
 */
function isOfficialSA2(suburbName, state) {
    const data = loadSA2Data();
    const key = `${suburbName.toUpperCase()}|${state.toUpperCase()}`;
    const boundary = data[key];
    if (!boundary) {
        console.debug(`[SA2-VALIDATION] "${suburbName}" (${state}) not in ASGS 2021 register`);
        return false; // Unknown suburb/state combination
    }
    const isOfficial = boundary.isOfficial === true && boundary.dataYear === 2021;
    if (!isOfficial) {
        console.debug(`[SA2-VALIDATION] "${suburbName}" (${state}) found but not official (provisional assignment to SA2 ${boundary.code})`);
    }
    else {
        console.debug(`[SA2-VALIDATION] "${suburbName}" (${state}) verified in ASGS 2021 as part of SA2 ${boundary.code}`);
    }
    return isOfficial;
}
/**
 * Get SA2 code for a suburb (for cross-referencing with ABS data)
 *
 * Returns official ABS SA2 code (5-digit string, e.g., "10654" for Bondi-Waverley)
 * Null if suburb not found in ASGS 2021 register
 */
function getSA2Code(suburbName, state) {
    const data = loadSA2Data();
    const key = `${suburbName.toUpperCase()}|${state.toUpperCase()}`;
    const boundary = data[key];
    if (!boundary)
        return null;
    return boundary.code;
}
/**
 * Get official ABS SA2 name for a suburb (geographic area name)
 *
 * Returns official ABS SA2 geographic name (e.g., "Bondi - Waverley")
 * Null if suburb not found in ASGS 2021 register
 */
function getSA2Name(suburbName, state) {
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
function getDetailedSA2Validation(suburbName, state) {
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
function validateSuburbsAsSA2(suburbs) {
    return suburbs.map(({ name, state }) => ({
        suburb: name,
        state,
        isOfficial: isOfficialSA2(name, state),
        sa2Code: getSA2Code(name, state) || undefined,
        sa2Name: getSA2Name(name, state) || undefined
    }));
}
exports.default = {
    isOfficialSA2,
    getSA2Code,
    getSA2Name,
    validateSuburbsAsSA2,
    loadSA2Data
};
//# sourceMappingURL=sa2Validator.js.map