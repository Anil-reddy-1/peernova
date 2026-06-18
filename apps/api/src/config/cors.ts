import type { CorsOptions } from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:4000',
  'https://peernova.vercel.app',
  process.env.NEXT_PUBLIC_API_URL,
  process.env.CLIENT_URL,
  process.env.NEXT_PUBLIC_CLIENT_URL,
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Idempotency-Key'],
  exposedHeaders: ['X-Request-Id', 'X-RateLimit-Remaining', 'Retry-After'],
  maxAge: 86400,
};
