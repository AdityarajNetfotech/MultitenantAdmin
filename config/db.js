// config/db.js
import mongoose from 'mongoose';
import { config } from './index.js';

const connectDB = async () => {
  if (!config.mongoUri) throw new Error('MONGO_URI not set in environment');
  mongoose.set('strictQuery', false);
  await mongoose.connect(config.mongoUri, {
    // options are set by Mongoose defaults for v6+
  });
  console.log('MongoDB connected');
};

export default connectDB;
