import { CorsOptions } from 'cors';
import { env } from './env';

const allowedOrigins =
  env.NODE_ENV === 'production'
    ? [env.CORS_ORIGIN]
    : ['http://localhost:5173', 'http://localhost:3001'];

export const corsOptions: CorsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
