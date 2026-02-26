/**
 * SSC-based Suburb Routes (Refactored)
 * Primary routes using SSC as canonical identifier
 * Includes backward-compatible fallback to suburb_name + state
 */

const express = require('express');
const router = express.Router();

const censusService = require('../services/censusService');
const geoService = require('../services/geoService');
const schoolService = require('../services/schoolService');
const amenityService = require('../services/amenityService');
const commuteService = require('../services/commuteService');
const sscResolutionService = require('../services/sscResolutionService');
const cache = require('../utils/cache');
const validation = require('../utils/validation');

/**
 * GET /api/v2/suburbs/:ssc/details
 * Primary endpoint: Get all suburb details by SSC
 * Returns: demographics, schools, transport, parks, coordinates
 */
router.get('/:ssc/details', async (req, res) => {
  const rawSSC = req.params.ssc;
  
  if (!validation.isValidSSC(rawSSC)) {
    return res.status(400).json({ error: 'Invalid SSC format. Expected 5-digit code.' });
  }
  
  const ssc = String(rawSSC).trim();
  const cacheKey = `ssc:${ssc}:details`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);
  
  try {
    // Validate SSC exists in database
    const isValid = await sscResolutionService.isValidSSC(ssc);
    if (!isValid) {
      return res.status(404).json({ error: 'SSC not found in canonical registry' });
    }
    
    // Get canonical suburb details
    const suburbDetails = await sscResolutionService.getSuburbDetailsBySSC(ssc);
    if (!suburbDetails) {
      return res.status(404).json({ error: 'SSC not found' });
    }
    
    const { suburb_name, state, postcode } = suburbDetails;
    
    // Get linked data
    const census = censusService.getSuburbCensusData(suburb_name, state);
    const commute = commuteService.getSuburbCommuteTime(suburb_name, state);
    const schools = schoolService.countSchoolsInSuburb(suburb_name, state);
    const amenities = amenityService.getSuburbAmenities(suburb_name, state);
    const postcodes = await sscResolutionService.getPostcodesBySSC(ssc);
    
    const result = {
      ssc,
      suburb_name,
      state,
      primaryPostcode: postcode,
      allPostcodes: postcodes,
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
    console.error('[ROUTE v2] suburb details by SSC error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/suburbs/lookup/by-name
 * Legacy compatibility: Resolve suburb_name + state to SSC
 * Query params: name, state
 */
router.get('/lookup/by-name', async (req, res) => {
  const name = req.query.name;
  const state = (req.query.state || 'NSW').toUpperCase();
  
  if (!validation.isValidSuburbName(name) || !validation.isValidState(state)) {
    return res.status(400).json({ error: 'Invalid suburb name or state' });
  }
  
  try {
    const ssc = await sscResolutionService.getSSCBySuburbAndState(name, state);
    if (!ssc) {
      return res.status(404).json({ 
        error: 'No SSC found for this suburb/state combination' 
      });
    }
    
    return res.json({ ssc, suburb_name: name, state });
  } catch (err) {
    console.error('[ROUTE v2] lookup by name error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/v2/suburbs/:ssc/validate
 * Validate that an SSC exists and is canonical
 */
router.post('/:ssc/validate', async (req, res) => {
  const rawSSC = req.params.ssc;
  
  if (!validation.isValidSSC(rawSSC)) {
    return res.status(400).json({ valid: false, error: 'Invalid SSC format' });
  }
  
  try {
    const isValid = await sscResolutionService.isValidSSC(rawSSC);
    const details = isValid ? await sscResolutionService.getSuburbDetailsBySSC(rawSSC) : null;
    
    return res.json({ 
      valid: isValid,
      ssc: rawSSC,
      canonicalRecord: details
    });
  } catch (err) {
    console.error('[ROUTE v2] validate SSC error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/v2/suburbs/:ssc/postcodes
 * Get all postcodes associated with an SSC
 */
router.get('/:ssc/postcodes', async (req, res) => {
  const ssc = req.params.ssc;
  
  if (!validation.isValidSSC(ssc)) {
    return res.status(400).json({ error: 'Invalid SSC format' });
  }
  
  try {
    const isValid = await sscResolutionService.isValidSSC(ssc);
    if (!isValid) {
      return res.status(404).json({ error: 'SSC not found' });
    }
    
    const postcodes = await sscResolutionService.getPostcodesBySSC(ssc);
    return res.json({ ssc, postcodes });
  } catch (err) {
    console.error('[ROUTE v2] postcodes error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
