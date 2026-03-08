"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const externalDataService_1 = require("../externalDataService");
const dropdownService_1 = require("../services/dropdownService");
const router = (0, express_1.Router)();
/**
 * GET /api/suburbs/:id/details
 * Returns full real-time data for a suburb by its ID (SSC)
 */
router.get('/:id/details', async (req, res) => {
    const id = req.params.id;
    console.log(`ROUTE: /api/suburbs/${id}/details invoked`);
    try {
        // 1. Get canonical suburb info from database
        const suburb = await (0, dropdownService_1.getSuburbWithPostcodes)(id);
        if (!suburb) {
            console.log(`Suburb not found for id: ${id}`);
            return res.status(404).json({ message: 'Suburb not found' });
        }
        console.log(`Found suburb: ${suburb.suburb_name}, ${suburb.state} (${suburb.postcode})`);
        // 2. Get real-time data from ExternalDataService (official-only)
        const realData = await externalDataService_1.ExternalDataService.getSuburbRealData(suburb.suburb_name, suburb.state, suburb.postcode);
        // 3. Combine with static info for frontend
        const response = {
            ...suburb,
            realTimeData: realData
        };
        console.log('Sending response for', response.suburb_name);
        res.json(response);
    }
    catch (err) {
        console.error('Error in suburb details route:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=suburbs.js.map