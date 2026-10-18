import express from 'express';
import { PullJob } from '../models/PullJob.js';
import { Trade } from '../models/Trade.js';

const router = express.Router();

// Helper function to build filter and sort from query parameters
function buildFilterAndSort(req) {
  // Validate sortBy parameter
  const validSortFields = ['timestamp', 'price', 'quantity', 'symbol'];
  const sortBy = req.query.sortBy ?? 'timestamp';
  if (!validSortFields.includes(sortBy)) {
    return { error: `Invalid sortBy value. Must be one of: ${validSortFields.join(', ')}` };
  }

  // Validate order parameter
  const validOrders = ['asc', 'desc'];
  const order = req.query.order ?? 'desc';
  if (!validOrders.includes(order)) {
    return { error: `Invalid order value. Must be one of: ${validOrders.join(', ')}` };
  }

  // Build filter query
  const filter = {};

  // Search: case-insensitive partial match against tradeId, client, or symbol
  if (req.query.search) {
    const searchTerm = req.query.search;
    // Escape regex metacharacters to prevent untrusted regex injection
    const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearch, 'i');
    filter.$or = [
      { tradeId: searchRegex },
      { client: searchRegex },
      { symbol: searchRegex }
    ];
  }

  // Symbol: exact match
  if (req.query.symbol) {
    filter.symbol = req.query.symbol;
  }

  // Build sort object with validated field names
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  sort[sortBy] = sortOrder;
  // Add secondary sort by tradeId for stable pagination when primary values are equal
  sort.tradeId = 1;

  return { filter, sort };
}

// Helper function to escape CSV fields and prevent formula injection
function escapeCsvField(value) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // Prevent spreadsheet formula injection by prepending with tab if starts with dangerous chars
  if (/^[=+\-@]/.test(str)) {
    return '\t' + str;
  }
  // Escape commas, double quotes, and newlines by wrapping in quotes and doubling embedded quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

router.get('/', async (req, res, next) => {
  try {
    let page = req.query.page === undefined ? 1 : Number(req.query.page);
    let pageSize =
      req.query.pageSize === undefined ? 50 : Number(req.query.pageSize);

    if (!Number.isFinite(page) || page < 1) page = 1;
    if (!Number.isFinite(pageSize) || pageSize < 1) pageSize = 50;
    pageSize = Math.min(Math.floor(pageSize), 200);

    const result = buildFilterAndSort(req);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const { filter, sort } = result;

    const total = await Trade.countDocuments(filter);
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const skip = (page - 1) * pageSize;

    const items = await Trade.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean();

    res.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/symbols', async (req, res, next) => {
  try {
    const symbols = await Trade.distinct('symbol');
    // Sort alphabetically
    symbols.sort((a, b) => a.localeCompare(b));
    res.json({ symbols });
  } catch (err) {
    next(err);
  }
});

router.get('/export.csv', async (req, res, next) => {
  try {
    const result = buildFilterAndSort(req);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    const { filter, sort } = result;

    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="trades.csv"');

    // Write CSV header
    const header = 'tradeId,client,symbol,quantity,price,timestamp\n';
    res.write(header);

    // Stream trades from database to avoid loading entire dataset into memory
    const cursor = Trade.find(filter)
      .sort(sort)
      .lean()
      .cursor();

    for await (const trade of cursor) {
      const row = [
        escapeCsvField(trade.tradeId),
        escapeCsvField(trade.client),
        escapeCsvField(trade.symbol),
        escapeCsvField(trade.quantity),
        escapeCsvField(trade.price),
        escapeCsvField(trade.timestamp)
      ].join(',') + '\n';
      res.write(row);
    }

    res.end();
  } catch (err) {
    // If headers haven't been sent yet, return JSON error
    if (!res.headersSent) {
      next(err);
    } else {
      // If headers already sent, we can't recover - just end the response
      res.end();
    }
  }
});

export async function getStats(_req, res, next) {
  try {
    const totalTrades = await Trade.countDocuments();
    const symbols = await Trade.distinct('symbol');
    const latestCompleted = await PullJob.findOne({ status: 'completed' })
      .sort({ finishedAt: -1 })
      .select('finishedAt')
      .lean();

    res.json({
      totalTrades,
      uniqueSymbols: symbols.length,
      lastPullAt: latestCompleted?.finishedAt ?? null,
    });
  } catch (err) {
    next(err);
  }
}

export default router;
