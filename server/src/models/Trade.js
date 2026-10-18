import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema(
  {
    tradeId: { type: String, required: true, unique: true },
    client: { type: String, required: true },
    symbol: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: 'quantity must be an integer',
      },
    },
    price: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true },
    importedAt: { type: Date, required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'PullJob', required: true },
  },
  { collection: 'trades' }
);

export const Trade = mongoose.model('Trade', tradeSchema);
