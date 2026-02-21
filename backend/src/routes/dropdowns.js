/**
 * Dropdown Routes
 * Provides suburb lookup endpoints for UI dropdowns/typeaheads
 */

const express = require('express');
const router = express.Router();

const dropdownService = require('../services/dropdownService');
const cache = require('../utils/cache');

/**
 * GET /api/dropdowns/suburbs
 * Get all suburbs for dropdown, optionally filtered by state
 * Query params:
 *   - state (optional): NSW, VIC, QLD, etc.
 *   - search (optional): search text for typeahead
 */
router.get('/suburbs', async (req, res) => {
  const state = req.query.state;
  const search = req.query.search;
  
  try {
    let data;
    
    if (search) {
      // Use search endpoint for typeahead
      data = await dropdownService.searchSuburbs(search, state);
    } else {
      // Use full list (with caching)
      const cacheKey = `dropdown:suburbs:${state || 'all'}`;
      let cached = cache.get(cacheKey);
      
      if (cached) {
        return res.json({ data: cached, cached: true });
      }
      
      data = await dropdownService.getAllSuburbsForDropdown(state);
      
      // Cache for 24 hours
      cache.set(cacheKey, data, 1000 * 60 * 60 * 24);
    }
    
    res.json({ 
      data,
      count: data.length,
      state: state || 'all'
    });
  } catch (err) {
    console.error('[ROUTE] dropdown suburbs error:', err);
    res.status(500).json({ error: 'Failed to load suburbs' });
  }
});

/**
 * GET /api/dropdowns/suburbs/:ssc
 * Get single suburb with all postcode options
 */
router.get('/suburbs/:ssc', async (req, res) => {
  const ssc = req.params.ssc;
  
  try {
    const data = await dropdownService.getSuburbWithPostcodes(ssc);
    
    if (!data) {
      return res.status(404).json({ error: 'Suburb not found' });
    }
    
    res.json(data);
  } catch (err) {
    console.error('[ROUTE] dropdown single suburb error:', err);
    res.status(500).json({ error: 'Failed to load suburb' });
  }
});

/**
 * GET /api/dropdowns/suburbs/search
 * Search suburbs with typeahead support
 * Query params:
 *   - q (required): search query
 *   - state (optional): filter by state
 */
router.get('/search', async (req, res) => {
  const query = req.query.q;
  const state = req.query.state;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'Search query must be at least 2 characters' });
  }
  
  try {
    const results = await dropdownService.searchSuburbs(query, state);
    res.json({ results, count: results.length });
  } catch (err) {
    console.error('[ROUTE] dropdown search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
