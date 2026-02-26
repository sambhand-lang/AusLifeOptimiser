// src/server.ts
import express from 'express';
import dropdownRoutes from './routes/dropdowns';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5001;
const dbPath = path.resolve(__dirname, '../suburbs.db');

app.use(express.json());

// Test route
app.get('/', (_req, res) => res.send('Server is running!'));

// Mount dropdown routes
app.use('/api/dropdowns', dropdownRoutes);



// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Backend CWD:', process.cwd());
  console.log('DB absolute path:', dbPath);
});