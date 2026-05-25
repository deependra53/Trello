import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

export async function connectDB(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.MONGODB_URI, { autoIndex: env.NODE_ENV !== 'production' });
  logger.info('mongoDB connected');
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
