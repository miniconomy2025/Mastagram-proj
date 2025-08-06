import { createFederation, type Federation } from "@fedify/fedify";
import { RedisKvStore, RedisMessageQueue } from "@fedify/redis";
import { addUserDispatchers } from "./user.dispatchers.ts";
import { addPostDispatchers } from "./post.dispatchers.ts";
import { addInboxListeners } from "./inbox.listeners.ts";
import type { Request } from "express";
import redisClient from "../redis.ts";
import { Redis } from "ioredis";

export function createContext(federation: Federation<unknown>, request: Request) {
    const url = `${request.protocol}://${request.header("X-Original-Host") ?? request.header("Host")}`;
    return federation.createContext(new URL(url), undefined);
}

const federation = createFederation({
  kv: new RedisKvStore(redisClient),
  queue: new RedisMessageQueue(() => new Redis(redisClient.options)),
});

addUserDispatchers(federation);
addPostDispatchers(federation);

addInboxListeners(federation);

export default federation;

export const PAGINATION_LIMIT = 32;
