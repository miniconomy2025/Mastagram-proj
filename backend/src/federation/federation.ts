import { createFederation, type Federation } from "@fedify/fedify";
import { RedisKvStore, RedisMessageQueue } from "@fedify/redis";
import { addUserDispatchers } from "./user.dispatchers.ts";
import { addPostDispatchers } from "./post.dispatchers.ts";
import { addInboxListeners } from "./inbox.listeners.ts";
import type { Request } from "express";
import redisClient from "../redis.ts";
import { Redis } from "ioredis";
import config from "../config.ts";
import logger from "../logger.ts";

export const federatedHostname = new URL(config.federation.origin ?? '').hostname;

export function createContext(federation: Federation<unknown>, request: Request) {
    return federation.createContext(new URL(config.federation.origin!), undefined);
}

logger.info`creating federation at origin: ${config.federation.origin}`;

const federation = createFederation({
  kv: new RedisKvStore(redisClient),
  queue: new RedisMessageQueue(() => new Redis(redisClient.options)),
  origin: config.federation.origin,
});

addUserDispatchers(federation);
addPostDispatchers(federation);

addInboxListeners(federation);

export default federation;

export const PAGINATION_LIMIT = 32;
