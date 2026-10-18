import mongoose from 'mongoose';
import { config } from '../src/config.js';
import { connectDb } from '../src/db.js';
import { SourceTrade } from '../src/models/SourceTrade.js';

const CLIENTS = [
  'Reliance Securities Pvt Ltd',
  'HDFC Securities Ltd',
  'ICICI Direct',
  'Kotak Securities Ltd',
  'Axis Direct',
  'Zerodha Broking Ltd',
  'Sharekhan Ltd',
  'Motilal Oswal Financial Services',
  'Angel One Ltd',
  'IIFL Securities Ltd',
  'Edelweiss Broking Ltd',
  'SBI Cap Securities Ltd',
];

const SYMBOLS = [
  { symbol: 'RELIANCE', basePrice: 2900 },
  { symbol: 'TCS', basePrice: 4200 },
  { symbol: 'INFY', basePrice: 1800 },
  { symbol: 'HDFCBANK', basePrice: 1650 },
  { symbol: 'ICICIBANK', basePrice: 1300 },
  { symbol: 'SBIN', basePrice: 820 },
  { symbol: 'ITC', basePrice: 460 },
  { symbol: 'LT', basePrice: 3600 },
  { symbol: 'WIPRO', basePrice: 550 },
  { symbol: 'AXISBANK', basePrice: 1150 },
  { symbol: 'MARUTI', basePrice: 12000 },
  { symbol: 'SUNPHARMA', basePrice: 1800 },
  { symbol: 'TATAMOTORS', basePrice: 980 },
  { symbol: 'BHARTIARTL', basePrice: 1550 },
  { symbol: 'KOTAKBANK', basePrice: 1800 },
];

const CHUNK_SIZE = 500;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function formatTradeId(seq) {
  return `BSE-${String(seq).padStart(6, '0')}`;
}

function pick(arr, index) {
  return arr[index % arr.length];
}

function priceWithVariation(basePrice, seq) {
  const pct = ((seq * 17) % 401) / 100 - 2;
  return Math.round(basePrice * (1 + pct / 100) * 100) / 100;
}

function timestampForSeq(seq, now) {
  const offsetMs = (seq * 7919) % SEVEN_DAYS_MS;
  return new Date(now.getTime() - offsetMs);
}

function buildTrade(seq, now) {
  const sym = pick(SYMBOLS, seq);
  return {
    seq,
    tradeId: formatTradeId(seq),
    client: pick(CLIENTS, seq * 3),
    symbol: sym.symbol,
    quantity: (seq * 13) % 5000 + 1,
    price: priceWithVariation(sym.basePrice, seq),
    timestamp: timestampForSeq(seq, now),
  };
}

async function main() {
  await connectDb();

  const deleted = await SourceTrade.deleteMany({});
  console.log(`Cleared ${deleted.deletedCount} existing source_trades`);

  const count = config.SEED_COUNT;
  const now = new Date();
  let inserted = 0;

  for (let start = 1; start <= count; start += CHUNK_SIZE) {
    const end = Math.min(start + CHUNK_SIZE - 1, count);
    const batch = [];
    for (let seq = start; seq <= end; seq += 1) {
      batch.push(buildTrade(seq, now));
    }
    await SourceTrade.insertMany(batch);
    inserted += batch.length;
  }

  console.log(`Inserted ${inserted} source_trades (seq 1..${count})`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
