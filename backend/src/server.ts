// DEBUG: Print expected DB path before importing routes
const path = require('path');
const dbPathDebug = path.resolve(__dirname, '../suburbs.db');
console.log('SERVER (before routes): suburbs.db absolute path:', dbPathDebug);
console.log('END OF server.ts REACHED');
// Log all uncaught exceptions and unhandled promise rejections
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});
import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import dropdownRoutes from './routes/dropdowns';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

/* ======================================================
   CORS Configuration
====================================================== */
const corsOptions = (() => {
  // Development: allow localhost + optional FRONTEND_URL
  if (process.env.NODE_ENV !== 'production') {
    return {
      origin: (
        origin: string | undefined,
        callback: (err: Error | null, allowed?: boolean) => void
      ) => {
        const devOrigins = [
          /^http:\/\/localhost:\d+$/,
          /^http:\/\/127\.0\.0\.1:\d+$/,
        ];

        const allowedOrigins = process.env.FRONTEND_URL
          ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
          : [];

        if (
          !origin ||
          devOrigins.some((pattern) => pattern.test(origin)) ||
          allowedOrigins.includes(origin)
        ) {
          callback(null, true);
        } else {
          callback(new Error('CORS not allowed'), false);
        }
      },
      credentials: true,
    };
  }

  // Production: strict CORS
  return {
    origin: process.env.FRONTEND_URL || 'https://your-production-domain.com',
    credentials: true,
  };
})();

/* ======================================================
   Global Middleware
====================================================== */
app.use(cors(corsOptions));
app.use(express.json());

/* ======================================================
   Routes
====================================================== */
app.use('/api/dropdowns', dropdownRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Australian Finance Tools Backend API' });
});

/* ======================================================
   404 Handler (Must be after routes)
====================================================== */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
  });
});

/* ======================================================
   Global Error Handler (Must be last)
====================================================== */
app.use(
  (err: any, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);

    res.status(err.status || 500).json({
      error: 'Internal Server Error',
      message:
        process.env.NODE_ENV === 'production'
          ? undefined
          : err.message,
    });
  }
);

/* ======================================================
   Start Server
====================================================== */
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;