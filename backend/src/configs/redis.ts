import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisClient = createClient({ url: redisUrl });

redisClient.on('connect', () => console.log('✅Redis connected')
);
redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const initRedis = async () => {
  try {
    if (!redisClient.isOpen) await redisClient.connect();
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
};

export default redisClient;
