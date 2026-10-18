import dotenv from 'dotenv';

dotenv.config();

function numberEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  const n = Number(raw);
  return Number.isFinite(n) ? n : defaultValue;
}

function stringEnv(name, defaultValue) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return defaultValue;
  return raw;
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI is required');
}

export const config = {
  PORT: numberEnv('PORT', 4000),
  MONGODB_URI,
  CLIENT_ORIGIN: stringEnv('CLIENT_ORIGIN', 'http://localhost:5173'),
  BSE_BASE_URL: stringEnv('BSE_BASE_URL', 'http://localhost:4000'),
  BSE_PULL_DURATION_MS: numberEnv('BSE_PULL_DURATION_MS', 30000),
  BSE_PAGE_SIZE: numberEnv('BSE_PAGE_SIZE', 50),
  SEED_COUNT: numberEnv('SEED_COUNT', 3000),
  REQUEST_TIMEOUT_MS: numberEnv('REQUEST_TIMEOUT_MS', 28000),
  BATCH_RETRY_LIMIT: numberEnv('BATCH_RETRY_LIMIT', 3),
};
