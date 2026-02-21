import express, { Request, Response, Router } from 'express';
import { query, QueryResult } from '../db';
import { ExternalDataService, SuburbRealData } from '../externalDataService';

const router: Router = express.Router();

// Interface for suburb data
interface Suburb {
  id: number;
  suburb_name: string;
  postcode: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
}

// GET /api/suburbs - Get all suburbs or filter by state
router.get('/', async (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    let sql = 'SELECT * FROM suburbs ORDER BY suburb_name';
    const params: any[] = [];

    if (state) {
      sql = 'SELECT * FROM suburbs WHERE state = $1 ORDER BY suburb_name';
      params.push(state.toUpperCase());
    }

    const result = await query(sql, params);
    res.json({
      total: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error fetching suburbs:', err);
    res.status(500).json({ error: 'Failed to fetch suburbs' });
  }
});

// GET /api/suburbs/search - Search suburbs by name
router.get('/search', async (req: Request, res: Response) => {
  try {
    const searchQuery = req.query.query as string;
    const state = req.query.state as string;

    if (!searchQuery) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    let sql =
      "SELECT * FROM suburbs WHERE suburb_name LIKE ? ORDER BY suburb_name";
    const params: any[] = [`%${searchQuery.toUpperCase()}%`];

    if (state) {
      sql =
        "SELECT * FROM suburbs WHERE suburb_name LIKE ? AND state = ? ORDER BY suburb_name";
      params.push(state.toUpperCase());
    }

    const result = await query(sql, params);
    res.json({
      total: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error searching suburbs:', err);
    res.status(500).json({ error: 'Failed to search suburbs' });
  }
});

// GET /api/suburbs/by-city - Get suburbs in a specific city
router.get('/by-city', async (req: Request, res: Response) => {
  try {
    const city = req.query.city as string;

    if (!city) {
      return res.status(400).json({ error: 'City name is required' });
    }

    const sql =
      "SELECT * FROM suburbs WHERE city LIKE ? ORDER BY suburb_name";
    const result = await query(sql, [`%${city.toUpperCase()}%`]);

    res.json({
      total: result.rows.length,
      data: result.rows,
    });
  } catch (err) {
    console.error('Error fetching suburbs by city:', err);
    res.status(500).json({ error: 'Failed to fetch suburbs by city' });
  }
});

// GET /api/suburbs/:id/details - Get detailed suburb data with real-time metrics
router.get('/:id/details', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const result = await query(
      'SELECT * FROM suburbs WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Suburb not found' });
    }

    const suburb = result.rows[0];

    // Enforce ABS presence: population must exist in ABS preload else 404
    const absMetrics = await ExternalDataService.getAbsMetrics(suburb.suburb_name, suburb.state);
    if (!absMetrics.population) {
      console.error('ABS boundary/population missing for suburb', suburb.suburb_name, suburb.state);
      return res.status(404).json({ error: 'Suburb not found in ABS dataset' });
    }

    // Get real-time data from approved external APIs
    const realData = await ExternalDataService.getSuburbRealData(
      suburb.suburb_name,
      suburb.state,
      suburb.postcode
    );

    // Normalize and structure the response
    const normalized: any = {};
    const sources: string[] = [];

    // Include all metrics from realData (already properly formatted)
    if (realData.population) {
      normalized.population = realData.population;
      if (realData.population.source) sources.push(realData.population.source);
    }

    if (realData.medianAge) {
      normalized.medianAge = realData.medianAge;
      if (realData.medianAge.source) sources.push(realData.medianAge.source);
    }

    if (realData.householdSize) {
      normalized.householdSize = realData.householdSize;
      if (realData.householdSize.source) sources.push(realData.householdSize.source);
    }

    if (realData.employmentRate) {
      normalized.employmentRate = realData.employmentRate;
      if (realData.employmentRate.source) sources.push(realData.employmentRate.source);
    }

    if (realData.medianIncome) {
      normalized.medianIncome = realData.medianIncome;
      if (realData.medianIncome.source) sources.push(realData.medianIncome.source);
    }

    // commute: accept nested metric
    const commuteObj = realData?.commute;
    if (commuteObj && typeof commuteObj === 'object' && commuteObj.drivingTimeMinutes && commuteObj.drivingTimeMinutes.value != null) {
      normalized.commute = { drivingTimeMinutes: commuteObj.drivingTimeMinutes };
      if (commuteObj.drivingTimeMinutes.source) sources.push(commuteObj.drivingTimeMinutes.source);
    }

    // schools: include count metric
    if (realData?.schools && realData.schools.count && realData.schools.count.value != null) {
      normalized.schools = { count: realData.schools.count };
      if (realData.schools.count.source) sources.push(realData.schools.count.source);
    }

    // publicTransportStops: direct metric
    if (realData.publicTransportStops && realData.publicTransportStops.value != null) {
      normalized.publicTransportStops = realData.publicTransportStops;
      if (realData.publicTransportStops.source) sources.push(realData.publicTransportStops.source);
    }

    // parks: direct metric
    if (realData.parks && realData.parks.value != null) {
      normalized.parks = realData.parks;
      if (realData.parks.source) sources.push(realData.parks.source);
    }

    // dedupe sources
    const uniqueSources = Array.from(new Set(sources));

    res.json({
      ...suburb,
      realTimeData: normalized,
      dataSource: uniqueSources.length ? uniqueSources.join(', ') : 'ABS',
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching suburb details:', err);
    res.status(500).json({ error: 'Failed to fetch suburb details' });
  }
});

export default router;
