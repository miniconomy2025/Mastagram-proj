import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB_NAME;
const federationOrigin = process.env.FEDERATION_ORIGIN;

if (!redisUrl)
    throw new Error("REDIS_URL not specified.");

if (!mongoUrl)
    throw new Error("MONGO_URL not specified.");

if (!dbName)
    throw new Error("MONGO_DB_NAME not specified.");

if (!federationOrigin)
    throw new Error("FEDERATION_ORIGIN not specified.");

const config = {
    redis: {
        url: redisUrl,
    },
    mongo: {
        url: mongoUrl,
        dbName,
    },
    app: {
        port: parseInt(process.env.APP_PORT || '3500'),
        objectCacheTimeSeconds: parseInt(process.env.APP_OBJECT_CACHE_TIME_SECONDS || '300'),
    },
    federation: {
        origin: process.env.FEDERATION_ORIGIN,
    },
};

export default config;
