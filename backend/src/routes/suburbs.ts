import { Router } from 'express';
import { ExternalDataService } from '../externalDataService';
import { getSuburbWithPostcodes } from '../services/dropdownService';

const router = Router();

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

export default router;
