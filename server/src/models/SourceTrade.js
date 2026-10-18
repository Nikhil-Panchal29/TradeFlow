import mongoose from 'mongoose';

const sourceTradeSchema = new mongoose.Schema(
  {
    seq: { type: Number, required: true, unique: true, index: true },
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
    timestamp: { type: Date, required: true },
  },
  { collection: 'source_trades' }
);

export const SourceTrade = mongoose.model('SourceTrade', sourceTradeSchema);
