import { isActor, LanguageString, Note, Object, Video, type Context } from "@fedify/fedify";
import config from "../config.ts";
import logger from "../logger.ts";
import redisClient from "../redis.ts";

const CACHE_PREFIX = 'mastagram::network_objects_cache::';

export async function cachedLookupObject<T>(ctx: Context<T>, id: string, bypassCache?: boolean) {
    const cacheKey = `${CACHE_PREFIX}${id}`;

    const cachedObject = !bypassCache && await redisClient.get(cacheKey);
    if (cachedObject) {
        try {
            logger.debug`object was in cache: ${id}`;
            return await Object.fromJsonLd(JSON.parse(cachedObject));
        } catch {
            logger.error`failed to fetch object from cache: ${id}`;
            return null;
        }
    }
    
    try {
        logger.debug`object was not in cache, fetching: ${id}`;
        const object = await ctx.lookupObject(id);
        logger.debug`fetched object: ${!!object}`;

        const allowedToCache = object && (
            isActor(object) ||
            object instanceof Note || object instanceof Document ||
            object instanceof Video || object instanceof Image
        );

        if (allowedToCache) {
            logger.debug`saved object to cache: ${id}`;
            await redisClient.set(cacheKey, JSON.stringify(await object.toJsonLd()), 'EX', config.app.objectCacheTimeSeconds);
        }

        return object;
    } catch {
        logger.error`failed to fetch object: ${id}`;
        return null;
    }
}

export async function invalidateCache(id: string) {
    const cacheKey = `${CACHE_PREFIX}${id}`;

    let object = undefined;
    try {
        const cachedObject = await redisClient.get(cacheKey);
        object = cachedObject && await Object.fromJsonLd(JSON.parse(cachedObject))
    } catch {}

    // if object is an actor, ensure both the cache by handle and by ID are removed
    if (isActor(object) && object.preferredUsername && object.id) {
        if (object.preferredUsername instanceof LanguageString) {
            
        }
        const handle = `@${object.preferredUsername}@${object.id.host}`;
        await redisClient.del(`${CACHE_PREFIX}${handle}`);
        await redisClient.del(`${CACHE_PREFIX}${object.id.href}`);
    }

    await redisClient.del(cacheKey);

    return object || null;
}
