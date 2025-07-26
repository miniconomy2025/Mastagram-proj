import dotenv from 'dotenv';

dotenv.config();

const appConfig = {
  port: Number(process.env.MASTAGRAM_PORT) || 3005,
  mongoUri: process.env.MASTAGRAM_MONGODB_URI ?? 'mongodb://localhost:27017/mastagram_db',
  hostname: process.env.MASTAGRAM_HOSTNAME || 'localhost',
};

export default appConfig;
