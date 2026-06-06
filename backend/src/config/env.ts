import 'dotenv/config';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = Object.freeze({
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 4000),
  DATABASE_URL: required('DATABASE_URL'),
  JWT_ACCESS_SECRET: required('JWT_ACCESS_SECRET'),
  JWT_REFRESH_SECRET: required('JWT_REFRESH_SECRET'),
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL ?? '15m',
  REFRESH_TOKEN_TTL: process.env.REFRESH_TOKEN_TTL ?? '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  MAX_ATTACHMENT_BYTES: Number(process.env.MAX_ATTACHMENT_BYTES ?? 5 * 1024 * 1024),
});

export const isProd = env.NODE_ENV === 'production';
