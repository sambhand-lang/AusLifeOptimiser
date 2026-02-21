"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const externalDataService_1 = require("../externalDataService");
const router = express_1.default.Router();
// GET /api/suburbs - Get all suburbs or filter by state
router.get('/', async (req, res) => {
    try {
        const state = req.query.state;
        let sql = 'SELECT * FROM suburbs ORDER BY suburb_name';
        const params = [];
        if (state) {
            sql = 'SELECT * FROM suburbs WHERE state = ? ORDER BY suburb_name';
            params.push(state.toUpperCase());
        }
        const result = await (0, db_1.query)(sql, params);
        res.json({
            total: result.rows.length,
            data: result.rows,
        });
    }
    catch (err) {
        console.error('Error fetching suburbs:', err);
        res.status(500).json({ error: 'Failed to fetch suburbs' });
    }
});
// GET /api/suburbs/search - Search suburbs by name
router.get('/search', async (req, res) => {
    try {
        const searchQuery = req.query.query;
        const state = req.query.state;
        if (!searchQuery) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        // Build query to prioritize:
        // 1. Exact surname matches (e.g., "PARRAMATTA" before "NORTH PARRAMATTA")
        // 2. Non-null postcodes before null
        // 3. Higher postcode numbers first (main postcodes tend to be higher)
        // 4. Alphabetically by suburb name
        const upperQuery = searchQuery.toUpperCase();
        let sql = `
      SELECT * FROM suburbs 
      WHERE suburb_name LIKE ? ${state ? 'AND state = ?' : ''}
      ORDER BY 
        CASE WHEN suburb_name = ? THEN 0 ELSE 1 END,
        postcode IS NOT NULL DESC,
        CAST(postcode AS INTEGER) DESC,
        suburb_name ASC
    `;
        const params = [`%${upperQuery}%`];
        if (state) {
            params.push(state.toUpperCase());
        }
        params.push(upperQuery); // For exact match comparison
        const result = await (0, db_1.query)(sql, params);
        res.json({
            total: result.rows.length,
            data: result.rows,
        });
    }
    catch (err) {
        console.error('Error searching suburbs:', err);
        res.status(500).json({ error: 'Failed to search suburbs' });
    }
});
// GET /api/suburbs/by-city - Get suburbs in a specific city
router.get('/by-city', async (req, res) => {
    try {
        const city = req.query.city;
        if (!city) {
            return res.status(400).json({ error: 'City name is required' });
        }
        const sql = "SELECT * FROM suburbs WHERE city LIKE ? ORDER BY suburb_name";
        const result = await (0, db_1.query)(sql, [`%${city.toUpperCase()}%`]);
        res.json({
            total: result.rows.length,
            data: result.rows,
        });
    }
    catch (err) {
        console.error('Error fetching suburbs by city:', err);
        res.status(500).json({ error: 'Failed to fetch suburbs by city' });
    }
});
// GET /api/suburbs/:id/details - Get detailed suburb data with real-time metrics
router.get('/:id/details', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await (0, db_1.query)('SELECT * FROM suburbs WHERE id = ?', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Suburb not found' });
        }
        const suburb = result.rows[0];
        // Enforce ABS presence: population must exist in ABS preload else 404
        const absMetrics = await externalDataService_1.ExternalDataService.getAbsMetrics(suburb.suburb_name, suburb.state);
        if (!absMetrics.population) {
            console.error('ABS boundary/population missing for suburb', suburb.suburb_name, suburb.state);
            return res.status(404).json({ error: 'Suburb not found in ABS dataset' });
        }
        // Get real-time data from approved external APIs
        const realData = await externalDataService_1.ExternalDataService.getSuburbRealData(suburb.suburb_name, suburb.state, suburb.postcode);
        // Normalize and structure the response
        const normalized = {};
        const sources = [];
        // Include all metrics from realData (already properly formatted)
        if (realData.population) {
            normalized.population = realData.population;
            if (realData.population.source)
                sources.push(realData.population.source);
        }
        if (realData.medianAge) {
            normalized.medianAge = realData.medianAge;
            if (realData.medianAge.source)
                sources.push(realData.medianAge.source);
        }
        if (realData.householdSize) {
            normalized.householdSize = realData.householdSize;
            if (realData.householdSize.source)
                sources.push(realData.householdSize.source);
        }
        if (realData.employmentRate) {
            normalized.employmentRate = realData.employmentRate;
            if (realData.employmentRate.source)
                sources.push(realData.employmentRate.source);
        }
        if (realData.medianIncome) {
            normalized.medianIncome = realData.medianIncome;
            if (realData.medianIncome.source)
                sources.push(realData.medianIncome.source);
        }
        // commute: accept nested metric
        const commuteObj = realData?.commute;
        if (commuteObj && typeof commuteObj === 'object' && commuteObj.drivingTimeMinutes && commuteObj.drivingTimeMinutes.value != null) {
            normalized.commute = { drivingTimeMinutes: commuteObj.drivingTimeMinutes };
            if (commuteObj.drivingTimeMinutes.source)
                sources.push(commuteObj.drivingTimeMinutes.source);
        }
        // schools: include count metric
        if (realData?.schools && realData.schools.count && realData.schools.count.value != null) {
            normalized.schools = { count: realData.schools.count };
            if (realData.schools.count.source)
                sources.push(realData.schools.count.source);
        }
        // publicTransportStops: direct metric
        if (realData.publicTransportStops && realData.publicTransportStops.value != null) {
            normalized.publicTransportStops = realData.publicTransportStops;
            if (realData.publicTransportStops.source)
                sources.push(realData.publicTransportStops.source);
        }
        // parks: direct metric
        if (realData.parks && realData.parks.value != null) {
            normalized.parks = realData.parks;
            if (realData.parks.source)
                sources.push(realData.parks.source);
        }
        // dataIntegrity: metadata about data source and aggregation
        if (realData.dataIntegrity) {
            normalized.dataIntegrity = realData.dataIntegrity;
        }
        // dedupe sources
        const uniqueSources = Array.from(new Set(sources));
        res.json({
            ...suburb,
            realTimeData: normalized,
            dataSource: uniqueSources.length ? uniqueSources.join(', ') : 'ABS',
            lastUpdated: new Date().toISOString()
        });
    }
    catch (err) {
        console.error('Error fetching suburb details:', err);
        res.status(500).json({ error: 'Failed to fetch suburb details' });
    }
});
// GET /api/suburbs/ssc/:ssc/details - Get detailed suburb data by SSC
router.get('/ssc/:ssc/details', async (req, res) => {
    try {
        const ssc = req.params.ssc;
        if (!ssc)
            return res.status(400).json({ error: 'SSC is required' });
        const result = await (0, db_1.query)('SELECT * FROM suburbs WHERE ssc = ? LIMIT 1', [ssc]);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Suburb not found' });
        }
        const suburb = result.rows[0];
        // Enforce ABS presence
        const absMetrics = await externalDataService_1.ExternalDataService.getAbsMetrics(suburb.suburb_name, suburb.state);
        if (!absMetrics.population) {
            console.error('ABS boundary/population missing for suburb', suburb.suburb_name, suburb.state);
            return res.status(404).json({ error: 'Suburb not found in ABS dataset' });
        }
        const realData = await externalDataService_1.ExternalDataService.getSuburbRealData(suburb.suburb_name, suburb.state, suburb.postcode);
        // reuse normalization logic from existing handler
        const normalized = {};
        const sources = [];
        if (realData.population) {
            normalized.population = realData.population;
            if (realData.population.source)
                sources.push(realData.population.source);
        }
        if (realData.medianAge) {
            normalized.medianAge = realData.medianAge;
            if (realData.medianAge.source)
                sources.push(realData.medianAge.source);
        }
        if (realData.householdSize) {
            normalized.householdSize = realData.householdSize;
            if (realData.householdSize.source)
                sources.push(realData.householdSize.source);
        }
        if (realData.employmentRate) {
            normalized.employmentRate = realData.employmentRate;
            if (realData.employmentRate.source)
                sources.push(realData.employmentRate.source);
        }
        if (realData.medianIncome) {
            normalized.medianIncome = realData.medianIncome;
            if (realData.medianIncome.source)
                sources.push(realData.medianIncome.source);
        }
        const commuteObj = realData?.commute;
        if (commuteObj && typeof commuteObj === 'object' && commuteObj.drivingTimeMinutes && commuteObj.drivingTimeMinutes.value != null) {
            normalized.commute = { drivingTimeMinutes: commuteObj.drivingTimeMinutes };
            if (commuteObj.drivingTimeMinutes.source)
                sources.push(commuteObj.drivingTimeMinutes.source);
        }
        if (realData?.schools && realData.schools.count && realData.schools.count.value != null) {
            normalized.schools = { count: realData.schools.count };
            if (realData.schools.count.source)
                sources.push(realData.schools.count.source);
        }
        if (realData.publicTransportStops && realData.publicTransportStops.value != null) {
            normalized.publicTransportStops = realData.publicTransportStops;
            if (realData.publicTransportStops.source)
                sources.push(realData.publicTransportStops.source);
        }
        if (realData.parks && realData.parks.value != null) {
            normalized.parks = realData.parks;
            if (realData.parks.source)
                sources.push(realData.parks.source);
        }
        const uniqueSources = Array.from(new Set(sources));
        res.json({
            ...suburb,
            realTimeData: normalized,
            dataSource: uniqueSources.length ? uniqueSources.join(', ') : 'ABS',
            lastUpdated: new Date().toISOString()
        });
    }
    catch (err) {
        console.error('Error fetching suburb details by SSC:', err);
        res.status(500).json({ error: 'Failed to fetch suburb details' });
    }
});
exports.default = router;
//# sourceMappingURL=suburbs.js.map