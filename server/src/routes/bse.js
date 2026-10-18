// Mock BSE Exchange API: real trade data is paged because a full pull spans many
// records and each HTTP response must finish within the network time limit (~30s).
// Clients walk pages with cursor/nextCursor; per-page delay spreads the full
// BSE_PULL_DURATION_MS across all pages so a complete import matches production timing.

import express from 'express';
import { config } from '../config.js';
import { SourceTrade } from '../models/SourceTrade.js';

export function computePageDelayMs() {
  const pages = Math.ceil(config.SEED_COUNT / config.BSE_PAGE_SIZE);
  return config.BSE_PULL_DURATION_MS / pages;
}

const router = express.Router();

router.get('/getTrades', async (req, res, next) => {
  try {
    const cursorRaw = req.query.cursor;
    const cursor =
      cursorRaw === undefined || cursorRaw === ''
        ? 0
        : Number(cursorRaw);

    let limit =
      req.query.limit === undefined || req.query.limit === ''
        ? config.BSE_PAGE_SIZE
        : Number(req.query.limit);

    if (!Number.isFinite(cursor) || cursor < 0) {
      res.status(400).json({ error: 'cursor must be a non-negative number' });
      return;
    }
    if (!Number.isFinite(limit) || limit < 1) {
      limit = config.BSE_PAGE_SIZE;
    }
    limit = Math.min(Math.floor(limit), 200);

    const pageDelayMs = computePageDelayMs();
    await new Promise((resolve) => setTimeout(resolve, pageDelayMs));

    const rows = await SourceTrade.find({ seq: { $gt: cursor } })
      .sort({ seq: 1 })
      .limit(limit)
      .select('seq tradeId client symbol quantity price timestamp')
      .lean();

    const total = await SourceTrade.countDocuments();

    let nextCursor = null;
    if (rows.length > 0) {
      const lastSeq = rows[rows.length - 1].seq;
      const hasMore = await SourceTrade.exists({ seq: { $gt: lastSeq } });
      nextCursor = hasMore ? lastSeq : null;
    }

    const trades = rows.map(
      ({ tradeId, client, symbol, quantity, price, timestamp }) => ({
        tradeId,
        client,
        symbol,
        quantity,
        price,
        timestamp,
      })
    );

    res.json({
      trades,
      nextCursor,
      total,
      pageDelayMs,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
