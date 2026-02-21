import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import suburbsRouter from './routes/suburbs';

// Load environment variables
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// CORS configuration: dev-friendly, production-safe
const corsOptions = (() => {
  // In development, allow requests from common local dev ports
  if (process.env.NODE_ENV !== 'production') {
    return {
      origin: (origin: string | undefined, callback: (err: Error | null, allowed?: boolean) => void) => {
        // Allow localhost and common dev ports, no-origin (curl/Postman), or explicit FRONTEND_URL
        const devOrigins = [
          /^http:\/\/localhost:\d+$/, // localhost on any port
          /^http:\/\/127.0.0.1:\d+$/, // 127.0.0.1 on any port
        ];
        const allowedOrigins = process.env.FRONTEND_URL
          ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
          : [];

        if (!origin || devOrigins.some(pattern => pattern.test(origin)) || allowedOrigins.includes(origin)) {
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

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/suburbs', suburbsRouter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Australian Finance Tools Backend API' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export default app;
