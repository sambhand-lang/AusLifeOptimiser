"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/dropdowns.ts
const express_1 = require("express");
const dropdownService_1 = require("../services/dropdownService");
const router = (0, express_1.Router)();
// GET /api/dropdowns/suburbs?q=...
router.get('/suburbs', async (req, res) => {
    const query = req.query.q || '';
    if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
    }
    try {
        const query = req.query.q;
        const state = req.query.state;
        if (!query) {
            console.log('Missing query parameter q');
            return res.status(400).json({ message: 'Query parameter q is required' });
        }
        console.log('Calling searchSuburbs with query:', query, 'state:', state);
        const results = await (0, dropdownService_1.searchSuburbs)(query, state);
        console.log('searchSuburbs returned', Array.isArray(results) ? results.length + ' items' : typeof results);
        res.json({ results });
    }
    catch (err) {
        console.error('Error searching suburbs:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
// GET /api/dropdowns/search?q=... (alias)
router.get('/search', async (req, res) => {
    const query = req.query.q || '';
    if (!query) {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
    }
    try {
        const results = await (0, dropdownService_1.searchSuburbs)(query);
        res.json(results);
    }
    catch (err) {
        console.error('Error searching suburbs:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
// GET /api/dropdowns/all-suburbs
router.get('/all-suburbs', async (_req, res) => {
    try {
        const results = await (0, dropdownService_1.getAllSuburbsForDropdown)();
        res.json(results);
    }
    catch (err) {
        console.error('Error fetching all suburbs:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=dropdowns.js.map