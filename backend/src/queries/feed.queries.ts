import { getDb } from "../configs/mongodb.config";
import { FeedData } from "../controllers/feed.controller";

export class FeedQueries {
    saveFeedData = async (feedData: FeedData): Promise<void> => {
        await getDb().collection("feed").insertOne(feedData);
    }
}
