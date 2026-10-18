# Tapeline - Project Brief (source of truth)

## Assignment (Arham Fintech, Software Engineer)
Scenario: trade data is pulled from the BSE Exchange API. A full pull takes
up to 15 minutes; the network kills any HTTP connection held open > 30 seconds.
1. Mock BSE API: GET /getTrades returns seeded trades (a few thousand records:
   tradeId, client, symbol, quantity, price, timestamp). Configurable delay to
   pull - 15 minutes.
2. Trades Dashboard: consumes the data. Opens instantly, shows trades already
   pulled even while a pull is in progress. When a pull completes, new trades
   appear on the open dashboard automatically - NO page refresh, NO polling
   loop, NO cronjob/scheduler.
Deliverables: one Git repo with README (setup), short architecture note
(diagram + why), video walkthrough.

## Hard rules
- Live updates = Socket.IO events only. REST is for first load and reconnect.
- No setInterval, no repeating fetch, no cron/scheduler.
- No HTTP request longer than ~28s. A 15-minute pull = many short requests.
- No Docker, Redis, queues, auth, TypeScript. No extra dependencies.
- Never fake a pull. The worker is in-process, NOT a durable queue.

## Stack
React + Vite (JS), plain CSS; Node 20+ Express (ES modules); MongoDB +
Mongoose; Socket.IO.

## Collections
source_trades (mock BSE data, has seq 1..N), trades (imported, unique tradeId),
pulljobs.
Trade: tradeId "BSE-000001", client, symbol, quantity (int), price, timestamp.

## Env (server/.env)
PORT=4000, MONGODB_URI, CLIENT_ORIGIN=http://localhost:5173,
BSE_BASE_URL=http://localhost:4000, BSE_PULL_DURATION_MS=30000 (demo;
900000 = full 15 min), BSE_PAGE_SIZE=50, SEED_COUNT=3000,
REQUEST_TIMEOUT_MS=28000, BATCH_RETRY_LIMIT=3
client/.env: VITE_API_URL=http://localhost:4000

## REST
GET  /getTrades?cursor=&limit=  -> {trades, nextCursor, total, pageDelayMs}
POST /api/pulls                 -> 202 {jobId, status}; 409 if one is running
GET  /api/pulls/current         -> latest job or null
GET  /api/trades                -> {items,total,page,pageSize,totalPages}
GET  /api/stats                 -> {totalTrades, uniqueSymbols, lastPullAt}
GET  /api/health

## Socket.IO events (server -> client, payload {job})
pull:started, pull:progress (after each saved batch), pull:completed, pull:failed

## PullJob
status (running|completed|failed), totalRecords, processedRecords,
insertedRecords, duplicateRecords, batchesDone, batchesTotal, startedAt,
finishedAt, error
