import express from 'express';
import { generateSuburbMetrics } from '../services/geoService.js';
import { validateMetricsObject } from '../utils/validation.js';

const router = express.Router();

router.get('/:name', async (req, res) => {
  try {
    const result = await generateSuburbMetrics(req.params.name);
    validateMetricsObject(result.metrics);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
