import { config } from '../config.js';
import { PullJob } from '../models/PullJob.js';
import { Trade } from '../models/Trade.js';

let pullRunningInMemory = false;

function emit(onEvent, eventName, job) {
  try {
    onEvent(eventName, job);
  } catch {
    // Pull must continue even if the listener fails.
  }
}

async function fetchTradesPage(cursor) {
  const url = new URL('/getTrades', config.BSE_BASE_URL);
  url.searchParams.set('cursor', String(cursor));
  url.searchParams.set('limit', String(config.BSE_PAGE_SIZE));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`BSE request failed with status ${response.status}`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function fetchTradesPageWithRetry(cursor) {
  let lastError;
  for (let attempt = 1; attempt <= config.BATCH_RETRY_LIMIT; attempt += 1) {
    try {
      return await fetchTradesPage(cursor);
    } catch (err) {
      lastError = err;
      if (attempt < config.BATCH_RETRY_LIMIT) {
        await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
      }
    }
  }
  throw lastError ?? new Error('BSE request failed');
}

async function runPull(jobId, onEvent) {
  try {
    let cursor = 0;
    let firstPage = true;

    while (true) {
      const page = await fetchTradesPageWithRetry(cursor);

      if (firstPage) {
        const total = page.total ?? 0;
        const batchesTotal = Math.ceil(total / config.BSE_PAGE_SIZE) || 0;
        await PullJob.findByIdAndUpdate(jobId, {
          totalRecords: total,
          batchesTotal,
        });
        firstPage = false;
      }

      const trades = page.trades ?? [];
      if (trades.length === 0) {
        break;
      }

      const importedAt = new Date();
      const ops = trades.map((trade) => ({
        updateOne: {
          filter: { tradeId: trade.tradeId },
          update: {
            $setOnInsert: {
              tradeId: trade.tradeId,
              client: trade.client,
              symbol: trade.symbol,
              quantity: trade.quantity,
              price: trade.price,
              timestamp: new Date(trade.timestamp),
              importedAt,
              jobId,
            },
          },
          upsert: true,
        },
      }));

      const writeResult = await Trade.bulkWrite(ops, { ordered: false });
      const inserted = writeResult.upsertedCount ?? 0;
      const duplicates = trades.length - inserted;

      const job = await PullJob.findByIdAndUpdate(
        jobId,
        {
          $inc: {
            processedRecords: trades.length,
            insertedRecords: inserted,
            duplicateRecords: duplicates,
            batchesDone: 1,
          },
        },
        { returnDocument: 'after' }
      );

      emit(onEvent, 'pull:progress', job);

      if (page.nextCursor == null) {
        break;
      }
      cursor = page.nextCursor;
    }

    const completedJob = await PullJob.findByIdAndUpdate(
      jobId,
      {
        status: 'completed',
        finishedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
    emit(onEvent, 'pull:completed', completedJob);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Pull failed with unknown error';
    const failedJob = await PullJob.findByIdAndUpdate(
      jobId,
      {
        status: 'failed',
        error: message,
        finishedAt: new Date(),
      },
      { returnDocument: 'after' }
    );
    emit(onEvent, 'pull:failed', failedJob);
  } finally {
    pullRunningInMemory = false;
  }
}

export async function markStaleJobs() {
  await PullJob.updateMany(
    { status: 'running' },
    {
      status: 'failed',
      error: 'Server restarted',
      finishedAt: new Date(),
    }
  );
}

export async function startPull({ onEvent }) {
  if (pullRunningInMemory) {
    const err = new Error('A pull is already running');
    err.code = 'PULL_RUNNING';
    throw err;
  }

  const runningInDb = await PullJob.findOne({ status: 'running' });
  if (runningInDb) {
    const err = new Error('A pull is already running');
    err.code = 'PULL_RUNNING';
    throw err;
  }

  const job = await PullJob.create({
    status: 'running',
    startedAt: new Date(),
  });

  pullRunningInMemory = true;
  emit(onEvent, 'pull:started', job);

  void runPull(job._id, onEvent);

  return job.toObject();
}
