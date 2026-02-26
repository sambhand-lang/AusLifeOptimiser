// src/routes/dropdowns.ts
import { Router, Request, Response } from 'express';
import { searchSuburbs, getAllSuburbsForDropdown } from '../services/dropdownService';

const router = Router();

// GET /api/dropdowns/suburbs?q=...
router.get('/suburbs', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query) {
    return res.status(400).json({ message: "Query parameter 'q' is required" });
  }

  try {
    const results = await searchSuburbs(query);
    res.json(results);
  } catch (err: any) {
    console.error('Error searching suburbs:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET /api/dropdowns/search?q=... (alias)
router.get('/search', async (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  if (!query) {
    return res.status(400).json({ message: "Query parameter 'q' is required" });
  }

  try {
    const results = await searchSuburbs(query);
    res.json(results);
  } catch (err: any) {
    console.error('Error searching suburbs:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET /api/dropdowns/all-suburbs
router.get('/all-suburbs', async (_req: Request, res: Response) => {
  try {
    const results = await getAllSuburbsForDropdown();
    res.json(results);
  } catch (err: any) {
    console.error('Error fetching all suburbs:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

export default router;