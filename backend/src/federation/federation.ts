import { createFederation } from "@fedify/fedify";
import { RedisKvStore, RedisMessageQueue } from "@fedify/redis";
import { Redis } from "ioredis";
import config from "../config.ts";
import { addUserDispatchers } from "./user.dispatchers.ts";
import { addPostDispatchers } from "./post.dispatchers.ts";
import { addInboxListeners } from "./inbox.listeners.ts";

const federation = createFederation({
  kv: new RedisKvStore(new Redis(config.redis.url)),
  queue: new RedisMessageQueue(() => new Redis(config.redis.url)),
});

addUserDispatchers(federation);
addPostDispatchers(federation);

addInboxListeners(federation);

export default federation;

export const PAGINATION_LIMIT = 32;
