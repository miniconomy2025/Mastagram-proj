import { type FeedData } from "../controllers/feed.controller.ts";
import { getDb } from "./client.ts";

export class FeedQueries {
    saveFeedData = async (feedData: FeedData): Promise<void> => {
        await getDb().collection("feed").insertOne(feedData);
    }
}
