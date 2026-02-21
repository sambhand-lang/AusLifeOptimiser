const express = require('express');
const dotenv = require('dotenv');

const censusService = require('./services/censusService');
const geoService = require('./services/geoService');
const schoolService = require('./services/schoolService');
const amenityService = require('./services/amenityService');

const suburbRoute = require('./routes/suburb');
const suburbMetricsRoute = require('./routes/suburb_metrics');
const subburbsV2Route = require('./routes/suburbs_v2');
const dropdownsRoute = require('./routes/dropdowns');

dotenv.config();

const app = express();
app.use(express.json());

// Mount routes
app.use('/api/suburb', suburbRoute);
app.use('/api/v2/suburbs', subburbsV2Route);
app.use('/api/dropdowns', dropdownsRoute);

const PORT = process.env.PORT || 3000;

async function init() {
  // Initialize data services
  await Promise.all([
    censusService.initializeCensusData(),
    geoService.initializeGeoData(),
    schoolService.initializeSchoolData(),
    amenityService.initializeAmenityData()
  ]).catch((err) => console.warn('Service init warning:', err.message));

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Mount metrics route
app.use('/api/suburb/metrics', suburbMetricsRoute);

init();

module.exports = app;
