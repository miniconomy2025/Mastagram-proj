import { MongoClient, type Document } from "mongodb";
import config from "../config.ts";

const client = new MongoClient(config.mongo.url);

export default client;

export function getDb() {
    return client.db(config.mongo.dbName);
};

export function getCollection<T extends Document>(name: string) {
    return getDb().collection<T>(name);
}
