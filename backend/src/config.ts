const redisUrl = process.env.REDIS_URL;
const mongoUrl = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB_NAME;

if (!redisUrl)
    throw new Error("REDIS_URL not specified.");

if (!mongoUrl)
    throw new Error("MONGO_URL not specified.");

if (!dbName)
    throw new Error("MONGO_DB_NAME not specified.");

const config = {
    redis: {
        url: redisUrl,
    },
    mongo: {
        url: mongoUrl,
        dbName,
    },
    app: {
        port: parseInt(process.env.APP_PORT || '8000'),
        objectCacheTimeSeconds: parseInt(process.env.APP_OBJECT_CACHE_TIME_SECONDS || '300'),
    },
};

export default config;
