import { Router } from 'express';
import { ExternalDataService } from '../externalDataService';
import { getSuburbWithPostcodes, searchSuburbs, getNearbySuburbs } from '../services/dropdownService';

const router = Router();

/**
 * GET /api/suburbs/search
 * Returns suburbs matching a query string
 */
router.get('/search', async (req, res) => {
  const query = (req.query.query as string) || '';
  if (!query) return res.json({ data: [] });

  try {
    const results = await searchSuburbs(query);
    res.json({ data: results });
  } catch (err: any) {
    console.error('Error in suburb search route:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

/**
 * GET /api/suburbs/:id/details
 * Returns full real-time data for a suburb by its ID (SSC)
 */
router.get('/:id/details', async (req, res) => {
  const id = req.params.id;
  console.log(`ROUTE: /api/suburbs/${id}/details invoked`);
  
  try {
    // 1. Get canonical suburb info from database
    const suburb = await getSuburbWithPostcodes(id);
    if (!suburb) {
      console.log(`Suburb not found for id: ${id}`);
      return res.status(404).json({ message: 'Suburb not found' });
    }

    console.log(`Found suburb: ${suburb.suburb_name}, ${suburb.state} (${suburb.postcode})`);

    // 2. Get real-time data from ExternalDataService (official-only)
    const realData = await ExternalDataService.getSuburbRealData(
      suburb.suburb_name,
      suburb.state,
      suburb.postcode
    );

    // 3. Combine with static info for frontend
    const response = {
      ...suburb,
      realTimeData: realData
    };

    console.log('Sending response for', response.suburb_name);
    res.json(response);
  } catch (err: any) {
    console.error('Error in suburb details route:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

/**
 * GET /api/suburbs/:id/nearby
 * Returns nearby suburbs for a given ID
 */
router.get('/:id/nearby', async (req, res) => {
  const id = req.params.id;
  const postcode = req.query.postcode as string;
  const state = req.query.state as string;

  try {
    const nearby = await getNearbySuburbs(id, postcode, state);
    res.json({ data: nearby });
  } catch (err: any) {
    console.error('Error in nearby suburbs route:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
