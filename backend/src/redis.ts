import { Redis } from "ioredis";
import config from "./config.ts";

const redisClient = new Redis(config.redis.url);

export default redisClient;
