import express from 'express';
import { PullJob } from '../models/PullJob.js';
import { emitEvent } from '../socket.js';
import { startPull } from '../services/pullWorker.js';

const router = express.Router();

router.post('/', async (_req, res, next) => {
  try {
    const job = await startPull({
      onEvent: emitEvent,
    });
    res.status(202).json({
      jobId: job._id,
      status: job.status,
    });
  } catch (err) {
    if (err.code === 'PULL_RUNNING') {
      res.status(409).json({ error: 'A pull is already running' });
      return;
    }
    next(err);
  }
});

router.get('/current', async (_req, res, next) => {
  try {
    const job = await PullJob.findOne().sort({ startedAt: -1 }).lean();
    res.json(job ?? null);
  } catch (err) {
    next(err);
  }
});

export default router;
