import mongoose from 'mongoose';
import { connectDb } from '../src/db.js';
import { startPull } from '../src/services/pullWorker.js';

function logEvent(eventName, job) {
  console.log(eventName, {
    status: job.status,
    processedRecords: job.processedRecords,
    insertedRecords: job.insertedRecords,
    duplicateRecords: job.duplicateRecords,
    batchesDone: job.batchesDone,
    batchesTotal: job.batchesTotal,
  });
}

async function main() {
  await connectDb();

  let finalJob;

  await new Promise((resolve, reject) => {
    startPull({
      onEvent: (eventName, job) => {
        logEvent(eventName, job);
        if (eventName === 'pull:completed' || eventName === 'pull:failed') {
          finalJob = job;
          resolve();
        }
      },
    }).catch(reject);
  });

  console.log('Final job:', JSON.stringify(finalJob, null, 2));
  await mongoose.disconnect();
}

main().catch((err) => {
  if (err.code === 'PULL_RUNNING') {
    console.error(err.message);
  } else {
    console.error('Pull script failed:', err.message);
  }
  process.exit(1);
});
