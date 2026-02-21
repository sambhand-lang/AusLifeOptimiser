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
export interface SA2Boundary {
    code: string;
    name: string;
    state: string;
    suburbs: string[];
    isOfficial: boolean;
    dataYear: 2021;
    source?: string;
}
export interface SA2Index {
    [key: string]: SA2Boundary;
}
/**
 * Load ABS SA2 official boundaries from data files
 *
 * Source: ABS ASGS 2021 official register
 * Reference: https://www.abs.gov.au/ausstats/abs@.nsf/mf/1270.0.55.001
 * Format: { "SUBURB|STATE": { code, name, state, suburbs[...], isOfficial: true, dataYear: 2021 } }
 */
declare function loadSA2Data(): SA2Index;
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
export declare function isOfficialSA2(suburbName: string, state: string): boolean;
/**
 * Get SA2 code for a suburb (for cross-referencing with ABS data)
 *
 * Returns official ABS SA2 code (5-digit string, e.g., "10654" for Bondi-Waverley)
 * Null if suburb not found in ASGS 2021 register
 */
export declare function getSA2Code(suburbName: string, state: string): string | null;
/**
 * Get official ABS SA2 name for a suburb (geographic area name)
 *
 * Returns official ABS SA2 geographic name (e.g., "Bondi - Waverley")
 * Null if suburb not found in ASGS 2021 register
 */
export declare function getSA2Name(suburbName: string, state: string): string | null;
/**
 * Get detailed validation result for a suburb
 *
 * Returns comprehensive validation details including:
 * - SA2 code and name
 * - Official status (ABS-verified or provisional)
 * - Data source and year
 * - Validation method used
 */
export declare function getDetailedSA2Validation(suburbName: string, state: string): {
    suburb: string;
    state: string;
    sa2Code: string | null;
    sa2Name: string | null;
    isOfficial: boolean;
    dataYear: number;
    validationMethod: string;
    source: string;
};
/**
 * Validate all suburbs in a list against official SA2 boundaries
 */
export declare function validateSuburbsAsSA2(suburbs: Array<{
    name: string;
    state: string;
}>): Array<{
    suburb: string;
    state: string;
    isOfficial: boolean;
    sa2Code?: string;
    sa2Name?: string;
}>;
declare const _default: {
    isOfficialSA2: typeof isOfficialSA2;
    getSA2Code: typeof getSA2Code;
    getSA2Name: typeof getSA2Name;
    validateSuburbsAsSA2: typeof validateSuburbsAsSA2;
    loadSA2Data: typeof loadSA2Data;
};
export default _default;
//# sourceMappingURL=sa2Validator.d.ts.map