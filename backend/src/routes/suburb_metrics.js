const express = require('express');
const router = express.Router();

const geoService = require('../services/geoService');

// GET /api/suburb/metrics/:name?state=NSW
router.get('/:name', async (req, res) => {
  const name = req.params.name;
  const state = (req.query.state || 'NSW').toUpperCase();

  try {
    const result = await geoService.generateSuburbMetrics(name, state);
    return res.json(result);
  } catch (err) {
    console.error('[ROUTE] suburb_metrics error:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
