import { Object, type Context } from "@fedify/fedify";
import config from "../config.ts";
import logger from "../logger.ts";
import redisClient from "../redis.ts";

export async function cachedLookupObject<T>(ctx: Context<T>, id: string): Promise<Object | null> {
    const cacheKey = `mastagram::network_objects_cache::"${id}"`;

    const cachedObject = await redisClient.get(cacheKey);
    if (cachedObject) {
        try {
            logger.debug`object was in cache`;
            return await Object.fromJsonLd(JSON.parse(cachedObject));
        } catch {
            logger.error`failed to fetch object from cache`;
            return null;
        }
    }
    
    
    try {
        logger.debug`object was not in cache, fetching...`;
        const object = await ctx.lookupObject(id);
        logger.debug`fetched object: ${!!object}`;

        if (object) {
            logger.debug`saved object to cache`;
            await redisClient.set(cacheKey, JSON.stringify(await object.toJsonLd()), 'EX', config.app.objectCacheTimeSeconds);
        }

        return object;
    } catch {
        logger.error`failed to fetch object`;
        return null;
    }
}
