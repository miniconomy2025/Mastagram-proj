import { MongoClient, Db } from 'mongodb';
import appConfig from './app.config';

let client: MongoClient;
let db: Db;

export async function initMongo(): Promise<void> {
  if (!client) {
    client = new MongoClient(appConfig.mongoUri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    db = client.db(process.env.MONGODB_DB_NAME);
  } else {
    // MongoDB client already initialized
  }
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error('MongoClient not initialized. Call initMongo() first.');
  } else {
    return client;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call initMongo() first.');
  } else {
    return db;
  }
}
