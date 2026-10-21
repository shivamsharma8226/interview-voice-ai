import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    console.log(`[Database] MongoDB connected successfully to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected cleanly');
  } catch (error) {
    console.error('[Database] MongoDB disconnect error:', error);
  }
};
