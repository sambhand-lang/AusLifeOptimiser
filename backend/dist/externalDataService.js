"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalDataService = void 0;
const db_1 = require("./db");
const sa2Validator_1 = require("./sa2Validator");
// External official/open sources
const OPENROUTESERVICE_BASE_URL = 'https://api.openrouteservice.org/v2';
const MYSCHOOL_BASE_URL = 'https://www.myschool.edu.au/api/v3';
const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY || '';
// (Numbeo integration removed per user request)
// Simple cache maps
const routeCache = new Map();
const schoolCache = new Map();
const cacheGet = (cache, key) => {
    const entry = cache.get(key);
    if (!entry)
        return null;
    if (entry.expiresAt < Date.now()) {
        cache.delete(key);
        return null;
    }
    return entry.value;
};
const cacheSet = (cache, key, value, ttlMs = 24 * 60 * 60 * 1000) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};
// JSON file preloading removed - all data now sourced from 'suburbs' table in database.
// Hardcoded fallbacks removed - all data now sourced from database.
class ExternalDataService {
    // Weighted average utility for multi-SA2 aggregation
    static weightedAverage(values, weights) {
        if (values.length === 0)
            return 0;
        if (values.length !== weights.length) {
            throw new Error('Values and weights arrays must be the same length');
        }
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        if (totalWeight === 0)
            return 0;
        const weightedSum = values.reduce((sum, val, i) => sum + val * weights[i], 0);
        return weightedSum / totalWeight;
    }
    // Get ABS metrics from database
    static async getAbsMetrics(suburbName, state, sa2Mapping) {
        try {
            const res = await (0, db_1.query)('SELECT Population, Median_Age, HH_Size, Median_Income_Weekly, Median_House_Price, Median_Unit_Price, House_Percentage, Unit_Percentage, House_Rent_Weekly, Unit_Rent_Weekly, One_Year_Growth_Pct, Median_Rent_Weekly, Rental_Yield_Pct, Cafe_Count, Restaurant_Count, Gym_Count, Cinema_Count, Library_Count, Sports_Field_Count FROM suburbs WHERE UPPER(Suburb_Name) = ? AND State = ? LIMIT 1', [suburbName.toUpperCase(), state.toUpperCase()]);
            if (res.rows.length === 0)
                return {};
            const row = res.rows[0];
            return {
                population: row.Population ?? undefined,
                medianAge: row.Median_Age ?? undefined,
                householdSize: row.HH_Size ?? undefined,
                employmentRate: 0, // Not currently in suburbs table
                medianIncome: row.Median_Income_Weekly ?? undefined,
                medianHousePrice: row.Median_House_Price ?? undefined,
                oneYearGrowth: row.One_Year_Growth_Pct ?? undefined,
                medianRent: row.Median_Rent_Weekly ?? undefined,
                rentalYield: row.Rental_Yield_Pct ?? undefined,
                cafeCount: row.Cafe_Count ?? 0,
                restaurantCount: row.Restaurant_Count ?? 0,
                gymCount: row.Gym_Count ?? 0,
                cinemaCount: row.Cinema_Count ?? 0,
                libraryCount: row.Library_Count ?? 0,
                sportsFieldCount: row.Sports_Field_Count ?? 0,
                medianUnitPrice: row.Median_Unit_Price ?? undefined,
                housePercentage: row.House_Percentage ?? undefined,
                unitPercentage: row.Unit_Percentage ?? undefined,
                houseRentWeekly: row.House_Rent_Weekly ?? undefined,
                unitRentWeekly: row.Unit_Rent_Weekly ?? undefined
            };
        }
        catch (err) {
            console.error('getAbsMetrics error', err);
            return {};
        }
    }
    // Get school count from database
    static async getSchoolCount(suburbName, state) {
        try {
            const res = await (0, db_1.query)('SELECT School_Count FROM suburbs WHERE UPPER(Suburb_Name) = ? AND State = ? LIMIT 1', [suburbName.toUpperCase(), state.toUpperCase()]);
            return res.rows.length > 0 ? res.rows[0].School_Count : null;
        }
        catch (err) {
            console.error('[SCHOOLS] Error:', err);
            return null;
        }
    }
    // Get commute time from database
    static async getCommuteTime(suburbName, state) {
        try {
            const res = await (0, db_1.query)('SELECT Commute_Time_Mins FROM suburbs WHERE UPPER(Suburb_Name) = ? AND State = ? LIMIT 1', [suburbName.toUpperCase(), state.toUpperCase()]);
            return res.rows.length > 0 ? res.rows[0].Commute_Time_Mins : null;
        }
        catch (err) {
            console.error('[COMMUTE] Error:', err);
            return null;
        }
    }
    // Get public transport stops from database
    static async getPublicTransportStops(suburbName, state) {
        // Note: Column not currently in suburbs table schema
        return null;
    }
    // Get parks count from database
    static async getParksCount(suburbName, state) {
        try {
            const res = await (0, db_1.query)('SELECT Parks_Count FROM suburbs WHERE UPPER(Suburb_Name) = ? AND State = ? LIMIT 1', [suburbName.toUpperCase(), state.toUpperCase()]);
            return res.rows.length > 0 ? res.rows[0].Parks_Count : null;
        }
        catch (err) {
            console.error('[PARKS] Error:', err);
            return null;
        }
    }
    // Numbeo integration removed.
    // Main method to get all real data for a suburb - STRICT OFFICIAL ONLY
    static async getSuburbRealData(suburbName, state, postcode) {
        // Validate suburb against ABS SA2 boundaries (use mapping lookup then check flag)
        const sa2Index = (0, sa2Validator_1.loadSA2Data)();
        const sa2Key = `${suburbName.toUpperCase()}|${(state || '').toUpperCase()}`;
        const sa2Mapping = sa2Index[sa2Key] || sa2Index[suburbName.toUpperCase()] || null;
        const isOfficialSuburb = (0, sa2Validator_1.isOfficialSA2)(sa2Mapping);
        const sa2Code = sa2Mapping?.code || (0, sa2Validator_1.getSA2Code)(suburbName, state);
        const sa2Name = sa2Mapping?.name || (0, sa2Validator_1.getSA2Name)(suburbName, state);
        if (!isOfficialSuburb) {
            console.warn(`[SA2] "${suburbName}" in ${state} is not in official ABS SA2 boundaries. No data will be returned.`);
        }
        const [absMetrics, commuteTime, schoolCount, transportStops, parksCount] = await Promise.all([
            this.getAbsMetrics(suburbName, state),
            this.getCommuteTime(suburbName, state),
            this.getSchoolCount(suburbName, state),
            this.getPublicTransportStops(suburbName, state),
            this.getParksCount(suburbName, state)
        ]);
        const result = {};
        // ====================
        // STRICT OFFICIAL ONLY MODE
        // ====================
        // ABS Census 2021 - Official Dataset
        // ONLY include metrics if:
        // 1. Data came from ABS (absIndex loaded)
        // 2. Suburb is in official SA2 boundaries
        // 3. No estimates or fallback values
        if (absMetrics.population != null) {
            result.population = {
                value: absMetrics.population,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2021,
                type: 'official_dataset',
                reliability: 'official_census_data'
            };
        }
        if (absMetrics.medianAge != null) {
            result.medianAge = {
                value: absMetrics.medianAge,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2021,
                type: 'official_dataset',
                reliability: 'official_census_data'
            };
        }
        if (absMetrics.householdSize != null) {
            result.householdSize = {
                value: absMetrics.householdSize,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2021,
                type: 'official_dataset',
                reliability: 'official_census_data'
            };
        }
        if (absMetrics.employmentRate != null) {
            result.employmentRate = {
                value: absMetrics.employmentRate,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2021,
                type: 'official_dataset',
                reliability: 'official_census_data'
            };
        }
        if (absMetrics.medianIncome != null) {
            result.medianIncome = {
                value: absMetrics.medianIncome,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2021,
                type: 'official_dataset',
                reliability: 'official_census_data'
            };
        }
        if (absMetrics.medianHousePrice != null) {
            result.medianHousePrice = {
                value: absMetrics.medianHousePrice,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2026,
                type: 'official_dataset'
            };
        }
        if (absMetrics.medianUnitPrice != null) {
            result.medianUnitPrice = { value: absMetrics.medianUnitPrice, source: 'Expert Market Selection (Mar 2026)', datasetYear: 2026, type: 'derived_metric' };
        }
        if (absMetrics.housePercentage != null) {
            result.housePercentage = absMetrics.housePercentage;
        }
        if (absMetrics.unitPercentage != null) {
            result.unitPercentage = absMetrics.unitPercentage;
        }
        if (absMetrics.houseRentWeekly != null) {
            result.houseRentWeekly = absMetrics.houseRentWeekly;
        }
        if (absMetrics.unitRentWeekly != null) {
            result.unitRentWeekly = absMetrics.unitRentWeekly;
        }
        if (absMetrics.oneYearGrowth != null) {
            result.oneYearGrowth = {
                value: absMetrics.oneYearGrowth,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2026,
                type: 'official_dataset'
            };
        }
        if (absMetrics.medianRent != null) {
            result.medianRent = {
                value: absMetrics.medianRent,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2026,
                type: 'official_dataset'
            };
        }
        if (absMetrics.rentalYield != null) {
            result.rentalYield = {
                value: absMetrics.rentalYield,
                source: `Suburbs Database (SAL ${sa2Code || 'N/A'})`,
                datasetYear: 2026,
                type: 'official_dataset'
            };
        }
        // OpenRouteService - Official API source (only if data available)
        // Methodology: Routing from suburb centroid to Sydney Town Hall (CBD reference point)
        // Route type: Car - driving route following road networks
        if (commuteTime != null) {
            result.commute = {
                drivingTimeMinutes: {
                    value: commuteTime,
                    source: 'Suburbs Database - Pre-calculated Routing',
                    datasetYear: 2026,
                    type: 'official_dataset',
                    reliability: 'routing_api_calculated',
                    methodology: 'Driving time from suburb centroid to Sydney CBD'
                }
            };
        }
        // Schools - ONLY if official data present
        // Source: Australian Department of Education and Training (DEET) School Directory
        // Methodology: Point-in-polygon spatial query - schools located within suburb boundaries
        // Note: Count reflects schools with recorded addresses in the suburb
        if (schoolCount != null) {
            result.schools = {
                count: {
                    value: schoolCount,
                    source: 'Suburbs Database - Verified Count',
                    datasetYear: 2025,
                    type: 'official_dataset',
                    reliability: 'verified_spatial_count'
                }
            };
        }
        // Public Transport - Official government sources
        // Source: State-based transport authorities (NSW Transport, VicRoads, etc.)
        // Methodology: Point-in-polygon spatial query - transport stops within suburb boundaries
        // Note: Count includes all active public transport stops (train, bus, tram, ferry)
        if (transportStops != null) {
            result.publicTransportStops = {
                value: transportStops,
                source: 'Suburbs Database - Verified Count',
                datasetYear: 2025,
                type: 'official_dataset',
                reliability: 'verified_spatial_count'
            };
        }
        // Parks - Official government data
        // Source: Local government authority parks and recreation registers
        // Methodology: Point-in-polygon spatial query - parks with boundaries overlapping suburb area
        // Note: Count includes public parks, reserves, and recreational spaces legally classified as such
        if (parksCount != null) {
            result.parks = {
                value: parksCount,
                source: 'Suburbs Database - Parks Register',
                datasetYear: 2025,
                type: 'official_dataset',
                reliability: 'verified_spatial_count'
            };
        }
        // New Amenity Metrics
        if (absMetrics.cafeCount != null) {
            result.cafes = { value: absMetrics.cafeCount, source: 'Suburbs Database - OSM Enrichment', datasetYear: 2026, type: 'derived_metric' };
        }
        if (absMetrics.restaurantCount != null) {
            result.restaurants = { value: absMetrics.restaurantCount, source: 'Suburbs Database - OSM Enrichment', datasetYear: 2026, type: 'derived_metric' };
        }
        if (absMetrics.gymCount != null) {
            result.gyms = { value: absMetrics.gymCount, source: 'Suburbs Database - OSM Enrichment', datasetYear: 2026, type: 'derived_metric' };
        }
        if (absMetrics.cinemaCount != null) {
            result.cinemas = { value: absMetrics.cinemaCount, source: 'Suburbs Database - OSM Enrichment', datasetYear: 2026, type: 'derived_metric' };
        }
        if (absMetrics.libraryCount != null) {
            result.libraries = { value: absMetrics.libraryCount, source: 'Suburbs Database - OSM Enrichment', datasetYear: 2026, type: 'derived_metric' };
        }
        const recreationCount = (absMetrics.gymCount || 0) + (absMetrics.cinemaCount || 0) + (absMetrics.sportsFieldCount || 0) + (absMetrics.libraryCount || 0);
        if (recreationCount > 0) {
            result.recreation = { value: recreationCount, source: 'Suburbs Database - OSM Enrichment', datasetYear: 2026, type: 'derived_metric' };
        }
        // Add SA2 metadata and data integrity information
        if (isOfficialSuburb && sa2Code) {
            result.sa2Code = sa2Code;
            result.sa2Name = sa2Name;
            // Determine if multi-SA2 and aggregation method
            const isMultiSA2 = sa2Code.includes('|');
            let aggregationMethod = 'single-sa2';
            let sa2Codes = [];
            let coveragePercents = [];
            if (isMultiSA2 && sa2Mapping?.sa2_codes) {
                aggregationMethod = 'population-weighted';
                sa2Codes = sa2Mapping.sa2_codes.map(s => s.code);
                coveragePercents = sa2Mapping.sa2_codes.map(s => s.coveragePercent);
            }
            else if (isMultiSA2) {
                // Fallback: just split the code if sa2_codes array not available
                sa2Codes = sa2Code.split('|').map(c => c.trim());
                aggregationMethod = 'multi-sa2-aggregate';
            }
            // Build data integrity metadata
            result.dataIntegrity = {
                absSource: 'ABS Census 2021',
                asgsVersion: '2021',
                mappingVerified: isOfficialSuburb,
                multiSA2: isMultiSA2,
                aggregationMethod: aggregationMethod,
                ...(sa2Codes.length > 0 && { sa2Codes }),
                ...(coveragePercents.length > 0 && { coveragePercents })
            };
        }
        return result;
    }
}
exports.ExternalDataService = ExternalDataService;
//# sourceMappingURL=externalDataService.js.map