const express = require('express');
const router = express.Router();

const censusService = require('../services/censusService');
const geoService = require('../services/geoService');
const schoolService = require('../services/schoolService');
const amenityService = require('../services/amenityService');
const commuteService = require('../services/commuteService');
const cache = require('../utils/cache');
const validation = require('../utils/validation');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(process.cwd(), 'suburbs.db');
const db = new sqlite3.Database(dbPath);

// GET /api/suburb/:suburb/details?state=NSW
router.get('/:suburb/details', async (req, res) => {
  const rawSuburb = req.params.suburb;
  const suburb = validation.normalizeSuburbName(rawSuburb || '');
  const state = (req.query.state || 'NSW').toUpperCase();

  // If user provided an SSC as a query param, resolve to canonical suburb
  if (req.query.ssc) {
    const ssc = req.query.ssc;
    try {
      const row = await new Promise((resolve, reject) => {
        db.get('SELECT suburb_name, state, postcode FROM suburbs WHERE ssc = ? LIMIT 1', [ssc], (err, r) => {
          if (err) return reject(err);
          resolve(r);
        });
      });
      if (row) {
        // override suburb/state with canonical record
        suburb = validation.normalizeSuburbName(row.suburb_name || suburb);
        state = (row.state || state).toUpperCase();
      }
    } catch (e) {
      console.warn('[ROUTE] SSC lookup failed', e.message);
    }
  }

  if (!validation.isValidSuburbName(suburb) || !validation.isValidState(state)) {
    return res.status(400).json({ error: 'Invalid suburb or state' });
  }

  const cacheKey = `suburb:${suburb}|${state}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const census = censusService.getSuburbCensusData(suburb, state);
    const commute = commuteService.getSuburbCommuteTime(suburb, state);
    const schools = schoolService.countSchoolsInSuburb(suburb, state);
    const amenities = amenityService.getSuburbAmenities(suburb, state);

    const result = {
      suburb_name: suburb,
      state,
      realTimeData: {
        population: census.population,
        medianAge: census.medianAge,
        householdSize: census.householdSize,
        employmentRate: census.employmentRate,
        medianIncome: census.medianIncome,
        commute,
        schools,
        publicTransportStops: amenities.publicTransportStops,
        parks: amenities.parks
      }
    };

    cache.set(cacheKey, result, 1000 * 60 * 60); // 1 hour
    return res.json(result);
  } catch (err) {
    console.error('[ROUTE] suburb details error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
