import mongoose from 'mongoose';
import { config } from './config.js';

export async function connectDb() {
  await mongoose.connect(config.MONGODB_URI);
  console.log('MongoDB connected');
}
