// src/routes/dropdowns.ts
import { Router } from 'express';
import { getAllSuburbsForDropdown, searchSuburbs, getSuburbWithPostcodes } from '../services/dropdownService';

const router = Router();

/**
 * GET /api/dropdowns/suburbs
 * Returns all suburbs for dropdown, optionally filtered by state
 * Query: ?state=NSW
 */
router.get('/suburbs', async (req, res) => {
  console.log('ROUTE: /api/dropdowns/suburbs invoked');
  try {
    const state = req.query.state as string | undefined;
    console.log('Calling getAllSuburbsForDropdown with state:', state);
    const data = await getAllSuburbsForDropdown(state);
    console.log('getAllSuburbsForDropdown returned', Array.isArray(data) ? data.length + ' items' : typeof data);
    res.json(data);
  } catch (err: any) {
    console.error('Error fetching suburbs for dropdown:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/dropdowns/search
 * Search suburbs by name or postcode
 * Query: ?q=Parramatta&state=NSW
 */
router.get('/search', async (req, res) => {
  console.log('ROUTE: /api/dropdowns/search invoked');
  try {
    const query = req.query.q as string;
    const state = req.query.state as string | undefined;

    if (!query) {
      console.log('Missing query parameter q');
      return res.status(400).json({ message: 'Query parameter q is required' });
    }

    console.log('Calling searchSuburbs with query:', query, 'state:', state);
    const results = await searchSuburbs(query, state);
    console.log('searchSuburbs returned', Array.isArray(results) ? results.length + ' items' : typeof results);
    res.json({ results });
  } catch (err: any) {
    console.error('Error searching suburbs:', err);
    if (err && err.stack) {
      console.error('Stack trace:', err.stack);
    }
    res.status(500).json({ message: 'Internal server error', error: err?.message, stack: err?.stack });
  }
});

/**
 * GET /api/dropdowns/suburb/:ssc
 * Get single suburb with all postcode options
 */
router.get('/suburb/:ssc', async (req, res) => {
  console.log('ROUTE: /api/dropdowns/suburb/:ssc invoked');
  try {
    const ssc = req.params.ssc;
    console.log('Calling getSuburbWithPostcodes with ssc:', ssc);
    const suburb = await getSuburbWithPostcodes(ssc);

    if (!suburb) {
      console.log('Suburb not found for ssc:', ssc);
      return res.status(404).json({ message: 'Suburb not found' });
    }

    console.log('getSuburbWithPostcodes returned:', typeof suburb);
    res.json(suburb);
  } catch (err: any) {
    console.error('Error fetching suburb:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;