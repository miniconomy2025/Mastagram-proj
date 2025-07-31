import { createFederation, type Federation } from "@fedify/fedify";
import { RedisKvStore, RedisMessageQueue } from "@fedify/redis";
import { addUserDispatchers } from "./user.dispatchers.ts";
import { addPostDispatchers } from "./post.dispatchers.ts";
import { addInboxListeners } from "./inbox.listeners.ts";
import redisClient from "../redis.ts";
import type { Request } from "express";

export function createContext(federation: Federation<unknown>, request: Request) {
    const url = `${request.protocol}://${request.header("Host") ?? request.hostname}`;
    return federation.createContext(new URL(url), undefined);
}

const federation = createFederation({
  kv: new RedisKvStore(redisClient),
  queue: new RedisMessageQueue(() => redisClient),
});

addUserDispatchers(federation);
addPostDispatchers(federation);

addInboxListeners(federation);

export default federation;

export const PAGINATION_LIMIT = 32;
