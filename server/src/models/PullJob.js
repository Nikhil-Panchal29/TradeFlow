import mongoose from 'mongoose';

const pullJobSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['running', 'completed', 'failed'],
      required: true,
    },
    totalRecords: { type: Number, default: 0 },
    processedRecords: { type: Number, default: 0 },
    insertedRecords: { type: Number, default: 0 },
    duplicateRecords: { type: Number, default: 0 },
    batchesDone: { type: Number, default: 0 },
    batchesTotal: { type: Number, default: 0 },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    error: { type: String },
  },
  { collection: 'pulljobs' }
);

export const PullJob = mongoose.model('PullJob', pullJobSchema);
