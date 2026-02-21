const { generateSuburbMetrics } = require('./src/services/generateSuburbMetrics');

(async () => {
  try {
    const res = await generateSuburbMetrics('PARRAMATTA');
    console.log(JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Test failed:', err.message || err);
    process.exit(1);
  }
})();
