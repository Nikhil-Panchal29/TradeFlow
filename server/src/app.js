import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import bseRouter from './routes/bse.js';
import pullsRouter from './routes/pulls.js';
import tradesRouter, { getStats } from './routes/trades.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.CLIENT_ORIGIN,
    })
  );
  app.use(express.json());

  app.use(bseRouter);
  app.use('/api/pulls', pullsRouter);
  app.use('/api/trades', tradesRouter);
  app.get('/api/stats', getStats);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}
