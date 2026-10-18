import http from 'http';
import { createApp } from './app.js';
import { config } from './config.js';
import { connectDb } from './db.js';
import { computePageDelayMs } from './routes/bse.js';
import { initSocket } from './socket.js';
import { markStaleJobs } from './services/pullWorker.js';

async function main() {
  try {
    await connectDb();
  } catch (err) {
    console.error(`MongoDB connection failed: ${err.message}`);
    process.exit(1);
  }

  await markStaleJobs();

  const pageDelayMs = computePageDelayMs();
  if (pageDelayMs > 25000) {
    console.error(
      `Refusing to start: pageDelayMs is ${pageDelayMs} ms (max 25000). ` +
        `Reduce BSE_PULL_DURATION_MS or increase page count (lower BSE_PAGE_SIZE or SEED_COUNT).`
    );
    process.exit(1);
  }

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocket(httpServer);

  httpServer.listen(config.PORT, () => {
    console.log(`Server listening on http://localhost:${config.PORT}`);
  });
}

main();
